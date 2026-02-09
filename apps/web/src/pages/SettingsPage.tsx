import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import type { Doctor } from '../types';
import Header from '../components/layout/Header';
import { SUPPORTED_SPECIALTIES } from '@/data/funFacts';
import FunFactCard from '@/components/patient/FunFactCard';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { clinic, checkAuth } = useAuthStore();

  // Clinic info form
  const [clinicForm, setClinicForm] = useState({
    name: '',
    doctorName: '',
    doctorGender: '' as 'M' | 'F' | '',
    phone: '',
    address: '',
  });

  // Queue settings form
  const [queueForm, setQueueForm] = useState({
    avgConsultationMins: 15,
    notifyAtPosition: 2,
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // UI state
  const [savingClinic, setSavingClinic] = useState(false);
  const [savingQueue, setSavingQueue] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [clinicMessage, setClinicMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [queueMessage, setQueueMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Patient experience state
  const [specialty, setSpecialty] = useState('');
  const [funFactsEnabled, setFunFactsEnabled] = useState(true);
  const [savingExperience, setSavingExperience] = useState(false);
  const [experienceMessage, setExperienceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Doctors state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);

  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(() => {});
  }, []);

  useEffect(() => {
    if (clinic) {
      setClinicForm({
        name: clinic.name || '',
        doctorName: clinic.doctorName || '',
        doctorGender: (clinic.doctorGender as 'M' | 'F') || '',
        phone: (clinic as any).phone || '',
        address: (clinic as any).address || '',
      });
      setQueueForm({
        avgConsultationMins: clinic.avgConsultationMins || 15,
        notifyAtPosition: clinic.notifyAtPosition || 2,
      });
      setSpecialty((clinic as any).specialty || '');
      setFunFactsEnabled((clinic as any).funFactsEnabled !== false);
    }
  }, [clinic]);

  const handleSaveClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClinic(true);
    setClinicMessage(null);
    try {
      await api.updateClinic({
        name: clinicForm.name,
        doctorName: clinicForm.doctorName || undefined,
        doctorGender: clinicForm.doctorGender || undefined,
        phone: clinicForm.phone || undefined,
        address: clinicForm.address || undefined,
      });
      await checkAuth();
      setClinicMessage({ type: 'success', text: t('settings.saved') });
    } catch {
      setClinicMessage({ type: 'error', text: t('settings.saveError') });
    } finally {
      setSavingClinic(false);
    }
  };

  const handleSaveQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQueue(true);
    setQueueMessage(null);
    try {
      await api.updateClinic({
        avgConsultationMins: queueForm.avgConsultationMins,
        notifyAtPosition: queueForm.notifyAtPosition,
      });
      await checkAuth();
      setQueueMessage({ type: 'success', text: t('settings.saved') });
    } catch {
      setQueueMessage({ type: 'error', text: t('settings.saveError') });
    } finally {
      setSavingQueue(false);
    }
  };

  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExperience(true);
    setExperienceMessage(null);
    try {
      await api.updateClinic({
        specialty: specialty || undefined,
        funFactsEnabled,
      });
      await checkAuth();
      setExperienceMessage({ type: 'success', text: t('settings.saved') });
    } catch {
      setExperienceMessage({ type: 'error', text: t('settings.saveError') });
    } finally {
      setSavingExperience(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: t('settings.passwordMismatch') });
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage({ type: 'success', text: t('settings.passwordChanged') });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      if (err.code === 'INVALID_PASSWORD') {
        setPasswordMessage({ type: 'error', text: t('settings.wrongPassword') });
      } else {
        setPasswordMessage({ type: 'error', text: t('settings.passwordError') });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctorName.trim()) return;
    setAddingDoctor(true);
    try {
      const doctor = await api.createDoctor({
        name: newDoctorName.trim(),
        specialty: newDoctorSpecialty.trim() || undefined,
      });
      setDoctors([...doctors, doctor]);
      setNewDoctorName('');
      setNewDoctorSpecialty('');
    } catch {
      // silently fail
    } finally {
      setAddingDoctor(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm(t('settings.confirmDeleteDoctor'))) return;
    try {
      await api.deleteDoctor(doctorId);
      setDoctors(doctors.filter(d => d.id !== doctorId));
    } catch {
      // silently fail
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('common.back')}
          </button>
        </div>

        {/* Clinic Info */}
        <form onSubmit={handleSaveClinic} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.clinicInfo')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.clinicName')}
              </label>
              <input
                id="name"
                type="text"
                value={clinicForm.name}
                onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.doctorName')}
              </label>
              <div className="flex gap-2">
                <div className="flex rounded-lg border border-gray-300 overflow-hidden flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setClinicForm({ ...clinicForm, doctorGender: 'M' })}
                    className={`px-3 py-3 text-sm font-medium transition-colors ${
                      clinicForm.doctorGender === 'M'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t('onboarding.clinic.genderMr')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClinicForm({ ...clinicForm, doctorGender: 'F' })}
                    className={`px-3 py-3 text-sm font-medium transition-colors border-s border-gray-300 ${
                      clinicForm.doctorGender === 'F'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t('onboarding.clinic.genderMs')}
                  </button>
                </div>
                <input
                  id="doctorName"
                  type="text"
                  value={clinicForm.doctorName}
                  onChange={(e) => setClinicForm({ ...clinicForm, doctorName: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.phone')}
              </label>
              <input
                id="phone"
                type="tel"
                value={clinicForm.phone}
                onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.address')}
              </label>
              <input
                id="address"
                type="text"
                value={clinicForm.address}
                onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingClinic}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {savingClinic ? t('settings.saving') : t('settings.saveSettings')}
            </button>
            {clinicMessage && (
              <p className={`text-sm ${clinicMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {clinicMessage.text}
              </p>
            )}
          </div>
        </form>

        {/* Queue Settings */}
        <form onSubmit={handleSaveQueue} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.queueSettings')}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="avgConsultation" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.avgConsultation')}
              </label>
              <input
                id="avgConsultation"
                type="number"
                min={1}
                max={120}
                value={queueForm.avgConsultationMins}
                onChange={(e) => setQueueForm({ ...queueForm, avgConsultationMins: parseInt(e.target.value) || 15 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="notifyAt" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.notifyAt')}
              </label>
              <input
                id="notifyAt"
                type="number"
                min={1}
                max={10}
                value={queueForm.notifyAtPosition}
                onChange={(e) => setQueueForm({ ...queueForm, notifyAtPosition: parseInt(e.target.value) || 2 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingQueue}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {savingQueue ? t('settings.saving') : t('settings.saveSettings')}
            </button>
            {queueMessage && (
              <p className={`text-sm ${queueMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {queueMessage.text}
              </p>
            )}
          </div>
        </form>

        {/* Patient Experience */}
        <form onSubmit={handleSaveExperience} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('funFacts.sectionTitle')}</h2>

          {/* Fun Facts Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('funFacts.enableToggle')}</p>
              <p className="text-xs text-gray-500">{t('funFacts.enableDescription')}</p>
            </div>
            <button
              type="button"
              onClick={() => setFunFactsEnabled(!funFactsEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors ${funFactsEnabled ? 'bg-primary-600' : 'bg-gray-300'}`}
              role="switch"
              aria-checked={funFactsEnabled}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${funFactsEnabled ? 'ltr:translate-x-[22px] rtl:-translate-x-[22px]' : 'ltr:translate-x-0.5 rtl:-translate-x-0.5'}`} />
            </button>
          </div>

          {/* Specialty Selector */}
          {funFactsEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('funFacts.specialtyLabel')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SUPPORTED_SPECIALTIES.map((spec) => {
                  const isSelected = specialty === spec.key;
                  const label = i18n.language === 'ar' ? spec.labelAr : spec.labelFr;
                  return (
                    <button
                      key={spec.key}
                      type="button"
                      onClick={() => setSpecialty(spec.key)}
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

              {/* Preview */}
              {specialty && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">{t('funFacts.preview')}</p>
                  <FunFactCard specialty={specialty} refreshInterval={99999999} />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingExperience}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {savingExperience ? t('settings.saving') : t('settings.saveSettings')}
            </button>
            {experienceMessage && (
              <p className={`text-sm ${experienceMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {experienceMessage.text}
              </p>
            )}
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.changePassword')}</h2>

          <div className="space-y-4 max-w-md">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.currentPassword')}
              </label>
              <input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.newPassword')}
              </label>
              <input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                {t('settings.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingPassword}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {savingPassword ? t('settings.saving') : t('settings.changePassword')}
            </button>
            {passwordMessage && (
              <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {passwordMessage.text}
              </p>
            )}
          </div>
        </form>

        {/* Manage Doctors */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.doctors')}</h2>

          {/* Doctor list */}
          {doctors.length === 0 ? (
            <p className="text-sm text-gray-500">{t('settings.noDoctors')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {doctors.map(doctor => (
                <li key={doctor.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{doctor.name}</p>
                    {doctor.specialty && (
                      <p className="text-sm text-gray-500">{doctor.specialty}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteDoctor(doctor.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title={t('common.delete')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add doctor */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('settings.doctorNameLabel')}
              value={newDoctorName}
              onChange={(e) => setNewDoctorName(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <input
              type="text"
              placeholder={t('settings.specialty')}
              value={newDoctorSpecialty}
              onChange={(e) => setNewDoctorSpecialty(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={handleAddDoctor}
              disabled={addingDoctor || !newDoctorName.trim()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {t('settings.addDoctor')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
