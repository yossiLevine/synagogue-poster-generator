# מפרט מערכת — מחולל מודעות לבתי כנסת

> **גרסה:** 6.0 | **יישוב ראשוני:** מיצד | **היקף:** 5–10 בתי כנסת

---

# חלק א: מבוא

## חזון

פלטפורמה שמאפשרת לכל בית כנסת להכין מודעת שבת/חג/חול אוטומטית,
לפרסמה ב-WhatsApp, בהדפסה, במסך פנימי, ובאתר ציבורי מאוחד.

---

## א1. משתמשים ותפקידים

| תפקיד | URL | פעולות |
|--------|-----|---------|
| **Admin** | `/admin` | יצירת בתי כנסת, ניהול גבאים, סטטיסטיקות |
| **גבאי** | `/editor` | עריכת מודעות, הגדרות בית הכנסת שלו |
| **ציבור** | `/public`, `/display/:id` | צפייה בלבד |

### זרימת Admin
1. נכנס דרך Base44 auth (`role: 'admin'`) — מנהל המערכת בלבד
2. יוצר `Synagogue` entity: שם + עיר + lat/lng + לוגו + accent_color
3. יוצר `SynagogueAccount`: username + password + role
4. מוסר פרטים לגבאי
5. יכול להיכנס לכל בית כנסת ולערוך הכל (`isAdminMode` ב-localStorage)

### זרימת גבאי
1. נכנס ב-`/login` → `loginGabai` function
2. Server מחזיר `token` + `synagogue_id` + `token_created_at` + `role` → localStorage
3. `/editor` טוען `Home.jsx` עם synagogueId
4. Token פג תוקף אחרי 30 יום — server בודק `token_created_at` בכל בקשה

### זרימת Admin עריכה
```javascript
// Editor.jsx:
const adminOverride = location.state?.adminOverride;
if (adminOverride && isAdminMode) {
  setSynagogueId(adminOverride);
  setLoading(false);
  return; // skip auth check
}
```

---

## א2. הרשאות לפי תפקיד

| פעולה | Admin | גבאי ראשי | גבאי עוזר |
|--------|-------|-----------|-----------|
| עריכת מודעה שבועית | ✅ | ✅ | ✅ |
| פרסום מודעה | ✅ | ✅ | ✅ |
| שינוי כללי תפילה | ✅ | ✅ | ❌ |
| שינוי עיצוב | ✅ | ✅ | ❌ |
| שינוי מיקום | ✅ | ✅ | ❌ |
| הוספת גבאי עוזר | ✅ | ✅ | ❌ |
| מחיקת חשבון | ✅ | ❌ | ❌ |

---

## א3. Demo Mode — ללא auth

| פיצ׳ר | Demo | גבאי מחובר |
|--------|------|------------|
| יצירת מודעה | ✅ | ✅ |
| שמירת כללים | ✅ localStorage | ✅ DB |
| פרסום ללוח ציבורי | ❌ | ✅ |
| היסטוריה | ✅ localStorage (max 10) | ✅ DB (max 20) |
| תבניות | ✅ localStorage | ✅ DB |
| הורדת PDF/PNG | ✅ | ✅ |
| שיתוף WhatsApp | ✅ | ✅ |

```javascript
// handlePublish — הגנה:
if (!synagogueId) {
  toast.error('יש להתחבר כגבאי כדי לפרסם ללוח הציבורי');
  return;
}
```

---

# חלק ב: ארכיטקטורה ונתונים

## ב1. Synagogue Entity

```javascript
{
  id: 'uuid',
  name: 'בית הכנסת עבדו את ה׳ בשמחה',
  city: 'מיצד',
  logo_url: string | null,        // נפרד מsynagogue_config
  accent_color: '#1a2e5a',        // צבע ייחודי לכרטיס ציבורי
  is_active: boolean,
  updated_at: string,             // ISO — לzopimistic lock

  // JSON fields:
  synagogue_config: JSON({
    synagogueName, horizonName, cityName,
    lat, lng,
    timezone: 'Asia/Jerusalem',
    logoSize, logoShape, logoFit,
    logoPosX, logoPosY, logoBorderWidth, logoGlow,
    theme, frameId,
    displayZmanim: string[],
    candleLightingLagMinutes: 18,
    showFridayDate: false,
    is_onboarded: false,
    activeProfileOverride: null,
    lastAnnouncements: '',
    yahrtzeits: YahrtzeitEntry[],
  }),

  prayer_rules: JSON(Rule[]),       // SSOT לכללי שבת
  yom_tov_rules: JSON(Rule[]),      // כללי יו"ט נפרדים
  weekday_rules: JSON(WeekdayRule[]),
  weekday_rows: JSON(WeekdayRow[]), // זמנים מחושבים לטבלת חול
  prayer_profiles: JSON({ [name]: { rules: Rule[], activeSeason?: { from, to } } }),
  selected_zmanim: JSON(string[]),
  zmanim_overrides: JSON({ [key]: 'HH:MM' }),
  templates: JSON({ [name]: { prayerRows, savedAt } }),
  poster_history: JSON(HistoryEntry[]), // max 20, ללא weekdayRows
}
```

## ב2. SynagogueAccount Entity

```javascript
{
  id, synagogue_id,
  username, password_hash,
  auth_token, token_created_at,
  role: 'gabaai_rishon' | 'gabaai_ezra',
}
```

## ב3. PublicPoster Entity

```javascript
{
  id, parasha, date,
  poster_data: string,          // JSON.stringify(PosterPayload)
  synagogue_name, synagogue_id, city_name,
  logo_url, accent_color,
  is_active: boolean,
  created_date,
}
```

## ב4. Rule Type

```javascript
{
  label: string,
  baseZman: string,             // מפתח מ-ZMANIM_META | 'fixed' | 'candleLighting'
  offsetMinutes: number,        // ±N
  direction: 'before' | 'after', // 'at' הוסר לחלוטין
  dayTag: 'A' | 'B',
  fixedTime?: 'HH:MM',
}
```

**חשוב:** `direction: 'at'` הוסר. `קבלת שבת` = `direction: 'after', offsetMinutes: 0`.

## ב5. WeekdayRule Type

```javascript
{
  label: string,
  baseZman: 'fixed' | 'sunset' | 'tzeitWeekday',
  offsetMinutes: number,
  direction: 'before' | 'after',
  fixedTime?: 'HH:MM',
}
```

## ב6. PosterPayload Type

```javascript
{
  type: 'prayer' | 'general',
  parasha, haftarah,
  hebrewDateA, hebrewDateB,
  gregorianDateA, gregorianDateB,  // YYYY-MM-DD
  labelDayA, labelDayB,
  showFridayDate: boolean,
  prayerRows: [{ id, label, time, visible, isHeader?, isNote? }],
  zmanimDisplay: [{ key, label, time, day }],
  isYomTov, isYomTovShabbat,
  isRoshChodesh, showRoshChodesh,
  specialShabbatList: string[],    // מערך — יכול להכיל כמה אירועים
  showHebrewDate,
  announcements, weeklyQuote, molad,
  yahrtzeits, weekdayRows,
  bilingualMode,
  usedFallback: boolean,           // true אם HebCal לא זמין
  fallbackDate: number | null,     // timestamp של cache האחרון
}
```

## ב7. localStorage Keys

