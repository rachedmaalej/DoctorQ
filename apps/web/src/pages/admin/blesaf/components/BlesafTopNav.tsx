import { useNavigate } from 'react-router-dom';
import type { AdminTab } from '@/types';
import { cn } from '../../shared/utils';

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'clinics', label: 'Clinics' },
  { key: 'financial', label: 'Financial' },
  { key: 'engagement', label: 'Engagement' },
];

interface BlesafTopNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onNewClinic: () => void;
  onLogout: () => void;
}

export default function BlesafTopNav({ activeTab, onTabChange, onNewClinic, onLogout }: BlesafTopNavProps) {
  const navigate = useNavigate();

  const handleTabClick = (tab: AdminTab) => {
    if (tab === 'clinics') {
      navigate('/admin/clinics');
    } else {
      onTabChange(tab);
    }
  };
  return (
    <nav
      role="navigation"
      aria-label="Admin navigation"
      className="w-full flex items-center justify-between px-4 md:px-8"
      style={{ background: '#1a3c34', padding: '0.9rem 0' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 flex-shrink-0 pl-4 md:pl-8">
        <div
          className="flex items-center justify-center text-white font-outfit font-bold"
          style={{
            width: 26,
            height: 26,
            background: '#2a9d6e',
            borderRadius: 7,
            fontSize: '0.72rem',
          }}
        >
          B
        </div>
        <span className="font-outfit font-bold text-white hidden sm:inline" style={{ fontSize: '1.05rem' }}>
          BleSaf Admin
        </span>
      </div>

      {/* Tabs — horizontal scroll on mobile */}
      <div
        className="flex items-center gap-0 overflow-x-auto no-scrollbar mx-4"
        role="tablist"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => handleTabClick(tab.key)}
            className={cn(
              'font-outfit font-medium transition-colors duration-150 whitespace-nowrap',
              activeTab === tab.key
                ? 'text-white border-b-2'
                : 'text-[#7aa38d] border-b-2 border-transparent hover:text-white/70'
            )}
            style={{
              fontSize: '0.84rem',
              padding: '0.4rem 1rem',
              borderBottomColor: activeTab === tab.key ? '#2a9d6e' : undefined,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 pr-4 md:pr-8">
        <button
          onClick={onNewClinic}
          aria-label="Add new clinic"
          className="font-outfit font-semibold text-white transition-colors duration-150 hover:brightness-90 active:scale-[0.98]"
          style={{
            background: '#2a9d6e',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            fontSize: '0.82rem',
          }}
        >
          <span className="hidden sm:inline">+ New Clinic</span>
          <span className="sm:hidden">+</span>
        </button>
        <button
          onClick={onLogout}
          className="font-dm text-[#7aa38d] hover:text-white/70 transition-colors hidden sm:block"
          style={{ fontSize: '0.82rem' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
