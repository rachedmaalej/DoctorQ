import type { ClinicDetailTab } from '../../../types';

interface ClinicDetailTabBarProps {
  activeTab: ClinicDetailTab;
  onTabChange: (tab: ClinicDetailTab) => void;
}

const TABS: Array<{ key: ClinicDetailTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'patients', label: 'Patients' },
  { key: 'billing', label: 'Billing' },
  { key: 'settings', label: 'Settings' },
];

export default function ClinicDetailTabBar({ activeTab, onTabChange }: ClinicDetailTabBarProps) {
  return (
    <div className="border-b border-[#E6F2F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-6 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[#267B75] border-[#267B75]'
                  : 'text-[#8AADAA] border-transparent hover:text-[#4E7572]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
