import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { AccountSignIn } from '../components/AccountSignIn';
import { BeforeAfter } from '../components/BeforeAfter';
import { LanguagePicker } from '../components/LanguagePicker';
import { Backdrop, HouseDivider, SparkMarks, Swash } from '../components/OnboardingDecor';
import { GoogleMark, GradientButton as NextButton, IconField, OrDivider, PakistanFlag, SocialButton } from '../components/OnboardingParts';
import { Badge, Row, T, tap, Txt } from '../components/ui';
import { config } from '../config';
import { cityLabel, useT, type TKey } from '../i18n';
import { useApp } from '../store/useApp';
import { colors, fonts, radius, shadow, spacing } from '../theme';

const MAX_WIDTH = 520;

type IconSpec = { family: 'mci' | 'ion'; name: string; accent?: boolean };

const FEATURES: TKey[] = ['ob.feature1', 'ob.feature2', 'ob.feature3'];

// Same order as FEATURES.
const FEATURE_ICONS: IconSpec[][] = [
  [{ family: 'mci', name: 'format-paint' }],
  [{ family: 'mci', name: 'home-outline' }, { family: 'ion', name: 'sparkles', accent: true }],
  [{ family: 'mci', name: 'rocket-launch-outline' }],
];

const SLIDES: { overline: TKey; title: TKey; body: TKey }[] = [
  { overline: 'ob.s2.overline', title: 'ob.s2.title', body: 'ob.s2.body' },
  { overline: 'ob.s3.overline', title: 'ob.s3.title', body: 'ob.s3.body' },
];

// Steps: 0–2 intro slides, then sign-in, then profile.
const SLIDE_COUNT = 3;
const WELCOME = 3;
const PROFILE = 4;

const SAMPLE_QUOTES = [
  { name: 'Indus Paint Works', rating: '4.8', price: 115000, days: 9, icon: 'format-paint', best: true },
  { name: 'Sindh BuildPro', rating: '4.5', price: 119000, days: 10, icon: 'home-outline', best: false },
  { name: 'Al-Noor Interiors', rating: '4.9', price: 133000, days: 11, icon: 'tools', best: false },
] as const;

/** "03XX XXXXXXX", "+92 3XX…", "3XX…" → "3XXXXXXXXX" when it is a valid Pakistani mobile number. */
function normaliseMobile(input: string) {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('92')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? d : null;
}

function FeatureIcon({ specs }: { specs: IconSpec[] }) {
  return (
    <View style={{ width: 52, height: 46, alignItems: 'center', justifyContent: 'center' }}>
      {specs.map((s, i) =>
        s.accent ? (
          <Ionicons key={i} name={s.name as never} size={18} color={colors.amber} style={{ position: 'absolute', top: -2, right: 2 }} />
        ) : s.family === 'mci' ? (
          <MaterialCommunityIcons key={i} name={s.name as never} size={42} color={colors.teal} />
        ) : (
          <Ionicons key={i} name={s.name as never} size={40} color={colors.teal} />
        ),
      )}
    </View>
  );
}

