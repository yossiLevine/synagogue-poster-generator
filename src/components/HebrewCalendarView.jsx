import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getConfig, PRESET_HORIZONS } from '@/lib/synagogueConfig';

const TIMEZONE = 'Asia/Jerusalem';

function getHebrewMonthDays(year, month) {
  // Returns array of {date, gregDate} for a Gregorian month
  const days = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export default function HebrewCalendarView({ onExportMonth }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const MONTH_NAMES_HE = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

  const fetchMonthEvents = async (y, m) => {
    setLoading(true);
    try {
      const cfg = getConfig();
      const preset = PRESET_HORIZONS.find(p => p.name === cfg.horizonName);
      const b = preset?.candleOffset || 20;

      const startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const endDate = new Date(y, m + 1, 0);
      const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${endDate.getDate()}`;
      const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${y}&month=${m + 1}&ss=on&mf=on&c=on&geo=pos&latitude=${cfg.lat}&longitude=${cfg.lng}&tzid=${TIMEZONE}&M=on&b=${b}&lg=he`;
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data.items || []);
    } catch (e) {
      setEvents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchMonthEvents(year, month);
  }, [open, year, month]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days = getHebrewMonthDays(year, month);
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun

  // Build event map by day
  const eventMap = {};
  for (const ev of events) {
    const d = ev.date?.split('T')[0];
    if (!d) continue;
    if (!eventMap[d]) eventMap[d] = [];
    eventMap[d].push(ev);
  }

  const isShabbat = (date) => date.getDay() === 6;
  const isHoliday = (date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return eventMap[key]?.some(e => e.category === 'holiday' || e.category === 'roshchodesh');
  };

  const getEventsForDay = (date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    return eventMap[key] || [];
  };

  const getHebrewDay = (date) => {
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    const ev = eventMap[key]?.find(e => e.hd);
    if (ev?.hd) return ev.hd;
    try {
      return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric' }).format(date);
    } catch {
      return '';
    }
  };

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="w-4 h-4 text-primary" />
          לוח שנה עברי חזותי
        </div>
        <span className="text-xs text-muted-foreground">{MONTH_NAMES_HE[month]} {year}</span>
      </button>

      {open && (
        <div className="p-3 border-t border-border space-y-3">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth} title="חודש קודם"><ChevronRight className="w-4 h-4" /></Button>
            <span className="font-frank font-bold text-primary">{MONTH_NAMES_HE[month]} {year}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth} title="חודש הבא"><ChevronLeft className="w-4 h-4" /></Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> טוען...
            </div>
          ) : (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className={`text-center text-xs font-bold py-1 ${d === 'ש׳' ? 'text-blue-600' : 'text-muted-foreground'}`}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}

                {days.map((date, i) => {
                  const dayEvents = getEventsForDay(date);
                  const shabbat = isShabbat(date);
                  const holiday = isHoliday(date);
                  const parashat = dayEvents.find(e => e.category === 'parashat');
                  const candles = dayEvents.find(e => e.category === 'candles');
                  const havdalah = dayEvents.find(e => e.category === 'havdalah');
                  const hebrewDay = dayEvents.find(e => e.hd)?.hd;

                  return (
                    <div
                      key={i}
                      className={`min-h-[56px] rounded-lg p-1 border text-xs transition-colors ${
                        shabbat ? 'bg-blue-50 border-blue-200' :
                        holiday ? 'bg-amber-50 border-amber-200' :
                        'bg-background border-border'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-sm leading-none ${shabbat ? 'text-blue-700' : holiday ? 'text-amber-700' : 'text-foreground'}`}>
                          {date.getDate()}
                        </span>
                        {hebrewDay && <span className="text-muted-foreground font-frank text-[9px] leading-none">{hebrewDay}</span>}
                      </div>
                      {parashat && (
                        <div className="mt-0.5 text-[9px] text-blue-700 font-bold leading-tight truncate">
                          {parashat.hebrew || parashat.title}
                        </div>
                      )}
                      {candles && (
                        <div className="text-[9px] text-orange-600 leading-tight">
                          🕯 {new Date(candles.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      )}
                      {havdalah && (
                        <div className="text-[9px] text-purple-600 leading-tight">
                          ✨ {new Date(havdalah.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                      )}
                      {dayEvents.filter(e => e.category === 'holiday' || e.category === 'roshchodesh').map((e, j) => (
                        <div key={j} className="text-[9px] text-amber-700 leading-tight truncate">{e.hebrew || e.title}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {onExportMonth && (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onExportMonth({ year, month, events })}>
              📤 ייצא מודעה חודשית
            </Button>
          )}
        </div>
      )}
    </div>
  );
}