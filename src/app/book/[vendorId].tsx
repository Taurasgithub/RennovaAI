import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { DesignThumb } from '../../components/DesignPreview';
import { Badge, Button, Card, Chip, EmptyState, IconTile, Row, Screen, T } from '../../components/ui';
import { getVendor } from '../../data/vendors';
import { availabilityLabel, designName, milestoneTitle, useT } from '../../i18n';
import { notify } from '../../lib/dialogs';
import { pkr, roundTo } from '../../lib/format';
import { useBookings } from '../../services/bookings';
import { ensureSynced } from '../../services/designSync';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const STAGE_PCTS = [0.3, 0.4, 0.3];

// Values match the vendor sample data so availabilityLabel() can translate them.
const START_OPTIONS = ['Tomorrow', 'This week', 'Next week', 'Flexible'];

/**
 * Request a booking. No money moves through the app: the vendor accepts or declines, marks each
 * stage done, the customer confirms it, and the customer pays the vendor directly.
 */
export default function Book() {
  const p = useLocalSearchParams<{ vendorId: string; designId: string; price: string; days: string }>();
  const router = useRouter();
  const { t } = useT();
  const auth = useAuth();
  const vendor = getVendor(p.vendorId);
  const design = useApp((s) => s.designs.find((d) => d.id === p.designId));
  const request = useBookings((s) => s.request);
  const [start, setStart] = useState('This week');
  const [note, setNote] = useState('');
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);

  if (!vendor || !design) return <Screen title={t('book.screenTitle')}><EmptyState icon="alert-circle-outline" title={t('book.unavailableTitle')} body={t('book.unavailableBody')} /></Screen>;
  if (!vendor.account) return <Screen title={t('book.screenTitle')}><EmptyState icon="information-circle-outline" title={t('book.sampleTitle')} body={t('book.sampleBody')} /></Screen>;
  if (!auth.session) return <Screen title={t('book.screenTitle')}><EmptyState icon="person-circle-outline" title={t('book.needAccount')} body={t('book.needAccountBody')} /></Screen>;

  const price = Number(p.price) || design.estimate.mid;
  const days = Number(p.days) || design.estimate.days;
  const name = designName(design);
  const amounts = [roundTo(price * STAGE_PCTS[0], 100), roundTo(price * STAGE_PCTS[1], 100)];
  amounts.push(price - amounts[0] - amounts[1]);

  const send = async () => {
    setSending(true);
    try {
      const { photoPath, resultPath } = await ensureSynced(design.id);
      const id = await request({
        vendorId: vendor.id,
        designId: design.id,
        design: {
          name: design.name,
          nameParts: design.nameParts ?? null,
          choices: design.choices,
          estimate: design.estimate,
          photo_path: photoPath,
          result_path: resultPath,
          result_mode: design.resultMode,
        },
        title: name,
        price,
        days,
        start,
        note: note.trim(),
      });
      router.replace({ pathname: '/project/[id]', params: { id, celebrate: '1' } });
    } catch (e) {
      notify(t('book.failed'), e instanceof Error ? e.message : undefined);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen
      title={t('book.title')}
      footer={<Button title={sending ? t('book.sending') : t('book.send')} icon="paper-plane-outline" loading={sending} disabled={!agree} onPress={send} />}
    >
      <Card style={{ marginTop: spacing.sm }}>
        <Row gap={spacing.md}>
          <DesignThumb {...design} size={74} />
          <View style={{ flex: 1 }}>
            <T variant="h3" numberOfLines={1}>{name}</T>
            <T variant="small">{vendor.name}</T>
            <Row style={{ marginTop: 4 }} gap={6}>
              <Badge label={t('common.daysUpper', { n: days })} tone="navy" icon="time-outline" />
              {vendor.verified && <Badge label={t('common.verified')} tone="teal" icon="shield-checkmark" />}
            </Row>
          </View>
        </Row>
        <Row style={{ justifyContent: 'space-between', marginTop: spacing.md }}>
          <T variant="small">{t('book.price')}</T>
          <T variant="h3" style={{ color: colors.navy }}>{pkr(price)}</T>
        </Row>
      </Card>

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.start')}</T>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
        {START_OPTIONS.map((s) => <Chip key={s} label={availabilityLabel(s)} selected={start === s} onPress={() => setStart(s)} />)}
      </Row>
      <T variant="caption" style={{ marginTop: 6 }}>{t('book.confirmDate', { vendor: vendor.name })}</T>

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.note')}</T>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('book.notePh')}
        placeholderTextColor={colors.textSubtle}
        multiline
        maxLength={1000}
        style={styles.note}
      />

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.stages')}</T>
      <Card style={{ marginTop: spacing.md }}>
        {amounts.map((amount, i) => (
          <Row key={i} style={[{ paddingVertical: spacing.sm }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
            <View style={styles.num}><T style={{ fontFamily: fonts.bold, color: colors.white, fontSize: 12 }}>{i + 1}</T></View>
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong">{milestoneTitle(i)}</T>
              <T variant="caption">{Math.round(STAGE_PCTS[i] * 100)}%</T>
            </View>
            <T variant="bodyStrong">{pkr(amount)}</T>
          </Row>
        ))}
      </Card>

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.how')}</T>
      {(['book.how1', 'book.how2', 'book.how3'] as const).map((k, i) => (
        <Row key={k} style={{ marginTop: spacing.md, alignItems: 'flex-start' }}>
          <IconTile icon={i === 0 ? 'checkmark-circle-outline' : i === 1 ? 'construct-outline' : 'cash-outline'} size={34} />
          <T variant="small" style={{ flex: 1 }}>{t(k, { vendor: vendor.name })}</T>
        </Row>
      ))}

      <Row style={{ marginTop: spacing.xl, alignItems: 'flex-start' }}>
        <Chip label={agree ? '✓' : ' '} selected={agree} onPress={() => setAgree(!agree)} />
        <T variant="small" style={{ flex: 1 }} onPress={() => setAgree(!agree)}>{t('book.agree')}</T>
      </Row>
    </Screen>
  );
}

const styles = StyleSheet.create({
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center' },
  note: { minHeight: 90, marginTop: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: spacing.md, fontFamily: fonts.medium, color: colors.text, textAlignVertical: 'top' },
});
