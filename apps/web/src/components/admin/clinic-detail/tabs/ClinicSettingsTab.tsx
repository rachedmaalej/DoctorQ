import { useState } from 'react';
import { api } from '../../../../lib/api';
import { webBrand } from '../../../../lib/brand';
import type { ClinicDetail, ClinicEditableFields } from '../../../../types';

interface ClinicSettingsTabProps {
  detail: ClinicDetail;
  onRefresh: () => void;
  onResetPassword: () => void;
}

export default function ClinicSettingsTab({ detail, onRefresh, onResetPassword }: ClinicSettingsTabProps) {
  const { clinic } = detail;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicEditableFields>({
    name: clinic.name,
    doctorName: clinic.doctorName || '',
    email: clinic.email,
    phone: clinic.phone || '',
    language: clinic.language,
    businessType: clinic.businessType,
    address: clinic.address || '',
    notifyAtPosition: clinic.notifyAtPosition,
  });

  const handleEdit = () => {
    setForm({
      name: clinic.name,
      doctorName: clinic.doctorName || '',
      email: clinic.email,
      phone: clinic.phone || '',
      language: clinic.language,
      businessType: clinic.businessType,
      address: clinic.address || '',
      notifyAtPosition: clinic.notifyAtPosition,
    });
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateAdminClinicInfo(clinic.id, form);
      setEditing(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-[#D0E8E5] rounded-lg focus:ring-2 focus:ring-[#267B75] focus:border-transparent text-[#132E2C]';

  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider">Clinic Settings</h3>
          {!editing ? (
            <button
              onClick={handleEdit}
              className="text-sm px-3 py-1.5 rounded font-medium bg-[#267B75] text-white hover:bg-[#1F6560] transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="text-sm px-3 py-1.5 rounded font-medium border border-[#D0E8E5] text-[#4E7572] hover:bg-[#F3FAF9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm px-3 py-1.5 rounded font-medium bg-[#267B75] text-white hover:bg-[#1F6560] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 border border-[#E15720] text-[#E15720] text-sm rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <SettingsField label="Clinic Name" editing={editing}>
            {editing ? (
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            ) : (
              <p className="text-sm text-[#132E2C] font-medium">{clinic.name}</p>
            )}
          </SettingsField>

          <SettingsField label="Doctor Name" editing={editing}>
            {editing ? (
              <input type="text" value={form.doctorName} onChange={(e) => setForm({ ...form, doctorName: e.target.value })} className={inputClass} />
            ) : (
              <p className="text-sm text-[#132E2C] font-medium">{clinic.doctorName || '—'}</p>
            )}
          </SettingsField>

          <SettingsField label="Email" editing={editing}>
            {editing ? (
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            ) : (
              <p className="text-sm text-[#132E2C] font-medium">{clinic.email}</p>
            )}
          </SettingsField>

          <SettingsField label="Phone" editing={editing}>
            {editing ? (
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder={webBrand.phone.placeholder} />
            ) : (
              <p className="text-sm text-[#132E2C] font-medium">{clinic.phone || '—'}</p>
            )}
          </SettingsField>

          <SettingsField label="Language" editing={editing}>
            {editing ? (
              <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="fr">Francais</option>
                {webBrand.supportedLanguages.includes('ar') && (
                  <option value="ar">العربية</option>
                )}
              </select>
            ) : (
              <p className="text-sm text-[#132E2C] font-medium">{clinic.language === 'ar' ? 'Arabic' : 'French'}</p>
            )}
          </SettingsField>

          <SettingsField label="Spécialité" editing={editing}>
            {editing ? (
              <select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} className={`${inputClass} bg-white`}>
                <option value="general">Médecine Générale</option>
                <option value="gynecology">Gynécologie-Obstétrique</option>
                <option value="pediatrics">Pédiatrie</option>
                <option value="ophthalmology">Ophtalmologie</option>
                <option value="cardiology">Cardiologie</option>
                <option value="dermatology">Dermatologie</option>
                <option value="orthopedics">Orthopédie et Traumatologie</option>
                <option value="radiology">Radiologie</option>
                <option value="gastroenterology">Gastro-Entérologie</option>
                <option value="other">Autres</option>
              </select>
            ) : (
              <p className="text-sm text-[#132E2C] font-medium">{specialtyLabel(clinic.businessType)}</p>
            )}
          </SettingsField>

          <SettingsField label="Notify at Position" editing={editing}>
            {editing ? (
              <input type="number" value={form.notifyAtPosition} onChange={(e) => setForm({ ...form, notifyAtPosition: Number(e.target.value) })} min={1} max={10} className={inputClass} />
            ) : (
              <p className="text-sm text-[#132E2C] font-medium">#{clinic.notifyAtPosition}</p>
            )}
          </SettingsField>

          <div className="col-span-2">
            <SettingsField label="Address" editing={editing}>
              {editing ? (
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
              ) : (
                <p className="text-sm text-[#132E2C] font-medium">{clinic.address || '—'}</p>
              )}
            </SettingsField>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="border-t border-[#E6F2F0] pt-8">
        <h3 className="text-[13px] font-bold text-[#132E2C] uppercase tracking-wider mb-4">Security</h3>
        <button
          onClick={onResetPassword}
          className="text-sm px-3 py-1.5 rounded font-medium border border-[#D0E8E5] text-[#4E7572] hover:bg-[#F3FAF9] transition-colors"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}

function SettingsField({ label, editing, children }: { label: string; editing: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={`block text-xs uppercase mb-1 ${editing ? 'font-medium text-[#4E7572]' : 'text-[#8AADAA]'}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

const SPECIALTY_LABELS: Record<string, string> = {
  general: 'Médecine Générale',
  gynecology: 'Gynécologie-Obstétrique',
  pediatrics: 'Pédiatrie',
  ophthalmology: 'Ophtalmologie',
  cardiology: 'Cardiologie',
  dermatology: 'Dermatologie',
  orthopedics: 'Orthopédie et Traumatologie',
  radiology: 'Radiologie',
  gastroenterology: 'Gastro-Entérologie',
  other: 'Autres',
  // legacy values for backward compatibility
  ent: 'ORL',
  dental: 'Dentaire',
  medical: 'Medical',
  retail: 'Retail',
};

function specialtyLabel(value: string): string {
  return SPECIALTY_LABELS[value] || value;
}
