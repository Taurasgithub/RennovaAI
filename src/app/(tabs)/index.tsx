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
import { cityLabel, designName, projectTitle, roomLabel, styleBlurb, styleLabel, useT, type TKey } from '../../i18n';
import { pkr } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const JOURNEY: { n: string; label: TKey }[] = [
  { n: '01', label: 'home.j.scan' },
  { n: '02', label: 'home.j.design' },
  { n: '03', label: 'home.j.match' },
  { n: '04', label: 'home.j.compare' },
  { n: '05', label: 'home.j.build' },
];

const WHY: { icon: 'eye-outline' | 'shield-checkmark-outline' | 'git-compare-outline' | 'lock-closed-outline'; title: TKey; body: TKey }[] = [
  { icon: 'eye-outline', title: 'home.why1.title', body: 'home.why1.body' },
  { icon: 'shield-checkmark-outline', title: 'home.why2.title', body: 'home.why2.body' },
  { icon: 'git-compare-outline', title: 'home.why3.title', body: 'home.why3.body' },
  { icon: 'lock-closed-outline', title: 'home.why4.title', body: 'home.why4.body' },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, ur } = useT();
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
            <T variant="small">{t('home.greeting')}</T>
            <T variant="h1">{user?.name?.split(' ')[0] ?? t('home.there')} 👋</T>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.cityPill}>
            <Ionicons name="location" size={14} color={colors.tealDark} />
            <T variant="small" style={{ color: colors.navy, fontFamily: fonts.semibold }}>{cityLabel(user?.city ?? 'Sukkur')}</T>
          </Pressable>
        </Row>

        {/* Hero */}
        <LinearGradient colors={[colors.navy, colors.navyDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          {/* Urdu reads right-to-left, so the art moves to the left and the text sits on the dark right side. */}
          <View style={[styles.heroArt, ur && styles.heroArtUr]}>
            <RoomIllustration paletteId="teal-feature" styleId="modern" flooringId="porcelain" ceilingId="cove" extras={['panelling']} />
            <LinearGradient colors={[colors.navyDeep, 'transparent']} start={{ x: ur ? 1 : 0, y: 0 }} end={{ x: ur ? 0.3 : 0.7, y: 0 }} style={StyleSheet.absoluteFill} />
          </View>
          <T variant="overline" style={{ color: colors.amber }}>{t('home.heroOverline')}</T>
          <T variant="display" style={{ color: colors.white, marginTop: spacing.sm, fontSize: 27, lineHeight: 33 }}>
            {t('home.heroTitle')}
          </T>
          <T style={{ color: 'rgba(255,255,255,0.78)', marginTop: spacing.sm, maxWidth: 220, alignSelf: ur ? 'flex-end' : 'flex-start' }}>{t('home.heroBody')}</T>
          <Button title={t('home.heroCta')} kind="amber" icon="camera" onPress={() => startDesign()} style={{ marginTop: spacing.lg, alignSelf: ur ? 'flex-end' : 'flex-start' }} />
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
                <T variant="caption" style={{ marginTop: 4, color: colors.navy, fontFamily: fonts.bold, letterSpacing: 0.3 }}>{t(j.label).toUpperCase()}</T>
              </View>
            ))}
          </Row>
        </View>
      </View>

      {active && (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Section title={t('home.activeProject')}>
            <Card onPress={() => router.push(`/project/${active.id}`)}>
              <Row>
                <IconTile icon="hammer" bg={colors.amberSoft} color={colors.amberDark} />
                <View style={{ flex: 1 }}>
                  <T variant="h3" numberOfLines={1}>{projectTitle(active, designs)}</T>
                  <T variant="small">
                    {t('home.milestonesComplete', { done: active.milestones.filter((m) => m.status === 'released').length, total: active.milestones.length, amount: pkr(active.price - active.discount) })}
                  </T>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
              </Row>
            </Card>
          </Section>
        </View>
      )}

      <Section title={t('home.renovating')} style={{ paddingHorizontal: spacing.lg }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {ROOM_TYPES.map((r) => (
          <Pressable key={r.id} onPress={() => { tap(); startDesign({ roomTypeId: r.id, area: r.defaultArea }); }} style={styles.roomTile}>
            <IconTile icon={r.icon} size={46} />
            <T variant="small" style={{ color: colors.navy, fontFamily: fonts.semibold, marginTop: spacing.sm }}>{roomLabel(r.id)}</T>
          </Pressable>
        ))}
      </ScrollView>

      {designs.length > 0 && (
        <>
          <Section title={t('home.yourDesigns')} action={t('home.seeAll')} onAction={() => router.push('/(tabs)/designs')} style={{ paddingHorizontal: spacing.lg }} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
            {designs.slice(0, 6).map((d) => (
              <Pressable key={d.id} onPress={() => router.push({ pathname: '/design/result', params: { id: d.id } })} style={{ width: 170 }}>
                <DesignThumb {...d} height={120} />
                <T variant="bodyStrong" numberOfLines={1} style={{ marginTop: 6 }}>{designName(d)}</T>
                <T variant="caption">{pkr(d.estimate.low)} – {pkr(d.estimate.high)}</T>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Section title={t('home.exploreStyles')} style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.grid}>
          {STYLES.map((s, i) => {
            const pal = PALETTES[(i * 3 + 1) % PALETTES.length];
            return (
              <Pressable key={s.id} onPress={() => { tap(); startDesign({ styleId: s.id, paletteId: pal.id }); }} style={styles.styleCard}>
                <View style={{ height: 96 }}>
                  <RoomIllustration styleId={s.id} paletteId={pal.id} flooringId={s.id === 'luxury' ? 'marble' : s.id === 'scandinavian' ? 'laminate' : 'porcelain'} ceilingId={s.id === 'luxury' ? 'cove' : 'gypsum'} />
                </View>
                <View style={{ padding: spacing.md }}>
                  <T variant="bodyStrong">{styleLabel(s.id)}</T>
                  <T variant="caption" numberOfLines={1}>{styleBlurb(s.id)}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Section title={t('home.why')}>
          <Card>
            {WHY.map((f, i) => (
              <Row key={f.title} style={{ alignItems: 'flex-start', marginTop: i ? spacing.lg : 0 }} gap={spacing.md}>
                <IconTile icon={f.icon} size={40} />
                <View style={{ flex: 1 }}>
                  <T variant="bodyStrong">{t(f.title)}</T>
                  <T variant="small">{t(f.body)}</T>
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
                <T variant="bodyStrong">{t('home.referralTitle', { amount: pkr(config.referralDiscount) })}</T>
                <T variant="small">{t('home.referralBefore')} <T variant="small" style={{ fontFamily: fonts.bold, color: colors.navy }}>{config.referralCode}</T> {t('home.referralAfter')}</T>
              </View>
              <Badge label={t('home.new')} tone="amber" />
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
  heroArtUr: { right: undefined, left: 0 },
  step: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.tealDeep, alignItems: 'center', justifyContent: 'center' },
  stepLine: { position: 'absolute', left: '10%', right: '10%', top: 18, height: 3, borderRadius: 2, backgroundColor: colors.teal },
  roomTile: { width: 104, paddingVertical: spacing.lg, alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  styleCard: { width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
});
