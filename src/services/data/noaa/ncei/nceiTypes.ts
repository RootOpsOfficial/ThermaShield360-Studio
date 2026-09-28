export interface NoaaNceiRawData {
  datasetId: 'GHCND' | 'ISD';
  stationId: string; // e.g. 'GHCND:IN022011700' (Pune Lohegaon)
  stationName: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  date: string;
  climatologicalMaxTempC: number;
  climatologicalMinTempC: number;
  normalMaxTempC: number; // 30-year normal
  standardDeviationC: number;
  percentile90TempC: number;
  percentile95TempC: number;
}
