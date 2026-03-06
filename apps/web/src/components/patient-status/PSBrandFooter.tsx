import { webBrand } from '@/lib/brand';

export default function PSBrandFooter() {
  if (webBrand.country === 'TN') {
    return (
      <div className="ps-brand-footer" style={{ position: 'relative', zIndex: 2 }}>
        <div className="ps-brand-mark">{webBrand.name[0]}</div>
        {webBrand.name}
      </div>
    );
  }

  return (
    <div className="ps-brand-footer">
      Propulsé par{' '}
      <a href={`https://${webBrand.domain}`} target="_blank" rel="noopener noreferrer">
        {webBrand.name}
      </a>
    </div>
  );
}
