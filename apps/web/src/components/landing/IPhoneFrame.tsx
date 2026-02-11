interface IPhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

// iPhone 14 body: 146.7 × 71.5mm → ~2.05:1
// iPhone 14 screen: 390 × 844 logical pts → ~2.16:1
export default function IPhoneFrame({ children, className = '' }: IPhoneFrameProps) {
  return (
    <div
      className={`bg-gray-900 rounded-[28px] sm:rounded-[36px] lg:rounded-[40px] p-[5px] sm:p-[7px] lg:p-2.5 shadow-2xl ${className}`}
      style={{ aspectRatio: '71.5 / 146.7' }}
    >
      {/* Notch — Dynamic Island style */}
      <div className="relative">
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-10 sm:w-14 lg:w-16 h-2 sm:h-3 lg:h-[14px] bg-gray-900 rounded-full z-10" />
      </div>
      {/* Screen */}
      <div className="bg-white rounded-[24px] sm:rounded-[30px] lg:rounded-[32px] overflow-hidden h-full flex flex-col pt-3 sm:pt-4 lg:pt-5">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
