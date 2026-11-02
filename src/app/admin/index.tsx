import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAdminData } from '../../admin/useAdminData';
import { ROLE_LABEL, ROLE_TONE } from '../../components/AccountPanel';
import { Avatar } from '../../components/Avatar';
import { Badge, Button, Card, Row, Screen, Section, T, type IconName } from '../../components/ui';
import { cityLabel, serviceLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import { colors, fonts, radius, spacing } from '../../theme';

export default function AdminOverview() {
  const { t } = useT();
  const router = useRouter();
  const { profiles, vendors, loading, error, approveVendor } = useAdminData();
  const pending = vendors.filter((v) => v.status === 'pending');

  const stats: { label: TKey; value: number; icon: IconName; tint: string }[] = [
    { label: 'admin.statUsers', value: profiles.length, icon: 'people', tint: colors.navy },
    { label: 'admin.statCustomers', value: profiles.filter((p) => p.role === 'customer').length, icon: 'home', tint: colors.teal },
    { label: 'admin.statVendors', value: profiles.filter((p) => p.role === 'vendor').length, icon: 'construct', tint: colors.amberDark },
    { label: 'admin.statPending', value: pending.length, icon: 'hourglass', tint: colors.amber },
    { label: 'admin.statApproved', value: vendors.filter((v) => v.status === 'approved').length, icon: 'shield-checkmark', tint: colors.success },
    { label: 'admin.statSuspended', value: profiles.filter((p) => p.status === 'suspended').length, icon: 'ban', tint: colors.danger },
  ];

  return (
    <Screen back={false} title={t('admin.title')} subtitle={t('admin.subtitle')}>
      {!!error && <T variant="small" style={{ color: colors.danger, marginTop: spacing.sm }}>{error}</T>}
      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxl }} />
      ) : (
        <>
          <View style={styles.grid}>
            {stats.map((s) => (
              <View key={s.label} style={styles.stat}>
                <Ionicons name={s.icon} size={20} color={s.tint} />
                <T style={styles.statValue}>{s.value}</T>
                <T variant="caption">{t(s.label)}</T>
              </View>
            ))}
          </View>

          <Section title={t('admin.pendingTitle')} action={pending.length ? t('home.seeAll') : undefined} onAction={() => router.navigate('/admin/vendors')}>
            {pending.length === 0 ? (
              <Card>
                <T variant="small">{t('admin.pendingNone')}</T>
              </Card>
            ) : (
              pending.slice(0, 3).map((v) => (
                <Card key={v.user_id} style={{ marginBottom: spacing.sm }}>
                  <Row style={{ alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <T variant="h3">{v.business_name}</T>
                      <T variant="small">{v.owner_name} · {cityLabel(v.city)}</T>
                      <T variant="caption">{v.services.map(serviceLabel).join(' · ')}</T>
                    </View>
                    <Badge label={t('admin.stepOf', { n: v.verification_step })} tone="amber" />
                  </Row>
                  <Row style={{ marginTop: spacing.md }} gap={spacing.sm}>
                    <Button title={t('admin.review')} kind="secondary" small style={{ flex: 1 }} onPress={() => router.navigate('/admin/vendors')} />
                    <Button title={t('admin.approve')} icon="checkmark" small style={{ flex: 1 }} onPress={() => approveVendor(v.user_id)} />
                  </Row>
                </Card>
              ))
            )}
          </Section>

          <Section title={t('admin.recentTitle')} action={t('home.seeAll')} onAction={() => router.navigate('/admin/users')}>
            <Card style={{ paddingVertical: spacing.sm }}>
              {profiles.slice(0, 6).map((p, i) => (
                <Row key={p.id} style={[{ paddingVertical: spacing.sm }, i > 0 && styles.divider]}>
                  <Avatar uri={p.avatar_url} name={p.full_name || p.email} size={36} round />
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong" numberOfLines={1}>{p.full_name || p.email}</T>
                    <T variant="caption" numberOfLines={1}>{p.email} · {dateLabel(p.created_at)}</T>
                  </View>
                  <Badge label={t(ROLE_LABEL[p.role]).toUpperCase()} tone={ROLE_TONE[p.role]} />
                </Row>
              ))}
              {profiles.length === 0 && <T variant="small" style={{ paddingVertical: spacing.sm }}>{t('admin.noUsers')}</T>}
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  stat: { flexGrow: 1, flexBasis: 150, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 2 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.navy, marginTop: 4 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
