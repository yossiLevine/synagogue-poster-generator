import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, ThumbsUp, Trash2 } from 'lucide-react';

export default function AdminFeatureRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const q = query(collection(db, 'feature_requests'), orderBy('likes', 'desc'));
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error('Error loading requests:', e);
    }
    setLoading(false);
  };

  const handleLike = async (requestId, currentLikes) => {
    setLiking(requestId);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await updateDoc(doc(db, 'feature_requests', requestId), {
        likes: currentLikes + 1,
      });
      loadRequests();
    } catch (e) {
      console.error('Error liking:', e);
    }
    setLiking(null);
  };

  const handleDelete = async (requestId) => {
    if (!confirm('האם אתה בטוח?')) return;
    setDeleting(requestId);
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await deleteDoc(doc(db, 'feature_requests', requestId));
      loadRequests();
    } catch (e) {
      console.error('Error deleting:', e);
      alert('שגיאה במחיקה');
    }
    setDeleting(null);
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await updateDoc(doc(db, 'feature_requests', requestId), {
        status: newStatus,
      });
      loadRequests();
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-12 text-muted-foreground">
        <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>אין בקשות פיצ'רים עדיין</p>
      </div>
    );
  }

  const statusLabels = {
    new: '🆕 חדש',
    planned: '📋 מתוכנן',
    completed: '✅ בוצע',
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="grid gap-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{req.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  בקשה מ: <span className="font-semibold">{req.synagogue_name}</span> • {req.requested_by}
                </p>
                {req.description && (
                  <p className="text-sm text-foreground mt-2 leading-relaxed">{req.description}</p>
                )}
              </div>
              <button
                onClick={() => handleLike(req.id, req.likes)}
                disabled={liking === req.id}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors flex-shrink-0"
              >
                <ThumbsUp className={`w-4 h-4 ${liking === req.id ? 'animate-spin' : ''}`} />
                <span className="text-xs font-bold text-blue-600">{req.likes}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {['new', 'planned', 'completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(req.id, status)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      req.status === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(req.id)}
                disabled={deleting === req.id}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}