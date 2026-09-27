import { LocationItem, ALL_LOCATIONS } from './allLocations.js';
import {
  RegionalJurisdiction,
  DisasterAffectedArea,
  DisasterRegionalSummary,
  DisasterAlert,
  DisasterResponseTask,
  MultiAgencyCoordinationStatus,
  DisasterRiskSeverity,
} from '../types/disaster.js';
import { REGIONAL_JURISDICTIONS } from './disasterData.js';

export const REGION_CATEGORIES: Record<string, string[]> = {
  all: [],
  maharashtra: ['pune', 'nashik', 'mumbai', 'maharashtra'],
  north: ['north'],
  south: ['south'],
  'west-central': ['west', 'central'],
  'east-northeast': ['east', 'northeast', 'ut'],
};

export const REGION_TABS = [
  { id: 'all', label: 'All India', count: ALL_LOCATIONS.length },
  {
    id: 'maharashtra',
    label: 'Maharashtra',
    count: ALL_LOCATIONS.filter((l) =>
      ['pune', 'nashik', 'mumbai', 'maharashtra'].includes(l.category)
    ).length,
  },
  {
    id: 'north',
    label: 'North India',
    count: ALL_LOCATIONS.filter((l) => l.category === 'north').length,
  },
  {
    id: 'south',
    label: 'South India',
    count: ALL_LOCATIONS.filter((l) => l.category === 'south').length,
  },
  {
    id: 'west-central',
    label: 'West & Central',
    count: ALL_LOCATIONS.filter((l) => ['west', 'central'].includes(l.category)).length,
  },
  {
    id: 'east-northeast',
    label: 'East & NE',
    count: ALL_LOCATIONS.filter((l) => ['east', 'northeast', 'ut'].includes(l.category)).length,
  },
];

/**
 * Calculates modeled thermal load based on location geography
 */
function getModeledThermalProfile(loc: LocationItem): {
  peakTemp: number;
  wbgt: number;
  heatIndex: number;
  severity: DisasterRiskSeverity;
  tier: 'Tier 3 Severe Heatwave' | 'Tier 2 Heatwave Warning' | 'Tier 1 Elevated' | 'Normal';
} {
  const nameLower = (loc.name + ' ' + loc.state + ' ' + loc.city).toLowerCase();

  // Hill stations
  if (
    nameLower.includes('shimla') ||
    nameLower.includes('manali') ||
    nameLower.includes('dharamshala') ||
    nameLower.includes('leh') ||
    nameLower.includes('ladakh') ||
    nameLower.includes('gangtok') ||
    nameLower.includes('shillong')
  ) {
    return {
      peakTemp: 31.4,
      wbgt: 24.2,
      heatIndex: 32.8,
      severity: 'Normal',
      tier: 'Normal',
    };
  }

  // Extreme Northern Plains, Central & Deserts (Rajasthan, Delhi, UP, MP, Vidarbha, Bihar, Gujarat)
  if (
    nameLower.includes('rajasthan') ||
    nameLower.includes('jaipur') ||
    nameLower.includes('bikaner') ||
    nameLower.includes('jodhpur') ||
    nameLower.includes('delhi') ||
    nameLower.includes('nagpur') ||
    nameLower.includes('ahmedabad') ||
    nameLower.includes('lucknow') ||
    nameLower.includes('kanpur') ||
    nameLower.includes('prayagraj') ||
    nameLower.includes('varanasi') ||
    nameLower.includes('bhopal') ||
    nameLower.includes('gwalior') ||
    nameLower.includes('patna') ||
    nameLower.includes('gaya')
  ) {
    return {
      peakTemp: 44.8,
      wbgt: 33.2,
      heatIndex: 49.5,
      severity: 'Critical',
      tier: 'Tier 3 Severe Heatwave',
    };
  }

  // Coastal High-Humidity Zones (Mumbai, Chennai, Kolkata, Kochi, Goa, Visakhapatnam, Surat)
  if (
    nameLower.includes('mumbai') ||
    nameLower.includes('chennai') ||
    nameLower.includes('kolkata') ||
    nameLower.includes('kochi') ||
    nameLower.includes('surat') ||
    nameLower.includes('visakhapatnam') ||
    nameLower.includes('goa') ||
    nameLower.includes('puri') ||
    nameLower.includes('mangalore')
  ) {
    return {
      peakTemp: 39.4,
      wbgt: 32.8,
      heatIndex: 50.2,
      severity: 'Critical',
      tier: 'Tier 3 Severe Heatwave',
    };
  }

  // Deccan Plateau & Southern Metros (Bengaluru, Hyderabad, Coimbatore, Pune, Nashik)
  if (
    nameLower.includes('bengaluru') ||
    nameLower.includes('hyderabad') ||
    nameLower.includes('pune') ||
    nameLower.includes('nashik') ||
    nameLower.includes('coimbatore') ||
    nameLower.includes('mysuru')
  ) {
    return {
      peakTemp: 41.6,
      wbgt: 31.2,
      heatIndex: 46.1,
      severity: 'High',
      tier: 'Tier 2 Heatwave Warning',
    };
  }

  // Default Central / Eastern India
  return {
    peakTemp: 42.8,
    wbgt: 31.8,
    heatIndex: 47.5,
    severity: 'High',
    tier: 'Tier 2 Heatwave Warning',
  };
}

