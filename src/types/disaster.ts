export type DisasterNavPage =
  | 'command'
  | 'heat-situation'
  | 'high-risk-areas'
  | 'health-impact'
  | 'protection-shortfall'
  | 'alerts-escalation'
  | 'response-tracking'
  | 'settings';

export type DisasterRiskSeverity = 'Normal' | 'Developing' | 'High' | 'Harmful + Confidence' | 'Critical';

export type AlertRiskState =
  | 'Normal'
  | 'Developing'
  | 'High'
  | 'Harmful + Confidence'
  | 'Critical';

export type ForecastConfidenceLevel = 'High' | 'Moderate' | 'Low';

export type ResponseStatusType =
  | 'Monitoring'
  | 'Preparing'
  | 'Coordinating'
  | 'Active Response'
  | 'Completed'
  | 'Verified';

export type DataStatusLabel =
  | 'LIVE'
  | 'MODELLED'
  | 'ESTIMATED'
  | 'CURATED'
  | 'UNAVAILABLE';

export type AlertWorkflowAction =
  | 'REVIEW'
  | 'ACKNOWLEDGE'
  | 'ESCALATE'
  | 'COORDINATE'
  | 'CLOSE';

export type RegionalResponseStage =
  | 'MONITOR'
  | 'PREPARE'
  | 'ESCALATE'
  | 'COORDINATE'
  | 'RESPOND'
  | 'VERIFY';

export interface MultiAgencyCoordinationStatus {
  municipalStatus: {
    state: 'Active Intervention' | 'Standby' | 'Reviewing';
    leadOfficer: string;
    activeTeams: number;
    lastUpdate: string;
  };
  healthcareStatus: {
    state: 'Surge Capacity Alert' | 'Normal Intake' | 'Emergency Triage';
    icdHeatProtocolsActive: boolean;
    availableHeatBeds: number;
    lastUpdate: string;
  };
  disasterManagementStatus: {
    state: 'Regional Command Active' | 'Monitoring Posture' | 'Executive Escalation';
    eocLeader: string;
    activeDirectives: number;
    lastUpdate: string;
  };
}

export interface DisasterAffectedArea {
  id: string;
  name: string;
  district: string;
  zone: string;
  heatRisk: DisasterRiskSeverity;
  temperatureC: number;
  wbgtC: number;
  heatIndexC: number;
  trend: 'Rising' | 'Rapidly Rising' | 'Stable' | 'Easing';
  forecastConfidence: ForecastConfidenceLevel;
  healthImpact: {
    hospitalizationRiskEstimate: string; // e.g. "+42% (Modelled)"
    mortalityRiskSignal: 'Low' | 'Guarded' | 'Elevated' | 'Critical';
    vulnerablePopulationCount: number;
    estimatedDailyAdmissions: number;
    trend: 'Rising' | 'Rapidly Rising' | 'Stable' | 'Easing';
  };
  protectionShortfall: {
    expectedNeedScore: number; // 0-100
    availableProtectionScore: number; // 0-100
    shortfallPercentage: number; // e.g. 48%
    sheltersRequired: number;
    sheltersOperational: number;
    hydrationDeficitLitres: number;
    status: 'Deficit Critical' | 'Shortfall High' | 'Moderate Gap' | 'Adequate';
  };
  currentResponse: {
    actionTitle: string;
    responsibleAuthority: string;
    status: ResponseStatusType;
    lastUpdate: string;
  };
  coordinationRequired: string;
  geoCenter: {
    lat: number;
    lng: number;
  };
  polygonCoordinates?: [number, number][];
}

export interface DisasterAlert {
  id: string;
  what: string;
  where: string;
  when: string;
  why: string;
  requiredCoordination: string;
  riskState: AlertRiskState;
  forecastConfidence: ForecastConfidenceLevel;
  issuedAt: string;
  leadAuthority: string;
  acknowledged: boolean;
}

export interface DisasterResponseTask {
  id: string;
  area: string;
  response: string;
  responsibleAuthority: string;
  status: ResponseStatusType;
  lastUpdate: string;
  assignedTeam: string;
  priority: 'Immediate' | 'Priority' | 'Routine';
  targetCompletion: string;
}

export interface DisasterRegionalSummary {
  regionName: string;
  assignedGeography: string;
  currentDateTime: string;
  lastUpdated: string;
  dataStatus: DataStatusLabel;

  // 4 Primary Summary Cards
  regionalHeatStatus: {
    currentPeakTempC: number;
    highestIndexC: number;
    tier: 'Tier 3 Severe Heatwave' | 'Tier 2 Heatwave Warning' | 'Tier 1 Elevated' | 'Normal';
    severity: DisasterRiskSeverity;
    trend: 'Rising' | 'Rapidly Rising' | 'Stable' | 'Easing';
    diurnalWindow: string; // e.g. "11:30 AM – 4:30 PM"
  };

  highRiskAreas: {
    totalMonitored: number;
    criticalCount: number;
    highCount: number;
    developingCount: number;
    primaryHotspot: string;
  };

  healthImpact: {
    hospitalizationSurgeEstimate: string; // "+38% (Estimated)"
    mortalityRiskSignal: 'Elevated' | 'Critical' | 'Guarded' | 'Low';
    estimatedDailyExcessAdmissions: number;
    trend: 'Rising' | 'Rapidly Rising' | 'Stable' | 'Easing';
    highImpactZones: string[];
    disclaimer: 'MODELLED / ESTIMATED — Not clinical diagnostic records';
  };

  protectionShortfall: {
    expectedNeedSummary: string; // e.g. "128 Sanctuaries & 250k L/day"
    availableProtectionSummary: string; // e.g. "62 Sanctuaries & 120k L/day"
    overallShortfallPct: number; // e.g. 52%
    mostDeficientSector: string;
  };

  // Forecast Confidence & Coordination
  forecastConfidence: {
    level: ForecastConfidenceLevel;
    modelConsensus: string; // e.g. "ECMWF & IMD 92% Agreement"
    reliabilityWindow: string;
  };

  currentEscalation: {
    level: 'Red Alert Escalation' | 'Orange Alert Preparedness' | 'Yellow Advisory' | 'Normal Operations';
    what: string;
    where: string;
    why: string;
    requiredCoordination: string;
  };

  responseStatusCompact: {
    activeOperationsCount: number;
    deployedTeamsCount: number;
    hydrationKiosksActive: number;
    lastBriefingTime: string;
    overallPosture: 'Active Inter-Agency Mobilization' | 'Pre-Deployment' | 'Monitoring';
  };
}

export interface RegionalJurisdiction {
  id: string;
  name: string;
  state: string;
  division: string;
  center: { lat: number; lng: number };
  zoom: number;
  gisBoundaryConnected: boolean;
  gisProvenance: string;
  weatherSource: string;
  assignedGeography: string;
  summary: DisasterRegionalSummary;
  areas: DisasterAffectedArea[];
  alerts: DisasterAlert[];
  responseTasks: DisasterResponseTask[];
  coordinationStatus: MultiAgencyCoordinationStatus;
  currentResponseStage: RegionalResponseStage;
}

