# BleSaf — Base de données FAQ
## Spécification pour implémentation Claude Code

---

## Vue d'ensemble

Ce fichier contient les 18 questions fréquentes à intégrer dans le drawer **Aide & Support** de l'application BleSaf. Les questions sont organisées en 5 clusters thématiques correspondant au parcours mental d'un réceptionniste.

---

## Structure de données

Chaque entrée FAQ suit cette interface TypeScript :

```typescript
interface FaqItem {
  id: string;           // Identifiant unique, format: "faq-[cluster]-[numero]"
  cluster: FaqCluster;  // Cluster thématique
  question: string;     // Texte de la question (FR)
  answer: string;       // Texte de la réponse (FR)
  question_ar: string;  // Texte de la question (AR)
  answer_ar: string;    // Texte de la réponse (AR)
}

type FaqCluster =
  | "mise-en-route"
  | "gestion-file"
  | "qr-code"
  | "whatsapp-notifications"
  | "abonnement-compte";
```

---

## Cluster 1 — Mise en route

**Cluster ID :** `mise-en-route`
**Label FR :** Mise en route
**Label AR :** البدء

---

### FAQ-01

```
id: "faq-demarrage-01"
cluster: "mise-en-route"
```

**Question FR :**
Comment configurer mon cabinet pour la première fois ?

**Réponse FR :**
Lors de votre première connexion, BleSaf vous guide en 3 étapes : (1) renseignez le nom du cabinet et le médecin, (2) définissez la durée moyenne d'une consultation (ex. 15 min), (3) générez et affichez votre QR code en salle d'attente. La durée de consultation est importante — elle sert à calculer le temps d'attente estimé affiché aux patients.

**Question AR :**
كيف أقوم بإعداد عيادتي لأول مرة؟

**Réponse AR :**
عند تسجيل الدخول لأول مرة، سيرشدك BleSaf خلال 3 خطوات: (1) أدخل اسم العيادة واسم الطبيب، (2) حدد متوسط مدة الاستشارة (مثلاً 15 دقيقة)، (3) أنشئ رمز QR وعرضه في غرفة الانتظار. مدة الاستشارة مهمة — تُستخدم لحساب وقت الانتظار التقديري الذي يراه المرضى.

---

### FAQ-02

```
id: "faq-demarrage-02"
cluster: "mise-en-route"
```

**Question FR :**
Comment définir la durée moyenne de consultation ?

**Réponse FR :**
Allez dans Paramètres → Durée moyenne de consultation. Saisissez la durée habituelle en minutes. Cette valeur est utilisée pour estimer l'heure d'appel affichée sur la page de suivi du patient. Vous pouvez l'ajuster à tout moment si votre rythme change.

**Question AR :**
كيف أحدد متوسط مدة الاستشارة؟

**Réponse AR :**
انتقل إلى الإعدادات ← متوسط مدة الاستشارة. أدخل المدة المعتادة بالدقائق. تُستخدم هذه القيمة لتقدير وقت الاستدعاء المعروض في صفحة متابعة المريض. يمكنك تعديلها في أي وقت إذا تغيّر إيقاع عملك.

---

### FAQ-03

```
id: "faq-demarrage-03"
cluster: "mise-en-route"
```

**Question FR :**
À quel moment un patient reçoit-il une notification WhatsApp ?

**Réponse FR :**
BleSaf envoie automatiquement 2 notifications : (1) lorsque le patient arrive à la position configurée dans vos paramètres (ex. "notifier à 2 patients du tour"), (2) lorsque le médecin clique sur Appeler suivant — c'est le message "C'est votre tour !". Le patient reçoit un lien vers sa page de suivi en temps réel.

**Question AR :**
متى يتلقى المريض إشعار واتساب؟

