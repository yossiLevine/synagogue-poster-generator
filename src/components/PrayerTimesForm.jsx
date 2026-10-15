import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, Clock, Save, Copy, FolderOpen, GripVertical, AlertCircle, X, ChevronDown, RotateCcw, Camera, Check, Settings, Undo2, Redo2, Sliders } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchZmanim, fetchShabbatInfo, buildZmanimForDisplay, fetchZmanimTwoDays, getNextFriday, addDays, resolveZmanIso, formatTime, ZMANIM_META } from '@/lib/zmanimApi';
import { saveTemplate, loadTemplates, deleteTemplate } from '@/lib/templates';
import ZmanimSelector, { DEFAULT_ZMANIM, loadSavedZmanim, loadZmanim, loadSavedOverrides, loadZmanimOverrides } from './ZmanimSelector';
import RelativeZmanimConfig, { loadRules, loadRulesAsync, calcPrayerRowsFromRules } from './RelativeZmanimConfig';
import { DEFAULT_RULES, loadSynagogueDefaultPrayers, saveSynagogueDefaultPrayers } from '@/lib/synagogueConfig';
import YahrtzeitPanel from './YahrtzeitPanel';
import WeekdayTimesSection from './WeekdayTimesSection';
import HalachaCalculator from './HalachaCalculator';
import PresetTemplates from './PresetTemplates';
import TorahInsightButton from './TorahInsightButton';
import SmartAnnouncementsManager from './SmartAnnouncementsManager';
import { Switch } from "@/components/ui/switch";
import { detectHolidayContext, HOLIDAY_PRESETS } from '@/lib/holidayEngine';
import PosterImageImporterModal from './PosterImageImporterModal';

const DEFAULT_PRAYER_ROWS = [
  { id: 'r1', label: 'מנחה ערב שבת', time: '', visible: true },
  { id: 'r2', label: 'קבלת שבת',     time: '', visible: true },
  { id: 'r3', label: 'מעריב',        time: '', visible: true },
  { id: 'r4', label: 'שחרית',        time: '', visible: true },
  { id: 'r5', label: 'מנחה',         time: '', visible: true },
  { id: 'r6', label: 'אבות ובנים',   time: '', visible: true },
  { id: 'r7', label: 'מעריב מוצ"ש', time: '', visible: true },
];

let rowCounter = parseInt(localStorage.getItem('rowCounter') || '100');

