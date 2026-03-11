export const STEPS = ['splash', 'welcome', 'specialty', 'signup', 'qr-reveal'] as const;
export type StepName = (typeof STEPS)[number];

/** Progress bar shows steps 1–4 (splash doesn't count) */
export const VISIBLE_STEPS = STEPS.length - 1; // 4

export const LAYOUT = {
  ILLUSTRATION_HEIGHT: '58vh',
  CARD_RADIUS: '28px',
  BUTTON_RADIUS: '14px',
  PROGRESS_HEIGHT: '3px',
  SCREEN_PADDING: '24px',
  CARD_PADDING: '28px 24px 40px',
} as const;

export const SPECIALTIES = [
  { id: 'pediatrie', label: 'Pédiatrie' },
  { id: 'ophthalmologie', label: 'Ophtalmologie' },
  { id: 'orl', label: 'ORL' },
  { id: 'medecine-generale', label: 'Médecine générale' },
  { id: 'gynecologie', label: 'Gynécologie' },
  { id: 'dermatologie', label: 'Dermatologie' },
  { id: 'cardiologie', label: 'Cardiologie' },
  { id: 'dentisterie', label: 'Dentisterie' },
  { id: 'pneumologie-rhumatologie', label: 'Pneumologie / Rhumatologie' },
  { id: 'autres', label: 'Autres' },
] as const;

export type SpecialtyId = (typeof SPECIALTIES)[number]['id'];

export const SCREEN_COPY = {
  welcome: {
    headline: 'Votre cabinet numérique en 2 minutes.',
    subtitle:
      'Aucune carte bancaire. Aucun engagement. Juste votre file d\'attente — prête en quelques clics.',
    cta: 'Commencer',
  },
  specialty: {
    headline: 'Quel type de cabinet dirigez-vous ?',
    subtitle: 'Nous adaptons votre expérience à votre spécialité.',
    cta: 'Continuer',
  },
  signup: {
    headline: 'Créez votre compte.',
    subtitle: 'Votre cabinet sera prêt dans 60 secondes.',
    cta: 'Créer mon compte',
    emailPlaceholder: 'Email professionnel',
    passwordPlaceholder: 'Mot de passe',
    clinicPlaceholder: 'Ex. Clinique Dr. Hafsia',
    clinicLabel: 'Nom de votre cabinet',
    loginLink: 'Déjà inscrit ? Se connecter',
    trust: 'Aucune carte bancaire · 30 jours gratuits',
    loading: 'Création en cours…',
  },
  qrReveal: {
    headline: 'Votre QR Code est prêt !',
    subtitle:
      'Affichez-le en salle d\'attente. Vos patients s\'inscrivent en 10 secondes.',
    whatsapp: 'Envoyer par WhatsApp',
    download: 'Télécharger le PDF',
    dashboard: 'Commencer',
  },
} as const;

export const ILLUSTRATION_PATHS = {
  welcome: '/images/onboarding/welcome2.png',
  specialty: '/images/onboarding/specialty2.png',
  signup: '/images/onboarding/signup2.png',
  'qr-reveal': '/images/onboarding/qr-reveal2.png',
} as const;
