import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { admin, toneColors, type AdminTone } from '../../theme/admin';
import { fonts, spacing } from '../../theme';
import { Sparkle } from '../brand';
import { CountUp, Skeleton, Tappable } from '../motion';
import { Screen, tap, Txt, type IconName } from '../ui';

/**
 * Admin console kit. Components take variants (solid / soft / outline / ghost, tone, size) instead of
 * ad-hoc styles, and use only the semantic tokens in theme/admin.ts.
 */

/* ---------- Screen with the gradient backdrop ---------- */

/** The console backdrop: a pale background with the logo-teal band across the top. */
export function AdminBackdrop() {
  const insets = useSafeAreaInsets();
  // The teal band covers the status bar and the screen title; cards scroll up over it.
  return (
    <LinearGradient pointerEvents="none" colors={admin.band} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.band, { height: insets.top + BAND_HEIGHT }]}>
      <Sparkle size={110} color="rgba(255,255,255,0.07)" style={styles.bandSparkle} />
    </LinearGradient>
  );
}

/** Height of the teal band below the status bar: it ends just inside the first row of cards. */
const BAND_HEIGHT = 168;

/** Every admin screen: the shared Screen (keyboard handling, staggered entrance) over the backdrop. */
export function AdminScreen(props: Omit<ComponentProps<typeof Screen>, 'bg' | 'back'>) {
  return (
    <View style={{ flex: 1, backgroundColor: admin.background }}>
      <StatusBar style="light" />
      <AdminBackdrop />
      <Screen back={false} bg="transparent" {...props} />
    </View>
  );
}

/* ---------- Header ---------- */

export function AdminHeader({ kicker, title, sub, right }: { kicker: string; title: string; sub?: string; right?: ReactNode }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={styles.headerRow}>
        <View style={styles.kicker}>
          <Sparkle size={11} color={admin.attention} />
          <Txt style={styles.kickerText}>{kicker}</Txt>
        </View>
        {right}
      </View>
      <Txt style={styles.title}>{title}</Txt>
      {!!sub && <Txt style={styles.sub}>{sub}</Txt>}
    </View>
  );
}

/* ---------- Panel (card) ---------- */

type PanelVariant = 'default' | 'raised' | 'attention';
const panelVariant: Record<PanelVariant, ViewStyle> = {
  default: { backgroundColor: admin.card, borderColor: admin.border },
  raised: { backgroundColor: admin.cardRaised, borderColor: admin.border },
  attention: { backgroundColor: admin.card, borderColor: admin.attentionLine },
};

export function Panel({ children, variant = 'default', onPress, style, accessibilityLabel }: { children: ReactNode; variant?: PanelVariant; onPress?: () => void; style?: StyleProp<ViewStyle>; accessibilityLabel?: string }) {
  const look = [styles.panel, panelVariant[variant], style];
  if (!onPress) return <View style={look}>{children}</View>;
  return (
    <Tappable scale={0.98} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={() => { tap(); onPress(); }} style={look}>
      {children}
    </Tappable>
  );
}

/* ---------- Button ---------- */

type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';

export function AdminButton({
  title,
  onPress,
  icon,
  variant = 'solid',
  tone = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  tone?: AdminTone;
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = toneColors[tone];
  const solidFg = tone === 'attention' ? admin.attentionForeground : admin.primaryForeground;
  const look: Record<ButtonVariant, { bg: string; border: string; fg: string }> = {
    solid: { bg: tone === 'primary' ? admin.primaryText : c.fill, border: 'transparent', fg: solidFg },
    soft: { bg: c.soft, border: 'transparent', fg: c.fg },
    outline: { bg: 'transparent', border: c.line, fg: c.fg },
    ghost: { bg: 'transparent', border: 'transparent', fg: c.fg },
  };
  const l = look[variant];
  const off = disabled || loading;
  return (
    <Tappable
      scale={0.95}
      accessibilityRole="button"
      aria-disabled={!!off}
      onPress={() => {
        if (off) return;
        tap();
        onPress();
      }}
      style={[styles.btn, size === 'sm' && styles.btnSm, { backgroundColor: l.bg, borderColor: l.border, opacity: off ? 0.5 : 1 }, style]}
    >
      {variant === 'solid' && tone === 'primary' && (
        <LinearGradient colors={admin.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: size === 'sm' ? 11 : 13 }]} />
      )}
      {loading ? (
        <ActivityIndicator color={l.fg} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={l.fg} />}
          <Txt style={[styles.btnText, size === 'sm' && { fontSize: 13 }, { color: l.fg }]}>{title}</Txt>
        </>
      )}
    </Tappable>
  );
}

