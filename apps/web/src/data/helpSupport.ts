import type { FaqItem, FaqClusterMeta, TutorialItem, BadgeConfig } from
  '../components/layout/drawers/HelpSupportDrawer.types';

/* ══════════════════════════════════════════════════════════════
   FAQ CLUSTERS — visual separators in the FAQ list
   To add a new cluster: append an entry here AND use its id
   in the FAQ_ITEMS below.
   ══════════════════════════════════════════════════════════════ */

export const FAQ_CLUSTERS: FaqClusterMeta[] = [
  {
    id: 'mise-en-route',
    icon: 'rocket_launch',
    label: { fr: 'Mise en route', ar: 'البدء' },
  },
  {
    id: 'gestion-file',
    icon: 'format_list_numbered',
    label: { fr: 'Gestion de la file', ar: 'إدارة قائمة الانتظار' },
  },
  {
    id: 'qr-code',
    icon: 'qr_code_2',
    label: { fr: 'QR code & inscription', ar: 'رمز QR والتسجيل' },
  },
  {
    id: 'whatsapp-notifications',
    icon: 'chat',
    label: { fr: 'WhatsApp & notifications', ar: 'واتساب والإشعارات' },
  },
  {
    id: 'abonnement-compte',
    icon: 'payments',
    label: { fr: 'Abonnement & compte', ar: 'الاشتراك والحساب' },
  },
];

/* ══════════════════════════════════════════════════════════════
   FAQ ITEMS — 18 bilingual Q&A pairs
   To add a new question: append an object with { id, cluster,
   question: { fr, ar }, answer: { fr, ar } }.
   It will appear automatically in the correct cluster.
   ══════════════════════════════════════════════════════════════ */