/**
 * Creates a fully functioning RegionalJurisdiction for any location in India
 */
export function createJurisdictionForLocation(loc: LocationItem): RegionalJurisdiction {
  // Check if matches an existing pre-configured flagship jurisdiction
  const existingFlagship = REGIONAL_JURISDICTIONS.find(
    (r) =>
      r.id.toLowerCase() === loc.city.toLowerCase() ||
      r.id.toLowerCase() === loc.id.toLowerCase() ||
      r.name.toLowerCase().includes(loc.city.toLowerCase())
  );
  if (existingFlagship && loc.city.toLowerCase() === 'pune') {
    return existingFlagship;
  }

  const profile = getModeledThermalProfile(loc);
  const nowStr =
    new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' • ' +
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Generate 4 realistic localized sub-areas for this Indian location
  const areas: DisasterAffectedArea[] = [
    {
      id: `${loc.id}-core-transit`,
      name: `${loc.shortName} Core Commercial & Transit Hub`,
      district: `${loc.city} District`,
      zone: `Zone 1 Central Urban Core`,
      heatRisk: profile.severity,
      temperatureC: profile.peakTemp,
      wbgtC: profile.wbgt,
      heatIndexC: profile.heatIndex,
      trend: profile.severity === 'Critical' ? 'Rapidly Rising' : 'Rising',
      forecastConfidence: 'High',
      healthImpact: {
        hospitalizationRiskEstimate: profile.severity === 'Critical' ? '+62% Modelled Surge' : '+40% Surge',
        mortalityRiskSignal: profile.severity === 'Critical' ? 'Critical' : 'Elevated',
        vulnerablePopulationCount: 45000,
        estimatedDailyAdmissions: profile.severity === 'Critical' ? 54 : 32,
        trend: 'Rising',
      },
      protectionShortfall: {
        expectedNeedScore: 88,
        availableProtectionScore: 42,
        shortfallPercentage: 52,
        sheltersRequired: 20,
        sheltersOperational: 9,
        hydrationDeficitLitres: 42000,
        status: profile.severity === 'Critical' ? 'Deficit Critical' : 'Shortfall High',
      },
      currentResponse: {
        actionTitle: `Mobile Misting & Chilled Hydration Deployment (${loc.city})`,
        responsibleAuthority: `${loc.city} Municipal Corporation & Civil Defense`,
        status: 'Active Response',
        lastUpdate: '10 mins ago',
      },
      coordinationRequired: `Deploy emergency water tankers at ${loc.shortName} bus terminal and central market; activate designated cooling shelters.`,
      geoCenter: { lat: loc.lat, lng: loc.lng },
    },
    {
      id: `${loc.id}-industrial`,
      name: `${loc.city} Industrial Corridor & Labor Settlement`,
      district: `${loc.city} District`,
      zone: `Zone 2 Outer Industrial Belt`,
      heatRisk: profile.severity === 'Critical' ? 'Critical' : 'High',
      temperatureC: parseFloat((profile.peakTemp + 0.4).toFixed(1)),
      wbgtC: parseFloat((profile.wbgt + 0.3).toFixed(1)),
      heatIndexC: parseFloat((profile.heatIndex + 0.6).toFixed(1)),
      trend: 'Rising',
      forecastConfidence: 'High',
      healthImpact: {
        hospitalizationRiskEstimate: '+55% Modelled Surge',
        mortalityRiskSignal: 'Critical',
        vulnerablePopulationCount: 52000,
        estimatedDailyAdmissions: 44,
        trend: 'Rising',
      },
      protectionShortfall: {
        expectedNeedScore: 84,
        availableProtectionScore: 36,
        shortfallPercentage: 57,
        sheltersRequired: 18,
        sheltersOperational: 7,
        hydrationDeficitLitres: 48000,
        status: 'Deficit Critical',
      },
      currentResponse: {
        actionTitle: `Outdoor Work Shift Restrictions (12:00 PM – 3:30 PM)`,
        responsibleAuthority: `District Factory Inspectorate & Labor Commission`,
        status: 'Active Response',
        lastUpdate: '25 mins ago',
      },
      coordinationRequired: `Enforce mandatory shaded rest intervals for manufacturing & construction workers; inspect on-site oral rehydration.`,
      geoCenter: { lat: loc.lat + 0.032, lng: loc.lng + 0.028 },
    },
    {
      id: `${loc.id}-residential`,
      name: `${loc.city} High-Density Residential Wards`,
      district: `${loc.city} District`,
      zone: `Zone 3 Urban Infill Wards`,
      heatRisk: 'High',
      temperatureC: parseFloat((profile.peakTemp - 0.7).toFixed(1)),
      wbgtC: parseFloat((profile.wbgt - 0.5).toFixed(1)),
      heatIndexC: parseFloat((profile.heatIndex - 0.8).toFixed(1)),
      trend: 'Stable',
      forecastConfidence: 'High',
      healthImpact: {
        hospitalizationRiskEstimate: '+38% Surge',
        mortalityRiskSignal: 'Elevated',
        vulnerablePopulationCount: 38000,
        estimatedDailyAdmissions: 28,
        trend: 'Stable',
      },
      protectionShortfall: {
        expectedNeedScore: 72,
        availableProtectionScore: 48,
        shortfallPercentage: 33,
        sheltersRequired: 14,
        sheltersOperational: 9,
        hydrationDeficitLitres: 22000,
        status: 'Shortfall High',
      },
      currentResponse: {
        actionTitle: `Community Health Worker Door-to-Door Triage`,
        responsibleAuthority: `District Health Office (DHO) & ASHA Workers`,
        status: 'Coordinating',
        lastUpdate: '40 mins ago',
      },
      coordinationRequired: `Direct ASHA workers to check on elderly and bedridden residents; distribute ORS sachets.`,
      geoCenter: { lat: loc.lat - 0.025, lng: loc.lng - 0.022 },
    },
    {
      id: `${loc.id}-suburban`,
      name: `${loc.city} Suburban Fringe & Peri-Urban Zone`,
      district: `${loc.city} District`,
      zone: `Zone 4 Peri-Urban Agriculture Belt`,
      heatRisk: 'Developing',
      temperatureC: parseFloat((profile.peakTemp - 1.8).toFixed(1)),
      wbgtC: parseFloat((profile.wbgt - 1.2).toFixed(1)),
      heatIndexC: parseFloat((profile.heatIndex - 1.9).toFixed(1)),
      trend: 'Stable',
      forecastConfidence: 'Moderate',
      healthImpact: {
        hospitalizationRiskEstimate: '+22% Baseline Shift',
        mortalityRiskSignal: 'Guarded',
        vulnerablePopulationCount: 26000,
        estimatedDailyAdmissions: 14,
        trend: 'Stable',
      },
      protectionShortfall: {
        expectedNeedScore: 55,
        availableProtectionScore: 40,
        shortfallPercentage: 27,
        sheltersRequired: 10,
        sheltersOperational: 7,
        hydrationDeficitLitres: 12000,
        status: 'Moderate Gap',
      },
      currentResponse: {
        actionTitle: `Rural Heatwave Audio Alerts via Gram Panchayats`,
        responsibleAuthority: `Zilla Parishad & Village Disaster Management Committees`,
        status: 'Monitoring',
        lastUpdate: '1 hour ago',
      },
      coordinationRequired: `Coordinate with rural primary health centers (PHC) for cold storage of IV fluids and emergency power backup.`,
      geoCenter: { lat: loc.lat - 0.045, lng: loc.lng + 0.035 },
    },
  ];

  const summary: DisasterRegionalSummary = {
    regionName: `${loc.city} Division, ${loc.state}`,
    assignedGeography: `${loc.name} • ${loc.city} District, ${loc.state}`,
    currentDateTime: nowStr,
    lastUpdated: `Live via IMD ${loc.city} Doppler Radar & AWS`,
    dataStatus: 'LIVE',
    regionalHeatStatus: {
      currentPeakTempC: profile.peakTemp,
      highestIndexC: profile.heatIndex,
      tier: profile.tier,
      severity: profile.severity,
      trend: profile.severity === 'Critical' ? 'Rapidly Rising' : 'Rising',
      diurnalWindow: '11:30 AM – 04:30 PM (Peak Solar Insolation)',
    },
    highRiskAreas: {
      totalMonitored: areas.length,
      criticalCount: areas.filter((a) => a.heatRisk === 'Critical').length,
      highCount: areas.filter((a) => a.heatRisk === 'High').length,
      developingCount: areas.filter((a) => a.heatRisk === 'Developing').length,
      primaryHotspot: `${loc.shortName} Core Commercial & Transit Hub`,
    },
    healthImpact: {
      hospitalizationSurgeEstimate: profile.severity === 'Critical' ? '+62% above baseline (Modelled)' : '+40% above baseline',
      mortalityRiskSignal: profile.severity === 'Critical' ? 'Critical' : 'Elevated',
      estimatedDailyExcessAdmissions: profile.severity === 'Critical' ? 140 : 85,
      trend: 'Rising',
      highImpactZones: [
        `${loc.shortName} Core Hub`,
        `${loc.city} Industrial Corridor`,
      ],
      disclaimer: 'MODELLED / ESTIMATED — Not clinical diagnostic records',
    },
    protectionShortfall: {
      expectedNeedSummary: `62 Sanctuaries & 124,000 L Water/day (${loc.city})`,
      availableProtectionSummary: `32 Sanctuaries & 68,000 L Deployed`,
      overallShortfallPct: 48,
      mostDeficientSector: `High Density Commercial Mandis & Open Labor Corridors`,
    },
    forecastConfidence: {
      level: 'High',
      modelConsensus: `IMD NWP Model & ${loc.state} SDMA Early Warning Protocol Active`,
      reliabilityWindow: 'High Reliability for next 48 Hours',
    },
    currentEscalation: {
      level: profile.severity === 'Critical' ? 'Red Alert Escalation' : 'Orange Alert Preparedness',
      what: `Peak temperature reaching ${profile.peakTemp}°C with Heat Index ${profile.heatIndex}°C across ${loc.city} urban agglomeration.`,
      where: `${loc.name}, transit interchanges, and outdoor labor clusters.`,
      why: `Strong advective continental thermal ridging coupled with high surface solar irradiance in ${loc.state}.`,
      requiredCoordination: `Coordinate ${loc.city} Municipal Corporation, District Collectorate, and 108 Emergency Medical Services for aggressive cooling measures.`,
    },
    responseStatusCompact: {
      activeOperationsCount: 14,
      deployedTeamsCount: 28,
      hydrationKiosksActive: 42,
      lastBriefingTime: '08:00 AM Today',
      overallPosture: 'Active Inter-Agency Mobilization',
    },
  };

  const alerts: DisasterAlert[] = [
    {
      id: `alert-${loc.id}-01`,
      what: `${profile.tier.toUpperCase()} — Thermal Load Exceeding Safe Human Physiological Thresholds`,
      where: `${loc.name}, ${loc.city} Central Bus Terminal, and Industrial Zone`,
      when: `Valid Today through next 48 Hours • Peak 11:30 AM – 04:30 PM`,
      why: `Wet Bulb Globe Temperature (WBGT) projected at ${profile.wbgt}°C posing severe risk of heat stroke.`,
      requiredCoordination: `Deploy mobile misting tankers to ${loc.shortName}; inspect factory cooling compliance; open municipal community halls as air-cooled sanctuaries.`,
      riskState: profile.severity === 'Critical' ? 'Critical' : 'High',
      forecastConfidence: 'High',
      issuedAt: '06:00 AM Today',
      leadAuthority: `District Disaster Management Authority (${loc.city}) & IMD`,
      acknowledged: true,
    },
    {
      id: `alert-${loc.id}-02`,
      what: `Hospital Casualty Surge Directive — Emergency Heat Bed Requisition`,
      where: `${loc.city} District Civil Hospital, Medical College, & Sub-District Hospitals`,
      when: `Immediate Operational Enforcement`,
      why: `Projected 50%+ surge in heat-exhaustion and hyperthermia admissions.`,
      requiredCoordination: `Direct all designated government and empanelled private hospitals to reserve 15% bed capacity for thermal emergencies with cold IV fluid reserves.`,
      riskState: 'Harmful + Confidence',
      forecastConfidence: 'High',
      issuedAt: '07:30 AM Today',
      leadAuthority: `${loc.state} Directorate of Health Services`,
      acknowledged: false,
    },
  ];

  const responseTasks: DisasterResponseTask[] = [
    {
      id: `task-${loc.id}-01`,
      area: `${loc.shortName} Core Hub`,
      response: 'Deploy 6 Mobile Chilled Hydration Tankers & Misting Umbrellas',
      responsibleAuthority: `${loc.city} Municipal Corporation`,
      status: 'Active Response',
      lastUpdate: '15 mins ago',
      assignedTeam: `Disaster Rapid Action Team ${loc.city}-1`,
      priority: 'Immediate',
      targetCompletion: 'Immediate Ongoing',
    },
    {
      id: `task-${loc.id}-02`,
      area: `${loc.city} Industrial Corridor`,
      response: 'Enforce Mandatory Factory Shade Halts & Heat Safety Inspection',
      responsibleAuthority: 'District Labor & Safety Inspectorate',
      status: 'Coordinating',
      lastUpdate: '30 mins ago',
      assignedTeam: `Field Inspection Squad ${loc.city}-2`,
      priority: 'Priority',
      targetCompletion: 'Today 01:00 PM',
    },
    {
      id: `task-${loc.id}-03`,
      area: `${loc.city} District Civil Hospital`,
      response: 'Verification of Emergency Heatstroke Triage & Chilled Saline Stocks',
      responsibleAuthority: `${loc.state} Health Department`,
      status: 'Verified',
      lastUpdate: '1 hour ago',
      assignedTeam: 'Medical Readiness Audit Team',
      priority: 'Immediate',
      targetCompletion: 'Completed',
    },
  ];

  const coordinationStatus: MultiAgencyCoordinationStatus = {
    municipalStatus: {
      state: 'Active Intervention',
      leadOfficer: `${loc.city} Municipal Commissioner`,
      activeTeams: 18,
      lastUpdate: '12 mins ago',
    },
    healthcareStatus: {
      state: 'Surge Capacity Alert',
      icdHeatProtocolsActive: true,
      availableHeatBeds: 45,
      lastUpdate: '20 mins ago',
    },
    disasterManagementStatus: {
      state: 'Regional Command Active',
      eocLeader: `District Magistrate & DDMA Chairman (${loc.city})`,
      activeDirectives: 4,
      lastUpdate: '5 mins ago',
    },
  };

  return {
    id: `reg-${loc.id}`,
    name: `${loc.city} Division`,
    state: loc.state,
    division: `${loc.city} Metropolitan & Regional Command`,
    center: { lat: loc.lat, lng: loc.lng },
    zoom: 12,
    gisBoundaryConnected: true,
    gisProvenance: `Survey of India & ${loc.state} Remote Sensing Centre (SDMA)`,
    weatherSource: `India Meteorological Department (IMD) MesoNet (${loc.city})`,
    assignedGeography: `${loc.name} • ${loc.city} District, ${loc.state} • Operational EOC`,
    summary,
    areas,
    alerts,
    responseTasks,
    coordinationStatus,
    currentResponseStage: 'COORDINATE',
  };
}