function Hero({ width }: { width: number }) {
  const { t, ur } = useT();
  const sliderHeight = Math.round((width - 10) / 1.5); // photos are 3:2

  return (
    <View>
      <View style={{ marginTop: spacing.xl }}>
        <SparkMarks style={{ position: 'absolute', left: -14, top: -22 }} />
        <View style={styles.sliderFrame}>
          <BeforeAfter
            height={sliderHeight}
            before={<Image source={require('../../assets/images/onboarding-before.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />}
            after={<Image source={require('../../assets/images/onboarding-after.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />}
          />
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: ur ? spacing.sm : spacing.lg }}>
        <HouseDivider />
      </View>

      <Text style={[styles.heroTop, ur && styles.heroTopUr]}>{t('ob.heroTop')}</Text>
      <View style={{ alignItems: 'center' }}>
        <Text style={[styles.heroHighlight, ur && styles.heroHighlightUr]}>
          {t('ob.heroHighlight')}
          <Text style={{ color: colors.navy }}>!</Text>
        </Text>
        <View style={{ marginTop: ur ? -16 : -2 }}>
          <Swash width={ur ? 190 : 210} />
        </View>
      </View>

      <Text style={[styles.heroBody, ur && styles.heroBodyUr]}>{t('ob.heroBody')}</Text>

      <View style={[styles.features, { flexDirection: ur ? 'row-reverse' : 'row' }, ur && { marginTop: spacing.md }]}>
        {FEATURES.map((key, i) => (
          <View key={key} style={styles.feature}>
            <FeatureIcon specs={FEATURE_ICONS[i]} />
            <Text style={[styles.featureText, ur && styles.featureTextUr]}>{t(key)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function QuotesArt() {
  const { t } = useT();
  // Two decimals so the three sample quotes stay distinct (1.15 / 1.19 / 1.33 lac).
  const lac = (n: number) => `PKR ${(n / 100000).toFixed(2)} ${t('unit.lac')}`;
  return (
    <View style={{ gap: spacing.md }}>
      {SAMPLE_QUOTES.map((q) => (
        <View key={q.name} style={[styles.quote, q.best && styles.quoteBest]}>
          <View style={styles.quoteIcon}>
            <MaterialCommunityIcons name={q.icon} size={26} color={q.icon === 'tools' ? colors.navy : colors.teal} />
          </View>
          <View style={{ flex: 1 }}>
            <Row gap={6}>
              <T variant="bodyStrong" numberOfLines={1} style={{ color: colors.navy, fontFamily: fonts.bold, flexShrink: 1 }}>{q.name}</T>
              <MaterialCommunityIcons name="check-decagram" size={16} color={colors.teal} />
            </Row>
            <Row gap={4} style={{ marginTop: 2 }}>
              <Ionicons name="star" size={13} color={colors.amber} />
              <T variant="small">{q.rating} · {t('common.days', { n: q.days })}</T>
            </Row>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <T variant="bodyStrong" style={{ color: colors.navy, fontFamily: fonts.bold }}>{lac(q.price)}</T>
            {q.best && <Badge label={t('ob.bestMatch')} tone="amber" />}
          </View>
        </View>
      ))}
    </View>
  );
}

function EscrowArt() {
  const { t } = useT();
  const rows: { label: TKey; pct: string; state: 'paid' | 'escrow' | 'upcoming' }[] = [
    { label: 'ob.m1', pct: '30%', state: 'paid' },
    { label: 'ob.m2', pct: '40%', state: 'escrow' },
    { label: 'ob.m3', pct: '30%', state: 'upcoming' },
  ];
  return (
    <View style={styles.escrow}>
      {rows.map((r, i) => (
        <Row key={r.label} gap={spacing.md} style={[styles.escrowRow, i > 0 && styles.escrowDivider]}>
          {r.state === 'paid' ? (
            <Ionicons name="checkmark-circle" size={28} color={colors.success} />
          ) : r.state === 'escrow' ? (
            <MaterialCommunityIcons name="lock" size={28} color={colors.amber} />
          ) : (
            <Ionicons name="ellipse-outline" size={28} color="#5B6B82" />
          )}
          <T variant="bodyStrong" style={{ flex: 1, color: colors.navy, fontSize: 15.5 }}>{t(r.label)}</T>
          <T variant="small" style={styles.escrowPct}>{r.pct}</T>
          {/* Fixed-width column so the badges line up and sit centred in the row. */}
          <View style={styles.escrowBadge}>
            <Badge
              label={r.state === 'paid' ? t('ob.paid') : r.state === 'escrow' ? t('ob.inEscrow') : t('ob.upcoming')}
              tone={r.state === 'paid' ? 'green' : r.state === 'escrow' ? 'amber' : 'gray'}
            />
          </View>
        </Row>
      ))}
    </View>
  );
}

function Slide({ index }: { index: number }) {
  const { t } = useT();
  const s = SLIDES[index - 1];
  return (
    <View style={{ flex: 1, marginTop: spacing.xl }}>
      {index === 1 ? <QuotesArt /> : <EscrowArt />}
      <T style={styles.overline}>{t(s.overline)}</T>
      <T style={styles.slideTitle}>{t(s.title)}</T>
      <T style={styles.slideBody}>{t(s.body)}</T>
    </View>
  );
}

function Welcome({ phone, setPhone, onPhone }: { phone: string; setPhone: (p: string) => void; onPhone: (mobile: string) => void }) {
  const { t } = useT();
  const { enabled } = useAuth();

  return (
    <View style={{ marginTop: spacing.lg }}>
      <View style={styles.collage}>
        <SparkMarks style={{ position: 'absolute', right: 34, top: -8, transform: [{ scaleX: -1 }] }} />
        <View style={[styles.photoCard, { transform: [{ rotate: '-5deg' }], marginRight: -18, zIndex: 1 }]}>
          <Image source={require('../../assets/images/onboarding-before.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
        <View style={[styles.photoCard, { transform: [{ rotate: '4deg' }], zIndex: 2 }]}>
          <Image source={require('../../assets/images/onboarding-after.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
      </View>

      <T style={styles.welcomeTitle}>{t('auth.welcome')}</T>
      <T style={styles.welcomeSub}>{t('auth.sub')}</T>

      <View style={{ marginTop: spacing.lg }}>
        {enabled ? <AccountSignIn /> : <OnDeviceSignIn phone={phone} setPhone={setPhone} onPhone={onPhone} />}
      </View>
    </View>
  );
}

/** Used when no Supabase project is configured: the profile stays on this device only. */
function OnDeviceSignIn({ phone, setPhone, onPhone }: { phone: string; setPhone: (p: string) => void; onPhone: (mobile: string) => void }) {
  const { t, ur } = useT();
  const [notice, setNotice] = useState('');
  const soon = (provider: string) => setNotice(t('auth.soon', { provider }));
  const submitPhone = () => {
    const mobile = normaliseMobile(phone);
    if (!mobile) return setNotice(t('auth.phoneInvalid'));
    setNotice('');
    onPhone(mobile);
  };

  return (
    <View>
      <View style={{ gap: spacing.sm }}>
        <SocialButton label={t('auth.google')} icon={<GoogleMark />} onPress={() => soon('Google')} />
        <SocialButton label={t('auth.apple')} icon={<Ionicons name="logo-apple" size={22} color="#000" />} onPress={() => soon('Apple')} />
      </View>

      <OrDivider label={t('auth.or')} />

      <View style={styles.phoneField}>
        <Row gap={6} style={styles.dial}>
          <PakistanFlag />
          <Text style={styles.dialText}>+92</Text>
          <Ionicons name="chevron-down" size={14} color={colors.navy} />
        </Row>
        <TextInput
          value={phone}
          onChangeText={(p) => {
            setPhone(p);
            setNotice('');
          }}
          placeholder="3XX XXXXXXX"
          placeholderTextColor={colors.textSubtle}
          keyboardType="phone-pad"
          maxLength={13}
          onSubmitEditing={submitPhone}
          style={styles.phoneInput}
          accessibilityLabel={t('auth.phoneA11y')}
        />
      </View>
      {!!notice && <T variant="caption" style={{ color: colors.amberDark, marginTop: 6, textAlign: ur ? 'right' : 'left' }}>{notice}</T>}

      <View style={{ marginTop: spacing.md }}>
        <NextButton title={t('auth.phone')} onPress={submitPhone} urdu={ur} compact />
      </View>

      <Pressable onPress={() => soon(t('auth.emailProvider'))} hitSlop={8} style={{ alignSelf: 'center', marginTop: spacing.md }}>
        <T variant="bodyStrong" style={{ color: colors.navy, textDecorationLine: 'underline' }}>{t('auth.email')}</T>
      </Pressable>

      <T variant="caption" style={styles.terms}>
        {t('auth.termsBefore')}{' '}
        <T variant="caption" style={{ color: colors.navy, fontFamily: fonts.bold }} onPress={() => Linking.openURL(config.termsUrl).catch(() => {})}>
          {t('auth.terms')}
        </T>
        {t('auth.termsAfter') ? ` ${t('auth.termsAfter')}` : ''}
      </T>
    </View>
  );
}

function Profile({ name, setName, phone, setPhone, city, setCity }: { name: string; setName: (v: string) => void; phone: string; setPhone: (v: string) => void; city: string; setCity: (v: string) => void }) {
  const { t } = useT();
  return (
    <View style={{ flex: 1, marginTop: spacing.xl }}>
      <T style={styles.profileTitle}>{t('ob.setup')}</T>
      <T style={styles.profileSub}>{t('ob.cityUse')}</T>

      <T variant="bodyStrong" style={styles.label}>{t('ob.yourName')}</T>
      <IconField icon="person-outline" value={name} onChangeText={setName} placeholder={t('ob.namePh')} autoCapitalize="words" />

      <T variant="bodyStrong" style={styles.label}>{t('ob.mobileOpt')}</T>
      <IconField icon="call-outline" value={phone} onChangeText={setPhone} placeholder="03XX XXXXXXX" keyboardType="phone-pad" maxLength={13} />

      <T variant="bodyStrong" style={styles.label}>{t('ob.yourCity')}</T>
      <Row style={{ flexWrap: 'wrap' }} gap={spacing.sm}>
        {config.cities.map((ct) => {
          const on = city === ct;
          return (
            <Pressable
              key={ct}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                tap();
                setCity(ct);
              }}
              style={[styles.cityChip, on && styles.cityChipOn]}
            >
              <Ionicons name={on ? 'location' : 'location-outline'} size={16} color={on ? colors.white : colors.navy} />
              <Txt style={[styles.cityText, on && { color: colors.white }]}>{cityLabel(ct)}</Txt>
            </Pressable>
          );
        })}
      </Row>
      <T variant="small" style={{ marginTop: spacing.md }}>{t('ob.launching')}</T>
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { t, ur } = useT();
  const auth = useAuth();
  const { setUser, completeOnboarding, user } = useApp();
  const params = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState(params.step === 'profile' ? PROFILE : 0);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [signInPhone, setSignInPhone] = useState('');
  const [city, setCity] = useState<string>(user?.city ?? 'Sukkur');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Once signed in: a complete profile goes straight to its area; a new account fills in the profile step.
  const profile = auth.profile;
  useEffect(() => {
    if (!auth.enabled || !profile) return;
    if (profile.full_name) router.replace('/');
    else {
      setPhone((p) => p || profile.phone);
      setStep(PROFILE);
    }
  }, [auth.enabled, profile, router]);

  const finish = async () => {
    if (auth.enabled) {
      if (!auth.session) return setStep(WELCOME);
      setSaving(true);
      const err = await auth.updateProfile({ full_name: name.trim(), phone: phone.trim(), city });
      setSaving(false);
      if (err) return setSaveError(err);
      return; // the effect above routes once the saved profile arrives
    }
    setUser({ name: name.trim(), phone: phone.trim(), city });
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const isSlide = step < SLIDE_COUNT;
  const contentWidth = Math.min(windowWidth, MAX_WIDTH) - spacing.xl * 2;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Houses flank the hero and the welcome collage; slides keep only the right one, beside the title; the form has none. */}
      <Backdrop
        houses={step === 0 || step === WELCOME ? 'both' : step === PROFILE ? 'none' : 'right'}
        houseTop={step === 0 ? '51%' : step === WELCOME ? '17%' : '33%'}
      />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 20 }}>
            <Row gap={spacing.sm} style={{ flexShrink: 1 }}>
              <Image source={require('../../assets/images/logo-mark.png')} style={{ width: 50, height: 50 }} contentFit="contain" />
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.wordmark} numberOfLines={1}>
                  Rennova<Text style={{ color: colors.teal }}>AI</Text>
                </Text>
                <Text style={styles.tagline} numberOfLines={1}>{t('ob.tagline')}</Text>
              </View>
            </Row>
            <LanguagePicker />
          </Row>

          {step === 0 && <Hero width={contentWidth} />}
          {step > 0 && isSlide && <Slide index={step} />}
          {step === WELCOME && (
            <Welcome
              phone={signInPhone}
              setPhone={setSignInPhone}
              onPhone={(mobile) => {
                setPhone(`0${mobile.slice(0, 3)} ${mobile.slice(3)}`);
                setStep(PROFILE);
              }}
            />
          )}
          {step === PROFILE && <Profile name={name} setName={setName} phone={phone} setPhone={setPhone} city={city} setCity={setCity} />}
        </View>
      </ScrollView>

      {step !== WELCOME && (
        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.lg, paddingTop: spacing.sm }}>
          <View style={styles.column}>
            {step === PROFILE ? (
              <>
                {!!saveError && <T variant="small" style={{ color: colors.danger, marginBottom: spacing.sm }}>{saveError}</T>}
                <NextButton title={t('ob.continue')} onPress={finish} urdu={ur} disabled={name.trim().length < 2} loading={saving} />
              </>
            ) : (
              <>
                <NextButton title={step === SLIDE_COUNT - 1 ? t('ob.getStarted') : t('ob.next')} onPress={() => setStep(step + 1)} urdu={ur} />
                <Row style={{ justifyContent: 'center', marginTop: spacing.lg }} gap={10}>
                  {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                    <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
                  ))}
                </Row>
              </>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  column: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flexGrow: 1 },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 29, color: colors.navy, letterSpacing: -0.5 },
  tagline: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted, marginTop: 1 },

  sliderFrame: { padding: 5, borderRadius: radius.xl + 5, backgroundColor: colors.white, ...shadow.raised },

  heroTop: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: colors.navy, textAlign: 'center', marginTop: spacing.sm },
  // Nastaliq glyphs run tall; these line heights are the tightest that don't clip ascenders/descenders.
  heroTopUr: { fontFamily: fonts.urduBold, fontSize: 25, lineHeight: 54, writingDirection: 'rtl', marginTop: 0 },
  heroHighlight: { fontFamily: fonts.extrabold, fontSize: 31, lineHeight: 38, color: colors.teal, textAlign: 'center' },
  heroHighlightUr: { fontFamily: fonts.urduBold, fontSize: 30, lineHeight: 64, writingDirection: 'rtl', marginTop: -6 },
  heroBody: { fontFamily: fonts.medium, fontSize: 14.5, lineHeight: 22, color: colors.text, textAlign: 'center', marginTop: spacing.md, paddingHorizontal: spacing.sm },
  heroBodyUr: { fontFamily: fonts.urdu, fontSize: 13.5, lineHeight: 31, writingDirection: 'rtl', marginTop: spacing.xs },

  features: { gap: spacing.md, marginTop: spacing.xl },
  feature: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(230,247,244,0.75)',
    borderWidth: 1,
    borderColor: '#D3EFE9',
  },
  featureText: { fontFamily: fonts.semibold, fontSize: 12.5, lineHeight: 17, color: colors.navy, textAlign: 'center', marginTop: spacing.sm },
  featureTextUr: { fontFamily: fonts.urdu, fontSize: 12, lineHeight: 27, writingDirection: 'rtl', marginTop: 0 },

  // Slides 2–3
  quote: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: '#E4ECEF', ...shadow.card },
  quoteBest: { borderWidth: 1.5, borderColor: colors.teal },
  quoteIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  escrow: { borderRadius: radius.xl, backgroundColor: colors.white, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: '#E4ECEF', ...shadow.card },
  escrowRow: { paddingVertical: spacing.lg },
  escrowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  escrowPct: { color: colors.text, fontSize: 14, minWidth: 40, textAlign: 'right' },
  // Row + flex-end: Badge sets alignSelf itself, so alignItems on a column wouldn't right-align it.
  escrowBadge: { width: 104, flexDirection: 'row', justifyContent: 'flex-end' },
  overline: { fontFamily: fonts.bold, fontSize: 12.5, lineHeight: 16, color: colors.amber, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: spacing.xxl },
  slideTitle: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, color: colors.navy, letterSpacing: -0.5, marginTop: spacing.sm },
  slideBody: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.textMuted, marginTop: spacing.md },

  // Welcome / sign-in
  collage: { height: 150, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  photoCard: { width: 136, height: 118, borderRadius: 14, overflow: 'hidden', borderWidth: 4, borderColor: colors.white, backgroundColor: colors.border, ...shadow.raised },
  welcomeTitle: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, color: colors.navy, textAlign: 'center', marginTop: spacing.lg },
  welcomeSub: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  social: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EA', backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, ...shadow.card },
  socialText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.navy },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#CBD5DD' },
  phoneField: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EA', backgroundColor: colors.white, overflow: 'hidden' },
  dial: { paddingHorizontal: spacing.md, height: '100%', borderRightWidth: 1, borderColor: '#DCE5EA' },
  dialText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.navy },
  phoneInput: { flex: 1, height: '100%', paddingHorizontal: spacing.md, fontFamily: fonts.medium, fontSize: 15.5, color: colors.text },
  terms: { textAlign: 'center', marginTop: spacing.lg, color: colors.textMuted, fontSize: 12 },

  // Profile
  profileTitle: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 38, color: colors.navy, letterSpacing: -0.5 },
  profileSub: { fontFamily: fonts.medium, fontSize: 15.5, lineHeight: 22, color: colors.textMuted, marginTop: spacing.sm },
  label: { marginTop: spacing.lg, marginBottom: spacing.sm, color: colors.navy, fontFamily: fonts.bold },
  iconField: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, height: 52, paddingHorizontal: spacing.lg, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EA', backgroundColor: colors.white },
  iconFieldInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  cityChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, height: 42, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EA', backgroundColor: colors.white },
  cityChipOn: { backgroundColor: colors.tealDeep, borderColor: colors.tealDeep },
  cityText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.navy },

  nextShadow: { borderRadius: 999, shadowColor: colors.tealDark, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  next: { height: 60, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  nextCompact: { height: 54, borderRadius: 16 },
  nextText: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  nextTextUr: { fontFamily: fonts.urduBold, fontSize: 19, lineHeight: 42 },

  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#D5DCE4' },
  dotActive: { backgroundColor: colors.teal },
});
