import type { SpecialtyFunFacts } from './types';

export const pediatrics: SpecialtyFunFacts = {
  key: 'pediatrics',
  labelFr: 'Pédiatrie',
  labelAr: 'طب الأطفال',
  icon: 'pediatrics',
  categories: [
    { key: 'growth', icon: 'height', labelFr: 'Croissance', labelAr: 'النمو' },
    { key: 'nutrition', icon: 'restaurant', labelFr: 'Nutrition infantile', labelAr: 'تغذية الأطفال' },
    { key: 'immunity', icon: 'shield', labelFr: 'Immunité', labelAr: 'المناعة' },
    { key: 'development', icon: 'psychology', labelFr: 'Développement', labelAr: 'التطور' },
    { key: 'trivia', icon: 'lightbulb', labelFr: 'Anecdotes', labelAr: 'طرائف' },
  ],
  facts: [
    // Category 1: Growth (1-10)
    { id: 1, category: 'growth', emoji: '📏', fr: "Un nouveau-né mesure environ 50 cm à la naissance et double sa taille vers l'âge de 4 ans.", ar: "يبلغ طول المولود حوالي 50 سم عند الولادة ويتضاعف طوله في سن الرابعة تقريباً." },
    { id: 2, category: 'growth', emoji: '🦴', fr: "Un bébé naît avec environ 270 os, qui fusionnent pour former 206 os à l'âge adulte.", ar: "يولد الطفل بحوالي 270 عظمة تلتحم لتصبح 206 عظمات عند البلوغ." },
    { id: 3, category: 'growth', emoji: '🌙', fr: "Les enfants grandissent principalement pendant le sommeil grâce à l'hormone de croissance nocturne.", ar: "ينمو الأطفال بشكل رئيسي أثناء النوم بفضل هرمون النمو الليلي." },
    { id: 4, category: 'growth', emoji: '📈', fr: "Un enfant grandit le plus vite durant sa première année : environ 25 cm en 12 mois.", ar: "ينمو الطفل بأسرع معدل في سنته الأولى: حوالي 25 سم في 12 شهراً." },
    { id: 5, category: 'growth', emoji: '🦷', fr: "Les premières dents de lait apparaissent généralement vers 6 mois et sont au nombre de 20.", ar: "تظهر أسنان الحليب الأولى عادةً في عمر 6 أشهر ويبلغ عددها 20 سناً." },
    { id: 6, category: 'growth', emoji: '🧒', fr: "La fontanelle antérieure du crâne d'un bébé se ferme complètement entre 12 et 18 mois.", ar: "يُغلق اليافوخ الأمامي في جمجمة الرضيع بالكامل بين 12 و18 شهراً." },
    { id: 7, category: 'growth', emoji: '👣', fr: "Les pieds d'un enfant atteignent environ la moitié de leur taille adulte vers l'âge d'un an.", ar: "تصل أقدام الطفل إلى نصف حجمها البالغ تقريباً في عمر سنة واحدة." },
    { id: 8, category: 'growth', emoji: '🌱', fr: "La puberté déclenche une poussée de croissance pouvant atteindre 8 à 12 cm par an.", ar: "يُحفّز البلوغ طفرة نمو قد تصل إلى 8-12 سم سنوياً." },
    { id: 9, category: 'growth', emoji: '⚖️', fr: "Un bébé triple son poids de naissance avant son premier anniversaire.", ar: "يتضاعف وزن الرضيع ثلاث مرات قبل عيد ميلاده الأول." },
    { id: 10, category: 'growth', emoji: '🧠', fr: "Le cerveau d'un enfant atteint 80 % de sa taille adulte à l'âge de 2 ans.", ar: "يصل دماغ الطفل إلى 80% من حجمه البالغ في عمر السنتين." },

    // Category 2: Nutrition (11-20)
    { id: 11, category: 'nutrition', emoji: '🤱', fr: "Le lait maternel change de composition au fil des semaines pour s'adapter aux besoins du bébé.", ar: "يتغير تركيب حليب الأم على مر الأسابيع ليتكيف مع احتياجات الرضيع." },
    { id: 12, category: 'nutrition', emoji: '🍊', fr: "La vitamine C aide les enfants à absorber le fer des aliments végétaux.", ar: "يساعد فيتامين سي الأطفال على امتصاص الحديد من الأطعمة النباتية." },
    { id: 13, category: 'nutrition', emoji: '☀️', fr: "La vitamine D est essentielle pour la croissance osseuse des enfants et provient du soleil et de l'alimentation.", ar: "فيتامين د ضروري لنمو عظام الأطفال ويأتي من الشمس والغذاء." },
    { id: 14, category: 'nutrition', emoji: '🥛', fr: "Le colostrum, premier lait maternel, est riche en anticorps et protège le nouveau-né des infections.", ar: "اللبأ، أول حليب للأم، غني بالأجسام المضادة ويحمي المولود من العدوى." },
    { id: 15, category: 'nutrition', emoji: '🥦', fr: "Les préférences alimentaires des enfants se forment dès les premiers mois par l'exposition répétée aux saveurs.", ar: "تتشكل تفضيلات الأطفال الغذائية منذ الأشهر الأولى عبر التعرض المتكرر للنكهات." },
    { id: 16, category: 'nutrition', emoji: '🍌', fr: "Le fer est crucial pour le développement cérébral de l'enfant, surtout entre 6 mois et 3 ans.", ar: "الحديد ضروري لتطور دماغ الطفل، خاصة بين 6 أشهر و3 سنوات." },
    { id: 17, category: 'nutrition', emoji: '💧', fr: "Les bébés allaités exclusivement n'ont pas besoin d'eau supplémentaire avant l'âge de 6 mois.", ar: "الرضع الذين يرضعون طبيعياً حصرياً لا يحتاجون ماءً إضافياً قبل 6 أشهر." },
    { id: 18, category: 'nutrition', emoji: '🥚', fr: "L'introduction précoce des allergènes courants comme l'arachide peut réduire le risque d'allergie alimentaire.", ar: "التقديم المبكر لمسببات الحساسية الشائعة كالفول السوداني قد يقلل خطر الحساسية الغذائية." },
    { id: 19, category: 'nutrition', emoji: '🍎', fr: "Un enfant peut avoir besoin de goûter un aliment 10 à 15 fois avant de l'accepter.", ar: "قد يحتاج الطفل لتذوق طعام ما من 10 إلى 15 مرة قبل قبوله." },
    { id: 20, category: 'nutrition', emoji: '🧬', fr: "Le lait maternel contient plus de 200 composants, dont des prébiotiques qui nourrissent la flore intestinale.", ar: "يحتوي حليب الأم على أكثر من 200 مكون، بما فيها البريبيوتيك التي تغذي البكتيريا النافعة." },

    // Category 3: Immunity (21-30)
    { id: 21, category: 'immunity', emoji: '🛡️', fr: "Les bébés naissent avec des anticorps maternels qui les protègent pendant les premiers mois de vie.", ar: "يولد الرضع بأجسام مضادة من الأم تحميهم خلال الأشهر الأولى من حياتهم." },
    { id: 22, category: 'immunity', emoji: '💉', fr: "Les vaccins entraînent le système immunitaire à reconnaître les agents pathogènes sans provoquer la maladie.", ar: "تدرب اللقاحات الجهاز المناعي على التعرف على مسببات الأمراض دون الإصابة بها." },
    { id: 23, category: 'immunity', emoji: '🤒', fr: "La fièvre chez l'enfant est une réponse naturelle du corps qui aide à combattre les infections.", ar: "الحمى عند الأطفال استجابة طبيعية للجسم تساعد في مكافحة العدوى." },
    { id: 24, category: 'immunity', emoji: '🦠', fr: "Un enfant attrape en moyenne 6 à 8 rhumes par an, ce qui renforce progressivement son immunité.", ar: "يصاب الطفل بمعدل 6 إلى 8 نزلات برد سنوياً، مما يعزز مناعته تدريجياً." },
    { id: 25, category: 'immunity', emoji: '🌿', fr: "Le microbiote intestinal se développe dès la naissance et joue un rôle majeur dans l'immunité de l'enfant.", ar: "تتطور البكتيريا المعوية منذ الولادة وتلعب دوراً رئيسياً في مناعة الطفل." },
    { id: 26, category: 'immunity', emoji: '🤧', fr: "La varicelle est très contagieuse chez les enfants mais confère généralement une immunité à vie.", ar: "جدري الماء شديد العدوى عند الأطفال لكنه يمنح عادةً مناعة مدى الحياة." },
    { id: 27, category: 'immunity', emoji: '🧫', fr: "Le thymus, organe clé de l'immunité, est proportionnellement plus grand chez l'enfant que chez l'adulte.", ar: "الغدة الزعترية، عضو أساسي للمناعة، أكبر نسبياً عند الطفل منها عند البالغ." },
    { id: 28, category: 'immunity', emoji: '🏥', fr: "L'allaitement maternel transmet des anticorps IgA qui protègent l'intestin du nourrisson.", ar: "الرضاعة الطبيعية تنقل أجسام مضادة من نوع IgA تحمي أمعاء الرضيع." },
    { id: 29, category: 'immunity', emoji: '🧪', fr: "Le programme vaccinal tunisien protège les enfants contre plus de 12 maladies infectieuses.", ar: "يحمي برنامج التلقيح التونسي الأطفال من أكثر من 12 مرضاً معدياً." },
    { id: 30, category: 'immunity', emoji: '🌡️', fr: "Les amygdales et les végétations adénoïdes sont les premières lignes de défense immunitaire chez l'enfant.", ar: "اللوزتان والزوائد الأنفية هي خطوط الدفاع المناعي الأولى عند الطفل." },

    // Category 4: Development (31-40)
    { id: 31, category: 'development', emoji: '🧒', fr: "Un bébé reconnaît la voix de sa mère dès la naissance grâce à l'écoute in utero.", ar: "يتعرف الرضيع على صوت أمه منذ الولادة بفضل الاستماع داخل الرحم." },
    { id: 32, category: 'development', emoji: '🗣️', fr: "Les bébés commencent à babiller vers 6 mois et prononcent leurs premiers mots vers 12 mois.", ar: "يبدأ الرضع بالمناغاة في عمر 6 أشهر وينطقون كلماتهم الأولى في عمر 12 شهراً." },
    { id: 33, category: 'development', emoji: '🧠', fr: "Le cerveau d'un enfant forme plus d'un million de nouvelles connexions neuronales chaque seconde.", ar: "يُشكّل دماغ الطفل أكثر من مليون وصلة عصبية جديدة كل ثانية." },
    { id: 34, category: 'development', emoji: '👶', fr: "Le sourire social apparaît vers 6 à 8 semaines et marque une étape clé du développement affectif.", ar: "تظهر الابتسامة الاجتماعية في عمر 6 إلى 8 أسابيع وتمثل مرحلة مهمة في التطور العاطفي." },
    { id: 35, category: 'development', emoji: '🚶', fr: "La plupart des enfants font leurs premiers pas entre 9 et 15 mois.", ar: "يخطو معظم الأطفال خطواتهم الأولى بين 9 و15 شهراً." },
    { id: 36, category: 'development', emoji: '🎵', fr: "L'exposition à la musique dès le plus jeune âge favorise le développement cognitif et langagier.", ar: "التعرض للموسيقى منذ الصغر يعزز التطور المعرفي واللغوي." },
    { id: 37, category: 'development', emoji: '🎨', fr: "Le jeu est essentiel : il développe la créativité, la motricité et les compétences sociales de l'enfant.", ar: "اللعب ضروري: فهو ينمّي الإبداع والمهارات الحركية والاجتماعية عند الطفل." },
    { id: 38, category: 'development', emoji: '📖', fr: "Lire des histoires aux enfants dès la naissance stimule le développement du langage et du vocabulaire.", ar: "قراءة القصص للأطفال منذ الولادة تحفز تطور اللغة والمفردات." },
    { id: 39, category: 'development', emoji: '✋', fr: "La motricité fine, comme saisir un objet, se développe progressivement entre 3 et 12 mois.", ar: "المهارات الحركية الدقيقة، كالإمساك بالأشياء، تتطور تدريجياً بين 3 و12 شهراً." },
    { id: 40, category: 'development', emoji: '😊', fr: "Les enfants bilingues développent souvent de meilleures capacités de résolution de problèmes.", ar: "الأطفال ثنائيو اللغة يطورون غالباً قدرات أفضل في حل المشكلات." },

    // Category 5: Trivia (41-50)
    { id: 41, category: 'trivia', emoji: '👀', fr: "Les nouveau-nés ne voient clairement qu'à 20-30 cm, la distance parfaite pour voir le visage de maman.", ar: "لا يرى المواليد بوضوح إلا على بُعد 20-30 سم، المسافة المثالية لرؤية وجه الأم." },
    { id: 42, category: 'trivia', emoji: '💤', fr: "Un nouveau-né dort en moyenne 16 à 17 heures par jour, réparties en cycles courts.", ar: "ينام المولود الجديد بمعدل 16 إلى 17 ساعة يومياً، موزعة على دورات قصيرة." },
    { id: 43, category: 'trivia', emoji: '😭', fr: "Les bébés pleurent sans larmes pendant les premières semaines car leurs canaux lacrymaux ne sont pas matures.", ar: "يبكي الرضع بدون دموع خلال الأسابيع الأولى لأن قنواتهم الدمعية غير ناضجة." },
    { id: 44, category: 'trivia', emoji: '❤️', fr: "Le cœur d'un nouveau-né bat environ 120 à 160 fois par minute, deux fois plus vite qu'un adulte.", ar: "ينبض قلب المولود حوالي 120 إلى 160 مرة في الدقيقة، أي ضعف سرعة البالغ." },
    { id: 45, category: 'trivia', emoji: '🤲', fr: "Les bébés ont un réflexe de préhension si fort qu'ils peuvent supporter leur propre poids en s'agrippant.", ar: "لدى الرضع منعكس قبض قوي جداً يمكنهم من حمل وزنهم بالتشبث." },
    { id: 46, category: 'trivia', emoji: '👃', fr: "Un nouveau-né reconnaît l'odeur de sa mère dès les premiers jours de vie.", ar: "يتعرف المولود على رائحة أمه منذ الأيام الأولى من حياته." },
    { id: 47, category: 'trivia', emoji: '👅', fr: "Les bébés naissent avec environ 10 000 papilles gustatives, bien plus que les adultes.", ar: "يولد الأطفال بحوالي 10,000 حليمة ذوقية، أكثر بكثير من البالغين." },
    { id: 48, category: 'trivia', emoji: '🫁', fr: "Un bébé respire environ 40 fois par minute, soit deux fois plus vite qu'un adulte au repos.", ar: "يتنفس الرضيع حوالي 40 مرة في الدقيقة، أي ضعف معدل تنفس البالغ في الراحة." },
    { id: 49, category: 'trivia', emoji: '🧒', fr: "Les enfants rient en moyenne 300 fois par jour, contre seulement 15 à 20 fois pour les adultes.", ar: "يضحك الأطفال بمعدل 300 مرة يومياً، مقارنة بـ15 إلى 20 مرة فقط عند البالغين." },
    { id: 50, category: 'trivia', emoji: '🌊', fr: "Les bébés ont un réflexe natatoire inné : immergés, ils retiennent leur souffle et bougent les bras.", ar: "لدى الرضع منعكس سباحة فطري: عند غمرهم بالماء يحبسون أنفاسهم ويحركون أذرعهم." },
  ],
};
