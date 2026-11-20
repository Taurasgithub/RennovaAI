import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { useAdminData } from '../../admin/useAdminData';
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

  return (
    <AdminScreen refreshControl={<RefreshControl refreshing={false} onRefresh={data.reload} tintColor={admin.primary} colors={[admin.primary]} />}>
      <AdminHeader kicker={t('role.admin')} title={t('admin.vendorsTitle')} sub={t('admin.vendorsSubtitle')} />
      <Segmented items={FILTERS.map((f) => ({ id: f.id, label: t(f.label), count: count(f.id), tone: f.tone }))} value={filter} onChange={setFilter} />
      {!!data.error && <Txt style={[adminText.sub, { color: admin.danger, marginTop: spacing.sm }]}>{data.error}</Txt>}

      {data.loading ? (
        <SkeletonList rows={3} />
      ) : list.length === 0 ? (
        <EmptyPanel icon="shield-checkmark-outline" title={t('admin.noApplications')} body={t('admin.noApplicationsBody')} />
      ) : (
        <View>
          {list.map((v, i) => (
            // Cards leaving this filter (approved, rejected…) slide away; the list closes the gap.
            <Animated.View key={`${filter}-${v.user_id}`} entering={enter(i)} exiting={FadeOutLeft.duration(260)} layout={LinearTransition.springify().damping(18)}>
              <VendorCard v={v} data={data} />
            </Animated.View>
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

function VendorCard({ v, data }: { v: VendorProfile; data: ReturnType<typeof useAdminData> }) {
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
  const email = data.profiles.find((p) => p.id === v.user_id)?.email;
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
            <AdminButton title={t('admin.confirmReject')} variant="solid" tone="danger" size="sm" loading={busy === 'reject'} style={{ flex: 1 }} onPress={() => act('reject', () => data.rejectVendor(v.user_id, note))} />
          </View>
        </Animated.View>
      ) : (
        <View style={[styles.row, { marginTop: spacing.md, flexWrap: 'wrap', gap: spacing.sm }]}>
          {v.status !== 'approved' && <AdminButton title={t('admin.approve')} icon="checkmark" size="sm" loading={busy === 'approve'} disabled={!!busy} style={styles.action} onPress={() => act('approve', () => data.approveVendor(v.user_id))} />}
          {v.status === 'pending' && v.verification_step < 4 && (
            <AdminButton title={t('admin.nextStep')} icon="play-forward-outline" variant="soft" tone="attention" size="sm" loading={busy === 'next'} disabled={!!busy} style={styles.action} onPress={() => act('next', () => data.advanceVendor(v))} />
          )}
          {v.status !== 'rejected' && <AdminButton title={t('admin.reject')} icon="close" variant="outline" tone="danger" size="sm" disabled={!!busy} style={styles.action} onPress={() => setRejecting(true)} />}
          {v.status !== 'pending' && <AdminButton title={t('admin.reopen')} icon="refresh" variant="outline" tone="neutral" size="sm" loading={busy === 'reopen'} disabled={!!busy} style={styles.action} onPress={() => act('reopen', () => data.reopenVendor(v.user_id))} />}
        </View>
      )}
    </Panel>
  );
}

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
