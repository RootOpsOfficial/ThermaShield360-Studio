import { PUNE_WARDS, PROTECTION_POINTS, HEALTHCARE_FACILITIES } from './geoData.js';
import {
  MunicipalSummary,
  MunicipalWardData,
  MunicipalActionItem,
  ProtectionResourceItem,
  MunicipalAlertItem,
  MunicipalRiskLevel,
} from '../types/municipal.js';

export function getMunicipalWards(): MunicipalWardData[] {
  return [
    {
      id: 'ward-21',
      name: 'Ward 21: Kasba Peth - Vishrambaug Wada',
      zone: 'Heritage Core Zone',
      center: [18.5178, 73.8582],
      bounds: [
        [18.526, 73.851],
        [18.528, 73.866],
        [18.511, 73.869],
        [18.508, 73.852],
        [18.526, 73.851],
      ],
      population: 178000,
      vulnerableCount: 46200,
      riskLevel: 'Critical',
      riskScore: 84,
      thermalStress: 'WBGT 31.8°C (Dangerous Thermal Load)',
      wbgt: 31.8,
      temp: 39.2,
      vulnerableExposure: '46,200 At-Risk Residents (Seniors & Market Vendors)',
      demand: 5800,
      capacity: 1420,
      protectionGap: 4380,
      fulfillmentPct: 24,
      whyAttention: '89% paved concrete density, narrow market corridors, and highest deficit of air-cooled respite spaces in the city.',
      recommendedAction: 'Deploy mobile mist-cooling tankers at Mandai Bazaar and open 24/7 civic cooling shelters.',
    },
    {
      id: 'ward-18',
      name: 'Ward 18: Hadapsar - Mundhwa',
      zone: 'East Industrial Zone',
      center: [18.502, 73.927],
      bounds: [
        [18.524, 73.905],
        [18.528, 73.952],
        [18.481, 73.955],
        [18.479, 73.907],
        [18.524, 73.905],
      ],
      population: 230000,
      vulnerableCount: 57500,
      riskLevel: 'High',
      riskScore: 78,
      thermalStress: 'WBGT 29.6°C (Severe Heat Strain)',
      wbgt: 29.6,
      temp: 38.8,
      vulnerableExposure: '57,500 Informal Workers & Industrial Laborers',
      demand: 6900,
      capacity: 2200,
      protectionGap: 4700,
      fulfillmentPct: 32,
      whyAttention: 'Large population of outdoor laborers under uninsulated tin roofs with sparse tree canopy (16%).',
      recommendedAction: 'Install 4 additional high-flow cold water dispensers and mandate construction site shade breaks.',
    },
    {
      id: 'ward-25',
      name: 'Ward 25: Swargate - Parvati',
      zone: 'South Transit Zone',
      center: [18.498, 73.856],
      bounds: [
        [18.511, 73.847],
        [18.513, 73.868],
        [18.484, 73.869],
        [18.482, 73.848],
        [18.511, 73.847],
      ],
      population: 188000,
      vulnerableCount: 48800,
      riskLevel: 'High',
      riskScore: 73,
      thermalStress: 'WBGT 28.9°C (Elevated Discomfort)',
      wbgt: 28.9,
      temp: 38.2,
      vulnerableExposure: '48,800 Bus Transit Commuters & Dense Tenements',
      demand: 5200,
      capacity: 2400,
      protectionGap: 2800,
      fulfillmentPct: 46,
      whyAttention: 'Major transit interchange with heavy pedestrian tarmac exposure at Jedhe Chowk.',
      recommendedAction: 'Erect temporary tensile shade canopies over the bus concourse and distribute ORS packets.',
    },
    {
      id: 'ward-14',
      name: 'Ward 14: Shivajinagar - Ghole Road',
      zone: 'Central Pune Zone',
      center: [18.5314, 73.8446],
      bounds: [
        [18.542, 73.834],
        [18.545, 73.856],
        [18.524, 73.861],
        [18.518, 73.839],
        [18.542, 73.834],
      ],
      population: 142000,
      vulnerableCount: 28400,
      riskLevel: 'High',
      riskScore: 68,
      thermalStress: 'WBGT 28.4°C (Moderate to High)',
      wbgt: 28.4,
      temp: 37.9,
      vulnerableExposure: '28,400 Commercial & College Commuters',
      demand: 3400,
      capacity: 1850,
      protectionGap: 1550,
      fulfillmentPct: 54,
      whyAttention: 'Heavy vehicular traffic and high radiant asphalt temperatures along FC Road spine.',
      recommendedAction: 'Extend civic air-conditioned center hours and replenish water kiosks along commercial corridors.',
    },
    {
      id: 'ward-12',
      name: 'Ward 12: Viman Nagar - Nagar Road',
      zone: 'North-East Airport Zone',
      center: [18.567, 73.914],
      bounds: [
        [18.584, 73.896],
        [18.586, 73.935],
        [18.552, 73.938],
        [18.551, 73.898],
        [18.584, 73.896],
      ],
      population: 154000,
      vulnerableCount: 26000,
      riskLevel: 'Developing',
      riskScore: 61,
      thermalStress: 'WBGT 27.5°C (Caution Level)',
      wbgt: 27.5,
      temp: 37.4,
      vulnerableExposure: '26,000 Suburban Residents',
      demand: 2600,
      capacity: 1600,
      protectionGap: 1000,
      fulfillmentPct: 62,
      whyAttention: 'Open highway stretches without tree shade increasing daytime radiant heat.',
      recommendedAction: 'Ensure public garden shading is accessible and pre-position hydration supplies.',
    },
    {
      id: 'ward-07',
      name: 'Ward 7: Aundh - Baner',
      zone: 'North-West Tech Zone',
      center: [18.558, 73.807],
      bounds: [
        [18.575, 73.792],
        [18.577, 73.824],
        [18.541, 73.828],
        [18.542, 73.794],
        [18.575, 73.792],
      ],
      population: 165000,
      vulnerableCount: 24700,
      riskLevel: 'Developing',
      riskScore: 54,
      thermalStress: 'WBGT 26.8°C (Normal Discomfort)',
      wbgt: 26.8,
      temp: 36.8,
      vulnerableExposure: '24,700 Residents',
      demand: 2100,
      capacity: 1500,
      protectionGap: 600,
      fulfillmentPct: 71,
      whyAttention: 'Active construction clusters in Baner require localized cooling stations.',
      recommendedAction: 'Conduct spot inspections of construction worker resting shelters.',
    },
    {
      id: 'ward-09',
      name: 'Ward 9: Kothrud - Bavdhan',
      zone: 'West Hills Zone',
      center: [18.5074, 73.8077],
      bounds: [
        [18.521, 73.792],
        [18.523, 73.821],
        [18.491, 73.818],
        [18.489, 73.791],
        [18.521, 73.792],
      ],
      population: 195000,
      vulnerableCount: 31000,
      riskLevel: 'Normal',
      riskScore: 42,
      thermalStress: 'WBGT 25.2°C (Baseline Seasonal)',
      wbgt: 25.2,
      temp: 35.8,
      vulnerableExposure: '31,000 Residents',
      demand: 1800,
      capacity: 1550,
      protectionGap: 250,
      fulfillmentPct: 86,
      whyAttention: 'Substantial tree canopy (44%) and green hillside buffers naturally suppress heat island effect.',
      recommendedAction: 'Maintain routine municipal water kiosk pressure and sanitation.',
    },
  ];
}

