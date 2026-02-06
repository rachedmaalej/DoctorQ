import type { ClinicDetail } from '../../../../types';
import SubscriptionStatusPanel from '../SubscriptionStatusPanel';
import SmsCreditsPanel from '../SmsCreditsPanel';

interface ClinicOverviewTabProps {
  detail: ClinicDetail;
  onRefresh: () => void;
  onUpgrade: (plan: 'MONTHLY' | 'YEARLY') => void;
  upgradeLoading: boolean;
}

export default function ClinicOverviewTab({ detail, onRefresh, onUpgrade, upgradeLoading }: ClinicOverviewTabProps) {
  const { clinic, doctors, todayStats, weeklyPatients } = detail;
  const maxWeekly = Math.max(...weeklyPatients.map((w) => w.count), 1);

  const onboardingSteps = ['Account', 'Profile', 'Settings', 'Complete'];

  return (
    <div className="space-y-8">
      {/* Subscription + SMS panels */}
      <div className="flex gap-8 py-5 border-b border-[#E6F2F0]">
        <SubscriptionStatusPanel
          clinic={clinic}
          onExtended={onRefresh}
          onUpgrade={onUpgrade}
          upgradeLoading={upgradeLoading}
        />
        <div className="w-px bg-[#E6F2F0]" />
        <SmsCreditsPanel smsCredits={clinic.smsCredits} smsCreditsUsed={clinic.smsCreditsUsed} />
      </div>

      {/* Clinic Info */}
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Clinic Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3">
          <InfoField label="Email" value={clinic.email} />
          <InfoField label="Phone" value={clinic.phone || '—'} />
          <InfoField label="Language" value={clinic.language === 'ar' ? 'Arabic' : 'French'} />
          <InfoField label="Spécialité" value={specialtyLabel(clinic.businessType)} />
          <InfoField label="Avg Consultation" value={`${clinic.avgConsultationMins} min`} />
          <InfoField label="Notify at Position" value={`#${clinic.notifyAtPosition}`} />
          <InfoField label="Created" value={new Date(clinic.createdAt).toLocaleDateString('fr-FR')} />
          <InfoField label="Last Login" value={clinic.lastLoginAt ? new Date(clinic.lastLoginAt).toLocaleDateString('fr-FR') : 'Never'} />
          <InfoField label="Onboarding" value={clinic.onboardingCompleted ? 'Completed' : `Step ${clinic.onboardingStep + 1}/4 — ${onboardingSteps[clinic.onboardingStep] || 'Unknown'}`} />
          {clinic.address && <InfoField label="Address" value={clinic.address} />}
        </div>
      </div>

      {/* Today's Activity */}
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Today's Activity</h3>
        <div className="grid grid-cols-5 gap-0 py-4 border-b border-[#E6F2F0]">
          <KpiCell label="Waiting" value={todayStats.waiting} />
          <KpiCell label="In Consultation" value={todayStats.inConsultation} />
          <KpiCell label="Completed" value={todayStats.completed} color="#337023" />
          <KpiCell label="No Shows" value={todayStats.noShows} color="#E15720" />
          <KpiCell label="Cancelled" value={todayStats.cancelled} last />
        </div>
      </div>

      {/* Weekly Chart */}
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">This Week</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyPatients.map((day, i) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <span className="text-xs text-[#8AADAA] mb-1">{day.count}</span>
              <div
                className="w-full rounded-t"
                style={{
                  height: `${Math.max((day.count / maxWeekly) * 100, 4)}%`,
                  backgroundColor: i % 3 === 2 ? 'rgba(69, 159, 184, 0.45)' : i % 2 === 0 ? 'rgba(38, 123, 117, 0.18)' : 'rgba(38, 123, 117, 0.4)',
                }}
              />
              <span className="text-xs text-[#8AADAA] mt-1">
                {new Date(day.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor Roster */}
      {doctors.length > 0 && (
        <div>
          <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Doctors ({doctors.length})</h3>
          <div className="border border-[#E6F2F0] rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-[#E6F2F0]">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Specialty</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Avg Consult</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6F2F0]">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F3FAF9] transition-colors">
                    <td className="px-4 py-2 text-sm text-[#132E2C]">{doc.name}</td>
                    <td className="px-4 py-2 text-sm text-[#4E7572]">{doc.specialty || '—'}</td>
                    <td className="px-4 py-2 text-sm text-[#4E7572]">{doc.avgConsultationMins} min</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-medium ${doc.isActive ? 'text-[#337023]' : 'text-[#8AADAA]'}`}>
                        {doc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-[#8AADAA] uppercase">{label}</span>
      <p className="text-sm text-[#132E2C] font-medium capitalize">{value}</p>
    </div>
  );
}

function KpiCell({ label, value, color, last }: { label: string; value: number; color?: string; last?: boolean }) {
  return (
    <div className={`text-center ${!last ? 'border-r border-[#E6F2F0]' : ''}`}>
      <p className="text-xs text-[#8AADAA] uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color || '#132E2C' }}>{value}</p>
    </div>
  );
}

const SPECIALTY_LABELS: Record<string, string> = {
  general: 'Médecine Générale',
  gynecology: 'Gynécologie-Obstétrique',
  pediatrics: 'Pédiatrie',
  ophthalmology: 'Ophtalmologie',
  dermatology: 'Dermatologie',
  ent: 'ORL',
  cardiology: 'Cardiologie',
  gastroenterology: 'Gastro-entérologie',
  orthopedics: 'Orthopédie',
  dental: 'Dentaire',
  other: 'Autre',
  medical: 'Medical',
  retail: 'Retail',
};

function specialtyLabel(value: string): string {
  return SPECIALTY_LABELS[value] || value;
}
