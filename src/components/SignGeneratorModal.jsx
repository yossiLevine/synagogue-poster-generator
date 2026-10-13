import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Printer, Download, Sparkles, DoorClosed, Check, Copy } from 'lucide-react';
import SignPoster from './SignPoster';
import { THEMES } from '@/lib/themes';
import jsPDF from 'jspdf';
import { capturePoster } from '@/lib/posterCapture';

export const SIGN_TEMPLATES = [
  {
    id: 'kiddush',
    icon: '🍷',
    title: 'קידושא רבא',
    subtitle: 'לרגל שמחת המשפחה',
    content: 'מתכבדים להזמין את ציבור המתפללים והאורחים לקידושא רבא שיתקיים בעז"ה בשבת קודש. ברוכים הבאים!',
    location: 'באולם בית הכנסת',
    time: 'לאחר תפילת מוסף',
    customBadge: 'שמחת בית הכנסת',
    footerNote: 'בברכת מזל טוב ורוב נחת · המשפחה המארחת',
  },
  {
    id: 'farbrengen',
    icon: '🥃',
    title: 'קבלת שבת פארבריינגען',
    subtitle: 'שבת אחים גם יחד',
    content: 'התוועדות חסידית חמה ומרוממת בליווי דברי תורה וניגוני שבת קודש. יישר כוח לתורמים שתרמו את הוויסקי והנקניקים לכבוד השבת!',
    location: 'בבית המדרש',
    time: 'לאחר תפילת קבלת שבת',
    customBadge: 'התוועדות מרעים',
    footerNote: 'תזכו למצוות ולברכה · גבאי בית הכנסת',
  },
  {
    id: 'avot_ubanim',
    icon: '📚',
    title: 'סדר לימוד אבות ובנים',
    subtitle: 'קול התורה בבית מקדש מעט',
    content: 'סדר לימוד מיוחד להורים וילדים עם כיבוד מפנק ופרסים יקרי ערך לכל הילדים המשתתפים!',
    location: 'בהיכל בית הכנסת',
    time: 'בשעה 17:00 בדיוק',
    customBadge: 'נוער וילדים',
    footerNote: 'בואו בהמוניכם לקדש שם שמיים!',
  },
  {
    id: 'women_shiur',
    icon: '🌸',
    title: 'שיעור נשים וצעירות',
    subtitle: 'בנושאי פרשת השבוע והלכה',
    content: 'שיעור שבועי מרומם ומיוחד לנשות הקהילה. כניסה מרווחת וכיבוד קל.',
    location: 'עזרת נשים',
    time: 'בשעה 16:30',
    customBadge: 'נשות הקהילה',
    footerNote: 'כולן מוזמנות בברכה!',
  },
  {
    id: 'silence',
    icon: '🤫',
    title: 'קדושת המקום ושקט בתפילה',
    subtitle: 'מורא מקדש',
    content: 'נא להקפיד על שקט מוחלט בשעת התפילה ובחזרת הש"ץ. נא לכבות או להעביר טלפונים ניידים למצב שקט לפני הכניסה להיכל.',
    location: 'היכל בית הכנסת',
    time: 'בכל שעות התפילה',
    customBadge: 'הודעת גבאי',
    footerNote: '"ושמרתם את מקדשי, אני ה\'"',
  },
  {
    id: 'custom',
    icon: '✨',
    title: 'הודעה מיוחדת',
    subtitle: '',
    content: 'תוכן ההודעה כאן...',
    location: '',
    time: '',
    customBadge: '',
    footerNote: 'בברכת שבת שלום ומבורך',
  },
];

