import { getSynagogueId, loadConfigFromDB, saveConfigToDB, loadDefaultPrayersFromDB, saveDefaultPrayersToDB } from './synagogueDB';

const LS_KEY = 'synagogue_main_config';

export const DEFAULT_RULES = [
  { label: 'מנחה ערב שבת', baseZman: 'plagHaMincha',       offsetMinutes: 0,   direction: 'after',  dayTag: 'A' },
  { label: 'קבלת שבת',     baseZman: 'candleLighting',     offsetMinutes: 0,   direction: 'after',  dayTag: 'A' },
  { label: 'מעריב',        baseZman: 'tzeitFriday7083deg', offsetMinutes: 5,   direction: 'after',  dayTag: 'A' },
  { label: 'שחרית',        baseZman: 'sunriseShabbat',     offsetMinutes: 30,  direction: 'after',  dayTag: 'B' },
  { label: 'מנחה',         baseZman: 'minchaGedolaShabbat',offsetMinutes: 30,  direction: 'after',  dayTag: 'B' },
  { label: 'אבות ובנים',   baseZman: 'tzeit7083deg',       offsetMinutes: -20, direction: 'before', dayTag: 'B' },
  { label: 'מעריב מוצ"ש', baseZman: 'tzeit7083deg',        offsetMinutes: 0,   direction: 'after',  dayTag: 'B' },
];

export const DEFAULT_DISPLAY_ZMANIM = ['candleLighting', 'sunset', 'tzeit7083deg'];

export const DEFAULT_PRAYER_TEMPLATES = [
  { id: 'r1', label: 'מנחה ערב שבת', visible: true, baseZman: 'plagHaMincha', offsetMinutes: 0, dayTag: 'A' },
  { id: 'r2', label: 'קבלת שבת',     visible: true, baseZman: 'candleLighting', offsetMinutes: 0, dayTag: 'A' },
  { id: 'r3', label: 'מעריב',        visible: true, baseZman: 'tzeitFriday7083deg', offsetMinutes: 5, dayTag: 'A' },
  { id: 'r4', label: 'שחרית',        visible: true, baseZman: 'sunriseShabbat', offsetMinutes: 30, dayTag: 'B' },
  { id: 'r5', label: 'מנחה',         visible: true, baseZman: 'minchaGedolaShabbat', offsetMinutes: 30, dayTag: 'B' },
  { id: 'r6', label: 'אבות ובנים',   visible: true, baseZman: 'tzeit7083deg', offsetMinutes: -20, dayTag: 'B' },
  { id: 'r7', label: 'מעריב מוצ"ש', visible: true, baseZman: 'tzeit7083deg', offsetMinutes: 0, dayTag: 'B' },
];

export const PRESET_HORIZONS = [
  { name: 'מיצד', lat: 31.3167, lng: 35.1167, candleOffset: 40 },
  { name: 'ירושלים', lat: 31.7683, lng: 35.2137, candleOffset: 40 },
  { name: 'תל אביב', lat: 32.0853, lng: 34.7818, candleOffset: 22 },
  { name: 'חיפה', lat: 32.7940, lng: 34.9896, candleOffset: 30 },
  { name: 'באר שבע', lat: 31.2518, lng: 34.7913, candleOffset: 30 },
  { name: 'אשדוד', lat: 31.8044, lng: 34.6553, candleOffset: 20 },
  { name: 'נתניה', lat: 32.3321, lng: 34.8600, candleOffset: 20 },
  { name: 'רמת גן', lat: 32.0680, lng: 34.8240, candleOffset: 22 },
  { name: 'מודיעין', lat: 31.8969, lng: 35.0100, candleOffset: 30 },
  { name: 'מעלה אדומים', lat: 31.7770, lng: 35.2965, candleOffset: 40 },
  { name: 'ביתר עילית', lat: 31.6980, lng: 35.1105, candleOffset: 40 },
  { name: 'בית שמש', lat: 31.7450, lng: 34.9868, candleOffset: 40 },
  { name: 'צפת', lat: 32.9646, lng: 35.4960, candleOffset: 30 },
  { name: 'טבריה', lat: 32.7940, lng: 35.5300, candleOffset: 20 },
  { name: 'אילת', lat: 29.5581, lng: 34.9482, candleOffset: 20 },
];

