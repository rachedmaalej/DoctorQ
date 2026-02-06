import type { SpecialtyFunFacts } from './types';

export const dentistry: SpecialtyFunFacts = {
  key: 'dentistry',
  labelFr: 'Dentisterie',
  labelAr: 'طب الأسنان',
  icon: 'dentistry',
  categories: [
    { key: 'teeth', icon: 'dentistry', labelFr: 'Les dents', labelAr: 'الأسنان' },
    { key: 'gums', icon: 'oral_disease', labelFr: 'Gencives et bouche', labelAr: 'اللثة والفم' },
    { key: 'hygiene', icon: 'clean_hands', labelFr: 'Hygiène dentaire', labelAr: 'نظافة الأسنان' },
    { key: 'treatments', icon: 'medical_services', labelFr: 'Traitements', labelAr: 'العلاجات' },
    { key: 'trivia', icon: 'lightbulb', labelFr: 'Anecdotes', labelAr: 'طرائف' },
  ],
  facts: [
    // Category 1: Teeth — Anatomy, enamel, types of teeth (1-10)
    { id: 1, category: 'teeth', emoji: '🦷', fr: "L'émail dentaire est la substance la plus dure du corps humain, encore plus dure que les os.", ar: "مينا الأسنان هي أصلب مادة في جسم الإنسان، أصلب حتى من العظام." },
    { id: 2, category: 'teeth', emoji: '👶', fr: "Les dents de lait commencent à se former avant la naissance, mais n'apparaissent qu'à environ 6 mois.", ar: "تبدأ الأسنان اللبنية بالتكوّن قبل الولادة، لكنها لا تظهر إلا في عمر 6 أشهر تقريباً." },
    { id: 3, category: 'teeth', emoji: '🔢', fr: "Un adulte possède 32 dents permanentes, tandis qu'un enfant n'a que 20 dents de lait.", ar: "يمتلك البالغ 32 سناً دائمة، بينما لا يملك الطفل سوى 20 سناً لبنية." },
    { id: 4, category: 'teeth', emoji: '🧊', fr: "L'émail ne contient aucune cellule vivante et ne peut donc pas se régénérer une fois endommagé.", ar: "المينا لا تحتوي على خلايا حية ولذلك لا يمكنها التجدد بعد تضررها." },
    { id: 5, category: 'teeth', emoji: '🔍', fr: "Chaque dent a un profil unique, comme une empreinte digitale. Aucune dent n'est identique à une autre.", ar: "لكل سن بصمة فريدة كبصمة الإصبع. لا توجد سنّان متطابقتان." },
    { id: 6, category: 'teeth', emoji: '🦴', fr: "Un tiers de chaque dent est caché sous la gencive. La racine est plus longue que la partie visible.", ar: "ثلث كل سن مخفي تحت اللثة. الجذر أطول من الجزء الظاهر." },
    { id: 7, category: 'teeth', emoji: '🐣', fr: "Les bébés naissent parfois avec des dents, appelées dents natales. Cela arrive environ une fois sur 2 000.", ar: "يولد بعض الأطفال بأسنان تُسمى الأسنان الولادية. يحدث ذلك مرة من كل 2000 ولادة." },
    { id: 8, category: 'teeth', emoji: '🫀', fr: "La pulpe dentaire, au centre de la dent, contient des nerfs et des vaisseaux sanguins qui la maintiennent vivante.", ar: "لب السن في مركزها يحتوي على أعصاب وأوعية دموية تبقيها حية." },
    { id: 9, category: 'teeth', emoji: '🦏', fr: "Les dents de sagesse sont des vestiges évolutifs, autrefois utiles pour mâcher des aliments crus et durs.", ar: "أضراس العقل بقايا تطورية، كانت مفيدة سابقاً لمضغ الأطعمة النيئة والصلبة." },
    { id: 10, category: 'teeth', emoji: '💎', fr: "La dentine, sous l'émail, est jaunâtre. C'est elle qui détermine principalement la couleur de vos dents.", ar: "العاج تحت المينا لونه مائل للأصفر. وهو الذي يحدد بشكل رئيسي لون أسنانك." },

    // Category 2: Gums and Oral Health (11-20)
    { id: 11, category: 'gums', emoji: '💧', fr: "Vous produisez environ un litre de salive par jour, soit 35 000 litres au cours d'une vie.", ar: "تنتج حوالي لتر من اللعاب يومياً، أي 35,000 لتر خلال حياتك." },
    { id: 12, category: 'gums', emoji: '🦠', fr: "La bouche abrite plus de 700 espèces de bactéries, dont la plupart sont inoffensives ou bénéfiques.", ar: "يحتوي الفم على أكثر من 700 نوع من البكتيريا، معظمها غير ضار أو مفيد." },
    { id: 13, category: 'gums', emoji: '🛡️', fr: "La salive protège les dents en neutralisant les acides et en reminéralisant l'émail en permanence.", ar: "اللعاب يحمي الأسنان عبر تحييد الأحماض وإعادة تمعدن المينا باستمرار." },
    { id: 14, category: 'gums', emoji: '👅', fr: "La langue possède environ 10 000 papilles gustatives qui se renouvellent toutes les deux semaines.", ar: "يحتوي اللسان على حوالي 10,000 برعم تذوق تتجدد كل أسبوعين." },
    { id: 15, category: 'gums', emoji: '🩸', fr: "Des gencives qui saignent au brossage sont souvent un signe précoce de gingivite, une inflammation réversible.", ar: "نزيف اللثة عند التنظيف غالباً علامة مبكرة على التهاب اللثة، وهو التهاب قابل للعلاج." },
    { id: 16, category: 'gums', emoji: '😷', fr: "La maladie parodontale est liée à un risque accru de maladies cardiaques et de diabète.", ar: "أمراض اللثة مرتبطة بزيادة خطر الإصابة بأمراض القلب والسكري." },
    { id: 17, category: 'gums', emoji: '🌙', fr: "La production de salive diminue pendant le sommeil, ce qui explique la mauvaise haleine au réveil.", ar: "إنتاج اللعاب ينخفض أثناء النوم، وهذا يفسر رائحة الفم الكريهة عند الاستيقاظ." },
    { id: 18, category: 'gums', emoji: '💪', fr: "Les gencives saines sont fermes et de couleur rose corail. Des gencives rouges ou gonflées indiquent un problème.", ar: "اللثة السليمة متماسكة ولونها وردي مرجاني. اللثة الحمراء أو المنتفخة تشير إلى مشكلة." },
    { id: 19, category: 'gums', emoji: '🔬', fr: "La plaque dentaire est un biofilm invisible qui se forme sur les dents en seulement quatre heures après le brossage.", ar: "البلاك طبقة حيوية غير مرئية تتكون على الأسنان خلال أربع ساعات فقط بعد التنظيف." },
    { id: 20, category: 'gums', emoji: '🫁', fr: "Les bactéries buccales peuvent être inhalées dans les poumons et contribuer à des infections respiratoires.", ar: "يمكن استنشاق بكتيريا الفم إلى الرئتين والمساهمة في التهابات الجهاز التنفسي." },

    // Category 3: Dental Hygiene (21-30)
    { id: 21, category: 'hygiene', emoji: '⏱️', fr: "Il est recommandé de se brosser les dents pendant deux minutes, deux fois par jour minimum.", ar: "يُنصح بتنظيف الأسنان لمدة دقيقتين، مرتين يومياً على الأقل." },
    { id: 22, category: 'hygiene', emoji: '🪥', fr: "Il faut changer sa brosse à dents tous les trois mois, ou dès que les poils sont usés.", ar: "يجب تغيير فرشاة الأسنان كل ثلاثة أشهر، أو حين تتآكل شعيراتها." },
    { id: 23, category: 'hygiene', emoji: '🧵', fr: "Le fil dentaire nettoie 40 % des surfaces dentaires que la brosse seule ne peut pas atteindre.", ar: "خيط الأسنان ينظف 40% من أسطح الأسنان التي لا تصلها الفرشاة وحدها." },
    { id: 24, category: 'hygiene', emoji: '🚰', fr: "Le fluor dans l'eau potable a réduit les caries de 25 % dans les populations qui en bénéficient.", ar: "الفلورايد في مياه الشرب قلّل التسوس بنسبة 25% في المجتمعات المستفيدة." },
    { id: 25, category: 'hygiene', emoji: '🍎', fr: "Manger une pomme stimule la production de salive et aide à nettoyer naturellement la surface des dents.", ar: "أكل تفاحة يحفز إنتاج اللعاب ويساعد على تنظيف سطح الأسنان طبيعياً." },
    { id: 26, category: 'hygiene', emoji: '🥤', fr: "Les boissons gazeuses contiennent des acides qui attaquent l'émail pendant 20 minutes après chaque gorgée.", ar: "المشروبات الغازية تحتوي على أحماض تهاجم المينا لمدة 20 دقيقة بعد كل رشفة." },
    { id: 27, category: 'hygiene', emoji: '😴', fr: "Se brosser les dents avant de dormir est crucial car la salive diminue la nuit, laissant les dents vulnérables.", ar: "تنظيف الأسنان قبل النوم ضروري لأن اللعاب يقل ليلاً مما يترك الأسنان عرضة للخطر." },
    { id: 28, category: 'hygiene', emoji: '🍬', fr: "Ce n'est pas le sucre lui-même qui cause les caries, mais l'acide produit par les bactéries qui s'en nourrissent.", ar: "ليس السكر نفسه من يسبب التسوس، بل الحمض الذي تنتجه البكتيريا التي تتغذى عليه." },
    { id: 29, category: 'hygiene', emoji: '🧀', fr: "Le fromage augmente le pH de la bouche et apporte du calcium, ce qui aide à protéger l'émail.", ar: "الجبن يرفع درجة حموضة الفم ويوفر الكالسيوم، مما يساعد على حماية المينا." },
    { id: 30, category: 'hygiene', emoji: '👅', fr: "Brosser la langue élimine les bactéries responsables de 85 % des cas de mauvaise haleine.", ar: "تنظيف اللسان يزيل البكتيريا المسؤولة عن 85% من حالات رائحة الفم الكريهة." },

    // Category 4: Treatments and History of Dentistry (31-40)
    { id: 31, category: 'treatments', emoji: '🏛️', fr: "Les Égyptiens pratiquaient la dentisterie dès 3000 av. J.-C. Hesy-Re est le premier dentiste connu de l'histoire.", ar: "مارس المصريون طب الأسنان منذ 3000 ق.م. حسي رع هو أول طبيب أسنان معروف في التاريخ." },
    { id: 32, category: 'treatments', emoji: '🪵', fr: "George Washington ne portait pas de dentier en bois : ses prothèses étaient en ivoire, or et dents humaines.", ar: "لم يرتد جورج واشنطن طقم أسنان خشبياً: كانت أطقمه من العاج والذهب وأسنان بشرية." },
    { id: 33, category: 'treatments', emoji: '💉', fr: "L'anesthésie locale en dentisterie a été introduite en 1884 grâce à la cocaïne, puis remplacée par la novocaïne.", ar: "أُدخل التخدير الموضعي في طب الأسنان عام 1884 بالكوكايين، ثم استُبدل بالنوفوكايين." },
    { id: 34, category: 'treatments', emoji: '📐', fr: "Les appareils orthodontiques modernes existent depuis les années 1900, mais des dispositifs similaires datent de l'Antiquité.", ar: "تقويم الأسنان الحديث موجود منذ القرن العشرين، لكن أجهزة مشابهة تعود للعصور القديمة." },
    { id: 35, category: 'treatments', emoji: '🔩', fr: "Les implants dentaires en titane fusionnent avec l'os de la mâchoire, un processus appelé ostéo-intégration.", ar: "زراعات الأسنان من التيتانيوم تندمج مع عظم الفك، في عملية تُسمى الالتحام العظمي." },
    { id: 36, category: 'treatments', emoji: '✨', fr: "Le blanchiment dentaire professionnel utilise du peroxyde d'hydrogène pour éliminer les taches sur l'émail.", ar: "تبييض الأسنان المهني يستخدم بيروكسيد الهيدروجين لإزالة البقع عن المينا." },
    { id: 37, category: 'treatments', emoji: '🦷', fr: "Les couronnes dentaires en céramique imitent parfaitement la translucidité et la couleur des dents naturelles.", ar: "تيجان الأسنان الخزفية تحاكي بدقة شفافية ولون الأسنان الطبيعية." },
    { id: 38, category: 'treatments', emoji: '🔬', fr: "La radiographie dentaire a été utilisée pour la première fois en 1896, un an après la découverte des rayons X.", ar: "استُخدمت الأشعة السينية في طب الأسنان لأول مرة عام 1896، بعد عام من اكتشافها." },
    { id: 39, category: 'treatments', emoji: '💻', fr: "Les scanners 3D permettent aujourd'hui de fabriquer des couronnes et des bridges en une seule visite.", ar: "الماسحات ثلاثية الأبعاد تسمح اليوم بتصنيع التيجان والجسور في زيارة واحدة." },
    { id: 40, category: 'treatments', emoji: '🧪', fr: "Les obturations en composite sont assorties à la couleur des dents et ont largement remplacé les amalgames au mercure.", ar: "حشوات الكومبوزيت تتطابق مع لون الأسنان وقد حلت بشكل كبير محل حشوات الزئبق." },

    // Category 5: Surprising Dental Trivia and Fun Facts (41-50)
    { id: 41, category: 'trivia', emoji: '🐌', fr: "Les escargots peuvent avoir plus de 20 000 dents microscopiques disposées sur leur langue en forme de ruban.", ar: "يمكن للحلزون أن يمتلك أكثر من 20,000 سن مجهرية مرتبة على لسانه الشريطي." },
    { id: 42, category: 'trivia', emoji: '🦈', fr: "Les requins perdent et repoussent leurs dents toute leur vie, soit environ 30 000 dents au total.", ar: "أسماك القرش تفقد أسنانها وتنمو مجدداً طوال حياتها، أي حوالي 30,000 سن إجمالاً." },
    { id: 43, category: 'trivia', emoji: '🐘', fr: "Les défenses des éléphants sont en réalité des incisives allongées qui poussent tout au long de leur vie.", ar: "أنياب الفيلة هي في الواقع قواطع ممتدة تنمو طوال حياتها." },
    { id: 44, category: 'trivia', emoji: '🧚', fr: "La tradition de la \"fée des dents\" a commencé en Europe au XVIIIe siècle avec un conte français.", ar: "تقليد \"جنية الأسنان\" بدأ في أوروبا في القرن الثامن عشر بحكاية فرنسية." },
    { id: 45, category: 'trivia', emoji: '💰', fr: "En 2011, la dent de John Lennon a été vendue aux enchères pour plus de 31 000 dollars.", ar: "في 2011، بيعت سن جون لينون في مزاد بأكثر من 31,000 دولار." },
    { id: 46, category: 'trivia', emoji: '💪', fr: "La force de morsure humaine peut atteindre 70 kg, mais les crocodiles mordent à plus de 1 800 kg.", ar: "قوة عضة الإنسان قد تصل إلى 70 كغ، لكن التماسيح تعض بأكثر من 1,800 كغ." },
    { id: 47, category: 'trivia', emoji: '⏳', fr: "Une personne passe en moyenne 38 jours à se brosser les dents au cours de sa vie entière.", ar: "يقضي الإنسان في المتوسط 38 يوماً في تنظيف أسنانه خلال حياته كاملة." },
    { id: 48, category: 'trivia', emoji: '🗿', fr: "Les Mayas décoraient leurs dents avec des pierres précieuses comme le jade, collées avec de la résine.", ar: "كان شعب المايا يزيّنون أسنانهم بأحجار كريمة كاليشم، ملصقة بالراتنج." },
    { id: 49, category: 'trivia', emoji: '👃', fr: "L'empreinte de la langue est unique à chaque personne, tout comme les empreintes digitales.", ar: "بصمة اللسان فريدة لكل شخص، تماماً مثل بصمات الأصابع." },
    { id: 50, category: 'trivia', emoji: '🌍', fr: "La carie dentaire est la maladie chronique la plus répandue au monde, touchant 3,5 milliards de personnes.", ar: "تسوس الأسنان هو أكثر الأمراض المزمنة انتشاراً في العالم، يصيب 3.5 مليار شخص." },
  ],
};
