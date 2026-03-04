import { Icon } from '@/components/ui/Icon';

interface DrawerSectionLabelProps {
  icon: string;
  label: string;
}

export function DrawerSectionLabel({ icon, label }: DrawerSectionLabelProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 4px',
        marginBottom: 8,
      }}
    >
      <Icon name={icon} size={13} style={{ color: '#8E9693' }} />
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.1em',
        color: '#8E9693',
      }}>
        {label}
      </span>
    </div>
  );
}
