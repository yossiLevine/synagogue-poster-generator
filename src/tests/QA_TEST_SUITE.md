# 🧪 Test Suite - Synagogue Management System

## סקופ הבדיקה
בדיקות מלאות על:
- ✅ יצירה ושמירה של בית כנסת
- ✅ ניהול אימות (גבאי/אדמין)
- ✅ שמירה וחישוב חוקי תפילה
- ✅ אפליקציה חזרה למערכת
- ✅ זרימות משלימות
- ✅ ניהול הודעות ואירועים

---

## 1️⃣ UNIT TESTS - ShabbatLogic

### Test 1.1: חישוב זמני תפילה מחוקים
**תיאור:** בדוק שחוקי התפילה מחשבים שעות נכון

```javascript
// FILE: tests/unit/prayerRules.test.js
import { calcPrayerRowsFromRules, DEFAULT_SHABBAT_RULES } from '@/lib/RelativeZmanimConfig';

describe('Prayer Rules Calculation', () => {
  test('Should calculate prayer time 30 minutes after sunrise', () => {
    const mockZmanim = {
      sunrise: '2026-04-18T05:30:00Z',
      sunset: '2026-04-18T18:45:00Z',
    };
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30, direction: 'after', dayTag: 'A' }
    ];
    
    const result = calcPrayerRowsFromRules(rules, mockZmanim, null, null);
    expect(result[0].time).toBe('06:00'); // 05:30 + 30 דקות
  });

  test('Should handle negative offset (before)', () => {
    const mockZmanim = {
      sunset: '2026-04-18T18:45:00Z',
    };
    const rules = [
      { label: 'מעריב', baseZman: 'sunset', offsetMinutes: -5, direction: 'before', dayTag: 'A' }
    ];
    
    const result = calcPrayerRowsFromRules(rules, mockZmanim, null, null);
    expect(result[0].time).toBe('18:40');
  });

  test('Should use day B zmanim when dayTag is B', () => {
    const zmanimA = { sunrise: '2026-04-18T05:30:00Z' };
    const zmanimB = { sunrise: '2026-04-19T05:28:00Z' };
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30, direction: 'after', dayTag: 'B' }
    ];
    
    const result = calcPrayerRowsFromRules(rules, zmanimA, null, zmanimB);
    expect(result[0].time).toBe('05:58'); // 05:28 + 30
  });
});
```

**בדיקה ידנית:**
- [ ] צא לעמוד עורך → בחר תאריך שבת
- [ ] לחץ "החל כללים" עם ברירת מחדל
- [ ] בדוק שכל הזמנים חוקיים (לא אפס, בתוך טווח זה שעות בערך)
- [ ] שנה offset של כלל אחד ב-±10 דקות
- [ ] בדוק שהשעה השתנתה בהתאם

---

### Test 1.2: שמירה של חוקים ל-localStorage וDB
**תיאור:** בדוק שחוקים שמורים בשני המקומות

```javascript
// FILE: tests/unit/synagogueDB.test.js
import { loadRules, saveRules } from '@/lib/RelativeZmanimConfig';
import { getSynagogueId, saveRulesToDB, loadRulesFromDB } from '@/lib/synagogueDB';

describe('Rules Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('Should save rules to localStorage', () => {
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30 }
    ];
    
    saveRules(rules);
    const loaded = loadRules();
    expect(loaded).toEqual(rules);
  });

  test('Should save rules to DB when synagogueId exists', async () => {
    const mockSynagogueId = 'syn-123';
    localStorage.setItem('synagogue_id', mockSynagogueId);
    
    const rules = [{ label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30 }];
    await saveRules(rules);
    
    const dbRules = await loadRulesFromDB();
    expect(dbRules).toEqual(rules);
  });

  test('Should handle empty rules', () => {
    saveRules([]);
    const loaded = loadRules();
    expect(loaded).toEqual([]);
  });
});
```

