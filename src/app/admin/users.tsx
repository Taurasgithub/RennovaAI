import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useAdminData } from '../../admin/useAdminData';
import { ROLE_LABEL, ROLE_TONE } from '../../components/AccountPanel';
import { Avatar } from '../../components/Avatar';
import { Badge, Button, Card, Chip, EmptyState, Row, Screen, T, tap } from '../../components/ui';
import { budgetLabel, cityLabel, styleLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import type { Profile, Role } from '../../lib/supabase';
import { colors, fonts, radius, spacing } from '../../theme';

type Filter = Role | 'suspended' | 'all';
const FILTERS: { id: Filter; label: TKey }[] = [
  { id: 'all', label: 'admin.fAll' },
  { id: 'customer', label: 'admin.fCustomers' },
  { id: 'vendor', label: 'admin.fVendors' },
  { id: 'admin', label: 'admin.fAdmins' },
  { id: 'suspended', label: 'admin.fSuspended' },
];
const ROLES: Role[] = ['customer', 'vendor', 'admin'];

export default function AdminUsers() {
  const { t } = useT();
  const data = useAdminData();
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const list = data.profiles
    .filter((p) => filter === 'all' || (filter === 'suspended' ? p.status === 'suspended' : p.role === filter))
    .filter((p) => !query || `${p.full_name} ${p.email} ${p.phone}`.toLowerCase().includes(query));

  return (
    <Screen back={false} title={t('admin.usersTitle')} subtitle={t('admin.usersSubtitle', { n: data.profiles.length })}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textSubtle} />
        <TextInput value={q} onChangeText={setQ} placeholder={t('admin.searchUsers')} placeholderTextColor={colors.textSubtle} style={styles.searchInput} autoCapitalize="none" />
      </View>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
        {FILTERS.map((f) => <Chip key={f.id} label={t(f.label)} selected={filter === f.id} onPress={() => setFilter(f.id)} />)}
      </Row>
      {!!data.error && <T variant="small" style={{ color: colors.danger, marginTop: spacing.sm }}>{data.error}</T>}

      {data.loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxl }} />
      ) : list.length === 0 ? (
        <EmptyState icon="people-outline" title={t('admin.noUsers')} body={t('vendors.emptyBody')} />
      ) : (
        <Card style={{ marginTop: spacing.md, paddingVertical: spacing.xs }}>
          {list.map((p, i) => (
            <UserRow key={p.id} p={p} first={i === 0} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} data={data} />
          ))}
        </Card>
      )}
    </Screen>
  );
}

function UserRow({ p, first, open, onToggle, data }: { p: Profile; first: boolean; open: boolean; onToggle: () => void; data: ReturnType<typeof useAdminData> }) {
  const { t } = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isMe = p.id === data.me?.id;
  const act = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    await fn();
    setBusy(false);
  };

  return (
    <View style={[{ paddingVertical: spacing.md }, !first && styles.divider]}>
      <Pressable
        onPress={() => {
          tap();
          onToggle();
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Row>
          <Avatar uri={p.avatar_url} name={p.full_name || p.email} size={40} round bg={p.role === 'admin' ? colors.navy : p.role === 'vendor' ? colors.amberDark : colors.teal} />
          <View style={{ flex: 1 }}>
            <T variant="bodyStrong" numberOfLines={1}>{p.full_name || t('admin.noName')}{isMe ? ` · ${t('admin.you')}` : ''}</T>
            <T variant="caption" numberOfLines={1}>{p.email}{p.phone ? ` · ${p.phone}` : ''}</T>
          </View>
          {p.status === 'suspended' && <Badge label={t('admin.suspended')} tone="gray" icon="ban" />}
          <Badge label={t(ROLE_LABEL[p.role]).toUpperCase()} tone={ROLE_TONE[p.role]} />
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSubtle} />
        </Row>
      </Pressable>

      {open && (
        <View style={styles.panel}>
          <T variant="caption">{t('admin.joined', { date: dateLabel(p.created_at), city: cityLabel(p.city) })}</T>
          {/* Personal profile */}
          {!!p.job_title && <T variant="small" style={{ marginTop: spacing.sm, color: colors.text }}>{p.job_title}</T>}
          {!!p.bio && <T variant="small" style={{ marginTop: spacing.sm, color: colors.text }}>{p.bio}</T>}
          {p.role === 'customer' && (
            <View style={{ marginTop: spacing.sm, gap: 4 }}>
              {!!p.area && <T variant="caption">{t('edit.area')}: {p.area}</T>}
              <T variant="caption">{t('edit.styles')}: {p.preferred_styles.length ? p.preferred_styles.map(styleLabel).join(', ') : t('edit.notSet')}</T>
              <T variant="caption">{t('edit.budget')}: {p.budget_range ? budgetLabel(p.budget_range) : t('edit.notSet')}</T>
            </View>
          )}
          {p.role === 'vendor' && data.vendors.some((v) => v.user_id === p.id) && (
            <Button
              title={t('admin.viewBusiness')}
              kind="ghost"
              small
              iconRight="chevron-forward"
              style={{ alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: 4 }}
              onPress={() => router.push({ pathname: '/vendor/[id]', params: { id: p.id, preview: '1' } })}
            />
          )}
          {isMe ? (
            <T variant="small" style={{ marginTop: spacing.sm }}>{t('admin.selfNote')}</T>
          ) : (
            <>
              <T variant="bodyStrong" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>{t('admin.role')}</T>
              <Row style={{ flexWrap: 'wrap' }} gap={6}>
                {ROLES.map((r) => (
                  <Chip key={r} label={t(ROLE_LABEL[r])} selected={p.role === r} onPress={() => p.role !== r && !busy && act(() => data.setRole(p.id, r))} />
                ))}
              </Row>
              <Button
                title={t(p.status === 'suspended' ? 'admin.reactivate' : 'admin.suspend')}
                kind={p.status === 'suspended' ? 'primary' : 'danger'}
                icon={p.status === 'suspended' ? 'checkmark-circle-outline' : 'ban'}
                small
                loading={busy}
                style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
                onPress={() => act(() => data.setStatus(p.id, p.status === 'suspended' ? 'active' : 'suspended'))}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 48, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  searchInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 14.5, color: colors.text },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  panel: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.bg },
});
