export interface NasaFirmsRawData {
  satelliteSensor: 'MODIS' | 'VIIRS-SNPP' | 'VIIRS-NOAA20';
  areaBoundingBox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  detectedHotspotCount: number;
  maxBrightnessTempKelvin: number;
  fireRadiativePowerMw: number;
  confidenceCategory: 'nominal' | 'high' | 'low';
  retrievalDate: string;
  sourceUrl: string;
}
