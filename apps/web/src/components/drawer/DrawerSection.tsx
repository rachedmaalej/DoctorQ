import { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

interface DrawerSectionProps {
  iconName: string;
  label: string;
  children: ReactNode;
}

export function DrawerSection({ iconName, label, children }: DrawerSectionProps) {
  return (
    <div style={{ padding: '10px 10px 4px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 4px 6px',
        marginBottom: 2,
      }}>
        <Icon name={iconName} size={12} style={{ color: '#8E9693' }} />
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#8E9693',
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {children}
      </div>
    </div>
  );
}
