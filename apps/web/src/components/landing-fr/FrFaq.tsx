import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { ChevronDown } from 'lucide-react';

export default function FrFaq() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const faqs = [
    { q: t('landingFr.faq.q1'), a: t('landingFr.faq.a1') },
    { q: t('landingFr.faq.q2'), a: t('landingFr.faq.a2') },
    { q: t('landingFr.faq.q3'), a: t('landingFr.faq.a3') },
    { q: t('landingFr.faq.q4'), a: t('landingFr.faq.a4') },
    { q: t('landingFr.faq.q5'), a: t('landingFr.faq.a5') },
    { q: t('landingFr.faq.q6'), a: t('landingFr.faq.a6') },
    { q: t('landingFr.faq.q7'), a: t('landingFr.faq.a7') },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-fr-cream-warm">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-3xl mx-auto`}>
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-fr-navy mb-4">
          {t('landingFr.faq.title')}
        </h2>
        <div className="fr-divider mb-14" />

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqs.has(index);
            return (
              <div
                key={index}
                className="fr-faq-item bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-200"
                data-open={isOpen ? 'true' : 'false'}
              >
                <button
                  className="w-full px-6 py-4 text-start flex items-center justify-between"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-medium text-fr-navy text-sm font-inter">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-3 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-48' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
