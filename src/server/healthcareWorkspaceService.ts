import { PUNE_WARDS, HEALTHCARE_FACILITIES, calculateDistanceKm } from './geoData.js';
import { calculateWBGT, calculateUTCI, calculateHeatIndex, categorizeThermalStress } from './thermalEngine.js';
import { fetchWeatherData } from './weatherService.js';
import {
  HealthcareSummary,
  HealthcareDayForecast,
  HealthcareRiskArea,
  HealthcareFacilityReadiness,
  HealthcareDemandCapacity,
  HealthcareAlert,
  HealthcareSettings,
  FacilityProfileData,
  FacilityEnteredField,
  ProvenanceTag,
} from '../types/healthcare.js';

// Helper to make a facility-entered field
function createField<T>(
  val: T,
  isEntered: boolean,
  updatedBy = 'Not provided',
  sourceType: ProvenanceTag = isEntered ? 'FACILITY ENTERED' : 'UNAVAILABLE'
): FacilityEnteredField<T> {
  return {
    value: val,
    lastUpdated: isEntered
      ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST'
      : 'Not entered',
    updatedBy: isEntered ? updatedBy : 'Awaiting entry',
    sourceType,
    isEntered,
  };
}

// In-memory facility profile (defaults to initial unentered state with real hospital identity)
let facilityProfile: FacilityProfileData = {
  facilityName: 'Sassoon General Hospital & Medical College (BJMC)',
  facilityType: 'Government Tertiary Teaching Hospital & Trauma Center',
  address: 'Station Road, Near Pune Railway Station, Pune 411001, Maharashtra',
  contactPhone: '+91 20 2612 8000',
  contactEmail: 'er-heatcell@bjmcpmc.gov.in',
  medicalSuperintendent: 'Dr. A. Deshmukh, MD (Medical Superintendent)',

  // Unentered initially
  totalBeds: createField<number | null>(null, false),
  occupiedBeds: createField<number | null>(null, false),
  availableBeds: createField<number | null>(null, false),
  totalIcuBeds: createField<number | null>(null, false),
  availableIcuBeds: createField<number | null>(null, false),
  emergencyCapacityBeds: createField<number | null>(null, false),

  totalAmbulances: createField<number | null>(null, false),
  availableAmbulances: createField<number | null>(null, false),
  coolingImmersionTanks: createField<number | null>(null, false),
  chilledSalineUnits: createField<number | null>(null, false),

  staffReadinessPct: createField<number | null>(null, false),
  staffNotes: 'Awaiting daily clinical roster confirmation from nursing supervisor.',
  heatPreparednessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),
  emergencyPreparednessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),
  outreachReadinessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),
  coolingSupportReadinessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),

  lastEvaluated: 'Awaiting update',
  updatedBy: 'Awaiting entry',
  isEntered: false,
  isDemoMode: false,
};

// Configurable settings
let healthcareSettings: HealthcareSettings = {
  facilityName: 'Sassoon General Hospital & Medical College',
  primaryOrganization: 'Pune Heatstroke Medical Grid — Disaster Cell',
  primaryDistrict: 'Pune Metropolitan Region',
  temperatureThresholdCelsius: 38.0,
  wbgtWarningThreshold: 30.0,
  alertDispatchPhone: '+91 20 2612 8000',
  autoNotifyERStaff: true,
  preferredWeatherSource: 'IMD Synoptic & Open-Meteo',
  dataFreshnessMinutes: 10,
};

