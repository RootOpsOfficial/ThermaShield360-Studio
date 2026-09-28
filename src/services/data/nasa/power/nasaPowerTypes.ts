export interface NasaPowerRawData {
  parameters: {
    T2M?: Record<string, number>;
    RH2M?: Record<string, number>;
    ALLSKY_SFC_SW_DWN?: Record<string, number>;
    PS?: Record<string, number>;
    WS10M?: Record<string, number>;
  };
  messages?: string[];
  header?: {
    title: string;
    api_version: string;
    sources: string[];
    fill_value: number;
  };
  currentSample?: {
    temperatureC: number;
    relativeHumidityPct: number;
    solarIrradianceWm2: number;
    surfacePressureHpa: number;
    windSpeedMs: number;
  };
}
