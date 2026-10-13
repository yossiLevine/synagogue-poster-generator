import {
  fetchZmanimTwoDays,
  fetchShabbatInfo,
  getNextFriday,
  addDays,
  buildZmanimForDisplay,
  resolveZmanIso,
  applyOffset,
} from './zmanimApi';
import { DEFAULT_RULES, DEFAULT_DISPLAY_ZMANIM } from './synagogueConfig';

// ─── חישוב שורות תפילה מכללים ───────────────────────────────────────────────

export function calcPrayerRowsFromRules(rules, timesA, shabbatInfo, timesB = null) {
  return rules
    .map(rule => {
      if (rule.baseZman === 'fixed') {
        if (!rule.fixedTime) return null;
        return { label: rule.label, time: rule.fixedTime, dayTag: rule.dayTag || 'A' };
      }

      // candleLighting comes from shabbatInfo (not from /zmanim API)
      if (rule.baseZman === 'candleLighting') {
        const iso = shabbatInfo?.candleLightingIso;
        if (!iso) return null;
        const offset = parseInt(rule.offsetMinutes || 0, 10);
        const time = applyOffset(iso, offset, 'down');
        return { label: rule.label, time, dayTag: rule.dayTag || 'A' };
      }

      const iso = resolveZmanIso(rule.baseZman, timesA || {}, timesB || {});
      if (!iso) return null;

      const offset = parseInt(rule.offsetMinutes || 0, 10);
      const dayTag = rule.dayTag || 'A';
      const roundDir = dayTag === 'A' ? 'down' : 'up';
      const time = applyOffset(iso, offset, roundDir);
      return { label: rule.label, time, dayTag };
    })
    .filter(Boolean);
}

// ─── פונקציה ראשית ───────────────────────────────────────────────────────────

/**
 * יוצר PosterPayload מלא לשבת הקרובה.
 * @param {object} options
 * @param {object[]} options.rules - כללי חישוב תפילות (ברירת מחדל: DEFAULT_MITZAD_RULES)
 * @param {string[]} options.displayZmanim - מפתחות זמנים לתצוגה (ברירת מחדל: DEFAULT_MITZAD_DISPLAY_ZMANIM)
 * @param {string} [options.targetDate] - תאריך יעד (YYYY-MM-DD), ברירת מחדל: שישי הקרוב
 * @returns {Promise<object>} PosterPayload
 */
export async function generatePosterPayload({
  rules = DEFAULT_RULES,
  displayZmanim = DEFAULT_DISPLAY_ZMANIM,
  targetDate = null,
} = {}) {
  const friday = targetDate || getNextFriday();
  const shabbat = addDays(friday, 1);

  const [{ zmanimA, zmanimB, hebrewDateA, hebrewDateB }, shabbatInfo] = await Promise.all([
    fetchZmanimTwoDays(friday, shabbat),
    fetchShabbatInfo(friday),
  ]);

  const prayerRows = calcPrayerRowsFromRules(rules, zmanimA, shabbatInfo, zmanimB);
  const zmanimDisplay = buildZmanimForDisplay(zmanimA, shabbatInfo, displayZmanim, zmanimB, {});

  return {
    type: 'prayer',
    hebrewDateA,
    hebrewDateB,
    gregorianDateA: friday,
    gregorianDateB: shabbat,
    parasha: shabbatInfo.parasha,
    haftarah: shabbatInfo.haftarah,
    candleLighting: shabbatInfo.candleLighting,
    havdalah: shabbatInfo.havdalah,
    isRoshChodesh: shabbatInfo.isRoshChodesh,
    specialShabbat: shabbatInfo.specialShabbat,
    prayerRows,
    zmanimDisplay,
    announcements: '',
    weeklyQuote: '',
    yahrtzeits: [],
    molad: shabbatInfo.molad,
    weekdayRows: [],
  };
}