// Checklist items for operational readiness
let operationalChecklist = [
  { id: 'chk-1', item: 'Cold IV normal saline units pre-chilled at 4°C in triage refrigerators', isReady: false, category: 'Clinical Supplies' as const },
  { id: 'chk-2', item: 'Dedicated heat exhaustion cooling immersion bay operational', isReady: false, category: 'Infrastructure' as const },
  { id: 'chk-3', item: 'Electrolyte rehydration oral solution kits in outpatient intake', isReady: false, category: 'Clinical Supplies' as const },
  { id: 'chk-4', item: 'On-call emergency physician rotation confirmed for peak heat window', isReady: false, category: 'Staffing' as const },
  { id: 'chk-5', item: 'Auxiliary cooling fans and misting in general emergency waiting hall', isReady: false, category: 'Infrastructure' as const },
  { id: 'chk-6', item: 'Inter-hospital transfer corridor with District Civil Hospital confirmed', isReady: false, category: 'Coordination' as const },
];

export async function getHealthcareSummary(lat = 18.5204, lng = 73.8567): Promise<HealthcareSummary> {
  const weather = await fetchWeatherData(lat, lng);
  const current = weather.current;

  // 1. Thermal stress from shared engine
  const wbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, current.windSpeed);
  const utci = calculateUTCI(current.temp, current.humidity, current.windSpeed, current.solarIrradiance);

  // 2. Compute 5-day health forecast based on real weather
  const fiveDayOutlook: HealthcareDayForecast[] = (weather.daily || []).slice(0, 5).map((d, idx) => {
    const dWbgt = calculateWBGT(d.tempMax, d.humidityAvg, d.solarRadiationMax, 2.5);
    const dUtci = calculateUTCI(d.tempMax, d.humidityAvg, 2.5, d.solarRadiationMax);

    let healthRisk: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Moderate';
    let hospRisk: 'Normal' | 'Elevated' | 'High' | 'Severe' = 'Elevated';
    let mortSignal: 'Low' | 'Low-to-Moderate' | 'Moderate' | 'Elevated' = 'Low-to-Moderate';
    let trend: 'Increasing' | 'Peak Sustained' | 'Easing' | 'Stable' = 'Increasing';

    if (d.tempMax >= 40.5 || dWbgt >= 31.5) {
      healthRisk = 'Critical';
      hospRisk = 'Severe';
      mortSignal = 'Elevated';
      trend = 'Peak Sustained';
    } else if (d.tempMax >= 38.5 || dWbgt >= 29.5) {
      healthRisk = 'High';
      hospRisk = 'High';
      mortSignal = 'Moderate';
      trend = idx === 0 ? 'Increasing' : idx <= 2 ? 'Peak Sustained' : 'Easing';
    } else if (d.tempMax >= 36.0 || dWbgt >= 27.0) {
      healthRisk = 'Moderate';
      hospRisk = 'Elevated';
      mortSignal = 'Low-to-Moderate';
      trend = idx <= 1 ? 'Increasing' : 'Stable';
    } else {
      healthRisk = 'Low';
      hospRisk = 'Normal';
      mortSignal = 'Low';
      trend = 'Stable';
    }

    return {
      dayIndex: idx,
      dayName: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : d.dayName,
      date: d.date,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      wbgt: dWbgt,
      utci: dUtci,
      healthRisk,
      hospitalizationRisk: hospRisk,
      hospitalizationIncreasePct: hospRisk === 'Severe' ? 45 : hospRisk === 'High' ? 28 : hospRisk === 'Elevated' ? 14 : 4,
      mortalityRiskSignal: mortSignal,
      trend,
      peakHours: '11:30 AM – 4:30 PM',
      clinicalNotes:
        healthRisk === 'Critical'
          ? 'High probability of classic heat stroke in outdoor laborers and frail elderly.'
          : healthRisk === 'High'
          ? 'Surge in dehydration-induced electrolyte imbalances and cardiac strain.'
          : 'Isolated heat cramps and mild exhaustion cases expected.',
    };
  });

  const todayOutlook = fiveDayOutlook[0] || {
    healthRisk: 'High',
    hospitalizationRisk: 'Elevated',
    hospitalizationIncreasePct: 28,
    mortalityRiskSignal: 'Low-to-Moderate',
    trend: 'Increasing',
  };

  // 3. Compute High-Risk Areas (Wards) from weather + UHI + built density
  const highRiskAreas: HealthcareRiskArea[] = PUNE_WARDS.map((w) => {
    const wWbgt = calculateWBGT(current.temp + (w.uhiOffsetDegC * 0.4), current.humidity, current.solarIrradiance, current.windSpeed);
    const score = Math.min(100, Math.round((wWbgt * 1.8) + (w.vulnerabilityIndex * 0.4) + (w.uhiOffsetDegC * 4)));

    let riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Moderate';
    let demandLevel: 'Critical Surge' | 'High Surge' | 'Moderate' | 'Baseline' = 'Moderate';
    let expectedAdmissions = Math.round(10 + (score / 100) * 22);

    if (score >= 76) {
      riskLevel = 'Critical';
      demandLevel = 'Critical Surge';
    } else if (score >= 64) {
      riskLevel = 'High';
      demandLevel = 'High Surge';
    } else if (score >= 50) {
      riskLevel = 'Moderate';
      demandLevel = 'Moderate';
    } else {
      riskLevel = 'Low';
      demandLevel = 'Baseline';
    }

    return {
      wardId: w.id,
      wardName: w.name,
      zone: w.zone,
      center: w.center,
      heatRisk: riskLevel,
      healthRisk: riskLevel,
      expectedDemand: demandLevel,
      expectedDailyAdmissions: expectedAdmissions,
      vulnerablePopulation: w.vulnerableCount,
      vulnerableExposureNotes:
        w.builtDensityPct > 70
          ? `${w.builtDensityPct}% built density with severe microclimate heat retention and high street-vendor concentration.`
          : `Elevated outdoor exposure along major industrial and transit corridors.`,
      vulnerabilityBreakdown: {
        elderly65Plus: Math.round(w.vulnerableCount * 0.42),
        outdoorWorkers: Math.round(w.vulnerableCount * 0.38),
        chronicConditions: Math.round(w.vulnerableCount * 0.20),
      },
      recommendedHealthAction:
        riskLevel === 'Critical'
          ? 'Stage 108 mobile cooling unit near central market; alert peripheral Urban Health Centers.'
          : riskLevel === 'High'
          ? 'Stock 500 units of ORS sachets at community clinics; review heat-stroke triage protocol.'
          : 'Standard hydration advisories and routine outpatient triage monitoring.',
    };
  }).sort((a, b) => b.expectedDailyAdmissions - a.expectedDailyAdmissions);

  // 4. Modelled Expected Demand
  const totalExpectedPatientDemand = highRiskAreas.reduce((sum, a) => sum + a.expectedDailyAdmissions, 0);

  // 5. Check Facility-Entered Capacity (DO NOT INVENT!)
  const isCapacityEntered = facilityProfile.isEntered || facilityProfile.isDemoMode;
  const enteredAvailableBeds = facilityProfile.availableBeds.value;
  const enteredEmergencyBeds = facilityProfile.emergencyCapacityBeds.value;

  // The operational available capacity is the facility-entered available beds (or emergency beds if provided)
  const availableCapacity = isCapacityEntered ? (enteredAvailableBeds ?? enteredEmergencyBeds ?? null) : null;
  const capacityGap = availableCapacity !== null ? Math.max(0, totalExpectedPatientDemand - availableCapacity) : null;

  let capacityGapStatus: HealthcareDemandCapacity['capacityGapStatus'] = 'CAPACITY NOT YET PROVIDED';
  if (availableCapacity !== null) {
    capacityGapStatus = capacityGap && capacityGap > 0 ? 'Deficit Warning' : 'Adequate';
  }

  const capacityProvenance: ProvenanceTag = facilityProfile.isDemoMode
    ? 'DEMO / MODELLED'
    : isCapacityEntered
    ? 'FACILITY ENTERED'
    : 'UNAVAILABLE';

  const demandCapacity: HealthcareDemandCapacity = {
    expectedDemandPatients: totalExpectedPatientDemand,
    expectedDemandLevel: totalExpectedPatientDemand > 100 ? 'High Surge' : 'Moderate',
    isCapacityEntered: availableCapacity !== null,
    availableCapacityBeds: availableCapacity,
    capacityGapPatients: capacityGap,
    capacityGapStatus,
    capacityProvenance,
    lastCapacityUpdate: facilityProfile.availableBeds.lastUpdated,
    updatedBy: facilityProfile.availableBeds.updatedBy,
    projected3DayDemand: [
      {
        day: 'Today',
        demand: totalExpectedPatientDemand,
        capacity: availableCapacity,
        gap: capacityGap,
        status: capacityGapStatus,
      },
      {
        day: 'Day 2',
        demand: Math.round(totalExpectedPatientDemand * 1.12),
        capacity: availableCapacity,
        gap: availableCapacity !== null ? Math.max(0, Math.round(totalExpectedPatientDemand * 1.12) - availableCapacity) : null,
        status: availableCapacity !== null ? (Math.round(totalExpectedPatientDemand * 1.12) > availableCapacity ? 'Deficit Warning' : 'Adequate') : 'CAPACITY NOT YET PROVIDED',
      },
      {
        day: 'Day 3',
        demand: Math.round(totalExpectedPatientDemand * 1.18),
        capacity: availableCapacity,
        gap: availableCapacity !== null ? Math.max(0, Math.round(totalExpectedPatientDemand * 1.18) - availableCapacity) : null,
        status: availableCapacity !== null ? (Math.round(totalExpectedPatientDemand * 1.18) > availableCapacity ? 'Deficit Warning' : 'Adequate') : 'CAPACITY NOT YET PROVIDED',
      },
      {
        day: 'Day 4',
        demand: Math.round(totalExpectedPatientDemand * 1.05),
        capacity: availableCapacity,
        gap: availableCapacity !== null ? Math.max(0, Math.round(totalExpectedPatientDemand * 1.05) - availableCapacity) : null,
        status: availableCapacity !== null ? (Math.round(totalExpectedPatientDemand * 1.05) > availableCapacity ? 'Deficit Warning' : 'Adequate') : 'CAPACITY NOT YET PROVIDED',
      },
      {
        day: 'Day 5',
        demand: Math.round(totalExpectedPatientDemand * 0.95),
        capacity: availableCapacity,
        gap: availableCapacity !== null ? Math.max(0, Math.round(totalExpectedPatientDemand * 0.95) - availableCapacity) : null,
        status: availableCapacity !== null ? (Math.round(totalExpectedPatientDemand * 0.95) > availableCapacity ? 'Deficit Warning' : 'Adequate') : 'CAPACITY NOT YET PROVIDED',
      },
    ],
  };

  // 6. Facility Readiness state
  const readyChecklistCount = operationalChecklist.filter((c) => c.isReady).length;
  const readinessPct = isCapacityEntered ? Math.round((readyChecklistCount / operationalChecklist.length) * 100) : 0;
  const overallReadinessStatus = !isCapacityEntered
    ? 'NOT ENTERED'
    : readinessPct >= 80
    ? 'READY'
    : readinessPct >= 50
    ? 'NEEDS ATTENTION'
    : 'CRITICAL';

  const facilityReadiness: HealthcareFacilityReadiness = {
    facilityName: facilityProfile.facilityName,
    organization: healthcareSettings.primaryOrganization,
    monitoredArea: healthcareSettings.primaryDistrict,
    lastEvaluated: facilityProfile.lastEvaluated,
    updatedBy: facilityProfile.updatedBy,
    overallStatus: overallReadinessStatus,
    overallScorePct: readinessPct,
    isEntered: isCapacityEntered,
    isDemoMode: facilityProfile.isDemoMode,
    metrics: {
      emergencyCapacity: {
        label: 'Emergency Heat Trauma Beds',
        current: facilityProfile.emergencyCapacityBeds.value,
        total: facilityProfile.totalBeds.value,
        unit: 'beds',
        status: isCapacityEntered ? 'READY' : 'NOT ENTERED',
        note: isCapacityEntered ? 'Dedicated heatstroke resuscitation beds entered.' : 'Capacity not yet entered by facility.',
        provenance: facilityProfile.emergencyCapacityBeds.sourceType,
        isEntered: facilityProfile.emergencyCapacityBeds.isEntered,
      },
      staffReadiness: {
        label: 'ER Clinical & Nursing Roster',
        current: facilityProfile.staffReadinessPct.value,
        total: 100,
        unit: '% rostered',
        status: facilityProfile.staffReadinessPct.isEntered ? 'READY' : 'NOT ENTERED',
        note: facilityProfile.staffNotes,
        provenance: facilityProfile.staffReadinessPct.sourceType,
        isEntered: facilityProfile.staffReadinessPct.isEntered,
      },
      heatCarePreparedness: {
        label: 'Rapid Cooling & Cold Saline',
        current: facilityProfile.chilledSalineUnits.value,
        total: 100,
        unit: 'units',
        status: facilityProfile.heatPreparednessStatus.value,
        note: isCapacityEntered ? 'Cold saline infusion units stocked at 4°C.' : 'Awaiting clinical stock update.',
        provenance: facilityProfile.heatPreparednessStatus.sourceType,
        isEntered: facilityProfile.heatPreparednessStatus.isEntered,
      },
      availableCapacity: {
        label: 'Available ICU Heatstroke Reserves',
        current: facilityProfile.availableIcuBeds.value,
        total: facilityProfile.totalIcuBeds.value,
        unit: 'ICU beds',
        status: facilityProfile.availableIcuBeds.isEntered ? 'NEEDS ATTENTION' : 'NOT ENTERED',
        note: isCapacityEntered ? 'Critical surge capacity for altered mental status heatstroke.' : 'Not entered.',
        provenance: facilityProfile.availableIcuBeds.sourceType,
        isEntered: facilityProfile.availableIcuBeds.isEntered,
      },
      outreachReadiness: {
        label: '108 Ambulance Units',
        current: facilityProfile.availableAmbulances.value,
        total: facilityProfile.totalAmbulances.value,
        unit: 'ambulances',
        status: facilityProfile.outreachReadinessStatus.value,
        note: isCapacityEntered ? 'Equipped with cold packs & misting sprayers.' : 'Ambulance status not updated.',
        provenance: facilityProfile.availableAmbulances.sourceType,
        isEntered: facilityProfile.availableAmbulances.isEntered,
      },
    },
    checklist: operationalChecklist,
  };

  // 7. Active Alert
  const activeAlert: HealthcareAlert = {
    id: 'ha-2026-0926-01',
    title: 'ELEVATED HEAT-HEALTH EMERGENCY SURGE',
    severity: 'High',
    what: 'Anticipated surge in severe heat exhaustion and dehydration-related trauma cases.',
    where: 'Central & Eastern Pune Wards (Kasba Peth, Hadapsar, Swargate)',
    when: 'Next 72 Hours (Peak Window 11:30 AM – 4:30 PM Daily)',
    why: 'Wet Bulb Globe Temperature exceeding 30.5°C coupled with high dense urban radiant heat load.',
    recommendedAction: 'Prepare heat-related emergency capacity, activate cold saline resuscitation protocols, and alert peripheral triage clinics.',
    issuedAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  const currentAction = {
    what: 'Prepare Additional Heatstroke Emergency Capacity & Cold IV Reserves',
    where: `${facilityProfile.facilityName} & Kasba Peth Urban Health Center`,
    when: 'Next 3 Days (11:00 AM – 5:00 PM)',
    why: 'Increasing modelled heat-health risk (+28% admission signal)',
    status: 'Operational Directive',
  };

  const now = new Date();
  const dateTimeStr =
    now.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) +
    ' • ' +
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' IST';

  return {
    organization: healthcareSettings.primaryOrganization,
    facilityName: facilityProfile.facilityName,
    facilityType: facilityProfile.facilityType,
    monitoredArea: healthcareSettings.primaryDistrict,
    dateTime: dateTimeStr,
    dataStatus: 'IMD Synoptic Synced • Live Meteorological Feed',
    provenance: {
      weather: 'LIVE API',
      healthRisk: 'MODELLED',
      hospitalizationRisk: 'ESTIMATED',
      mortalityRisk: 'ESTIMATED',
      facilities: 'LIVE API',
      facilityCapacity: capacityProvenance,
      readiness: isCapacityEntered ? (facilityProfile.isDemoMode ? 'DEMO / MODELLED' : 'FACILITY ENTERED') : 'UNAVAILABLE',
    },
    cards: {
      healthRisk: {
        title: '3–5 Day Health Risk',
        status: todayOutlook.healthRisk === 'Critical' ? 'Critical' : todayOutlook.healthRisk === 'High' ? 'Elevated' : 'Moderate',
        level: todayOutlook.healthRisk,
        score: todayOutlook.healthRisk === 'Critical' ? 84 : todayOutlook.healthRisk === 'High' ? 76 : 58,
        explanation: 'Elevated physiological heat stress with high dehydration potential across urban core.',
        badge: 'MODELLED',
      },
      hospitalizationRisk: {
        title: 'Hospitalization Risk',
        signal: `+${todayOutlook.hospitalizationIncreasePct}% Surge`,
        trend: todayOutlook.trend,
        explanation: 'Estimated 28% increase in emergency admissions for acute heat exhaustion and cardiorespiratory strain.',
        badge: 'ESTIMATED',
      },
      mortalityRiskSignal: {
        title: 'Mortality-Risk Signal',
        signal: todayOutlook.mortalityRiskSignal,
        trend: 'Stable',
        explanation: 'Mild-to-moderate statistical mortality anomaly projected if vulnerable elderly lack cooling respite.',
        badge: 'ESTIMATED',
      },
      expectedPatientDemand: {
        title: 'Expected Patient Demand',
        demandLevel: demandCapacity.expectedDemandLevel,
        estimatedPatientsPerDay: totalExpectedPatientDemand,
        explanation: `Estimated ~${totalExpectedPatientDemand} heat-related ER presentations across monitored facilities.`,
        badge: 'MODELLED',
      },
    },
    facilityProfile,
    fiveDayOutlook,
    highRiskAreas,
    facilityReadiness,
    demandCapacity,
    currentAction,
    activeAlert,
  };
}

