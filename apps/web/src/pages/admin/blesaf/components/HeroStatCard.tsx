import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TrendData } from '../../shared/types';

interface HeroStatCardProps {
  label: string;
  value: string | number;
  delta?: TrendData | null;
  animationDelay?: number;
}

export default function HeroStatCard({ label, value, delta, animationDelay = 0 }: HeroStatCardProps) {
  return (
    <div
      role="status"
      className="animate-fade-in-up"
      style={{
        background: 'linear-gradient(135deg, #1a3c34, #2a5e4a)',
        padding: '1.3rem 1.4rem',
        borderRadius: 16,
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div
        className="font-dm font-medium uppercase"
        style={{ color: '#a3d4b8', fontSize: '0.72rem', letterSpacing: '0.05em', marginBottom: '0.4rem' }}
      >
        {label}
      </div>
      <div className="font-outfit font-bold text-white" style={{ fontSize: '1.8rem' }}>
        {value}
      </div>
      {delta && (
        <div className="flex items-center gap-1 mt-1" style={{ color: '#7cc9a5', fontSize: '0.72rem' }}>
          {delta.direction === 'up' ? (
            <TrendingUp size={12} />
          ) : delta.direction === 'down' ? (
            <TrendingDown size={12} />
          ) : null}
          <span className="font-dm">
            <span className="sr-only">{delta.direction === 'up' ? 'increased by' : delta.direction === 'down' ? 'decreased by' : 'steady at'}</span>
            {delta.value}%
          </span>
        </div>
      )}
    </div>
  );
}
