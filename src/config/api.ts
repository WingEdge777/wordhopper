export const PRODUCTION_ORIGIN = 'https://wordhopper.wingedge777.com';

/** Always same-origin `/api`. Dev traffic is proxied by Vite to production. */
export function getApiBase(): string {
  return import.meta.env.VITE_API_BASE ?? '/api';
}

export function apiUrl(path: string): string {
  return `${getApiBase()}${path}`;
}
