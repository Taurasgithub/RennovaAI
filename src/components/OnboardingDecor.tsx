import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

/** Soft mint wash, corner blobs, faint house outlines and potted-plant leaves behind the onboarding screen. */
export function Backdrop({ houses = 'both', houseTop = '51%' }: { houses?: 'both' | 'right' | 'none'; houseTop?: `${number}%` }) {
  return (
    // overflow hidden: the corner blobs sit partly off-screen and must not widen the page on web.
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <LinearGradient colors={['#E9F7F3', '#F7FCFB', '#FFFFFF', '#F1FAF7']} locations={[0, 0.3, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, { width: 260, height: 220, top: -90, left: -80 }]} />
      <View style={[styles.blob, { width: 220, height: 200, top: -70, right: -90 }]} />
      <View style={[styles.blob, { width: 240, height: 240, bottom: -110, right: -70 }]} />
      {houses === 'both' && <HouseOutline style={{ position: 'absolute', left: -24, top: houseTop }} />}
      {houses !== 'none' && <HouseOutline style={{ position: 'absolute', right: -24, top: houseTop }} />}
      <Leaves style={{ position: 'absolute', left: -6, bottom: -4 }} />
      <Leaves style={{ position: 'absolute', right: -6, bottom: -4, transform: [{ scaleX: -1 }] }} />
    </View>
  );
}

function HouseOutline({ style }: { style: object }) {
  return (
    <Svg width={110} height={120} viewBox="0 0 110 120" style={style}>
      <G stroke={colors.teal} strokeOpacity={0.14} strokeWidth={3} fill="none" strokeLinejoin="round">
        <Path d="M8 52 L55 12 L102 52" />
        <Path d="M18 46 V112 H92 V46" />
        <Rect x={36} y={58} width={38} height={34} />
        <Line x1={55} y1={58} x2={55} y2={92} />
        <Line x1={36} y1={75} x2={74} y2={75} />
      </G>
    </Svg>
  );
}

const LEAF = 'M0 0 C 8 -14, 30 -16, 44 -2 C 30 10, 10 10, 0 0 Z';

function Leaves({ style }: { style: object }) {
  const leaves: [number, number, number, number, string][] = [
    // x, y, rotation, scale, colour
    [6, 112, -70, 1.2, '#3F8F4E'],
    [12, 100, -40, 1.1, '#56A764'],
    [4, 84, -95, 0.95, '#2F7A40'],
    [20, 118, -15, 1.0, '#6DBB72'],
    [8, 66, -60, 0.8, '#4C9C59'],
    [30, 108, -55, 0.75, '#3F8F4E'],
  ];
  return (
    <Svg width={110} height={130} viewBox="0 0 110 130" style={[{ opacity: 0.9 }, style]}>
      {leaves.map(([x, y, r, s, c], i) => (
        <G key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
          <Path d={LEAF} fill={c} />
          <Path d="M2 0 C 14 -4, 28 -5, 40 -2" stroke="#E8F5E9" strokeOpacity={0.5} strokeWidth={1} fill="none" />
        </G>
      ))}
    </Svg>
  );
}

/** Three short teal "spark" strokes, placed just outside the slider's top-left corner. */
export function SparkMarks({ style }: { style?: object }) {
  return (
    <Svg width={40} height={36} viewBox="0 0 40 36" style={style}>
      <G stroke={colors.teal} strokeWidth={3.5} strokeLinecap="round">
        <Line x1={6} y1={20} x2={16} y2={27} />
        <Line x1={14} y1={8} x2={20} y2={20} />
        <Line x1={28} y1={4} x2={27} y2={17} />
      </G>
    </Svg>
  );
}

/** Teal line — house roof with a window — teal line. */
export function HouseDivider() {
  return (
    <Svg width={270} height={46} viewBox="0 0 270 46">
      <Line x1={10} y1={34} x2={95} y2={34} stroke={colors.teal} strokeOpacity={0.45} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={175} y1={34} x2={260} y2={34} stroke={colors.teal} strokeOpacity={0.45} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M100 38 L135 8 L170 38" stroke={colors.teal} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <G fill={colors.teal}>
        <Rect x={128} y={26} width={6} height={6} rx={1} />
        <Rect x={136} y={26} width={6} height={6} rx={1} />
        <Rect x={128} y={34} width={6} height={6} rx={1} />
        <Rect x={136} y={34} width={6} height={6} rx={1} />
      </G>
    </Svg>
  );
}

/** Hand-drawn amber underline under the highlighted headline words. */
export function Swash({ width = 200 }: { width?: number }) {
  return (
    <Svg width={width} height={14} viewBox="0 0 200 14" preserveAspectRatio="none">
      <Path d="M4 10 C 50 3, 120 2, 196 6" stroke={colors.amber} strokeWidth={4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: '#D4F1EA', opacity: 0.55 },
});
