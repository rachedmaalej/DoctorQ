import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import type { PlatformHealth } from '../../../types';

export default function PlatformHealthTab() {
  const [health, setHealth] = useState<PlatformHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getPlatformHealth();
        setHealth(data);
      } catch {
        // Error handled
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#267B75]"></div>
      </div>
    );
  }

  if (!health) {
    return <p className="text-center text-[#8AADAA] py-8">Failed to load platform health</p>;
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'healthy': case 'configured': return 'bg-[#337023]';
      case 'degraded': return 'bg-amber-500 animate-pulse';
      case 'down': case 'not_configured': return 'bg-[#E15720]';
      default: return 'bg-[#8AADAA]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'configured': return 'text-[#337023]';
      case 'degraded': return 'text-amber-600';
      case 'down': case 'not_configured': return 'text-[#E15720]';
      default: return 'text-[#8AADAA]';
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-[#132E2C] tracking-tight mb-8">Platform Health</h2>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { name: 'API Server', status: health.services.api, desc: 'Backend application' },
          { name: 'Database', status: health.services.database, desc: 'PostgreSQL' },
        ].map((service) => (
          <div key={service.name} className="border border-[#E6F2F0] rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(service.status)}`} />
              <h3 className="font-bold text-[#132E2C] text-sm">{service.name}</h3>
            </div>
            <p className="text-xs text-[#8AADAA]">{service.desc}</p>
            <p className={`text-xs font-bold mt-1 capitalize ${getStatusColor(service.status)}`}>
              {service.status.replace('_', ' ')}
            </p>
          </div>
        ))}
      </div>

      {/* Clinic Stats Overview */}
      <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Clinic Overview</h3>
      <div className="flex gap-0">
        <div className="pr-8 border-r border-[#E6F2F0] text-center">
          <div className="text-2xl font-bold text-[#132E2C]">{health.clinicStats.totalClinics}</div>
          <div className="text-xs text-[#8AADAA]">Total Clinics</div>
        </div>
        <div className="px-8 border-r border-[#E6F2F0] text-center">
          <div className="text-2xl font-bold text-[#337023]">{health.clinicStats.activeClinics}</div>
          <div className="text-xs text-[#8AADAA]">Active</div>
        </div>
        <div className="px-8 border-r border-[#E6F2F0] text-center">
          <div className="text-2xl font-bold text-[#459FB8]">{health.clinicStats.clinicsOnTrial}</div>
          <div className="text-xs text-[#8AADAA]">On Trial</div>
        </div>
        <div className="pl-8 text-center">
          <div className="text-2xl font-bold text-[#267B75]">{health.clinicStats.clinicsPaid}</div>
          <div className="text-xs text-[#8AADAA]">Paid</div>
        </div>
      </div>
    </div>
  );
}
