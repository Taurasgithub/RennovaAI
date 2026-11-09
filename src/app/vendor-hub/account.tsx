import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { AccountPanel } from '../../components/AccountPanel';
import { ProfileHeader } from '../../components/ProfileHeader';
import { Badge, Button, Card, IconTile, Row, Screen, Section, T } from '../../components/ui';
import { cityLabel, serviceLabel, useT } from '../../i18n';
import { colors, spacing } from '../../theme';

/** Vendor's own profile: the business as customers see it, plus account settings. */
export default function VendorProfileTab() {
  const { t } = useT();
  const router = useRouter();
  const { profile, vendor } = useAuth();
  if (!profile) return null;

  const details: { icon: 'map-outline' | 'time-outline' | 'logo-whatsapp'; label: string; value: string }[] = vendor
    ? [
        { icon: 'map-outline', label: t('vendor.areas'), value: vendor.service_areas.join(' · ') },
        { icon: 'time-outline', label: t('vendor.hours'), value: vendor.working_hours },
        { icon: 'logo-whatsapp', label: t('edit.whatsapp'), value: vendor.whatsapp },
      ]
    : [];

  return (
    <Screen back={false}>
      <ProfileHeader
        name={vendor?.business_name || profile.full_name}
        avatarUri={vendor?.logo_url ?? profile.avatar_url}
        coverUri={vendor?.cover_url}
        roleLabel={t('role.vendor')}
        roleTone="amber"
        lines={[vendor ? vendor.services.map(serviceLabel).join(' · ') : '', `${profile.full_name} · ${cityLabel(vendor?.city ?? profile.city)}`]}
        bio={vendor?.about || profile.bio}
        editLabel={t('edit.title')}
        onEdit={() => router.push('/profile-edit')}
        extra={
          vendor && (
            <Row style={{ marginTop: spacing.md, flexWrap: 'wrap' }} gap={6}>
              <Badge
                label={t(vendor.status === 'approved' ? 'vendorHub.approved' : vendor.status === 'rejected' ? 'vendorHub.rejected' : 'common.inReview')}
                tone={vendor.status === 'approved' ? 'green' : vendor.status === 'rejected' ? 'gray' : 'amber'}
                icon={vendor.status === 'approved' ? 'shield-checkmark' : undefined}
              />
              <Badge label={t('edit.photosCount', { n: vendor.portfolio_urls.length })} tone="navy" icon="images-outline" />
            </Row>
          )
        }
      />

      {vendor ? (
        <>
          <Button
            title={t('edit.preview')}
            kind="secondary"
            icon="eye-outline"
            style={{ marginTop: spacing.md }}
            onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: vendor.user_id, preview: '1' } })}
          />
          <Section title={t('edit.business')}>
            <Card style={{ gap: spacing.md }}>
              {details.map((d) => (
                <Row key={d.label} style={{ alignItems: 'flex-start' }}>
                  <IconTile icon={d.icon} size={36} />
                  <View style={{ flex: 1 }}>
                    <T variant="caption">{d.label}</T>
                    <T variant="bodyStrong">{d.value || t('edit.notSet')}</T>
                  </View>
                </Row>
              ))}
            </Card>
          </Section>
        </>
      ) : (
        <Card style={{ marginTop: spacing.lg, backgroundColor: colors.amberTint, borderColor: colors.amberTint }}>
          <T variant="bodyStrong">{t('vendorHub.startTitle')}</T>
          <T variant="small" style={{ marginTop: 4 }}>{t('vendorHub.startBody')}</T>
          <Button title={t('vendorHub.startCta')} small style={{ marginTop: spacing.md, alignSelf: 'flex-start' }} onPress={() => router.push('/vendor-signup')} />
        </Card>
      )}

      <AccountPanel />
    </Screen>
  );
}
