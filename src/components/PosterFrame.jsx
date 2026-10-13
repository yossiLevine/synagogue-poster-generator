import { THEMES } from '@/lib/themes';
import { FRAMES } from '@/components/FrameSelector';

export default function PosterFrame({ children, id, themeId = 'classic', bgImage = null, bgOpacity = 0.15, brightness = 1, frameId = 'classic' }) {
  const theme = (themeId && themeId !== 'none' && THEMES[themeId]) ? THEMES[themeId] : {
    ...THEMES.classic,
    bg: '#ffffff',
    outerBorderColor: 'transparent',
    innerBorderColor: 'transparent',
    accentColor: '#888888',
    boxShadow: 'none',
  };

  const accentColor = theme.accentColor;
  const frame = FRAMES.find(f => f.id === frameId) || FRAMES[0];

  // Replace __COLOR__ token with theme accent color in all style values
  const frameStyle = frame.style
    ? Object.fromEntries(
        Object.entries(frame.style).map(([k, v]) => [
          k,
          typeof v === 'string' ? v.replaceAll('__COLOR__', accentColor) : v,
        ])
      )
    : {};
  
  // For corner-based frames (classic/ornate), corner color always respects theme accentColor

  const isNone = frameId === 'none';
  const showCorners = frameId === 'classic' || (frameId && frameId.startsWith('ornate'));
  const cornerSize = frame.cornerSize || 0;
  const cornerWeight = frame.cornerWeight || 0;

  const bgIsSolid = bgImage && typeof bgImage === 'object' && bgImage.solid;
  const bgUrl = typeof bgImage === 'string' ? bgImage : null;
  const bgColor = bgIsSolid ? bgImage.solid : theme.bg;

  // Only clip overflow when the frame doesn't need visible overflow (outlines, shadows outside the box)
  const hasOutsideEffect = frameStyle.outline || frameStyle.outlineOffset || (frameStyle.boxShadow && frameStyle.boxShadow.includes('0 0 0'));
  const shouldClip = !hasOutsideEffect;

  return (
    <div
      id={id}
      className="relative mx-auto max-w-2xl"
      style={{
        background: bgColor,
        overflow: shouldClip ? 'hidden' : 'visible',
        filter: brightness && brightness !== 1 ? `brightness(${brightness})` : undefined,
        ...(isNone ? {} : { ...frameStyle, background: bgColor }),
      }}
    >
      {/* Background image overlay */}
      {bgUrl && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: bgOpacity,
            borderRadius: 'inherit',
          }}
        />
      )}

      {/* Corner decorations for classic / ornate frames */}
      {showCorners && cornerSize > 0 && (
        <>
          <div className="absolute top-2 right-2 z-10" style={{ width: cornerSize, height: cornerSize, borderTop: `${cornerWeight}px solid ${theme.accentColor}`, borderRight: `${cornerWeight}px solid ${theme.accentColor}` }} />
          <div className="absolute top-2 left-2 z-10" style={{ width: cornerSize, height: cornerSize, borderTop: `${cornerWeight}px solid ${theme.accentColor}`, borderLeft: `${cornerWeight}px solid ${theme.accentColor}` }} />
          <div className="absolute bottom-2 right-2 z-10" style={{ width: cornerSize, height: cornerSize, borderBottom: `${cornerWeight}px solid ${theme.accentColor}`, borderRight: `${cornerWeight}px solid ${theme.accentColor}` }} />
          <div className="absolute bottom-2 left-2 z-10" style={{ width: cornerSize, height: cornerSize, borderBottom: `${cornerWeight}px solid ${theme.accentColor}`, borderLeft: `${cornerWeight}px solid ${theme.accentColor}` }} />
        </>
      )}

      {/* Inner border + content */}
      <div
        className="relative z-10 m-1.5 sm:m-3 p-3 sm:p-6 md:p-8"
        style={{ border: `1px solid ${theme.innerBorderColor || 'transparent'}` }}
      >
        {children}
      </div>
    </div>
  );
}