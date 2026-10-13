import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function GabaiLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { doc, getDoc } = await import('firebase/firestore');
      const { auth, db } = await import('@/lib/firebase');

      const cleanUsername = username.toLowerCase().trim();
      const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@synagogue.local`;
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch gabai metadata
      const gabaiDoc = await getDoc(doc(db, 'gabais', email));
      if (gabaiDoc.exists() && gabaiDoc.data().synagogue_id) {
        localStorage.setItem('synagogue_id', gabaiDoc.data().synagogue_id);
        navigate('/editor');
      } else {
        // They are either an admin or not a gabai
        navigate('/admin');
      }
    } catch (e) {
      console.error(e);
      setError(e.message || 'שם משתמש או סיסמה שגויים');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1724] flex items-center justify-center p-4" dir="rtl">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#c9a96e]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#1e3a5f]/60 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm mb-8"
        >
          <ArrowRight className="w-4 h-4" />
          חזרה לדף הבית
        </button>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a96e] to-[#e8cc8f] flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-[#c9a96e]/30">
              🕍
            </div>
            <h1 className="text-2xl font-bold text-white">דלת הגבאי</h1>
            <p className="text-white/40 text-sm mt-1">כניסה למערכת יצירת המודעות</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-white/70 text-sm font-medium block">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="הזן שם משתמש"
                disabled={loading}
                dir="rtl"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#c9a96e]/60 focus:bg-white/8 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-white/70 text-sm font-medium block">סיסמה</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="הזן סיסמה"
                  disabled={loading}
                  dir="rtl"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#c9a96e]/60 focus:bg-white/8 transition-all pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 bg-gradient-to-l from-[#c9a96e] to-[#e8cc8f] text-[#0f1724] hover:shadow-[0_0_30px_rgba(201,169,110,0.4)] hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מתחבר...
                </>
              ) : 'כניסה למערכת'}
            </button>
          </form>

          {/* Dev Mode Bypass */}
          {import.meta.env.DEV && (
            <button
              onClick={() => navigate('/editor')}
              className="w-full py-3 mt-4 rounded-xl font-bold text-sm transition-all duration-200 bg-white/10 text-white hover:bg-white/20 border border-dashed border-white/30"
            >
              🛠️ כניסה למצב פיתוח (ללא סיסמה)
            </button>
          )}

          {/* Footer note */}
          <p className="text-center text-white/25 text-xs mt-6">
            שכחת פרטים? פנה לאדמין המערכת
          </p>
        </div>

        {/* Bottom branding */}
        <p className="text-center text-white/20 text-xs mt-6">
          © YL.AI — פתרונות AI לבתי כנסת
        </p>
      </div>
    </div>
  );
}