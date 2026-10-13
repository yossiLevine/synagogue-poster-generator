import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/base44Client';
import { Lightbulb, Loader2 } from 'lucide-react';
import { getConfig } from '@/lib/synagogueConfig';

export default function FeatureRequestForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('הכנס כותרת');
      return;
    }

    setSubmitting(true);
    try {
      const cfg = getConfig();
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await addDoc(collection(db, 'feature_requests'), {
        title: title.trim(),
        description: description.trim(),
        requested_by: cfg.synagogueName || 'גבאי',
        synagogue_name: cfg.synagogueName || '',
        likes: 0,
        status: 'new',
        created_date: new Date().toISOString()
      });

      setTitle('');
      setDescription('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error('Error:', e);
      alert('שגיאה בשליחת הבקשה');
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3" dir="rtl">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-sm">💡 הצע פיצ'ר חדש</h3>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-sm text-green-700">
          ✓ הבקשה נשלחה בהצלחה!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label className="text-xs font-semibold">כותרת *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="לדוגמא: הוסף אפשרות להעלאת תמונה..."
            className="text-sm text-right mt-1"
            dir="rtl"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold">תיאור (אופציונלי)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="כיצד זה יעזור לך?"
            className="text-sm text-right mt-1 min-h-24"
            dir="rtl"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full gap-1.5"
          size="sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              שולח...
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4" />
              שלח בקשה
            </>
          )}
        </Button>
      </form>
    </div>
  );
}