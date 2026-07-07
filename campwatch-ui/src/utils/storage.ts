export const SEARCH_INTENT_KEY = 'campwatch_search_intent';
export const SELECTED_SITE_KEY = 'campwatch_selected_site';
export const TRIP_DRAFT_KEY = 'campwatch_trip_draft';
export const LOG_CONTEXT_KEY = 'campwatch_log_context';
export const FLASH_KEY = 'campwatch_flash';

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function clearStored(key: string) {
  window.localStorage.removeItem(key);
}
