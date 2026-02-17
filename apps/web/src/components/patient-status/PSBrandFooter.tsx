import { webBrand } from '@/lib/brand';

export default function PSBrandFooter() {
  if (webBrand.id === 'blesaf') {
    return (
      <div className="ps-brand-footer" style={{ position: 'relative', zIndex: 2 }}>
        <div className="ps-brand-mark">B</div>
        BleSaf
      </div>
    );
  }

  // France / AuSuivant
  return (
    <div className="ps-brand-footer">
      Propulsé par{' '}
      <a href="https://ausuivant.com" target="_blank" rel="noopener noreferrer">
        AuSuivant
      </a>
    </div>
  );
}
