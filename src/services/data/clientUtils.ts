import { DataAvailabilityStatus, MeteorologicalDataType, SourceRole, SpatialMethod } from '../normalization/thermaShieldRecord.js';
import { DataProviderId, RawProviderPayload } from './types.js';

/**
 * Centralized Provider Operational Network Timeout (in milliseconds).
 * This is an operational network connectivity setting, NOT a scientific threshold.
 * Configurable via process.env.PROVIDER_REQUEST_TIMEOUT_MS with a sensible 6000ms default.
 */
export const PROVIDER_REQUEST_TIMEOUT_MS: number = (() => {
  const envVal = typeof process !== 'undefined' ? process.env?.PROVIDER_REQUEST_TIMEOUT_MS : undefined;
  if (envVal) {
    const parsed = parseInt(envVal, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 6000;
})();

/**
 * Categorizes HTTP status code into canonical DataAvailabilityStatus
 */
export function categorizeHttpStatus(status: number): DataAvailabilityStatus {
  if (status === 401 || status === 403) return 'AUTH_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500 && status < 600) return 'NOT_AVAILABLE';
  return 'NOT_AVAILABLE';
}

/**
 * Resolves canonical machine-readable errorCode for network/HTTP failures
 */
export function getCanonicalErrorCode(status: number, fallback?: string): string {
  if (status === 401) return 'HTTP_401';
  if (status === 403) return 'HTTP_403';
  if (status === 429) return 'HTTP_429';
  if (status >= 500 && status < 600) return `HTTP_${status}`;
  if (status > 0) return `HTTP_${status}`;
  return fallback || 'UNKNOWN_ERROR';
}

/**
 * Safely parses response JSON body.
 * If response body is HTML, invalid JSON, or empty, returns ok: false with error description.
 */
export async function safeParseJson<T>(
  response: Response
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return { ok: false, error: 'Empty response payload received from provider' };
    }
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: `Invalid JSON payload received from provider: ${err.message}` };
  }
}

/**
 * Standard factory for building an unavailable / error RawProviderPayload.
 * Ensures strict nullability: rawData is null, all required metadata fields are preserved.
 */
export function createUnavailablePayload<T = unknown>(params: {
  provider: string;
  providerId: DataProviderId;
  sourceUrl: string;
  model: string;
  availability: DataAvailabilityStatus;
  httpStatus: number;
  responseTimeMs: number;
  dataType: MeteorologicalDataType;
  sourceRole: SourceRole;
  errorMessage: string;
  errorCode?: string | null;
  latitude: number;
  longitude: number;
  sourceLatitude?: number | null;
  sourceLongitude?: number | null;
  spatialMethod?: SpatialMethod | null;
  spatialDistanceKm?: number | null;
  resolution?: string | null;
}): RawProviderPayload<T> {
  const resolvedErrorCode =
    params.errorCode ??
    (params.availability === 'TIMEOUT'
      ? 'REQUEST_TIMEOUT'
      : params.availability === 'INVALID_RESPONSE'
      ? 'INVALID_JSON'
      : params.httpStatus > 0
      ? getCanonicalErrorCode(params.httpStatus)
      : null);

  return {
    provider: params.provider,
    providerId: params.providerId,
    sourceUrl: params.sourceUrl,
    model: params.model,
    run: null,
    issuedAt: null,
    validTime: null,
    forecastLeadHours: null,
    resolution: params.resolution ?? '0.25 deg',
    latitude: params.latitude,
    longitude: params.longitude,
    sourceLatitude: params.sourceLatitude ?? null,
    sourceLongitude: params.sourceLongitude ?? null,
    spatialMethod: params.spatialMethod ?? 'NEAREST',
    spatialDistanceKm: params.spatialDistanceKm ?? null,
    retrievedAt: new Date().toISOString(),
    httpStatus: params.httpStatus,
    responseTimeMs: params.responseTimeMs,
    dataType: 'NOT_AVAILABLE',
    sourceRole: params.sourceRole,
    availability: params.availability,
    isFallback: false,
    errorMessage: params.errorMessage,
    errorCode: resolvedErrorCode,
    rawData: null,
  };
}

/**
 * Provider Test Override Handler
 * Allows unit and recovery tests to inject controlled mock responses or network failures
 * for specific providers without altering application code or real network behavior.
 */
export type ProviderFetchInterceptor = (
  providerId: DataProviderId,
  lat: number,
  lng: number
) => Promise<RawProviderPayload<any> | null>;

let activeInterceptor: ProviderFetchInterceptor | null = null;

export function setProviderFetchInterceptor(interceptor: ProviderFetchInterceptor | null): void {
  activeInterceptor = interceptor;
}

export function getProviderFetchInterceptor(): ProviderFetchInterceptor | null {
  return activeInterceptor;
}
