import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { useAdminData } from '../../admin/useAdminData';
import { useAuth } from '../../auth/AuthProvider';
import { AdminButton, AdminScreen, AdminHeader, adminText, EmptyPanel, Panel, Pill, SectionLabel, SkeletonList, StatTile } from '../../components/admin/kit';
import { ROLE_LABEL } from '../../components/AccountPanel';
import { HouseAvatar } from '../../components/brand';
import { enter } from '../../components/motion';
import { Txt } from '../../components/ui';
import { cityLabel, serviceLabel, useT } from '../../i18n';
import { dateLabel } from '../../lib/format';
import { admin } from '../../theme/admin';
import { spacing } from '../../theme';

const ROLE_AVATAR = { customer: admin.primary, vendor: admin.attention, admin: admin.edge } as const;

export default function AdminOverview() {
  const { t } = useT();
  const router = useRouter();
  const { profile } = useAuth();
  const { profiles, vendors, loading, error, approveVendor, reload } = useAdminData();
  const pending = vendors.filter((v) => v.status === 'pending');
  const first = (profile?.full_name || '').split(' ')[0];

  return (
    <AdminScreen refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={admin.primary} colors={[admin.primary]} />}>
      <AdminHeader
        kicker={t('role.admin')}
        title={first ? t('admin.greeting', { name: first }) : t('admin.title')}
        sub={pending.length ? t('admin.needsReview', { n: pending.length }) : t('admin.allClear')}
      />
      {!!error && <Txt style={[adminText.sub, { color: admin.danger, marginTop: spacing.sm }]}>{error}</Txt>}

      {loading ? (
        <SkeletonList rows={4} />
      ) : (
        <View>
          <View style={styles.grid}>
            <StatTile label={t('admin.statPending')} value={pending.length} icon="hourglass-outline" tone="attention" hint={pending.length ? t('admin.tapToReview') : undefined} onPress={() => router.navigate('/admin/vendors')} />
            <StatTile label={t('admin.statUsers')} value={profiles.length} icon="people-outline" tone="primary" onPress={() => router.navigate('/admin/users')} />
            <StatTile label={t('admin.statCustomers')} value={profiles.filter((p) => p.role === 'customer').length} icon="home-outline" tone="primary" />
            <StatTile label={t('admin.statVendors')} value={profiles.filter((p) => p.role === 'vendor').length} icon="construct-outline" tone="neutral" />
            <StatTile label={t('admin.statApproved')} value={vendors.filter((v) => v.status === 'approved').length} icon="shield-checkmark-outline" tone="primary" />
            <StatTile label={t('admin.statSuspended')} value={profiles.filter((p) => p.status === 'suspended').length} icon="ban-outline" tone="danger" />
          </View>

          <SectionLabel title={t('admin.pendingTitle')} action={pending.length ? t('home.seeAll') : undefined} onAction={() => router.navigate('/admin/vendors')} />
          {pending.length === 0 ? (
            <EmptyPanel icon="checkmark-done-outline" title={t('admin.pendingNone')} />
          ) : (
            pending.slice(0, 3).map((v, i) => (
              // Approved applications slide out and the rest close the gap.
              <Animated.View key={v.user_id} entering={enter(i)} exiting={FadeOutLeft.duration(260)} layout={LinearTransition.springify().damping(18)} style={{ marginBottom: spacing.md }}>
                <Panel variant="attention">
                  <View style={styles.row}>
                    <HouseAvatar uri={v.logo_url} name={v.business_name} size={44} bg={admin.primary} color={admin.primaryForeground} />
                    <View style={{ flex: 1 }}>
                      <Txt style={adminText.title} numberOfLines={1}>{v.business_name}</Txt>
                      <Txt style={adminText.sub} numberOfLines={1}>{v.owner_name} · {cityLabel(v.city)}</Txt>
                      <Txt style={adminText.caption} numberOfLines={1}>{v.services.map(serviceLabel).join(' · ')}</Txt>
                    </View>
                    <Pill label={t('admin.stepOf', { n: v.verification_step })} tone="attention" dot />
                  </View>
                  <View style={[styles.row, { marginTop: spacing.md }]}>
                    <AdminButton title={t('admin.review')} variant="outline" tone="neutral" size="sm" style={{ flex: 1 }} onPress={() => router.navigate('/admin/vendors')} />
                    <AdminButton title={t('admin.approve')} icon="checkmark" size="sm" style={{ flex: 1 }} onPress={() => approveVendor(v.user_id)} />
                  </View>
                </Panel>
              </Animated.View>
            ))
          )}

          <SectionLabel title={t('admin.recentTitle')} action={t('home.seeAll')} onAction={() => router.navigate('/admin/users')} />
          <Panel style={{ paddingVertical: spacing.xs }}>
            {profiles.slice(0, 6).map((p, i) => (
              <View key={p.id} style={[styles.row, styles.listRow, i > 0 && styles.divider]}>
                <HouseAvatar uri={p.avatar_url} name={p.full_name || p.email} size={38} bg={ROLE_AVATAR[p.role]} color={p.role === 'admin' ? admin.foreground : p.role === 'vendor' ? admin.attentionForeground : admin.primaryForeground} />
                <View style={{ flex: 1 }}>
                  <Txt style={adminText.title} numberOfLines={1}>{p.full_name || p.email}</Txt>
                  <Txt style={adminText.caption} numberOfLines={1}>{p.email} · {dateLabel(p.created_at)}</Txt>
                </View>
                <Pill label={t(ROLE_LABEL[p.role])} tone={p.role === 'customer' ? 'primary' : p.role === 'vendor' ? 'attention' : 'neutral'} />
              </View>
            ))}
            {profiles.length === 0 && <Txt style={[adminText.sub, { paddingVertical: spacing.md }]}>{t('admin.noUsers')}</Txt>}
          </Panel>
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  listRow: { paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: admin.border },
});
