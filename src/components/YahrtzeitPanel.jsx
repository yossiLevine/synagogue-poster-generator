import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from 'lucide-react';

export default function YahrtzeitPanel({ value, onChange }) {
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState('');

  const add = () => {
    if (!newName.trim()) return;
    onChange([...value, { name: newName.trim(), date: newDate }]);
    setNewName(''); setNewDate('');
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div dir="rtl" className="space-y-2">
      <p className="text-sm font-semibold">הזכרת נשמות / יאהרצייטים</p>
      <div className="flex gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="שם הנפטר" className="flex-1 text-right text-sm" dir="rtl" />
        <Input value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="תאריך" className="w-28 text-sm" dir="rtl" />
        <Button variant="outline" size="sm" onClick={add} className="flex-shrink-0"><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5">
        {value.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-muted/40 rounded px-3 py-1.5 text-sm">
            <span>ל"ע {item.name} {item.date && `· ${item.date}`}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(i)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}