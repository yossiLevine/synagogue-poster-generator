import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';

const PRESETS = [
  {
    id: 'shabbat_regular',
    label: '🕍 שבת רגילה',
    rows: [
      { id: 'p1', label: 'מנחה ערב שבת', time: '', visible: true },
      { id: 'p2', label: 'קבלת שבת', time: '', visible: true },
      { id: 'p3', label: 'מעריב', time: '', visible: true },
      { id: 'p4', label: 'שחרית', time: '', visible: true },
      { id: 'p5', label: 'מוסף', time: '', visible: true },
      { id: 'p6', label: 'מנחה', time: '', visible: true },
      { id: 'p7', label: 'מעריב מוצ"ש', time: '', visible: true },
    ],
  },
  {
    id: 'shalosh_regalim',
    label: '🌟 שלש רגלים',
    rows: [
      { id: 'h1', label: 'ערב יום טוב', time: '', visible: true, isHeader: true },
      { id: 'h2', label: 'מנחה ערב חג', time: '', visible: true },
      { id: 'h3', label: 'מעריב חג', time: '', visible: true },
      { id: 'h4', label: 'הדלקת נרות', time: '', visible: true, isNote: true },
      { id: 'h5', label: 'יום טוב', time: '', visible: true, isHeader: true },
      { id: 'h6', label: 'שחרית', time: '', visible: true },
      { id: 'h7', label: 'מוסף', time: '', visible: true },
      { id: 'h8', label: 'מנחה', time: '', visible: true },
      { id: 'h9', label: 'מעריב', time: '', visible: true },
    ],
  },
  {
    id: 'rosh_hashana',
    label: '🍎 ראש השנה',
    rows: [
      { id: 'rh1', label: 'ערב ראש השנה', time: '', visible: true, isHeader: true },
      { id: 'rh2', label: 'מנחה', time: '', visible: true },
      { id: 'rh3', label: 'מעריב', time: '', visible: true },
      { id: 'rh4', label: 'יום א׳ ראש השנה', time: '', visible: true, isHeader: true },
      { id: 'rh5', label: 'שחרית ותקיעת שופר', time: '08:00', visible: true },
      { id: 'rh6', label: 'מוסף', time: '', visible: true },
      { id: 'rh7', label: 'מנחה ותשליך', time: '', visible: true },
      { id: 'rh8', label: 'יום ב׳ ראש השנה', time: '', visible: true, isHeader: true },
      { id: 'rh9', label: 'שחרית ותקיעת שופר', time: '08:00', visible: true },
      { id: 'rh10', label: 'מוסף', time: '', visible: true },
      { id: 'rh11', label: 'מנחה', time: '', visible: true },
      { id: 'rh12', label: 'מעריב', time: '', visible: true },
    ],
  },
  {
    id: 'yom_kippur',
    label: '🕯 יום הכיפורים',
    rows: [
      { id: 'yk1', label: 'מנחה לפני הצום', time: '', visible: true },
      { id: 'yk2', label: 'כל נדרי', time: '', visible: true },
      { id: 'yk3', label: 'מעריב', time: '', visible: true },
      { id: 'yk4', label: 'שחרית', time: '', visible: true },
      { id: 'yk5', label: 'מוסף', time: '', visible: true },
      { id: 'yk6', label: 'מנחה וסיום הנעילה', time: '', visible: true },
      { id: 'yk7', label: 'מעריב (מוצאי יו"כ)', time: '', visible: true },
      { id: 'yk8', label: 'תקיעת שופר לאחר הנעילה', time: '', visible: true, isNote: true },
    ],
  },
  {
    id: 'pesach',
    label: '🫓 פסח',
    rows: [
      { id: 'ps1', label: 'ערב פסח', time: '', visible: true, isHeader: true },
      { id: 'ps2', label: 'מנחה', time: '', visible: true },
      { id: 'ps3', label: 'מעריב וסדר פסח', time: '', visible: true },
      { id: 'ps4', label: 'ליל הסדר', time: '', visible: true, isNote: true },
      { id: 'ps5', label: 'יום א׳ פסח', time: '', visible: true, isHeader: true },
      { id: 'ps6', label: 'שחרית', time: '', visible: true },
      { id: 'ps7', label: 'מוסף', time: '', visible: true },
      { id: 'ps8', label: 'מנחה', time: '', visible: true },
      { id: 'ps9', label: 'מעריב', time: '', visible: true },
    ],
  },
  {
    id: 'sukkot',
    label: '🌿 סוכות',
    rows: [
      { id: 'sk1', label: 'ערב סוכות', time: '', visible: true, isHeader: true },
      { id: 'sk2', label: 'מנחה', time: '', visible: true },
      { id: 'sk3', label: 'מעריב', time: '', visible: true },
      { id: 'sk4', label: 'כיבוד בסוכה', time: '', visible: true, isNote: true },
      { id: 'sk5', label: 'יום א׳ סוכות', time: '', visible: true, isHeader: true },
      { id: 'sk6', label: 'שחרית + הלל', time: '', visible: true },
      { id: 'sk7', label: 'מוסף', time: '', visible: true },
      { id: 'sk8', label: 'מנחה', time: '', visible: true },
      { id: 'sk9', label: 'מעריב', time: '', visible: true },
    ],
  },
];

let idCounter = 1000;

export default function PresetTemplates({ onLoad }) {
  const [open, setOpen] = useState(false);

  const handleLoad = (preset) => {
    const rows = preset.rows.map(r => ({ ...r, id: `preset-${idCounter++}` }));
    onLoad(rows);
    setOpen(false);
  };

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="w-4 h-4 text-primary" />
          תבניות מוכנות מראש
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">בחר תבנית — זמנים יתמלאו ידנית לאחר הטעינה</p>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleLoad(preset)}
                className="text-right px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-primary/5 hover:border-primary/40 transition-all text-sm font-medium"
              >
                {preset.label}
                <div className="text-xs text-muted-foreground mt-0.5">{preset.rows.filter(r => !r.isHeader && !r.isNote).length} תפילות</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}