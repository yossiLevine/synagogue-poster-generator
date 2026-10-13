import { THEMES } from '@/lib/themes';
import SynagogueEmblem from './SynagogueEmblem';
import { getConfig } from '@/lib/synagogueConfig';

export default function SignPoster({ 
  signData = {}, 
  themeId = 'classic',
  id = 'sign-print-area' 
}) {
  const {
    icon = '📢',
    title = 'הודעה חשובה',
    subtitle = '',
    content = '',
    location = '',
    time = '',
    footerNote = '',
    customBadge = '',
  } = signData;

  const theme = THEMES[themeId] || THEMES.classic;
  const config = getConfig();

  return (
    <div
      id={id}
      dir="rtl"
      className="relative mx-auto w-full max-w-[650px] min-h-[850px] bg-white text-center p-6 sm:p-10 flex flex-col justify-between shadow-2xl rounded-2xl"
      style={{
        background: theme.bg || '#ffffff',
        border: `8px double ${theme.accentColor || '#c5a55a'}`,
        boxShadow: `0 0 0 2px ${theme.outerBorderColor || '#1a2e5a'}, 0 20px 50px rgba(0,0,0,0.15)`,
      }}
    >
      {/* Corner Ornaments */}
      <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: theme.accentColor }} />
      <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: theme.accentColor }} />
      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: theme.accentColor }} />
      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: theme.accentColor }} />

      {/* Top Header: Synagogue Name & Emblem */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-px" style={{ backgroundColor: theme.accentColor }} />
          <SynagogueEmblem size="small" themeId={themeId} />
          <div className="w-12 h-px" style={{ backgroundColor: theme.accentColor }} />
        </div>
        <p className="text-sm sm:text-base font-bold tracking-wide" style={{ color: theme.accentColor }}>
          {config.synagogueName || 'בית הכנסת'}
        </p>
      </div>

      {/* Center Main Attraction */}
      <div className="my-auto space-y-6 py-4">
        {/* Big Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/70 shadow-md border mx-auto text-4xl sm:text-5xl"
          style={{ borderColor: `${theme.accentColor}40` }}>
          <span>{icon}</span>
        </div>

        {customBadge && (
          <div>
            <span 
              className="inline-block px-4 py-1 rounded-full text-xs sm:text-sm font-bold tracking-wider"
              style={{ backgroundColor: `${theme.accentColor}20`, color: theme.titleColor }}
            >
              {customBadge}
            </span>
          </div>
        )}

        {/* Massive Headline */}
        <h1 
          className={`${theme.titleFont || 'font-frank'} text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight px-4`}
          style={{ color: theme.titleColor }}
        >
          {title}
        </h1>

        {/* Subtitle / Occasion */}
        {subtitle && (
          <h2 
            className={`${theme.titleFont || 'font-frank'} text-2xl sm:text-3xl font-bold px-4`}
            style={{ color: theme.accentColor }}
          >
            {subtitle}
          </h2>
        )}

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 px-12">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${theme.accentColor})` }} />
          <span style={{ color: theme.accentColor }}>✦ ✦ ✦</span>
          <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.accentColor})` }} />
        </div>

        {/* Main Body Description */}
        {content && (
          <div className="px-6 max-w-lg mx-auto">
            <p 
              className={`${theme.bodyFont || 'font-heebo'} text-lg sm:text-xl md:text-2xl leading-relaxed whitespace-pre-wrap font-medium`}
              style={{ color: theme.bodyColor }}
            >
              {content}
            </p>
          </div>
        )}

        {/* Time and Location Highlight Cards */}
        {(time || location) && (
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {time && (
              <div 
                className="px-5 py-2.5 rounded-xl border shadow-xs flex items-center gap-2"
                style={{ backgroundColor: `${theme.accentColor}12`, borderColor: `${theme.accentColor}40` }}
              >
                <span className="text-base font-bold" style={{ color: theme.titleColor }}>⏰ שעה:</span>
                <span className={`${theme.timeFont || 'font-frank'} text-xl sm:text-2xl font-bold`} style={{ color: theme.titleColor }}>
                  {time}
                </span>
              </div>
            )}
            {location && (
              <div 
                className="px-5 py-2.5 rounded-xl border shadow-xs flex items-center gap-2"
                style={{ backgroundColor: `${theme.accentColor}12`, borderColor: `${theme.accentColor}40` }}
              >
                <span className="text-base font-bold" style={{ color: theme.titleColor }}>📍 מיקום:</span>
                <span className={`${theme.bodyFont || 'font-heebo'} text-lg sm:text-xl font-bold`} style={{ color: theme.titleColor }}>
                  {location}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Note */}
      <div className="pt-4 border-t" style={{ borderColor: `${theme.accentColor}30` }}>
        {footerNote ? (
          <p className="text-sm font-semibold" style={{ color: theme.accentColor }}>
            {footerNote}
          </p>
        ) : (
          <p className="text-xs opacity-75 font-medium" style={{ color: theme.bodyColor }}>
            בברכת שבת שלום ומבורך · גבאי בית הכנסת
          </p>
        )}
      </div>
    </div>
  );
}
