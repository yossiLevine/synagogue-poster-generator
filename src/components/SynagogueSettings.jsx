import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { getConfig, loadConfig, saveConfig, PRESET_HORIZONS } from '@/lib/synagogueConfig';
import { getSynagogueId } from '@/lib/synagogueDB';

export default function SynagogueSettings({ onChange, synagogueId, onSuccess }) {
  const activeSynId = synagogueId || getSynagogueId();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState(() => getConfig());
  const [customHorizon, setCustomHorizon] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

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
    <div dir="rtl" className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4 text-primary" />
          <span>הגדרות בית הכנסת</span>
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
          {/* Synagogue Name */}
          <div>
            <Label className="text-xs font-semibold">שם בית הכנסת (יופיע בתחתית המודעה)</Label>
            <Input
              value={config.synagogueName}
              onChange={e => update('synagogueName', e.target.value)}
              className="mt-1 text-right text-sm"
              dir="rtl"
            />
          </div>

          {/* Horizon */}
          <div>
            <Label className="text-xs font-semibold">אופק לחישוב זמני היום</Label>
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

          {onSuccess && (
            <button
              onClick={() => onSuccess()}
              className="w-full mt-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              שמור וסגור
            </button>
          )}
        </div>
      )}
    </div>
  );
}