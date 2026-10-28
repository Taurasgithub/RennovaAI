import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, spacing } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const tap = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
};

/* ---------- Typography ---------- */

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'overline';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, color: colors.navy, letterSpacing: -0.5 },
  h1: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, color: colors.navy, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, color: colors.navy },
  h3: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 21, color: colors.textMuted },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 14.5, lineHeight: 21, color: colors.text },
  small: { fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },
  caption: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 15, color: colors.textSubtle },
  overline: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14, color: colors.amberDark, letterSpacing: 1.6, textTransform: 'uppercase' },
};

export function T({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[variantStyle[variant], style]} />;
}

/* ---------- Buttons ---------- */

type ButtonKind = 'primary' | 'secondary' | 'amber' | 'ghost' | 'navy' | 'danger';

const btnColors: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.teal, fg: colors.white },
  navy: { bg: colors.navy, fg: colors.white },
  amber: { bg: colors.amber, fg: colors.navyDeep },
  secondary: { bg: colors.white, fg: colors.navy, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.tealDark },
  danger: { bg: colors.white, fg: colors.danger, border: '#F5C2C2' },
};

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  iconRight,
  loading,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = btnColors[kind];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={() => {
        if (off) return;
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: c.bg, borderColor: c.border ?? c.bg, opacity: off ? 0.5 : pressed ? 0.85 : 1 },
        kind === 'ghost' && { borderColor: 'transparent' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 19} color={c.fg} />}
          <Text style={[styles.btnText, small && { fontSize: 13.5 }, { color: c.fg }]}>{title}</Text>
          {iconRight && <Ionicons name={iconRight} size={small ? 16 : 19} color={c.fg} />}
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color = colors.navy, bg = colors.white, size = 40, label }: { icon: IconName; onPress: () => void; color?: string; bg?: string; size?: number; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }, bg !== 'transparent' && shadow.card]}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </Pressable>
  );
}

/* ---------- Layout ---------- */

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable
        onPress={() => {
          tap();
          onPress();
        }}
        style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
      >
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Header({ title, subtitle, right, back = true, dark }: { title?: string; subtitle?: string; right?: ReactNode; back?: boolean; dark?: boolean }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton
          icon="chevron-back"
          label="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          bg={dark ? 'rgba(255,255,255,0.15)' : colors.white}
          color={dark ? colors.white : colors.navy}
        />
      ) : (
        <View style={{ width: 40 }} />
      )}
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm }}>
        {!!title && (
          <T variant="h3" numberOfLines={1} style={{ color: dark ? colors.white : colors.navy, fontFamily: fonts.bold }}>
            {title}
          </T>
        )}
        {!!subtitle && (
          <T variant="caption" numberOfLines={1} style={dark ? { color: 'rgba(255,255,255,0.7)' } : undefined}>
            {subtitle}
          </T>
        )}
      </View>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Screen({
  children,
  title,
  subtitle,
  back = true,
  right,
  scroll = true,
  footer,
  padded = true,
  bg = colors.bg,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  padded?: boolean;
  bg?: string;
}) {
  const insets = useSafeAreaInsets();
  const content = padded ? { paddingHorizontal: spacing.lg } : undefined;
  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top }}>
      {(title !== undefined || back) && <Header title={title} subtitle={subtitle} back={back} right={right} />}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[content, { paddingBottom: (footer ? spacing.lg : insets.bottom + spacing.xxl) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
      {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>{footer}</View>}
    </View>
  );
}

export function Section({ title, action, onAction, children, style }: { title: string; action?: string; onAction?: () => void; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ marginTop: spacing.xxl }, style]}>
      <View style={styles.sectionHead}>
        <T variant="h2">{title}</T>
        {action && (
          <Pressable onPress={onAction} hitSlop={8}>
            <T variant="small" style={{ color: colors.tealDark, fontFamily: fonts.semibold }}>
              {action}
            </T>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

/* ---------- Small pieces ---------- */

export function Chip({ label, selected, onPress, icon, color }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, selected && { backgroundColor: colors.navy, borderColor: colors.navy }]}
    >
      {color && <View style={[styles.swatchDot, { backgroundColor: color }]} />}
      {icon && <Ionicons name={icon} size={15} color={selected ? colors.white : colors.navy} />}
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, tone = 'teal', icon }: { label: string; tone?: 'teal' | 'amber' | 'navy' | 'gray' | 'green'; icon?: IconName }) {
  const map = {
    teal: [colors.tealSoft, colors.tealDeep],
    amber: [colors.amberSoft, colors.amberDark],
    navy: [colors.navySoft, colors.navy],
    gray: ['#EEF1F5', colors.textMuted],
    green: ['#E7F7EC', colors.success],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon && <Ionicons name={icon} size={12} color={fg} />}
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: size > 20 ? 8 : 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name: IconName = value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-outline';
        const icon = <Ionicons name={name} size={size} color={colors.amber} />;
        return onChange ? (
          <Pressable key={i} onPress={() => { tap(); onChange(i); }} accessibilityLabel={`${i} star`} hitSlop={4}>
            {icon}
          </Pressable>
        ) : (
          <View key={i}>{icon}</View>
        );
      })}
    </View>
  );
}

export function Row({ children, style, gap = spacing.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md }, style]} />;
}

export function IconTile({ icon, color = colors.tealDark, bg = colors.tealSoft, size = 44 }: { icon: IconName; color?: string; bg?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

export function EmptyState({ icon, title, body, action, onAction }: { icon: IconName; title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl }}>
      <IconTile icon={icon} size={64} />
      <T variant="h2" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
        {title}
      </T>
      <T style={{ textAlign: 'center', marginTop: spacing.sm }}>{body}</T>
      {action && <Button title={action} onPress={onAction} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} icon="sparkles" />}
    </View>
  );
}

export function Field({ label, hint, style, ...rest }: ComponentProps<typeof TextInput> & { label: string; hint?: string }) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <T variant="bodyStrong" style={{ marginBottom: spacing.sm }}>{label}</T>
      <TextInput placeholderTextColor={colors.textSubtle} {...rest} style={[styles.input, rest.multiline && { height: 96, paddingTop: 14, textAlignVertical: 'top' }, style]} />
      {!!hint && <T variant="caption" style={{ marginTop: 6 }}>{hint}</T>}
    </View>
  );
}

export const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 52,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.white,
  },
  btn: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  btnSmall: { minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.sm },
  btnText: { fontFamily: fonts.bold, fontSize: 15.5 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: 56 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.navy },
  swatchDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 0.3 },
});
