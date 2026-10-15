import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ChevronDown, ChevronUp, Check, Building2, Sliders, ShieldCheck, User, Info, Save } from 'lucide-react';
import { getConfig, loadConfig, saveConfig, PRESET_HORIZONS } from '@/lib/synagogueConfig';
import { getSynagogueId } from '@/lib/synagogueDB';
import RelativeZmanimConfig from './RelativeZmanimConfig';

export default function SynagogueSettings({ onChange, synagogueId, onSuccess, defaultOpen = false, embedded = false }) {
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

  const contentMarkup = (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4 h-11 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="profile" className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg">
            <Building2 className="w-4 h-4 text-primary" />
            <span>פרופיל בית כנסת</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-xs rounded-lg">
            <Sliders className="w-4 h-4 text-primary" />
            <span>חוקי חישוב זמנים</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Profile & Horizon */}
        <TabsContent value="profile" className="space-y-4 animate-in fade-in">
          {savedBadge && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>ההגדרות עודכנו ונשמרו בהצלחה!</span>
            </div>
          )}

          {/* Synagogue Name */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-2">
            <Label className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
              <Building2 className="w-4 h-4 text-primary" />
              <span>שם בית הכנסת (מוצג בכותרת המודעה ובלוגו)</span>
            </Label>
            <Input
              value={config.synagogueName}
              onChange={e => update('synagogueName', e.target.value)}
              className="text-right text-sm font-semibold h-10"
              placeholder="למשל: בית הכנסת הגדול אוהל יצחק"
              dir="rtl"
            />
            <p className="text-[11px] text-muted-foreground">שם זה יופיע בראש כל מודעה שנוצרת עבור בית כנסת זה.</p>
          </div>

          {/* Horizon */}
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-2xs space-y-2">
            <Label className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
              <Sliders className="w-4 h-4 text-primary" />
              <span>אופק ומיקום לחישוב זמני היום (לוח עתים לבינה)</span>
            </Label>
            <Select value={customHorizon ? 'custom' : config.horizonName} onValueChange={handlePresetHorizon}>
              <SelectTrigger className="text-sm w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_HORIZONS.map(h => (
                  <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>
                ))}
                <SelectItem value="custom">מיקום מותאם אישית (קו רוחב ואורך)...</SelectItem>
              </SelectContent>
            </Select>

            {customHorizon && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">קו רוחב (Latitude)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={config.lat}
                    onChange={e => update('lat', parseFloat(e.target.value))}
                    className="text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">קו אורך (Longitude)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={config.lng}
                    onChange={e => update('lng', parseFloat(e.target.value))}
                    className="text-sm mt-1"
                  />
                </div>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">משפיע ישירות על זמני הדלקת נרות, שקיעה, וצאת השבת.</p>
          </div>

          {/* Logged in Gabai Profile Summary */}
          <div className="p-4 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <User className="w-4 h-4 text-primary" />
              <span>גבאי מחובר: <span className="font-bold text-foreground">{gabaiUsername}</span></span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>מזהה בית כנסת פעיל: <span className="font-mono text-xs bg-background/80 px-2 py-0.5 rounded border border-border">{activeSynId || 'synagogue_default'}</span></span>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: Dynamic Rules Engine */}
        <TabsContent value="rules" className="space-y-4 animate-in fade-in">
          <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>איך פועלים "חוקי חישוב זמנים"?</span>
            </div>
            <p className="leading-relaxed text-xs">
              בניגוד לתבנית רגילה ששומרת שעות קבועות עבור שבוע אחד בלבד, <strong>החוקים הדינמיים</strong> נשמרים לבית הכנסת ומחשבים בכל שבוע מחדש את זמני התפילה באופן אוטומטי בהתאם לשקיעה ולהדלקת נרות!
            </p>
          </div>

          <div>
            <RelativeZmanimConfig 
              embedded={true}
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
          className="w-full mt-4 py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-sm font-semibold transition-colors shadow-2xs"
        >
          סגור חלון הגדרות
        </button>
      )}
    </div>
  );

  if (embedded) {
    return <div dir="rtl" className="w-full">{contentMarkup}</div>;
  }

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
        <div className="p-4 border-t border-border">
          {contentMarkup}
        </div>
      )}
    </div>
  );
}