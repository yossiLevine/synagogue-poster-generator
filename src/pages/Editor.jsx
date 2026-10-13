import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldAlert, LogOut } from 'lucide-react';
import Home from './Home';
import { clearConfigCache } from '@/lib/synagogueConfig';
import { clearSynagogueCache } from '@/lib/synagogueDB';

export default function Editor() {
  const { isAuthenticated, isLoadingAuth, logout } = useAuth();
  const [synagogueId, setSynagogueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sId = localStorage.getItem('synagogue_id');
    const isAdmin = localStorage.getItem('is_admin_mode') === 'true';
    setIsAdminMode(isAdmin);

    // Dev mode: always allow entering the editor
    if (import.meta.env.DEV) {
      setSynagogueId(sId || null);
      setLoading(false);
      return;
    }

    if (isLoadingAuth) return; // wait for Firebase auth state to resolve

    const resolveSynagogue = async () => {
      let currentId = sId;
      if (!currentId) {
        try {
          const { collection, getDocs, limit, query } = await import('firebase/firestore');
          const { db } = await import('@/lib/firebase');
          const q = query(collection(db, 'synagogues'), limit(1));
          const snap = await getDocs(q);
          if (!snap.empty) {
            currentId = snap.docs[0].id;
            localStorage.setItem('synagogue_id', currentId);
          }
        } catch (e) {
          console.warn('Could not auto-resolve synagogue', e);
        }
      }

      setSynagogueId(currentId || null);
      setLoading(false);
    };

    resolveSynagogue();
  }, [isAuthenticated, isLoadingAuth, navigate]);

  const handleBackToAdmin = () => {
    localStorage.removeItem('is_admin_mode');
    clearConfigCache();
    clearSynagogueCache();
    navigate('/admin');
  };

  const handleLogout = async () => {
    localStorage.removeItem('synagogue_id');
    localStorage.removeItem('is_admin_mode');
    clearConfigCache();
    clearSynagogueCache();
    await logout(true); // Firebase signOut + redirect to /login
  };

  if (isLoadingAuth || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background" dir="rtl">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3"></div>
        <p className="text-muted-foreground text-sm font-medium">טוען עורך...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {isAdminMode && (
        <aside aria-label="מצב מנהל מערכת" className="sticky top-0 z-50 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2 flex items-center justify-between shadow-md backdrop-blur-md" dir="rtl">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 animate-pulse" />
            <span>מצב ניהול מערכת — עריכת לוח פעיל כגבאי</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToAdmin}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs font-bold gap-1.5 shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5" /> חזרה לדאשבורד אדמין
            </Button>
          </div>
        </aside>
      )}

      {!isAdminMode && (
        <div className="fixed top-4 right-4 z-50">
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs shadow-sm bg-background/80 backdrop-blur-xs">
            <LogOut className="w-3.5 h-3.5" /> התנתקות
          </Button>
        </div>
      )}

      <div className="flex-1">
        <Home synagogueId={synagogueId} />
      </div>
    </div>
  );
}

