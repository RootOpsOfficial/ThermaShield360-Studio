export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';
export type DataSourceLabel = 'LIVE' | 'MODELLED' | 'ESTIMATED' | 'CURATED';
export type FacilityStatus = 'Available' | 'Limited' | 'Unavailable';

export interface WardInfo {
  id: string;
  name: string;
  zone: string;
  city?: string;
  state?: string;
  regionType?: 'Maharashtra' | 'National' | 'Local';
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
  timeRangeLabel:
    | '1 Day to 30 Days'
    | '1 to 30 Days'
    | '1 to 3 Months'
    | '1 to 2 Month'
    | '3 to 5 Months'
    | '2 to 5 Month'
    | '5 to 8 Months'
    | '5 to 8 Month'
    | '8 to 12 Months'
    | '8 to 12 Month'
    | '8 to 13 Months'
    | string;
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
  type: 'Hospital' | 'Emergency Care' | 'Urban Clinic' | 'Heat Health Centre' | 'Clinic' | 'Doctor';
  lat: number;
  lng: number;
  distanceKm: number;
  travelTimeMins: number;
  travelMode: 'Walking' | 'Driving' | 'Ambulance';
  address: string;
  wardId: string;
  phone?: string;
  website?: string;
  isOpen24x7?: boolean;
  status: FacilityStatus;
  emergencyIndicator: boolean;
  emergencyAvailability?: string;
  heatStrokeBedsAvailable?: number;
  totalHeatBeds?: number;
  directionsUrl?: string;
  dataSource: DataSourceLabel | string;
  source?: 'LIVE/EXTERNAL DATA' | 'CURATED/ESTIMATED' | string;
  sourceDetail?: string;
  lastUpdated?: string;
  osmId?: number | string;
}

export interface HealthcareRouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name?: string;
  maneuver?: {
    type?: string;
    modifier?: string;
    location?: [number, number];
  };
}

export interface HealthcareRouteResponse {
  routeGeometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lon, lat]
  };
  distanceKm: number;
  distanceMeters: number;
  durationMins: number;
  durationSeconds: number;
  summary: string;
  steps: HealthcareRouteStep[];
  source: 'OSRM' | 'LOCAL_ROUTING_FALLBACK';
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  instruction: string;
  distanceMeters: number;
  durationSeconds?: number;
  thermalExposure: RiskLevel;
  heatRiskScore?: number;
  shadeCoveragePct: number;
  solarExposure?: 'Low' | 'Moderate' | 'High' | 'Extreme';
  riskColor?: string;
  isHighRiskSegment?: boolean;
  nearbyProtection?: {
    id?: string;
    name: string;
    type: 'water' | 'cooling' | 'shade' | 'healthcare' | 'park';
    distanceMeters?: number;
  };
}

export interface RouteProtectionSummary {
  waterCount: number;
  coolingCount: number;
  shadeCount: number;
  parkCount: number;
  healthcareCount: number;
  highRiskSegmentCount: number;
  averageCanopyPct: number;
  perceivedTempDeltaDegC: number;
  nearestProtectionMeters: number;
}

export interface DepartureAdvice {
  bestTimeToLeave?: string;
  peakHeatPeriod?: string;
  routeRisk?: RiskLevel;
  advice?: string;
  tempSavingEstimate?: string;
  optimalDepartureWindow?: string;
  currentUrgency?: string;
  peakHeatWindow?: string;
  hourlyThermalProjection?: {
    time: string;
    wbgt: number;
    risk: string;
  }[];
  hydrationsRecommendationMlPerHour?: number;
}

export interface RouteResourcePoint {
  id: string;
  name: string;
  type: 'water' | 'cooling' | 'shade' | 'healthcare' | 'park';
  lat: number;
  lng: number;
  distanceKm?: number;
  address?: string;
  amenities?: string[];
  status?: string;
}

export interface SafeRouteOption {
  id: string;
  name: string; // 'FASTEST ROUTE' | 'SAFE & FAST (SUM ALGORITHM)' | 'THERMAL-SAFE ROUTE'
  routeType: 'fastest' | 'balanced' | 'safe';
  tagline: string;
  distanceKm: number;
  timeMins: number;
  durationSeconds?: number;
  heatExposureLevel: RiskLevel;
  heatExposureScore: number;
  treeCanopyPct: number;
  perceivedTempDeltaDegC: number;
  protectionPointsCount: {
    water: number;
    cooling: number;
    shade: number;
    healthcare: number;
    parks?: number;
  };
  protectionSummary?: RouteProtectionSummary;
  pathCoordinates: [number, number][];
  waypoints: RouteWaypoint[];
  recalculatedDueToRisk?: boolean;
  rerouteExplanation?: string;
  dataSource?: 'LIVE' | 'MODELLED' | 'CURATED';
  sumAlgorithm?: {
    algorithmName: string;
    formula: string;
    sumScore: number;
    speedScore: number;
    safetyScore: number;
    timePenaltyPct: number;
    heatReductionPct: number;
    optimalChoice: boolean;
  };
}