export const FAQ_ITEMS: FaqItem[] = [
  // ── Cluster: mise-en-route ──────────────────────────────────
  {
    id: 'faq-demarrage-01',
    cluster: 'mise-en-route',
    question: {
      fr: 'Comment configurer mon cabinet pour la première fois ?',
      ar: 'كيف أقوم بإعداد عيادتي لأول مرة؟',
    },
    answer: {
      fr: 'Lors de votre première connexion, BleSaf vous guide en 3 étapes : (1) renseignez le nom du cabinet et le médecin, (2) définissez la durée moyenne d\'une consultation (ex. 15 min), (3) générez et affichez votre QR code en salle d\'attente. La durée de consultation est importante — elle sert à calculer le temps d\'attente estimé affiché aux patients.',
      ar: 'عند تسجيل الدخول لأول مرة، سيرشدك BleSaf خلال 3 خطوات: (1) أدخل اسم العيادة واسم الطبيب، (2) حدد متوسط مدة الاستشارة (مثلاً 15 دقيقة)، (3) أنشئ رمز QR وعرضه في غرفة الانتظار. مدة الاستشارة مهمة — تُستخدم لحساب وقت الانتظار التقديري الذي يراه المرضى.',
    },
  },
  {
    id: 'faq-demarrage-02',
    cluster: 'mise-en-route',
    question: {
      fr: 'Comment définir la durée moyenne de consultation ?',
      ar: 'كيف أحدد متوسط مدة الاستشارة؟',
    },
    answer: {
      fr: 'Allez dans Paramètres → Durée moyenne de consultation. Saisissez la durée habituelle en minutes. Cette valeur est utilisée pour estimer l\'heure d\'appel affichée sur la page de suivi du patient. Vous pouvez l\'ajuster à tout moment si votre rythme change.',
      ar: 'انتقل إلى الإعدادات ← متوسط مدة الاستشارة. أدخل المدة المعتادة بالدقائق. تُستخدم هذه القيمة لتقدير وقت الاستدعاء المعروض في صفحة متابعة المريض. يمكنك تعديلها في أي وقت إذا تغيّر إيقاع عملك.',
    },
  },
  {
    id: 'faq-demarrage-03',
    cluster: 'mise-en-route',
    question: {
      fr: 'À quel moment un patient reçoit-il une notification WhatsApp ?',
      ar: 'متى يتلقى المريض إشعار واتساب؟',
    },
    answer: {
      fr: 'BleSaf envoie automatiquement 2 notifications : (1) lorsque le patient arrive à la position configurée dans vos paramètres (ex. "notifier à 2 patients du tour"), (2) lorsque le médecin clique sur Appeler suivant — c\'est le message "C\'est votre tour !". Le patient reçoit un lien vers sa page de suivi en temps réel.',
      ar: 'يرسل BleSaf تلقائياً إشعارَين: (1) عندما يصل المريض إلى الموضع المحدد في إعداداتك (مثلاً "الإشعار عند 2 مرضى قبل دوره")، (2) عندما ينقر الطبيب على "استدعاء التالي" — وهو رسالة "حان دورك!". يتلقى المريض رابطاً لصفحة متابعته في الوقت الفعلي.',
    },
  },

  // ── Cluster: gestion-file ───────────────────────────────────
  {
    id: 'faq-file-01',
    cluster: 'gestion-file',
    question: {
      fr: 'Comment ajouter un patient sans smartphone ?',
      ar: 'كيف أضيف مريضاً لا يملك هاتفاً ذكياً؟',
    },
    answer: {
      fr: 'Cliquez sur + Ajouter un patient depuis le tableau de bord. Saisissez le nom et/ou le numéro WhatsApp. Pour les patients sans téléphone du tout, vous pouvez les ajouter sans numéro — ils n\'auront pas de notification mais seront visibles dans votre file et pourront suivre leur position sur l\'écran d\'accueil du cabinet.',
      ar: 'انقر على + إضافة مريض من لوحة التحكم. أدخل الاسم و/أو رقم واتساب. بالنسبة للمرضى الذين لا يملكون هاتفاً على الإطلاق، يمكنك إضافتهم بدون رقم — لن يتلقوا إشعاراً لكنهم سيظهرون في قائمة الانتظار ويمكنهم متابعة موضعهم على شاشة الاستقبال في العيادة.',
    },
  },
  {
    id: 'faq-file-02',
    cluster: 'gestion-file',
    question: {
      fr: 'Comment changer l\'ordre des patients dans la file ?',
      ar: 'كيف أغيّر ترتيب المرضى في قائمة الانتظار؟',
    },
    answer: {
      fr: 'Maintenez et glissez une fiche patient vers le haut ou le bas pour la repositionner. La numérotation se met à jour instantanément pour tous les patients, qui voient leur position se modifier en temps réel sur leur page de suivi.',
      ar: 'اضغط مع الاستمرار على بطاقة مريض واسحبها للأعلى أو الأسفل لإعادة ترتيبها. تتحدث الأرقام فوراً لجميع المرضى، الذين يرون موضعهم يتغير في الوقت الفعلي على صفحة متابعتهم.',
    },
  },
  {
    id: 'faq-file-03',
    cluster: 'gestion-file',
    question: {
      fr: 'Comment gérer un patient absent (no-show) ?',
      ar: 'كيف أتعامل مع مريض غائب (لم يحضر)؟',
    },
    answer: {
      fr: 'Sur la fiche du patient, appuyez sur le menu ⋯ et sélectionnez Retirer de la file. Le patient est retiré et la file se réorganise automatiquement.',
      ar: 'على بطاقة المريض، اضغط على قائمة ⋯ واختر "إزالة من القائمة". تتم إزالة المريض وتعيد القائمة تنظيم نفسها تلقائياً.',
    },
  },
  {
    id: 'faq-file-04',
    cluster: 'gestion-file',
    question: {
      fr: 'Comment passer un patient en urgence en tête de file ?',
      ar: 'كيف أضع مريضاً في حالة طارئة في مقدمة القائمة؟',
    },
    answer: {
      fr: 'Sur la fiche du patient, appuyez sur le menu ⋯ et sélectionnez Urgence. Le patient passe instantanément en position #1, sans perturber la logique de la file pour les autres.',
      ar: 'على بطاقة المريض، اضغط على قائمة ⋯ واختر "طارئ". ينتقل المريض فوراً إلى الموضع الأول دون الإخلال بمنطق القائمة للمرضى الآخرين.',
    },
  },
  {
    id: 'faq-file-05',
    cluster: 'gestion-file',
    question: {
      fr: 'Comment vider la file en fin de journée ?',
      ar: 'كيف أفرّغ قائمة الانتظار في نهاية اليوم؟',
    },
    answer: {
      fr: 'En bas du tableau de bord, appuyez sur Effacer la file. Une confirmation vous est demandée. Les patients déjà marqués "Terminé" restent dans le bilan statistique du jour — seuls les patients encore en attente sont retirés.',
      ar: 'في أسفل لوحة التحكم، اضغط على "مسح القائمة". سيُطلب منك تأكيد ذلك. المرضى الذين تم تحديدهم بـ"منتهي" يبقون في ملخص إحصاءات اليوم — يُزال فقط المرضى الذين لا يزالون ينتظرون.',
    },
  },

  // ── Cluster: qr-code ────────────────────────────────────────
  {
    id: 'faq-qr-01',
    cluster: 'qr-code',
    question: {
      fr: 'Le QR code ne fonctionne pas — que faire ?',
      ar: 'رمز QR لا يعمل — ماذا أفعل؟',
    },
    answer: {
      fr: 'Vérifiez d\'abord que le patient pointe bien l\'appareil photo sur le code (pas d\'application spéciale requise). Si le scan échoue, le lien d\'inscription peut être partagé directement depuis WhatsApp ou affiché sur un écran à l\'accueil. En dernier recours, ajoutez le patient manuellement depuis le tableau de bord.',
      ar: 'تحقق أولاً من أن المريض يوجّه كاميرا هاتفه نحو الرمز (لا حاجة لتطبيق خاص). إذا فشل المسح، يمكن مشاركة رابط التسجيل مباشرةً عبر واتساب أو عرضه على شاشة الاستقبال. كحل أخير، أضف المريض يدوياً من لوحة التحكم.',
    },
  },
  {
    id: 'faq-qr-02',
    cluster: 'qr-code',
    question: {
      fr: 'Comment imprimer et afficher le QR code dans la salle d\'attente ?',
      ar: 'كيف أطبع رمز QR وأعرضه في غرفة الانتظار؟',
    },
    answer: {
      fr: 'Depuis le tableau de bord, cliquez sur l\'icône QR → Télécharger l\'affiche. Vous obtenez un PDF prêt à imprimer en A5 ou A4, avec les instructions en français et en arabe. Affichez-le à l\'entrée, au comptoir et en salle d\'attente pour maximiser les auto-inscriptions.',
      ar: 'من لوحة التحكم، انقر على أيقونة QR ← تحميل الملصق. ستحصل على ملف PDF جاهز للطباعة بحجم A5 أو A4، مع التعليمات بالفرنسية والعربية. علّقه عند المدخل وعلى المنضدة وفي غرفة الانتظار لتحقيق أقصى قدر من التسجيلات التلقائية.',
    },
  },
  {
    id: 'faq-qr-03',
    cluster: 'qr-code',
    question: {
      fr: 'Les patients doivent-ils télécharger une application ?',
      ar: 'هل يحتاج المرضى إلى تنزيل تطبيق؟',
    },
    answer: {
      fr: 'Non. BleSaf fonctionne entièrement via le navigateur — aucune installation requise. Le patient scanne le QR, remplit un formulaire en 15 secondes, et reçoit un message WhatsApp avec son lien de suivi personnel. Tout fonctionne sur iPhone et Android.',
      ar: 'لا. يعمل BleSaf بالكامل عبر المتصفح — لا يلزم تثبيت أي شيء. يمسح المريض رمز QR، ويملأ نموذجاً في 15 ثانية، ويتلقى رسالة واتساب تحتوي على رابط متابعته الشخصي. يعمل على iPhone وAndroid.',
    },
  },
  {
    id: 'faq-qr-04',
    cluster: 'qr-code',
    question: {
      fr: 'Un patient peut-il rejoindre la file à distance avant d\'arriver ?',
      ar: 'هل يمكن للمريض الانضمام إلى القائمة عن بُعد قبل وصوله؟',
    },
    answer: {
      fr: 'Pas encore dans la version actuelle — le QR code est conçu pour être scanné sur place. Pour les patients avec rendez-vous, vous pouvez les ajouter manuellement à l\'heure prévue depuis le tableau de bord.',
      ar: 'ليس بعد في الإصدار الحالي — رمز QR مصمم للمسح في المكان. بالنسبة للمرضى الذين لديهم مواعيد، يمكنك إضافتهم يدوياً في الوقت المحدد من لوحة التحكم.',
    },
  },

  // ── Cluster: whatsapp-notifications ─────────────────────────
  {
    id: 'faq-whatsapp-01',
    cluster: 'whatsapp-notifications',
    question: {
      fr: 'Le message WhatsApp n\'a pas été reçu par le patient — que faire ?',
      ar: 'لم يستلم المريض رسالة واتساب — ماذا أفعل؟',
    },
    answer: {
      fr: 'Vérifiez d\'abord que le numéro saisi est correct et que le patient a bien WhatsApp installé et actif sur ce numéro. Si le problème persiste, le patient peut suivre sa position directement via le lien affiché sur l\'écran d\'accueil du cabinet, ou via le lien que vous lui communiquez en copiant l\'URL depuis le menu ⋯ de sa fiche. Contactez le support si le problème se répète.',
      ar: 'تحقق أولاً من صحة الرقم المُدخَل وأن المريض لديه واتساب مثبتاً وفعالاً على هذا الرقم. إذا استمرت المشكلة، يمكن للمريض متابعة موضعه مباشرةً عبر الرابط المعروض على شاشة الاستقبال، أو عبر الرابط الذي تشاركه معه بنسخ الرابط من قائمة ⋯ في بطاقته. تواصل مع الدعم إذا تكررت المشكلة.',
    },
  },
  {
    id: 'faq-whatsapp-02',
    cluster: 'whatsapp-notifications',
    question: {
      fr: 'Le patient peut-il suivre sa position sans WhatsApp ?',
      ar: 'هل يمكن للمريض متابعة موضعه بدون واتساب؟',
    },
    answer: {
      fr: 'Oui. Chaque patient inscrit reçoit un lien unique vers sa page de suivi en temps réel. Ce lien peut être partagé manuellement (affiché à l\'écran, copié depuis le menu ⋯) — il ne nécessite pas WhatsApp. Le patient y voit sa position, le nombre de personnes devant lui et le temps d\'attente estimé.',
      ar: 'نعم. يحصل كل مريض مسجل على رابط فريد لصفحة متابعته في الوقت الفعلي. يمكن مشاركة هذا الرابط يدوياً (عرضه على الشاشة، نسخه من قائمة ⋯) — لا يحتاج إلى واتساب. يرى المريض من خلاله موضعه وعدد الأشخاص أمامه ووقت الانتظار التقديري.',
    },
  },
  {
    id: 'faq-whatsapp-03',
    cluster: 'whatsapp-notifications',
    question: {
      fr: 'Comment configurer à quel moment le patient est notifié ?',
      ar: 'كيف أضبط توقيت إشعار المريض؟',
    },
    answer: {
      fr: 'Dans Paramètres → Position de notification, définissez le nombre de patients restants avant l\'appel à partir duquel la notification "Votre tour approche" est envoyée. Exemple : avec une valeur de 2, le patient est alerté quand il est 2ème dans la file. Adaptez selon la rapidité de vos consultations.',
      ar: 'في الإعدادات ← موضع الإشعار، حدد عدد المرضى المتبقين قبل الاستدعاء الذي يُرسل منه إشعار "يقترب دورك". مثال: بقيمة 2، يُنبَّه المريض عندما يكون ثانياً في القائمة. اضبط ذلك وفقاً لسرعة استشاراتك.',
    },
  },

  // ── Cluster: abonnement-compte ──────────────────────────────
  {
    id: 'faq-abonnement-01',
    cluster: 'abonnement-compte',
    question: {
      fr: 'Comment fonctionne la période d\'essai gratuite ?',
      ar: 'كيف تعمل فترة التجربة المجانية؟',
    },
    answer: {
      fr: 'Votre essai de 30 jours commence à l\'inscription et inclut l\'accès complet à toutes les fonctionnalités. Aucune carte bancaire n\'est requise pour démarrer. À l\'expiration, l\'accès au tableau de bord est suspendu jusqu\'à souscription d\'un abonnement.',
      ar: 'تبدأ فترة تجربتك البالغة 30 يوماً عند التسجيل وتشمل الوصول الكامل إلى جميع الميزات. لا يلزم بطاقة بنكية للبدء. عند انتهاء المدة، يُوقَف الوصول إلى لوحة التحكم حتى الاشتراك في خطة مدفوعة.',
    },
  },
  {
    id: 'faq-abonnement-02',
    cluster: 'abonnement-compte',
    question: {
      fr: 'Quelle est la différence entre l\'abonnement mensuel et annuel ?',
      ar: 'ما الفرق بين الاشتراك الشهري والسنوي؟',
    },
    answer: {
      fr: 'L\'abonnement mensuel est à 50 TND/mois. L\'abonnement annuel est à 500 TND/an — soit 2 mois offerts (économie de 16%). Les deux formules donnent accès aux mêmes fonctionnalités.',
      ar: 'الاشتراك الشهري بـ50 دينار تونسي/شهر. الاشتراك السنوي بـ500 دينار تونسي/سنة — أي شهرَين مجاناً (توفير 16%). كلا الخطتين توفران الوصول إلى نفس الميزات.',
    },
  },
  {
    id: 'faq-abonnement-03',
    cluster: 'abonnement-compte',
    question: {
      fr: 'Comment changer la langue de l\'interface (français / arabe) ?',
      ar: 'كيف أغيّر لغة الواجهة (فرنسي / عربي)؟',
    },
    answer: {
      fr: 'Le bouton de langue (عربي / FR) est accessible en haut à droite de chaque écran. Le changement est instantané et bascule l\'interface en arabe avec mise en page droite-à-gauche (RTL). Les notifications envoyées aux patients suivent la langue configurée dans vos paramètres.',
      ar: 'زر اللغة (عربي / FR) متاح في أعلى يمين كل شاشة. يكون التغيير فورياً ويحوّل الواجهة إلى العربية مع تخطيط من اليمين إلى اليسار (RTL). تتبع الإشعارات المرسلة للمرضى اللغة المحددة في إعداداتك.',
    },
  },
];

