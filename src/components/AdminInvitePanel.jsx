import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Trash2 } from 'lucide-react';

export default function AdminInvitePanel() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [msg, setMsg] = useState(null);

  const loadAdmins = async () => {
    // Admins are now managed directly in Firebase Auth console
    setAdmins([]);
  };

  useEffect(() => { loadAdmins(); }, []);

  const handleInvite = async () => {
    alert('ניהול מנהלים (Admins) מתבצע כעת ישירות מתוך קונסולת ניהול המשתמשים של Firebase (Authentication).');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> הוסף אדמין חדש
        </h3>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="כתובת אימייל..."
            className="flex-1"
            dir="ltr"
          />
          <Button onClick={handleInvite} disabled={loading || !email.trim()} className="gap-1.5">
            <UserPlus className="w-4 h-4" />
            {loading ? 'שולח...' : 'הזמן'}
          </Button>
        </div>
        {msg && (
          <p className={`text-sm px-3 py-2 rounded-lg ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Current admins */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-bold text-base">אדמינים קיימים ({admins.length})</h3>
        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין אדמינים</p>
        ) : (
          <div className="space-y-2">
            {admins.map(admin => (
              <div key={admin.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{admin.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                </div>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">admin</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}