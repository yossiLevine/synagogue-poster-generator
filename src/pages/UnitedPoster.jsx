import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import UnitedPosterPreview from '@/components/UnitedPosterPreview';

const EMPTY_SYNAGOGUE = () => ({
  id: Date.now() + Math.random(),
  name: '',
  sourceMode: 'manual', // 'manual' | 'publicPoster'
  selectedPosterId: '',
  prayerRows: [
    { label: 'קבלת שבת', time: '' },
    { label: 'שחרית', time: '' },
    { label: 'מנחה', time: '' },
    { label: 'מעריב', time: '' },
  ],
  publicPosters: [],
  postersLoaded: false,
  expanded: true,
});

export default function UnitedPoster() {
  const [synagogues, setSynagogues] = useState([EMPTY_SYNAGOGUE()]);
  const [availableSynagogues, setAvailableSynagogues] = useState([]);
  const [parasha, setParasha] = useState('');
  const [title, setTitle] = useState('זמני תפילה מאוחדים');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchSynagogues = async () => {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const snapshot = await getDocs(collection(db, 'synagogues'));
        const syns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableSynagogues(syns);
      } catch (e) { console.warn(e); }
    };
    fetchSynagogues();
  }, []);

  const addSynagogue = () => {
    setSynagogues(prev => [...prev, EMPTY_SYNAGOGUE()]);
  };

  const removeSynagogue = (id) => {
    setSynagogues(prev => prev.filter(s => s.id !== id));
  };

  const updateSynagogue = (id, changes) => {
    setSynagogues(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  };

  const selectFromList = (id, synagogueId) => {
    const syn = availableSynagogues.find(s => s.id === synagogueId);
    if (syn) updateSynagogue(id, { name: syn.name });
  };

  const loadPublicPosters = async (id, synName) => {
    try {
      const { collection, query: fbQuery, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const q = fbQuery(collection(db, 'public_posters'), where('synagogue_name', '==', synName));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(doc => doc.data());
      updateSynagogue(id, { publicPosters: all, postersLoaded: true });
    } catch {
      updateSynagogue(id, { publicPosters: [], postersLoaded: true });
    }
  };

  const handleSourceModeChange = (id, mode) => {
    const syn = synagogues.find(s => s.id === id);
    updateSynagogue(id, { sourceMode: mode, selectedPosterId: '' });
    if (mode === 'publicPoster' && !syn.postersLoaded && syn.name) {
      loadPublicPosters(id, syn.name);
    }
  };

  const handleSelectPoster = (id, posterId) => {
    const syn = synagogues.find(s => s.id === id);
    const poster = syn.publicPosters.find(p => p.id === posterId);
    if (!poster) return;
    try {
      const data = JSON.parse(poster.poster_data || '{}');
      const rows = data.prayerRows || [];
      updateSynagogue(id, { selectedPosterId: posterId, prayerRows: rows });
    } catch {
      updateSynagogue(id, { selectedPosterId: posterId });
    }
  };

  const updateRow = (synId, rowIdx, field, value) => {
    setSynagogues(prev => prev.map(s => {
      if (s.id !== synId) return s;
      const rows = [...s.prayerRows];
      rows[rowIdx] = { ...rows[rowIdx], [field]: value };
      return { ...s, prayerRows: rows };
    }));
  };

  const addRow = (synId) => {
    setSynagogues(prev => prev.map(s => {
      if (s.id !== synId) return s;
      return { ...s, prayerRows: [...s.prayerRows, { label: '', time: '' }] };
    }));
  };

  const removeRow = (synId, rowIdx) => {
    setSynagogues(prev => prev.map(s => {
      if (s.id !== synId) return s;
      return { ...s, prayerRows: s.prayerRows.filter((_, i) => i !== rowIdx) };
    }));
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card sticky top-0 z-10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => window.location.href = '/admin'} className="text-muted-foreground hover:text-foreground">
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">📋 מודעה מאוחדת</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Global settings */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="font-bold text-base">הגדרות כלליות</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold">כותרת המודעה</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" dir="rtl" />
            </div>
            <div>
              <Label className="text-sm font-semibold">פרשת השבוע</Label>
              <Input value={parasha} onChange={e => setParasha(e.target.value)} placeholder="לדוגמא: בשלח" className="mt-1" dir="rtl" />
            </div>
          </div>
        </div>

        {/* Synagogues */}
        <div className="space-y-4">
          {synagogues.map((syn, synIdx) => (
            <div key={syn.id} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-primary">בית כנסת {synIdx + 1}</span>
                  {syn.name && <span className="text-sm text-muted-foreground">— {syn.name}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateSynagogue(syn.id, { expanded: !syn.expanded })} className="text-muted-foreground hover:text-foreground">
                    {syn.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => removeSynagogue(syn.id)} className="text-destructive h-8 w-8">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {syn.expanded && (
                <div className="p-5 space-y-4">
                  {/* Name: from list or manual */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">שם בית הכנסת</Label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        onChange={e => selectFromList(syn.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="">— בחר מהרשימה —</option>
                        {availableSynagogues.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                        ))}
                      </select>
                      <span className="text-muted-foreground text-sm self-center">או</span>
                      <Input
                        value={syn.name}
                        onChange={e => updateSynagogue(syn.id, { name: e.target.value, postersLoaded: false })}
                        placeholder="הזן ידנית..."
                        className="flex-1"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  {/* Source mode */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">מקור זמני התפילה</Label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSourceModeChange(syn.id, 'manual')}
                        className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${syn.sourceMode === 'manual' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/30'}`}
                      >
                        ✍️ הזנה ידנית
                      </button>
                      <button
                        onClick={() => handleSourceModeChange(syn.id, 'publicPoster')}
                        className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${syn.sourceMode === 'publicPoster' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted/30'}`}
                      >
                        📋 מודעה קיימת
                      </button>
                    </div>
                  </div>

                  {/* Public poster picker */}
                  {syn.sourceMode === 'publicPoster' && (
                    <div>
                      {!syn.name ? (
                        <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">יש להזין תחילה שם בית כנסת לחיפוש מודעות</p>
                      ) : !syn.postersLoaded ? (
                        <Button variant="outline" size="sm" onClick={() => loadPublicPosters(syn.id, syn.name)}>
                          🔍 חפש מודעות קיימות עבור {syn.name}
                        </Button>
                      ) : syn.publicPosters.length === 0 ? (
                        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3">לא נמצאו מודעות קיימות עבור בית כנסת זה</p>
                      ) : (
                        <select
                          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                          value={syn.selectedPosterId}
                          onChange={e => handleSelectPoster(syn.id, e.target.value)}
                        >
                          <option value="">— בחר מודעה —</option>
                          {syn.publicPosters.map(p => (
                            <option key={p.id} value={p.id}>{p.parasha ? `פרשת ${p.parasha}` : p.date} — {p.date}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {/* Prayer rows */}
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">זמני תפילה</Label>
                    <div className="space-y-2">
                      {syn.prayerRows.map((row, rowIdx) => (
                        <div key={rowIdx} className="flex gap-2 items-center">
                          <Input
                            value={row.label}
                            onChange={e => updateRow(syn.id, rowIdx, 'label', e.target.value)}
                            placeholder="שם התפילה"
                            className="flex-1 text-sm"
                            dir="rtl"
                          />
                          <Input
                            value={row.time}
                            onChange={e => updateRow(syn.id, rowIdx, 'time', e.target.value)}
                            placeholder="שעה"
                            className="w-24 text-center text-sm font-mono"
                            dir="ltr"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeRow(syn.id, rowIdx)} className="text-destructive h-8 w-8 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addRow(syn.id)} className="mt-2 gap-1">
                      <Plus className="w-3.5 h-3.5" /> הוסף שורה
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addSynagogue} className="w-full gap-2 border-dashed">
          <Plus className="w-4 h-4" /> הוסף בית כנסת
        </Button>

        <Button
          onClick={() => setShowPreview(true)}
          className="w-full h-12 text-base font-bold gap-2"
        >
          👁️ תצוגה מקדימה ויצוא
        </Button>
      </div>

      {showPreview && (
        <UnitedPosterPreview
          title={title}
          parasha={parasha}
          synagogues={synagogues}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}