/* ---------- Pill (badge) ---------- */

export function Pill({ label, tone = 'neutral', icon, dot }: { label: string; tone?: AdminTone; icon?: IconName; dot?: boolean }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.soft, borderColor: c.line }]}>
      {dot && <View style={[styles.dot, { backgroundColor: c.fg }]} />}
      {icon && <Ionicons name={icon} size={12} color={c.fg} />}
      <Txt style={[styles.pillText, { color: c.fg }]} numberOfLines={1}>{label}</Txt>
    </View>
  );
}

/* ---------- Segmented filter with a sliding highlight ---------- */

export function Segmented<K extends string>({ items, value, onChange }: { items: { id: K; label: string; count?: number; tone?: AdminTone }[]; value: K; onChange: (id: K) => void }) {
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const active = layouts[value];
  useEffect(() => {
    if (!active) return;
    const spring = { damping: 18, stiffness: 220, reduceMotion: ReduceMotion.System };
    x.set(withSpring(active.x, spring));
    w.set(withSpring(active.width, spring));
  }, [active, x, w]);
  const highlight = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: w.value }));
  const measure = (id: K) => (e: LayoutChangeEvent) => {
    const { x: lx, width } = e.nativeEvent.layout;
    setLayouts((prev) => (prev[id]?.x === lx && prev[id]?.width === width ? prev : { ...prev, [id]: { x: lx, width } }));
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.lg, flexGrow: 0 }} contentContainerStyle={styles.segTrack}>
      {!!active && <Animated.View style={[styles.segHighlight, highlight]} />}
      {items.map((it) => {
        const on = it.id === value;
        const countTone = toneColors[it.tone ?? 'neutral'];
        return (
          <Tappable key={it.id} scale={0.94} accessibilityRole="tab" aria-selected={on} onLayout={measure(it.id)} onPress={() => { tap(); onChange(it.id); }} style={styles.segItem}>
            <Txt style={[styles.segText, on && { color: admin.primaryForeground, fontFamily: fonts.bold }]}>{it.label}</Txt>
            {it.count !== undefined && (
              <View style={[styles.segCount, { backgroundColor: on ? 'rgba(255,255,255,0.22)' : countTone.soft }]}>
                <Txt style={[styles.segCountText, { color: on ? admin.primaryForeground : countTone.fg }]}>{it.count}</Txt>
              </View>
            )}
          </Tappable>
        );
      })}
    </ScrollView>
  );
}

/* ---------- Stat tile ---------- */

export function StatTile({ label, value, icon, tone = 'neutral', hint, onPress }: { label: string; value: number; icon: IconName; tone?: AdminTone; hint?: string; onPress?: () => void }) {
  const c = toneColors[tone];
  const hot = tone === 'attention' && value > 0;
  return (
    <Panel variant={hot ? 'attention' : 'default'} onPress={onPress} accessibilityLabel={`${label}: ${value}`} style={styles.stat}>
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: c.soft }]}>
          <Ionicons name={icon} size={18} color={c.fg} />
        </View>
        {onPress && <Ionicons name="arrow-forward" size={16} color={admin.subtle} />}
      </View>
      <CountUp value={value} style={[styles.statValue, hot && { color: admin.attentionText }]} />
      <Txt style={styles.statLabel} numberOfLines={1}>{label}</Txt>
      {!!hint && <Txt style={[styles.statHint, { color: c.fg }]} numberOfLines={1}>{hint}</Txt>}
    </Panel>
  );
}

/* ---------- Search ---------- */

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (t: string) => void; placeholder: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.search, focused && { borderColor: admin.primary }]}>
      <Ionicons name="search" size={18} color={focused ? admin.primaryText : admin.subtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={admin.subtle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        style={styles.searchInput}
        selectionColor={admin.primary}
      />
      {!!value && (
        <Tappable scale={0.85} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear" onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={admin.subtle} />
        </Tappable>
      )}
    </View>
  );
}