**Réponse AR :**
يرسل BleSaf تلقائياً إشعارَين: (1) عندما يصل المريض إلى الموضع المحدد في إعداداتك (مثلاً "الإشعار عند 2 مرضى قبل دوره")، (2) عندما ينقر الطبيب على "استدعاء التالي" — وهو رسالة "حان دورك!". يتلقى المريض رابطاً لصفحة متابعته في الوقت الفعلي.

---

## Cluster 2 — Gestion quotidienne de la file

**Cluster ID :** `gestion-file`
**Label FR :** Gestion de la file
**Label AR :** إدارة قائمة الانتظار

---

### FAQ-04

```
id: "faq-file-01"
cluster: "gestion-file"
```

**Question FR :**
Comment ajouter un patient sans smartphone ?

**Réponse FR :**
Cliquez sur + Ajouter un patient depuis le tableau de bord. Saisissez le nom et/ou le numéro WhatsApp. Pour les patients sans téléphone du tout, vous pouvez les ajouter sans numéro — ils n'auront pas de notification mais seront visibles dans votre file et pourront suivre leur position sur l'écran d'accueil du cabinet.

**Question AR :**
كيف أضيف مريضاً لا يملك هاتفاً ذكياً؟

**Réponse AR :**
انقر على + إضافة مريض من لوحة التحكم. أدخل الاسم و/أو رقم واتساب. بالنسبة للمرضى الذين لا يملكون هاتفاً على الإطلاق، يمكنك إضافتهم بدون رقم — لن يتلقوا إشعاراً لكنهم سيظهرون في قائمة الانتظار ويمكنهم متابعة موضعهم على شاشة الاستقبال في العيادة.

---

### FAQ-05

```
id: "faq-file-02"
cluster: "gestion-file"
```

**Question FR :**
Comment changer l'ordre des patients dans la file ?

**Réponse FR :**
Maintenez et glissez une fiche patient vers le haut ou le bas pour la repositionner. La numérotation se met à jour instantanément pour tous les patients, qui voient leur position se modifier en temps réel sur leur page de suivi.

**Question AR :**
كيف أغيّر ترتيب المرضى في قائمة الانتظار؟

**Réponse AR :**
اضغط مع الاستمرار على بطاقة مريض واسحبها للأعلى أو الأسفل لإعادة ترتيبها. تتحدث الأرقام فوراً لجميع المرضى، الذين يرون موضعهم يتغير في الوقت الفعلي على صفحة متابعتهم.

---

### FAQ-06

```
id: "faq-file-03"
cluster: "gestion-file"
```

**Question FR :**
Comment gérer un patient absent (no-show) ?

**Réponse FR :**
Sur la fiche du patient, appuyez sur le menu ⋯ et sélectionnez Retirer de la file. Le patient est retiré et la file se réorganise automatiquement.

**Question AR :**
كيف أتعامل مع مريض غائب (لم يحضر)؟

**Réponse AR :**
على بطاقة المريض، اضغط على قائمة ⋯ واختر "إزالة من القائمة". تتم إزالة المريض وتعيد القائمة تنظيم نفسها تلقائياً.

---

### FAQ-07

```
id: "faq-file-04"
cluster: "gestion-file"
```

**Question FR :**
Comment passer un patient en urgence en tête de file ?

**Réponse FR :**
Sur la fiche du patient, appuyez sur le menu ⋯ et sélectionnez Urgence. Le patient passe instantanément en position #1, sans perturber la logique de la file pour les autres.

**Question AR :**
كيف أضع مريضاً في حالة طارئة في مقدمة القائمة؟

**Réponse AR :**
على بطاقة المريض، اضغط على قائمة ⋯ واختر "طارئ". ينتقل المريض فوراً إلى الموضع الأول دون الإخلال بمنطق القائمة للمرضى الآخرين.

---

### FAQ-08

```
id: "faq-file-05"
cluster: "gestion-file"
```

**Question FR :**
Comment vider la file en fin de journée ?

**Réponse FR :**
En bas du tableau de bord, appuyez sur Effacer la file. Une confirmation vous est demandée. Les patients déjà marqués "Terminé" restent dans le bilan statistique du jour — seuls les patients encore en attente sont retirés.

