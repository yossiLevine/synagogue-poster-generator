import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ImagePlus, X } from 'lucide-react';
import BgGallery from './BgGallery';

export default function BgImageUpload({ bgImage, bgOpacity, onImageChange, onOpacityChange }) {
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onImageChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (item) => {
    if (item.type === 'solid') {
      // Store solid color as special value
      onImageChange({ solid: item.color });
    } else {
      onImageChange(item.url);
    }
  };

  const currentUrl = typeof bgImage === 'string' ? bgImage : null;
  const isSolid = bgImage && typeof bgImage === 'object' && bgImage.solid;

  return (
    <div dir="rtl" className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-primary" />
          תמונת רקע למודעה
        </Label>
        {bgImage && (
          <Button variant="ghost" size="sm" onClick={() => onImageChange(null)} className="text-destructive gap-1 h-7">
            <X className="w-3.5 h-3.5" /> הסר
          </Button>
        )}
      </div>

      {/* Preset gallery + solid colors */}
      <BgGallery onSelect={handleGallerySelect} currentBg={currentUrl} />

      {/* Upload custom */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
      >
        {currentUrl ? (
          <div className="relative h-20 rounded-xl overflow-hidden">
            <img src={currentUrl} alt="רקע" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-sm">לחץ להחלפה</div>
          </div>
        ) : isSolid ? (
          <div className="h-16 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold" style={{ backgroundColor: bgImage.solid }}>
            <span style={{ color: bgImage.solid === '#ffffff' || bgImage.solid === '#fdf8f0' || bgImage.solid === '#f5f0e8' || bgImage.solid === '#f3f4f6' || bgImage.solid === '#eff6ff' || bgImage.solid === '#f0fdf4' ? '#374151' : '#ffffff' }}>
              רקע צבעוני פעיל
            </span>
          </div>
        ) : (
          <div className="h-12 flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <ImagePlus className="w-4 h-4" /> העלה תמונה מותאמת אישית
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {bgImage && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold text-muted-foreground">אטימות (שקיפות הרקע)</Label>
            <span className="text-xs text-muted-foreground">{Math.round(bgOpacity * 100)}%</span>
          </div>
          <Slider min={3} max={100} step={3} value={[Math.round(bgOpacity * 100)]} onValueChange={([v]) => onOpacityChange(v / 100)} />
        </div>
      )}
    </div>
  );
}