import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleHardReload = () => {
    try {
      localStorage.removeItem('editorTheme');
      localStorage.removeItem('editorFrame');
    } catch(e) {}
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1724] text-white flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center backdrop-blur-md shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h2 className="text-xl font-bold font-frank text-amber-300">אירעה תקלה בטעינת העורך</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              נראה שהדפדפן שמר גרסה ישנה של המערכת (Cache) או שיש בעיית תקשורת מקומית. לחיצה על הכפתור למטה תרענן את הנתונים מיד.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                onClick={this.handleHardReload}
                className="w-full gap-2 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold"
              >
                <RotateCcw className="w-4 h-4" /> רענן גרסה נקייה
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="w-full gap-2 text-white/70 hover:text-white text-xs"
              >
                <Home className="w-4 h-4" /> חזרה לדף הבית
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
