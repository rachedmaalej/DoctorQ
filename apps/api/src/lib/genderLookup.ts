/**
 * Infer patient gender from first name using a curated lookup table
 * of common Tunisian/Arabic and French first names.
 *
 * Returns 'M', 'F', or null if the name is unknown or ambiguous.
 */

// Strip diacritics/accents for normalization
function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const MALE_NAMES: string[] = [
  // ── Tunisian / Arabic male names ──
  'mohamed', 'mohammed', 'muhammad', 'mehdi', 'ahmed', 'ali', 'youssef', 'yousif',
  'omar', 'khalil', 'amine', 'slim', 'hedi', 'nabil', 'karim', 'walid', 'sami',
  'farid', 'adel', 'chokri', 'mondher', 'sofiane', 'bilel', 'hamdi', 'zied',
  'fares', 'anas', 'nizar', 'rami', 'tarek', 'marwan', 'ayoub', 'aziz', 'bechir',
  'habib', 'hassen', 'ilyes', 'imed', 'iskander', 'jamel', 'lotfi', 'moncef',
  'mourad', 'nacer', 'raouf', 'ridha', 'sadok', 'salah', 'skander', 'taieb',
  'anis', 'bassem', 'dali', 'elyess', 'ghaith', 'hamza', 'ismail', 'khaled',
  'malek', 'moez', 'naceur', 'rached', 'samir', 'wissem', 'yassine', 'zaki',
  'abdelaziz', 'abdelkader', 'abdallah', 'abderrahman', 'badr', 'badis', 'chams',
  'dhia', 'elias', 'fathi', 'fethi', 'fouad', 'hafedh', 'hakim', 'hichem',
  'houssem', 'ibrahim', 'issa', 'lassad', 'mahmoud', 'mekki', 'montassar',
  'mustapha', 'nader', 'noureddine', 'othman', 'rafik', 'rayen', 'sabri',
  'saif', 'salim', 'seif', 'souheil', 'taha', 'talel', 'wassim', 'yacine',
  'younes', 'zouhair', 'oussama', 'achraf', 'ala', 'ayman', 'wael', 'majdi',
  'haithem', 'hazem', 'jihed', 'kais', 'laith', 'mounir', 'ramzi', 'skandar',
  'abderrazak', 'amor', 'brahim', 'hicham', 'jalel', 'lamine', 'mansour',
  'mejdi', 'nadhir', 'nejmeddine', 'sahbi', 'slah', 'slaheddine', 'soufiane',
  'toufik', 'wahid',

  // ── French male names ──
  'jean', 'pierre', 'michel', 'jacques', 'philippe', 'alain', 'bernard',
  'christophe', 'daniel', 'eric', 'francois', 'guillaume', 'henri', 'laurent',
  'marc', 'nicolas', 'olivier', 'patrick', 'robert', 'stephane', 'thierry',
  'vincent', 'antoine', 'bruno', 'denis', 'emmanuel', 'fabrice', 'gerard',
  'julien', 'kevin', 'lucas', 'mathieu', 'paul', 'quentin', 'romain',
  'sebastien', 'thomas', 'xavier', 'yves', 'louis', 'david', 'jerome',
  'benoit', 'cedric', 'florian', 'hugo', 'maxime', 'nathan', 'theo',
  'arthur', 'charles', 'etienne', 'frederic', 'gilles', 'herve', 'joel',
  'lionel', 'matthias', 'pascal', 'raphael', 'renaud', 'sylvain', 'arnaud',
  'bastien', 'clement', 'damien', 'edouard', 'felix', 'gaetan', 'hadrien',
  'ivan', 'jordan', 'leo', 'martin', 'noel', 'oscar',
];

const FEMALE_NAMES: string[] = [
  // ── Tunisian / Arabic female names ──
  'fatma', 'aicha', 'aisha', 'maryam', 'mariam', 'meriem', 'safa', 'safaa',
  'ines', 'rania', 'hiba', 'yosra', 'emna', 'salma', 'rim', 'dorra', 'leila',
  'nadia', 'olfa', 'sabrine', 'amira', 'hajer', 'nihel', 'asma', 'chaima',
  'nesrine', 'sirine', 'syrine', 'wafa', 'wissal', 'lamia', 'lina', 'maha',
  'sonia', 'radhia', 'samira', 'afef', 'arwa', 'aziza', 'dalila', 'dorsaf',
  'eya', 'fadila', 'ghada', 'houda', 'jihen', 'kaouther', 'latifa', 'maissa',
  'najla', 'noura', 'rawia', 'nour', 'sarra', 'yasmine', 'zeineb', 'zeinab',
  'hanene', 'hanen', 'henda', 'khaoula', 'marwa', 'mouna', 'nabiha', 'naima',
  'rihab', 'sawsen', 'selma', 'souha', 'wahiba', 'yosr', 'besma', 'bochra',
  'chiraz', 'dhouha', 'faiza', 'feriel', 'gamra', 'habiba', 'ikram', 'jamila',
  'karima', 'lilia', 'lobna', 'mahbouba', 'malika', 'nada', 'najoua', 'ons',
  'raja', 'raoudha', 'samia', 'saida', 'takoua', 'wided', 'yamina', 'zohra',
  'abir', 'ahlem', 'azza', 'basma', 'chayma', 'cyrine', 'donia', 'faten',
  'hela', 'imene', 'kenza', 'khouloud', 'lilia', 'mabrouka', 'manel',
  'meryem', 'narjes', 'oumaima', 'radhia', 'rahma', 'rym', 'sana',
  'soumaya', 'thouraya', 'wiem',

  // ── French female names ──
  'marie', 'sophie', 'isabelle', 'catherine', 'nathalie', 'valerie', 'aurelie',
  'brigitte', 'caroline', 'emilie', 'florence', 'genevieve', 'helene', 'julie',
  'karine', 'laure', 'marguerite', 'nicole', 'patricia', 'sandrine', 'sylvie',
  'therese', 'veronique', 'amelie', 'celine', 'charlotte', 'claire', 'delphine',
  'elise', 'fanny', 'marine', 'lucie', 'pauline', 'anne', 'beatrice', 'corinne',
  'diane', 'estelle', 'gabrielle', 'jeanne', 'lea', 'manon', 'noemie',
  'oceane', 'roxane', 'sarah', 'virginie', 'alice', 'chloe', 'emma',
  'ines', 'jade', 'lola', 'margot', 'nina', 'rose', 'victoria',
  'agathe', 'camille', 'clemence', 'elena', 'justine', 'laura', 'lisa',
  'mathilde', 'morgane', 'eva', 'clara', 'louise', 'juliette',
];

// Build the lookup map
const GENDER_MAP = new Map<string, 'M' | 'F'>();

for (const name of MALE_NAMES) {
  GENDER_MAP.set(normalize(name), 'M');
}
for (const name of FEMALE_NAMES) {
  GENDER_MAP.set(normalize(name), 'F');
}

/**
 * Infer gender from a patient's full name.
 * Extracts the first word (first name), normalizes it, and looks it up.
 *
 * @returns 'M' | 'F' | null (null = unknown/ambiguous)
 */
export function inferGender(fullName: string): 'M' | 'F' | null {
  if (!fullName) return null;

  // Extract first name (first word)
  const firstName = fullName.trim().split(/\s+/)[0];
  if (!firstName) return null;

  return GENDER_MAP.get(normalize(firstName)) ?? null;
}
