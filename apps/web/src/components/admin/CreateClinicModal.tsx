import { useState } from 'react';
import { api } from '@/lib/api';
import { formatPhone, extractPhoneDigits, DEFAULT_PHONE_VALUE } from '@/lib/phone';
import { webBrand } from '@/lib/brand';

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateClinicModal({ isOpen, onClose, onCreated }: CreateClinicModalProps) {
  const [name, setName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('fr');
  const [businessType, setBusinessType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdClinic, setCreatedClinic] = useState<{ id: string; name: string; email: string } | null>(null);

  const resetForm = () => {
    setName('');
    setDoctorName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setLanguage('fr');
    setBusinessType('general');
    setError(null);
    setCreatedClinic(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const e164Phone = extractPhoneDigits(phone);
      const clinic = await api.createClinic({
        name,
        email,
        password,
        doctorName: doctorName || undefined,
        phone: e164Phone || undefined,
        language,
        businessType,
      });
      setCreatedClinic(clinic);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create clinic');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = 'w-full px-3 py-2 border border-[#D0E8E5] rounded-lg focus:ring-2 focus:ring-[#267B75] focus:border-transparent text-[#132E2C]';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-[#E6F2F0] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider">
              {createdClinic ? 'Clinic Created' : 'Create New Clinic'}
            </h2>
            <button onClick={handleClose} className="text-[#8AADAA] hover:text-[#132E2C] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {createdClinic ? (
            <div className="space-y-4">
              <div className="border border-[#337023] rounded-lg p-4">
                <p className="text-[#337023] font-medium text-sm">Clinic created successfully!</p>
              </div>
              <div className="border border-[#E6F2F0] rounded-lg p-4 space-y-2">
                <p className="text-sm text-[#4E7572]">Share these credentials with the clinic:</p>
                <div className="font-mono text-sm border border-[#D0E8E5] rounded p-3 select-all text-[#132E2C]">
                  <p><strong>Clinic:</strong> {createdClinic.name}</p>
                  <p><strong>Email:</strong> {createdClinic.email}</p>
                  <p><strong>Password:</strong> {password}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Clinic: ${createdClinic.name}\nEmail: ${createdClinic.email}\nPassword: ${password}`
                    );
                  }}
                  className="text-sm text-[#267B75] hover:underline font-medium"
                >
                  Copy to clipboard
                </button>
              </div>
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-[#267B75] hover:bg-[#1F6560] text-white font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="border border-[#E15720] text-[#E15720] px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#4E7572] mb-1">Clinic Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Cabinet Dr. Kammoun" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#4E7572] mb-1">Doctor Name</label>
                  <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className={inputClass} placeholder="Dr. Ahmed Kammoun" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4E7572] mb-1">Email *</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} placeholder="clinic@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4E7572] mb-1">Password *</label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputClass} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4E7572] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setPhone(formatted);
                    }}
                    onFocus={() => { if (!phone) setPhone(DEFAULT_PHONE_VALUE); }}
                    onBlur={() => { if (phone === DEFAULT_PHONE_VALUE || phone === webBrand.phone.countryCode) setPhone(''); }}
                    className={inputClass}
                    placeholder={webBrand.phone.placeholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4E7572] mb-1">Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`${inputClass} bg-white`}>
                    <option value="fr">Francais</option>
                    {webBrand.supportedLanguages.includes('ar') && (
                      <option value="ar">العربية</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4E7572] mb-1">Spécialité</label>
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={`${inputClass} bg-white`}>
                    <option value="general">Médecine Générale</option>
                    <option value="gynecology">Gynécologie-Obstétrique</option>
                    <option value="pediatrics">Pédiatrie</option>
                    <option value="ophthalmology">Ophtalmologie</option>
                    <option value="dermatology">Dermatologie</option>
                    <option value="ent">ORL</option>
                    <option value="cardiology">Cardiologie</option>
                    <option value="gastroenterology">Gastro-entérologie</option>
                    <option value="orthopedics">Orthopédie</option>
                    <option value="dental">Dentaire</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-[#D0E8E5] text-[#4E7572] font-medium rounded-lg hover:bg-[#F3FAF9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#267B75] hover:bg-[#1F6560] text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Clinic'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
