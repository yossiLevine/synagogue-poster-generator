import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const UserNotRegisteredError = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-amber-50/40 via-slate-50 to-amber-50/30 p-4 font-heebo" dir="rtl">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border border-amber-200/60 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2 font-frank">
          גישה מוגבלת לגבאי מורשה
        </h1>
        
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          אינך רשום כגבאי מורשה במערכת עבור בית כנסת זה. 
          על מנת לקבל הרשאה להפקת מודעות וזמני תפילה, אנא פנה למנהל המערכת או לגבאי הראשי.
        </p>

        <div className="p-4 bg-amber-50/60 border border-amber-200/40 rounded-xl text-sm text-slate-700 text-right mb-6 space-y-2">
          <p className="font-bold text-amber-900">פעולות שבאפשרותך לבצע:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600">
            <li>וודא שהתחברת עם שם המשתמש המדויק שנמסר לך</li>
            <li>פנה למנהל לקבלת קישור הצטרפות או פתיחת חשבון</li>
            <li>נסה להתנתק ולהתחבר מחדש עם החשבון הנכון</li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <Button 
            onClick={handleLogout} 
            variant="default" 
            className="w-full bg-amber-800 hover:bg-amber-900 text-white gap-2 font-medium"
          >
            <LogOut className="w-4 h-4" />
            התנתק והתחבר עם משתמש אחר
          </Button>

          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="w-full gap-2 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            רענן דף
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-muted-foreground">
          <span>מחולל מודעות שבת וחגים · מבית YL.AI</span>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
