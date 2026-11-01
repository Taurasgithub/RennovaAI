import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fonts, shadow, spacing } from '../theme';
import { tap, Txt, type IconName } from './ui';

/** Teal gradient call-to-action used across onboarding and sign-in. */
export function GradientButton({
  title,
  onPress,
  urdu,
  disabled,
  loading,
  compact,
}: {
  title: string;
  onPress: () => void;
  urdu: boolean;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={() => {
        if (off) return;
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.shadow, off && { opacity: 0.55 }, pressed && !off && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
    >
      <LinearGradient colors={['#14C2A6', colors.teal, '#0A9E89']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.button, compact && styles.compact]}>
        <Text style={[styles.text, compact && { fontSize: 16.5 }, urdu && styles.textUr]}>{title}</Text>
        <Ionicons name={loading ? 'hourglass-outline' : 'arrow-forward'} size={compact ? 20 : 22} color={colors.white} />
      </LinearGradient>
    </Pressable>
  );
}

export function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

export function PakistanFlag() {
  return (
    <Svg width={28} height={19} viewBox="0 0 30 20">
      <Rect width={30} height={20} rx={2} fill="#01411C" />
      <Rect width={7.5} height={20} fill="#FFFFFF" />
      <Circle cx={19} cy={10} r={5.2} fill="#FFFFFF" />
      <Circle cx={20.6} cy={8.9} r={4.4} fill="#01411C" />
      <Path d="M23.2 5.6l.55 1.55 1.6.03-1.28.98.47 1.57-1.34-.93-1.35.93.47-1.57-1.28-.98 1.6-.03z" fill="#FFFFFF" />
    </Svg>
  );
}

export function SocialButton({ label, icon, onPress, disabled }: { label: string; icon: ReactNode; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={() => {
        if (disabled) return;
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.social, (pressed || disabled) && { opacity: 0.7 }]}
    >
      {icon}
      <Txt style={styles.socialText}>{label}</Txt>
    </Pressable>
  );
}

export function IconField({ icon, right, ...rest }: ComponentProps<typeof TextInput> & { icon: IconName; right?: ReactNode }) {
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput placeholderTextColor={colors.textSubtle} {...rest} style={styles.fieldInput} />
      {right}
    </View>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.md }}>
      <View style={styles.orLine} />
      <Txt style={{ fontFamily: fonts.medium, fontSize: 12.5, color: colors.textMuted }}>{label}</Txt>
      <View style={styles.orLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 999, shadowColor: colors.tealDark, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  button: { height: 60, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  compact: { height: 54, borderRadius: 16 },
  text: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  textUr: { fontFamily: fonts.urduBold, fontSize: 19, lineHeight: 42 },
  social: { height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EA', backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, ...shadow.card },
  socialText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.navy },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, height: 52, paddingHorizontal: spacing.lg, borderRadius: 14, borderWidth: 1, borderColor: '#DCE5EA', backgroundColor: colors.white },
  fieldInput: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#CBD5DD' },
});
