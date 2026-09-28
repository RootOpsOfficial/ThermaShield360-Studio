export interface OpenMeteoRawData {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units?: Record<string, string>;
  current?: {
    time: string;
    interval?: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    direct_normal_irradiance?: number;
    weather_code?: number;
  };
  hourly_units?: Record<string, string>;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m?: number[];
    surface_pressure: number[];
    wind_speed_10m: number[];
    direct_normal_irradiance?: number[];
    weather_code?: number[];
  };
}
