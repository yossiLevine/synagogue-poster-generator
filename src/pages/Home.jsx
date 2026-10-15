import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Megaphone, QrCode, Monitor, Globe, Sparkles, RotateCcw, CheckCircle2, AlertTriangle, Eye, EyeOff, Palette, Share2, Settings, Settings2, Printer, Bot, DoorClosed, Video, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import { capturePoster } from '@/lib/posterCapture';
import { getTodayHebrewDate, getTodayGregorianDate, getTargetPosterInfo } from '@/lib/hebrewDate';
import PrayerTimesForm from '@/components/PrayerTimesForm';
import GeneralAnnouncementForm from '@/components/GeneralAnnouncementForm';
import PrayerTimesPoster from '@/components/PrayerTimesPoster';
import GeneralPoster from '@/components/GeneralPoster';
import SynagogueEmblem from '@/components/SynagogueEmblem';
import StyleSelector from '@/components/StyleSelector';
import LogoEditor from '@/components/LogoEditor';
import HistoryPanel from '@/components/HistoryPanel';
import ShareBar from '@/components/ShareBar';
import BgImageUpload from '@/components/BgImageUpload';
import SubscriberPanel from '@/components/SubscriberPanel';
import SendPosterToSubscribers from '@/components/SendPosterToSubscribers';
import FeatureRequestForm from '@/components/FeatureRequestForm';
import SynagogueSettings from '@/components/SynagogueSettings';
import SignGeneratorModal from '@/components/SignGeneratorModal';
import GabaiChatAssistant from '@/components/GabaiChatAssistant';
import PosterActionsBar from '@/components/PosterActionsBar';
import AnimatedPosterExport from '@/components/AnimatedPosterExport';
import WhatsAppQuickShare from '@/components/WhatsAppQuickShare';

import { DraggableCanvasControls, DraggableCanvasOverlay } from '@/components/DraggableCanvas';
import FrameSelector from '@/components/FrameSelector';
import { Slider } from '@/components/ui/slider';
import { THEMES } from '@/lib/themes';
import { getConfig, loadConfig, saveConfig } from '@/lib/synagogueConfig';
import { generatePosterPayload } from '@/lib/posterEngine';
import { addToHistory } from '@/lib/templates';
import HebrewCalendarView from '@/components/HebrewCalendarView';
import ColorPaletteEditor from '@/components/ColorPaletteEditor';
import StatsPanel from '@/components/StatsPanel';
import PrintReadyPDFExport from '@/components/PrintReadyPDFExport';
import { base44 } from '@/api/base44Client';
import WorkspaceTabs from '@/components/WorkspaceTabs';
import { 
  getWorkspaces, saveWorkspaces, getActiveWorkspaceId, setActiveWorkspaceId, 
  loadWorkspaceDraft, saveWorkspaceDraft, createWorkspaceFromHoliday, 
  duplicateWorkspace, deleteWorkspace, DEFAULT_SHABBAT_WORKSPACE 
} from '@/lib/workspaceStore';

import { loadDraftFromDB, saveDraftToDB } from '@/lib/synagogueDB';

const QUICK_THEMES = [
  { id: 'royal_gold', label: 'זהב מלכותי', emoji: '⚜️' },
  { id: 'classic', label: 'קלאסי', emoji: '🏛️' },
  { id: 'emerald_prestige', label: 'אמרלד', emoji: '🌿' },
  { id: 'jerusalem', label: 'ירושלים', emoji: '🕍' },
  { id: 'minimal_prestige', label: 'מודרני נקי', emoji: '💎' },
  { id: 'antique_parchment', label: 'קלף ובורדו', emoji: '📜' },
];

