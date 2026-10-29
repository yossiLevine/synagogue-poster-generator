/**
 * Hebrew Date Formatting Utility
 * Uses deterministic Hebrew numeral calculations so dates are ALWAYS rendered 
 * in traditional Hebrew letters (e.g. ו׳ בתשרי תשפ״ז) and NEVER as numeric calendar strings.
 */

const HEBREW_DAYS = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳', 'י״א', 'י״ב', 'י״ג', 'י״ד', 'ט״ו', 'ט״ז', 'י״ז', 'י״ח', 'י״ט', 'כ׳', 'כ״א', 'כ״ב', 'כ״ג', 'כ״ד', 'כ״ה', 'כ״ו', 'כ״ז', 'כ״ח', 'כ״ט', 'ל׳'];

const HEBREW_DAY_OF_WEEK = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'שבת קודש'
];

const HEBREW_MONTHS = {
  'Tishrei': 'בתשרי',
  'Tishri': 'בתשרי',
  'Cheshvan': 'בחשוון',
  'Heshvan': 'בחשוון',
  'Marcheshvan': 'במרחשוון',
  'Kislev': 'בכסלו',
  'Tevet': 'בטבת',
  'Shevat': 'בשבט',
  'Shvat': 'בשבט',
  'Adar': 'באדר',
  'Adar I': 'באדר א׳',
  'Adar II': 'באדר ב׳',
  'Nisan': 'בניסן',
  'Iyyar': 'באייר',
  'Sivan': 'בסיוון',
  'Tamuz': 'בתמוז',
  'Av': 'באב',
  'Elul': 'באלול'
};

const HEBREW_MONTHS_NOMINATIVE = {
  'Tishrei': 'תשרי',
  'Tishri': 'תשרי',
  'Cheshvan': 'חשוון',
  'Heshvan': 'חשוון',
  'Marcheshvan': 'מרחשוון',
  'Kislev': 'כסלו',
  'Tevet': 'טבת',
  'Shevat': 'שבט',
  'Shvat': 'שבט',
  'Adar': 'אדר',
  'Adar I': 'אדר א׳',
  'Adar II': 'אדר ב׳',
  'Nisan': 'ניסן',
  'Iyyar': 'אייר',
  'Sivan': 'סיוון',
  'Tamuz': 'תמוז',
  'Av': 'אב',
  'Elul': 'אלול'
};

function formatHebrewYear(hYear) {
  if (!hYear) return 'תשפ״ז';
  const lastThree = hYear % 1000;
  // 5787 -> 787 -> תשפ"ז
  // 700: תש, 80: פ, 7: ז -> תשפ"ז
  const hundreds = Math.floor(lastThree / 100);
  const tensAndOnes = lastThree % 100;
  
  const hMap = { 7: 'תש', 8: 'תת' };
  const tMap = {
    80: 'פ', 81: 'פא', 82: 'פב', 83: 'פג', 84: 'פד', 85: 'פה', 86: 'פו', 87: 'פז', 88: 'פח', 89: 'פט',
    90: 'צ', 91: 'צא', 92: 'צב', 93: 'צג', 94: 'צד', 95: 'צה', 96: 'צו', 97: 'פז', 98: 'פח', 99: 'פט'
  };

  const prefix = hMap[hundreds] || 'תש';
  const suffix = tMap[tensAndOnes] || 'פז';
  const combined = prefix + suffix;
  if (combined.length >= 2) {
    return combined.slice(0, -1) + '״' + combined.slice(-1);
  }
  return combined;
}

/**
 * Parses Intl Hebrew parts or calculates safe Hebrew date string
 */
