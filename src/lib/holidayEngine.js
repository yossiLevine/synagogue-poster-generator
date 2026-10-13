/**
 * Holiday Engine (מנוע חגים ומועדים)
 * Provides liturgical templates, calendar detection for holidays coinciding with Shabbat,
 * 2-day festival layouts, and Halachic badges (Eruv Tavshilin, Yizkor, Transferring Fire).
 */

export const HOLIDAY_PRESETS = [
  {
    id: 'rosh_hashana',
    name: 'ראש השנה',
    emoji: '🍎',
    hebrewTitle: 'ראש השנה הבעל"ט',
    subtitle: 'שנת שובע וברכה · תכתבו ותחתמו לאלתר לחיים טובים',
    isTwoDay: true,
    dayLabelA: "יום א' דראש השנה",
    dayLabelB: "יום ב' דראש השנה",
    hasShofar: true,
    hasTashlich: true,
    requiresFireTransferNightB: true,
    accentColor: '#d4af37',
    defaultRows: [
      { id: 'rh_1', label: 'מנחה ערב החג', time: '18:20', visible: true, dayTag: 'A' },
      { id: 'rh_2', label: "ערבית ליל א'", time: '18:50', visible: true, dayTag: 'A' },
      { id: 'rh_3', label: "שחרית יום א'", time: '07:30', visible: true, dayTag: 'A' },
      { id: 'rh_4', label: 'תקיעת שופר (מיושב)', time: '09:45', visible: true, dayTag: 'A' },
      { id: 'rh_5', label: 'תפילת מוסף ותקיעות', time: '10:15', visible: true, dayTag: 'A' },
      { id: 'rh_6', label: 'מנחה ותשליך', time: '17:30', visible: true, dayTag: 'A' },
      { id: 'rh_7', label: "הדלקת נרות ליל ב' (מאש קיימת)", time: '19:15', visible: true, dayTag: 'B', isNote: true },
      { id: 'rh_8', label: "ערבית ליל ב'", time: '19:15', visible: true, dayTag: 'B' },
      { id: 'rh_9', label: "שחרית יום ב'", time: '07:30', visible: true, dayTag: 'B' },
      { id: 'rh_10', label: "תקיעת שופר יום ב'", time: '09:45', visible: true, dayTag: 'B' },
      { id: 'rh_11', label: "מוסף יום ב'", time: '10:15', visible: true, dayTag: 'B' },
      { id: 'rh_12', label: "מנחה יום ב'", time: '18:15', visible: true, dayTag: 'B' },
      { id: 'rh_13', label: 'נעילת החג ומעריב', time: '19:12', visible: true, dayTag: 'B' },
    ],
    announcements: [
      { id: 'ann_rh1', icon: '🍯', title: 'סדר סימני ראש השנה', content: 'קידוש החג והסימנים יערכו בבית מיד לאחר תפילת ערבית.', active: true },
      { id: 'ann_rh2', icon: '📢', title: 'מכירת עליות ופתיחת ההיכל', content: 'הזכות לרכישת פתיחת ההיכל וספר תורה אצל גבאי בית הכנסת.', active: true },
    ]
  },
  {
    id: 'yom_kippur',
    name: 'יום הכיפורים',
    emoji: '⚖️',
    hebrewTitle: 'שבת שבתון · יום הכיפורים',
    subtitle: "לפני ה' תטהרו · יום סליחה ומחילה",
    isTwoDay: false,
    hasYizkor: true,
    hasBirkatCohanim: true,
    accentColor: '#3b82f6',
    defaultRows: [
      { id: 'yk_1', label: 'מנחה ערב יום כיפור', time: '13:30', visible: true },
      { id: 'yk_2', label: 'הדלקת נרות ותחילת הצום', time: '18:05', visible: true },
      { id: 'yk_3', label: 'תפילה זכה וכל נדרי', time: '18:20', visible: true },
      { id: 'yk_4', label: 'שחרית', time: '07:30', visible: true },
      { id: 'yk_5', label: 'סדר הזכרת נשמות (יזכור)', time: '10:30', visible: true },
      { id: 'yk_6', label: 'מוסף וברכת כהנים', time: '11:00', visible: true },
      { id: 'yk_7', label: 'הפסקה', time: '15:00', visible: true, isNote: true },
      { id: 'yk_8', label: 'מנחה וקריאת ספר יונה', time: '16:15', visible: true },
      { id: 'yk_9', label: 'תפילת נעילה', time: '17:35', visible: true },
      { id: 'yk_10', label: 'תקיעת שופר וצאת הצום', time: '19:08', visible: true },
      { id: 'yk_11', label: 'ערבית וקידוש לבנה', time: '19:15', visible: true },
    ],
    announcements: [
      { id: 'ann_yk1', icon: '🕯️', title: 'נר נשמה ויזכור', content: 'מומלץ להדליק נר נשמה בבית לפני כניסת החג עבור תפילת יזכור.', active: true },
      { id: 'ann_yk2', icon: '🤍', title: 'מנהגי יום כיפור', content: 'נעילת הסנדל, טלית כבר מכל נדרי, בגדי לבן.', active: true },
    ]
  },
  {
    id: 'sukkot',
    name: 'חג הסוכות',
    emoji: '🌿',
    hebrewTitle: 'חג הסוכות · זמן שמחתנו',
    subtitle: 'בסוכות תשבו שבעת ימים · פרי עץ הדר וכפות תמרים',
    isTwoDay: false,
    hasLulav: true,
    hasHoshanot: true,
    accentColor: '#10b981',
    defaultRows: [
      { id: 'suk_1', label: 'הדלקת נרות ומנחה', time: '18:10', visible: true },
      { id: 'suk_2', label: 'קבלת החג וערבית', time: '18:40', visible: true },
      { id: 'suk_3', label: 'שחרית ונטילת לולב', time: '08:00', visible: true },
      { id: 'suk_4', label: 'הלל שלם והושענות', time: '09:15', visible: true },
      { id: 'suk_5', label: 'תפילת מוסף', time: '09:45', visible: true },
      { id: 'suk_6', label: 'מנחה ושיעור בסוכה', time: '17:45', visible: true },
      { id: 'suk_7', label: 'מוצאי החג ומעריב', time: '19:05', visible: true },
    ],
    announcements: [
      { id: 'ann_suk1', icon: '🌿', title: 'בדיקת ארבעת המינים', content: 'רב בית הכנסת עומד לרשות המתפללים לבדיקת כשרות המינים.', active: true },
      { id: 'ann_suk2', icon: '🏕️', title: 'קידוש בסוכת בית הכנסת', content: 'מיד לאחר תפילת מוסף קידוש רבא בסוכה המרכזית.', active: true },
    ]
  },
  {
    id: 'simchat_torah',
    name: 'שמחת תורה',
    emoji: '📜',
    hebrewTitle: 'שמיני עצרת ושמחת תורה',
    subtitle: 'שישו ושמחו בשמחת תורה · פתחו לי שערי צדק',
    isTwoDay: false,
    hasYizkor: true,
    hasHakafot: true,
    hasGeshem: true,
    accentColor: '#8b5cf6',
    defaultRows: [
      { id: 'st_1', label: 'הדלקת נרות ומנחה', time: '18:05', visible: true },
      { id: 'st_2', label: 'ערבית והקפות ליל החג', time: '18:35', visible: true },
      { id: 'st_3', label: 'שחרית ומניין ותיקין', time: '06:30', visible: true },
      { id: 'st_4', label: 'שחרית מניין מרכזי', time: '08:00', visible: true },
      { id: 'st_5', label: 'סדר הקפות יום', time: '09:15', visible: true },
      { id: 'st_6', label: 'קריאת התורה ועליית כל הנערים', time: '10:30', visible: true },
      { id: 'st_7', label: 'עליית חתן תורה וחתן בראשית', time: '11:15', visible: true },
      { id: 'st_8', label: 'הזכרת נשמות (יזכור)', time: '11:45', visible: true },
      { id: 'st_9', label: 'תפילת גשם ומוסף', time: '12:00', visible: true },
      { id: 'st_10', label: 'מנחה וסעודת החג', time: '17:40', visible: true },
      { id: 'st_11', label: 'צאת החג, מעריב והקפות שניות', time: '19:02', visible: true },
    ],
    announcements: [
      { id: 'ann_st1', icon: '🍬', title: 'שקיות ממתקים לילדים', content: 'שקיות ממתקים ודגלים יחולקו לכל ילדי הקהילה בהקפות!', active: true },
      { id: 'ann_st2', icon: '🎺', title: 'הקפות שניות בליווי תזמורת', content: 'במוצאי החג בשעה 20:00 הקפות שניות חגיגיות עם תזמורת כלי זמר.', active: true },
    ]
  },
  {
    id: 'pesach',
    name: 'חג הפסח',
    emoji: '🍷',
    hebrewTitle: 'חג המצות · זמן חירותנו',
    subtitle: 'זכר ליציאת מצרים · בלילה הזה כולנו מסובין',
    isTwoDay: false,
    hasTal: true,
    accentColor: '#b45309',
    defaultRows: [
      { id: 'ps_1', label: 'סוף זמן אכילת חמץ (מג"א)', time: '09:55', visible: true },
      { id: 'ps_2', label: 'סוף זמן ביעור ושריפת חמץ', time: '11:10', visible: true },
      { id: 'ps_3', label: 'הדלקת נרות ומנחה', time: '18:40', visible: true },
      { id: 'ps_4', label: 'ערבית ליל הסדר', time: '19:15', visible: true },
      { id: 'ps_5', label: 'חצות ליל הסדר (אפיקומן)', time: '00:40', visible: true, isNote: true },
      { id: 'ps_6', label: 'שחרית החג', time: '08:30', visible: true },
      { id: 'ps_7', label: 'תפילת טל ומוסף', time: '10:30', visible: true },
      { id: 'ps_8', label: 'מנחה', time: '18:25', visible: true },
      { id: 'ps_9', label: 'צאת החג והבדלה', time: '19:35', visible: true },
    ],
    announcements: [
      { id: 'ann_ps1', icon: '🔥', title: 'מוקד שריפת חמץ', content: 'מוקד ביעור חמץ מרכזי יפעל ברחבת בית הכנסת עד השעה 11:00.', active: true },
      { id: 'ann_ps2', icon: '🍞', title: 'מכירת חמץ', content: 'ניתן להסדיר שטר מכירת חמץ אצל רב בית הכנסת עד ערב החג.', active: true },
    ]
  },
  {
    id: 'shavuot',
    name: 'חג השבועות',
    emoji: '🌾',
    hebrewTitle: 'חג השבועות · זמן מתן תורתנו',
    subtitle: 'וביום הביכורים בהקריבכם מנחה חדשה · כתר תורה',
    isTwoDay: false,
    hasYizkor: true,
    accentColor: '#059669',
    defaultRows: [
      { id: 'shv_1', label: 'הדלקת נרות ומנחה', time: '19:15', visible: true },
      { id: 'shv_2', label: 'קבלת החג וערבית', time: '19:50', visible: true },
      { id: 'shv_3', label: 'סדר תיקון ליל שבועות ושיעורים', time: '23:30', visible: true, isNote: true },
      { id: 'shv_4', label: 'מניין ותיקין בהנץ החמה', time: '04:55', visible: true },
      { id: 'shv_5', label: 'שחרית מניין מרכזי', time: '08:30', visible: true },
      { id: 'shv_6', label: 'קריאת עשרת הדיברות ואקדמות', time: '09:45', visible: true },
      { id: 'shv_7', label: 'הזכרת נשמות (יזכור)', time: '10:30', visible: true },
      { id: 'shv_8', label: 'מוסף', time: '11:00', visible: true },
      { id: 'shv_9', label: 'מנחה וקריאת מגילת רות', time: '18:45', visible: true },
      { id: 'shv_10', label: 'מוצאי החג ומעריב', time: '20:10', visible: true },
    ],
    announcements: [
      { id: 'ann_shv1', icon: '☕', title: 'כיבוד ושתייה חמה בליל החג', content: 'שתייה חמה ועוגות יעמדו לרשות הלומדים במשך כל הלילה.', active: true },
      { id: 'ann_shv2', icon: '🧀', title: 'קידוש חלבי מסורתי', content: 'קידוש חלבי עשיר יתקיים לאחר תפילת שחרית באולם האירועים.', active: true },
    ]
  },
  {
    id: 'purim',
    name: 'פורים',
    emoji: '🎭',
    hebrewTitle: 'ימי הפורים · ליהודים היתה אורה ושמחה',
    subtitle: 'משלוח מנות איש לרעהו ומתנות לאביונים',
    isTwoDay: false,
    accentColor: '#ec4899',
    defaultRows: [
      { id: 'pur_1', label: 'תענית אסתר ומנחה', time: '17:15', visible: true },
      { id: 'pur_2', label: 'צאת הצום וערבית', time: '18:15', visible: true },
      { id: 'pur_3', label: 'קריאת מגילה מניין ראשון', time: '18:45', visible: true },
      { id: 'pur_4', label: 'קריאת מגילה מניין שני', time: '20:15', visible: true },
      { id: 'pur_5', label: 'שחרית וקריאת מגילה ביום', time: '07:30', visible: true },
      { id: 'pur_6', label: 'קריאת מגילה לנשים', time: '10:30', visible: true },
      { id: 'pur_7', label: 'מנחה מוקדמת', time: '13:00', visible: true },
      { id: 'pur_8', label: 'סעודת פורים ומשתה', time: '15:30', visible: true, isNote: true },
      { id: 'pur_9', label: 'ערבית', time: '19:00', visible: true },
    ],
    announcements: [
      { id: 'ann_pur1', icon: '💰', title: 'מתנות לאביונים בו ביום', content: 'קרן הצדקה של בית הכנסת מחלקת תרומות לנזקקים בו ביום.', active: true },
      { id: 'ann_pur2', icon: '🪙', title: 'זכר למחצית השקל', content: 'קופות צדקה ומטבעות כסף יעמדו לתרומת מחצית השקל.', active: true },
    ]
  },
  {
    id: 'chanukah',
    name: 'חנוכה',
    emoji: '🕎',
    hebrewTitle: 'ימי האורים · חנוכה',
    subtitle: 'להודות ולהלל לשמך הגדול · על הנסים ועל הנפלאות',
    isTwoDay: false,
    accentColor: '#3b82f6',
    defaultRows: [
      { id: 'chn_1', label: 'שחרית והלל שלם', time: '07:30', visible: true },
      { id: 'chn_2', label: 'מנחה', time: '16:20', visible: true },
      { id: 'chn_3', label: 'הדלקת נרות בבית הכנסת וערבית', time: '16:50', visible: true },
    ],
    announcements: [
      { id: 'ann_chn1', icon: '🍩', title: 'הדלקת נרות מרכזית וסופגניות', content: 'בכל ערב תתקיים הדלקה חגיגית וחלוקת סופגניות חמות לילדים!', active: true },
    ]
  }
];

