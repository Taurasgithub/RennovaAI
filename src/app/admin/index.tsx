import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAdminData } from '../../admin/useAdminData';
import { ROLE_LABEL } from '../../components/AccountPanel';
import { AdminTitle, HouseAvatar, ROLE_COLOR, Sparkle, Swatch } from '../../components/brand';
import { Button, Card, Row, Screen, Section, T } from '../../components/ui';
import { cityLabel, serviceLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import { colors, fonts, spacing } from '../../theme';

export default function AdminOverview() {
  const { t } = useT();
  const router = useRouter();
  const { profiles, vendors, loading, error, approveVendor } = useAdminData();
  const pending = vendors.filter((v) => v.status === 'pending');

  const stats: { label: TKey; value: number; hot?: boolean }[] = [
    { label: 'admin.statUsers', value: profiles.length },
    { label: 'admin.statPending', value: pending.length, hot: pending.length > 0 },
    { label: 'admin.statCustomers', value: profiles.filter((p) => p.role === 'customer').length },
    { label: 'admin.statVendors', value: profiles.filter((p) => p.role === 'vendor').length },
    { label: 'admin.statApproved', value: vendors.filter((v) => v.status === 'approved').length },
    { label: 'admin.statSuspended', value: profiles.filter((p) => p.status === 'suspended').length },
  ];

  return (
    <Screen back={false} bg={colors.mist}>
      <AdminTitle kicker={t('role.admin')} title={t('admin.title')} sub={t('admin.subtitle')} />
      {!!error && <T variant="small" style={{ color: colors.alert, marginTop: spacing.sm }}>{error}</T>}
      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxl }} />
      ) : (
        <>
          <View style={styles.grid}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.stat, s.hot && styles.statHot]}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T variant="small" style={{ color: s.hot ? colors.navy : colors.textMuted, fontFamily: fonts.bold }}>{t(s.label)}</T>
                  {s.hot && <Sparkle size={14} color={colors.navy} />}
                </Row>
                <T style={styles.statValue}>{s.value}</T>
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
                  <Row style={{ alignItems: 'flex-start' }} gap={spacing.md}>
                    <HouseAvatar uri={v.logo_url} name={v.business_name} size={40} bg={colors.teal} />
                    <View style={{ flex: 1 }}>
                      <T variant="h3" style={{ fontFamily: fonts.extrabold, color: colors.navy }}>{v.business_name}</T>
                      <T variant="small">{v.owner_name} · {cityLabel(v.city)}</T>
                      <T variant="caption">{v.services.map(serviceLabel).join(' · ')}</T>
                    </View>
                    <T variant="caption" style={{ color: colors.amberDark, fontFamily: fonts.bold }}>{t('admin.stepOf', { n: v.verification_step })}</T>
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
                <Row key={p.id} style={[{ paddingVertical: spacing.sm }, i > 0 && styles.divider]} gap={spacing.md}>
                  <HouseAvatar uri={p.avatar_url} name={p.full_name || p.email} size={36} bg={ROLE_COLOR[p.role]} color={p.role === 'vendor' ? colors.navy : colors.white} />
                  <View style={{ flex: 1 }}>
                    <T variant="bodyStrong" numberOfLines={1} style={{ color: colors.navy }}>{p.full_name || p.email}</T>
                    <T variant="caption" numberOfLines={1}>{p.email} · {dateLabel(p.created_at)}</T>
                  </View>
                  <Swatch color={ROLE_COLOR[p.role]} label={t(ROLE_LABEL[p.role])} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  stat: { flexGrow: 1, flexBasis: 150, backgroundColor: colors.white, borderRadius: 14, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.line, gap: 6 },
  statHot: { backgroundColor: colors.amber, borderColor: colors.amber },
  statValue: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: colors.navy, letterSpacing: -0.6 },
  divider: { borderTopWidth: 1, borderColor: colors.line },
});
