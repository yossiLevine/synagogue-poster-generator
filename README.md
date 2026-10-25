# 🕍 מחולל מודעות בית כנסת (Synagogue Poster Generator)

מערכת מתקדמת ליצירה, עיצוב והפצה של מודעות זמני תפילה, שבתות, חגים ואירועים לקהילות ובתי כנסת.

---

## 📖 תיעוד ומדריך מלא של הפרויקט
**מדריך מפורט הכולל את ארכיטקטורת הפרויקט, מיקומי האחסון, פרטי התחברות וסיסמאות, הוראות פריסה והסבר על מנועי החישוב נמצא בקובץ:**
👉 **[PROJECT_MANUAL.md](./PROJECT_MANUAL.md)**

---

## 🚀 קישורים מהירים

- **כתובת האתר באוויר (Production):** [https://synagogue-poster-gen-2026.web.app](https://synagogue-poster-gen-2026.web.app)
- **מסך התחברות (גבאי / אדמין):** [https://synagogue-poster-gen-2026.web.app/login](https://synagogue-poster-gen-2026.web.app/login)
- **מאגר קוד ב-GitHub:** [https://github.com/yossiLevine/synagogue-poster-generator](https://github.com/yossiLevine/synagogue-poster-generator)
- **לוח ניהול ב-Firebase Console:** [Firebase Console](https://console.firebase.google.com/project/synagogue-poster-gen-2026/overview)

---

## 🔑 פרטי התחברות למנהל מערכת (Admin)
- **משתמש:** `admin` (או `admin@synagogue.local`)
- **סיסמה:** `admin123`

---

## 🛠️ פקודות פיתוח והפעלה

```bash
# התקנת ספריות
npm install

# הרצת שרת פיתוח מקומי
npm run dev

# בנייה לפרודקשן
cmd /c "npm run build"

# פריסה לענן ב-Firebase Hosting
cmd /c "npx firebase-tools deploy --only hosting"
```
