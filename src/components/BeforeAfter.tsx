import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

/**
 * Drag-to-compare slider. "after" is drawn on the left of the handle and
 * "before" on the right, so dragging right reveals more of the renovation.
 */
export function BeforeAfter({ before, after, height = 260 }: { before: ReactNode; after: ReactNode; height?: number }) {
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(0.55);
  const widthRef = useRef(0);
  const startRef = useRef(0.55);
  const posRef = useRef(0.55);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const w = widthRef.current || 1;
          const p = Math.min(1, Math.max(0, e.nativeEvent.locationX / w));
          startRef.current = p;
          posRef.current = p;
          setPos(p);
        },
        onPanResponderMove: (_, g) => {
          const w = widthRef.current || 1;
          const p = Math.min(1, Math.max(0, startRef.current + g.dx / w));
          posRef.current = p;
          setPos(p);
        },
      }),
    [],
  );

  const x = width * pos;

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      {...responder.panHandlers}
      accessibilityLabel="Before and after comparison. Drag to compare."
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {before}
      </View>
      <View style={[styles.clip, { width: x }]} pointerEvents="none">
        <View style={{ width, height }}>{after}</View>
      </View>
      <View style={[styles.label, { left: 10 }]} pointerEvents="none">
        <Text style={[styles.labelText, { color: colors.navyDeep }]}>AFTER</Text>
      </View>
      <View style={[styles.label, styles.labelDark, { right: 10 }]} pointerEvents="none">
        <Text style={styles.labelText}>BEFORE</Text>
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
