import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { EmptyState } from '../../components/ui';
import { useT } from '../../i18n';
import { supabase } from '../../lib/supabase';
import { colors } from '../../theme';

/** Web OAuth / email-link landing page: trades the ?code= for a session, then hands off to the role router. */
export default function AuthCallback() {
  const { code, error_description } = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { t } = useT();
  const [state, setState] = useState<'working' | 'done' | 'failed'>(code ? 'working' : error_description ? 'failed' : 'done');

  useEffect(() => {
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(async ({ error }) => {
      // In the app the code may already have been exchanged by signInWithProvider before this route opens.
      const signedIn = !error || !!(await supabase.auth.getSession()).data.session;
      setState(signedIn ? 'done' : 'failed');
    });
  }, [code]);

  if (state === 'done') return <Redirect href="/" />;
  if (state === 'failed')
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <EmptyState icon="alert-circle-outline" title={t('auth.callbackFailed')} body={error_description ?? t('common.tryAgain')} />
      </View>
    );
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.teal} />
    </View>
  );
}
