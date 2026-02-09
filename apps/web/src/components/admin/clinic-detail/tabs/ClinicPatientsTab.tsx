import type { ClinicDetail } from '../../../../types';

interface ClinicPatientsTabProps {
  detail: ClinicDetail;
}

function statusBadge(status: string) {
  const map: Record<string, { color: string; label: string }> = {
    COMPLETED: { color: '#337023', label: 'Completed' },
    WAITING: { color: '#267B75', label: 'Waiting' },
    NOTIFIED: { color: '#267B75', label: 'Notified' },
    IN_CONSULTATION: { color: '#459FB8', label: 'In Consultation' },
    NO_SHOW: { color: '#E15720', label: 'No Show' },
    CANCELLED: { color: '#8AADAA', label: 'Cancelled' },
  };
  const s = map[status] || { color: '#8AADAA', label: status };
  return (
    <span className="text-xs font-medium" style={{ color: s.color }}>
      {s.label}
    </span>
  );
}

export default function ClinicPatientsTab({ detail }: ClinicPatientsTabProps) {
  const { allTimeStats, monthlyStats, recentEntries } = detail;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Statistics</h3>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-0 py-4 border-b border-[#E6F2F0]">
          <StatCell label="All-time Patients" value={allTimeStats.totalPatients.toString()} />
          <StatCell label="All-time Avg Wait" value={allTimeStats.avgWaitMins !== null ? `${allTimeStats.avgWaitMins} min` : '—'} />
          <StatCell label="All-time QR Rate" value={`${allTimeStats.qrRate}%`} />
          <StatCell label="Monthly Patients" value={monthlyStats.totalPatients.toString()} />
          <StatCell label="Monthly Avg Wait" value={monthlyStats.avgWaitMins !== null ? `${monthlyStats.avgWaitMins} min` : '—'} />
          <StatCell label="Monthly QR Rate" value={`${monthlyStats.qrRate}%`} last />
        </div>
      </div>

      {/* Recent Patients Table */}
      <div>
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Recent Patients (Last 20)</h3>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-[#8AADAA] py-4">No patients yet.</p>
        ) : (
          <div className="border border-[#E6F2F0] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E6F2F0]">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Patient</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Check-in</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Arrived</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-[#4E7572] uppercase">Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6F2F0]">
                  {recentEntries.map((entry) => {
                    const waitMins = entry.calledAt
                      ? Math.round((new Date(entry.calledAt).getTime() - new Date(entry.arrivedAt).getTime()) / 60000)
                      : null;
                    return (
                      <tr key={entry.id} className="hover:bg-[#F3FAF9] transition-colors">
                        <td className="px-4 py-2 text-sm text-[#132E2C]">{entry.patientName || '—'}</td>
                        <td className="px-4 py-2 text-sm text-[#4E7572]">{entry.patientPhone}</td>
                        <td className="px-4 py-2 text-sm text-[#4E7572] capitalize">{entry.checkInMethod.replace('_', ' ').toLowerCase()}</td>
                        <td className="px-4 py-2">{statusBadge(entry.status)}</td>
                        <td className="px-4 py-2 text-sm text-[#4E7572]">
                          <span className="text-[#8AADAA]">{new Date(entry.arrivedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                          {' '}
                          {new Date(entry.arrivedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-sm text-[#4E7572]">
                          {waitMins !== null ? `${waitMins} min` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`text-center px-3 ${!last ? 'border-r border-[#E6F2F0]' : ''}`}>
      <p className="text-xs text-[#8AADAA] uppercase mb-1">{label}</p>
      <p className="text-lg font-bold text-[#132E2C]">{value}</p>
    </div>
  );
}
