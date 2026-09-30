export interface NoaaNceiRawData {
  datasetId: 'GHCND' | 'ISD';
  /** Actual station identifier resolved from the provider (NOT hardcoded) */
  stationId: string | null;
  stationName: string | null;
  latitude: number | null;
  longitude: number | null;
  elevationMeters: number | null;
  /** Whether the provider actually returned any observations for the window */
  hasObservations: boolean;
  /** Window actually queried (YYYY-MM-DD) */
  windowStart: string;
  windowEnd: string;
  /** Number of daily observations used for the derived statistics */
  sampleCount: number;

  // Climatological statistics ACTUALLY DERIVED from returned observations.
  // All null when the provider returned no data for the window.
  climatologicalMaxTempC: number | null;
  climatologicalMinTempC: number | null;
  normalMaxTempC: number | null;
  standardDeviationC: number | null;
  percentile90TempC: number | null;
  percentile95TempC: number | null;

  /** Explicit semantics: historical station observation, never "live current weather" */
  dataSemantics: 'HISTORICAL_STATION_OBSERVATION';
}
