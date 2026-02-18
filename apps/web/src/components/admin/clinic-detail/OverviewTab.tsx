import type { ClinicDetailEnriched } from '@/types';
import SubscriptionCard from './SubscriptionCard';
import TodayActivityCard from './TodayActivityCard';
import QueueAnalyticsCard from './QueueAnalyticsCard';
import OperationalProfileCard from './OperationalProfileCard';
import AccountTimeline from './AccountTimeline';

interface Props {
  clinic: ClinicDetailEnriched;
  onExtendTrial: () => void;
  onUpgrade: () => void;
}

export default function OverviewTab({ clinic, onExtendTrial, onUpgrade }: Props) {
  return (
    <div>
      {/* Row 1: Subscription + Today's Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, alignItems: 'start' }}>
        <SubscriptionCard clinic={clinic} onExtend={onExtendTrial} onUpgrade={onUpgrade} />
        <TodayActivityCard clinic={clinic} />
      </div>

      {/* Row 2: Queue Analytics (full width) */}
      <div style={{ marginBottom: 16 }}>
        <QueueAnalyticsCard clinic={clinic} />
      </div>

      {/* Row 3: Operational Profile + Account Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <OperationalProfileCard clinic={clinic} />
        <AccountTimeline timeline={clinic.timeline} />
      </div>
    </div>
  );
}
