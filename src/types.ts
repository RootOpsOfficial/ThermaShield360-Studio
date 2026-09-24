export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';
export type DataSourceLabel = 'LIVE' | 'MODELLED' | 'ESTIMATED' | 'CURATED';
export type FacilityStatus = 'Available' | 'Limited' | 'Unavailable';

export interface WardInfo {
  id: string;
  name: string;
  zone: string;
  center: [number, number];
  bounds: [number, number][];
  population: number;
  vulnerableCount: number;
  treeCanopyPct: number;
  builtDensityPct: number;
  vulnerabilityIndex: number;
  uhiOffsetDegC: number;
  highRiskAreas: string[];
  lowRiskAreas: string[];
}

export interface WeatherCurrent {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  solarIrradiance: number;
  uvIndex: number;
  pressure: number;
  weatherCode: number;
  weatherDescription: string;
  source: DataSourceLabel;
  lastUpdated: string;
}

export interface WeatherHourly {
  time: string;
  hour: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  wbgt: number;
  utci: number;
  heatIndex: number;
  riskLevel: RiskLevel;
}

export interface WeatherDailyForecast {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  feelsLikeMax: number;
  humidityAvg: number;
  solarRadiationMax: number;
  riskLevel: RiskLevel;
  heatwaveStatus: 'None' | 'Heatwave' | 'Severe Heatwave';
  peakPeriod: string;
  summary: string;
}

export interface ThermalCurrent {
  overallLevel: RiskLevel;
  wbgt: number;
  utci: number;
  heatIndex: number;
  ambientTemp: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  citizenExplanation: string;
  whatDoesThisMean: string[];
  peakPeriod: string;
  source: DataSourceLabel;
}

export interface RiskCurrent {
  overallRiskLevel: RiskLevel;
  riskScore: number;
  heatwaveStatus: string;
  peakPeriod: string;
  humanExplanation: string;
  source: DataSourceLabel;
  ward: string;
  zone: string;
  thermalStressLevel: RiskLevel;
  vulnerabilityScore: number;
  exposureScore: number;
  riskDrivers: {
    name: string;
    percentage: number;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
  }[];
  trend: 'Rising' | 'Peak' | 'Easing' | 'Stable';
  safetyAdvice: string[];
}

export type HeatwavePredictionStatus = 'COMING' | 'LIKELY' | 'POSSIBLE' | 'UNLIKELY' | 'NO_HEATWAVE';

export interface ModelConfidenceData {
  modelName: 'ECMWF' | 'NOAA' | 'IMD' | 'GFS';
  fullName: string;
  confidencePct: number;
  prediction: string;
  anomalyDegC: number;
  agreement: boolean;
  notes: string;
}

export interface UnifiedHeatwaveVerdict {
  isHeatwaveComing: boolean;
  verdict: 'HEATWAVE IS COMING' | 'NO HEATWAVE COMING';
  unifiedConfidencePct: number; // The ONE combined number from all resources
  confidenceGrade: 'Very High' | 'High' | 'Moderate' | 'Low';
  nextArrivalWindow: string;
  expectedDuration: string;
  threatLevel: 'Extreme' | 'High' | 'Moderate' | 'Low';
  methodology: string;
  contributingModels: {
    name: 'IMD' | 'ECMWF' | 'NOAA' | 'GFS';
    confidence: number;
    weightPct: number;
    contributionScore: number;
  }[];
  primaryGuidance: string;
}

export interface EarlyWarningHorizon {
  id: string;
  timeRangeLabel: '8 to 12 Month' | '5 to 8 Month' | '2 to 5 Month' | '1 to 2 Month' | '1 to 30 Days';
  timeRangeTitle: string;
  targetWindow: string;
  isHeatwaveComing: boolean;
  heatwaveStatus: HeatwavePredictionStatus;
  verdict: 'HEATWAVE IS COMING' | 'NO HEATWAVE COMING';
  statusHeadline: string;
  unifiedConfidencePct: number; // The ONE combined number for this horizon
  consensusConfidencePct: number;
  expectedOnsetDates: string;
  expectedDuration: string;
  severityLevel: 'Extreme' | 'High' | 'Moderate' | 'Low';
  models: {
    ecmwf: ModelConfidenceData;
    noaa: ModelConfidenceData;
    imd: ModelConfidenceData;
    gfs: ModelConfidenceData;
  };
  climateDrivers: string[];
  citizenGuidance: {
    title: string;
    actionItems: string[];
    prepStage: string;
  };
}

