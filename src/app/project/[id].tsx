import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, TextInput, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { BookingBadge } from '../../components/BookingBadge';
import { Celebrate } from '../../components/Celebrate';
import { HouseBar, Marker } from '../../components/brand';
import { DesignCompare } from '../../components/DesignPreview';
import { Button, Card, EmptyState, IconButton, Row, Screen, Section, Stars, T } from '../../components/ui';
import { config } from '../../config';
import { availabilityLabel, milestoneTitle, projectTitle, useT } from '../../i18n';
import { confirmAction, notify } from '../../lib/dialogs';
import { dateLabel, pkr } from '../../lib/format';
import { nextStage, useBookings, type Booking, type Stage } from '../../services/bookings';
import { colors, fonts, radius, spacing } from '../../theme';

/** One booking, seen by its customer or its vendor. */
export default function ProjectScreen() {
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const router = useRouter();
  const { t } = useT();
  const { session } = useAuth();
  const me = session?.user.id ?? null;
  const booking = useBookings((s) => s.bookings.find((b) => b.id === id));
  const loaded = useBookings((s) => s.loaded);
  const refreshOne = useBookings((s) => s.refreshOne);

  // Sparkles when the booking was just sent, and when the project is completed while it's open.
  const [burst, setBurst] = useState(celebrate === '1' ? 1 : 0);
  const lastStatus = useRef(booking?.status);
  useEffect(() => {
    if (booking?.status === 'completed' && lastStatus.current && lastStatus.current !== 'completed') setBurst((n) => n + 1);
    lastStatus.current = booking?.status;
  }, [booking?.status]);

  // Opened from a link or before the list loaded: fetch just this booking.
  useEffect(() => {
    if (!booking && id && me) refreshOne(id);
  }, [booking, id, me, refreshOne]);

  if (!booking) {
    if (!loaded && me) return <Screen title={t('project.title')}><ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxxl }} /></Screen>;
    return <Screen title={t('project.title')}><EmptyState icon="alert-circle-outline" title={t('project.notFound')} body={t('project.maybeRemoved')} /></Screen>;
  }
  const isVendor = booking.vendorId === me;
  const title = projectTitle(booking);
  const chatOpen = booking.status !== 'declined' && booking.status !== 'cancelled';

  return (
    <View style={{ flex: 1 }}>
    <Screen
      title={title}
      subtitle={t('project.booked', { date: dateLabel(booking.createdAt) })}
      right={chatOpen ? <IconButton icon="chatbubbles-outline" label={t('project.openChat')} onPress={() => router.push(`/chat/${booking.id}`)} /> : undefined}
    >
      <PartyCard booking={booking} isVendor={isVendor} />
      <StatusPanel booking={booking} isVendor={isVendor} />

      <Card style={{ marginTop: spacing.md }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="overline">{t('project.agreed')}</T>
          <T variant="caption">{t('project.timeline', { n: booking.days })}</T>
        </Row>
        <T style={styles.price}>{pkr(booking.price)}</T>
        <T variant="small">{t('project.start', { start: availabilityLabel(booking.startPref) })}</T>
        <View style={{ marginVertical: spacing.md }}>
          <HouseBar steps={booking.stages.map((s) => (s.status === 'approved' ? 'done' : s.status === 'submitted' ? 'now' : 'next'))} />
        </View>
        <T variant="caption">{t('project.payDirect')}</T>
      </Card>

      {booking.status !== 'declined' && booking.status !== 'cancelled' && (
        <Section title={t('project.stages')}>
          {booking.stages.map((s, i) => (
            <StageRow key={s.id} booking={booking} stage={s} last={i === booking.stages.length - 1} isVendor={isVendor} />
          ))}
        </Section>
      )}

      {booking.status === 'completed' && <Rating booking={booking} isVendor={isVendor} />}

      {!!booking.note && (
        <Section title={isVendor ? t('project.customerNote') : t('project.yourNote')}>
          <Card><T style={{ color: colors.text }}>{booking.note}</T></Card>
        </Section>
      )}

      <Section title={isVendor ? t('project.design') : t('project.yourDesign')}>
        <DesignCompare
          choices={booking.design.choices}
          photoUri={booking.photoUrl}
          resultUri={booking.resultUrl}
          resultMode={booking.design.result_mode ?? 'illustration'}
          height={200}
        />
        {!isVendor && booking.designId && (
          <Button title={t('project.openDesign')} kind="ghost" small iconRight="chevron-forward" onPress={() => router.push({ pathname: '/design/result', params: { id: booking.designId! } })} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />
        )}
      </Section>
    </Screen>
    <Celebrate trigger={burst} />
    </View>
  );
}

