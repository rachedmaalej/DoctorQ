import { useTranslation } from 'react-i18next';
import type { QueueEntry } from '@/types';
import { formatTime, getWaitingMinutes } from '@/lib/time';

type UrgencyTier = 'ok' | 'high' | 'critical';

interface QueueTableRowProps {
  entry: QueueEntry;
  isMenuOpen: boolean;
  isExiting: boolean;
  onKebabClick: (e: React.MouseEvent, entry: QueueEntry) => void;
}

const AVATAR_COLORS = [
  { bg: '#EBF2EE', text: '#356B58' },
  { bg: '#EEE8FB', text: '#7C5CBF' },
  { bg: '#FEF0E6', text: '#C06020' },
  { bg: '#E8F5EE', text: '#2D7A5A' },
  { bg: '#F3EBF9', text: '#7C5CBF' },
  { bg: '#FBF4E3', text: '#B07A1C' },
];

function getUrgencyTier(waitMinutes: number): UrgencyTier {
  if (waitMinutes >= 40) return 'critical';
  if (waitMinutes >= 20) return 'high';
  return 'ok';
}

/** Format phone: strip +216 prefix, display as "XX XXX-XXX" */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Remove leading 216 country code if present
  const local = digits.startsWith('216') ? digits.slice(3) : digits;
  if (local.length === 8) {
    return `${local.slice(0, 2)} ${local.slice(2, 5)}-${local.slice(5)}`;
  }
  return local;
}

export default function QueueTableRow({ entry, isMenuOpen, isExiting, onKebabClick }: QueueTableRowProps) {
  const { t } = useTranslation();

  const waitMinutes = getWaitingMinutes(entry.arrivedAt);
  const urgencyTier = getUrgencyTier(waitMinutes);
  const isUrgent = entry.priority === 'urgent';
  const hasAppointment = !!entry.appointmentTime;
  const patientName = entry.patientName || '—';
  const initial = patientName.charAt(0).toUpperCase();

  // Avatar color
  const avatarIndex = patientName.charCodeAt(0) % AVATAR_COLORS.length;
  const avatarColor = AVATAR_COLORS[avatarIndex];

  // Wait bar
  const waitPercent = (waitMinutes / 40) * 100;
  const waitColor = urgencyTier === 'critical' ? 'text-[#C0392B]'
    : urgencyTier === 'high' ? 'text-[#E07B39]'
    : 'text-[#2D7A5A]';
  const waitBarColor = urgencyTier === 'critical' ? 'bg-[#C0392B]'
    : urgencyTier === 'high' ? 'bg-[#E07B39]'
    : 'bg-[#2D7A5A]';

  // Row styling based on urgency
  const rowBg = urgencyTier === 'critical' ? 'bg-[#fff9f9]'
    : urgencyTier === 'high' ? 'bg-[#fffaf6]'
    : 'bg-white';
  const borderColor = urgencyTier === 'critical' ? 'border-l-[#C0392B]'
    : urgencyTier === 'high' ? 'border-l-[#E07B39]'
    : 'border-l-transparent';

  // ETA: rough estimate based on position × avg consultation time (~7 min default)
  const etaMinutes = entry.position <= 1 ? 0 : (entry.position - 1) * 7;

  return (
    <tr className={`group ${rowBg} hover:bg-[#F4F5F1] transition-colors ${isExiting ? 'queue-row-exit' : ''}`}>
      {/* Position */}
      <td className={`pl-4 pr-3 py-3.5 w-[52px] border-l-[3px] ${borderColor}`}>
        <span className="font-dm-mono text-[11px] font-medium text-[#94A49A]">
          {String(entry.position).padStart(2, '0')}
        </span>
      </td>

      {/* Patient */}
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
            style={{ background: avatarColor.bg, color: avatarColor.text }}
          >
            {initial}
          </div>
          <div>
            <div className="text-[12px] font-medium text-[#1B2D25]">{patientName}</div>
            <div className="text-[10px] text-[#94A49A] mt-px flex items-center gap-1">
              {isUrgent && (
                <span className="text-[#C0392B] font-semibold">{t('queue.row.urgent')} ·</span>
              )}
              {hasAppointment ? t('queue.row.withAppointment') : t('queue.row.walkIn')}
              {waitMinutes === 0 && (
                <span className="text-[#356B58] font-medium"> · {t('queue.row.justArrived')}</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Arrivée */}
      <td className="px-3 py-3.5">
        <span className="text-[11.5px] text-[#5C6B62] tabular-nums whitespace-nowrap">
          {formatTime(entry.arrivedAt)}
        </span>
      </td>

      {/* Attente */}
      <td className="px-3 py-3.5 min-w-[120px]">
        <div className={`text-[12px] font-semibold tabular-nums mb-1 ${waitColor}`}>
          {waitMinutes} min
        </div>
        <div className="w-20 h-1 bg-[#DDE2DC] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${waitBarColor}`}
            style={{ width: `${Math.min(waitPercent, 100)}%` }}
          />
        </div>
      </td>

      {/* Sera vu dans (ETA) */}
      <td className="px-3 py-3.5">
        {entry.position === 1 || etaMinutes === 0 ? (
          <span className="text-[11px] font-semibold text-[#356B58]">{t('queue.row.next')}</span>
        ) : (
          <span className="text-[11px] text-[#5C6B62] whitespace-nowrap">~{etaMinutes} min</span>
        )}
      </td>

      {/* Contact */}
      <td className="px-3 py-3.5">
        {entry.patientPhone ? (
          <a href={`tel:${entry.patientPhone}`} className="font-dm-mono text-[10.5px] text-[#5C6B62] whitespace-nowrap hover:text-[#356B58] hover:underline">{formatPhone(entry.patientPhone)}</a>
        ) : (
          <span className="text-[10px] font-medium text-[#94A49A] bg-[#F4F5F1] border border-dashed border-[#DDE2DC] rounded-[6px] px-2 py-0.5">
            {t('queue.row.noPhone')}
          </span>
        )}
      </td>

      {/* Actions (kebab) */}
      <td className="px-3 py-3.5 w-[48px] text-center">
        <button
          onClick={e => { e.stopPropagation(); onKebabClick(e, entry); }}
          aria-label={t('queue.row.actionsLabel')}
          className={`w-8 h-8 rounded-[6px] border-[1.5px] border-transparent inline-flex items-center justify-center text-[#94A49A] transition-all duration-150 ${
            isMenuOpen
              ? 'bg-[#F4F5F1] border-[#DDE2DC] text-[#1B2D25]'
              : 'hover:bg-[#F4F5F1]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] pointer-events-none">more_vert</span>
        </button>
      </td>
    </tr>
  );
}
