import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  url: string;
  clinicName: string;
  size?: number;
}

export default function QRCodeDisplay({ url, clinicName, size = 220 }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center">
      {/* QR Code with pulse animation */}
      <div
        className="p-4 bg-white rounded-xl shadow-sm"
        style={{
          animation: 'qr-pulse 4s ease-in-out infinite',
        }}
      >
        <QRCodeSVG
          value={url}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#1A1A2E"
          imageSettings={{
            src: '/logo-icon.svg',
            x: undefined,
            y: undefined,
            height: Math.round(size * 0.18),
            width: Math.round(size * 0.18),
            excavate: true,
          }}
        />
      </div>

      {/* Clinic name + instruction */}
      <p className="mt-4 text-lg font-bold" style={{ color: '#1A1A2E' }}>
        {clinicName}
      </p>
      <p className="text-sm mt-1" style={{ color: '#555566' }}>
        Scannez pour rejoindre la file d&apos;attente
      </p>

      {/* Keyframe animation */}
      <style>{`
        @keyframes qr-pulse {
          0%, 100% { transform: scale(1.0); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
