import { useEffect, useRef, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Txt } from './ui';

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
