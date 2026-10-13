import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send, Loader2, Users, CheckSquare, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { loadSubscribers } from '@/lib/subscribers';
import { capturePoster } from '@/lib/posterCapture';
import { getConfig } from '@/lib/synagogueConfig';

const WhatsAppIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function buildMessage(liveData) {
  const cfg = getConfig();
  const syn = cfg.synagogueName || 'בית הכנסת';
  if (!liveData) return `📢 הודעה מ${syn}`;

  if (liveData.type === 'prayer') {
    const parasha = liveData.parasha ? ` — פרשת ${liveData.parasha}` : '';
    return `🕍 *${syn}*\n\nזמני תפילה לשבת${parasha}\nשבת שלום ומבורך! 🕯️`;
  } else {
    const title = liveData.title || liveData.mainTitle || '';
    return `📢 *${syn}*\n\n${title ? title + '\n' : ''}הודעה לקהל המתפללים`;
  }
}

export default function SendPosterToSubscribers({ liveData }) {
  const subscribers = loadSubscribers();
  const [selected, setSelected] = useState(() => new Set(subscribers.map(s => s.id)));
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  if (!liveData || subscribers.length === 0) return null;

  const toggleSub = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === subscribers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(subscribers.map(s => s.id)));
    }
  };

  const handleSend = async () => {
    const toSend = subscribers.filter(s => selected.has(s.id));
    if (toSend.length === 0) { alert('בחר לפחות מנוי אחד'); return; }

    setSending(true);
    setUploadProgress('מכין תמונה...');

    try {
      const raw = await capturePoster();
      const dataUrl = raw?.dataUrl || raw;
      if (!dataUrl) { alert('שגיאה בהפקת התמונה'); setSending(false); return; }

      setUploadProgress('מעלה תמונה...');
      const { uploadDataUrlToStorage } = await import('@/lib/storage');
      const fileUrl = await uploadDataUrlToStorage(dataUrl, 'shared_posters');

      if (!fileUrl) { alert('שגיאה בהעלאת התמונה'); setSending(false); return; }

      setUploadProgress('פותח שיחות...');
      const message = buildMessage(liveData);

      toSend.forEach((sub, index) => {
        setTimeout(() => {
          if (sub.phone) {
            const cleanPhone = sub.phone.replace(/\D/g, '').replace(/^0/, '972');
            const msg = `${message}\n${fileUrl}`;
            window.open('https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg), '_blank');
          } else if (sub.email) {
            const subject = encodeURIComponent(`הודעה מ${getConfig().synagogueName || 'בית הכנסת'}`);
            const body = encodeURIComponent(`${message}\n\nלצפייה במודעה:\n${fileUrl}`);
            window.open(`mailto:${sub.email}?subject=${subject}&body=${body}`, '_blank');
          }
        }, index * 600);
      });

      try {
        const { collection, addDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        await addDoc(collection(db, 'poster_stats'), {
          type: 'shared_whatsapp',
          parasha: liveData.parasha || '',
          poster_type: liveData.type || 'prayer',
          date: new Date().toISOString().split('T')[0],
        });
      } catch { /* silent */ }

      setTimeout(() => {
        setSending(false);
        setUploadProgress('');
      }, toSend.length * 600 + 500);

    } catch (e) {
      console.error(e);
      alert('שגיאה בשליחה');
      setSending(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary" />
          שלח לרשימת מנויים ({subscribers.length})
        </Label>
        <button onClick={toggleAll} className="text-xs text-primary underline flex items-center gap-1">
          {selected.size === subscribers.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          {selected.size === subscribers.length ? 'בטל הכל' : 'בחר הכל'}
        </button>
      </div>

      <div className="space-y-1.5 max-h-40 overflow-y-auto bg-muted/30 rounded-lg p-2">
        {subscribers.map(sub => (
          <div key={sub.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50">
            <Checkbox
              id={`sub-${sub.id}`}
              checked={selected.has(sub.id)}
              onCheckedChange={() => toggleSub(sub.id)}
            />
            <Label htmlFor={`sub-${sub.id}`} className="flex-1 text-sm cursor-pointer">
              <span className="font-medium">{sub.name}</span>
              <span className="text-xs text-muted-foreground mr-2">{sub.phone || sub.email}</span>
            </Label>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSend}
        disabled={sending || selected.size === 0}
        className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {uploadProgress || 'שולח...'}
          </>
        ) : (
          <>
            <WhatsAppIcon />
            שלח ל-{selected.size} נבחרים
          </>
        )}
      </Button>
    </div>
  );
}