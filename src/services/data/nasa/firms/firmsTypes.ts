export interface NasaFirmsHotspot {
  latitude: number;
  longitude: number;
  brightnessKelvin: number;
  scan: number;
  track: number;
  acqDate: string;
  acqTime: string;
  satellite: string;
  instrument: string;
  confidence: string;
  frpMw: number;
  dayNight: string;
}

export interface NasaFirmsRawData {
  satelliteSensor: 'MODIS' | 'VIIRS-SNPP' | 'VIIRS-NOAA20';
  areaBoundingBox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  /** 0 is a legitimate value meaning "no active fire detection in the queried window" */
  detectedHotspotCount: number;
  /** null when the provider returned no hotspots (NOT fabricated as 0) */
  maxBrightnessTempKelvin: number | null;
  /** null when the provider returned no hotspots (NOT fabricated as 0) */
  fireRadiativePowerMw: number | null;
  confidenceCategory: 'nominal' | 'high' | 'low' | 'none';
  retrievalDate: string;
  sourceUrl: string;
  /** Actual satellite detections returned by the provider (may be empty) */
  hotspots: NasaFirmsHotspot[];
  /** Actual temporal window covered by the query (YYYY-MM-DD) */
  temporalWindowStart: string;
  temporalWindowEnd: string;
  /**
   * Data semantics: NASA FIRMS provides SATELLITE ACTIVE FIRE / THERMAL ANOMALY
   * detections only. This value must NEVER be interpreted as air temperature.
   */
  dataSemantics: 'SATELLITE_ACTIVE_FIRE_DETECTION';
}
