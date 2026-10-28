import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { SERVICE_ICONS } from '../data/catalog';
import type { Vendor } from '../data/vendors';
import { colors, fonts, spacing } from '../theme';
import { RoomIllustration } from './RoomIllustration';
import { Badge, Card, Row, T } from './ui';

export function VendorAvatar({ vendor, size = 52 }: { vendor: Vendor; size?: number }) {
  const initials = vendor.name.split(' ').slice(0, 2).map((w) => w[0]).join('');
  const bg = vendor.pro ? colors.navy : colors.teal;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <T style={{ color: colors.white, fontFamily: fonts.bold, fontSize: size * 0.34 }}>{initials}</T>
      {vendor.verified && (
        <View style={{ position: 'absolute', right: -4, bottom: -4, backgroundColor: colors.white, borderRadius: 10 }}>
          <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
        </View>
      )}
    </View>
  );
}

export function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const p = vendor.portfolio[0];
  return (
    <Card onPress={onPress} style={{ padding: 0, overflow: 'hidden', marginBottom: spacing.md }}>
      <View style={{ height: 120 }}>
        <RoomIllustration paletteId={p.paletteId} styleId={p.styleId} flooringId={p.flooringId} ceilingId={p.ceilingId} />
        <View style={{ position: 'absolute', left: 10, top: 10, flexDirection: 'row', gap: 6 }}>
          {vendor.pro && <Badge label="FEATURED" tone="amber" icon="star" />}
        </View>
      </View>
      <View style={{ padding: spacing.lg }}>
        <Row style={{ alignItems: 'flex-start' }} gap={spacing.md}>
          <VendorAvatar vendor={vendor} size={46} />
          <View style={{ flex: 1 }}>
            <T variant="h3" numberOfLines={1}>{vendor.name}</T>
            <T variant="small" numberOfLines={1}>{vendor.services.join(' · ')}</T>
            <Row style={{ marginTop: 6 }} gap={12}>
              <Row gap={3}>
                <Ionicons name="star" size={13} color={colors.amber} />
                <T variant="small" style={{ color: colors.text, fontFamily: fonts.bold }}>{vendor.rating.toFixed(1)}</T>
                <T variant="caption">({vendor.reviewCount})</T>
              </Row>
              <Row gap={3}>
                <Ionicons name="location-outline" size={13} color={colors.textSubtle} />
                <T variant="caption">{vendor.area}, {vendor.city}</T>
              </Row>
            </Row>
          </View>
        </Row>
        <Row style={{ marginTop: spacing.md, flexWrap: 'wrap' }} gap={6}>
          {vendor.verified && <Badge label="VERIFIED" tone="teal" icon="shield-checkmark" />}
          <Badge label={`${vendor.jobsCompleted} JOBS`} tone="navy" />
          <Badge label={vendor.availableFrom.toUpperCase()} tone="green" icon="calendar-outline" />
          {vendor.services.slice(0, 1).map((s) => (
            <Badge key={s} label={s.toUpperCase()} tone="gray" icon={SERVICE_ICONS[s]} />
          ))}
        </Row>
      </View>
    </Card>
  );
}
