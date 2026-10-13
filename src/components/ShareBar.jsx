import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Mail, FileImage, Video, Share2, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { base44 } from '@/api/base44Client';
import { getConfig } from '@/lib/synagogueConfig';
import WhatsAppQuickShare from './WhatsAppQuickShare';
import AnimatedPosterExport from './AnimatedPosterExport';
import WhatsAppCommunityBot from './WhatsAppCommunityBot';
import { capturePoster } from '@/lib/posterCapture';

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const getPosterDataUrl = capturePoster;

export default function ShareBar({ paperSize, onPaperSizeChange, onPrint, onShareStat, liveData }) {
  const [busy, setBusy] = useState(false);
  const [animatedModalOpen, setAnimatedModalOpen] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);

  const track = (type) => { if (onShareStat) onShareStat(type); };

  const buildFileName = (ext) => {
    const cfg = getConfig();
    const parasha = liveData?.parasha ? ` - פרשת ${liveData.parasha}` : '';
    const synagogue = cfg.synagogueName || 'בית הכנסת';
    const safe = (s) => s.replace(/[/\\?%*:|"<>]/g, '-');
    return `${safe('זמני תפילה' + parasha)} - ${safe(synagogue)}.${ext}`;
  };

  const buildShareTitle = () => {
    const cfg = getConfig();
    const parasha = liveData?.parasha ? ` - פרשת ${liveData.parasha}` : '';
    const synagogue = cfg.synagogueName || 'בית הכנסת';
    return `🕍 זמני תפילה${parasha} — ${synagogue}`;
  };

  const exportPNG = async () => {
    setBusy(true);
    try {
      const raw = await getPosterDataUrl();
      const dataUrl = raw?.dataUrl || raw;
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = buildFileName('png');
        link.href = dataUrl;
        link.click();
        track('downloaded_png');
      }
    } catch (e) {
      alert('שגיאה בעת יצוא תמונה');
    }
    setBusy(false);
  };

  const shareWhatsApp = async () => {
    setBusy(true);
    try {
      const raw = await getPosterDataUrl();
      const dataUrl = raw?.dataUrl || raw;
      if (!dataUrl) { alert('שגיאה בטעינת המודעה'); setBusy(false); return; }
      const title = buildShareTitle();
      const fileName = buildFileName('png');

      if (navigator.share && navigator.canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], fileName, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text: title });
            track('shared_whatsapp');
            setBusy(false);
            return;
          }
        } catch (e) { console.warn('Native share failed:', e); }
      }

      try {
        const { uploadDataUrlToStorage } = await import('@/lib/storage');
        const fileUrl = await uploadDataUrlToStorage(dataUrl, 'shared_posters');
        if (fileUrl) {
          const msg = `${title}\n${fileUrl}`;
          window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
          track('shared_whatsapp');
          setBusy(false);
          return;
        }
      } catch (e) { console.warn('Upload failed:', e); }

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
      alert('התמונה הורדה — שתף אותה ידנית בוואטסאפ');
    } catch (e) {
      alert('שגיאה בשיתוף');
      console.error(e);
    }
    setBusy(false);
  };

  const shareEmail = async () => {
    setBusy(true);
    try {
      const raw = await getPosterDataUrl();
      const dataUrl = raw?.dataUrl || raw;
      if (!dataUrl) { alert('שגיאה בטעינת המודעה'); setBusy(false); return; }

      // Try native share with file (mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], buildFileName('png'), { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: buildShareTitle() });
            track('shared_email');
            setBusy(false);
            return;
          }
        } catch (e) { console.warn('native share failed:', e); }
      }

      // Upload and open mailto with link
      try {
        const { uploadDataUrlToStorage } = await import('@/lib/storage');
        const fileUrl = await uploadDataUrlToStorage(dataUrl, 'shared_posters');
        if (fileUrl) {
          const subject = encodeURIComponent(buildShareTitle());
          const body = encodeURIComponent(`מצורפת מודעת זמני התפילה:\n${fileUrl}`);
          window.open(`mailto:?subject=${subject}&body=${body}`);
          track('shared_email');
          setBusy(false);
          return;
        }
      } catch (e) { console.warn('upload failed:', e); }

      // Fallback: download
      const link = document.createElement('a');
      link.download = buildFileName('png');
      link.href = dataUrl;
      link.click();
      track('shared_email');
    } catch (e) {
      alert('שגיאה בשיתוף מייל');
    }
    setBusy(false);
  };

  const printDirect = () => { window.print(); track('printed'); };

  return (
    <div className="flex flex-wrap items-center gap-1.5" dir="rtl">
      <WhatsAppQuickShare liveData={liveData} onShareStat={onShareStat} />

      {/* WhatsApp Community Bot Trigger */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setBotModalOpen(true)} 
        className="gap-1.5 h-8 px-2.5 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-bold"
        title="בוט שיגור לכל קבוצות בית הכנסת בוואטסאפ"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span>בוט קהילתי 🤖</span>
      </Button>

      {/* Animated Video Status Export */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setAnimatedModalOpen(true)} 
        className="gap-1.5 h-8 px-2.5 text-xs bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 font-bold"
        title="יצוא סרטון מונפש לסטטוס וואטסאפ"
      >
        <Video className="w-3.5 h-3.5" />
        <span>סטטוס מונפש 🎬</span>
      </Button>

      {/* Paper size — hidden on mobile */}
      <Select value={paperSize} onValueChange={onPaperSizeChange}>
        <SelectTrigger className="hidden sm:flex w-18 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a4">A4</SelectItem>
          <SelectItem value="a3">A3</SelectItem>
          <SelectItem value="a5">A5</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={printDirect} className="gap-1 h-8 px-2 text-xs">
        <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">הדפסה</span>
      </Button>

      <Button variant="outline" size="sm" onClick={onPrint} disabled={busy} className="flex gap-1 h-8 px-2 text-xs">
        <Download className="w-3.5 h-3.5" /> <span>PDF</span>
      </Button>

      <Button variant="outline" size="sm" onClick={exportPNG} disabled={busy} className="flex gap-1 h-8 px-2 text-xs">
        <FileImage className="w-3.5 h-3.5" /> PNG
      </Button>

      <Button variant="outline" size="sm" onClick={shareWhatsApp} disabled={busy} className="gap-1 h-8 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50">
        <WhatsAppIcon /> <span>WA</span>
      </Button>

      <Button variant="outline" size="sm" onClick={shareEmail} disabled={busy} className="flex gap-1 h-8 px-2 text-xs">
        <Mail className="w-3.5 h-3.5" /> <span className="hidden sm:inline">אימייל</span>
      </Button>

      {/* Animated Poster Modal */}
      <AnimatedPosterExport 
        isOpen={animatedModalOpen} 
        onClose={() => setAnimatedModalOpen(false)} 
        liveData={liveData} 
      />

      {/* WhatsApp Community Bot Modal */}
      <WhatsAppCommunityBot 
        isOpen={botModalOpen} 
        onClose={() => setBotModalOpen(false)} 
        liveData={liveData} 
      />
    </div>
  );
}