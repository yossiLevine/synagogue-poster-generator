import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Megaphone, Plus, Trash2, Edit2, Check, Sparkles, 
  Wine, BookOpen, GraduationCap, Heart, Flame, Utensils, Bell, DoorClosed,
  GripVertical, ArrowUp, ArrowDown, Columns, Maximize2, Sparkle
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const ANNOUNCEMENT_PRESETS = [
  {
    type: 'kiddush',
    icon: '🍷',
    title: 'קידושא רבא',
    defaultContent: 'השבת יתקיים קידושא רבא לרגל השמחה באולם בית הכנסת בהשתתפות ציבור המתפללים. כולם מוזמנים!',
    sampleFill: { occasion: 'הולדת הבת', family: 'משפחת כהן' }
  },
  {
    type: 'avot_ubanim',
    icon: '📚',
    title: 'סדר לימוד אבות ובנים',
    defaultContent: 'סדר לימוד הורים וילדים יתקיים בשבת בשעה 17:00. כיבוד עשיר ופרסים יקרי ערך למשתתפים!',
  },
  {
    type: 'shiur',
    icon: '📖',
    title: 'שיעור בהלכה ובדף היומי',
    defaultContent: 'שיעור מרכזי מפי מורנו הרב שליט"א יתקיים בין מנחה למעריב בנושא הלכות שבת ומועדים.',
  },
  {
    type: 'women_shiur',
    icon: '🌸',
    title: 'שיעור לנשים וצעירות',
    defaultContent: 'שיעור מיוחד לנשות הקהילה יתקיים בשבת בשעה 16:30 בעזרת הנשים.',
  },
  {
    type: 'mazal_tov',
    icon: '🎉',
    title: 'ברכת מזל טוב חמה',
    defaultContent: 'ברכת מזל טוב חמה ולבבית למשפחה היקרה לרגל השמחה, יזכו לראות רוב נחת ושמחה לתורה ולחופה!',
  },
  {
    type: 'seuda_shlishit',
    icon: '🍽️',
    title: 'סעודה שלישית מרכזית',
    defaultContent: 'סעודה שלישית משותפת תתקיים בבית המדרש בליווי דברי תורה ופיוטי שבת.',
  },
  {
    type: 'yahrtzeit',
    icon: '🕯️',
    title: 'שבת זיכרון ולעילוי נשמת',
    defaultContent: 'הלימוד והתפילות בשבת זו מוקדשים לעילוי נשמת המנוח/ה ת.נ.צ.ב.ה.',
  },
  {
    type: 'farbrengen',
    icon: '🥃',
    title: 'קבלת שבת פארבריינגען',
    defaultContent: 'יישר כוח לידידנו היקרים שתרמו את הוויסקי והנקניקים לקבלת שבת ולהתוועדות. תזכו למצוות ולברכה!',
  },
  {
    type: 'gabai',
    icon: '📢',
    title: 'הודעת גבאי וסדר',
    defaultContent: 'נא להקפיד על השקט המוחלט בזמן התפילה וחזרת הש"ץ, ולכבות טלפונים ניידים בכניסה לקודש.',
  },
];

const STORAGE_KEY = 'synagogue_smart_announcements';

