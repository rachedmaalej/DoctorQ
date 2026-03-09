interface ASIconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
}

export default function ASIcon({ name, size = 20, className, style, fill }: ASIconProps) {
  return (
    <span
      className={`material-symbols-outlined${className ? ` ${className}` : ''}`}
      style={{
        fontSize: size,
        fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined,
        lineHeight: 1,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {name}
    </span>
  );
}
