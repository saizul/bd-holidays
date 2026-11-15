/**
 * Names of observances, English and Bangla. Bangla spellings follow the Ministry of
 * Public Administration notices.
 */
export interface ObservanceName {
  en: string;
  bn: string;
  /** Districts the holiday is limited to, if any. */
  regions?: string[];
}

export const HILL_DISTRICTS = ['Rangamati', 'Khagrachhari', 'Bandarban'] as const;

export const NAMES = {
  'shaheed-day': {
    en: 'Shaheed Day and International Mother Language Day',
    bn: 'শহিদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
  },
  'independence-day': { en: 'Independence and National Day', bn: 'স্বাধীনতা ও জাতীয় দিবস' },
  'jumatul-bida': { en: 'Jumatul Bida', bn: 'জুমাতুল বিদা' },
  'eid-ul-fitr': { en: 'Eid-ul-Fitr', bn: 'ঈদ-উল-ফিতর' },
  'eid-ul-fitr-extended': {
    en: 'Eid-ul-Fitr holiday (2 days before and 2 days after Eid)',
    bn: 'ঈদ-উল-ফিতর (ঈদের পূর্বের ০২ দিন ও পরের ০২ দিন)',
  },
  'eid-ul-fitr-third-day': {
    en: 'Eid-ul-Fitr (third day after Eid)',
    bn: 'ঈদ-উল-ফিতর (ঈদের পরের তৃতীয় দিন)',
  },
  'chaitra-sankranti-cht': {
    en: 'Chaitra Sankranti (Rangamati, Khagrachhari and Bandarban hill districts only)',
    bn: 'চৈত্র সংক্রান্তি (শুধু রাঙ্গামাটি, খাগড়াছড়ি ও বান্দরবান পার্বত্য জেলার জন্য প্রযোজ্য)',
    regions: [...HILL_DISTRICTS],
  },
  'may-day': { en: 'May Day', bn: 'মে দিবস' },
  'buddha-purnima': { en: 'Buddha Purnima (Baishakhi Purnima)', bn: 'বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)' },
  'eid-ul-azha': { en: 'Eid-ul-Azha', bn: 'ঈদ-উল-আজহা' },
  'eid-ul-azha-extended': {
    en: 'Eid-ul-Azha holiday (2 days before and 3 days after Eid)',
    bn: 'ঈদ-উল-আজহা (ঈদের পূর্বের ০২ দিন ও পরের ০৩ দিন)',
  },
  'eid-ul-azha-fourth-day': {
    en: 'Eid-ul-Azha (fourth day after Eid)',
    bn: 'ঈদ-উল-আজহা (ঈদের পরের চতুর্থ দিন)',
  },
  'july-uprising-day': { en: 'July Mass Uprising Day', bn: 'জুলাই গণঅভ্যুত্থান দিবস' },
  'eid-e-milad-un-nabi': { en: 'Eid-e-Milad-un-Nabi (SAW)', bn: 'ঈদ-ই-মিলাদুন্নবী (সা.)' },
  janmashtami: { en: 'Janmashtami', bn: 'জন্মাষ্টমী' },
  'durga-puja-dashami': { en: 'Durga Puja (Bijoya Dashami)', bn: 'দুর্গাপূজা (বিজয়া দশমী)' },
  'national-revolution-day': {
    en: 'National Revolution and Solidarity Day',
    bn: 'জাতীয় বিপ্লব ও সংহতি দিবস',
  },
  'victory-day': { en: 'Victory Day', bn: 'বিজয় দিবস' },
  christmas: { en: 'Christmas Day', bn: 'যিশুখ্রিষ্টের জন্মদিন (বড়দিন)' },
  'shab-e-barat': { en: 'Shab-e-Barat', bn: 'শব-ই-বরাত' },
  'shab-e-qadr': { en: 'Shab-e-Qadr', bn: 'শব-ই-কদর' },
  'pohela-boishakh': { en: 'Bengali New Year (Pohela Boishakh)', bn: 'নববর্ষ' },
  ashura: { en: 'Ashura', bn: 'আশুরা' },
  'durga-puja-nabami': { en: 'Durga Puja (Nabami)', bn: 'দুর্গাপূজা (নবমী)' },
  // Optional: Muslim
  'shab-e-miraj': { en: 'Shab-e-Miraj', bn: 'শব-ই-মিরাজ' },
  'akheri-chahar-shomba': { en: 'Akheri Chahar Shomba', bn: 'আখেরি চাহার সোম্বা' },
  'fateha-e-yazdaham': { en: 'Fateha-e-Yazdaham', bn: 'ফাতেহা-ই-ইয়াজদাহম' },
  // Optional: Hindu
  'saraswati-puja': { en: 'Saraswati Puja', bn: 'শ্রীশ্রী সরস্বতী পূজা' },
  shivaratri: { en: 'Shivaratri Vrata', bn: 'শ্রীশ্রী শিবরাত্রি ব্রত' },
  'dol-jatra': { en: 'Dol Jatra', bn: 'দোলযাত্রা' },
  'harichand-thakur': {
    en: 'Birth anniversary of Sri Sri Harichand Thakur',
    bn: 'শ্রীশ্রী হরিচাঁদ ঠাকুরের আবির্ভাব',
  },
  mahalaya: { en: 'Mahalaya', bn: 'মহালয়া' },
  'durga-puja-saptami-ashtami': {
    en: 'Durga Puja (Saptami and Ashtami)',
    bn: 'শ্রীশ্রী দুর্গাপূজা (সপ্তমী ও অষ্টমী)',
  },
  'lakshmi-puja': { en: 'Lakshmi Puja', bn: 'শ্রীশ্রী লক্ষ্মী পূজা' },
  'shyama-puja': { en: 'Shyama Puja', bn: 'শ্রীশ্রী শ্যামা পূজা' },
  // Optional: Christian
  'english-new-year': { en: 'English New Year', bn: 'ইংরেজি নববর্ষ' },
  'ash-wednesday': { en: 'Ash Wednesday', bn: 'ভস্ম বুধবার' },
  'maundy-thursday': { en: 'Maundy Thursday', bn: 'পুণ্য বৃহস্পতিবার' },
  'good-friday': { en: 'Good Friday', bn: 'পুণ্য শুক্রবার' },
  'holy-saturday': { en: 'Holy Saturday', bn: 'পুণ্য শনিবার' },
  'easter-sunday': { en: 'Easter Sunday', bn: 'ইস্টার সানডে' },
  'christmas-festival': {
    en: 'Christmas festival (day before and day after Christmas)',
    bn: 'যিশুখ্রিষ্টের জন্মোৎসব (বড়দিনের পূর্বের ও পরের দিন)',
  },
  // Optional: Buddhist
  'maghi-purnima': { en: 'Maghi Purnima', bn: 'মাঘী পূর্ণিমা' },
  'chaitra-sankranti': { en: 'Chaitra Sankranti', bn: 'চৈত্র সংক্রান্তি' },
  'buddha-purnima-adjacent': {
    en: 'Buddha Purnima (day before and day after)',
    bn: 'বুদ্ধ পূর্ণিমা (পূর্বের ও পরের দিন)',
  },
  'ashari-purnima': { en: 'Ashari Purnima', bn: 'আষাঢ়ী পূর্ণিমা' },
  'madhu-purnima': { en: 'Madhu Purnima (Bhadra Purnima)', bn: 'মধু পূর্ণিমা (ভাদ্র পূর্ণিমা)' },
  'probarona-purnima': {
    en: 'Probarona Purnima (Ashwini Purnima)',
    bn: 'প্রবারণা পূর্ণিমা (আশ্বিনী পূর্ণিমা)',
  },
  // Optional: ethnic minority communities
  baisabi: {
    en: 'Baisabi and similar social festivals of other small ethnic groups of the Chittagong Hill Tracts',
    bn: 'বৈসাবি ও পার্বত্য চট্টগ্রামের অন্যান্য ক্ষুদ্র নৃ-গোষ্ঠীর অনুরূপ সামাজিক উৎসব',
  },
} satisfies Record<string, ObservanceName>;

export type ObservanceKey = keyof typeof NAMES;
