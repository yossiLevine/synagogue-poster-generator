import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Zap, Save, FolderOpen, Minus, GripVertical } from 'lucide-react';
import { saveProfile, loadProfiles, deleteProfile } from '@/lib/synagogueProfiles';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Default rules for Shabbat
export const DEFAULT_SHABBAT_RULES = [
  { label: 'מנחה ערב שבת', baseZman: 'plagHaMincha',        offsetMinutes: 0,   direction: 'after',  dayTag: 'A' },
  { label: 'קבלת שבת',     baseZman: 'candleLighting',      offsetMinutes: 0,   direction: 'after',  dayTag: 'A' },
  { label: 'מעריב',        baseZman: 'tzeitFriday7083deg',   offsetMinutes: 5,   direction: 'after',  dayTag: 'A' },
  { label: 'שחרית',        baseZman: 'sunriseShabbat',       offsetMinutes: 30,  direction: 'after',  dayTag: 'B' },
  { label: 'מנחה',         baseZman: 'minchaGedolaShabbat',  offsetMinutes: 30,  direction: 'after',  dayTag: 'B' },
  { label: 'מעריב מוצ"ש', baseZman: 'tzeit7083deg',         offsetMinutes: 0,   direction: 'after',  dayTag: 'B' },
];

// Default rules for Yom Tov
export const DEFAULT_YOM_TOV_RULES = [
  { label: 'מנחה ערב יו"ט', baseZman: 'plagHaMincha',       offsetMinutes: 0,   direction: 'after',  dayTag: 'A' },
  { label: 'מעריב ערב יו"ט', baseZman: 'tzeitFriday7083deg', offsetMinutes: 5,   direction: 'after',  dayTag: 'A' },
  { label: 'שחרית',          baseZman: 'sunriseShabbat',     offsetMinutes: 30,  direction: 'after',  dayTag: 'B' },
  { label: 'מוסף',           baseZman: 'chatzotShabbat',     offsetMinutes: -30, direction: 'before', dayTag: 'B' },
  { label: 'מנחה',           baseZman: 'minchaGedolaShabbat',offsetMinutes: 30,  direction: 'after',  dayTag: 'B' },
  { label: 'מעריב',          baseZman: 'tzeit7083deg',       offsetMinutes: 0,   direction: 'after',  dayTag: 'B' },
];

export const BASE_ZMANIM_OPTIONS = [
  // שישי
  { key: 'alotHaShachar',       label: 'עלות השחר (שישי)' },
  { key: 'sunrise',             label: 'הנץ החמה (שישי)' },
  { key: 'sofZmanShma',         label: 'סוף זמן ק"ש גר"א (שישי)' },
  { key: 'sofZmanShmaMGA',      label: 'סוף זמן ק"ש מג"א (שישי)' },
  { key: 'sofZmanTfilla',       label: 'סוף זמן תפילה גר"א (שישי)' },
  { key: 'sofZmanTfillaMGA',    label: 'סוף זמן תפילה מג"א (שישי)' },
  { key: 'chatzot',             label: 'חצות היום (שישי)' },
  { key: 'minchaGedola',        label: 'מנחה גדולה (שישי)' },
  { key: 'minchaKetana',        label: 'מנחה קטנה (שישי)' },
  { key: 'plagHaMincha',        label: 'פלג המנחה (שישי)' },
  { key: 'candleLighting',      label: 'הדלקת נרות (שישי)' },
  { key: 'sunset',              label: 'שקיעה (שישי)' },
  { key: 'tzeitFriday7083deg',  label: 'צאת כוכבים 7.083° (שישי)' },
  { key: 'tzeitFriday85deg',    label: 'צאת כוכבים 8.5° (שישי)' },
  // שבת
  { key: 'sunriseShabbat',      label: 'הנץ החמה (שבת)' },
  { key: 'sofZmanShmaShabbat',  label: 'סוף זמן ק"ש גר"א (שבת)' },
  { key: 'sofZmanShmaMGAShabbat',label: 'סוף זמן ק"ש מג"א (שבת)' },
  { key: 'sofZmanTfillaShabbat',label: 'סוף זמן תפילה גר"א (שבת)' },
  { key: 'sofZmanTfillaMGAShabbat',label:'סוף זמן תפילה מג"א (שבת)' },
  { key: 'chatzotShabbat',      label: 'חצות היום (שבת)' },
  { key: 'minchaGedolaShabbat', label: 'מנחה גדולה (שבת)' },
  { key: 'minchaKetanaShabbat', label: 'מנחה קטנה (שבת)' },
  { key: 'plagHaMinchaShabbat', label: 'פלג המנחה (שבת)' },
  { key: 'sunsetShabbat',       label: 'שקיעה (שבת)' },
  { key: 'tzeit7083deg',        label: 'צאת שבת 7.083° (שבת)' },
  { key: 'tzeit85deg',          label: 'צאת שבת 8.5° (שבת)' },
  { key: 'tzeit72min',          label: 'צאת שבת ר"ת 72 דק\' (שבת)' },
  { key: 'fixed',               label: '🕐 שעה קבועה' },
];