| Key | תוכן | נמחק בlogout? |
|-----|------|--------------|
| `gabai_token` | auth token | ✅ |
| `synagogue_id` | UUID | ✅ |
| `gabai_role` | 'gabaai_rishon' / 'gabaai_ezra' | ✅ |
| `synagogue_main_config` | synagogue_config JSON | ❌ |
| `synagogue_relative_rules` | Rule[] | ❌ |
| `synagogue_selected_zmanim` | string[] | ❌ |
| `synagogue_zmanim_overrides` | {key: 'HH:MM'} | ❌ |
| `synagogue_templates` | {name: rows} | ❌ |
| `synagogue_history` | HistoryEntry[] | ❌ |
| `synagogue_profiles` | {name: profile} | ❌ |
| `synagogue_weekday_rules` | WeekdayRule[] | ❌ |
| `synagogue_yom_tov_rules` | Rule[] | ❌ |
| `synagogue_weekday_rows` | computed rows | ❌ |
| `zmanim_cache` | HebCal weekly fallback | ❌ |
| `editorTheme` | themeId | ❌ |
| `editorFrame` | frameId | ❌ |

## ב8. HebCal API

```
GET https://www.hebcal.com/zmanim?latitude={lat}&longitude={lng}&tzid={timezone}&date={date}
GET https://www.hebcal.com/shabbat?latitude={lat}&longitude={lng}&tzid={timezone}&M=on&lg=he
```

**חשוב:** candleLighting מגיע *רק* מ-`/shabbat`. lag = 18 דק׳ סטנדרטי.

## ב9. Base44 Backend Functions

- `loginGabai(username, password)` → `{ token, synagogue_id, role, token_created_at }`
- `createGabaiAccount(synagogue_id, username, password, role)` → `{ success, username }`
- `validateGabaiToken(token)` → `{ valid, synagogue_id, role }` (בודק expiry 30 יום)

---

# חלק ג: שכבת הנתונים

## ג1. synagogueConfig.js

### DEFAULT_CONFIG (ב-RAM בלבד, לא נשמר ל-DB)

```javascript
export const DEFAULT_CONFIG = {
  synagogueName: '',
  horizonName: 'מיצד',
  cityName: 'מיצד',
  lat: 31.392,
  lng: 35.169,
  timezone: 'Asia/Jerusalem',
  theme: 'classic',
  frameId: 'classic',
  displayZmanim: DEFAULT_DISPLAY_ZMANIM,
  candleLightingLagMinutes: 18,
  showFridayDate: false,
  is_onboarded: false,
  activeProfileOverride: null,
  lastAnnouncements: '',
  yahrtzeits: [],
};
```

**חשוב:** `rules` הוסר מ-`synagogue_config` — שמור ב-`prayer_rules` בלבד.

### DEFAULT_RULES (שבת — מיצד)

```javascript
export const DEFAULT_RULES = [
  { label: 'מנחה ערב שבת', baseZman: 'plagHaMincha',        offsetMinutes: 0,  direction: 'after', dayTag: 'A' },
  { label: 'קבלת שבת',     baseZman: 'candleLighting',      offsetMinutes: 0,  direction: 'after', dayTag: 'A' },
  { label: 'מעריב',        baseZman: 'tzeitFriday7083deg',  offsetMinutes: 5,  direction: 'after', dayTag: 'A' },
  { label: 'שחרית',        baseZman: 'sunriseShabbat',      offsetMinutes: 30, direction: 'after', dayTag: 'B' },
  { label: 'מנחה',         baseZman: 'minchaGedolaShabbat', offsetMinutes: 30, direction: 'after', dayTag: 'B' },
  { label: 'אבות ובנים',   baseZman: 'tzeit7083deg',        offsetMinutes: -20,direction: 'before',dayTag: 'B' },
  { label: 'מעריב מוצ"ש', baseZman: 'tzeit7083deg',         offsetMinutes: 0,  direction: 'after', dayTag: 'B' },
];
```

### DEFAULT_DISPLAY_ZMANIM

```javascript
export const DEFAULT_DISPLAY_ZMANIM = [
  'alotHaShachar', 'sunrise', 'sofZmanShma', 'sofZmanTfilla',
  'chatzot', 'minchaGedola', 'plagHaMincha', 'candleLighting',
  'sunset', 'tzeit7083deg',
];
```

### DEFAULT_WEEKDAY_RULES

```javascript
export const DEFAULT_WEEKDAY_RULES = {
  shacharitOffset: 10,      // sunrise + 10 דק׳ (auto mode)
  shacharitFixed: '',
  shacharitFriday: '',
  minchaOffset: -20,        // sunset - 20 דק׳
  maariv​Offset: 5,          // tzeit + 5 דק׳
};
```

---

## ג2. synagogueDB.js

### updateField — serialized queue + rollback

```javascript
let _saveQueue = Promise.resolve();
let _cache = null;

export async function updateField(field, value) {
  _saveQueue = _saveQueue.then(async () => {
    const id = getSynagogueId();
    if (!id) return;
    const prev = _cache?.[field];
    _cache = { ..._cache, [field]: value }; // optimistic
    try {
      await base44.entities.Synagogue.update(id, { [field]: JSON.stringify(value) });
    } catch (e) {
      _cache = { ..._cache, [field]: prev }; // rollback
      console.error(`Failed to save ${field}:`, e);
      throw e;
    }
  });
  return _saveQueue;
}
```

### פונקציות חדשות נדרשות

```javascript
// Weekday Rules
export async function loadWeekdayRulesFromDB() {
  return readField('weekday_rules') || DEFAULT_WEEKDAY_RULES;
}
export async function saveWeekdayRulesToDB(rules) {
  localStorage.setItem('synagogue_weekday_rules', JSON.stringify(rules));
  await updateField('weekday_rules', rules);
}

// Yom Tov Rules
export async function loadYomTovRulesFromDB() {
  return readField('yom_tov_rules') || [];
}
export async function saveYomTovRulesToDB(rules) {
  localStorage.setItem('synagogue_yom_tov_rules', JSON.stringify(rules));
  await updateField('yom_tov_rules', rules);
}

// Weekday Rows (computed)
export async function loadWeekdayRowsFromDB() {
  return readField('weekday_rows')
    || JSON.parse(localStorage.getItem('synagogue_weekday_rows') || 'null')
    || [];
}
export async function saveWeekdayRowsFromDB(rows) {
  localStorage.setItem('synagogue_weekday_rows', JSON.stringify(rows));
  await updateField('weekday_rows', rows);
}

// Role helpers
export function getGabaiRole() {
  return localStorage.getItem('gabai_role') || 'gabaai_rishon';
}
export function isRishon() {
  return getGabaiRole() === 'gabaai_rishon';
}
```

### trimPayloadForHistory

```javascript
// templates.js — addToHistory:
function trimPayloadForHistory(payload) {
  const { weekdayRows, yahrtzeits, bilingualMode, ...core } = payload;
  return core;
}
```

---

# חלק ד: מנוע הלוגיקה

## ד1. zmanimApi.js

### ZMANIM_META — 24 מפתחות

14 שישי (dayTag A): `alotHaShacharFriday`, `sunriseFriday`, `sofZmanShmaMGA72Friday`, `sofZmanShmaGRA​Friday`, `sofZmanTfillaMGA72Friday`, `sofZmanTfillaGRAFriday`, `chatzotFriday`, `minchaGedolaFriday`, `plagHaMincha`, `sunsetFriday`, `tzeitFriday7083deg`, `tzeitFriday8deg`, `candleLighting`, `tzeitFridayRabbeinu​Tam`

10 שבת (dayTag B): `alotHaShacharShabbat`, `sunriseShabbat`, `sofZmanShmaShabbat`, `sofZmanTfillaShabbat`, `chatzotShabbat`, `minchaGedolaShabbat`, `plagHaMinchaShabbat`, `sunsetShabbat`, `tzeit7083deg`, `tzeit8deg`

