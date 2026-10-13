import { useState } from 'react';
import { ChevronDown, ChevronUp, Frame } from 'lucide-react';

// All border values that need a color use the token "__COLOR__" which PosterFrame replaces with the theme accent color
export const FRAMES = [
  { id: 'none',    label: 'ללא' },
  { id: 'classic', label: 'קלאסי',     cornerSize: 20, cornerWeight: 2 },
  { id: 'ornate1', label: 'מפואר א',   cornerSize: 20, cornerWeight: 3 },
  { id: 'ornate2', label: 'מפואר ב',   cornerSize: 32, cornerWeight: 4 },
  { id: 'ornate3', label: 'מפואר ג',   cornerSize: 16, cornerWeight: 2 },
  { id: 'rounded', label: 'עגול',       style: { border: '3px solid __COLOR__', borderRadius: '24px' } },
  { id: 'double',  label: 'כפול',       style: { border: '3px double __COLOR__', borderRadius: '6px' } },
  { id: 'dashed',  label: 'מקוטע',     style: { border: '2px dashed __COLOR__', borderRadius: '8px' } },
  { id: 'dotted',  label: 'נקודות',    style: { border: '3px dotted __COLOR__', borderRadius: '8px' } },
  { id: 'thick',   label: 'עבה',        style: { border: '6px solid __COLOR__', borderRadius: '4px' } },
  { id: 'shadow',  label: 'צל עמוק',   style: { border: '2px solid __COLOR__', borderRadius: '8px', boxShadow: '6px 6px 0 rgba(0,0,0,0.2)' } },
  { id: 'shadow2', label: 'הילה',      style: { border: '1px solid __COLOR__', borderRadius: '12px', boxShadow: '0 0 0 5px rgba(0,0,0,0.07), 0 0 0 10px rgba(0,0,0,0.04)' } },
  { id: 'arch',    label: 'קשת',        style: { border: '3px solid __COLOR__', borderRadius: '50% 50% 8px 8px / 30% 30% 8px 8px' } },
  { id: 'hexish',  label: 'גיאומטרי',  style: { border: '2px solid __COLOR__', borderRadius: '20px 8px 20px 8px' } },
  { id: 'scroll',  label: 'מגילה',     style: { border: '4px solid __COLOR__', borderRadius: '2px 50px 2px 50px / 50px 2px 50px 2px' } },
  { id: 'minimal', label: 'מינימל',    style: { borderTop: '3px solid __COLOR__', borderBottom: '3px solid __COLOR__' } },
  { id: 'sides',   label: 'צדדים',     style: { borderLeft: '4px solid __COLOR__', borderRight: '4px solid __COLOR__' } },
  { id: 'film',    label: 'סרט',        style: { border: '8px solid __COLOR__', borderRadius: '2px' } },
  { id: 'elegant', label: 'אלגנטי',   style: { border: '1px solid __COLOR__', outline: '3px solid __COLOR__', outlineOffset: '5px' } },
  { id: 'royal2',  label: 'מלכותי',    style: { border: '2px solid __COLOR__', boxShadow: 'inset 0 0 0 6px rgba(0,0,0,0.07)' } },
  { id: 'ribbon',  label: 'סרט עיגול', style: { border: '3px solid __COLOR__', borderRadius: '100px 8px 100px 8px' } },
  { id: 'wave',    label: 'גל',         style: { border: '3px solid __COLOR__', borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' } },
  { id: 'star',    label: 'מודרני',    style: { border: '2px solid __COLOR__', borderRadius: '8px 28px 8px 28px' } },
  { id: 'bracket', label: 'סוגריים',  style: { borderLeft: '6px solid __COLOR__', borderRight: '6px solid __COLOR__', borderTop: '2px solid __COLOR__', borderBottom: '2px solid __COLOR__', borderRadius: '4px' } },
  { id: 'paper',   label: 'נייר',       style: { border: '1px solid __COLOR__', borderRadius: '2px', boxShadow: '3px 3px 0 rgba(0,0,0,0.12), 6px 6px 0 rgba(0,0,0,0.06)' } },
];

export default function FrameSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = FRAMES.find(f => f.id === value) || FRAMES[0];

  return (
    <div dir="rtl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-semibold mb-2"
      >
        <div className="flex items-center gap-2">
          <Frame className="w-4 h-4 text-primary" />
          מסגרת: <span className="text-primary">{current.label}</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="grid grid-cols-5 gap-1.5">
          {FRAMES.map(frame => (
            <button
              key={frame.id}
              onClick={() => { onChange(frame.id); setOpen(false); }}
              title={frame.label}
              className={`h-10 rounded flex items-center justify-center text-xs font-semibold transition-all ${value === frame.id ? 'bg-primary text-primary-foreground' : 'bg-muted/60 hover:bg-muted text-foreground'}`}
            >
              {frame.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}