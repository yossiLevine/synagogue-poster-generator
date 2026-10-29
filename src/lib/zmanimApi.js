import { getConfig, PRESET_HORIZONS } from './synagogueConfig.js';
import { fetchItimZmanimTwoDays } from './itimLeBinaApi.js';
import { resolveHaftarah } from './haftarot.js';
const TIMEZONE = 'Asia/Jerusalem';

function parseMolad(raw) {
  if (!raw) return '';
  let dayStr = '';
  const dayMatch = raw.match(/יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/);
  if (dayMatch) dayStr = `יום ${dayMatch[1]}`;
  const timeMatch = raw.match(/(\d{1,2}:\d{2})/);
  if (!timeMatch) return dayStr || '';
  let result = (dayStr ? dayStr + ' בשעה ' : '') + timeMatch[1];
  const chalakimMatch = raw.match(/(\d+)\s*(?:חלקים?|chalakim)/i);
  if (chalakimMatch) result += ` ו-${chalakimMatch[1]} חלקים`;
  return result;
}

export async function fetchZmanim(date) {
  const cfg = getConfig();
  const dateStr = date || new Date().toISOString().split('T')[0];
  const url = `https://www.hebcal.com/zmanim?cfg=json&latitude=${cfg.lat}&longitude=${cfg.lng}&tzid=${TIMEZONE}&date=${dateStr}`;
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`API responded with ${res.status}`);
    const data = await res.json();
    return data.times || {};
  } catch (e) {
    console.error('Zmanim fetch error:', e);
    return {};
  }
}

const MONTH_EN_TO_HE = {
  'Nisan': 'ניסן', 'Iyyar': 'אייר', 'Sivan': 'סיוון', 'Tamuz': 'תמוז',
  'Av': 'אב', 'Elul': 'אלול', 'Tishrei': 'תשרי', 'Cheshvan': 'חשוון',
  'Kislev': 'כסלו', 'Tevet': 'טבת', 'Shvat': 'שבט', 'Adar': 'אדר',
  'Adar I': 'אדר א׳', 'Adar II': 'אדר ב׳',
};

const HEBREW_NUMS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל'];

function buildHebrewDate(data) {
  if (!data) return '';
  const hebrewFull = data.hebrew;
  if (hebrewFull) return hebrewFull;
  const day = data.hd;
  const monthEn = data.hm;
  if (!day || !monthEn) return '';
  const dayStr = HEBREW_NUMS[day] || String(day);
  const monthHe = MONTH_EN_TO_HE[monthEn] || monthEn;
  return `${dayStr} ${monthHe}`.trim();
}

function hebrewDateUrl(d) {
  const dt = new Date(d + 'T12:00:00');
  return `https://www.hebcal.com/converter?cfg=json&gy=${dt.getFullYear()}&gm=${dt.getMonth()+1}&gd=${dt.getDate()}&g2h=1`;
}