### fetchShabbatInfo — תיקוני באגים

**תיקון molad (שבת מברכים):**
```javascript
// לפני (שגוי):
if (molad && !specialShabbat) specialShabbat = 'שבת מברכים';

// אחרי:
let isMevarchim = false;
for (const item of data.items) {
  if (item.category === 'mevarchim') { isMevarchim = true; break; }
}
if (isMevarchim && !specialShabbat) {
  // נוסף ל-specialShabbatList, לא דורס
}
```

**specialShabbatList — מערך (לא string):**
```javascript
let specialShabbatList = [];
for (const item of data.items) {
  if (item.category === 'holiday') {
    const he = SPECIAL_SHABBAT_MAP[item.title];
    if (he) specialShabbatList.push(he);
  }
  if (item.category === 'mevarchim') specialShabbatList.push('שבת מברכים');
}
```

**זיהוי חג:**
```javascript
let holidayName = null;
let isMultiDayHoliday = false;
const holidayItems = data.items.filter(i => i.category === 'holiday');
if (holidayItems.length > 0) {
  holidayName = holidayItems[0].title_orig || holidayItems[0].title;
  isMultiDayHoliday = holidayItems.length > 1 || holidayItems[0].title?.includes('א׳');
}

return {
  ...existingReturn,
  specialShabbatList,
  holidayName,
  isMultiDayHoliday,
  isYomTov: !!holidayName,
};
```

### locationOverride — כל fetch functions

```javascript
// לפני:
export async function fetchZmanim(date) {
  const { lat, lng, timezone } = getConfig();
  ...
}

// אחרי:
export async function fetchZmanim(date, locationOverride = null) {
  const { lat, lng, timezone } = locationOverride || getConfig();
  ...
}
// אותו שינוי ל: fetchZmanimTwoDays, fetchShabbatInfo, fetchZmanimForWeekday (חדש)
```

### fetchZmanimForWeekday (חדש)

```javascript
export async function fetchZmanimForWeekday(date, locationOverride = null) {
  const { lat, lng, timezone } = locationOverride || getConfig();
  // זהה ל-fetchZmanim — מחזיר sunset, tzeit7083deg, sunrise ליום ספציפי
}
```

### sessionStorage cache — TTL שעה

```javascript
const CACHE_TTL = 60 * 60 * 1000;

export async function fetchZmanimTwoDays(dateA, dateB, locationOverride = null) {
  const cacheKey = `zmanim_${dateA}_${dateB}_${locationOverride?.lat || 'default'}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < CACHE_TTL) return data;
  }
  // fetch...
  sessionStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() }));
  return result;
}
```

---

## ד2. posterEngine.js

### חתימת generatePosterPayload

```javascript
export async function generatePosterPayload({
  rules = DEFAULT_RULES,
  yomTovRules = null,
  displayZmanim = DEFAULT_DISPLAY_ZMANIM,
  targetDate = null,
  isYomTov = false,
  lat = null,
  lng = null,
  timezone = 'Asia/Jerusalem',
} = {}) → Promise<PosterPayload>
```

### Pipeline

```
getSmartFriday(targetDate)
      ↓
locationOverride = lat && lng ? { lat, lng, timezone } : null
      ↓
Promise.allSettled([
  fetchZmanimTwoDays(fri, sat, locationOverride),
  fetchShabbatInfo(fri, locationOverride),
])
      ↓
saveZmanimCache(...)            ← localStorage weekly fallback
      ↓
selectRules(isYomTov, rules, yomTovRules)
      ↓
resolveActiveProfile(profiles, activeOverride)
      ↓
calcPrayerRowsFromRules(rules, zmanimA, shabbatInfo, zmanimB)
      ↓
buildZmanimForDisplay(...)
      ↓
return PosterPayload
```

### getSmartFriday

```javascript
export function getSmartFriday(targetDate = null) {
  if (targetDate) return targetDate;
  const now = new Date();
  const israelStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const d = new Date(israelStr + 'T12:00:00');
  const dow = d.getDay();
  const hourStr = now.toLocaleTimeString('en-IL', {
    timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false
  });
  const hour = parseInt(hourStr.split(':')[0]);

  if (dow === 5 && hour < 18) return israelStr; // שישי לפני 18:00
  if (dow === 6) {
    // שבת — שישי הבא
    const next = new Date(d);
    next.setDate(next.getDate() + 6);
    return next.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  }
  const daysUntilFriday = (5 - dow + 7) % 7 || 7;
  const next = new Date(d);
  next.setDate(next.getDate() + daysUntilFriday);
  return next.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}
```

### calcPrayerRowsFromRules — SSOT יחיד

**מוגדר רק ב-`posterEngine.js`.** `RelativeZmanimConfig.jsx` מייבא ממנו (לא מגדיר מחדש).

```javascript
export function calcPrayerRowsFromRules(rules, timesA, shabbatInfo, timesB = null) {
  return rules.map(rule => {
    if (rule.baseZman === 'fixed') {
      if (!rule.fixedTime) return null;
      return { label: rule.label, time: rule.fixedTime, dayTag: rule.dayTag || 'A' };
    }
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
  }).filter(Boolean);
}
```

### HebCal Fallback Cache

```javascript
function saveZmanimCache(friday, zmanimA, zmanimB, hebrewDateA, hebrewDateB, shabbatInfo) {
  localStorage.setItem('zmanim_cache', JSON.stringify({
    date: friday, zmanimA, zmanimB, hebrewDateA, hebrewDateB, shabbatInfo,
    savedAt: Date.now(),
  }));
}

// ב-generatePosterPayload — try/catch:
let zmanimData, shabbatData, usedFallback = false;
try {
  [zmanimData, shabbatData] = await Promise.allSettled([...]);
  // ...extract values
  saveZmanimCache(...);
} catch (e) {
  const cached = JSON.parse(localStorage.getItem('zmanim_cache') || 'null');
  if (cached) {
    // שחזר מcache
    usedFallback = true;
  } else {
    throw e;
  }
}
```

### selectRules

```javascript
function selectRules(isYomTov, rules, yomTovRules) {
  if (isYomTov && yomTovRules?.length > 0) return yomTovRules;
  return rules;
}
```

### resolveActiveProfile

```javascript
function resolveActiveProfile(profiles, activeOverride) {
  if (activeOverride && profiles?.[activeOverride]) {
    return { name: activeOverride, rules: profiles[activeOverride].rules };
  }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const mmdd = today.slice(5);
  for (const [name, profile] of Object.entries(profiles || {})) {
    const { from, to } = profile.activeSeason || {};
    if (from && to) {
      const inRange = from <= to
        ? mmdd >= from && mmdd <= to
        : mmdd >= from || mmdd <= to;
      if (inRange) return { name, rules: profile.rules };
    }
  }
  return null;
}
```

### isYomTovShabbat + labelDayB

```javascript
const isYomTovShabbat = shabbatInfo.isYomTov && new Date(shabbat + 'T12:00:00').getDay() === 6;
const labelDayB = isYomTovShabbat
  ? `שבת ${shabbatInfo.holidayName}`
  : shabbatInfo.isYomTov
    ? shabbatInfo.holidayName || 'יום טוב'
    : 'שבת';
