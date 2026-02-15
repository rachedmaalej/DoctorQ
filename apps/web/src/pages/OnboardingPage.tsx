import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { SUPPORTED_SPECIALTIES, getFunFactsForSpecialty } from '@/data/funFacts';
import { webBrand } from '@/lib/brand';

type OnboardingStep = 'clinic' | 'qrcode' | 'tutorial';

interface ClinicFormData {
  name: string;
  doctorName: string;
  doctorGender: 'M' | 'F' | '';
  phone: string;
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
              <span className="text-white font-bold text-lg">{webBrand.name[0]}</span>
            </div>
            <span className="font-bold text-xl text-gray-900">{webBrand.name}</span>
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
          <StepSimulation
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
            placeholder={webBrand.phone.placeholder}
          />
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
            <title>${webBrand.name} QR Code</title>
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

// Step 3: Live Simulation
function StepSimulation({
  onComplete,
  onBack,
  isLoading,
}: {
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'add' | 'queue' | 'called' | 'done'>('add');
  const [isAdding, setIsAdding] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showPatient, setShowPatient] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleAddPatient = () => {
    setIsAdding(true);
    setTimeout(() => {
      setPhase('queue');
      setTimeout(() => setShowPatient(true), 100);
      setIsAdding(false);
    }, 800);
  };

  const handleCallNext = () => {
    setIsCalling(true);
    setTimeout(() => {
      setPhase('called');
      setIsCalling(false);
      setTimeout(() => setShowNotification(true), 300);
      setTimeout(() => {
        setPhase('done');
        setShowCelebration(true);
      }, 1200);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm">
      {/* Phase A: Add patient */}
      {phase === 'add' && (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {t('onboarding.simulation.addTitle')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('onboarding.simulation.addSubtitle')}
            </p>
          </div>

          {/* Pre-filled patient card */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Sami B.</div>
                <div className="text-xs text-gray-500">{webBrand.phone.placeholder}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('onboarding.simulation.testPatientNote')}
            </div>
          </div>

          <button
            onClick={handleAddPatient}
            disabled={isAdding}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('onboarding.simulation.adding')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {t('onboarding.simulation.addToQueue')}
              </>
            )}
          </button>

          <button
            onClick={onBack}
            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            {t('onboarding.back')}
          </button>
        </>
      )}

      {/* Phase B: Queue + Call */}
      {(phase === 'queue' || phase === 'called') && (
        <>
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {t('onboarding.simulation.yourQueue')}
            </h2>
            <p className="text-sm text-gray-500">
              {phase === 'called'
                ? t('onboarding.simulation.inConsultation')
                : t('onboarding.simulation.oneWaiting')}
            </p>
          </div>

          {/* Patient card */}
          <div
            className={`border-2 rounded-xl p-4 flex items-center gap-3 mb-4 transition-all duration-500 ${
              showPatient ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${
              phase === 'called'
                ? 'border-green-400 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
              phase === 'called' ? 'bg-green-500' : 'bg-primary-600'
            }`}>
              1
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">Sami B.</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('onboarding.simulation.justNow')}
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              phase === 'called'
                ? 'bg-green-100 text-green-700'
                : 'bg-primary-50 text-primary-700'
            }`}>
              {phase === 'called'
                ? t('onboarding.simulation.statusConsultation')
                : t('onboarding.simulation.statusWaiting')}
            </span>
          </div>

          {/* Call button */}
          {phase === 'queue' && (
            <button
              onClick={handleCallNext}
              disabled={isCalling}
              className="w-full bg-primary-600 text-white py-3.5 rounded-lg font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 animate-pulse"
            >
              {isCalling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('onboarding.simulation.calling')}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {t('onboarding.simulation.callNext')}
                </>
              )}
            </button>
          )}

          {/* Real-time tracking notification */}
          <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3 mt-4 transition-all duration-500 ${
            showNotification ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none h-0 mt-0 p-0 overflow-hidden border-0'
          }`}>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                {t('onboarding.simulation.trackingLabel')}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {t('onboarding.simulation.trackingText')}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Phase C: Celebration */}
      {phase === 'done' && showCelebration && (
        <>
          {/* Patient card still visible */}
          <div className="border-2 border-green-400 bg-green-50 rounded-xl p-4 flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold">1</div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">Sami B.</div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('onboarding.simulation.justNow')}
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
              {t('onboarding.simulation.statusConsultation')}
            </span>
          </div>

          {/* Celebration */}
          <div className="text-center mt-6">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {t('onboarding.simulation.bravoTitle')}
            </h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {t('onboarding.simulation.bravoSubtitle')}
            </p>

            {/* Trial banner */}
            <div className="bg-gradient-to-br from-primary-50 to-white border border-primary-200 rounded-xl p-4 flex items-center gap-3 text-start mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div className="text-sm text-gray-700">
                <strong className="text-primary-700">{t('onboarding.simulation.trialBanner')}</strong><br />
                {t('onboarding.simulation.noCreditCard')}
              </div>
            </div>

            <button
              onClick={onComplete}
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              )}
              {isLoading ? t('common.loading') : t('onboarding.simulation.viewDashboard')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
