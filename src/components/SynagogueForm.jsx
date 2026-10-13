import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';

export default function SynagogueForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    latitude: '',
    longitude: '',
    gabaaiName: '',
    gabaaiEmail: '',
    gabaaiPhone: '',
    gabaaiPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!formData.name.trim()) return 'שם בית הכנסת נדרש';
    if (!formData.city.trim()) return 'עיר נדרשת';
    if (formData.gabaaiName && formData.gabaaiName.length < 3) return 'שם משתמש חייב להיות לפחות 3 תווים';
    if (formData.gabaaiPassword && formData.gabaaiPassword.length < 6) return 'סיסמה חייבת להיות לפחות 6 תווים';
    if (formData.gabaaiEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.gabaaiEmail)) return 'מייל לא תקין - דוגמה: user@example.com';
    if (formData.gabaaiPhone && !/^\+?[1-9]\d{1,14}$/.test(formData.gabaaiPhone.replace(/\s/g, ''))) return 'טלפון לא תקין - יש להקליד עם קוד ארץ (לדוגמא: +972505555555)';
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
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { getFirestore, collection, addDoc, doc, setDoc } = await import('firebase/firestore');
      
      const firebaseConfig = {
        projectId: "synagogue-poster-gen-2026",
        appId: "1:200223463672:web:3762301a7c76ec4442430d",
        storageBucket: "synagogue-poster-gen-2026.firebasestorage.app",
        apiKey: "AIzaSyBfsAcXSrQO6Ktfdp1D2qyJ-VywKXY3RaE",
        authDomain: "synagogue-poster-gen-2026.firebaseapp.com",
        messagingSenderId: "200223463672"
      };

      const mainDb = getFirestore(initializeApp(firebaseConfig));

      // Create synagogue
      const synDoc = await addDoc(collection(mainDb, 'synagogues'), {
        name: formData.name,
        city: formData.city,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        created_at: new Date().toISOString()
      });

      // Create gabai account if provided
      if (formData.gabaaiName && formData.gabaaiPassword) {
        const secondaryApp = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);
        
        const email = formData.gabaaiEmail.trim() || `${formData.gabaaiName.trim()}@synagogue.local`;
        const pass = formData.gabaaiPassword;

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        await signOut(secondaryAuth);

        await setDoc(doc(mainDb, 'gabais', email.toLowerCase()), {
          uid: userCredential.user.uid,
          synagogue_id: synDoc.id,
          username: formData.gabaaiName.trim(),
          email: email,
          phone: formData.gabaaiPhone.trim(),
          role: 'gabai'
        });
      }

      setFormData({ name: '', city: '', latitude: '', longitude: '', gabaaiName: '', gabaaiEmail: '', gabaaiPhone: '', gabaaiPassword: '' });
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      setError(e.message || 'שגיאה ביצירת בית הכנסת או חשבון גבאי');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div>
        <Label className="text-sm font-semibold">שם בית הכנסת *</Label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="לדוגמא: שומר תורה"
          required
          className="mt-1 text-right"
          dir="rtl"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">עיר *</Label>
        <Input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          placeholder="לדוגמא: תל אביב"
          required
          className="mt-1 text-right"
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-sm font-semibold">קו רוחב</Label>
          <Input
            type="number"
            step="0.0001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="32.0853"
            className="mt-1 text-right"
            dir="ltr"
          />
        </div>
        <div>
          <Label className="text-sm font-semibold">קו אורך</Label>
          <Input
            type="number"
            step="0.0001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="34.7818"
            className="mt-1 text-right"
            dir="ltr"
          />
        </div>
      </div>

      <hr className="my-4" />
      <p className="text-sm font-semibold text-muted-foreground">הגדרת חשבון גבאי (אופציונלי)</p>

      <div>
        <Label className="text-sm font-semibold">שם משתמש גבאי</Label>
        <Input
          type="text"
          value={formData.gabaaiName}
          onChange={(e) => setFormData({ ...formData, gabaaiName: e.target.value })}
          placeholder="לדוגמא: gabaai1"
          className="mt-1 text-right"
          dir="rtl"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">סיסמה גבאי</Label>
        <Input
          type="text"
          value={formData.gabaaiPassword}
          onChange={(e) => setFormData({ ...formData, gabaaiPassword: e.target.value })}
          placeholder="לדוגמא: Password123"
          className="mt-1 text-right"
          dir="rtl"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">מייל גבאי</Label>
        <Input
          type="email"
          value={formData.gabaaiEmail}
          onChange={(e) => setFormData({ ...formData, gabaaiEmail: e.target.value })}
          placeholder="gabaai@example.com"
          className="mt-1 text-right"
          dir="ltr"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">טלפון גבאי</Label>
        <Input
          type="tel"
          value={formData.gabaaiPhone}
          onChange={(e) => setFormData({ ...formData, gabaaiPhone: e.target.value })}
          placeholder="+972505555555"
          className="mt-1 text-right"
          dir="ltr"
        />
      </div>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> יוצר...</> : 'צור בית כנסת'}
      </Button>
    </form>
  );
}