```

### fetchWeeklyZmanim (6 קריאות מקביל)

```javascript
export async function fetchWeeklyZmanim(sundayDate, locationOverride = null) {
  const dates = Array.from({ length: 6 }, (_, i) => addDays(sundayDate, i)); // א-ו
  const results = await Promise.allSettled(
    dates.map(d => fetchZmanimForWeekday(d, locationOverride))
  );
  return results.map((r, i) => ({
    date: dates[i],
    zmanim: r.status === 'fulfilled' ? r.value : null,
  }));
}
```

---

# חלק ה: פיצ׳רים — מפרט מלא

## ה1. מודעת שבת — Auto-Generate

### 4 טריגרים לחישוב מחדש

1. **Mount** — auto-generate בטעינה
2. **שינוי כללים** — `RelativeZmanimConfig` dispatches `CustomEvent('rules-changed')` → `Home.jsx` מאזין
3. **שינוי תאריך** — debounce 800ms ב-`loadZmanimData`
4. **כפתור "חשב מחדש"** — ידני

```javascript
// Home.jsx:
useEffect(() => {
  const handler = () => runAutoGenerate();
  window.addEventListener('rules-changed', handler);
  return () => window.removeEventListener('rules-changed', handler);
}, []);
```

### handlePublish — flow מלא

```javascript
const handlePublish = async () => {
  if (!liveData) { toast.error('יש לייצר מודעה תחילה'); return; }
  if (!synagogueId) { toast.error('יש להתחבר כגבאי כדי לפרסם'); return; }

  const cfg = getConfig();
  const syn = await base44.entities.Synagogue.get(synagogueId);

  // Deactivate ישנים
  const old = await base44.entities.PublicPoster.filter({ synagogue_id: synagogueId, is_active: true });
  await Promise.all(old.map(p => base44.entities.PublicPoster.update(p.id, { is_active: false })));

  // צור חדש
  await base44.entities.PublicPoster.create({
    parasha: liveData.parasha || '',
    date: new Date().toISOString().split('T')[0],
    poster_data: JSON.stringify(liveData),
    synagogue_name: cfg.synagogueName || '',
    synagogue_id: synagogueId,
    city_name: cfg.cityName || '',
    logo_url: syn.logo_url || '',
    accent_color: syn.accent_color || '#1a2e5a',
    is_active: true,
  });

  toast.success('המודעה פורסמה בלוח הציבורי ✓');
};
```

---

## ה2. מודעת ימי חול

### WeekdayPosterEditor — Tab נפרד ב-Home.jsx

```jsx
<TabsTrigger value="weekday">📅 ימי חול</TabsTrigger>
<TabsContent value="weekday">
  <div className="lg:grid lg:grid-cols-2 gap-4">
    <WeekdayPosterEditor synagogueId={synagogueId} />
    <div data-poster-preview><WeekdayPoster data={weekTable} /></div>
  </div>
</TabsContent>
```

### טבלת ימי חול

| יום | שחרית | מנחה | מעריב |
|-----|-------|------|-------|
| ראשון | 06:30 [auto/ידני] | 18:45 [auto] | 19:15 [auto] |
| שני | 06:30 | 18:43 | 19:13 |
| ... | | | |
| שישי | 06:00 | 18:30 | — |

**מודי שחרית:**
- `uniform` — שעה קבועה לכל יום (input אחד)
- `auto` — sunrise + offsetMinutes לכל יום
- `perDay` — input נפרד לכל תא

**לחיצה על תא → input:**
```jsx
{cell.isAuto ? (
  <span className="cursor-pointer hover:underline" onClick={() => setManual(day, type)}>
    {cell.time} ✎
  </span>
) : (
  <input type="time" value={cell.time} onChange={...} />
)}
```

### handleRecalc

```javascript
const handleRecalc = async () => {
  setLoading(true);
  const sunday = getSundayOfCurrentWeek();
  const cfg = getConfig();
  const locationOverride = cfg.lat && cfg.lng ? { lat: cfg.lat, lng: cfg.lng, timezone: cfg.timezone } : null;
  const results = await fetchWeeklyZmanim(sunday, locationOverride);
  const table = results.map((r, i) => ({
    date: r.date,
    dayName: DAY_NAMES_HE[i],
    shacharit: computeShacharit(r.zmanim, i, weekdayRules, shacharitMode),
    mincha: r.zmanim ? applyOffset(r.zmanim.sunset, weekdayRules.minchaOffset || -20, 'up') : null,
    maariv: r.zmanim ? applyOffset(r.zmanim.tzeit7083deg, weekdayRules.maarivOffset || 5, 'down') : null,
    failed: !r.zmanim,
  }));
  setWeekTable(table);
  await saveWeekdayRowsFromDB(table);
  setLoading(false);
};
```

---

## ה3. שיתוף

### 3 כפתורים (מוצגים רק כש-liveData קיים)

```jsx
{liveData && (
  <div className="flex gap-2 flex-wrap">
    <Button onClick={handleWhatsAppImage} className="bg-green-600 hover:bg-green-700 flex-1">
      📤 WhatsApp (תמונה)
    </Button>
    <Button variant="outline" onClick={handleWhatsAppText}>
      💬 WhatsApp (טקסט)
    </Button>
    <Button variant="outline" onClick={handleDownloadPDF}>
      🖨️ PDF לתלייה
    </Button>
  </div>
)}
```

**handleWhatsAppImage:**
1. `capturePoster()` → base64 PNG
2. `base44.storage.uploadPosterImage(base64)` → URL
3. בנה טקסט: `זמני תפילות לשבת פרשת ${parasha}\n${prayerRows.map(r => `${r.label}: ${r.time}`).join('\n')}`
4. Native share API אם זמין, אחרת `wa.me/?text=...`

**handleWhatsAppText:** טקסט בלבד, `window.open('https://wa.me/?text=...')`

**handleDownloadPDF:** `capturePoster()` → PNG → jsPDF → A4 → download

---

## ה4. לוח ציבורי (PublicBoard)

### URL: `/public`

**PublicBoard.jsx:**
```javascript
const load = async () => {
  const all = await base44.entities.PublicPoster.filter({ is_active: true }, '-created_date');
  const byShul = {};
  for (const p of all) {
    if (!byShul[p.synagogue_id]) byShul[p.synagogue_id] = p;
  }
  setPosters(Object.values(byShul));
};
useEffect(() => {
  load();
  const t = setInterval(load, 5 * 60 * 1000);
  return () => clearInterval(t);
}, []);

// פילטור בUI עם debounce 300ms:
const filtered = search
  ? posters.filter(p => p.city_name?.includes(search) || p.synagogue_name?.includes(search))
  : posters;
```

**SynagogueCard.jsx:**
```jsx
<div style={{ borderRight: `4px solid ${poster.accent_color || '#1a2e5a'}` }}>
  {poster.logo_url && <img src={poster.logo_url} className="w-8 h-8 rounded-full" />}
  <h3>{poster.synagogue_name}</h3>
  <p className="text-xs text-muted-foreground">{poster.city_name}</p>
  <div className="text-xs">עודכן: {formatRelativeTime(poster.created_date)}</div>
  {rows.slice(0, 5).map(r => (
    <div key={r.id} className="flex justify-between text-sm">
      <span>{r.label}</span>
      <span className="font-mono">{r.time}</span>
    </div>
  ))}
  <a href={`/public/${poster.synagogue_id}`}>לפוסטר המלא ←</a>
</div>
```

---

## ה5. מסך בית הכנסת (DisplayMode)

### Route: `/display/:synagogueId`

```javascript
// DisplayMode.jsx — useEffect:
const { synagogueId: paramId } = useParams();
const synagogueId = paramId || localStorage.getItem('synagogue_id');
const [lastUpdated, setLastUpdated] = useState(null);

