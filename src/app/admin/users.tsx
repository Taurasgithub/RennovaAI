import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAdminData } from '../../admin/useAdminData';
import { AdminButton, AdminScreen, AdminHeader, adminText, EmptyPanel, Panel, Pill, SearchField, Segmented, SkeletonList } from '../../components/admin/kit';
import { ROLE_LABEL } from '../../components/AccountPanel';
import { HouseAvatar } from '../../components/brand';
import { Tappable } from '../../components/motion';
import { tap, Txt } from '../../components/ui';
import { budgetLabel, cityLabel, styleLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import type { Profile, Role } from '../../lib/supabase';
import { admin, type AdminTone } from '../../theme/admin';
import { fonts, spacing } from '../../theme';

type Filter = Role | 'suspended' | 'all';
const FILTERS: { id: Filter; label: TKey; tone: AdminTone }[] = [
  { id: 'all', label: 'admin.fAll', tone: 'neutral' },
  { id: 'customer', label: 'admin.fCustomers', tone: 'primary' },
  { id: 'vendor', label: 'admin.fVendors', tone: 'attention' },
  { id: 'admin', label: 'admin.fAdmins', tone: 'neutral' },
  { id: 'suspended', label: 'admin.fSuspended', tone: 'danger' },
];
const ROLES: Role[] = ['customer', 'vendor', 'admin'];
const ROLE_TONE: Record<Role, AdminTone> = { customer: 'primary', vendor: 'attention', admin: 'neutral' };
const ROLE_FILL: Record<Role, string> = { customer: admin.primary, vendor: admin.attention, admin: admin.edge };

export default function AdminUsers() {
  const { t } = useT();
  const data = useAdminData();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const matches = (p: Profile, f: Filter) => f === 'all' || (f === 'suspended' ? p.status === 'suspended' : p.role === f);
  const query = q.trim().toLowerCase();
  const list = data.profiles.filter((p) => matches(p, filter)).filter((p) => !query || `${p.full_name} ${p.email} ${p.phone}`.toLowerCase().includes(query));

  return (
    <AdminScreen refreshControl={<RefreshControl refreshing={false} onRefresh={data.reload} tintColor={admin.primary} colors={[admin.primary]} />}>
      <AdminHeader kicker={t('role.admin')} title={t('admin.usersTitle')} sub={t('admin.usersSubtitle', { n: data.profiles.length })} />
      <SearchField value={q} onChangeText={setQ} placeholder={t('admin.searchUsers')} />
      <RoleMix profiles={data.profiles} />
      <Segmented items={FILTERS.map((f) => ({ id: f.id, label: t(f.label), count: data.profiles.filter((p) => matches(p, f.id)).length, tone: f.tone }))} value={filter} onChange={setFilter} />
      {!!data.error && <Txt style={[adminText.sub, { color: admin.danger, marginTop: spacing.sm }]}>{data.error}</Txt>}

      {data.loading ? (
        <SkeletonList rows={5} />
      ) : list.length === 0 ? (
        <EmptyPanel icon="people-outline" title={t('admin.noUsers')} />
      ) : (
        <Panel style={{ marginTop: spacing.md, paddingVertical: spacing.xs }}>
          {list.map((p, i) => (
            <Animated.View key={p.id} layout={LinearTransition.springify().damping(20)}>
              <UserRow p={p} first={i === 0} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} data={data} />
            </Animated.View>
          ))}
        </Panel>
      )}
    </AdminScreen>
  );
}

