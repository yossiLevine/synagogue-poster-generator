import { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { formatTime } from '@/lib/zmanimApi';

// Omer dates: Sefirat HaOmer starts on the second night of Pesach (16 Nisan).
function getOmerCount() {
  const now = new Date();
  const year = now.getFullYear();
  // Pesach 15 Nisan Gregorian dates (accurate Jewish calendar table)
  const pesachDates = { 
    2024: new Date(2024, 3, 23), 
    2025: new Date(2025, 3, 13), 
    2026: new Date(2026, 3, 2), 
    2027: new Date(2027, 3, 22),
    2028: new Date(2028, 3, 11),
    2029: new Date(2029, 2, 31),
    2030: new Date(2030, 3, 18),
    2031: new Date(2031, 3, 8),
    2032: new Date(2032, 2, 27),
    2033: new Date(2033, 3, 14),
    2034: new Date(2034, 3, 4),
    2035: new Date(2035, 3, 24),
  };
  const pesach = pesachDates[year] || new Date(year, 3, 2);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // First day of count is 16 Nisan (1 day after 15 Nisan)
  const diff = Math.floor((today - pesach) / 86400000);
  if (diff < 0 || diff >= 49) return null;
  return diff + 1;
}

const OMER_WEEKS = ['', 'חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד', 'מלכות'];
const OMER_DAYS = ['', 'חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד', 'מלכות'];

function formatOmer(count) {
  if (!count) return null;
  const week = Math.floor((count - 1) / 7);
  const day = ((count - 1) % 7);
  const weekName = OMER_WEEKS[week + 1];
  const dayName = OMER_DAYS[day + 1];
  const hebrew = ['', 'אחד', 'שניים', 'שלשה', 'ארבעה', 'חמישה', 'ששה', 'שבעה', 'שמונה', 'תשעה', 'עשרה',
    'אחד עשר', 'שנים עשר', 'שלשה עשר', 'ארבעה עשר', 'חמישה עשר', 'ששה עשר', 'שבעה עשר', 'שמונה עשר', 'תשעה עשר', 'עשרים',
    'עשרים ואחד', 'עשרים ושניים', 'עשרים ושלשה', 'עשרים וארבעה', 'עשרים וחמישה', 'עשרים וששה', 'עשרים ושבעה', 'עשרים ושמונה', 'עשרים ותשעה', 'שלשים',
    'שלשים ואחד', 'שלשים ושניים', 'שלשים ושלשה', 'שלשים וארבעה', 'שלשים וחמישה', 'שלשים וששה', 'שלשים ושבעה', 'שלשים ושמונה', 'שלשים ותשעה', 'ארבעים',
    'ארבעים ואחד', 'ארבעים ושניים', 'ארבעים ושלשה', 'ארבעים וארבעה', 'ארבעים וחמישה', 'ארבעים וששה', 'ארבעים ושבעה', 'ארבעים ושמונה', 'ארבעים ותשעה'];
  const dayText = hebrew[count] ? `היום ${hebrew[count]} יום` : `היום ${count} יום`;
  const weekText = week > 0 ? ` שהם ${hebrew[week] || week} שבועות${day > 0 ? ` ו${hebrew[day] || day} ימים` : ''}` : '';
  return { count, dayText, weekText, weekName, dayName };
}

export default function HalachaCalculator({ zmanim, shabbatInfo, onAddToPoster }) {
  const [open, setOpen] = useState(false);
  const [havdalahMin, setHavdalahMin] = useState(42);

  const omer = formatOmer(getOmerCount());

  // Havdalah calculation — standard Halacha is minutes after sunset (שקיעה)
  const calcHavdalah = (minutes) => {
    const baseIso = zmanim?.sunset || zmanim?.tzeit7083deg;
    if (!baseIso) return '—';
    const t = new Date(new Date(baseIso).getTime() + minutes * 60000);
    return t.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Alot HaShachar custom
  const alot = zmanim?.alotHaShachar ? formatTime(zmanim.alotHaShachar) : '—';
  const tzeit = zmanim?.tzeit7083deg ? formatTime(zmanim.tzeit7083deg) : '—';

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="w-4 h-4 text-primary" />
          מחשבון זמני הלכה
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 border-t border-border text-sm">

          {/* Omer */}
          {omer ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-amber-800 mb-1">✡ ספירת העומר</p>
                  <p className="text-amber-700 font-frank text-base">{omer.dayText}{omer.weekText} לעומר</p>
                  {omer.weekName && <p className="text-xs text-amber-600 mt-1">{omer.dayName} שב{omer.weekName}</p>}
                </div>
                {onAddToPoster && (
                  <button
                    onClick={() => onAddToPoster(`${omer.dayText}${omer.weekText} לעומר`)}
                    className="text-xs bg-amber-700 text-white px-2 py-1 rounded-md hover:bg-amber-800 flex-shrink-0"
                  >
                    + למודעה
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">ספירת העומר — לא בתקופת הספירה כעת</p>
          )}

          {/* Havdalah */}
          <div className="space-y-2">
            <p className="font-semibold">הבדלה — זמנים לפי שיטות</p>
            <div className="grid grid-cols-3 gap-2">
              {[{min: 42, label: 'ר"ת'}, {min: 50, label: 'גר"א'}, {min: 72, label: 'ר"ת מחמיר'}].map(({min, label}) => (
                <button
                  key={min}
                  onClick={() => setHavdalahMin(min)}
                  className={`rounded-lg py-2 px-1 text-center border transition-colors text-xs font-bold ${havdalahMin === min ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
                >
                  <div className="text-lg">{calcHavdalah(min)}</div>
                  <div className="opacity-70">{min} דק' ({label})</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">מחושב {havdalahMin} דק' אחרי צאת הכוכבים</p>
          </div>

          {/* Alot / Tzeit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">עלות השחר</p>
              <p className="font-frank font-bold text-lg">{alot}</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">צאת כוכבים</p>
              <p className="font-frank font-bold text-lg">{tzeit}</p>
            </div>
          </div>

          {/* Candlelighting */}
          {shabbatInfo?.candleLighting && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
              <p className="text-xs text-yellow-700">הדלקת נרות שבת</p>
              <p className="font-frank font-bold text-xl text-yellow-800">{shabbatInfo.candleLighting}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}