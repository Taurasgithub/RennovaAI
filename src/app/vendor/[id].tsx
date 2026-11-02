import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { RoomIllustration } from '../../components/RoomIllustration';
import { VendorAvatar, VendorCover } from '../../components/VendorCard';
import { Badge, Button, Card, Divider, EmptyState, IconTile, Row, Screen, Section, Stars, T } from '../../components/ui';
import { SERVICE_ICONS } from '../../data/catalog';
import { useMarketplace, vendorFromProfile } from '../../data/marketplace';
import { VENDORS, type Vendor } from '../../data/vendors';
import { availabilityLabel, cityLabel, designName, ratingLabel, responseLabel, serviceLabel, useT, type TKey } from '../../i18n';
import { roundTo } from '../../lib/format';
import { accountsEnabled, supabase, type VendorProfile } from '../../lib/supabase';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const CHECKS: TKey[] = ['vendor.check1', 'vendor.check2', 'vendor.check3', 'vendor.check4'];

/** Sample listing, approved vendor account, or (for a vendor previewing themselves) their own unapproved profile. */
function useVendor(id: string | undefined) {
  const listed = useMarketplace((s) => s.accountVendors.find((v) => v.id === id)) ?? VENDORS.find((v) => v.id === id);
  const [fetched, setFetched] = useState<Vendor | null | undefined>(listed ? null : undefined);
  useEffect(() => {
    if (listed || !id || !accountsEnabled()) return setFetched(null);
    supabase
      .from('vendor_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle<VendorProfile>()
      .then(({ data }) => setFetched(data ? vendorFromProfile(data) : null));
  }, [id, listed]);
  return { vendor: listed ?? fetched ?? undefined, loading: fetched === undefined };
}

export default function VendorProfileScreen() {
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const router = useRouter();
  const { t } = useT();
  const { vendor, loading } = useVendor(id);
  const latest = useApp((s) => s.designs[0]);
  const resetDraft = useApp((s) => s.resetDraft);
  const isPreview = preview === '1';

  if (loading) return <Screen title=""><ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxxl }} /></Screen>;
  if (!vendor) return <Screen title={t('vendor.title')}><EmptyState icon="alert-circle-outline" title={t('vendor.notFound')} body={t('vendor.gone')} /></Screen>;

  const acc = vendor.account;
  const quote = () => {
    if (latest) {
      router.push({
        pathname: '/book/[vendorId]',
        params: {
          vendorId: vendor.id,
          designId: latest.id,
          price: String(roundTo(latest.estimate.mid * vendor.priceFactor, 1000)),
          days: String(Math.max(2, Math.round(latest.estimate.days * vendor.speedFactor))),
        },
      });
    } else {
      resetDraft();
      router.push('/design/capture');
    }
  };

  const footer = isPreview ? undefined : (
    <Button title={latest ? t('vendor.quoteFor', { name: designName(latest) }) : t('vendor.designFirst')} icon="document-text-outline" onPress={quote} />
  );

  return (
    <Screen padded={false} title="" footer={footer}>
      {isPreview && (
        <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.amberSoft }}>
          <Row>
            <Ionicons name="eye-outline" size={20} color={colors.amberDark} />
            <T variant="small" style={{ flex: 1, color: colors.text }}>{t('vendor.previewNote')}</T>
          </Row>
        </Card>
      )}
      <View style={{ height: 170, marginHorizontal: spacing.lg, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.border }}>
        <VendorCover vendor={vendor} />
      </View>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Row style={{ marginTop: -28, alignItems: 'flex-end', paddingHorizontal: spacing.md }} gap={spacing.md}>
          <View style={{ borderWidth: 4, borderColor: colors.bg, borderRadius: 24 }}>
            <VendorAvatar vendor={vendor} size={68} />
          </View>
          {vendor.pro && <Badge label={t('vendor.featuredPro')} tone="amber" icon="star" />}
          {acc && vendor.reviewCount === 0 && <Badge label={t('vendor.newBadge')} tone="teal" icon="sparkles" />}
        </Row>
        <T variant="h1" style={{ marginTop: spacing.md }}>{vendor.name}</T>
        <T variant="small">{vendor.owner} · {vendor.area ? `${vendor.area}, ` : ''}{cityLabel(vendor.city)}</T>

        <Row style={{ marginTop: spacing.lg }} gap={spacing.sm}>
          {[
            [ratingLabel(vendor), t('vendor.reviewsCount', { n: vendor.reviewCount }), 'star'],
            [String(vendor.jobsCompleted), t('vendor.jobsDone'), 'briefcase'],
            [t('vendor.yrs', { n: vendor.yearsExperience }), t('vendor.experience'), 'ribbon'],
          ].map(([v, l, icon]) => (
            <Card key={l} style={styles.stat}>
              <Ionicons name={icon as 'star'} size={16} color={colors.amber} />
              <T variant="h3" style={{ color: colors.navy, fontFamily: fonts.bold }}>{v}</T>
              <T variant="caption">{l}</T>
            </Card>
          ))}
        </Row>

        <Section title={t('vendor.about')}>
          <T>{vendor.about || t('vendor.noAbout')}</T>
          <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
            {vendor.services.map((s) => <Badge key={s} label={serviceLabel(s).toUpperCase()} tone="teal" icon={SERVICE_ICONS[s]} />)}
            <Badge label={t('common.availableUpper', { when: availabilityLabel(vendor.availableFrom).toUpperCase() })} tone="green" icon="calendar-outline" />
            <Badge label={t('common.repliesUpper', { time: responseLabel(vendor.responseTime).toUpperCase() })} tone="gray" icon="chatbubble-outline" />
          </Row>
        </Section>

        {acc && (acc.serviceAreas.length > 0 || !!acc.workingHours || !!acc.whatsapp) && (
          <Card style={{ marginTop: spacing.lg, gap: spacing.md }}>
            {acc.serviceAreas.length > 0 && (
              <Row style={{ alignItems: 'flex-start' }}>
                <IconTile icon="map-outline" size={36} />
                <View style={{ flex: 1 }}>
                  <T variant="caption">{t('vendor.areas')}</T>
                  <T variant="bodyStrong">{acc.serviceAreas.join(' · ')}</T>
                </View>
              </Row>
            )}
            {!!acc.workingHours && (
              <Row style={{ alignItems: 'flex-start' }}>
                <IconTile icon="time-outline" size={36} />
                <View style={{ flex: 1 }}>
                  <T variant="caption">{t('vendor.hours')}</T>
                  <T variant="bodyStrong">{acc.workingHours}</T>
                </View>
              </Row>
            )}
            {!!acc.whatsapp && !isPreview && (
              <Button
                title={t('vendor.whatsapp')}
                icon="logo-whatsapp"
                kind="secondary"
                small
                style={{ alignSelf: 'flex-start' }}
                onPress={() => Linking.openURL(`https://wa.me/${acc.whatsapp.replace(/\D/g, '').replace(/^0/, '92')}`).catch(() => {})}
              />
            )}
          </Card>
        )}
      </View>

      <Section title={t('vendor.portfolio')} style={{ paddingHorizontal: spacing.lg }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {acc
          ? acc.photos.map((uri) => (
              <View key={uri} style={styles.photo}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
              </View>
            ))
          : vendor.portfolio.map((p) => (
              <View key={p.title} style={{ width: 220 }}>
                <View style={{ height: 140, borderRadius: radius.md, overflow: 'hidden' }}>
                  <RoomIllustration {...p} />
                </View>
                <T variant="bodyStrong" style={{ marginTop: 6 }}>{p.title}</T>
              </View>
            ))}
      </ScrollView>
      {acc && acc.photos.length === 0 && <T variant="small" style={{ paddingHorizontal: spacing.lg }}>{t('vendor.noPhotos')}</T>}

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Section title={t('vendor.verification')}>
          <Card>
            {CHECKS.map((c, i) => (
              <Row key={c} style={{ marginTop: i ? spacing.md : 0 }}>
                <Ionicons name={vendor.verified ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={vendor.verified ? colors.teal : colors.textSubtle} />
                <T variant="bodyStrong">{t(c)}</T>
              </Row>
            ))}
          </Card>
        </Section>

        <Section title={t('vendor.reviews')}>
          <Card>
            {vendor.reviews.length === 0 && <T variant="small">{t('vendor.noReviews')}</T>}
            {vendor.reviews.map((r, i) => (
              <View key={r.name + i}>
                {i > 0 && <Divider />}
                <Row style={{ justifyContent: 'space-between' }}>
                  <T variant="bodyStrong">{r.name}</T>
                  <T variant="caption">{r.date}</T>
                </Row>
                <View style={{ marginTop: 4 }}><Stars value={r.rating} size={13} /></View>
                <T variant="small" style={{ marginTop: 6, color: colors.text }}>{r.text}</T>
              </View>
            ))}
          </Card>
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, gap: 2 },
  photo: { width: 220, height: 150, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.border },
});
