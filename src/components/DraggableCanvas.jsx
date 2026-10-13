import { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Layers } from 'lucide-react';

let idCounter = 0;

// Controls panel — rendered OUTSIDE the poster (above it in the DOM flow)
export function DraggableCanvasControls({ elements, setElements, newText, setNewText, addText, updateEl, removeEl }) {
  return (
    <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm" dir="rtl">
      <div className="flex items-center gap-2 mb-2 font-semibold text-amber-800">
        <Layers className="w-4 h-4 flex-shrink-0" />
        שכבת עיצוב חופשי — גרור טקסט על המודעה
      </div>
      <div className="flex gap-2 mb-2">
        <Input
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="הקלד טקסט חופשי..."
          className="h-8 text-sm text-right flex-1"
          dir="rtl"
          onKeyDown={e => e.key === 'Enter' && addText()}
        />
        <Button size="sm" onClick={addText} className="h-8 px-3 flex-shrink-0 gap-1">
          <Plus className="w-3.5 h-3.5" /> הוסף
        </Button>
      </div>

      {elements.map(el => (
        <div key={el.id} className="flex flex-wrap items-center gap-2 bg-white border border-amber-200 rounded-lg px-2 py-1.5 mb-1">
          <span className="text-xs font-semibold text-amber-900 max-w-[90px] truncate">{el.content}</span>
          <div className="flex items-center gap-1.5 flex-wrap mr-auto">
            <label className="text-xs text-muted-foreground">צבע</label>
            <input type="color" value={el.color} onChange={e => updateEl(el.id, 'color', e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
            <label className="text-xs text-muted-foreground">גודל</label>
            <input type="number" value={el.fontSize}
              onChange={e => updateEl(el.id, 'fontSize', parseInt(e.target.value) || 12)}
              className="w-14 h-7 text-xs text-center border border-gray-200 rounded" min="8" max="120" />
            <button
              onClick={() => updateEl(el.id, 'bold', !el.bold)}
              className={`text-xs px-2 h-7 rounded border transition-colors font-bold ${el.bold ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
            >B</button>
            <button onClick={() => removeEl(el.id)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {elements.length > 0 && <p className="text-xs text-amber-600 mt-1">✋ גרור את הטקסטים ישירות על המודעה</p>}
    </div>
  );
}

// Overlay — rendered INSIDE the poster wrapper (absolute positioned)
export function DraggableCanvasOverlay({ elements, setElements }) {
  const [dragging, setDragging] = useState(null);

  const onStart = useCallback((e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setElements(prev => {
      const el = prev.find(el => el.id === id);
      if (el) setDragging({ id, startX: clientX, startY: clientY, originX: el.x, originY: el.y });
      return prev;
    });
  }, [setElements]);

  const onMove = useCallback((e) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setElements(prev => prev.map(el =>
      el.id === dragging.id
        ? { ...el, x: dragging.originX + (clientX - dragging.startX), y: dragging.originY + (clientY - dragging.startY) }
        : el
    ));
  }, [dragging, setElements]);

  const onEnd = useCallback(() => setDragging(null), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [onMove, onEnd]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {elements.map(el => (
        <div
          key={el.id}
          className="absolute select-none pointer-events-auto"
          style={{
            left: el.x, top: el.y,
            fontSize: el.fontSize, color: el.color,
            fontWeight: el.bold ? 'bold' : 'normal',
            textShadow: '0 1px 4px rgba(255,255,255,0.85)',
            cursor: dragging?.id === el.id ? 'grabbing' : 'grab',
            whiteSpace: 'nowrap',
          }}
          onMouseDown={e => onStart(e, el.id)}
          onTouchStart={e => onStart(e, el.id)}
        >
          {el.content}
        </div>
      ))}
    </div>
  );
}

// Default export: combined (for backward compat — not used)
export default function DraggableCanvas({ visible }) {
  const [elements, setElements] = useState([]);
  const [newText, setNewText] = useState('');

  const addText = () => {
    if (!newText.trim()) return;
    idCounter++;
    setElements(prev => [...prev, { id: idCounter, content: newText, x: 40, y: 40, fontSize: 22, color: '#1a2e5a', bold: true }]);
    setNewText('');
  };

  const updateEl = (id, key, value) => setElements(prev => prev.map(el => el.id === id ? { ...el, [key]: value } : el));
  const removeEl = (id) => setElements(prev => prev.filter(el => el.id !== id));

  if (!visible) return null;
  return null;
}