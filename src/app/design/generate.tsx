import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, T } from '../../components/ui';
import { ROOM_TYPES, STYLES, findById } from '../../data/catalog';
import { estimateCost } from '../../lib/estimate';
import { generateDesign } from '../../services/ai';
import { useApp } from '../../store/useApp';
import { colors, fonts, spacing } from '../../theme';

const STEPS = ['Reading your room layout', 'Applying colours & materials', 'Styling furniture & lighting', 'Calculating your estimate'];

export default function Generate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, saveDesign, user, designs } = useApp();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const started = useRef(false);

  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 700);
    return () => {
      a.stop();
      b.stop();
      clearInterval(t);
    };
  }, [spin, pulse]);

  const run = async () => {
    setError(null);
    setStep(0);
    try {
      const [result] = await Promise.all([generateDesign(draft), new Promise((r) => setTimeout(r, 2600))]);
      const room = findById(ROOM_TYPES, draft.roomTypeId);
      const style = findById(STYLES, draft.styleId);
      const { photoUri, ...choices } = draft;
      const id = saveDesign({
        name: `${style.label} ${room.label.toLowerCase()} #${designs.length + 1}`,
        choices,
        photoUri,
        resultUri: result.uri,
        resultMode: result.mode,
        regenerations: 0,
        premium: false,
        estimate: estimateCost(choices, user?.city ?? 'Sukkur'),
      });
      router.replace({ pathname: '/design/result', params: { id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong while generating your design.');
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] });

  return (
    <LinearGradient colors={[colors.navy, colors.navyDeep]} style={[styles.wrap, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.center}>
        <View style={styles.houseRing}>
          <Animated.View style={[styles.ring, { transform: [{ rotate }] }]} />
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="sparkles" size={64} color={colors.amber} />
          </Animated.View>
        </View>
        <T variant="h1" style={{ color: colors.white, marginTop: spacing.xxl, textAlign: 'center' }}>
          {error ? 'Generation paused' : 'Reimagining your room…'}
        </T>
        {error ? (
          <T style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: spacing.md }}>{error}</T>
        ) : (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.stepRow}>
                <Ionicons name={i < step ? 'checkmark-circle' : i === step ? 'ellipse' : 'ellipse-outline'} size={18} color={i <= step ? colors.teal : 'rgba(255,255,255,0.35)'} />
                <T style={{ color: i <= step ? colors.white : 'rgba(255,255,255,0.5)', fontFamily: fonts.medium }}>{s}</T>
              </View>
            ))}
          </View>
        )}
      </View>
      {error && (
        <View style={{ gap: spacing.md, paddingHorizontal: spacing.xl }}>
          <Button title="Try again" kind="amber" icon="refresh" onPress={run} />
          <Button title="Back to design" kind="secondary" onPress={() => router.back()} />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  houseRing: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: colors.teal, borderTopColor: 'transparent', borderRightColor: 'rgba(10,180,154,0.35)' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