export function getMunicipalSummary(): MunicipalSummary {
  const wards = getMunicipalWards();
  const highRiskWards = wards.filter((w) => w.riskLevel === 'High' || w.riskLevel === 'Critical');
  const totalGap = wards.reduce((acc, w) => acc + w.protectionGap, 0);
  const totalDemand = wards.reduce((acc, w) => acc + w.demand, 0);
  const totalCapacity = wards.reduce((acc, w) => acc + w.capacity, 0);
  const priorityWard = wards[0]; // Ward 21: Kasba Peth

  return {
    cityName: 'Pune Municipal Corporation (PMC)',
    department: 'Disaster Management & Heat Action Cell',
    dateTime: new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' • ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    dataStatus: 'MODELLED',
    currentHeatRisk: 'High',
    currentRiskScore: 73,
    highRiskWardsCount: highRiskWards.length,
    totalWardsCount: wards.length,
    totalProtectionGap: totalGap,
    totalDemand,
    totalCapacity,
    priorityWard,
    priorityAction: 'Deploy mobile cooling tankers & extend shelter hours in Ward 21 (Kasba Peth).',
    fiveDayOutlook: [
      { day: 'Today', date: 'Current', tempMax: 38.5, riskLevel: 'High' },
      { day: 'Tomorrow', date: '+1 Day', tempMax: 39.4, riskLevel: 'Critical' },
      { day: 'Day 3', date: '+2 Days', tempMax: 40.1, riskLevel: 'Critical' },
      { day: 'Day 4', date: '+3 Days', tempMax: 38.8, riskLevel: 'High' },
      { day: 'Day 5', date: '+4 Days', tempMax: 36.9, riskLevel: 'Developing' },
    ],
    currentAlert: {
      title: 'WARD 21 — CRITICAL HUMAN HEAT RISK',
      subtitle: 'Severe thermal stress (WBGT 31.8°C) combined with a 4,380 person protection gap.',
      recommendation: 'Deploy emergency mist-cooling tankers to Mandai Bazaar and extend civic cooling center hours until 9:00 PM.',
      severity: 'Critical',
    },
  };
}

