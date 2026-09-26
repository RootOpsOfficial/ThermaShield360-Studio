export type HealthcareNavPage =
  | 'command-center'
  | 'forecast'
  | 'risk-trend'
  | 'risk-areas'
  | 'vulnerability'
  | 'facility-profile'
  | 'facility-readiness'
  | 'demand-capacity'
  | 'alerts'
  | 'settings';

export type ProvenanceTag =
  | 'LIVE API'
  | 'FACILITY ENTERED'
  | 'MODELLED'
  | 'ESTIMATED'
  | 'CURATED'
  | 'UNAVAILABLE'
  | 'DEMO / MODELLED';

export interface FacilityEnteredField<T> {
  value: T;
  lastUpdated: string;
  updatedBy: string;
  sourceType: ProvenanceTag;
  isEntered: boolean;
}

export interface FacilityProfileData {
  facilityName: string;
  facilityType: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  medicalSuperintendent: string;

  // Capacity fields
  totalBeds: FacilityEnteredField<number | null>;
  occupiedBeds: FacilityEnteredField<number | null>;
  availableBeds: FacilityEnteredField<number | null>;
  totalIcuBeds: FacilityEnteredField<number | null>;
  availableIcuBeds: FacilityEnteredField<number | null>;
  emergencyCapacityBeds: FacilityEnteredField<number | null>; // Heat trauma triage beds

  // Emergency Resources
  totalAmbulances: FacilityEnteredField<number | null>;
  availableAmbulances: FacilityEnteredField<number | null>;
  coolingImmersionTanks: FacilityEnteredField<number | null>;
  chilledSalineUnits: FacilityEnteredField<number | null>;

  // Staff & Readiness
  staffReadinessPct: FacilityEnteredField<number | null>;
  staffNotes: string;
  heatPreparednessStatus: FacilityEnteredField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>;
  emergencyPreparednessStatus: FacilityEnteredField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>;
  outreachReadinessStatus: FacilityEnteredField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>;
  coolingSupportReadinessStatus: FacilityEnteredField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>;

  lastEvaluated: string;
  updatedBy: string;
  isEntered: boolean;
  isDemoMode: boolean;
}

export interface HealthcareDayForecast {
  dayIndex: number;
  dayName: string;
  date: string;
  tempMax: number;
  tempMin: number;
  wbgt: number;
  utci: number;
  healthRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
  hospitalizationRisk: 'Normal' | 'Elevated' | 'High' | 'Severe';
  hospitalizationIncreasePct: number;
  mortalityRiskSignal: 'Low' | 'Low-to-Moderate' | 'Moderate' | 'Elevated';
  trend: 'Increasing' | 'Peak Sustained' | 'Easing' | 'Stable';
  peakHours: string;
  clinicalNotes: string;
}

export interface HealthcareRiskArea {
  wardId: string;
  wardName: string;
  zone: string;
  center: [number, number];
  heatRisk: 'Critical' | 'High' | 'Moderate' | 'Low';
  healthRisk: 'Critical' | 'High' | 'Moderate' | 'Low';
  expectedDemand: 'Critical Surge' | 'High Surge' | 'Moderate' | 'Baseline';
  expectedDailyAdmissions: number;
  vulnerablePopulation: number;
  vulnerableExposureNotes: string;
  vulnerabilityBreakdown: {
    elderly65Plus: number;
    outdoorWorkers: number;
    chronicConditions: number;
  };
  recommendedHealthAction: string;
}

export interface ReadinessMetricItem {
  label: string;
  current: number | null;
  total: number | null;
  unit: string;
  status: 'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED' | 'NOT CONNECTED';
  note: string;
  provenance: ProvenanceTag;
  isEntered: boolean;
}

export interface ReadinessChecklistItem {
  id: string;
  item: string;
  isReady: boolean;
  category: 'Clinical Supplies' | 'Staffing' | 'Infrastructure' | 'Coordination';
}

export interface HealthcareFacilityReadiness {
  facilityName: string;
  organization: string;
  monitoredArea: string;
  lastEvaluated: string;
  updatedBy: string;
  overallStatus: 'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED' | 'NOT CONNECTED';
  overallScorePct: number;
  isEntered: boolean;
  isDemoMode: boolean;
  metrics: {
    emergencyCapacity: ReadinessMetricItem;
    staffReadiness: ReadinessMetricItem;
    heatCarePreparedness: ReadinessMetricItem;
    availableCapacity: ReadinessMetricItem;
    outreachReadiness: ReadinessMetricItem;
  };
  checklist: ReadinessChecklistItem[];
}

export interface HealthcareDemandCapacity {
  expectedDemandPatients: number; // MODELLED
  expectedDemandLevel: 'Critical Surge' | 'High Surge' | 'Moderate' | 'Baseline';
  isCapacityEntered: boolean;
  availableCapacityBeds: number | null; // FACILITY ENTERED
  capacityGapPatients: number | null; // Calculated difference
  capacityGapStatus: 'Adequate' | 'Deficit Warning' | 'Severe Deficit' | 'CAPACITY NOT YET PROVIDED';
  capacityProvenance: ProvenanceTag;
  lastCapacityUpdate?: string;
  updatedBy?: string;
  projected3DayDemand: Array<{
    day: string;
    demand: number;
    capacity: number | null;
    gap: number | null;
    status: string;
  }>;
}

export interface HealthcareAlert {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Moderate' | 'Informational';
  what: string;
  where: string;
  when: string;
  why: string;
  recommendedAction: string;
  issuedAt: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface HealthcareSummary {
  organization: string;
  facilityName: string;
  facilityType: string;
  monitoredArea: string;
  dateTime: string;
  dataStatus: string;
  provenance: {
    weather: ProvenanceTag;
    healthRisk: ProvenanceTag;
    hospitalizationRisk: ProvenanceTag;
    mortalityRisk: ProvenanceTag;
    facilities: ProvenanceTag;
    facilityCapacity: ProvenanceTag;
    readiness: ProvenanceTag;
  };
  cards: {
    healthRisk: {
      title: string;
      status: string;
      level: string;
      score: number;
      explanation: string;
      badge: ProvenanceTag;
    };
    hospitalizationRisk: {
      title: string;
      signal: string;
      trend: string;
      explanation: string;
      badge: ProvenanceTag;
    };
    mortalityRiskSignal: {
      title: string;
      signal: string;
      trend: string;
      explanation: string;
      badge: ProvenanceTag;
    };
    expectedPatientDemand: {
      title: string;
      demandLevel: string;
      estimatedPatientsPerDay: number;
      explanation: string;
      badge: ProvenanceTag;
    };
  };
  facilityProfile: FacilityProfileData;
  fiveDayOutlook: HealthcareDayForecast[];
  highRiskAreas: HealthcareRiskArea[];
  facilityReadiness: HealthcareFacilityReadiness;
  demandCapacity: HealthcareDemandCapacity;
  currentAction: {
    what: string;
    where: string;
    when: string;
    why: string;
    status: string;
  };
  activeAlert: HealthcareAlert;
}

export interface HealthcareSettings {
  facilityName: string;
  primaryOrganization: string;
  primaryDistrict: string;
  temperatureThresholdCelsius: number;
  wbgtWarningThreshold: number;
  alertDispatchPhone: string;
  autoNotifyERStaff: boolean;
  preferredWeatherSource: string;
  dataFreshnessMinutes: number;
}
