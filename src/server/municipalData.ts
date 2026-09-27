import { ALL_REGIONAL_WARDS, PUNE_WARDS } from './geoData.js';
import {
  MunicipalSummary,
  MunicipalWardData,
  MunicipalActionItem,
  ProtectionResourceItem,
  MunicipalAlertItem,
} from '../types/municipal.js';
import { WeatherCurrent, WeatherDailyForecast } from './types.js';
import { calculateWBGT, calculateUTCI, categorizeThermalStress } from './thermalEngine.js';
import { CivicProtectionAssetRow, WardDemographicsRow } from './databaseService.js';

export function getMunicipalWards(
  weather?: WeatherCurrent,
  assets?: CivicProtectionAssetRow[],
  demographics?: WardDemographicsRow[],
  cityFilter?: string
): MunicipalWardData[] {
  // If no live weather provided, use base seasonal conditions
  const baseTemp = weather?.temp ?? 32.0;
  const baseRh = weather?.humidity ?? 48;
  const baseWind = (weather?.windSpeed ?? 8.0) / 3.6; // m/s
  const baseSolar = weather?.solarIrradiance ?? 500;

  let targetWards = ALL_REGIONAL_WARDS;
  if (cityFilter && cityFilter !== 'All') {
    const filtered = ALL_REGIONAL_WARDS.filter(
      (w) => (w.city || '').toLowerCase() === cityFilter.toLowerCase()
    );
    if (filtered.length > 0) {
      targetWards = filtered;
    }
  }

  return targetWards.map((ward) => {
    // 1. Calculate ward microclimate incorporating Urban Heat Island (UHI) offset
    const wardTemp = Math.round((baseTemp + ward.uhiOffsetDegC) * 10) / 10;
    const wardRh = Math.max(20, Math.min(95, Math.round(baseRh - ward.uhiOffsetDegC * 1.5)));
    const wardWbgt = calculateWBGT(wardTemp, wardRh, baseSolar, baseWind);
    const wardUtci = calculateUTCI(wardTemp, wardRh, baseWind, baseSolar);
    const thermalStressCategory = categorizeThermalStress(wardWbgt, wardUtci, wardTemp);

    // 2. Vulnerability & Demographic demand
    const demo = demographics?.find((d) => d.ward_id === ward.id);
    const vulnerableCount = demo?.vulnerable_count ?? ward.vulnerableCount;

    // Protection demand ratio scales with biological thermal load (WBGT)
    let demandRatio = 0.04;
    if (wardWbgt >= 32.0) demandRatio = 0.16;
    else if (wardWbgt >= 29.0) demandRatio = 0.12;
    else if (wardWbgt >= 26.0) demandRatio = 0.08;

    const demand = Math.round(vulnerableCount * demandRatio);

    // 3. Protection capacity from database assets
    const wardAssets = (assets || []).filter((a) => a.ward_id === ward.id && a.is_active);
    let capacity = wardAssets.reduce((sum, a) => sum + (a.daily_capacity || 150), 0);
    if (capacity === 0) {
      // Default baseline municipal capacity if no specific assets registered in DB
      capacity = ward.id === 'ward-21' ? 1420 : ward.id === 'ward-18' ? 2200 : ward.id === 'ward-25' ? 2400 : 1600;
    }

    const protectionGap = Math.max(0, demand - capacity);
    const fulfillmentPct = demand > 0 ? Math.min(100, Math.round((capacity / demand) * 100)) : 100;

    // 4. Deterministic composite ward risk score: (thermal * 0.45) + (vulnerability * 0.35) + (gap * 0.20)
    const thermalHazard = Math.min(100, Math.max(0, ((wardWbgt - 20) / (34 - 20)) * 100));
    const gapRatio = demand > 0 ? Math.min(100, (protectionGap / demand) * 100) : 0;
    const riskScore = Math.round(thermalHazard * 0.45 + (ward.vulnerabilityIndex || 50) * 0.35 + gapRatio * 0.2);

    let riskLevel: MunicipalWardData['riskLevel'] = 'Normal';
    if (riskScore >= 75) riskLevel = 'Critical';
    else if (riskScore >= 55) riskLevel = 'High';
    else if (riskScore >= 35) riskLevel = 'Developing';

    const whyAttention = `${ward.builtDensityPct}% built density (+${ward.uhiOffsetDegC}°C UHI elevation) with ${vulnerableCount.toLocaleString()} vulnerable residents and a ${protectionGap.toLocaleString()} person daytime protection shortfall.`;
    const recommendedAction =
      protectionGap > 2000
        ? `Deploy mobile mist-cooling tankers at ${ward.highRiskAreas[0] || 'central junctions'} and extend civic cooling shelter hours.`
        : protectionGap > 500
        ? `Install high-flow cold water dispensers and mandate midday outdoor rest periods.`
        : `Maintain routine municipal water kiosk replenishment and shaded resting canopies.`;

    return {
      id: ward.id,
      name: ward.name,
      zone: ward.zone,
      city: ward.city,
      state: ward.state,
      center: ward.center,
      bounds: ward.bounds,
      population: ward.population,
      vulnerableCount,
      riskLevel,
      riskScore,
      thermalStress: `WBGT ${wardWbgt}°C (${thermalStressCategory} Load)`,
      wbgt: wardWbgt,
      temp: wardTemp,
      vulnerableExposure: `${vulnerableCount.toLocaleString()} At-Risk Residents (${ward.zone})`,
      demand,
      capacity,
      protectionGap,
      fulfillmentPct,
      whyAttention,
      recommendedAction,
    };
  }).sort((a, b) => b.riskScore - a.riskScore); // Highest risk ward first
}