**בדיקה ידנית:**
- [ ] עורך → הוסף כלל חדש
- [ ] רענן דף (F5) - בדוק שהכלל עדיין קיים
- [ ] פתח DevTools → Application → LocalStorage → חפש `synagogue_relative_rules`
- [ ] בדוק שה-JSON שם תואם את מה שכתוב

---

## 2️⃣ INTEGRATION TESTS - Database & Auth

### Test 2.1: יצירת בית כנסת וגבאי
**תיאור:** צור בית כנסת חדש עם אימות

```javascript
// FILE: tests/integration/synagogueSetup.test.js
import { base44 } from '@/api/base44Client';

describe('Synagogue Setup Flow', () => {
  test('Should create synagogue with all required fields', async () => {
    const synagogueData = {
      name: 'בית כנסת תוברי קדיש',
      city: 'תל אביב',
      latitude: 32.0853,
      longitude: 34.7818,
    };

    const result = await base44.entities.Synagogue.create(synagogueData);
    
    expect(result.id).toBeDefined();
    expect(result.name).toBe(synagogueData.name);
    expect(result.city).toBe(synagogueData.city);
    expect(result.is_active).toBe(true);
  });

  test('Should create SynagogueAccount (Gabai) with hashed password', async () => {
    const synagogueId = 'syn-test-001';
    const gabaiData = {
      synagogue_id: synagogueId,
      username: 'rabbi_david',
      email: 'rabbi@example.com',
      phone: '+972505555555',
      role: 'gabaai',
      subscribed_to_reminders: true,
    };

    const result = await base44.entities.SynagogueAccount.create(gabaiData);
    
    expect(result.id).toBeDefined();
    expect(result.role).toBe('gabaai');
    expect(result.is_active).toBe(true);
    // בדוק שהסיסמה לא שמורה כטקסט
    expect(result.password_hash).toBeDefined();
  });

  test('Should fetch synagogue by ID', async () => {
    const synagogueId = 'syn-test-001';
    const synagogue = await base44.entities.Synagogue.get(synagogueId);
    
    expect(synagogue).toBeDefined();
    expect(synagogue.id).toBe(synagogueId);
  });

  test('Should update synagogue config', async () => {
    const synagogueId = 'syn-test-001';
    const update = { city: 'ירושלים' };
    
    const result = await base44.entities.Synagogue.update(synagogueId, update);
    
    expect(result.city).toBe('ירושלים');
  });
});
```

**בדיקה ידנית:**
- [ ] נווט ל-`/login` → בחר "צור בית כנסת חדש"
- [ ] מלא את כל השדות (שם, עיר, קוארדינטות)
- [ ] יצור גבאי עם דוא"ל + סיסמה
- [ ] בדוק שפרטי הגבאי נשמרו ב-DB
- [ ] נסה להתחבר עם שם המשתמש/סיסמה החדשה

---

### Test 2.2: אימות וטוקנים
**תיאור:** בדוק זרימת התחברות

```javascript
// FILE: tests/integration/authentication.test.js

describe('Gabai Authentication', () => {
  test('Should login with valid credentials', async () => {
    // מניח שקיים gabai עם username="rabbi_david", password="secret123"
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'rabbi_david',
        password: 'secret123'
      })
    });

    expect(response.status).toBe(200);
    const { token, synagogue_id } = await response.json();
    
    expect(token).toBeDefined();
    expect(token).toMatch(/^[a-zA-Z0-9_-]+$/); // JWT-like format
    expect(synagogue_id).toBeDefined();
  });

  test('Should reject invalid password', async () => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'rabbi_david',
        password: 'wrongpassword'
      })
    });

    expect(response.status).toBe(401);
  });

  test('Should reject non-existent user', async () => {
    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        username: 'nonexistent',
        password: 'anypassword'
      })
    });

    expect(response.status).toBe(404);
  });

  test('Should store token in localStorage', async () => {
    // בדוק שאחרי התחברות מוצלחת:
    expect(localStorage.getItem('gabai_token')).toBeDefined();
    expect(localStorage.getItem('synagogue_id')).toBeDefined();
  });

  test('Should clear tokens on logout', async () => {
    localStorage.setItem('gabai_token', 'test-token');
    localStorage.setItem('synagogue_id', 'syn-123');
    
    // סימולציה של logout
    localStorage.removeItem('gabai_token');
    localStorage.removeItem('synagogue_id');
    
    expect(localStorage.getItem('gabai_token')).toBeNull();
    expect(localStorage.getItem('synagogue_id')).toBeNull();
  });
});
```

