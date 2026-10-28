import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '../../components/ui';
import { colors, fonts } from '../../theme';

const icon = (name: IconName, active: IconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return <Ionicons name={focused ? active : name} size={23} color={color as string} />;
  };

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tealDark,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: { height: 62 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6, borderTopColor: colors.border, backgroundColor: colors.white },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="designs" options={{ title: 'Designs', tabBarIcon: icon('color-palette-outline', 'color-palette') }} />
      <Tabs.Screen name="vendors" options={{ title: 'Vendors', tabBarIcon: icon('people-outline', 'people') }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects', tabBarIcon: icon('construct-outline', 'construct') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-circle-outline', 'person-circle') }} />
    </Tabs>
  );
}
