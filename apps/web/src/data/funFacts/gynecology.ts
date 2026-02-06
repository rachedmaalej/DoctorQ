import type { SpecialtyFunFacts } from './types';

export const gynecology: SpecialtyFunFacts = {
  key: 'gynecology',
  labelFr: 'Gynécologie',
  labelAr: 'طب النساء',
  icon: 'female',
  categories: [
    { key: 'reproductive', icon: 'female', labelFr: 'Santé reproductive', labelAr: 'الصحة الإنجابية' },
    { key: 'pregnancy', icon: 'pregnant_woman', labelFr: 'Grossesse', labelAr: 'الحمل' },
    { key: 'wellness', icon: 'spa', labelFr: 'Bien-être féminin', labelAr: 'صحة المرأة' },
    { key: 'medical', icon: 'medical_information', labelFr: 'Gynécologie médicale', labelAr: 'طب النساء السريري' },
    { key: 'trivia', icon: 'lightbulb', labelFr: 'Anecdotes', labelAr: 'طرائف' },
  ],
  facts: [
    // Category 1: Reproductive System, Hormones, Menstrual Cycle (1-10)
    { id: 1, category: 'reproductive', emoji: '🌸', fr: "Le cycle menstruel dure en moyenne 28 jours, mais un cycle de 21 à 35 jours est tout à fait normal.", ar: "تستمر الدورة الشهرية 28 يوماً في المتوسط، لكن دورة من 21 إلى 35 يوماً طبيعية تماماً." },
    { id: 2, category: 'reproductive', emoji: '🔬', fr: "Une femme naît avec environ 1 à 2 millions d'ovocytes, mais n'en libérera qu'environ 400 au cours de sa vie.", ar: "تولد المرأة بحوالي 1 إلى 2 مليون بويضة، لكنها لن تطلق سوى حوالي 400 خلال حياتها." },
    { id: 3, category: 'reproductive', emoji: '🧬', fr: "L'ovule est la plus grande cellule du corps humain, visible à l'œil nu.", ar: "البويضة هي أكبر خلية في جسم الإنسان، ويمكن رؤيتها بالعين المجردة." },
    { id: 4, category: 'reproductive', emoji: '⏰', fr: "L'ovulation ne dure que 12 à 24 heures, mais les spermatozoïdes peuvent survivre jusqu'à 5 jours.", ar: "تستمر الإباضة من 12 إلى 24 ساعة فقط، لكن الحيوانات المنوية يمكنها البقاء حتى 5 أيام." },
    { id: 5, category: 'reproductive', emoji: '🌡️', fr: "La température corporelle augmente légèrement après l'ovulation en raison de la progestérone.", ar: "ترتفع درجة حرارة الجسم قليلاً بعد الإباضة بسبب هرمون البروجسترون." },
    { id: 6, category: 'reproductive', emoji: '💪', fr: "L'utérus est l'un des muscles les plus puissants du corps humain par rapport à son poids.", ar: "الرحم من أقوى العضلات في جسم الإنسان مقارنة بوزنه." },
    { id: 7, category: 'reproductive', emoji: '🔄', fr: "Les hormones œstrogène et progestérone régulent non seulement le cycle, mais aussi l'humeur et le sommeil.", ar: "هرمونا الإستروجين والبروجسترون لا ينظمان الدورة فحسب، بل المزاج والنوم أيضاً." },
    { id: 8, category: 'reproductive', emoji: '🧠', fr: "Le cerveau contrôle le cycle menstruel via l'hypothalamus et l'hypophyse.", ar: "يتحكم الدماغ في الدورة الشهرية عبر منطقة تحت المهاد والغدة النخامية." },
    { id: 9, category: 'reproductive', emoji: '🌿', fr: "L'endomètre se renouvelle entièrement à chaque cycle menstruel, un processus unique dans le corps.", ar: "تتجدد بطانة الرحم بالكامل في كل دورة شهرية، وهي عملية فريدة في الجسم." },
    { id: 10, category: 'reproductive', emoji: '✨', fr: "Les ovaires produisent plus de 20 hormones différentes essentielles à la santé générale.", ar: "ينتج المبيضان أكثر من 20 هرموناً مختلفاً ضرورياً للصحة العامة." },

    // Category 2: Pregnancy, Fetal Development, Childbirth (11-20)
    { id: 11, category: 'pregnancy', emoji: '❤️', fr: "Le cœur du fœtus commence à battre dès la cinquième semaine de grossesse.", ar: "يبدأ قلب الجنين بالنبض في الأسبوع الخامس من الحمل." },
    { id: 12, category: 'pregnancy', emoji: '👣', fr: "Les empreintes digitales du bébé se forment dès le troisième mois de grossesse.", ar: "تتشكل بصمات أصابع الطفل في الشهر الثالث من الحمل." },
    { id: 13, category: 'pregnancy', emoji: '🩸', fr: "Le volume sanguin d'une femme enceinte augmente d'environ 50 % pour nourrir le bébé.", ar: "يزداد حجم دم المرأة الحامل بنسبة 50% تقريباً لتغذية الطفل." },
    { id: 14, category: 'pregnancy', emoji: '🤱', fr: "Le placenta est le seul organe temporaire du corps humain, créé spécialement pour chaque grossesse.", ar: "المشيمة هي العضو المؤقت الوحيد في جسم الإنسان، تُنشأ خصيصاً لكل حمل." },
    { id: 15, category: 'pregnancy', emoji: '👂', fr: "Dès le sixième mois, le fœtus peut entendre la voix de sa mère et y réagir.", ar: "من الشهر السادس، يستطيع الجنين سماع صوت أمه والتفاعل معه." },
    { id: 16, category: 'pregnancy', emoji: '🫁', fr: "Le bébé ne respire pas d'air dans l'utérus : l'oxygène lui parvient par le cordon ombilical.", ar: "الطفل لا يتنفس هواءً في الرحم: يصله الأكسجين عبر الحبل السري." },
    { id: 17, category: 'pregnancy', emoji: '🧒', fr: "Un bébé à naître a environ 300 os, qui fusionneront pour former 206 os à l'âge adulte.", ar: "يملك الجنين حوالي 300 عظمة تندمج لتصبح 206 عظمة عند البلوغ." },
    { id: 18, category: 'pregnancy', emoji: '💧', fr: "Le liquide amniotique se renouvelle toutes les trois heures et protège le bébé des chocs.", ar: "يتجدد السائل الأمنيوسي كل ثلاث ساعات ويحمي الطفل من الصدمات." },
    { id: 19, category: 'pregnancy', emoji: '🌙', fr: "Les bébés dans l'utérus dorment entre 12 et 16 heures par jour.", ar: "ينام الأطفال في الرحم بين 12 و16 ساعة يومياً." },
    { id: 20, category: 'pregnancy', emoji: '🎒', fr: "L'utérus passe de la taille d'une poire à celle d'une pastèque pendant la grossesse.", ar: "يتغير حجم الرحم من حجم حبة كمثرى إلى حجم بطيخة خلال الحمل." },

    // Category 3: Women's Health, Nutrition, Exercise, Bone Health (21-30)
    { id: 21, category: 'wellness', emoji: '🦴', fr: "L'œstrogène protège la densité osseuse. Après la ménopause, le risque d'ostéoporose augmente.", ar: "يحمي الإستروجين كثافة العظام. بعد انقطاع الطمث، يزداد خطر هشاشة العظام." },
    { id: 22, category: 'wellness', emoji: '🥗', fr: "L'acide folique est essentiel avant et pendant la grossesse pour le développement du système nerveux du bébé.", ar: "حمض الفوليك ضروري قبل وأثناء الحمل لنمو الجهاز العصبي للطفل." },
    { id: 23, category: 'wellness', emoji: '🏃‍♀️', fr: "L'exercice régulier peut réduire les douleurs menstruelles en libérant des endorphines naturelles.", ar: "التمارين المنتظمة يمكن أن تخفف آلام الدورة الشهرية عبر إفراز الإندورفين الطبيعي." },
    { id: 24, category: 'wellness', emoji: '😴', fr: "Les fluctuations hormonales du cycle peuvent affecter la qualité du sommeil de manière significative.", ar: "التقلبات الهرمونية للدورة يمكن أن تؤثر على جودة النوم بشكل ملحوظ." },
    { id: 25, category: 'wellness', emoji: '🫀', fr: "Les maladies cardiovasculaires sont la première cause de mortalité chez les femmes dans le monde.", ar: "أمراض القلب والأوعية الدموية هي السبب الأول لوفاة النساء في العالم." },
    { id: 26, category: 'wellness', emoji: '☀️', fr: "La vitamine D, produite par l'exposition au soleil, est cruciale pour la santé osseuse des femmes.", ar: "فيتامين د، الذي يُنتج بالتعرض للشمس، ضروري لصحة عظام المرأة." },
    { id: 27, category: 'wellness', emoji: '🧘‍♀️', fr: "Le yoga et la méditation peuvent aider à réduire le stress et les symptômes prémenstruels.", ar: "اليوغا والتأمل يمكن أن يساعدا في تقليل التوتر وأعراض ما قبل الدورة." },
    { id: 28, category: 'wellness', emoji: '💧', fr: "Boire suffisamment d'eau aide à réduire les ballonnements souvent ressentis avant les règles.", ar: "شرب كمية كافية من الماء يساعد في تقليل الانتفاخ الذي يُشعر به قبل الدورة." },
    { id: 29, category: 'wellness', emoji: '🥛', fr: "Les femmes ont besoin de plus de fer que les hommes en raison des pertes menstruelles.", ar: "تحتاج النساء إلى حديد أكثر من الرجال بسبب فقدان الدم أثناء الدورة الشهرية." },
    { id: 30, category: 'wellness', emoji: '💤', fr: "Le magnésium peut aider à soulager les crampes menstruelles et favoriser un meilleur sommeil.", ar: "المغنيسيوم يمكن أن يساعد في تخفيف تقلصات الدورة وتحسين جودة النوم." },

    // Category 4: History of Gynecology, Treatments, Screening (31-40)
    { id: 31, category: 'medical', emoji: '🏛️', fr: "Le papyrus de Kahun, daté de 1800 av. J.-C., est le plus ancien traité de gynécologie connu.", ar: "بردية كاهون، المؤرخة بـ 1800 قبل الميلاد، هي أقدم رسالة معروفة في طب النساء." },
    { id: 32, category: 'medical', emoji: '🔬', fr: "Le frottis cervical, inventé par le Dr Papanicolaou, a considérablement réduit les cancers du col.", ar: "مسحة عنق الرحم، التي اخترعها الدكتور باباني كولاو، خفضت بشكل كبير سرطان عنق الرحم." },
    { id: 33, category: 'medical', emoji: '📡', fr: "L'échographie obstétricale a été utilisée pour la première fois en médecine en 1958 à Glasgow.", ar: "استُخدم التصوير بالموجات فوق الصوتية في الطب لأول مرة عام 1958 في غلاسكو." },
    { id: 34, category: 'medical', emoji: '💉', fr: "Le vaccin contre le HPV protège contre les souches responsables de la majorité des cancers du col.", ar: "لقاح فيروس الورم الحليمي يحمي من السلالات المسببة لغالبية سرطانات عنق الرحم." },
    { id: 35, category: 'medical', emoji: '🎀', fr: "La mammographie est recommandée régulièrement à partir de 40-50 ans pour le dépistage du cancer du sein.", ar: "يُنصح بالتصوير الشعاعي للثدي بانتظام بدءاً من سن 40-50 للكشف المبكر عن سرطان الثدي." },
    { id: 36, category: 'medical', emoji: '🏆', fr: "La première césarienne réussie où la mère a survécu est documentée en Suisse vers 1500.", ar: "أول عملية قيصرية ناجحة نجت فيها الأم موثقة في سويسرا حوالي عام 1500." },
    { id: 37, category: 'medical', emoji: '🧪', fr: "Le premier test de grossesse fiable a été développé en 1927 et nécessitait l'injection de souris.", ar: "طُوّر أول اختبار حمل موثوق عام 1927 وكان يتطلب حقن فئران." },
    { id: 38, category: 'medical', emoji: '👩‍⚕️', fr: "La coelioscopie a révolutionné la chirurgie gynécologique en réduisant les cicatrices et le temps de récupération.", ar: "أحدث التنظير ثورة في جراحة النساء بتقليل الندوب ومدة التعافي." },
    { id: 39, category: 'medical', emoji: '🩺', fr: "Le suivi prénatal régulier a réduit la mortalité maternelle de plus de 90 % en un siècle.", ar: "المتابعة المنتظمة قبل الولادة خفضت وفيات الأمهات بأكثر من 90% خلال قرن." },
    { id: 40, category: 'medical', emoji: '🧫', fr: "La fécondation in vitro, née en 1978 avec Louise Brown, a permis la naissance de millions de bébés.", ar: "التلقيح الاصطناعي، الذي بدأ عام 1978 مع لويز براون، أتاح ولادة ملايين الأطفال." },

    // Category 5: Surprising Facts about Women's Health (41-50)
    { id: 41, category: 'trivia', emoji: '🤰', fr: "La durée de grossesse la plus longue jamais documentée est de 375 jours, soit plus de 12 mois.", ar: "أطول مدة حمل موثقة هي 375 يوماً، أي أكثر من 12 شهراً." },
    { id: 42, category: 'trivia', emoji: '👶', fr: "Les jumeaux peuvent avoir des pères différents : c'est la superfécondation hétéropaternelle.", ar: "يمكن أن يكون للتوائم آباء مختلفون: وهو ما يسمى التلقيح الفائق متعدد الآباء." },
    { id: 43, category: 'trivia', emoji: '🎵', fr: "Les bébés dans l'utérus peuvent reconnaître et préférer la musique que leur mère écoute souvent.", ar: "يمكن للأطفال في الرحم التعرف على الموسيقى التي تستمع إليها أمهم بانتظام وتفضيلها." },
    { id: 44, category: 'trivia', emoji: '🦷', fr: "Pendant la grossesse, les gencives deviennent plus sensibles en raison des changements hormonaux.", ar: "أثناء الحمل، تصبح اللثة أكثر حساسية بسبب التغيرات الهرمونية." },
    { id: 45, category: 'trivia', emoji: '👃', fr: "L'odorat des femmes enceintes devient souvent plus sensible, un mécanisme de protection naturel.", ar: "تصبح حاسة الشم لدى الحوامل أكثر حساسية غالباً، وهي آلية حماية طبيعية." },
    { id: 46, category: 'trivia', emoji: '🧬', fr: "Des cellules du bébé peuvent rester dans le corps de la mère pendant des décennies après l'accouchement.", ar: "يمكن أن تبقى خلايا الطفل في جسم الأم لعقود بعد الولادة." },
    { id: 47, category: 'trivia', emoji: '❄️', fr: "Les ovocytes peuvent être congelés pendant des années et rester viables pour une future grossesse.", ar: "يمكن تجميد البويضات لسنوات وتبقى صالحة لحمل مستقبلي." },
    { id: 48, category: 'trivia', emoji: '🌍', fr: "Chaque jour, environ 800 000 bébés naissent dans le monde, soit plus de 9 par seconde.", ar: "كل يوم، يولد حوالي 800 ألف طفل في العالم، أي أكثر من 9 في الثانية." },
    { id: 49, category: 'trivia', emoji: '🫂', fr: "Le contact peau à peau après la naissance stabilise la température et le rythme cardiaque du nouveau-né.", ar: "التلامس الجلدي بعد الولادة يثبّت درجة حرارة المولود ونبضات قلبه." },
    { id: 50, category: 'trivia', emoji: '🌺', fr: "Le corps féminin produit naturellement de petites quantités de testostérone, essentielle à l'énergie et à la vitalité.", ar: "ينتج جسم المرأة طبيعياً كميات صغيرة من التستوستيرون، ضرورية للطاقة والحيوية." },
  ],
};
