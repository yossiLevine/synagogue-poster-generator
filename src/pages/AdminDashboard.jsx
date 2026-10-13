import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, Building2, Trash2, RotateCcw, Edit, Settings as SettingsIcon, LayoutGrid } from 'lucide-react';
import SynagogueForm from '@/components/SynagogueForm';
import CreateGabaiForm from '@/components/CreateGabaiForm';
import SynagogueSettings from '@/components/SynagogueSettings';
import AdminStats from '@/components/AdminStats';
import AdminFeatureRequests from '@/components/AdminFeatureRequests';
import AdminInvitePanel from '@/components/AdminInvitePanel';
import { useAuth } from '@/lib/AuthContext';
import { clearConfigCache } from '@/lib/synagogueConfig';
import { clearSynagogueCache } from '@/lib/synagogueDB';

export default function AdminDashboard() {
  const { navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [synagogues, setSynagogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSynagogueForm, setShowSynagogueForm] = useState(false);
  const [showGabaiForm, setShowGabaiForm] = useState(false);
  const [selectedSynagogue, setSelectedSynagogue] = useState(null);
  const [editingSynagogue, setEditingSynagogue] = useState(null);
  const [accounts, setAccounts] = useState({});
  const [resetting, setResetting] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { onAuthStateChanged } = await import('firebase/auth');
        const { auth } = await import('@/lib/firebase');
        
        onAuthStateChanged(auth, (firebaseUser) => {
          if (!firebaseUser) {
            navigateToLogin();
            return;
          }
          setUser(firebaseUser);
          loadSynagogues();
        });
      } catch (e) {
        console.error('Auth error:', e);
        navigateToLogin();
      }
    };
    checkAuth();
  }, [navigateToLogin]);

  const loadSynagogues = async () => {
    try {
      const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Load global default synagogue setting
      let defaultSynId = null;
      try {
        const settingsSnap = await getDoc(doc(db, 'system_settings', 'landing_page'));
        if (settingsSnap.exists()) {
          defaultSynId = settingsSnap.data()?.defaultSynagogueId;
        }
      } catch (err) {
        console.warn('Failed to load landing_page setting:', err);
      }

      const querySnapshot = await getDocs(collection(db, 'synagogues'));
      const data = querySnapshot.docs.map(d => {
        const synData = d.data();
        const isDefault = defaultSynId 
          ? d.id === defaultSynId 
          : (synData.name?.includes('עבדו') || synData.city?.includes('עבדו') || false);
        return { id: d.id, ...synData, isDefaultLanding: isDefault };
      });
      setSynagogues(data);
      await loadAccounts();
    } catch (e) {
      console.error('Error loading synagogues:', e);
    }
    setLoading(false);
  };

  const handleSetDefaultLanding = async (syn) => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await setDoc(doc(db, 'system_settings', 'landing_page'), {
        defaultSynagogueId: syn.id,
        defaultSynagogueName: syn.name,
        defaultCity: syn.city || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update local state immediately
      setSynagogues(prev => prev.map(s => ({
        ...s,
        isDefaultLanding: s.id === syn.id
      })));
      alert(`הוגדר בהצלחה! ${syn.name} יוצג כעת כברירת מחדל בעמוד הראשי.`);
    } catch (err) {
      console.error('Error setting default synagogue:', err);
      alert('שגיאה בשמירת ברירת המחדל: ' + (err.message || 'נסה שוב'));
    }
  };

  const loadAccounts = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const querySnapshot = await getDocs(collection(db, 'gabais'));
      const allAccounts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const grouped = {};
      allAccounts.forEach(acc => {
        if (!grouped[acc.synagogue_id]) grouped[acc.synagogue_id] = [];
        grouped[acc.synagogue_id].push(acc);
      });
      setAccounts(grouped);
    } catch (e) {
      console.error('Error loading accounts:', e);
    }
  };

  const handleDeleteSynagogue = async (id) => {
   if (!confirm('האם אתה בטוח?')) return;
   try {
     const { doc, deleteDoc } = await import('firebase/firestore');
     const { db } = await import('@/lib/firebase');
     await deleteDoc(doc(db, 'synagogues', id));
     loadSynagogues();
   } catch (e) {
     alert('שגיאה במחיקה: ' + (e.message || 'אנא נסה שוב'));
   }
  };

  const handleResetAccount = async (accountId) => {
    alert('איפוס סיסמה למשתמש טרם נתמך במעבר ל-Firebase - אנא שנה ב-Firebase Console.');
  };

  const handleEditAsGabai = (synagogueId) => {
    try {
      clearSynagogueCache();
      clearConfigCache();
      localStorage.setItem('synagogue_id', synagogueId);
      localStorage.setItem('is_admin_mode', 'true');
      localStorage.setItem('admin_editing_syn_id', synagogueId);
      navigate('/editor');
    } catch (e) {
      console.error('Error opening editor:', e);
      alert('שגיאה בפתיחת העורך');
    }
  };

  const handleSynagogueCreated = () => {
    setShowSynagogueForm(false);
    loadSynagogues();
  };

  const handleGabaiCreated = () => {
    setShowGabaiForm(false);
    setSelectedSynagogue(null);
    loadSynagogues();
  };

  if (loading) return <div className="flex items-center justify-center h-screen">טוען...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card sticky top-0 z-10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold">🔐 דאשבורד אדמין</h1>
          <Button variant="outline" size="sm" onClick={async () => {
            const { signOut } = await import('firebase/auth');
            const { auth } = await import('@/lib/firebase');
            await signOut(auth);
            window.location.href = '/login';
          }}>
            התנתקות
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="synagogues" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="synagogues" className="flex-1 gap-1 text-xs sm:text-sm px-1 sm:px-3">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" /> <span className="hidden sm:inline">בתי כנסת</span><span className="sm:hidden">כנסת</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex-1 text-xs sm:text-sm px-1 sm:px-3">
              💡 <span className="hidden sm:inline">פיצ'רים</span><span className="sm:hidden">פיצ'</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 text-xs sm:text-sm px-1 sm:px-3">
              📊 <span className="hidden sm:inline">סטטיסטיקות</span><span className="sm:hidden">סטטס</span>
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex-1 gap-1 text-xs sm:text-sm px-1 sm:px-3">
              <Users className="w-3.5 h-3.5 flex-shrink-0" /> <span className="hidden sm:inline">אדמינים</span><span className="sm:hidden">אדמין</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="synagogues" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setShowSynagogueForm(!showSynagogueForm)} className="gap-2">
                <Plus className="w-4 h-4" /> בית כנסת חדש
              </Button>
              <Button variant="outline" onClick={() => navigate('/united-poster')} className="gap-2">
                <LayoutGrid className="w-4 h-4" /> 📋 צור מודעה מאוחדת
              </Button>
            </div>

            {showSynagogueForm && (
              <div className="bg-card rounded-xl border border-border p-6">
                <SynagogueForm onSuccess={handleSynagogueCreated} />
              </div>
            )}

            <div className="grid gap-4">
               {synagogues.map(syn => (
                 <div key={syn.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                   <div className="flex items-start justify-between gap-2">
                     <button
                       onClick={() => setEditingSynagogue(syn)}
                       className="text-right hover:opacity-80 transition-opacity flex-1 min-w-0"
                     >
                       <h3 className="font-bold text-base sm:text-lg truncate">{syn.name}</h3>
                       <p className="text-sm text-muted-foreground">{syn.city}</p>
                     </button>
                      <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0 items-center">
                        {syn.isDefaultLanding ? (
                          <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1">
                            ⭐ מודעת ברירת מחדל
                          </span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultLanding(syn)}
                            className="text-xs text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 gap-1"
                            title="קבע כמודעה שתוצג כברירת מחדל בעמוד הראשי"
                          >
                            ⭐ קבע כברירת מחדל
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleEditAsGabai(syn.id)}
                          className="gap-1 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5" /> <span className="hidden sm:inline">ערוך כגבאי</span><span className="sm:hidden">ערוך</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSynagogue(syn);
                            setShowGabaiForm(true);
                          }}
                          className="text-xs"
                        >
                          + גבאי
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSynagogue(syn.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                   </div>

                   {/* Gabai accounts */}
                   {accounts[syn.id]?.length > 0 && (
                     <div className="border-t border-border pt-3 space-y-2">
                       <p className="text-xs font-semibold text-muted-foreground">גבאים:</p>
                       {accounts[syn.id].map(acc => (
                         <div key={acc.id} className="flex items-center justify-between bg-muted/30 rounded px-3 py-2 text-sm">
                           <div>
                             <p className="font-semibold">{acc.username}</p>
                             {acc.email && <p className="text-xs text-muted-foreground">{acc.email}</p>}
                           </div>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleResetAccount(acc.id)}
                             disabled={resetting === acc.id}
                             className="gap-1.5 text-xs"
                           >
                             <RotateCcw className="w-3 h-3" /> איפוס
                           </Button>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               ))}
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <AdminFeatureRequests />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <AdminStats />
          </TabsContent>

          <TabsContent value="admins">
            <AdminInvitePanel />
          </TabsContent>
        </Tabs>
      </div>

      {showGabaiForm && selectedSynagogue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">הוסף גבאי: {selectedSynagogue.name}</h2>
            <CreateGabaiForm synagogueId={selectedSynagogue.id} onSuccess={handleGabaiCreated} onCancel={() => setShowGabaiForm(false)} />
          </div>
        </div>
      )}

      {editingSynagogue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <h2 className="text-xl font-bold">עריכת בית כנסת: {editingSynagogue.name}</h2>
              <button onClick={() => setEditingSynagogue(null)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="p-6">
              <SynagogueSettings 
                synagogueId={editingSynagogue.id} 
                onSuccess={() => {
                  setEditingSynagogue(null);
                  loadSynagogues();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}