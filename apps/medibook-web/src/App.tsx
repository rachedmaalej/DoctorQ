import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import Layout from './components/layout/Layout';
import CalendarPage from './pages/CalendarPage';
import PatientsPage from './pages/PatientsPage';

function App() {
  const { i18n } = useTranslation();

  // Set document direction based on language
  useEffect(() => {
    const isRTL = i18n.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/settings" element={<SettingsPlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

// Placeholder for settings page
function SettingsPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">
          settings
        </span>
        <h2 className="text-xl font-semibold text-gray-600">Settings</h2>
        <p className="text-gray-400 mt-2">Coming soon</p>
      </div>
    </div>
  );
}

export default App;
