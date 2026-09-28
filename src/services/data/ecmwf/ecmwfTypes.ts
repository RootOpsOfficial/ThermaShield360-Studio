export interface EcmwfRawData {
  model: 'IFS' | 'AIFS';
  run: string;
  gridResolution: string;
  latitude: number;
  longitude: number;
  forecastLeadHours: number;
  temperature_2m: number;
  relative_humidity_2m: number;
  dew_point_2m: number;
  surface_pressure_hpa: number;
  wind_speed_10m_ms: number;
  solar_radiation_wm2?: number | null;
  ensembleMemberCount?: number;
  openDataBucketUrl?: string;
  hourlyForecast?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
  };
}
