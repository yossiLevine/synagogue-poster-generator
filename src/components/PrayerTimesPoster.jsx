import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import SynagogueEmblem from './SynagogueEmblem';
import PosterFrame from './PosterFrame';
import { THEMES } from '@/lib/themes';
import { getConfig, loadConfig } from '@/lib/synagogueConfig';
import { getSynagogueId } from '@/lib/synagogueDB';

function Divider({ theme }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 my-2">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${theme.dividerColor})` }} />
      <div className="flex items-center gap-1 opacity-80 select-none">
        <span style={{ color: theme.dividerColor, fontSize: '9px' }}>✦</span>
        <span className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: theme.dividerColor }} />
        <span style={{ color: theme.dividerColor, fontSize: '9px' }}>✦</span>
      </div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.dividerColor})` }} />
    </div>
  );
}

const BILINGUAL_LABELS = {
  'מנחה ערב שבת': 'Mincha Erev Shabbat',
  'קבלת שבת': 'Kabbalat Shabbat',
  'מעריב': "Ma'ariv",
  'שחרית': 'Shacharit',
  'מנחה': 'Mincha',
  'מוצ"ש': 'Motza\'ei Shabbat',
};

function formatGregorianDateSafe(dateStr) {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && (dateStr.includes('.') || dateStr.includes('/'))) return dateStr;
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${parseInt(d, 10)}.${parseInt(m, 10)}.${y}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
}

export default function PrayerTimesPoster({ data, themeId = 'classic', showQR = false, synagogueUrl = '', bgImage = null, bgOpacity = 0.15, brightness = 1, frameId = 'classic', onUpdateData = null, overrideSynagogueName = null }) {
  const { 
    parasha, haftarah, prayerRows, announcements, structuredAnnouncements, 
    announcementsSectionTitle,
    zmanimDisplay, yahrtzeits, weekdayRows, bilingualMode, weeklyQuote, molad, 
    showHebrewDate, hebrewDateA, hebrewDateB, gregorianDateA, gregorianDateB, 
    labelDayA, labelDayB, isYomTov, isRoshChodesh, showRoshChodesh, specialShabbat,
    isHolidayMode, holidayName, combineWithShabbat, showEruvTavshilin, eruvTavshilinText,
    showYizkorBadge, yizkorBadgeText, showZmanimOnPoster
  } = data;
  const [config, setConfig] = useState(() => {
    const base = getConfig();
    if (overrideSynagogueName) return { ...base, synagogueName: overrideSynagogueName };
    return base;
  });
  const activeAnnouncements = structuredAnnouncements?.filter(a => a.active) || [];
  
  useEffect(() => {
    let mounted = true;
    const syncConfig = async () => {
      if (overrideSynagogueName) {
        if (mounted) setConfig(prev => ({ ...prev, synagogueName: overrideSynagogueName }));
        return;
      }
      const loaded = await loadConfig();
      if (mounted && loaded) {
        setConfig(loaded);
      }
    };
    
    syncConfig();

    const handler = () => {
      if (!mounted) return;
      if (overrideSynagogueName) {
        setConfig(prev => ({ ...prev, synagogueName: overrideSynagogueName }));
      } else {
        setConfig(getConfig());
      }
    };
    window.addEventListener('synagogue-config-changed', handler);
    return () => {
      mounted = false;
      window.removeEventListener('synagogue-config-changed', handler);
    };
  }, [overrideSynagogueName]);
  // 'none' theme — use minimal defaults
  const theme = (themeId && themeId !== 'none' && THEMES[themeId]) ? THEMES[themeId] : {
    ...THEMES.classic,
    bg: '#ffffff',
    titleColor: '#1a1a1a',
    bodyColor: '#333333',
    accentColor: '#555555',
    dividerColor: '#cccccc',
    rowEvenBg: '#f9f9f9',
    outerBorderColor: 'transparent',
    innerBorderColor: 'transparent',
    boxShadow: 'none',
    borderStyle: '',
  };

  const prayerCount = prayerRows?.length || 0;
  const weekdayCount = weekdayRows?.filter(r => r.time)?.length || 0;
  const annCount = activeAnnouncements.length || (announcements ? 1 : 0);
  const totalItems = prayerCount + (weekdayCount > 0 ? weekdayCount + 1 : 0) + (annCount > 0 ? annCount + 1 : 0);

  const isCompact = totalItems > 12;
  const isVeryCompact = totalItems > 16;
  const rowPad = isVeryCompact ? 'py-2 px-3.5 min-h-[40px]' : isCompact ? 'py-2.5 px-4 min-h-[44px]' : 'py-2.5 px-5 min-h-[48px]';
  const labelFont = isVeryCompact ? 'text-lg md:text-xl font-bold' : isCompact ? 'text-xl md:text-2xl font-bold' : 'text-xl md:text-2xl font-extrabold';
  const timeFont = isVeryCompact ? 'text-xl md:text-2xl font-bold' : isCompact ? 'text-2xl md:text-3xl font-extrabold' : 'text-2xl md:text-3xl font-extrabold';

  return (
    <PosterFrame themeId={themeId} bgImage={bgImage} bgOpacity={bgOpacity} brightness={brightness} frameId={frameId}>
      <div className={`text-center ${isVeryCompact ? 'space-y-1.5' : isCompact ? 'space-y-2' : 'space-y-3'}`} dir="rtl">
        <SynagogueEmblem size={isVeryCompact ? "small" : "medium"} themeId={themeId} />

        <div>
          <h1 className={`${theme.titleFont} ${isVeryCompact ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} font-bold leading-tight`} style={{ color: theme.titleColor }}>
            {isHolidayMode && holidayName ? `זמני תפילה - ${holidayName}` : 'זמני תפילה'} {bilingualMode && <span className="block text-xl font-normal mt-1">Prayer Times</span>}
          </h1>
          {parasha && (
            <h2 className={`${theme.titleFont} ${isVeryCompact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'} font-bold mt-1 leading-tight`} style={{ color: theme.titleColor }}>
              {combineWithShabbat && isHolidayMode ? `שבת קודש · ${parasha}` : parasha}
            </h2>
          )}
          {showRoshChodesh && isRoshChodesh && (
            <p className={`${theme.titleFont} text-base md:text-lg font-bold mt-1`} style={{ color: theme.accentColor }}>🌙 שבת ראש חודש</p>
          )}
          {specialShabbat && (
            <p className={`${theme.titleFont} text-base md:text-lg font-bold mt-1`} style={{ color: theme.accentColor }}>✡️ {specialShabbat}</p>
          )}

          {/* Smart Holiday Badges */}
          {isHolidayMode && showEruvTavshilin && eruvTavshilinText?.trim() && (
            <div data-capture-badge="true" className="my-1.5 mx-auto max-w-md px-3.5 py-1.5 rounded-lg border text-sm font-semibold shadow-xs flex items-center justify-center gap-1.5 leading-normal"
                 style={{ backgroundColor: `${theme.accentColor}15`, borderColor: `${theme.accentColor}40`, color: theme.titleColor }}>
              <span>🍲</span>
              <span data-capture-text="true">{eruvTavshilinText}</span>
            </div>
          )}
          {(isHolidayMode || specialShabbat?.includes('כיפור')) && showYizkorBadge && yizkorBadgeText?.trim() && (
            <div data-capture-badge="true" className="my-1.5 mx-auto max-w-md px-3.5 py-1.5 rounded-lg border text-sm font-semibold shadow-xs flex items-center justify-center gap-1.5 leading-normal"
                 style={{ backgroundColor: `${theme.accentColor}15`, borderColor: `${theme.accentColor}40`, color: theme.titleColor }}>
              <span>🕯️</span>
              <span data-capture-text="true">{yizkorBadgeText}</span>
            </div>
          )}

          {haftarah && <p className="text-sm md:text-base mt-1 font-medium" style={{ color: theme.accentColor }}>הפטרה: {haftarah}</p>}
          {showHebrewDate && hebrewDateB && (
            <p className="text-sm md:text-base mt-0.5 font-frank font-semibold" style={{ color: theme.accentColor }}>
              <span>{hebrewDateB}</span>
            </p>
          )}
          {showHebrewDate && gregorianDateB && (
            <p className="text-xs md:text-sm mt-0.5 font-medium" style={{ color: theme.accentColor, opacity: 0.85 }}>
              <span>{formatGregorianDateSafe(gregorianDateB)}</span>
            </p>
          )}
        </div>

        <Divider theme={theme} />

        {(!prayerRows || prayerRows.length === 0) ? (
          <div className="space-y-4 px-2 md:px-6 py-8" style={{ color: theme.titleColor }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-3">
                <div className="h-6 w-32 rounded bg-current/10 animate-pulse" />
                <div className="h-6 w-16 rounded bg-current/10 animate-pulse" />
              </div>
            ))}
            <p className="text-center text-sm mt-4 opacity-50 italic">יש להזין זמני תפילה בעורך כדי שיופיעו כאן</p>
          </div>
        ) : (
          <div className={`space-y-1.5 px-1.5 md:px-5 ${isVeryCompact ? 'space-y-1' : ''}`}>
            {prayerRows.map((row, i) => (
              row.isHeader ? (
                // Holiday/section header — always show, no time needed
                <div key={i} className={`flex items-center gap-2.5 ${i === 0 ? 'mt-2 mb-1.5' : 'mt-3 mb-2'} py-0.5`}>
                  <div className="flex-1 h-px" style={{ background: theme.dividerColor, opacity: 0.5 }} />
                  <span 
                    data-capture-badge="true"
                    className={`${theme.titleFont || 'font-frank'} text-base md:text-lg font-bold px-4 py-1.5 rounded-full leading-normal inline-flex items-center justify-center shadow-2xs`} 
                    style={{ color: theme.accentColor, backgroundColor: `${theme.accentColor}18` }}
                  >
                    <span data-capture-text="true">{row.label}</span>
                  </span>
                  <div className="flex-1 h-px" style={{ background: theme.dividerColor, opacity: 0.5 }} />
                </div>
              ) : row.isNote ? (
                // Free text note row (no time)
                <div key={i} className="text-center py-1 px-3 my-0.5">
                  <span 
                    data-capture-badge="true"
                    className="text-base md:text-lg font-bold italic inline-flex items-center justify-center px-4 py-1.5 rounded-full leading-normal" 
                    style={{ color: theme.accentColor, backgroundColor: `${theme.accentColor}12` }}
                  >
                    <span data-capture-text="true">{row.label}</span>
                  </span>
                </div>
              ) : !row.time ? (
                // Label-only row (e.g. קידושא רבא)
                <div key={i} data-capture-badge="true" className="text-center py-2 px-4 my-0.5 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.accentColor}10` }}>
                  <span data-capture-text="true" className={`${theme.bodyFont || ''} text-lg md:text-xl font-bold leading-normal`} style={{ color: theme.titleColor }}>{row.label}</span>
                </div>
              ) : (
                <div
                  key={i}
                  data-capture-row="true"
                  className={`flex items-center justify-between ${rowPad} rounded-lg transition-colors`}
                  style={{ backgroundColor: i % 2 === 0 ? theme.rowEvenBg : 'transparent' }}
                >
                  <span 
                    contentEditable={!!onUpdateData}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      if (onUpdateData && val && val !== row.label) {
                        const updated = (prayerRows || []).map((r, idx) => idx === i ? { ...r, label: val } : r);
                        onUpdateData({ prayerRows: updated });
                      }
                    }}
                    data-capture-text="true"
                    className={`${theme.bodyFont || ''} ${labelFont} leading-normal flex flex-col justify-center text-right outline-none ${onUpdateData ? 'hover:ring-1 hover:ring-primary/40 rounded px-1 cursor-text transition-all' : ''}`} 
                    style={{ color: theme.titleColor }}
                    title={onUpdateData ? "✏️ לחץ לעריכה ישירה" : undefined}
                  >
                    <span>{row.label}</span>
                    {bilingualMode && BILINGUAL_LABELS[row.label] && (
                      <span className="block text-xs font-normal opacity-70 mt-0.5 leading-tight">{BILINGUAL_LABELS[row.label]}</span>
                    )}
                  </span>
                  
                  {/* Dynamic leader dots spanning space proportionally */}
                  <div className="flex-1 mx-3 border-b border-dotted self-center opacity-40 min-w-4" style={{ borderColor: theme.accentColor }} />
                  
                  <span 
                    contentEditable={!!onUpdateData}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      if (onUpdateData && val !== row.time) {
                        const updated = (prayerRows || []).map((r, idx) => idx === i ? { ...r, time: val } : r);
                        onUpdateData({ prayerRows: updated });
                      }
                    }}
                    data-capture-text="true"
                    className={`${theme.timeFont || 'font-frank'} ${timeFont} tabular-nums leading-normal flex items-center self-center outline-none shrink-0 ${onUpdateData ? 'hover:ring-1 hover:ring-primary/40 rounded px-1.5 cursor-text transition-all' : ''}`} 
                    style={{ color: theme.titleColor }}
                    title={onUpdateData ? "✏️ לחץ לעריכה ישירה של השעה" : undefined}
                  >
                    {row.time}
                  </span>
                </div>
              )
            ))}
          </div>
        )}

        {/* Weekday times */}
        {weekdayRows?.some(r => r.time) && (
          <>
            <Divider theme={theme} />
            <div>
              <h3 className={`${theme.titleFont} text-lg font-bold mb-1`} style={{ color: theme.titleColor }}>
                ימות החול
              </h3>
              <div className="space-y-1 px-1.5 md:px-5">
                {weekdayRows.filter(r => r.label && r.time).map((row, i) => (
                  <div key={i} data-capture-row="true" className="flex items-center justify-between py-2 px-4 rounded-lg text-base md:text-lg leading-normal"
                    style={{ backgroundColor: i % 2 === 0 ? theme.rowEvenBg : 'transparent' }}>
                    <span data-capture-text="true" className="font-semibold flex items-center" style={{ color: theme.titleColor }}>{row.label}</span>
                    <span data-capture-text="true" className={`${theme.timeFont} font-bold tabular-nums flex items-center`} style={{ color: theme.titleColor }}>{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {(showZmanimOnPoster && zmanimDisplay?.length > 0) && (
          <>
            <Divider theme={theme} />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`${theme.titleFont} text-base font-bold`} style={{ color: theme.titleColor }}>
                  זמני היום — {config.cityName || ''}
                </h3>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded opacity-75 border border-current" style={{ color: theme.titleColor }}>
                  לפי לוח עתים לבינה
                </span>
              </div>
              {/* Friday zmanim */}
              {zmanimDisplay.filter(z => z.day === 'friday').length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-bold mb-1 px-2" style={{ color: theme.accentColor }}>
                    📅 {isYomTov ? (labelDayA || 'ערב יו"ט') : 'שישי'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm px-2 md:px-6">
                    {zmanimDisplay.filter(z => z.day === 'friday').map(z => (
                      <div key={z.key} className="flex justify-between gap-1">
                        <span style={{ color: theme.bodyColor }}>{z.label}</span>
                        <span className={`${theme.timeFont} font-bold`} style={{ color: theme.titleColor }}>{z.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Shabbat zmanim */}
              {zmanimDisplay.filter(z => z.day === 'shabbat').length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-1 px-2" style={{ color: theme.accentColor }}>
                    ✡️ {isYomTov ? (labelDayB || 'יום טוב') : 'שבת'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm px-2 md:px-6">
                    {zmanimDisplay.filter(z => z.day === 'shabbat').map(z => (
                      <div key={z.key} className="flex justify-between gap-1">
                        <span style={{ color: theme.bodyColor }}>{z.label}</span>
                        <span className={`${theme.timeFont} font-bold`} style={{ color: theme.titleColor }}>{z.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {weeklyQuote && (
          <>
            <Divider theme={theme} />
            <div className="px-4">
              <p className={`${theme.bodyFont} text-sm italic leading-relaxed`} style={{ color: theme.bodyColor }}>
                {weeklyQuote}
              </p>
            </div>
          </>
        )}

        {yahrtzeits?.length > 0 && (
          <>
            <Divider theme={theme} />
            <div className="px-4">
              <h3 className={`${theme.titleFont} text-sm font-bold mb-1`} style={{ color: theme.titleColor }}>
                לזכר נשמות
              </h3>
              {yahrtzeits.map((y, i) => (
                <p key={i} className="text-sm" style={{ color: theme.bodyColor }}>
                  ל"ע {y.name} {y.date && `· ${y.date}`}
                </p>
              ))}
            </div>
          </>
        )}

        {molad && (specialShabbat === 'שבת מברכים' || specialShabbat?.includes('מברכים')) && (
          <>
            <Divider theme={theme} />
            <div className="px-4 text-center">
              <h3 className={`${theme.titleFont || 'font-frank'} text-sm font-bold mb-0.5`} style={{ color: theme.titleColor }}>מולד החודש</h3>
              <p className={`${theme.timeFont || 'font-frank'} text-lg font-bold`} style={{ color: theme.titleColor }}>{molad}</p>
            </div>
          </>
        )}

        {/* Structured Announcements & General Announcements */}
        {((activeAnnouncements && activeAnnouncements.length > 0) || announcements) && (
          <>
            <Divider theme={theme} />
            <div className="px-2 md:px-5 text-right">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-px" style={{ backgroundColor: theme.accentColor, opacity: 0.6 }} />
                <h3 
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const val = e.currentTarget.innerText.trim();
                    if (onUpdateData && val) onUpdateData({ announcementsSectionTitle: val });
                  }}
                  data-capture-text="true"
                  className={`${theme.titleFont || 'font-frank'} text-lg md:text-xl font-bold tracking-wide outline-none ${onUpdateData ? 'hover:ring-1 hover:ring-primary/40 rounded px-1.5 py-0.5 cursor-text transition-all' : ''}`} 
                  style={{ color: theme.titleColor }}
                  title={onUpdateData ? "✏️ לחץ לעריכה ישירה על המודעה" : undefined}
                >
                  {announcementsSectionTitle || 'הודעות ואירועי השבת'}
                </h3>
                <div className="w-8 h-px" style={{ backgroundColor: theme.accentColor, opacity: 0.6 }} />
              </div>

              {/* Grid of structured announcements */}
              {activeAnnouncements.length > 0 && (
                <div className={`grid gap-2.5 text-right ${activeAnnouncements.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {activeAnnouncements.map((ann, idx) => {
                    const total = activeAnnouncements.length;
                    const isLastOdd = total % 2 !== 0 && idx === total - 1;
                    const pref = ann.layout || (ann.fullWidth ? 'full' : 'auto');
                    // Should this card span across full width?
                    const isFullWidth = pref === 'full' || (pref === 'auto' && isLastOdd);

                    return (
                      <div
                        key={ann.id || idx}
                        data-capture-card="true"
                        className={`p-3 rounded-xl transition-all relative group ${
                          isFullWidth && total > 1 
                            ? 'md:col-span-2 md:max-w-[95%] md:mx-auto w-full text-center' 
                            : ''
                        }`}
                        style={{
                          backgroundColor: theme.rowEvenBg || 'rgba(0,0,0,0.03)',
                          border: `1px solid ${theme.accentColor}35`,
                        }}
                      >
                        {/* Inline quick layout toggle if interactive */}
                        {onUpdateData && (
                          <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-background/90 rounded-md p-0.5 shadow-xs border border-border/80">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = isFullWidth ? 'half' : 'full';
                                const updated = (structuredAnnouncements || []).map(a => 
                                  a.id === ann.id ? { ...a, layout: next, fullWidth: next === 'full' } : a
                                );
                                onUpdateData({ structuredAnnouncements: updated });
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-0.5"
                              title={isFullWidth ? "שנה לחצי עמודה" : "מרכז לרוחב מלא"}
                            >
                              {isFullWidth ? '½ עמודה' : '↔️ מרכז'}
                            </button>
                          </div>
                        )}

                        <div className={`flex items-center gap-2 mb-1.5 border-b pb-2 min-h-[30px] ${isFullWidth && total > 1 ? 'justify-center' : ''}`} style={{ borderColor: `${theme.accentColor}25` }}>
                          <span className="text-lg shrink-0 select-none">{ann.icon || '📢'}</span>
                          <span 
                            contentEditable={!!onUpdateData}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const val = e.currentTarget.innerText.trim();
                              if (onUpdateData && val) {
                                const updated = (structuredAnnouncements || []).map(a => a.id === ann.id ? { ...a, title: val } : a);
                                onUpdateData({ structuredAnnouncements: updated });
                              }
                            }}
                            data-capture-text="true"
                            className={`${theme.titleFont || 'font-frank'} text-base md:text-lg font-bold leading-normal outline-none ${onUpdateData ? 'hover:ring-1 hover:ring-primary/40 rounded px-1 cursor-text' : ''}`} 
                            style={{ color: theme.titleColor, overflow: 'visible' }}
                            title={onUpdateData ? "✏️ לחץ לעריכה ישירה של הכותרת" : undefined}
                          >
                            {ann.title}
                          </span>
                        </div>
                        <p 
                          contentEditable={!!onUpdateData}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const val = e.currentTarget.innerText.trim();
                            if (onUpdateData) {
                              const updated = (structuredAnnouncements || []).map(a => a.id === ann.id ? { ...a, content: val } : a);
                              onUpdateData({ structuredAnnouncements: updated });
                            }
                          }}
                          data-capture-text="true"
                          className={`${theme.bodyFont || 'font-heebo'} text-sm md:text-base leading-relaxed whitespace-pre-wrap outline-none ${onUpdateData ? 'hover:ring-1 hover:ring-primary/40 rounded px-1 cursor-text' : ''} ${isFullWidth && total > 1 ? 'text-center' : ''}`} 
                          style={{ color: theme.bodyColor }}
                          title={onUpdateData ? "✏️ לחץ לעריכה ישירה של תוכן ההודעה" : undefined}
                        >
                          {ann.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legacy/Freeform text if present */}
              {announcements && (
                <div className={activeAnnouncements.length > 0 ? 'mt-2.5 pt-2.5 border-t border-dashed' : ''} style={{ borderColor: `${theme.accentColor}30` }}>
                  <p 
                    contentEditable={!!onUpdateData}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const val = e.currentTarget.innerText.trim();
                      if (onUpdateData) onUpdateData({ announcements: val });
                    }}
                    data-capture-text="true"
                    className={`${theme.bodyFont || 'font-heebo'} text-sm md:text-base leading-relaxed whitespace-pre-wrap text-center outline-none ${onUpdateData ? 'hover:ring-1 hover:ring-primary/40 rounded px-1 cursor-text' : ''}`} 
                    style={{ color: theme.bodyColor }}
                    title={onUpdateData ? "✏️ לחץ לעריכה ישירה על המודעה" : undefined}
                  >
                    {announcements}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {showQR && synagogueUrl && (
          <>
            <Divider theme={theme} />
            <div className="flex flex-col items-center gap-1">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(synagogueUrl)}`} alt="QR" className="w-16 h-16" crossOrigin="anonymous" />
              <p className="text-xs" style={{ color: theme.accentColor }}>{synagogueUrl}</p>
            </div>
          </>
        )}

        <div className="pt-1.5">
          <p className="text-sm font-bold" style={{ color: theme.accentColor }}>
            {data?.synagogueName || config?.synagogueName || overrideSynagogueName || 'בית הכנסת'}
          </p>
          <div data-capture-badge="true" className="mt-2 py-1.5 px-4 rounded-full inline-flex items-center justify-center leading-normal" style={{ backgroundColor: theme.rowEvenBg, color: theme.accentColor, fontSize: '10px', opacity: 0.9, letterSpacing: '0.02em' }}>
            <span data-capture-text="true">הופק באמצעות המחולל מבית <strong>YL.AI</strong> · פתרונות AI לעסקים ומוסדות · <span dir="ltr">050-733-3117</span></span>
          </div>
        </div>
      </div>
    </PosterFrame>
  );
}