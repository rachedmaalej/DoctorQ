import { TrendingUp, TrendingDown } from 'lucide-react';
import type { TrendData } from '../../shared/types';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: TrendData | null;
  animationDelay?: number;
}

export default function StatCard({ label, value, delta, animationDelay = 0 }: StatCardProps) {
  return (
    <div
      role="status"
      className="animate-fade-in-up"
      style={{
        background: '#ffffff',
        border: '1px solid #e8e5df',
        padding: '1.3rem 1.4rem',
        borderRadius: 16,
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div
        className="font-dm font-medium uppercase"
        style={{ color: '#8a8a9a', fontSize: '0.72rem', letterSpacing: '0.05em', marginBottom: '0.4rem' }}
      >
        {label}
      </div>
      <div className="font-outfit font-bold" style={{ fontSize: '1.8rem', color: '#1a1a2e' }}>
        {value}
      </div>
      {delta && (
        <div
          className="flex items-center gap-1 mt-1 font-dm"
          style={{
            fontSize: '0.72rem',
            color: delta.isPositive ? '#16a34a' : '#ef4444',
            marginTop: '0.3rem',
          }}
        >
          {delta.direction === 'up' ? (
            <TrendingUp size={12} />
          ) : delta.direction === 'down' ? (
            <TrendingDown size={12} />
          ) : null}
          <span>
            <span className="sr-only">{delta.direction === 'up' ? 'increased by' : delta.direction === 'down' ? 'decreased by' : 'steady at'}</span>
            {delta.value}%
          </span>
        </div>
      )}
    </div>
  );
}