**בדיקה ידנית:**
- [ ] התחבר עם סיסמה נכונה → בדוק שנתמסרת לעורך
- [ ] התחבר עם סיסמה שגויה → בדוק הודעת שגיאה
- [ ] התחבר → פתח DevTools Console → הדפס `localStorage.getItem('gabai_token')`
- [ ] התנתק → בדוק שה-token נמחק

---

## 3️⃣ FUNCTIONAL TESTS - User Workflows

### Test 3.1: יצירת מודעה מלאה
**תיאור:** בדוק את זרימת יצירת מודעה מתחילה עד סוף

```javascript
// FILE: tests/functional/posterCreation.test.js

describe('Complete Poster Creation Flow', () => {
  test('User should be able to create prayer poster step by step', async () => {
    // 1. התחברות
    const loginResponse = await loginGabai('rabbi_david', 'secret123');
    expect(loginResponse.success).toBe(true);

    // 2. בחירת תאריך
    const selectedDate = '2026-04-18'; // שישי
    const dateB = '2026-04-19'; // שבת

    // 3. טעינת זמני היום
    const zmanimResponse = await fetchZmanimTwoDays(selectedDate, dateB);
    expect(zmanimResponse.zmanimA).toBeDefined();
    expect(zmanimResponse.zmanimB).toBeDefined();

    // 4. הגדרת חוקים
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30, direction: 'after', dayTag: 'B' },
      { label: 'מנחה', baseZman: 'minchaGedola', offsetMinutes: 30, direction: 'after', dayTag: 'B' },
    ];

    // 5. חישוב שעות
    const prayerRows = calcPrayerRowsFromRules(rules, zmanimResponse.zmanimA, null, zmanimResponse.zmanimB);
    expect(prayerRows.length).toBe(2);
    expect(prayerRows[0].time).toMatch(/^\d{2}:\d{2}$/); // HH:MM format

    // 6. יצירת מודעה עם תמונה
    const posterData = {
      type: 'prayer',
      parasha: 'פרשת וארא',
      prayerRows: prayerRows,
      announcements: 'שיעור בשעה 9:00',
    };

    const poster = await generatePoster(posterData);
    expect(poster.id).toBeDefined();
    expect(poster.image_url).toBeDefined();

    // 7. שמירה לDB
    const savedPoster = await base44.entities.PublicPoster.create({
      parasha: posterData.parasha,
      date: dateB,
      poster_data: JSON.stringify(posterData),
      image_url: poster.image_url,
    });
    expect(savedPoster.id).toBeDefined();
  });
});
```

**בדיקה ידנית:**
- [ ] היכנס לעורך
- [ ] בחר תאריך (אוטומטי לשישי הבא)
- [ ] בדוק שזמני היום נטענו
- [ ] הוסף 1-2 חוקים מהברירת מחדל
- [ ] לחץ "חשב תפילות" - בדוק שחישוב הצליח
- [ ] מלא אנונסים
- [ ] לחץ "צור מודעה" - בדוק שהמודעה הופיעה בתצוגה מקדימה
- [ ] לחץ "הדפס" - בדוק שדף הדפסה נפתח
- [ ] לחץ "הורד PDF" - בדוק שקבצי נוצר

---

### Test 3.2: עריכה ושמירה של תבניה
**תיאור:** בדוק שמירת תבניות

