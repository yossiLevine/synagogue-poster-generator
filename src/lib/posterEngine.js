import {
  fetchZmanimTwoDays,
  fetchShabbatInfo,
  getNextFriday,
  addDays,
  buildZmanimForDisplay,
  resolveZmanIso,
  applyOffset,
} from './zmanimApi';
import { DEFAULT_RULES, DEFAULT_DISPLAY_ZMANIM, loadSynagogueDefaultPrayers } from './synagogueConfig';

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
export function normalizeLabel(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/יי/g, 'י')
    .replace(/["'״׳\-–—]/g, '');
}

export async function generatePosterPayload({
  rules = DEFAULT_RULES,
  displayZmanim = DEFAULT_DISPLAY_ZMANIM,
  targetDate = null,
} = {}) {
  const friday = targetDate || getNextFriday();
  const shabbat = addDays(friday, 1);

  const [{ zmanimA, zmanimB, hebrewDateA, hebrewDateB }, shabbatInfo, synDefaultPrayers] = await Promise.all([
    fetchZmanimTwoDays(friday, shabbat),
    fetchShabbatInfo(friday),
    loadSynagogueDefaultPrayers().catch(() => null),
  ]);

  let prayerRows = [];
  if (synDefaultPrayers && Array.isArray(synDefaultPrayers) && synDefaultPrayers.length > 0) {
    prayerRows = synDefaultPrayers.map((p, idx) => {
      if (p.isHeader || p.isNote) return { ...p, id: p.id || `def-${idx}` };

      const normP = normalizeLabel(p.label);
      const matchedRule = rules.find(r => normalizeLabel(r.label) === normP) || (p.baseZman ? p : null);

      if (matchedRule && matchedRule.baseZman && matchedRule.baseZman !== 'fixed') {
        let time = '';
        if (matchedRule.baseZman === 'candleLighting' && shabbatInfo?.candleLightingIso) {
          time = applyOffset(shabbatInfo.candleLightingIso, parseInt(matchedRule.offsetMinutes || 0, 10), 'down');
        } else {
          const iso = resolveZmanIso(matchedRule.baseZman, zmanimA || {}, zmanimB || {});
          if (iso) {
            const roundDir = (matchedRule.dayTag || p.dayTag) === 'A' ? 'down' : 'up';
            time = applyOffset(iso, parseInt(matchedRule.offsetMinutes || 0, 10), roundDir);
          }
        }
        return { ...p, id: p.id || `def-${idx}`, time: time || p.time || '', visible: p.visible !== false };
      }

      if (matchedRule && matchedRule.baseZman === 'fixed') {
        return { ...p, id: p.id || `def-${idx}`, time: matchedRule.fixedTime || p.fixedTime || p.time || '', visible: p.visible !== false };
      }

      if (p.fixedTime) return { ...p, id: p.id || `def-${idx}`, time: p.fixedTime, visible: p.visible !== false };
      return { ...p, id: p.id || `def-${idx}`, visible: p.visible !== false };
    });
  } else {
    prayerRows = calcPrayerRowsFromRules(rules, zmanimA, shabbatInfo, zmanimB);
  }

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
    showZmanimOnPoster: false, // Default is OFF
    announcements: '',
    weeklyQuote: '',
    yahrtzeits: [],
    molad: shabbatInfo.molad,
    weekdayRows: [],
  };
}
