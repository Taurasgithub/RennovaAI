import { Ionicons } from '@expo/vector-icons';
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '../i18n';
import { reportCrash } from '../lib/crash';
import { colors, radius, spacing } from '../theme';

/**
 * Shown instead of a blank screen when a screen crashes (Expo Router ErrorBoundary).
 * Self-contained on purpose: it can render outside the app's providers and before fonts load,
 * so it uses the system font and no shared components.
 */
export function CrashScreen({ error, retry }: ErrorBoundaryProps) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  useEffect(() => reportCrash(error, true), [error]);

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.icon}>
        <Ionicons name="construct-outline" size={40} color={colors.tealDark} />
      </View>
      <Text style={styles.title}>{t('crash.title')}</Text>
      <Text style={styles.body}>{t('crash.body')}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('crash.retry')}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          await retry().catch(() => {});
          setBusy(false);
        }}
        style={({ pressed }) => [styles.button, (pressed || busy) && { opacity: 0.8 }]}
      >
        <Text style={styles.buttonText}>{t('crash.retry')}</Text>
      </Pressable>
      {__DEV__ && <Text style={styles.dev}>{error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.bg },
  icon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tealTint },
  title: { marginTop: spacing.lg, fontSize: 20, fontWeight: '700', color: colors.navy, textAlign: 'center' },
  body: { marginTop: spacing.sm, fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', maxWidth: 320 },
  button: { marginTop: spacing.xl, minHeight: 48, paddingHorizontal: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.tealDark, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  dev: { marginTop: spacing.lg, fontSize: 12, color: colors.danger, textAlign: 'center' },
});
