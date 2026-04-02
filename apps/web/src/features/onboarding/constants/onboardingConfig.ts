export const STEPS = ['splash', 'welcome', 'signup', 'qr-reveal'] as const;
export type StepName = (typeof STEPS)[number];

/** Progress bar shows steps 1–3 (splash doesn't count) */
export const VISIBLE_STEPS = STEPS.length - 1; // 3

export const LAYOUT = {
  ILLUSTRATION_HEIGHT: '58vh',
  CARD_RADIUS: '28px',
  BUTTON_RADIUS: '14px',
  PROGRESS_HEIGHT: '3px',
  SCREEN_PADDING: '24px',
  CARD_PADDING: '28px 24px 40px',
} as const;

export const SCREEN_COPY = {
  welcome: {
    headline: 'Votre salle d\'attente, enfin sous contrôle.',
    subtitle:
      'Sans carte bancaire. Sans engagement. Prêt en 2 minutes.',
    cta: 'Créer ma file gratuite',
  },
  signup: {
    headline: 'Dans 60 secondes, votre file d\'attente est prête.',
    subtitle: 'Choisissez comment vous connecter.',
    cta: 'Créer mon compte',
    emailPlaceholder: 'Email professionnel',
    passwordPlaceholder: 'Mot de passe',
    clinicPlaceholder: 'Ex. Clinique Dr. Hafsia',
    clinicLabel: 'Nom de votre cabinet',
    loginLink: 'Déjà inscrit ? Se connecter',
    trust: 'Sans carte bancaire · Essai 30 jours · Annulable à tout moment',
    loading: 'Création en cours…',
  },
  qrReveal: {
    eyebrow: 'VOTRE CABINET EST PRÊT !',
    headline: 'Votre QR code,',
    headlineAccent: 'prêt à l\'emploi.',
    subtitle:
      'Affichez ce QR code en salle d\'attente. Vos patients scannent et rejoignent la file instantanément — sans télécharger d\'application.',
    subtitleMobile:
      'Affichez-le en salle d\'attente. Vos patients s\'inscrivent en 10 secondes.',
    successBadge: 'Inscrit ! Votre file est prête.',
    successHelper: 'Imprimez-le, affichez-le, ou partagez-le par WhatsApp.',
    whatsapp: 'Envoyer par WhatsApp',
    download: 'Télécharger le PDF',
    dashboard: 'Accéder à mon tableau de bord',
    dashboardMobile: 'Commencer',
    stats: [
      { value: '0 min', label: 'Configuration' },
      { value: '∞', label: 'Patients / jour' },
      { value: '30 j', label: 'Essai gratuit' },
    ],
  },
} as const;

export const ILLUSTRATION_PATHS = {
  welcome: '/images/onboarding/welcome2.png',
  signup: '/images/onboarding/signup2.png',
  'qr-reveal': '/images/onboarding/qr-reveal2.png',
} as const;
