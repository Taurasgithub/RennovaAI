import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { useAdminData } from '../../admin/useAdminData';
import { AdminTitle, HouseAvatar, Marker, TabStrip, WindowGrid } from '../../components/brand';
import { Badge, Button, Card, EmptyState, Row, Screen, T } from '../../components/ui';
import { cityLabel, serviceLabel, useT, type TKey } from '../../i18n';
import { dateLabel } from '../../lib/format';
import type { VendorProfile, VendorStatus } from '../../lib/supabase';
import { colors, fonts, radius, spacing } from '../../theme';

type Filter = VendorStatus | 'all';
const FILTERS: { id: Filter; label: TKey }[] = [
  { id: 'pending', label: 'admin.fPending' },
  { id: 'approved', label: 'admin.fApproved' },
  { id: 'rejected', label: 'admin.fRejected' },
  { id: 'all', label: 'admin.fAll' },
];

const STEP_KEYS: TKey[] = ['signup.step1', 'signup.step2', 'signup.step3', 'signup.step4'];

export default function AdminVendors() {
  const { t } = useT();
  const data = useAdminData();
  const [filter, setFilter] = useState<Filter>('pending');
  const list = data.vendors.filter((v) => filter === 'all' || v.status === filter);
  const count = (f: Filter) => data.vendors.filter((v) => f === 'all' || v.status === f).length;

  return (
    <Screen back={false} bg={colors.mist}>
      <AdminTitle kicker={t('role.admin')} title={t('admin.vendorsTitle')} sub={t('admin.vendorsSubtitle')} />
      <TabStrip items={FILTERS.map((f) => ({ id: f.id, label: `${t(f.label)} (${count(f.id)})` }))} value={filter} onChange={setFilter} />
      {!!data.error && <T variant="small" style={{ color: colors.alert, marginTop: spacing.sm }}>{data.error}</T>}

      {data.loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxl }} />
      ) : list.length === 0 ? (
        <EmptyState icon="shield-checkmark-outline" title={t('admin.noApplications')} body={t('admin.noApplicationsBody')} />
      ) : (
        list.map((v) => <VendorCard key={v.user_id} v={v} data={data} />)
      )}
    </Screen>
  );
}

function VendorCard({ v, data }: { v: VendorProfile; data: ReturnType<typeof useAdminData> }) {
  const { t } = useT();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const act = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    await fn();
    setBusy(false);
    setRejecting(false);
  };
  const email = data.profiles.find((p) => p.id === v.user_id)?.email;

  return (
    <Card style={{ marginTop: spacing.md }}>
      <Row style={{ alignItems: 'flex-start' }} gap={spacing.md}>
        <HouseAvatar uri={v.logo_url} name={v.business_name} size={44} bg={colors.teal} />
        <View style={{ flex: 1 }}>
          <T variant="h3" style={{ fontFamily: fonts.extrabold, color: colors.navy }}>{v.business_name}</T>
          <T variant="small">{v.owner_name} · {v.phone}{email ? ` · ${email}` : ''}</T>
        </View>
        <Badge
          label={t(v.status === 'approved' ? 'vendorHub.approved' : v.status === 'rejected' ? 'vendorHub.rejected' : 'common.inReview')}
          tone={v.status === 'approved' ? 'green' : v.status === 'rejected' ? 'gray' : 'amber'}
        />
      </Row>

      <Row style={{ flexWrap: 'wrap', marginTop: spacing.sm }} gap={6}>
        <Badge label={cityLabel(v.city).toUpperCase()} tone="navy" icon="location-outline" />
        {v.services.map((s) => <Badge key={s} label={serviceLabel(s).toUpperCase()} tone="teal" />)}
        {v.years_experience != null && <Badge label={t('admin.years', { n: v.years_experience })} tone="gray" />}
      </Row>
      {!!v.about && <T variant="small" style={{ marginTop: spacing.sm, color: colors.text }}>{v.about}</T>}
      <T variant="caption" style={{ marginTop: spacing.sm }}>{t('admin.submitted', { date: dateLabel(v.submitted_at) })}</T>

      {/* Verification checklist */}
      <View style={styles.steps}>
        {STEP_KEYS.map((k, i) => {
          const done = v.status === 'approved' || i < v.verification_step - 1;
          const current = v.status !== 'approved' && i === v.verification_step - 1;
          return (
            <Row key={k} gap={spacing.sm} style={{ marginTop: i ? spacing.sm : 0 }}>
              <Marker state={done ? 'done' : current ? 'now' : 'next'} label={i + 1} size={22} />
              <T variant="small" style={{ color: colors.text, fontFamily: current ? fonts.bold : fonts.medium }}>{t(k)}</T>
            </Row>
          );
        })}
      </View>
      {v.portfolio_urls.length > 0 && <WindowGrid images={v.portfolio_urls} height={150} bar={5} style={{ marginTop: spacing.md }} />}
      {v.status === 'rejected' && !!v.review_note && <T variant="small" style={{ marginTop: spacing.sm }}>{t('admin.note', { note: v.review_note })}</T>}

      {rejecting ? (
        <View style={{ marginTop: spacing.md }}>
          <TextInput value={note} onChangeText={setNote} placeholder={t('admin.rejectPh')} placeholderTextColor={colors.textSubtle} multiline style={styles.note} />
          <Row style={{ marginTop: spacing.sm }} gap={spacing.sm}>
            <Button title={t('common.cancel')} kind="secondary" small style={{ flex: 1 }} onPress={() => setRejecting(false)} />
            <Button title={t('admin.confirmReject')} kind="danger" small loading={busy} style={{ flex: 1 }} onPress={() => act(() => data.rejectVendor(v.user_id, note))} />
          </Row>
        </View>
      ) : (
        <Row style={{ marginTop: spacing.md, flexWrap: 'wrap' }} gap={spacing.sm}>
          {v.status === 'pending' && v.verification_step < 4 && (
            <Button title={t('admin.nextStep')} kind="secondary" icon="play-forward-outline" small disabled={busy} style={styles.action} onPress={() => act(() => data.advanceVendor(v))} />
          )}
          {v.status !== 'approved' && <Button title={t('admin.approve')} icon="checkmark" small disabled={busy} style={styles.action} onPress={() => act(() => data.approveVendor(v.user_id))} />}
          {v.status !== 'rejected' && <Button title={t('admin.reject')} kind="danger" icon="close" small disabled={busy} style={styles.action} onPress={() => setRejecting(true)} />}
          {v.status !== 'pending' && <Button title={t('admin.reopen')} kind="secondary" icon="refresh" small disabled={busy} style={styles.action} onPress={() => act(() => data.reopenVendor(v.user_id))} />}
        </Row>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  steps: { marginTop: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.mist },
  note: { minHeight: 70, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: spacing.md, fontFamily: fonts.medium, color: colors.text, textAlignVertical: 'top' },
  action: { flexGrow: 1, flexBasis: 120 },
});
