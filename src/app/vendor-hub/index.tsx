import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { Avatar } from '../../components/Avatar';
import { Badge, Button, Card, IconTile, Row, Screen, Section, T } from '../../components/ui';
import { cityLabel, serviceLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import { colors, spacing } from '../../theme';

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

  return (
    <Screen back={false} title={t('vendorHub.title')} subtitle={vendor?.business_name}>
      <Row style={{ marginTop: spacing.sm }} gap={spacing.md}>
        <Avatar uri={vendor?.logo_url ?? profile?.avatar_url} name={vendor?.business_name || profile?.full_name || 'R'} size={52} round />
        <View style={{ flex: 1 }}>
          <T variant="small">{t('home.greeting')}</T>
          <T variant="h1" numberOfLines={1}>{first || t('home.there')}</T>
        </View>
      </Row>

      {!vendor ? (
        <Card style={{ marginTop: spacing.lg, backgroundColor: colors.navy }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <IconTile icon="briefcase" bg="rgba(10,180,154,0.2)" color={colors.teal} />
            <View style={{ flex: 1 }}>
              <T variant="h3" style={{ color: colors.white }}>{t('vendorHub.startTitle')}</T>
              <T variant="small" style={{ color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{t('vendorHub.startBody')}</T>
            </View>
          </Row>
          <Button title={t('vendorHub.startCta')} kind="amber" icon="create-outline" style={{ marginTop: spacing.lg }} onPress={() => router.push('/vendor-signup')} />
        </Card>
      ) : (
        <>
          <Card style={{ marginTop: spacing.lg }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <T variant="overline">{t('vendorHub.status')}</T>
              <Badge
                label={t(vendor.status === 'approved' ? 'vendorHub.approved' : vendor.status === 'rejected' ? 'vendorHub.rejected' : 'common.inReview')}
                tone={vendor.status === 'approved' ? 'green' : vendor.status === 'rejected' ? 'gray' : 'amber'}
                icon={vendor.status === 'approved' ? 'shield-checkmark' : undefined}
              />
            </Row>
            <T variant="h2" style={{ marginTop: spacing.sm }}>{vendor.business_name}</T>
            <T variant="small">
              {vendor.services.map(serviceLabel).join(' · ')} · {cityLabel(vendor.city)}
            </T>
            <T variant="caption" style={{ marginTop: 4 }}>{t('signup.submitted', { date: dateLabel(vendor.submitted_at), city: cityLabel(vendor.city) })}</T>
            {vendor.status === 'rejected' && <T variant="small" style={{ marginTop: spacing.md, color: colors.text }}>{vendor.review_note || t('vendorHub.rejectedBody')}</T>}
            <Button title={t('vendorHub.viewApplication')} kind="ghost" small iconRight="chevron-forward" style={{ alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: spacing.sm }} onPress={() => router.push('/vendor-signup')} />
          </Card>

          <Section title={t('signup.progress')}>
            <Card>
              {STEPS.map((key, i) => {
                const approved = vendor.status === 'approved';
                const done = approved || i < vendor.verification_step - 1;
                const current = !approved && i === vendor.verification_step - 1;
                return (
                  <Row key={key} style={{ marginTop: i ? spacing.md : 0 }}>
                    <Ionicons name={done ? 'checkmark-circle' : current ? 'time' : 'ellipse-outline'} size={22} color={done ? colors.success : current ? colors.amber : colors.textSubtle} />
                    <T variant="bodyStrong" style={{ flex: 1 }}>{t(key)}</T>
                  </Row>
                );
              })}
            </Card>
          </Section>
        </>
      )}

      <Section title={t('vendorHub.leads')}>
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <IconTile icon="people-outline" size={52} />
          <T variant="bodyStrong" style={{ marginTop: spacing.md, textAlign: 'center' }}>{t('vendorHub.leadsEmpty')}</T>
          <T variant="small" style={{ textAlign: 'center', marginTop: 4 }}>{t(vendor?.status === 'approved' ? 'vendorHub.leadsApproved' : 'vendorHub.leadsPending')}</T>
        </Card>
      </Section>

      <Card style={{ marginTop: spacing.lg, backgroundColor: colors.amberSoft }}>
        <T variant="h3">{t('signup.offer')}</T>
        <T variant="small" style={{ marginTop: 4 }}>{t('signup.offerBody')}</T>
      </Card>
    </Screen>
  );
}
