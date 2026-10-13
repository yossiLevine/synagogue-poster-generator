/**
 * Workspace Store (ניהול מרחב עבודה רב-מודעות מקבילי)
 * Allows working concurrently on multiple independent posters (Shabbat, Rosh Hashana, Yom Kippur, Sukkot)
 * with dedicated isolated drafts, instant tab switching, and auto-save.
 */

import { HOLIDAY_PRESETS } from './holidayEngine';

const WORKSPACES_LIST_KEY = 'synagogue_workspaces_list';
const ACTIVE_WORKSPACE_KEY = 'synagogue_active_workspace_id';

export const DEFAULT_SHABBAT_WORKSPACE = {
  id: 'shabbat_current',
  title: 'שבת הקרובה',
  emoji: '🕯️',
  type: 'shabbat',
  lastModified: Date.now(),
};

export function getWorkspaces() {
  try {
    const raw = localStorage.getItem(WORKSPACES_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse workspaces list', e);
  }
  const initial = [DEFAULT_SHABBAT_WORKSPACE];
  localStorage.setItem(WORKSPACES_LIST_KEY, JSON.stringify(initial));
  return initial;
}

export function saveWorkspaces(workspaces) {
  try {
    localStorage.setItem(WORKSPACES_LIST_KEY, JSON.stringify(workspaces));
  } catch (e) {
    console.warn('Failed to save workspaces', e);
  }
}

export function getActiveWorkspaceId() {
  try {
    const saved = localStorage.getItem(ACTIVE_WORKSPACE_KEY);
    if (saved) return saved;
  } catch (e) {}
  return DEFAULT_SHABBAT_WORKSPACE.id;
}

export function setActiveWorkspaceId(id) {
  try {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  } catch (e) {}
}

export function getWorkspaceDraftKey(workspaceId) {
  if (workspaceId === DEFAULT_SHABBAT_WORKSPACE.id) {
    return 'editor_draft'; // Backward compatible with existing drafts!
  }
  return `workspace_draft_${workspaceId}`;
}

export function loadWorkspaceDraft(workspaceId) {
  const key = getWorkspaceDraftKey(workspaceId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load draft for ' + key, e);
  }
  return null;
}

export function saveWorkspaceDraft(workspaceId, draft) {
  if (!draft) return;
  const key = getWorkspaceDraftKey(workspaceId);
  try {
    const dataWithTs = { ...draft, workspaceId, lastModified: Date.now() };
    localStorage.setItem(key, JSON.stringify(dataWithTs));
  } catch (e) {
    console.warn('Failed to save draft for ' + key, e);
  }
}

export function createWorkspaceFromHoliday(holidayId) {
  const holiday = HOLIDAY_PRESETS.find(h => h.id === holidayId);
  if (!holiday) return null;

  const id = `holiday_${holiday.id}_${Date.now().toString(36)}`;
  const newWorkspace = {
    id,
    title: holiday.name,
    emoji: holiday.emoji,
    type: 'holiday',
    holidayId: holiday.id,
    lastModified: Date.now(),
  };

  const initialDraft = {
    type: 'prayer',
    isHolidayMode: true,
    holidayId: holiday.id,
    holidayName: holiday.name,
    parasha: holiday.hebrewTitle,
    weeklyQuote: holiday.subtitle,
    isTwoDay: !!holiday.isTwoDay,
    labelDayA: holiday.dayLabelA || "יום א' דחג",
    labelDayB: holiday.dayLabelB || "יום ב' דחג",
    prayerRows: holiday.defaultRows.map(r => ({ ...r })),
    structuredAnnouncements: holiday.announcements.map(a => ({ ...a })),
    hasEruvTavshilin: false,
    showEruvTavshilin: false,
    hasYizkor: !!holiday.hasYizkor,
    showYizkor: !!holiday.hasYizkor,
    hasShofar: !!holiday.hasShofar,
    showShofar: !!holiday.hasShofar,
    lastModified: Date.now(),
  };

  saveWorkspaceDraft(id, initialDraft);

  const list = getWorkspaces();
  const updated = [...list, newWorkspace];
  saveWorkspaces(updated);
  setActiveWorkspaceId(id);

  return { workspace: newWorkspace, draft: initialDraft };
}

export function duplicateWorkspace(workspaceId) {
  const list = getWorkspaces();
  const src = list.find(w => w.id === workspaceId);
  if (!src) return null;

  const newId = `${src.id}_copy_${Date.now().toString(36)}`;
  const copy = {
    ...src,
    id: newId,
    title: `${src.title} (עותק)`,
    lastModified: Date.now(),
  };

  const srcDraft = loadWorkspaceDraft(workspaceId);
  if (srcDraft) {
    saveWorkspaceDraft(newId, { ...srcDraft, workspaceId: newId });
  }

  const updated = [...list, copy];
  saveWorkspaces(updated);
  setActiveWorkspaceId(newId);
  return { workspace: copy, draft: srcDraft };
}

export function deleteWorkspace(workspaceId) {
  if (workspaceId === DEFAULT_SHABBAT_WORKSPACE.id) {
    return false; // Cannot delete primary Shabbat workspace
  }
  try {
    localStorage.removeItem(getWorkspaceDraftKey(workspaceId));
  } catch (e) {}

  const list = getWorkspaces();
  const updated = list.filter(w => w.id !== workspaceId);
  saveWorkspaces(updated);
  setActiveWorkspaceId(DEFAULT_SHABBAT_WORKSPACE.id);
  return true;
}