const RULES_LS_KEY = 'synagogue_relative_rules';

import { getSynagogueId, loadRulesFromDB, saveRulesToDB, saveDraftToDB } from '@/lib/synagogueDB';
import { resolveZmanIso, applyOffset, fetchZmanimTwoDays, fetchShabbatInfo, getNextFriday, addDays } from '@/lib/zmanimApi';
import { loadSynagogueDefaultPrayers, saveSynagogueDefaultPrayers } from '@/lib/synagogueConfig';

function normalizeRuleLabel(s) {
  if (!s || typeof s !== 'string') return '';
  return s.trim().replace(/\s+/g, ' ').replace(/יי/g, 'י').replace(/["'״׳\-–—]/g, '');
}

function migrateRules(rules) {
  // Fix: tzeit7083deg/tzeit85deg with dayTag 'A' should use the Friday variants
  return rules.map(rule => {
    if (rule.dayTag === 'A' && rule.baseZman === 'tzeit7083deg') {
      return { ...rule, baseZman: 'tzeitFriday7083deg' };
    }
    if (rule.dayTag === 'A' && rule.baseZman === 'tzeit85deg') {
      return { ...rule, baseZman: 'tzeitFriday85deg' };
    }
    return rule;
  });
}

export function loadRules() {
  // sync fallback for initial render
  try {
    const raw = JSON.parse(localStorage.getItem(RULES_LS_KEY) || '[]');
    return migrateRules(raw);
  } catch { return []; }
}

export async function loadRulesAsync() {
  if (getSynagogueId()) {
    try {
      const dbData = await loadRulesFromDB();
      if (dbData && dbData.length > 0) {
        const migrated = migrateRules(dbData);
        localStorage.setItem(RULES_LS_KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch {}
  }
  return loadRules();
}

export async function saveRules(rules) {
  localStorage.setItem(RULES_LS_KEY, JSON.stringify(rules));
  if (getSynagogueId()) {
    try {
      await saveRulesToDB(rules);
    } catch (e) {
      console.error('Failed to save rules to DB:', e);
      throw new Error('שגיאה בשמירה לשרת - אנא נסה שוב');
    }
  }
}

// timesA = zmanim for day A (Friday), timesB = zmanim for day B (Shabbat)
// Uses resolveZmanIso from zmanimApi (SSOT) — no duplicate key mapping here
export function calcPrayerRowsFromRules(rules, timesA, shabbatInfo, timesB = null) {
  return rules
    .map(rule => {
      if (rule.baseZman === 'fixed') {
        if (!rule.fixedTime) return null;
        return { label: rule.label, time: rule.fixedTime, dayTag: rule.dayTag || 'A' };
      }

      if (rule.baseZman === 'candleLighting') {
        const iso = shabbatInfo?.candleLightingIso;
        if (!iso) return null;
        const offset = parseInt(rule.offsetMinutes || 0, 10);
        const time = applyOffset(iso, offset, 'down');
        return { label: rule.label, time, dayTag: rule.dayTag || 'A' };
      }

      // Use SSOT: resolveZmanIso handles source routing (timesA vs timesB) via ZMANIM_META
      const iso = resolveZmanIso(rule.baseZman, timesA || {}, timesB || {});
      if (!iso) return null;

      const offset = parseInt(rule.offsetMinutes || 0, 10);
      const dayTag = rule.dayTag || 'A';
      const roundDir = dayTag === 'A' ? 'down' : 'up';
      const time = applyOffset(iso, offset, roundDir);
      return { label: rule.label, time, dayTag };
    })
    .filter(Boolean);
}

export async function calculateRowsForCurrentShabbat(rules) {
  const friday = getNextFriday();
  const shabbat = addDays(friday, 1);
  const [{ zmanimA, zmanimB }, shabbatInfo, synDefaultPrayers] = await Promise.all([
    fetchZmanimTwoDays(friday, shabbat),
    fetchShabbatInfo(friday),
    loadSynagogueDefaultPrayers().catch(() => null),
  ]);

  if (synDefaultPrayers && Array.isArray(synDefaultPrayers) && synDefaultPrayers.length > 0) {
    const updatedDefaults = synDefaultPrayers.map((p, idx) => {
      if (p.isHeader || p.isNote) return { ...p, id: p.id || `def-${idx}`, visible: p.visible !== false };
      const normP = normalizeRuleLabel(p.label);
      const matchedRule = rules.find(r => normalizeRuleLabel(r.label) === normP);
      if (matchedRule) {
        const singleCalc = calcPrayerRowsFromRules([matchedRule], zmanimA, shabbatInfo, zmanimB)[0];
        return {
          ...p,
          id: p.id || `def-${idx}`,
          baseZman: matchedRule.baseZman,
          offsetMinutes: matchedRule.offsetMinutes,
          dayTag: matchedRule.dayTag || p.dayTag || 'A',
          fixedTime: matchedRule.baseZman === 'fixed' ? matchedRule.fixedTime : '',
          time: singleCalc ? singleCalc.time : (matchedRule.fixedTime || ''),
          visible: p.visible !== false,
        };
      }
      return { ...p, id: p.id || `def-${idx}`, visible: p.visible !== false };
    });
    // Also append any newly added rules that weren't in synDefaultPrayers
    rules.forEach((rule, rIdx) => {
      const normR = normalizeRuleLabel(rule.label);
      const exists = updatedDefaults.some(p => !p.isHeader && !p.isNote && normalizeRuleLabel(p.label) === normR);
      if (!exists && rule.label) {
        const singleCalc = calcPrayerRowsFromRules([rule], zmanimA, shabbatInfo, zmanimB)[0];
        updatedDefaults.push({
          id: `rule-new-${rIdx}-${Date.now()}`,
          label: rule.label,
          baseZman: rule.baseZman,
          offsetMinutes: rule.offsetMinutes,
          dayTag: rule.dayTag || 'A',
          fixedTime: rule.baseZman === 'fixed' ? rule.fixedTime : '',
          time: singleCalc ? singleCalc.time : (rule.fixedTime || ''),
          visible: true,
        });
      }
    });
    saveSynagogueDefaultPrayers(updatedDefaults).catch(() => {});
    return updatedDefaults;
  }

  const rawRows = calcPrayerRowsFromRules(rules, zmanimA, shabbatInfo, zmanimB);
  return rawRows.map((r, i) => ({
    id: `rule-calc-${i}-${Date.now()}`,
    label: r.label,
    time: r.time,
    dayTag: r.dayTag || 'A',
    visible: true,
  }));
}

export default function RelativeZmanimConfig({ onApply, isYomTov = false, embedded = false, defaultOpen = true }) {
  const [rules, setRules] = useState(() => {
    const saved = loadRules();
    return saved.length > 0 ? saved : (isYomTov ? DEFAULT_YOM_TOV_RULES : DEFAULT_SHABBAT_RULES);
  });
  // Ensure stable IDs for drag-and-drop — use ref so IDs never change on re-render
  const ruleIdsRef = useRef(rules.map((_, i) => `rule-id-${Date.now()}-${i}`));
  const getRuleId = (i) => {
    if (!ruleIdsRef.current[i]) {
      ruleIdsRef.current[i] = `rule-id-${Date.now()}-${i}`;
    }
    return ruleIdsRef.current[i];
  };

  // When isYomTov changes and no custom rules saved, reload defaults
  useEffect(() => {
    const saved = loadRules();
    if (saved.length === 0) {
      setRules(isYomTov ? DEFAULT_YOM_TOV_RULES : DEFAULT_SHABBAT_RULES);
    }
  }, [isYomTov]);
  const [open, setOpen] = useState(embedded ? true : defaultOpen);
  const [profileName, setProfileName] = useState('');
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-tag: zmanim that belong to "day A" (Friday/Erev YomTov)
  const DAY_A_ZMANIM = new Set(['alotHaShachar', 'sunrise', 'sofZmanShma', 'chatzot', 'minchaGedola', 'plagHaMincha', 'candleLighting', 'sunset', 'tzeitFriday7083deg', 'tzeitFriday85deg']);

  const applyAndSaveRules = async (rulesToApply) => {
    await saveRules(rulesToApply);
    let newRows = [];
    try {
      newRows = await calculateRowsForCurrentShabbat(rulesToApply);
      let draft = null;
      try {
        draft = JSON.parse(localStorage.getItem('editor_draft'));
      } catch {}
      if (draft) {
        draft.prayerRows = newRows;
        draft.lastModified = Date.now();
        localStorage.setItem('editor_draft', JSON.stringify(draft));
        saveDraftToDB(draft).catch(err => console.warn('DB draft save error:', err));
      }
      window.dispatchEvent(new CustomEvent('synagogue-rules-applied', {
        detail: { rules: rulesToApply, prayerRows: newRows }
      }));
    } catch (err) {
      console.warn('Failed to auto-recalc rows on rule save:', err);
    }
    if (onApply) onApply(rulesToApply, newRows);
    return newRows;
  };

  const loadDefaults = async () => {
    const defaults = isYomTov ? DEFAULT_YOM_TOV_RULES : DEFAULT_SHABBAT_RULES;
    ruleIdsRef.current = defaults.map((_, i) => `rule-id-${Date.now()}-${i}`);
    setRules(defaults);
    try {
      await applyAndSaveRules(defaults);
    } catch (e) {
      alert(e.message);
    }
  };

  const addRule = () => setRules([...rules, { label: '', baseZman: 'sunset', offsetMinutes: 0, direction: 'after', dayTag: 'A' }]);

  const updateRule = (i, field, val) => {
    const updated = [...rules];
    const rule = { ...updated[i], [field]: val };
    // Auto-tag dayTag when baseZman changes, unless user manually changed it
    if (field === 'baseZman' && !updated[i]._manualDayTag) {
      rule.dayTag = DAY_A_ZMANIM.has(val) ? 'A' : 'B';
    }
    updated[i] = rule;
    setRules(updated);
  };

  // Toggle direction (before/after) and update offsetMinutes sign accordingly
  const toggleDirection = (i) => {
    const rule = rules[i];
    const newDir = rule.direction === 'before' ? 'after' : 'before';
    const absVal = Math.abs(parseInt(rule.offsetMinutes || 0, 10));
    const newOffset = newDir === 'before' ? -absVal : absVal;
    const updated = [...rules];
    updated[i] = { ...updated[i], direction: newDir, offsetMinutes: newOffset };
    setRules(updated);
  };

  const updateMinutes = (i, val) => {
    const rule = rules[i];
    if (val === '' || val === '-') {
      updateRule(i, 'offsetMinutes', 0);
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const absVal = Math.abs(num);
    const isNegative = String(val).startsWith('-') || rule.direction === 'before';
    const signed = isNegative ? -absVal : absVal;
    const updated = [...rules];
    updated[i] = { ...updated[i], direction: signed < 0 ? 'before' : 'after', offsetMinutes: signed };
    setRules(updated);
  };

  const removeRule = (i) => setRules(rules.filter((_, idx) => idx !== i));

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(rules);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    // Also reorder the stable IDs to match
    const ids = Array.from(ruleIdsRef.current);
    const [removedId] = ids.splice(result.source.index, 1);
    ids.splice(result.destination.index, 0, removedId);
    ruleIdsRef.current = ids;
    setRules(items);
  };

  const handleSave = async () => {
    try {
      await applyAndSaveRules(rules);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (!embedded) setOpen(false);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;
    saveProfile(profileName.trim(), { rules });
    setProfiles(loadProfiles());
    setProfileName('');
    setOpen(true);
  };

  const handleLoadProfile = async (name) => {
    const p = loadProfiles()[name];
    if (p?.rules) { 
      setRules(p.rules);
      setOpen(true);
      try {
        await applyAndSaveRules(p.rules);
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const handleDeleteProfile = (name) => {
    if (!window.confirm(`למחוק את פרופיל "${name}"?`)) return;
    deleteProfile(name);
    setProfiles(loadProfiles());
  };

  const contentMarkup = (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-border">
        <p className="text-xs text-muted-foreground">הגדר שעות קבועות או דקות לפני/אחרי זמן אסטרונומי. הזמנים יחושבו אוטומטית בכל שבוע.</p>
        <button
          onClick={loadDefaults}
          className="text-xs text-primary font-medium underline hover:no-underline whitespace-nowrap"
        >
          {isYomTov ? '✨ אפס לברירת מחדל יו"ט' : '✨ אפס לברירת מחדל שבת'}
        </button>
      </div>

      {/* Profile loader */}
      {Object.keys(profiles).length > 0 && (
        <div className="space-y-1.5 p-2.5 bg-muted/30 rounded-xl border border-border">
          <p className="text-xs font-semibold text-foreground">פרופילים שמורים:</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(profiles).map(name => (
              <div key={name} className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1 border border-border text-xs">
                <button onClick={() => handleLoadProfile(name)} className="text-primary hover:underline flex items-center gap-1 font-medium">
                  <FolderOpen className="w-3.5 h-3.5" /> {name}
                </button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProfile(name)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="rules-list">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2.5">
              {rules.map((rule, i) => (
                <Draggable key={getRuleId(i)} draggableId={getRuleId(i)} index={i}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border border-border/80 rounded-xl p-3 space-y-2.5 bg-card shadow-xs transition-shadow ${snapshot.isDragging ? 'shadow-lg opacity-90 ring-2 ring-primary/30' : ''}`}
                    >
                      {/* Top row: Label + drag handle + delete */}
                      <div className="flex items-center gap-2">
                        <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0 p-1 rounded-md hover:bg-muted" title="גרור לשינוי סדר">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <Input
                          value={rule.label}
                          onChange={e => updateRule(i, 'label', e.target.value)}
                          placeholder="שם תפילה (למשל: מנחה ערב שבת)"
                          className="flex-1 text-sm font-bold bg-background text-right"
                          dir="rtl"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeRule(i)} className="text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0" title="מחק חוק">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Bottom row: Base zman, offset, day tag */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 items-center">
                        <div className="sm:col-span-6">
                          <Select value={rule.baseZman} onValueChange={v => updateRule(i, 'baseZman', v)}>
                            <SelectTrigger className="w-full text-xs sm:text-sm bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {BASE_ZMANIM_OPTIONS.map(z => <SelectItem key={z.key} value={z.key}>{z.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="sm:col-span-4 flex items-center justify-between sm:justify-end">
                          {rule.baseZman === 'fixed' ? (
                            <div className="flex items-center gap-1.5 w-full justify-between sm:justify-end">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">שעה:</span>
                              <Input
                                type="time"
                                value={rule.fixedTime || ''}
                                onChange={e => updateRule(i, 'fixedTime', e.target.value)}
                                className="w-28 text-sm text-center font-frank bg-background"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 w-full justify-between sm:justify-end">
                              <button
                                type="button"
                                onClick={() => toggleDirection(i)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap ${
                                  Math.abs(parseInt(rule.offsetMinutes || 0, 10)) === 0
                                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                                    : rule.direction === 'before'
                                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                                      : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                }`}
                                title="שנה כיוון (לפני / אחרי / בדיוק בזמן)"
                              >
                                {Math.abs(parseInt(rule.offsetMinutes || 0, 10)) === 0 ? (
                                  'בזמן'
                                ) : rule.direction === 'before' ? (
                                  <span className="flex items-center gap-0.5"><Minus className="w-3 h-3" /> לפני</span>
                                ) : (
                                  <span className="flex items-center gap-0.5"><Plus className="w-3 h-3" /> אחרי</span>
                                )}
                              </button>
                              <Input
                                type="number"
                                value={Math.abs(parseInt(rule.offsetMinutes || 0, 10))}
                                onChange={e => updateMinutes(i, e.target.value)}
                                className="w-16 text-sm text-center bg-background"
                                min="0"
                                max="180"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">דק'</span>
                            </div>
                          )}
                        </div>

                        <div className="sm:col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...rules];
                              updated[i] = { ...updated[i], dayTag: updated[i].dayTag === 'A' ? 'B' : 'A', _manualDayTag: true };
                              setRules(updated);
                            }}
                            className={`w-full py-1.5 px-2 rounded-lg border text-xs font-bold transition-colors text-center ${
                              (rule.dayTag || 'A') === 'A' 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                            }`}
                            title="יום א׳ (שישי) או יום ב׳ (שבת)"
                          >
                            {(rule.dayTag || 'A') === 'A' ? 'שישי (א׳)' : 'שבת (ב׳)'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={addRule} className="gap-1.5 flex-1">
          <Plus className="w-4 h-4 ml-1" /> הוסף חוק חדש
        </Button>
      </div>

      {/* Save profile */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="שם פרופיל חוקים אישי..." className="flex-1 text-right text-sm" dir="rtl" />
        <Button variant="outline" size="sm" onClick={handleSaveProfile} className="gap-1.5 flex-shrink-0">
          <Save className="w-3.5 h-3.5" /> שמור כפרופיל
        </Button>
      </div>

      <Button 
        size="sm" 
        onClick={handleSave} 
        className={`w-full font-bold text-sm py-2.5 transition-all shadow-sm ${saveSuccess ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-primary hover:bg-primary/95 text-primary-foreground'}`}
      >
        {saveSuccess ? '✓ החוקים נשמרו בהצלחה לבית הכנסת!' : '💾 שמור חוקים אלו לבית הכנסת וחשב מחדש'}
      </Button>
    </div>
  );

  if (embedded) {
    return contentMarkup;
  }

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="w-4 h-4 text-primary" />
          <span>חישוב אוטומטי לפי זמני היום</span>
        </div>
        <span className="text-xs text-muted-foreground">{rules.length} חוקים</span>
      </button>

      {open && (
        <div className="p-4 border-t border-border">
          {contentMarkup}
        </div>
      )}
    </div>
  );
}