export async function fetchZmanimTwoDays(dateA, dateB) {
  const cfg = getConfig();
  const fetchWithTimeout = (url) => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(tid));
  };

  // Hebrew dates from Hebcal converter (always accurate for Hebrew calendar dates)
  const fetchHebrewDates = async () => {
    try {
      const [resHdA, resHdB] = await Promise.all([
        fetchWithTimeout(hebrewDateUrl(dateA)),
        fetchWithTimeout(hebrewDateUrl(dateB)),
      ]);
      const [hdA, hdB] = await Promise.all([resHdA.json(), resHdB.json()]);
      return { hebrewDateA: buildHebrewDate(hdA), hebrewDateB: buildHebrewDate(hdB) };
    } catch {
      return { hebrewDateA: '', hebrewDateB: '' };
    }
  };

  // 1. Primary: Fetch from official Luach Itim LeBina
  try {
    const cityName = cfg.cityName || cfg.horizonName || 'ירושלים';
    const [itimData, hd] = await Promise.all([
      fetchItimZmanimTwoDays(dateA, dateB, cityName, cfg.lat, cfg.lng),
      fetchHebrewDates(),
    ]);

    if (itimData && itimData.timesA && itimData.timesB) {
      return {
        zmanimA: itimData.timesA,
        zmanimB: itimData.timesB,
        hebrewDateA: hd.hebrewDateA,
        hebrewDateB: hd.hebrewDateB,
        zmanimSource: 'לוח עתים לבינה',
        itimLocation: itimData.location,
      };
    }
  } catch (err) {
    console.warn('[Zmanim] Itim LeBina fetch failed, falling back to Hebcal:', err);
  }

  // 2. Fallback: Hebcal /zmanim
  const toZmanimUrl = (d) => `https://www.hebcal.com/zmanim?cfg=json&latitude=${cfg.lat}&longitude=${cfg.lng}&tzid=${TIMEZONE}&date=${d}`;
  try {
    const [resA, resB, hd] = await Promise.all([
      fetchWithTimeout(toZmanimUrl(dateA)),
      fetchWithTimeout(toZmanimUrl(dateB)),
      fetchHebrewDates(),
    ]);
    if (!resA.ok || !resB.ok) throw new Error('Hebcal API failed');
    const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
    return {
      zmanimA: dataA.times || {},
      zmanimB: dataB.times || {},
      hebrewDateA: hd.hebrewDateA,
      hebrewDateB: hd.hebrewDateB,
      zmanimSource: 'Hebcal (גיבוי)',
    };
  } catch (e) {
    console.error('Zmanim two days fallback fetch error:', e);
    return { zmanimA: {}, zmanimB: {}, hebrewDateA: '', hebrewDateB: '' };
  }
}

