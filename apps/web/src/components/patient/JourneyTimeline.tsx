import { useTranslation } from 'react-i18next';
import { formatTime } from '@/lib/time';
import TimelineStep from './TimelineStep';

type QueueState = 'far' | 'closer' | 'almost' | 'next' | 'yourTurn' | 'completed' | 'cancelled';
type StepStatus = 'completed' | 'active' | 'future';

interface JourneyTimelineProps {
  queueState: QueueState;
  displayPosition: number;
  estimatedWaitMins: number;
  arrivedAt: string;
  isDoctorPresent?: boolean;
  patientName?: string;
  avgConsultationMins?: number;
  appointmentTime?: string | null;
  doctorName?: string;
  genderContext?: string;
}

/**
 * Vertical timeline showing the patient's journey through 5 stages:
 * 1. Enregistré (Checked in)
 * 2. En attente (Waiting)
 * 3. Bientôt votre tour (Almost there)
 * 4. C'est votre tour (Your turn)
 * 5. Terminé (Done)
 */
export default function JourneyTimeline({
  queueState,
  displayPosition,
  estimatedWaitMins,
  arrivedAt,
  isDoctorPresent,
  avgConsultationMins,
  doctorName,
  genderContext,
}: JourneyTimelineProps) {
  const { t } = useTranslation();

  const isGreen = queueState === 'yourTurn' || queueState === 'completed';

  // Calculate step statuses based on queue state
  const getStepStatuses = (): StepStatus[] => {
    switch (queueState) {
      case 'far':
      case 'closer':
        return ['completed', 'active', 'future', 'future', 'future'];
      case 'almost':
        return ['completed', 'completed', 'active', 'future', 'future'];
      case 'next':
        return ['completed', 'completed', 'completed', 'active', 'future'];
      case 'yourTurn':
        return ['completed', 'completed', 'completed', 'completed', 'active'];
      case 'completed':
        return ['completed', 'completed', 'completed', 'completed', 'completed'];
      case 'cancelled':
        return ['completed', 'active', 'future', 'future', 'future'];
      default:
        return ['completed', 'active', 'future', 'future', 'future'];
    }
  };

  const statuses = getStepStatuses();
  // When doctor is present, displayPosition already subtracted 1 for the in-consultation person
  // but that person IS still ahead — add them back so the count matches the wait estimate
  const peopleAhead = isDoctorPresent ? displayPosition : Math.max(0, displayPosition - 1);

  // Get contextual tip based on state
  const getContextualTip = (): { icon: string; text: string } | null => {
    if (queueState === 'far' || queueState === 'closer') {
      if (estimatedWaitMins > 20) {
        return { icon: 'coffee', text: t('patient.timeline.tipCoffee') };
      }
      return { icon: 'location_on', text: t('patient.timeline.tipStayClose') };
    }
    if (queueState === 'almost') {
      return { icon: 'location_on', text: t('patient.timeline.tipStayClose') };
    }
    return null;
  };

  const tip = getContextualTip();

  // Cancelled state: show only 2 steps
  if (queueState === 'cancelled') {
    return (
      <div className="px-1">
        <TimelineStep
          status="completed"
          icon="check_circle"
          title={t('patient.timeline.checkedIn')}
          timestamp={formatTime(arrivedAt)}
        />
        <TimelineStep
          status="active"
          icon="cancel"
          title={t('patient.leftQueue')}
          isLast
        >
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <p className="text-sm text-gray-600">{t('patient.leftQueueMessage')}</p>
          </div>
        </TimelineStep>
      </div>
    );
  }

  return (
    <div className="px-1">
      {/* Step 1: Checked In */}
      <TimelineStep
        status={statuses[0]}
        icon="check_circle"
        title={t('patient.timeline.checkedIn')}
        timestamp={formatTime(arrivedAt)}
        green={isGreen}
      />

      {/* Step 2: Waiting */}
      <TimelineStep
        status={statuses[1]}
        icon="hourglass_top"
        title={t('patient.timeline.waiting')}
        description={
          statuses[1] === 'active'
            ? t('patient.timeline.waitingDesc', { position: displayPosition })
            : undefined
        }
        green={isGreen}
      >
        {/* Expanded card for waiting states */}
        <div className={`${isGreen ? 'bg-green-50 border-green-200' : 'bg-primary-50 border-primary-200'} border rounded-xl p-3 space-y-2`}>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{t('patient.timeline.peopleAhead')}</span>
            <span className={`text-sm font-bold ${isGreen ? 'text-green-700' : 'text-primary-700'}`}>{peopleAhead}</span>
          </div>
          {avgConsultationMins && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{t('patient.timeline.avgConsultation')}</span>
              <span className={`text-sm font-bold ${isGreen ? 'text-green-700' : 'text-primary-700'}`}>~{Math.round(avgConsultationMins)} min</span>
            </div>
          )}
          {tip && (
            <div className={`flex items-center gap-2 ${isGreen ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'} rounded-lg px-3 py-2 mt-1`}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
              >
                {tip.icon}
              </span>
              <span className="text-xs font-medium">{tip.text}</span>
            </div>
          )}
        </div>
      </TimelineStep>

      {/* Step 3: Almost There */}
      <TimelineStep
        status={statuses[2]}
        icon="directions_walk"
        title={t('patient.timeline.almostThere')}
        description={
          statuses[2] === 'active'
            ? t('patient.timeline.almostDesc')
            : undefined
        }
        green={isGreen}
      >
        {/* Expanded card for almost state */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-amber-700">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <span className="text-xs font-medium">{t('patient.timeline.tipStayClose')}</span>
          </div>
        </div>
      </TimelineStep>

      {/* Step 4: Your Turn */}
      <TimelineStep
        status={statuses[3]}
        icon="notifications_active"
        title={t('patient.timeline.yourTurn')}
        description={
          statuses[3] === 'active'
            ? t('patient.timeline.yourTurnDesc')
            : undefined
        }
        green={isGreen || statuses[3] === 'active'}
      >
        {/* Expanded card for next (NOTIFIED) state */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <span
              className="material-symbols-outlined text-green-600 flex-shrink-0"
              style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
            >
              directions_run
            </span>
            <p className="text-sm font-medium text-green-800 leading-relaxed">
              {t('patient.timeline.tipGetReady')}
            </p>
          </div>
        </div>
      </TimelineStep>

      {/* Step 5: Done */}
      <TimelineStep
        status={statuses[4]}
        icon="check_circle"
        title={t('patient.timeline.done')}
        isLast
        green={isGreen}
      >
        {/* Expanded card for yourTurn (IN_CONSULTATION) state */}
        <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-200 mx-auto">
              <span
                className="material-symbols-outlined text-3xl text-green-800"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                door_open
              </span>
            </div>
            <p className="text-base font-bold text-green-800">
              {doctorName
                ? t('patient.doctorWaiting', { context: genderContext })
                : t('patient.timeline.tipEnter')
              }
            </p>
            <p className="text-sm text-green-700">
              {t('patient.enterOffice')}
            </p>
          </div>
        </div>
      </TimelineStep>
    </div>
  );
}
