import {
  symptomsData as CATALOG,
  SYMPTOM_CATALOG_VERSION,
} from "./symptomsCatalog";

/**
 * Local cache for the symptom catalogue.
 *
 * HONEST NOTE ON PERFORMANCE
 * --------------------------
 * The catalogue is a plain JS module, so it already ships inside the app
 * bundle — opening the registration form makes NO network request for it and
 * never has. This store does not make it "faster to load"; the list is already
 * in memory the moment the page runs.
 *
 * What it does buy:
 *  - one stable place to read symptoms from, so moving to a per-hospital
 *    API later is a change to this file only, not to every form
 *  - a version-stamped copy in localStorage, so custom symptoms a hospital
 *    types into the tags field can be persisted and offered back next time
 *  - a clean upgrade path: bump SYMPTOM_CATALOG_VERSION and every browser
 *    discards its stale copy on the next load
 *
 * Everything is wrapped in try/catch — private browsing and full-storage
 * conditions make localStorage throw, and a symptom list must never be the
 * reason a patient cannot be registered.
 */

const KEY = "velocare.symptoms";
const VERSION_KEY = "velocare.symptoms.version";

/** Read the cached catalogue, seeding or refreshing it when needed. */
export const getSymptoms = () => {
  try {
    const cachedVersion = Number(localStorage.getItem(VERSION_KEY));
    const raw = localStorage.getItem(KEY);

    if (raw && cachedVersion === SYMPTOM_CATALOG_VERSION) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }

    // Missing, corrupt, or from an older app version — reseed.
    localStorage.setItem(KEY, JSON.stringify(CATALOG));
    localStorage.setItem(VERSION_KEY, String(SYMPTOM_CATALOG_VERSION));
    return CATALOG;
  } catch (e) {
    // localStorage unavailable (private mode, quota full) — the bundled
    // catalogue still works perfectly well on its own.
    return CATALOG;
  }
};

/**
 * Persist a symptom the user typed themselves (the Select runs in `tags`
 * mode, so free text is allowed). It is then offered in the dropdown on the
 * next visit instead of being lost.
 */
export const rememberCustomSymptom = (name) => {
  const clean = String(name || "").trim();
  if (!clean) return;

  try {
    const current = getSymptoms();
    if (current.some((s) => s.symptom.toLowerCase() === clean.toLowerCase())) {
      return;
    }
    const next = [
      ...current,
      { symptom: clean, category: "Custom", titles: [] },
    ];
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    /* nothing to do — the in-memory list keeps working */
  }
};

/** Drop the cache so the next read reseeds from the bundled catalogue. */
export const resetSymptoms = () => {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(VERSION_KEY);
  } catch (e) {
    /* ignore */
  }
};

export default getSymptoms;
