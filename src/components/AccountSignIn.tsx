import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { AUTH_ERRORS, signInWithEmail, signInWithProvider, signUpWithEmail, sendPasswordReset } from '../auth/actions';
import { useAuth } from '../auth/AuthProvider';
import { config } from '../config';
import { useT, type TKey } from '../i18n';
import { colors, fonts, radius, spacing } from '../theme';
import { GoogleMark, GradientButton, IconField, OrDivider, SocialButton } from './OnboardingParts';
import { T, tap, Txt } from './ui';

type AccountType = 'customer' | 'vendor';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** Real sign-in (Supabase): account type, Google / Apple, and email + password. */
export function AccountSignIn() {
  const { t, ur } = useT();
  const { notice, clearNotice } = useAuth();
  const [type, setType] = useState<AccountType>('customer');
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice === 'suspended' ? t('auth.suspended') : '');
  const [info, setInfo] = useState('');

  const reset = () => {
    setError('');
    setInfo('');
    clearNotice();
  };

  const run = async (fn: () => Promise<{ error?: string; needsConfirmation?: boolean }>) => {
    reset();
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.error) setError((AUTH_ERRORS as readonly string[]).includes(res.error) ? t(`auth.err.${res.error}` as TKey) : res.error);
    else if (res.needsConfirmation) {
      setInfo(t('auth.checkEmail', { email: email.trim() }));
      setMode('signin');
    }
    // On success the AuthProvider picks up the session and onboarding moves on.
  };

  const submitEmail = () => {
    if (!EMAIL.test(email.trim())) return setError(t('auth.emailInvalid'));
    if (mode === 'signup' && password.length < MIN_PASSWORD) return setError(t('auth.passwordShort', { n: MIN_PASSWORD }));
    if (!password) return setError(t('auth.passwordMissing'));
    run(() => (mode === 'signup' ? signUpWithEmail(email, password, type) : signInWithEmail(email, password)));
  };

  const forgot = () => {
    if (!EMAIL.test(email.trim())) return setError(t('auth.emailInvalid'));
    run(async () => {
      const res = await sendPasswordReset(email);
      if (!res.error) setInfo(t('auth.resetSent', { email: email.trim() }));
      return res;
    });
  };

  return (
    <View>
      <T variant="bodyStrong" style={styles.label}>{t('auth.iAm')}</T>
      <View style={styles.segment}>
        {(['customer', 'vendor'] as const).map((k) => {
          const on = type === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => {
                tap();
                setType(k);
              }}
              style={[styles.segmentItem, on && styles.segmentOn]}
            >
              <Ionicons name={k === 'customer' ? 'home-outline' : 'construct-outline'} size={17} color={on ? colors.white : colors.navy} />
              <Txt style={[styles.segmentText, on && { color: colors.white }]}>{t(k === 'customer' ? 'auth.customer' : 'auth.vendor')}</Txt>
            </Pressable>
          );
        })}
      </View>
      {mode === 'signin' && <T variant="caption" style={{ marginTop: 6 }}>{t('auth.typeHint')}</T>}

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <SocialButton label={t('auth.google')} icon={<GoogleMark />} disabled={busy} onPress={() => run(() => signInWithProvider('google', type))} />
        {/* Apple sign-in is required on iOS when Google is offered; on Android/web it is optional but harmless. */}
        <SocialButton label={t('auth.apple')} icon={<Ionicons name="logo-apple" size={22} color="#000" />} disabled={busy} onPress={() => run(() => signInWithProvider('apple', type))} />
      </View>

      <OrDivider label={t('auth.or')} />

      <View style={{ gap: spacing.sm }}>
        <IconField
          icon="mail-outline"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            reset();
          }}
          placeholder={t('auth.emailPh')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          accessibilityLabel={t('auth.emailPh')}
        />
        <IconField
          icon="lock-closed-outline"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            reset();
          }}
          placeholder={mode === 'signup' ? t('auth.passwordNewPh', { n: MIN_PASSWORD }) : t('auth.passwordPh')}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          onSubmitEditing={submitEmail}
          accessibilityLabel={t('auth.passwordPh')}
          right={
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} accessibilityLabel={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </Pressable>
          }
        />
      </View>

      {!!error && <T variant="small" style={[styles.message, { color: colors.danger }]}>{error}</T>}
      {!!info && <T variant="small" style={[styles.message, { color: colors.tealDeep }]}>{info}</T>}

      <View style={{ marginTop: spacing.md }}>
        <GradientButton title={t(mode === 'signup' ? 'auth.createAccount' : 'auth.signIn')} onPress={submitEmail} urdu={ur} loading={busy} compact />
      </View>

      <View style={styles.links}>
        <Pressable
          hitSlop={8}
          onPress={() => {
            reset();
            setMode(mode === 'signup' ? 'signin' : 'signup');
          }}
        >
          <T variant="small" style={styles.link}>{t(mode === 'signup' ? 'auth.haveAccount' : 'auth.newHere')}</T>
        </Pressable>
        {mode === 'signin' && (
          <Pressable hitSlop={8} onPress={forgot}>
            <T variant="small" style={styles.link}>{t('auth.forgot')}</T>
          </Pressable>
        )}
      </View>

      <T variant="caption" style={styles.terms}>
        {t('auth.termsBefore')}{' '}
        <T variant="caption" style={{ color: colors.navy, fontFamily: fonts.bold }} onPress={() => Linking.openURL(config.termsUrl).catch(() => {})}>
          {t('auth.terms')}
        </T>
        {t('auth.termsAfter') ? ` ${t('auth.termsAfter')}` : ''}
      </T>
      {Platform.OS !== 'web' && <View style={{ height: spacing.lg }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.navy, fontFamily: fonts.bold, marginBottom: spacing.sm },
  segment: { flexDirection: 'row', gap: spacing.sm },
  segmentItem: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EA', backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segmentOn: { backgroundColor: colors.tealDeep, borderColor: colors.tealDeep },
  segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.navy },
  message: { marginTop: spacing.sm },
  links: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md, borderRadius: radius.sm },
  link: { color: colors.navy, fontFamily: fonts.semibold, textDecorationLine: 'underline' },
  terms: { textAlign: 'center', marginTop: spacing.lg, color: colors.textMuted, fontSize: 12 },
});