/* ---------- Section label, empty state, skeleton ---------- */

export function SectionLabel({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Txt style={styles.sectionTitle}>{title}</Txt>
      {!!action && onAction && (
        <Tappable scale={0.94} hitSlop={8} accessibilityRole="button" onPress={() => { tap(); onAction(); }} style={styles.sectionAction}>
          <Txt style={styles.sectionActionText}>{action}</Txt>
          <Ionicons name="arrow-forward" size={14} color={admin.primaryText} />
        </Tappable>
      )}
    </View>
  );
}

export function EmptyPanel({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  return (
    <Panel style={{ alignItems: 'center', paddingVertical: spacing.xxl, marginTop: spacing.md }}>
      <View style={[styles.statIcon, { width: 52, height: 52, borderRadius: 16, backgroundColor: admin.primarySoft }]}>
        <Ionicons name={icon} size={24} color={admin.primaryText} />
      </View>
      <Txt style={[styles.rowTitle, { marginTop: spacing.md, textAlign: 'center' }]}>{title}</Txt>
      {!!body && <Txt style={[styles.rowSub, { textAlign: 'center', marginTop: 4 }]}>{body}</Txt>}
    </Panel>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      {Array.from({ length: rows }, (_, i) => (
        <Panel key={i}>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Skeleton width={42} height={42} radius={12} color={admin.edge} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={14} color={admin.edge} />
              <Skeleton width="40%" height={11} color={admin.edge} />
            </View>
          </View>
        </Panel>
      ))}
    </View>
  );
}

/** Shared text styles for list rows inside panels. */
export const adminText = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 15.5, lineHeight: 21, color: admin.foreground },
  sub: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: admin.muted },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: admin.subtle },
  body: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: admin.muted },
});

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  band: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  bandSparkle: { position: 'absolute', right: -18, top: 18 },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 26, borderRadius: 13, backgroundColor: admin.onBandSoft, alignSelf: 'flex-start' },
  kickerText: { fontFamily: fonts.bold, fontSize: 11.5, color: admin.onBand, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, color: admin.onBand, letterSpacing: -0.8, marginTop: spacing.md },
  sub: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: admin.onBandMuted, marginTop: 4 },

  panel: { borderRadius: 18, borderWidth: 1, padding: spacing.lg, shadowColor: admin.shadow, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },

  btn: { minHeight: 46, borderRadius: 13, borderWidth: 1.5, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnSm: { minHeight: 40, borderRadius: 11, paddingHorizontal: spacing.md },
  btnText: { fontFamily: fonts.bold, fontSize: 14.5 },

  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, height: 24, borderRadius: 12, borderWidth: 1, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 0.2 },
  dot: { width: 6, height: 6, borderRadius: 3 },

  segTrack: { padding: 4, gap: 4, borderRadius: 14, backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border },
  segHighlight: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 10, backgroundColor: admin.primaryText },
  segItem: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 10 },
  segText: { fontFamily: fonts.semibold, fontSize: 13.5, color: admin.muted },
  segCount: { minWidth: 22, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  segCountText: { fontFamily: fonts.bold, fontSize: 11.5 },

  stat: { flexGrow: 1, flexBasis: 150, gap: 4 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, color: admin.foreground, letterSpacing: -0.8 },
  statLabel: { fontFamily: fonts.semibold, fontSize: 13, color: admin.muted },
  statHint: { fontFamily: fonts.bold, fontSize: 12 },

  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 50, borderRadius: 14, backgroundColor: admin.card, borderWidth: 1.5, borderColor: admin.border, paddingHorizontal: spacing.md, marginTop: spacing.lg },
  searchInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: admin.foreground },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: admin.foreground, letterSpacing: -0.3 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  sectionActionText: { fontFamily: fonts.bold, fontSize: 13.5, color: admin.primaryText },

  rowTitle: { fontFamily: fonts.bold, fontSize: 15.5, color: admin.foreground },
  rowSub: { fontFamily: fonts.medium, fontSize: 13, color: admin.muted },
});
