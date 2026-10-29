/**
 * A tiny dictionary for the demo. Real apps would use i18next, Lingui, etc. and
 * feed them `useDeviceSimulatorLocale() ?? deviceLocale` the same way.
 */

export type Language = 'en' | 'fr' | 'de' | 'es' | 'ja' | 'hi' | 'ar' | 'he';

export interface Strings {
  /** Native name of the language. */
  languageName: string;
  /** Full BCP-47 tag used for formatting. */
  locale: string;
  /** ISO 4217 currency used in the formatting samples. */
  currency: string;
  tabs: { home: string; gallery: string; form: string; world: string; inspector: string };
  greeting: string;
  subtitle: string;
  today: string;
  numbers: string;
  inbox: string;
  newMessages: (count: number) => string;
  progress: string;
  storageUsed: string;
  balance: string;
  growth: string;
  followers: string;
  nextTrip: string;
  inDays: string;
  contacts: { name: string; message: string }[];
}

export const strings: Record<Language, Strings> = {
  en: {
    languageName: 'English',
    locale: 'en-US',
    currency: 'USD',
    tabs: { home: 'Home', gallery: 'Discover', form: 'Book', world: 'World', inspector: 'Inspector' },
    greeting: 'Good morning, Alex',
    subtitle: 'Here is your day at a glance.',
    today: 'Today',
    numbers: 'Numbers',
    inbox: 'Inbox',
    newMessages: (n) => (n === 1 ? '1 new message' : `${n} new messages`),
    progress: 'Progress',
    storageUsed: 'Storage used',
    balance: 'Balance',
    growth: 'Growth',
    followers: 'Followers',
    nextTrip: 'Next trip',
    inDays: 'Lisbon',
    contacts: [
      { name: 'Maya Chen', message: 'See you at the café at 10?' },
      { name: 'Omar Haddad', message: 'The slides look great!' },
      { name: 'Lena Fischer', message: 'Tickets are booked ✈️' },
    ],
  },
  fr: {
    languageName: 'Français',
    locale: 'fr-FR',
    currency: 'EUR',
    tabs: { home: 'Accueil', gallery: 'Découvrir', form: 'Réserver', world: 'Monde', inspector: 'Inspecteur' },
    greeting: 'Bonjour, Alex',
    subtitle: 'Voici votre journée en un coup d’œil.',
    today: 'Aujourd’hui',
    numbers: 'Chiffres',
    inbox: 'Messages',
    newMessages: (n) => (n <= 1 ? `${n} nouveau message` : `${n} nouveaux messages`),
    progress: 'Progression',
    storageUsed: 'Stockage utilisé',
    balance: 'Solde',
    growth: 'Croissance',
    followers: 'Abonnés',
    nextTrip: 'Prochain voyage',
    inDays: 'Lisbonne',
    contacts: [
      { name: 'Maya Chen', message: 'On se voit au café à 10 h ?' },
      { name: 'Omar Haddad', message: 'Les diapos sont superbes !' },
      { name: 'Lena Fischer', message: 'Les billets sont réservés ✈️' },
    ],
  },
  de: {
    languageName: 'Deutsch',
    locale: 'de-DE',
    currency: 'EUR',
    tabs: { home: 'Start', gallery: 'Entdecken', form: 'Buchen', world: 'Welt', inspector: 'Inspektor' },
    greeting: 'Guten Morgen, Alex',
    subtitle: 'Dein Tag auf einen Blick.',
    today: 'Heute',
    numbers: 'Zahlen',
    inbox: 'Posteingang',
    newMessages: (n) => (n === 1 ? '1 neue Nachricht' : `${n} neue Nachrichten`),
    progress: 'Fortschritt',
    storageUsed: 'Belegter Speicher',
    balance: 'Kontostand',
    growth: 'Wachstum',
    followers: 'Follower',
    nextTrip: 'Nächste Reise',
    inDays: 'Lissabon',
    contacts: [
      { name: 'Maya Chen', message: 'Sehen wir uns um 10 im Café?' },
      { name: 'Omar Haddad', message: 'Die Folien sehen super aus!' },
      { name: 'Lena Fischer', message: 'Tickets sind gebucht ✈️' },
    ],
  },
  es: {
    languageName: 'Español',
    locale: 'es-ES',
    currency: 'EUR',
    tabs: { home: 'Inicio', gallery: 'Descubrir', form: 'Reservar', world: 'Mundo', inspector: 'Inspector' },
    greeting: 'Buenos días, Alex',
    subtitle: 'Tu día de un vistazo.',
    today: 'Hoy',
    numbers: 'Números',
    inbox: 'Bandeja',
    newMessages: (n) => (n === 1 ? '1 mensaje nuevo' : `${n} mensajes nuevos`),
    progress: 'Progreso',
    storageUsed: 'Almacenamiento usado',
    balance: 'Saldo',
    growth: 'Crecimiento',
    followers: 'Seguidores',
    nextTrip: 'Próximo viaje',
    inDays: 'Lisboa',
    contacts: [
      { name: 'Maya Chen', message: '¿Nos vemos en el café a las 10?' },
      { name: 'Omar Haddad', message: '¡Las diapositivas quedaron geniales!' },
      { name: 'Lena Fischer', message: 'Billetes reservados ✈️' },
    ],
  },
  ja: {
    languageName: '日本語',
    locale: 'ja-JP',
    currency: 'JPY',
    tabs: { home: 'ホーム', gallery: '見つける', form: '予約', world: 'ワールド', inspector: 'インスペクタ' },
    greeting: 'おはようございます、アレックスさん',
    subtitle: '今日の予定をひと目で。',
    today: '今日',
    numbers: '数値',
    inbox: '受信箱',
    newMessages: (n) => `新着メッセージ ${n} 件`,
    progress: '進捗',
    storageUsed: '使用済みストレージ',
    balance: '残高',
    growth: '成長率',
    followers: 'フォロワー',
    nextTrip: '次の旅行',
    inDays: 'リスボン',
    contacts: [
      { name: 'マヤ・チェン', message: '10時にカフェで会いましょうか？' },
      { name: 'オマル・ハッダード', message: 'スライド、とても良いです！' },
      { name: 'レナ・フィッシャー', message: 'チケットを予約しました ✈️' },
    ],
  },
  hi: {
    languageName: 'हिन्दी',
    locale: 'hi-IN',
    currency: 'INR',
    tabs: { home: 'होम', gallery: 'खोजें', form: 'बुक करें', world: 'दुनिया', inspector: 'इंस्पेक्टर' },
    greeting: 'सुप्रभात, एलेक्स',
    subtitle: 'आपका दिन एक नज़र में।',
    today: 'आज',
    numbers: 'संख्याएँ',
    inbox: 'इनबॉक्स',
    newMessages: (n) => (n === 1 ? '1 नया संदेश' : `${n} नए संदेश`),
    progress: 'प्रगति',
    storageUsed: 'उपयोग किया गया स्टोरेज',
    balance: 'शेष राशि',
    growth: 'वृद्धि',
    followers: 'फ़ॉलोअर्स',
    nextTrip: 'अगली यात्रा',
    inDays: 'लिस्बन',
    contacts: [
      { name: 'माया चेन', message: 'क्या 10 बजे कैफ़े में मिलें?' },
      { name: 'उमर हद्दाद', message: 'स्लाइड्स बहुत अच्छी हैं!' },
      { name: 'लेना फ़िशर', message: 'टिकट बुक हो गए ✈️' },
    ],
  },
  ar: {
    languageName: 'العربية',
    locale: 'ar-EG',
    currency: 'EGP',
    tabs: { home: 'الرئيسية', gallery: 'استكشف', form: 'احجز', world: 'العالم', inspector: 'المفتش' },
    greeting: 'صباح الخير يا أليكس',
    subtitle: 'هذا يومك في لمحة.',
    today: 'اليوم',
    numbers: 'أرقام',
    inbox: 'الرسائل',
    newMessages: (n) => (n === 1 ? 'رسالة جديدة واحدة' : n === 2 ? 'رسالتان جديدتان' : `${n} رسائل جديدة`),
    progress: 'التقدم',
    storageUsed: 'المساحة المستخدمة',
    balance: 'الرصيد',
    growth: 'النمو',
    followers: 'المتابعون',
    nextTrip: 'الرحلة القادمة',
    inDays: 'لشبونة',
    contacts: [
      { name: 'مايا تشين', message: 'نلتقي في المقهى الساعة العاشرة؟' },
      { name: 'عمر حداد', message: 'الشرائح رائعة!' },
      { name: 'لينا فيشر', message: 'تم حجز التذاكر ✈️' },
    ],
  },
  he: {
    languageName: 'עברית',
    locale: 'he-IL',
    currency: 'ILS',
    tabs: { home: 'בית', gallery: 'גלו', form: 'הזמנה', world: 'עולם', inspector: 'בודק' },
    greeting: 'בוקר טוב, אלכס',
    subtitle: 'היום שלך במבט אחד.',
    today: 'היום',
    numbers: 'מספרים',
    inbox: 'דואר נכנס',
    newMessages: (n) => (n === 1 ? 'הודעה חדשה אחת' : `${n} הודעות חדשות`),
    progress: 'התקדמות',
    storageUsed: 'אחסון בשימוש',
    balance: 'יתרה',
    growth: 'צמיחה',
    followers: 'עוקבים',
    nextTrip: 'הטיול הבא',
    inDays: 'ליסבון',
    contacts: [
      { name: 'מאיה צ׳ן', message: 'נפגשים בבית הקפה ב־10?' },
      { name: 'עומר חדאד', message: 'המצגת נראית מעולה!' },
      { name: 'לנה פישר', message: 'הכרטיסים הוזמנו ✈️' },
    ],
  },
};

export const languages = Object.keys(strings) as Language[];

/** Best dictionary for a BCP-47 tag (`fr-CA` -> `fr`), English otherwise. */
export function languageFor(locale: string | null | undefined): Language {
  const base = (locale ?? '').split(/[-_]/)[0]?.toLowerCase();
  return languages.find((l) => l === base) ?? (base === 'iw' ? 'he' : 'en');
}
