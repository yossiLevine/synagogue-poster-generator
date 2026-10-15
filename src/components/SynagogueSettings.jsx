import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ChevronDown, ChevronUp, Check, Building2, Sliders, ShieldCheck, User, Info, Save } from 'lucide-react';
import { getConfig, loadConfig, saveConfig, PRESET_HORIZONS } from '@/lib/synagogueConfig';
import { getSynagogueId } from '@/lib/synagogueDB';
import RelativeZmanimConfig from './RelativeZmanimConfig';

export default function SynagogueSettings({ onChange, synagogueId, onSuccess, defaultOpen = false }) {
  const activeSynId = synagogueId || getSynagogueId();
  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState('profile');
  const [config, setConfig] = useState(() => getConfig());
  const [customHorizon, setCustomHorizon] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const gabaiUsername = localStorage.getItem('gabai_username') || localStorage.getItem('user_email') || 'גבאי מחובר';

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      const remote = await loadConfig(activeSynId);
      if (mounted && remote) {
        setConfig(remote);
      }
    };
    hydrate();

    const handler = () => {
      if (mounted) setConfig(getConfig());
    };
    window.addEventListener('synagogue-config-changed', handler);
    return () => {
      mounted = false;
      window.removeEventListener('synagogue-config-changed', handler);
    };
  }, [activeSynId]);

  const update = async (key, value) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    await saveConfig(next, activeSynId);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
    if (onChange) onChange(next);
  };

  const handlePresetHorizon = async (name) => {
    if (name === 'custom') { setCustomHorizon(true); return; }
    setCustomHorizon(false);
    const preset = PRESET_HORIZONS.find(h => h.name === name);
    if (preset) {
      const next = { ...config, horizonName: preset.name, cityName: preset.name, lat: preset.lat, lng: preset.lng };
      setConfig(next);
      await saveConfig(next, activeSynId);
      setSavedBadge(true);
      setTimeout(() => setSavedBadge(false), 2000);
      if (onChange) onChange(next);
    }
  };

  return (
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4 text-primary" />
          <span>פרופיל והגדרות בית הכנסת</span>
          {savedBadge && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> נשמר
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 border-t border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5" />
                <span>פרופיל בית כנסת</span>
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-1.5 text-xs font-bold">
                <Sliders className="w-3.5 h-3.5" />
                <span>חוקי חישוב זמנים</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Profile & Horizon */}
            <TabsContent value="profile" className="space-y-4">
              {/* Synagogue Name */}
              <div>
                <Label className="text-xs font-semibold">שם בית הכנסת (מוצג במודעה ובלוגו)</Label>
                <Input
                  value={config.synagogueName}
                  onChange={e => update('synagogueName', e.target.value)}
                  className="mt-1 text-right text-sm"
                  placeholder="למשל: בית הכנסת הגדול אוהל יצחק"
                  dir="rtl"
                />
              </div>

              {/* Horizon */}
              <div>
                <Label className="text-xs font-semibold">אופק לחישוב זמני היום (לוח עתים לבינה)</Label>
                <Select value={customHorizon ? 'custom' : config.horizonName} onValueChange={handlePresetHorizon}>
                  <SelectTrigger className="mt-1 text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_HORIZONS.map(h => (
                      <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>
                    ))}
                    <SelectItem value="custom">מיקום מותאם אישית...</SelectItem>
                  </SelectContent>
                </Select>

                {customHorizon && (
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">קו רוחב (Lat)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={config.lat}
                        onChange={e => update('lat', parseFloat(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">קו אורך (Lng)</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        value={config.lng}
                        onChange={e => update('lng', parseFloat(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Logged in Gabai Profile Summary */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>גבאי מחובר: {gabaiUsername}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>מזהה בית כנסת פעיל: <span className="font-mono text-[11px]">{activeSynId || 'ברירת מחדל'}</span></span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Dynamic Rules Engine */}
            <TabsContent value="rules" className="space-y-3">
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>מה זה "חוקי חישוב זמנים"?</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  בניגוד לתבנית רגילה ששומרת שעות קבועות (כמו 18:25), <strong>החוקים הדינמיים</strong> מחשבים בכל שבוע מחדש את זמני התפילה ביחס להדלקת נרות ושקיעה.
                  למשל: "מנחה ערב שבת: 20 דק' לפני הדלקת נרות" או "שחרית: 08:30 שעה קבועה".
                </p>
              </div>

              <div className="pt-1">
                <RelativeZmanimConfig 
                  onApply={(rules) => {
                    if (onChange) onChange({ rules });
                    setSavedBadge(true);
                    setTimeout(() => setSavedBadge(false), 2000);
                  }} 
                />
              </div>
            </TabsContent>
          </Tabs>

          {onSuccess && (
            <button
              onClick={() => onSuccess()}
              className="w-full mt-3 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-xs"
            >
              סגור הגדרות
            </button>
          )}
        </div>
      )}
    </div>
  );
}