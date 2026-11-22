import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Platform, RefreshControl, StyleSheet, TextInput, View, type ListRenderItem } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminData, type AdminActions } from '../../admin/useAdminData';
import { AdminButton, AdminScreen, AdminHeader, adminText, EmptyPanel, Panel, Pill, Segmented, SkeletonList } from '../../components/admin/kit';
import { HouseAvatar, WindowGrid } from '../../components/brand';
import { enter } from '../../components/motion';
import { Txt } from '../../components/ui';
import { cityLabel, serviceLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import type { VendorProfile, VendorStatus } from '../../lib/supabase';
import { admin, type AdminTone } from '../../theme/admin';
import { fonts, spacing } from '../../theme';

type Filter = VendorStatus | 'all';
const FILTERS: { id: Filter; label: TKey; tone: AdminTone }[] = [
  { id: 'pending', label: 'admin.fPending', tone: 'attention' },
  { id: 'approved', label: 'admin.fApproved', tone: 'primary' },
  { id: 'rejected', label: 'admin.fRejected', tone: 'danger' },
  { id: 'all', label: 'admin.fAll', tone: 'neutral' },
];

const STEP_KEYS: TKey[] = ['signup.step1', 'signup.step2', 'signup.step3', 'signup.step4'];
const STATUS: Record<VendorStatus, { label: TKey; tone: AdminTone }> = {
  pending: { label: 'common.inReview', tone: 'attention' },
  approved: { label: 'vendorHub.approved', tone: 'primary' },
  rejected: { label: 'vendorHub.rejected', tone: 'danger' },
};

export default function AdminVendors() {
  const { t } = useT();
  const data = useAdminData();
  const [filter, setFilter] = useState<Filter>('pending');
  const list = data.vendors.filter((v) => filter === 'all' || v.status === filter);
  const count = (f: Filter) => data.vendors.filter((v) => f === 'all' || v.status === f).length;

  const insets = useSafeAreaInsets();
  const emails = new Map(data.profiles.map((p) => [p.id, p.email]));
  const renderItem: ListRenderItem<VendorProfile> = ({ item: v, index }) => (
    // Cards leaving this filter (approved, rejected…) slide away; the list closes the gap.
    <Animated.View entering={enter(Math.min(index, 6))} exiting={FadeOutLeft.duration(260)}>
      <VendorCard v={v} email={emails.get(v.user_id)} actions={data.actions} />
    </Animated.View>
  );

  return (
    <AdminScreen scroll={false} padded={false}>
      {/* Virtualized list (only on-screen cards render); Reanimated's FlatList keeps the slide-away animation. */}
      <Animated.FlatList
        data={data.loading ? [] : list}
        keyExtractor={(v) => `${filter}-${v.user_id}`}
        renderItem={renderItem}
        itemLayoutAnimation={LinearTransition.springify().damping(18)}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={data.reload} tintColor={admin.primary} colors={[admin.primary]} />}
        ListHeaderComponent={
          <View>
            <AdminHeader kicker={t('role.admin')} title={t('admin.vendorsTitle')} sub={t('admin.vendorsSubtitle')} />
            <Segmented items={FILTERS.map((f) => ({ id: f.id, label: t(f.label), count: count(f.id), tone: f.tone }))} value={filter} onChange={setFilter} />
            {!!data.error && <Txt style={[adminText.sub, { color: admin.danger, marginTop: spacing.sm }]}>{data.error}</Txt>}
          </View>
        }
        ListEmptyComponent={data.loading ? <SkeletonList rows={3} /> : <EmptyPanel icon="shield-checkmark-outline" title={t('admin.noApplications')} body={t('admin.noApplicationsBody')} />}
      />
    </AdminScreen>
  );
}

