import { useState } from 'react';
import type { ClinicDetail } from '../../../types';
import ExtendTrialModal from '../ExtendTrialModal';

interface SubscriptionStatusPanelProps {
  clinic: ClinicDetail['clinic'];
  onExtended: () => void;
  onUpgrade: (plan: 'MONTHLY' | 'YEARLY') => void;
  upgradeLoading: boolean;
}

export default function SubscriptionStatusPanel({ clinic, onExtended, onUpgrade, upgradeLoading }: SubscriptionStatusPanelProps) {
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);

  const statusColors: Record<string, string> = {
    TRIAL: 'text-[#267B75]',
    ACTIVE: 'text-[#337023]',
    EXPIRED: 'text-[#E15720]',
    CANCELLED: 'text-[#8AADAA]',
  };

  // Calculate trial days remaining
  let trialDaysRemaining: number | null = null;
  let trialProgress = 0;
  if (clinic.subscriptionStatus === 'TRIAL' && clinic.trialEndsAt) {
    const now = Date.now();
    const end = new Date(clinic.trialEndsAt).getTime();
    trialDaysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    trialProgress = Math.max(0, Math.min(100, ((30 - trialDaysRemaining) / 30) * 100));
  }

  return (
    <div className="flex-1">
      <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-3">Subscription</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#4E7572]">Status</span>
          <span className={`text-sm font-medium ${statusColors[clinic.subscriptionStatus] || 'text-[#4E7572]'}`}>
            {clinic.subscriptionStatus}
          </span>
        </div>

        {clinic.subscriptionPlan && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#4E7572]">Plan</span>
            <span className="text-sm font-medium text-[#132E2C]">{clinic.subscriptionPlan}</span>
          </div>
        )}

        {clinic.subscriptionStatus === 'TRIAL' && trialDaysRemaining !== null && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[#4E7572]">Trial</span>
              <span className={`text-sm font-medium ${trialDaysRemaining <= 5 ? 'text-[#E15720]' : 'text-[#267B75]'}`}>
                {trialDaysRemaining} days left
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E6F2F0] rounded-full">
              <div
                className={`h-full rounded-full transition-all ${trialDaysRemaining <= 5 ? 'bg-[#E15720]' : 'bg-[#267B75]'}`}
                style={{ width: `${trialProgress}%` }}
              />
            </div>
          </div>
        )}

        {clinic.trialEndsAt && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#4E7572]">Trial ends</span>
            <span className="text-sm text-[#132E2C]">{new Date(clinic.trialEndsAt).toLocaleDateString('fr-FR')}</span>
          </div>
        )}

        {clinic.subscriptionEndsAt && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#4E7572]">Subscription ends</span>
            <span className="text-sm text-[#132E2C]">{new Date(clinic.subscriptionEndsAt).toLocaleDateString('fr-FR')}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {clinic.subscriptionStatus === 'TRIAL' && (
            <button
              onClick={() => setShowExtendModal(true)}
              className="flex-1 text-sm px-3 py-1.5 rounded font-medium border border-[#D0E8E5] text-[#267B75] hover:bg-[#F3FAF9] transition-colors"
            >
              Extend Trial
            </button>
          )}
          {(clinic.subscriptionStatus === 'TRIAL' || clinic.subscriptionStatus === 'EXPIRED') && (
            <button
              onClick={() => setShowUpgradeOptions(!showUpgradeOptions)}
              className="flex-1 text-sm px-3 py-1.5 rounded font-medium bg-[#267B75] text-white hover:bg-[#1F6560] transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>

        {showUpgradeOptions && (
          <div className="flex gap-2">
            <button
              onClick={() => { onUpgrade('MONTHLY'); setShowUpgradeOptions(false); }}
              disabled={upgradeLoading}
              className="flex-1 text-sm px-3 py-1.5 rounded font-medium border border-[#D0E8E5] text-[#132E2C] hover:bg-[#F3FAF9] disabled:opacity-50 transition-colors"
            >
              Monthly (50 TND)
            </button>
            <button
              onClick={() => { onUpgrade('YEARLY'); setShowUpgradeOptions(false); }}
              disabled={upgradeLoading}
              className="flex-1 text-sm px-3 py-1.5 rounded font-medium border border-[#D0E8E5] text-[#132E2C] hover:bg-[#F3FAF9] disabled:opacity-50 transition-colors"
            >
              Yearly (500 TND)
            </button>
          </div>
        )}
      </div>

      <ExtendTrialModal
        isOpen={showExtendModal}
        clinicId={clinic.id}
        clinicName={clinic.name}
        onClose={() => setShowExtendModal(false)}
        onExtended={() => { setShowExtendModal(false); onExtended(); }}
      />
    </div>
  );
}
