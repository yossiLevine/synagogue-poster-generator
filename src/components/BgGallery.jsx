import { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';

const SOLID_COLORS = [
  { label: 'לבן', color: '#ffffff' },
  { label: 'שמנת', color: '#fdf8f0' },
  { label: 'קרם', color: '#faf3e0' },
  { label: 'בז\'', color: '#f5f0e8' },
  { label: 'שנהב', color: '#fffff0' },
  { label: 'פנינה', color: '#f8f4ef' },
  { label: 'לבנדר', color: '#f5f0ff' },
  { label: 'אפור בהיר', color: '#f3f4f6' },
  { label: 'כחול פסטל', color: '#eff6ff' },
  { label: 'תכלת', color: '#e0f2fe' },
  { label: 'ירוק פסטל', color: '#f0fdf4' },
  { label: 'ורוד', color: '#fdf2f8' },
  { label: 'כחול כהה', color: '#1a2e5a' },
  { label: 'כחול רויאל', color: '#1e3a8a' },
  { label: 'ירוק כהה', color: '#14532d' },
  { label: 'שחור', color: '#111111' },
];

const PRESET_IMAGES = [
  { label: 'ירושלים', url: 'https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=800&q=80' },
  { label: 'ספר תורה', url: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80' },
  { label: 'שקיעה', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80' },
  { label: 'נרות שבת', url: 'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=800&q=80' },
  { label: 'כנרת', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80' },
  { label: 'מדבר', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80' },
  { label: 'הר', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
  { label: 'שחר', url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80' },
  { label: 'כוכבים', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80' },
  { label: 'ים התיכון', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
  { label: 'עצים', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' },
  { label: 'שחר הרים', url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80' },
  { label: 'ענבים', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80' },
  { label: 'כוס קידוש', url: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=800&q=80' },
  { label: 'שדה חיטה', url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' },
  { label: 'נהר', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80' },
  { label: 'זית', url: 'https://images.unsplash.com/photo-1467020273280-dde5db351e18?w=800&q=80' },
  { label: 'שקיעה בים', url: 'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?w=800&q=80' },
];

export default function BgGallery({ onSelect, currentBg, onHide }) {
  const [showImages, setShowImages] = useState(true);

  return (
    <div dir="rtl" className="space-y-3">
      {/* Solid colors */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">רקעים חלקים:</p>
        <div className="grid grid-cols-8 gap-1 flex-wrap">
          {SOLID_COLORS.map(c => (
            <button
              key={c.color}
              onClick={() => onSelect({ type: 'solid', color: c.color })}
              title={c.label}
              className="h-7 rounded border-2 border-border hover:border-primary transition-colors"
              style={{ backgroundColor: c.color }}
            />
          ))}
        </div>
      </div>

      {/* Image gallery toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">תמונות רקע מוכנות:</p>
        <button
          onClick={() => setShowImages(v => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {showImages ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {showImages ? 'הסתר' : 'הצג'}
        </button>
      </div>

      {showImages && (
        <div className="grid grid-cols-4 gap-1.5">
          {PRESET_IMAGES.map(img => (
            <button
              key={img.url}
              onClick={() => onSelect({ type: 'image', url: img.url })}
              className={`group relative rounded-lg overflow-hidden border-2 transition-colors aspect-square ${currentBg === img.url ? 'border-primary' : 'border-border hover:border-primary/60'}`}
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">{img.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}