export function getNextFriday() {
  // Use local Israel date, not UTC
  const now = new Date();
  const israelStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const [y, m, day] = israelStr.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  const dow = d.getDay(); // 0=Sun, 5=Fri, 6=Sat
  let diff;
  if (dow === 5) {
    // On Friday, target today's Friday (upcoming Shabbat)
    diff = 0;
  } else if (dow === 6) {
    // On Saturday, roll over to next Friday (+6 days)
    diff = 6;
  } else {
    diff = 5 - dow;
  }
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function addDays(dateStr, n) {
  const [y, m, day] = dateStr.split('-').map(Number);
  const d = new Date(y, m - 1, day + n, 12, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * Format an ISO datetime string to HH:MM in Israel time.
 * roundDir: 'down' = floor to minute, 'up' = ceil to minute, undefined = no rounding
 */
export function formatTime(isoString, roundDir) {
  if (!isoString) return '';
  let ms = new Date(isoString).getTime();
  if (roundDir === 'down') {
    ms = Math.floor(ms / 60000) * 60000;
  } else if (roundDir === 'up') {
    ms = Math.ceil(ms / 60000) * 60000;
  }
  return new Date(ms).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIMEZONE });
}

/**
 * Apply an offset (in minutes) to an ISO string and return HH:MM in Israel time.
 * roundDir: 'down' | 'up' | undefined
 */
export function applyOffset(isoString, offsetMinutes, roundDir) {
  if (!isoString) return '';
  const ms = new Date(isoString).getTime() + (offsetMinutes || 0) * 60000;
  return formatTime(new Date(ms).toISOString(), roundDir);
}

export async function fetchShabbatInfo(date) {
  const cfg = getConfig();
  const preset = PRESET_HORIZONS.find(p => p.name === cfg.horizonName);
  const b = preset?.candleOffset || 20;

  const params = new URLSearchParams({
    cfg: 'json',
    latitude: cfg.lat,
    longitude: cfg.lng,
    tzid: TIMEZONE,
    M: 'on',
    b: b.toString(),
    lg: 'he',
  });
  if (date) {
    const d = new Date(date + 'T12:00:00');
    params.set('gy', d.getFullYear());
    params.set('gm', d.getMonth() + 1);
    params.set('gd', d.getDate());
  }
  const url = `https://www.hebcal.com/shabbat?${params.toString()}`;
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`API responded with ${res.status}`);
    const data = await res.json();

    let parasha = '', haftarah = '', rawHaftarah = '', candleLighting = '', havdalah = '', hebrewDate = '', candleLightingIso = '', molad = '';
    let isRoshChodesh = false;
    let specialShabbat = '';

    const SPECIAL_SHABBAT_MAP = {
      'Shabbat Zachor': 'שבת זכור',
      'Shabbat Shekalim': 'שבת שקלים',
      'Shabbat Parah': 'שבת פרה',
      'Shabbat HaChodesh': 'שבת החודש',
      'Shabbat HaGadol': 'שבת הגדול',
      'Shabbat Nachamu': 'שבת נחמו',
      'Shabbat Shuva': 'שבת שובה',
      'Shabbat Shira': 'שבת שירה',
      'Shabbat Rosh Chodesh': 'שבת ראש חודש',
      'Shabbat Machar Chodesh': 'שבת מחר חודש',
      'Shabbat Chazon': 'שבת חזון',
      'Shabbat Mevarchim': 'שבת מברכים',
    };

    for (const item of data.items || []) {
      if (item.category === 'parashat') {
        let raw = item.hebrew || item.title || '';
        parasha = raw.replace(/^פרשת\s+/, '').replace(/^Parashat\s+/i, '').trim();
        hebrewDate = item.hdate || '';
        if (item.leyning?.haftarah) {
          rawHaftarah = item.leyning.haftarah;
        } else if (item.leyning?.haftarah_sephardic) {
          rawHaftarah = item.leyning.haftarah_sephardic;
        }
        if (item.memo) {
          const haftMatch = item.memo.match(/הפטרה[:\s]+([^\n.]+)/i);
          if (haftMatch) haftarah = haftMatch[1].trim();
        }
      }
      if (item.category === 'haftara' || item.category === 'haftarah') {
        haftarah = item.hebrew || item.title || '';
      }
      if (item.category === 'candles') {
        candleLightingIso = item.date || '';
        candleLighting = item.date ? formatTime(item.date, 'down') : '';
      }
      if (item.category === 'havdalah') {
        havdalah = item.date ? formatTime(item.date, 'up') : '';
      }
      if (item.category === 'molad') {
        molad = parseMolad(item.hebrew || item.title || item.memo || '');
      }
      if (!molad && item.memo && item.memo.includes('מולד')) {
        molad = parseMolad(item.memo);
      }
      if (item.category === 'roshchodesh') {
        isRoshChodesh = true;
      }
      if (item.category === 'holiday' || item.category === 'parashat' || item.category === 'mevarchim') {
        if (!specialShabbat) {
          const title = item.title || '';
          for (const [en, he] of Object.entries(SPECIAL_SHABBAT_MAP)) {
            if (title.includes(en)) { specialShabbat = he; break; }
          }
          if (!specialShabbat && item.hebrew) {
            for (const he of Object.values(SPECIAL_SHABBAT_MAP)) {
              if (item.hebrew.includes(he)) { specialShabbat = he; break; }
            }
          }
        }
      }
    }

    if (molad && !specialShabbat && !isRoshChodesh) {
      specialShabbat = 'שבת מברכים';
    }

    // Resolve accurate Hebrew Haftarah
    if (!haftarah || /^[A-Za-z]/.test(haftarah)) {
      haftarah = resolveHaftarah({ parasha, specialShabbat, rawHaftarah });
    }

    // Enrich candle lighting and havdalah from official Luach Itim LeBina
    let zmanimSource = 'Hebcal';
    try {
      const fridayStr = date || getNextFriday();
      const shabbatStr = addDays(fridayStr, 1);
      const itimData = await fetchItimZmanimTwoDays(fridayStr, shabbatStr, cfg.cityName || cfg.horizonName, cfg.lat, cfg.lng);
      if (itimData) {
        if (itimData.timesA?.candleLighting) {
          candleLightingIso = itimData.timesA.candleLighting;
          candleLighting = formatTime(candleLightingIso, 'down');
        }
        const motzei = itimData.timesB?.tzeit7083deg || itimData.timesB?.tzeit85deg;
        if (motzei) {
          havdalah = formatTime(motzei, 'up');
        }
        zmanimSource = 'לוח עתים לבינה';
      }
    } catch (err) {
      console.warn('[fetchShabbatInfo] Itim LeBina enrichment error:', err);
    }

    return { parasha, haftarah, candleLighting, candleLightingIso, havdalah, hebrewDate, molad, isRoshChodesh, specialShabbat, zmanimSource };
  } catch (e) {
    console.error('Shabbat info fetch error:', e);
    return {
      parasha: '', haftarah: '', candleLighting: '', candleLightingIso: '',
      havdalah: '', hebrewDate: '', molad: '', isRoshChodesh: false, specialShabbat: ''
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all Zmanim definitions
// source: 'timesA' = /zmanim API for Friday (day A)
//         'timesB' = /zmanim API for Shabbat (day B)
// apiKey: the actual field name returned by Hebcal /zmanim API
// ─────────────────────────────────────────────────────────────────────────────
export const ZMANIM_META = {
  // ── שישי (timesA) ──
  alotHaShachar:       { label: 'עלות השחר',              source: 'timesA', day: 'friday',  apiKey: 'alotHaShachar',  round: 'up'   },
  misheyakir:          { label: 'משיכיר',                  source: 'timesA', day: 'friday',  apiKey: 'misheyakir',     round: 'up'   },
  sunrise:             { label: 'הנץ החמה',                source: 'timesA', day: 'friday',  apiKey: 'sunrise',        round: 'up'   },
  sofZmanShma:         { label: 'סוף זמן ק"ש (גר"א)',      source: 'timesA', day: 'friday',  apiKey: 'sofZmanShma',    round: 'down' },
  sofZmanShmaMGA:      { label: 'סוף זמן ק"ש (מג"א)',      source: 'timesA', day: 'friday',  apiKey: 'sofZmanShmaMGA', round: 'down' },
  sofZmanTfilla:       { label: 'סוף זמן תפילה (גר"א)',    source: 'timesA', day: 'friday',  apiKey: 'sofZmanTfilla',  round: 'down' },
  sofZmanTfillaMGA:    { label: 'סוף זמן תפילה (מג"א)',    source: 'timesA', day: 'friday',  apiKey: 'sofZmanTfillaMGA',round: 'down' },
  chatzot:             { label: 'חצות היום',               source: 'timesA', day: 'friday',  apiKey: 'chatzot',        round: 'nearest' },
  minchaGedola:        { label: 'מנחה גדולה',              source: 'timesA', day: 'friday',  apiKey: 'minchaGedola',   round: 'up'   },
  minchaKetana:        { label: 'מנחה קטנה',               source: 'timesA', day: 'friday',  apiKey: 'minchaKetana',   round: 'up'   },
  plagHaMincha:        { label: 'פלג המנחה',               source: 'timesA', day: 'friday',  apiKey: 'plagHaMincha',   round: 'down' }, // down for kabbalat shabbat
  candleLighting:      { label: 'הדלקת נרות',              source: 'timesA', day: 'friday',  apiKey: 'candleLighting', round: 'down' },
  sunset:              { label: 'שקיעה',                   source: 'timesA', day: 'friday',  apiKey: 'sunset',         round: 'down' }, // strictly earlier
  tzeitFriday7083deg:  { label: 'צאת כוכבים 7.083° (שישי)',source: 'timesA', day: 'friday',  apiKey: 'tzeit7083deg',   round: 'up'   },
  tzeitFriday85deg:    { label: 'צאת כוכבים 8.5° (שישי)', source: 'timesA', day: 'friday',  apiKey: 'tzeit85deg',     round: 'up'   },
  // ── שבת (timesB) ──
  sunriseShabbat:      { label: 'הנץ החמה',                source: 'timesB', day: 'shabbat', apiKey: 'sunrise',        round: 'up'   },
  sofZmanShmaShabbat:  { label: 'סוף זמן ק"ש (גר"א)',      source: 'timesB', day: 'shabbat', apiKey: 'sofZmanShma',    round: 'down' },
  sofZmanShmaMGAShabbat:{label: 'סוף זמן ק"ש (מג"א)',      source: 'timesB', day: 'shabbat', apiKey: 'sofZmanShmaMGA', round: 'down' },
  sofZmanTfillaShabbat:{ label: 'סוף זמן תפילה (גר"א)',    source: 'timesB', day: 'shabbat', apiKey: 'sofZmanTfilla',  round: 'down' },
  sofZmanTfillaMGAShabbat:{label:'סוף זמן תפילה (מג"א)',   source: 'timesB', day: 'shabbat', apiKey: 'sofZmanTfillaMGA',round: 'down' },
  chatzotShabbat:      { label: 'חצות היום',               source: 'timesB', day: 'shabbat', apiKey: 'chatzot',        round: 'nearest' },
  minchaGedolaShabbat: { label: 'מנחה גדולה',              source: 'timesB', day: 'shabbat', apiKey: 'minchaGedola',   round: 'up'   },
  minchaKetanaShabbat: { label: 'מנחה קטנה',               source: 'timesB', day: 'shabbat', apiKey: 'minchaKetana',   round: 'up'   },
  plagHaMinchaShabbat: { label: 'פלג המנחה',               source: 'timesB', day: 'shabbat', apiKey: 'plagHaMincha',   round: 'down' },
  sunsetShabbat:       { label: 'שקיעה',                   source: 'timesB', day: 'shabbat', apiKey: 'sunset',         round: 'down' },
  tzeit7083deg:        { label: 'צאת שבת (7.083°)',         source: 'timesB', day: 'shabbat', apiKey: 'tzeit7083deg',   round: 'up'   },
  tzeit85deg:          { label: 'צאת שבת (8.5°)',           source: 'timesB', day: 'shabbat', apiKey: 'tzeit85deg',     round: 'up'   },
  tzeit72min:          { label: 'צאת שבת ר"ת (72 דק\')',   source: 'timesB', day: 'shabbat', apiKey: 'tzeit72min',     round: 'up'   },
};

/**
 * Resolve the ISO string for a given zman key from the raw API data.
 * timesA = result for Friday, timesB = result for Shabbat.
 */
export function resolveZmanIso(key, timesA, timesB) {
  const meta = ZMANIM_META[key];
  if (!meta) return null;
  if (key === 'candleLighting') return (timesA && timesA.candleLighting) || null;
  const source = meta.source === 'timesB' ? (timesB || {}) : (timesA || {});
  if (source[meta.apiKey]) return source[meta.apiKey];
  if (key === 'tzeit72min' && source.sunset) {
    const ms = new Date(source.sunset).getTime() + 72 * 60000;
    return new Date(ms).toISOString();
  }
  return null;
}

/**
 * Build the display list for the poster.
 * Supports manual overrides: overrides = { [key]: 'HH:MM' }
 */
export function buildZmanimForDisplay(timesA, shabbatInfo, selectedKeys, timesB = null, overrides = {}) {
  return selectedKeys
    .map(key => {
      const meta = ZMANIM_META[key];
      if (!meta) return null;
      // Manual override takes precedence
      if (overrides[key]) {
        return { key, label: meta.label, time: overrides[key], day: meta.day, isOverride: true };
      }
      // candleLighting from timesA or shabbatInfo
      if (key === 'candleLighting') {
        const iso = timesA?.candleLighting || shabbatInfo?.candleLightingIso;
        if (iso) return { key, label: meta.label, time: formatTime(iso, 'down'), day: meta.day };
        const time = shabbatInfo?.candleLighting;
        if (!time) return null;
        return { key, label: meta.label, time, day: meta.day };
      }
      const iso = resolveZmanIso(key, timesA, timesB);
      if (!iso) return null;
      const roundDir = meta.round || (meta.day === 'friday' ? 'down' : 'up');
      return { key, label: meta.label, time: formatTime(iso, roundDir), day: meta.day };
    })
    .filter(Boolean);
}