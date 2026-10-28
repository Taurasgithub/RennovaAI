import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { RoomIllustration } from '../../components/RoomIllustration';
import { VendorAvatar } from '../../components/VendorCard';
import { Badge, Button, Card, Divider, EmptyState, Row, Screen, Section, Stars, T } from '../../components/ui';
import { SERVICE_ICONS } from '../../data/catalog';
import { getVendor } from '../../data/vendors';
import { roundTo } from '../../lib/format';
import { useApp } from '../../store/useApp';
import { colors, fonts, radius, spacing } from '../../theme';

const CHECKS = ['CNIC & phone verified', 'Portfolio reviewed', 'Two customer references', 'Platform orientation completed'];

export default function VendorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vendor = getVendor(id);
  const latest = useApp((s) => s.designs[0]);
  const resetDraft = useApp((s) => s.resetDraft);

  if (!vendor) return <Screen title="Vendor"><EmptyState icon="alert-circle-outline" title="Vendor not found" body="This listing is no longer available." /></Screen>;

  const quote = () => {
    if (latest) {
      router.push({
        pathname: '/book/[vendorId]',
        params: {
          vendorId: vendor.id,
          designId: latest.id,
          price: String(roundTo(latest.estimate.mid * vendor.priceFactor, 1000)),
          days: String(Math.max(2, Math.round(latest.estimate.days * vendor.speedFactor))),
        },
      });
    } else {
      resetDraft();
      router.push('/design/capture');
    }
  };

  return (
    <Screen padded={false} title="" footer={<Button title={latest ? `Get a quote for “${latest.name}”` : 'Design your room to get a quote'} icon="document-text-outline" onPress={quote} />}>
      <View style={{ height: 170, marginHorizontal: spacing.lg, borderRadius: radius.lg, overflow: 'hidden' }}>
        <RoomIllustration {...vendor.portfolio[0]} />
      </View>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Row style={{ marginTop: -28, alignItems: 'flex-end', paddingHorizontal: spacing.md }} gap={spacing.md}>
          <View style={{ borderWidth: 4, borderColor: colors.bg, borderRadius: 24 }}>
            <VendorAvatar vendor={vendor} size={68} />
          </View>
          {vendor.pro && <Badge label="FEATURED PRO" tone="amber" icon="star" />}
        </Row>
        <T variant="h1" style={{ marginTop: spacing.md }}>{vendor.name}</T>
        <T variant="small">{vendor.owner} · {vendor.area}, {vendor.city}</T>

        <Row style={{ marginTop: spacing.lg }} gap={spacing.sm}>
          {[
            [vendor.rating.toFixed(1), `${vendor.reviewCount} reviews`, 'star'],
            [String(vendor.jobsCompleted), 'jobs done', 'briefcase'],
            [`${vendor.yearsExperience} yrs`, 'experience', 'ribbon'],
          ].map(([v, l, icon]) => (
            <Card key={l} style={styles.stat}>
              <Ionicons name={icon as 'star'} size={16} color={colors.amber} />
              <T variant="h3" style={{ color: colors.navy, fontFamily: fonts.bold }}>{v}</T>
              <T variant="caption">{l}</T>
            </Card>
          ))}
        </Row>

        <Section title="About">
          <T>{vendor.about}</T>
          <Row style={{ flexWrap: 'wrap', marginTop: spacing.md }} gap={6}>
            {vendor.services.map((s) => <Badge key={s} label={s.toUpperCase()} tone="teal" icon={SERVICE_ICONS[s]} />)}
            <Badge label={`AVAILABLE ${vendor.availableFrom.toUpperCase()}`} tone="green" icon="calendar-outline" />
            <Badge label={`REPLIES ${vendor.responseTime.toUpperCase()}`} tone="gray" icon="chatbubble-outline" />
          </Row>
        </Section>
      </View>

      <Section title="Portfolio" style={{ paddingHorizontal: spacing.lg }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {vendor.portfolio.map((p) => (
          <View key={p.title} style={{ width: 220 }}>
            <View style={{ height: 140, borderRadius: radius.md, overflow: 'hidden' }}>
              <RoomIllustration {...p} />
            </View>
            <T variant="bodyStrong" style={{ marginTop: 6 }}>{p.title}</T>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Section title="RennovaAI verification">
          <Card>
            {CHECKS.map((c, i) => (
              <Row key={c} style={{ marginTop: i ? spacing.md : 0 }}>
                <Ionicons name="checkmark-circle" size={20} color={colors.teal} />
                <T variant="bodyStrong">{c}</T>
              </Row>
            ))}
          </Card>
        </Section>

        <Section title="Reviews">
          <Card>
            {vendor.reviews.map((r, i) => (
              <View key={r.name + i}>
                {i > 0 && <Divider />}
                <Row style={{ justifyContent: 'space-between' }}>
                  <T variant="bodyStrong">{r.name}</T>
                  <T variant="caption">{r.date}</T>
                </Row>
                <View style={{ marginTop: 4 }}><Stars value={r.rating} size={13} /></View>
                <T variant="small" style={{ marginTop: 6, color: colors.text }}>{r.text}</T>
              </View>
            ))}
          </Card>
        </Section>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.sm, gap: 2 },
});
