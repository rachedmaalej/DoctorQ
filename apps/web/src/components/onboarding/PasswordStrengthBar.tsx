interface PasswordStrengthBarProps {
  password: string;
}

export default function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  if (!password) return null;

  const len = password.length;
  // Simple pattern check for obvious passwords
  const isObvious = /^(.)\1+$/.test(password) || /^(012|123|234|345|456|567|678|789|abc|qwe|azerty|password)/i.test(password);

  let label: string;
  let color: string;
  let widthPercent: number;

  if (len < 8 || isObvious) {
    label = 'Trop court';
    color = '#D94040';
    widthPercent = 33;
  } else if (len <= 10) {
    label = 'Moyen';
    color = '#E07B00';
    widthPercent = 66;
  } else {
    label = 'Fort';
    color = '#1B7A4A';
    widthPercent = 100;
  }

  return (
    <div className="mt-2">
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#D0DDD6' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${widthPercent}%`,
            backgroundColor: color,
            transition: 'width 300ms ease',
          }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color }}>{label}</p>
    </div>
  );
}
