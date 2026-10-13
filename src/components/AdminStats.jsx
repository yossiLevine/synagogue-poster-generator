import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, Send, Download, FileImage } from 'lucide-react';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const q = query(collection(db, 'poster_stats'), orderBy('date', 'desc'), limit(1000));
      const snapshot = await getDocs(q);
      const allStats = snapshot.docs.map(doc => doc.data());
      
      // Process data
      const byType = {};
      const byDate = {};
      const byParasha = {};
      
      allStats.forEach(stat => {
        // By type
        byType[stat.type] = (byType[stat.type] || 0) + 1;
        
        // By date
        if (stat.date) {
          byDate[stat.date] = (byDate[stat.date] || 0) + 1;
        }
        
        // By parasha
        if (stat.parasha) {
          byParasha[stat.parasha] = (byParasha[stat.parasha] || 0) + 1;
        }
      });

      const typeData = Object.entries(byType).map(([type, count]) => ({
        name: getTypeLabel(type),
        value: count,
      }));

      const dateData = Object.entries(byDate)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .slice(-30)
        .map(([date, count]) => ({
          date: formatDateShort(date),
          count,
        }));

      const parashaData = Object.entries(byParasha)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([parasha, count]) => ({
          name: parasha,
          count,
        }));

      setStats({
        total: allStats.length,
        byType,
        typeData,
        dateData,
        parashaData,
        recentStats: allStats.slice(0, 20),
      });
    } catch (e) {
      console.error('Error loading stats:', e);
    }
    setLoading(false);
  };

  const getTypeLabel = (type) => {
    const labels = {
      created: '✍️ יצור',
      shared_whatsapp: '💬 שיתוף WhatsApp',
      shared_email: '📧 שיתוף דוא"ל',
      printed: '🖨️ הדפסה',
      downloaded_pdf: '📥 הורדת PDF',
      downloaded_png: '📥 הורדת PNG',
    };
    return labels[type] || type;
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return <div className="p-4 text-center text-muted-foreground">אין נתונים זמינים</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">סך הפעולות</p>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">✍️ מודעות שיצורו</p>
          <p className="text-3xl font-bold">{stats.byType.created || 0}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">💬 שיתוף WhatsApp</p>
          <p className="text-3xl font-bold text-green-600">{stats.byType.shared_whatsapp || 0}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">📧 שיתוף דוא"ל</p>
          <p className="text-3xl font-bold text-blue-600">{stats.byType.shared_email || 0}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">📥 הורדות</p>
          <p className="text-3xl font-bold">
            {(stats.byType.downloaded_pdf || 0) + (stats.byType.downloaded_png || 0)}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">🖨️ הדפסות</p>
          <p className="text-3xl font-bold">{stats.byType.printed || 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-bold text-sm mb-4">חלוקת פעולות</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Line */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-bold text-sm mb-4">טרנד (30 ימים אחרונים)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.dateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Parshiyot */}
      {stats.parashaData.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-bold text-sm mb-4">פרשיות מובילות</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={stats.parashaData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={140} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activities */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h3 className="font-bold text-sm mb-4">פעילויות אחרונות</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {stats.recentStats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
              <div className="flex items-center gap-2">
                <span>{getTypeLabel(stat.type)}</span>
                {stat.parasha && <span className="text-muted-foreground">• {stat.parasha}</span>}
              </div>
              <span className="text-muted-foreground">{formatDateShort(stat.date)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}