/**
 * Admin Dashboard - BléSaf SaaS Command Center
 * Business metrics, clinic management, and payment tracking.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import type { AdminMetrics, ClinicHealth } from '../../types';
import CreateClinicModal from '../../components/admin/CreateClinicModal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuthStore();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [clinics, setClinics] = useState<ClinicHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, clinicsData] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminClinics(),
      ]);
      setMetrics(metricsData);
      setClinics(clinicsData);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error.code === 'FORBIDDEN') {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(error.message || 'Failed to load admin data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      at_risk: 'bg-yellow-100 text-yellow-800',
      churned: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.active}`}>
        {status === 'at_risk' ? 'At Risk' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === 'paid') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Paid</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Overdue</span>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading command center...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">BléSaf Admin</h1>
              <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                Command Center
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                + New Clinic
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Clinic Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <MetricCard label="Active Clinics" value={metrics?.activeClinics || 0} subtext={`of ${metrics?.totalClinics || 0} total`} color="green" />
            <MetricCard label="MRR" value={`${metrics?.mrrTND || 0} TND`} subtext="Monthly recurring" color="blue" />
            <MetricCard label="Patients Today" value={metrics?.patientsToday || 0} subtext="Across all clinics" color="indigo" />
            <MetricCard label="QR Rate" value={`${metrics?.qrCheckinRate || 0}%`} subtext="vs manual" color="purple" />
            <MetricCard label="Paid This Month" value={metrics?.paidThisMonth || 0} subtext="Clinics paid" color="green" />
            <MetricCard label="Overdue" value={metrics?.overdueCount || 0} subtext="Not paid yet" color={metrics?.overdueCount ? 'red' : 'gray'} />
            <MetricCard label="At Risk" value={metrics?.atRiskClinics || 0} subtext="No login 7+ days" color={metrics?.atRiskClinics ? 'yellow' : 'gray'} />
            <MetricCard label="Collection" value={metrics?.totalClinics ? `${Math.round(((metrics?.paidThisMonth || 0) / metrics.totalClinics) * 100)}%` : '0%'} subtext="Payment rate" color="blue" />
          </div>
        </section>

        {/* Clinic Health Table */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinic Health</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patients Today</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Wait</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clinics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No clinics registered yet. Click "+ New Clinic" to get started.
                    </td>
                  </tr>
                ) : (
                  clinics.map((clinic) => (
                    <tr
                      key={clinic.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/admin/clinic/${clinic.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-purple-700 hover:text-purple-900">{clinic.name}</div>
                          {clinic.doctorName && <div className="text-sm text-gray-500">{clinic.doctorName}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(clinic.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {clinic.patientsToday}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {clinic.avgWaitMins ? `${clinic.avgWaitMins} min` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentBadge(clinic.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(clinic.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <CreateClinicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchData}
      />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
  color: 'green' | 'blue' | 'indigo' | 'purple' | 'yellow' | 'red' | 'gray';
}

function MetricCard({ label, value, subtext, color }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    indigo: 'bg-indigo-50 border-indigo-200',
    purple: 'bg-purple-50 border-purple-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    gray: 'bg-gray-50 border-gray-200',
  };

  const textClasses: Record<string, string> = {
    green: 'text-green-900',
    blue: 'text-blue-900',
    indigo: 'text-indigo-900',
    purple: 'text-purple-900',
    yellow: 'text-yellow-900',
    red: 'text-red-900',
    gray: 'text-gray-900',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textClasses[color]}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  );
}
