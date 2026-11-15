import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { projectTitle, useT } from '../i18n';
import { pkr } from '../lib/format';
import type { Booking } from '../services/bookings';
import { colors, spacing } from '../theme';
import { BookingBadge } from './BookingBadge';
import { HouseBar } from './brand';
import { DesignThumb } from './DesignPreview';
import { Card, Row, T } from './ui';

/** A booking in a list: design thumbnail, title, status and stage progress. `attention` marks ones waiting on you. */
export function BookingCard({ booking: b, attention, subtitle }: { booking: Booking; attention?: boolean; subtitle?: string }) {
  const router = useRouter();
  const { t } = useT();
  const done = b.stages.filter((s) => s.status === 'approved').length;
  return (
    <Card style={[{ marginTop: spacing.md }, attention && { borderColor: colors.amber }]} onPress={() => router.push(`/project/${b.id}`)}>
      <Row gap={spacing.md}>
        <DesignThumb choices={b.design.choices} photoUri={b.photoUrl} resultUri={b.resultUrl} resultMode={b.design.result_mode ?? 'illustration'} size={64} />
        <View style={{ flex: 1 }}>
          <T variant="h3" numberOfLines={1}>{projectTitle(b)}</T>
          <T variant="small" numberOfLines={1}>{subtitle ?? b.vendorName}</T>
          <Row style={{ marginTop: 6 }} gap={6}>
            <BookingBadge status={b.status} />
            <T variant="caption">{pkr(b.price)}</T>
          </Row>
        </View>
        {attention ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.amber }} /> : <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />}
      </Row>
      {b.status === 'accepted' || b.status === 'completed' ? (
        <View style={{ marginTop: spacing.md }}>
          <HouseBar height={18} steps={b.stages.map((s) => (s.status === 'approved' ? 'done' : s.status === 'submitted' ? 'now' : 'next'))} />
          <T variant="caption" style={{ marginTop: 4 }}>{t('projects.stages', { done, total: b.stages.length })}</T>
        </View>
      ) : null}
    </Card>
  );
}
