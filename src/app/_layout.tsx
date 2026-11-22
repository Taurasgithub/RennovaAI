import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/montserrat';
import { NotoNastaliqUrdu_400Regular, NotoNastaliqUrdu_700Bold } from '@expo-google-fonts/noto-nastaliq-urdu';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../auth/AuthProvider';
import { CrashScreen } from '../components/CrashScreen';
import { installCrashHandler, setCrashScreen } from '../lib/crash';
import { useApp } from '../store/useApp';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
installCrashHandler();

/** A screen that crashes shows a friendly "Try again" page instead of a blank screen, and is reported. */
export const ErrorBoundary = CrashScreen;

// Icon fonts draw private-use glyphs that screen readers announce as junk characters. Icons here are
// decoration; buttons carry their own labels, so hide every icon from assistive tech by default.
for (const Icon of [Ionicons, MaterialCommunityIcons] as { defaultProps?: object }[]) {
  Icon.defaultProps = { ...Icon.defaultProps, 'aria-hidden': true };
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    NotoNastaliqUrdu_400Regular,
    NotoNastaliqUrdu_700Bold,
  });
  const pathname = usePathname();
  useEffect(() => setCrashScreen(pathname), [pathname]);
  const hydrated = useApp((s) => s.hydrated);
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="vendor-hub" options={{ animation: 'fade' }} />
          <Stack.Screen name="admin" options={{ animation: 'fade' }} />
          <Stack.Screen name="design/generate" options={{ gestureEnabled: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
