/**
 * ThermaShield 360 Centralized API Configuration & Fetch Client
 *
 * Designed for Cloudflare Pages (Frontend) + Render Free Web Service (Backend).
 * Supports automatic relative /api/* redirection to VITE_API_BASE_URL.
 */

export const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  ''
).replace(/\/$/, '');

/**
 * Resolves an API path to the canonical URL.
 * In same-origin deployment, '/api/weather/current' -> '/api/weather/current'
 * In Cloudflare Pages deployment, '/api/weather/current' -> 'https://thermashield.onrender.com/api/weather/current'
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return cleanPath;
  }
  return `${API_BASE_URL}${cleanPath}`;
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * Resilient API fetch wrapper with configurable timeout (default 60s for Render free cold starts)
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { timeoutMs = 60000, ...fetchOptions } = options;
  const url = getApiUrl(path);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: fetchOptions.signal || controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Global browser fetch interceptor:
// Ensures any relative '/api/*' call anywhere in the application automatically
// routes to VITE_API_BASE_URL when deployed to Cloudflare Pages.
if (typeof window !== 'undefined' && window.fetch && API_BASE_URL) {
  const nativeFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      input = `${API_BASE_URL}${input}`;
    }
    return nativeFetch.call(this, input, init);
  };
}
