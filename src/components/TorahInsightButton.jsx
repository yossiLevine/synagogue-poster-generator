import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Copy, Plus, RotateCcw, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCuratedInsight } from '@/lib/torahInsights';

export default function TorahInsightButton({ parasha, onAddToPoster }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!parasha || typeof parasha !== 'string') return;
    setLoading(true);
    setText('');
    try {
      // Try AI cloud function first if available
      let insight = null;
      try {
        const res = await base44.functions.invoke('generateTorahInsight', { parasha });
        insight = res.data?.text;
      } catch (cloudErr) {
        // Fallback to local curated library
      }

      if (!insight || typeof insight !== 'string') {
        insight = getCuratedInsight(parasha);
      }
      setText(insight);
    } catch (e) {
      console.error('Torah insight error:', e);
      setText(getCuratedInsight(parasha));
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (!navigator?.clipboard) {
      alert('העתקה אינה נתמכת בדפדפן זה');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(e => {
      console.error('Copy failed:', e);
    });
  };

  return (
    <div dir="rtl" className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={generate}
        disabled={loading || !parasha}
        className="gap-1.5 w-full border-amber-300 text-amber-700 hover:bg-amber-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'מייצר משפט שבועי...' : `🤖 צור משפט שבועי ל${parasha || 'פרשה'}`}
      </Button>

      {text && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-sm leading-relaxed font-frank text-amber-900 whitespace-pre-wrap">{text}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1 text-xs flex-1">
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'הועתק!' : 'העתק'}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={generate} className="gap-1 text-xs" title="החלף משפט">
              <RotateCcw className="w-3 h-3" />
            </Button>
            {onAddToPoster && (
              <Button size="sm" onClick={() => onAddToPoster(text)} className="gap-1 text-xs flex-1">
                <Plus className="w-3 h-3" /> הוסף למודעה
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}