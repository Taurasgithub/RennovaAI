import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { VendorAvatar } from '../components/VendorCard';
import { Badge, Button, Card, Chip, EmptyState, Row, Screen, T } from '../components/ui';
import { matchVendors } from '../lib/matching';
import { pkr, pkrShort } from '../lib/format';
import { useApp } from '../store/useApp';
import { colors, fonts, radius, spacing } from '../theme';

type Sort = 'match' | 'price' | 'speed' | 'rating';

export default function Compare() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const design = useApp((s) => s.designs.find((d) => d.id === id));
  const city = useApp((s) => s.user?.city ?? 'Sukkur');
  const [sort, setSort] = useState<Sort>('match');
  const [budget, setBudget] = useState<number | undefined>(undefined);

  const quotes = useMemo(() => {
    if (!design) return [];
    const q = matchVendors(design.estimate, city, budget);
    const sorted = [...q];
    if (sort === 'price') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'speed') sorted.sort((a, b) => a.days - b.days);
    if (sort === 'rating') sorted.sort((a, b) => b.vendor.rating - a.vendor.rating);
    return sorted;
  }, [design, city, budget, sort]);

  if (!design) return <Screen title="Compare quotes"><EmptyState icon="alert-circle-outline" title="Design not found" body="Start a new design to get quotes." /></Screen>;
  const bestId = matchVendors(design.estimate, city, budget)[0]?.vendor.id;
  const e = design.estimate;

  return (
    <Screen title="Compare quotes" subtitle={`${quotes.length} verified vendors in ${city}`}>
      <T variant="small" style={{ marginTop: spacing.sm }}>
        Shortlisted by service type, location, budget and availability for “{design.name}”.
      </T>

      <T variant="bodyStrong" style={{ marginTop: spacing.lg }}>Your budget</T>
      <Row style={{ flexWrap: 'wrap', marginTop: spacing.sm }} gap={6}>
        <Chip label="Any" selected={!budget} onPress={() => setBudget(undefined)} />
        {[e.low, e.mid, e.high].map((b) => (
          <Chip key={b} label={`≤ ${pkrShort(b)}`} selected={budget === b} onPress={() => setBudget(b)} />
        ))}
      </Row>

      {quotes.length > 0 && (
        <Card style={{ marginTop: spacing.lg, padding: 0, overflow: 'hidden' }}>
          <Row style={[styles.tr, styles.th]} gap={0}>
            <T variant="caption" style={[styles.td, { flex: 1.6, color: colors.white }]}>VENDOR</T>
            <T variant="caption" style={[styles.td, { color: colors.white }]}>QUOTE</T>
            <T variant="caption" style={[styles.td, { color: colors.white }]}>DAYS</T>
            <T variant="caption" style={[styles.td, { flex: 0.7, color: colors.white }]}>★</T>
          </Row>
          {quotes.map((q, i) => {
            const cheapest = Math.min(...quotes.map((x) => x.price)) === q.price;
            const fastest = Math.min(...quotes.map((x) => x.days)) === q.days;
            return (
              <Row key={q.vendor.id} style={[styles.tr, i % 2 === 1 && { backgroundColor: colors.tealMist }]} gap={0}>
                <T variant="small" numberOfLines={1} style={[styles.td, { flex: 1.6, color: colors.text, fontFamily: fonts.semibold }]}>{q.vendor.name}</T>
                <T variant="small" style={[styles.td, cheapest && styles.win]}>{pkrShort(q.price).replace('PKR ', '')}</T>
                <T variant="small" style={[styles.td, fastest && styles.win]}>{q.days}</T>
                <T variant="small" style={[styles.td, { flex: 0.7 }]}>{q.vendor.rating.toFixed(1)}</T>
              </Row>
            );
          })}
        </Card>
      )}

      <Row style={{ flexWrap: 'wrap', marginTop: spacing.xl }} gap={6}>
        <Chip label="Best match" icon="sparkles-outline" selected={sort === 'match'} onPress={() => setSort('match')} />
        <Chip label="Lowest price" icon="pricetag-outline" selected={sort === 'price'} onPress={() => setSort('price')} />
        <Chip label="Fastest" icon="flash-outline" selected={sort === 'speed'} onPress={() => setSort('speed')} />
        <Chip label="Top rated" icon="star-outline" selected={sort === 'rating'} onPress={() => setSort('rating')} />
      </Row>

      {quotes.length === 0 && <EmptyState icon="people-outline" title="No vendors yet" body={`We're onboarding verified vendors in ${city}. Try another city from your profile.`} />}

      {quotes.map((q) => (
        <Card key={q.vendor.id} style={[{ marginTop: spacing.md }, q.vendor.id === bestId && { borderWidth: 2, borderColor: colors.teal }]}>
          {q.vendor.id === bestId && (
            <View style={styles.ribbon}>
              <Ionicons name="sparkles" size={12} color={colors.navyDeep} />
              <T variant="caption" style={{ color: colors.navyDeep, fontFamily: fonts.bold }}>BEST MATCH</T>
            </View>
          )}
          <Row style={{ alignItems: 'flex-start' }} gap={spacing.md}>
            <VendorAvatar vendor={q.vendor} size={48} />
            <View style={{ flex: 1 }}>
              <T variant="h3" numberOfLines={1}>{q.vendor.name}</T>
              <Row gap={4}>
                <Ionicons name="star" size={13} color={colors.amber} />
                <T variant="small">{q.vendor.rating.toFixed(1)} ({q.vendor.reviewCount}) · {q.vendor.jobsCompleted} jobs</T>
              </Row>
            </View>
          </Row>
          <Row style={{ marginTop: spacing.md }} gap={spacing.md}>
            <View style={styles.stat}>
              <T variant="caption">Quoted price</T>
              <T variant="h3" style={{ color: colors.navy }}>{pkr(q.price)}</T>
            </View>
            <View style={styles.stat}>
              <T variant="caption">Completion</T>
              <T variant="h3" style={{ color: colors.navy }}>{q.days} days</T>
            </View>
          </Row>
          <View style={{ marginTop: spacing.md, gap: 4 }}>
            {q.reasons.slice(0, 3).map((r) => (
              <Row key={r} gap={6}>
                <Ionicons name="checkmark" size={15} color={colors.teal} />
                <T variant="small">{r}</T>
              </Row>
            ))}
          </View>
          <Row style={{ marginTop: spacing.lg, flexWrap: 'wrap' }} gap={6}>
            {q.vendor.verified && <Badge label="VERIFIED" tone="teal" icon="shield-checkmark" />}
            <Badge label={`REPLIES ${q.vendor.responseTime.toUpperCase()}`} tone="gray" icon="chatbubble-outline" />
          </Row>
          <Row style={{ marginTop: spacing.lg }} gap={spacing.md}>
            <Button title="Profile" kind="secondary" small onPress={() => router.push(`/vendor/${q.vendor.id}`)} style={{ flex: 1 }} />
            <Button
              title="Book"
              small
              icon="lock-closed"
              onPress={() => router.push({ pathname: '/book/[vendorId]', params: { vendorId: q.vendor.id, designId: design.id, price: String(q.price), days: String(q.days) } })}
              style={{ flex: 1.4 }}
            />
          </Row>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tr: { paddingHorizontal: spacing.md, paddingVertical: 10 },
  th: { backgroundColor: colors.navy },
  td: { flex: 1, color: colors.textMuted },
  win: { color: colors.tealDark, fontFamily: fonts.bold },
  stat: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.md },
  ribbon: { position: 'absolute', right: 12, top: -11, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.amber, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
});
