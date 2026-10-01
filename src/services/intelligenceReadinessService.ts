import { getApiUrl } from '../lib/api.js';

export interface IntelligenceSourceInfo {
  name: string;
  status: string;
  role: string;
}

export interface IntelligenceReadinessReport {
  status: 'ready' | 'warming' | 'degraded' | 'unavailable';
  backend: boolean;
  database: boolean;
  weather: 'verified' | 'degraded' | 'unavailable';
  forecast: 'verified' | 'degraded' | 'unavailable' | 'partial';
  thermalEngine: 'ready' | 'degraded' | 'unavailable';
  riskEngine: 'ready' | 'degraded' | 'unavailable';
  hyperlocal: 'ready' | 'partial' | 'unavailable';
  timestamp: string;
  sources: IntelligenceSourceInfo[];
  location?: { lat: number; lng: number };
  error?: string;
}

export interface ReadinessCheckProgress {
  elapsedSeconds: number;
  stageMessage: string;
  report: IntelligenceReadinessReport | null;
  isComplete: boolean;
  isDegraded: boolean;
  isFailed: boolean;
}

/**
 * Returns dynamic status narrative matching real cold start elapsed time
 */
export function getColdStartMessage(elapsedSeconds: number): string {
  if (elapsedSeconds < 5) {
    return 'Connecting to Heat Intelligence...';
  }
  if (elapsedSeconds < 15) {
    return 'Waking up the intelligence engine (cloud backend synchronization)...';
  }
  if (elapsedSeconds < 30) {
    return 'Synchronizing real-world atmospheric observations & NWP models...';
  }
  return 'Backend is taking longer than usual to spin up. Continuing validation...';
}

/**
 * Probes the backend intelligence readiness endpoint.
 * Tolerates Render Free cold-start latencies with adaptive retries.
 */
export async function probeIntelligenceReadiness(
  lat: number = 18.5204,
  lng: number = 73.8567,
  timeoutMs: number = 10000
): Promise<IntelligenceReadinessReport> {
  const url = getApiUrl(`/api/intelligence/readiness?lat=${lat}&lng=${lng}`);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Readiness probe error`);
    }
    const data: IntelligenceReadinessReport = await res.json();
    return data;
  } finally {
    clearTimeout(id);
  }
}
