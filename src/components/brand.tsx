/**
 * Shapes taken from the RennovaAI logo, used across the signed-in app:
 * the house outline (pointed roof), the perspective floor, the 4-pane window and the amber sparkle.
 * Everything is flat colour, like the mark itself: no gradients, glows or drop shadows.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Path, Polygon, Rect } from 'react-native-svg';
import { useT } from '../i18n';
import type { Role } from '../lib/supabase';
import { colors, fonts, spacing } from '../theme';
import { initialsOf } from './Avatar';
import { tap, Txt } from './ui';

/** Each role's colour from the logo: customers teal, vendors amber, admins navy. */
export const ROLE_COLOR: Record<Role, string> = { customer: colors.teal, vendor: colors.amber, admin: colors.navy };

/** Roof height as a share of the shape's height (matches the logo's proportions). */
const ROOF = 0.38;

export const housePoints = (w: number, h: number, roof: number, x = 0, y = 0) =>
  `${x},${y + roof} ${x + w / 2},${y} ${x + w},${y + roof} ${x + w},${y + h} ${x},${y + h}`;

/** Solid house silhouette. */
export function House({ width, height, roof = height * ROOF, color, style }: { width: number; height: number; roof?: number; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width={width} height={height} style={style}>
      <Polygon points={housePoints(width, height, roof)} fill={color} />
    </Svg>
  );
}

/** The logo's floor: a trapezoid that is narrower at the back (top) than at the front. */
export function Floor({ width, height = 12, inset = 14, color = colors.tealTint, style }: { width: number; height?: number; inset?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width={width} height={height} style={style}>
      <Polygon points={`${inset},0 ${width - inset},0 ${width},${height} 0,${height}`} fill={color} />
    </Svg>
  );
}

const sparklePath = (size: number) => {
  const r = size / 2;
  const q = r * 0.17;
  return `M${r} 0Q${r + q} ${r - q} ${size} ${r}Q${r + q} ${r + q} ${r} ${size}Q${r - q} ${r + q} 0 ${r}Q${r - q} ${r - q} ${r} 0Z`;
};

/** The amber four-point sparkle from the logo: AI, ratings and the main action. */
export function Sparkle({ size = 16, color = colors.amber, style }: { size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <Svg width={size} height={size} style={style}>
      <Path d={sparklePath(size)} fill={color} />
    </Svg>
  );
}

export type MarkerState = 'done' | 'now' | 'next';

/** House-shaped progress marker: teal when done, amber for the current step, outlined for what's next. */
export function Marker({ state, label, size = 26 }: { state: MarkerState; label?: string | number; size?: number }) {
  const roof = size * ROOF;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {state === 'next' ? (
          <Polygon points={housePoints(size - 2, size - 2, roof - 1, 1, 1)} fill={colors.white} stroke={colors.line} strokeWidth={2} />
        ) : (
          <Polygon points={housePoints(size, size, roof)} fill={state === 'done' ? colors.teal : colors.amber} />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { top: roof * 0.55, alignItems: 'center', justifyContent: 'center' }]}>
        {state === 'done' ? (
          <Ionicons name="checkmark" size={size * 0.52} color={colors.white} />
        ) : (
          <Txt style={{ fontFamily: fonts.extrabold, fontSize: size * 0.42, color: state === 'now' ? colors.navy : colors.textSubtle }}>{label}</Txt>
        )}
      </View>
    </View>
  );
}

/** Profile photo (or initials) inside the house shape, optionally with a ring around it. */
export function HouseAvatar({
  uri,
  name,
  size = 44,
  bg = colors.navy,
  color = colors.white,
  ring,
}: {
  uri?: string | null;
  name: string;
  size?: number;
  bg?: string;
  color?: string;
  ring?: string;
}) {
  const pad = ring ? Math.max(3, size * 0.05) : 0;
  const outer = size + pad * 2;
  const roof = size * ROOF;
  const clip = `ha-${size}-${initialsOf(name)}`;
  return (
    <View style={{ width: outer, height: outer }}>
      <Svg width={outer} height={outer} style={StyleSheet.absoluteFill}>
        {ring && <Polygon points={housePoints(outer, outer, roof + pad)} fill={ring} />}
        <Defs>
          <ClipPath id={clip}>
            <Polygon points={housePoints(size, size, roof, pad, pad)} />
          </ClipPath>
        </Defs>
        <Polygon points={housePoints(size, size, roof, pad, pad)} fill={bg} />
        {!!uri && <SvgImage href={{ uri }} x={pad} y={pad} width={size} height={size} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />}
      </Svg>
      {!uri && (
        <View style={[StyleSheet.absoluteFill, { top: pad + roof * 0.55, alignItems: 'center', justifyContent: 'center' }]}>
          <Txt style={{ fontFamily: fonts.extrabold, fontSize: size * 0.3, color }}>{initialsOf(name)}</Txt>
        </View>
      )}
    </View>
  );
}