export function getMunicipalSummary(
  weather?: WeatherCurrent,
  forecast?: WeatherDailyForecast[],
  assets?: CivicProtectionAssetRow[],
  demographics?: WardDemographicsRow[],
  cityFilter?: string
): MunicipalSummary {
  const wards = getMunicipalWards(weather, assets, demographics, cityFilter);
  const highRiskWards = wards.filter((w) => w.riskLevel === 'High' || w.riskLevel === 'Critical');
  const totalGap = wards.reduce((acc, w) => acc + w.protectionGap, 0);
  const totalDemand = wards.reduce((acc, w) => acc + w.demand, 0);
  const totalCapacity = wards.reduce((acc, w) => acc + w.capacity, 0);
  const priorityWard = wards[0] || getMunicipalWards()[0];

  const now = new Date();
  const dateTimeStr =
    now.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) +
    ' • ' +
    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Derive 5-day outlook directly from actual forecast
  const fiveDayOutlook = (forecast && forecast.length >= 5 ? forecast.slice(0, 5) : []).map((f, idx) => ({
    day: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : f.dayName,
    date: idx === 0 ? 'Current' : `+${idx} Day${idx > 1 ? 's' : ''}`,
    tempMax: f.tempMax,
    riskLevel: (f.riskLevel === 'Extreme' ? 'Critical' : f.riskLevel) as 'Critical' | 'High' | 'Developing' | 'Normal',
  }));

  const currentHeatRisk = priorityWard.riskLevel;
  const currentRiskScore = priorityWard.riskScore;

  const currentAlert: MunicipalSummary['currentAlert'] = {
    title: `${priorityWard.name.toUpperCase()} — ${currentHeatRisk.toUpperCase()} HUMAN HEAT RISK`,
    subtitle: `Thermal stress (WBGT ${priorityWard.wbgt}°C) with a ${priorityWard.protectionGap.toLocaleString()} citizen protection gap.`,
    recommendation: priorityWard.recommendedAction,
    severity: currentHeatRisk === 'Critical' ? 'Critical' : currentHeatRisk === 'High' ? 'High' : 'Developing',
  };

  const cityName = cityFilter && cityFilter !== 'All'
    ? `${cityFilter} Municipal Corporation`
    : 'Maharashtra & National Municipal Grid';

  return {
    cityName,
    department: 'Disaster Management & Heat Action Cell',
    dateTime: dateTimeStr,
    dataStatus: weather?.source === 'LIVE' ? 'LIVE' : 'MODELLED',
    currentHeatRisk,
    currentRiskScore,
    highRiskWardsCount: highRiskWards.length,
    totalWardsCount: wards.length,
    totalProtectionGap: totalGap,
    totalDemand,
    totalCapacity,
    priorityWard,
    priorityAction: `Deploy emergency protection assets & extend shelter hours in ${priorityWard.name}.`,
    fiveDayOutlook:
      fiveDayOutlook.length >= 5
        ? fiveDayOutlook
        : [
            { day: 'Today', date: 'Current', tempMax: weather?.temp ?? 32.0, riskLevel: currentHeatRisk },
            { day: 'Tomorrow', date: '+1 Day', tempMax: (weather?.temp ?? 32.0) + 0.8, riskLevel: currentHeatRisk },
            { day: 'Day 3', date: '+2 Days', tempMax: (weather?.temp ?? 32.0) + 1.2, riskLevel: currentHeatRisk },
            { day: 'Day 4', date: '+3 Days', tempMax: (weather?.temp ?? 32.0) + 0.5, riskLevel: currentHeatRisk },
            { day: 'Day 5', date: '+4 Days', tempMax: (weather?.temp ?? 32.0) - 0.5, riskLevel: 'Developing' },
          ],
    currentAlert,
  };
}

