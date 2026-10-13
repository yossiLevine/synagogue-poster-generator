import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Send, Users, Plus, Trash2, CheckCircle2, MessageSquare, 
  ExternalLink, Sparkles, X, Settings2, ShieldCheck, Share2, Calendar
} from 'lucide-react';
import { getConfig } from '@/lib/synagogueConfig';
import { getTodayHebrewDate, getTodayGregorianDate, getTargetPosterInfo } from '@/lib/hebrewDate';

const LOCAL_STORAGE_GROUPS_KEY = 'synagogue_whatsapp_groups';
const LOCAL_STORAGE_API_KEY = 'synagogue_whatsapp_api_config';

export default function WhatsAppCommunityBot({ liveData, isOpen, onClose }) {
  const cfg = getConfig();
  const parasha = liveData?.parasha || 'פרשת השבוע';
  const synName = cfg.synagogueName || 'בית הכנסת';
  const candleLighting = liveData?.shabbatInfo?.candleLighting || '';
  const prayerRows = liveData?.prayerRows || [];
  const minchaRow = prayerRows.find(r => /מנחה ערב|מנחה ע"ש/.test(r.label)) || prayerRows[0] || { time: '' };
  const shacharitRow = prayerRows.find(r => /שחרית/.test(r.label)) || { time: '' };
  const motzeiRow = prayerRows.find(r => /מוצ"ש|הבדלה|מעריב מוצאי/.test(r.label));

  // Default groups
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [
      { id: '1', name: 'קבוצת הודעות בית הכנסת', target: 'chat.whatsapp.com/invite_code_1', type: 'group' },
      { id: '2', name: 'קבוצת שיעורי תורה והלכה', target: 'chat.whatsapp.com/invite_code_2', type: 'group' },
      { id: '3', name: 'מניין ותיקין והשכמה', target: '0501234567', type: 'individual' },
    ];
  });

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTarget, setNewGroupTarget] = useState('');
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' | 'groups' | 'api'
  const [customMessage, setCustomMessage] = useState('');
  const [dispatchedList, setDispatchedList] = useState([]);

  // API Config (Green API / WhatsApp Business API optional webhook)
  const [apiConfig, setApiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_API_KEY);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return { instanceId: '', apiToken: '', enabled: false };
  });

  // Construct official message text
  useEffect(() => {
    const text = `🕍 *בית הכנסת ${synName}*
` +
      `שבת שלום לכל קהל המתפללים והידידים! 🕯️

` +
      `📜 *זמני תפילה - פרשת ${parasha}*
` +
      (candleLighting ? `🕯️ הדלקת נרות: ${candleLighting}
` : '') +
      (minchaRow.time ? `🌅 מנחה ערב שבת: ${minchaRow.time}
` : '') +
      (shacharitRow.time ? `☀️ שחרית: ${shacharitRow.time}
` : '') +
      (motzeiRow?.time ? `🌙 ${motzeiRow.label}: ${motzeiRow.time}
` : '') +
      (liveData?.structuredAnnouncements?.length 
        ? `\n📢 *הודעות השבת:*\n${liveData.structuredAnnouncements.map(a => `• ${a.title}: ${a.content}`).join('\n')}\n` 
        : '') +
      `
שבת שלום ומבורך! ✡️`;
    setCustomMessage(text);
  }, [parasha, synName, candleLighting, liveData]);

  // Save groups to LocalStorage
  const saveGroups = (newGroups) => {
    setGroups(newGroups);
    localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(newGroups));
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newG = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      target: newGroupTarget.trim(),
      type: newGroupTarget.startsWith('05') ? 'individual' : 'group'
    };
    saveGroups([...groups, newG]);
    setNewGroupName('');
    setNewGroupTarget('');
  };

  const handleDeleteGroup = (id) => {
    saveGroups(groups.filter(g => g.id !== id));
  };

  const handleDispatchSingle = (group) => {
    const encoded = encodeURIComponent(customMessage);
    let url = '';
    if (group.target && group.target.replace(/\D/g, '').length >= 9) {
      const cleanPhone = group.target.replace(/\D/g, '').replace(/^0/, '972');
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    } else {
      url = `https://api.whatsapp.com/send?text=${encoded}`;
    }
    window.open(url, '_blank');
    setDispatchedList(prev => [...new Set([...prev, group.id])]);
  };

  const handleSaveApi = () => {
    localStorage.setItem(LOCAL_STORAGE_API_KEY, JSON.stringify(apiConfig));
    alert('הגדרות API נשמרו בהצלחה!');
  };

  const todayHebrew = getTodayHebrewDate();
  const todayGregorian = getTodayGregorianDate();
  const targetInfo = getTargetPosterInfo(liveData);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <div className="bg-background border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex flex-col gap-2.5 bg-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">בוט וואטסאפ קהילתי (WhatsApp Dispatcher)</h3>
                <p className="text-xs text-muted-foreground">הפצת זמני תפילה והודעות לכל קבוצות בית הכנסת</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Today Date & Target Poster Banner */}
          <div className="bg-white/80 dark:bg-slate-900/80 border border-emerald-500/20 rounded-xl p-2 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 font-bold">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>היום: {todayHebrew}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">({todayGregorian})</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <span className="text-xs">🎯</span>
              <span className="text-muted-foreground text-[11px]">הודעה מיועדת ל:</span>
              <span className="font-bold underline decoration-emerald-500/40">{targetInfo.title}</span>
              {targetInfo.hebrewDate && (
                <span className="bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 px-1.5 py-0.2 rounded text-[10.5px] font-bold mr-auto shadow-2xs">
                  {targetInfo.hebrewDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-muted/40 px-4 pt-2 gap-2 text-xs font-semibold">
          <button 
            onClick={() => setActiveTab('dispatch')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'dispatch' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-muted-foreground'}`}
          >
            <Send className="w-3.5 h-3.5" /> שיגור לקבוצות
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'groups' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-muted-foreground'}`}
          >
            <Users className="w-3.5 h-3.5" /> ניהול קבוצות (${groups.length})
          </button>
          <button 
            onClick={() => setActiveTab('api')}
            className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'api' ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-muted-foreground'}`}
          >
            <Settings2 className="w-3.5 h-3.5" /> הגדרות API אוטומטי
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'dispatch' && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold mb-1.5 block">נוסח ההודעה לשיגור:</Label>
                <Textarea 
                  value={customMessage} 
                  onChange={(e) => setCustomMessage(e.target.value)} 
                  rows={6} 
                  className="text-xs font-mono bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>בחר קבוצה לשיגור מהיר בלחיצה אחת:</span>
                  <span>{dispatchedList.length} מתוך {groups.length} שוגרו</span>
                </div>

                <div className="space-y-2">
                  {groups.map(g => {
                    const isDone = dispatchedList.includes(g.id);
                    return (
                      <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDone ? 'bg-emerald-500/20 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{g.name}</p>
                            <p className="text-[11px] text-muted-foreground">{g.target || 'שיגור כללי'}</p>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleDispatchSingle(g)} 
                          size="sm" 
                          className={`gap-1.5 text-xs font-bold ${isDone ? 'bg-muted text-foreground' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                          <Send className="w-3 h-3" /> {isDone ? 'שגר שוב' : 'שגר עכשיו'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-3 rounded-xl border border-border space-y-2">
                <Label className="text-xs font-bold block">הוספת קבוצה או נמען קהילתי חדש:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input 
                    value={newGroupName} 
                    onChange={e => setNewGroupName(e.target.value)} 
                    placeholder="שם הקבוצה (למשל: קהילת אברכים)" 
                    className="text-xs"
                  />
                  <Input 
                    value={newGroupTarget} 
                    onChange={e => setNewGroupTarget(e.target.value)} 
                    placeholder="טלפון או קישור לקבוצה (אופציונלי)" 
                    className="text-xs"
                  />
                </div>
                <Button onClick={handleAddGroup} size="sm" className="w-full gap-1.5 text-xs font-bold">
                  <Plus className="w-3.5 h-3.5" /> הוסף לרשימת השיגור
                </Button>
              </div>

              <div className="space-y-2">
                {groups.map(g => (
                  <div key={g.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card">
                    <div>
                      <p className="text-sm font-semibold">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.target || 'ללא קישור'}</p>
                    </div>
                    <Button onClick={() => handleDeleteGroup(g.id)} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">חיבור אוטומטי מלא ל-WhatsApp API:</span>
                  <p className="mt-0.5 opacity-90">ניתן להזין מפתחות Green API או WhatsApp Cloud API לשיגור אוטומטי שקט בלחיצה אחת לכל הקבוצות ללא פתיחת לשוניות.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">Instance ID / WhatsApp Phone ID:</Label>
                <Input 
                  value={apiConfig.instanceId} 
                  onChange={e => setApiConfig({...apiConfig, instanceId: e.target.value})} 
                  placeholder="לדוגמה: 1101234567" 
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold">API Token / Secret Key:</Label>
                <Input 
                  type="password"
                  value={apiConfig.apiToken} 
                  onChange={e => setApiConfig({...apiConfig, apiToken: e.target.value})} 
                  placeholder="הזן מפתח API..." 
                  className="text-xs font-mono"
                />
              </div>

              <Button onClick={handleSaveApi} className="w-full text-xs font-bold mt-2">
                שמור הגדרות API
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