export default function SmartAnnouncementsManager({ 
  value = [], 
  onChange, 
  legacyText = '', 
  onLegacyChange,
  sectionTitle = 'הודעות ואירועי השבת',
  onSectionTitleChange,
  onGenerateSign,
  workspaceId = 'default'
}) {
  const storageKey = `synagogue_smart_announcements_${workspaceId || 'default'}`;

  const [items, setItems] = useState(() => {
    if (Array.isArray(value) && value.length > 0) return value;
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('synagogue_smart_announcements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved announcements', e);
    }
    return [];
  });

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIcon, setEditIcon] = useState('📢');
  const [editLayout, setEditLayout] = useState('auto'); // 'auto', 'full', 'half'

  // Sync to parent and localStorage
  useEffect(() => {
    if (onChange) onChange(items);
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {}
  }, [items, storageKey]);

  // Sync incoming external updates from parent (Chat Assistant, Workspaces, or draft load)
  useEffect(() => {
    if (Array.isArray(value) && JSON.stringify(value) !== JSON.stringify(items)) {
      setItems(value);
    }
  }, [value]);

  const addFromPreset = (preset) => {
    const newItem = {
      id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: preset.type,
      icon: preset.icon,
      title: preset.title,
      content: preset.defaultContent,
      active: true,
      layout: 'auto', // 'auto', 'full', 'half'
    };
    setItems(prev => [...prev, newItem]);
    // Start editing right away
    setEditingId(newItem.id);
    setEditTitle(newItem.title);
    setEditContent(newItem.content);
    setEditIcon(newItem.icon);
    setEditLayout('auto');
  };

  const addCustom = () => {
    const newItem = {
      id: 'ann_' + Date.now(),
      type: 'custom',
      icon: '✨',
      title: 'הודעה חדשה',
      content: '',
      active: true,
      layout: 'auto',
    };
    setItems(prev => [...prev, newItem]);
    setEditingId(newItem.id);
    setEditTitle(newItem.title);
    setEditContent(newItem.content);
    setEditIcon(newItem.icon);
    setEditLayout('auto');
  };

  const toggleActive = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, active: !item.active } : item));
  };

  const toggleFullWidth = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      // Cycle: 'auto' -> 'full' -> 'half' -> 'auto'
      const current = item.layout || (item.fullWidth ? 'full' : 'auto');
      let next = 'full';
      if (current === 'full') next = 'half';
      else if (current === 'half') next = 'auto';
      return { ...item, layout: next, fullWidth: next === 'full' };
    }));
  };

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, moved);
    setItems(newItems);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    const newItems = [...items];
    const [moved] = newItems.splice(source.index, 1);
    newItems.splice(destination.index, 0, moved);
    setItems(newItems);
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditIcon(item.icon);
    setEditLayout(item.layout || (item.fullWidth ? 'full' : 'auto'));
  };

  const saveEdit = () => {
    if (!editingId) return;
    setItems(prev => prev.map(item => 
      item.id === editingId 
        ? { ...item, title: editTitle, content: editContent, icon: editIcon, layout: editLayout, fullWidth: editLayout === 'full' }
        : item
    ));
    setEditingId(null);
  };

  const activeCount = items.filter(i => i.active).length;

  return (
    <div dir="rtl" className="space-y-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent p-4 md:p-5 shadow-sm">
      {/* Header with editable Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">הודעות שבת ואירועי הקהילה</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                {activeCount} פעילות במודעה
              </span>
            </div>
            <p className="text-xs text-muted-foreground">ניתן לגרור ↕️ לשינוי סדר, למרכז לרוחב מלא, ולסדר כרצונך במודעה</p>
          </div>
        </div>

        {/* Section title as it appears on the poster */}
        <div className="flex items-center gap-2 bg-card/90 rounded-xl px-3 py-1.5 border border-border/80 shadow-2xs">
          <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">כותרת במודעה:</label>
          <input
            type="text"
            value={sectionTitle}
            onChange={(e) => onSectionTitleChange && onSectionTitleChange(e.target.value)}
            placeholder="הודעות ואירועי השבת"
            className="text-xs font-bold text-foreground bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5 w-36 sm:w-44"
          />
        </div>
      </div>

      {/* Quick 1-Click Preset Buttons */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">⚡ הוספה מהירה בלחיצה אחת:</p>
        <div className="flex flex-wrap gap-1.5">
          {ANNOUNCEMENT_PRESETS.map((p) => (
            <button
              key={p.type}
              type="button"
              onClick={() => addFromPreset(p)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-card border border-border/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shadow-2xs active:scale-95"
            >
              <span>{p.icon}</span>
              <span>{p.title}</span>
              <Plus className="w-3 h-3 text-muted-foreground opacity-60" />
            </button>
          ))}
          <button
            type="button"
            onClick={addCustom}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>הודעה מותאמת אישית</span>
          </button>
        </div>
      </div>

      {/* Announcements List with Drag & Drop */}
      {items.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="announcements-droppable">
            {(droppableProvided) => (
              <div 
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
                className="space-y-2 pt-1"
              >
                {items.map((item, index) => {
                  const isEditing = editingId === item.id;
                  const itemLayout = item.layout || (item.fullWidth ? 'full' : 'auto');

                  return (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(draggableProvided, snapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          className={`rounded-xl border transition-all ${
                            snapshot.isDragging 
                              ? 'shadow-xl ring-2 ring-primary border-primary bg-card/95 scale-[1.02] z-50' 
                              : item.active 
                                ? 'border-primary/30 bg-card shadow-xs' 
                                : 'border-border/50 bg-muted/30 opacity-60'
                          }`}
                        >
                          {isEditing ? (
                            /* Edit Mode */
                            <div className="p-3 space-y-3 bg-card rounded-xl border-2 border-primary/40">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editIcon}
                                  onChange={(e) => setEditIcon(e.target.value)}
                                  className="w-12 text-center text-base"
                                  title="אייקון"
                                />
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  placeholder="כותרת ההודעה (למשל: קידושא רבא)"
                                  className="font-bold text-sm flex-1"
                                />
                              </div>
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                placeholder="פרטי ההודעה, שמות, שעה ומיקום..."
                                className="text-xs min-h-[70px] resize-y"
                              />

                              {/* Layout width selection */}
                              <div className="flex items-center justify-between pt-1 border-t border-border/60">
                                <span className="text-xs text-muted-foreground font-medium">פריסה במודעה:</span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setEditLayout('auto')}
                                    className={`text-[11px] px-2 py-1 rounded-md transition-all ${
                                      editLayout === 'auto'
                                        ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    ✨ אוטומטי (מאוזן)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditLayout('full')}
                                    className={`text-[11px] px-2 py-1 rounded-md transition-all ${
                                      editLayout === 'full'
                                        ? 'bg-amber-500 text-white font-bold shadow-2xs'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    ↔️ רוחב מלא וממורכז
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditLayout('half')}
                                    className={`text-[11px] px-2 py-1 rounded-md transition-all ${
                                      editLayout === 'half'
                                        ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                  >
                                    ½ חצי עמודה
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-1">
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>ביטול</Button>
                                <Button size="sm" onClick={saveEdit} className="gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  שמור שינויים
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* View Mode */
                            <div className="p-2.5 sm:p-3 flex items-start justify-between gap-2.5">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                {/* Drag Handle */}
                                <div 
                                  {...draggableProvided.dragHandleProps} 
                                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 -mr-1 rounded-md hover:bg-muted/60 transition-colors shrink-0 mt-0.5"
                                  title="גרור כדי לשנות סדר ומיקום במודעה"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>

                                <span className="text-xl shrink-0 mt-0.5">{item.icon || '📢'}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-bold text-sm text-foreground truncate">{item.title}</h4>
                                    
                                    {/* Layout indicator badge */}
                                    {itemLayout === 'full' ? (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium flex items-center gap-0.5" title="תופס שורה שלמה וממורכז">
                                        ↔️ רוחב מלא
                                      </span>
                                    ) : itemLayout === 'half' ? (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium" title="חצי עמודה קבועה">
                                        ½ חצי עמודה
                                      </span>
                                    ) : null}

                                    {!item.active && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                        מוסתר
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                    {item.content || <span className="italic opacity-50">ללא פירוט</span>}
                                  </p>
                                </div>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Up / Down Reorder buttons */}
                                <div className="flex flex-col gap-0.5 mr-0.5">
                                  <button
                                    type="button"
                                    disabled={index === 0}
                                    onClick={() => moveItem(index, -1)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                    title="העבר למעלה"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={index === items.length - 1}
                                    onClick={() => moveItem(index, 1)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20 disabled:pointer-events-none transition-colors"
                                    title="העבר למטה"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Width / Alignment toggle button */}
                                <button
                                  type="button"
                                  onClick={() => toggleFullWidth(item.id)}
                                  className={`p-1.5 rounded-lg border text-xs transition-all flex items-center gap-1 ${
                                    itemLayout === 'full'
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold'
                                      : 'bg-card border-border/70 text-muted-foreground hover:bg-muted'
                                  }`}
                                  title={
                                    itemLayout === 'full'
                                      ? 'מוגדר כרוחב מלא ממורכז (לחץ לשינוי לחצי עמודה)'
                                      : itemLayout === 'half'
                                        ? 'מוגדר כחצי עמודה (לחץ למירכוז אוטומטי)'
                                        : 'מירכוז אוטומטי (לחץ להפיכה לרוחב מלא ממורכז)'
                                  }
                                >
                                  {itemLayout === 'full' ? (
                                    <>
                                      <Maximize2 className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline text-[11px]">ממורכז</span>
                                    </>
                                  ) : (
                                    <>
                                      <Columns className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline text-[11px]">עמודה</span>
                                    </>
                                  )}
                                </button>

                                {/* Active toggle */}
                                <div className="flex items-center px-1" title={item.active ? 'הודעה פעילה במודעה' : 'הודעה מושבתת (נשמרת לשבועות הבאים)'}>
                                  <Switch
                                    checked={item.active}
                                    onCheckedChange={() => toggleActive(item.id)}
                                    className="scale-90"
                                  />
                                </div>

                                {onGenerateSign && (
                                  <button
                                    type="button"
                                    onClick={() => onGenerateSign(item)}
                                    className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                    title="🚪 הפק שלט לדלת / לאולם מאירוע זה"
                                  >
                                    <DoorClosed className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="ערוך הודעה"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  title="מחק הודעה"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {droppableProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="text-center py-4 border border-dashed border-border rounded-xl bg-card/40">
          <p className="text-xs text-muted-foreground mb-1">אין הודעות מוגדרות לשבת זו</p>
          <p className="text-[11px] text-muted-foreground/70">לחצו על אחד הכפתורים למעלה להוספה מהירה של קידוש, שיעור או שמחה</p>
        </div>
      )}

      {/* Freeform/legacy text expander if Gabai prefers simple typing */}
      <details className="text-xs text-muted-foreground cursor-pointer pt-1">
        <summary className="hover:text-foreground font-medium select-none">
          ✍️ העדפת כתיבת טקסט חופשי / הודעות נוספות
        </summary>
        <div className="mt-2 pt-2 border-t border-border/50">
          <Textarea
            value={legacyText}
            onChange={(e) => onLegacyChange && onLegacyChange(e.target.value)}
            placeholder="מלל חופשי נוסף שיוצג בתחתית המודעה..."
            className="text-xs min-h-[60px]"
            dir="rtl"
          />
        </div>
      </details>
    </div>
  );
}

