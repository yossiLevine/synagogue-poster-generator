import { useState, useEffect } from 'react';
import { THEMES } from '@/lib/themes';
import { getConfig } from '@/lib/synagogueConfig';

export default function SynagogueEmblem({ size = 'large', themeId = 'classic' }) {
  const [config, setConfig] = useState(() => getConfig());

  useEffect(() => {
    const handler = () => setConfig(getConfig());
    window.addEventListener('synagogue-config-changed', handler);
    return () => window.removeEventListener('synagogue-config-changed', handler);
  }, []);

  const theme = THEMES[themeId] || THEMES.classic;
  const isDark = ['dark', 'royal'].includes(themeId);

  const baseSize = config.logoSize || 120;
  const sizeMap = { small: Math.round(baseSize * 0.6), medium: baseSize, large: baseSize };
  const px = sizeMap[size] || baseSize;

  // If showLogo is explicitly false, render nothing
  const showLogo = config.showLogo !== false;
  const DEFAULT_LOGO = 'https://media.base44.com/images/public/user_68540e8149644804602ba561/cb30b9f06_2.jpg';
  const imgUrl = config.logoUrl || DEFAULT_LOGO;
  const shape = config.logoShape || 'circle';
  const posX  = config.logoPosX  ?? 50;
  const posY  = config.logoPosY  ?? 50;
  const borderWidth = config.logoBorderWidth ?? 2;
  const showGlow    = config.logoGlow !== false;

  const borderRadius =
    shape === 'circle' ? '50%' :
    shape === 'square' ? '10px' :
    '0';

  const logoScale = config.logoScale || 1;
  // translate offset: move image within clipped container based on posX/posY
  const tx = (posX - 50) * (logoScale - 1);
  const ty = (posY - 50) * (logoScale - 1);

  if (!showLogo) return null;

  return (
    <div
      className="mx-auto flex-shrink-0 relative"
      style={{
        width: px,
        height: px,
        borderRadius,
        overflow: 'hidden',
        boxShadow: borderWidth > 0
          ? (showGlow
            ? `0 0 0 ${borderWidth}px ${theme.accentColor}70, 0 0 14px ${theme.accentColor}40`
            : `0 0 0 ${borderWidth}px ${theme.accentColor}`)
          : 'none',
      }}
    >
      <img
        src={imgUrl}
        alt="סמל בית הכנסת"
        crossOrigin="anonymous"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          objectFit: 'cover',
          transform: `scale(${logoScale}) translate(${-tx / logoScale}%, ${-ty / logoScale}%)`,
          transformOrigin: 'center center',
          mixBlendMode: isDark ? 'screen' : 'normal',
        }}
      />
    </div>
  );
}