export interface RouteApiResponse {
  origin: { lat: number; lng: number; label: string };
  destination: { lat: number; lng: number; label: string };
  currentThermalStress: RiskLevel;
  weather?: {
    temp: number;
    humidity: number;
    solarIrradiance: number;
    wbgt: number;
    utci: number;
  };
  departureAdvice?: DepartureAdvice;
  routes: SafeRouteOption[];
  nearbyResources?: RouteResourcePoint[];
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
  personalImpact?: PersonalHeatImpact;
}

export type ActivityType =
  | 'Office / Desk Work'
  | 'College / Student'
  | 'Outdoor Construction'
  | 'Street Vendor'
  | 'Delivery / Rider'
  | 'Traffic / Police Duty'
  | 'Municipal Field Work'
  | 'Agriculture'
  | 'Walking / Commuting'
  | 'Driving'
  | 'Shop / Market Work'
  | 'General Outdoor Activity'
  | 'General Indoor Activity';

export interface PersonalHeatImpactInput {
  currentTemp?: number;
  humidity?: number;
  windSpeedKmH?: number;
  solarRadiation?: number;
  uvIndex?: number;
  wbgt?: number;
  utci?: number;
  heatIndex?: number;
  ward?: WardInfo;
  activityType?: ActivityType | string;
  outdoorExposure?: boolean;
  exposureDuration?: string;
  ageGroup?: string;
  hasHealthCondition?: boolean;
  isOutdoorWorker?: boolean;
  nearbyCoolingCount?: number;
  nearbyWaterCount?: number;
  nearbyShadeCount?: number;
  destinationContext?: {
    name: string;
    temp: number;
    humidity: number;
    windSpeedKmH: number;
    solarRadiation: number;
    wbgt?: number;
    utci?: number;
    ward?: WardInfo;
    nearbyCoolingCount?: number;
    nearbyWaterCount?: number;
  };
}

export interface PersonalHeatImpact {
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical';
  headline: string;
  meaningForUser: string;
  thermalStress: {
    wbgt: number;
    utci: number;
    heatIndex: number;
    category: string;
  };
  environmentalFactors: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    solarRadiation: number;
    shadeAvailability: number | null;
    coolingAvailability: number | null;
  };
  activity: {
    type: string;
    outdoorExposure: boolean;
    exposureIntensity: 'Low' | 'Moderate' | 'High' | 'Severe';
    duration: string;
  };
  effects: string[];
  warnings: string[];
  recommendations: string[];
  peakRiskPeriod: string;
  protectionFactors: string[];
  riskReasons: string[];
  destinationComparison?: {
    destinationName: string;
    destinationRiskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical';
    differenceSummary: string;
    isHigherRisk: boolean;
    factors: string[];
    recommendations: string[];
  };
  dataStatus: 'LIVE' | 'MODELLED' | 'DEMO';
}

export interface LocalRiskMapAreaFeature {
  type: 'Feature';
  id: string;
  properties: {
    area_id: string;
    area_name: string;
    zone: string;
    risk_score: number;
    risk_level: RiskLevel;
    current_status: string;
    last_updated: string;
    data_status: DataSourceLabel;
    temperature: number;
    humidity: number;
    wind_speed: number;
    solar_irradiance: number;
    uhi_offset: number;
    built_density_pct: number;
    tree_canopy_pct: number;
    is_current_area: boolean;
    center: [number, number];
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface LocalRiskMapResponse {
  type: 'FeatureCollection';
  features: LocalRiskMapAreaFeature[];
  current_location: {
    lat: number;
    lon: number;
    city: string;
    zone: string;
    ward: string;
    risk_score: number;
    risk_level: RiskLevel;
    current_status: string;
    last_updated: string;
    data_status: DataSourceLabel;
  };
}

export type AlertSeverity =
  | 'Normal'
  | 'Developing / Awareness'
  | 'High / Prepare'
  | 'Harmful / Heat Alert'
  | 'Critical / Immediate Action';

export type CitizenAlertType =
  | 'Heatwave Alert'
  | 'High Heat-Risk Alert'
  | 'Critical Heat Warning'
  | 'Location-Specific Alert'
  | string;

export interface CitizenAlert {
  id: string;
  type: CitizenAlertType;
  title: string;
  shortMessage: string;
  whatIsHappening: string;
  where: string;
  when: string;
  why: string;
  whatToDoNext: string[];
  severity: AlertSeverity;
  riskLevel: RiskLevel;
  issuedAt: string;
  isRead: boolean;
  urgent: boolean;
  recommendedAction: string;
  dataSource: string;
  status: 'Active' | 'Active - Urgent' | 'Escalating' | 'Resolved' | 'Expired' | 'De-escalated' | 'Watching';
  confidence?: number;
  dataTag: 'LIVE' | 'MODELLED' | 'ESTIMATED' | 'CURATED';
  expectedStart?: string;
  expectedEnd?: string;
  peakPeriod?: string;
  expectedDuration?: string;
  targetFeature?: 'risk' | 'future' | 'protection' | 'route';
  locationDetails?: {
    ward: string;
    zone: string;
    city: string;
    distanceRelevance?: string;
  };
}

export interface AlertHistoryItem {
  id: string;
  title: string;
  dateTime: string;
  location: string;
  severity: AlertSeverity;
  shortReason: string;
  status: 'Resolved' | 'Expired' | 'De-escalated' | 'Archived';
  dataSource?: string;
  riskLevel?: RiskLevel;
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
