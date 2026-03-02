import { CSSProperties } from 'react';

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 20, fill = false, className = '', style }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{
        fontSize: size,
        ...(fill && { fontVariationSettings: "'FILL' 1" }),
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
