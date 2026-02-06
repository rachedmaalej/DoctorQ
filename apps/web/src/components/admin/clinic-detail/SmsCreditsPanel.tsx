interface SmsCreditsPanelProps {
  smsCredits: number;
  smsCreditsUsed: number;
}

export default function SmsCreditsPanel({ smsCredits, smsCreditsUsed }: SmsCreditsPanelProps) {
  const total = smsCredits + smsCreditsUsed;
  const usagePercent = total > 0 ? Math.round((smsCreditsUsed / total) * 100) : 0;

  return (
    <div className="flex-1">
      <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-3">SMS Credits</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#4E7572]">Remaining</span>
          <span className={`text-sm font-medium ${smsCredits <= 10 ? 'text-[#E15720]' : 'text-[#132E2C]'}`}>
            {smsCredits}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#4E7572]">Used</span>
          <span className="text-sm font-medium text-[#132E2C]">{smsCreditsUsed}</span>
        </div>
        {total > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#8AADAA]">Usage</span>
              <span className="text-xs text-[#8AADAA]">{usagePercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#E6F2F0] rounded-full">
              <div
                className="h-full bg-[#267B75] rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
