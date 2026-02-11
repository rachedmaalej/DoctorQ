import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

export default function FaqSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  const faqs = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
    { q: t('landing.faq.q4'), a: t('landing.faq.a4') },
    { q: t('landing.faq.q5'), a: t('landing.faq.a5') },
    { q: t('landing.faq.q6'), a: t('landing.faq.a6') },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-3xl mx-auto`}>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          {t('landing.faq.title')}
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaqs.has(index);
            return (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden border border-gray-200"
              >
                <button
                  className="w-full px-6 py-4 text-start flex items-center justify-between"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ms-3 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-48' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4 text-gray-600">{faq.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
