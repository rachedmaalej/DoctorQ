/**
 * French tricolor bar — AuSuivant brand differentiator.
 * 4px horizontal bar, blue/white/red stripes, sticky at top.
 */
export default function ASTricolorBar() {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 4,
        display: 'flex',
        width: '100%',
      }}
      aria-hidden="true"
    >
      <span style={{ flex: 1, background: '#002395' }} />
      <span style={{ flex: 1, background: '#ffffff' }} />
      <span style={{ flex: 1, background: '#ed2939' }} />
    </div>
  );
}
