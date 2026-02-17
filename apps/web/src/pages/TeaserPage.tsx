import { useState } from 'react';
import { webBrand } from '../lib/brand';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function TeaserPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'teaser' }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Mystery icon */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Provocative headline */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
            Vos patients attendent{' '}
            <span className="text-red-400">47 minutes</span>
            <br />
            en moyenne.
          </h1>

          <p className="text-gray-400 text-lg mb-2">
            Et si vous pouviez changer ça en 5 minutes ?
          </p>
          <p className="text-gray-500 text-sm">
            Une solution existe. Elle arrive bientôt.
          </p>
        </div>

        {/* Email capture */}
        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
            <div className="w-12 h-12 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white font-semibold text-lg mb-1">Merci !</h2>
            <p className="text-gray-400 text-sm">
              Nous vous contacterons très bientôt avec la suite.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-gray-300 text-sm font-medium mb-4">
              Laissez votre email pour être parmi les premiers informés.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:border-red-400/50 transition-all"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] duration-200"
            >
              {status === 'loading' ? 'Un instant...' : 'Me tenir informé'}
            </button>
            {status === 'error' && (
              <p className="text-red-400 text-xs">
                Une erreur est survenue. Réessayez.
              </p>
            )}
          </form>
        )}

        {/* Subtle mystery branding */}
        <p className="mt-12 text-gray-600 text-xs">
          {webBrand.id === 'france'
            ? 'Une initiative pour les cabinets médicaux français.'
            : 'Une initiative pour les cabinets médicaux tunisiens.'}
        </p>
      </div>
    </div>
  );
}
