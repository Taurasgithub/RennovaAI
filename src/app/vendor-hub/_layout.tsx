import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { BrandTabBar } from '../../components/brand';
import { useT } from '../../i18n';
import { colors } from '../../theme';

/** Vendor accounts' own area. Only signed-in vendors get in; everyone else is routed by index.tsx. */
export default function VendorHubLayout() {
  const { t } = useT();
  const auth = useAuth();
  if (!auth.enabled || (auth.ready && auth.profile?.role !== 'vendor')) return <Redirect href="/" />;
  if (!auth.ready || !auth.profile) return <ActivityIndicator color={colors.teal} style={{ flex: 1 }} />;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BrandTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('vendorHub.tabDashboard'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color as string} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t('vendorHub.tabAccount'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={23} color={color as string} /> }}
      />
    </Tabs>
  );
}
