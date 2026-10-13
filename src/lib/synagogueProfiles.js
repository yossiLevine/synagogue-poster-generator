import { getSynagogueId, loadProfilesFromDB, saveProfilesToDB } from './synagogueDB';

const LS_KEY = 'synagogue_profiles';

async function getProfiles() {
  if (getSynagogueId()) {
    try {
      const dbData = await loadProfilesFromDB();
      if (dbData && Object.keys(dbData).length > 0) {
        localStorage.setItem(LS_KEY, JSON.stringify(dbData));
        return dbData;
      }
    } catch {}
  }
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

async function setProfiles(profiles) {
  localStorage.setItem(LS_KEY, JSON.stringify(profiles));
  if (getSynagogueId()) await saveProfilesToDB(profiles);
}

export function loadProfiles() {
  // sync fallback for initial render
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

export async function saveProfile(name, data) {
  const profiles = await getProfiles();
  profiles[name] = { ...data, savedAt: new Date().toISOString() };
  await setProfiles(profiles);
}

export async function deleteProfile(name) {
  const profiles = await getProfiles();
  delete profiles[name];
  await setProfiles(profiles);
}