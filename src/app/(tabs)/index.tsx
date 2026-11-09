import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HouseAvatar, HouseBeforeAfter, Marker, Sparkle } from '../../components/brand';
import { DesignThumb } from '../../components/DesignPreview';
import { RoomIllustration } from '../../components/RoomIllustration';
import { Badge, Button, Card, IconTile, Row, Section, T, tap, Txt } from '../../components/ui';
import { config } from '../../config';
import { PALETTES, ROOM_TYPES, STYLES } from '../../data/catalog';
import { budgetLabel, cityLabel, designName, projectTitle, roomLabel, styleBlurb, styleLabel, useT, type TKey } from '../../i18n';
import { pkr } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, fonts, spacing } from '../../theme';

const WHY: { icon: 'eye-outline' | 'shield-checkmark-outline' | 'git-compare-outline' | 'lock-closed-outline'; title: TKey; body: TKey }[] = [
  { icon: 'eye-outline', title: 'home.why1.title', body: 'home.why1.body' },
  { icon: 'shield-checkmark-outline', title: 'home.why2.title', body: 'home.why2.body' },
  { icon: 'git-compare-outline', title: 'home.why3.title', body: 'home.why3.body' },
  { icon: 'lock-closed-outline', title: 'home.why4.title', body: 'home.why4.body' },
];

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, ur } = useT();
  const { user, designs, projects, resetDraft, updateDraft, referralUsed } = useApp();
  const active = projects.find((p) => p.status === 'active');

  const firstName = user?.name?.split(' ')[0] ?? t('home.there');
  const favouriteIds = user?.preferredStyles ?? [];
  const favourites = STYLES.filter((s) => favouriteIds.includes(s.id));
  const orderedStyles = [...favourites, ...STYLES.filter((s) => !favouriteIds.includes(s.id))];

  const startDesign = (preset?: { roomTypeId?: string; area?: number; styleId?: string; paletteId?: string }) => {
    resetDraft();
    if (preset) updateDraft(preset);
    router.push('/design/capture');
  };

  const heroW = Math.min(width - 72, 340);
  const [tag1, tag2] = t('home.heroTitle').split('\n');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
      {/* Teal header; the house-shaped before/after sits half on it, half below it. */}
      <View style={[styles.band, { height: insets.top + 236 }]} />
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.push('/(tabs)/profile')} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 }}>
            <HouseAvatar uri={user?.avatarUri} name={user?.name ?? 'R'} size={42} bg="rgba(255,255,255,0.2)" />
            <View style={{ flexShrink: 1 }}>
              <T variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>{t('home.greeting')}</T>
              <T variant="h1" numberOfLines={1} style={{ color: colors.white, fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26 }}>{user?.name || t('home.there')}</T>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.cityPill}>
            <Ionicons name="location" size={14} color={colors.white} />
            <T variant="small" style={{ color: colors.white, fontFamily: fonts.bold }}>{cityLabel(user?.city ?? 'Sukkur')}</T>
          </Pressable>
        </Row>

        <Pressable onPress={() => startDesign()} accessibilityRole="button" accessibilityLabel={t('home.heroCta')} style={{ alignItems: 'center', marginTop: spacing.xl }}>
          <HouseBeforeAfter width={heroW} before={BEFORE} after={AFTER} beforeLabel={t('ba.before')} afterLabel={t('ba.after')} />
        </Pressable>

        {/* The logo's tagline */}
        <View style={{ marginTop: spacing.lg }}>
          <T style={[styles.tagline, ur && { textAlign: 'right' }]}>{tag1}</T>
          {!!tag2 && <T style={[styles.tagline, { color: colors.teal }, ur && { textAlign: 'right' }]}>{tag2}</T>}
          <T style={{ marginTop: spacing.sm, alignSelf: ur ? 'flex-end' : 'flex-start' }}>{t('home.heroBody')}</T>
        </View>
        <Pressable onPress={() => startDesign()} accessibilityRole="button" style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
          <Sparkle size={20} />
          <Txt style={styles.ctaText}>{t('home.heroCta')}</Txt>
        </Pressable>
      </View>

      {active && (
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Section title={t('home.activeProject')} action={t('home.seeAll')} onAction={() => router.push('/(tabs)/projects')}>
            <Card onPress={() => router.push(`/project/${active.id}`)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T variant="h3" numberOfLines={1} style={{ flex: 1, fontFamily: fonts.extrabold, color: colors.navy }}>{projectTitle(active, designs)}</T>
                <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
              </Row>
              <Row style={{ marginTop: spacing.md }} gap={6}>
                {active.milestones.map((m, i) => {
                  const firstOpen = active.milestones.findIndex((x) => x.status !== 'released');
                  return <Marker key={m.id} state={m.status === 'released' ? 'done' : i === firstOpen ? 'now' : 'next'} label={i + 1} size={28} />;
                })}
              </Row>
              <T variant="small" style={{ marginTop: spacing.sm }}>
                {t('home.milestonesComplete', { done: active.milestones.filter((m) => m.status === 'released').length, total: active.milestones.length, amount: pkr(active.price - active.discount) })}
              </T>
            </Card>
          </Section>
        </View>
      )}

      <Section title={t('home.renovating')} style={{ paddingHorizontal: spacing.lg }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {ROOM_TYPES.map((r) => (
          <Pressable key={r.id} onPress={() => { tap(); startDesign({ roomTypeId: r.id, area: r.defaultArea }); }} style={({ pressed }) => [styles.roomTile, pressed && { backgroundColor: colors.teal }]}>
            {({ pressed }) => (
              <>
                <Ionicons name={r.icon} size={26} color={pressed ? colors.white : colors.navy} />
                <T variant="small" numberOfLines={1} style={{ color: pressed ? colors.white : colors.navy, fontFamily: fonts.bold, marginTop: spacing.sm }}>{roomLabel(r.id)}</T>
              </>
            )}
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

      {/* Personalised: favourite styles from the profile, or a nudge to pick some. */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        {favourites.length > 0 ? (
          <Section title={t('home.pickedFor', { name: firstName })} action={t('common.edit')} onAction={() => router.push('/profile-edit')}>
            <Card style={{ backgroundColor: colors.tealTint, borderColor: colors.tealTint }}>
              <T variant="small" style={{ color: colors.text }}>
                {user?.budget ? t('home.pickedBodyBudget', { budget: budgetLabel(user.budget) }) : t('home.pickedBody')}
              </T>
              <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={spacing.sm}>
                {favourites.map((s) => (
                  <Button key={s.id} title={styleLabel(s.id)} kind="secondary" icon="sparkles" small onPress={() => startDesign({ styleId: s.id })} />
                ))}
              </Row>
            </Card>
          </Section>
        ) : (
          <Card style={{ marginTop: spacing.xxl, backgroundColor: colors.tealTint, borderColor: colors.tealTint }} onPress={() => router.push('/profile-edit')}>
            <Row>
              <IconTile icon="heart-outline" bg={colors.white} />
              <View style={{ flex: 1 }}>
                <T variant="bodyStrong">{t('home.personaliseTitle')}</T>
                <T variant="small">{t('home.personaliseBody')}</T>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
            </Row>
          </Card>
        )}
      </View>

      <Section title={t('home.exploreStyles')} style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.grid}>
          {orderedStyles.map((s) => {
            const pal = PALETTES[(STYLES.indexOf(s) * 3 + 1) % PALETTES.length];
            const fav = favouriteIds.includes(s.id);
            return (
              <Pressable key={s.id} onPress={() => { tap(); startDesign({ styleId: s.id, paletteId: pal.id }); }} style={[styles.styleCard, fav && { borderColor: colors.teal, borderWidth: 1.5 }]}>
                <View style={{ height: 96 }}>
                  <RoomIllustration styleId={s.id} paletteId={pal.id} flooringId={s.id === 'luxury' ? 'marble' : s.id === 'scandinavian' ? 'laminate' : 'porcelain'} ceilingId={s.id === 'luxury' ? 'cove' : 'gypsum'} />
                  {fav && (
                    <View style={styles.favTag}>
                      <Ionicons name="heart" size={12} color={colors.white} />
                    </View>
                  )}
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
          <Card style={{ marginTop: spacing.lg, backgroundColor: colors.amberTint, borderColor: colors.amberTint }}>
            <Row>
              <View style={styles.giftTile}><Sparkle size={24} color={colors.navy} /></View>
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

const BEFORE = require('../../../assets/images/onboarding-before.jpg');
const AFTER = require('../../../assets/images/onboarding-after.jpg');

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.teal },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  tagline: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: colors.navy, letterSpacing: -0.8 },
  cta: { marginTop: spacing.lg, height: 56, borderRadius: 12, backgroundColor: colors.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  ctaText: { fontFamily: fonts.bold, fontSize: 15.5, color: colors.white },
  roomTile: { width: 104, height: 92, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, backgroundColor: colors.mist, borderRadius: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  styleCard: { width: '47.5%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.line },
  favTag: { position: 'absolute', right: 8, top: 8, width: 22, height: 22, borderRadius: 6, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  giftTile: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
});
