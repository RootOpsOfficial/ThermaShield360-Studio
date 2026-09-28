export interface NoaaGfsRawData {
  model: 'GFS-0.25';
  cycle: '00z' | '06z' | '12z' | '18z';
  runTime: string;
  gridResolution: string;
  latitude: number;
  longitude: number;
  forecastLeadHours: number;
  temperature_2m_c: number;
  relative_humidity_2m_pct: number;
  dew_point_2m_c: number;
  surface_pressure_hpa: number;
  wind_speed_10m_ms: number;
  solar_radiation_wm2?: number | null;
  precip_rate_mm_hr?: number | null;
  nomadsUrl: string;
}
