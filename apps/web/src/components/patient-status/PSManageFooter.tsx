interface PSManageFooterProps {
  visible: boolean;
  onManageClick: () => void;
}

function MoreHorizontalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

export default function PSManageFooter({ visible, onManageClick }: PSManageFooterProps) {
  if (!visible) return null;

  return (
    <div style={{ padding: '16px 20px 32px', marginTop: 'auto' }}>
      <button className="ps-manage-btn" onClick={onManageClick}>
        <MoreHorizontalIcon />
        Gérer ma place
      </button>
    </div>
  );
}
