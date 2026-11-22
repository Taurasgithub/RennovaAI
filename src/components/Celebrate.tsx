import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';
import { Sparkle } from './brand';

const COUNT = 12;
const PALETTE = [colors.amber, colors.teal, colors.amber, colors.navy];

/** One sparkle flying outward from the centre, spinning and fading. */
function Spark({ index, distance }: { index: number; distance: number }) {
  const p = useSharedValue(0);
  const angle = (index / COUNT) * Math.PI * 2 + (index % 2 ? 0.25 : 0);
  const reach = distance * (index % 3 === 0 ? 1 : index % 3 === 1 ? 0.75 : 0.55);
  useEffect(() => {
    p.value = withDelay((index % 4) * 40, withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
  }, [p, index]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value < 0.7 ? 1 : 1 - (p.value - 0.7) / 0.3,
    transform: [
      { translateX: Math.cos(angle) * reach * p.value },
      { translateY: Math.sin(angle) * reach * p.value },
      { rotate: `${p.value * 220}deg` },
      { scale: 0.4 + Math.sin(p.value * Math.PI) * 0.9 },
    ],
  }));
  return (
    <Animated.View style={[styles.spark, style]}>
      <Sparkle size={index % 3 === 0 ? 22 : 15} color={PALETTE[index % PALETTE.length]} />
    </Animated.View>
  );
}

/**
 * A one-off burst of logo sparkles for happy moments (booking sent, project finished).
 * Renders nothing when the phone asks for reduced motion. Pass a new `trigger` to play it again.
 */
export function Celebrate({ trigger, distance = 140 }: { trigger: number | string | null | undefined; distance?: number }) {
  const reduced = useReducedMotion();
  if (!trigger || reduced) return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      {Array.from({ length: COUNT }, (_, i) => (
        <Spark key={`${trigger}-${i}`} index={i} distance={distance} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 50 },
  spark: { position: 'absolute' },
});
