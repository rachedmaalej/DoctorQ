interface FloatingBubbleProps {
  className?: string;
}

export default function FloatingBubble({ className = '' }: FloatingBubbleProps) {
  return (
    <div className={`hidden lg:flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-lg border border-gray-100 ${className}`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-green-50">
        ✓
      </div>
      <div>
        <div className="text-[11px] font-semibold text-gray-900">Patient satisfait</div>
        <div className="text-[9px] text-gray-500">Attente au café d'à côté</div>
      </div>
    </div>
  );
}
