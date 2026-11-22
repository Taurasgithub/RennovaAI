import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '../../auth/AuthProvider';
import { useRecovery } from '../../auth/recovery';
import { Celebrate } from '../../components/Celebrate';
import { GradientButton, IconField } from '../../components/OnboardingParts';
import { EmptyState, Row, Screen, T } from '../../components/ui';
import { useT, type TKey } from '../../i18n';
import { isStrongPassword, MIN_PASSWORD, passwordChecks } from '../../lib/password';
import { supabase } from '../../lib/supabase';
import { colors, fonts, spacing } from '../../theme';

const RULES: { key: keyof ReturnType<typeof passwordChecks>; label: TKey }[] = [
  { key: 'length', label: 'reset.ruleLength' },
  { key: 'upper', label: 'reset.ruleUpper' },
  { key: 'lower', label: 'reset.ruleLower' },
  { key: 'digit', label: 'reset.ruleDigit' },
  { key: 'symbol', label: 'reset.ruleSymbol' },
];

/**
 * "Set new password": reached from the password-reset email (app/auth/callback.tsx signs the user in
 * with the link, then sends them here). Uses the same rules as sign-up (lib/password.ts).
 */
export default function ResetPassword() {
  const { t, ur } = useT();
  const router = useRouter();
  const { session, ready, profile } = useAuth();
  const setRecovering = useRecovery((s) => s.setActive);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // After saving: show the success tick for a moment, then open the dashboard for this account's role.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      const home = !profile?.full_name ? '/' : profile.role === 'admin' ? '/admin' : profile.role === 'vendor' ? '/vendor-hub' : '/(tabs)';
      if (router.canDismiss()) router.dismissAll(); // drop the sign-in screen left underneath
      router.replace(home);
      setRecovering(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [done, profile, router, setRecovering]);

  if (ready && !session && !done) {
    return (
      <Screen back={false}>
        <EmptyState icon="time-outline" title={t('reset.expiredTitle')} body={t('reset.expiredBody')} action={t('reset.backToSignIn')} onAction={() => router.replace('/onboarding')} />
      </Screen>
    );
  }

  const checks = passwordChecks(password);
  const submit = async () => {
    setError('');
    if (!isStrongPassword(password) || password.length < MIN_PASSWORD) return setError(t('auth.passwordRulesHint'));
    if (password !== confirm) return setError(t('reset.mismatch'));
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (!err) return setDone(true);
    if (err.code === 'same_password') return setError(t('reset.samePassword'));
    if (err.code === 'weak_password') return setError(t('auth.err.weak_password'));
    if (/session|jwt|auth/i.test(err.message)) return setError(t('reset.expiredBody'));
    setError(err.message);
  };

  const eye = (
    <Pressable onPress={() => setShow(!show)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t(show ? 'auth.hidePassword' : 'auth.showPassword')}>
      <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <>
    <Screen title={t('reset.title')} back={false}>
      <T style={{ marginTop: spacing.sm }}>{t('reset.body')}</T>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <IconField
          icon="lock-closed-outline"
          value={password}
          onChangeText={(v) => { setPassword(v); setError(''); }}
          placeholder={t('reset.newPh')}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          accessibilityLabel={t('reset.newPh')}
          right={eye}
        />
        <IconField
          icon="shield-checkmark-outline"
          value={confirm}
          onChangeText={(v) => { setConfirm(v); setError(''); }}
          placeholder={t('reset.confirmPh')}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
          accessibilityLabel={t('reset.confirmPh')}
        />
      </View>

      {/* Live checklist of the password rules */}
      <View style={styles.rules}>
        {RULES.map((r) => {
          const ok = checks[r.key];
          return (
            <Row key={r.key} gap={8}>
              <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={ok ? colors.tealDark : colors.textSubtle} />
              <T variant="small" style={{ color: ok ? colors.tealDark : colors.textMuted, fontFamily: ok ? fonts.semibold : fonts.medium }}>{t(r.label, { n: MIN_PASSWORD })}</T>
            </Row>
          );
        })}
        {!!confirm && (
          <Row gap={8}>
            <Ionicons name={confirm === password ? 'checkmark-circle' : 'close-circle-outline'} size={17} color={confirm === password ? colors.tealDark : colors.danger} />
            <T variant="small" style={{ color: confirm === password ? colors.tealDark : colors.danger }}>{t(confirm === password ? 'reset.matches' : 'reset.mismatch')}</T>
          </Row>
        )}
      </View>

      {!!error && <T variant="small" style={{ color: colors.danger, marginTop: spacing.md }}>{error}</T>}

      <View style={{ marginTop: spacing.xl }}>
        <GradientButton title={t('reset.save')} onPress={submit} urdu={ur} loading={busy} />
      </View>
    </Screen>
    {done && (
      <Animated.View entering={FadeIn.duration(220)} style={styles.overlay} accessibilityLiveRegion="assertive" accessibilityRole="alert">
        <View style={styles.burst}>
          <Celebrate trigger="saved" />
          <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.tick}>
            <Ionicons name="checkmark" size={64} color="#FFFFFF" />
          </Animated.View>
        </View>
        <T variant="h2" style={styles.doneTitle}>{t('reset.doneTitle')}</T>
        <T style={styles.doneBody}>{t('reset.doneBody')}</T>
      </Animated.View>
    )}
    </>
  );
}

const GREEN = '#16A34A';

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.97)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  burst: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 112, height: 112, borderRadius: 56, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  doneTitle: { marginTop: spacing.lg, color: GREEN, textAlign: 'center' },
  doneBody: { marginTop: spacing.sm, textAlign: 'center', color: colors.textMuted },
  rules: { marginTop: spacing.lg, gap: 8, padding: spacing.md, borderRadius: 14, backgroundColor: colors.tealTint },
});
