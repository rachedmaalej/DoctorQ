import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { Patient, ApiResponse } from '../types';
import PatientModal from '../components/patients/PatientModal';
import PatientDetails from '../components/patients/PatientDetails';

export default function PatientsPage() {
  const { t } = useTranslation();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (searchTerm?: string) => {
    try {
      setLoading(true);
      const response = await api.getPatients(searchTerm) as ApiResponse<Patient[]>;
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchPatients(search || undefined);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handlePatientSaved = () => {
    setShowCreateModal(false);
    setShowDetailsModal(false);
    setSelectedPatient(null);
    fetchPatients(search || undefined);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('patient.search')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          onClick={() => {
            setSelectedPatient(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <span className="material-symbols-outlined">person_add</span>
          {t('patient.create')}
        </button>
      </div>

      {/* Patients list */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="material-symbols-outlined animate-spin text-primary-500 text-4xl">
              progress_activity
            </span>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <span className="material-symbols-outlined text-6xl mb-4">group_off</span>
            <p>{t('patient.noResults')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {patients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => handlePatientClick(patient)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 text-left transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold text-lg">
                  {patient.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    {patient.name}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      {patient.phone}
                    </span>
                    {patient.email && (
                      <span className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-sm">email</span>
                        {patient.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reminder preference */}
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {patient.reminderPreference === 'SMS' && (
                    <span className="material-symbols-outlined">sms</span>
                  )}
                  {patient.reminderPreference === 'WHATSAPP' && (
                    <span className="material-symbols-outlined">chat</span>
                  )}
                  {patient.reminderPreference === 'NONE' && (
                    <span className="material-symbols-outlined">notifications_off</span>
                  )}
                </div>

                {/* Chevron */}
                <span className="material-symbols-outlined text-gray-300">
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <PatientModal
          patient={selectedPatient}
          onClose={() => setShowCreateModal(false)}
          onSaved={handlePatientSaved}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPatient && (
        <PatientDetails
          patient={selectedPatient}
          onClose={() => setShowDetailsModal(false)}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowCreateModal(true);
          }}
          onDeleted={handlePatientSaved}
        />
      )}
    </div>
  );
}
