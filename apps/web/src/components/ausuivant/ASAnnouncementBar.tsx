import ASIcon from './ASIcon';

interface ASAnnouncementBarProps {
  text: string | null;
  onEdit?: () => void;
}

export default function ASAnnouncementBar({ text, onEdit }: ASAnnouncementBarProps) {
  if (!text) return null;

  return (
    <div
      onClick={onEdit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: '#F0ECFA',
        borderBottom: '1px solid rgba(120, 96, 192, 0.12)',
        cursor: onEdit ? 'pointer' : 'default',
      }}
    >
      <ASIcon name="campaign" size={18} fill style={{ color: '#7860C0' }} />
      <span style={{
        fontSize: 12,
        color: '#5B449E',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {text}
      </span>
      {onEdit && (
        <span style={{ fontSize: 11, color: '#7860C0', fontWeight: 600, flexShrink: 0 }}>
          Modifier
        </span>
      )}
    </div>
  );
}
