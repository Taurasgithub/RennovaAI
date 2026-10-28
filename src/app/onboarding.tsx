import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BeforeAfter } from '../components/BeforeAfter';
import { RoomIllustration } from '../components/RoomIllustration';
import { Badge, Button, Card, Chip, IconTile, Row, T } from '../components/ui';
import { config } from '../config';
import { useApp } from '../store/useApp';
import { colors, fonts, radius, spacing } from '../theme';

const SLIDES = [
  { overline: 'Visualise', title: 'See it before\nyou build it', body: 'Snap your room, pick a style and colours, and RennovaAI shows you the renovated result — before you spend a rupee.' },
  { overline: 'Compare', title: 'Verified vendors,\nside by side', body: 'Get an instant cost range and real quotes from verified painters, carpenters, decorators and contractors near you.' },
  { overline: 'Build', title: 'Pay safely,\nstage by stage', body: 'Your money stays in escrow and is released only when you approve each milestone of the work.' },
];

function SlideArt({ index }: { index: number }) {
  if (index === 0)
    return (
      <BeforeAfter
        height={250}
        before={<RoomIllustration worn />}
        after={<RoomIllustration paletteId="teal-feature" styleId="modern" flooringId="porcelain" ceilingId="cove" extras={['panelling', 'decor']} />}
      />
    );
  if (index === 1)
    return (
      <View style={{ gap: spacing.sm }}>
        {[
          ['Indus Paint Works', '4.8', 'PKR 1.15 lac', '9 days', true],
          ['Sindh BuildPro', '4.5', 'PKR 1.19 lac', '10 days', false],
          ['Al-Noor Interiors', '4.9', 'PKR 1.33 lac', '11 days', false],
        ].map(([name, r, price, days, best]) => (
          <Card key={name as string} style={[{ paddingVertical: spacing.md }, best ? { borderWidth: 2, borderColor: colors.teal } : null]}>
            <Row>
              <IconTile icon="shield-checkmark" size={38} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{name as string}</T>
                <Row gap={4}>
                  <Ionicons name="star" size={12} color={colors.amber} />
                  <T variant="caption">{r as string} · {days as string}</T>
                </Row>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <T variant="bodyStrong" style={{ color: colors.navy }}>{price as string}</T>
                {best ? <Badge label="BEST MATCH" tone="amber" /> : null}
              </View>
            </Row>
          </Card>
        ))}
      </View>
    );
  return (
    <Card>
      {[
        ['Mobilisation', '30%', 'released'],
        ['Mid-work', '40%', 'escrow'],
        ['Completion', '30%', 'locked'],
      ].map(([t, p, s], i) => (
        <Row key={t} style={{ paddingVertical: spacing.md, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
          <Ionicons
            name={s === 'released' ? 'checkmark-circle' : s === 'escrow' ? 'lock-closed' : 'ellipse-outline'}
            size={24}
            color={s === 'released' ? colors.success : s === 'escrow' ? colors.amber : colors.textSubtle}
          />
          <T variant="bodyStrong" style={{ flex: 1 }}>{t}</T>
          <T variant="small">{p}</T>
          <Badge label={s === 'released' ? 'PAID' : s === 'escrow' ? 'IN ESCROW' : 'UPCOMING'} tone={s === 'released' ? 'green' : s === 'escrow' ? 'amber' : 'gray'} />
        </Row>
      ))}
    </Card>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser, completeOnboarding, user } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [city, setCity] = useState<string>(user?.city ?? 'Sukkur');

  const finish = () => {
    setUser({ name: name.trim(), phone: phone.trim(), city });
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const isProfile = step === SLIDES.length;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
        <Row style={{ justifyContent: 'space-between' }}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 120, height: 98 }} contentFit="contain" />
          {!isProfile && (
            <Pressable onPress={() => setStep(SLIDES.length)} hitSlop={10}>
              <T variant="small" style={{ fontFamily: fonts.semibold }}>Skip</T>
            </Pressable>
          )}
        </Row>

        {!isProfile ? (
          <View style={{ flex: 1, marginTop: spacing.lg }}>
            <SlideArt index={step} />
            <T variant="overline" style={{ marginTop: spacing.xxl }}>{SLIDES[step].overline}</T>
            <T variant="display" style={{ marginTop: spacing.sm }}>{SLIDES[step].title}</T>
            <T style={{ marginTop: spacing.md, fontSize: 15.5, lineHeight: 23 }}>{SLIDES[step].body}</T>
          </View>
        ) : (
          <View style={{ flex: 1, marginTop: spacing.lg }}>
            <T variant="overline">Almost there</T>
            <T variant="display" style={{ marginTop: spacing.sm }}>Let's set up{'\n'}your profile</T>
            <T style={{ marginTop: spacing.sm }}>We use your city to match you with verified local vendors.</T>

            <T variant="bodyStrong" style={styles.label}>Your name</T>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Ayesha Khan" placeholderTextColor={colors.textSubtle} style={styles.input} autoCapitalize="words" />

            <T variant="bodyStrong" style={styles.label}>Mobile number (optional)</T>
            <TextInput value={phone} onChangeText={setPhone} placeholder="03XX XXXXXXX" placeholderTextColor={colors.textSubtle} style={styles.input} keyboardType="phone-pad" maxLength={13} />

            <T variant="bodyStrong" style={styles.label}>Your city</T>
            <Row style={{ flexWrap: 'wrap' }}>
              {config.cities.map((c) => (
                <Chip key={c} label={c} icon="location-outline" selected={city === c} onPress={() => setCity(c)} />
              ))}
            </Row>
            <T variant="caption" style={{ marginTop: spacing.sm }}>Launching in Sukkur, Hyderabad and Karachi — more cities soon.</T>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.lg, paddingTop: spacing.sm, backgroundColor: colors.white }}>
        <Row style={{ justifyContent: 'center', marginBottom: spacing.lg }} gap={6}>
          {[...SLIDES, null].map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </Row>
        {isProfile ? (
          <Button title="Start designing" icon="sparkles" onPress={finish} disabled={name.trim().length < 2} />
        ) : (
          <Button title={step === SLIDES.length - 1 ? 'Get started' : 'Next'} iconRight="arrow-forward" onPress={() => setStep(step + 1)} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: spacing.xl, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 26, backgroundColor: colors.teal },
});
