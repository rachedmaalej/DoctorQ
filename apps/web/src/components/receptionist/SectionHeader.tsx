interface SectionHeaderProps {
  title: string;
  className?: string;
}

export default function SectionHeader({ title, className }: SectionHeaderProps) {
  return (
    <div className={`flex justify-between items-center px-5 pt-[18px] pb-2 ${className ?? ''}`}>
      <span
        className="text-bs-text-tertiary font-semibold uppercase"
        style={{ fontSize: 13, letterSpacing: '0.06em' }}
      >
        {title}
      </span>
    </div>
  );
}
