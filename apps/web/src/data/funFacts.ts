/**
 * Fun facts about eyes and vision for the patient waiting page
 * These are displayed to patients while they wait, rotating every 18 seconds
 *
 * Categories:
 * 1. anatomy - Anatomy and Biology of the Eye
 * 2. vision - Vision and Perception (Colors, Focus, Illusions)
 * 3. health - Eye Health and Safety
 * 4. medical - Ophthalmology and Medical Facts
 * 5. trivia - Fun Trivia and Anecdotes
 */

export interface FunFact {
  id: number;
  category: 'anatomy' | 'vision' | 'health' | 'medical' | 'trivia';
  emoji: string;
  fr: string;
  ar: string;
}

export const funFacts: FunFact[] = [
  // Category 1: Anatomy and Biology (1-10)
  {
    id: 1,
    category: 'anatomy',
    emoji: '🧠',
    fr: "L'œil est le deuxième organe le plus complexe de votre corps, juste après le cerveau.",
    ar: "العين هي ثاني أكثر الأعضاء تعقيداً في جسمك، بعد الدماغ مباشرة."
  },
  {
    id: 2,
    category: 'anatomy',
    emoji: '✨',
    fr: "Chaque œil contient plus de 107 millions de cellules sensibles à la lumière.",
    ar: "تحتوي كل عين على أكثر من 107 مليون خلية حساسة للضوء."
  },
  {
    id: 3,
    category: 'anatomy',
    emoji: '👀',
    fr: "Vos yeux conservent la même taille de la naissance à la mort.",
    ar: "تحتفظ عيناك بنفس الحجم من الولادة حتى الوفاة."
  },
  {
    id: 4,
    category: 'anatomy',
    emoji: '💎',
    fr: "La cornée est le seul tissu du corps humain qui ne contient aucun vaisseau sanguin.",
    ar: "القرنية هي النسيج الوحيد في جسم الإنسان الذي لا يحتوي على أي أوعية دموية."
  },
  {
    id: 5,
    category: 'anatomy',
    emoji: '💪',
    fr: "Les muscles de vos yeux sont les plus rapides et les plus actifs de tout votre corps.",
    ar: "عضلات عينيك هي الأسرع والأكثر نشاطاً في جسمك بالكامل."
  },
  {
    id: 6,
    category: 'anatomy',
    emoji: '⚡',
    fr: "Un clignement de l'œil ne dure qu'environ un dixième de seconde.",
    ar: "رمشة العين تستغرق فقط حوالي عُشر الثانية."
  },
  {
    id: 7,
    category: 'anatomy',
    emoji: '💧',
    fr: "Vous clignez des yeux 15 à 20 fois par minute pour les nettoyer et les lubrifier.",
    ar: "ترمش عيناك من 15 إلى 20 مرة في الدقيقة لتنظيفها وترطيبها."
  },
  {
    id: 8,
    category: 'anatomy',
    emoji: '🔵',
    fr: "Nous avons tous un petit point aveugle où le nerf optique se connecte à la rétine.",
    ar: "لدينا جميعاً نقطة عمياء صغيرة حيث يتصل العصب البصري بالشبكية."
  },
  {
    id: 9,
    category: 'anatomy',
    emoji: '🔐',
    fr: "La rétine est aussi unique qu'une empreinte digitale et peut servir à l'identification.",
    ar: "شبكية العين فريدة مثل بصمة الإصبع ويمكن استخدامها للتعريف."
  },
  {
    id: 10,
    category: 'anatomy',
    emoji: '🔄',
    fr: "Votre cerveau reçoit les images à l'envers et les retourne pour que vous voyiez correctement.",
    ar: "يستقبل دماغك الصور مقلوبة ثم يعدلها لترى بشكل صحيح."
  },

  // Category 2: Vision and Perception (11-20)
  {
    id: 11,
    category: 'vision',
    emoji: '🌈',
    fr: "L'œil humain peut distinguer environ 10 millions de couleurs différentes.",
    ar: "يمكن للعين البشرية تمييز حوالي 10 ملايين لون مختلف."
  },
  {
    id: 12,
    category: 'vision',
    emoji: '🟤',
    fr: "Le brun est la couleur des yeux la plus répandue dans le monde.",
    ar: "اللون البني هو أكثر ألوان العيون انتشاراً في العالم."
  },
  {
    id: 13,
    category: 'vision',
    emoji: '🧬',
    fr: "Les yeux bleus proviennent d'une mutation génétique unique survenue il y a des milliers d'années.",
    ar: "العيون الزرقاء ناتجة عن طفرة جينية فريدة حدثت منذ آلاف السنين."
  },
  {
    id: 14,
    category: 'vision',
    emoji: '🎭',
    fr: "L'hétérochromie est la condition d'avoir deux yeux de couleurs différentes.",
    ar: "تغاير لون القزحية هو حالة وجود عينين بلونين مختلفين."
  },
  {
    id: 15,
    category: 'vision',
    emoji: '🎯',
    fr: "Vos yeux peuvent se concentrer sur environ 50 objets différents chaque seconde.",
    ar: "يمكن لعينيك التركيز على حوالي 50 جسماً مختلفاً كل ثانية."
  },
  {
    id: 16,
    category: 'vision',
    emoji: '👁️',
    fr: "La vision périphérique est moins détaillée et moins sensible aux couleurs que la vision centrale.",
    ar: "الرؤية المحيطية أقل تفصيلاً وأقل حساسية للألوان من الرؤية المركزية."
  },
  {
    id: 17,
    category: 'vision',
    emoji: '🔴🟢',
    fr: "Le daltonisme est plus fréquent chez les hommes, touchant environ 1 homme sur 12.",
    ar: "عمى الألوان أكثر شيوعاً عند الرجال، حيث يصيب حوالي 1 من كل 12 رجلاً."
  },
  {
    id: 18,
    category: 'vision',
    emoji: '📸',
    fr: "L'œil traite l'information visuelle plus rapidement que n'importe quel appareil photo.",
    ar: "تعالج العين المعلومات البصرية أسرع من أي كاميرا."
  },
  {
    id: 19,
    category: 'vision',
    emoji: '📚',
    fr: "Environ 80 % de l'apprentissage de votre cerveau passe par l'information visuelle.",
    ar: "حوالي 80% من تعلم دماغك يأتي من المعلومات البصرية."
  },
  {
    id: 20,
    category: 'vision',
    emoji: '😢',
    fr: "Les larmes ont des compositions chimiques différentes selon qu'elles sont émotionnelles ou dues à une irritation.",
    ar: "للدموع تركيبات كيميائية مختلفة حسب كونها عاطفية أو ناتجة عن تهيج."
  },

  // Category 3: Eye Health and Safety (21-30)
  {
    id: 21,
    category: 'health',
    emoji: '🩹',
    fr: "Une égratignure de la cornée guérit très rapidement, souvent en 48 heures avec des soins appropriés.",
    ar: "خدش القرنية يشفى بسرعة كبيرة، غالباً خلال 48 ساعة مع العناية المناسبة."
  },
  {
    id: 22,
    category: 'health',
    emoji: '☀️',
    fr: "Vos yeux peuvent attraper un coup de soleil (photokératite) en cas d'exposition aux UV.",
    ar: "يمكن أن تصاب عيناك بحروق الشمس (التهاب القرنية الضوئي) عند التعرض للأشعة فوق البنفسجية."
  },
  {
    id: 23,
    category: 'health',
    emoji: '💻',
    fr: "La \"règle des 20-20-20\" aide contre la fatigue numérique : toutes les 20 minutes, regardez à 6 mètres pendant 20 secondes.",
    ar: "قاعدة \"20-20-20\" تساعد ضد إجهاد الشاشات: كل 20 دقيقة، انظر لمسافة 6 أمتار لمدة 20 ثانية."
  },
  {
    id: 24,
    category: 'health',
    emoji: '🥷',
    fr: "Le glaucome est souvent surnommé le \"voleur silencieux de la vue\" car il n'a pas de symptômes précoces.",
    ar: "الجلوكوما تُلقب بـ\"لص البصر الصامت\" لأنها لا تظهر أعراضاً مبكرة."
  },
  {
    id: 25,
    category: 'health',
    emoji: '🕶️',
    fr: "Le port de lunettes de soleil bloquant 100 % des UV est essentiel pour protéger vos yeux.",
    ar: "ارتداء نظارات شمسية تحجب 100% من الأشعة فوق البنفسجية ضروري لحماية عينيك."
  },
  {
    id: 26,
    category: 'health',
    emoji: '🚭',
    fr: "Fumer augmente considérablement le risque de cataracte et de dégénérescence maculaire.",
    ar: "التدخين يزيد بشكل كبير من خطر الإصابة بالمياه البيضاء والتنكس البقعي."
  },
  {
    id: 27,
    category: 'health',
    emoji: '🩺',
    fr: "La rétinopathie diabétique est une cause majeure de cécité liée au diabète.",
    ar: "اعتلال الشبكية السكري هو سبب رئيسي للعمى المرتبط بالسكري."
  },
  {
    id: 28,
    category: 'health',
    emoji: '🥕',
    fr: "Les carottes sont bonnes pour les yeux, mais elles ne vous donneront pas une \"super vision nocturne\".",
    ar: "الجزر مفيد للعيون، لكنه لن يمنحك \"رؤية ليلية خارقة\"."
  },
  {
    id: 29,
    category: 'health',
    emoji: '📖',
    fr: "Lire dans la pénombre cause une fatigue oculaire temporaire, mais pas de dommages permanents.",
    ar: "القراءة في الإضاءة الخافتة تسبب إجهاداً مؤقتاً للعين، لكن ليس أضراراً دائمة."
  },
  {
    id: 30,
    category: 'health',
    emoji: '📺',
    fr: "Contrairement à la croyance populaire, s'asseoir près de la télévision ne cause pas de dommages permanents.",
    ar: "خلافاً للاعتقاد الشائع، الجلوس قرب التلفاز لا يسبب أضراراً دائمة."
  },

  // Category 4: Ophthalmology and Medical Facts (31-40)
  {
    id: 31,
    category: 'medical',
    emoji: '🏛️',
    fr: "L'ophtalmologie est l'une des plus anciennes spécialités médicales, remontant à l'Égypte ancienne.",
    ar: "طب العيون من أقدم التخصصات الطبية، يعود إلى مصر القديمة."
  },
  {
    id: 32,
    category: 'medical',
    emoji: '🏆',
    fr: "La chirurgie de la cataracte est l'une des opérations les plus courantes et les plus réussies au monde.",
    ar: "جراحة المياه البيضاء من أكثر العمليات شيوعاً ونجاحاً في العالم."
  },
  {
    id: 33,
    category: 'medical',
    emoji: '👓',
    fr: "Les premières lunettes ont été inventées en Italie vers l'an 1286.",
    ar: "اختُرعت أول نظارات في إيطاليا حوالي عام 1286."
  },
  {
    id: 34,
    category: 'medical',
    emoji: '🎨',
    fr: "Léonard de Vinci a été le premier à conceptualiser l'idée des lentilles de contact au début du XVIe siècle.",
    ar: "كان ليوناردو دافنشي أول من تصور فكرة العدسات اللاصقة في أوائل القرن السادس عشر."
  },
  {
    id: 35,
    category: 'medical',
    emoji: '🔬',
    fr: "La chirurgie LASIK utilise un laser \"froid\" pour remodeler la cornée et corriger la vision.",
    ar: "جراحة الليزك تستخدم ليزراً \"بارداً\" لإعادة تشكيل القرنية وتصحيح الرؤية."
  },
  {
    id: 36,
    category: 'medical',
    emoji: '📏',
    fr: "Une vision de 20/20 signifie que vous voyez à 6 mètres ce qu'une personne normale voit à 6 mètres.",
    ar: "رؤية 20/20 تعني أنك ترى على بعد 6 أمتار ما يراه الشخص العادي على نفس المسافة."
  },
  {
    id: 37,
    category: 'medical',
    emoji: '👨‍⚕️',
    fr: "Un ophtalmologiste est un médecin qui peut effectuer des chirurgies oculaires.",
    ar: "طبيب العيون هو طبيب يمكنه إجراء جراحات العيون."
  },
  {
    id: 38,
    category: 'medical',
    emoji: '🔍',
    fr: "Un optométriste fournit des soins primaires, y compris des examens de la vue et des prescriptions de lunettes.",
    ar: "أخصائي البصريات يقدم الرعاية الأولية، بما في ذلك فحوصات النظر ووصفات النظارات."
  },
  {
    id: 39,
    category: 'medical',
    emoji: '🛠️',
    fr: "Un opticien ajuste les lunettes et les lentilles de contact, mais ne fait ni examen ni chirurgie.",
    ar: "فني البصريات يضبط النظارات والعدسات اللاصقة، لكنه لا يجري فحوصات أو جراحات."
  },
  {
    id: 40,
    category: 'medical',
    emoji: '❤️',
    fr: "Des examens oculaires complets réguliers peuvent détecter des maladies comme le diabète et l'hypertension.",
    ar: "فحوصات العين الشاملة المنتظمة يمكن أن تكشف أمراضاً مثل السكري وارتفاع ضغط الدم."
  },

  // Category 5: Fun Trivia and Anecdotes (41-50)
  {
    id: 41,
    category: 'trivia',
    emoji: '🤧',
    fr: "Il est physiquement impossible d'éternuer les yeux ouverts.",
    ar: "من المستحيل جسدياً العطس والعينان مفتوحتان."
  },
  {
    id: 42,
    category: 'trivia',
    emoji: '👶',
    fr: "Les bébés naissent avec des yeux de taille adulte, mais ne produisent pas de larmes avant 1 à 3 mois.",
    ar: "يولد الأطفال بعيون بحجم البالغين، لكنهم لا ينتجون دموعاً قبل 1 إلى 3 أشهر."
  },
  {
    id: 43,
    category: 'trivia',
    emoji: '👁️‍🗨️',
    fr: "Les cils ont une durée de vie d'environ cinq mois avant de tomber et de repousser.",
    ar: "الرموش لها عمر حوالي خمسة أشهر قبل أن تسقط وتنمو مجدداً."
  },
  {
    id: 44,
    category: 'trivia',
    emoji: '🤨',
    fr: "L'espace entre vos sourcils s'appelle la glabelle.",
    ar: "المسافة بين حاجبيك تسمى الغلابيلا."
  },
  {
    id: 45,
    category: 'trivia',
    emoji: '😱',
    fr: "L'ommatophobie est le terme clinique désignant la peur des yeux.",
    ar: "أوماتوفوبيا هو المصطلح الطبي لرهاب العيون."
  },
  {
    id: 46,
    category: 'trivia',
    emoji: '🖥️',
    fr: "L'œil peut traiter 36 000 bits d'information chaque heure.",
    ar: "يمكن للعين معالجة 36,000 بت من المعلومات كل ساعة."
  },
  {
    id: 47,
    category: 'trivia',
    emoji: '🦈',
    fr: "Les requins ont des cornées si similaires aux nôtres qu'elles ont été utilisées pour des greffes humaines.",
    ar: "قرنيات أسماك القرش مشابهة جداً لقرنياتنا لدرجة استخدامها في زراعات بشرية."
  },
  {
    id: 48,
    category: 'trivia',
    emoji: '🦉',
    fr: "Les hiboux ne peuvent pas bouger leurs globes oculaires; ils doivent tourner toute leur tête.",
    ar: "البوم لا يستطيع تحريك مقلتي عينيه؛ يجب أن يدير رأسه بالكامل."
  },
  {
    id: 49,
    category: 'trivia',
    emoji: '🦎',
    fr: "Les caméléons peuvent bouger leurs yeux indépendamment, regardant dans deux directions à la fois.",
    ar: "الحرباء يمكنها تحريك عينيها بشكل مستقل، والنظر في اتجاهين في وقت واحد."
  },
  {
    id: 50,
    category: 'trivia',
    emoji: '🦑',
    fr: "Le plus grand œil enregistré appartient au calmar géant, qui peut atteindre la taille d'un ballon de basket.",
    ar: "أكبر عين مسجلة تنتمي للحبار العملاق، ويمكن أن تصل لحجم كرة السلة."
  }
];

/**
 * Get a random selection of fun facts
 * @param count Number of facts to return
 */
export function getRandomFunFacts(count: number = 5): FunFact[] {
  const shuffled = [...funFacts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, funFacts.length));
}

/**
 * Get a single random fun fact
 */
export function getRandomFunFact(): FunFact {
  return funFacts[Math.floor(Math.random() * funFacts.length)];
}

/**
 * Get fun facts by category
 */
export function getFunFactsByCategory(category: FunFact['category']): FunFact[] {
  return funFacts.filter(fact => fact.category === category);
}
