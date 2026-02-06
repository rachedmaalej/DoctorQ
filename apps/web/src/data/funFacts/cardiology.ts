import type { SpecialtyFunFacts } from './types';

export const cardiology: SpecialtyFunFacts = {
  key: 'cardiology',
  labelFr: 'Cardiologie',
  labelAr: 'طب القلب',
  icon: 'cardiology',
  categories: [
    { key: 'heart', icon: 'cardiology', labelFr: 'Le cœur', labelAr: 'القلب' },
    { key: 'circulation', icon: 'water_drop', labelFr: 'Circulation sanguine', labelAr: 'الدورة الدموية' },
    { key: 'lifestyle', icon: 'directions_run', labelFr: 'Mode de vie', labelAr: 'نمط الحياة' },
    { key: 'medical', icon: 'medical_information', labelFr: 'Cardiologie médicale', labelAr: 'طب القلب السريري' },
    { key: 'trivia', icon: 'lightbulb', labelFr: 'Anecdotes', labelAr: 'طرائف' },
  ],
  facts: [
    // Category 1: Heart Anatomy, Heartbeat, Chambers (1-10)
    { id: 1, category: 'heart', emoji: '❤️', fr: "Le cœur humain bat environ 100 000 fois par jour, soit plus de 35 millions de fois par an.", ar: "ينبض القلب البشري حوالي 100,000 مرة يومياً، أي أكثر من 35 مليون مرة سنوياً." },
    { id: 2, category: 'heart', emoji: '🫀', fr: "Votre cœur a à peu près la taille de votre poing fermé et pèse entre 250 et 350 grammes.", ar: "قلبك بحجم قبضة يدك تقريباً ويزن بين 250 و350 غراماً." },
    { id: 3, category: 'heart', emoji: '🔄', fr: "Le cœur possède quatre cavités : deux oreillettes en haut et deux ventricules en bas.", ar: "يمتلك القلب أربع حجرات: أذينتان في الأعلى وبطينان في الأسفل." },
    { id: 4, category: 'heart', emoji: '⚡', fr: "Le cœur génère sa propre impulsion électrique grâce au nœud sinusal, son pacemaker naturel.", ar: "يولّد القلب نبضته الكهربائية بفضل العقدة الجيبية، منظم ضرباته الطبيعي." },
    { id: 5, category: 'heart', emoji: '💪', fr: "Le ventricule gauche est la cavité la plus puissante, propulsant le sang vers tout le corps.", ar: "البطين الأيسر هو أقوى حجرة في القلب، يضخ الدم إلى جميع أنحاء الجسم." },
    { id: 6, category: 'heart', emoji: '🫁', fr: "Le cœur droit envoie le sang vers les poumons, tandis que le cœur gauche l'envoie vers le reste du corps.", ar: "الجهة اليمنى من القلب ترسل الدم إلى الرئتين، واليسرى ترسله إلى باقي الجسم." },
    { id: 7, category: 'heart', emoji: '🚪', fr: "Le cœur possède quatre valves qui s'ouvrent et se ferment pour assurer un flux sanguin à sens unique.", ar: "يمتلك القلب أربعة صمامات تُفتح وتُغلق لضمان تدفق الدم في اتجاه واحد." },
    { id: 8, category: 'heart', emoji: '🎵', fr: "Les sons \"lub-dub\" du cœur proviennent de la fermeture des valves cardiaques à chaque battement.", ar: "أصوات \"لوب-دوب\" للقلب ناتجة عن إغلاق الصمامات القلبية مع كل نبضة." },
    { id: 9, category: 'heart', emoji: '🧱', fr: "Le muscle cardiaque, ou myocarde, ne se fatigue jamais et se contracte sans interruption toute la vie.", ar: "عضلة القلب، أو عضلة الميوكارد، لا تتعب أبداً وتنقبض دون توقف طوال الحياة." },
    { id: 10, category: 'heart', emoji: '📍', fr: "Le cœur n'est pas à gauche : il est au centre de la poitrine, légèrement incliné vers la gauche.", ar: "القلب ليس في اليسار: إنه في وسط الصدر، مائل قليلاً نحو اليسار." },

    // Category 2: Blood Vessels, Blood Types, Circulation (11-20)
    { id: 11, category: 'circulation', emoji: '🩸', fr: "Le corps humain contient environ 5 litres de sang qui circulent en permanence.", ar: "يحتوي جسم الإنسان على حوالي 5 لترات من الدم تدور باستمرار." },
    { id: 12, category: 'circulation', emoji: '🛤️', fr: "Mis bout à bout, vos vaisseaux sanguins mesureraient environ 100 000 kilomètres de long.", ar: "لو وُضعت أوعيتك الدموية في خط واحد، لبلغ طولها حوالي 100,000 كيلومتر." },
    { id: 13, category: 'circulation', emoji: '🔴', fr: "Les globules rouges vivent environ 120 jours avant d'être remplacés par de nouvelles cellules.", ar: "تعيش كريات الدم الحمراء حوالي 120 يوماً قبل أن يتم استبدالها بخلايا جديدة." },
    { id: 14, category: 'circulation', emoji: '🏎️', fr: "Le sang fait le tour complet du corps en seulement 20 secondes environ.", ar: "يدور الدم دورة كاملة في الجسم في حوالي 20 ثانية فقط." },
    { id: 15, category: 'circulation', emoji: '🅾️', fr: "Le groupe sanguin O négatif est le donneur universel, compatible avec tous les groupes.", ar: "فصيلة الدم O سالب هي المتبرع العالمي، متوافقة مع جميع الفصائل." },
    { id: 16, category: 'circulation', emoji: '🧬', fr: "Le groupe sanguin AB positif est le receveur universel, pouvant recevoir de tous les groupes.", ar: "فصيلة الدم AB موجب هي المستقبل العالمي، يمكنها استقبال الدم من جميع الفصائل." },
    { id: 17, category: 'circulation', emoji: '🫀', fr: "Le cœur pompe environ 7 500 litres de sang chaque jour à travers le système circulatoire.", ar: "يضخ القلب حوالي 7,500 لتر من الدم يومياً عبر الجهاز الدوري." },
    { id: 18, category: 'circulation', emoji: '🔵', fr: "Le sang désoxygéné n'est pas bleu : il est rouge foncé. Les veines paraissent bleues à travers la peau.", ar: "الدم غير المؤكسج ليس أزرق: إنه أحمر داكن. تبدو الأوردة زرقاء عبر الجلد." },
    { id: 19, category: 'circulation', emoji: '🌿', fr: "Les capillaires sont si fins qu'un seul globule rouge doit se plier pour y passer.", ar: "الشعيرات الدموية رفيعة جداً لدرجة أن كرية دم واحدة يجب أن تنطوي لتمر عبرها." },
    { id: 20, category: 'circulation', emoji: '💧', fr: "L'aorte, la plus grande artère, a un diamètre proche de celui d'un tuyau d'arrosage.", ar: "الأبهر، أكبر شريان، يبلغ قطره حجماً قريباً من خرطوم الحديقة." },

    // Category 3: Exercise, Diet, Stress and Heart Health (21-30)
    { id: 21, category: 'lifestyle', emoji: '🏃', fr: "Seulement 30 minutes de marche rapide par jour réduisent le risque de maladie cardiaque de 35 %.", ar: "30 دقيقة فقط من المشي السريع يومياً تقلل خطر أمراض القلب بنسبة 35%." },
    { id: 22, category: 'lifestyle', emoji: '😂', fr: "Le rire dilate les vaisseaux sanguins de 22 %, améliorant la circulation pendant 45 minutes.", ar: "الضحك يوسّع الأوعية الدموية بنسبة 22%، مما يحسّن الدورة الدموية لمدة 45 دقيقة." },
    { id: 23, category: 'lifestyle', emoji: '😴', fr: "Dormir moins de 6 heures par nuit augmente de 48 % le risque de maladie cardiaque.", ar: "النوم أقل من 6 ساعات في الليلة يزيد خطر أمراض القلب بنسبة 48%." },
    { id: 24, category: 'lifestyle', emoji: '🐟', fr: "Les acides gras oméga-3 du poisson réduisent l'inflammation et protègent le cœur.", ar: "أحماض أوميغا-3 الدهنية في الأسماك تقلل الالتهاب وتحمي القلب." },
    { id: 25, category: 'lifestyle', emoji: '🧘', fr: "La méditation et la respiration profonde peuvent abaisser la tension artérielle et le rythme cardiaque.", ar: "التأمل والتنفس العميق يمكن أن يخفضا ضغط الدم ومعدل نبضات القلب." },
    { id: 26, category: 'lifestyle', emoji: '🚭', fr: "Arrêter de fumer réduit de moitié le risque cardiaque en seulement un an.", ar: "الإقلاع عن التدخين يخفض خطر أمراض القلب إلى النصف خلال سنة واحدة فقط." },
    { id: 27, category: 'lifestyle', emoji: '🫒', fr: "Le régime méditerranéen riche en huile d'olive réduit de 30 % les accidents cardiovasculaires.", ar: "النظام الغذائي المتوسطي الغني بزيت الزيتون يقلل الحوادث القلبية بنسبة 30%." },
    { id: 28, category: 'lifestyle', emoji: '🧂', fr: "Réduire le sel à 5 g par jour diminue significativement la pression artérielle.", ar: "تقليل الملح إلى 5 غرامات يومياً يخفض ضغط الدم بشكل ملحوظ." },
    { id: 29, category: 'lifestyle', emoji: '😰', fr: "Le stress chronique libère du cortisol, qui augmente la pression artérielle et endommage les artères.", ar: "التوتر المزمن يفرز الكورتيزول، الذي يرفع ضغط الدم ويتلف الشرايين." },
    { id: 30, category: 'lifestyle', emoji: '🍫', fr: "Le chocolat noir à 70 % de cacao contient des flavonoïdes bénéfiques pour la santé cardiovasculaire.", ar: "الشوكولاتة الداكنة بنسبة 70% كاكاو تحتوي على فلافونويدات مفيدة لصحة القلب." },

    // Category 4: Cardiology History, Treatments, ECG, Stents (31-40)
    { id: 31, category: 'medical', emoji: '📊', fr: "L'électrocardiogramme (ECG) a été inventé par Willem Einthoven en 1903, qui reçut le prix Nobel.", ar: "اخترع فيلم أينتهوفن جهاز تخطيط القلب (ECG) عام 1903، ونال جائزة نوبل." },
    { id: 32, category: 'medical', emoji: '🫀', fr: "La première transplantation cardiaque réussie a été réalisée par le Dr Christiaan Barnard en 1967.", ar: "أجرى الدكتور كريستيان بارنارد أول عملية زرع قلب ناجحة عام 1967." },
    { id: 33, category: 'medical', emoji: '🔋', fr: "Le premier pacemaker implantable a été posé en 1958. Certains modernes durent plus de 15 ans.", ar: "زُرع أول منظم قلب اصطناعي عام 1958. بعض الأجهزة الحديثة تدوم أكثر من 15 سنة." },
    { id: 34, category: 'medical', emoji: '🩺', fr: "Le stéthoscope a été inventé en 1816 par René Laennec pour écouter le cœur à distance.", ar: "اخترع رينيه لينيك السماعة الطبية عام 1816 للاستماع إلى القلب عن بُعد." },
    { id: 35, category: 'medical', emoji: '🔧', fr: "Les stents coronariens, petits tubes métalliques, maintiennent les artères ouvertes après une angioplastie.", ar: "الدعامات التاجية، أنابيب معدنية صغيرة، تبقي الشرايين مفتوحة بعد عملية القسطرة." },
    { id: 36, category: 'medical', emoji: '💊', fr: "L'aspirine à faible dose est utilisée depuis des décennies pour prévenir les crises cardiaques.", ar: "يُستخدم الأسبرين بجرعة منخفضة منذ عقود للوقاية من النوبات القلبية." },
    { id: 37, category: 'medical', emoji: '🏥', fr: "Le pontage coronarien consiste à créer un détour autour d'une artère bloquée avec un vaisseau prélevé.", ar: "عملية مجازة الشريان التاجي تتضمن إنشاء مسار بديل حول شريان مسدود بوعاء مأخوذ." },
    { id: 38, category: 'medical', emoji: '📱', fr: "Les montres connectées modernes peuvent détecter la fibrillation auriculaire et alerter l'utilisateur.", ar: "الساعات الذكية الحديثة يمكنها اكتشاف الرجفان الأذيني وتنبيه المستخدم." },
    { id: 39, category: 'medical', emoji: '🫁', fr: "L'échocardiographie utilise les ultrasons pour visualiser le cœur en mouvement en temps réel.", ar: "تخطيط صدى القلب يستخدم الموجات فوق الصوتية لتصوير القلب أثناء حركته مباشرة." },
    { id: 40, category: 'medical', emoji: '🧪', fr: "La troponine est un marqueur sanguin clé pour diagnostiquer un infarctus du myocarde.", ar: "التروبونين هو مؤشر دم أساسي لتشخيص احتشاء عضلة القلب (الجلطة القلبية)." },

    // Category 5: Surprising Heart-Related Trivia (41-50)
    { id: 41, category: 'trivia', emoji: '🐋', fr: "Le cœur de la baleine bleue pèse environ 180 kg et bat seulement 8 à 10 fois par minute.", ar: "قلب الحوت الأزرق يزن حوالي 180 كغ وينبض 8 إلى 10 مرات فقط في الدقيقة." },
    { id: 42, category: 'trivia', emoji: '🐦', fr: "Le cœur d'un colibri bat jusqu'à 1 200 fois par minute en plein vol.", ar: "قلب طائر الطنان ينبض حتى 1,200 مرة في الدقيقة أثناء الطيران." },
    { id: 43, category: 'trivia', emoji: '👶', fr: "Le cœur commence à battre dès la quatrième semaine de grossesse, avant la formation du cerveau.", ar: "يبدأ القلب بالنبض من الأسبوع الرابع من الحمل، قبل تكوّن الدماغ." },
    { id: 44, category: 'trivia', emoji: '💔', fr: "Le \"syndrome du cœur brisé\" existe : un stress intense peut provoquer une défaillance cardiaque temporaire.", ar: "\"متلازمة القلب المكسور\" حقيقية: التوتر الشديد يمكن أن يسبب قصوراً قلبياً مؤقتاً." },
    { id: 45, category: 'trivia', emoji: '🎄', fr: "Les crises cardiaques sont statistiquement plus fréquentes le jour de Noël et le lundi matin.", ar: "النوبات القلبية أكثر شيوعاً إحصائياً يوم عيد الميلاد وصباح يوم الاثنين." },
    { id: 46, category: 'trivia', emoji: '🎶', fr: "La musique au tempo lent peut synchroniser votre rythme cardiaque et réduire l'anxiété.", ar: "الموسيقى ذات الإيقاع البطيء يمكن أن تزامن نبضات قلبك وتقلل القلق." },
    { id: 47, category: 'trivia', emoji: '🏈', fr: "Le cœur d'un athlète entraîné est plus gros et bat plus lentement au repos qu'un cœur sédentaire.", ar: "قلب الرياضي المتدرب أكبر حجماً وينبض أبطأ أثناء الراحة من قلب الشخص الخامل." },
    { id: 48, category: 'trivia', emoji: '🥁', fr: "Le mot \"cœur\" vient du latin \"cor\". En arabe, \"qalb\" signifie aussi \"retournement\".", ar: "كلمة \"cœur\" الفرنسية من اللاتينية \"cor\". وكلمة \"قلب\" عربياً تعني أيضاً التقلّب." },
    { id: 49, category: 'trivia', emoji: '🐙', fr: "La pieuvre possède trois cœurs : deux pour les branchies et un pour le reste du corps.", ar: "يمتلك الأخطبوط ثلاثة قلوب: اثنان للخياشيم وواحد لبقية الجسم." },
    { id: 50, category: 'trivia', emoji: '🤝', fr: "Quand deux personnes se regardent dans les yeux, leurs rythmes cardiaques peuvent se synchroniser.", ar: "عندما ينظر شخصان في عيون بعضهما، يمكن أن تتزامن نبضات قلبيهما." },
  ],
};