const load = async () => {
  try {
    if (synagogueId) {
      const posters = await base44.entities.PublicPoster.filter(
        { synagogue_id: synagogueId, is_active: true }, '-created_date', 1
      );
      if (posters[0]?.poster_data) {
        setData(JSON.parse(posters[0].poster_data));
        setLastUpdated(posters[0].created_date);
        return;
      }
    }
    // fallback: חישוב חדש
    const payload = await generatePosterPayload({});
    setData(payload);
    setLastUpdated(new Date().toISOString());
  } catch (e) {
    console.error('DisplayMode load error:', e);
  }
};

useEffect(() => {
  load();
  const interval = setInterval(load, 5 * 60 * 1000); // 5 דק׳ (לא 30!)
  return () => clearInterval(interval);
}, [synagogueId]);
```

**Timestamp + Fullscreen:**
```jsx
{lastUpdated && (
  <div className="fixed bottom-2 left-2 text-xs text-white/60 bg-black/20 px-2 py-1 rounded">
    עודכן: {formatIsraeliTime(lastUpdated)}
  </div>
)}
```

**Responsive font:**
```jsx
<div style={{ fontSize: 'clamp(14px, 2.5vmin, 22px)' }} data-poster-preview>
  <PrayerTimesPoster data={data} />
</div>
```

---

## ה6. Onboarding Wizard

### תנאי הפעלה: `is_onboarded === false`

```javascript
// Editor.jsx — בטעינה:
base44.entities.Synagogue.get(sId).then(syn => {
  const cfg = syn.synagogue_config || {};
  if (!cfg.is_onboarded) setShowWizard(true);
});

if (showWizard) return (
  <OnboardingWizard onComplete={() => setShowWizard(false)} synagogueId={synagogueId} />
);
```

### 3 שלבים

**שלב 1 — מיקום:**
```jsx
<Select value={location} onValueChange={setLocation}>
  {PRESET_HORIZONS.map(h => <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>)}
</Select>
```

**שלב 2 — כללי תפילה:**
```jsx
<p>נטענו {DEFAULT_RULES.length} תפילות ברירת מחדל</p>
<Button variant="outline" onClick={() => setEditRules(true)}>ערוך כללים</Button>
```

**שלב 3 — עיצוב (אופציונלי):**
```jsx
<StyleSelector value={theme} onChange={setTheme} />
<LogoEditor ... />
```

**בסיום:**
```javascript
await saveConfig({ ...selectedLocation, theme });
await saveRulesToDB(rules);
await updateField('is_onboarded', true);
onComplete();
```

---

## ה7. פרופילים

### מבנה נתונים

```javascript
prayer_profiles: {
  'קיץ':        { rules: [...], activeSeason: { from: '04-01', to: '10-31' } },
  'חורף':       { rules: [...], activeSeason: { from: '11-01', to: '03-31' } },
  'ראש השנה':   { rules: [...], activeSeason: null },  // ידני בלבד
}
```

**מעבר אוטומטי:** `resolveActiveProfile` (ראה חלק ד).

**UI ב-`/settings`:**
- dropdown "פרופיל פעיל: [אוטומטי ▼]" — override ידני
- כרטיסיית "פרופילים" עם רשימה + [+ הוסף פרופיל]
- עריכת פרופיל → פותח RelativeZmanimConfig עם rules של הפרופיל
- שם תאריכי תוקף (MM-DD → MM-DD) לכל פרופיל

---

## ה8. Token Expiry + Concurrent Edit

### Token Expiry (Backend)

```javascript
// loginGabai — שמור token_created_at:
await SynagogueAccount.update(account.id, {
  auth_token: newToken,
  token_created_at: new Date().toISOString(),
});

// validateGabaiToken — בדוק גיל:
const tokenAge = Date.now() - new Date(account.token_created_at).getTime();
if (tokenAge > 30 * 24 * 60 * 60 * 1000) {
  return Response.json({ success: false, message: 'הפעלה פגה.' }, { status: 401 });
}
```

### Concurrent Edit (Frontend)

```javascript
// Editor.jsx — שמור updated_at בטעינה:
const [loadedAt, setLoadedAt] = useState(null);
base44.entities.Synagogue.get(sId).then(syn => {
  setLoadedAt(syn.updated_at);
});

// checkConcurrentEdit — לפני כל שמירה:
const checkConcurrentEdit = async () => {
  const fresh = await base44.entities.Synagogue.get(synagogueId);
  if (fresh.updated_at !== loadedAt) {
    const ok = window.confirm('מישהו אחר שמר שינויים. האם לדרוס?');
    if (!ok) return false;
    setLoadedAt(fresh.updated_at);
  }
  return true;
};
```

---

## ה9. הגדרות בית הכנסת — `/settings`

**`SynagogueSettingsPage.jsx` — Tabs:**

```jsx
<Tabs defaultValue="location">
  <TabsTrigger value="location">מיקום</TabsTrigger>
  <TabsTrigger value="rules">כללים</TabsTrigger>
  <TabsTrigger value="design">עיצוב</TabsTrigger>
  <TabsTrigger value="profiles">פרופילים</TabsTrigger>
  <TabsTrigger value="backup">גיבוי</TabsTrigger>
</Tabs>
```

**Tab גיבוי:**
```javascript
const handleExport = () => {
  const data = { cfg: getConfig(), rules: loadRules(), profiles: loadProfiles(), ... };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  // download: `${cfg.synagogueName}-settings-${date}.json`
};

const handleImport = async (file) => {
  const ok = window.confirm('ייבוא ידרוס את כל ההגדרות. להמשיך?');
  if (!ok) return;
  const { cfg, rules, ... } = JSON.parse(await file.text());
  await saveConfig(cfg);
  await saveRulesToDB(rules);
  toast.success('הגדרות יובאו בהצלחה');
};
```

---

## ה10. לוגו

**שתי אפשרויות:**
```jsx
<input type="file" accept="image/*" onChange={handleLogoUpload} />
// → base44.storage.uploadFile(file) → URL → Synagogue.logo_url

<Input type="url" placeholder="https://..." value={logoUrl} onChange={...} />
```

שמירה: `Synagogue.logo_url` (שדה ב-entity, לא בsynagogue_config).

---

# חלק ו: UX ועיצוב

## ו1. PosterSkeleton

```jsx
// src/components/PosterSkeleton.jsx
export default function PosterSkeleton() {
  return (
    <div className="aspect-[210/297] w-full bg-muted animate-pulse rounded-xl flex flex-col items-center pt-8 gap-3">
      <div className="h-8 w-1/2 bg-muted-foreground/20 rounded" />
      <div className="h-4 w-1/3 bg-muted-foreground/15 rounded" />
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-4 w-3/4 bg-muted-foreground/10 rounded" />
      ))}
    </div>
  );
}
```

שימוש: `{liveData ? <PrayerTimesPoster ... /> : <PosterSkeleton />}`

## ו2. A4 Wrapper + ביטול Dark Mode

```jsx
<div
  style={{ aspectRatio: '210/297', maxHeight: 'calc(100vh - 140px)' }}
  className="overflow-hidden w-full mx-auto"
  data-poster-preview
>
  {liveData ? <PrayerTimesPoster ... /> : <PosterSkeleton />}
</div>
```

```css
/* index.css */
[data-poster-preview] {
  color-scheme: light;
  background: white;
}
```

## ו3. Mobile Tabs

```jsx
const [mobileTab, setMobileTab] = useState('poster');

