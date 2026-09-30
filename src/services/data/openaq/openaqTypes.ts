export interface OpenAqMeasurement {
  parameter: string;
  value: number;
  unit: string;
  lastUpdated: string;
}

export interface OpenAqRawData {
  locationId: string | number;
  locationName: string;
  /** Locality / city reported by the provider (NOT hardcoded) */
  city: string | null;
  /** ISO country code reported by the provider (NOT hardcoded) */
  country: string | null;
  /** Reporting authority / provider of the station as reported by OpenAQ */
  reportingProvider: string | null;
  timezone: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  measurements: OpenAqMeasurement[];
  pm25: number | null; // ug/m3
  pm10: number | null; // ug/m3
  o3: number | null;   // ug/m3 (as returned by provider)
  no2: number | null;  // ug/m3
  so2: number | null;  // ug/m3
  co: number | null;   // ug/m3
  /** ThermaShield-derived PM2.5-based AQI-like index. DERIVED — not a provider value. */
  aqiEstimated: number | null;
  /** Latest measurement timestamp reported by the provider */
  observedAt: string | null;
  /** Distance from requested point to the reporting station (km) */
  stationDistanceKm: number;
  /** Explicit semantics: air-quality only, never used as temperature */
  dataSemantics: 'AIR_QUALITY_SURFACE_MEASUREMENT';
}
