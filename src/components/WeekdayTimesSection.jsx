import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

const DEFAULT_WEEKDAY = [
  { label: 'שחרית א-ה', time: '' },
  { label: 'שחרית ו\'', time: '' },
  { label: 'מנחה', time: '' },
  { label: 'מעריב', time: '' },
];

export default function WeekdayTimesSection({ value, onChange, onApply }) {
  const [open, setOpen] = useState(true);
  const rows = value || DEFAULT_WEEKDAY;

  const update = (i, field, val) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };

  const add = () => onChange([...rows, { label: '', time: '' }]);
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));

  const hasAnyTime = rows.some(r => r.time?.trim());

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-semibold"
      >
        <span>זמני תפילה ימות החול</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-3 space-y-2 border-t border-border">
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={row.label} onChange={e => update(i, 'label', e.target.value)} placeholder="שם" className="flex-1 text-right text-sm" dir="rtl" />
              <Input value={row.time} onChange={e => update(i, 'time', e.target.value)} placeholder="שעה" className="w-24 text-center text-sm" dir="ltr" />
              <Button variant="ghost" size="icon" onClick={() => remove(i)} className="text-destructive h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={add} className="w-full gap-1">
            <Plus className="w-4 h-4" /> הוסף שורה
          </Button>
          {hasAnyTime && onApply && (
            <Button onClick={onApply} className="w-full gap-2 bg-primary text-primary-foreground font-bold">
              ✅ הוסף זמני חול למודעה
            </Button>
          )}
        </div>
      )}
    </div>
  );
}