export default function Home({ synagogueId = null }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [activeTab, setActiveTab] = useState('prayer'); // for inner content
  const [activeMenu, setActiveMenu] = useState('content'); // for sidebar: content, design, share, advanced, pdf
  const [synagogue, setSynagogue] = useState(null);
  const [themeId, setThemeId] = useState('classic');
  const [paperSize, setPaperSize] = useState('a4');
  const [showQR, setShowQR] = useState(false);
  const [synagogueUrl, setSynagogueUrl] = useState('');
  const [bgImage, setBgImage] = useState(null);
  const [bgOpacity, setBgOpacity] = useState(0.15);
  const [brightness, setBrightness] = useState(1);
  const [frameId, setFrameId] = useState('classic');
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasElements, setCanvasElements] = useState([]);
  const [canvasNewText, setCanvasNewText] = useState('');
  const [editorVisible, setEditorVisible] = useState(true);
  const [generateToast, setGenerateToast] = useState(null); // 'success' | 'no-rules' | null
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [selectedSignData, setSelectedSignData] = useState(null);
  const [chatAssistantOpen, setChatAssistantOpen] = useState(false);
  const [animatedModalOpen, setAnimatedModalOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const posterRef = useRef(null);

  // Multi-Poster Workspaces State
  const [workspaces, setWorkspaces] = useState(() => getWorkspaces());
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => getActiveWorkspaceId());

  // Load synagogue settings on mount
  useEffect(() => {
    loadConfig(); // warm up config cache from DB
    if (synagogueId) {
      loadSynagogueSettings();
    }
  }, [synagogueId]);

  // Load draft from DB/LS or Auto-generate for the current workspace
  useEffect(() => {
    const run = async () => {
      const cfg = await loadConfig();
      let initialData = null;

      if (activeWorkspaceId === 'shabbat_current') {
        try {
          const dbDraft = await loadDraftFromDB();
          if (dbDraft) {
            initialData = dbDraft;
            localStorage.setItem('editor_draft', JSON.stringify(dbDraft));
          } else {
            const lsDraft = localStorage.getItem('editor_draft');
            if (lsDraft) initialData = JSON.parse(lsDraft);
          }
        } catch(e) { console.warn('Draft load failed', e); }

        if (initialData) {
          const now = Date.now();
          const draftTime = initialData.lastModified || 0;
          const hoursSince = (now - draftTime) / (1000 * 60 * 60);
          // Keep drafts for up to 5 days (120 hours) so midweek preparations aren't lost
          if (draftTime > 0 && hoursSince > 120) {
            await addToHistory({ ...initialData, label: 'טיוטה אוטומטית (שבוע שעבר)' });
            initialData = null;
          }
        }
      } else {
        // Load holiday workspace draft
        initialData = loadWorkspaceDraft(activeWorkspaceId);
      }

      if (initialData) {
        setActiveHistoryItem(initialData);
        setLiveData(initialData);
        if (initialData.type) setActiveTab(initialData.type);
      } else {
        try {
          const { loadRulesAsync } = await import('@/components/RelativeZmanimConfig');
          const rules = await loadRulesAsync();
          const effectiveRules = rules.length > 0 ? rules : cfg.rules;
          const payload = await generatePosterPayload({
            rules: effectiveRules,
            displayZmanim: cfg.displayZmanim,
          });
          setLiveData(payload);
        } catch (e) {
          console.error('Auto-generate failed:', e);
        }
      }
      setIsInitializing(false);
    };
    run();
  }, [synagogueId, activeWorkspaceId]);

  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Save draft whenever liveData changes
  useEffect(() => {
    if (liveData && !isInitializing) {
      const dataWithTimestamp = { ...liveData, workspaceId: activeWorkspaceId, lastModified: Date.now() };
      
      if (activeWorkspaceId === 'shabbat_current') {
        localStorage.setItem('editor_draft', JSON.stringify(dataWithTimestamp));
        saveDraftToDB(dataWithTimestamp)
          .then(() => setLastSavedAt(new Date()))
          .catch(e => console.warn('DB draft save failed', e));
      } else {
        saveWorkspaceDraft(activeWorkspaceId, dataWithTimestamp);
        setLastSavedAt(new Date());
      }
    }
  }, [liveData, isInitializing, activeWorkspaceId]);

  // Workspace actions
  const handleSelectWorkspace = (id) => {
    if (id === activeWorkspaceId) return;
    if (liveData) {
      // Flush save current draft
      if (activeWorkspaceId === 'shabbat_current') {
        localStorage.setItem('editor_draft', JSON.stringify({ ...liveData, lastModified: Date.now() }));
      } else {
        saveWorkspaceDraft(activeWorkspaceId, liveData);
      }
    }
    setActiveWorkspaceId(id);
    setActiveWorkspaceIdState(id);
    setIsInitializing(true);
  };

  const handleCreateHolidayWorkspace = (holidayId) => {
    const res = createWorkspaceFromHoliday(holidayId);
    if (res) {
      setWorkspaces(getWorkspaces());
      setActiveWorkspaceId(res.workspace.id);
      setActiveWorkspaceIdState(res.workspace.id);
      setLiveData(res.draft);
    }
  };

  const handleDuplicateWorkspace = (id) => {
    const res = duplicateWorkspace(id);
    if (res) {
      setWorkspaces(getWorkspaces());
      setActiveWorkspaceId(res.id);
      setActiveWorkspaceIdState(res.id);
      setIsInitializing(true);
    }
  };

  const handleDeleteWorkspace = (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מרחב עבודה זה?')) return;
    const remaining = deleteWorkspace(id);
    setWorkspaces(remaining);
    const nextActive = remaining[0]?.id || 'shabbat_current';
    setActiveWorkspaceId(nextActive);
    setActiveWorkspaceIdState(nextActive);
    setIsInitializing(true);
  };

  const loadSynagogueSettings = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const synDoc = await getDoc(doc(db, 'synagogues', synagogueId));
      if (synDoc.exists()) {
        const syn = synDoc.data();
        setSynagogue(syn);
        setThemeId(syn.default_theme || 'classic');
        setFrameId(syn.default_frame || 'classic');
        
        // Load custom config from DB
        const curConfig = await loadConfig(synagogueId);
        
        // Only seed default config if synagogue has NO custom synagogue_config saved yet
        if (!syn.synagogue_config && syn.name) {
          await saveConfig({
            ...curConfig,
            synagogueName: syn.name,
            cityName: syn.city || curConfig.cityName,
            horizonName: syn.city || curConfig.horizonName
          }, synagogueId);
        }
      }
    } catch (e) {
      console.error('Error loading synagogue settings:', e);
    }
  };

  // Auto-save theme when changed (for Gabai mode)
  useEffect(() => {
    if (synagogueId) return; // Gabai saves to DB via InitialSetup
    localStorage.setItem('editorTheme', themeId);
  }, [themeId, synagogueId]);

  // Auto-save frame when changed (for Gabai mode)
  useEffect(() => {
    if (synagogueId) return; // Gabai saves to DB via InitialSetup
    localStorage.setItem('editorFrame', frameId);
  }, [frameId, synagogueId]);

  // 2026 Ergonomics: Global Keyboard Shortcuts (Ctrl+S = Generate/Save, Ctrl+P = Export PDF)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleQuickGenerate();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [liveData]);

  const addCanvasText = () => {
    if (!canvasNewText.trim()) return;
    setCanvasElements(prev => [...prev, { id: Date.now(), content: canvasNewText, x: 40, y: 40, fontSize: 22, color: '#1a2e5a', bold: true }]);
    setCanvasNewText('');
  };
  const updateCanvasEl = (id, key, value) => setCanvasElements(prev => prev.map(el => el.id === id ? { ...el, [key]: value } : el));
  const removeCanvasEl = (id) => setCanvasElements(prev => prev.filter(el => el.id !== id));

  const handlePrint = async () => {
    try {
      if (!liveData) { alert('אנא צור מודעה תחילה'); return; }
      
      // On mobile devices where the editor is active, ensure the print-area container is rendered for html2canvas
      const printArea = document.getElementById('print-area');
      const wasHidden = printArea?.closest('.hidden');
      if (wasHidden) {
        wasHidden.classList.remove('hidden');
      }

      const capture = await capturePoster(window.innerWidth < 768 ? 2 : 2.5);
      
      if (wasHidden) {
        wasHidden.classList.add('hidden');
      }

      const imgData = capture.dataUrl || capture;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      
      const imgRatio = (capture.height && capture.width) ? (capture.height / capture.width) : (297 / 210);
      let renderW = pw;
      let renderH = pw * imgRatio;
      
      if (renderH > ph) {
        renderH = ph;
        renderW = ph / imgRatio;
      }
      
      const posX = (pw - renderW) / 2;
      const posY = (ph - renderH) / 2;
      
      pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
      const cfg = getConfig();
      const parasha = liveData.parasha ? ` - פרשת ${liveData.parasha}` : '';
      const synName = cfg.synagogueName || 'בית הכנסת';
      const safe = (s) => s.replace(/[/\\?%*:|"<>]/g, '-');
      pdf.save(`${safe('זמני תפילה' + parasha)} - ${safe(synName)}.pdf`);
    } catch (e) {
      alert('שגיאה בעת יצוא PDF: ' + e.message);
      console.error(e);
    }
  };

  const trackStat = async (type, parasha) => {
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await addDoc(collection(db, 'poster_stats'), { type, parasha: parasha || '', poster_type: activeTab, date: new Date().toISOString().split('T')[0] });
    } catch (e) { 
      console.warn('Failed to track stat:', e);
    }
  };

  const handleGenerate = async (data) => {
    setLiveData(data);
    await addToHistory(data);
    trackStat('created', data.parasha);
    window.dispatchEvent(new Event('history-updated'));
    const cfg = getConfig();
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await addDoc(collection(db, 'public_posters'), {
        parasha: data.parasha || '',
        date: new Date().toISOString().split('T')[0],
        poster_data: JSON.stringify(data),
        synagogue_name: cfg.synagogueName || '',
        synagogue_id: synagogueId || '',
        logo_url: cfg.logoUrl || ''
      });
    } catch(e) {
      console.warn('Failed to save public poster', e);
    }
  };

  const handleQuickGenerate = () => {
    if (!liveData) {
      const btn = document.querySelector('[data-generate-btn]');
      if (btn) btn.click();
      return;
    }
    const hasTimes = liveData?.prayerRows?.some(r => r.time && r.time.trim());
    if (!hasTimes && liveData?.type === 'prayer') {
      setGenerateToast('no-rules');
      setTimeout(() => setGenerateToast(null), 6000);
      return;
    }
    setGenerateToast('success');
    setTimeout(() => setGenerateToast(null), 3000);
    const target = document.getElementById('print-area') || document.getElementById('mobile-poster');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePosterInlineUpdate = (partial) => {
    setLiveData(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem('editor_draft', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const renderPoster = () => {
    if (!liveData) return null;
    const props = { themeId, showQR, synagogueUrl, bgImage, bgOpacity, brightness, frameId };
    if (liveData.type === 'prayer') return <PrayerTimesPoster data={liveData} onUpdateData={handlePosterInlineUpdate} {...props} />;
    return <GeneralPoster data={liveData} {...props} />;
  };

  const menuItems = [
    { id: 'content', icon: BookOpen, label: 'עריכת תוכן' },
    { id: 'settings', icon: Settings, label: 'הגדרות בית כנסת ⚙️' },
    { id: 'kiosk', icon: Monitor, label: 'מסך בית כנסת 🖥️', action: () => setPresentationMode(true) },
    { id: 'signs', icon: DoorClosed, label: 'שלטים לדלת / קידוש 🚪', action: () => { setSelectedSignData(null); setSignModalOpen(true); } },
    { id: 'design', icon: Palette, label: 'עיצוב ומראה' },
    { id: 'share', icon: Share2, label: 'שיתוף ותפוצה' },
    { id: 'pdf', icon: Printer, label: 'הדפסה כ-PDF' },
    { id: 'advanced', icon: Settings2, label: 'כלים מתקדמים' },
  ];

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-primary" dir="rtl">
        <RotateCcw className="w-10 h-10 animate-spin mb-4" />
        <p className="font-frank text-lg font-medium">טוען טיוטה...</p>
      </div>
    );
  }

  const todayHebrew = getTodayHebrewDate();
  const todayGregorian = getTodayGregorianDate();
  const targetInfo = getTargetPosterInfo(liveData);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* 2026 Glassmorphic Header */}
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-xl sticky top-0 z-30 flex-shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { setActiveMenu('settings'); setEditorVisible(true); }}
            title="לחץ לפתיחת פרופיל והגדרות בית הכנסת"
          >
            <img
              src={getConfig().logoUrl || 'https://media.base44.com/images/public/user_68540e8149644804602ba561/cb30b9f06_2.jpg'}
              alt="לוגו"
              className="rounded-full object-cover border border-border ring-2 ring-primary/20 w-10 h-10 shadow-xs group-hover:ring-primary/50 transition-all"
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-frank text-base font-bold text-primary leading-none group-hover:underline">מחולל מודעות</p>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  עתים לבינה
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-primary transition-colors flex items-center gap-1">
                <span>{getConfig().synagogueName || synagogue?.name || 'בית הכנסת'}</span>
                <span className="text-[10px] opacity-70 underline">⚙️ הגדרות</span>
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold lg:hidden flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-amber-600 inline" />
                <span>{todayHebrew}</span>
              </p>
            </div>
          </div>

          {/* Today's Hebrew Date & Target Poster Display */}
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>היום: {todayHebrew}</span>
              <span className="text-[10px] text-muted-foreground font-normal">({todayGregorian})</span>
            </div>
            {targetInfo && (
              <>
                <div className="w-px h-4 bg-amber-500/30" />
                <div className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-300 font-semibold">
                  <span className="text-xs">🎯</span>
                  <span className="text-muted-foreground text-[11px]">המודעה ל:</span>
                  <span className="font-bold underline decoration-amber-500/40">{targetInfo.title}</span>
                  {targetInfo.hebrewDate && (
                    <span className="bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-2xs">
                      {targetInfo.hebrewDate}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSettingsModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-9 px-3 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold shadow-2xs"
              title="הגדרות בית הכנסת"
            >
              <Settings className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">הגדרות בית כנסת</span>
            </Button>
            <Button 
              onClick={() => setChatAssistantOpen(true)}
              size="sm" 
              className="gap-2 text-xs h-9 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
              title="עוזר שבת לגבאי בצ'אט מהיר"
            >
              <Bot className="w-4 h-4" />
              <span>עוזר גבאי</span>
            </Button>
            <Link to="/public" target="_blank" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 px-3 rounded-xl hover:bg-muted/80 border-border/70 font-medium">
                <Globe className="w-3.5 h-3.5 text-blue-500" /> דף ציבורי
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Multi-Draft Workspaces Toolbar (Parallel Shabbat & Holiday poster tabs) */}
      <WorkspaceTabs 
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateHolidayWorkspace={handleCreateHolidayWorkspace}
        onDuplicateWorkspace={handleDuplicateWorkspace}
        onDeleteWorkspace={handleDeleteWorkspace}
      />

      {/* Main Layout - 3 Columns on large screens */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1600px] w-full mx-auto relative pb-20 lg:pb-0">
        
        {/* RIGHT COLUMN: Modern Floating Sidebar Dock */}
        <aside className={`w-full lg:w-60 border-l border-border/80 bg-card/60 backdrop-blur-xl flex flex-col flex-shrink-0 z-10 lg:h-[calc(100vh-65px)] overflow-y-auto ${!editorVisible ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-3 flex-1 flex flex-col">
            <nav className="flex gap-1.5 overflow-x-auto lg:flex-col p-1.5 bg-muted/40 rounded-2xl border border-border/60 no-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { 
                      if (item.action) {
                        item.action();
                      } else {
                        setActiveMenu(item.id); 
                        setEditorVisible(true); 
                      }
                    }}
                    className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CENTER COLUMN: Editor Panel */}
        {editorVisible && (
          <main className="flex-1 border-l border-border/80 bg-background lg:h-[calc(100vh-65px)] overflow-y-auto pb-8">
            <div className={`${activeMenu === 'settings' ? 'max-w-3xl' : 'max-w-xl'} mx-auto p-4 sm:p-6 space-y-5 transition-all`}>
              
              {/* Generate actions always visible at the top of the editor */}
              <div className="bg-card/90 backdrop-blur-md border border-border/80 p-4 rounded-2xl shadow-sm space-y-3 sticky top-0 z-10">
                <Button 
                  onClick={handleQuickGenerate} 
                  className="w-full gap-2 h-12 text-base font-bold bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] rounded-xl"
                  title="קיצור: Ctrl+S"
                >
                  <Sparkles className="w-5 h-5 animate-pulse" /> ✨ צור מודעה 
                  <span className="text-xs opacity-75 font-mono mr-auto">⌘S</span>
                </Button>
                {liveData && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    {lastSavedAt ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> נשמר ב-{lastSavedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">טיוטה מוכנה</span>
                    )}
                    <button onClick={async () => {
                      if(!confirm('זה ימחק את הטיוטה הנוכחית ויאתחל אותה לפי לוח עתים לבינה. להמשיך?')) return;
                      try {
                        const { addToHistory } = await import('@/lib/templates');
                        await addToHistory({ ...liveData, label: 'טיוטה שנמחקה ידנית' });
                        localStorage.removeItem('editor_draft');
                        localStorage.removeItem('synagogue_smart_announcements');
                        const { deleteDraftFromDB } = await import('@/lib/synagogueDB');
                        await deleteDraftFromDB();
                      } catch(e) { console.warn('Failed to clear draft', e); }
                      window.location.reload();
                    }} className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                      <RotateCcw className="w-3 h-3" /> איפוס טיוטה
                    </button>
                  </div>
                )}
              </div>

              {/* Toasts (Fixed overlays instead of shifting content) */}
              <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {generateToast === 'success' && (
                  <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 flex items-center gap-3 bg-green-500 text-white rounded-xl px-4 py-3 shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                    <div>
                      <p className="font-bold text-sm">המודעה מוכנה! 🎉</p>
                    </div>
                  </div>
                )}
                {generateToast === 'no-rules' && (
                  <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 flex items-center gap-3 bg-amber-500 text-white rounded-xl px-4 py-3 shadow-lg">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm">לא הוגדרו זמני תפילה</p>
                      <p className="text-xs opacity-90">אנא מלא זמנים קודם.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Content based on activeMenu */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                <div className={activeMenu === 'content' ? 'block' : 'hidden'}>
                  <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                      <TabsList className="w-full grid grid-cols-2">
                         <TabsTrigger value="prayer" className="gap-2"><BookOpen className="w-4 h-4"/> זמנים</TabsTrigger>
                         <TabsTrigger value="general" className="gap-2"><Megaphone className="w-4 h-4"/> כללית</TabsTrigger>
                       </TabsList>
                       <TabsContent value="prayer" className="mt-4 space-y-4">
                        {/* Quick 1-Click Theme Switcher */}
                        <div className="bg-card/80 border border-border/80 rounded-xl p-2.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                              <Palette className="w-3.5 h-3.5 text-primary" />
                              <span>סגנון עיצוב מהיר:</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveMenu('design')}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              כל העיצובים ({THEMES ? Object.keys(THEMES).length : 12}) ←
                            </button>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {QUICK_THEMES.map(t => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setThemeId(t.id)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                                  themeId === t.id 
                                    ? 'bg-primary text-primary-foreground shadow-xs ring-1 ring-primary' 
                                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50'
                                }`}
                              >
                                <span>{t.emoji}</span>
                                <span className="truncate">{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <PrayerTimesForm 
                          onGenerate={handleGenerate} 
                          onChange={setLiveData} 
                          dataToLoad={activeHistoryItem} 
                          initialData={liveData}
                          onGenerateSign={(item) => {
                            setSelectedSignData(item);
                            setSignModalOpen(true);
                          }}
                        />
                      </TabsContent>
                      <TabsContent value="general" className="mt-4">
                        <GeneralAnnouncementForm onGenerate={handleGenerate} onChange={setLiveData} dataToLoad={activeHistoryItem} />
                      </TabsContent>
                    </Tabs>
                    <div className="mt-8">
                      <h3 className="font-bold text-lg mb-4">היסטוריית מודעות</h3>
                      <HistoryPanel onSelect={(item) => {
                        setLiveData(item);
                        setActiveHistoryItem(item);
                        if (item.type) setActiveTab(item.type);
                      }} />
                    </div>
                  </div>
                </div>

                <div className={activeMenu === 'design' ? 'block' : 'hidden'}>
                  <div className="bg-card border border-border rounded-xl p-5 space-y-6">
                    <h2 className="text-xl font-bold border-b border-border pb-2">עיצוב ומראה</h2>
                    <StyleSelector value={themeId} onChange={setThemeId} />
                    <LogoEditor />
                    <FrameSelector value={frameId} onChange={setFrameId} />
                    <BgImageUpload bgImage={bgImage} bgOpacity={bgOpacity} onImageChange={setBgImage} onOpacityChange={setBgOpacity} />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">בהירות המודעה</Label>
                        <span className="text-sm text-muted-foreground">{Math.round(brightness * 100)}%</span>
                      </div>
                      <Slider min={50} max={130} step={5} value={[Math.round(brightness * 100)]} onValueChange={([v]) => setBrightness(v / 100)} />
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-primary" />
                          <Label className="font-semibold">קוד QR</Label>
                        </div>
                        <Switch checked={showQR} onCheckedChange={setShowQR} />
                      </div>
                      {showQR && (
                        <Input value={synagogueUrl} onChange={e => setSynagogueUrl(e.target.value)} placeholder="כתובת לאתר (URL)" dir="ltr" className="text-left" />
                      )}
                    </div>
                  </div>
                </div>

                <div className={activeMenu === 'share' ? 'block' : 'hidden'}>
                  <div className="bg-card border border-border rounded-xl p-5 space-y-6">
                    <h2 className="text-xl font-bold border-b border-border pb-2">שיתוף ותפוצה</h2>
                    <ShareBar
                      paperSize={paperSize}
                      onPaperSizeChange={setPaperSize}
                      onPrint={handlePrint}
                      onShareStat={(type) => trackStat(type, liveData?.parasha)}
                      liveData={liveData}
                    />
                    <div className="mt-4 space-y-4">
                      <SubscriberPanel liveData={liveData} />
                      {liveData && <SendPosterToSubscribers liveData={liveData} />}
                    </div>
                  </div>
                </div>

                <div className={activeMenu === 'pdf' ? 'block' : 'hidden'}>
                  <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="text-xl font-bold border-b border-border pb-2 mb-4">הדפסה וייצוא מתקדם</h2>
                    <PrintReadyPDFExport liveData={liveData} currentThemeId={themeId} onThemeChange={setThemeId} />
                  </div>
                </div>

                <div className={activeMenu === 'advanced' ? 'block' : 'hidden'}>
                  <div className="bg-card border border-border rounded-xl p-5 space-y-6">
                    <h2 className="text-xl font-bold border-b border-border pb-2 mb-4">כלים מתקדמים</h2>
                    <ColorPaletteEditor onChange={() => {}} />
                    <hr className="border-border" />
                    <HebrewCalendarView onExportMonth={null} />
                    <hr className="border-border" />
                    <StatsPanel />
                    <hr className="border-border" />
                    <FeatureRequestForm />
                  </div>
                </div>

                <div className={activeMenu === 'settings' ? 'block' : 'hidden'}>
                  <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 space-y-6 shadow-xs">
                    <div className="border-b border-border pb-3">
                      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2.5">
                        <Settings className="w-6 h-6 text-primary" />
                        פרופיל והגדרות בית הכנסת
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        ניהול פרטי בית הכנסת, מיקום אופק עתים לבינה, וחוקי חישוב זמני התפילה האוטומטיים
                      </p>
                    </div>
                    <SynagogueSettings synagogueId={synagogueId} embedded={true} />
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* LEFT COLUMN: Live Preview */}
        <div className={`flex-1 bg-muted/30 relative lg:h-[calc(100vh-65px)] overflow-y-auto ${editorVisible ? 'hidden lg:block' : 'block w-full'}`}>
          <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border p-3 flex justify-between items-center z-10">
            <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" /> תצוגה מקדימה וייצוא
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setEditorVisible(!editorVisible)}>
                {editorVisible ? 'הסתר כלים' : 'חזור לעריכה'}
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6 min-h-[500px] flex flex-col items-center justify-start">
            {/* Unified Action Bar directly above the poster */}
            {liveData && (
              <PosterActionsBar 
                onPrint={handlePrint}
                onOpenPdfModal={() => setPdfModalOpen(true)}
                onOpenShareModal={() => setActiveMenu('share')}
                onOpenAnimatedStatus={() => setAnimatedModalOpen(true)}
                onToggleCanvas={() => setShowCanvas(!showCanvas)}
                isCanvasActive={showCanvas}
                themeId={themeId}
                liveData={liveData}
              />
            )}

            {liveData ? (
              <div className="shadow-2xl rounded-xl overflow-hidden bg-background w-fit max-w-full mx-auto" ref={posterRef} id="print-area">
                {showCanvas && (
                  <DraggableCanvasControls
                    elements={canvasElements}
                    setElements={setCanvasElements}
                    newText={canvasNewText}
                    setNewText={setCanvasNewText}
                    addText={addCanvasText}
                    updateEl={updateCanvasEl}
                    removeEl={removeCanvasEl}
                  />
                )}
                <div className="relative w-fit mx-auto" id="poster-wrapper">
                  {renderPoster()}
                  {showCanvas && <DraggableCanvasOverlay elements={canvasElements} setElements={setCanvasElements} />}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 w-full max-w-md text-muted-foreground border-2 border-dashed border-border rounded-xl m-auto">
                <SynagogueEmblem size="small" themeId={themeId} />
                <p className="mt-4 text-sm">מלא את הטופס כדי לראות את המודעה כאן</p>
                <Button onClick={() => handleQuickGenerate()} className="mt-4" variant="outline">
                  צור תצוגה עכשיו
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile floating toggle button */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Button 
            onClick={() => setEditorVisible(!editorVisible)} 
            className="rounded-full shadow-2xl px-6 py-6 text-base font-bold bg-primary text-primary-foreground hover:scale-105 transition-transform"
          >
            {editorVisible ? '👁️ צפה במודעה' : '✏️ חזור לעריכה'}
          </Button>
        </div>
      </div>

      {/* Companion Signs Generator Modal */}
      <SignGeneratorModal 
        isOpen={signModalOpen} 
        onClose={() => setSignModalOpen(false)} 
        initialData={selectedSignData}
        currentThemeId={themeId}
      />

      {/* Gabai Mobile/Desktop Conversational Chat Assistant */}
      <GabaiChatAssistant 
        isOpen={chatAssistantOpen} 
        onClose={() => setChatAssistantOpen(false)} 
        liveData={liveData}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={handleSelectWorkspace}
        onUpdateData={handlePosterInlineUpdate}
        onOpenSignGenerator={(signData) => {
          setSelectedSignData(signData);
          setSignModalOpen(true);
        }}
        onPrintPoster={handlePrint}
      />

      {/* Animated Poster Status Video Export Modal */}
      {animatedModalOpen && (
        <AnimatedPosterExport 
          liveData={liveData} 
          isOpen={animatedModalOpen} 
          onClose={() => setAnimatedModalOpen(false)} 
        />
      )}

      {/* Print-Ready High Quality PDF Export Dialog */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Printer className="w-5 h-5 text-primary" />
              ייצוא והדפסה מוכנה לדפוס (A4 PDF)
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <PrintReadyPDFExport 
              liveData={liveData} 
              currentThemeId={themeId} 
              onThemeChange={setThemeId} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Synagogue Settings Dialog Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl p-4 sm:p-6 max-h-[92vh] overflow-y-auto rounded-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              פרופיל והגדרות בית הכנסת
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <SynagogueSettings 
              synagogueId={synagogueId} 
              embedded={true} 
              onSuccess={() => setSettingsModalOpen(false)} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Digital Signage / Kiosk Mode */}
      {presentationMode && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-start p-4 sm:p-8 overflow-y-auto"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Escape') setPresentationMode(false); }}
        >
          <div className="fixed top-4 left-4 z-50 flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 text-white text-xs shadow-xl">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <Monitor className="w-4 h-4" /> מצב מסך בית כנסת
            </span>
            <div className="w-px h-3.5 bg-slate-700" />
            <button
              onClick={() => setPresentationMode(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs"
            >
              יציאה (Esc)
            </button>
          </div>
          <div className="w-full max-w-3xl my-auto py-6 shadow-2xl rounded-2xl">
            {renderPoster()}
          </div>
        </div>
      )}
    </div>
  );
}