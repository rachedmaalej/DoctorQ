interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({ count, onDelete, onClear }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: '#1a1a2e',
        color: '#fff',
        padding: '0.6rem 1rem 0.6rem 1.2rem',
        borderRadius: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.82rem',
        zIndex: 40,
        animation: 'bulkBarSlideUp 200ms ease-out',
      }}
    >
      <style>{`
        @keyframes bulkBarSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <span style={{ fontWeight: 600 }}>
        {count} selected
      </span>

      <button
        onClick={onDelete}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: 7,
          fontSize: '0.78rem',
          fontWeight: 600,
          border: 'none',
          background: '#dc2626',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#b91c1c'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#dc2626'; }}
      >
        Delete
      </button>

      <button
        onClick={onClear}
        style={{
          padding: '0.35rem 0.75rem',
          borderRadius: 7,
          fontSize: '0.78rem',
          fontWeight: 500,
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'transparent',
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'background 150ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        Clear
      </button>
    </div>
  );
}
