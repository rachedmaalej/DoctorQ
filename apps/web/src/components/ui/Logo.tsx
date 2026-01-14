/**
 * BléSaf Logo Component
 * "Blé" uses Reem Kufi (Arabic/oriental style font)
 * "Saf" uses Bebas Neue (strict, geometric, serious font)
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <h1 className={`font-bold text-primary-700 ${sizeClasses[size]} ${className}`}>
      <span style={{ fontFamily: "'Reem Kufi', sans-serif" }}>Blé</span>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>SAF</span>
    </h1>
  );
}
