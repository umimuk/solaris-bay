const STORAGE_KEY = 'solaris-bay.save.v1';

/** Restore the last local game snapshot, tolerating blocked storage and bad JSON. */
export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : null;
  } catch {
    return null;
  }
}

/** Persist only serializable game state; localStorage failures stay non-fatal. */
export function saveGame(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}
