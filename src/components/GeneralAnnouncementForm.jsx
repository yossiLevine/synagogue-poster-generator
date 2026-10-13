import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bold, Italic, AlignRight, AlignCenter, AlignLeft, Plus, Trash2 } from 'lucide-react';

export default function GeneralAnnouncementForm({ onGenerate, onChange, dataToLoad }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [footer, setFooter] = useState('');
  
  useEffect(() => {
    if (dataToLoad && dataToLoad.type === 'general') {
      if (dataToLoad.title !== undefined) setTitle(dataToLoad.title);
      if (dataToLoad.body !== undefined) setBody(dataToLoad.body);
      if (dataToLoad.subtitle !== undefined) setSubtitle(dataToLoad.subtitle);
      if (dataToLoad.footer !== undefined) setFooter(dataToLoad.footer);
      if (dataToLoad.fontSize !== undefined) setFontSize(dataToLoad.fontSize);
      if (dataToLoad.titleSize !== undefined) setTitleSize(dataToLoad.titleSize);
      if (dataToLoad.align !== undefined) setAlign(dataToLoad.align);
      if (dataToLoad.boldBody !== undefined) setBoldBody(dataToLoad.boldBody);
      if (dataToLoad.italicBody !== undefined) setItalicBody(dataToLoad.italicBody);
      if (dataToLoad.showDate !== undefined) setShowDate(dataToLoad.showDate);
      if (dataToLoad.titleColor !== undefined) setTitleColor(dataToLoad.titleColor);
      if (dataToLoad.bodyColor !== undefined) setBodyColor(dataToLoad.bodyColor);
      if (dataToLoad.highlightLines !== undefined) setHighlightLines(dataToLoad.highlightLines);
      if (dataToLoad.extraSections !== undefined) setExtraSections(dataToLoad.extraSections);
    }
  }, [dataToLoad]);
  const [fontSize, setFontSize] = useState('medium');
  const [titleSize, setTitleSize] = useState('large');
  const [align, setAlign] = useState('center');
  const [boldBody, setBoldBody] = useState(false);
  const [italicBody, setItalicBody] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [titleColor, setTitleColor] = useState('#1a2e5a');
  const [bodyColor, setBodyColor] = useState('#333333');
  const [highlightLines, setHighlightLines] = useState([]);
  const [extraSections, setExtraSections] = useState([]);

  const currentData = () => ({
    type: 'general', title, subtitle, body, footer, fontSize, titleSize, align,
    boldBody, italicBody, showDate, titleColor, bodyColor, highlightLines, extraSections,
  });

  useEffect(() => {
    if (onChange) onChange(currentData());
  }, [title, subtitle, body, footer, fontSize, titleSize, align, boldBody, italicBody, showDate, titleColor, bodyColor, highlightLines, extraSections]);

  const addHighlight = () => setHighlightLines(prev => [...prev, { id: Date.now(), text: '', color: '#fef3c7' }]);
  const updateHighlight = (id, key, val) => setHighlightLines(prev => prev.map(h => h.id === id ? { ...h, [key]: val } : h));
  const removeHighlight = (id) => setHighlightLines(prev => prev.filter(h => h.id !== id));

  const addSection = () => setExtraSections(prev => [...prev, { id: Date.now(), heading: '', text: '' }]);
  const updateSection = (id, key, val) => setExtraSections(prev => prev.map(s => s.id === id ? { ...s, [key]: val } : s));
  const removeSection = (id) => setExtraSections(prev => prev.filter(s => s.id !== id));

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <Label className="text-sm font-semibold">כותרת ראשית</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמא: הודעה חשובה לציבור המתפללים" className="mt-1 text-right" dir="rtl" />
      </div>

      <div>
        <Label className="text-sm font-semibold">כותרת משנה (אופציונלי)</Label>
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="כותרת משנה..." className="mt-1 text-right" dir="rtl" />
      </div>

      <div>
        <Label className="text-sm font-semibold">תוכן ההודעה</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="כתוב כאן את תוכן ההודעה..." className="mt-1 text-right min-h-[120px]" dir="rtl" />
      </div>

      {/* Highlight lines */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-sm font-semibold">שורות מודגשות / ממוסגרות</Label>
          <Button variant="outline" size="sm" onClick={addHighlight} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" /> הוסף
          </Button>
        </div>
        {highlightLines.map(h => (
          <div key={h.id} className="flex gap-2 items-center mb-1.5">
            <Input value={h.text} onChange={e => updateHighlight(h.id, 'text', e.target.value)}
              placeholder="טקסט מודגש / משפט חשוב" className="flex-1 text-right text-sm" dir="rtl" />
            <input type="color" value={h.color} onChange={e => updateHighlight(h.id, 'color', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border p-0" title="צבע רקע" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => removeHighlight(h.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Extra sections */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-sm font-semibold">קטעים נוספים</Label>
          <Button variant="outline" size="sm" onClick={addSection} className="h-7 text-xs gap-1">
            <Plus className="w-3 h-3" /> הוסף קטע
          </Button>
        </div>
        {extraSections.map(s => (
          <div key={s.id} className="space-y-1.5 mb-3 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex gap-2 items-center">
              <Input value={s.heading} onChange={e => updateSection(s.id, 'heading', e.target.value)}
                placeholder="כותרת קטע" className="flex-1 text-right text-sm font-semibold" dir="rtl" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => removeSection(s.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Textarea value={s.text} onChange={e => updateSection(s.id, 'text', e.target.value)}
              placeholder="תוכן הקטע..." className="text-right text-sm min-h-[60px]" dir="rtl" />
          </div>
        ))}
      </div>

      <div>
        <Label className="text-sm font-semibold">הערת סיום / חתימה (אופציונלי)</Label>
        <Input value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="לדוגמא: בברכה, הנהלת בית הכנסת" className="mt-1 text-right" dir="rtl" />
      </div>

      {/* Text Styling */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border">
        <p className="text-sm font-semibold">עיצוב הטקסט</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">גודל כותרת</Label>
            <Select value={titleSize} onValueChange={setTitleSize}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">קטן</SelectItem>
                <SelectItem value="medium">בינוני</SelectItem>
                <SelectItem value="large">גדול</SelectItem>
                <SelectItem value="xlarge">ענק</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">גודל גוף</Label>
            <Select value={fontSize} onValueChange={setFontSize}>
              <SelectTrigger className="mt-1 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">קטן</SelectItem>
                <SelectItem value="medium">בינוני</SelectItem>
                <SelectItem value="large">גדול</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">יישור</Label>
          <div className="flex gap-1 border border-border rounded-lg overflow-hidden">
            {[
              { value: 'right', icon: AlignRight, label: 'ימין' },
              { value: 'center', icon: AlignCenter, label: 'מרכז' },
              { value: 'left', icon: AlignLeft, label: 'שמאל' },
            ].map(({ value, icon: Icon, label }) => (
              <button key={value} onClick={() => setAlign(value)} title={label}
                className={`p-2 transition-colors ${align === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setBoldBody(!boldBody)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-bold ${boldBody ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
            <Bold className="w-4 h-4" /> מודגש
          </button>
          <button onClick={() => setItalicBody(!italicBody)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm italic ${italicBody ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}>
            <Italic className="w-4 h-4" /> נטוי
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">צבע כותרת</label>
            <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border p-0" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">צבע גוף</label>
            <input type="color" value={bodyColor} onChange={e => setBodyColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-border p-0" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">הצג תאריך</Label>
          <Switch checked={showDate} onCheckedChange={setShowDate} />
        </div>
      </div>

      <Button onClick={() => onGenerate(currentData())} className="w-full text-lg py-6 font-bold">
        צור מודעה כללית
      </Button>
    </div>
  );
}