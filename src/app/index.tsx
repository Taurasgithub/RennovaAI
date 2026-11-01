import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useApp } from '../store/useApp';
import { colors } from '../theme';

/** Entry router: sends each account type to its own area. */
export default function Index() {
  const { enabled, ready, session, profile } = useAuth();
  const onboarded = useApp((s) => s.onboarded && !!s.user);

  // No Supabase configured: on-device mode, as before.
  if (!enabled) return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;

  if (!ready || (session && !profile))
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  if (!session || !profile) return <Redirect href="/onboarding" />;
  if (!profile.full_name) return <Redirect href={{ pathname: '/onboarding', params: { step: 'profile' } }} />;
  if (profile.role === 'admin') return <Redirect href="/admin" />;
  if (profile.role === 'vendor') return <Redirect href="/vendor-hub" />;
  return <Redirect href="/(tabs)" />;
}
