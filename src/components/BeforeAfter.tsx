import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { useT } from '../i18n';
import { colors, fonts, radius } from '../theme';
import { Txt } from './ui';

/**
 * Drag-to-compare slider. "after" is drawn on the left of the handle and
 * "before" on the right, so dragging right reveals more of the renovation.
 */
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function BeforeAfter({ before, after, height = 260 }: { before: ReactNode; after: ReactNode; height?: number }) {
  const { t } = useT();
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(0.55);
  const widthRef = useRef(0);
  const startRef = useRef(0.55);
  const posRef = useRef(0.55);
  const startX = useRef(0);
  const touched = useRef(false);
  const reduced = useReducedMotion();

  // First time it appears, the handle sweeps across once to show the slider can be dragged.
  useEffect(() => {
    if (!width || reduced) return;
    const keys = [0.55, 0.85, 0.2, 0.55];
    const legMs = 620;
    const t0 = Date.now() + 450;
    let frame = 0;
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const tick = () => {
      if (touched.current) return;
      const elapsed = Date.now() - t0;
      if (elapsed >= 0) {
        const leg = Math.min(keys.length - 2, Math.floor(elapsed / legMs));
        const p = Math.min(1, (elapsed - leg * legMs) / legMs);
        const next = keys[leg] + (keys[leg + 1] - keys[leg]) * ease(p);
        posRef.current = next;
        setPos(next);
        if (leg === keys.length - 2 && p >= 1) return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [width, reduced]);

  // Plain touch-responder props (not PanResponder.create during render): they only run while a finger is down.
  const drag = {
    onStartShouldSetResponder: () => true,
    onResponderTerminationRequest: () => false,
    onResponderGrant: (e: GestureResponderEvent) => {
      touched.current = true; // the person takes over from the intro sweep
      const w = widthRef.current || 1;
      const p = clamp01(e.nativeEvent.locationX / w);
      startRef.current = p;
      startX.current = e.nativeEvent.pageX;
      posRef.current = p;
      setPos(p);
    },
    onResponderMove: (e: GestureResponderEvent) => {
      const w = widthRef.current || 1;
      const p = clamp01(startRef.current + (e.nativeEvent.pageX - startX.current) / w);
      posRef.current = p;
      setPos(p);
    },
  };

  const x = width * pos;

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      {...drag}
      accessibilityLabel={t('ba.a11y')}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {before}
      </View>
      <View style={[styles.clip, { width: x }]} pointerEvents="none">
        <View style={{ width, height }}>{after}</View>
      </View>
      <View style={[styles.label, { left: 10 }]} pointerEvents="none">
        <Txt style={[styles.labelText, { color: colors.navyDeep }]}>{t('ba.after')}</Txt>
      </View>
      <View style={[styles.label, styles.labelDark, { right: 10 }]} pointerEvents="none">
        <Txt style={styles.labelText}>{t('ba.before')}</Txt>
      </View>
      {width > 0 && (
        <View style={[styles.handleLine, { left: x - 1.5 }]} pointerEvents="none">
          <View style={styles.knob}>
            <Ionicons name="code-outline" size={18} color={colors.navy} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#DDD' },
  clip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  handleLine: { position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  knob: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  label: { position: 'absolute', top: 10, backgroundColor: colors.amber, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  labelDark: { backgroundColor: 'rgba(11,30,63,0.75)' },
  labelText: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1.2, color: colors.white },
});
