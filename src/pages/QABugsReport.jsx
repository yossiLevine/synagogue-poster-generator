import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, Filter, Download } from 'lucide-react';

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-900', badge: 'bg-red-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-900', badge: 'bg-orange-600' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-900', badge: 'bg-yellow-600' },
};

const CATEGORY_CONFIG = {
  security: { label: 'Security 🔐', color: 'bg-red-50 border-red-300' },
  functionality: { label: 'Functionality 🔧', color: 'bg-blue-50 border-blue-300' },
  ux: { label: 'UX/UI 🎨', color: 'bg-purple-50 border-purple-300' },
  performance: { label: 'Performance ⚡', color: 'bg-green-50 border-green-300' },
};

const STATUS_CONFIG = {
  new: { icon: '🆕', label: 'New', color: 'text-blue-600' },
  in_progress: { icon: '⏳', label: 'In Progress', color: 'text-orange-600' },
  fixed: { icon: '✅', label: 'Fixed', color: 'text-green-600' },
};

export default function QABugsReport() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ severity: 'all', category: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    security: 0,
    functionality: 0,
    ux: 0,
    performance: 0,
  });

  useEffect(() => {
    loadBugs();
  }, []);

  const loadBugs = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const snapshot = await getDocs(collection(db, 'bug_reports'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBugs(data);
      calculateStats(data);
    } catch (e) {
      console.error('Error loading bugs:', e);
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    const newStats = {
      total: data.length,
      critical: data.filter(b => b.severity === 'critical').length,
      high: data.filter(b => b.severity === 'high').length,
      medium: data.filter(b => b.severity === 'medium').length,
      security: data.filter(b => b.category === 'security').length,
      functionality: data.filter(b => b.category === 'functionality').length,
      ux: data.filter(b => b.category === 'ux').length,
      performance: data.filter(b => b.category === 'performance').length,
    };
    setStats(newStats);
  };

  const filteredBugs = bugs.filter(bug => {
    const severityMatch = filters.severity === 'all' || bug.severity === filters.severity;
    const categoryMatch = filters.category === 'all' || bug.category === filters.category;
    const searchMatch = searchTerm === '' || 
      bug.bug_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bug.title.toLowerCase().includes(searchTerm.toLowerCase());
    return severityMatch && categoryMatch && searchMatch;
  });

  if (loading) return <div className="flex items-center justify-center h-screen">טוען...</div>;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📋 דוח QA - בדיקות באגים</h1>
          <p className="text-muted-foreground">ניהול וסטטוס של כל הבאגים הזוהו במערכת</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.total}</p>
            <p className="text-sm text-muted-foreground">סה"כ באגים</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{stats.critical}</p>
            <p className="text-sm text-red-600">Critical</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-orange-700">{stats.high}</p>
            <p className="text-sm text-orange-600">High</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{stats.medium}</p>
            <p className="text-sm text-yellow-600">Medium</p>
          </div>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className={`border-2 rounded-lg p-4 text-center ${CATEGORY_CONFIG.security.color}`}>
            <p className="text-2xl font-bold">{stats.security}</p>
            <p className="text-sm font-semibold">{CATEGORY_CONFIG.security.label}</p>
          </div>
          <div className={`border-2 rounded-lg p-4 text-center ${CATEGORY_CONFIG.functionality.color}`}>
            <p className="text-2xl font-bold">{stats.functionality}</p>
            <p className="text-sm font-semibold">{CATEGORY_CONFIG.functionality.label}</p>
          </div>
          <div className={`border-2 rounded-lg p-4 text-center ${CATEGORY_CONFIG.ux.color}`}>
            <p className="text-2xl font-bold">{stats.ux}</p>
            <p className="text-sm font-semibold">{CATEGORY_CONFIG.ux.label}</p>
          </div>
          <div className={`border-2 rounded-lg p-4 text-center ${CATEGORY_CONFIG.performance.color}`}>
            <p className="text-2xl font-bold">{stats.performance}</p>
            <p className="text-sm font-semibold">{CATEGORY_CONFIG.performance.label}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-sm">סינונים</h3>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Severity Filter */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">חומרה:</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filters.severity === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, severity: 'all' })}
                >
                  הכל
                </Button>
                {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={filters.severity === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ ...filters, severity: key })}
                    className={filters.severity === key ? '' : 'opacity-70'}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full">
              <p className="text-xs font-semibold text-muted-foreground mb-2">קטגוריה:</p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filters.category === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters({ ...filters, category: 'all' })}
                >
                  הכל
                </Button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={filters.category === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters({ ...filters, category: key })}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Search */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">חיפוש:</p>
            <input
              type="text"
              placeholder="חיפוש לפי bug ID או כותרת..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Bugs List */}
        <div className="space-y-3">
          {filteredBugs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">אין באגים התואמים את הסינונים</p>
            </div>
          ) : (
            filteredBugs.map((bug) => (
              <div
                key={bug.id}
                className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${CATEGORY_CONFIG[bug.category].color}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* Bug Header */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className={`inline-block px-2 py-1 rounded-md text-white text-xs font-bold ${SEVERITY_CONFIG[bug.severity].badge}`}>
                        {SEVERITY_CONFIG[bug.severity].label}
                      </span>
                      <span className={`inline-block text-sm font-bold ${STATUS_CONFIG[bug.status].color}`}>
                        {STATUS_CONFIG[bug.status].icon} {STATUS_CONFIG[bug.status].label}
                      </span>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{bug.bug_id}</code>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold mb-2">{bug.title}</h3>

                    {/* Description */}
                    <p className="text-sm opacity-80 mb-2">{bug.description}</p>

                    {/* Category */}
                    <p className="text-xs text-muted-foreground">
                      🏷 {CATEGORY_CONFIG[bug.category].label}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const newStatus = bug.status === 'fixed' ? 'new' : bug.status === 'in_progress' ? 'fixed' : 'in_progress';
                        const { doc, updateDoc } = await import('firebase/firestore');
                        const { db } = await import('@/lib/firebase');
                        await updateDoc(doc(db, 'bug_reports', bug.id), { status: newStatus });
                        loadBugs();
                      }}
                    >
                      {bug.status === 'new' ? '⏳ בעבודה' : bug.status === 'in_progress' ? '✅ תוקן' : '🆕 חדש'}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-8 p-4 bg-muted/40 rounded-lg text-center text-sm text-muted-foreground">
          <p>מציגים {filteredBugs.length} מתוך {bugs.length} באגים</p>
        </div>
      </div>
    </div>
  );
}