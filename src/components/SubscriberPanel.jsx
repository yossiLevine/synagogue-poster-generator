import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Trash2, Send, ChevronDown, ChevronUp, MessageCircle, Mail, Loader2, CheckSquare, Square } from 'lucide-react';
import { loadSubscribers, addSubscriber, deleteSubscriber } from '@/lib/subscribers';
import { base44 } from '@/api/base44Client';
import { capturePoster } from '@/lib/posterCapture';
import { getConfig } from '@/lib/synagogueConfig';

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

export default function SubscriberPanel({ liveData }) {
  const [open, setOpen] = useState(false);
  const [subs, setSubs] = useState(loadSubscribers);
  const [selected, setSelected] = useState(() => new Set(loadSubscribers().map(s => s.id)));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState('');

  const refresh = () => {
    const updated = loadSubscribers();
    setSubs(updated);
    setSelected(new Set(updated.map(s => s.id)));
  };

  const handleAdd = () => {
    if (!name.trim() || (!phone.trim() && !email.trim())) return;
    addSubscriber(name.trim(), phone.trim(), email.trim());
    setName(''); setPhone(''); setEmail('');
    refresh();
  };

  const toggleSub = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === subs.length ? new Set() : new Set(subs.map(s => s.id)));
  };

  const handleSendSelected = async () => {
    const toSend = subs.filter(s => selected.has(s.id));
    if (toSend.length === 0) { alert('בחר לפחות מנוי אחד'); return; }

    setSending(true);

    // If no liveData — send text only (no poster)
    if (!liveData) {
      const text = buildMessage(null);
      toSend.forEach((sub, i) => {
        setTimeout(() => {
          if (sub.phone) window.open('https://wa.me/' + sub.phone + '?text=' + encodeURIComponent(text), '_blank');
          else if (sub.email) window.open(`mailto:${sub.email}?subject=הודעה מבית הכנסת&body=${encodeURIComponent(text)}`, '_blank');
        }, i * 600);
      });
      setTimeout(() => setSending(false), toSend.length * 600 + 500);
      return;
    }

    // With liveData — upload image and send with link
    try {
      setProgress('מכין תמונה...');
      const raw = await capturePoster();
      const dataUrl = raw?.dataUrl || raw;
      if (!dataUrl) { alert('שגיאה בהפקת התמונה'); setSending(false); return; }

      setProgress('מעלה תמונה...');
      let fileUrl = null;
      try {
        const { uploadDataUrlToStorage } = await import('@/lib/storage');
        fileUrl = await uploadDataUrlToStorage(dataUrl, 'shared_posters');
      } catch (err) {
        console.warn('Storage upload failed, trying fallback:', err);
        try {
          const uploadRes = await base44.functions.invoke('uploadPosterImage', { dataUrl });
          fileUrl = uploadRes?.data?.file_url;
        } catch (e2) {}
      }
      if (!fileUrl) { alert('שגיאה בהעלאת התמונה'); setSending(false); return; }

      setProgress('פותח שיחות...');
      const message = buildMessage(liveData);

      toSend.forEach((sub, i) => {
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
        }, i * 600);
      });

      setTimeout(() => { setSending(false); setProgress(''); }, toSend.length * 600 + 500);
    } catch (e) {
      alert('שגיאה בשליחה');
      setSending(false);
      setProgress('');
    }
  };

  return (
    <div dir="rtl" className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => { setOpen(!open); if (!open) refresh(); }}
        className="w-full flex items-center justify-between px-5 py-4 font-semibold hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span>רשימת מנויים ({subs.length})</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Add subscriber */}
          <div className="grid grid-cols-3 gap-2">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="שם" className="text-right text-sm" dir="rtl" />
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="טלפון (WA)" className="text-sm" dir="ltr" />
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="אימייל" className="text-sm" dir="ltr" />
          </div>
          <Button variant="outline" size="sm" onClick={handleAdd} className="w-full">+ הוסף מנוי</Button>

          {/* Subscriber list with checkboxes */}
          {subs.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">בחר למי לשלוח:</p>
                <button onClick={toggleAll} className="text-xs text-primary underline flex items-center gap-1">
                  {selected.size === subs.length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {selected.size === subs.length ? 'בטל הכל' : 'בחר הכל'}
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                {subs.map(s => (
                  <div key={s.id} className="flex items-center gap-2 bg-muted/40 rounded px-3 py-2">
                    <Checkbox
                      id={`sp-${s.id}`}
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggleSub(s.id)}
                    />
                    <Label htmlFor={`sp-${s.id}`} className="flex-1 text-sm cursor-pointer">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground text-xs mr-2">{s.phone || s.email}</span>
                    </Label>
                    <div className="flex gap-1">
                      {s.phone && (
                        <a href={`https://wa.me/${s.phone.replace(/\D/g, '').replace(/^0/, '972')}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600">
                            <MessageCircle className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      {s.email && (
                        <a href={`mailto:${s.email}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600">
                            <Mail className="w-3.5 h-3.5" />
                          </Button>
                        </a>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:bg-destructive/10" 
                        onClick={() => { 
                          if (window.confirm(`האם למחוק את המנוי "${s.name}"?`)) { 
                            deleteSubscriber(s.id); 
                            refresh(); 
                          } 
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSendSelected} disabled={sending || selected.size === 0} className="w-full gap-2">
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{progress || 'שולח...'}</>
                  : <><Send className="w-4 h-4" />שלח ל-{selected.size} נבחרים{liveData ? ' (עם תמונה)' : ''}</>
                }
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}