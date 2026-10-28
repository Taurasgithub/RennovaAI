import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { DesignThumb } from '../../components/DesignPreview';
import { Badge, Button, Card, Chip, Divider, EmptyState, IconTile, Row, Screen, T, tap } from '../../components/ui';
import { config } from '../../config';
import { getVendor } from '../../data/vendors';
import { pkr, roundTo, uid } from '../../lib/format';
import { useApp, type Milestone } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const PLAN = [
  { title: 'Mobilisation & materials', pct: 0.3 },
  { title: 'Mid-work inspection', pct: 0.4 },
  { title: 'Completion & handover', pct: 0.3 },
];

const METHODS = [
  { id: 'jazzcash', label: 'JazzCash', icon: 'phone-portrait-outline' as const },
  { id: 'easypaisa', label: 'Easypaisa', icon: 'wallet-outline' as const },
  { id: 'card', label: 'Debit / credit card', icon: 'card-outline' as const },
];

export default function Book() {
  const p = useLocalSearchParams<{ vendorId: string; designId: string; price: string; days: string }>();
  const router = useRouter();
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

  if (!vendor || !design) return <Screen title="Book"><EmptyState icon="alert-circle-outline" title="Booking unavailable" body="Please choose a vendor from your quotes again." /></Screen>;

  const price = Number(p.price) || design.estimate.mid;
  const days = Number(p.days) || design.estimate.days;
  const discount = applied ? config.referralDiscount : 0;
  const total = price - discount;
  const milestones: Milestone[] = PLAN.map((m, i) => ({
    id: uid(),
    title: m.title,
    pct: m.pct,
    amount: i === PLAN.length - 1 ? total - PLAN.slice(0, -1).reduce((s, x) => s + roundTo(total * x.pct, 100), 0) : roundTo(total * m.pct, 100),
    status: i === 0 ? 'in_escrow' : 'awaiting_deposit',
  }));

  const applyCode = () => {
    if (code.trim().toUpperCase() === config.referralCode && !referralUsed) {
      setApplied(true);
      setCodeError('');
    } else setCodeError(referralUsed ? 'Referral discount already used on a previous booking.' : 'That code is not valid.');
  };

  const pay = async () => {
    setPaying(true);
    // TODO(go-live): call the payments API (JazzCash / Easypaisa / card gateway) to place the deposit in escrow.
    await new Promise((r) => setTimeout(r, 1500));
    if (applied) markReferralUsed();
    const id = createProject({
      designId: design.id,
      vendorId: vendor.id,
      title: design.name,
      price,
      discount,
      days,
      paymentMethod: METHODS.find((m) => m.id === method)?.label ?? method,
      milestones,
    });
    setPaying(false);
    router.replace(`/project/${id}`);
  };

  return (
    <Screen
      title="Book & pay securely"
      footer={
        <View>
          <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <T variant="small">Due today (held in escrow)</T>
            <T variant="h3" style={{ color: colors.navy }}>{pkr(milestones[0].amount)}</T>
          </Row>
          <Button title={paying ? 'Processing…' : `Deposit ${pkr(milestones[0].amount)}`} icon="lock-closed" loading={paying} disabled={!agree} onPress={pay} />
        </View>
      }
    >
      <Card style={{ marginTop: spacing.sm }}>
        <Row gap={spacing.md}>
          <DesignThumb {...design} size={74} />
          <View style={{ flex: 1 }}>
            <T variant="h3" numberOfLines={1}>{design.name}</T>
            <T variant="small">{vendor.name}</T>
            <Row style={{ marginTop: 4 }} gap={6}>
              <Badge label={`${days} DAYS`} tone="navy" icon="time-outline" />
              <Badge label="VERIFIED" tone="teal" icon="shield-checkmark" />
            </Row>
          </View>
        </Row>
      </Card>

      <T variant="h2" style={{ marginTop: spacing.xl }}>Preferred start</T>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
        {['Tomorrow', 'This week', 'Next week', 'Flexible'].map((s) => <Chip key={s} label={s} selected={start === s} onPress={() => setStart(s)} />)}
      </Row>
      <T variant="caption" style={{ marginTop: 6 }}>{vendor.name} will confirm the exact date and any site visit in chat.</T>

      <T variant="h2" style={{ marginTop: spacing.xl }}>Milestone escrow</T>
      <Card style={{ marginTop: spacing.md }}>
        {milestones.map((m, i) => (
          <Row key={m.id} style={[{ paddingVertical: spacing.sm }, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }]}>
            <View style={[styles.num, i === 0 && { backgroundColor: colors.amber }]}>
              <T style={{ fontFamily: fonts.bold, color: i === 0 ? colors.navyDeep : colors.white, fontSize: 12 }}>{i + 1}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T variant="bodyStrong">{m.title}</T>
              <T variant="caption">{Math.round(m.pct * 100)}% · {i === 0 ? 'deposited today' : 'deposit when previous stage is approved'}</T>
            </View>
            <T variant="bodyStrong">{pkr(m.amount)}</T>
          </Row>
        ))}
      </Card>
      <Row style={{ marginTop: spacing.md, alignItems: 'flex-start' }}>
        <IconTile icon="shield-checkmark" size={34} />
        <T variant="small" style={{ flex: 1 }}>
          RennovaAI holds each payment and releases it to the vendor only after you approve that stage. Disputes are resolved within 48 hours.
        </T>
      </Row>

      <T variant="h2" style={{ marginTop: spacing.xl }}>Promo code</T>
      <Row style={{ marginTop: spacing.md }}>
        <TextInput
          value={code}
          onChangeText={(t) => { setCode(t); setCodeError(''); }}
          placeholder={referralUsed ? 'Enter code' : `Try ${config.referralCode}`}
          placeholderTextColor={colors.textSubtle}
          autoCapitalize="characters"
          editable={!applied}
          style={styles.input}
        />
        <Button title={applied ? 'Applied' : 'Apply'} kind={applied ? 'secondary' : 'navy'} small icon={applied ? 'checkmark' : undefined} onPress={applyCode} disabled={applied || !code} />
      </Row>
      {!!codeError && <T variant="caption" style={{ color: colors.danger, marginTop: 4 }}>{codeError}</T>}

      <T variant="h2" style={{ marginTop: spacing.xl }}>Pay with</T>
      {METHODS.map((m) => (
        <Pressable key={m.id} onPress={() => { tap(); setMethod(m.id); }} style={[styles.method, method === m.id && styles.methodOn]}>
          <Ionicons name={m.icon} size={22} color={colors.navy} />
          <T variant="bodyStrong" style={{ flex: 1 }}>{m.label}</T>
          <Ionicons name={method === m.id ? 'radio-button-on' : 'radio-button-off'} size={22} color={method === m.id ? colors.teal : colors.textSubtle} />
        </Pressable>
      ))}

      <Card style={{ marginTop: spacing.xl }}>
        <Row style={{ justifyContent: 'space-between' }}><T variant="small">Vendor quote</T><T variant="bodyStrong">{pkr(price)}</T></Row>
        {applied && <Row style={{ justifyContent: 'space-between', marginTop: 6 }}><T variant="small">Referral discount</T><T variant="bodyStrong" style={{ color: colors.success }}>− {pkr(discount)}</T></Row>}
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}><T variant="small">Platform fee</T><T variant="bodyStrong" style={{ color: colors.success }}>Free for customers</T></Row>
        <Divider />
        <Row style={{ justifyContent: 'space-between' }}><T variant="bodyStrong">Project total</T><T variant="h3" style={{ color: colors.navy }}>{pkr(total)}</T></Row>
      </Card>

      <Pressable onPress={() => { tap(); setAgree(!agree); }} style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'flex-start' }}>
        <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={22} color={agree ? colors.teal : colors.textSubtle} />
        <T variant="small" style={{ flex: 1 }}>I agree to the RennovaAI booking terms and milestone escrow policy.</T>
      </Pressable>
      <T variant="caption" style={{ marginTop: spacing.md }}>Beta build: payments run in test mode until the payment gateway is connected.</T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing.md, fontFamily: fonts.semibold, color: colors.text },
  method: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, marginTop: spacing.sm },
  methodOn: { borderColor: colors.teal, backgroundColor: colors.tealMist },
});
