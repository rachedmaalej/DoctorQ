import type { DashboardData } from './types';

export const mockData: DashboardData = {
  clinicName: 'Cabinet Dr. Jebali',
  doctorLastName: 'Jebali',
  queueStatus: 'PRE_OPEN',

  preRegisteredPatients: [
    { id: '1', name: 'Fatma Khaldi', position: 1, registeredAt: '08:04', hasPhone: true },
    { id: '2', name: 'Mehdi Trabelsi', position: 2, registeredAt: '08:12', hasPhone: true },
    { id: '3', name: 'Amira Mansour', position: 3, registeredAt: '08:19', hasPhone: false },
  ],

  stats: {
    waitingCount: 8,
    seenCount: 14,
    estimatedEndTime: '~18:45',
  },

  closingStats: {
    remainingCount: 3,
    seenCount: 24,
    estimatedEndTime: '~19:10',
  },

  currentPatient: {
    name: 'Sami Ben Amor',
    arrivedAt: '16:30',
    consultingSinceMinutes: 8,
    phone: '+21655123456',
  },

  queue: [
    { id: 'q1', position: 1, name: 'Fatma Khaldi', waitMinutes: 12, hasPhone: true, phone: '+21655111222', badge: null },
    { id: 'q2', position: 2, name: 'Mehdi Trabelsi', waitMinutes: 18, hasPhone: true, phone: '+21655333444', badge: 'priority' },
    { id: 'q3', position: 3, name: 'Amira Mansour', waitMinutes: 32, hasPhone: false, phone: '', badge: 'no-phone' },
    { id: 'q4', position: 4, name: 'Karim Gharbi', waitMinutes: 41, hasPhone: true, phone: '+21655555666', badge: 'stepped-out' },
    { id: 'q5', position: 5, name: 'Nour Haddad', waitMinutes: 55, hasPhone: true, phone: '+21655777888', badge: null },
    { id: 'q6', position: 6, name: 'Youssef Chahed', waitMinutes: 58, hasPhone: false, phone: '', badge: 'no-phone' },
    { id: 'q7', position: 7, name: 'Leila Sassi', waitMinutes: 62, hasPhone: true, phone: '+21655999000', badge: null },
  ],

  nextPatientPreview: 'Fatma K.',

  dayOpenedAt: '08:32',
  totalAddedToday: 22,
  isDoctorPresent: true,

  daySummaryBrief: {
    totalPatients: 27,
    avgWaitMinutes: 14,
    avgConsultMinutes: 8,
  },

  summary: {
    date: 'Mardi 17 Février 2026',
    doctorFullName: 'Dr. Karim Jebali',
    specialty: "Cabinet d'Ophtalmologie",
    location: 'El Menzah',
    totalPatientsSeen: 27,
    avgWaitMinutes: 14,
    avgConsultMinutes: 8,
    firstPatientTime: '08:32',
    lastPatientTime: '19:05',
    sessions: [
      { label: 'morning', patientCount: 9, flexWeight: 3 },
      { label: 'afternoon', patientCount: 18, flexWeight: 4 },
    ],
    breakLabel: 'Pause 12h\u201314h',
  },
};

/** Mock data for the CLOSING screen (different current patient and queue) */
export const closingCurrentPatient: DashboardData['currentPatient'] = {
  name: 'Nour Haddad',
  arrivedAt: '16:45',
  consultingSinceMinutes: 5,
  phone: '+21655777888',
};

export const closingQueue: DashboardData['queue'] = [
  { id: 'cq1', position: 1, name: 'Youssef Chahed', waitMinutes: 78, hasPhone: true, phone: '+21655111000', badge: null },
  { id: 'cq2', position: 2, name: 'Leila Sassi', waitMinutes: 84, hasPhone: true, phone: '+21655999000', badge: null },
  { id: 'cq3', position: 3, name: 'Karim Gharbi', waitMinutes: 91, hasPhone: true, phone: '+21655555666', badge: null },
];

export const closingNextPreview = 'Youssef C.';
