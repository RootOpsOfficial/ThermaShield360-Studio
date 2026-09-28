export type DataAvailabilityStatus =
  | 'LIVE'
  | 'DEGRADED'
  | 'NOT_AVAILABLE'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE';

export type MeteorologicalDataType =
  | 'LIVE'
  | 'OBSERVED'
  | 'FORECAST'
  | 'ENSEMBLE'
  | 'REANALYSIS'
  | 'CLIMATOLOGY'
  | 'CALCULATED'
  | 'PREDICTED'
  | 'HISTORICAL'
  | 'FUSED'
  | 'DEMO'
  | 'NOT_AVAILABLE';

export type SourceRole =
  | 'OBSERVATION'
  | 'OPERATIONAL_FORECAST'
  | 'ENSEMBLE'
  | 'REANALYSIS'
  | 'DERIVED_ENVIRONMENTAL'
  | 'LONG_RANGE_SIGNAL'
  | 'GIS_INFRASTRUCTURE';

export type SpatialMethod =
  | 'STATION'
  | 'NEAREST'
  | 'BILINEAR'
  | 'GRID_CELL'
  | 'OTHER_DOCUMENTED_METHOD';

export type NormalizationQualityStatus =
  | 'VALID'
  | 'SUSPECT'
  | 'INTERPOLATED'
  | 'FALLBACK'
  | 'UNAVAILABLE';

export type NormalizationValidationStatus =
  | 'VERIFIED'
  | 'PARTIAL'
  | 'STALE'
  | 'FAILED'
  | 'NOT_AVAILABLE'
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'INVALID_RESPONSE';

/**
 * NormalizedWeatherRecord: Canonical contract for all ThermaShield 360 inputs.
 * Enforces strict nullability: if an API or source is unavailable, variables are NULL.
 */
export interface NormalizedWeatherRecord {
  // Required core coordinates & timestamps
  timestamp: string;       // ISO 8601 UTC
  latitude: number;
  longitude: number;

  // Normalized Standard Meteorological Variables (NULL if source unavailable)
  temperatureC: number | null;
  relativeHumidityPercent: number | null;
  windSpeedMs: number | null;
  solarRadiationWm2: number | null;
  dewPointC: number | null;
  surfacePressureHpa: number | null;

  // Provenance & Source Metadata
  source: string;
  provider: string;
  dataset: string;
  model: string;

  // Temporal Metadata
  run: string | null;
  issuedAt: string | null;
  validTime: string | null;
  forecastLeadHours: number | null;

  // Spatial Metadata
  sourceLatitude: number | null;
  sourceLongitude: number | null;
  spatialMethod: SpatialMethod | null;
  spatialDistanceKm: number | null;
  resolution: string | null;

  // Data Classification & Availability
  dataType: MeteorologicalDataType;
  sourceRole: SourceRole;
  retrievedAt: string;     // ISO 8601 UTC

  // Quality & Validation Flags
  qualityStatus: NormalizationQualityStatus;
  validationStatus: NormalizationValidationStatus;
  availability: DataAvailabilityStatus;
  errorCode?: string | null;

  // Unique Identifiers
  recordId: string;
  id: string;              // Alias for recordId for backward compatibility

  // Additional Environmental Context (when applicable)
  precipitationMm?: number | null;
  cloudCoverPercent?: number | null;
  uvIndex?: number | null;
  airQualityPm25?: number | null;
  airQualityAqi?: number | null;
  validationErrors?: string[];
}

/**
 * Backward compatibility alias for NormalizedWeatherRecord.
 */
export type ThermaShieldNormalizedRecord = NormalizedWeatherRecord;

/**
 * Generates an immutable, traceable record ID
 */
export function generateNormalizedRecordId(
  source: string,
  model: string,
  lat: number,
  lng: number,
  timestamp: string
): string {
  const cleanSource = source.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const cleanModel = model.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const latStr = lat.toFixed(3);
  const lngStr = lng.toFixed(3);
  const timeStr = timestamp.replace(/[^a-zA-Z0-9]/g, '');
  return `${cleanSource}_${cleanModel}_${latStr}_${lngStr}_${timeStr}`;
}
