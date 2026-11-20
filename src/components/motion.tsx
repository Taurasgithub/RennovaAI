import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';
import { Txt } from './ui';

/**
 * Motion toolkit (Reanimated). Every animation respects the phone's "reduce motion" setting:
 * entrances and loops are skipped and values jump straight to their end state.
 */

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_IN = { damping: 18, stiffness: 420, mass: 0.6 };
const PRESS_OUT = { damping: 12, stiffness: 260, mass: 0.6 };

/** Springy press feedback: the element sinks slightly while held and bounces back. */
export function usePressScale(scale = 0.96) {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return {
    style,
    onPressIn: () => {
      s.set(withSpring(scale, { ...PRESS_IN, reduceMotion: ReduceMotion.System }));
    },
    onPressOut: () => {
      s.set(withSpring(1, { ...PRESS_OUT, reduceMotion: ReduceMotion.System }));
    },
  };
}

/** Entrance used across screens: rises and fades in, staggered by `index` (capped so long lists don't lag). */
export const enter = (index = 0) =>
  FadeInDown.delay(Math.min(index, 8) * 65)
    .duration(460)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 18 }] })
    .reduceMotion(ReduceMotion.System);

/** Entrance for items in a horizontal row: slide in from the side, one after another. */
export const enterFromSide = (index = 0) =>
  FadeInRight.delay(Math.min(index, 8) * 70)
    .duration(440)
    .easing(Easing.out(Easing.cubic))
    .reduceMotion(ReduceMotion.System);

type EnteringProp = ReturnType<typeof enter>;

/** A pressable with springy press feedback and an optional entrance animation. */
export function Tappable({
  scale = 0.96,
  style,
  entering,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style'> & { scale?: number; style?: StyleProp<ViewStyle>; entering?: EnteringProp | ReturnType<typeof enterFromSide> }) {
  const press = usePressScale(scale);
  return (
    <AnimatedPressable
      {...rest}
      entering={entering}
      onPressIn={(e) => {
        press.onPressIn();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        press.onPressOut();
        onPressOut?.(e);
      }}
      style={[style, press.style]}
    />
  );
}

export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={enter(index)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Gentle endless "breathing" scale, for things that should draw the eye (sparkles, the main call to action). */
export function useBreathe(amount = 0.06, duration = 1400, delay = 0) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    s.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1 + amount, { duration, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration, easing: Easing.inOut(Easing.sin) })), -1),
    );
  }, [s, amount, duration, delay, reduced]);
  return useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
}

/** Slow continuous rotation (degrees per full turn time), e.g. for the sparkle in the tab bar. */
export function useSpin(duration = 9000) {
  const reduced = useReducedMotion();
  const r = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    r.value = withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1);
  }, [r, duration, reduced]);
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
}

/** Number that counts up to `value` when it appears or changes (prices, stats). */
export function CountUp({ value, format = (n) => String(Math.round(n)), duration = 900, style }: { value: number; format?: (n: number) => string; duration?: number; style?: StyleProp<TextStyle> }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const start = from.current;
    const t0 = Date.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const n = start + (value - start) * eased;
      setShown(n);
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);
  return <Txt style={style}>{format(reduced ? value : shown)}</Txt>;
}

/** Placeholder block that softly pulses while content loads. */
export function Skeleton({ width = '100%', height = 16, radius = 8, color = colors.mist, style }: { width?: ViewStyle['width']; height?: number; radius?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (reduced) return;
    o.value = withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.55, { duration: 700 })), -1);
  }, [o, reduced]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: color }, anim, style]} />;
}