export function detectHolidayContext(shabbatInfo, zmanimA, zmanimB) {
  if (!shabbatInfo) return null;

  const special = shabbatInfo.specialShabbat || '';
  const parasha = shabbatInfo.parasha || '';
  const items = shabbatInfo.rawItems || [];

  let coincidingHoliday = null;
  let hasEruvTavshilin = false;
  let isTwoDay = false;
  let hasYizkor = false;
  let hasShofar = false;

  const textToSearch = `${special} ${parasha} ${items.map(i => i.title || i.hebrew || '').join(' ')}`;

  if (/Rosh Hashana|ראש השנה/i.test(textToSearch)) {
    coincidingHoliday = HOLIDAY_PRESETS.find(h => h.id === 'rosh_hashana');
    isTwoDay = true;
    hasShofar = !/שבת/i.test(special);
  } else if (/Yom Kippur|יום הכיפורים|יום כיפור/i.test(textToSearch)) {
    coincidingHoliday = HOLIDAY_PRESETS.find(h => h.id === 'yom_kippur');
    hasYizkor = true;
  } else if (/Simchat Torah|שמחת תורה|Shmini Atzeret|שמיני עצרת/i.test(textToSearch)) {
    coincidingHoliday = HOLIDAY_PRESETS.find(h => h.id === 'simchat_torah');
    hasYizkor = true;
  } else if (/Sukkot|סוכות/i.test(textToSearch)) {
    coincidingHoliday = HOLIDAY_PRESETS.find(h => h.id === 'sukkot');
  } else if (/Pesach|פסח/i.test(textToSearch)) {
    coincidingHoliday = HOLIDAY_PRESETS.find(h => h.id === 'pesach');
    if (/שביעי|Yizkor|יזכור/i.test(textToSearch)) hasYizkor = true;
  } else if (/Shavuot|שבועות/i.test(textToSearch)) {
    coincidingHoliday = HOLIDAY_PRESETS.find(h => h.id === 'shavuot');
    hasYizkor = true;
  }

  const fridayDate = zmanimA?.date || '';
  if (fridayDate) {
    const dow = new Date(fridayDate).getDay();
    if (coincidingHoliday && (dow === 4 || dow === 5)) {
      hasEruvTavshilin = true;
    }
  }

  return {
    isCoinciding: !!coincidingHoliday,
    holiday: coincidingHoliday,
    hasEruvTavshilin,
    isTwoDay,
    hasYizkor,
    hasShofar,
    summaryNotice: coincidingHoliday 
      ? `💡 שבת זו חלה ב${coincidingHoliday.name}! המערכת מציעה מודעה מאוחדת עם זמני החג והשבת.`
      : null
  };
}
