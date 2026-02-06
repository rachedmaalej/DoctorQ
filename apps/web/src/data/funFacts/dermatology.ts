import type { SpecialtyFunFacts } from './types';

export const dermatology: SpecialtyFunFacts = {
  key: 'dermatology',
  labelFr: 'Dermatologie',
  labelAr: 'طب الجلد',
  icon: 'dermatology',
  categories: [
    { key: 'skin', icon: 'dermatology', labelFr: 'La peau', labelAr: 'الجلد' },
    { key: 'hair_nails', icon: 'face', labelFr: 'Cheveux et ongles', labelAr: 'الشعر والأظافر' },
    { key: 'sun', icon: 'wb_sunny', labelFr: 'Soleil et protection', labelAr: 'الشمس والحماية' },
    { key: 'conditions', icon: 'healing', labelFr: 'Affections cutanées', labelAr: 'الأمراض الجلدية' },
    { key: 'trivia', icon: 'lightbulb', labelFr: 'Anecdotes', labelAr: 'طرائف' },
  ],
  facts: [
    // Category 1: Skin anatomy, layers, cells, renewal (1-10)
    { id: 1, category: 'skin', emoji: '🏋️', fr: "La peau est le plus grand organe du corps humain, pesant environ 3 à 4 kilogrammes chez l'adulte.", ar: "الجلد هو أكبر عضو في جسم الإنسان، ويزن حوالي 3 إلى 4 كيلوغرامات عند البالغين." },
    { id: 2, category: 'skin', emoji: '📐', fr: "La surface totale de la peau d'un adulte est d'environ 1,7 à 2 mètres carrés.", ar: "المساحة الإجمالية لجلد الشخص البالغ حوالي 1.7 إلى 2 متر مربع." },
    { id: 3, category: 'skin', emoji: '🧅', fr: "La peau est composée de trois couches principales : l'épiderme, le derme et l'hypoderme.", ar: "يتكون الجلد من ثلاث طبقات رئيسية: البشرة والأدمة والنسيج تحت الجلد." },
    { id: 4, category: 'skin', emoji: '🔄', fr: "Votre peau se renouvelle entièrement environ tous les 28 jours grâce aux cellules de l'épiderme.", ar: "يتجدد جلدك بالكامل كل 28 يوماً تقريباً بفضل خلايا البشرة." },
    { id: 5, category: 'skin', emoji: '🧹', fr: "Vous perdez environ 30 000 à 40 000 cellules mortes de peau chaque heure.", ar: "تفقد حوالي 30,000 إلى 40,000 خلية جلدية ميتة كل ساعة." },
    { id: 6, category: 'skin', emoji: '🛡️', fr: "Les cellules de Langerhans dans l'épiderme jouent un rôle clé dans la défense immunitaire de la peau.", ar: "خلايا لانغرهانس في البشرة تلعب دوراً أساسياً في الدفاع المناعي للجلد." },
    { id: 7, category: 'skin', emoji: '🎨', fr: "Les mélanocytes produisent la mélanine, le pigment qui donne sa couleur à la peau.", ar: "الخلايا الصباغية تنتج الميلانين، الصبغة التي تعطي الجلد لونه." },
    { id: 8, category: 'skin', emoji: '📏', fr: "L'épaisseur de la peau varie de 0,5 mm sur les paupières à 4 mm sur les talons.", ar: "يتراوح سُمك الجلد من 0.5 ملم على الجفون إلى 4 ملم على الكعبين." },
    { id: 9, category: 'skin', emoji: '🔬', fr: "Chaque centimètre carré de peau contient environ 300 glandes sudoripares.", ar: "كل سنتيمتر مربع من الجلد يحتوي على حوالي 300 غدة عرقية." },
    { id: 10, category: 'skin', emoji: '🌊', fr: "La peau contient environ 11 kilomètres de vaisseaux sanguins qui régulent la température.", ar: "يحتوي الجلد على حوالي 11 كيلومتراً من الأوعية الدموية التي تنظم الحرارة." },

    // Category 2: Hair growth, nail facts, follicles (11-20)
    { id: 11, category: 'hair_nails', emoji: '💇', fr: "Un cheveu pousse en moyenne de 1 à 1,5 centimètre par mois, soit environ 15 cm par an.", ar: "ينمو الشعر بمعدل 1 إلى 1.5 سنتيمتر شهرياً، أي حوالي 15 سم سنوياً." },
    { id: 12, category: 'hair_nails', emoji: '🔢', fr: "Le cuir chevelu contient environ 100 000 à 150 000 follicules pileux.", ar: "تحتوي فروة الرأس على حوالي 100,000 إلى 150,000 بصيلة شعر." },
    { id: 13, category: 'hair_nails', emoji: '🍂', fr: "Il est normal de perdre entre 50 et 100 cheveux par jour dans le cycle de renouvellement.", ar: "من الطبيعي أن تفقد بين 50 و100 شعرة يومياً ضمن دورة التجدد." },
    { id: 14, category: 'hair_nails', emoji: '💪', fr: "Un seul cheveu peut supporter un poids d'environ 100 grammes grâce à la kératine.", ar: "شعرة واحدة يمكنها تحمل وزن حوالي 100 غرام بفضل الكيراتين." },
    { id: 15, category: 'hair_nails', emoji: '⏳', fr: "Chaque cheveu a un cycle de vie de 2 à 7 ans avant de tomber et d'être remplacé.", ar: "لكل شعرة دورة حياة من 2 إلى 7 سنوات قبل أن تسقط ويتم استبدالها." },
    { id: 16, category: 'hair_nails', emoji: '💅', fr: "Les ongles des mains poussent d'environ 3 à 4 mm par mois, plus vite que ceux des pieds.", ar: "تنمو أظافر اليدين بمعدل 3 إلى 4 ملم شهرياً، أسرع من أظافر القدمين." },
    { id: 17, category: 'hair_nails', emoji: '🧱', fr: "Les ongles et les cheveux sont composés de kératine, la même protéine que les cornes d'animaux.", ar: "الأظافر والشعر مكونان من الكيراتين، نفس البروتين الموجود في قرون الحيوانات." },
    { id: 18, category: 'hair_nails', emoji: '🔴', fr: "Les cheveux roux sont les plus rares au monde, ne représentant que 1 à 2 % de la population.", ar: "الشعر الأحمر هو الأندر في العالم، إذ لا يمثل سوى 1 إلى 2% من السكان." },
    { id: 19, category: 'hair_nails', emoji: '🌡️', fr: "Les ongles poussent plus vite en été qu'en hiver à cause de la meilleure circulation sanguine.", ar: "تنمو الأظافر أسرع في الصيف منها في الشتاء بسبب تحسن الدورة الدموية." },
    { id: 20, category: 'hair_nails', emoji: '🔎', fr: "Les taches blanches sur les ongles sont généralement dues à de légers traumatismes, pas à un manque de calcium.", ar: "البقع البيضاء على الأظافر ناتجة عادةً عن رضوض خفيفة، وليس نقص الكالسيوم." },

    // Category 3: UV protection, sunscreen, melanin, vitamin D (21-30)
    { id: 21, category: 'sun', emoji: '☀️', fr: "Les rayons UV du soleil sont la principale cause du vieillissement prématuré de la peau.", ar: "الأشعة فوق البنفسجية من الشمس هي السبب الرئيسي لشيخوخة الجلد المبكرة." },
    { id: 22, category: 'sun', emoji: '🧴', fr: "Un écran solaire SPF 30 bloque environ 97 % des rayons UVB nocifs.", ar: "واقي الشمس بعامل حماية 30 يحجب حوالي 97% من أشعة UVB الضارة." },
    { id: 23, category: 'sun', emoji: '🔄', fr: "La crème solaire doit être réappliquée toutes les deux heures, et après chaque baignade.", ar: "يجب إعادة وضع واقي الشمس كل ساعتين، وبعد كل سباحة." },
    { id: 24, category: 'sun', emoji: '🎨', fr: "La mélanine agit comme un bouclier naturel en absorbant les rayons UV pour protéger l'ADN des cellules.", ar: "الميلانين يعمل كدرع طبيعي بامتصاص الأشعة فوق البنفسجية لحماية الحمض النووي للخلايا." },
    { id: 25, category: 'sun', emoji: '🌤️', fr: "Jusqu'à 80 % des rayons UV traversent les nuages, d'où l'importance de se protéger même par temps couvert.", ar: "حتى 80% من الأشعة فوق البنفسجية تخترق الغيوم، لذا يجب الحماية حتى في الطقس الغائم." },
    { id: 26, category: 'sun', emoji: '☀️', fr: "La peau produit de la vitamine D lorsqu'elle est exposée aux rayons UVB, essentielle pour les os.", ar: "ينتج الجلد فيتامين د عند التعرض لأشعة UVB، وهو ضروري لصحة العظام." },
    { id: 27, category: 'sun', emoji: '🕶️', fr: "Les coups de soleil endommagent l'ADN des cellules cutanées et augmentent le risque de cancer de la peau.", ar: "حروق الشمس تتلف الحمض النووي لخلايا الجلد وتزيد خطر الإصابة بسرطان الجلد." },
    { id: 28, category: 'sun', emoji: '👶', fr: "La peau des enfants est plus fine et plus sensible aux UV que celle des adultes.", ar: "جلد الأطفال أرق وأكثر حساسية للأشعة فوق البنفسجية من جلد البالغين." },
    { id: 29, category: 'sun', emoji: '🏔️', fr: "L'intensité des UV augmente de 10 à 12 % pour chaque 1 000 mètres d'altitude.", ar: "تزداد شدة الأشعة فوق البنفسجية بنسبة 10 إلى 12% لكل 1000 متر ارتفاع." },
    { id: 30, category: 'sun', emoji: '🪞', fr: "Le sable réfléchit environ 25 % des rayons UV et la neige jusqu'à 80 %, amplifiant l'exposition.", ar: "يعكس الرمل حوالي 25% من الأشعة فوق البنفسجية والثلج حتى 80%، مما يضاعف التعرض." },

    // Category 4: Common skin conditions, treatments, history (31-40)
    { id: 31, category: 'conditions', emoji: '🔴', fr: "L'acné touche environ 85 % des adolescents et peut persister à l'âge adulte.", ar: "حب الشباب يصيب حوالي 85% من المراهقين ويمكن أن يستمر في سن البلوغ." },
    { id: 32, category: 'conditions', emoji: '🦋', fr: "L'eczéma (dermatite atopique) affecte environ 15 à 20 % des enfants dans le monde.", ar: "الإكزيما (التهاب الجلد التأتبي) تصيب حوالي 15 إلى 20% من الأطفال حول العالم." },
    { id: 33, category: 'conditions', emoji: '❄️', fr: "Le psoriasis est une maladie auto-immune où les cellules de la peau se renouvellent trop rapidement.", ar: "الصدفية مرض مناعي ذاتي حيث تتجدد خلايا الجلد بسرعة مفرطة." },
    { id: 34, category: 'conditions', emoji: '🍄', fr: "Les infections fongiques de la peau comme la mycose sont très courantes et touchent des millions de personnes.", ar: "الالتهابات الفطرية للجلد كالسعفة شائعة جداً وتصيب ملايين الأشخاص." },
    { id: 35, category: 'conditions', emoji: '🏥', fr: "Hippocrate décrivait déjà des maladies de peau il y a plus de 2 400 ans dans la Grèce antique.", ar: "وصف أبقراط أمراض الجلد منذ أكثر من 2400 عام في اليونان القديمة." },
    { id: 36, category: 'conditions', emoji: '🔬', fr: "Le dermatologue Robert Willan est considéré comme le père de la dermatologie moderne au XVIIIe siècle.", ar: "يُعتبر طبيب الجلد روبرت ويلان أب طب الجلد الحديث في القرن الثامن عشر." },
    { id: 37, category: 'conditions', emoji: '🌹', fr: "La rosacée provoque des rougeurs au visage et peut être déclenchée par le stress, l'alcool ou les épices.", ar: "الوردية تسبب احمراراً في الوجه ويمكن أن يثيرها التوتر أو الكحول أو التوابل." },
    { id: 38, category: 'conditions', emoji: '🐝', fr: "L'urticaire touche environ 20 % des personnes au moins une fois dans leur vie.", ar: "الشرى يصيب حوالي 20% من الأشخاص مرة واحدة على الأقل في حياتهم." },
    { id: 39, category: 'conditions', emoji: '⚪', fr: "Le vitiligo est une perte de pigmentation qui touche environ 1 % de la population mondiale.", ar: "البهاق هو فقدان التصبغ الذي يصيب حوالي 1% من سكان العالم." },
    { id: 40, category: 'conditions', emoji: '💉', fr: "Le traitement par injection de toxine botulique (Botox) a été approuvé pour usage cosmétique en 2002.", ar: "تم اعتماد العلاج بحقن توكسين البوتولينوم (البوتوكس) للاستخدام التجميلي عام 2002." },

    // Category 5: Surprising dermatology trivia (41-50)
    { id: 41, category: 'trivia', emoji: '🐾', fr: "Les empreintes digitales sont uniques même chez les jumeaux identiques.", ar: "بصمات الأصابع فريدة حتى عند التوائم المتطابقة." },
    { id: 42, category: 'trivia', emoji: '🧬', fr: "La peau abrite plus de 1 000 espèces de bactéries qui forment le microbiome cutané.", ar: "يستضيف الجلد أكثر من 1000 نوع من البكتيريا التي تشكل الميكروبيوم الجلدي." },
    { id: 43, category: 'trivia', emoji: '🐍', fr: "Contrairement aux serpents, les humains perdent leur peau de manière continue et invisible.", ar: "على عكس الثعابين، يفقد البشر جلدهم بشكل مستمر وغير مرئي." },
    { id: 44, category: 'trivia', emoji: '🏠', fr: "Environ 50 % de la poussière dans votre maison est composée de cellules de peau morte.", ar: "حوالي 50% من الغبار في منزلك يتكون من خلايا الجلد الميتة." },
    { id: 45, category: 'trivia', emoji: '🦶', fr: "La plante des pieds contient environ 600 glandes sudoripares par centimètre carré.", ar: "باطن القدم يحتوي على حوالي 600 غدة عرقية لكل سنتيمتر مربع." },
    { id: 46, category: 'trivia', emoji: '😊', fr: "La peau du visage possède environ 20 000 terminaisons nerveuses la rendant très sensible.", ar: "جلد الوجه يحتوي على حوالي 20,000 نهاية عصبية مما يجعله شديد الحساسية." },
    { id: 47, category: 'trivia', emoji: '🐙', fr: "Le poulpe peut changer la couleur et la texture de sa peau en moins d'une seconde.", ar: "الأخطبوط يستطيع تغيير لون وملمس جلده في أقل من ثانية." },
    { id: 48, category: 'trivia', emoji: '📊', fr: "Au cours d'une vie, une personne perd en moyenne environ 18 kilogrammes de peau.", ar: "خلال حياة الإنسان، يفقد الشخص في المتوسط حوالي 18 كيلوغراماً من الجلد." },
    { id: 49, category: 'trivia', emoji: '🌙', fr: "La peau se régénère plus activement la nuit, d'où l'importance du sommeil pour le teint.", ar: "يتجدد الجلد بنشاط أكبر في الليل، ولهذا النوم مهم لنضارة البشرة." },
    { id: 50, category: 'trivia', emoji: '🤰', fr: "Pendant la grossesse, la peau peut s'étirer jusqu'à 50 % sur l'abdomen sans se déchirer.", ar: "أثناء الحمل، يمكن للجلد أن يتمدد حتى 50% على البطن دون أن يتمزق." },
  ],
};
