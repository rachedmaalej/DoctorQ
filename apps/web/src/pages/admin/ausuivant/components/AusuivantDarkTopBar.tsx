import { useNavigate } from 'react-router-dom';
import type { AdminTab } from '@/types';
import { cn } from '../../shared/utils';

const TABS: Array<{ key: AdminTab; label: string }> = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'clinics', label: 'Cabinets' },
  { key: 'financial', label: 'Finances' },
  { key: 'engagement', label: 'Engagement' },
];

interface AusuivantDarkTopBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onNewClinic: () => void;
  onLogout: () => void;
}

export default function AusuivantDarkTopBar({ activeTab, onTabChange, onNewClinic, onLogout }: AusuivantDarkTopBarProps) {
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
      className="w-full flex items-center justify-between px-4 md:px-10"
      style={{ background: '#1a1a2e', padding: '0.9rem 0' }}
    >
      {/* Brand */}
      <div className="flex items-center flex-shrink-0 pl-4 md:pl-10" style={{ gap: '0.6rem' }}>
        <div
          className="flex items-center justify-center text-white font-dm font-bold"
          style={{
            width: 28,
            height: 28,
            background: '#c0392b',
            borderRadius: 7,
            fontSize: '0.7rem',
          }}
        >
          AS
        </div>
        <span className="font-playfair font-semibold text-white hidden sm:inline" style={{ fontSize: '1.05rem' }}>
          AuSuivant
        </span>
      </div>

      {/* Tabs — horizontal scroll on mobile, no underline */}
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
              'font-dm font-medium transition-colors duration-150 whitespace-nowrap',
              activeTab === tab.key
                ? 'text-white'
                : 'text-[#777777] hover:text-white/70'
            )}
            style={{ fontSize: '0.84rem', padding: '0.4rem 1rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-shrink-0 pr-4 md:pr-10">
        <button
          onClick={onNewClinic}
          aria-label="Ajouter un nouveau cabinet"
          className="font-dm font-semibold text-white transition-colors duration-150 active:scale-[0.98] hover:bg-[#a93226]"
          style={{
            background: '#c0392b',
            padding: '0.5rem 1rem',
            borderRadius: 8,
            fontSize: '0.82rem',
          }}
        >
          <span className="hidden sm:inline">+ Nouveau Cabinet</span>
          <span className="sm:hidden">+</span>
        </button>
        <button
          onClick={onLogout}
          className="font-dm text-[#777777] hover:text-white/70 transition-colors hidden sm:block"
          style={{ fontSize: '0.82rem' }}
        >
          Deconnexion
        </button>
      </div>
    </nav>
  );
}
