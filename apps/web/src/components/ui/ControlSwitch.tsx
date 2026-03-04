interface ControlSwitchProps {
  /** Material Symbols Rounded icon name */
  icon: string;
  /** Row label shown on the left */
  label: string;
  /** Toggle is ON when true */
  checked: boolean;
  /** Fires with the new boolean value when user taps */
  onChange: (newValue: boolean) => void;
  /** State label text when checked=true */
  labelOn: string;
  /** State label text when checked=false */
  labelOff: string;
  /** Track + label color when ON */
  colorOn: 'teal' | 'green';
  /** Track + label color when OFF */
  colorOff: 'red' | 'muted';
  /** Reduces opacity and blocks interaction during async ops */
  disabled?: boolean;
  /** Langue only — renders FR and AR as static flanking labels */
  bilingualLabels?: boolean;
}

const COLOR_MAP = {
  teal:  { track: '#0F7B6C', label: '#0F7B6C' },
  green: { track: '#2D8B4E', label: '#2D8B4E' },
  red:   { track: '#FDF0ED', label: '#D94F3B', border: 'rgba(217,79,59,0.3)', thumb: '#D94F3B' },
  muted: { track: '#F0EFEA', label: '#9E9B90', border: '#E8E6DF', thumb: '#9E9B90' },
} as const;

function Track({ checked, colorOn, colorOff }: { checked: boolean; colorOn: 'teal' | 'green'; colorOff: 'red' | 'muted' }) {
  const on = COLOR_MAP[colorOn];
  const off = COLOR_MAP[colorOff];

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 36,
        height: 20,
        borderRadius: 10,
        border: `1.5px solid ${checked ? 'transparent' : off.border}`,
        background: checked ? on.track : off.track,
        transition: 'background-color 200ms ease, border-color 200ms ease',
        flexShrink: 0,
      }}
    >
      {/* Thumb */}
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: checked ? '#FFFFFF' : off.thumb,
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transform: `translateY(-50%) translateX(${checked ? 20 : 2}px)`,
          transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </span>
  );
}

export function ControlSwitch({
  icon,
  label,
  checked,
  onChange,
  labelOn,
  labelOff,
  colorOn,
  colorOff,
  disabled = false,
  bilingualLabels = false,
}: ControlSwitchProps) {
  const onColor = COLOR_MAP[colorOn].label;
  const offColor = COLOR_MAP[colorOff].label;

  const stateLabelBase: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    transition: 'color 200ms ease',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      {/* Left cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#9E9B90' }}>
          {icon}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A' }}>
          {label}
        </span>
      </div>

      {/* Right cluster — tap target */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? labelOn : labelOff}`}
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minHeight: 36,
          minWidth: 80,
          justifyContent: 'flex-end',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          fontFamily: 'inherit',
        }}
        className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7B6C]"
      >
        {bilingualLabels ? (
          <>
            <span style={{ ...stateLabelBase, minWidth: 42, textAlign: 'right', color: checked ? onColor : '#9E9B90' }}>
              {labelOn}
            </span>
            <Track checked={checked} colorOn={colorOn} colorOff={colorOff} />
            <span style={{ ...stateLabelBase, minWidth: 18, textAlign: 'left', color: !checked ? onColor : '#9E9B90' }}>
              {labelOff}
            </span>
          </>
        ) : (
          <>
            <span style={{ ...stateLabelBase, minWidth: 42, textAlign: 'right', color: checked ? onColor : offColor }}>
              {checked ? labelOn : labelOff}
            </span>
            <Track checked={checked} colorOn={colorOn} colorOff={colorOff} />
          </>
        )}
      </button>
    </div>
  );
}
