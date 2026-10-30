import { useState, useEffect } from 'react';
import SynagogueEmblem from './SynagogueEmblem';
import PosterFrame from './PosterFrame';
import { THEMES } from '@/lib/themes';
import { getConfig } from '@/lib/synagogueConfig';

function Divider({ theme }) {
  return (
    <div className="flex items-center gap-3 px-4">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${theme.dividerColor}, transparent)` }} />
      <div className="w-2 h-2 rotate-45" style={{ backgroundColor: theme.dividerColor }} />
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${theme.dividerColor}, transparent)` }} />
    </div>
  );
}

const FONT_SIZE_MAP = { small: 'text-sm md:text-base', medium: 'text-lg md:text-xl', large: 'text-xl md:text-2xl' };
const TITLE_SIZE_MAP = { small: 'text-2xl md:text-3xl', medium: 'text-3xl md:text-4xl', large: 'text-4xl md:text-5xl', xlarge: 'text-5xl md:text-6xl' };
const ALIGN_MAP = { right: 'text-right', center: 'text-center', left: 'text-left' };

export default function GeneralPoster({ data, themeId = 'classic', showQR = false, synagogueUrl = '', bgImage = null, bgOpacity = 0.15, brightness = 1, frameId }) {
  const {
    title, subtitle, body, footer, fontSize = 'medium', titleSize = 'large', align = 'center',
    boldBody, italicBody, showDate, titleColor: customTitleColor, bodyColor: customBodyColor,
    highlightLines = [], extraSections = [],
  } = data;
  const theme = THEMES[themeId] || THEMES.classic;
  const [config, setConfig] = useState(() => getConfig());
  useEffect(() => {
    const handler = () => setConfig(getConfig());
    window.addEventListener('synagogue-config-changed', handler);
    return () => window.removeEventListener('synagogue-config-changed', handler);
  }, []);

  const titleCol = customTitleColor || theme.titleColor;
  const bodyCol = customBodyColor || theme.bodyColor;
  const today = new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <PosterFrame themeId={themeId} bgImage={bgImage} bgOpacity={bgOpacity} brightness={brightness} frameId={frameId}>
      <div className="text-center space-y-4" dir="rtl">
        <SynagogueEmblem size="medium" themeId={themeId} />

        {title && (
          <h1 className={`${theme.titleFont} ${TITLE_SIZE_MAP[titleSize] || TITLE_SIZE_MAP.large} font-bold leading-tight break-words px-2`} style={{ color: titleCol }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <h2 className={`${theme.titleFont} text-xl md:text-2xl break-words px-2`} style={{ color: theme.accentColor }}>
            {subtitle}
          </h2>
        )}
        {showDate && <p className="text-sm" style={{ color: theme.accentColor }}>{today}</p>}

        <Divider theme={theme} />

        {body && (
          <div className={`px-4 md:px-8 ${ALIGN_MAP[align] || 'text-center'}`}>
            <p
              className={`${theme.bodyFont} ${FONT_SIZE_MAP[fontSize] || 'text-lg md:text-xl'} leading-relaxed whitespace-pre-wrap break-words`}
              style={{ color: bodyCol, fontWeight: boldBody ? 'bold' : 'normal', fontStyle: italicBody ? 'italic' : 'normal' }}
            >
              {body}
            </p>
          </div>
        )}

        {/* Highlight lines */}
        {highlightLines.filter(h => h.text).map((h, i) => (
          <div key={i} data-capture-badge="true" className="mx-4 md:mx-8 px-4 py-2 rounded-lg text-center flex items-center justify-center"
            style={{ backgroundColor: h.color || '#fef3c7' }}>
            <p data-capture-text="true" className={`${theme.titleFont} text-lg md:text-xl font-bold break-words leading-normal`} style={{ color: theme.titleColor }}>
              {h.text}
            </p>
          </div>
        ))}

        {/* Extra sections */}
        {extraSections.filter(s => s.heading || s.text).map((s, i) => (
          <div key={i}>
            <Divider theme={theme} />
            <div className={`px-4 md:px-8 ${ALIGN_MAP[align] || 'text-center'}`}>
              {s.heading && (
                <h3 className={`${theme.titleFont} text-base md:text-lg font-bold mb-1 break-words`} style={{ color: theme.titleColor }}>
                  {s.heading}
                </h3>
              )}
              {s.text && (
                <p className={`${theme.bodyFont} text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words`} style={{ color: bodyCol }}>
                  {s.text}
                </p>
              )}
            </div>
          </div>
        ))}

        {showQR && synagogueUrl && (
          <>
            <Divider theme={theme} />
            <div className="flex flex-col items-center gap-1">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(synagogueUrl)}`} alt="QR Code" className="w-16 h-16" crossOrigin="anonymous" />
              <p className="text-xs" style={{ color: theme.accentColor }}>{synagogueUrl}</p>
            </div>
          </>
        )}

        {footer && (
          <>
            <Divider theme={theme} />
            <p className={`${theme.bodyFont} text-sm px-4`} style={{ color: theme.accentColor }}>{footer}</p>
          </>
        )}

        <div className="pt-2">
          <Divider theme={theme} />
          <p className="text-xs mt-3" style={{ color: theme.accentColor }}>{config.synagogueName}</p>
          <p className="mt-1 py-0.5 px-2 rounded-full inline-block" style={{ backgroundColor: theme.rowEvenBg, color: theme.accentColor, fontSize: '9px', opacity: 0.9 }}>
            הופק באמצעות המחולל מבית <strong>YL.AI</strong> · פתרונות AI לעסקים ומוסדות · <span dir="ltr">050-733-3117</span>
          </p>
        </div>
      </div>
    </PosterFrame>
  );
}