let actionsStore: MunicipalActionItem[] = [
  {
    id: 'act-1',
    priority: 'HIGH',
    ward: 'Ward 21: Kasba Peth',
    wardId: 'ward-21',
    action: 'Deploy Mobile Mist-Cooling & Water Tankers',
    time: '11:30 AM – 4:30 PM (Peak Solar)',
    reason: 'Critical WBGT (31.8°C), 89% paved surface mass, and 4,380 citizen protection gap.',
    status: 'In Progress',
  },
  {
    id: 'act-2',
    priority: 'HIGH',
    ward: 'Ward 18: Hadapsar',
    wardId: 'ward-18',
    action: 'Open 2 Additional Community AC Cooling Centers',
    time: '10:00 AM – 6:00 PM',
    reason: '57,500 vulnerable industrial workers under uninsulated metal roofs with high gap.',
    status: 'Approved',
  },
  {
    id: 'act-3',
    priority: 'HIGH',
    ward: 'Ward 25: Swargate',
    wardId: 'ward-25',
    action: 'Erect Tensile Shading & Distribute Free ORS',
    time: '12:00 PM – 5:00 PM',
    reason: 'High transit pedestrian volume without continuous natural tree shade.',
    status: 'Review',
  },
  {
    id: 'act-4',
    priority: 'MEDIUM',
    ward: 'Ward 14: Shivajinagar',
    wardId: 'ward-14',
    action: 'Replenish Smart Water Kiosks along FC Road',
    time: '09:00 AM – 1:00 PM',
    reason: 'Heavy footfall corridor experiencing rapid daytime electrolyte depletion.',
    status: 'Completed',
  },
];

export function getMunicipalActions(): MunicipalActionItem[] {
  return actionsStore;
}

export function updateMunicipalActionStatus(id: string, status: MunicipalActionItem['status']): MunicipalActionItem | null {
  const item = actionsStore.find((a) => a.id === id);
  if (item) {
    item.status = status;
    return item;
  }
  return null;
}

export function getProtectionResources(): ProtectionResourceItem[] {
  return [
    {
      name: 'Air-Conditioned Civic Cooling Sanctuaries',
      type: 'Cooling Centres',
      count: 24,
      capacity: '4,200 Citizens / Day',
      status: 'Active',
      provenance: 'CURATED',
    },
    {
      name: 'Smart Cold Water Dispensing Kiosks',
      type: 'Water Points',
      count: 142,
      capacity: '45,000 Liters / Day',
      status: 'Operational',
      provenance: 'LIVE',
    },
    {
      name: 'Shaded Tensile Walkways & Canopied Parks',
      type: 'Shade / Rest Areas',
      count: 38,
      capacity: '6,800 Citizens / Day',
      status: 'Operational',
      provenance: 'CURATED',
    },
    {
      name: 'Dedicated Emergency Heat Stroke Beds',
      type: 'Healthcare',
      count: 16,
      capacity: '65 Dedicated ICU/Ward Beds',
      status: 'Standby Ready',
      provenance: 'MODELLED',
    },
  ];
}

let alertsStore: MunicipalAlertItem[] = [
  {
    id: 'al-1',
    severity: 'Critical',
    what: 'Extreme thermal stress with severe daytime protection shortfall.',
    where: 'Ward 21 (Kasba Peth - Mandai Wholesale Market)',
    when: 'Today, 11:30 AM – 4:30 PM (Peak Solar Load)',
    why: 'Dense asphalt massing (+3.2°C UHI elevation) combined with heavy informal crowd presence.',
    action: 'Deploy 3 mobile misting tankers and activate 24/7 cooling centers.',
    status: 'Active',
  },
  {
    id: 'al-2',
    severity: 'High',
    what: 'High daytime thermal strain across industrial worker sheds.',
    where: 'Ward 18 (Hadapsar - Gadital Interchange)',
    when: 'Today, 12:00 PM – 4:00 PM',
    why: 'Low tree canopy (16%) and metal roofing causing extreme radiant heat buildup.',
    action: 'Enforce mandatory construction cool-down pauses and open civic centers.',
    status: 'Active',
  },
  {
    id: 'al-3',
    severity: 'Developing',
    what: 'Elevated daytime sun exposure on intercity transit corridors.',
    where: 'Ward 25 (Swargate Bus Terminus & Jedhe Chowk)',
    when: 'Today, 1:00 PM – 5:00 PM',
    why: 'Paved transit concourse absorbing intense solar irradiance without shade.',
    action: 'Erect temporary fabric tensile canopies and verify cold drinking water taps.',
    status: 'Active',
  },
];

export function getMunicipalAlertsList(): MunicipalAlertItem[] {
  return alertsStore;
}

export function addMunicipalAlert(alert: Omit<MunicipalAlertItem, 'id'>): MunicipalAlertItem {
  const newAlert: MunicipalAlertItem = {
    ...alert,
    id: `al-${Date.now()}`,
  };
  alertsStore.unshift(newAlert);
  return newAlert;
}

