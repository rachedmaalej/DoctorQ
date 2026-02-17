import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';

export default function FinalCtaSection() {
  const { t } = useTranslation();
  const { ref, isInView } = useInView();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      navigate(`/signup?email=${encodeURIComponent(email.trim())}`);
    } else {
      navigate('/signup');
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600">
      <div ref={ref} className={`reveal ${isInView ? 'visible' : ''} max-w-4xl mx-auto text-center`}>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          {t('landing.cta.title')}
        </h2>
        <p className="text-xl text-primary-100 mb-8">
          {t('landing.cta.subtitle')}
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('landing.cta.emailPlaceholder')}
            className="flex-1 px-4 py-3.5 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            className="bg-white text-primary-600 px-6 py-3.5 rounded-xl font-semibold hover:bg-primary-50 transition-all hover:scale-105 duration-200 whitespace-nowrap"
          >
            {t('landing.cta.button')}
          </button>
        </form>
      </div>
    </section>
  );
}