function UserRow({ p, first, open, onToggle, data }: { p: Profile; first: boolean; open: boolean; onToggle: () => void; data: ReturnType<typeof useAdminData> }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const isMe = p.id === data.me?.id;
  const suspended = p.status === 'suspended';
  const act = async (key: string, fn: () => Promise<boolean>) => {
    setBusy(key);
    await fn();
    setBusy(null);
  };
  // The chevron turns as the row opens.
  const turn = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    turn.set(withSpring(open ? 1 : 0, { damping: 16, stiffness: 220, reduceMotion: ReduceMotion.System }));
  }, [open, turn]);
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));

  return (
    <View style={[styles.rowWrap, !first && styles.divider]}>
      {suspended && <View style={styles.suspendedBar} />}
      <Tappable scale={0.985} onPress={() => { tap(); onToggle(); }} accessibilityRole="button" aria-expanded={open} style={styles.row}>
        <HouseAvatar uri={p.avatar_url} name={p.full_name || p.email} size={42} bg={ROLE_FILL[p.role]} color={p.role === 'customer' ? admin.primaryForeground : p.role === 'vendor' ? admin.attentionForeground : admin.foreground} />
        <View style={{ flex: 1 }}>
          <Txt style={[adminText.title, suspended && { color: admin.muted }]} numberOfLines={1}>
            {p.full_name || t('admin.noName')}
            {isMe ? <Txt style={{ color: admin.primaryText }}>{`  · ${t('admin.you')}`}</Txt> : null}
          </Txt>
          <Txt style={adminText.caption} numberOfLines={1}>{p.email}{p.phone ? ` · ${p.phone}` : ''}</Txt>
          <View style={[styles.row, { gap: 6, marginTop: 6 }]}>
            <Pill label={t(ROLE_LABEL[p.role])} tone={ROLE_TONE[p.role]} />
            {suspended && <Pill label={t('admin.suspended')} tone="danger" icon="ban" />}
          </View>
        </View>
        <Animated.View style={chevron}>
          <Ionicons name="chevron-down" size={18} color={admin.subtle} />
        </Animated.View>
      </Tappable>

      {open && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.panel}>
          <Txt style={adminText.caption}>{t('admin.joined', { date: dateLabel(p.created_at), city: cityLabel(p.city) })}</Txt>
          {!!p.job_title && <Txt style={[adminText.body, { marginTop: spacing.sm, color: admin.foreground }]}>{p.job_title}</Txt>}
          {!!p.bio && <Txt style={[adminText.body, { marginTop: spacing.sm }]}>{p.bio}</Txt>}
          {p.role === 'customer' && (
            <View style={{ marginTop: spacing.sm, gap: 4 }}>
              {!!p.area && <Txt style={adminText.caption}>{t('edit.area')}: {p.area}</Txt>}
              <Txt style={adminText.caption}>{t('edit.styles')}: {p.preferred_styles.length ? p.preferred_styles.map(styleLabel).join(', ') : t('edit.notSet')}</Txt>
              <Txt style={adminText.caption}>{t('edit.budget')}: {p.budget_range ? budgetLabel(p.budget_range) : t('edit.notSet')}</Txt>
            </View>
          )}
          {p.role === 'vendor' && data.vendors.some((v) => v.user_id === p.id) && (
            <AdminButton title={t('admin.viewBusiness')} icon="storefront-outline" variant="ghost" size="sm" style={{ alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: spacing.xs }} onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: p.id, preview: '1' } })} />
          )}
          {isMe ? (
            <Txt style={[adminText.sub, { marginTop: spacing.md }]}>{t('admin.selfNote')}</Txt>
          ) : (
            <>
              <Txt style={styles.label}>{t('admin.role')}</Txt>
              <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
                {ROLES.map((r) => (
                  <AdminButton
                    key={r}
                    title={t(ROLE_LABEL[r])}
                    size="sm"
                    variant={p.role === r ? 'solid' : 'outline'}
                    tone={p.role === r ? 'primary' : 'neutral'}
                    loading={busy === r}
                    onPress={() => p.role !== r && !busy && act(r, () => data.setRole(p.id, r))}
                  />
                ))}
              </View>
              <AdminButton
                title={t(suspended ? 'admin.reactivate' : 'admin.suspend')}
                icon={suspended ? 'checkmark-circle-outline' : 'ban'}
                variant={suspended ? 'solid' : 'outline'}
                tone={suspended ? 'primary' : 'danger'}
                size="sm"
                loading={busy === 'status'}
                style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
                onPress={() => act('status', () => data.setStatus(p.id, suspended ? 'active' : 'suspended'))}
              />
            </>
          )}
        </Animated.View>
      )}
    </View>
  );
}

/** Share of customers / vendors / admins: one segmented bar that grows in. */
function RoleMix({ profiles }: { profiles: Profile[] }) {
  const { t } = useT();
  const total = Math.max(profiles.length, 1);
  const parts = ROLES.map((r) => ({ r, n: profiles.filter((p) => p.role === r).length })).filter((x) => x.n > 0);
  const grow = useSharedValue(0);
  useEffect(() => {
    if (profiles.length) grow.set(withSpring(1, { damping: 20, stiffness: 90, reduceMotion: ReduceMotion.System }));
  }, [profiles.length, grow]);
  const bar = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }], transformOrigin: 'left' }));
  if (!profiles.length) return null;
  return (
    <Panel style={{ marginTop: spacing.md }}>
      <Animated.View style={[styles.mixBar, bar]}>
        {parts.map((x) => <View key={x.r} style={{ flex: x.n, backgroundColor: ROLE_FILL[x.r] }} />)}
      </Animated.View>
      <View style={[styles.row, { flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.lg }]}>
        {parts.map((x) => (
          <View key={x.r} style={[styles.row, { gap: 8 }]}>
            <View style={[styles.swatch, { backgroundColor: ROLE_FILL[x.r] }]} />
            <Txt style={adminText.sub}>
              {t(ROLE_LABEL[x.r])} <Txt style={{ color: admin.foreground, fontFamily: fonts.bold }}>{Math.round((x.n / total) * 100)}%</Txt>
            </Txt>
          </View>
        ))}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowWrap: { paddingVertical: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: admin.border },
  suspendedBar: { position: 'absolute', left: -spacing.lg, top: spacing.md, bottom: spacing.md, width: 3, borderRadius: 2, backgroundColor: admin.danger },
  panel: { marginTop: spacing.md, padding: spacing.md, borderRadius: 14, backgroundColor: admin.cardRaised },
  label: { fontFamily: fonts.bold, fontSize: 13, color: admin.foreground, marginTop: spacing.md, marginBottom: spacing.sm },
  mixBar: { flexDirection: 'row', height: 10, gap: 3, borderRadius: 5, overflow: 'hidden' },
  swatch: { width: 10, height: 10, borderRadius: 3 },
});
