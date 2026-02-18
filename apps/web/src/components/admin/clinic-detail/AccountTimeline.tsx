import type { ClinicDetailEnriched } from '@/types';
import { Card } from '@/components/admin/ui';

interface Props {
  timeline: ClinicDetailEnriched['timeline'];
}

const dotConfig: Record<string, { border: string; text: string; char: string }> = {
  brand: { border: 'var(--brand-light)', text: 'var(--brand-light)', char: '★' },
  green: { border: 'var(--success)', text: 'var(--success)', char: '✓' },
  orange: { border: 'var(--warning)', text: 'var(--warning)', char: '!' },
  admin: { border: 'var(--info)', text: 'var(--info)', char: 'A' },
  gray: { border: 'var(--border)', text: 'var(--text-muted)', char: '·' },
};

export default function AccountTimeline({ timeline }: Props) {
  return (
    <Card
      title="Account Timeline"
      subtitle="Chronological history of events & admin actions"
      headerRight={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>All time</span>}
    >
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;
          const dot = dotConfig[item.color] || dotConfig.gray;

          return (
            <div key={item.id} style={{
              display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 18, position: 'relative',
            }}>
              {/* Connecting line */}
              {!isLast && (
                <div style={{
                  position: 'absolute', left: 14, top: 28, bottom: 0,
                  width: 1, background: 'var(--border)',
                }} />
              )}

              {/* Dot */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, border: `2px solid ${dot.border}`,
                background: '#fff', zIndex: 1, color: dot.text,
              }}>
                {dot.char}
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: 3 }}>
                <div style={{ fontSize: 13, fontWeight: 550, color: 'var(--text-primary)' }}>
                  {item.title}
                  {item.adminBadgeLabel && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '2px 7px',
                      borderRadius: 99, fontSize: 10.5, fontWeight: 600, marginLeft: 8,
                      background: item.isAdminAction ? 'var(--info-pale)' : 'var(--brand-pale)',
                      color: item.isAdminAction ? 'var(--info)' : 'var(--brand)',
                    }}>
                      {item.adminBadgeLabel}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                  {item.meta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
