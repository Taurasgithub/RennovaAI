import { useRouter } from 'expo-router';
import { RefreshControl, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { BookingCard } from '../../components/BookingCard';
import { Skeleton } from '../../components/motion';
import { Card, EmptyState, Row, Screen } from '../../components/ui';
import { useT } from '../../i18n';
import { needsAction, useBookings } from '../../services/bookings';
import { useApp } from '../../store/useApp';
import { spacing } from '../../theme';

/** The customer's bookings: requests, jobs in progress and finished ones. */
export default function Projects() {
  const router = useRouter();
  const { t } = useT();
  const auth = useAuth();
  const me = auth.session?.user.id ?? null;
  const resetDraft = useApp((s) => s.resetDraft);
  const all = useBookings((s) => s.bookings);
  const loaded = useBookings((s) => s.loaded);
  const reload = useBookings((s) => s.reload);
  const bookings = all.filter((b) => b.customerId === me);

  if (!auth.enabled) {
    return <Screen back={false} title={t('projects.title')}><EmptyState icon="construct-outline" title={t('projects.offlineTitle')} body={t('projects.offlineBody')} /></Screen>;
  }

  return (
    <Screen back={false} title={t('projects.title')} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
      {!loaded ? (
        // Placeholder cards in the shape of the real ones while bookings load.
        [0, 1, 2].map((i) => (
          <Card key={i} style={{ marginTop: spacing.md }}>
            <Row gap={spacing.md}>
              <Skeleton width={64} height={64} radius={12} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="45%" height={12} />
                <Skeleton width={90} height={20} radius={6} />
              </View>
            </Row>
          </Card>
        ))
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          title={t('projects.emptyTitle')}
          body={t('projects.emptyBody')}
          action={t('projects.emptyAction')}
          onAction={() => { resetDraft(); router.push('/design/capture'); }}
        />
      ) : (
        bookings.map((b) => <BookingCard key={b.id} booking={b} attention={needsAction(b, me)} />)
      )}
    </Screen>
  );
}
