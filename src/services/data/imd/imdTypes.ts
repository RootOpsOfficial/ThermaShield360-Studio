export type ImdAlertCode = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface ImdStationObservation {
  stationCode: string; // e.g. 'PUN_SHIVAJI' or 'PUN_LOH'
  stationName: string;
  observedAt: string;
  /** null when the official feed did not supply the field (never fabricated) */
  maxTemperatureC: number | null;
  minTemperatureC: number | null;
  currentTemperatureC: number | null;
  departureFromNormalDegC: number | null;
  relativeHumidityPct: number | null;
  windSpeedKmh: number | null;
  rainfallPast24hMm: number | null;
  pressureHpa: number | null;
}

export interface ImdDistrictWarning {
  district: string;
  state: string;
  warningDate: string;
  alertCode: ImdAlertCode;
  warningText: string;
  heatwaveType: 'NONE' | 'HEATWAVE' | 'SEVERE_HEATWAVE';
  /** null when not supplied by the official bulletin */
  expectedMaxTempC: number | null;
}

export interface ImdSeasonalOutlook {
  issueSeason: string;
  /** null when no official seasonal probability was published */
  heatwaveProbabilityAboveNormalPct: number | null;
  ensoStatus: 'El Niño' | 'La Niña' | 'ENSO-Neutral';
  iodStatus: 'Positive IOD' | 'Negative IOD' | 'Neutral IOD';
  bulletinTitle: string;
}

export interface ImdRawData {
  station: ImdStationObservation;
  warning: ImdDistrictWarning;
  seasonalOutlook: ImdSeasonalOutlook;
  officialBulletinRef: string;
}
