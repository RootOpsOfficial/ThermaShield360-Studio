export type MunicipalNavPage =
  | 'command-center'
  | 'ward-risk-map'
  | 'protection-gap'
  | 'recommended-actions'
  | 'municipal-alerts'
  | 'settings';

export type MunicipalRiskLevel = 'Normal' | 'Developing' | 'High' | 'Critical';

export interface MunicipalWardData {
  id: string;
  name: string;
  zone: string;
  city?: string;
  state?: string;
  center: [number, number];
  bounds: [number, number][];
  population: number;
  vulnerableCount: number;
  riskLevel: MunicipalRiskLevel;
  riskScore: number;
  thermalStress: string;
  wbgt: number;
  temp: number;
  vulnerableExposure: string;
  demand: number;
  capacity: number;
  protectionGap: number;
  fulfillmentPct: number;
  whyAttention: string;
  recommendedAction: string;
}

export interface MunicipalSummary {
  cityName: string;
  department: string;
  dateTime: string;
  dataStatus: 'MODELLED' | 'LIVE';
  currentHeatRisk: MunicipalRiskLevel;
  currentRiskScore: number;
  highRiskWardsCount: number;
  totalWardsCount: number;
  totalProtectionGap: number;
  totalDemand: number;
  totalCapacity: number;
  priorityWard: MunicipalWardData;
  priorityAction: string;
  fiveDayOutlook: Array<{
    day: string;
    date: string;
    tempMax: number;
    riskLevel: MunicipalRiskLevel;
  }>;
  currentAlert: {
    title: string;
    subtitle: string;
    recommendation: string;
    severity: 'Critical' | 'High' | 'Developing' | 'Normal';
  };
}

export interface MunicipalActionItem {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  ward: string;
  wardId: string;
  action: string;
  time: string;
  reason: string;
  status: 'Approved' | 'In Progress' | 'Completed' | 'Review';
}

export interface ProtectionResourceItem {
  name: string;
  type: 'Cooling Centres' | 'Water Points' | 'Shade / Rest Areas' | 'Healthcare';
  count: number;
  capacity: string;
  status: 'Operational' | 'Active' | 'Standby Ready';
  provenance: 'LIVE' | 'MODELLED' | 'CURATED';
}

export interface MunicipalAlertItem {
  id: string;
  severity: 'Critical' | 'Harmful + Confidence' | 'High' | 'Developing' | 'Normal';
  what: string;
  where: string;
  when: string;
  why: string;
  action: string;
  status: 'Active' | 'Under Review';
}