/** The logo's window: a thick teal frame split into four panes of photos. */
export function WindowGrid({ images, height = 190, bar = 6, color = colors.teal, style }: { images: (string | number)[]; height?: number; bar?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const panes = [0, 1, 2, 3].map((i) => images[i % Math.max(images.length, 1)]);
  return (
    <View style={[{ height, backgroundColor: color, borderRadius: 4, padding: bar, gap: bar }, style]}>
      {[0, 1].map((row) => (
        <View key={row} style={{ flex: 1, flexDirection: 'row', gap: bar }}>
          {[0, 1].map((col) => {
            const src = panes[row * 2 + col];
            return (
              <View key={col} style={{ flex: 1, backgroundColor: colors.tealTint, borderRadius: 1, overflow: 'hidden' }}>
                {src != null && <Image source={typeof src === 'string' ? { uri: src } : src} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Before (left) and after (right) inside the house shape, with an amber divider and sparkle handle. */
export function HouseBeforeAfter({ width, before, after, beforeLabel, afterLabel }: { width: number; before: ImageSourcePropType; after: ImageSourcePropType; beforeLabel: string; afterLabel: string }) {
  const frame = 7;
  const w = width - frame * 2;
  const h = Math.round(w * 0.97);
  const roof = Math.round(w * 0.23);
  return (
    <View style={{ width, alignItems: 'center' }}>
      <View style={{ width, height: h + frame * 2 + 2 }}>
        <Svg width={width} height={h + frame * 2 + 2}>
          <Polygon points={housePoints(width, h + frame * 2 + 2, roof + 3)} fill={colors.white} />
          <Defs>
            <ClipPath id="hba-house">
              <Polygon points={housePoints(w, h, roof, frame, frame + 2)} />
            </ClipPath>
            <ClipPath id="hba-right">
              <Rect x={frame + w / 2} y={0} width={w / 2} height={h + frame * 2} />
            </ClipPath>
          </Defs>
          <G clipPath="url(#hba-house)">
            <SvgImage href={before} x={frame} y={frame + 2} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
            <G clipPath="url(#hba-right)">
              <SvgImage href={after} x={frame} y={frame + 2} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
            </G>
            <Rect x={frame + w / 2 - 2} y={frame + 2 + roof * 0.25} width={4} height={h} fill={colors.amber} />
          </G>
        </Svg>
        <View style={[styles.handle, { left: width / 2 - 20, top: frame + roof + (h - roof) / 2 - 20 }]}>
          <Sparkle size={26} />
        </View>
        <View style={[styles.tag, { left: frame + 12, bottom: frame + 12, backgroundColor: colors.navy }]}>
          <Txt style={[styles.tagText, { color: colors.white }]}>{beforeLabel}</Txt>
        </View>
        <View style={[styles.tag, { right: frame + 12, bottom: frame + 12, backgroundColor: colors.amber }]}>
          <Txt style={[styles.tagText, { color: colors.navy }]}>{afterLabel}</Txt>
        </View>
      </View>
      <Floor width={width + 28} height={18} inset={14} />
    </View>
  );
}

/** Progress as a row of little houses (one per step): teal paid, amber held in escrow, mist still to come. */
export function HouseBar({ steps, height = 26, gap = 5 }: { steps: ('done' | 'now' | 'next')[]; height?: number; gap?: number }) {
  const fill = { done: colors.teal, now: colors.amber, next: colors.mist };
  return (
    <View style={{ flexDirection: 'row', gap, height }}>
      {steps.map((st, i) => (
        <View key={i} style={{ flex: 1, height }}>
          <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
            <Polygon points={housePoints(100, height, height * 0.36)} fill={fill[st]} />
          </Svg>
        </View>
      ))}
    </View>
  );
}

/** Text tabs with a teal underline on the active one (used instead of pill chips for filters). */
export function TabStrip<K extends string>({ items, value, onChange }: { items: { id: K; label: string }[]; value: K; onChange: (id: K) => void }) {
  return (
    <View style={styles.strip}>
      {items.map((it) => {
        const on = it.id === value;
        return (
          <Pressable key={it.id} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { tap(); onChange(it.id); }} style={styles.stripItem}>
            <Txt style={[styles.stripText, on && { color: colors.navy, fontFamily: fonts.extrabold }]}>{it.label}</Txt>
            <View style={[styles.stripBar, on && { backgroundColor: colors.teal }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small square colour key + label, used for roles instead of pill badges. */
export function Swatch({ color, label, textColor = colors.navy }: { color: string; label: string; textColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 9, height: 9, backgroundColor: color }} />
      <Txt style={{ fontFamily: fonts.bold, fontSize: 12, color: textColor }}>{label}</Txt>
    </View>
  );
}

/** Admin page title: amber sparkle + "Admin", then the page name. */
export function AdminTitle({ title, sub, kicker }: { title: string; sub?: string; kicker: string }) {
  return (
    <View style={{ marginTop: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sparkle size={16} />
          <Txt style={{ fontFamily: fonts.extrabold, fontSize: 13, color: colors.amberDark }}>{kicker}</Txt>
        </View>
        {!!sub && <Txt style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.textSubtle }}>{sub}</Txt>}
      </View>
      <Txt style={{ fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: colors.navy, letterSpacing: -0.8, marginTop: 4 }}>{title}</Txt>
    </View>
  );
}

/** Coloured top band for a role's screen, resting on the logo's floor. */
export function Band({ color, children, floor, style }: { color: string; children?: ReactNode; floor?: string; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <View style={[{ backgroundColor: color, paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }, style]}>{children}</View>
      {!!floor && <FloorStrip color={floor} />}
    </View>
  );
}

function FloorStrip({ color }: { color: string }) {
  return (
    <View style={{ height: 14, overflow: 'hidden' }}>
      <Svg width="100%" height={14} viewBox="0 0 100 14" preserveAspectRatio="none">
        <Polygon points="10,0 90,0 100,14 0,14" fill={color} />
      </Svg>
    </View>
  );
}

/* ---------- Tab bar ---------- */

/**
 * Flat tab bar: the active tab sits on a small house shape. `center` adds the amber sparkle
 * (the main "new design" action) in the middle; `dark` is the admin's navy version.
 */
export function BrandTabBar({ state, descriptors, emitter, navigateToTab, dark, center }: BottomTabBarProps & { dark?: boolean; center?: { label: string; onPress: () => void } }) {
  const insets = useSafeAreaInsets();
  const { ur } = useT();
  const bg = dark ? colors.navy : colors.white;
  const off = dark ? '#8FA3C2' : colors.textSubtle;
  const onIcon = dark ? colors.navy : colors.tealDark;
  const onBg = dark ? colors.amber : colors.tealTint;
  const onLabel = dark ? colors.white : colors.tealDark;

  const items: ReactNode[] = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    const label = typeof options.title === 'string' ? options.title : route.name;
    const onPress = () => {
      tap();
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };
    return (
      <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} onPress={onPress} style={styles.tab}>
        <View style={styles.iconWrap}>
          {focused && <House width={48} height={38} roof={13} color={onBg} style={StyleSheet.absoluteFill} />}
          <View style={{ marginTop: 6 }}>{options.tabBarIcon?.({ focused, color: focused ? onIcon : off, size: 22 })}</View>
        </View>
        <Txt numberOfLines={1} style={[styles.label, { color: focused ? onLabel : off, fontFamily: focused ? fonts.bold : fonts.semibold }]}>{label}</Txt>
      </Pressable>
    );
  });

  if (center) {
    items.splice(
      Math.ceil(items.length / 2),
      0,
      <Pressable key="center" accessibilityRole="button" accessibilityLabel={center.label} onPress={() => { tap(); center.onPress(); }} style={styles.tab}>
        <View style={[styles.starWell, { backgroundColor: bg }]}>
          <Sparkle size={60} />
          <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="add" size={22} color={colors.navy} />
          </View>
        </View>
        <Txt numberOfLines={1} style={[styles.label, { color: dark ? colors.white : colors.navy, fontFamily: fonts.bold }]}>{center.label}</Txt>
      </Pressable>,
    );
  }

  return (
    <View style={[styles.bar, { backgroundColor: bg, paddingBottom: insets.bottom + 6, minHeight: (ur ? 78 : 66) + insets.bottom }, !dark && styles.barRule]}>
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  handle: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  tag: { position: 'absolute', paddingHorizontal: 10, height: 26, borderRadius: 6, justifyContent: 'center' },
  tagText: { fontFamily: fonts.bold, fontSize: 12 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: 8 },
  barRule: { borderTopWidth: 1, borderTopColor: colors.line },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  iconWrap: { width: 48, height: 38, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, borderBottomWidth: 1.5, borderBottomColor: colors.line, marginTop: spacing.md },
  stripItem: { paddingTop: spacing.sm },
  stripText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textSubtle, paddingBottom: spacing.sm },
  stripBar: { height: 3, marginBottom: -1.5, backgroundColor: 'transparent' },
  starWell: { width: 68, height: 68, borderRadius: 34, marginTop: -30, marginBottom: -8, alignItems: 'center', justifyContent: 'center' },
});
