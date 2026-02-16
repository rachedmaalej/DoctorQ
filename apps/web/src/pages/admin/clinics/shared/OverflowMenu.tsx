import { useState, useRef, useEffect } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  color?: string;
  separator?: boolean;
}

interface OverflowMenuProps {
  items: MenuItem[];
  buttonStyle?: React.CSSProperties;
  iconColor?: string;
}

export default function OverflowMenu({ items, buttonStyle, iconColor = '#666' }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          border: '1px solid',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1rem',
          color: iconColor,
          padding: 0,
          ...buttonStyle,
        }}
      >
        ⋯
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: '#fff',
            borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            border: '1px solid #e8e5df',
            minWidth: 180,
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.7rem 1rem',
                fontSize: '0.85rem',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: item.separator ? '2px solid #e8e5df' : i < items.length - 1 ? '1px solid #f3f0ec' : 'none',
                color: item.color || '#1a1a2e',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#faf8f5';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
