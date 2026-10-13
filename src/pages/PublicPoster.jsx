import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import PrayerTimesPoster from '@/components/PrayerTimesPoster';
import { Loader2 } from 'lucide-react';

export default function PublicPoster() {
  const [poster, setPoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    
    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const synagogueName = params.get('shul') || '';

        // Get the latest active poster
        const { collection, query: fbQuery, orderBy, limit, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        const q = fbQuery(collection(db, 'public_posters'), orderBy('date', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        const all = snapshot.empty ? [] : [snapshot.docs[0].data()];
        
        if (abortController.signal.aborted) return;
        
        if (all.length === 0) { 
          setNotFound(true); 
          setLoading(false); 
          return; 
        }

        const p = all[0];
        let data = {};
        try { 
          data = JSON.parse(p.poster_data || '{}'); 
        } catch (e) { 
          console.error('Failed to parse poster data:', e);
          data = {}; 
        }
        
        if (!data || Object.keys(data).length === 0) { 
          setNotFound(true); 
          setLoading(false); 
          return; 
        }
        
        if (!abortController.signal.aborted) {
          setPoster({ data, synagogueName: p.synagogue_name || synagogueName });
        }
      } catch (e) {
        console.error('Error loading poster:', e);
        if (!abortController.signal.aborted) {
          setNotFound(true);
        }
      }
      
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    };
    
    load();
    
    return () => abortController.abort();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">טוען מודעה...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <div className="text-center space-y-3">
        <p className="text-4xl">🕍</p>
        <h1 className="font-frank text-2xl font-bold text-primary">לא נמצאה מודעה</h1>
        <p className="text-muted-foreground text-sm">אין מודעה פעילה לבית כנסת זה עדיין</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 py-6 px-4 flex flex-col items-center" dir="rtl">
      <p className="text-xs text-muted-foreground mb-4">מודעה שבועית — {poster?.synagogueName}</p>
      {poster?.data && (
        <div className="w-full max-w-lg">
          <PrayerTimesPoster data={poster.data} themeId="classic" />
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground text-center">
        הופק באמצעות מחולל המודעות · <span dir="ltr">YL.AI</span>
      </p>
    </div>
  );
}