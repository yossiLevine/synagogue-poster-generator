import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TUTORIALS = [
  {
    id: 'prayer-form',
    title: '📋 טופס זמני תפילה',
    description: 'כיצד ליצור מודעת זמני תפילה',
    content: `בטופס זה תוכל להוסיף את כל זמני התפילה של השבוע.
    
• בחר תאריך - המערכת טוענת אוטומטית את זמני היום והפרשה
• הוסף שורות - לכל תפילה שם ושעה
• סדר - גרור שורות לסדר הרצוי
• הצגה - סמן ✓ כדי להציג במודעה
• כותרות וניתות - הוסף כותרות בין הקטעים או הערות חופשיות`,
  },
  {
    id: 'design-tab',
    title: '🎨 עיצוב מתקדם',
    description: 'הפוך את המודעה לייחודית',
    content: `כלים עיצוביים מתקדמים:

  • נושא צבעים - בחר מ-20+ עיצובים שונים
  • מסגרת - בחר גבול דקורטיבי למודעה
  • רקע - העלה תמונה או בחר צבע מוצק
  • בהירות - כדי שהטקסט יהיה קריא מעל הרקע
  • קוד QR - לקישור למיוחד או אתר`,
  },
  {
    id: 'live-preview',
    title: '👁️ תצוגה מקדימה חיה',
    description: 'ראה בזמן אמת כיצד נראית המודעה',
    content: `כשאתה משנה משהו בעורך - התצוגה מתעדכנת מיד.
    
• ניתן להסתיר את העורך כדי להרוויח מקום על טלפון
• על מחשב - התצוגה מופיעה בצד ימין
• עיצוב חופשי - הוסף טקסט ודמות בחופשיות על המודעה`,
  },
  {
    id: 'share-export',
    title: '📤 שיתוף וייצוא',
    description: 'שתף את המודעה בדרכים שונים',
    content: `כפתורים בראש העורך:

  • הדפסה - הדפס ישירות למדפסת
  • PNG - הורד תמונה לשיתוף בדוא"ל
  • PDF - יצוא למסמך קביע
  • WhatsApp - שלח ישירות למנויים
  • דף ציבורי - הצג בחיות על מסך בחוץ`,
  },
  {
    id: 'history',
    title: '📚 היסטוריה',
    description: 'שמור ושזוקל מודעות קודמות',
    content: `כל מודעה שאתה יוצר נשמרת אוטומטית.

  • לחץ על פריט בהיסטוריה כדי לחזור אליו
  • בפעם הבאה לא צריך להזין הכל מחדש
  • ניתן למחוק פריטים ישנים`,
  },
  {
    id: 'stats',
    title: '📊 סטטיסטיקות',
    description: 'עקוב אחר השימוש',
    content: `ראה כמה מודעות הדפסת, שיתפת והורדת.

  • סקור את כל הפעולות שלך
  • דיווח לפי שבוע וחודש
  • תוכל לראות איזו פרשה הכי פופולרית`,
  },
];

export default function SystemTutorial() {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="space-y-2" dir="rtl">
      <p className="text-sm font-semibold text-primary mb-3">📖 הדרכת המערכת - אנא קרא</p>
      {TUTORIALS.map(tutorial => (
        <div key={tutorial.id} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenId(openId === tutorial.id ? null : tutorial.id)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="text-right">
              <p className="font-semibold text-foreground">{tutorial.title}</p>
              <p className="text-xs text-muted-foreground">{tutorial.description}</p>
            </div>
            {openId === tutorial.id ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-3" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-3" />
            )}
          </button>
          
          {openId === tutorial.id && (
            <div className="bg-muted/30 p-4 border-t border-border">
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                {tutorial.content}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}