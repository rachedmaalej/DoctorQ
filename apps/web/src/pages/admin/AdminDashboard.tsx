/**
 * Admin Dashboard - BléSaf SaaS Command Center
 * Business metrics with trends, clinic management, and payment tracking.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import type { AdminMetricsWithTrends, ClinicHealth } from '../../types';
import CreateClinicModal from '../../components/admin/CreateClinicModal';
import MetricCardWithTrend from '../../components/admin/MetricCardWithTrend';
import ClinicRankingCard from '../../components/admin/ClinicRankingCard';
import ChurnRiskCard from '../../components/admin/ChurnRiskCard';

type Period = 'today' | '7d' | '30d' | 'all';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, isAuthenticated } = useAuthStore();
  const [metrics, setMetrics] = useState<AdminMetricsWithTrends | null>(null);
  const [clinics, setClinics] = useState<ClinicHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [period, setPeriod] = useState<Period>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'at_risk'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'patients' | 'lastActive'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchData = async (selectedPeriod: Period = period) => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, clinicsData] = await Promise.all([
        api.getAdminMetricsWithTrends(selectedPeriod),
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
    if (isAuthenticated) fetchData(period);
  }, [isAuthenticated, period]);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

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

  const collectionRate = metrics?.totalClinics
    ? Math.round(((metrics?.paidThisMonth || 0) / metrics.totalClinics) * 100)
    : 0;

  // Filter and sort clinics
  const filteredClinics = clinics
    .filter((clinic) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = clinic.name.toLowerCase().includes(query);
        const matchesDoctor = clinic.doctorName?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDoctor) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && clinic.status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all' && clinic.paymentStatus !== paymentFilter) return false;

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'patients':
          comparison = a.patientsToday - b.patientsToday;
          break;
        case 'lastActive':
          const aDate = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const bDate = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          comparison = aDate - bDate;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (column: 'name' | 'patients' | 'lastActive') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: 'name' | 'patients' | 'lastActive') => {
    if (sortBy !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

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
        {/* Business Metrics Section Header with Period Selector */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Business Metrics</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 mr-2">Period:</span>
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                {(['today', '7d', '30d', 'all'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      period === p
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <MetricCardWithTrend
              label="Active Clinics"
              value={metrics?.activeClinics || 0}
              subtext={`of ${metrics?.totalClinics || 0} total`}
              color="green"
            />
            <MetricCardWithTrend
              label="MRR"
              value={`${metrics?.mrrTND || 0} TND`}
              subtext="Monthly recurring"
              color="blue"
            />
            <MetricCardWithTrend
              label="Patients"
              value={metrics?.patientsToday || 0}
              subtext={metrics?.periodLabel || 'Today'}
              color="indigo"
              trend={metrics?.trends.patients}
            />
            <MetricCardWithTrend
              label="QR Rate"
              value={`${metrics?.qrCheckinRate || 0}%`}
              subtext="vs manual"
              color="purple"
              trend={metrics?.trends.qrRate}
            />
            <MetricCardWithTrend
              label="Paid This Month"
              value={metrics?.paidThisMonth || 0}
              subtext="Clinics paid"
              color="green"
            />
            <MetricCardWithTrend
              label="Overdue"
              value={metrics?.overdueCount || 0}
              subtext="Not paid yet"
              color={metrics?.overdueCount ? 'red' : 'gray'}
            />
            <MetricCardWithTrend
              label="At Risk"
              value={metrics?.atRiskClinics || 0}
              subtext="No login 7+ days"
              color={metrics?.atRiskClinics ? 'yellow' : 'gray'}
              trend={metrics?.trends.atRisk}
            />
            <MetricCardWithTrend
              label="Collection"
              value={`${collectionRate}%`}
              subtext="Payment rate"
              color={collectionRate >= 80 ? 'green' : collectionRate >= 50 ? 'yellow' : 'red'}
              trend={metrics?.trends.collection}
            />
          </div>
        </section>

        {/* Charts Section - Placeholder for Phase 2 */}
        {metrics && (metrics.patientsByDay?.length > 0 || metrics.revenueByMonth?.length > 0) && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trends</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Volume Chart Placeholder */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Patient Volume (Last 30 Days)
                </h3>
                <div className="h-48 flex items-end justify-between gap-1">
                  {metrics.patientsByDay?.slice(-14).map((day, i) => {
                    const maxCount = Math.max(...metrics.patientsByDay.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${day.date}: ${day.count} patients`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>{metrics.patientsByDay?.[metrics.patientsByDay.length - 14]?.date?.slice(5) || ''}</span>
                  <span>{metrics.patientsByDay?.[metrics.patientsByDay.length - 1]?.date?.slice(5) || ''}</span>
                </div>
              </div>

              {/* Revenue Chart Placeholder */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                  Revenue (Last 6 Months)
                </h3>
                <div className="h-48 flex items-end justify-between gap-2">
                  {metrics.revenueByMonth?.map((month, i) => {
                    const maxRevenue = Math.max(...metrics.revenueByMonth.map(m => m.expected), 1);
                    const expectedHeight = (month.expected / maxRevenue) * 100;
                    const collectedPercent = month.expected > 0 ? (month.collected / month.expected) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full relative" style={{ height: `${expectedHeight}%` }}>
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t"
                            style={{ height: `${collectedPercent}%` }}
                            title={`Collected: ${month.collected} TND`}
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 border-2 border-dashed border-gray-300 rounded-t"
                            style={{ height: '100%' }}
                            title={`Expected: ${month.expected} TND`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  {metrics.revenueByMonth?.map((month, i) => (
                    <span key={i}>{month.month.slice(5)}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Performance & Risk Analysis Section */}
        {metrics && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance & Risk Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClinicRankingCard rankings={metrics.clinicRankings || []} />
              <ChurnRiskCard clinics={metrics.churnRiskClinics || []} />
            </div>
          </section>
        )}

        {/* Clinic Health Table */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Clinic Health</h2>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search clinics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'at_risk')}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="at_risk">At Risk</option>
              </select>

              {/* Payment Filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'paid' | 'overdue')}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Clinic {getSortIcon('name')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastActive')}
                  >
                    Last Active {getSortIcon('lastActive')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('patients')}
                  >
                    Patients Today {getSortIcon('patients')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Wait</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClinics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {clinics.length === 0
                        ? 'No clinics registered yet. Click "+ New Clinic" to get started.'
                        : 'No clinics match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredClinics.map((clinic) => (
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
            {/* Results count */}
            <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
              Showing {filteredClinics.length} of {clinics.length} clinics
            </div>
          </div>
        </section>
      </main>

      <CreateClinicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => fetchData()}
      />
    </div>
  );
}
