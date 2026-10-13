import { getSynagogueId, loadTemplatesFromDB, saveTemplatesToDB, loadHistoryFromDB, saveHistoryToDB } from './synagogueDB';

const LS_TEMPLATES = 'synagogue_templates';
const LS_HISTORY = 'synagogue_history';

// ----- Templates -----

export async function saveTemplate(name, prayerRows) {
  const templates = await loadTemplates();
  templates[name] = { prayerRows, savedAt: new Date().toISOString() };
  localStorage.setItem(LS_TEMPLATES, JSON.stringify(templates));
  if (getSynagogueId()) await saveTemplatesToDB(templates);
}

export async function loadTemplates() {
  if (getSynagogueId()) {
    try {
      const dbData = await loadTemplatesFromDB();
      if (dbData && Object.keys(dbData).length > 0) {
        localStorage.setItem(LS_TEMPLATES, JSON.stringify(dbData));
        return dbData;
      }
    } catch {}
  }
  try { return JSON.parse(localStorage.getItem(LS_TEMPLATES) || '{}'); } catch { return {}; }
}

export async function deleteTemplate(name) {
  const templates = await loadTemplates();
  delete templates[name];
  localStorage.setItem(LS_TEMPLATES, JSON.stringify(templates));
  if (getSynagogueId()) await saveTemplatesToDB(templates);
}

// ----- History -----

export async function addToHistory(entry) {
  const history = await loadHistory();
  history.unshift({ ...entry, createdAt: new Date().toISOString(), id: Date.now() });
  const trimmed = history.slice(0, 20);
  localStorage.setItem(LS_HISTORY, JSON.stringify(trimmed));
  if (getSynagogueId()) await saveHistoryToDB(trimmed);
}

export async function loadHistory() {
  if (getSynagogueId()) {
    try {
      const dbData = await loadHistoryFromDB();
      if (dbData && dbData.length > 0) {
        localStorage.setItem(LS_HISTORY, JSON.stringify(dbData));
        return dbData;
      }
    } catch {}
  }
  try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch { return []; }
}

export async function deleteFromHistory(id) {
  const history = (await loadHistory()).filter(h => h.id !== id);
  localStorage.setItem(LS_HISTORY, JSON.stringify(history));
  if (getSynagogueId()) await saveHistoryToDB(history);
}