import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../auth/AuthProvider';
import { BrandTabBar } from '../../components/brand';
import type { IconName } from '../../components/ui';
import { useT } from '../../i18n';
import { useApp } from '../../store/useApp';

const icon = (name: IconName, active: IconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return <Ionicons name={focused ? active : name} size={22} color={color as string} />;
  };

export default function TabsLayout() {
  const { t } = useT();
  const auth = useAuth();
  const router = useRouter();
  const resetDraft = useApp((s) => s.resetDraft);
  // With accounts on, the customer app is for signed-in customers only; index.tsx routes everyone else.
  if (auth.enabled && auth.ready && auth.profile?.role !== 'customer') return <Redirect href="/" />;
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      // The amber sparkle in the middle starts a new design, like the sparkle in the logo.
      tabBar={(props) => (
        <BrandTabBar
          {...props}
          center={{
            label: t('tabs.newDesign'),
            onPress: () => {
              resetDraft();
              router.push('/design/capture');
            },
          }}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home'), tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="designs" options={{ title: t('tabs.designs'), tabBarIcon: icon('images-outline', 'images') }} />
      <Tabs.Screen name="vendors" options={{ title: t('tabs.vendors'), tabBarIcon: icon('people-outline', 'people') }} />
      <Tabs.Screen name="projects" options={{ title: t('tabs.projects'), tabBarIcon: icon('briefcase-outline', 'briefcase') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
