import { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, RotateCcw } from 'lucide-react';
import { getSynagogueId, loadZmanimFromDB, saveZmanimToDB, saveZmanimOverridesToDB, loadZmanimOverridesFromDB } from '@/lib/synagogueDB';
import { ZMANIM_META } from '@/lib/zmanimApi';

// Flat list derived from SSOT — single source of truth
export const ALL_ZMANIM = Object.entries(ZMANIM_META).map(([key, meta]) => ({
  key,
  label: meta.label,
  day: meta.day,
}));

export const DEFAULT_ZMANIM = ['candleLighting', 'sunset', 'tzeit7083deg'];
const LS_KEY = 'synagogue_selected_zmanim';
const LS_OVERRIDES_KEY = 'synagogue_zmanim_overrides';

export function loadSavedZmanim() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Respect empty array [] if user deselected all
        return parsed.filter(k => k !== 'tzeit85deg');
      }
    }
  } catch {}
  return []; // Default to empty array (no zmanim on poster by default)
}

export function loadSavedOverrides() {
  try {
    const saved = localStorage.getItem(LS_OVERRIDES_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export async function loadZmanim() {
  if (getSynagogueId()) {
    try {
      const dbData = await loadZmanimFromDB();
      if (dbData !== null && dbData !== undefined) {
        const filtered = Array.isArray(dbData) ? dbData.filter(k => k !== 'tzeit85deg') : dbData;
        localStorage.setItem(LS_KEY, JSON.stringify(filtered));
        return filtered;
      }
    } catch {}
  }
  return loadSavedZmanim();
}

export async function loadZmanimOverrides() {
  if (getSynagogueId()) {
    try {
      const dbData = await loadZmanimOverridesFromDB();
      if (dbData) {
        localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(dbData));
        return dbData;
      }
    } catch {}
  }
  return loadSavedOverrides();
}

const FRIDAY_ZMANIM = ALL_ZMANIM.filter(z => z.day === 'friday');
const SHABBAT_ZMANIM = ALL_ZMANIM.filter(z => z.day === 'shabbat');

export default function ZmanimSelector({ selected, onChange, overrides = {}, onOverridesChange, computedTimes = {} }) {
  const [editingKey, setEditingKey] = useState(null);
  const [editVal, setEditVal] = useState('');

  const toggle = async (key) => {
    const next = selected.includes(key)
      ? selected.filter(k => k !== key)
      : [...selected, key];
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    if (getSynagogueId()) await saveZmanimToDB(next);
    onChange(next);
  };

  const startEdit = (key) => {
    setEditingKey(key);
    setEditVal(overrides[key] || computedTimes[key] || '');
  };

  const commitEdit = async (key) => {
    const val = editVal.trim();
    const next = { ...overrides };
    // Accept both HH:MM (from time input, e.g. "19:05") and H:MM
    if (val && /^\d{1,2}:\d{2}$/.test(val)) {
      // Normalize to HH:MM
      const [h, m] = val.split(':');
      next[key] = `${String(h).padStart(2, '0')}:${m}`;
    } else {
      delete next[key];
    }
    localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(next));
    if (getSynagogueId()) {
      try { await saveZmanimOverridesToDB(next); } catch {}
    }
    onOverridesChange?.(next);
    setEditingKey(null);
  };

  const clearOverride = async (key) => {
    const next = { ...overrides };
    delete next[key];
    localStorage.setItem(LS_OVERRIDES_KEY, JSON.stringify(next));
    if (getSynagogueId()) {
      try { await saveZmanimOverridesToDB(next); } catch {}
    }
    onOverridesChange?.(next);
  };

  const renderGroup = (zmanim, groupLabel, bgClass, badgeClass, emoji) => (
    <div className={`rounded-xl border p-3 space-y-2 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{emoji}</span>
        <p className="text-sm font-bold">{groupLabel}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeClass}`}>
          {zmanim.filter(z => selected.includes(z.key)).length}/{zmanim.length} נבחרו
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {zmanim.map(z => {
          const isSelected = selected.includes(z.key);
          const hasOverride = !!overrides[z.key];
          const computed = computedTimes[z.key];
          const isEditing = editingKey === z.key;
          return (
            <div key={z.key} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${hasOverride ? 'bg-amber-50 border border-amber-200' : 'bg-white/60'}`}>
              <Checkbox
                id={`z-${z.key}`}
                checked={isSelected}
                onCheckedChange={() => toggle(z.key)}
              />
              <Label htmlFor={`z-${z.key}`} className="text-sm cursor-pointer flex-1">{z.label}</Label>

              {/* Computed / override time display */}
              {isSelected && (
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Input
                        type="time"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        className="h-7 w-24 text-xs text-center font-frank"
                        autoFocus
                        onBlur={() => commitEdit(z.key)}
                        onKeyDown={e => { if (e.key === 'Enter') commitEdit(z.key); if (e.key === 'Escape') setEditingKey(null); }}
                      />
                    </>
                  ) : (
                    <>
                      {(hasOverride || computed) && (
                        <span className={`text-xs font-frank font-bold px-1.5 py-0.5 rounded ${hasOverride ? 'text-amber-700 bg-amber-100' : 'text-muted-foreground'}`}>
                          {hasOverride ? overrides[z.key] : computed}
                        </span>
                      )}
                      <button
                        onClick={() => startEdit(z.key)}
                        className="text-muted-foreground hover:text-primary p-0.5 rounded"
                        title="עריכה ידנית"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {hasOverride && (
                        <button
                          onClick={() => clearOverride(z.key)}
                          className="text-amber-600 hover:text-destructive p-0.5 rounded"
                          title="בטל עריכה ידנית"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          בחר זמנים להצגה — לחץ על <Pencil className="inline w-3 h-3 mx-1" /> לעריכה ידנית
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs"
            onClick={async () => {
              localStorage.setItem(LS_KEY, JSON.stringify([]));
              if (getSynagogueId()) await saveZmanimToDB([]);
              onChange([]);
            }}
          >
            אל תציג זמנים
          </Button>
        </div>
      </div>
      {renderGroup(FRIDAY_ZMANIM,  'שישי — זמני יום שישי',  'bg-blue-50 border-blue-200',    'bg-blue-100 text-blue-700',    '📅')}
      {renderGroup(SHABBAT_ZMANIM, 'שבת — זמני יום שבת',    'bg-purple-50 border-purple-200', 'bg-purple-100 text-purple-700', '✡️')}
    </div>
  );
}