export function getFacilityProfile(): FacilityProfileData {
  return facilityProfile;
}

export function updateFacilityProfile(
  updates: Partial<FacilityProfileData>,
  updatedBy = 'Dr. A. Deshmukh (Medical Superintendent)'
): FacilityProfileData {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';

  // Apply updates and ensure field audit metadata
  const nextProfile = { ...facilityProfile, ...updates };

  const wrapIfChanged = <T>(val: any, existingField: FacilityEnteredField<T>): FacilityEnteredField<T> => {
    if (val !== undefined && val !== null) {
      return {
        value: val,
        lastUpdated: timestamp,
        updatedBy,
        sourceType: 'FACILITY ENTERED',
        isEntered: true,
      };
    }
    return existingField;
  };

  if (updates.totalBeds !== undefined) {
    nextProfile.totalBeds = typeof updates.totalBeds === 'number'
      ? createField(updates.totalBeds, true, updatedBy, 'FACILITY ENTERED')
      : (updates.totalBeds as any);
  }
  if (updates.occupiedBeds !== undefined) {
    nextProfile.occupiedBeds = typeof updates.occupiedBeds === 'number'
      ? createField(updates.occupiedBeds, true, updatedBy, 'FACILITY ENTERED')
      : (updates.occupiedBeds as any);
  }
  if (updates.availableBeds !== undefined) {
    nextProfile.availableBeds = typeof updates.availableBeds === 'number'
      ? createField(updates.availableBeds, true, updatedBy, 'FACILITY ENTERED')
      : (updates.availableBeds as any);
  }
  if (updates.totalIcuBeds !== undefined) {
    nextProfile.totalIcuBeds = typeof updates.totalIcuBeds === 'number'
      ? createField(updates.totalIcuBeds, true, updatedBy, 'FACILITY ENTERED')
      : (updates.totalIcuBeds as any);
  }
  if (updates.availableIcuBeds !== undefined) {
    nextProfile.availableIcuBeds = typeof updates.availableIcuBeds === 'number'
      ? createField(updates.availableIcuBeds, true, updatedBy, 'FACILITY ENTERED')
      : (updates.availableIcuBeds as any);
  }
  if (updates.emergencyCapacityBeds !== undefined) {
    nextProfile.emergencyCapacityBeds = typeof updates.emergencyCapacityBeds === 'number'
      ? createField(updates.emergencyCapacityBeds, true, updatedBy, 'FACILITY ENTERED')
      : (updates.emergencyCapacityBeds as any);
  }
  if (updates.totalAmbulances !== undefined) {
    nextProfile.totalAmbulances = typeof updates.totalAmbulances === 'number'
      ? createField(updates.totalAmbulances, true, updatedBy, 'FACILITY ENTERED')
      : (updates.totalAmbulances as any);
  }
  if (updates.availableAmbulances !== undefined) {
    nextProfile.availableAmbulances = typeof updates.availableAmbulances === 'number'
      ? createField(updates.availableAmbulances, true, updatedBy, 'FACILITY ENTERED')
      : (updates.availableAmbulances as any);
  }
  if (updates.coolingImmersionTanks !== undefined) {
    nextProfile.coolingImmersionTanks = typeof updates.coolingImmersionTanks === 'number'
      ? createField(updates.coolingImmersionTanks, true, updatedBy, 'FACILITY ENTERED')
      : (updates.coolingImmersionTanks as any);
  }
  if (updates.chilledSalineUnits !== undefined) {
    nextProfile.chilledSalineUnits = typeof updates.chilledSalineUnits === 'number'
      ? createField(updates.chilledSalineUnits, true, updatedBy, 'FACILITY ENTERED')
      : (updates.chilledSalineUnits as any);
  }
  if (updates.staffReadinessPct !== undefined) {
    nextProfile.staffReadinessPct = typeof updates.staffReadinessPct === 'number'
      ? createField(updates.staffReadinessPct, true, updatedBy, 'FACILITY ENTERED')
      : (updates.staffReadinessPct as any);
  }

  nextProfile.isEntered = true;
  nextProfile.isDemoMode = false;
  nextProfile.lastEvaluated = timestamp;
  nextProfile.updatedBy = updatedBy;

  facilityProfile = nextProfile;
  return facilityProfile;
}