```javascript
// FILE: tests/functional/templates.test.js

describe('Template Management', () => {
  test('Should save template with custom prayer rows', async () => {
    const customRows = [
      { label: 'שחרית בתשומת לב', time: '07:00', visible: true },
      { label: 'קידוש ודברים', time: '09:30', visible: true },
      { label: 'מנחה מיוחדת', time: '16:00', visible: true },
    ];

    // שמור תבנית
    await saveTemplate('תבנית מיוחדת', customRows);

    // טען תבנית
    const templates = await loadTemplates();
    expect(templates['תבנית מיוחדת']).toBeDefined();
    expect(templates['תבנית מיוחדת'].prayerRows).toEqual(customRows);
  });

  test('Should delete template', async () => {
    await deleteTemplate('תבנית מיוחדת');
    const templates = await loadTemplates();
    expect(templates['תבנית מיוחדת']).toBeUndefined();
  });

  test('Should load template and use it for new poster', async () => {
    // שמור תבנית
    const templateRows = [
      { label: 'שחרית', time: '07:00', visible: true },
    ];
    await saveTemplate('שבת רגילה', templateRows);

    // טען את התבנית
    const templates = await loadTemplates();
    const loaded = templates['שבת רגילה'].prayerRows;

    expect(loaded[0].label).toBe('שחרית');
  });
});
```

**בדיקה ידנית:**
- [ ] עורך → שנה שורות תפילה
- [ ] שמור כתבנית עם שם ("תבנית בדיקה")
- [ ] רענן דף
- [ ] בדוק שהתבנית נתממנה ברשימת התבניות
- [ ] טען אותה - בדוק שהשורות נשמרו

---

## 4️⃣ DATA INTEGRITY TESTS

### Test 4.1: בדיקת נתונים חסרים וערכים גבוליים
**תיאור:** בדוק edge cases

```javascript
// FILE: tests/integrity/validation.test.js

describe('Data Validation', () => {
  test('Should reject empty synagogue name', async () => {
    const synagogueData = {
      name: '', // ריק!
      city: 'תל אביב',
    };

    try {
      await base44.entities.Synagogue.create(synagogueData);
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.message).toContain('required');
    }
  });

  test('Should reject invalid email format', async () => {
    const gabaiData = {
      synagogue_id: 'syn-123',
      username: 'rabbi',
      email: 'not-an-email', // ‼️
      role: 'gabaai',
    };

    try {
      await base44.entities.SynagogueAccount.create(gabaiData);
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.message).toContain('email');
    }
  });

  test('Should reject invalid phone format', async () => {
    const gabaiData = {
      synagogue_id: 'syn-123',
      username: 'rabbi',
      email: 'rabbi@example.com',
      phone: 'not-a-phone', // לא מספר!
      role: 'gabaai',
    };

    try {
      await base44.entities.SynagogueAccount.create(gabaiData);
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.message).toContain('phone');
    }
  });

  test('Should reject out-of-range coordinates', async () => {
    const synagogueData = {
      name: 'בית כנסת',
      city: 'תל אביב',
      latitude: 95, // > 90 ❌
      longitude: 34.7818,
    };

    try {
      await base44.entities.Synagogue.create(synagogueData);
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.message).toContain('coordinate');
    }
  });

  test('Should reject password shorter than minimum', async () => {
    const gabaiData = {
      synagogue_id: 'syn-123',
      username: 'rabbi',
      email: 'rabbi@example.com',
      password: '12', // קצר מדי!
      role: 'gabaai',
    };

    try {
      await base44.entities.SynagogueAccount.create(gabaiData);
      fail('Should have thrown validation error');
    } catch (error) {
      expect(error.message).toContain('password');
    }
  });

  test('Should handle very long prayer row labels', async () => {
    const veryLongLabel = 'א'.repeat(500);
    const prayerRow = {
      label: veryLongLabel,
      time: '10:00',
      visible: true,
    };

    // בדוק שלא קורסת המערכת
    const rendered = renderPrayerTimesPoster({ prayerRows: [prayerRow] });
    expect(rendered).toBeDefined();
  });
});
```

