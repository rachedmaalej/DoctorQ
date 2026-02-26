interface ProgressBarProps {
  currentStep: 1 | 2 | 3;
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  // Progress percentage: step 1 = 0%, step 2 = 50%, step 3 = 100%
  const progressPercent = currentStep === 1 ? 0 : currentStep === 2 ? 50 : 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center" style={{ height: '20px', padding: '8px 24px' }}>
      <div className="w-full flex items-center gap-0 relative">
        {/* Track background */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-1 rounded-full" style={{ backgroundColor: '#D0DDD6' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: '#1B7A4A',
                transition: 'width 600ms ease-in-out',
              }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="relative w-full flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="rounded-full"
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: step <= currentStep ? '#1B7A4A' : 'transparent',
                border: step <= currentStep ? 'none' : '2px solid #D0DDD6',
                transition: 'background-color 400ms ease, border-color 400ms ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
