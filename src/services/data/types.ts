import {
  DataAvailabilityStatus,
  MeteorologicalDataType,
  SourceRole,
  SpatialMethod,
} from '../normalization/thermaShieldRecord.js';

export type DataProviderId =
  | 'openMeteo'
  | 'ecmwf'
  | 'noaaGfs'
  | 'noaaGefs'
  | 'noaaNcei'
  | 'copernicusEra5'
  | 'nasaPower'
  | 'nasaFirms'
  | 'openaq'
  | 'imd'
  | 'google';

export type ProviderPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export type ProviderHealthStatus =
  | 'LIVE'
  | 'DEGRADED'
  | 'NOT_AVAILABLE'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'AUTHENTICATED';

export interface ProviderHealthReport {
  id: DataProviderId;
  name: string;
  role: string;
  priority: ProviderPriority;
  status: ProviderHealthStatus;
  httpStatus: number;
  latencyMs: number;
  endpointUrl: string;
  lastChecked: string; // ISO 8601
  message?: string;
  errorCode?: string | null;
  supportedVariables: string[];
}

export interface RawProviderPayload<T = unknown> {
  provider: string;
  providerId: DataProviderId;
  sourceUrl: string;
  model: string;
  run: string | null;
  issuedAt: string | null;
  validTime: string | null;
  forecastLeadHours: number | null;
  resolution: string | null;
  latitude: number;
  longitude: number;
  sourceLatitude: number | null;
  sourceLongitude: number | null;
  spatialMethod: SpatialMethod | null;
  spatialDistanceKm: number | null;
  retrievedAt: string; // ISO 8601
  httpStatus: number;
  responseTimeMs: number;
  dataType: MeteorologicalDataType;
  sourceRole: SourceRole;
  availability: DataAvailabilityStatus;
  isFallback: boolean;
  errorMessage: string | null;
  errorCode?: string | null;
  rawData: T | null;
}
