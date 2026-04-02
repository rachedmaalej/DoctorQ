import { webBrand } from '../../lib/brand';

interface FreeTierWatermarkProps {
  tier?: string;
}

/**
 * Subtle watermark footer shown on patient-facing pages when the clinic
 * is on the FREE tier. Links to the brand's landing page.
 */
export default function FreeTierWatermark({ tier }: FreeTierWatermarkProps) {
  if (tier !== 'FREE') return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="flex justify-center py-2">
        <a
          href={`https://${webBrand.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto px-4 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full text-xs text-gray-500 hover:text-gray-700 transition-colors shadow-sm"
        >
          Propulsé par <span className="font-semibold text-gray-700">{webBrand.name}</span>
        </a>
      </div>
    </div>
  );
}
