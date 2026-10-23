import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import PrayerTimesPoster from '@/components/PrayerTimesPoster';
import { getNextFriday, addDays, fetchZmanimTwoDays, fetchShabbatInfo, buildZmanimForDisplay } from '@/lib/zmanimApi';
import { DEFAULT_ZMANIM } from '@/components/ZmanimSelector';
import { base44 } from '@/api/base44Client';

export default function DisplayMode() {
  const navigate = useNavigate();
  const { synagogueId: paramId } = useParams();
  const synagogueId = paramId || localStorage.getItem('synagogue_id');
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [themeId] = useState(() => new URLSearchParams(window.location.search).get('theme') || 'classic');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from published poster in DB first
        if (synagogueId) {
          try {
            const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            
            // Note: we don't have synagogue_id on public_posters right now, just synagogue_name, 
            // but we can just get the latest one for demo since this is for a specific URL.
            const q = query(collection(db, 'public_posters'), orderBy('date', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              const docData = snapshot.docs[0].data();
              if (docData.poster_data) {
                setData(JSON.parse(docData.poster_data));
                setLastUpdated(docData.date);
                return;
              }
            }
          } catch (dbErr) {
            console.warn('DisplayMode: DB fetch failed, falling back to live calculation', dbErr);
          }
        }

        // Fallback: calculate live
        const dateA = getNextFriday();
        const dateB = addDays(dateA, 1);

        const [zmanimData, shabbatData] = await Promise.all([
          fetchZmanimTwoDays(dateA, dateB),
          fetchShabbatInfo(dateA),
        ]);

        let calculatedRows = [];
        try {
          const { loadRulesAsync, calcPrayerRowsFromRules } = await import('@/components/RelativeZmanimConfig');
          const rules = await loadRulesAsync();
          calculatedRows = calcPrayerRowsFromRules(rules, zmanimData.zmanimA, zmanimData.zmanimB, shabbatData);
        } catch (ruleErr) {
          console.warn('Failed to calculate prayer rows from rules in DisplayMode:', ruleErr);
        }

        setData({
          type: 'prayer',
          parasha: shabbatData?.parasha || '',
          haftarah: shabbatData?.haftarah || '',
          prayerRows: calculatedRows,
          announcements: '',
          zmanimDisplay: buildZmanimForDisplay(zmanimData.zmanimA, shabbatData, DEFAULT_ZMANIM),
          yahrtzeits: [],
          weekdayRows: null,
          bilingualMode: false,
          weeklyQuote: '',
          showHebrewDate: true,
          hebrewDateA: zmanimData.hebrewDateA,
          hebrewDateB: zmanimData.hebrewDateB,
          labelDayA: 'שישי',
          labelDayB: 'שבת',
          isYomTov: false,
          isRoshChodesh: shabbatData?.isRoshChodesh || false,
          showRoshChodesh: false,
          specialShabbat: shabbatData?.specialShabbat || '',
          molad: shabbatData?.molad || '',
        });
        setLastUpdated(new Date().toISOString());
      } catch (e) {
        console.error('Error loading display data:', e);
        setData(null);
      }
    };

    loadData();

    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [synagogueId]);

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white text-2xl font-frank">
        טוען זמנים...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0a0a0a' }}>
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <ArrowRight className="w-4 h-4" />
          חזור לעריכה
        </Button>
      </div>
      <div className="w-full max-w-2xl" style={{ fontSize: 'clamp(14px, 2.5vmin, 22px)' }}>
        <PrayerTimesPoster data={data} themeId={themeId} />
      </div>
      {lastUpdated && (
        <div className="fixed bottom-2 left-2 text-xs text-white/50 bg-black/30 px-2 py-1 rounded">
          עודכן: {new Date(lastUpdated).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })}
        </div>
      )}
    </div>
  );
}