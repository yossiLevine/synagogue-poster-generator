# 🐛 Bug Report - Functionality & UX/UI Issues

## סיכום
מצאתי **40+ באגים** בניתוח הקוד בקטגוריות: פונקציונאליות, UX/UI, אבטחה, וביצועים.

---

## 🔴 CRITICAL (חוקי בקיוםן)

### Bug #1: localStorage vs DB Sync - Loss of Data
**קובץ:** `components/RelativeZmanimConfig.js` (lines 67-72)
**בעיה:**
```javascript
export function saveRules(rules) {
  localStorage.setItem(RULES_LS_KEY, JSON.stringify(rules));
  if (getSynagogueId()) {
    saveRulesToDB(rules).catch(e => console.warn(...)); // ⚠️ silent fail!
  }
}
```
**הבעיה:** אם ה-DB save נכשל, המשתמש לא יודע. הנתונים ב-localStorage אבל לא ב-DB.

**תיקון:**
```javascript
export async function saveRules(rules) {
  localStorage.setItem(RULES_LS_KEY, JSON.stringify(rules));
  if (getSynagogueId()) {
    try {
      await saveRulesToDB(rules);
    } catch (e) {
      console.error('Failed to save rules to DB:', e);
      throw new Error('שגיאה בשמירה לשרת - אנא נסה שוב');
    }
  }
}
```

**impact:** גבוה - משתמש חושב שנשמר אבל לא באמת

---

### Bug #2: API Response שגיאות לא מטופלות
**קובץ:** `pages/Editor.js` (lines 28-35)
**בעיה:**
```javascript
const loadSynagogue = async (sId, isAdminToken = false) => {
  try {
    const syn = await base44.entities.Synagogue.get(sId);
    if (!syn) throw new Error('Synagogue not found');
    // ... אבל אין toast/alert למשתמש!
  } catch (e) {
    console.error('Error loading synagogue:', e);
    navigate('/login'); // קורס בשקט
  }
};
```

**הבעיה:** שגיאות לא מוצגות למשתמש, פשוט קורס.

**תיקון:** הוסף toast.error() או alert() להודעה.

---

### Bug #3: Unauthorized Redirect Bug
**קובץ:** `pages/AdminDashboard.js` (lines 28-36)
**בעיה:**
```javascript
const checkAuth = async () => {
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') {
    // לא מתנווט הלאה!
    return;
  }
};
```

**הבעיה:** אם משתמש לא admin, הפונקציה פשוט חוזרת - לא מנווטת ל-/login.

---

### Bug #4: Duplicate synagogue_id in localStorage
**קובץ:** `pages/Editor.js` (line 13)
**בעיה:**
```javascript
const [synagogueId, setSynagogueId] = useState(null);

useEffect(() => {
  const sId = localStorage.getItem('synagogue_id');
  if (!sId) navigate('/login');
  loadSynagogue(sId); // ✅ זה בסדר
}, []);
```

אבל בקוד אחר:
```javascript
const saveAsTemplate = async () => {
  // ... שמה שומר עם:
  localStorage.setItem('template_' + synagogueId, ...); // ✓
  // אבל לא בודק אם synagogueId undefined!
}
```

**הבעיה:** אם synagogueId לא טוען במהירות, עשוי לשמור עם `template_null`.

---

## 🟠 HIGH (משפיע על חוויה)

### Bug #5: No Loading State in Initial Setup
**קובץ:** `components/InitialSetup.jsx` (lines 95-100)
**בעיה:**
```jsx
const handleSaveBasic = async () => {
  // ... validation ...
  setSaving(true);
  await base44.entities.Synagogue.update(...);
  setCompleted({ ...completed, basic: true });
  setSaving(false);
}
```

**בעיה:** אם network איטי, אין indication שהשמירה בתוכנית. לחצן עדיין נראה clickable.

**פתרון:** הוסף `disabled={saving}` לבטנים.

---

### Bug #6: Prayer Times Calculation - Timezone Issues
**קובץ:** `lib/zmanimApi.js`
**בעיה:**
```javascript
const fetchZmanim = async (dateString) => {
  // dateString = "2026-04-18" (ISO format)
  const date = new Date(dateString); // ⚠️ זה ב-UTC, לא בזמן היישור!
  // ...
}
```

**בעיה:** בישראל (UTC+3), תאריכים יכולים להיות עד יום קודם/אחרי.

**תיקון:** השתמש `date = new Date(dateString + 'T12:00:00Z')` או ב-moment/date-fns עם timezone.

---

