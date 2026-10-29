import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Download, Loader2, Video, Sparkles, CheckCircle, RefreshCw, X } from 'lucide-react';
import { getConfig } from '@/lib/synagogueConfig';

export default function AnimatedPosterExport({ liveData, isOpen, onClose }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const cfg = getConfig();
  const parasha = liveData?.parasha || 'פרשת השבוע';
  const synName = cfg.synagogueName || 'בית הכנסת';
  const candleLighting = liveData?.shabbatInfo?.candleLighting || '18:15';
  const rows = (liveData?.prayerRows || []).filter(r => r.visible && r.label && r.time).slice(0, 6);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        try { recorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setIsGenerating(false);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen]);

  const startAnimationAndRecord = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setIsGenerating(true);
    setProgress(0);
    setVideoUrl(null);

    // Canvas dimensions (9:16 vertical ratio suitable for WhatsApp Status & Stories)
    canvas.width = 720;
    canvas.height = 1280;

    const stream = canvas.captureStream(30);
    streamRef.current = stream;
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    } catch (e) {
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      } catch (err) {
        recorder = new MediaRecorder(stream);
      }
    }
    recorderRef.current = recorder;

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setIsGenerating(false);
    };

    recorder.start();

    // Total duration: 6 seconds (180 frames at 30fps)
    const totalFrames = 180;
    let currentFrame = 0;

    const renderFrame = () => {
      if (currentFrame >= totalFrames) {
        if (recorder.state === 'recording') recorder.stop();
        return;
      }

      currentFrame++;
      setProgress(Math.round((currentFrame / totalFrames) * 100));

      const t = currentFrame / 30; // elapsed seconds

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#0a192f');
      bgGrad.addColorStop(0.5, '#172a45');
      bgGrad.addColorStop(1, '#020c1b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold ornate border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
      ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

      // Corner stars
      const drawCornerStar = (x, y) => {
        ctx.fillStyle = '#d4af37';
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', x, y);
      };
      drawCornerStar(50, 50);
      drawCornerStar(canvas.width - 50, 50);
      drawCornerStar(50, canvas.height - 50);
      drawCornerStar(canvas.width - 50, canvas.height - 50);

      // Header: Synagogue name (Fade in at 0.2s)
      const headerAlpha = Math.min(1, Math.max(0, (t - 0.2) * 2));
      ctx.save();
      ctx.globalAlpha = headerAlpha;
      ctx.fillStyle = '#e6f1ff';
      ctx.font = 'bold 36px "Frank Ruhl Libre", Arial, serif';
      ctx.textAlign = 'center';
      ctx.fillText(synName, canvas.width / 2, 110);
      ctx.restore();

      // Title: זמני תפילה (Scale up at 0.5s)
      const titleAlpha = Math.min(1, Math.max(0, (t - 0.5) * 2));
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 52px "Frank Ruhl Libre", Arial, serif';
      ctx.textAlign = 'center';
      ctx.fillText('זמני תפילה', canvas.width / 2, 180);
      ctx.restore();

      // Parasha (Fade in at 0.8s)
      const parashaAlpha = Math.min(1, Math.max(0, (t - 0.8) * 2));
      ctx.save();
      ctx.globalAlpha = parashaAlpha;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px "Frank Ruhl Libre", Arial, serif';
      ctx.textAlign = 'center';
      ctx.fillText(parasha, canvas.width / 2, 245);
      ctx.restore();

      // Candle Lighting Hero Card (Pops in at 1.2s)
      const candleAlpha = Math.min(1, Math.max(0, (t - 1.2) * 2));
      if (candleAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = candleAlpha;
        ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(80, 290, canvas.width - 160, 100, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 32px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🕯️ הדלקת נרות: ' + candleLighting, canvas.width / 2, 352);
        ctx.restore();
      }

      // Prayer Times list (Cascade in from 1.6s to 4.0s)
      const startY = 430;
      const rowHeight = 85;

      rows.forEach((r, idx) => {
        const rowStartT = 1.6 + idx * 0.35;
        const rowProgress = Math.min(1, Math.max(0, (t - rowStartT) * 2));
        if (rowProgress > 0) {
          ctx.save();
          ctx.globalAlpha = rowProgress;
          
          // Slide from left
          const slideX = (1 - rowProgress) * 40;
          const y = startY + idx * rowHeight;

          // Card row background
          ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)';
          ctx.beginPath();
          ctx.roundRect(70 + slideX, y, canvas.width - 140, 68, 12);
          ctx.fill();

          // Label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 28px Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(r.label, canvas.width - 100 + slideX, y + 44);

          // Time badge
          ctx.fillStyle = '#d4af37';
          ctx.font = 'bold 34px "Frank Ruhl Libre", Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(r.time, 100 + slideX, y + 46);

          ctx.restore();
        }
      });

      // Footer: שבת שלום ומבורך (Glows at 4.2s)
      const footerAlpha = Math.min(1, Math.max(0, (t - 4.0) * 2));
      if (footerAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = footerAlpha;
        ctx.fillStyle = '#f6e05e';
        ctx.font = 'bold 40px "Frank Ruhl Libre", Arial, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#d4af37';
        ctx.shadowBlur = 15;
        ctx.fillText('✡ שבת שלום ומבורך! ✡', canvas.width / 2, 1180);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `שבת_${parasha.replace(/\s+/g, '_')}_סטטוס_מונפש.webm`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">ייצוא סרטון מונפש לסטטוס וואטסאפ</h3>
              <p className="text-xs text-muted-foreground">הפקת וידאו אנכי 9:16 עם אנימציות זמנים מרהיבות</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex flex-col items-center">
          <div className="relative w-48 h-84 bg-black/40 rounded-xl overflow-hidden border-2 border-primary/30 shadow-inner flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full object-cover" />
            {!isGenerating && !videoUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-black/50 text-white">
                <Sparkles className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
                <p className="text-xs font-semibold">לחץ ליצירת סרטון מונפש (6 שניות)</p>
              </div>
            )}
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                <p className="text-xs font-bold">מרנדר סרטון... {progress}%</p>
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>הסרטון מוכן! ניתן להוריד ולהעלות ישירות לסטטוס בוואטסאפ.</span>
            </div>
          )}

          <div className="flex gap-2 w-full pt-2">
            {!videoUrl ? (
              <Button 
                onClick={startAnimationAndRecord} 
                disabled={isGenerating} 
                className="w-full gap-2 font-bold bg-primary text-primary-foreground"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isGenerating ? `מייצר סרטון (${progress}%)...` : 'צור סרטון עכשיו ✨'}
              </Button>
            ) : (
              <>
                <Button onClick={downloadVideo} className="flex-1 gap-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Download className="w-4 h-4" /> הורד סרטון (WebM)
                </Button>
                <Button onClick={startAnimationAndRecord} variant="outline" className="gap-1">
                  <RefreshCw className="w-4 h-4" /> הפק מחדש
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
