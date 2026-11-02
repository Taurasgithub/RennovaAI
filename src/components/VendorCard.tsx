import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { SERVICE_ICONS } from '../data/catalog';
import type { Vendor } from '../data/vendors';
import { availabilityLabel, cityLabel, ratingLabel, serviceLabel, useT } from '../i18n';
import { colors, fonts, spacing } from '../theme';
import { Avatar } from './Avatar';
import { RoomIllustration } from './RoomIllustration';
import { Badge, Card, Row, T } from './ui';

export function VendorAvatar({ vendor, size = 52 }: { vendor: Vendor; size?: number }) {
  return (
    <View>
      <Avatar uri={vendor.account?.logoUrl} name={vendor.name} size={size} bg={vendor.pro ? colors.navy : colors.teal} />
      {vendor.verified && (
        <View style={{ position: 'absolute', right: -4, bottom: -4, backgroundColor: colors.white, borderRadius: 10 }}>
          <Ionicons name="checkmark-circle" size={18} color={colors.teal} />
        </View>
      )}
    </View>
  );
}

/** Cover for a vendor: their own photo (accounts) or the illustrated sample portfolio piece. */
export function VendorCover({ vendor }: { vendor: Vendor }) {
  const photo = vendor.account?.coverUrl ?? vendor.account?.photos[0];
  if (photo) return <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />;
  const p = vendor.portfolio[0];
  return p ? (
    <RoomIllustration paletteId={p.paletteId} styleId={p.styleId} flooringId={p.flooringId} ceilingId={p.ceilingId} />
  ) : (
    <RoomIllustration paletteId="sea-breeze" styleId="modern" flooringId="porcelain" ceilingId="gypsum" />
  );
}

export function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const { t } = useT();
  const isNew = !!vendor.account && vendor.reviewCount === 0;
  return (
    <Card onPress={onPress} style={{ padding: 0, overflow: 'hidden', marginBottom: spacing.md }}>
      <View style={{ height: 120 }}>
        <VendorCover vendor={vendor} />
        <View style={{ position: 'absolute', left: 10, top: 10, flexDirection: 'row', gap: 6 }}>
          {vendor.pro && <Badge label={t('vendors.featured')} tone="amber" icon="star" />}
          {isNew && <Badge label={t('vendor.newBadge')} tone="teal" icon="sparkles" />}
        </View>
      </View>
      <View style={{ padding: spacing.lg }}>
        <Row style={{ alignItems: 'flex-start' }} gap={spacing.md}>
          <VendorAvatar vendor={vendor} size={46} />
          <View style={{ flex: 1 }}>
            <T variant="h3" numberOfLines={1}>{vendor.name}</T>
            <T variant="small" numberOfLines={1}>{vendor.services.map(serviceLabel).join(' · ')}</T>
            <Row style={{ marginTop: 6 }} gap={12}>
              <Row gap={3}>
                <Ionicons name="star" size={13} color={colors.amber} />
                <T variant="small" style={{ color: colors.text, fontFamily: fonts.bold }}>{ratingLabel(vendor)}</T>
                {vendor.reviewCount > 0 && <T variant="caption">({vendor.reviewCount})</T>}
              </Row>
              <Row gap={3} style={{ flexShrink: 1 }}>
                <Ionicons name="location-outline" size={13} color={colors.textSubtle} />
                <T variant="caption" numberOfLines={1}>{vendor.area ? `${vendor.area}, ` : ''}{cityLabel(vendor.city)}</T>
              </Row>
            </Row>
          </View>
        </Row>
        <Row style={{ marginTop: spacing.md, flexWrap: 'wrap' }} gap={6}>
          {vendor.verified && <Badge label={t('common.verified')} tone="teal" icon="shield-checkmark" />}
          {vendor.jobsCompleted > 0 && <Badge label={t('common.jobsUpper', { n: vendor.jobsCompleted })} tone="navy" />}
          <Badge label={availabilityLabel(vendor.availableFrom).toUpperCase()} tone="green" icon="calendar-outline" />
          {vendor.services.slice(0, 1).map((s) => (
            <Badge key={s} label={serviceLabel(s).toUpperCase()} tone="gray" icon={SERVICE_ICONS[s]} />
          ))}
        </Row>
      </View>
    </Card>
  );
}