/** Memoized: a card re-renders only when its application changes. */
const VendorCard = memo(function VendorCard({ v, email, actions }: { v: VendorProfile; email?: string; actions: AdminActions }) {
  const { t } = useT();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (key: string, fn: () => Promise<boolean>) => {
    setBusy(key);
    await fn();
    setBusy(null);
    setRejecting(false);
  };
  const status = STATUS[v.status];

  return (
    <Panel variant={v.status === 'pending' ? 'attention' : 'default'} style={{ marginTop: spacing.md }}>
      <View style={styles.row}>
        <HouseAvatar uri={v.logo_url} name={v.business_name} size={46} bg={admin.primary} color={admin.primaryForeground} />
        <View style={{ flex: 1 }}>
          <Txt style={adminText.title} numberOfLines={1}>{v.business_name}</Txt>
          <Txt style={adminText.sub} numberOfLines={2}>{v.owner_name} · {v.phone}{email ? ` · ${email}` : ''}</Txt>
        </View>
        <Pill label={t(status.label)} tone={status.tone} dot />
      </View>

      <View style={[styles.row, { flexWrap: 'wrap', gap: 6, marginTop: spacing.md }]}>
        <Pill label={cityLabel(v.city)} icon="location-outline" />
        {v.services.map((s) => <Pill key={s} label={serviceLabel(s)} tone="primary" />)}
        {v.years_experience != null && <Pill label={t('admin.years', { n: v.years_experience })} />}
      </View>
      {!!v.about && <Txt style={[adminText.body, { marginTop: spacing.md }]}>{v.about}</Txt>}
      <Txt style={[adminText.caption, { marginTop: spacing.sm }]}>{t('admin.submitted', { date: dateLabel(v.submitted_at) })}</Txt>

      {/* Verification progress: a 4-step track */}
      <View style={styles.steps}>
        <View style={styles.track}>
          {STEP_KEYS.map((k, i) => {
            const done = v.status === 'approved' || i < v.verification_step - 1;
            const current = v.status !== 'approved' && i === v.verification_step - 1;
            return <View key={k} style={[styles.trackPart, done && { backgroundColor: admin.primary }, current && { backgroundColor: admin.attention }]} />;
          })}
        </View>
        {STEP_KEYS.map((k, i) => {
          const done = v.status === 'approved' || i < v.verification_step - 1;
          const current = v.status !== 'approved' && i === v.verification_step - 1;
          return (
            <View key={k} style={[styles.row, { marginTop: spacing.sm, gap: spacing.sm }]}>
              <View style={[styles.stepDot, done && styles.stepDone, current && styles.stepNow]}>
                {done ? <Ionicons name="checkmark" size={13} color={admin.primaryForeground} /> : <Txt style={[styles.stepNum, current && { color: admin.attentionForeground }]}>{i + 1}</Txt>}
              </View>
              <Txt style={[adminText.sub, (done || current) && { color: admin.foreground }, current && { fontFamily: fonts.bold }]}>{t(k)}</Txt>
            </View>
          );
        })}
      </View>

      {v.portfolio_urls.length > 0 && <WindowGrid images={v.portfolio_urls} height={150} bar={5} style={{ marginTop: spacing.md }} />}
      {v.status === 'rejected' && !!v.review_note && <Txt style={[adminText.sub, { marginTop: spacing.md, color: admin.danger }]}>{t('admin.note', { note: v.review_note })}</Txt>}

      {rejecting ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ marginTop: spacing.md }}>
          <TextInput value={note} onChangeText={setNote} placeholder={t('admin.rejectPh')} placeholderTextColor={admin.subtle} selectionColor={admin.primary} multiline style={styles.note} />
          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <AdminButton title={t('common.cancel')} variant="outline" tone="neutral" size="sm" style={{ flex: 1 }} onPress={() => setRejecting(false)} />
            <AdminButton title={t('admin.confirmReject')} variant="solid" tone="danger" size="sm" loading={busy === 'reject'} style={{ flex: 1 }} onPress={() => act('reject', () => actions.rejectVendor(v.user_id, note))} />
          </View>
        </Animated.View>
      ) : (
        <View style={[styles.row, { marginTop: spacing.md, flexWrap: 'wrap', gap: spacing.sm }]}>
          {v.status !== 'approved' && <AdminButton title={t('admin.approve')} icon="checkmark" size="sm" loading={busy === 'approve'} disabled={!!busy} style={styles.action} onPress={() => act('approve', () => actions.approveVendor(v.user_id))} />}
          {v.status === 'pending' && v.verification_step < 4 && (
            <AdminButton title={t('admin.nextStep')} icon="play-forward-outline" variant="soft" tone="attention" size="sm" loading={busy === 'next'} disabled={!!busy} style={styles.action} onPress={() => act('next', () => actions.advanceVendor(v))} />
          )}
          {v.status !== 'rejected' && <AdminButton title={t('admin.reject')} icon="close" variant="outline" tone="danger" size="sm" disabled={!!busy} style={styles.action} onPress={() => setRejecting(true)} />}
          {v.status !== 'pending' && <AdminButton title={t('admin.reopen')} icon="refresh" variant="outline" tone="neutral" size="sm" loading={busy === 'reopen'} disabled={!!busy} style={styles.action} onPress={() => act('reopen', () => actions.reopenVendor(v.user_id))} />}
        </View>
      )}
    </Panel>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  steps: { marginTop: spacing.lg, padding: spacing.md, borderRadius: 14, backgroundColor: admin.cardRaised },
  track: { flexDirection: 'row', gap: 4, marginBottom: spacing.xs },
  trackPart: { flex: 1, height: 4, borderRadius: 2, backgroundColor: admin.border },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: admin.edge },
  stepDone: { backgroundColor: admin.primary, borderColor: admin.primary },
  stepNow: { backgroundColor: admin.attention, borderColor: admin.attention },
  stepNum: { fontFamily: fonts.bold, fontSize: 11.5, color: admin.muted },
  note: { minHeight: 80, borderRadius: 13, borderWidth: 1.5, borderColor: admin.border, backgroundColor: admin.cardRaised, padding: spacing.md, fontFamily: fonts.medium, fontSize: 14, color: admin.foreground, textAlignVertical: 'top' },
  action: { flexGrow: 1, flexBasis: 130 },
});