export const DEFAULT_CONFIG = {
  synagogueName: 'בית הכנסת "עבדו את ה\' בשמחה" · ישוב מיצד',
  logoUrl: null,
  horizonName: 'מיצד',
  cityName: 'מיצד',
  lat: 31.3167,
  lng: 35.1167,
  logoSize: 120,
  logoShape: 'circle',
  logoFit: 'contain',
  logoPosX: 50,
  logoPosY: 50,
  logoBorderWidth: 2,
  logoGlow: true,
  rules: DEFAULT_RULES,
  displayZmanim: DEFAULT_DISPLAY_ZMANIM,
  showZmanimOnPoster: false, // Default is OFF as requested
};

// In-memory config cache for sync reads (getConfig)
let _configCache = null;

/**
 * Sync read — returns cached config or localStorage fallback.
 * For async (DB) read use loadConfig().
 */
export function getConfig() {
  if (_configCache) return _configCache;
  try {
    const stored = localStorage.getItem(LS_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Async load — fetches from DB if in Gabai mode or targetSynId is provided, else localStorage.
 * Updates the in-memory cache so getConfig() returns fresh data.
 */
export async function loadConfig(targetSynId = null) {
  try {
    const id = targetSynId || getSynagogueId();
    if (id) {
      const dbConfig = await loadConfigFromDB(id);
      if (dbConfig) {
        _configCache = { ...DEFAULT_CONFIG, ...dbConfig };
        // Also sync to localStorage for sync reads
        localStorage.setItem(LS_KEY, JSON.stringify(_configCache));
        return _configCache;
      }
    }
  } catch (e) {
    console.error('loadConfig error:', e);
  }
  // Fallback to localStorage
  const stored = localStorage.getItem(LS_KEY);
  const parsed = stored ? JSON.parse(stored) : {};
  _configCache = { ...DEFAULT_CONFIG, ...parsed };
  return _configCache;
}

/**
 * Clear in-memory cache (call on logout)
 */
export function clearConfigCache() {
  _configCache = null;
}

/**
 * Save config — saves to DB (if Gabai or targetSynId) AND localStorage.
 */
export async function saveConfig(config, targetSynId = null) {
  _configCache = { ...DEFAULT_CONFIG, ...config };
  // Always save to localStorage for sync access
  localStorage.setItem(LS_KEY, JSON.stringify(_configCache));
  // Also save to DB if targetSynId is specified or in Gabai mode
  const id = targetSynId || getSynagogueId();
  if (id) {
    await saveConfigToDB(_configCache, id);
  }
  window.dispatchEvent(new Event('synagogue-config-changed'));
}

export async function loadSynagogueDefaultPrayers(targetId = null) {
  const id = targetId || getSynagogueId();
  if (id) {
    try {
      const dbPrayers = await loadDefaultPrayersFromDB(id);
      if (dbPrayers && Array.isArray(dbPrayers) && dbPrayers.length > 0) {
        localStorage.setItem('synagogue_default_prayers', JSON.stringify(dbPrayers));
        return dbPrayers;
      }
    } catch (e) {
      console.warn('Failed to load default prayers from DB', e);
    }
  }
  try {
    const ls = localStorage.getItem('synagogue_default_prayers');
    if (ls) {
      const parsed = JSON.parse(ls);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PRAYER_TEMPLATES;
}

export async function saveSynagogueDefaultPrayers(prayers, targetId = null) {
  if (!prayers || !Array.isArray(prayers)) return;
  const clean = prayers.map((p, idx) => ({
    id: p.id || `pr-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    label: p.label || '',
    visible: p.visible !== false,
    isHeader: !!p.isHeader,
    isNote: !!p.isNote,
    fixedTime: p.fixedTime || (p.time && !p.baseZman ? p.time : ''),
    baseZman: p.baseZman || null,
    offsetMinutes: p.offsetMinutes !== undefined ? p.offsetMinutes : 0,
    dayTag: p.dayTag || (p.label?.includes('שבת') || p.label?.includes('מוצ"ש') || p.label?.includes('שחרית') || p.label?.includes('אבות') ? 'B' : 'A')
  }));
  localStorage.setItem('synagogue_default_prayers', JSON.stringify(clean));
  const id = targetId || getSynagogueId();
  if (id) {
    await saveDefaultPrayersToDB(clean, id);
  }
}