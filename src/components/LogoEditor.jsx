import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';
import { getConfig, saveConfig, loadConfig } from '@/lib/synagogueConfig';

const DEFAULT_LOGO = 'https://media.base44.com/images/public/user_68540e8149644804602ba561/cb30b9f06_2.jpg';
const PREVIEW_SIZE = 160;

function LogoCropPreview({ imgUrl, shape, scale, posX, posY, borderWidth, showGlow, onDrag, onScaleChange }) {
  const containerRef = useRef();
  const dragStart = useRef(null);

  const borderRadius = shape === 'circle' ? '50%' : shape === 'square' ? '10px' : '0';

  const handleMouseDown = (e) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY, posX, posY };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    const t = e.touches[0];
    dragStart.current = { x: t.clientX, y: t.clientY, posX, posY };
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // Convert pixel drag to percentage offset (relative to preview size * scale)
    const range = PREVIEW_SIZE * (scale - 1) / 2;
    if (range <= 0) return;
    const newX = Math.max(0, Math.min(100, dragStart.current.posX - (dx / range) * 50));
    const newY = Math.max(0, Math.min(100, dragStart.current.posY - (dy / range) * 50));
    onDrag(newX, newY);
  }, [scale, onDrag]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!dragStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.x;
    const dy = t.clientY - dragStart.current.y;
    const range = PREVIEW_SIZE * (scale - 1) / 2;
    if (range <= 0) return;
    const newX = Math.max(0, Math.min(100, dragStart.current.posX - (dx / range) * 50));
    const newY = Math.max(0, Math.min(100, dragStart.current.posY - (dy / range) * 50));
    onDrag(newX, newY);
  }, [scale, onDrag]);

  const handleMouseUp = () => {
    dragStart.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchEnd = () => {
    dragStart.current = null;
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleTouchEnd);
  };

  // translate: move image center based on posX/posY (0-100 → -50%..+50% of overflow)
  const tx = (posX - 50) * (scale - 1);
  const ty = (posY - 50) * (scale - 1);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs text-muted-foreground self-start">גרור להזזה · גלגל העכבר / כפתורים להגדלה</p>

      {/* Clipped circle container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="relative select-none flex-shrink-0"
        style={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          borderRadius,
          overflow: 'hidden',
          cursor: scale > 1 ? 'grab' : 'default',
          boxShadow: borderWidth > 0
            ? (showGlow
              ? `0 0 0 ${borderWidth}px #b8975488, 0 0 14px #b8975440`
              : `0 0 0 ${borderWidth}px #b89754`)
            : 'none',
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.1 : -0.1;
          onScaleChange(Math.max(1, Math.min(3, scale + delta)));
        }}
      >
        <img
          src={imgUrl}
          alt="תצוגה מקדימה"
          crossOrigin="anonymous"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
            transform: `scale(${scale}) translate(${-tx / scale}%, ${-ty / scale}%)`,
            transformOrigin: 'center center',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-2 w-full">
        <button onClick={() => onScaleChange(Math.max(1, scale - 0.1))} className="p-1 rounded border border-border hover:bg-muted">
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <input
          type="range" min="100" max="300" step="5"
          value={Math.round(scale * 100)}
          onChange={e => onScaleChange(parseInt(e.target.value) / 100)}
          className="flex-1"
        />
        <button onClick={() => onScaleChange(Math.min(3, scale + 0.1))} className="p-1 rounded border border-border hover:bg-muted">
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-bold w-10 text-center">{Math.round(scale * 100)}%</span>
      </div>

      <p className="text-xs text-muted-foreground">
        {scale > 1 ? 'גרור את התמונה להזזה בתוך העיגול' : 'הגדל כדי להתאים את הסמל לעיגול'}
      </p>
    </div>
  );
}

export default function LogoEditor() {
  const [config, setConfig] = useState(() => getConfig());
  const fileRef = useRef();

  useEffect(() => {
    loadConfig().then(cfg => setConfig(cfg));
    const handler = () => setConfig(getConfig());
    window.addEventListener('synagogue-config-changed', handler);
    return () => window.removeEventListener('synagogue-config-changed', handler);
  }, []);

  const update = (key, value) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    saveConfig(next);
  };

  const updateMulti = (patches) => {
    const next = { ...config, ...patches };
    setConfig(next);
    saveConfig(next);
  };

  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { uploadFileToStorage } = await import('@/lib/storage');
      const file_url = await uploadFileToStorage(file, 'logos');
      update('logoUrl', file_url);
    } catch (err) {
      console.warn('Storage logo upload failed, using compressed local fallback:', err);
      // Compress fallback image to max 400x400 to protect localStorage quota
      try {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 400;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
              if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
              else { w = Math.round((w * maxDim) / h); h = maxDim; }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            update('logoUrl', compressed);
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      } catch (e2) {
        console.error('Fallback image compression failed:', e2);
      }
    } finally {
      setUploading(false);
    }
  };

  const effectiveLogo = config.logoUrl || DEFAULT_LOGO;
  const showLogo = config.showLogo !== false;
  const shape = config.logoShape || 'circle';
  const scale = config.logoScale || 1;
  const posX = config.logoPosX ?? 50;
  const posY = config.logoPosY ?? 50;
  const borderWidth = config.logoBorderWidth ?? 2;
  const showGlow = config.logoGlow !== false;

  const borderRadius =
    shape === 'circle' ? '50%' :
    shape === 'square' ? '8px' : '4px';

  return (
    <div className="space-y-3" dir="rtl">
      {/* Show/Hide toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">סמל / לוגו</Label>
        <div className="flex gap-1.5">
          {[
            { v: true,  label: '✓ הצג' },
            { v: false, label: '✕ הסתר' },
          ].map(opt => (
            <button
              key={String(opt.v)}
              onClick={() => update('showLogo', opt.v)}
              className={`text-xs py-1 px-2.5 rounded border transition-colors ${
                showLogo === opt.v
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {showLogo && (
        <div className="space-y-3 bg-muted/30 rounded-lg p-3">

          {/* Upload row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img
                src={effectiveLogo}
                alt="לוגו"
                className="border border-border bg-muted"
                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius }}
              />
              {config.logoUrl && (
                <button
                  onClick={() => update('logoUrl', null)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center"
                  title="הסר לוגו"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5 text-xs">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'מעלה...' : config.logoUrl ? 'החלף לוגו' : 'העלה לוגו'}
              </Button>
              <p className="text-xs text-muted-foreground">{config.logoUrl ? 'לחץ X לחזרה לברירת מחדל' : 'מציג סמל ברירת מחדל'}</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </div>

          {/* Interactive crop/zoom preview */}
          <div className="bg-white border border-dashed border-border rounded-lg p-3 flex flex-col items-center">
            <LogoCropPreview
              imgUrl={effectiveLogo}
              shape={shape}
              scale={scale}
              posX={posX}
              posY={posY}
              borderWidth={borderWidth}
              showGlow={showGlow}
              onDrag={(x, y) => updateMulti({ logoPosX: Math.round(x), logoPosY: Math.round(y) })}
              onScaleChange={(s) => update('logoScale', Math.round(s * 100) / 100)}
            />

            {/* Reset crop */}
            <button
              onClick={() => updateMulti({ logoScale: 1, logoPosX: 50, logoPosY: 50 })}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> איפוס מיקום וזום
            </button>
          </div>

          {/* Size */}
          <div>
            <div className="flex justify-between mb-0.5">
              <Label className="text-xs text-muted-foreground">גודל סמל במודעה</Label>
              <span className="text-xs font-bold">{config.logoSize || 120}px</span>
            </div>
            <input type="range" min="40" max="280" step="5"
              value={config.logoSize || 120}
              onChange={e => update('logoSize', parseInt(e.target.value))}
              className="w-full" />
          </div>

          {/* Shape */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">צורת חיתוך</Label>
            <div className="flex gap-1.5">
              {[
                { v: 'circle', label: '⭕ עיגול' },
                { v: 'square', label: '⬜ מרובע' },
                { v: 'none',   label: '🖼 ללא' },
              ].map(opt => (
                <button key={opt.v}
                  onClick={() => update('logoShape', opt.v)}
                  className={`flex-1 text-xs py-1.5 px-1 rounded border transition-colors ${
                    shape === opt.v
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border */}
          <div>
            <div className="flex justify-between mb-0.5">
              <Label className="text-xs text-muted-foreground">עובי מסגרת/הילה</Label>
              <span className="text-xs font-bold">{config.logoBorderWidth ?? 2}px</span>
            </div>
            <input type="range" min="0" max="10" step="1"
              value={config.logoBorderWidth ?? 2}
              onChange={e => update('logoBorderWidth', parseInt(e.target.value))}
              className="w-full" />
          </div>

          {/* Glow */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="logoGlow"
              checked={config.logoGlow !== false}
              onChange={e => update('logoGlow', e.target.checked)} />
            <Label htmlFor="logoGlow" className="text-xs cursor-pointer">הילה/זוהר סביב הסמל</Label>
          </div>
        </div>
      )}
    </div>
  );
}