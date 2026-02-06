import type { AdminTab } from '../../types';

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'clinics', label: 'Clinics' },
  { key: 'financial', label: 'Financial' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'platform', label: 'Platform' },
];

interface AdminTabBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export default function AdminTabBar({ activeTab, onTabChange }: AdminTabBarProps) {
  return (
    <div className="border-b border-[#E6F2F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-6 overflow-x-auto" aria-label="Admin tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
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