export default function SignGeneratorModal({ 
  isOpen, 
  onClose, 
  initialData = null, 
  currentThemeId = 'royal_gold' 
}) {
  const [signData, setSignData] = useState(() => {
    if (initialData) {
      return {
        icon: initialData.icon || '📢',
        title: initialData.title || 'הודעה',
        subtitle: initialData.subtitle || '',
        content: initialData.content || '',
        location: initialData.location || '',
        time: initialData.time || '',
        customBadge: initialData.type ? 'מודעת שבת' : '',
        footerNote: 'גבאי בית הכנסת',
      };
    }
    return SIGN_TEMPLATES[0];
  });

  const [themeId, setThemeId] = useState(currentThemeId);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSignData({
        icon: initialData.icon || '📢',
        title: initialData.title || 'הודעה',
        subtitle: initialData.subtitle || '',
        content: initialData.content || '',
        location: initialData.location || '',
        time: initialData.time || '',
        customBadge: initialData.type ? 'אירועי השבת' : '',
        footerNote: 'גבאי בית הכנסת',
      });
    } else {
      setSignData(SIGN_TEMPLATES[0]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSelectTemplate = (template) => {
    setSignData({ ...template });
  };

  const handlePrint = () => {
    document.body.classList.add('printing-sign');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-sign');
    }, 1500);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      const capture = await capturePoster(2, 'sign-print-area');
      const imgData = capture.dataUrl || capture;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pw, ph);
      pdf.save(`שלט - ${signData.title || 'בית הכנסת'}.pdf`);
    } catch (e) {
      alert('שגיאה ביצוא שלט: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-background border border-border rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-card/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">מחולל שלטים לדלת ולאולם (A4)</h2>
              <p className="text-xs text-muted-foreground">הפקת שלטים בולטים באותיות ענק לקידוש, פארבריינגען, שיעור או שקט</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} size="sm" variant="outline" className="gap-1.5 text-xs hidden sm:flex">
              <Printer className="w-4 h-4" /> הדפסה מהירה
            </Button>
            <Button onClick={handleDownloadPDF} size="sm" disabled={isExporting} className="gap-1.5 text-xs">
              <Download className="w-4 h-4" /> הורד PDF לשלט
            </Button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: 2 columns */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6">
          
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Templates */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                בחר תבנית מוכנה:
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {SIGN_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold text-right transition-all ${
                      signData.title === tmpl.title
                        ? 'border-primary bg-primary/10 text-primary shadow-xs'
                        : 'border-border bg-card hover:border-primary/40 text-foreground'
                    }`}
                  >
                    <span className="text-lg">{tmpl.icon}</span>
                    <span className="truncate">{tmpl.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Inputs */}
            <div className="space-y-3 bg-card/60 p-4 rounded-2xl border border-border/80">
              <div className="flex items-center gap-2">
                <div className="w-16">
                  <Label className="text-xs font-semibold">אייקון</Label>
                  <Input 
                    value={signData.icon} 
                    onChange={(e) => setSignData(prev => ({ ...prev, icon: e.target.value }))}
                    className="text-center text-lg mt-1 font-bold"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-semibold">כותרת ענקית לשלט</Label>
                  <Input 
                    value={signData.title} 
                    onChange={(e) => setSignData(prev => ({ ...prev, title: e.target.value }))}
                    className="font-bold text-sm mt-1"
                    placeholder="כותרת השלט..."
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">כותרת משנה (אופציונלי)</Label>
                <Input 
                  value={signData.subtitle} 
                  onChange={(e) => setSignData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="text-xs mt-1"
                  placeholder="לרגל שמחת... / שבת אחים גם יחד"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">מלל ראשי ופירוט</Label>
                <Textarea 
                  value={signData.content} 
                  onChange={(e) => setSignData(prev => ({ ...prev, content: e.target.value }))}
                  className="text-xs mt-1 min-h-[80px]"
                  placeholder="פירוט ההודעה, תודות לתורמים וכו'..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">מיקום</Label>
                  <Input 
                    value={signData.location} 
                    onChange={(e) => setSignData(prev => ({ ...prev, location: e.target.value }))}
                    className="text-xs mt-1"
                    placeholder="באולם בית הכנסת"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">שעה</Label>
                  <Input 
                    value={signData.time} 
                    onChange={(e) => setSignData(prev => ({ ...prev, time: e.target.value }))}
                    className="text-xs mt-1"
                    placeholder="לאחר מוסף / 17:00"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">הערת סיום / חתימה</Label>
                <Input 
                  value={signData.footerNote} 
                  onChange={(e) => setSignData(prev => ({ ...prev, footerNote: e.target.value }))}
                  className="text-xs mt-1"
                  placeholder="בברכת שבת שלום ומבורך"
                />
              </div>
            </div>
          </div>

          {/* Preview Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-start bg-muted/40 p-4 sm:p-6 rounded-2xl border border-border/60 overflow-y-auto">
            <p className="text-xs font-bold text-muted-foreground mb-3 self-start flex items-center gap-1.5">
              <span>תצוגה מקדימה של השלט להדפסה (A4):</span>
            </p>
            <div className="w-full max-w-[480px]">
              <SignPoster signData={signData} themeId={themeId} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
