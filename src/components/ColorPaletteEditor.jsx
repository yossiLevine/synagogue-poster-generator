import { useState } from 'react';
import { ChevronDown, ChevronUp, Palette, RotateCcw } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const COLOR_PRESETS = [
  { label: 'כחול ים', colors: { titleColor: '#1a2e5a', accentColor: '#c5a55a', bodyColor: '#2a2a2a', bg: '#f8f4ec' } },
  { label: 'ירוק עמוק', colors: { titleColor: '#1b5e20', accentColor: '#388e3c', bodyColor: '#1a3a1a', bg: '#f0fff4' } },
  { label: 'ארגמן', colors: { titleColor: '#4a148c', accentColor: '#7b1fa2', bodyColor: '#2a1a3a', bg: '#fce4ec' } },
  { label: 'חום מדברי', colors: { titleColor: '#4a3728', accentColor: '#8b7355', bodyColor: '#3a2a1a', bg: '#fdf6ec' } },
  { label: 'כחול מלכותי', colors: { titleColor: '#0d1b4f', accentColor: '#ffd700', bodyColor: '#e8d5ff', bg: '#1a0533' } },
  { label: 'אפור עכשווי', colors: { titleColor: '#212121', accentColor: '#607d8b', bodyColor: '#424242', bg: '#fafafa' } },
];

const DEFAULT_CUSTOM = { titleColor: '#1a2e5a', accentColor: '#c5a55a', bodyColor: '#2a2a2a', bg: '#f8f4ec' };
const STORAGE_KEY = 'custom_theme_colors';

export function loadCustomColors() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
}

export function saveCustomColors(colors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  window.dispatchEvent(new Event('custom-theme-changed'));
}

export default function ColorPaletteEditor({ onChange }) {
  const [open, setOpen] = useState(false);
  const [colors, setColors] = useState(() => loadCustomColors() || DEFAULT_CUSTOM);

  const update = (key, val) => {
    const next = { ...colors, [key]: val };
    setColors(next);
    saveCustomColors(next);
    if (onChange) onChange(next);
  };

  const applyPreset = (preset) => {
    setColors(preset.colors);
    saveCustomColors(preset.colors);
    if (onChange) onChange(preset.colors);
  };

  const reset = () => {
    setColors(DEFAULT_CUSTOM);
    saveCustomColors(null);
    localStorage.removeItem(STORAGE_KEY);
    if (onChange) onChange(null);
    window.dispatchEvent(new Event('custom-theme-changed'));
  };

  const FIELDS = [
    { key: 'titleColor', label: 'צבע כותרת' },
    { key: 'accentColor', label: 'צבע הדגשה' },
    { key: 'bodyColor', label: 'צבע טקסט' },
    { key: 'bg', label: 'צבע רקע' },
  ];

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="w-4 h-4 text-primary" />
          עורך צבעים מתקדם
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[colors.titleColor, colors.accentColor, colors.bodyColor].map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c }} />
            ))}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="p-4 border-t border-border space-y-4">
          {/* Presets */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">פלטות מוכנות</p>
            <div className="grid grid-cols-3 gap-1.5">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-xs"
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.titleColor }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.colors.accentColor }} />
                  </div>
                  <span className="truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colors[key] || '#000000'}
                    onChange={e => update(key, e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <span className="text-xs font-mono text-muted-foreground">{colors[key]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="rounded-lg p-3 border border-border" style={{ backgroundColor: colors.bg }}>
            <p className="font-frank font-bold text-base" style={{ color: colors.titleColor }}>בית כנסת לדוגמה</p>
            <p className="text-sm" style={{ color: colors.bodyColor }}>שחרית: <span className="font-bold" style={{ color: colors.accentColor }}>08:30</span></p>
            <p className="text-xs mt-1" style={{ color: colors.accentColor }}>• • • •</p>
          </div>

          <Button variant="outline" size="sm" onClick={reset} className="gap-1.5 w-full text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> איפוס לברירת מחדל
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            💡 לצבעים מותאמים בחר "ללא" בסגנון עיצוב, ואז הצבעים שלך יופיעו
          </p>
        </div>
      )}
    </div>
  );
}