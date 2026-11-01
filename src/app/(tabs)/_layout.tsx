import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '../../components/ui';
import { useT } from '../../i18n';
import { colors, fonts } from '../../theme';

const icon = (name: IconName, active: IconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return <Ionicons name={focused ? active : name} size={23} color={color as string} />;
  };

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t, ur } = useT();
  const auth = useAuth();
  // With accounts on, the customer app is for signed-in customers only; index.tsx routes everyone else.
  if (auth.enabled && auth.ready && auth.profile?.role !== 'customer') return <Redirect href="/" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tealDark,
        tabBarInactiveTintColor: colors.textSubtle,
        // Nastaliq labels need extra height or their descenders get clipped.
        tabBarLabelStyle: ur ? { fontFamily: fonts.urdu, fontSize: 11.5, lineHeight: 26, height: 28 } : { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: { height: (ur ? 76 : 62) + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6, borderTopColor: colors.border, backgroundColor: colors.white },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="designs" options={{ title: t('tabs.designs'), tabBarIcon: icon('color-palette-outline', 'color-palette') }} />
      <Tabs.Screen name="vendors" options={{ title: t('tabs.vendors'), tabBarIcon: icon('people-outline', 'people') }} />
      <Tabs.Screen name="projects" options={{ title: t('tabs.projects'), tabBarIcon: icon('construct-outline', 'construct') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: icon('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
