import itimLocations from './itimLocations.json';

/**
 * Find the closest Itim LeBina location by city name or geographic coordinates.
 * @param {string} cityName - Name of the city/settlement
 * @param {number} [lat] - Optional latitude
 * @param {number} [lng] - Optional longitude
 * @returns {object} The matched location object from Itim LeBina
 */
export function findItimLocation(cityName, lat, lng) {
  if (cityName && typeof cityName === 'string') {
    const clean = cityName.trim();
    // 1. Exact match
    let found = itimLocations.find(l => l.name === clean);
    if (found) return found;

    // 2. Substring match
    found = itimLocations.find(l => l.name.includes(clean) || clean.includes(l.name));
    if (found) return found;

    // 3. Known aliases
    const aliases = {
      'ירושלים': ['ירושלים', 'ציון'],
      'מיצד': ['מיצד', 'מצד', 'אספר'],
      'ביתר': ['ביתר', 'ביתר עילית'],
      'מודיעין עילית': ['מודיעין עילית', 'קרית ספר', 'ברכפלד'],
      'בני ברק': ['בני ברק'],
      'תל אביב': ['תל אביב', 'תל אביב - יפו'],
      'חיפה': ['חיפה', 'חיפה עילית'],
      'אשדוד': ['אשדוד'],
      'פתח תקווה': ['פתח תקוה', 'פתח תקווה'],
      'נתניה': ['נתניה'],
      'אלעד': ['אלעד'],
      'צפת': ['צפת', 'צפת חזו"א'],
      'טבריה': ['טבריה'],
      'באר שבע': ['באר שבע'],
    };

    for (const [canonical, words] of Object.entries(aliases)) {
      if (words.some(w => clean.includes(w) || w.includes(clean))) {
        const aliasMatch = itimLocations.find(l => l.name === canonical);
        if (aliasMatch) return aliasMatch;
      }
    }
  }

  // If coordinates provided, find closest geographic location
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    let closest = null;
    let minDist = Infinity;
    for (const loc of itimLocations) {
      if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        const dLat = loc.lat - lat;
        const dLng = loc.lng - lng;
        const dist = dLat * dLat + dLng * dLng;
        if (dist < minDist) {
          minDist = dist;
          closest = loc;
        }
      }
    }
    if (closest) return closest;
  }

  // Fallback to Jerusalem
  return itimLocations.find(l => l.name === 'ירושלים') || itimLocations[0];
}

const itimCache = new Map();

/**
 * Fetch Shabbat times directly from official Luach Itim LeBina API
 * @param {string} fridayDateStr - 'YYYY-MM-DD'
 * @param {string} shabbatDateStr - 'YYYY-MM-DD'
 * @param {string} cityName - City name or preset
 * @param {number} [lat] - Optional latitude
 * @param {number} [lng] - Optional longitude
 * @returns {Promise<{timesA: object, timesB: object, location: object, source: string}|null>}
 */
export async function fetchItimZmanimTwoDays(fridayDateStr, shabbatDateStr, cityName, lat, lng) {
  try {
    const loc = findItimLocation(cityName, lat, lng);
    if (!loc) return null;

    const cacheKey = `${fridayDateStr}_${shabbatDateStr}_${loc.id}`;
    if (itimCache.has(cacheKey)) {
      return itimCache.get(cacheKey);
    }

    const url = `https://itimlabina.co.il/api/times/bydatesrange/${loc.luachId}/3/${fridayDateStr}/${shabbatDateStr}/${loc.lat}/${loc.lng}/${loc.elevation || 0}/${loc.plainEl || 0}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000), // 6 sec timeout
    });

    if (!res.ok) {
      console.warn(`[ItimLeBina] HTTP ${res.status} from ${url}`);
      return null;
    }

    const data = await res.json();

    // Date keys in Itim are formatted as "D/M/YYYY" or "DD/M/YYYY"
    const parseKey = (dStr) => {
      const [y, m, d] = dStr.split('-').map(Number);
      return `${d}/${m}/${y}`;
    };

    const fridayKey = parseKey(fridayDateStr);
    const shabbatKey = parseKey(shabbatDateStr);

    const rawA = data[fridayKey] || {};
    const rawB = data[shabbatKey] || {};

    if (!Object.keys(rawA).length && !Object.keys(rawB).length) {
      console.warn('[ItimLeBina] No times found in response for dates', fridayKey, shabbatKey);
      return null;
    }

    const mapZmanim = (raw) => ({
      alotHaShachar: raw['65'] || raw['79'] || null, // 72 במעלות / בזמניות
      misheyakir: raw['71'] || null,                 // 11.5 מעלות
      sunrise: raw['435'] || raw['14'] || null,      // מודפס ראשון (הנץ הנראה) או מישור
      sofZmanShma: raw['44'] || null,                // סוף זמן ק"ש גר"א
      sofZmanShmaMGA: raw['68'] || raw['34'] || null,// סוף זמן ק"ש מג"א 72 / 90
      sofZmanTfilla: raw['43'] || null,              // סוף זמן תפילה גר"א
      sofZmanTfillaMGA: raw['86'] || raw['42'] || null, // סוף זמן תפילה מג"א 72 / 90
      chatzot: raw['13'] || null,                    // חצות היום האמיתי
      minchaGedola: raw['67'] || raw['48'] || null,  // מנחה גדולה 30 דק' / גר"א
      minchaKetana: raw['75'] || null,               // מנחה קטנה גר"א
      plagHaMincha: raw['64'] || null,               // פלג המנחה גר"א
      candleLighting: raw['295'] || null,            // הדלקת נרות הרשמי
      sunset: raw['290'] || raw['392'] || null,      // שקיעה מודפסת ראשונה
      tzeit7083deg: raw['61'] || null,               // צאת שבת 8.5 מעלות
      tzeit85deg: raw['112'] || null,                // צאת שבת חזו"א
      tzeit72min: raw['57'] || raw['84'] || null,    // צאת שבת ר"ת 72 במעלות
    });

    const timesA = mapZmanim(rawA);
    const timesB = mapZmanim(rawB);

    // Fallback if candleLighting was not explicitly in rawA
    if (!timesA.candleLighting && timesA.sunset) {
      const sunsetD = new Date(timesA.sunset);
      // Default offset: 40 min for Jerusalem & Meitzad, 20 min for others
      const offset = (loc.name === 'ירושלים' || loc.name === 'מיצד') ? 40 : 20;
      timesA.candleLighting = new Date(sunsetD.getTime() - offset * 60000).toISOString();
    }

    const result = {
      timesA,
      timesB,
      location: loc,
      source: 'לוח עתים לבינה',
    };
    itimCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[ItimLeBina] Error fetching zmanim, falling back:', err.message);
    return null;
  }
}