<div className="lg:hidden">
  <div className="flex border-b mb-4">
    <button className={`flex-1 py-2 text-sm ${mobileTab==='poster' ? 'border-b-2 border-primary font-medium' : ''}`}
      onClick={() => setMobileTab('poster')}>📄 מודעה</button>
    <button className={`flex-1 py-2 text-sm ${mobileTab==='editor' ? 'border-b-2 border-primary font-medium' : ''}`}
      onClick={() => setMobileTab('editor')}>✏️ עריכה</button>
  </div>
  {mobileTab === 'poster' && <div data-poster-preview>{/* poster */}</div>}
  {mobileTab === 'editor' && <PrayerTimesForm ... />}
</div>
<div className="hidden lg:grid lg:grid-cols-2 gap-4">
  {/* desktop layout */}
</div>
```

## ו4. RelativeZmanimConfig — 2 שורות במובייל

```jsx
<div className="space-y-1 border rounded p-2">
  <div className="flex items-center gap-2">
    <GripVertical className="h-4 w-4 cursor-grab" />
    <Input value={rule.label} onChange={...} className="flex-1 text-sm" />
    <Button variant="ghost" size="icon" onClick={() => removeRule(rule.id)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
  <div className="flex items-center gap-1 mr-6 flex-wrap">
    <Select value={rule.baseZman} />
    <DirectionToggle value={rule.direction} />
    <Input type="number" value={rule.offsetMinutes} className="w-16" />
    <DayTagToggle value={rule.dayTag} />
  </div>
</div>
```

## ו5. BILINGUAL_LABELS

```javascript
const BILINGUAL_LABELS = {
  'מנחה ערב שבת': 'Mincha Erev Shabbat',
  'קבלת שבת':     'Kabbalat Shabbat',
  'מעריב':        "Ma'ariv",
  'שחרית':        'Shacharit',
  'מנחה':         'Mincha',
  'אבות ובנים':   'Avot uBanim',
  'מעריב מוצ"ש': "Motza'ei Shabbat",
};
```

## ו6. font-frank Wrapper

```jsx
// PrayerTimesPoster.jsx:
<div className="font-frank h-full w-full" id="print-area">
  {/* כל תוכן הפוסטר */}
</div>
```

## ו7. מגבלת 400 תווים להודעות

```jsx
<Textarea
  value={announcements}
  onChange={e => setAnnouncements(e.target.value.slice(0, 400))}
  maxLength={400}
/>
<p className={`text-xs text-left mt-1 ${
  announcements.length > 350 ? 'text-amber-600 font-medium' : 'text-muted-foreground'
}`}>
  {announcements.length}/400
</p>
```

## ו8. Fallback Warning

```jsx
{liveData?.usedFallback && (
  <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm mb-4 flex items-center justify-between">
    <span>⚠️ מוצגים זמנים משוערים מ-{formatDate(liveData.fallbackDate)}. שרת הזמנים אינו זמין.</span>
    <Button variant="link" size="sm" onClick={() => setPrayerRowsEditable(true)}>ערוך ידנית</Button>
  </div>
)}
```

---

# חלק ז: לוגיקה פנימית — Edge Cases ופתרונות

## ז1. Promise.all → Promise.allSettled ב-loadZmanimData

**בעיה:** קריאה אחת נכשלת → הכל נכשל.

```javascript
const [zmanimResult, shabbatResult, rulesResult, zmanimKeysResult, overridesResult] =
  await Promise.allSettled([...]);

const zmanimData = zmanimResult.status === 'fulfilled' ? zmanimResult.value : null;
const shabbatData = shabbatResult.status === 'fulfilled' ? shabbatResult.value : {};
```

## ז2. Molad Reset Bug

**בעיה:** שינוי תאריך → `moladEditable = false` → עריכת גבאי נדרסת.

```javascript
// ב-loadZmanimData, לפני setMolad:
if (!moladEditable) {
  setMolad(shabbatData.molad || '');
}
```

## ז3. userEditedRows — הגנה מפני overwrite

**בעיה:** עריכה ידנית → שינוי תאריך → חישוב מחדש דורס.

```javascript
const [userEditedRows, setUserEditedRows] = useState(false);

// בעת עריכת row:
setUserEditedRows(true);

// ב-loadZmanimData — לפני setPrayerRows:
if (!userEditedRows) {
  setPrayerRows(calculated);
} else {
  toast.info("זמנים חדשים חושבו. [החל זמנים חדשים]", {
    action: { label: 'החל', onClick: () => { setPrayerRows(calculated); setUserEditedRows(false); }}
  });
}
```

## ז4. updateField — Race Condition

**בעיה:** 2 שמירות מקבילות → שניה דורסת ראשונה + אין rollback.

**פתרון:** serialized queue + rollback (ראה ג2).

## ז5. Zmanim API Cache — sessionStorage TTL שעה

**בעיה:** כל שינוי תאריך → 5 קריאות API (מיותר).

**פתרון:** cache ב-sessionStorage עם TTL 1 שעה (ראה ד1).

## ז6. DisplayMode — prayerRows הרשימה תמיד ריקה

**בעיה:** `prayerRows: []` hardcoded.

**פתרון:** שלוף מ-`poster_data` של PublicPoster (ראה ה5).

## ז7. DisplayMode — isYomTov ו-showHebrewDate מוגדרים פעמיים

**בעיה:** Property כפול — השני מנצח.

**פתרון:** השתמש תמיד ב-`data.isYomTov`, `data.showHebrewDate` מה-payload, ללא הגדרה כפולה.

## ז8. DisplayMode — interval 30 דק׳ במקום 5

**פתרון:** `setInterval(load, 5 * 60 * 1000)`.

## ז9. direction: 'at' — הוסר לחלוטין

**`calcPrayerRowsFromRules`:**
```javascript
// לפני:
const roundDir = rule.direction === 'at' ? ... : ...
// אחרי (direction משמש רק לסימן offset):
const roundDir = dayTag === 'A' ? 'down' : 'up';
```

**בכל מקום בקוד:** `direction: 'at'` → `direction: 'after', offsetMinutes: 0`.

## ז10. מה נשמר PublicPoster?

**לא** אוטומטי בכל generate — **כן** בלחיצה מפורשת על "📤 פרסם ללוח הציבורי" (ראה ה1).

## ז11. calcPrayerRowsFromRules — כפילות

**בעיה:** מוגדר גם ב-`posterEngine.js` וגם ב-`RelativeZmanimConfig.jsx`.

**פתרון:** מחק מ-`RelativeZmanimConfig.jsx`, ייבא מ-`posterEngine.js`.

## ז12. weekdayRows ב-poster_history — payload גדול

**פתרון:** `trimPayloadForHistory` מסיר `weekdayRows`, `yahrtzeits`, `bilingualMode`.

## ז13. synagogue_id חסר ב-PublicPoster

**בעיה:** שליפה לפי `is_active: true` מחזירה פוסטרים של כל בתי הכנסת.

**פתרון:** הוסף `synagogue_id` ל-entity + שלוף לפי `synagogue_id + is_active`.

## ז14. Special Shabbat — כמה אירועים

**בעיה:** שבת מברכים + ראש חודש → רק הראשון נשמר.

**פתרון:** `specialShabbatList: string[]` — הצג `list.join(' | ')`.

## ז15. כניסה ללא synagogue_id תקין

```javascript
// Editor.jsx:
base44.entities.Synagogue.get(sId).catch(err => {
  localStorage.removeItem('gabai_token');
  localStorage.removeItem('synagogue_id');
  navigate('/login', { state: { error: 'חשבון לא תקין — פנה לאדמין' } });
});
```

```jsx
// GabaiLogin.jsx:
const { error } = useLocation().state || {};
{error && <div className="bg-red-50 ...">⚠️ {error}</div>}
```

## ז16. announcements — שמירה בין sessions

```javascript
// synagogue_config.lastAnnouncements
// PrayerTimesForm — mount:
setAnnouncements(cfg.lastAnnouncements || '');
// בכל שינוי:
await saveConfig({ ...cfg, lastAnnouncements: announcements });
```

## ז17. Onboarding — גבאי ללא כללים

```javascript
// Wizard שלב 2 — כפתור "קבל ברירת מחדל":
await saveRulesToDB(DEFAULT_RULES);
// banner אחרי skip:
// "שים לב: אלו כללי ברירת מחדל — התאם ב-⚙️ הגדרות"
```

## ז18. Concurrent Edit — גרעיניות

`checkConcurrentEdit()` נקרא לפני **כל** שמירה ל-DB: saveConfig, saveRulesToDB, saveTemplatesToDB, addToHistory.

## ז19. WeekdayTimesSection vs WeekdayPosterEditor

- `WeekdayTimesSection` — חלק ממודעת שבת (שעות קבועות בפוסטר השבתי) — **נשאר**
- `WeekdayPosterEditor` — tab נפרד, מודעת חול עצמאית — **חדש**

## ז20. fetchZmanimForWeekday — 6 קריאות מקביל

```javascript
// Promise.allSettled → יום שנכשל מציג "—" בתא, לא חוסם
```

---

# חלק ח: מימוש

## ח1. קבועים ו-Utilities חדשים

### zmanimApi.js

```javascript
export const DAY_NAMES_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
export const DAY_NAMES_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
```

### src/lib/utils.js (או קובץ utils קיים)

```javascript
export function getSundayOfCurrentWeek() {
  const now = new Date();
  const israelStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const d = new Date(israelStr + 'T12:00:00');
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - d.getDay());
  return sunday.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

export function formatIsraeliTime(iso) {
  const d = new Date(iso);
  const dayName = d.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long' });
  const time = d.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  return `${dayName} ${time}`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
}

export function isValidTime(str) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(str || '');
}
```

### WeekdayPosterEditor — computeShacharit

```javascript
function computeShacharit(zmanim, dayIndex, rules, mode) {
  if (mode === 'uniform') return rules.shacharitFixed || '';
  if (mode === 'auto' && zmanim?.sunrise) {
    return applyOffset(zmanim.sunrise, rules.shacharitOffset || 10, 'up');
  }
  if (mode === 'perDay') return '';
  return '';
}
```

---

## ח2. שינויי Base44 Entities (Admin Console)

| Entity | שדות חדשים לוסיף |
|--------|-----------------|
| `Synagogue` | `yom_tov_rules` (JSON), `weekday_rules` (JSON), `weekday_rows` (JSON), `logo_url` (String), `accent_color` (String), `is_active` (Boolean) |
| `SynagogueAccount` | `token_created_at` (String), `role` (String) |
| `PublicPoster` | `synagogue_id` (String), `city_name` (String), `logo_url` (String), `accent_color` (String) |

---

## ח3. שלב א׳ — ליבה ותיקוני באגים

### א1. הסרת `direction: 'at'`

**קבצים:**
- `src/lib/posterEngine.js` — `calcPrayerRowsFromRules`: הסר תנאי `direction === 'at'`, השתמש ב-`dayTag` לkroundDir
- `src/components/RelativeZmanimConfig.jsx` — DEFAULT_RULES: החלף `direction: 'at'` ב-`direction: 'after', offsetMinutes: 0`
- `src/lib/synagogueConfig.js` — DEFAULT_RULES: אותו שינוי
- **בדיקה:** `grep -r "direction.*at" src/` → אין תוצאות

### א2. `calcPrayerRowsFromRules` — SSOT יחיד

- `src/components/RelativeZmanimConfig.jsx`: מחק הגדרה מקומית, הוסף `import { calcPrayerRowsFromRules } from '@/lib/posterEngine'`
- `src/lib/posterEngine.js`: וודא `export function calcPrayerRowsFromRules(...)`

### א3. `getSmartFriday`

- הוסף ל-`src/lib/zmanimApi.js` (או `posterEngine.js`)
- עדכן `generatePosterPayload`: `const friday = getSmartFriday(targetDate);`

### א4. BILINGUAL_LABELS

- `src/components/PrayerTimesPoster.jsx`: הוסף `'אבות ובנים'` ותקן `'מעריב מוצ"ש'`

### א5. תיקון Molad (שבת מברכים)

- `src/lib/zmanimApi.js` — `fetchShabbatInfo`: החלף לוגיקת `if (molad && !specialShabbat)` בבדיקת `category === 'mevarchim'`

### א6. תיקון DisplayMode — כפילויות + prayerRows + interval

- `src/pages/DisplayMode.jsx`:
  - מחק `isYomTov` ו-`showHebrewDate` כפולים
  - מחק `prayerRows: []` hardcoded — שלוף מ-poster_data
  - שנה interval מ-30 דק׳ ל-5 דק׳

---

## ח4. שלב ב׳ — נתונים ושמירה

### ב1. הוסף `synagogue_id` ל-PublicPoster

- Base44 Admin: הוסף שדה `synagogue_id: String`
- `src/pages/Home.jsx` — כל `PublicPoster.create`: הוסף `synagogue_id: synagogueId`
- `src/pages/PublicPoster.jsx`: שנה שליפה ל-`filter({ synagogue_id, is_active: true })`

### ב2. Deactivate פוסטרים ישנים

- `src/pages/Home.jsx` — `handlePublish`: deactivate ישנים לפני create חדש (ראה ה1)

### ב3. שדות חדשים ב-Synagogue entity

- Base44 Admin: הוסף `yom_tov_rules`, `weekday_rules`, `weekday_rows`, `logo_url`, `accent_color`, `is_active`

### ב4. synagogueDB.js — פונקציות חדשות

- הוסף 8 פונקציות (ראה ג2)

### ב5. Trim payload לhistory

- `src/lib/templates.js` — `addToHistory`: הוסף `trimPayloadForHistory` לפני שמירה

### ב6. Token Expiry + Backend

- `netlify/functions/loginGabai.js`: הוסף שמירת `token_created_at`, החזר `role`
- `netlify/functions/validateGabaiToken.js`: בדוק גיל token
- `netlify/functions/createGabaiAccount.js`: הסר `password` מresponse

### ב7. `SynagogueAccount.token_created_at` + `role`

- Base44 Admin: הוסף שדות (ראה ח2)

---

## ח5. שלב ג׳ — UX ועיצוב

### ג1. PosterSkeleton

- צור `src/components/PosterSkeleton.jsx` (ראה ו1)
- עדכן `src/pages/Home.jsx`: import + שימוש

### ג2. A4 wrapper + dark mode fix

- `src/pages/Home.jsx`: עטוף poster ב-div עם `data-poster-preview`
- `src/index.css`: הוסף `[data-poster-preview] { color-scheme: light; background: white; }`

### ג3. 3 כפתורי שיתוף

- `src/pages/Home.jsx` או `src/components/ShareBar.jsx`: 3 כפתורים (ראה ה3)

### ג4. Mobile Tabs

- `src/pages/Home.jsx`: הוסף state `mobileTab` + conditional render (ראה ו3)

### ג5. font-frank wrapper

- `src/components/PrayerTimesPoster.jsx`: עטוף JSX ראשי ב-`<div className="font-frank">`

### ג6. מגבלת 400 תווים

- `src/components/PrayerTimesForm.jsx`: הוסף slice + counter (ראה ו7)

### ג7. /settings Route

- צור `src/pages/SynagogueSettingsPage.jsx`
- `src/App.jsx`: הוסף `<Route path="/settings" element={<SynagogueSettingsPage />} />`
- `src/pages/Home.jsx`: הסר SynagogueSettings accordion, הוסף כפתור ⚙️

---

## ח6. שלב ד׳ — אתר ציבורי

### ד1. SynagogueCard

- צור `src/components/SynagogueCard.jsx` (ראה ה4)

### ד2. PublicBoard

- צור `src/pages/PublicBoard.jsx` (ראה ה4)

### ד3. Routes

- `src/App.jsx`:
  ```jsx
  <Route path="/public" element={<PublicBoard />} />
  <Route path="/public/:synagogueId" element={<PublicPoster />} />
  ```

---

## ח7. שלב ה׳ — DisplayMode משופר

### ה1. Route + synagogueId

- `src/App.jsx`: הוסף `<Route path="/display/:synagogueId" element={<DisplayMode />} />`

### ה2. DisplayMode — fetch מDB + fallback + responsive

- `src/pages/DisplayMode.jsx`: rewrite useEffect הראשי (ראה ה5)

---

## ח8. שלב ו׳ — ריבוי בתי כנסת

### ו1. locationOverride ב-zmanimApi

- `src/lib/zmanimApi.js`: עדכן `fetchZmanim`, `fetchZmanimTwoDays`, `fetchShabbatInfo` + הוסף `fetchZmanimForWeekday`

### ו2. posterEngine — העבר lat/lng

- `src/lib/posterEngine.js`: עדכן חתימת `generatePosterPayload`, העבר `locationOverride`

### ו3. Home.jsx — העבר lat/lng ל-generate

- `src/pages/Home.jsx`: הוסף `lat, lng, timezone` בקריאה ל-`generatePosterPayload`

### ו4. SynagogueForm — שדות נוספים

- `src/components/SynagogueForm.jsx`: הוסף `lat`, `lng`, `logo_url`, `accent_color`

### ו5. Concurrent Edit

- `src/pages/Editor.jsx`: הוסף `loadedAt` state + `checkConcurrentEdit` (ראה ה8)

---

## ח9. שלב ז׳ — Onboarding + הגדרות מתקדמות

### ז1. OnboardingWizard

- צור `src/components/OnboardingWizard.jsx` (ראה ה6)

### ז2. Editor.jsx — הפעל Wizard

- `src/pages/Editor.jsx`: בדוק `is_onboarded`, הצג Wizard

### ז3. HebCal Fallback Cache

- `src/lib/posterEngine.js`: הוסף `saveZmanimCache` + try/catch עם localStorage fallback

### ז4. WeekdayPosterEditor + WeekdayPoster

- צור `src/components/WeekdayPosterEditor.jsx`
- צור `src/components/WeekdayPoster.jsx`
- עדכן `src/pages/Home.jsx`: הוסף tab "ימי חול"

### ז5. resolveActiveProfile + מעבר אוטומטי

- `src/lib/posterEngine.js`: הוסף `resolveActiveProfile`

### ז6. SynagogueSettingsPage — מבנה מלא

- `src/pages/SynagogueSettingsPage.jsx`: Tabs (location, rules, design, profiles, backup)

### ז7. Backup/Restore JSON

- ב-tab "גיבוי" ב-SynagogueSettingsPage (ראה ה9)

### ז8. Promise.allSettled ב-loadZmanimData

- `src/components/PrayerTimesForm.jsx`: החלף `Promise.all` ב-`Promise.allSettled` (ראה ז1)

### ז9. Molad + userEditedRows

- `src/components/PrayerTimesForm.jsx`: תקן moladEditable bug + הוסף userEditedRows flag (ראה ז2, ז3)

---

## ח10. סדר ביצוע — תלויות

```
שלב א (ליבה) → שלב ב (נתונים) → שלב ג (UX) → שלב ד (ציבורי) → שלב ה (DisplayMode) → שלב ו (ריבוי) → שלב ז (advanced)

