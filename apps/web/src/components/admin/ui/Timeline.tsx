import React from 'react';

interface TimelineItem {
  number: number;
  color: 'green' | 'orange' | 'gray';
  title: string;
  meta: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

const dotColorMap: Record<string, { border: string; text: string }> = {
  green: { border: 'var(--success)', text: 'var(--success)' },
  orange: { border: 'var(--warning)', text: 'var(--warning)' },
  gray: { border: 'var(--border)', text: 'var(--text-muted)' },
};

const Timeline: React.FC<TimelineProps> = ({ items }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    padding: '16px 20px',
  };

  return (
    <div style={containerStyle}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const colors = dotColorMap[item.color];

        const rowStyle: React.CSSProperties = {
          position: 'relative',
          display: 'flex',
          gap: 14,
          paddingBottom: isLast ? 0 : 20,
        };

        const lineStyle: React.CSSProperties = {
          position: 'absolute',
          width: 1,
          background: 'var(--border)',
          left: 15,
          top: 28,
          bottom: 0,
        };

        const dotStyle: React.CSSProperties = {
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: `2px solid ${colors.border}`,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 1,
          flexShrink: 0,
          color: colors.text,
        };

        const contentStyle: React.CSSProperties = {
          flex: 1,
          paddingTop: 4,
        };

        const titleStyle: React.CSSProperties = {
          fontSize: 13,
          fontWeight: 550,
        };

        const metaStyle: React.CSSProperties = {
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 1,
        };

        return (
          <div key={index} style={rowStyle}>
            {!isLast && <div style={lineStyle} />}
            <div style={dotStyle}>{item.number}</div>
            <div style={contentStyle}>
              <div style={titleStyle}>{item.title}</div>
              <div style={metaStyle}>{item.meta}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
