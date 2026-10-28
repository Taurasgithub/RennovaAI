import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesignThumb } from '../../components/DesignPreview';
import { RoomIllustration } from '../../components/RoomIllustration';
import { Badge, Button, Card, IconTile, Row, Section, T, tap } from '../../components/ui';
import { config } from '../../config';
import { PALETTES, ROOM_TYPES, STYLES } from '../../data/catalog';
import { pkr } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const JOURNEY = [
  { n: '01', label: 'Scan' },
  { n: '02', label: 'Design' },
  { n: '03', label: 'Match' },
  { n: '04', label: 'Compare' },
  { n: '05', label: 'Build' },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, designs, projects, resetDraft, updateDraft, referralUsed } = useApp();
  const active = projects.find((p) => p.status === 'active');

  const startDesign = (preset?: { roomTypeId?: string; area?: number; styleId?: string; paletteId?: string }) => {
    resetDraft();
    if (preset) updateDraft(preset);
    router.push('/design/capture');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <T variant="small">Assalam-o-Alaikum,</T>
            <T variant="h1">{user?.name?.split(' ')[0] ?? 'there'} 👋</T>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.cityPill}>
            <Ionicons name="location" size={14} color={colors.tealDark} />
            <T variant="small" style={{ color: colors.navy, fontFamily: fonts.semibold }}>{user?.city ?? 'Sukkur'}</T>
          </Pressable>
        </Row>

        {/* Hero */}
        <LinearGradient colors={[colors.navy, colors.navyDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroArt}>
            <RoomIllustration paletteId="teal-feature" styleId="modern" flooringId="porcelain" ceilingId="cove" extras={['panelling']} />
            <LinearGradient colors={[colors.navyDeep, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0 }} style={StyleSheet.absoluteFill} />
          </View>
          <T variant="overline" style={{ color: colors.amber }}>Visualise · Compare · Build</T>
          <T variant="display" style={{ color: colors.white, marginTop: spacing.sm, fontSize: 27, lineHeight: 33 }}>
            See it before{'\n'}you build it.
          </T>
          <T style={{ color: 'rgba(255,255,255,0.78)', marginTop: spacing.sm, maxWidth: 220 }}>Photograph a room and let AI show you the renovation.</T>
          <Button title="Start a new design" kind="amber" icon="camera" onPress={() => startDesign()} style={{ marginTop: spacing.lg, alignSelf: 'flex-start' }} />
        </LinearGradient>

        {/* Journey */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={styles.stepLine} />
          <Row gap={0}>
            {JOURNEY.map((j, i) => (
              <View key={j.n} style={{ flex: 1, alignItems: 'center' }}>
                <View style={[styles.step, i === JOURNEY.length - 1 && { backgroundColor: colors.amber }]}>
                  <T style={{ color: colors.white, fontFamily: fonts.bold, fontSize: 13 }}>{j.n}</T>
                </View>
                <T variant="caption" style={{ marginTop: 4, color: colors.navy, fontFamily: fonts.bold, letterSpacing: 0.3 }}>{j.label.toUpperCase()}</T>
              </View>
            ))}
          </Row>
        </View>
      </View>

      {active && (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Section title="Active project">
            <Card onPress={() => router.push(`/project/${active.id}`)}>
              <Row>
                <IconTile icon="hammer" bg={colors.amberSoft} color={colors.amberDark} />
                <View style={{ flex: 1 }}>
                  <T variant="h3" numberOfLines={1}>{active.title}</T>
                  <T variant="small">
                    {active.milestones.filter((m) => m.status === 'released').length}/{active.milestones.length} milestones complete · {pkr(active.price - active.discount)}
                  </T>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
              </Row>
            </Card>
          </Section>
        </View>
      )}

      <Section title="What are we renovating?" style={{ paddingHorizontal: spacing.lg }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {ROOM_TYPES.map((r) => (
          <Pressable key={r.id} onPress={() => { tap(); startDesign({ roomTypeId: r.id, area: r.defaultArea }); }} style={styles.roomTile}>
            <IconTile icon={r.icon} size={46} />
            <T variant="small" style={{ color: colors.navy, fontFamily: fonts.semibold, marginTop: spacing.sm }}>{r.label}</T>
          </Pressable>
        ))}
      </ScrollView>

      {designs.length > 0 && (
        <>
          <Section title="Your designs" action="See all" onAction={() => router.push('/(tabs)/designs')} style={{ paddingHorizontal: spacing.lg }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            {designs.slice(0, 6).map((d) => (
              <Pressable key={d.id} onPress={() => router.push({ pathname: '/design/result', params: { id: d.id } })} style={{ width: 170 }}>
                <DesignThumb {...d} height={120} />
                <T variant="bodyStrong" numberOfLines={1} style={{ marginTop: 6 }}>{d.name}</T>
                <T variant="caption">{pkr(d.estimate.low)} – {pkr(d.estimate.high)}</T>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Section title="Explore styles" style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.grid}>
          {STYLES.map((s, i) => {
            const pal = PALETTES[(i * 3 + 1) % PALETTES.length];
            return (
              <Pressable key={s.id} onPress={() => { tap(); startDesign({ styleId: s.id, paletteId: pal.id }); }} style={styles.styleCard}>
                <View style={{ height: 96 }}>
                  <RoomIllustration styleId={s.id} paletteId={pal.id} flooringId={s.id === 'luxury' ? 'marble' : s.id === 'scandinavian' ? 'laminate' : 'porcelain'} ceilingId={s.id === 'luxury' ? 'cove' : 'gypsum'} />
                </View>
                <View style={{ padding: spacing.md }}>
                  <T variant="bodyStrong">{s.label}</T>
                  <T variant="caption" numberOfLines={1}>{s.blurb}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Section title="Why RennovaAI">
          <Card>
            {[
              { icon: 'eye-outline' as const, title: 'See it first', body: 'AI previews of your own room reduce uncertainty.' },
              { icon: 'shield-checkmark-outline' as const, title: 'Trust the match', body: 'Every vendor passes CNIC, portfolio and reference checks.' },
              { icon: 'git-compare-outline' as const, title: 'Compare clearly', body: 'Structured quotes and timelines, side by side.' },
              { icon: 'lock-closed-outline' as const, title: 'Protected payments', body: 'Milestone escrow — money moves only when you approve.' },
            ].map((f, i) => (
              <Row key={f.title} style={{ alignItems: 'flex-start', marginTop: i ? spacing.lg : 0 }} gap={spacing.md}>
                <IconTile icon={f.icon} size={40} />
                <View style={{ flex: 1 }}>
                  <T variant="bodyStrong">{f.title}</T>
                  <T variant="small">{f.body}</T>
                </View>
              </Row>
            ))}
          </Card>
        </Section>

        {!referralUsed && (
          <Card style={{ marginTop: spacing.lg, backgroundColor: colors.amberSoft }}>
            <Row>
              <IconTile icon="gift" bg={colors.amber} color={colors.navyDeep} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{pkr(config.referralDiscount)} off your first booking</T>
                <T variant="small">Use code <T variant="small" style={{ fontFamily: fonts.bold, color: colors.navy }}>{config.referralCode}</T> at checkout.</T>
              </View>
              <Badge label="NEW" tone="amber" />
            </Row>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  hero: { marginTop: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, overflow: 'hidden', minHeight: 250 },
  heroArt: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '58%', opacity: 0.9 },
  step: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center' },
  stepLine: { position: 'absolute', left: '10%', right: '10%', top: 18, height: 3, borderRadius: 2, backgroundColor: colors.teal },
  roomTile: { width: 104, paddingVertical: spacing.lg, alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  styleCard: { width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
});
