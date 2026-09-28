export interface CopernicusEra5RawData {
  dataset: 'reanalysis-era5-single-levels' | 'seasonal-monthly-single-levels';
  productType: 'reanalysis' | 'climatological-monthly-mean';
  grid: string; // e.g. '0.25 x 0.25 deg'
  latitude: number;
  longitude: number;
  referencePeriod: string; // '1991-2020 Climatological Baseline'
  baselineMeanTempC: number;
  baselineMaxTempC: number;
  baselineMinTempC: number;
  baselineRelativeHumidityPct: number;
  baselineWindSpeedMs: number;
  surfacePressureHpa: number;
  solarRadiationWm2: number;
  reanalysisRunDate: string;
  sourceUrl: string;
}
