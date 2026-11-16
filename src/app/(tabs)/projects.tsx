import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { BookingCard } from '../../components/BookingCard';
import { EmptyState, Screen } from '../../components/ui';
import { useT } from '../../i18n';
import { needsAction, useBookings } from '../../services/bookings';
import { useApp } from '../../store/useApp';
import { colors, spacing } from '../../theme';

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
        <ActivityIndicator color={colors.teal} style={{ marginTop: spacing.xxxl }} />
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
