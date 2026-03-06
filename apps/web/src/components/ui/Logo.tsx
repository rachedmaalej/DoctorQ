/**
 * Brand Logo Component
 * BleSaf: "Blé" uses Reem Kufi + "Saf" uses Bebas Neue
 * AuSuivant: "Au" uses IBM Plex Sans + "Suivant" uses Bebas Neue
 */

import { webBrand } from '../../lib/brand';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'text-base',
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const [first, second] = webBrand.theme.logo.parts;
  return (
    <h1 className={`font-bold text-primary-700 ${sizeClasses[size]} ${className}`}>
      <span style={{ fontFamily: first.font }}>{first.text}</span>
      <span style={{ fontFamily: second.font, letterSpacing: '0.05em' }}>{second.text}</span>
    </h1>
  );
}
