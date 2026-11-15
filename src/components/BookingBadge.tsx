import { useT, type TKey } from '../i18n';
import type { BookingStatus } from '../services/bookings';
import { Badge } from './ui';

const BADGE: Record<BookingStatus, { key: TKey; tone: 'amber' | 'teal' | 'gray' | 'green' }> = {
  requested: { key: 'project.badge.requested', tone: 'amber' },
  accepted: { key: 'project.badge.accepted', tone: 'teal' },
  declined: { key: 'project.badge.declined', tone: 'gray' },
  cancelled: { key: 'project.badge.cancelled', tone: 'gray' },
  completed: { key: 'project.badge.completed', tone: 'green' },
};

export function BookingBadge({ status }: { status: BookingStatus }) {
  const { t } = useT();
  return <Badge label={t(BADGE[status].key)} tone={BADGE[status].tone} />;
}
