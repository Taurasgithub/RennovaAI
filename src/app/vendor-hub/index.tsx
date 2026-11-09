import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { Band, HouseAvatar, Marker, Sparkle } from '../../components/brand';
import { Button, Card, Row, Section, T, Txt } from '../../components/ui';
import { cityLabel, serviceLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import { colors, fonts, spacing } from '../../theme';

const STEPS: TKey[] = ['signup.step1', 'signup.step2', 'signup.step3', 'signup.step4'];

/** Vendor dashboard: application / verification status, and (once approved) where customer bookings will appear. */
export default function VendorDashboard() {
  const { t } = useT();
  const router = useRouter();
  const { profile, vendor, refresh } = useAuth();
  // Re-read the application whenever the dashboard is opened, so an admin's decision shows up.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const first = (profile?.full_name ?? '').split(' ')[0];
  const approved = vendor?.status === 'approved';
  const status = vendor ? t(approved ? 'vendorHub.approved' : vendor.status === 'rejected' ? 'vendorHub.rejected' : 'common.inReview') : '';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <Band color={colors.navy} floor={colors.teal}>
        <Row gap={spacing.md}>
          <HouseAvatar uri={vendor?.logo_url ?? profile?.avatar_url} name={vendor?.business_name || profile?.full_name || 'R'} size={46} bg={colors.amber} color={colors.navy} />
          <View style={{ flex: 1 }}>
            <Txt style={styles.kicker}>{t('vendorHub.title')}</Txt>
            <Row gap={6}>
              <T numberOfLines={1} style={styles.business}>{vendor?.business_name || first || t('home.there')}</T>
              {approved && (
                <View style={styles.verified}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
              )}
            </Row>
          </View>
        </Row>
        {vendor ? (
          <View style={{ marginTop: spacing.xl }}>
            <T style={{ color: colors.navyMuted }}>{t('home.greeting')} {first}</T>
            <T style={styles.headline}>{status}</T>
            <T variant="small" style={{ color: colors.navyMuted, marginTop: 4 }}>
              {vendor.services.map(serviceLabel).join(' · ')} · {cityLabel(vendor.city)}
            </T>
          </View>
        ) : (
          <View style={{ marginTop: spacing.xl }}>
            <T style={styles.headline}>{t('vendorHub.startTitle')}</T>
            <T variant="small" style={{ color: colors.navyMuted, marginTop: 4 }}>{t('vendorHub.startBody')}</T>
            <Pressable onPress={() => router.push('/vendor-signup')} accessibilityRole="button" style={styles.start}>
              <Sparkle size={18} color={colors.navy} />
              <Txt style={{ fontFamily: fonts.bold, fontSize: 15, color: colors.navy }}>{t('vendorHub.startCta')}</Txt>
            </Pressable>
          </View>
        )}
      </Band>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {vendor && (
          <Section title={t('signup.progress')}>
            <Card>
              <View style={styles.steps}>
                {STEPS.map((key, i) => {
                  const done = approved || i < vendor.verification_step - 1;
                  const current = !approved && i === vendor.verification_step - 1;
                  return (
                    <View key={key} style={{ flex: 1, alignItems: 'center' }}>
                      {i < STEPS.length - 1 && <View style={[styles.connector, done && { backgroundColor: colors.teal }]} />}
                      <Marker state={done ? 'done' : current ? 'now' : 'next'} label={i + 1} size={30} />
                      <T variant="caption" numberOfLines={2} style={{ marginTop: 6, textAlign: 'center', color: colors.text, fontFamily: fonts.semibold }}>{t(key)}</T>
                    </View>
                  );
                })}
              </View>
              <T variant="caption" style={{ marginTop: spacing.md }}>{t('signup.submitted', { date: dateLabel(vendor.submitted_at), city: cityLabel(vendor.city) })}</T>
              {vendor.status === 'rejected' && <T variant="small" style={{ marginTop: spacing.sm, color: colors.alert }}>{vendor.review_note || t('vendorHub.rejectedBody')}</T>}
              <Button title={t('vendorHub.viewApplication')} kind="secondary" small iconRight="chevron-forward" style={{ marginTop: spacing.md }} onPress={() => router.push('/vendor-signup')} />
            </Card>
          </Section>
        )}

        <Section title={t('vendorHub.leads')}>
          <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <View style={styles.emptyIcon}>
              <Ionicons name="file-tray-outline" size={28} color={colors.tealDark} />
            </View>
            <T variant="bodyStrong" style={{ marginTop: spacing.md, textAlign: 'center', color: colors.navy }}>{t('vendorHub.leadsEmpty')}</T>
            <T variant="small" style={{ textAlign: 'center', marginTop: 4 }}>{t(approved ? 'vendorHub.leadsApproved' : 'vendorHub.leadsPending')}</T>
          </Card>
        </Section>

        <Card style={{ marginTop: spacing.lg, backgroundColor: colors.amberTint, borderColor: colors.amberTint }}>
          <Row gap={spacing.sm}>
            <Sparkle size={18} />
            <T variant="h3" style={{ fontFamily: fonts.extrabold, color: colors.navy }}>{t('signup.offer')}</T>
          </Row>
          <T variant="small" style={{ marginTop: 6, color: colors.text }}>{t('signup.offerBody')}</T>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kicker: { fontFamily: fonts.bold, fontSize: 12, color: colors.teal },
  business: { fontFamily: fonts.extrabold, fontSize: 19, lineHeight: 25, color: colors.white, letterSpacing: -0.3, flexShrink: 1 },
  verified: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  headline: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: colors.white, letterSpacing: -0.6, marginTop: 2 },
  start: { marginTop: spacing.lg, height: 50, borderRadius: 12, backgroundColor: colors.amber, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  steps: { flexDirection: 'row' },
  connector: { position: 'absolute', top: 14, left: '50%', right: '-50%', height: 2, backgroundColor: colors.line },
  emptyIcon: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.tealTint, alignItems: 'center', justifyContent: 'center' },
});
