import { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

interface DrawerItemProps {
  iconName: string;
  iconBg?: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  rightElement?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

export function DrawerItem({
  iconName,
  iconBg = '#F0EFEA',
  iconColor = '#4A5250',
  label,
  sublabel,
  rightElement,
  danger = false,
  onClick,
}: DrawerItemProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        padding: '8px 8px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 150ms',
        WebkitTapHighlightColor: 'transparent',
        fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = danger ? '#FDF0F0' : '#F2F4F3';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {/* Icon container */}
      <span style={{
        display: 'flex',
        height: 30,
        width: 30,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        background: danger ? '#FDF0F0' : iconBg,
      }}>
        <Icon
          name={iconName}
          size={17}
          style={{ color: danger ? '#B94040' : iconColor }}
        />
      </span>

      {/* Text */}
      <span style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.3,
          color: danger ? '#B94040' : '#1A1C1B',
        }}>
          {label}
        </span>
        {sublabel && (
          <span style={{
            fontSize: 10,
            lineHeight: 1.3,
            color: '#8E9693',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {sublabel}
          </span>
        )}
      </span>

      {/* Right element */}
      {rightElement && (
        <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {rightElement}
        </span>
      )}
    </button>
  );
}
