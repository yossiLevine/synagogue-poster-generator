/**
 * WorkspaceTabs Component
 * Sleek, horizontal tab switcher for concurrent editing of Shabbat & Holiday posters.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, Sparkles, Trash2, Copy, MoreVertical, 
  Calendar, Check, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { HOLIDAY_PRESETS } from '@/lib/holidayEngine';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export default function WorkspaceTabs({
  workspaces = [],
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateHolidayWorkspace,
  onDuplicateWorkspace,
  onDeleteWorkspace,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-card/70 backdrop-blur-md border-b border-border/80 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto shadow-2xs">
      {/* Scrollable list of active tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
        <span className="text-[11px] font-bold text-muted-foreground hidden sm:inline-block pl-1 shrink-0">
          מרחב עבודה:
        </span>

        {workspaces.map((ws) => {
          const isActive = ws.id === activeWorkspaceId;
          const isShabbat = ws.id === 'shabbat_current';

          return (
            <div
              key={ws.id}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 select-none border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/60'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectWorkspace(ws.id)}
                className="flex items-center gap-1.5"
              >
                <span className="text-sm leading-none">{ws.emoji || '📜'}</span>
                <span className="whitespace-nowrap">{ws.title}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                )}
              </button>

              {/* Extra options dropdown for duplicate / delete */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={`p-0.5 rounded-md hover:bg-black/10 transition-colors opacity-70 hover:opacity-100 ${
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-xs w-36" dir="rtl">
                  <DropdownMenuItem onClick={() => onDuplicateWorkspace(ws.id)} className="gap-2 cursor-pointer">
                    <Copy className="w-3.5 h-3.5" /> שכפל מודעה
                  </DropdownMenuItem>
                  {!isShabbat && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm(`האם למחוק את מודעת ${ws.title}?`)) {
                            onDeleteWorkspace(ws.id);
                          }
                        }} 
                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> מחק מודעה
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      {/* Add new Holiday button */}
      <div className="shrink-0 flex items-center gap-1">
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs font-bold rounded-xl bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף מודעת חג / מועד</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 text-xs p-1.5" dir="rtl">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground font-bold px-2 py-1">
              בחר תבנית חג לעבודה במקביל:
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {HOLIDAY_PRESETS.map((h) => (
              <DropdownMenuItem
                key={h.id}
                onClick={() => {
                  onCreateHolidayWorkspace(h.id);
                  setMenuOpen(false);
                }}
                className="flex items-center justify-between px-2.5 py-2 cursor-pointer rounded-lg hover:bg-primary/10"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{h.emoji}</span>
                  <span className="font-bold text-foreground">{h.name}</span>
                </div>
                {h.isTwoDay && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20">
                    יומיים
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