import { supabase } from './supabase.js';

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

export async function getMunicipalActions(): Promise<MunicipalActionItem[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('municipal_action_queue')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          priority: d.priority,
          ward: d.ward_display_name,
          wardId: d.ward_id,
          action: d.action_title,
          time: d.time_window_display || d.time_window,
          reason: d.rationale,
          status: d.status,
        }));
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch municipal actions, using fallback store:', err);
    }
  }
  return actionsStore;
}

export async function updateMunicipalActionStatus(
  id: string,
  status: MunicipalActionItem['status']
): Promise<MunicipalActionItem | null> {
  const item = actionsStore.find((a) => a.id === id);
  if (item) {
    item.status = status;
  }

  if (supabase) {
    try {
      await supabase
        .from('municipal_action_queue')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Failed to update action status in DB:', err);
    }
  }

  return item || null;
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

export async function getMunicipalAlertsList(): Promise<MunicipalAlertItem[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('municipal_alerts')
        .select('*')
        .order('dispatched_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          severity: d.severity,
          what: d.what,
          where: d.where_location,
          when: d.when_time,
          why: d.why_reason,
          action: d.action_directive,
          status: d.lifecycle_status || d.status || 'Active',
        }));
      }
    } catch (err) {
      console.warn('[Supabase] Failed to fetch municipal alerts, using fallback store:', err);
    }
  }
  return alertsStore;
}

export async function addMunicipalAlert(
  alert: Omit<MunicipalAlertItem, 'id'>
): Promise<MunicipalAlertItem> {
  const newAlert: MunicipalAlertItem = {
    ...alert,
    id: `al-${Date.now()}`,
  };
  alertsStore.unshift(newAlert);

  if (supabase) {
    try {
      await supabase.from('municipal_alerts').insert({
        id: newAlert.id,
        severity: newAlert.severity,
        lifecycle_status: (newAlert.status as any) || 'Active',
        what: newAlert.what,
        where_location: newAlert.where,
        when_time: newAlert.when,
        why_reason: newAlert.why,
        action_directive: newAlert.action,
      });
    } catch (err) {
      console.warn('[Supabase] Failed to insert alert into DB:', err);
    }
  }

  return newAlert;
}

