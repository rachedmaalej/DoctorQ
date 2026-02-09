import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { SUPPORTED_SPECIALTIES, getFunFactsForSpecialty } from '@/data/funFacts';

type OnboardingStep = 'clinic' | 'qrcode' | 'tutorial';

interface ClinicFormData {
  name: string;
  doctorName: string;
  doctorGender: 'M' | 'F' | '';
  phone: string;
  avgConsultationMins: number;
  specialty: string;
}

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clinic, checkAuth } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('clinic');
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<{ url: string; qrCode: string } | null>(null);
  const [clinicForm, setClinicForm] = useState<ClinicFormData>({
    name: clinic?.name || '',
    doctorName: clinic?.doctorName || '',
    doctorGender: (clinic?.doctorGender as 'M' | 'F') || '',
    phone: '',
    avgConsultationMins: 10,
    specialty: '',
  });

  const steps: OnboardingStep[] = ['clinic', 'qrcode', 'tutorial'];
  const currentStepIndex = steps.indexOf(currentStep);

  useEffect(() => {
    // Fetch QR code when reaching that step
    if (currentStep === 'qrcode' && !qrData) {
      fetchQRCode();
    }
  }, [currentStep]);

  const fetchQRCode = async () => {
    try {
      const data = await api.getQRCode();
      setQrData(data);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    }
  };

  const handleNext = async () => {
    if (currentStepIndex < steps.length - 1) {
      // On step 1 (clinic), save the clinic settings
      if (currentStep === 'clinic') {
        try {
          await api.updateClinic({
            name: clinicForm.name || undefined,
            doctorName: clinicForm.doctorName || undefined,
            doctorGender: clinicForm.doctorGender || undefined,
            phone: clinicForm.phone || undefined,
            avgConsultationMins: clinicForm.avgConsultationMins,
            specialty: clinicForm.specialty || undefined,
          });
        } catch (error) {
          console.error('Failed to save clinic settings:', error);
        }
      }
      // Update onboarding progress
      try {
        await api.updateOnboarding(currentStepIndex + 1);
      } catch (error) {
        console.error('Failed to update onboarding:', error);
      }
      setCurrentStep(steps[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1]);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await api.updateOnboarding(3, true);
      await checkAuth(); // Refresh clinic data so dashboard sees onboardingCompleted=true
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="font-bold text-xl text-gray-900">BleSaf</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {t('onboarding.step', { current: currentStepIndex + 1, total: steps.length })}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {currentStep === 'clinic' && (
          <StepClinicSetup
            form={clinicForm}
            onChange={setClinicForm}
            onNext={handleNext}
          />
        )}

        {currentStep === 'qrcode' && (
          <StepQRCode
            qrData={qrData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 'tutorial' && (
          <StepTutorial
            onComplete={handleComplete}
            onBack={handleBack}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}

// Step 1: Clinic Setup
function StepClinicSetup({
  form,
  onChange,
  onNext,
}: {
  form: ClinicFormData;
  onChange: (form: ClinicFormData) => void;
  onNext: () => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🏥</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('onboarding.clinic.title')}
        </h1>
        <p className="text-gray-600">{t('onboarding.clinic.subtitle')}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('onboarding.clinic.clinicName')}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={t('onboarding.clinic.clinicNamePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('onboarding.clinic.doctorName')}
          </label>
          <div className="flex gap-2">
            <div className="flex rounded-lg border border-gray-300 overflow-hidden flex-shrink-0">
              <button
                type="button"
                onClick={() => onChange({ ...form, doctorGender: 'M' })}
                className={`px-3 py-3 text-sm font-medium transition-colors ${
                  form.doctorGender === 'M'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('onboarding.clinic.genderMr')}
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...form, doctorGender: 'F' })}
                className={`px-3 py-3 text-sm font-medium transition-colors border-s border-gray-300 ${
                  form.doctorGender === 'F'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t('onboarding.clinic.genderMs')}
              </button>
            </div>
            <input
              type="text"
              value={form.doctorName}
              onChange={(e) => onChange({ ...form, doctorName: e.target.value })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={t('onboarding.clinic.doctorNamePlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('onboarding.clinic.phone')}
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="+216 XX XXX XXX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('onboarding.clinic.avgConsultation')}
          </label>
          <select
            value={form.avgConsultationMins}
            onChange={(e) => onChange({ ...form, avgConsultationMins: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={5}>5 {t('onboarding.clinic.minutes')}</option>
            <option value={10}>10 {t('onboarding.clinic.minutes')}</option>
            <option value={15}>15 {t('onboarding.clinic.minutes')}</option>
            <option value={20}>20 {t('onboarding.clinic.minutes')}</option>
            <option value={30}>30 {t('onboarding.clinic.minutes')}</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">{t('onboarding.clinic.avgConsultationHelp')}</p>
        </div>

        {/* Specialty Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('funFacts.specialtyLabel')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUPPORTED_SPECIALTIES.map((spec) => {
              const isSelected = form.specialty === spec.key;
              const label = i18n.language === 'ar' ? spec.labelAr : spec.labelFr;
              return (
                <button
                  key={spec.key}
                  type="button"
                  onClick={() => onChange({ ...form, specialty: spec.key })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-start ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary-600' : 'text-gray-400'}`}
                    style={{ fontVariationSettings: isSelected ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {spec.icon}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Value proposition preview */}
          {form.specialty && (
            <div className="mt-3 p-3 bg-primary-50 border border-primary-100 rounded-xl">
              <p className="text-xs text-primary-600 mb-2">{t('funFacts.valueProposition')}</p>
              <div className="bg-white/80 border border-primary-100 rounded-lg p-3">
                <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
                  {i18n.language === 'ar' ? 'هل تعلم؟' : 'Le saviez-vous ?'}
                </p>
                <p className="text-sm text-gray-700">
                  {(() => {
                    const data = getFunFactsForSpecialty(form.specialty);
                    const fact = data.facts[0];
                    return fact ? (i18n.language === 'ar' ? fact.ar : fact.fr) : '';
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full mt-8 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
      >
        {t('onboarding.continue')}
      </button>
    </div>
  );
}

// Step 2: QR Code Setup
function StepQRCode({
  qrData,
  onNext,
  onBack,
}: {
  qrData: { url: string; qrCode: string } | null;
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();

  const handleDownloadPDF = () => {
    // For now, open print dialog with QR code
    if (qrData?.qrCode) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>BleSaf QR Code</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .container {
                text-align: center;
                padding: 40px;
                border: 2px solid #e5e7eb;
                border-radius: 16px;
                max-width: 400px;
              }
              h1 {
                font-size: 24px;
                color: #111827;
                margin-bottom: 8px;
              }
              p {
                color: #6b7280;
                margin-bottom: 24px;
              }
              img {
                max-width: 250px;
                margin: 0 auto;
              }
              .instructions {
                margin-top: 24px;
                padding: 16px;
                background: #f3f4f6;
                border-radius: 8px;
                font-size: 14px;
              }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Scannez pour rejoindre la file</h1>
              <p>Prenez votre place sans attendre</p>
              <img src="${qrData.qrCode}" alt="QR Code" />
              <div class="instructions">
                1. Scannez ce QR code avec votre téléphone<br/>
                2. Entrez votre numéro<br/>
                3. Suivez votre position en temps réel
              </div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📱</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('onboarding.qrcode.title')}
        </h1>
        <p className="text-gray-600">{t('onboarding.qrcode.subtitle')}</p>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center mb-8">
        {qrData?.qrCode ? (
          <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
            <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48" />
          </div>
        ) : (
          <div className="w-48 h-48 bg-gray-100 rounded-xl animate-pulse" />
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">{t('onboarding.qrcode.howToUse')}</h3>
        <ol className="space-y-3 text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">1</span>
            <span>{t('onboarding.qrcode.step1')}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">2</span>
            <span>{t('onboarding.qrcode.step2')}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">3</span>
            <span>{t('onboarding.qrcode.step3')}</span>
          </li>
        </ol>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownloadPDF}
        className="w-full mb-4 bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        {t('onboarding.qrcode.printPoster')}
      </button>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          {t('onboarding.back')}
        </button>
        <button
          onClick={onNext}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          {t('onboarding.continue')}
        </button>
      </div>
    </div>
  );
}

// Step 3: Tutorial
function StepTutorial({
  onComplete,
  onBack,
  isLoading,
}: {
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('onboarding.tutorial.title')}
        </h1>
        <p className="text-gray-600">{t('onboarding.tutorial.subtitle')}</p>
      </div>

      {/* Quick Tips */}
      <div className="space-y-4 mb-8">
        <div className="flex gap-4 p-4 bg-blue-50 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">➕</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{t('onboarding.tutorial.tip1Title')}</h4>
            <p className="text-sm text-gray-600">{t('onboarding.tutorial.tip1Desc')}</p>
          </div>
        </div>

        <div className="flex gap-4 p-4 bg-green-50 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">📞</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{t('onboarding.tutorial.tip2Title')}</h4>
            <p className="text-sm text-gray-600">{t('onboarding.tutorial.tip2Desc')}</p>
          </div>
        </div>

        <div className="flex gap-4 p-4 bg-purple-50 rounded-xl">
          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">🔔</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{t('onboarding.tutorial.tip3Title')}</h4>
            <p className="text-sm text-gray-600">{t('onboarding.tutorial.tip3Desc')}</p>
          </div>
        </div>
      </div>

      {/* Trial Info */}
      <div className="bg-primary-50 border border-primary-100 rounded-xl p-6 mb-8 text-center">
        <p className="text-primary-700 font-medium">{t('onboarding.tutorial.trialInfo')}</p>
        <p className="text-sm text-primary-600 mt-1">{t('onboarding.tutorial.smsInfo')}</p>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          {t('onboarding.back')}
        </button>
        <button
          onClick={onComplete}
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? t('common.loading') : t('onboarding.complete')}
        </button>
      </div>
    </div>
  );
}