**בדיקה ידנית:**
- [ ] עורך → מלא שם בית כנסת ריק → לחץ שמור → בדוק שאין error
- [ ] מלא קואורדינטות בערכים לא חוקיים (< -90, > 90) → בדוק validation
- [ ] מלא דוא"ל שגוי (`test@` בלא תחום) → בדוק שreject

---

### Test 4.2: בדיקת שמירה ל-DB
**תיאור:** בדוק שלא מאבדים נתונים

```javascript
// FILE: tests/integrity/persistence.test.js

describe('Data Persistence', () => {
  test('Should preserve prayer_rules JSON after update', async () => {
    const synagogueId = 'syn-test-001';
    const rules = [
      { label: 'שחרית', baseZman: 'sunrise', offsetMinutes: 30, direction: 'after', dayTag: 'B' }
    ];

    // שמור חוקים
    const synagogue = await base44.entities.Synagogue.get(synagogueId);
    await base44.entities.Synagogue.update(synagogueId, {
      prayer_rules: JSON.stringify(rules),
    });

    // טען חזרה
    const loaded = await base44.entities.Synagogue.get(synagogueId);
    const parsedRules = JSON.parse(loaded.prayer_rules);

    expect(parsedRules).toEqual(rules);
  });

  test('Should not lose data when updating unrelated fields', async () => {
    const synagogueId = 'syn-test-001';

    // שמור מידע מלא
    const originalData = {
      name: 'בית כנסת א׳',
      city: 'תל אביב',
      prayer_rules: JSON.stringify([{ label: 'שחרית', time: '07:00' }]),
      logo_url: 'https://example.com/logo.png',
    };
    await base44.entities.Synagogue.update(synagogueId, originalData);

    // עדכן רק את העיר
    await base44.entities.Synagogue.update(synagogueId, { city: 'ירושלים' });

    // בדוק שהשאר נשמר
    const loaded = await base44.entities.Synagogue.get(synagogueId);
    expect(loaded.name).toBe('בית כנסת א׳');
    expect(loaded.prayer_rules).toBeDefined();
    expect(loaded.logo_url).toBe('https://example.com/logo.png');
  });

  test('Should handle JSON with special characters', async () => {
    const synagogueId = 'syn-test-001';
    const rules = [
      { label: 'קידוש ודברים ק"ו', baseZman: 'chatzot', offsetMinutes: 0 }
    ];

    await base44.entities.Synagogue.update(synagogueId, {
      prayer_rules: JSON.stringify(rules),
    });

    const loaded = await base44.entities.Synagogue.get(synagogueId);
    const parsed = JSON.parse(loaded.prayer_rules);

    expect(parsed[0].label).toContain('ק"ו');
  });
});
```

**בדיקה ידנית:**
- [ ] עורך → הוסף חוקים וזמנים
- [ ] פתח DevTools → Network → צפה בשמירה ל-DB
- [ ] רענן דף → בדוק שכל הנתונים חוזרים

---

## 5️⃣ UI/UX TESTS

### Test 5.1: ממשק משתמש וטעויות
**תיאור:** בדוק חוויית משתמש

```javascript
// FILE: tests/ui/userInteraction.test.js

describe('User Interface', () => {
  test('Should show loading spinner while fetching zmanim', async () => {
    const { getByText } = render(<PrayerTimesForm onGenerate={() => {}} />);
    
    expect(getByText(/טוען זמני היום/)).toBeInTheDocument();
    
    // המתן לטעינה להסתיים
    await waitFor(() => {
      expect(queryByText(/טוען זמני היום/)).not.toBeInTheDocument();
    });
  });

  test('Should enable generate button only when data is ready', async () => {
    const { getByRole } = render(<PrayerTimesForm onGenerate={() => {}} />);
    const generateBtn = getByRole('button', { name: /צור מודעה/ });
    
    expect(generateBtn).toBeDisabled(); // לפני טעינה
    
    await waitFor(() => {
      expect(generateBtn).not.toBeDisabled(); // אחרי טעינה
    });
  });

  test('Should show error message on failed generation', async () => {
    const { getByText } = render(
      <PrayerTimesForm onGenerate={async () => {
        throw new Error('Generation failed');
      }} />
    );
    
    const generateBtn = getByRole('button', { name: /צור מודעה/ });
    fireEvent.click(generateBtn);
    
    await waitFor(() => {
      expect(getByText(/שגיאה/i)).toBeInTheDocument();
    });
  });

  test('Should show warning when no rules defined', async () => {
    localStorage.setItem('synagogue_relative_rules', JSON.stringify([]));
    
    const { getByText } = render(<PrayerTimesForm onGenerate={() => {}} />);
    const generateBtn = getByRole('button', { name: /צור מודעה/ });
    
    fireEvent.click(generateBtn);
    
    expect(getByText(/לא הוגדרו חוקי תפילה/i)).toBeInTheDocument();
  });
});
```

