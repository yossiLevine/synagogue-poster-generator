/**
 * Public API endpoint to fetch prayer times for the synagogue.
 * GET params: date (YYYY-MM-DD), dateB (YYYY-MM-DD, optional - defaults to date+1)
 * Returns: { parasha, candleLighting, havdalah, molad, isRoshChodesh, specialShabbat, hebrewDateA, hebrewDateB, zmanim }
 */

const TIMEZONE = 'Asia/Jerusalem';
// Default location — Beer Sheva (configurable via env vars)
const DEFAULT_LAT = parseFloat(Deno.env.get('SYNAGOGUE_LAT') || '31.252973');
const DEFAULT_LNG = parseFloat(Deno.env.get('SYNAGOGUE_LNG') || '34.791462');

function getNextFriday() {
  const d = new Date();
  const day = d.getDay();
  let diff = day === 5 ? 0 : day === 6 ? 6 : 5 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIMEZONE });
}

function parseMolad(raw) {
  if (!raw) return '';
  const dayMatch = raw.match(/יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/);
  const timeMatch = raw.match(/(\d{1,2}:\d{2})/);
  const chalakimMatch = raw.match(/(\d+)\s*(?:חלקים?|chalakim)/i);
  let result = '';
  if (dayMatch) result += `יום ${dayMatch[1]} `;
  if (timeMatch) result += timeMatch[1];
  if (chalakimMatch) result += ` ו-${chalakimMatch[1]} חלקים`;
  return result.trim();
}

const SPECIAL_SHABBAT_MAP = {
  'Shabbat Zachor': 'שבת זכור', 'Shabbat Shekalim': 'שבת שקלים',
  'Shabbat Parah': 'שבת פרה', 'Shabbat HaChodesh': 'שבת החודש',
  'Shabbat HaGadol': 'שבת הגדול', 'Shabbat Nachamu': 'שבת נחמו',
  'Shabbat Shuva': 'שבת שובה', 'Shabbat Shira': 'שבת שירה',
  'Shabbat Machar Chodesh': 'שבת מחר חודש', 'Shabbat Chazon': 'שבת חזון',
  'Shabbat Mevarchim': 'שבת מברכים',
};

Deno.serve(async (req) => {
  // CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (req.method === 'OPTIONS') return new Response('', { headers });

  try {
    const body = req.method === 'POST' ? await req.json() : {};
    const url = new URL(req.url);
    const dateA = body.date || url.searchParams.get('date') || getNextFriday();
    const dateB = body.dateB || url.searchParams.get('dateB') || addDays(dateA, 1);
    const lat = parseFloat(body.lat || url.searchParams.get('lat') || DEFAULT_LAT);
    const lng = parseFloat(body.lng || url.searchParams.get('lng') || DEFAULT_LNG);

    const zmanimUrl = (d) => `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lng}&tzid=${TIMEZONE}&date=${d}`;
    const shabbatUrl = () => {
      const d = new Date(dateA);
      return `https://www.hebcal.com/shabbat?cfg=json&latitude=${lat}&longitude=${lng}&tzid=${TIMEZONE}&M=on&lg=he&gy=${d.getFullYear()}&gm=${d.getMonth()+1}&gd=${d.getDate()}`;
    };
    const hebrewUrl = (d) => {
      const dt = new Date(d + 'T12:00:00');
      return `https://www.hebcal.com/converter?cfg=json&gy=${dt.getFullYear()}&gm=${dt.getMonth()+1}&gd=${dt.getDate()}&g2h=1`;
    };

    const [resZA, resZB, resSh, resHdA, resHdB] = await Promise.all([
      fetch(zmanimUrl(dateA)), fetch(zmanimUrl(dateB)),
      fetch(shabbatUrl()),
      fetch(hebrewUrl(dateA)), fetch(hebrewUrl(dateB)),
    ]);
    const [zA, zB, shData, hdA, hdB] = await Promise.all([
      resZA.json(), resZB.json(), resSh.json(), resHdA.json(), resHdB.json(),
    ]);

    // Parse shabbat info
    let parasha = '', candleLighting = '', havdalah = '', molad = '', specialShabbat = '';
    let isRoshChodesh = false;
    for (const item of shData.items || []) {
      if (item.category === 'parashat') parasha = item.hebrew || item.title || '';
      if (item.category === 'candles') candleLighting = item.date ? formatTime(item.date) : '';
      if (item.category === 'havdalah') havdalah = item.date ? formatTime(item.date) : '';
      if (item.category === 'molad') molad = parseMolad(item.hebrew || item.title || '');
      if (item.category === 'roshchodesh') isRoshChodesh = true;
      if (item.category === 'holiday' || item.category === 'parashat') {
        for (const [en, he] of Object.entries(SPECIAL_SHABBAT_MAP)) {
          if ((item.title || '').includes(en)) { specialShabbat = he; break; }
        }
      }
    }
    if (molad && !specialShabbat && !isRoshChodesh) specialShabbat = 'שבת מברכים';

    // Format key zmanim
    const zmanimFormatted = {};
    const keys = ['alotHaShachar', 'sunrise', 'sofZmanShma', 'sofZmanShmaMGA', 'chatzot', 'minchaGedola', 'minchaKetana', 'plagHaMincha', 'sunset', 'tzeit7083deg'];
    for (const k of keys) {
      if (zA.times?.[k]) zmanimFormatted[k] = formatTime(zA.times[k]);
    }

    return new Response(JSON.stringify({
      date: dateA,
      dateB,
      parasha,
      candleLighting,
      havdalah,
      molad,
      isRoshChodesh,
      specialShabbat,
      hebrewDateA: hdA.hebrew || '',
      hebrewDateB: hdB.hebrew || '',
      zmanim: zmanimFormatted,
      zmanimRaw: zA.times || {},
    }), { headers });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
  }
});