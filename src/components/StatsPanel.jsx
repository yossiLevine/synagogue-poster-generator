import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const ACTION_LABELS = {
  created: '📝 מודעות שנוצרו',
  shared_whatsapp: '💬 שיתופי WhatsApp',
  shared_email: '📧 שיתופי אימייל',
  printed: '🖨️ הדפסות',
  downloaded_pdf: '📄 הורדות PDF',
  downloaded_png: '🖼️ הורדות PNG',
};

export default function StatsPanel() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const q = query(collection(db, 'poster_stats'), orderBy('date', 'desc'), limit(200));
      const snapshot = await getDocs(q);
      const all = snapshot.docs.map(doc => doc.data());
      setStats(all);
      setRecent(all.slice(0, 5));
    } catch (e) {
      setStats([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchStats();
  }, [open]);

  // Aggregate by type
  const counts = {};
  for (const s of stats) {
    counts[s.type] = (counts[s.type] || 0) + 1;
  }

  const total = stats.length;
  const thisWeek = stats.filter(s => {
    const d = new Date(s.created_date);
    const now = new Date();
    return (now - d) < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart2 className="w-4 h-4 text-primary" />
          סטטיסטיקות שימוש
        </div>
        <span className="text-xs text-muted-foreground">{total} פעולות</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />}
      </button>

      {open && (
        <div className="p-4 border-t border-border space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> טוען...
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 rounded-xl p-3 text-center">
                  <p className="text-2xl font-frank font-bold text-primary">{total}</p>
                  <p className="text-xs text-muted-foreground">סה"כ פעולות</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-frank font-bold text-green-700">{thisWeek}</p>
                  <p className="text-xs text-muted-foreground">השבוע</p>
                </div>
              </div>

              {/* By type */}
              {Object.entries(ACTION_LABELS).map(([type, label]) => {
                const count = counts[type] || 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{label}</span>
                      <span className="font-bold text-primary">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}

              {/* Recent */}
              {recent.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">פעולות אחרונות</p>
                  <div className="space-y-1">
                    {recent.map(s => (
                      <div key={s.id} className="flex justify-between text-xs bg-muted/30 rounded px-2 py-1">
                        <span>{ACTION_LABELS[s.type] || s.type}</span>
                        <span className="text-muted-foreground">{s.parasha || '—'}</span>
                        <span className="text-muted-foreground">{new Date(s.created_date).toLocaleDateString('he-IL')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {total === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">אין נתונים עדיין — צור מודעות ושתף!</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}