import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignThumb } from '../components/DesignPreview';
import { Badge, Button, Card, Header, Row, T, tap } from '../components/ui';
import { config } from '../config';
import { pkr } from '../lib/format';
import { useApp } from '../store/useApp';
import { colors, fonts, radius, spacing } from '../theme';

const PERKS = [
  ['infinite', 'Unlimited AI regenerations', 'Try every palette and style for this project'],
  ['download-outline', 'High-resolution export', 'Share crisp renders with family and vendors'],
  ['list-outline', 'Material shopping list', 'Exact items to buy, with partner-store discounts'],
  ['cube-outline', '3D walkthroughs', 'Coming soon — included free when it launches'],
] as const;

export default function Premium() {
  const { designId } = useLocalSearchParams<{ designId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { designs, updateDesign, studentPackClaimed, claimStudentPack } = useApp();
  const [selected, setSelected] = useState<string | undefined>(designId ?? designs.find((d) => !d.premium)?.id);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const eligible = designs.filter((d) => !d.premium);
  const isStudent = code.trim().toUpperCase() === config.studentCode && !studentPackClaimed;

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    // TODO(go-live): charge PKR 500 via the payment gateway (or Google Play Billing for digital goods).
    await new Promise((r) => setTimeout(r, 1200));
    if (isStudent) claimStudentPack();
    updateDesign(selected, { premium: true });
    setBusy(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={[colors.navy, colors.navyDeep]} style={{ paddingTop: insets.top, paddingBottom: spacing.xxl }}>
        <Header dark title="" />
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Ionicons name="diamond" size={36} color={colors.amber} />
          <T variant="display" style={{ color: colors.white, marginTop: spacing.md }}>Premium Design Pack</T>
          <T style={{ color: 'rgba(255,255,255,0.8)', marginTop: spacing.sm }}>One project, unlimited creativity.</T>
          <Row style={{ marginTop: spacing.lg, alignItems: 'flex-end' }} gap={6}>
            <T style={{ fontFamily: fonts.extrabold, fontSize: 32, color: colors.amber }}>{isStudent ? 'FREE' : pkr(config.premiumPackPrice)}</T>
            <T style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>per project</T>
          </Row>
        </View>
      </LinearGradient>

      <View style={{ flex: 1, paddingHorizontal: spacing.lg, marginTop: -spacing.lg }}>
        <Card>
          {PERKS.map(([icon, title, body], i) => (
            <Row key={title} style={{ marginTop: i ? spacing.md : 0, alignItems: 'flex-start' }}>
              <Ionicons name={icon} size={22} color={colors.teal} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{title}</T>
                <T variant="caption">{body}</T>
              </View>
            </Row>
          ))}
        </Card>

        {eligible.length > 0 ? (
          <>
            <T variant="bodyStrong" style={{ marginTop: spacing.lg }}>Apply to design</T>
            <Row style={{ marginTop: spacing.sm, flexWrap: 'wrap' }}>
              {eligible.slice(0, 4).map((d) => (
                <Pressable key={d.id} onPress={() => { tap(); setSelected(d.id); }} style={[styles.pick, selected === d.id && styles.pickOn]}>
                  <DesignThumb {...d} size={56} radius={8} />
                  <T variant="caption" numberOfLines={1} style={{ width: 64, marginTop: 4, textAlign: 'center' }}>{d.name}</T>
                </Pressable>
              ))}
            </Row>
          </>
        ) : (
          <Card style={{ marginTop: spacing.lg }}>
            <T variant="small">Create a design first — the pack is applied per project.</T>
          </Card>
        )}

        <Row style={{ marginTop: spacing.lg }}>
          <TextInput value={code} onChangeText={setCode} placeholder="Student code (optional)" placeholderTextColor={colors.textSubtle} autoCapitalize="characters" style={styles.input} />
          {isStudent && <Badge label="STUDENT · FREE" tone="green" icon="school-outline" />}
        </Row>
      </View>

      <View style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.lg }}>
        <Button
          title={eligible.length ? (isStudent ? 'Claim free pack' : `Unlock for ${pkr(config.premiumPackPrice)}`) : 'Create a design'}
          kind="amber"
          icon="diamond"
          loading={busy}
          onPress={eligible.length ? buy : () => router.replace('/design/capture')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pick: { padding: 4, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', alignItems: 'center' },
  pickOn: { borderColor: colors.teal, backgroundColor: colors.tealMist },
  input: { flex: 1, height: 46, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing.md, fontFamily: fonts.semibold, color: colors.text },
});
