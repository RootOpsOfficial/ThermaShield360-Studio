/**
 * Open-Meteo Domain Rate Limiter & Single-Flight Cooldown Coordinator
 *
 * Prevents IP-level 429 burst lockouts on api.open-meteo.com across all
 * dependent models (Open-Meteo NWP, ECMWF IFS, NOAA GFS, NOAA GEFS).
 */

interface CacheEntry<T> {
  payload: T;
  timestamp: number;
}

const clientCaches = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();
let openMeteoCooldownUntil = 0;

/**
 * Check if the Open-Meteo domain is currently in a 429 backoff cooldown
 */
export function isOpenMeteoInCooldown(): boolean {
  return Date.now() < openMeteoCooldownUntil;
}

/**
 * Returns remaining cooldown seconds, or 0 if active
 */
export function getOpenMeteoCooldownRemainingSeconds(): number {
  const diff = openMeteoCooldownUntil - Date.now();
  return diff > 0 ? Math.ceil(diff / 1000) : 0;
}

/**
 * Activate a short cooldown period across all Open-Meteo domain endpoints.
 * Default is 25 seconds (respects Open-Meteo 20-30s window without punitive 15-minute lockouts).
 */
export function setOpenMeteoCooldown(seconds: number = 25): void {
  openMeteoCooldownUntil = Date.now() + seconds * 1000;
  console.warn(`[OpenMeteoLimiter] Cooldown activated for ${seconds}s across all open-meteo domain endpoints.`);
}

/**
 * Retrieve cached entry if available (even if expired, for stale-fallback purposes)
 */
export function getStaleCache<T>(key: string): T | null {
  const entry = clientCaches.get(key);
  return entry ? (entry.payload as T) : null;
}

/**
 * Set an item in cache
 */
export function setCacheItem<T>(key: string, payload: T): void {
  clientCaches.set(key, { payload, timestamp: Date.now() });
}

/**
 * Executes an async fetch operation with single-flight promise de-duplication
 * and in-memory TTL caching.
 */
export async function fetchWithSingleFlightAndCache<T>(
  key: string,
  ttlMs: number,
  fetchFn: () => Promise<T>,
  force = false
): Promise<T> {
  const now = Date.now();
  if (!force) {
    const cached = clientCaches.get(key);
    if (cached && now - cached.timestamp < ttlMs) {
      return cached.payload as T;
    }
  }

  const existingInFlight = inFlightRequests.get(key);
  if (existingInFlight) {
    return existingInFlight as Promise<T>;
  }

  const promise = (async () => {
    try {
      const result = await fetchFn();
      clientCaches.set(key, { payload: result, timestamp: Date.now() });
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}
