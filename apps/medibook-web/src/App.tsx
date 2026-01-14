import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

// Pages (to be implemented)
// import CalendarPage from '@/pages/CalendarPage';
// import DayViewPage from '@/pages/DayViewPage';
// import PatientsPage from '@/pages/PatientsPage';
// import SettingsPage from '@/pages/SettingsPage';
// import LoginPage from '@/pages/LoginPage';

function App() {
  const { i18n } = useTranslation();

  // Set document direction based on language
  useEffect(() => {
    const isRTL = i18n.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Placeholder until pages are implemented */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-4">MediBook</h1>
          <p className="text-xl text-gray-600 mb-8">
            Appointment Management System
          </p>
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
            <span className="material-symbols-outlined text-6xl text-primary-500 mb-4 block">
              calendar_month
            </span>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Coming Soon
            </h2>
            <p className="text-gray-500">
              Calendar, patient management, and DoctorQ integration under development.
            </p>
          </div>
        </div>
      </div>

      {/* Routes to be implemented
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<CalendarPage />} />
        <Route path="/day/:date" element={<DayViewPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      */}
    </div>
  );
}

export default App;
