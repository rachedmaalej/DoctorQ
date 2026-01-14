import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { Patient } from '../../types';

interface PatientModalProps {
  patient?: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PatientModal({ patient, onClose, onSaved }: PatientModalProps) {
  const { t } = useTranslation();
  const isEdit = !!patient;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState(patient?.name || '');
  const [phone, setPhone] = useState(patient?.phone || '');
  const [email, setEmail] = useState(patient?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState(patient?.dateOfBirth?.split('T')[0] || '');
  const [gender, setGender] = useState(patient?.gender || '');
  const [notes, setNotes] = useState(patient?.notes || '');
  const [reminderPreference, setReminderPreference] = useState(
    patient?.reminderPreference || 'SMS'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !phone.trim()) {
      setError(t('common.required'));
      return;
    }

    setLoading(true);

    try {
      const data = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
        notes: notes.trim() || undefined,
        reminderPreference,
      };

      if (isEdit && patient) {
        await api.updatePatient(patient.id, data);
      } else {
        await api.createPatient(data);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? t('common.edit') + ' ' + t('patient.title') : t('patient.create')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)]">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient.name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('patient.name')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient.phone')} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+216 XX XXX XXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Date of Birth & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patient.dateOfBirth')}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('patient.gender')}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">-</option>
                <option value="MALE">{t('patient.gender_options.male')}</option>
                <option value="FEMALE">{t('patient.gender_options.female')}</option>
                <option value="OTHER">{t('patient.gender_options.other')}</option>
              </select>
            </div>
          </div>

          {/* Reminder Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient.reminder_preference.title')}
            </label>
            <div className="flex gap-4">
              {['SMS', 'WHATSAPP', 'NONE'].map((pref) => (
                <label key={pref} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reminderPreference"
                    value={pref}
                    checked={reminderPreference === pref}
                    onChange={(e) => setReminderPreference(e.target.value)}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t(`patient.reminder_preference.${pref.toLowerCase()}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('patient.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('patient.notes')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
