import { useState } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { getConfig } from '@/lib/synagogueConfig';
import { capturePoster } from '@/lib/posterCapture';

const PRAYER_TEXTS = [
  (parasha, syn) => `🕍 *${syn}*\n\nזמני תפילה לשבת${parasha ? ` — פרשת ${parasha}` : ''}\nשבת שלום ומבורך! 🕯️`,
  (parasha, syn) => `📢 *זמני תפילה לשבת*${parasha ? ` — פרשת ${parasha}` : ''}\n\n*${syn}*\nשבת שלום לכל קהל המתפללים 🙏`,
  (parasha, syn) => `✡️ לכבוד קהל בית הכנסת *${syn}*\n\nמצורפים זמני תפילה${parasha ? ` לפרשת ${parasha}` : ''}\nשבת שלום!`,
];

const GENERAL_TEXTS = [
  (title, syn) => `📢 *${syn}*\n\n${title ? title + '\n' : ''}הודעה לקהל המתפללים`,
  (title, syn) => `🔔 *הודעה מ${syn}*\n\n${title || 'הודעה חשובה לקהל'}`,
  (title, syn) => `✡️ לכבוד קהל בית הכנסת *${syn}*\n\n${title || 'הודעה חשובה'}`,
];

export default function WhatsAppQuickShare({ liveData, onShareStat }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [busy, setBusy] = useState(false);

  const cfg = getConfig();
  const isPrayer = !liveData?.type || liveData.type === 'prayer';
  const parasha = liveData?.parasha || '';
  const title = liveData?.title || liveData?.mainTitle || '';
  const synName = cfg.synagogueName || 'בית הכנסת';
  const AUTO_TEXTS = isPrayer ? PRAYER_TEXTS : GENERAL_TEXTS;
  const textArg = isPrayer ? parasha : title;

  const openModal = () => {
    const defaultText = AUTO_TEXTS[0](textArg, synName);
    setText(defaultText);
    setSelectedPreset(0);
    setOpen(true);
  };

  const selectPreset = (idx) => {
    setSelectedPreset(idx);
    setText(AUTO_TEXTS[idx](textArg, synName));
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const raw = await capturePoster();
      const dataUrl = raw?.dataUrl || raw;

      // Try native share (mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], 'מודעת-תפילה.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text: text });
            if (onShareStat) onShareStat('shared_whatsapp');
            setOpen(false);
            setBusy(false);
            return;
          }
        } catch (e) { console.warn('Native share failed:', e); }
      }

      // Upload & open WhatsApp link
      try {
        let fileUrl = null;
        try {
          const { uploadDataUrlToStorage } = await import('@/lib/storage');
          fileUrl = await uploadDataUrlToStorage(dataUrl, 'shared_posters');
        } catch (storageErr) {
          console.warn('Storage upload error, trying base44 fallback:', storageErr);
          const uploadRes = await base44.functions.invoke('uploadPosterImage', { dataUrl });
          fileUrl = uploadRes?.data?.file_url;
        }
        if (fileUrl) {
          const msg = text ? `${text}\n${fileUrl}` : fileUrl;
          window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
          if (onShareStat) onShareStat('shared_whatsapp');
          setOpen(false);
          setBusy(false);
          return;
        }
      } catch (e) { console.warn('Upload failed:', e); }

      // Fallback: download + open WhatsApp
      const link = document.createElement('a');
      link.download = 'מודעת-תפילה.png';
      link.href = dataUrl;
      link.click();
      const msg = text || `זמני תפילה${parasha ? ` — פרשת ${parasha}` : ''}`;
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
      if (onShareStat) onShareStat('shared_whatsapp');
      setOpen(false);
    } catch (e) {
      alert('שגיאה בשיתוף: ' + e.message);
    }
    setBusy(false);
  };

  const [copiedBadge, setCopiedBadge] = useState(false);

  const handleCopyImage = async () => {
    setBusy(true);
    try {
      const raw = await capturePoster();
      const dataUrl = raw?.dataUrl || raw;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedBadge(true);
        setTimeout(() => setCopiedBadge(false), 4000);
      } else {
        throw new Error('ClipboardItem not supported');
      }
    } catch (e) {
      console.warn('Clipboard image write failed:', e);
      alert('הדפדפן אינו תומך בהעתקת תמונות ללוח. השתמש בכפתור השיתוף.');
    }
    setBusy(false);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all hover:scale-[1.02] shadow-md shadow-green-500/20"
      >
        <MessageCircle className="w-4 h-4" />
        שיתוף מהיר לוואטסאפ ⚡
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-border">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">שיתוף מהיר לוואטסאפ</h2>
                  <p className="text-xs text-gray-400">המודעה תישלח כתמונה עם הטקסט המלווה</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preset texts */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> נוסחים מוכנים
              </p>
              <div className="flex gap-2 flex-wrap">
                {AUTO_TEXTS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPreset(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedPreset === idx ? 'bg-[#25D366] border-[#25D366] text-white' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-300'}`}
                  >
                    נוסח {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Text editor */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">טקסט מלווה (ניתן לעריכה)</p>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); setSelectedPreset(null); }}
                rows={4}
                dir="rtl"
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:border-green-400 resize-none leading-relaxed"
                placeholder="הוסף טקסט מלווה..."
              />
              <p className="text-xs text-gray-400 mt-1">{text.length} תווים · ניתן לשנות או למחוק</p>
            </div>

            {/* Copy image button for WhatsApp Web */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyImage}
              disabled={busy}
              className="w-full text-xs font-semibold gap-1.5 py-2 border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
            >
              {copiedBadge ? '✓ התמונה הועתקה ללוח! כעת הדבק ב-Ctrl+V בווטסאפ' : '📋 העתק תמונה ללוח (להדבקה ישירה ב-WhatsApp Web)'}
            </Button>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-colors"
              >
                סגור
              </button>
              <button
                onClick={handleShare}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-sm"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {busy ? 'מעבד...' : 'שלח לוואטסאפ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}