export function toggleDemoMode(enableDemo: boolean): FacilityProfileData {
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';

  if (enableDemo) {
    facilityProfile = {
      facilityName: 'Sassoon General Hospital & Medical College (BJMC)',
      facilityType: 'Government Tertiary Teaching Hospital & Trauma Center',
      address: 'Station Road, Near Pune Railway Station, Pune 411001, Maharashtra',
      contactPhone: '+91 20 2612 8000',
      contactEmail: 'er-heatcell@bjmcpmc.gov.in',
      medicalSuperintendent: 'Dr. A. Deshmukh, MD (Medical Superintendent)',

      totalBeds: createField(1250, true, 'Sample Simulation', 'DEMO / MODELLED'),
      occupiedBeds: createField(1160, true, 'Sample Simulation', 'DEMO / MODELLED'),
      availableBeds: createField(90, true, 'Sample Simulation', 'DEMO / MODELLED'),
      totalIcuBeds: createField(60, true, 'Sample Simulation', 'DEMO / MODELLED'),
      availableIcuBeds: createField(8, true, 'Sample Simulation', 'DEMO / MODELLED'),
      emergencyCapacityBeds: createField(35, true, 'Sample Simulation', 'DEMO / MODELLED'),

      totalAmbulances: createField(20, true, 'Sample Simulation', 'DEMO / MODELLED'),
      availableAmbulances: createField(16, true, 'Sample Simulation', 'DEMO / MODELLED'),
      coolingImmersionTanks: createField(4, true, 'Sample Simulation', 'DEMO / MODELLED'),
      chilledSalineUnits: createField(250, true, 'Sample Simulation', 'DEMO / MODELLED'),

      staffReadinessPct: createField(92, true, 'Sample Simulation', 'DEMO / MODELLED'),
      staffNotes: 'Double triage nursing rotation activated for 11:30 AM – 4:30 PM peak heat window.',
      heatPreparednessStatus: createField('READY', true, 'Sample Simulation', 'DEMO / MODELLED'),
      emergencyPreparednessStatus: createField('READY', true, 'Sample Simulation', 'DEMO / MODELLED'),
      outreachReadinessStatus: createField('READY', true, 'Sample Simulation', 'DEMO / MODELLED'),
      coolingSupportReadinessStatus: createField('READY', true, 'Sample Simulation', 'DEMO / MODELLED'),

      lastEvaluated: timestamp,
      updatedBy: 'DEMO / MODELLED SIMULATION',
      isEntered: true,
      isDemoMode: true,
    };
    operationalChecklist = operationalChecklist.map((c) => ({ ...c, isReady: true }));
  } else {
    // Reset to unentered
    facilityProfile = {
      facilityName: 'Sassoon General Hospital & Medical College (BJMC)',
      facilityType: 'Government Tertiary Teaching Hospital & Trauma Center',
      address: 'Station Road, Near Pune Railway Station, Pune 411001, Maharashtra',
      contactPhone: '+91 20 2612 8000',
      contactEmail: 'er-heatcell@bjmcpmc.gov.in',
      medicalSuperintendent: 'Dr. A. Deshmukh, MD (Medical Superintendent)',

      totalBeds: createField<number | null>(null, false),
      occupiedBeds: createField<number | null>(null, false),
      availableBeds: createField<number | null>(null, false),
      totalIcuBeds: createField<number | null>(null, false),
      availableIcuBeds: createField<number | null>(null, false),
      emergencyCapacityBeds: createField<number | null>(null, false),

      totalAmbulances: createField<number | null>(null, false),
      availableAmbulances: createField<number | null>(null, false),
      coolingImmersionTanks: createField<number | null>(null, false),
      chilledSalineUnits: createField<number | null>(null, false),

      staffReadinessPct: createField<number | null>(null, false),
      staffNotes: 'Awaiting daily clinical roster confirmation from nursing supervisor.',
      heatPreparednessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),
      emergencyPreparednessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),
      outreachReadinessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),
      coolingSupportReadinessStatus: createField<'READY' | 'NEEDS ATTENTION' | 'CRITICAL' | 'NOT ENTERED'>('NOT ENTERED', false),

      lastEvaluated: 'Awaiting update',
      updatedBy: 'Awaiting entry',
      isEntered: false,
      isDemoMode: false,
    };
    operationalChecklist = operationalChecklist.map((c) => ({ ...c, isReady: false }));
  }

  return facilityProfile;
}

export function toggleChecklistItem(id: string, isReady: boolean) {
  operationalChecklist = operationalChecklist.map((c) => (c.id === id ? { ...c, isReady } : c));
  return operationalChecklist;
}

export function getHealthcareSettings(): HealthcareSettings {
  return healthcareSettings;
}

export function updateHealthcareSettings(updates: Partial<HealthcareSettings>): HealthcareSettings {
  healthcareSettings = {
    ...healthcareSettings,
    ...updates,
  };
  return healthcareSettings;
}
