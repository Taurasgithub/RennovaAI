import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DesignThumb } from '../../components/DesignPreview';
import { Badge, Button, Card, Chip, Divider, EmptyState, IconTile, Row, Screen, T, tap } from '../../components/ui';
import { config } from '../../config';
import { getVendor } from '../../data/vendors';
import { pkr, roundTo, uid } from '../../lib/format';
import { availabilityLabel, designName, useT, type TKey } from '../../i18n';
import { useApp, type Milestone } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const PLAN = [
  { title: 'Mobilisation & materials', pct: 0.3 },
  { title: 'Mid-work inspection', pct: 0.4 },
  { title: 'Completion & handover', pct: 0.3 },
];

const METHODS: { id: string; label: TKey; icon: 'phone-portrait-outline' | 'wallet-outline' | 'card-outline' }[] = [
  { id: 'jazzcash', label: 'book.method.jazzcash', icon: 'phone-portrait-outline' },
  { id: 'easypaisa', label: 'book.method.easypaisa', icon: 'wallet-outline' },
  { id: 'card', label: 'book.method.card', icon: 'card-outline' },
];

// Values match the vendor sample data so availabilityLabel() can translate them.
const START_OPTIONS = ['Tomorrow', 'This week', 'Next week', 'Flexible'];

export default function Book() {
  const p = useLocalSearchParams<{ vendorId: string; designId: string; price: string; days: string }>();
  const router = useRouter();
  const { t } = useT();
  const vendor = getVendor(p.vendorId);
  const { designs, referralUsed, markReferralUsed, createProject } = useApp();
  const design = designs.find((d) => d.id === p.designId);
  const [start, setStart] = useState('This week');
  const [method, setMethod] = useState('jazzcash');
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!vendor || !design) return <Screen title={t('book.screenTitle')}><EmptyState icon="alert-circle-outline" title={t('book.unavailableTitle')} body={t('book.unavailableBody')} /></Screen>;

  const price = Number(p.price) || design.estimate.mid;
  const days = Number(p.days) || design.estimate.days;
  const discount = applied ? config.referralDiscount : 0;
  const total = price - discount;
  const name = designName(design);
  const milestones: Milestone[] = PLAN.map((m, i) => ({
    id: uid(),
    title: m.title,
    stage: i,
    pct: m.pct,
    amount: i === PLAN.length - 1 ? total - PLAN.slice(0, -1).reduce((s, x) => s + roundTo(total * x.pct, 100), 0) : roundTo(total * m.pct, 100),
    status: i === 0 ? 'in_escrow' : 'awaiting_deposit',
  }));

  const applyCode = () => {
    if (code.trim().toUpperCase() === config.referralCode && !referralUsed) {
      setApplied(true);
      setCodeError('');
    } else setCodeError(referralUsed ? t('book.codeUsed') : t('book.codeInvalid'));
  };

  const pay = async () => {
    setPaying(true);
    // TODO(go-live): call the payments API (JazzCash / Easypaisa / card gateway) to place the deposit in escrow.
    await new Promise((r) => setTimeout(r, 1500));
    if (applied) markReferralUsed();
    const id = createProject(
      {
        designId: design.id,
        vendorId: vendor.id,
        title: name,
        price,
        discount,
        days,
        paymentMethod: method,
        milestones,
      },
      t('chat.greeting', { title: name }),
    );
    setPaying(false);
    router.replace(`/project/${id}`);
  };

  return (
    <Screen
      title={t('book.title')}
      footer={
        <View>
          <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <T variant="small">{t('book.due')}</T>
            <T variant="h3" style={{ color: colors.navy }}>{pkr(milestones[0].amount)}</T>
          </Row>
          <Button title={paying ? t('book.processing') : t('book.deposit', { amount: pkr(milestones[0].amount) })} icon="lock-closed" loading={paying} disabled={!agree} onPress={pay} />
        </View>
      }
    >
      <Card style={{ marginTop: spacing.sm }}>
        <Row gap={spacing.md}>
          <DesignThumb {...design} size={74} />
          <View style={{ flex: 1 }}>
            <T variant="h3" numberOfLines={1}>{name}</T>
            <T variant="small">{vendor.name}</T>
            <Row style={{ marginTop: 4 }} gap={6}>
              <Badge label={t('common.daysUpper', { n: days })} tone="navy" icon="time-outline" />
              <Badge label={t('common.verified')} tone="teal" icon="shield-checkmark" />
            </Row>
          </View>
        </Row>
      </Card>

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.start')}</T>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
        {START_OPTIONS.map((s) => <Chip key={s} label={availabilityLabel(s)} selected={start === s} onPress={() => setStart(s)} />)}
      </Row>
      <T variant="caption" style={{ marginTop: 6 }}>{t('book.confirmDate', { vendor: vendor.name })}</T>

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.escrow')}</T>
      <Card style={{ marginTop: spacing.md }}>
        {milestones.map((m, i) => (
          <Row key={m.id} style={[{ paddingVertical: spacing.sm }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
            <View style={[styles.num, i === 0 && { backgroundColor: colors.amber }]}>
              <T style={{ fontFamily: fonts.bold, color: i === 0 ? colors.navyDeep : colors.white, fontSize: 12 }}>{i + 1}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong">{t(`milestone.${i}` as TKey)}</T>
              <T variant="caption">{Math.round(m.pct * 100)}% · {i === 0 ? t('book.depositedToday') : t('book.depositLater')}</T>
            </View>
            <T variant="bodyStrong">{pkr(m.amount)}</T>
          </Row>
        ))}
      </Card>
      <Row style={{ marginTop: spacing.md, alignItems: 'flex-start' }}>
        <IconTile icon="shield-checkmark" size={34} />
        <T variant="small" style={{ flex: 1 }}>
          {t('book.escrowNote')}
        </T>
      </Row>

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.promo')}</T>
      <Row style={{ marginTop: spacing.md }}>
        <TextInput
          value={code}
          onChangeText={(t) => { setCode(t); setCodeError(''); }}
          placeholder={referralUsed ? t('book.enterCode') : t('book.tryCode', { code: config.referralCode })}
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="characters"
          editable={!applied}
          style={styles.input}
        />
        <Button title={applied ? t('book.applied') : t('book.apply')} kind={applied ? 'secondary' : 'navy'} small icon={applied ? 'checkmark' : undefined} onPress={applyCode} disabled={applied || !code} />
      </Row>
      {!!codeError && <T variant="caption" style={{ color: colors.danger, marginTop: 4 }}>{codeError}</T>}

      <T variant="h2" style={{ marginTop: spacing.xl }}>{t('book.payWith')}</T>
      {METHODS.map((m) => (
        <Pressable key={m.id} onPress={() => { tap(); setMethod(m.id); }} style={[styles.method, method === m.id && styles.methodOn]}>
          <Ionicons name={m.icon} size={22} color={colors.navy} />
          <T variant="bodyStrong" style={{ flex: 1 }}>{t(m.label)}</T>
          <Ionicons name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={method === m.id ? colors.teal : colors.textSubtle} />
        </Pressable>
      ))}

      <Card style={{ marginTop: spacing.xl }}>
        <Row style={{ justifyContent: 'space-between' }}><T variant="small">{t('book.vendorQuote')}</T><T variant="bodyStrong">{pkr(price)}</T></Row>
        {applied && <Row style={{ justifyContent: 'space-between', marginTop: 6 }}><T variant="small">{t('book.referral')}</T><T variant="bodyStrong" style={{ color: colors.success }}>− {pkr(discount)}</T></Row>}
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}><T variant="small">{t('book.fee')}</T><T variant="bodyStrong" style={{ color: colors.success }}>{t('book.feeFree')}</T></Row>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}><T variant="bodyStrong">{t('book.total')}</T><T variant="h3" style={{ color: colors.navy }}>{pkr(total)}</T></Row>
      </Card>

      <Pressable onPress={() => { tap(); setAgree(!agree); }} style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'flex-start' }}>
        <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={22} color={agree ? colors.teal : colors.textSubtle} />
        <T variant="small" style={{ flex: 1 }}>{t('book.agree')}</T>
      </Pressable>
      <T variant="caption" style={{ marginTop: spacing.md }}>{t('book.testMode')}</T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing.md, fontFamily: fonts.semibold, color: colors.text },
  method: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, marginTop: spacing.sm },
  methodOn: { borderColor: colors.teal, backgroundColor: colors.tealMist },
});
