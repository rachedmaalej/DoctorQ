import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { ClinicDetail } from '@/types';
import RecordPaymentModal from '@/components/admin/RecordPaymentModal';

export default function ClinicDetailPage() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const data = await api.getAdminClinicDetail(clinicId);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load clinic details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [clinicId]);

  const handleToggleStatus = async () => {
    if (!detail || !clinicId) return;
    setActionLoading('status');
    try {
      await api.updateClinicStatus(clinicId, !detail.clinic.isActive);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!clinicId) return;
    const pw = prompt('Enter new password (min 6 chars):');
    if (!pw || pw.length < 6) return;
    setActionLoading('password');
    try {
      await api.resetClinicPassword(clinicId, pw);
      alert('Password reset successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleKonnectPayment = async () => {
    if (!clinicId) return;
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    setActionLoading('konnect');
    try {
      const result = await api.initKonnectPayment(clinicId, month);
      window.open(result.payUrl, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to initiate payment');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Clinic not found'}</p>
          <button onClick={() => navigate('/admin')} className="text-purple-600 hover:underline">Back to Admin</button>
        </div>
      </div>
    );
  }

  const { clinic, todayStats, weeklyPatients, monthlyStats, recentEntries, payments } = detail;
  const maxWeekly = Math.max(...weeklyPatients.map((w) => w.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{clinic.name}</h1>
                {clinic.doctorName && <p className="text-sm text-gray-500">{clinic.doctorName}</p>}
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                clinic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {clinic.isActive ? 'Active' : 'Paused'}
              </span>
              {clinic.isDoctorPresent && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  Doctor Present
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading === 'status'}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium ${
                  clinic.isActive
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {clinic.isActive ? 'Pause Clinic' : 'Activate Clinic'}
              </button>
              <button
                onClick={handleResetPassword}
                disabled={actionLoading === 'password'}
                className="text-sm px-3 py-1.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Clinic Info */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinic Info</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Email:</span> <span className="font-medium">{clinic.email}</span></div>
            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{clinic.phone || '-'}</span></div>
            <div><span className="text-gray-500">Language:</span> <span className="font-medium">{clinic.language === 'ar' ? 'Arabic' : 'French'}</span></div>
            <div><span className="text-gray-500">Avg Consultation:</span> <span className="font-medium">{clinic.avgConsultationMins} min</span></div>
            <div><span className="text-gray-500">Business Type:</span> <span className="font-medium capitalize">{clinic.businessType}</span></div>
            <div><span className="text-gray-500">Created:</span> <span className="font-medium">{new Date(clinic.createdAt).toLocaleDateString('fr-FR')}</span></div>
            <div><span className="text-gray-500">Last Login:</span> <span className="font-medium">{clinic.lastLoginAt ? new Date(clinic.lastLoginAt).toLocaleDateString('fr-FR') : 'Never'}</span></div>
          </div>
        </section>

        {/* Today's Activity */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Waiting" value={todayStats.waiting} color="blue" />
            <StatCard label="In Consultation" value={todayStats.inConsultation} color="purple" />
            <StatCard label="Completed" value={todayStats.completed} color="green" />
            <StatCard label="No Shows" value={todayStats.noShows} color="yellow" />
            <StatCard label="Cancelled" value={todayStats.cancelled} color="gray" />
          </div>
        </section>

        {/* Weekly Chart + Monthly Stats */}
        <div className="grid md:grid-cols-2 gap-8">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">This Week</h2>
            <div className="flex items-end justify-between gap-2 h-40">
              {weeklyPatients.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{day.count}</span>
                  <div
                    className="w-full bg-purple-400 rounded-t"
                    style={{ height: `${Math.max((day.count / maxWeekly) * 100, 4)}%` }}
                  />
                  <span className="text-xs text-gray-400 mt-1">
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Patients</span>
                <span className="font-bold text-xl">{monthlyStats.totalPatients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Wait Time</span>
                <span className="font-bold text-xl">{monthlyStats.avgWaitMins ? `${monthlyStats.avgWaitMins} min` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">QR Check-in Rate</span>
                <span className="font-bold text-xl">{monthlyStats.qrRate}%</span>
              </div>
            </div>
          </section>
        </div>

        {/* Payments */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
            <div className="flex gap-2">
              <button
                onClick={handleKonnectPayment}
                disabled={actionLoading === 'konnect'}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === 'konnect' ? 'Loading...' : 'Konnect Payment Link'}
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Record Payment
              </button>
            </div>
          </div>
          {payments.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No payments recorded yet.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 text-sm">
                      {new Date(p.month).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">{p.amount / 1000} TND</td>
                    <td className="px-4 py-2 text-sm capitalize">{p.method.replace('_', ' ')}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{p.reference || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        p.status === 'paid' ? 'bg-green-100 text-green-800' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(p.paidAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Recent Queue Entries */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Patients (Last 20)</h2>
          {recentEntries.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No patients yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Arrived</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentEntries.map((entry) => {
                    const waitMins = entry.calledAt
                      ? Math.round((new Date(entry.calledAt).getTime() - new Date(entry.arrivedAt).getTime()) / 60000)
                      : null;
                    return (
                      <tr key={entry.id}>
                        <td className="px-4 py-2 text-sm">{entry.patientName || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{entry.patientPhone}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{entry.checkInMethod.replace('_', ' ')}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            entry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            entry.status === 'WAITING' ? 'bg-blue-100 text-blue-800' :
                            entry.status === 'IN_CONSULTATION' ? 'bg-purple-100 text-purple-800' :
                            entry.status === 'NO_SHOW' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(entry.arrivedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {waitMins !== null ? `${waitMins} min` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <RecordPaymentModal
        isOpen={showPaymentModal}
        clinicId={clinicId!}
        clinicName={clinic.name}
        onClose={() => setShowPaymentModal(false)}
        onRecorded={fetchDetail}
      />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color] || colorMap.gray}`}>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
