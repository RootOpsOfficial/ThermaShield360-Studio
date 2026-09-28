export type ImdAlertCode = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

export interface ImdStationObservation {
  stationCode: string; // e.g. 'PUN_SHIVAJI' or 'PUN_LOH'
  stationName: string;
  observedAt: string;
  maxTemperatureC: number;
  minTemperatureC: number;
  currentTemperatureC: number;
  departureFromNormalDegC: number;
  relativeHumidityPct: number;
  windSpeedKmh: number;
  rainfallPast24hMm: number;
  pressureHpa: number;
}

export interface ImdDistrictWarning {
  district: string;
  state: string;
  warningDate: string;
  alertCode: ImdAlertCode;
  warningText: string;
  heatwaveType: 'NONE' | 'HEATWAVE' | 'SEVERE_HEATWAVE';
  expectedMaxTempC: number;
}

export interface ImdSeasonalOutlook {
  issueSeason: string; // e.g. 'April-June Hot Weather Season'
  heatwaveProbabilityAboveNormalPct: number;
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