function PartyCard({ booking, isVendor }: { booking: Booking; isVendor: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const title = projectTitle(booking);
  if (isVendor) {
    const phone = booking.customerPhone.replace(/[^\d+]/g, '');
    const wa = phone.replace(/^\+/, '').replace(/^0/, '92');
    return (
      <Card style={{ marginTop: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <T variant="overline">{t('project.customer')}</T>
            <T variant="h3">{booking.customerName || t('project.customer')}</T>
            <T variant="small">{[booking.customerCity, booking.customerPhone].filter(Boolean).join(' · ')}</T>
          </View>
          <BookingBadge status={booking.status} />
        </Row>
        {!!phone && booking.status !== 'declined' && booking.status !== 'cancelled' && (
          <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
            <Button title={t('project.call')} icon="call-outline" kind="secondary" small onPress={() => Linking.openURL(`tel:${phone}`).catch(() => {})} style={{ flex: 1 }} />
            <Button title="WhatsApp" icon="logo-whatsapp" kind="secondary" small onPress={() => Linking.openURL(`https://wa.me/${wa}`).catch(() => {})} style={{ flex: 1 }} />
          </Row>
        )}
      </Card>
    );
  }
  return (
    <Card style={{ marginTop: spacing.sm }} onPress={booking.vendorId ? () => router.push(`/vendor/${booking.vendorId}`) : undefined}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <T variant="overline">{t('project.vendor')}</T>
          <T variant="h3">{booking.vendorName || t('project.theVendor')}</T>
        </View>
        <BookingBadge status={booking.status} />
      </Row>
      <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
        <Button title={t('project.chat')} icon="chatbubble-ellipses-outline" kind="secondary" small onPress={() => router.push(`/chat/${booking.id}`)} style={{ flex: 1 }} />
        <Button title={t('project.support')} icon="logo-whatsapp" kind="secondary" small onPress={() => Linking.openURL(`https://wa.me/${config.supportWhatsApp}?text=${encodeURIComponent(t('project.supportMsg', { title }))}`).catch(() => {})} style={{ flex: 1 }} />
      </Row>
    </Card>
  );
}

/** Runs a booking action with a busy flag and a message on failure. */
function useAction() {
  const { t } = useT();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      notify(t('project.actionFailed'), e instanceof Error ? e.message : undefined);
    } finally {
      setBusy(null);
    }
  };
  return { busy, run };
}

/** What happens next, and the buttons for it. */
function StatusPanel({ booking, isVendor }: { booking: Booking; isVendor: boolean }) {
  const { t } = useT();
  const { busy, run } = useAction();
  const { respond, cancel } = useBookings.getState();
  const labels = { cancel: t('common.cancel'), ok: t('common.confirm') };
  const vendor = booking.vendorName || t('project.theVendor');
  const cancelButton = (
    <Button title={t('project.cancel')} kind="ghost" small loading={busy === 'cancel'} style={{ alignSelf: 'flex-start', paddingHorizontal: 0, marginTop: spacing.sm }}
      onPress={() => confirmAction(t('project.cancelTitle'), t('project.cancelBody'), labels, () => run('cancel', () => cancel(booking.id)), true)} />
  );

  if (booking.status === 'requested') {
    return isVendor ? (
      <Card style={[styles.panel, styles.attention]}>
        <T variant="h3">{t('project.newRequest')}</T>
        <T variant="small" style={{ marginTop: 4, color: colors.text }}>{t('project.newRequestBody')}</T>
        <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
          <Button title={t('project.decline')} kind="secondary" small loading={busy === 'decline'} style={{ flex: 1 }}
            onPress={() => confirmAction(t('project.declineTitle'), t('project.declineBody'), labels, () => run('decline', () => respond(booking.id, false)), true)} />
          <Button title={t('project.accept')} icon="checkmark" small loading={busy === 'accept'} style={{ flex: 1 }} onPress={() => run('accept', () => respond(booking.id, true))} />
        </Row>
      </Card>
    ) : (
      <Card style={styles.panel}>
        <T variant="h3">{t('project.waiting', { vendor })}</T>
        <T variant="small" style={{ marginTop: 4 }}>{t('project.waitingBody')}</T>
        {cancelButton}
      </Card>
    );
  }
  if (booking.status === 'declined') {
    return (
      <Card style={styles.panel}>
        <T variant="h3">{isVendor ? t('project.youDeclined') : t('project.declined', { vendor })}</T>
        {!!booking.declineReason && <T variant="small" style={{ marginTop: 4 }}>{booking.declineReason}</T>}
        {!isVendor && <T variant="small" style={{ marginTop: 4 }}>{t('project.declinedNext')}</T>}
      </Card>
    );
  }
  if (booking.status === 'cancelled') {
    return <Card style={styles.panel}><T variant="h3">{isVendor ? t('project.cancelledByCustomer') : t('project.youCancelled')}</T></Card>;
  }
  if (booking.status === 'accepted') {
    const next = nextStage(booking);
    const waitingOnMe = isVendor ? next?.status === 'pending' : next?.status === 'submitted';
    return (
      <Card style={[styles.panel, waitingOnMe && styles.attention]}>
        <T variant="h3">{next ? milestoneTitle(next.stage) : t('project.badge.accepted')}</T>
        <T variant="small" style={{ marginTop: 4, color: colors.text }}>
          {isVendor
            ? next?.status === 'pending' ? t('project.vendorNext') : t('project.vendorWaiting')
            : next?.status === 'submitted' ? t('project.customerConfirm', { vendor }) : t('project.customerWaiting', { vendor })}
        </T>
        {!isVendor && booking.stages.every((s) => s.status === 'pending') && cancelButton}
      </Card>
    );
  }
  return (
    <Card style={[styles.panel, { backgroundColor: colors.tealTint, borderColor: colors.tealTint }]}>
      <T variant="h3">{t('project.doneTitle')}</T>
      <T variant="small" style={{ marginTop: 4, color: colors.text }}>{isVendor ? t('project.doneVendor') : t('project.doneCustomer')}</T>
    </Card>
  );
}

function StageRow({ booking, stage, last, isVendor }: { booking: Booking; stage: Stage; last: boolean; isVendor: boolean }) {
  const { t } = useT();
  const { busy, run } = useAction();
  const next = nextStage(booking);
  const isNext = next?.id === stage.id && booking.status === 'accepted';
  const labels = { cancel: t('common.cancel'), ok: t('common.confirm') };
  const name = milestoneTitle(stage.stage);
  const status =
    stage.status === 'approved' ? t('project.stApproved')
    : stage.status === 'submitted' ? (isVendor ? t('project.stSubmittedVendor') : t('project.stSubmitted'))
    : isNext ? t('project.stNext') : t('project.stPending');

  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <View style={{ alignItems: 'center' }}>
        <Marker state={stage.status === 'approved' ? 'done' : isNext ? 'now' : 'next'} label={stage.stage + 1} size={28} />
        {!last && <View style={[styles.rail, stage.status === 'approved' && { backgroundColor: colors.teal }]} />}
      </View>
      <Card style={[{ flex: 1, marginBottom: spacing.md }, isNext && stage.status === 'submitted' && !isVendor && styles.attention]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T variant="bodyStrong" style={{ flex: 1 }}>{name}</T>
          <T variant="bodyStrong" style={{ color: colors.navy }}>{pkr(stage.amount)}</T>
        </Row>
        <T variant="caption">{status}</T>
        {isVendor && isNext && stage.status === 'pending' && (
          <Button title={t('project.markDone')} icon="checkmark-done" small loading={!!busy} style={{ marginTop: spacing.md }}
            onPress={() => confirmAction(t('project.markDoneTitle', { stage: name }), t('project.markDoneBody'), labels, () => run('submit', () => useBookings.getState().submitStage(booking.id, stage.id)))} />
        )}
        {!isVendor && stage.status === 'submitted' && booking.status === 'accepted' && (
          <Button title={t('project.confirmStage')} icon="checkmark-done" small loading={!!busy} style={{ marginTop: spacing.md }}
            onPress={() => confirmAction(t('project.confirmTitle', { stage: name }), t('project.confirmBody', { amount: pkr(stage.amount), vendor: booking.vendorName }), labels, () => run('approve', () => useBookings.getState().approveStage(booking.id, stage.id)))} />
        )}
      </Card>
    </View>
  );
}

function Rating({ booking, isVendor }: { booking: Booking; isVendor: boolean }) {
  const { t } = useT();
  const { busy, run } = useAction();
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');
  if (booking.rating) {
    return (
      <Card style={{ marginTop: spacing.sm }}>
        <T variant="h3">{isVendor ? t('project.customerReview') : t('project.yourReview')}</T>
        <View style={{ marginTop: 6 }}><Stars value={booking.rating} size={18} /></View>
        {!!booking.review && <T variant="small" style={{ marginTop: 6, color: colors.text }}>{booking.review}</T>}
      </Card>
    );
  }
  if (isVendor) return null;
  return (
    <Card style={{ marginTop: spacing.sm, backgroundColor: colors.amberTint }}>
      <T variant="h3">{t('project.howDid', { vendor: booking.vendorName || t('project.yourVendor') })}</T>
      <T variant="small">{t('project.ratingHelps')}</T>
      <View style={{ marginVertical: spacing.md, alignItems: 'center' }}><Stars value={stars} size={34} onChange={setStars} /></View>
      <TextInput value={review} onChangeText={setReview} placeholder={t('project.reviewPh')} placeholderTextColor={colors.textSubtle} multiline maxLength={1000} style={styles.review} />
      <Button title={t('project.submit')} icon="star" kind="amber" loading={!!busy} style={{ marginTop: spacing.md }} onPress={() => run('rate', () => useBookings.getState().rate(booking.id, stars, review.trim()))} />
    </Card>
  );
}

const styles = StyleSheet.create({
  price: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: colors.navy, letterSpacing: -0.6, marginTop: spacing.sm },
  panel: { marginTop: spacing.md },
  attention: { backgroundColor: colors.amberTint, borderColor: colors.amberTint },
  rail: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
  review: { minHeight: 80, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: spacing.md, fontFamily: fonts.medium, color: colors.text, textAlignVertical: 'top' },
});
