interface PSManageFooterProps {
  visible: boolean;
  onManageClick: () => void;
}

export default function PSManageFooter({ visible, onManageClick }: PSManageFooterProps) {
  if (!visible) return null;

  return (
    <div className="ps-footer-options" style={{ position: 'relative', zIndex: 2 }}>
      <button className="ps-options-link" onClick={onManageClick}>
        ⋯ Options
      </button>
    </div>
  );
}
