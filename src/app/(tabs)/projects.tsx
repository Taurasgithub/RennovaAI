import { useRouter } from 'expo-router';
import { FlatList, Platform, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../auth/AuthProvider';
import { BookingCard } from '../../components/BookingCard';
import { Skeleton } from '../../components/motion';
import { Card, EmptyState, Row, Screen } from '../../components/ui';
import { useT } from '../../i18n';
import { needsAction, useBookings } from '../../services/bookings';
import { useApp } from '../../store/useApp';
import type { Booking } from '../../services/bookings';
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
  const insets = useSafeAreaInsets();

  if (!auth.enabled) {
    return <Screen back={false} title={t('projects.title')}><EmptyState icon="construct-outline" title={t('projects.offlineTitle')} body={t('projects.offlineBody')} /></Screen>;
  }

  const skeleton = (
    // Placeholder cards in the shape of the real ones while bookings load.
    <View>
      {[0, 1, 2].map((i) => (
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
      ))}
    </View>
  );

  return (
    <Screen back={false} title={t('projects.title')} scroll={false} padded={false}>
      {/* Virtualized: long booking histories stay smooth. */}
      <FlatList<Booking>
        data={loaded ? bookings : []}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BookingCard booking={item} attention={needsAction(item, me)} />}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}
        ListEmptyComponent={
          !loaded ? (
            skeleton
          ) : (
            <EmptyState
              icon="construct-outline"
              title={t('projects.emptyTitle')}
              body={t('projects.emptyBody')}
              action={t('projects.emptyAction')}
              onAction={() => { resetDraft(); router.push('/design/capture'); }}
            />
          )
        }
      />
    </Screen>
  );
}