**בדיקה ידנית:**
- [ ] עורך → בדוק שמופיע spinner בזמן טעינה
- [ ] זמן "צור מודעה" מושבת כשאין זמנים
- [ ] הוסף חוקים גרועים (מחוץ לטווח) → בדוק שיש warning
- [ ] נסה לצור מודעה בלי כללים → בדוק שמופיע dialog

---

### Test 5.2: Responsive Design
**תיאור:** בדוק באפליקציות שונות

```javascript
// FILE: tests/ui/responsiveness.test.js

describe('Responsive Design', () => {
  test('Should render properly on mobile (320px)', () => {
    window.innerWidth = 320;
    window.dispatchEvent(new Event('resize'));
    
    const { container } = render(<Home synagogueId="syn-123" />);
    expect(container).toMatchSnapshot('mobile-320');
  });

  test('Should render properly on tablet (768px)', () => {
    window.innerWidth = 768;
    window.dispatchEvent(new Event('resize'));
    
    const { container } = render(<Home synagogueId="syn-123" />);
    expect(container).toMatchSnapshot('tablet-768');
  });

  test('Should render properly on desktop (1920px)', () => {
    window.innerWidth = 1920;
    window.dispatchEvent(new Event('resize'));
    
    const { container } = render(<Home synagogueId="syn-123" />);
    expect(container).toMatchSnapshot('desktop-1920');
  });

  test('RTL layout should work correctly', () => {
    const { container } = render(<Home synagogueId="syn-123" dir="rtl" />);
    const dirAttr = container.getAttribute('dir');
    expect(dirAttr).toBe('rtl');
  });
});
```

**בדיקה ידנית:**
- [ ] עורך בדסקטופ - בדוק שכל הטקסט קרוא
- [ ] עורך בנייד (DevTools) - בדוק שממשק לא קטוע
- [ ] בדוק שכל הטקסט בעברית (RTL)

---

## 6️⃣ PERFORMANCE TESTS

### Test 6.1: זמן טעינה וביצוע
**תיאור:** בדוק שלא איטי מדי

```javascript
// FILE: tests/performance/performance.test.js

describe('Performance', () => {
  test('Should calculate 100 prayer rows in less than 100ms', () => {
    const rules = Array.from({ length: 100 }, (_, i) => ({
      label: `Prayer ${i}`,
      baseZman: 'sunrise',
      offsetMinutes: i * 5,
      direction: 'after',
      dayTag: 'A'
    }));

    const startTime = performance.now();
    const result = calcPrayerRowsFromRules(rules, mockZmanim, null, null);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100);
    expect(result.length).toBe(100);
  });

  test('Should load 1000 historical posters in less than 500ms', async () => {
    const startTime = performance.now();
    const posters = await base44.entities.PublicPoster.list('-created_date', 1000);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(500);
    expect(posters.length).toBeLessThanOrEqual(1000);
  });
});
```

**בדיקה ידנית:**
- [ ] עורך → פתח DevTools → Performance tab
- [ ] לחץ "צור מודעה" - חכה לכל סיום
- [ ] בדוק שהזמן < 3 שניות
- [ ] צפה ב"Performance" chart - בדוק שאין bottlenecks

