import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

export default function TestimonialSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const initials = t('landing.testimonial.author')
    .split(' ')
    .filter((w: string) => w.length > 1 && w[0] !== '(')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('');

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-3xl mx-auto text-center`}>
        {/* Decorative quote */}
        <div className="text-6xl text-primary-200 font-serif leading-none mb-4" aria-hidden="true">
          &ldquo;
        </div>

        <blockquote className="text-xl sm:text-2xl text-gray-700 font-medium leading-relaxed mb-8 italic">
          {t('landing.testimonial.quote')}
        </blockquote>

        <div className="flex items-center justify-center gap-3">
          {/* Initials avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg">
            {initials}
          </div>
          <div className="text-start">
            <div className="font-semibold text-gray-900">
              {t('landing.testimonial.author')}
            </div>
            <div className="text-sm text-gray-500">
              {t('landing.testimonial.role')} — {t('landing.testimonial.clinic')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