export interface LongRangeEarlyWarningReport {
  generatedAt: string;
  location: string;
  unifiedVerdict: UnifiedHeatwaveVerdict; // The single combined output
  overallNextHeatwaveArrival: string;
  overallThreatLevel: 'Extreme' | 'High' | 'Moderate' | 'Low';
  overallConsensusStatus: string;
  modelsCompared: string[];
  horizons: EarlyWarningHorizon[];
}

export interface ProtectionPoint {
  id: string;
  name: string;
  type: 'water' | 'cooling' | 'shade' | 'healthcare';
  categoryLabel: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  walkingTimeMins?: number;
  address: string;
  wardId: string;
  zone: string;
  status: FacilityStatus;
  capacity: number;
  currentOccupancy: number;
  availableCapacity: number;
  amenities: string[];
  contact?: string;
  operatingHours: string;
  isEmergencyReady?: boolean;
}

export interface ProtectionSummary {
  wardName: string;
  zoneName: string;
  totalFacilities: number;
  waterPointsCount: number;
  coolingCentresCount: number;
  shadeAreasCount: number;
  healthcareCount: number;
  expectedPeopleRequiringProtection: number;
  availableCapacity: number;
  protectionDemand: number;
  protectionGap: number;
  capacityFulfillmentPct: number;
  overallStatus: FacilityStatus;
  dataSource: DataSourceLabel;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: 'Hospital' | 'Emergency Care' | 'Urban Clinic' | 'Heat Health Centre';
  lat: number;
  lng: number;
  distanceKm: number;
  travelTimeMins: number;
  travelMode: 'Walking' | 'Driving' | 'Ambulance';
  address: string;
  wardId: string;
  phone: string;
  isOpen24x7: boolean;
  status: FacilityStatus;
  emergencyIndicator: boolean;
  heatStrokeBedsAvailable: number;
  totalHeatBeds: number;
  directionsUrl: string;
  dataSource: DataSourceLabel;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  instruction: string;
  distanceMeters: number;
  thermalExposure: RiskLevel;
  shadeCoveragePct: number;
  nearbyProtection?: {
    name: string;
    type: 'water' | 'cooling' | 'shade' | 'healthcare';
  };
}

export interface SafeRouteOption {
  id: string;
  name: 'FASTEST ROUTE' | 'THERMAL-SAFE ROUTE';
  tagline: string;
  distanceKm: number;
  timeMins: number;
  heatExposureLevel: RiskLevel;
  heatExposureScore: number;
  treeCanopyPct: number;
  perceivedTempDeltaDegC: number;
  protectionPointsCount: {
    water: number;
    cooling: number;
    shade: number;
    healthcare: number;
  };
  pathCoordinates: [number, number][];
  waypoints: RouteWaypoint[];
  recalculatedDueToRisk?: boolean;
}

export interface AdaptiveRecommendation {
  id: string;
  priority: 'Immediate' | 'Important' | 'Advisory';
  what: string;
  where: string;
  when: string;
  why: string;
  category: 'Outdoor Activity' | 'Cooling Centre' | 'Hydration' | 'Shaded Route' | 'High-Risk Avoidance' | 'Vulnerable Care';
  actionButtonText?: string;
  actionRoute?: string;
}

export interface CitizenHeatRiskResponse {
  location: {
    lat: number;
    lng: number;
    name: string;
    city: string;
    state: string;
  };
  city: string;
  zone: string;
  ward: WardInfo;
  riskScore: number;
  riskLevel: RiskLevel;
  currentStatus: string;
  hourlyRisk: Array<{
    timeLabel: string;
    hour: number;
    riskScore: number;
    riskLevel: RiskLevel;
    isCurrent: boolean;
    isPeak: boolean;
    isLowest: boolean;
    trend: 'increasing' | 'decreasing' | 'peak' | 'steady' | 'lowest';
    note?: string;
  }>;
  peakRiskPeriod: string;
  lowestRiskPeriod: string;
  riskIncreasingTime: string;
  riskDecreasingTime: string;
  riskDrivers: Array<{
    name: string;
    category: string;
    percentage: number;
    impact: 'Low' | 'Moderate' | 'High' | 'Critical';
    description: string;
  }>;
  nearbyWardRisk: Array<{
    id: string;
    name: string;
    zone: string;
    center: [number, number];
    bounds?: [number, number][];
    riskScore: number;
    riskLevel: RiskLevel;
    currentStatus: string;
    isCurrentWard: boolean;
    builtDensityPct?: number;
    treeCanopyPct?: number;
    uhiOffsetDegC?: number;
  }>;
  riskExplanation: string;
  dataStatus: DataSourceLabel;
  confidence: string;
  lastUpdated: string;
}

