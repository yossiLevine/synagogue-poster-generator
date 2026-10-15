import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check } from 'lucide-react';

export default function CreateGabaiForm({ synagogueId, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({ username: '', password: '', email: '', phone: '', subscribed_to_reminders: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const pass = Math.random().toString(36).slice(-8).toUpperCase();
    setFormData({ ...formData, password: pass });
  };

  const validateForm = () => {
    if (!formData.username.trim()) return 'שם משתמש נדרש';
    if (formData.username.length < 3) return 'שם משתמש חייב להיות 3 תווים לפחות';
    if (!formData.password) return 'סיסמה נדרשת';
    if (formData.password.length < 6) return 'סיסמה חייבת להיות 6 תווים לפחות';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'אימייל לא תקין';
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) return 'טלפון לא תקין';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);

    try {
      const { initializeApp, getApps, deleteApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const loginEmail = `${formData.username.toLowerCase().trim()}@synagogue.local`;

      const firebaseConfig = {
        projectId: "synagogue-poster-gen-2026",
        appId: "1:200223463672:web:3762301a7c76ec4442430d",
        storageBucket: "synagogue-poster-gen-2026.firebasestorage.app",
        apiKey: "AIzaSyBfsAcXSrQO6Ktfdp1D2qyJ-VywKXY3RaE",
        authDomain: "synagogue-poster-gen-2026.firebaseapp.com",
        messagingSenderId: "200223463672"
      };

      const existingSecondary = getApps().find(app => app.name === 'Secondary');
      if (existingSecondary) {
        await deleteApp(existingSecondary);
      }
      const secondaryApp = initializeApp(firebaseConfig, "Secondary");
      let userCredential;
      try {
        const secondaryAuth = getAuth(secondaryApp);
        userCredential = await createUserWithEmailAndPassword(secondaryAuth, loginEmail, formData.password);
        await signOut(secondaryAuth);
      } finally {
        await deleteApp(secondaryApp);
      }

      // Save gabai profile to main database
      await setDoc(doc(db, 'gabais', loginEmail), {
        uid: userCredential.user.uid,
        synagogue_id: synagogueId,
        username: formData.username.trim(),
        email: formData.email ? formData.email.trim() : '',
        phone: formData.phone.trim(),
        subscribed_to_reminders: formData.subscribed_to_reminders,
        role: 'gabai'
      });

      setCreated({ username: formData.username.trim(), password: formData.password });
      setFormData({ username: '', password: '', email: '', phone: '', subscribed_to_reminders: true });
    } catch (e) {
      console.error(e);
      setError(e.message || 'שגיאה בשרת');
    }
    setLoading(false);
  };

  if (created) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold text-green-900 mb-3">✅ חשבון נוצר בהצלחה!</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between bg-white p-2 rounded border border-green-100">
              <span className="font-mono font-bold">{created.username}</span>
              <span className="text-muted-foreground">שם משתמש</span>
            </div>
            
            <div className="flex items-center justify-between bg-white p-2 rounded border border-green-100">
              <span className="font-mono font-bold">{created.password}</span>
              <span className="text-muted-foreground">סיסמה</span>
            </div>
          </div>

          <p className="text-xs text-green-700 mt-3">⚠️ שמור את הנתונים הללו - הם לא יוצגו שוב</p>
        </div>

        <Button onClick={() => {
          navigator.clipboard.writeText(`שם משתמש: ${created.username}\nסיסמה: ${created.password}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }} variant="outline" className="w-full">
          {copied ? <Check className="w-4 h-4 ml-2" /> : <Copy className="w-4 h-4 ml-2" />}
          {copied ? 'הועתק!' : 'העתק'}
        </Button>

        <Button onClick={onSuccess} className="w-full">
          סיום
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div>
        <Label className="text-sm font-semibold">שם משתמש *</Label>
        <Input
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          placeholder="לדוגמא: gabaai1"
          required
          className="mt-1 text-right"
          dir="rtl"
        />
      </div>

      <div>
         <Label className="text-sm font-semibold">כתובת דוא"ל</Label>
         <Input
           type="email"
           value={formData.email}
           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
           placeholder="gabaai@example.com"
           className="mt-1 text-right"
           dir="ltr"
         />
       </div>

       <div>
         <Label className="text-sm font-semibold">טלפון (עם קידומת)</Label>
         <Input
           type="tel"
           value={formData.phone}
           onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
           placeholder="+972505555555"
           className="mt-1 text-right"
           dir="ltr"
         />
       </div>

       <div className="flex items-center gap-2">
         <input
           type="checkbox"
           id="subscribe"
           checked={formData.subscribed_to_reminders}
           onChange={(e) => setFormData({ ...formData, subscribed_to_reminders: e.target.checked })}
           className="rounded"
         />
         <Label htmlFor="subscribe" className="text-sm font-semibold cursor-pointer">
           קבל הודעות תזכורת ביום חמישי בערב
         </Label>
       </div>

      <div>
         <Label className="text-sm font-semibold">סיסמה *</Label>
         <div className="flex gap-2">
          <Input
            type="text"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="הכנס או הצור סיסמה"
            required
            className="mt-1 flex-1 text-right"
            dir="rtl"
          />
          <Button type="button" variant="outline" onClick={generatePassword} className="mt-1">
            🎲
          </Button>
        </div>
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          ביטול
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : ''}
          צור
        </Button>
      </div>
    </form>
  );
}