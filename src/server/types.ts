export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Extreme';
export type DataSourceLabel = 'LIVE' | 'MODELLED' | 'ESTIMATED' | 'CURATED';
export type FacilityStatus = 'Available' | 'Limited' | 'Unavailable';

export interface WardInfo {
  id: string;
  name: string;
  zone: string;
  center: [number, number]; // [lat, lng]
  bounds: [number, number][]; // Polygon coordinates
  population: number;
  vulnerableCount: number; // Seniors, outdoor workers, children
  treeCanopyPct: number;
  builtDensityPct: number;
  vulnerabilityIndex: number; // 0 - 100
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
  solarIrradiance: number; // W/m^2
  uvIndex: number;
  pressure: number;
  weatherCode: number;
  weatherDescription: string;
  source: DataSourceLabel;
  lastUpdated: string;
}

export interface WeatherHourly {
  time: string; // ISO or "12:00 PM"
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
  wbgt: number; // Wet Bulb Globe Temperature
  utci: number; // Universal Thermal Climate Index
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
  riskScore: number; // 0 - 100
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
  protectionGap: number; // demand - capacity (if > 0, shortage)
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
  heatExposureScore: number; // 0 - 100
  treeCanopyPct: number;
  perceivedTempDeltaDegC: number; // e.g. -2.8C
  protectionPointsCount: {
    water: number;
    cooling: number;
    shade: number;
    healthcare: number;
  };
  pathCoordinates: [number, number][]; // [lat, lng]
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