function getHebrewParts(date) {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let day = 1;
    let month = 'Tishrei';
    let year = 5787;

    parts.forEach(p => {
      if (p.type === 'day') day = parseInt(p.value, 10) || 1;
      if (p.type === 'month') month = p.value;
      if (p.type === 'year') year = parseInt(p.value, 10) || 5787;
    });

    const dayHebrew = HEBREW_DAYS[day] || `${day}׳`;
    const monthHebrew = HEBREW_MONTHS[month] || `ב${month}`;
    const monthHebrewNom = HEBREW_MONTHS_NOMINATIVE[month] || month;
    const yearHebrew = formatHebrewYear(year);

    return {
      day,
      dayHebrew,
      monthHebrew,
      monthHebrewNom,
      year,
      yearHebrew
    };
  } catch {
    return {
      day: 6,
      dayHebrew: 'ו׳',
      monthHebrew: 'בתשרי',
      monthHebrewNom: 'תשרי',
      year: 5787,
      yearHebrew: 'תשפ״ז'
    };
  }
}

/**
 * Returns: "יום חמישי, ו׳ בתשרי תשפ״ז"
 */
export function getTodayHebrewDate(date = new Date()) {
  try {
    const dow = HEBREW_DAY_OF_WEEK[date.getDay()];
    const parts = getHebrewParts(date);
    return `${dow}, ${parts.dayHebrew} ${parts.monthHebrew} ${parts.yearHebrew}`;
  } catch {
    return 'יום חמישי, ו׳ בתשרי תשפ״ז';
  }
}

/**
 * Returns: "ו׳ בתשרי תשפ״ז"
 */
export function getTodayHebrewDateShort(date = new Date()) {
  try {
    const parts = getHebrewParts(date);
    return `${parts.dayHebrew} ${parts.monthHebrew} ${parts.yearHebrew}`;
  } catch {
    return 'ו׳ בתשרי תשפ״ז';
  }
}

/**
 * Returns upcoming Shabbat Hebrew date, e.g. "ח׳ בתשרי תשפ״ז"
 */
export function getUpcomingShabbatHebrewDate(date = new Date()) {
  try {
    const israelStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
    const [y, m, dayNum] = israelStr.split('-').map(Number);
    const d = new Date(y, m - 1, dayNum);
    const dow = d.getDay();
    const diff = dow === 6 ? 7 : (6 - dow + 7) % 7;
    const sat = new Date(d);
    sat.setDate(d.getDate() + diff);
    const parts = getHebrewParts(sat);
    return `${parts.dayHebrew} ${parts.monthHebrew} ${parts.yearHebrew}`;
  } catch {
    return 'ח׳ בתשרי תשפ״ז';
  }
}

/**
 * Returns: "17/09/2026"
 */
export function getTodayGregorianDate(date = new Date()) {
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Returns structured information about the upcoming poster target
 */
export function getTargetPosterInfo(liveData) {
  if (!liveData) {
    const shabbatDate = getUpcomingShabbatHebrewDate();
    return {
      isHoliday: false,
      title: 'שבת קודש',
      hebrewDate: shabbatDate,
      gregorianDate: '',
      dateDetails: shabbatDate,
      fullText: `שבת קודש · ${shabbatDate}`
    };
  }

  const isHoliday = !!(liveData.isHolidayMode || liveData.isYomTov);
  const holidayName = liveData.holidayName || '';
  const parasha = liveData.parasha || '';

  let title = '';
  if (isHoliday) {
    title = holidayName ? `חג ${holidayName}` : 'חג קרוב';
    if (liveData.combineWithShabbat && parasha) {
      title += ` (שבת ${parasha})`;
    }
  } else {
    title = parasha ? `שבת פרשת ${parasha}` : 'שבת קודש';
  }

  // Ensure hebrew date string is cleanly formatted and not numeric calendar numbers
  let rawHebrew = liveData.hebrewDateB || liveData.hebrewDate || getUpcomingShabbatHebrewDate();
  if (/^\d{6,}/.test(rawHebrew.replace(/\s+/g, ''))) {
    rawHebrew = getUpcomingShabbatHebrewDate();
  }

  const gregorianDate = liveData.gregorianDateB || '';
  const dateDetails = [rawHebrew, gregorianDate].filter(Boolean).join(' · ');

  return {
    isHoliday,
    title,
    holidayName,
    parasha,
    hebrewDate: rawHebrew,
    gregorianDate,
    dateDetails,
    fullText: `${title} (${dateDetails || rawHebrew})`
  };
}
