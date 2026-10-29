import { useState, useEffect } from 'react';
import { loadHistory, deleteFromHistory } from '@/lib/templates';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react';

export default function HistoryPanel({ onSelect }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = async () => {
    const h = await loadHistory();
    setHistory(h);
  };

  const handleDelete = async (id) => {
    await deleteFromHistory(id);
    refresh();
  };

  useEffect(() => {
    refresh();
    window.addEventListener('history-updated', refresh);
    return () => window.removeEventListener('history-updated', refresh);
  }, []);

  const filteredHistory = history.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const text = `${item.parasha || ''} ${item.title || ''} ${item.label || ''} ${item.announcements || ''}`.toLowerCase();
    return text.includes(q);
  });

  return (
    <div dir="rtl" className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => { setOpen(!open); if (!open) refresh(); }}
        className="w-full flex items-center justify-between px-5 py-4 font-semibold hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span>היסטוריית מודעות ({history.length})</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="border-t border-border">
          {history.length > 3 && (
            <div className="p-2.5 border-b border-border bg-muted/20 relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute right-5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש לפי פרשה או כותרת..."
                className="h-8 pr-8 text-xs"
              />
            </div>
          )}
          {filteredHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">אין מודעות מתאימות בהיסטוריה</p>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-border">
              {filteredHistory.map(item => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                  <button className="flex-1 text-right" onClick={() => onSelect(item)}>
                    <p className="text-sm font-medium">
                      {item.label ? `${item.label} (${item.parasha || ''})` : item.type === 'prayer' ? `זמני תפילה — ${item.parasha || 'ללא פרשה'}` : `מודעה: ${item.title || '---'}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString('he-IL')}
                    </p>
                  </button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}