export default function PrayerTimesForm({ onGenerate, onChange, dataToLoad, initialData, onGenerateSign }) {
  const hasValidTimes = initialData?.prayerRows?.some(r => r.time && r.time.trim() !== '');
  const [parasha, setParasha] = useState(initialData?.parasha || '');
  const [prayerRows, setPrayerRows] = useState(hasValidTimes ? initialData.prayerRows : DEFAULT_PRAYER_ROWS);
  const [announcements, setAnnouncements] = useState(initialData?.announcements || '');
  const [structuredAnnouncements, setStructuredAnnouncements] = useState(initialData?.structuredAnnouncements || []);
  const [announcementsSectionTitle, setAnnouncementsSectionTitle] = useState(initialData?.announcementsSectionTitle || 'הודעות ואירועי השבת');
  const [selectedDate, setSelectedDate] = useState('');

  // Holiday Mode & Smart Badges states
  const [isHolidayMode, setIsHolidayMode] = useState(initialData?.isHolidayMode || false);
  const [holidayName, setHolidayName] = useState(initialData?.holidayName || '');
  const [combineWithShabbat, setCombineWithShabbat] = useState(initialData?.combineWithShabbat !== undefined ? initialData.combineWithShabbat : true);
  const [showEruvTavshilin, setShowEruvTavshilin] = useState(initialData?.showEruvTavshilin !== undefined ? initialData.showEruvTavshilin : false);
  const [eruvTavshilinText, setEruvTavshilinText] = useState(initialData?.eruvTavshilinText || 'תזכורת: נא להניח עירוב תבשילין בערב החג');
  const [showYizkorBadge, setShowYizkorBadge] = useState(initialData?.showYizkorBadge !== undefined ? initialData.showYizkorBadge : false);
  const [yizkorBadgeText, setYizkorBadgeText] = useState(initialData?.yizkorBadgeText || 'סדר תפילת יזכור והזכרת נשמות יתקיים בשחרית');
  const [showZmanimOnPoster, setShowZmanimOnPoster] = useState(initialData?.showZmanimOnPoster !== undefined ? initialData.showZmanimOnPoster : false);
  const [defaultSavedBadge, setDefaultSavedBadge] = useState(false);
  const [holidayNotice, setHolidayNotice] = useState(null);
  const [isTwoDay, setIsTwoDay] = useState(initialData?.isTwoDay || false);
  const [imageImporterOpen, setImageImporterOpen] = useState(false);
  
  // Sync incoming external updates (Chat Assistant, workspace switch, inline edits)
  useEffect(() => {
    if (initialData && initialData.type === 'prayer') {
      if (initialData.parasha !== undefined && initialData.parasha !== parasha) setParasha(initialData.parasha);
      if (initialData.showZmanimOnPoster !== undefined) setShowZmanimOnPoster(initialData.showZmanimOnPoster);
      if (initialData.prayerRows && JSON.stringify(initialData.prayerRows) !== JSON.stringify(prayerRows.filter(r => r.visible))) {
        setPrayerRows(initialData.prayerRows);
      }
      if (initialData.structuredAnnouncements && JSON.stringify(initialData.structuredAnnouncements) !== JSON.stringify(structuredAnnouncements)) {
        setStructuredAnnouncements(initialData.structuredAnnouncements);
      }
      if (initialData.announcements !== undefined && initialData.announcements !== announcements) setAnnouncements(initialData.announcements);
      if (initialData.announcementsSectionTitle !== undefined) setAnnouncementsSectionTitle(initialData.announcementsSectionTitle);
      if (initialData.weeklyQuote !== undefined && initialData.weeklyQuote !== weeklyQuote) setWeeklyQuote(initialData.weeklyQuote);
      if (initialData.isTwoDay !== undefined) setIsTwoDay(initialData.isTwoDay);
      if (initialData.isHolidayMode !== undefined) setIsHolidayMode(initialData.isHolidayMode);
      if (initialData.holidayName !== undefined) setHolidayName(initialData.holidayName);
      if (initialData.combineWithShabbat !== undefined) setCombineWithShabbat(initialData.combineWithShabbat);
      if (initialData.showEruvTavshilin !== undefined) setShowEruvTavshilin(initialData.showEruvTavshilin);
      if (initialData.showYizkorBadge !== undefined) setShowYizkorBadge(initialData.showYizkorBadge);
    }
  }, [initialData?.lastModified, initialData?.workspaceId]);

  useEffect(() => {
    if (dataToLoad && dataToLoad.type === 'prayer') {
      if (dataToLoad.showZmanimOnPoster !== undefined) setShowZmanimOnPoster(dataToLoad.showZmanimOnPoster);
      if (dataToLoad.parasha !== undefined) setParasha(dataToLoad.parasha);
      if (dataToLoad.announcements !== undefined) setAnnouncements(dataToLoad.announcements);
      if (dataToLoad.structuredAnnouncements !== undefined) setStructuredAnnouncements(dataToLoad.structuredAnnouncements);
      if (dataToLoad.announcementsSectionTitle !== undefined) setAnnouncementsSectionTitle(dataToLoad.announcementsSectionTitle);
      if (dataToLoad.prayerRows) {
        const combined = [...(dataToLoad.prayerRows || []), ...(dataToLoad.hiddenRows || [])];
        const dataHasTimes = combined.some(r => r.time && r.time.trim() !== '');
        if (dataHasTimes && combined.length > 0) setPrayerRows(combined);
      }
      if (dataToLoad.haftarah !== undefined) {
        setHaftarah(dataToLoad.haftarah);
        setShowHaftarah(!!dataToLoad.haftarah);
      }
      if (dataToLoad.yahrtzeits) setYahrtzeits(dataToLoad.yahrtzeits);
      if (dataToLoad.weekdayRows) setWeekdayRows(dataToLoad.weekdayRows);
      if (dataToLoad.bilingualMode !== undefined) setBilingualMode(dataToLoad.bilingualMode);
      if (dataToLoad.weeklyQuote !== undefined) setWeeklyQuote(dataToLoad.weeklyQuote);
      if (dataToLoad.molad !== undefined) setMolad(dataToLoad.molad);
      if (dataToLoad.isYomTov !== undefined) setIsYomTov(dataToLoad.isYomTov);
      if (dataToLoad.showHebrewDate !== undefined) setShowHebrewDate(dataToLoad.showHebrewDate);
      if (dataToLoad.labelDayA !== undefined) setLabelDayA(dataToLoad.labelDayA);
      if (dataToLoad.labelDayB !== undefined) setLabelDayB(dataToLoad.labelDayB);
      if (dataToLoad.showRoshChodesh !== undefined) setShowRoshChodesh(dataToLoad.showRoshChodesh);
      if (dataToLoad.showSpecialShabbat !== undefined) setShowSpecialShabbat(dataToLoad.showSpecialShabbat);
    }
  }, [dataToLoad]);
  const [zmanimLoading, setZmanimLoading] = useState(true);
  const [zmanim, setZmanim] = useState(null);
  const [shabbatInfo, setShabbatInfo] = useState(null);
  const [selectedZmanim, setSelectedZmanim] = useState(() => loadSavedZmanim());
  const [zmanimOverrides, setZmanimOverrides] = useState(() => loadSavedOverrides());
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState({});
  const [showZmanimSelector, setShowZmanimSelector] = useState(false);
  const [haftarah, setHaftarah] = useState(initialData?.haftarah || '');
  const [showHaftarah, setShowHaftarah] = useState(initialData?.showHaftarah !== undefined ? initialData.showHaftarah : true);
  const [yahrtzeits, setYahrtzeits] = useState(initialData?.yahrtzeits || []);
  const [weekdayRows, setWeekdayRows] = useState(initialData?.weekdayRows || [
    { label: 'שחרית א-ה', time: '' },
    { label: "שחרית ו'", time: '' },
    { label: 'מנחה', time: '' },
    { label: 'מעריב', time: '' },
  ]);
  const [bilingualMode, setBilingualMode] = useState(initialData?.bilingualMode || false);
  const [weeklyQuote, setWeeklyQuote] = useState(initialData?.weeklyQuote || '');
  const [molad, setMolad] = useState(initialData?.molad || '');
  const [moladEditable, setMoladEditable] = useState(false);
  const [zmanimB, setZmanimB] = useState(null);
  const [isYomTov, setIsYomTov] = useState(initialData?.isYomTov || false);
  const [showHebrewDate, setShowHebrewDate] = useState(initialData?.showHebrewDate !== undefined ? initialData.showHebrewDate : true);
  const [hebrewDateA, setHebrewDateA] = useState(initialData?.hebrewDateA || '');
  const [hebrewDateB, setHebrewDateB] = useState(initialData?.hebrewDateB || '');
  const [labelDayA, setLabelDayA] = useState(initialData?.labelDayA || 'שישי');
  const [labelDayB, setLabelDayB] = useState(initialData?.labelDayB || 'שבת');
  const [selectedDateB, setSelectedDateB] = useState('');
  const [isRoshChodesh, setIsRoshChodesh] = useState(initialData?.isRoshChodesh || false);
  const [showRoshChodesh, setShowRoshChodesh] = useState(initialData?.showRoshChodesh || false);
  const [specialShabbat, setSpecialShabbat] = useState(initialData?.specialShabbat || '');
  const [showSpecialShabbat, setShowSpecialShabbat] = useState(initialData?.showSpecialShabbat !== undefined ? initialData.showSpecialShabbat : true);
  const [showNoRulesModal, setShowNoRulesModal] = useState(false);
  const [rulesExist, setRulesExist] = useState(() => loadRules().length > 0);

  // Re-check rulesExist whenever rules are applied
  const recheckRules = () => setRulesExist(loadRules().length > 0);

  const loadZmanimData = async (dateA, dateB, skipAutoRows = false) => {
    setZmanimLoading(true);
    const effectiveDateA = dateA || getNextFriday();
    const effectiveDateB = dateB || addDays(effectiveDateA, 1);
    // Update the date inputs if they weren't set yet
    if (!dateA) { setSelectedDate(effectiveDateA); setSelectedDateB(effectiveDateB); }

    const [{ zmanimA, zmanimB: zB, hebrewDateA: hdA, hebrewDateB: hdB }, shabbatData, rules, savedZmanim, savedOverrides, synDefaultPrayers] = await Promise.all([
      fetchZmanimTwoDays(effectiveDateA, effectiveDateB),
      fetchShabbatInfo(effectiveDateA),
      loadRulesAsync(),
      loadZmanim(),
      loadZmanimOverrides(),
      loadSynagogueDefaultPrayers().catch(() => null),
    ]);

    setZmanim(zmanimA);
    setZmanimB(zB);
    setHebrewDateA(hdA);
    setHebrewDateB(hdB);
    setShabbatInfo(shabbatData);
    
    if (!skipAutoRows) {
      if (shabbatData?.parasha) setParasha(shabbatData.parasha);
      if (shabbatData?.haftarah) {
        setHaftarah(shabbatData.haftarah);
        setShowHaftarah(true);
      }
      setSpecialShabbat(shabbatData?.specialShabbat || '');
    } else if (shabbatData?.haftarah && !haftarah) {
      setHaftarah(shabbatData.haftarah);
      setShowHaftarah(true);
    }
    
    if (shabbatData?.molad) { setMolad(shabbatData.molad); setMoladEditable(false); }
    setIsRoshChodesh(!!shabbatData?.isRoshChodesh);
    setSelectedZmanim(savedZmanim);
    setZmanimOverrides(savedOverrides || {});

    // Auto-detect Holiday Context & co-inciding Shabbat
    const holCtx = detectHolidayContext(shabbatData, zmanimA, zB);
    if (holCtx?.isCoinciding && holCtx.holiday) {
      setHolidayNotice(holCtx.summaryNotice);
      setIsHolidayMode(true);
      setHolidayName(holCtx.holiday.name);
      setIsTwoDay(holCtx.isTwoDay);
      if (holCtx.hasEruvTavshilin) setShowEruvTavshilin(true);
      if (holCtx.hasYizkor) setShowYizkorBadge(true);
    } else {
      setHolidayNotice(null);
    }

    const effectiveRules = rules.length > 0 ? rules : DEFAULT_RULES;
    setRulesExist(effectiveRules.length > 0);
    
    let calculated = [];
    if (synDefaultPrayers && Array.isArray(synDefaultPrayers) && synDefaultPrayers.length > 0) {
      calculated = synDefaultPrayers.map((p, idx) => {
        if (p.isHeader || p.isNote) return { ...p, id: p.id || `def-${idx}` };
        if (p.fixedTime) return { ...p, id: p.id || `def-${idx}`, time: p.fixedTime, visible: p.visible !== false };
        const matchedRule = effectiveRules.find(r => r.label === p.label) || (p.baseZman ? p : null);
        if (matchedRule && matchedRule.baseZman) {
          let time = '';
          if (matchedRule.baseZman === 'candleLighting' && shabbatData?.candleLightingIso) {
            time = applyOffset(shabbatData.candleLightingIso, parseInt(matchedRule.offsetMinutes || 0, 10), 'down');
          } else {
            const iso = resolveZmanIso(matchedRule.baseZman, zmanimA || {}, zB || {});
            if (iso) {
              const roundDir = (matchedRule.dayTag || p.dayTag) === 'A' ? 'down' : 'up';
              time = applyOffset(iso, parseInt(matchedRule.offsetMinutes || 0, 10), roundDir);
            }
          }
          return { ...p, id: p.id || `def-${idx}`, time: time || p.time || '', visible: p.visible !== false };
        }
        return { ...p, id: p.id || `def-${idx}`, visible: p.visible !== false };
      });
    } else {
      calculated = calcPrayerRowsFromRules(effectiveRules, zmanimA, shabbatData, zB);
    }

    if (!skipAutoRows && calculated.length > 0) {
      setPrayerRows(calculated.map((r, i) => ({ ...r, id: r.id || `auto-${i}`, visible: r.visible !== false })));
    }
    setZmanimLoading(false);
  };

  useEffect(() => {
    const shouldSkip = (!!dataToLoad && dataToLoad?.prayerRows?.some(r => r.time && r.time.trim() !== '')) || 
                       (!!initialData && hasValidTimes);
    loadZmanimData(undefined, undefined, shouldSkip);
    loadTemplates().then(setTemplates);
  }, []);

  const isUserDateChange = useRef(false);

  useEffect(() => {
    // Debounce date changes to avoid too many API calls
    const timer = setTimeout(() => {
      if (selectedDate && selectedDateB && isUserDateChange.current) {
        const dateA = new Date(selectedDate);
        const dateB = new Date(selectedDateB);
        const maxDays = 2;
        const diffDays = Math.abs((dateB - dateA) / (1000 * 60 * 60 * 24));
        if (diffDays > maxDays) {
          alert('בחר טווח של עד יומיים');
          return;
        }
        loadZmanimData(selectedDate, selectedDateB);
        isUserDateChange.current = false;
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedDate, selectedDateB]);

  const handleDateChange = (e) => {
    isUserDateChange.current = true;
    const dA = e.target.value;
    setSelectedDate(dA);
    if (dA) setSelectedDateB(addDays(dA, 1));
  };

  const handleDateBChange = (e) => {
    isUserDateChange.current = true;
    setSelectedDateB(e.target.value);
  };

  // Build a key→HH:MM map of all computed (API) times, for showing in the selector
  const computedTimes = {};
  if (zmanim || zmanimB) {
    Object.keys(ZMANIM_META).forEach(key => {
      if (key === 'candleLighting') {
        // candleLighting comes from shabbatInfo, not /zmanim API
        if (shabbatInfo?.candleLighting) computedTimes[key] = shabbatInfo.candleLighting;
        return;
      }
      const iso = resolveZmanIso(key, zmanim || {}, zmanimB || {});
      if (iso) computedTimes[key] = formatTime(iso);
    });
  }

  const zmanimDisplay = zmanim ? buildZmanimForDisplay(zmanim, shabbatInfo, selectedZmanim, zmanimB, zmanimOverrides) : [];

  const currentData = () => ({
    type: 'prayer',
    parasha,
    haftarah: showHaftarah ? haftarah : '',
    prayerRows: prayerRows.filter(r => r.visible && r.label).map(r => ({ ...r })),
    hiddenRows: prayerRows.filter(r => !r.visible && r.label),
    announcements,
    structuredAnnouncements,
    announcementsSectionTitle,
    zmanimDisplay,
    zmanimOverrides,
    showZmanimOnPoster,
    shabbatInfo,
    yahrtzeits,
    weekdayRows,
    bilingualMode,
    weeklyQuote,
    molad,
    isYomTov,
    showHebrewDate,
    hebrewDateA: (showHebrewDate && isYomTov) ? hebrewDateA : '',
    hebrewDateB: showHebrewDate ? hebrewDateB : '',
    gregorianDateA: (showHebrewDate && isYomTov && selectedDate) ? selectedDate : '',
    gregorianDateB: showHebrewDate ? (selectedDateB || '') : '',
    labelDayA,
    labelDayB,
    isRoshChodesh,
    showRoshChodesh,
    specialShabbat: showSpecialShabbat ? specialShabbat : '',
    // Holiday & Smart Badges
    isHolidayMode,
    holidayName,
    combineWithShabbat,
    isTwoDay,
    showEruvTavshilin,
    eruvTavshilinText,
    showYizkorBadge,
    yizkorBadgeText,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange) onChange(currentData());
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parasha, prayerRows, announcements, structuredAnnouncements, announcementsSectionTitle, selectedZmanim, zmanimOverrides, zmanim, zmanimB, shabbatInfo, showHaftarah, haftarah, yahrtzeits, weekdayRows, bilingualMode, weeklyQuote, molad, isYomTov, showHebrewDate, hebrewDateA, hebrewDateB, labelDayA, labelDayB, isRoshChodesh, showRoshChodesh, specialShabbat, showSpecialShabbat, isHolidayMode, holidayName, combineWithShabbat, isTwoDay, showEruvTavshilin, eruvTavshilinText, showYizkorBadge, yizkorBadgeText]);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const commitPrayerRows = (next) => {
    setUndoStack(prev => [...prev.slice(-20), prayerRows]);
    setRedoStack([]);
    setPrayerRows(next);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(u => u.slice(0, -1));
    setRedoStack(r => [...r, prayerRows]);
    setPrayerRows(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(r => r.slice(0, -1));
    setUndoStack(u => [...u, prayerRows]);
    setPrayerRows(next);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, prayerRows]);

  const updateRow = (index, field, value) => {
    const updated = [...prayerRows];
    updated[index] = { ...updated[index], [field]: value };
    commitPrayerRows(updated);
  };

  const toggleVisible = (index) => {
    const updated = [...prayerRows];
    updated[index] = { ...updated[index], visible: !updated[index].visible };
    commitPrayerRows(updated);
  };

  const addRow = () => {
    commitPrayerRows([...prayerRows, { id: `new-${Date.now()}-${Math.random()}`, label: '', time: '', visible: true }]);
  };

  const duplicateRow = (index) => {
    const rowToCopy = prayerRows[index];
    const newRow = { ...rowToCopy, id: `new-${Date.now()}-${Math.random()}` };
    const updated = [...prayerRows];
    updated.splice(index + 1, 0, newRow);
    commitPrayerRows(updated);
  };

  const adjustRowTime = (index, diffMinutes) => {
    const row = prayerRows[index];
    if (!row || !row.time || !row.time.includes(':')) return;
    const [hStr, mStr] = row.time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return;
    const total = (h * 60 + m + diffMinutes + 1440) % 1440;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    const newTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    updateRow(index, 'time', newTime);
  };

  const addHeader = () => {
    commitPrayerRows([...prayerRows, { id: `hdr-${Date.now()}-${Math.random()}`, label: 'שחרית שבת', time: '', visible: true, isHeader: true }]);
  };

  const addNote = () => {
    commitPrayerRows([...prayerRows, { id: `note-${Date.now()}-${Math.random()}`, label: 'קידושא רבא אחרי התפילה', time: '', visible: true, isNote: true }]);
  };

  const removeRow = (index) => commitPrayerRows(prayerRows.filter((_, i) => i !== index));

  const saveAsPermanentRule = async (row) => {
    if (!row.label || !row.time) {
      alert("יש להזין שם ושעה כדי לשמור כשורה קבועה");
      return;
    }
    if (!confirm(`האם לשמור את "${row.label}" בשעה ${row.time} כשורה קבועה שתופיע בכל מודעה שבועית חדשה?`)) return;
    try {
      const { loadRulesAsync } = await import('./RelativeZmanimConfig');
      const { saveRulesToDB } = await import('@/lib/synagogueDB');
      let rules = await loadRulesAsync() || [];
      if (rules.length === 0) {
        const { loadConfig } = await import('@/lib/synagogueConfig');
        const cfg = await loadConfig();
        rules = cfg.rules || [];
      }
      rules.push({
        label: row.label,
        baseZman: 'fixed',
        fixedTime: row.time,
        offsetMinutes: 0,
        direction: 'after',
        dayTag: 'B'
      });
      localStorage.setItem('synagogue_relative_rules', JSON.stringify(rules));
      await saveRulesToDB(rules);
      alert('נשמר בהצלחה! השורה תתווסף אוטומטית במודעות הבאות.');
    } catch (e) {
      alert('שגיאה בשמירה: ' + e.message);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(prayerRows);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    commitPrayerRows(items);
  };

  const handleApplyRules = (rules) => {
    if (zmanim) {
      const calculated = calcPrayerRowsFromRules(rules, zmanim, shabbatInfo, zmanimB);
      if (calculated.length > 0)
        setPrayerRows(calculated.map((r, i) => ({ ...r, id: `auto-${i}`, visible: true })));
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('הזן שם לתבנית');
      return;
    }
    await saveTemplate(templateName.trim(), prayerRows);
    const updated = await loadTemplates();
    setTemplates(updated);
    setTemplateName('');
    alert('תבנית נשמרה בהצלחה');
  };

  const handleLoadTemplate = async (name) => {
    const t = templates[name];
    if (t) setPrayerRows(t.prayerRows.map(r => ({ ...r, visible: r.visible !== false })));
  };

  const handleDeleteTemplate = async (name) => {
    await deleteTemplate(name);
    const updated = await loadTemplates();
    setTemplates(updated);
  };

  const handleGenerateClick = () => {
    if (!rulesExist) {
      setShowNoRulesModal(true);
    } else {
      onGenerate(currentData());
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* No Rules Modal */}
      {showNoRulesModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" dir="rtl">
          <div className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg text-foreground">⚠️ לא הוגדרו חוקי תפילה</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  כדי ליצור מודעה אוטומטית, עליך להגדיר קודם כיצד מחשבים את זמני התפילה
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">איך להגדיר חוקים:</p>
              <ol className="text-sm text-blue-800 space-y-1 mr-4 list-decimal">
                <li>גלול למטה בטופס זה</li>
                <li>חפש את הכותרת "🔧 הגדרת חוקי תפילה יחסיים"</li>
                <li>הוסף כללים לפי הזמנים הטבעיים (זריחה, שקיעה וכו׳)</li>
                <li>לחץ "החל כללים" לשמירה</li>
              </ol>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setShowNoRulesModal(false);
                  // Scroll to rules section
                  const rulesElement = document.getElementById('rules-section');
                  if (rulesElement) {
                    rulesElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="flex-1"
              >
                ✓ הבנתי, קח אותי להגדרות
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNoRulesModal(false);
                  onGenerate(currentData());
                }}
                className="flex-1"
              >
                ← צור בכל זאת
              </Button>
            </div>

            <button
              onClick={() => setShowNoRulesModal(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Mode toggle & OCR Quick Import */}
      <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <Checkbox id="yomtov" checked={isYomTov} onCheckedChange={(v) => {
            setIsYomTov(v);
            setLabelDayA(v ? 'ערב יו"ט' : 'שישי');
            setLabelDayB(v ? 'יום טוב' : 'שבת');
          }} />
          <Label htmlFor="yomtov" className="text-sm font-semibold cursor-pointer">מצב יום טוב</Label>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setImageImporterOpen(true)}
            className="gap-1.5 text-xs h-7 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold"
            title="סרוק צילום של מודעה ישנה או לוח זמנים"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>סרוק תמונה (OCR)</span>
          </Button>
          <span className="text-xs text-muted-foreground hidden sm:inline">{isYomTov ? '🕯 יו"ט' : '🕍 שבת'}</span>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-3 p-3 bg-muted/20 rounded-xl border border-border">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex gap-1 items-center mb-1">
              <Label className="text-xs font-semibold">יום א׳</Label>
              <Input value={labelDayA} onChange={e => setLabelDayA(e.target.value)}
                className="h-6 text-xs px-1.5 w-20" dir="rtl" />
            </div>
            <Input type="date" value={selectedDate} onChange={handleDateChange} className="text-sm" />
            {isYomTov && hebrewDateA && <p className="text-xs text-primary mt-0.5 text-center font-frank">{hebrewDateA}</p>}
          </div>
          <div>
            <div className="flex gap-1 items-center mb-1">
              <Label className="text-xs font-semibold">יום ב׳</Label>
              <Input value={labelDayB} onChange={e => setLabelDayB(e.target.value)}
                className="h-6 text-xs px-1.5 w-20" dir="rtl" />
            </div>
            <Input type="date" value={selectedDateB} onChange={handleDateBChange} className="text-sm" />
            {hebrewDateB && <p className="text-xs text-primary mt-0.5 text-center font-frank">{hebrewDateB}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="showHebDate" checked={showHebrewDate} onCheckedChange={setShowHebrewDate} />
          <Label htmlFor="showHebDate" className="text-xs cursor-pointer">הצג תאריך עברי במודעה</Label>
        </div>
        {isRoshChodesh && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="text-sm">🌙</span>
            <span className="text-xs font-semibold text-blue-700">זוהה: שבת ראש חודש!</span>
            <Checkbox id="showRoshChodesh" checked={showRoshChodesh} onCheckedChange={setShowRoshChodesh} className="ml-auto" />
            <Label htmlFor="showRoshChodesh" className="text-xs cursor-pointer text-blue-700">הצג במודעה</Label>
          </div>
        )}
        {specialShabbat && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
            <span className="text-sm">✡️</span>
            <span className="text-xs font-semibold text-amber-800">זוהה: {specialShabbat}</span>
            <Checkbox id="showSpecialShabbat" checked={showSpecialShabbat} onCheckedChange={setShowSpecialShabbat} className="ml-auto" />
            <Label htmlFor="showSpecialShabbat" className="text-xs cursor-pointer text-amber-800">הצג במודעה</Label>
          </div>
        )}

        {/* Holiday & Coinciding Shabbat Notice & Toggles */}
        {(holidayNotice || isHolidayMode) && (
          <div className="bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-3.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕯️</span>
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {holidayName ? `מודעת חג: ${holidayName}` : 'זיהוי חג / יום טוב'}
                  </h4>
                  {holidayNotice && <p className="text-xs text-muted-foreground">{holidayNotice}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch 
                  id="holidayModeSwitch" 
                  checked={isHolidayMode} 
                  onCheckedChange={setIsHolidayMode} 
                />
                <Label htmlFor="holidayModeSwitch" className="text-xs cursor-pointer">
                  {isHolidayMode ? 'פעיל' : 'מבוטל'}
                </Label>
              </div>
            </div>

            {isHolidayMode && (
              <div className="pt-2 border-t border-amber-500/20 space-y-2.5 text-xs">
                {/* Switch 1: Combine with Shabbat */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="combineShabbat" className="font-semibold cursor-pointer">שלב זמני שבת וחג יחד במודעה</Label>
                    <p className="text-[11px] text-muted-foreground">יוצר כרזה אחודה ללא צורך בשני דפים נפרדים</p>
                  </div>
                  <Switch 
                    id="combineShabbat" 
                    checked={combineWithShabbat} 
                    onCheckedChange={setCombineWithShabbat} 
                  />
                </div>

                {/* Switch 2: Eruv Tavshilin */}
                <div className="space-y-1.5 pt-1 border-t border-amber-500/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="eruvTavshilin" className="font-semibold cursor-pointer">תזכורת עירוב תבשילין</Label>
                      <p className="text-[11px] text-muted-foreground">הצג באנר תזכורת להנחת עירוב תבשילין במודעה</p>
                    </div>
                    <Switch 
                      id="eruvTavshilin" 
                      checked={showEruvTavshilin} 
                      onCheckedChange={setShowEruvTavshilin} 
                    />
                  </div>
                  {showEruvTavshilin && (
                    <Input 
                      value={eruvTavshilinText} 
                      onChange={(e) => setEruvTavshilinText(e.target.value)} 
                      placeholder="נוסח תזכורת עירוב תבשילין..." 
                      className="text-xs h-7 bg-background/80" 
                    />
                  )}
                </div>

                {/* Switch 3: Yizkor Memorial */}
                <div className="space-y-1.5 pt-1 border-t border-amber-500/10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="yizkorBadge" className="font-semibold cursor-pointer">תג הזכרת נשמות (יזכור)</Label>
                      <p className="text-[11px] text-muted-foreground">הצג הודעה רשמית על תפילת יזכור במודעה</p>
                    </div>
                    <Switch 
                      id="yizkorBadge" 
                      checked={showYizkorBadge} 
                      onCheckedChange={setShowYizkorBadge} 
                    />
                  </div>
                  {showYizkorBadge && (
                    <Input 
                      value={yizkorBadgeText} 
                      onChange={(e) => setYizkorBadgeText(e.target.value)} 
                      placeholder="נוסח תפילת יזכור..." 
                      className="text-xs h-7 bg-background/80" 
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── STEP 1: Parasha ── */}
      <Collapsible className="bg-muted/20 rounded-xl border border-border">
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">שלב 1 — תאריכים ופרשה</p>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 pt-0 space-y-3">
          <div className="space-y-3 pt-2 border-t border-border mt-1">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm font-semibold">פרשת השבוע</Label>
              {parasha && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">נטען אוטומטית ✓</span>}
            </div>
            <Input value={parasha} onChange={(e) => setParasha(e.target.value)} placeholder="נטען אוטומטית..." className="text-right" dir="rtl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Checkbox id="showHaftarah" checked={showHaftarah} onCheckedChange={setShowHaftarah} />
              <Label htmlFor="showHaftarah" className="text-sm cursor-pointer">הצג הפטרה</Label>
              {haftarah && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">נטען אוטומטית</span>}
            </div>
            {showHaftarah && (
              <Input value={haftarah} onChange={(e) => setHaftarah(e.target.value)} placeholder="הפטרה..." className="mt-1 text-right" dir="rtl" />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ── STEP 2: Prayer Rows ── */}
      <Collapsible defaultOpen className="bg-muted/20 rounded-xl border border-border">
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">שלב 2 — זמני תפילה (שבת)</p>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 pt-0 space-y-3">
          <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
            <p className="text-xs text-muted-foreground">סמן/בטל ✓ להצגה במודעה · גרור לסידור מחדש</p>
            <div className="flex items-center gap-1">
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={handleUndo} 
                disabled={undoStack.length === 0} 
                className="h-7 px-2 text-xs gap-1 hover:bg-muted"
                title="בטל שינוי אחרון (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">בטל</span>
              </Button>
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={handleRedo} 
                disabled={redoStack.length === 0} 
                className="h-7 px-2 text-xs gap-1 hover:bg-muted"
                title="החזר שינוי (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">החזר</span>
              </Button>
            </div>
          </div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="prayer-rows">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {prayerRows.map((row, i) => (
                    <Draggable key={row.id} draggableId={row.id} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-2 ${snapshot.isDragging ? 'opacity-80 shadow-lg' : ''} ${!row.visible ? 'opacity-50' : ''}`}
                        >
                          {row.isHeader ? (
                            <>
                              <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0 p-2 -mr-2 active:bg-muted/50 rounded-lg">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <Input value={row.label} onChange={e => updateRow(i, 'label', e.target.value)}
                                className="flex-1 text-center text-sm font-bold bg-primary/10 border-primary/30" dir="rtl" />
                              <span className="text-xs text-muted-foreground">כותרת</span>
                              <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="text-destructive h-8 w-8">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : row.isNote ? (
                            <>
                              <Checkbox checked={row.visible} onCheckedChange={() => toggleVisible(i)} className="flex-shrink-0" />
                              <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0 p-2 -mr-2 active:bg-muted/50 rounded-lg">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <Input value={row.label} onChange={(e) => updateRow(i, 'label', e.target.value)} placeholder="טקסט חופשי (ללא שעה)" className="flex-1 text-right text-sm italic bg-blue-50/50" dir="rtl" />
                              <span className="text-xs text-muted-foreground flex-shrink-0">📝</span>
                              <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="text-destructive flex-shrink-0 h-8 w-8">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Checkbox checked={row.visible} onCheckedChange={() => toggleVisible(i)} className="flex-shrink-0" />
                              <div {...provided.dragHandleProps} className="cursor-grab text-muted-foreground hover:text-foreground flex-shrink-0 p-1.5 -mr-1 active:bg-muted/50 rounded-lg" title="גרור לשינוי סדר">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <Input 
                                value={row.label} 
                                onChange={(e) => updateRow(i, 'label', e.target.value)} 
                                placeholder="שם התפילה" 
                                className="flex-1 min-w-0 text-right text-sm h-9" 
                                dir="rtl" 
                              />
                              
                              {/* Quick Time Stepper Group */}
                              <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg border border-border/60 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => adjustRowTime(i, -5)}
                                  className="h-8 w-6 rounded bg-background/80 hover:bg-background text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center select-none shadow-xs"
                                  title="הקדֵם ב-5 דקות (-5)"
                                >
                                  -5
                                </button>
                                <Input 
                                  value={row.time} 
                                  onChange={(e) => updateRow(i, 'time', e.target.value)} 
                                  placeholder="00:00" 
                                  className="w-16 sm:w-20 text-center font-mono font-bold text-sm h-8 px-1 border-0 shadow-none bg-transparent tabular-nums focus-visible:ring-1" 
                                  dir="ltr" 
                                />
                                <button
                                  type="button"
                                  onClick={() => adjustRowTime(i, 5)}
                                  className="h-8 w-6 rounded bg-background/80 hover:bg-background text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center select-none shadow-xs"
                                  title="אַחֵר ב-5 דקות (+5)"
                                >
                                  +5
                                </button>
                              </div>

                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Button variant="ghost" size="icon" onClick={() => saveAsPermanentRule(row)} className="hidden sm:inline-flex text-primary hover:text-primary/80 h-8 w-7" title="שמור כשורה קבועה לשבתות הבאות">
                                  <Save className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => duplicateRow(i)} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground h-8 w-7" title="שכפל שורה">
                                  <Copy className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="text-destructive hover:bg-destructive/10 h-8 w-7" title="מחק שורה">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={addRow} className="flex-1">
              <Plus className="w-4 h-4 ml-1" /> הוסף שורה
            </Button>
            <Button variant="outline" size="sm" onClick={addHeader} className="flex-shrink-0 text-xs">
              🏷 כותרת חג
            </Button>
            <Button variant="outline" size="sm" onClick={addNote} className="flex-shrink-0 text-xs">
              📝 הערת טקסט
            </Button>
          </div>
          <div className="space-y-1.5 mt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await saveSynagogueDefaultPrayers(prayerRows);
                  setDefaultSavedBadge(true);
                  setTimeout(() => setDefaultSavedBadge(false), 3500);
                } catch (e) {
                  alert('שגיאה בשמירת ברירת המחדל: ' + e.message);
                }
              }}
              className={`w-full font-medium shadow-xs transition-all text-xs flex items-center justify-center gap-1.5 py-2 ${
                defaultSavedBadge 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {defaultSavedBadge ? '✓ נשמר בהצלחה כברירת מחדל קבועה!' : '💾 קבע רשימת תפילות זו כברירת מחדל קבועה לבית הכנסת'}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              רשימת תפילות זו תוצג כברירת מחדל בכל שבוע עבור בית הכנסת שלך, עם חישוב זמנים אוטומטי.
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={async () => {
              if(!confirm('האם אתה בטוח שברצונך למחוק את כל כללי החג/זמנים הנוכחיים ולחזור לזמני ברירת המחדל של שבת רגילה?')) return;
              try {
                const { saveRulesToDB } = await import('@/lib/synagogueDB');
                const { DEFAULT_SHABBAT_RULES } = await import('./RelativeZmanimConfig');
                await saveRulesToDB(DEFAULT_SHABBAT_RULES);
                localStorage.setItem('synagogue_relative_rules', JSON.stringify(DEFAULT_SHABBAT_RULES));
                setIsYomTov(false);
                setLabelDayA('שישי');
                setLabelDayB('שבת');
                alert('המערכת אופסה לכללי שבת רגילה! לחץ כעת על כפתור "מחיקת טיוטה והתחלה מחדש" כדי לטעון אותם.');
              } catch(e) { alert(e.message); }
            }} className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200">
              <RotateCcw className="w-4 h-4 ml-1" /> אפס לכללי שבת רגילה
            </Button>
          </div>
          <div className="pt-1 border-t border-border mt-2">
            <PresetTemplates onLoad={(rows) => setPrayerRows(rows)} />
          </div>
          <div className="space-y-2 pt-1 border-t border-border mt-1">
            <p className="text-xs font-semibold text-muted-foreground">שמירת תבנית אישית</p>
            <div className="flex gap-2">
              <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="שם התבנית" className="flex-1 text-right text-sm" dir="rtl" />
              <Button variant="outline" size="sm" onClick={handleSaveTemplate} className="gap-1 flex-shrink-0">
                <Save className="w-3.5 h-3.5" /> שמור
              </Button>
            </div>
            {Object.keys(templates).length > 0 && (
              <div className="space-y-1">
                {Object.entries(templates).map(([name]) => (
                  <div key={name} className="flex items-center justify-between bg-background rounded px-3 py-1.5">
                    <button onClick={() => handleLoadTemplate(name)} className="text-sm text-primary hover:underline flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5" /> {name}
                    </button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteTemplate(name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 text-center">
              <button 
                type="button" 
                onClick={() => {
                  const el = document.getElementById('rules-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>רוצה לשנות את החוקים הדינמיים שמחשבים שעות בכל שבוע? עבור לשלב 3 למטה</span>
              </button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* ── STEP 3: Auto Zmanim & Dynamic Rules ── */}
      <Collapsible defaultOpen className="bg-muted/20 rounded-xl border border-border">
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">שלב 3 — חוקי חישוב זמנים דינמיים וזמני היום ⚙️</p>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 pt-0 space-y-3">
          {/* Prominent On/Off Switch for "זמני היום" on poster */}
          <div className="flex items-center justify-between bg-background p-2.5 rounded-lg border border-border shadow-xs mt-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">הצג "זמני היום" במודעה</span>
              <span className="text-[11px] text-muted-foreground">הדלקת נרות, שקיעה, צאת שבת (כבוי כברירת מחדל)</span>
            </div>
            <Switch
              checked={showZmanimOnPoster}
              onCheckedChange={(val) => setShowZmanimOnPoster(val)}
            />
          </div>

          <div className="border-t border-border pt-2 mt-1">
            {zmanimLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">טוען זמני היום...</span>
              </div>
            ) : (
              <div className={`border rounded-lg p-3 transition-colors ${showZmanimOnPoster ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-dashed border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> זמני היום
                    <span className="text-[10px] font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded mr-1">
                      לפי לוח עתים לבינה
                    </span>
                    {!showZmanimOnPoster && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded font-normal">
                        מוסתר במודעה
                      </span>
                    )}
                  </h3>
                  <button onClick={() => setShowZmanimSelector(!showZmanimSelector)} className="text-xs text-primary underline">
                    {showZmanimSelector ? 'סגור' : 'בחר זמנים להצגה'}
                  </button>
                </div>
                {zmanimDisplay.length === 0 ? (
                  <p className="text-xs text-muted-foreground">לא נבחרו זמנים להצגה — לחץ על "בחר זמנים להצגה"</p>
                ) : (
                  <>
                    {zmanimDisplay.filter(z => z.day === 'friday').length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-bold text-blue-700 mb-1">📅 שישי</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {zmanimDisplay.filter(z => z.day === 'friday').map(z => (
                            <div key={z.key} className="flex justify-between gap-1 bg-blue-50/60 rounded px-2 py-1">
                              <span className="text-muted-foreground">{z.label}</span>
                              <span className="font-bold font-frank">{z.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {zmanimDisplay.filter(z => z.day === 'shabbat').length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-purple-700 mb-1">✡️ שבת</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {zmanimDisplay.filter(z => z.day === 'shabbat').map(z => (
                            <div key={z.key} className="flex justify-between gap-1 bg-purple-50/60 rounded px-2 py-1">
                              <span className="text-muted-foreground">{z.label}</span>
                              <span className="font-bold font-frank">{z.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          {showZmanimSelector && (
            <div className="bg-muted/40 rounded-xl border border-border p-4">
              <ZmanimSelector
                selected={selectedZmanim}
                onChange={setSelectedZmanim}
                overrides={zmanimOverrides}
                onOverridesChange={setZmanimOverrides}
                computedTimes={computedTimes}
              />
            </div>
          )}
          <div id="rules-section" className="border-t border-border pt-3 mt-2">
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl mb-3">
              <h4 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-1">
                <Sliders className="w-4 h-4 text-primary" />
                <span>חוקי חישוב זמני תפילה של בית הכנסת (מתעדכנים בכל שבוע)</span>
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                חוקים אלו קובעים כיצד המערכת מחשבת אוטומטית בכל שבוע את שעות התפילה לפי לוח עתים לבינה (למשל: "20 דקות לפני הדלקת נרות", "08:30 שעה קבועה", "בזמן צאת שבת").
              </p>
            </div>
            <RelativeZmanimConfig onApply={(rules) => { handleApplyRules(rules); recheckRules(); }} isYomTov={isYomTov} />
          </div>
          <HalachaCalculator
            zmanim={zmanim}
            shabbatInfo={shabbatInfo}
            onAddToPoster={(text) => {
              setPrayerRows(prev => [...prev, { id: `note-${Date.now()}-${Math.random()}`, label: text, time: '', visible: true, isNote: true }]);
            }}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* ── STEP 4: Smart Gabai Weekly Announcements Hub ── */}
      <div className="space-y-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">שלב 4 — הודעות ואירועי השבת (קידוש, אבות ובנים, שיעורים)</p>
        <SmartAnnouncementsManager
          value={structuredAnnouncements}
          onChange={setStructuredAnnouncements}
          legacyText={announcements}
          onLegacyChange={setAnnouncements}
          sectionTitle={announcementsSectionTitle}
          onSectionTitleChange={setAnnouncementsSectionTitle}
          onGenerateSign={onGenerateSign}
        />
      </div>

      {/* ── STEP 5: Additional Content & Settings ── */}
      <Collapsible className="bg-muted/20 rounded-xl border border-border">
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">שלב 5 — נתונים נוספים (ימות חול, אזכרות, מולד, שפה)</p>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform" />
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 pt-0 space-y-4">
          <div className="border-t border-border pt-3 mt-1">
            <WeekdayTimesSection
              value={weekdayRows}
              onChange={setWeekdayRows}
              onApply={() => onGenerate(currentData())}
            />
          </div>
          <hr className="border-border" />
          <YahrtzeitPanel value={yahrtzeits} onChange={setYahrtzeits} />
          <hr className="border-border" />
          {molad !== undefined && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Label className="text-sm font-semibold">מולד החודש</Label>
                {molad && !moladEditable && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">נטען אוטומטית</span>
                )}
              </div>
              <Input
                value={molad}
                onChange={(e) => { setMolad(e.target.value); setMoladEditable(true); }}
                placeholder="שעת המולד (לדוגמא: 14:32)"
                className="text-right"
                dir="rtl"
              />
              <p className="text-xs text-muted-foreground mt-0.5">ניתן לערוך ידנית • מוצג רק בשבת מברכין</p>
            </div>
          )}
          <hr className="border-border" />
          <div>
            <Label className="text-sm font-semibold">ציטוט שבועי / מאמר חז"ל</Label>
            <Textarea value={weeklyQuote} onChange={e => setWeeklyQuote(e.target.value)} placeholder='לדוגמא: אמר ר&apos; שמעון...' className="mt-1 text-right text-sm min-h-[60px]" dir="rtl" />
            {parasha && (
              <div className="mt-2">
                <TorahInsightButton parasha={parasha} onAddToPoster={(text) => setWeeklyQuote(text)} />
              </div>
            )}
          </div>
          <hr className="border-border" />
          <div className="flex items-center gap-2">
            <Checkbox id="bilingual" checked={bilingualMode} onCheckedChange={setBilingualMode} />
            <Label htmlFor="bilingual" className="text-sm cursor-pointer">מצב דו-לשוני (עברית + אנגלית)</Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="bg-card/70 border border-border/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>שינויים נשמרים ומעודכנים בכרזה בזמן אמת</span>
        </div>
        <Button 
          onClick={handleGenerateClick} 
          data-generate-btn 
          size="sm"
          className="font-bold px-4 h-9 rounded-xl shadow-xs gap-1.5 shrink-0"
        >
          <span>רענן כרזה</span>
          <span className="text-[11px] opacity-70">⚡</span>
        </Button>
      </div>

      {/* Poster Image OCR Importer Modal */}
      <PosterImageImporterModal 
        isOpen={imageImporterOpen} 
        onClose={() => setImageImporterOpen(false)} 
        onApplyImportedData={(imported) => {
          if (imported.parasha) setParasha(imported.parasha);
          if (imported.prayerRows?.length) setPrayerRows(imported.prayerRows);
          if (imported.structuredAnnouncements?.length) setStructuredAnnouncements(imported.structuredAnnouncements);
        }}
      />
    </div>
  );
}