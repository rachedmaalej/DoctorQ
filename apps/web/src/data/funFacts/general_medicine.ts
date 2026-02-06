import type { SpecialtyFunFacts } from './types';

export const general_medicine: SpecialtyFunFacts = {
  key: 'general_medicine',
  labelFr: 'Médecine Générale',
  labelAr: 'طب عام',
  icon: 'local_hospital',
  categories: [
    { key: 'body', icon: 'accessibility_new', labelFr: 'Le corps humain', labelAr: 'جسم الإنسان' },
    { key: 'nutrition', icon: 'restaurant', labelFr: 'Nutrition', labelAr: 'التغذية' },
    { key: 'prevention', icon: 'shield', labelFr: 'Prévention', labelAr: 'الوقاية' },
    { key: 'sleep', icon: 'bedtime', labelFr: 'Sommeil', labelAr: 'النوم' },
    { key: 'trivia', icon: 'lightbulb', labelFr: 'Anecdotes', labelAr: 'طرائف' },
  ],
  facts: [
    // Category 1: Le corps humain (1-10)
    { id: 1, category: 'body', emoji: '🦴', fr: "Le corps humain adulte contient 206 os, mais un nouveau-né en possède environ 270 qui fusionnent en grandissant.", ar: "يحتوي جسم الإنسان البالغ على 206 عظام، لكن المولود الجديد لديه حوالي 270 عظمة تلتحم أثناء النمو." },
    { id: 2, category: 'body', emoji: '❤️', fr: "Votre cœur bat environ 100 000 fois par jour, soit plus de 36 millions de fois par an.", ar: "ينبض قلبك حوالي 100,000 مرة يومياً، أي أكثر من 36 مليون مرة سنوياً." },
    { id: 3, category: 'body', emoji: '🧠', fr: "Le cerveau humain consomme environ 20 % de l'énergie totale du corps, bien qu'il ne représente que 2 % de sa masse.", ar: "يستهلك الدماغ البشري حوالي 20% من طاقة الجسم الكلية، رغم أنه لا يمثل سوى 2% من كتلته." },
    { id: 4, category: 'body', emoji: '🫁', fr: "Vos poumons contiennent environ 300 millions d'alvéoles, offrant une surface d'échange équivalente à un court de tennis.", ar: "تحتوي رئتاك على حوالي 300 مليون حويصلة هوائية، توفر مساحة تبادل تعادل ملعب تنس." },
    { id: 5, category: 'body', emoji: '🩸', fr: "Si l'on mettait bout à bout tous vos vaisseaux sanguins, ils feraient environ 100 000 km de long.", ar: "لو وضعت جميع أوعيتك الدموية على خط واحد، لبلغ طولها حوالي 100,000 كيلومتر." },
    { id: 6, category: 'body', emoji: '💪', fr: "Le corps humain possède plus de 600 muscles, qui représentent environ 40 % du poids corporel total.", ar: "يمتلك جسم الإنسان أكثر من 600 عضلة، تمثل حوالي 40% من وزن الجسم الكلي." },
    { id: 7, category: 'body', emoji: '🔬', fr: "Votre corps produit environ 25 millions de nouvelles cellules chaque seconde.", ar: "ينتج جسمك حوالي 25 مليون خلية جديدة كل ثانية." },
    { id: 8, category: 'body', emoji: '💧', fr: "Le corps humain est composé d'environ 60 % d'eau, ce qui représente environ 42 litres chez un adulte moyen.", ar: "يتكون جسم الإنسان من حوالي 60% ماء، أي ما يعادل 42 لتراً تقريباً عند البالغ." },
    { id: 9, category: 'body', emoji: '👃', fr: "Le nez humain peut détecter plus d'un billion d'odeurs différentes selon des études récentes.", ar: "يمكن للأنف البشري اكتشاف أكثر من تريليون رائحة مختلفة وفقاً لدراسات حديثة." },
    { id: 10, category: 'body', emoji: '🦷', fr: "L'émail dentaire est la substance la plus dure du corps humain, plus résistante que l'os.", ar: "مينا الأسنان هي أصلب مادة في جسم الإنسان، أكثر صلابة من العظام." },

    // Category 2: Nutrition (11-20)
    { id: 11, category: 'nutrition', emoji: '🍌', fr: "Les bananes contiennent du potassium essentiel au bon fonctionnement du cœur et des muscles.", ar: "يحتوي الموز على البوتاسيوم الضروري لعمل القلب والعضلات بشكل سليم." },
    { id: 12, category: 'nutrition', emoji: '🥛', fr: "Le calcium ne se trouve pas que dans le lait : les brocolis, amandes et sardines en sont aussi riches.", ar: "الكالسيوم لا يوجد فقط في الحليب: البروكلي واللوز والسردين غنية به أيضاً." },
    { id: 13, category: 'nutrition', emoji: '🍊', fr: "La vitamine C ne prévient pas le rhume, mais elle peut en réduire la durée et la sévérité.", ar: "فيتامين C لا يمنع نزلات البرد، لكنه يمكن أن يقلل من مدتها وشدتها." },
    { id: 14, category: 'nutrition', emoji: '💦', fr: "Boire suffisamment d'eau aide vos reins à éliminer les toxines et maintient votre peau en bonne santé.", ar: "شرب كمية كافية من الماء يساعد كليتيك على التخلص من السموم ويحافظ على صحة بشرتك." },
    { id: 15, category: 'nutrition', emoji: '🥬', fr: "Les légumes verts à feuilles comme les épinards sont riches en fer, en folates et en vitamines A, C et K.", ar: "الخضروات الورقية الخضراء كالسبانخ غنية بالحديد وحمض الفوليك وفيتامينات A وC وK." },
    { id: 16, category: 'nutrition', emoji: '🫘', fr: "Les fibres alimentaires favorisent la digestion et réduisent le risque de maladies cardiovasculaires et de diabète de type 2.", ar: "الألياف الغذائية تعزز الهضم وتقلل من خطر أمراض القلب والأوعية الدموية والسكري من النوع الثاني." },
    { id: 17, category: 'nutrition', emoji: '🐟', fr: "Les poissons gras comme le saumon et le maquereau sont riches en oméga-3, bénéfiques pour le cœur et le cerveau.", ar: "الأسماك الدهنية كالسلمون والماكريل غنية بأوميغا-3 المفيدة للقلب والدماغ." },
    { id: 18, category: 'nutrition', emoji: '🧂', fr: "L'OMS recommande de consommer moins de 5 grammes de sel par jour pour réduire le risque d'hypertension.", ar: "توصي منظمة الصحة العالمية باستهلاك أقل من 5 غرامات من الملح يومياً للحد من خطر ارتفاع ضغط الدم." },
    { id: 19, category: 'nutrition', emoji: '☀️', fr: "La vitamine D, synthétisée grâce au soleil, est essentielle à l'absorption du calcium et à la santé osseuse.", ar: "فيتامين D الذي يُصنع بفضل الشمس ضروري لامتصاص الكالسيوم وصحة العظام." },
    { id: 20, category: 'nutrition', emoji: '🫐', fr: "Les myrtilles sont parmi les aliments les plus riches en antioxydants, qui protègent les cellules du vieillissement.", ar: "التوت الأزرق من أغنى الأطعمة بمضادات الأكسدة التي تحمي الخلايا من الشيخوخة." },

    // Category 3: Prévention (21-30)
    { id: 21, category: 'prevention', emoji: '🧼', fr: "Se laver les mains pendant 20 secondes avec du savon élimine jusqu'à 99 % des bactéries.", ar: "غسل اليدين لمدة 20 ثانية بالصابون يزيل ما يصل إلى 99% من البكتيريا." },
    { id: 22, category: 'prevention', emoji: '💉', fr: "Les vaccins ont permis d'éradiquer la variole et de réduire la poliomyélite de plus de 99 % dans le monde.", ar: "مكّنت اللقاحات من القضاء على الجدري وتقليل شلل الأطفال بأكثر من 99% عالمياً." },
    { id: 23, category: 'prevention', emoji: '🏃', fr: "30 minutes d'activité physique modérée par jour réduisent le risque de maladies cardiovasculaires de 30 à 40 %.", ar: "30 دقيقة من النشاط البدني المعتدل يومياً تقلل خطر أمراض القلب بنسبة 30 إلى 40%." },
    { id: 24, category: 'prevention', emoji: '🩺', fr: "Un contrôle régulier de la tension artérielle peut prévenir les AVC et les crises cardiaques.", ar: "المراقبة المنتظمة لضغط الدم يمكن أن تمنع السكتات الدماغية والنوبات القلبية." },
    { id: 25, category: 'prevention', emoji: '🦷', fr: "Se brosser les dents deux fois par jour réduit le risque de caries et de maladies des gencives.", ar: "تنظيف الأسنان مرتين يومياً يقلل من خطر التسوس وأمراض اللثة." },
    { id: 26, category: 'prevention', emoji: '🚭', fr: "Arrêter de fumer réduit de moitié le risque de maladie cardiaque après seulement un an d'abstinence.", ar: "الإقلاع عن التدخين يقلل خطر أمراض القلب إلى النصف بعد سنة واحدة فقط من التوقف." },
    { id: 27, category: 'prevention', emoji: '🧴', fr: "Appliquer un écran solaire quotidiennement réduit le risque de mélanome de 50 % selon les études.", ar: "استخدام واقي الشمس يومياً يقلل خطر الإصابة بالميلانوما بنسبة 50% وفقاً للدراسات." },
    { id: 28, category: 'prevention', emoji: '🫀', fr: "Contrôler son taux de cholestérol régulièrement aide à prévenir l'athérosclérose et les maladies artérielles.", ar: "مراقبة مستوى الكوليسترول بانتظام يساعد في الوقاية من تصلب الشرايين وأمراضها." },
    { id: 29, category: 'prevention', emoji: '💧', fr: "Une bonne hydratation aide à prévenir les infections urinaires et les calculs rénaux.", ar: "الترطيب الجيد يساعد في الوقاية من التهابات المسالك البولية وحصى الكلى." },
    { id: 30, category: 'prevention', emoji: '😊', fr: "Le rire réduit les hormones du stress et renforce le système immunitaire selon plusieurs études scientifiques.", ar: "الضحك يقلل هرمونات التوتر ويعزز جهاز المناعة وفقاً لعدة دراسات علمية." },

    // Category 4: Sommeil (31-40)
    { id: 31, category: 'sleep', emoji: '😴', fr: "Un adulte a besoin de 7 à 9 heures de sommeil par nuit pour un fonctionnement optimal du corps et de l'esprit.", ar: "يحتاج البالغ إلى 7 إلى 9 ساعات نوم ليلاً لأداء مثالي للجسم والعقل." },
    { id: 32, category: 'sleep', emoji: '🌙', fr: "Pendant le sommeil profond, le corps libère l'hormone de croissance essentielle à la réparation des tissus.", ar: "أثناء النوم العميق، يفرز الجسم هرمون النمو الضروري لإصلاح الأنسجة." },
    { id: 33, category: 'sleep', emoji: '💭', fr: "Nous passons environ un tiers de notre vie à dormir, soit environ 25 ans pour une personne de 75 ans.", ar: "نقضي حوالي ثلث حياتنا نائمين، أي نحو 25 سنة لشخص عمره 75 عاماً." },
    { id: 34, category: 'sleep', emoji: '🧠', fr: "Le cerveau consolide les souvenirs et l'apprentissage pendant le sommeil paradoxal (phase des rêves).", ar: "يثبّت الدماغ الذكريات والتعلم أثناء نوم حركة العين السريعة (مرحلة الأحلام)." },
    { id: 35, category: 'sleep', emoji: '⏰', fr: "L'horloge biologique interne (rythme circadien) est régulée par la lumière et dure environ 24 heures.", ar: "الساعة البيولوجية الداخلية (الإيقاع اليوماوي) تنظمها الضوء ومدتها حوالي 24 ساعة." },
    { id: 36, category: 'sleep', emoji: '📱', fr: "La lumière bleue des écrans supprime la production de mélatonine et retarde l'endormissement.", ar: "الضوء الأزرق من الشاشات يثبط إنتاج الميلاتونين ويؤخر النوم." },
    { id: 37, category: 'sleep', emoji: '🛏️', fr: "Le manque chronique de sommeil augmente le risque d'obésité, de diabète et de maladies cardiovasculaires.", ar: "نقص النوم المزمن يزيد من خطر السمنة والسكري وأمراض القلب والأوعية الدموية." },
    { id: 38, category: 'sleep', emoji: '🌡️', fr: "Une température de chambre entre 16 et 19 °C est idéale pour un sommeil de qualité.", ar: "درجة حرارة الغرفة بين 16 و19 درجة مئوية مثالية لنوم جيد." },
    { id: 39, category: 'sleep', emoji: '🐑', fr: "Le record du monde de la plus longue période sans dormir est de 11 jours, une expérience extrêmement dangereuse.", ar: "الرقم القياسي العالمي لأطول فترة بدون نوم هو 11 يوماً، وهي تجربة خطيرة للغاية." },
    { id: 40, category: 'sleep', emoji: '😮‍💨', fr: "Le bâillement est contagieux et pourrait être lié à l'empathie : plus vous êtes empathique, plus vous bâillez en voyant quelqu'un bâiller.", ar: "التثاؤب معدٍ وقد يكون مرتبطاً بالتعاطف: كلما كنت أكثر تعاطفاً، زاد تثاؤبك عند رؤية شخص يتثاءب." },

    // Category 5: Anecdotes (41-50)
    { id: 41, category: 'trivia', emoji: '🤧', fr: "Un éternuement peut propulser des gouttelettes à plus de 150 km/h sur une distance de plusieurs mètres.", ar: "يمكن للعطسة أن تقذف رذاذاً بسرعة تتجاوز 150 كم/ساعة على مسافة عدة أمتار." },
    { id: 42, category: 'trivia', emoji: '⚡', fr: "Le cerveau humain génère suffisamment d'électricité pour alimenter une petite ampoule LED.", ar: "يولّد الدماغ البشري كهرباء كافية لتشغيل مصباح LED صغير." },
    { id: 43, category: 'trivia', emoji: '🔴', fr: "Les globules rouges font le tour complet du corps en environ 20 secondes.", ar: "تقوم كريات الدم الحمراء بدورة كاملة في الجسم خلال حوالي 20 ثانية." },
    { id: 44, category: 'trivia', emoji: '🧬', fr: "L'ADN humain partage 60 % de ses gènes avec la banane et 98,7 % avec le chimpanzé.", ar: "يتشارك الحمض النووي البشري 60% من جيناته مع الموز و98.7% مع الشمبانزي." },
    { id: 45, category: 'trivia', emoji: '👅', fr: "Contrairement au mythe, la langue n'a pas de zones de goût distinctes : chaque zone perçoit toutes les saveurs.", ar: "خلافاً للأسطورة، لا توجد مناطق تذوق منفصلة على اللسان: كل منطقة تستشعر جميع النكهات." },
    { id: 46, category: 'trivia', emoji: '💀', fr: "Le plus petit os du corps humain est l'étrier dans l'oreille, mesurant seulement 3 millimètres.", ar: "أصغر عظمة في جسم الإنسان هي عظمة الركاب في الأذن، بطول 3 ملليمترات فقط." },
    { id: 47, category: 'trivia', emoji: '🫁', fr: "Vous respirez en moyenne 22 000 fois par jour, faisant circuler environ 11 000 litres d'air.", ar: "تتنفس في المتوسط 22,000 مرة يومياً، مما يُدوّر حوالي 11,000 لتر من الهواء." },
    { id: 48, category: 'trivia', emoji: '🦠', fr: "Votre corps abrite environ 38 billions de bactéries, soit plus que le nombre total de vos cellules humaines.", ar: "يستضيف جسمك حوالي 38 تريليون بكتيريا، أي أكثر من إجمالي عدد خلاياك البشرية." },
    { id: 49, category: 'trivia', emoji: '👶', fr: "Les empreintes digitales se forment dès la 10e semaine de grossesse et sont uniques, même chez les jumeaux identiques.", ar: "تتشكل بصمات الأصابع من الأسبوع العاشر من الحمل وهي فريدة حتى عند التوائم المتطابقة." },
    { id: 50, category: 'trivia', emoji: '🦴', fr: "L'os hyoïde, situé dans la gorge, est le seul os du corps qui n'est relié à aucun autre os.", ar: "العظم اللامي في الحلق هو العظم الوحيد في الجسم غير المتصل بأي عظم آخر." },
  ],
};
