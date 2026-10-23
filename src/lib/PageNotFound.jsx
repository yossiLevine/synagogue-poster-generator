import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const pageName = location.pathname;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-background via-muted/30 to-background font-heebo" dir="rtl">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border/80 p-8 rounded-3xl shadow-xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-xs mx-auto">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black text-primary font-frank tracking-tight">404</h1>
          <h2 className="text-xl font-bold text-foreground">העמוד המבוקש לא נמצא</h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            הכתובת <span className="font-mono text-primary font-semibold" dir="ltr">{pageName}</span> אינה קיימת במערכת מחולל המודעות או שהועברה.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs rounded-xl"
          >
            <Home className="w-4 h-4" />
            <span>חזרה לעמוד הראשי</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto gap-2 border-border font-medium rounded-xl"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזור אחורה</span>
          </Button>
        </div>
      </div>
    </div>
  );
}