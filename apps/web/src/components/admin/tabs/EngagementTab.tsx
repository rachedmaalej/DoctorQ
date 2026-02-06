import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import type { OnboardingFunnel, FeatureAdoption } from '../../../types';
import OnboardingFunnelChart from '../charts/OnboardingFunnelChart';

export default function EngagementTab() {
  const [funnel, setFunnel] = useState<OnboardingFunnel | null>(null);
  const [adoption, setAdoption] = useState<FeatureAdoption | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [funnelData, adoptionData] = await Promise.all([
          api.getOnboardingFunnel(),
          api.getFeatureAdoption(),
        ]);
        setFunnel(funnelData);
        setAdoption(adoptionData);
      } catch {
        // Error handled
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#267B75]"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-[#132E2C] tracking-tight mb-8">User Engagement</h2>

      {/* Onboarding Funnel */}
      {funnel && (
        <div className="mb-8">
          <OnboardingFunnelChart data={funnel} />
        </div>
      )}

      {/* Feature Adoption */}
      {adoption && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Check-in Methods */}
          <div>
            <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">
              Check-in Methods (30 days)
            </h3>
            <div className="space-y-3">
              {[
                { label: 'QR Code', data: adoption.checkInMethods.qrCode, color: 'bg-[#267B75]' },
                { label: 'Manual', data: adoption.checkInMethods.manual, color: 'bg-[#459FB8]' },
                { label: 'WhatsApp', data: adoption.checkInMethods.whatsApp, color: 'bg-[#337023]' },
                { label: 'SMS', data: adoption.checkInMethods.sms, color: 'bg-[#8AADAA]' },
              ].map((method) => (
                <div key={method.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[#4E7572]">{method.label}</span>
                    <span className="text-sm font-bold text-[#132E2C]">
                      {method.data.count} ({method.data.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#E6F2F0] rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${method.color}`}
                      style={{ width: `${Math.max(method.data.percentage, 1)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SMS Usage & Stats */}
          <div>
            <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">
              Platform Usage
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="py-3 border-r border-[#E6F2F0] pr-4">
                  <div className="text-2xl font-bold text-[#132E2C]">{adoption.smsUsage.totalSent}</div>
                  <div className="text-xs text-[#8AADAA]">Total SMS Sent</div>
                </div>
                <div className="py-3 pl-4">
                  <div className="text-2xl font-bold text-[#132E2C]">{adoption.smsUsage.clinicsUsingSms}</div>
                  <div className="text-xs text-[#8AADAA]">Clinics Using SMS</div>
                </div>
                <div className="py-3 border-r border-[#E6F2F0] pr-4">
                  <div className="text-2xl font-bold text-[#132E2C]">{adoption.multiDoctorAdoption}</div>
                  <div className="text-xs text-[#8AADAA]">Multi-Doctor Clinics</div>
                </div>
                <div className="py-3 pl-4">
                  <div className="text-2xl font-bold text-[#132E2C]">{adoption.avgPatientsPerClinicPerDay}</div>
                  <div className="text-xs text-[#8AADAA]">Avg Patients/Clinic/Day</div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E6F2F0]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#8AADAA]">Avg SMS per clinic</span>
                  <span className="font-bold text-[#132E2C]">{adoption.smsUsage.avgPerClinic}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