/**
 * Finds the closest location across all of India from GPS coordinates
 */
export function findClosestIndiaLocation(lat: number, lng: number): LocationItem {
  let closest = ALL_LOCATIONS[0];
  let minD = Infinity;

  for (const loc of ALL_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (d < minD) {
      minD = d;
      closest = loc;
    }
  }

  return closest;
}

const KEY_COMMAND_CITIES = [
  'Jaipur', 'Jodhpur', 'Lucknow', 'Varanasi', 'Ahmedabad', 'Surat',
  'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Patna', 'Bhopal',
  'Indore', 'Chandigarh', 'Kochi', 'Visakhapatnam', 'Bhubaneswar',
  'Guwahati', 'Shimla', 'Srinagar', 'Nashik', 'Chhatrapati Sambhajinagar',
  'Solapur', 'Ranchi', 'Raipur', 'Dehradun', 'Panaji', 'Shillong',
  'Agartala', 'Imphal', 'Puducherry', 'Port Blair',
];

export const ALL_INDIA_REGIONAL_JURISDICTIONS: RegionalJurisdiction[] = [
  ...REGIONAL_JURISDICTIONS,
  ...KEY_COMMAND_CITIES.map((c) => {
    const loc = ALL_LOCATIONS.find((l) => l.city.toLowerCase() === c.toLowerCase());
    return loc ? createJurisdictionForLocation(loc) : null;
  }).filter((j): j is RegionalJurisdiction => j !== null),
];