### Bug #7: No Debounce on Date Change
**קובץ:** `components/PrayerTimesForm.jsx` (lines 113-123)
**בעיה:**
```javascript
useEffect(() => {
  // ⚠️ זה קורא API עבור כל keystroke בשדה תאריך!
  if (selectedDate && selectedDateB) {
    loadZmanimData(selectedDate, selectedDateB);
  }
}, [selectedDate, selectedDateB]);
```

**ה"בעיה:** אם משתמש משנה תאריך ממ"ג עשרות פעמים, זה שולח עשרות API calls.

**תיקון:** כבר יש `setTimeout` אבל עדיין קורא כמה פעמים. צריך debounce תוקני.

---

### Bug #8: No Error Boundary
**קובץ:** `App.jsx`
**בעיה:** אין `ErrorBoundary` component. אם קומפוננט קורס, כל האפליקציה קורסת.

**תיקון:** הוסף React ErrorBoundary או try/catch בקומפוננטים משמעותיים.

---

### Bug #9: Missing Null Check - PrayerRows
**קובץ:** `components/PrayerTimesPoster.jsx` (line 47)
**בעיה:**
```javascript
{prayerRows?.length > 0 && (
  <div className="space-y-1 px-2 md:px-8">
    {prayerRows.map((row, i) => (
      row.isHeader ? (
        // ✓ בדוק
      ) : row.isNote ? (
        // ✓ בדוק
      ) : !row.time ? (
        // ✓ בדוק
      ) : (
        // זה המקרה הרגיל
        <div>
          <span>{row.label}</span>
          <span>{row.time}</span> {/* ⚠️ אם row.time = undefined */}
        </div>
      )
    ))}
  </div>
)}
```

**בעיה:** אם `row.time` היא `undefined` או `null`, מופיע טקסט ריק.

---

### Bug #10: No Validation on Rule Offsets
**קובץ:** `components/RelativeZmanimConfig.jsx` (lines 108-115)
**בעיה:**
```javascript
const updateMinutes = (i, val) => {
  const absVal = Math.abs(parseInt(val || 0, 10));
  // ⚠️ אם val = "abc", parseInt("abc") = NaN!
  const signed = rule.direction === 'before' ? -absVal : absVal;
  // NaN מתפשט בכל החישובים!
};
```

**תיקון:** בדוק `if (isNaN(absVal)) { showError(...); return; }`.

---

## 🟡 MEDIUM (בעיות ממערכת)

### Bug #11: Memory Leak in Event Listeners
**קובץ:** `components/SynagogueEmblem.jsx` (lines 10-16)
**בעיה:**
```javascript
useEffect(() => {
  const handler = () => setConfig(getConfig());
  window.addEventListener('synagogue-config-changed', handler);
  return () => window.removeEventListener('synagogue-config-changed', handler);
  // ✓ בסדר, אבל בקובץ אחר יש בעיה...
}, []);
```

אבל ב-`PrayerTimesForm.jsx`:
```javascript
const handleApplyRules = (rules) => {
  // ... logic ...
  // ⚠️ לא dispatch event! אז SynagogueEmblem לא יודע שנשתנה
};
```

**בעיה:** אין ה-sync בין קומפוננטים.

---

### Bug #12: Duplicate Zmanim API Calls
**קובץ:** `components/PrayerTimesForm.jsx` (lines 87-90)
**בעיה:**
```javascript
useEffect(() => {
  loadZmanimData(undefined, undefined); // ← first call on mount
  loadTemplates().then(setTemplates); // ← parallel
}, []);

useEffect(() => {
  // ... dependency change
  loadZmanimData(selectedDate, selectedDateB); // ← second call
}, [selectedDate, selectedDateB]);
```

**בעיה:** אם תאריך ברירת מחדל = היום, קורא API פעמיים.

---

### Bug #13: No Retry Logic on Failed Requests
**קובץ:** `lib/synagogueDB.js`
**בעיה:**
```javascript
const saveRulesToDB = async (rules) => {
  const synagogue = await base44.entities.Synagogue.get(synagogueId);
  // אם זה נכשל, אין retry!
  await base44.entities.Synagogue.update(synagogueId, {
    prayer_rules: JSON.stringify(rules)
  });
};
```

**בעיה:** אם network זמנית חסרה, משתמש מאבד נתונים.

---

### Bug #14: No Validation in Logo Upload
**קובץ:** `components/InitialSetup.jsx` (lines 79-95)
**בעיה:**
```javascript
const handleLogoUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) { // ✓ בדוק גודל
    alert('...');
    return;
  }
  
  // ⚠️ לא בודק mime type!
  const res = await base44.integrations.Core.UploadFile({ file });
};
```

