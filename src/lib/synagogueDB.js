/**
 * synagogueDB.js
 * Central data access layer — reads/writes all synagogue-specific settings
 * to Firestore 'synagogues' collection (keyed by synagogue_id from localStorage).
 * Falls back to local-api for non-Gabai (demo) mode if in DEV.
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Get the current synagogue_id (set during Gabai login)
export function getSynagogueId() {
  return localStorage.getItem('synagogue_id') || null;
}

// ----- Low-level helpers -----

let _cache = null; // in-memory cache for the current session

export function clearSynagogueCache() {
  _cache = null;
}

export async function loadSynagogue(targetId = null) {
  const id = targetId || getSynagogueId();
  if (!id) return null;
  if (_cache && _cache.id === id) return _cache;
  try {
    const docRef = doc(db, 'synagogues', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      _cache = { id: docSnap.id, ...docSnap.data() };
      return _cache;
    } else {
      console.warn('synagogueDB: synagogue not found in Firestore');
      return null;
    }
  } catch (e) {
    console.error('synagogueDB: failed to load synagogue', e);
    return null;
  }
}

async function updateField(field, value, targetId = null) {
  const id = targetId || getSynagogueId();
  const update = { [field]: typeof value === 'string' ? value : JSON.stringify(value) };
  
  if (!id) {
    // Fallback to local file DB in Dev Mode
    if (import.meta.env.DEV) {
      try {
        _cache = { ..._cache, ...update };
        await fetch('/local-api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
      } catch (e) {
        console.error(`synagogueDB: failed to update local file DB ${field}`, e);
      }
    }
    return;
  }
  
  try {
    if (_cache && _cache.id === id) {
      _cache = { ..._cache, ...update };
    }
    const docRef = doc(db, 'synagogues', id);
    await updateDoc(docRef, update);
  } catch (e) {
    console.error(`synagogueDB: failed to update ${field}`, e);
  }
}

async function readField(field, fallback, targetId = null) {
  const id = targetId || getSynagogueId();
  
  if (!id) {
    if (import.meta.env.DEV) {
      if (!_cache || _cache.id) { // if _cache.id exists it means it was a real syn cache, we need local
        try {
          const res = await fetch('/local-api/db');
          _cache = await res.json();
        } catch (e) {
          return fallback;
        }
      }
      const raw = _cache[field];
      if (!raw) return fallback;
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        return raw;
      }
    }
    return fallback;
  }

  const syn = await loadSynagogue(id);
  if (!syn) return fallback;
  try {
    const raw = syn[field];
    if (!raw) return fallback;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return fallback;
  }
}

// ----- Synagogue Config -----

export async function loadConfigFromDB(targetId = null) {
  return readField('synagogue_config', null, targetId);
}

export async function saveConfigToDB(config, targetId = null) {
  await updateField('synagogue_config', config, targetId);
}

// ----- Prayer Rules -----

export async function loadRulesFromDB() {
  return readField('prayer_rules', []);
}

export async function saveRulesToDB(rules) {
  await updateField('prayer_rules', rules);
}

// ----- Prayer Profiles -----

export async function loadProfilesFromDB() {
  return readField('prayer_profiles', {});
}

export async function saveProfilesToDB(profiles) {
  await updateField('prayer_profiles', profiles);
}

// ----- Selected Zmanim -----

export async function loadZmanimFromDB() {
  return readField('selected_zmanim', null);
}

export async function saveZmanimToDB(zmanim) {
  await updateField('selected_zmanim', zmanim);
}

// ----- Zmanim Overrides -----

export async function loadZmanimOverridesFromDB() {
  return readField('zmanim_overrides', null);
}

export async function saveZmanimOverridesToDB(overrides) {
  await updateField('zmanim_overrides', overrides);
}

// ----- Templates -----

export async function loadTemplatesFromDB() {
  return readField('templates', {});
}

export async function saveTemplatesToDB(templates) {
  await updateField('templates', templates);
}

// ----- Poster History -----

export async function loadHistoryFromDB() {
  return readField('poster_history', []);
}

export async function saveHistoryToDB(history) {
  await updateField('poster_history', history);
}

// ----- Draft -----

export async function loadDraftFromDB() {
  return readField('editor_draft', null);
}

export async function saveDraftToDB(draft) {
  await updateField('editor_draft', draft);
}