import { 
  Printer, 
  FileDown, 
  MessageSquare, 
  Video, 
  Monitor, 
  Sparkles, 
  Share2, 
  Check, 
  Copy,
  PenTool
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

/**
 * PosterActionsBar Component
 * Unified, Haute-Couture floating toolbar rendered immediately above the live poster preview.
 * Consolidates all export, print, screen display, and status actions in one intuitive, elegant row.
 */
export default function PosterActionsBar({
  onPrint,
  onOpenPdfModal,
  onOpenShareModal,
  onOpenAnimatedStatus,
  onToggleCanvas,
  isCanvasActive,
  themeId,
  liveData,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.origin + '/public');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[850px] mx-auto mb-4 bg-card/90 backdrop-blur-md border border-border/80 shadow-sm rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 z-10 transition-all">
      {/* Primary Print & Export Group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          onClick={onPrint}
          size="sm"
          className="h-9 px-3.5 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5 text-xs transition-transform active:scale-95"
          title="הדפסה מהירה במדפסת (Ctrl+P)"
        >
          <Printer className="w-4 h-4" />
          <span>הדפסה</span>
          <span className="hidden md:inline-block opacity-60 text-[10px] font-mono mr-0.5">⌘P</span>
        </Button>

        <Button
          onClick={onOpenPdfModal}
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl font-semibold border-border hover:bg-muted/80 text-foreground gap-1.5 text-xs transition-colors"
          title="ייצוא קובץ PDF מוכן לדפוס A4 באיכות גבוהה"
        >
          <FileDown className="w-4 h-4 text-rose-500" />
          <span>ייצוא PDF</span>
        </Button>

        <Button
          onClick={onOpenShareModal}
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl font-semibold border-border hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 gap-1.5 text-xs transition-colors"
          title="שליחת המודעה לקבוצות וואטסאפ של בית הכנסת"
        >
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          <span>וואטסאפ</span>
        </Button>

        <Button
          onClick={onOpenAnimatedStatus}
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl font-semibold border-border hover:bg-indigo-500/10 hover:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 gap-1.5 text-xs transition-colors"
          title="הנפשת המודעה לסטטוס וואטסאפ או אינסטגרם"
        >
          <Video className="w-4 h-4 text-indigo-500" />
          <span>סטטוס מונפש</span>
        </Button>
      </div>

      {/* Screen Display & Freehand Canvas Group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <a
          href={`/display?theme=${themeId || 'classic'}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1.5 text-xs transition-colors"
            title="פתיחת מסך תצוגה ייעודי לטלוויזיה / מקרן בבית הכנסת"
          >
            <Monitor className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">מסך תצוגה</span>
          </Button>
        </a>

        <Button
          onClick={onToggleCanvas}
          variant={isCanvasActive ? 'secondary' : 'ghost'}
          size="sm"
          className={`h-9 px-2.5 rounded-xl font-medium gap-1.5 text-xs transition-colors ${
            isCanvasActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="הוספת כיתובים, מדבקות והערות חופשיות מעל המודעה"
        >
          <PenTool className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isCanvasActive ? 'סגור עיצוב' : 'עיצוב חופשי'}</span>
        </Button>
      </div>
    </div>
  );
}