**בעיה:** משתמש יכול להעלות .exe או קובץ גדול יותר.

**תיקון:** בדוק `file.type.startsWith('image/')`.

---

### Bug #15: No Confirmation on Delete
**קובץ:** `components/RelativeZmanimConfig.jsx` (line 92)
**בעיה:**
```javascript
const handleDeleteProfile = (name) => {
  deleteProfile(name); // ⚠️ בלא אישור!
  setProfiles(loadProfiles());
};
```

**בעיה:** אם משתמש לוחץ בטעות, תבנית הולכת לנצח.

**תיקון:** הוסף `if (window.confirm('Delete profile?')) { ... }`.

---

### Bug #16: XSS Vulnerability in Announcements
**קובץ:** `components/PrayerTimesPoster.jsx` (line 146)
**בעיה:**
```javascript
{announcements && (
  <>
    <Divider theme={theme} />
    <div className="px-4">
      <h3>הודעות</h3>
      <p>{announcements}</p> {/* ✓ בסדר */}
    </div>
  </>
)}
```

תחת זה בסדר, אבל ב-`GeneralPoster.jsx`:
```javascript
<div dangerouslySetInnerHTML={{ __html: announcements }} /> // ⚠️ XSS!
```

**בעיה:** משתמש יכול להכניס `<script>alert('hack')</script>`.

---

### Bug #17: No Max Length on Text Inputs
**קובץ:** `components/PrayerTimesForm.jsx`
**בעיה:**
```javascript
<Input 
  value={parasha} 
  onChange={(e) => setParasha(e.target.value)} 
  // ⚠️ ללא maxLength!
  placeholder="..." 
/>
```

**בעיה:** משתמש יכול להכניס 10,000 תווים, מה שמקלקל את המודעה.

**תיקון:** הוסף `maxLength={100}`.

---

## 🔵 LOW (Improvements)

### Bug #18: No Skeleton Loading State
**בעיה:** כשטוענים זמנים, יש רק spinner בלי תוכן. UX קודר.

**תיקון:** הוסף Skeleton לטבלת הזמנים בזמן טעינה.

---

### Bug #19: No Copy to Clipboard Feedback
**קובץ:** `components/CreateGabaiForm.jsx` (lines 77-82)
**בעיה:**
```javascript
<button onClick={() => {
  navigator.clipboard.writeText(password);
  // ⚠️ אין toast "copied!"
}}>
  Copy
</button>
```

**תיקון:** הוסף `toast.success('Copied!')`.

---

### Bug #20: No Keyboard Shortcut
**בעיה:** משתמש צריך לחזור ללחוץ על "צור מודעה" כל פעם. אפשר Cmd+Enter.

---

### Bug #21: No Dark Mode Toggle
**בעיה:** אפליקציה תמיד בריא בהיר. אפשר להוסף theme toggle.

---

### Bug #22: Prayer Row Drag & Drop - No Visual Feedback
**קובץ:** `components/PrayerTimesForm.jsx` (lines 206-240)
**בעיה:**
```javascript
<Draggable key={row.id} draggableId={row.id} index={i}>
  {(provided, snapshot) => (
    <div
      {...provided.draggableProps}
      className={`... ${snapshot.isDragging ? 'opacity-80 shadow-lg' : ''}`}
```

**בעיה:** בחירה חלשה מדי. משתמש לא בטוח שזה draggable.

**תיקון:** הוסף cursor: grab/grabbing.

---

### Bug #23: No "Unsaved Changes" Warning
**בעיה:** משתמש משנה חוקים, רוחק דף בלא שמירה, והדברים אבדות בשקט.

**תיקון:** הוסף `beforeunload` event listener.

---

### Bug #24: Date Picker - No Max Date
**קובץ:** `components/PrayerTimesForm.jsx`
**בעיה:**
```javascript
<Input type="date" value={selectedDate} onChange={handleDateChange} />
// ⚠️ משתמש יכול לבחור שנה 2050!
```

**תיקון:** הוסף `max={futureDate}` ו-`min={todayDate}`.

---

### Bug #25: No Search/Filter in Template List
**בעיה:** אם למשתמש יש 50 תבניות, הרשימה ארוכה. אפשר להוסף filter.

---

### Bug #26: No Undo/Redo
**בעיה:** משתמש מוחק שורה בטעות, אין דרך להחזיר.

---

