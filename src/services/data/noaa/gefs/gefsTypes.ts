export interface GefsMemberData {
  memberId: string;
  runTime: string;
  validTime: string;
  variable: string;
  value: number;
  source: string;
  model: string;
}

export interface NoaaGefsRawData {
  model: 'GEFS-Global-Ensemble';
  ensembleMemberCount: number;
  run: string;
  issuedAt: string;
  validTime: string;
  leadHours: number;
  latitude: number;
  longitude: number;
  ensembleMeanTempC: number | null;
  ensembleSpreadDegC: number | null; // Real standard deviation across ensemble members
  ensembleP10TempC: number | null;
  ensembleP50TempC: number | null;
  ensembleP90TempC: number | null;
  ensembleMaxTempC: number | null;
  ensembleMinTempC: number | null;
  heatwaveExceedanceProbabilityPct: number | null; // Real percentage of members exceeding 40°C
  relativeHumidityMeanPct: number | null;
  windSpeedMeanMs: number | null;
  members: GefsMemberData[];
  sourceUrl: string;
}