**Question AR :**
كيف أفرّغ قائمة الانتظار في نهاية اليوم؟

**Réponse AR :**
في أسفل لوحة التحكم، اضغط على "مسح القائمة". سيُطلب منك تأكيد ذلك. المرضى الذين تم تحديدهم بـ"منتهي" يبقون في ملخص إحصاءات اليوم — يُزال فقط المرضى الذين لا يزالون ينتظرون.

---

## Cluster 3 — QR code & inscription patient

**Cluster ID :** `qr-code`
**Label FR :** QR code & inscription
**Label AR :** رمز QR والتسجيل

---

### FAQ-09

```
id: "faq-qr-01"
cluster: "qr-code"
```

**Question FR :**
Le QR code ne fonctionne pas — que faire ?

**Réponse FR :**
Vérifiez d'abord que le patient pointe bien l'appareil photo sur le code (pas d'application spéciale requise). Si le scan échoue, le lien d'inscription peut être partagé directement depuis WhatsApp ou affiché sur un écran à l'accueil. En dernier recours, ajoutez le patient manuellement depuis le tableau de bord.

**Question AR :**
رمز QR لا يعمل — ماذا أفعل؟

**Réponse AR :**
تحقق أولاً من أن المريض يوجّه كاميرا هاتفه نحو الرمز (لا حاجة لتطبيق خاص). إذا فشل المسح، يمكن مشاركة رابط التسجيل مباشرةً عبر واتساب أو عرضه على شاشة الاستقبال. كحل أخير، أضف المريض يدوياً من لوحة التحكم.

---

### FAQ-10

```
id: "faq-qr-02"
cluster: "qr-code"
```

**Question FR :**
Comment imprimer et afficher le QR code dans la salle d'attente ?

**Réponse FR :**
Depuis le tableau de bord, cliquez sur l'icône QR → Télécharger l'affiche. Vous obtenez un PDF prêt à imprimer en A5 ou A4, avec les instructions en français et en arabe. Affichez-le à l'entrée, au comptoir et en salle d'attente pour maximiser les auto-inscriptions.

**Question AR :**
كيف أطبع رمز QR وأعرضه في غرفة الانتظار؟

**Réponse AR :**
من لوحة التحكم، انقر على أيقونة QR ← تحميل الملصق. ستحصل على ملف PDF جاهز للطباعة بحجم A5 أو A4، مع التعليمات بالفرنسية والعربية. علّقه عند المدخل وعلى المنضدة وفي غرفة الانتظار لتحقيق أقصى قدر من التسجيلات التلقائية.

---

### FAQ-11

```
id: "faq-qr-03"
cluster: "qr-code"
```

**Question FR :**
Les patients doivent-ils télécharger une application ?

**Réponse FR :**
Non. BleSaf fonctionne entièrement via le navigateur — aucune installation requise. Le patient scanne le QR, remplit un formulaire en 15 secondes, et reçoit un message WhatsApp avec son lien de suivi personnel. Tout fonctionne sur iPhone et Android.

**Question AR :**
هل يحتاج المرضى إلى تنزيل تطبيق؟

**Réponse AR :**
لا. يعمل BleSaf بالكامل عبر المتصفح — لا يلزم تثبيت أي شيء. يمسح المريض رمز QR، ويملأ نموذجاً في 15 ثانية، ويتلقى رسالة واتساب تحتوي على رابط متابعته الشخصي. يعمل على iPhone وAndroid.

---

### FAQ-12

```
id: "faq-qr-04"
cluster: "qr-code"
```

**Question FR :**
Un patient peut-il rejoindre la file à distance avant d'arriver ?

**Réponse FR :**
Pas encore dans la version actuelle — le QR code est conçu pour être scanné sur place. Pour les patients avec rendez-vous, vous pouvez les ajouter manuellement à l'heure prévue depuis le tableau de bord.

**Question AR :**
هل يمكن للمريض الانضمام إلى القائمة عن بُعد قبل وصوله؟

**Réponse AR :**
ليس بعد في الإصدار الحالي — رمز QR مصمم للمسح في المكان. بالنسبة للمرضى الذين لديهم مواعيد، يمكنك إضافتهم يدوياً في الوقت المحدد من لوحة التحكم.

---

## Cluster 4 — WhatsApp & notifications

**Cluster ID :** `whatsapp-notifications`
**Label FR :** WhatsApp & notifications
**Label AR :** واتساب والإشعارات

---

### FAQ-13

```
id: "faq-whatsapp-01"
cluster: "whatsapp-notifications"
```

**Question FR :**
Le message WhatsApp n'a pas été reçu par le patient — que faire ?

**Réponse FR :**
Vérifiez d'abord que le numéro saisi est correct et que le patient a bien WhatsApp installé et actif sur ce numéro. Si le problème persiste, le patient peut suivre sa position directement via le lien affiché sur l'écran d'accueil du cabinet, ou via le lien que vous lui communiquez en copiant l'URL depuis le menu ⋯ de sa fiche. Contactez le support si le problème se répète.

**Question AR :**
لم يستلم المريض رسالة واتساب — ماذا أفعل؟

**Réponse AR :**
تحقق أولاً من صحة الرقم المُدخَل وأن المريض لديه واتساب مثبتاً وفعالاً على هذا الرقم. إذا استمرت المشكلة، يمكن للمريض متابعة موضعه مباشرةً عبر الرابط المعروض على شاشة الاستقبال، أو عبر الرابط الذي تشاركه معه بنسخ الرابط من قائمة ⋯ في بطاقته. تواصل مع الدعم إذا تكررت المشكلة.

---

### FAQ-14

```
id: "faq-whatsapp-02"
cluster: "whatsapp-notifications"
```

**Question FR :**
Le patient peut-il suivre sa position sans WhatsApp ?

**Réponse FR :**
Oui. Chaque patient inscrit reçoit un lien unique vers sa page de suivi en temps réel. Ce lien peut être partagé manuellement (affiché à l'écran, copié depuis le menu ⋯) — il ne nécessite pas WhatsApp. Le patient y voit sa position, le nombre de personnes devant lui et le temps d'attente estimé.

**Question AR :**
هل يمكن للمريض متابعة موضعه بدون واتساب؟

**Réponse AR :**
نعم. يحصل كل مريض مسجل على رابط فريد لصفحة متابعته في الوقت الفعلي. يمكن مشاركة هذا الرابط يدوياً (عرضه على الشاشة، نسخه من قائمة ⋯) — لا يحتاج إلى واتساب. يرى المريض من خلاله موضعه وعدد الأشخاص أمامه ووقت الانتظار التقديري.

---

### FAQ-15

```
id: "faq-whatsapp-03"
cluster: "whatsapp-notifications"
```

**Question FR :**
Comment configurer à quel moment le patient est notifié ?

**Réponse FR :**
Dans Paramètres → Position de notification, définissez le nombre de patients restants avant l'appel à partir duquel la notification "Votre tour approche" est envoyée. Exemple : avec une valeur de 2, le patient est alerté quand il est 2ème dans la file. Adaptez selon la rapidité de vos consultations.

**Question AR :**
كيف أضبط توقيت إشعار المريض؟

**Réponse AR :**
في الإعدادات ← موضع الإشعار، حدد عدد المرضى المتبقين قبل الاستدعاء الذي يُرسل منه إشعار "يقترب دورك". مثال: بقيمة 2، يُنبَّه المريض عندما يكون ثانياً في القائمة. اضبط ذلك وفقاً لسرعة استشاراتك.

---

## Cluster 5 — Abonnement & compte

**Cluster ID :** `abonnement-compte`
**Label FR :** Abonnement & compte
**Label AR :** الاشتراك والحساب

---

### FAQ-16

```
id: "faq-abonnement-01"
cluster: "abonnement-compte"
```

**Question FR :**
Comment fonctionne la période d'essai gratuite ?

**Réponse FR :**
Votre essai de 30 jours commence à l'inscription et inclut l'accès complet à toutes les fonctionnalités. Aucune carte bancaire n'est requise pour démarrer. À l'expiration, l'accès au tableau de bord est suspendu jusqu'à souscription d'un abonnement.

**Question AR :**
كيف تعمل فترة التجربة المجانية؟

**Réponse AR :**
تبدأ فترة تجربتك البالغة 30 يوماً عند التسجيل وتشمل الوصول الكامل إلى جميع الميزات. لا يلزم بطاقة بنكية للبدء. عند انتهاء المدة، يُوقَف الوصول إلى لوحة التحكم حتى الاشتراك في خطة مدفوعة.

---

### FAQ-17

```
id: "faq-abonnement-02"
cluster: "abonnement-compte"
```

**Question FR :**
Quelle est la différence entre l'abonnement mensuel et annuel ?

**Réponse FR :**
L'abonnement mensuel est à 50 TND/mois. L'abonnement annuel est à 500 TND/an — soit 2 mois offerts (économie de 16%). Les deux formules donnent accès aux mêmes fonctionnalités.

**Question AR :**
ما الفرق بين الاشتراك الشهري والسنوي؟

**Réponse AR :**
الاشتراك الشهري بـ50 دينار تونسي/شهر. الاشتراك السنوي بـ500 دينار تونسي/سنة — أي شهرَين مجاناً (توفير 16%). كلا الخطتين توفران الوصول إلى نفس الميزات.

---

### FAQ-18

```
id: "faq-abonnement-03"
cluster: "abonnement-compte"
```

**Question FR :**
Comment changer la langue de l'interface (français / arabe) ?

**Réponse FR :**
Le bouton de langue (عربي / FR) est accessible en haut à droite de chaque écran. Le changement est instantané et bascule l'interface en arabe avec mise en page droite-à-gauche (RTL). Les notifications envoyées aux patients suivent la langue configurée dans vos paramètres.

**Question AR :**
كيف أغيّر لغة الواجهة (فرنسي / عربي)؟

**Réponse AR :**
زر اللغة (عربي / FR) متاح في أعلى يمين كل شاشة. يكون التغيير فورياً ويحوّل الواجهة إلى العربية مع تخطيط من اليمين إلى اليسار (RTL). تتبع الإشعارات المرسلة للمرضى اللغة المحددة في إعداداتك.

---

## Résumé de la structure

| Cluster | Label FR | Nb de questions | IDs |
|---------|----------|----------------|-----|
| `mise-en-route` | Mise en route | 3 | faq-demarrage-01 à 03 |
| `gestion-file` | Gestion de la file | 5 | faq-file-01 à 05 |
| `qr-code` | QR code & inscription | 4 | faq-qr-01 à 04 |
| `whatsapp-notifications` | WhatsApp & notifications | 3 | faq-whatsapp-01 à 03 |
| `abonnement-compte` | Abonnement & compte | 3 | faq-abonnement-01 à 03 |
| **Total** | | **18** | |

---

## Notes d'implémentation

- La **recherche live** dans le drawer Aide & Support doit filtrer sur les champs `question` et `answer` (ou leurs équivalents `_ar` selon la langue active)
- Le **cluster actif** doit être déterminé par la langue courante de l'app (`i18n.language`)
- Les **labels de cluster** servent de séparateurs visuels dans la liste — afficher uniquement les clusters qui contiennent au moins un résultat lors d'une recherche
- Les **IDs** sont stables et peuvent être utilisés comme clés pour les analytics (tracking des questions les plus consultées)
- Prévoir un état **"Aucun résultat"** avec un CTA vers le support WhatsApp si la recherche ne retourne rien
