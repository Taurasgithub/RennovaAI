import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { EmptyState } from '../../components/ui';
import { useRecovery } from '../../auth/recovery';
import { useT } from '../../i18n';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme';

/** Web OAuth / email-link landing page: trades the ?code= for a session, then hands off to the role router. */
export default function AuthCallback() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { t } = useT();
  const [state, setState] = useState<'working' | 'done' | 'reset' | 'failed'>(code ? 'working' : error_description ? 'failed' : 'done');

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      // A password-reset link: sign-in happened, now ask for the new password.
      // auth-js returns redirectType at runtime but its typings leave it out.
      if (!error && (data as { redirectType?: string | null }).redirectType === 'recovery') {
        useRecovery.getState().setActive(true);
        return setState('reset');
      }
      // In the app the code may already have been exchanged by signInWithProvider before this route opens.
      const signedIn = !error || !!(await supabase.auth.getSession()).data.session;
      setState(signedIn ? (useRecovery.getState().active ? 'reset' : 'done') : 'failed');
    });
  }, [code]);

  if (state === 'reset') return <Redirect href="/auth/reset-password" />;
  if (state === 'done') return <Redirect href="/" />;
  if (state === 'failed')
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <EmptyState icon="alert-circle-outline" title={t('auth.callbackFailed')} body={error_description ?? t('auth.callbackFailedBody')} />
      </View>
    );
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.teal} />
    </View>
  );
}
