import { useState } from 'react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, Printer, CheckCircle2 } from 'lucide-react';
import { THEMES } from '@/lib/themes';
import { getConfig } from '@/lib/synagogueConfig';
import { capturePoster } from '@/lib/posterCapture';

const THEME_LIST = Object.values(THEMES);

export default function PrintReadyPDFExport({ liveData, currentThemeId, onThemeChange }) {
  const [selectedTheme, setSelectedTheme] = useState(currentThemeId || 'classic');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId);
    if (onThemeChange) {
      onThemeChange(themeId);
    }
  };

  const handleExportPDF = async () => {
    if (!liveData) {
      alert('אנא צור מודעה תחילה');
      return;
    }
    setExporting(true);
    setDone(false);
    try {
      // Ensure theme is applied and fonts are loaded before capture
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      const imgCapture = await capturePoster(window.innerWidth < 768 ? 2 : 2.5);
      const imgData = imgCapture.dataUrl || imgCapture;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      
      const imgRatio = (imgCapture.height && imgCapture.width) 
        ? imgCapture.height / imgCapture.width 
        : (297 / 210);

      let renderW = pw;
      let renderH = pw * imgRatio;
      if (renderH > ph) {
        renderH = ph;
        renderW = ph / imgRatio;
      }
      const posX = (pw - renderW) / 2;
      const posY = (ph - renderH) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, renderW, renderH, undefined, 'FAST');

      const cfg = getConfig();
      const parasha = liveData.parasha ? ` - ${liveData.parasha}` : '';
      const synName = cfg.synagogueName || 'בית הכנסת';
      const safe = (s) => s.replace(/[/\\?%*:|"<>]/g, '-');
      pdf.save(`${safe('זמני תפילה' + parasha)} - ${safe(synName)}.pdf`);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error(e);
      alert('שגיאה בייצוא PDF: ' + e.message);
    }
    setExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const theme = THEMES[selectedTheme] || THEMES.classic;

  return (
    <div className="space-y-4" dir="rtl">
      <p className="text-sm text-muted-foreground">
        בחר עיצוב ויצא מודעה מוכנה לדפוס באיכות גבוהה (A4 PDF).
      </p>

      {/* Theme Picker */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">בחירת עיצוב:</p>
        <div className="grid grid-cols-4 gap-2">
          {THEME_LIST.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTheme(t.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                selectedTheme === t.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <span
                className="w-8 h-8 rounded-full border border-border flex-shrink-0"
                style={{ background: t.bg, boxShadow: t.boxShadow?.split(',').slice(0,1).join('') }}
              />
              <span className="leading-tight text-center">{t.emoji} {t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview badge */}
      {liveData && (
        <div
          className="rounded-lg p-3 text-center text-sm font-semibold border"
          style={{
            background: theme.bg,
            color: theme.titleColor,
            borderColor: theme.outerBorderColor,
          }}
        >
          <span style={{ color: theme.accentColor }}>{theme.emoji} </span>
          {liveData.parasha ? `פרשת ${liveData.parasha}` : 'זמני תפילה'}
          {' — '}
          <span className="font-normal text-xs" style={{ color: theme.bodyColor }}>
            {liveData.prayerRows?.filter(r => r.time).length || 0} שורות תפילה
          </span>
        </div>
      )}

      {/* Note: theme applied at export */}
      <p className="text-xs text-muted-foreground text-center">
        ⓘ העיצוב שנבחר כאן ישמש לייצוא הPDF (לפי העיצוב הנוכחי בתצוגה המקדימה).
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleExportPDF}
          disabled={exporting || !liveData}
          className="flex-1 gap-2"
        >
          {exporting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> מייצא...</>
          ) : done ? (
            <><CheckCircle2 className="w-4 h-4" /> נשמר!</>
          ) : (
            <><FileDown className="w-4 h-4" /> הורד PDF</>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handlePrint}
          disabled={!liveData}
          className="flex-1 gap-2"
        >
          <Printer className="w-4 h-4" /> הדפס
        </Button>
      </div>

      {!liveData && (
        <p className="text-xs text-center text-amber-600">⚠️ יש לצור מודעה תחילה</p>
      )}
    </div>
  );
}