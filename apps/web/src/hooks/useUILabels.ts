import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import type { UILabels } from '@/types';

/**
 * Hook that provides UI labels based on business type.
 *
 * For medical clinics (default): Uses standard translation keys ("patient", "Docteur présent", etc.)
 * For retail/other: Uses custom labels from clinic.uiLabels ("client", "Magasin ouvert", etc.)
 *
 * This ensures backwards compatibility - existing clinics without uiLabels
 * continue to work exactly as before with the standard translations.
 */
export function useUILabels() {
  const { t } = useTranslation();
  const { clinic } = useAuthStore();

  // If clinic has custom uiLabels (retail, etc.), use them
  // Otherwise fall back to standard translation keys (medical default)
  const uiLabels: UILabels = clinic?.uiLabels || {
    customer: t('queue.patient', 'patient'),
    customers: t('queue.patients', 'patients'),
    presenceOn: t('queue.doctorPresent', 'Docteur présent'),
    presenceOff: t('queue.doctorNotPresent', 'Docteur absent'),
    addCustomer: t('queue.addPatient', 'Ajouter un patient'),
    noCustomers: t('queue.noPatients', 'Aucun patient dans la file'),
  };

  // Helper to check if this is a medical clinic (default behavior)
  const isMedical = !clinic?.businessType || clinic.businessType === 'medical';

  // Whether to show appointment time field in add form
  const showAppointments = clinic?.showAppointments !== false;

  return {
    labels: uiLabels,
    isMedical,
    showAppointments,
    // Convenience getters for common labels
    presenceLabel: clinic?.isDoctorPresent ? uiLabels.presenceOn : uiLabels.presenceOff,
  };
}