export interface CitizenAlert {
  id: string;
  type: 'Heatwave alert' | 'High heat-risk alert' | 'Critical heat alert' | 'Protection warning' | 'Location-specific safety advice';
  title: string;
  riskLevel: RiskLevel;
  whatIsHappening: string;
  where: string;
  when: string;
  whatToDoNext: string[];
  issuedAt: string;
  isRead: boolean;
  urgent: boolean;
  recommendedAction: string;
}

export interface CitizenMyRiskData {
  location: {
    lat: number;
    lng: number;
    name: string;
    city: string;
    state: string;
    country: string;
  };
  city: string;
  zone: string;
  ward: WardInfo;
  currentRisk: string;
  riskLevel: RiskLevel;
  riskScore: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  solarRadiation: number;
  uvIndex: number;
  wbgt: number;
  utci: number;
  heatIndex: number;
  thermalStress: {
    level: RiskLevel;
    wbgt: number;
    utci: number;
    heatIndex: number;
    explanation: string;
    points: string[];
  };
  vulnerability: {
    score: number;
    level: string;
    builtDensityPct: number;
    treeCanopyPct: number;
    vulnerablePopulation: number;
    uhiOffsetDegC: number;
    explanation: string;
    factors: Array<{
      factor: string;
      value: string;
      impact: 'High' | 'Medium' | 'Low';
      description: string;
    }>;
  };
  exposure: {
    score: number;
    level: string;
    peakHours: string;
    solarIrradiance: number;
    daytimeWindow: string;
    explanation: string;
  };
  riskDrivers: Array<{
    name: string;
    value: string;
    percentage: number;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
  }>;
  hourlyRisk: Array<{
    hour: number;
    timeLabel: string;
    temp: number;
    wbgt: number;
    utci: number;
    heatIndex: number;
    riskLevel: RiskLevel;
    riskScore: number;
    category: 'lowest' | 'peak' | 'improving' | 'normal';
    isCurrent: boolean;
  }>;
  fiveDayRisk: Array<{
    day: number;
    dayName: string;
    date: string;
    tempMax: number;
    tempMin: number;
    riskLevel: RiskLevel;
    riskScore: number;
    thermalStress: RiskLevel;
    wbgt: number;
    utci: number;
    trend: string;
  }>;
  peakRiskPeriod: string;
  nearbyProtection: {
    waterPoints: { count: number; nearestDistanceKm: number; nearestName: string; status: string };
    coolingCentres: { count: number; nearestDistanceKm: number; nearestName: string; capacityAvailable: number; status: string };
    shadeAreas: { count: number; nearestDistanceKm: number; nearestName: string; status: string };
    healthcare: { count: number; nearestDistanceKm: number; nearestName: string; availableHeatBeds: number; status: string };
    totalFacilitiesCount: number;
    availabilityStatus: string;
    expectedProtectionDemand: 'High' | 'Moderate' | 'Critical';
    protectionGap: string;
    nearestPoints: Array<{
      id: string;
      name: string;
      type: string;
      categoryLabel: string;
      distanceKm: number;
      travelTimeMins: number;
      travelMode: string;
      status: string;
      address: string;
      amenities: string[];
    }>;
  };
  recommendedAction: {
    what: string;
    where: string;
    when: string;
    why: string;
  };
  safetyAdvice: string[];
  lastUpdated: string;
  dataStatus: DataSourceLabel;
  dataSource: string;
}


export interface HeatwaveStatus {
  status: string;
  alertCode: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
  currentTemp: number;
  thresholdTemp: number;
  departureFromNormalDegC: number;
  durationDays: number;
  dayOfEpisode: number;
  persistence: string;
  peakPeriod: string;
  riskTrend: string;
  trajectory: string;
  forecastConfidence: number;
  issuingAgency: string;
  source: DataSourceLabel;
}

export type CitizenPage =
  | 'home'
  | 'risk'
  | 'heatwave'
  | 'thermal'
  | 'map'
  | 'future'
  | 'protection'
  | 'healthcare'
  | 'route'
  | 'adaptive'
  | 'alerts'
  | 'settings';
