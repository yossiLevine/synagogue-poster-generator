import { THEMES } from '@/lib/themes';
import { Palette, Check, Sparkles } from 'lucide-react';

const NONE_OPTION = { 
  id: 'none', 
  label: 'נקי ללא רקע', 
  emoji: '⬜', 
  bg: '#ffffff', 
  outerBorderColor: '#e2e8f0', 
  titleColor: '#0f172a',
  accentColor: '#64748b'
};

export default function StyleSelector({ value, onChange }) {
  const themes = [
    NONE_OPTION, 
    THEMES.royal_gold, 
    THEMES.classic, 
    THEMES.emerald_prestige, 
    THEMES.jerusalem, 
    THEMES.festive, 
    THEMES.minimal_prestige, 
    THEMES.antique_parchment,
    THEMES.royal,
    THEMES.dark,
    THEMES.parchment,
    THEMES.modern,
    THEMES.green,
  ].filter(Boolean);

  const selectedTheme = themes.find(t => t.id === value) || themes[0];

  return (
    <div dir="rtl" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">סגנון עיצוב וצבעי המודעה</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
          <span>{selectedTheme.emoji}</span>
          <span>{selectedTheme.label}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {themes.map(theme => {
          const isSelected = value === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onChange(theme.id)}
              className={`
                group relative flex flex-col p-2 rounded-xl border-2 text-right transition-all overflow-hidden
                ${isSelected
                  ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20 scale-[1.02]'
                  : 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/40'}
              `}
            >
              {/* Mini poster card preview */}
              <div
                className="w-full h-14 rounded-lg p-1.5 flex flex-col justify-between border shadow-2xs relative overflow-hidden transition-transform group-hover:scale-[1.02]"
                style={{
                  background: theme.bg,
                  borderColor: theme.outerBorderColor || '#e2e8f0',
                }}
              >
                {/* Header preview stripe */}
                <div className="flex items-center justify-between">
                  <span className="text-xs">{theme.emoji}</span>
                  <div 
                    className="w-8 h-1 rounded-full" 
                    style={{ backgroundColor: theme.accentColor || '#c5a55a' }}
                  />
                </div>

                {/* Typography preview */}
                <div className="text-center">
                  <span 
                    className="text-[11px] font-bold block truncate" 
                    style={{ color: theme.titleColor }}
                  >
                    זמני תפילה
                  </span>
                </div>

                {/* Subtitle / row line */}
                <div className="flex items-center justify-between gap-1 px-1">
                  <div className="w-6 h-0.5 rounded" style={{ backgroundColor: theme.titleColor, opacity: 0.4 }} />
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: theme.accentColor || '#c5a55a' }} />
                </div>
              </div>

              {/* Theme label */}
              <div className="mt-1.5 flex items-center justify-between">
                <span className={`text-xs font-semibold truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {theme.label}
                </span>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}