### Bug #27: Image Upload - No Crop/Resize
**קובץ:** `components/InitialSetup.jsx`
**בעיה:**
```javascript
const res = await base44.integrations.Core.UploadFile({ file });
// ⚠️ תמונה גדולה מדי עלול להיות איטי
```

**תיקון:** בצע resize ב-client לפני upload.

---

### Bug #28: No Analytics on User Actions
**בעיה:** לא ידוע כמה משתמשים משתמשים בתכונה X vs Y.

**תיקון:** הוסף `base44.analytics.track()` calls.

---

### Bug #29: No Empty State Messages
**בעיה:** אם אין תבניות/הודעות, מופיע רק רשימה ריקה.

**תיקון:** הוסף "No templates yet" message.

---

### Bug #30: No Rate Limiting on API Calls
**בעיה:** משתמש יכול לתקוף את השרת עם 1000 requests/sec.

**תיקון:** הוסף client-side rate limiting (debounce/throttle).

---

## 🔒 SECURITY ISSUES

### Bug #31: No CSRF Protection
**בעיה:** אם משתמש בא אתר זדוני, יכול להבצע פעולות בשמו.

**תיקון:** בדוק ש-POST requests יש CSRF token.

---

### Bug #32: Sensitive Data in LocalStorage
**בעיה:** `gabai_token` שמור בלי הצפנה.

**תיקון:** שמור בـ sessionStorage או httpOnly cookie.

---

### Bug #33: No Input Sanitization
**בעיה:** בדיקות לא מנקה input (למרות שאין XSS right now).

**תיקון:** השתמש `DOMPurify` או React's built-in escaping.

---

### Bug #34: Admin Impersonation Exploit
**קובץ:** `pages/Editor.js` (lines 17-21)
**בעיה:**
```javascript
const isAdminMode = localStorage.getItem('gabai_token')?.startsWith('admin_');
```

**בעיה:** משתמש יכול לשנות localStorage ל-`admin_fake` וזה יעבוד!

**תיקון:** בדוק admin role ב-server, לא ב-client.

---

### Bug #35: Weak Password Requirements
**קובץ:** `components/SynagogueForm.jsx`
**בעיה:** אין validation שסיסמה חזקה (min 8 chars, special chars, וכו').

---

## 📊 PERFORMANCE ISSUES

### Bug #36: No Image Lazy Loading
**בעיה:** כל התמונות נטענות בבת אחת.

**תיקון:** הוסף `loading="lazy"` ל-img tags.

---

### Bug #37: No Code Splitting
**בעיה:** בונדל JS אחד גדול במקום lazy load דפים.

**תיקון:** השתמש `React.lazy()` ו-Suspense.

---

### Bug #38: No Caching Headers
**בעיה:** CSS/JS טוען מהשרת כל פעם במקום cache.

**תיקון:** הוסף Cache-Control headers.

---

### Bug #39: Unnecessary Re-renders
**קובץ:** `pages/Home.jsx`
**בעיה:** הקומפוננט re-renders too often (ללא memo/useMemo).

**תיקון:** העטף בـ `React.memo()` או שימוש `useMemo`.

---

### Bug #40: No Service Worker
**בעיה:** אפליקציה לא עובדת offline.

**תיקון:** implement PWA עם service worker.

---

## 📝 SUMMARY TABLE

| # | Bug | Severity | Category |
|---|-----|----------|----------|
| 1 | localStorage vs DB Sync | Critical | Data Loss |
| 2 | API Errors Not Shown | Critical | UX |
| 3 | Unauthorized Redirect | Critical | Security |
| 4 | Duplicate synagogue_id | Critical | Logic |
| 5 | No Loading State | High | UX |
| 6 | Timezone Issues | High | Functionality |
| 7 | No Debounce | High | Performance |
| 8 | No Error Boundary | High | Stability |
| 9 | Missing Null Checks | High | Stability |
| 10 | No Validation | High | Logic |
| 11-15 | Various Medium Issues | Medium | Various |
| 16-30 | Various Low Issues | Low | UX/Minor |
| 31-40 | Security & Performance | Medium/Low | Security/Perf |

---

## ✅ NEXT STEPS

1. **Priority 1:** Fix Critical bugs (#1-4)
2. **Priority 2:** Fix High bugs (#5-10)
3. **Priority 3:** Add tests for all bugfixes
4. **Priority 4:** Address Medium/Low issues

---

**Last Updated:** 2026-04-17
**Test Coverage:** ~40 issues identified
**Estimated Fix Time:** 2-3 weeks (if 1 dev)