/* ══════════════════════════════════════════════════════════════
   TUTORIAL ITEMS & BADGE CONFIG (unchanged)
   ══════════════════════════════════════════════════════════════ */

export const TUTORIAL_ITEMS: TutorialItem[] = [
  {
    id: 'configure-cabinet',
    icon: 'settings_suggest',
    iconBg: '#E8F5F1',
    iconColor: '#0F7B6C',
    title: { fr: 'Configurer votre cabinet', ar: 'اعداد عيادتك' },
    duration: { fr: '1:20 min', ar: '1:20 دقيقة' },
    badge: 'DEMARRAGE',
  },
  {
    id: 'add-patient',
    icon: 'play_arrow',
    iconBg: '#FFF4ED',
    iconColor: '#EA580C',
    title: { fr: 'Ajouter votre premier patient', ar: 'اضافة اول مريض' },
    duration: { fr: '0:58 min', ar: '0:58 دقيقة' },
    badge: 'DEMARRAGE',
  },
  {
    id: 'share-qr-code',
    icon: 'qr_code_2',
    iconBg: '#E8F5F1',
    iconColor: '#0F7B6C',
    title: { fr: 'Partager le QR code', ar: 'مشاركة رمز QR' },
    duration: { fr: '1:05 min', ar: '1:05 دقيقة' },
    badge: 'QUOTIDIEN',
  },
  {
    id: 'manage-emergencies',
    icon: 'emergency',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    title: { fr: 'Gérer les urgences & priorités', ar: 'ادارة الحالات الطارئة والاولويات' },
    duration: { fr: '1:40 min', ar: '1:40 دقيقة' },
    badge: 'AVANCE',
  },
];

export const BADGE_CONFIG: Record<string, BadgeConfig> = {
  DEMARRAGE: { bg: '#EDF7F0', color: '#2D8B4E', label: { fr: 'Démarrage', ar: 'بداية' } },
  QUOTIDIEN: { bg: '#EDF3FC', color: '#3B7DD9', label: { fr: 'Quotidien', ar: 'يومي' } },
  AVANCE:    { bg: '#FEF7E6', color: '#D4920B', label: { fr: 'Avancé',    ar: 'متقدم' } },
};
