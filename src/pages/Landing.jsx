import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, Star, Clock, Sparkles, Shield, Search, 
  Building2, MapPin, ExternalLink, Printer, Check, Eye
} from 'lucide-react';
import PrayerTimesPoster from '@/components/PrayerTimesPoster';
import { THEMES } from '@/lib/themes';

const FEATURES = [
  { icon: Clock, text: 'חישוב אוטומטי של זמני תפילה' },
  { icon: Star, text: 'עיצובים מקצועיים ומותאמים' },
  { icon: Sparkles, text: 'שיתוף ישיר לווטסאפ ומייל' },
  { icon: Shield, text: 'גיבוי ענן לכל בית כנסת' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const longPressTimer = useState(null);

  // Search & Synagogues state
  const [synagogues, setSynagogues] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSynagogue, setSelectedSynagogue] = useState(null);
  const [posterData, setPosterData] = useState(null);
  const [loadingPoster, setLoadingPoster] = useState(true);
  const [defaultSetting, setDefaultSetting] = useState(null);

  const handleSecretTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setTapCount(0);
      navigate('/admin');
    } else {
      setTimeout(() => setTapCount(0), 2000);
    }
  };

  const handleTouchStart = () => {
    longPressTimer[1](setTimeout(() => navigate('/admin'), 1500));
  };

  const handleTouchEnd = () => {
    if (longPressTimer[0]) {
      clearTimeout(longPressTimer[0]);
      longPressTimer[1](null);
    }
  };

  // Load Synagogues & Default Settings from Firestore
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        // 1. Get system default setting
        let defaultSynId = null;
        let defaultSynName = null;
        try {
          const snap = await getDoc(doc(db, 'system_settings', 'landing_page'));
          if (snap.exists()) {
            const val = snap.data();
            setDefaultSetting(val);
            defaultSynId = val?.defaultSynagogueId;
            defaultSynName = val?.defaultSynagogueName;
          }
        } catch (e) {
          console.warn('Could not load landing_page setting', e);
        }

        // 2. Load all synagogues
        const synSnap = await getDocs(collection(db, 'synagogues'));
        const synList = synSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSynagogues(synList);

        // 3. Determine initial synagogue to display
        let initialSyn = null;
        if (defaultSynId) {
          initialSyn = synList.find(s => s.id === defaultSynId);
        }
        if (!initialSyn && defaultSynName) {
          initialSyn = synList.find(s => s.name?.includes(defaultSynName));
        }
        // If still not found, search for 'עבדו' as requested
        if (!initialSyn) {
          initialSyn = synList.find(s => s.name?.includes('עבדו') || s.city?.includes('עבדו'));
        }
        // Fallback to first synagogue
        if (!initialSyn && synList.length > 0) {
          initialSyn = synList[0];
        }

        if (initialSyn) {
          setSelectedSynagogue(initialSyn);
          await loadPosterForSynagogue(initialSyn);
        } else {
          setLoadingPoster(false);
        }
      } catch (err) {
        console.error('Error loading landing data:', err);
        setLoadingPoster(false);
      }
    };

    loadInitialData();
  }, []);

  // Helper to extract Gabai's customized synagogue name from synagogue_config
  const getSynagogueDisplayName = (syn) => {
    if (!syn) return '';
    if (syn.synagogue_config) {
      try {
        const cfg = typeof syn.synagogue_config === 'string' ? JSON.parse(syn.synagogue_config) : syn.synagogue_config;
        if (cfg?.synagogueName) return cfg.synagogueName;
      } catch (e) {
        // ignore
      }
    }
    return syn.name || '';
  };

  // Fetch poster for a chosen synagogue
  const loadPosterForSynagogue = async (syn) => {
    setLoadingPoster(true);
    try {
      const { collection, query: fbQuery, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      let foundData = null;
      const customName = getSynagogueDisplayName(syn);

      // Try searching public_posters by synagogue_id first
      if (syn.id) {
        try {
          const q = fbQuery(
            collection(db, 'public_posters'),
            where('synagogue_id', '==', syn.id),
            orderBy('date', 'desc'),
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const row = snap.docs[0].data();
            if (row.poster_data) foundData = JSON.parse(row.poster_data);
          }
        } catch (err) {
          // ignore index errors, fallback below
        }
      }

      // Try searching public_posters by synagogue_name if not found yet
      if (!foundData) {
        try {
          const qFallback = fbQuery(collection(db, 'public_posters'), orderBy('date', 'desc'), limit(25));
          const snap = await getDocs(qFallback);
          for (const doc of snap.docs) {
            const row = doc.data();
            if (
              (row.synagogue_id && row.synagogue_id === syn.id) ||
              (row.synagogue_name && (row.synagogue_name === syn.name || row.synagogue_name === customName))
            ) {
              if (row.poster_data) {
                foundData = JSON.parse(row.poster_data);
                break;
              }
            }
          }
        } catch (err) {
          console.warn('Fallback public_posters search:', err);
        }
      }

      // If still no poster published in DB, generate a live dynamic preview for this synagogue
      if (!foundData) {
        const { getNextFriday, addDays, fetchZmanimTwoDays, fetchShabbatInfo, buildZmanimForDisplay } = await import('@/lib/zmanimApi');
        const { DEFAULT_ZMANIM } = await import('@/components/ZmanimSelector');

        const dateA = getNextFriday();
        const dateB = addDays(dateA, 1);
        const [zmanimData, shabbatData] = await Promise.all([
          fetchZmanimTwoDays(dateA, dateB),
          fetchShabbatInfo(dateA),
        ]);

        foundData = {
          type: 'prayer',
          parasha: shabbatData?.parasha || 'פרשת השבוע',
          haftarah: shabbatData?.haftarah || '',
          prayerRows: [
            { label: 'הדלקת נרות', time: zmanimData.zmanimA?.candleLighting || '18:15', visible: true, isNote: true },
            { label: 'מנחה ערב שבת', time: '18:25', visible: true },
            { label: 'קבלת שבת', time: '18:45', visible: true },
            { label: 'שחרית מניין ראשון', time: '06:45', visible: true },
            { label: 'שחרית מניין מרכזי', time: '08:30', visible: true },
            { label: 'מנחה שבת קודש', time: '18:10', visible: true },
            { label: 'צאת שבת והבדלה', time: zmanimData.zmanimB?.tzeit7083deg || '19:22', visible: true, isNote: true },
          ],
          announcements: '',
          structuredAnnouncements: [
            { id: 'ann_kid', icon: '🍷', title: 'קידושא רבא', content: 'השבת יתקיים קידוש רבא בבית הכנסת לכלל המתפללים והאורחים.', active: true },
            { id: 'ann_shiur', icon: '📖', title: 'שיעור בהלכה', content: 'שיעור מפי רב בית הכנסת שליט"א בין מנחה למעריב.', active: true },
          ],
          announcementsSectionTitle: 'הודעות ואירועי השבת',
          zmanimDisplay: buildZmanimForDisplay(zmanimData.zmanimA, shabbatData, DEFAULT_ZMANIM),
          yahrtzeits: [],
          weekdayRows: null,
          bilingualMode: false,
          weeklyQuote: '״שבת שלום ומבורך לכל בית ישראל״',
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
        };
      }

      setPosterData(foundData);
    } catch (e) {
      console.error('Error loading poster for syn:', e);
    } finally {
      setLoadingPoster(false);
    }
  };

  const handleSelectSynagogue = (syn) => {
    setSelectedSynagogue(syn);
    loadPosterForSynagogue(syn);
  };

  // Distinct cities list
  const cities = useMemo(() => {
    const list = synagogues.map(s => s.city).filter(Boolean);
    return ['all', ...Array.from(new Set(list))];
  }, [synagogues]);

  // Filtered synagogues by query & city
  const filteredSynagogues = useMemo(() => {
    return synagogues.filter(syn => {
      const matchCity = selectedCity === 'all' || syn.city === selectedCity;
      const q = searchQuery.trim().toLowerCase();
      const customName = getSynagogueDisplayName(syn);
      const matchQuery = !q || 
        (syn.name && syn.name.toLowerCase().includes(q)) || 
        (customName && customName.toLowerCase().includes(q)) || 
        (syn.city && syn.city.toLowerCase().includes(q));
      return matchCity && matchQuery;
    });
  }, [synagogues, searchQuery, selectedCity]);

  return (
    <div className="min-h-screen bg-[#0f1724] text-white flex flex-col justify-between" dir="rtl">
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#c9a96e]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#1e3a5f]/60 blur-[100px]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-[#c9a96e]/5 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col justify-between">
        
        {/* Top bar with Navigation */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c9a96e] to-[#8a6b32] flex items-center justify-center text-xl shadow-lg">
              🕍
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">מחולל המודעות</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a96e]/20 text-[#c9a96e] font-semibold border border-[#c9a96e]/30">
                  גרסת 2026
                </span>
              </div>
              <p className="text-xs text-white/50">מערכת חכמה לניהול והפקת מודעות לבתי כנסת וקהילות</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => navigate('/public')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#c9a96e]" />
              <span>תצוגה ציבורית</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              onMouseEnter={() => setHoveredBtn('gabai')}
              onMouseLeave={() => setHoveredBtn(null)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all bg-gradient-to-l from-[#c9a96e] to-[#e8cc8f] text-[#0f1724] hover:shadow-[0_0_25px_rgba(201,169,110,0.4)] active:scale-95"
            >
              <span>כניסת גבאי / עורך</span>
              <ChevronLeft className={`w-4 h-4 transition-transform ${hoveredBtn === 'gabai' ? '-translate-x-0.5' : ''}`} />
            </button>
          </div>
        </header>

        {/* Main Grid: Left is Search & Discover, Right is Live Poster Preview */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-start">
          
          {/* Left Column: Search by Synagogue & City (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Title & subtitle */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                <span className="text-white">חיפוש מודעת</span>{' '}
                <span className="bg-gradient-to-l from-[#c9a96e] to-[#e8cc8f] bg-clip-text text-transparent">
                  בית כנסת
                </span>
              </h1>
              <p className="text-sm text-white/60 leading-relaxed">
                אתרו מודעות שבת וזמני תפילה לפי שם בית הכנסת או שם הישוב. המודעה מוכנה לצפייה, הדפסה ושיתוף.
              </p>
            </div>

            {/* Search Box & City Filter */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md">
              <div className="relative">
                <Search className="w-4 h-4 text-[#c9a96e] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="הקלד שם בית כנסת או ישוב..."
                  className="w-full bg-[#131c2e] border border-white/15 focus:border-[#c9a96e] rounded-xl pr-10 pl-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#c9a96e] transition-all"
                  dir="rtl"
                />
              </div>

              {/* City chips */}
              {cities.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-white/40 text-[11px] whitespace-nowrap ml-1">ישוב:</span>
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                        selectedCity === city
                          ? 'bg-[#c9a96e] text-[#0f1724] font-bold shadow-xs'
                          : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {city === 'all' ? 'הכל' : city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Synagogue Results List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/50 px-1">
                <span>נמצאו {filteredSynagogues.length} בתי כנסת:</span>
                {selectedSynagogue && (
                  <span className="text-[#c9a96e] font-semibold">
                    נבחר: {selectedSynagogue.name}
                  </span>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredSynagogues.length > 0 ? (
                  filteredSynagogues.map((syn) => {
                    const isSelected = selectedSynagogue?.id === syn.id;
                    const isDefault = defaultSetting?.defaultSynagogueId === syn.id || 
                                     syn.name?.includes('עבדו') || 
                                     syn.city?.includes('עבדו');

                    return (
                      <div
                        key={syn.id}
                        onClick={() => handleSelectSynagogue(syn)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-gradient-to-l from-[#c9a96e]/20 to-white/5 border-[#c9a96e] shadow-lg scale-[1.01]'
                            : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                            isSelected ? 'bg-[#c9a96e] text-[#0f1724]' : 'bg-white/10 text-white/70'
                          }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-white truncate">{getSynagogueDisplayName(syn) || syn.name}</h3>
                              {isDefault && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                                  ברירת מחדל
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-white/50 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#c9a96e]" />
                              <span>{syn.city || 'ללא עיר'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                            isSelected 
                              ? 'bg-[#c9a96e] text-[#0f1724]' 
                              : 'text-white/40 group-hover:text-white'
                          }`}>
                            {isSelected ? '✓ מוצג' : 'הצג מודעה ←'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 rounded-xl border border-dashed border-white/10 text-white/40 text-xs">
                    לא נמצאו בתי כנסת התואמים את החיפוש "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions for Selected Synagogue */}
            {selectedSynagogue && (
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    localStorage.setItem('synagogue_id', selectedSynagogue.id);
                    navigate('/editor');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#c9a96e]" />
                  <span>ערוך מודעה כגבאי</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
                  title="הדפסת המודעה המוצגת"
                >
                  <Printer className="w-3.5 h-3.5 text-[#c9a96e]" />
                  <span>הדפסה</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Live Poster Display (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* Header info badge */}
            <div className="w-full max-w-md flex items-center justify-between mb-3 text-xs text-white/60 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>מודעה חיה — {getSynagogueDisplayName(selectedSynagogue) || selectedSynagogue?.name || 'טוען...'}</span>
              </span>
              <span className="text-white/40">{selectedSynagogue?.city}</span>
            </div>

            {/* Poster Card Wrapper */}
            <div className="w-full max-w-md bg-card/90 rounded-3xl p-2 sm:p-3 shadow-2xl border border-white/10 relative">
              {loadingPoster ? (
                <div className="h-[550px] flex flex-col items-center justify-center gap-3 text-white/50 text-sm">
                  <div className="w-8 h-8 border-3 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
                  <span>טוען מודעת שבת...</span>
                </div>
              ) : posterData ? (
                <div className="overflow-hidden rounded-2xl">
                  <PrayerTimesPoster 
                    data={posterData} 
                    themeId="classic"
                    overrideSynagogueName={posterData?.synagogueName || getSynagogueDisplayName(selectedSynagogue)}
                  />
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 text-white/50 space-y-2">
                  <p className="text-3xl">🕍</p>
                  <p className="text-sm font-semibold">לא נמצאה מודעה שמורה</p>
                  <p className="text-xs text-white/40">בחר בית כנסת אחר מהרשימה או היכנס כגבאי לעריכה</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p
            className="cursor-pointer hover:text-white/70 select-none transition-colors"
            onClick={handleSecretTap}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            © YL.AI — פתרונות AI מתקדמים לעסקים ומוסדות
          </p>
          <div className="flex items-center gap-4">
            <span>מוקד תמיכה: <span dir="ltr">050-733-3117</span></span>
            <button 
              onClick={() => navigate('/admin')} 
              className="text-[#c9a96e]/70 hover:text-[#c9a96e] transition-colors"
            >
              ניהול מערכת
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}