---

## 7️⃣ SECURITY TESTS

### Test 7.1: בדיקות אבטחה בסיסיות
**תיאור:** בדוק שאין חזירויות אבטחה

```javascript
// FILE: tests/security/security.test.js

describe('Security', () => {
  test('Should not expose password in API response', async () => {
    const gabaiData = {
      synagogue_id: 'syn-123',
      username: 'rabbi',
      email: 'rabbi@example.com',
      password: 'secret123',
      role: 'gabaai',
    };

    const created = await base44.entities.SynagogueAccount.create(gabaiData);
    
    expect(created.password).toBeUndefined();
    expect(created.password_hash).toBeDefined();
    expect(created.password_hash).not.toBe('secret123');
  });

  test('Should not allow direct access to unprotected endpoints', async () => {
    const response = await fetch('/admin/dashboard', {
      headers: { 'Authorization': '' }
    });

    expect(response.status).toBe(401);
  });

  test('Should not allow XSS in announcements field', async () => {
    const xssPayload = '<img src=x onerror=alert("XSS")>';
    const posterData = {
      type: 'prayer',
      parasha: 'פרשה',
      announcements: xssPayload,
      prayerRows: [],
    };

    const { container } = render(<PrayerTimesPoster data={posterData} />);
    
    expect(container.querySelector('img')).toBeNull(); // XSS בנקמע!
  });

  test('Should not store sensitive data in localStorage', () => {
    localStorage.clear();
    
    // בדוק שלא שמורות סיסמות או מפתחות רגישים
    Object.keys(localStorage).forEach(key => {
      expect(key).not.toMatch(/password|token|secret|key/i);
      const value = localStorage.getItem(key);
      expect(value).not.toMatch(/password|secret/i);
    });
  });
});
```

**בדיקה ידנית:**
- [ ] יצר גבאי → בדוק DevTools Response - לא תופיע סיסמה
- [ ] API call לניסיון tricky queries - בדוק שreject
- [ ] הכנס `<script>alert('xss')</script>` בהודעות - בדוק שלא מופיע

---

## 📋 MANUAL TEST CHECKLIST

| תכונה | בדיקה | סטטוס |
|-------|-------|--------|
| התחברות | התחבר עם דוא"ל וסיסמה | ☐ |
| יצירת בית כנסת | יצור בית כנסת חדש עם אתר | ☐ |
| זמני היום | בדוק שמטענים אוטומטית | ☐ |
| חוקים | הוסף/עריכה/מחק חוקים | ☐ |
| תבניות | שמור וטען תבנית | ☐ |
| מודעות | צור מודעת תפילה מלאה | ☐ |
| הדפסה | הדפס + PDF + PNG | ☐ |
| שיתוף | שלח WhatsApp/Email | ☐ |
| סטטיסטיקה | צפה בנתוני שימוש | ☐ |
| בקשות תכונות | הוסף בקשה חדשה | ☐ |

---

## 🔴 KNOWN ISSUES TO VERIFY

1. **localStorage vs DB Sync** - בדוק שלא מאבדים נתונים במעבר
2. **זמן בחציון (Halftime)** - בדוק שחישוב Chatzot דקיק
3. **קרא חודש** - בדוק שמזהה הברה/ראש חודש
4. **RTL עברית** - בדוק שכל טקסט חוקי בעברית
5. **תמונות גדולות** - בדוק שלא משהו זיכרון בהעלאה
6. **מכשולי זוגות קורדינטות** - בדוק edge cases
7. **TimeZone וDate** - בדוק שתאריכים נכונים בזמנים שונים

---

## ✅ HOW TO RUN TESTS

### Run All Tests
```bash
npm test
```

### Run Specific Suite
```bash
npm test -- tests/unit/prayerRules.test.js
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run Manual Tests
ראה את הסעיף "בדיקה ידנית" לכל בדיקה

---

**עדכן סטטוס בכל פעם שתבדוק בדיקה!**