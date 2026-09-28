export interface GoogleAirQualityRawData {
  dateTime: string;
  regionCode: string;
  indexes: Array<{
    code: string;
    displayName: string;
    aqi: number;
    aqiDisplay: string;
    color: { red?: number; green?: number; blue?: number };
    category: string;
    dominantPollutant: string;
  }>;
  pollutants: Array<{
    code: string;
    displayName: string;
    fullName: string;
    concentration: { value: number; units: string };
  }>;
}

export interface GoogleMapsGisData {
  serviceStatus: 'OK' | 'FALLBACK';
  apiKeyConfigured: boolean;
  geocodingAvailable: boolean;
  placesAvailable: boolean;
  routesAvailable: boolean;
  cartoBasemapStatus: 'AVAILABLE' | 'OFFLINE';
  puneWardGeoJsonAvailable: boolean;
}
