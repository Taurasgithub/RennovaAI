import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, Slot, Tabs, usePathname, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthProvider';
import { tap, Txt, type IconName } from '../../components/ui';
import { useT, type TKey } from '../../i18n';
import { colors, fonts, radius, spacing } from '../../theme';

const NAV: { href: '/admin' | '/admin/vendors' | '/admin/users' | '/admin/account'; name: string; label: TKey; icon: IconName; active: IconName }[] = [
  { href: '/admin', name: 'index', label: 'admin.tabOverview', icon: 'speedometer-outline', active: 'speedometer' },
  { href: '/admin/vendors', name: 'vendors', label: 'admin.tabVendors', icon: 'shield-checkmark-outline', active: 'shield-checkmark' },
  { href: '/admin/users', name: 'users', label: 'admin.tabUsers', icon: 'people-outline', active: 'people' },
  { href: '/admin/account', name: 'account', label: 'admin.tabAccount', icon: 'person-circle-outline', active: 'person-circle' },
];

/** Wide screens (the web admin panel) get a sidebar; phones get bottom tabs. Same screens either way. */
const WIDE = 900;

export default function AdminLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t, ur } = useT();
  const auth = useAuth();
  if (!auth.enabled || (auth.ready && auth.profile?.role !== 'admin')) return <Redirect href="/" />;
  // Don't mount admin screens (which query every account) until the role is known.
  if (!auth.ready || !auth.profile) return <ActivityIndicator color={colors.teal} style={{ flex: 1 }} />;

  if (width >= WIDE) return <Sidebar />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: ur ? { fontFamily: fonts.urdu, fontSize: 11.5, lineHeight: 26, height: 28 } : { fontFamily: fonts.semibold, fontSize: 11 },
        tabBarStyle: { height: (ur ? 76 : 62) + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6, borderTopColor: colors.border, backgroundColor: colors.white },
      }}
    >
      {NAV.map((n) => (
        <Tabs.Screen
          key={n.name}
          name={n.name}
          options={{ title: t(n.label), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? n.active : n.icon} size={22} color={color as string} /> }}
        />
      ))}
    </Tabs>
  );
}

function Sidebar() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <Image source={require('../../../assets/images/logo-mark.png')} style={{ width: 38, height: 38 }} contentFit="contain" />
          <View>
            <Text style={styles.wordmark}>
              Rennova<Text style={{ color: colors.teal }}>AI</Text>
            </Text>
            <Txt style={styles.brandSub}>{t('admin.panel')}</Txt>
          </View>
        </View>
        {NAV.map((n) => {
          const on = n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href);
          return (
            <Pressable
              key={n.href}
              accessibilityRole="link"
              accessibilityState={{ selected: on }}
              onPress={() => {
                tap();
                router.navigate(n.href);
              }}
              // `hovered` exists on web (react-native-web) but not in the native Pressable types.
              style={(state) => [styles.navItem, on && styles.navOn, (state as { hovered?: boolean }).hovered && !on && styles.navHover]}
            >
              <Ionicons name={on ? n.active : n.icon} size={19} color={on ? colors.white : 'rgba(255,255,255,0.75)'} />
              <Txt style={[styles.navText, on && { color: colors.white }]}>{t(n.label)}</Txt>
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <Txt style={styles.me} numberOfLines={1}>{profile?.email}</Txt>
      </View>
      <View style={styles.content}>
        <View style={styles.contentInner}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  sidebar: { width: 240, backgroundColor: colors.navy, paddingVertical: spacing.xl, paddingHorizontal: spacing.md, gap: 4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.xl },
  wordmark: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.white, letterSpacing: -0.4 },
  brandSub: { fontFamily: fonts.medium, fontSize: 11.5, color: 'rgba(255,255,255,0.6)' },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 11, borderRadius: radius.md },
  navOn: { backgroundColor: colors.tealDeep },
  navHover: { backgroundColor: 'rgba(255,255,255,0.08)' },
  navText: { fontFamily: fonts.semibold, fontSize: 14.5, color: 'rgba(255,255,255,0.8)' },
  me: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.55)', paddingHorizontal: spacing.sm },
  content: { flex: 1 },
  contentInner: { flex: 1, width: '100%', maxWidth: 1100, alignSelf: 'center' },
});
