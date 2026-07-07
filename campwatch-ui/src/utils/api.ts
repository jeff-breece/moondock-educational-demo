export const API_BASE = (import.meta.env.VITE_CAMPWATCH_API_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path}`;
}
