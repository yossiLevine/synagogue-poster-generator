import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bot, Send, Sparkles, Check, CheckCircle2, MessageSquare, 
  Clock, Wine, BookOpen, X, Download, Share2, DoorClosed, ArrowRight,
  Mic, MicOff, Calendar
} from 'lucide-react';
import { getTodayHebrewDate, getTodayGregorianDate, getTargetPosterInfo } from '@/lib/hebrewDate';

/**
 * Parses freeform text typed by the Gabai.
 * Automatically identifies:
 * - Prayer times (e.g. "מנחה גדולה 13:30", "מעריב מוצ"ש: 19:15", "08:15 שחרית")
 * - Announcements, Kiddush, Farbrengen, Shiur, Memorials, Seudah Shlishit
 * Returns updated arrays and a human-friendly list of changes made.
 */
export function parseGabaiFreeformText(text, currentLiveData) {
  // Support multiple lines, semicolons, or comma-separated lists of times
  const rawSegments = text.includes('\n') 
    ? text.split('\n') 
    : text.includes(';')
    ? text.split(';')
    : text.includes(',') && (text.match(/(?:[01]?\d|2[0-3])[:.][0-5]\d/g) || []).length > 1
    ? text.split(',')
    : [text];

  const lines = rawSegments.map(l => l.trim()).filter(Boolean);

  const parsedChanges = [];
  let updatedPrayerRows = [...(currentLiveData?.prayerRows || [])];
  let updatedAnnouncements = [...(currentLiveData?.structuredAnnouncements || [])];

  // Regex to detect 24h time: e.g. 13:30, 08:15, 8:30, 19.15
  const timeRegex = /(?:^|\s)([01]?\d|2[0-3])[:.]([0-5]\d)(?:\s|$)/;

  lines.forEach(line => {
    const timeMatch = line.match(timeRegex);

    if (timeMatch) {
      const timeStr = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
      // Clean label: remove the time from line, remove colons and dashes
      let label = line
        .replace(timeRegex, ' ')
        .replace(/[:\-–]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Check if it's an announcement or event that mentions a time (e.g., "שיעור דף יומי בשעה 17:00" or "סדר אבות ובנים 16:30")
      const isShiurOrEvent = /שיעור|אבות ובנים|פארבריינגען|קידוש|סעודה שלישית|שמחה|עונג שבת/.test(label);

      if (isShiurOrEvent) {
        let icon = '📢';
        let type = 'event';
        if (/שיעור/.test(label)) { icon = '📖'; type = 'shiur'; }
        else if (/אבות ובנים/.test(label)) { icon = '📚'; type = 'avot_ubanim'; }
        else if (/פארבריינגען/.test(label)) { icon = '🥃'; type = 'farbrengen'; }
        else if (/קידוש|סעודה שלישית/.test(label)) { icon = '🍷'; type = 'kiddush'; }

        const newAnn = {
          id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          type,
          icon,
          title: label,
          content: `בשעה ${timeStr}`,
          active: true,
        };
        updatedAnnouncements.push(newAnn);
        parsedChanges.push(`אירוע/הודעה: "${label}" עודכן לשעה ${timeStr}`);
      } else {
        // It's a prayer row!
        let cleanLabel = label.trim();
        // Normalize common synonyms and abbreviations
        cleanLabel = cleanLabel
          .replace(/מוצאי שבת|מוצאי שב"ק|במוצאי שבת/g, 'מוצ"ש')
          .replace(/ערב שבת|ערש"ק|בעש"ק/g, 'ערב שבת')
          .replace(/ליל שבת|ליל שב"ק/g, 'ליל שבת');

        const existingIdx = updatedPrayerRows.findIndex(r => {
          const rClean = r.label.trim();
          if (rClean === cleanLabel) return true;
          if (cleanLabel.includes('מנחה גדולה') && rClean.includes('מנחה גדולה')) return true;
          if (cleanLabel.includes('מנחה קטנה') && rClean.includes('מנחה קטנה')) return true;
          if ((cleanLabel.includes('מוצ"ש') || cleanLabel.includes('הבדלה')) && (rClean.includes('מוצ"ש') || rClean.includes('הבדלה'))) return true;
          if (cleanLabel.includes('קבלת שבת') && rClean.includes('קבלת שבת')) return true;
          if (cleanLabel.includes('ערב שבת') && rClean.includes('ערב שבת')) return true;
          if (cleanLabel === 'שחרית' && rClean.includes('שחרית')) return true;
          if (cleanLabel === 'מנחה' && rClean.includes('מנחה')) return true;
          if (cleanLabel === 'מעריב' && rClean.includes('מעריב')) return true;
          return false;
        });

        if (existingIdx !== -1) {
          const existing = updatedPrayerRows[existingIdx];
          updatedPrayerRows[existingIdx] = {
            ...existing,
            time: timeStr,
            visible: true
          };
          parsedChanges.push(`זמן תפילה: "${existing.label}" עודכן ל-${timeStr}`);
        } else {
          // Add as new prayer row
          const newRow = {
            id: 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            label: cleanLabel || 'תפילה',
            time: timeStr,
            visible: true
          };
          updatedPrayerRows.push(newRow);
          parsedChanges.push(`זמן תפילה חדש: "${newRow.label}" הוגדר לשעה ${timeStr}`);
        }
      }
    } else {
      // Line without explicit time - parse into announcement / message
      let icon = '📢';
      let type = 'general';
      let title = 'הודעה לציבור';
      let content = line;

      if (line.includes(':')) {
        const parts = line.split(':');
        title = parts[0].trim();
        content = parts.slice(1).join(':').trim();
      } else if (line.includes('-') && !line.includes('מוצ"ש')) {
        const parts = line.split('-');
        title = parts[0].trim();
        content = parts.slice(1).join('-').trim();
      }

      if (/קידוש|קידושא/.test(line)) {
        icon = '🍷';
        type = 'kiddush';
        if (!line.includes(':') && !line.includes('-')) title = 'קידושא רבא';
      } else if (/פארבריינגען/.test(line)) {
        icon = '🥃';
        type = 'farbrengen';
        if (!line.includes(':') && !line.includes('-')) title = 'קבלת שבת פארבריינגען';
      } else if (/מזל טוב|שמחה|ברית|שלום זכר/.test(line)) {
        icon = '🎉';
        type = 'mazal_tov';
        if (!line.includes(':') && !line.includes('-')) title = 'ברכת מזל טוב';
      } else if (/אזכרה|לעילוי נשמת|יארצייט|נשמת/.test(line)) {
        icon = '🕯️';
        type = 'memorial';
        if (!line.includes(':') && !line.includes('-')) title = 'לעילוי נשמת';
      } else if (/סעודה שלישית/.test(line)) {
        icon = '🍞';
        type = 'seudah';
        if (!line.includes(':') && !line.includes('-')) title = 'סעודה שלישית';
      } else if (/שיעור|הלכה|דף יומי/.test(line)) {
        icon = '📖';
        type = 'shiur';
        if (!line.includes(':') && !line.includes('-')) title = 'שיעור תורה';
      }

      const newAnn = {
        id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        type,
        icon,
        title,
        content: content || title,
        active: true,
      };
      updatedAnnouncements.push(newAnn);
      parsedChanges.push(`הודעה: "${title}" (${content || title})`);
    }
  });

  return {
    updatedPrayerRows,
    updatedAnnouncements,
    parsedChanges,
  };
}

export default function GabaiChatAssistant({ 
  isOpen, 
  onClose, 
  liveData = {}, 
  workspaces = [],
  activeWorkspaceId,
  onSelectWorkspace,
  onUpdateData, 
  onOpenSignGenerator,
  onPrintPoster 
}) {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [waitingForCustom, setWaitingForCustom] = useState(false);
  const [customField, setCustomField] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState(null);
  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const isHoliday = liveData?.isHolidayMode || liveData?.isYomTov;
  const holidayName = liveData?.holidayName || liveData?.parasha || 'החג';
  const parasha = liveData?.parasha || (isHoliday ? holidayName : 'האזינו');
  const specialShabbat = liveData?.specialShabbat || '';
  const candleLighting = liveData?.shabbatInfo?.candleLighting || '18:01';
  
  // Find current prayer times
  const prayerRows = liveData?.prayerRows || [];
  const minchaRow = prayerRows.find(r => /מנחה ערב|מנחה ע"ש|מנחה ערב החג/.test(r.label)) || prayerRows[0] || { time: '18:25' };
  const shacharitRow = prayerRows.find(r => /שחרית/.test(r.label)) || { time: '08:00' };

  // Voice recording cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Web Speech API Recording Toggle
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    setRecordingError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setRecordingError('הדפדפן אינו תומך בהקלטה קולית (Web Speech API). אנא השתמש ב-Chrome או הקלד ידנית.');
      setTimeout(() => setRecordingError(null), 5000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'he-IL';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        if (transcript) {
          handleVoiceTranscript(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setRecordingError('גישה למיקרופון נחסמה. אנא אשר גישה בדפדפן.');
        } else {
          setRecordingError('לא נקלט קול, נסה שוב.');
        }
        setTimeout(() => setRecordingError(null), 4000);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
      setRecordingError('שגיאה בהפעלת המיקרופון.');
      setTimeout(() => setRecordingError(null), 4000);
    }
  };

  // Process voice transcript - supports both commands ("עבור למודעת החג") and direct prayer/event updates
  const handleVoiceTranscript = (spokenText) => {
    // Check if voice command is to switch workspace / poster
    const lower = spokenText.trim();
    if (/עבור|תעבור|פתח|החלף|שנה למודעת|עריכת/i.test(lower)) {
      if (/שבת/i.test(lower)) {
        const shabbatWs = workspaces.find(w => !w.isHolidayMode && !w.isYomTov);
        if (shabbatWs && onSelectWorkspace) {
          onSelectWorkspace(shabbatWs.id);
          setMessages(prev => [
            ...prev,
            { sender: 'user', id: 'usr_' + Date.now(), text: `🎤 "${spokenText}"` },
            { sender: 'bot', id: 'bot_' + Date.now(), text: `עברתי לעריכת מודעת שבת קודש (${shabbatWs.name})! ✨` }
          ]);
          return;
        }
      }

      // Check holidays
      const matchedHoliday = workspaces.find(w => 
        (w.isHolidayMode || w.isYomTov) && 
        (lower.includes(w.name) || (w.holidayName && lower.includes(w.holidayName)))
      );
      if (matchedHoliday && onSelectWorkspace) {
        onSelectWorkspace(matchedHoliday.id);
        setMessages(prev => [
          ...prev,
          { sender: 'user', id: 'usr_' + Date.now(), text: `🎤 "${spokenText}"` },
          { sender: 'bot', id: 'bot_' + Date.now(), text: `עברתי לעריכת מודעת ${matchedHoliday.name}! 🍷` }
        ]);
        return;
      }
    }

    // Otherwise, treat as voice input for the current step or additional changes
    setMessages(prev => [...prev, { sender: 'user', id: 'usr_' + Date.now(), text: `🎤 "${spokenText}"` }]);
    applyStep('additional_changes_input', spokenText);
  };

  // Reset and restart chat if opened or if workspace/holiday changed
  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      startChat();
    }
  }, [isOpen, liveData?.workspaceId, liveData?.holidayName]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startChat = () => {
    if (isHoliday) {
      const isTwoDay = liveData?.isTwoDay;
      const holidayGreeting = `שלום ר' גבאי! מועדים לשמחה לקראת ${holidayName}! 🕯️🍷\nהתבנית הותאמה במיוחד לסדר תפילות החג ${isTwoDay ? '(יומיים)' : ''}.\n\nבוא נעבור על זמני התפילות ואירועי החג בכמה רגעים:`;
      const firstRowLabel = minchaRow.label || 'מנחה ערב החג';

      setMessages([
        {
          sender: 'bot',
          id: 'msg_welcome_holiday',
          text: holidayGreeting,
        },
        {
          sender: 'bot',
          id: 'msg_holiday_mincha',
          text: `שעת ${firstRowLabel} מוגדרת לשעה ${minchaRow.time || '18:20'}. האם תרצה לשנות?`,
          options: [
            { label: `✓ נשאר ב-${minchaRow.time || '18:20'}`, value: minchaRow.time || '18:20', field: 'mincha' },
            { label: '18:15', value: '18:15', field: 'mincha' },
            { label: '18:30', value: '18:30', field: 'mincha' },
            { label: '✏️ שעה אחרת...', value: 'custom', field: 'mincha_custom' },
          ]
        }
      ]);
      setCurrentStep(1);
      return;
    }

    setMessages([
      {
        sender: 'bot',
        id: 'msg_welcome',
        text: `שלום ר' גבאי! שבת שלום לקראת פרשת ${parasha} ${specialShabbat ? `(${specialShabbat})` : ''}. 🕍\nזמני היום חושבו לפי לוח עתים לבינה (הדלקת נרות: ${candleLighting}).\n\nבוא נעדכן את זמני השבת וההודעות בכמה שניות!`,
      },
      {
        sender: 'bot',
        id: 'msg_mincha',
        text: `האם שעת מנחה ערב שבת היא ב-${minchaRow.time || '18:25'} או שתרצה לשנות?`,
        options: [
          { label: `✓ נשאר ב-${minchaRow.time || '18:25'}`, value: minchaRow.time || '18:25', field: 'mincha' },
          { label: '18:15', value: '18:15', field: 'mincha' },
          { label: '18:20', value: '18:20', field: 'mincha' },
          { label: '18:30', value: '18:30', field: 'mincha' },
          { label: '✏️ שעה אחרת...', value: 'custom', field: 'mincha_custom' },
        ]
      }
    ]);
    setCurrentStep(1);
  };

  const handleSelectOption = (opt) => {
    // Add user response message
    setMessages(prev => [...prev, { sender: 'user', id: 'usr_' + Date.now(), text: opt.label }]);

    if (opt.value === 'custom') {
      setWaitingForCustom(true);
      setCustomField(opt.field);
      setMessages(prev => [...prev, { sender: 'bot', id: 'bot_ask_' + Date.now(), text: 'הקלד את השעה המבוקשת (לדוגמה: 18:35):' }]);
      return;
    }

    applyStep(opt.field, opt.value);
  };

  const handleSendCustom = (e) => {
    e?.preventDefault();
    if (!customInput.trim()) return;

    const val = customInput.trim();
    setMessages(prev => [...prev, { sender: 'user', id: 'usr_' + Date.now(), text: val }]);
    setCustomInput('');
    setWaitingForCustom(false);

    applyStep(customField || 'additional_changes_input', val);
  };

  const applyStep = (field, value) => {
    if (field.startsWith('mincha')) {
      // Update Mincha time in prayerRows (supporting both Shabbat and Holiday labels)
      const updatedRows = prayerRows.map(r => 
        /מנחה ערב|מנחה ע"ש|מנחה ערב החג|מנחה/.test(r.label) ? { ...r, time: value } : r
      );
      if (onUpdateData) onUpdateData({ prayerRows: updatedRows });

      // Next step: Shacharit or Morning Prayers
      const nextShacharitRow = prayerRows.find(r => /שחרית/.test(r.label)) || { time: '07:30', label: isHoliday ? 'שחרית החג' : 'שחרית' };

      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'bot',
          id: 'msg_shacharit',
          text: `מצוין! ובאיזו שעה ${nextShacharitRow.label}? (השעה כעת: ${nextShacharitRow.time || '07:30'})`,
          options: [
            { label: `✓ כרגיל ב-${nextShacharitRow.time || '07:30'}`, value: nextShacharitRow.time || '07:30', field: 'shacharit' },
            { label: '07:00', value: '07:00', field: 'shacharit' },
            { label: '07:30', value: '07:30', field: 'shacharit' },
            { label: '08:00', value: '08:00', field: 'shacharit' },
            { label: '08:30', value: '08:30', field: 'shacharit' },
            { label: '✏️ שעה אחרת...', value: 'custom', field: 'shacharit_custom' },
          ]
        }]);
        setCurrentStep(2);
      }, 350);
      return;
    }

    if (field.startsWith('shacharit')) {
      // Update Shacharit time in prayerRows
      const updatedRows = prayerRows.map(r => 
        /שחרית/.test(r.label) ? { ...r, time: value } : r
      );
      if (onUpdateData) onUpdateData({ prayerRows: updatedRows });

      // Next step: Kiddush / Farbrengen
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'bot',
          id: 'msg_kiddush',
          text: 'האם יש קידוש, פארבריינגען או שמחה מיוחדת השבת? 🍷',
          options: [
            { label: 'אין קידוש השבוע', value: 'none', field: 'kiddush' },
            { label: '🍷 קידושא רבא', value: 'kiddush_raba', field: 'kiddush' },
            { label: '🥃 קבלת שבת פארבריינגען', value: 'farbrengen', field: 'kiddush' },
            { label: '🎉 ברכת מזל טוב', value: 'mazal_tov', field: 'kiddush' },
          ]
        }]);
        setCurrentStep(3);
      }, 350);
      return;
    }

    if (field === 'kiddush') {
      if (value === 'none') {
        askShiur();
      } else {
        const title = value === 'kiddush_raba' ? 'קידושא רבא' : value === 'farbrengen' ? 'קבלת שבת פארבריינגען' : 'ברכת מזל טוב';
        setWaitingForCustom(true);
        setCustomField('kiddush_details_' + value);
        setMessages(prev => [...prev, {
          sender: 'bot',
          id: 'msg_kiddush_details',
          text: `בשמחה! עבור ${title} — מי המשפחה או התורמים? (למשל: "משפחת לוי לרגל הולדת הבת" או "לכבוד שבת שובה"):`
        }]);
      }
      return;
    }

    if (field.startsWith('kiddush_details_')) {
      const type = field.replace('kiddush_details_', '');
      const isFarbrengen = type === 'farbrengen';
      const isMazalTov = type === 'mazal_tov';
      
      const newAnn = {
        id: 'ann_' + Date.now(),
        type: isFarbrengen ? 'farbrengen' : isMazalTov ? 'mazal_tov' : 'kiddush',
        icon: isFarbrengen ? '🥃' : isMazalTov ? '🎉' : '🍷',
        title: isFarbrengen ? 'קבלת שבת פארבריינגען' : isMazalTov ? 'ברכת מזל טוב' : 'קידושא רבא',
        content: isFarbrengen 
          ? `יישר כוח ל${value} שתרמו את הוויסקי והנקניקים לקבלת שבת ולהתוועדות. תזכו למצוות!`
          : isMazalTov
          ? `ברכת מזל טוב חמה ל${value}, יזכו לרוות רוב נחת ושמחה לתורה ולחופה!`
          : `השבת יתקיים קידושא רבא באולם בית הכנסת ל${value}. כולם מוזמנים!`,
        active: true,
      };

      const existing = liveData?.structuredAnnouncements || [];
      if (onUpdateData) onUpdateData({ structuredAnnouncements: [...existing, newAnn] });

      askShiur();
      return;
    }

    if (field === 'shiur') {
      if (value !== 'none') {
        const ann = value === 'avot' ? {
          id: 'ann_' + Date.now(),
          type: 'avot_ubanim',
          icon: '📚',
          title: 'סדר לימוד אבות ובנים',
          content: 'סדר לימוד הורים וילדים יתקיים בשבת בשעה 17:00 בליווי פרסים וכיבוד!',
          active: true,
        } : value === 'shiur_halacha' ? {
          id: 'ann_' + Date.now(),
          type: 'shiur',
          icon: '📖',
          title: 'שיעור בהלכה ובדף היומי',
          content: 'שיעור מרכזי מפי מורנו הרב שליט"א בין מנחה למעריב.',
          active: true,
        } : {
          id: 'ann_' + Date.now(),
          type: 'women_shiur',
          icon: '🌸',
          title: 'שיעור נשים וצעירות',
          content: 'שיעור מיוחד לנשות הקהילה בעזרת הנשים בשעה 16:30.',
          active: true,
        };

        const existing = liveData?.structuredAnnouncements || [];
        if (onUpdateData) onUpdateData({ structuredAnnouncements: [...existing, ann] });
      }

      // Next step: Ask if there are additional changes!
      askAdditionalChanges();
      return;
    }

    if (field === 'additional_changes') {
      if (value === 'none') {
        finishChat();
      } else {
        setWaitingForCustom(true);
        setCustomField('additional_changes_input');
        setMessages(prev => [...prev, {
          sender: 'bot',
          id: 'bot_format_' + Date.now(),
          text: `אפשר להקליד שינוי בודד או כמה שינויים (כל שינוי בשורה נפרדת). המערכת תזהה, תסדר ותעדכן הכל אוטומטית!\n\n📋 פורמט מומלץ:\n• זמני תפילה: שם תפילה: שעה (למשל: מנחה גדולה 13:30 או מעריב מוצ"ש: 19:15)\n• אירוע או שמחה: סוג: פירוט (למשל: סעודה שלישית: תרומת משפחת לוי)\n• כל הודעה או הערה חופשית אחרת (למשל: נא לפנות עגלות)`,
        }]);
      }
      return;
    }

    if (field === 'additional_changes_input') {
      // Check if user replied that there are no more changes
      if (/^(לא|אין|אין שינויים|הכל מוכן|הכל בסדר|לא צריך|זהו|סיימתי)$/i.test(value.trim())) {
        finishChat();
        return;
      }

      const { updatedPrayerRows, updatedAnnouncements, parsedChanges } = parseGabaiFreeformText(value, liveData);
      
      if (onUpdateData) {
        onUpdateData({
          prayerRows: updatedPrayerRows,
          structuredAnnouncements: updatedAnnouncements,
        });
      }

      const summaryText = parsedChanges.length > 0
        ? `מעולה! זיהיתי וסידרתי את ${parsedChanges.length} השינויים הבאים במודעה:\n\n${parsedChanges.map(c => `✓ ${c}`).join('\n')}\n\nהאם ישנם שינויים נוספים או שהכל מוכן?`
        : `רשמתי את ההודעה במודעה: "${value}".\n\nהאם ישנם שינויים נוספים או שהכל מוכן?`;

      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'bot',
          id: 'bot_parsed_' + Date.now(),
          text: summaryText,
          options: [
            { label: '🎉 הכל מוכן, סיים!', value: 'finish', field: 'additional_changes_finish' },
            { label: '✏️ להקליד שינוי נוסף...', value: 'more', field: 'additional_changes_more' },
          ]
        }]);
      }, 350);
      return;
    }

    if (field === 'additional_changes_finish') {
      finishChat();
      return;
    }

    if (field === 'additional_changes_more') {
      setWaitingForCustom(true);
      setCustomField('additional_changes_input');
      setMessages(prev => [...prev, {
        sender: 'bot',
        id: 'bot_ask_more_' + Date.now(),
        text: 'הקלד את השינוי הנוסף (למשל: הבדלה 19:15 או שיעור שבת בשעה 17:00):'
      }]);
      return;
    }
  };

  const askShiur = () => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        id: 'msg_shiur',
        text: 'האם יש שיעור תורה, סדר אבות ובנים או פעילות נוספת? 📚',
        options: [
          { label: 'הכל כרגיל ללא תוספות', value: 'none', field: 'shiur' },
          { label: '📚 אבות ובנים בשעה 17:00', value: 'avot', field: 'shiur' },
          { label: '📖 שיעור הלכה בין מנחה למעריב', value: 'shiur_halacha', field: 'shiur' },
          { label: '🌸 שיעור נשים בשעה 16:30', value: 'women', field: 'shiur' },
        ]
      }]);
      setCurrentStep(4);
    }, 350);
  };

  const askAdditionalChanges = () => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        id: 'msg_additional_changes',
        text: 'האם ישנם שינויים נוספים, זמני תפילה מיוחדים או הודעות נוספות? ✍️',
        options: [
          { label: '✓ הכל מוכן, אין שינויים נוספים', value: 'none', field: 'additional_changes' },
          { label: '✏️ כן, להקליד שינויים נוספים...', value: 'custom_changes', field: 'additional_changes' },
        ]
      }]);
      setCurrentStep(5);
    }, 350);
  };

  const finishChat = () => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        sender: 'bot',
        id: 'msg_done',
        text: 'אשרכם! המודעה עודכנה לחלוטין ומוכנה לשבת קודש! 🎉\nכל הזמנים, ההודעות וההפטרה מסונכרנים במודעה.',
        isFinished: true,
      }]);
      setCurrentStep(6);
    }, 350);
  };

  const shareWhatsApp = () => {
    const motzeiRow = prayerRows.find(r => /מוצ"ש|הבדלה|מעריב מוצאי/.test(r.label));
    const motzeiText = motzeiRow?.time ? `🌙 ${motzeiRow.label}: ${motzeiRow.time}\n` : '';
    const text = `🕍 *זמני תפילה - פרשת ${parasha}${specialShabbat ? ` | ${specialShabbat}` : ''}*\n` +
      `🕯️ הדלקת נרות: ${candleLighting}\n` +
      `🌅 מנחה ערב שבת: ${minchaRow.time}\n` +
      `☀️ שחרית: ${shacharitRow.time}\n` +
      motzeiText +
      (liveData?.structuredAnnouncements?.length ? `📢 *הודעות השבת:* ${liveData.structuredAnnouncements.map(a => a.title).join(', ')}\n` : '') +
      `\nשבת שלום ומבורך! ✡️`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const todayHebrew = getTodayHebrewDate();
  const todayGregorian = getTodayGregorianDate();
  const targetInfo = getTargetPosterInfo(liveData);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden" dir="rtl">
      <div className="bg-background border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-lg h-[92vh] sm:h-[650px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-foreground">עוזר הגבאי המהיר</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] text-muted-foreground">הכנת מודעה ב-30 שניות + הקלטה קולית</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => { setMessages([]); startChat(); }} 
                className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
              >
                התחל מחדש
              </Button>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Today's Hebrew Date & Target Poster Banner */}
          <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/25 rounded-2xl p-2.5 text-xs text-right space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-1.5 font-bold">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>היום: {todayHebrew}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal">({todayGregorian})</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-amber-900 dark:text-amber-200 font-semibold bg-amber-500/15 dark:bg-amber-900/30 px-2 py-1 rounded-xl border border-amber-500/20">
              <span className="text-xs">🎯</span>
              <span className="text-muted-foreground text-[11px]">המודעה מיועדת ל:</span>
              <span className="font-bold underline decoration-amber-500/40">
                {targetInfo.title}
              </span>
              {targetInfo.hebrewDate && (
                <span className="bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950 px-2 py-0.5 rounded-md text-[10.5px] font-bold mr-auto shadow-2xs">
                  {targetInfo.hebrewDate}
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Workspace / Holiday Switcher inside Chat */}
          {workspaces && workspaces.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 border-t border-border/40">
              <span className="text-[11px] font-bold text-muted-foreground shrink-0 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> עריכת מודעה:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {workspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspaceId;
                  const isWsHoliday = ws.isHolidayMode || ws.isYomTov;
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => onSelectWorkspace && onSelectWorkspace(ws.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                        isActive
                          ? isWsHoliday
                            ? 'bg-amber-600 text-white shadow-xs scale-105 font-bold'
                            : 'bg-primary text-primary-foreground shadow-xs scale-105 font-bold'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span>{isWsHoliday ? '🍷' : '🕯️'}</span>
                      <span>{ws.name}</span>
                      {isActive && <Check className="w-3 h-3 mr-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-muted/20">
          {recordingError && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center animate-in fade-in">
              {recordingError}
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-xs'
                    : 'bg-card border border-border/80 text-foreground rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>

              {/* Options Chips */}
              {m.options && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 justify-end max-w-[90%]">
                  {m.options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-card border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 shadow-2xs"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Finished Actions Card */}
              {m.isFinished && (
                <div className="w-full mt-3 p-3.5 rounded-2xl bg-card border border-primary/30 space-y-2 shadow-sm">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>פעולות מהירות למודעה:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={onClose} size="sm" variant="outline" className="text-xs gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      צפה במודעה
                    </Button>
                    <Button onClick={onPrintPoster} size="sm" className="text-xs gap-1">
                      <Download className="w-3.5 h-3.5" />
                      הורד PDF
                    </Button>
                    <Button onClick={shareWhatsApp} size="sm" variant="outline" className="text-xs gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10">
                      <Share2 className="w-3.5 h-3.5" />
                      שלח לוואטסאפ
                    </Button>
                    <Button onClick={() => { onClose(); onOpenSignGenerator && onOpenSignGenerator(); }} size="sm" variant="outline" className="text-xs gap-1 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10">
                      <DoorClosed className="w-3.5 h-3.5" />
                      הפק שלט לדלת
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar (When freeform text or voice input is needed) */}
        <div className="p-3 border-t border-border bg-card/90">
          <form onSubmit={handleSendCustom} className="flex items-center gap-2">
            {/* Voice Recording Button */}
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="sm"
              onClick={toggleVoiceRecording}
              className={`rounded-xl px-3 transition-all ${isRecording ? 'animate-pulse bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-primary/10 hover:text-primary'}`}
              title={isRecording ? "עצור הקלטה קולית" : "הקלט הוראה קולית (למשל: מנחה בשש וחצי וקידוש לרגל הולדת הבת)"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>

            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={
                isRecording 
                  ? "מקשיב... דבר עכשיו בעברית..." 
                  : waitingForCustom 
                  ? "הקלד שינוי או לחץ על המיקרופון להקלטה..." 
                  : "הקלד הודעה, שנה זמן, או דבר במיקרופון..."
              }
              className={`text-xs flex-1 rounded-xl transition-all ${isRecording ? 'border-red-500 ring-2 ring-red-500/30' : ''}`}
              dir="rtl"
            />
            <Button type="submit" size="sm" disabled={!customInput.trim()} className="rounded-xl px-3">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            💡 ניתן לדבר במיקרופון: "מנחה גדולה ב-13:30", "קידוש משפחת לוי", או "עבור למודעת ראש השנה"
          </p>
        </div>

      </div>
    </div>
  );
}