תלויות קריטיות:
- א2 (SSOT calcPrayerRowsFromRules) → לפני כל שימוש
- א3 (getSmartFriday) → לפני auto-generate
- ב1 (synagogue_id ב-PublicPoster) → לפני שלב ד + ה
- ב3 (Base44 entities חדשים) → לפני ב4
- ג7 (/settings route) → לפני ז1 (Onboarding)
- ו1 (locationOverride) → לפני ז4 (WeekdayEditor)
```

---

## ח11. רשימת קבצים

### קבצים חדשים

| קובץ | שלב | תיאור |
|------|-----|--------|
| `src/components/PosterSkeleton.jsx` | ג1 | Skeleton בזמן טעינה |
| `src/components/SynagogueCard.jsx` | ד1 | כרטיס בית כנסת בלוח |
| `src/pages/PublicBoard.jsx` | ד2 | לוח ציבורי |
| `src/pages/SynagogueSettingsPage.jsx` | ג7/ז6 | דף הגדרות גבאי |
| `src/components/OnboardingWizard.jsx` | ז1 | Wizard לגבאי חדש |
| `src/components/WeekdayPosterEditor.jsx` | ז4 | עורך מודעת חול |
| `src/components/WeekdayPoster.jsx` | ז4 | תצוגת מודעת חול |

### קבצים קיימים שישתנו

| קובץ | שינויים עיקריים |
|------|----------------|
| `src/lib/posterEngine.js` | getSmartFriday, locationOverride, selectRules, resolveActiveProfile, HebCal cache+fallback, isYomTovShabbat/labelDayB |
| `src/lib/zmanimApi.js` | locationOverride, fetchZmanimForWeekday, specialShabbatList, molad fix, holidayName |
| `src/lib/synagogueDB.js` | +saveWeekdayRows/Rules, +loadWeekdayRows/Rules, +saveYomTovRules, +loadYomTovRules, +isRishon, serialized queue+rollback |
| `src/lib/synagogueConfig.js` | הסר rules מsynagogue_config, +DEFAULT_WEEKDAY_RULES, +is_onboarded, +activeProfileOverride |
| `src/lib/templates.js` | trimPayloadForHistory בaddToHistory |
| `src/components/RelativeZmanimConfig.jsx` | מחק calcPrayerRowsFromRules, ייבא מposterEngine, הסר 'at', 2 שורות mobile, disabled לגבאי עוזר |
| `src/components/PrayerTimesPoster.jsx` | font-frank wrapper, BILINGUAL_LABELS |
| `src/components/PrayerTimesForm.jsx` | announcements 400 תווים, Promise.allSettled, moladEditable fix, userEditedRows |
| `src/components/SynagogueForm.jsx` | +lat, lng, logo_url, accent_color |
| `src/pages/Home.jsx` | +lat/lng לgenerate, PosterSkeleton, A4 wrapper, 3 כפתורי share, mobile tabs, ⚙️→/settings, handlePublish, fallback warning |
| `src/pages/Editor.jsx` | +OnboardingWizard, +checkConcurrentEdit, navigate('/login',{state:{error}}) |
| `src/pages/DisplayMode.jsx` | useParams, שליפה מDB+fallback, 5min interval, responsive font, duplicate fix |
| `src/pages/PublicPoster.jsx` | useParams synagogueId, שליפה לפי synagogue_id |
| `src/pages/GabaiLogin.jsx` | הצג שגיאה מlocation.state?.error |
| `src/App.jsx` | routes: /public, /public/:synagogueId, /display/:synagogueId, /settings |
| `src/index.css` | [data-poster-preview]{color-scheme:light} |
| `netlify/functions/loginGabai.js` | token_created_at, החזר role |
| `netlify/functions/createGabaiAccount.js` | הסר password מresponse |
| `netlify/functions/validateGabaiToken.js` | בדוק גיל 30 יום |
