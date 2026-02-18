import { useNavigate } from 'react-router-dom';
import type { AdminTab } from '@/types';

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
      style={{
        background: 'var(--brand)',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Logo Block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 40 }}>
        <div
          style={{
            width: 30,
            height: 30,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#fff',
            fontSize: 14,
            letterSpacing: '-0.5px',
          }}
        >
          B
        </div>
        <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, letterSpacing: '-0.3px' }}>
          BleSaf{' '}
          <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 12, marginLeft: 4 }}>Admin</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabClick(tab.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.13)' : 'transparent',
                fontSize: '13.5px',
                fontWeight: isActive ? 550 : 450,
                letterSpacing: '-0.2px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Right Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onNewClinic}
          aria-label="Add new clinic"
          style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 7,
            padding: '7px 14px',
            fontSize: 13,
            fontWeight: 550,
            cursor: 'pointer',
            transition: 'background 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}
        >
          + New Clinic
        </button>
        <button
          onClick={onLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'color 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
