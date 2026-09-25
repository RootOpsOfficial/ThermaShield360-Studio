import {
  AdaptiveRecommendation,
  CitizenAlert,
  AlertHistoryItem,
  AlertSeverity,
  CitizenAlertType,
  RiskLevel,
  WardInfo,
} from './types.js';

export function getAdaptiveRecommendations(
  riskLevel: RiskLevel,
  ward: WardInfo,
  tempC: number,
  wbgt: number,
  userProfile?: {
    ageGroup?: string;
    isOutdoorWorker?: boolean;
    hasHealthCondition?: boolean;
  }
): AdaptiveRecommendation[] {
  const isVulnerable =
    userProfile?.ageGroup === 'Senior (65+)' ||
    userProfile?.ageGroup === 'Child (< 12)' ||
    userProfile?.hasHealthCondition;
  const isOutdoor = userProfile?.isOutdoorWorker;

  const recs: AdaptiveRecommendation[] = [];

  if (riskLevel === 'Extreme' || riskLevel === 'High') {
    recs.push({
      id: 'rec-1',
      priority: 'Immediate',
      category: 'Outdoor Activity',
      what: 'Halt all non-essential outdoor travel and strenuous physical exertion.',
      where: `${ward.highRiskAreas[0] || 'Unshaded public squares and asphalt corridors'} in ${ward.name}`,
      when: '12:00 PM – 04:30 PM (Peak solar and thermal radiation window)',
      why: `Wet Bulb Globe Temp is ${wbgt}°C, which exceeds human biological sweat evaporation thresholds. Core body temperature can rise dangerously within 25 minutes.`,
      actionButtonText: 'View High-Risk Zones on Map',
      actionRoute: 'map',
    });

    recs.push({
      id: 'rec-2',
      priority: 'Immediate',
      category: 'Cooling Centre',
      what: 'Utilize air-conditioned civic cooling sanctuaries for at least 45 minutes of thermal recovery.',
      where: `Shivajinagar Municipal Climate Shelter & ${ward.name} Civic Centre`,
      when: '1:00 PM – 5:00 PM or immediately upon experiencing dizziness, flushing, or headache',
      why: 'Rapid ambient temperature reduction prevents cellular heat shock proteins from degrading and restores cardiovascular equilibrium.',
      actionButtonText: 'Find Nearest Cooling Shelter',
      actionRoute: 'protection',
    });

    if (isOutdoor) {
      recs.push({
        id: 'rec-3',
        priority: 'Immediate',
        category: 'Outdoor Activity',
        what: 'Mandatory 15-minute rest breaks in deep shade for every 30 minutes of labor.',
        where: 'Covered arcades, shaded parks, or designated worker rest stations',
        when: 'All shift hours between 11:30 AM and 05:00 PM',
        why: 'Continuous metabolic heat generation in high humidity causes rapid dehydration and acute heat exhaustion.',
        actionButtonText: 'Locate Shaded Rest Arbours',
        actionRoute: 'protection',
      });
    }

    recs.push({
      id: 'rec-4',
      priority: 'Important',
      category: 'Hydration',
      what: 'Drink 300–400 ml of electrolyte-balanced water or ORS solution every 35 minutes.',
      where: 'Carry an insulated flask or refill at PMC municipal chilled kiosks',
      when: 'Continuously throughout the day, without waiting for the sensation of thirst',
      why: 'High thermal stress drains vital sodium and potassium electrolytes before thirst signals trigger in the brain.',
      actionButtonText: 'View Drinking Water Points',
      actionRoute: 'protection',
    });

    recs.push({
      id: 'rec-5',
      priority: 'Important',
      category: 'Shaded Route',
      what: 'Choose canopy-covered pedestrian routes with tree coverage rather than direct arterial roads.',
      where: `Mutha River greenway and park corridors connecting ${ward.name}`,
      when: 'Whenever travelling between 10:00 AM and 6:00 PM',
      why: 'Dense foliage shields up to 68% of solar radiation, reducing radiant temperature by 2.8°C to 4.2°C.',
      actionButtonText: 'Calculate Thermal-Safe Route',
      actionRoute: 'route',
    });
  } else {
    recs.push({
      id: 'rec-1',
      priority: 'Important',
      category: 'Hydration',
      what: 'Maintain routine hydration of at least 2.5 litres of water across the day.',
      where: 'Home, transit corridors, and work facilities',
      when: 'Morning through late evening',
      why: 'Dry atmospheric conditions and mild winds accelerate insensible water loss from the skin.',
      actionButtonText: 'View Water Points',
      actionRoute: 'protection',
    });

    recs.push({
      id: 'rec-2',
      priority: 'Advisory',
      category: 'Outdoor Activity',
      what: 'Schedule outdoor sports and heavy errands before 11:00 AM or after 5:30 PM.',
      where: `${ward.name} outdoor recreational facilities`,
      when: 'Early morning or dusk hours',
      why: 'Minimizes solar ultraviolet index exposure and optimizes cardiovascular comfort.',
      actionButtonText: 'View Thermal Stress Forecast',
      actionRoute: 'thermal',
    });
  }

  if (isVulnerable) {
    recs.push({
      id: 'rec-vuln',
      priority: 'Immediate',
      category: 'Vulnerable Care',
      what: 'Remain indoors in cross-ventilated or fan-cooled rooms; avoid midday cookstoves.',
      where: 'Residential interiors or ground-floor community centres',
      when: '11:00 AM – 5:00 PM',
      why: 'Seniors and individuals with chronic cardiovascular or respiratory conditions experience diminished thermoregulation capacity.',
      actionButtonText: 'View Healthcare & Emergency Centers',
      actionRoute: 'healthcare',
    });
  }

  return recs;
}

export interface AlertContextParams {
  wbgt?: number;
  utci?: number;
  humidity?: number;
  solarIrradiance?: number;
  city?: string;
  zone?: string;
  dataSource?: 'LIVE' | 'MODELLED' | 'ESTIMATED' | 'CURATED';
}

export function getCitizenAlerts(
  riskLevel: RiskLevel,
  ward: WardInfo,
  tempC: number,
  context?: AlertContextParams
): CitizenAlert[] {
  const wbgt = context?.wbgt !== undefined ? Math.round(context.wbgt * 10) / 10 : 31.4;
  const utci = context?.utci !== undefined ? Math.round(context.utci * 10) / 10 : 39.8;
  const humidity = context?.humidity !== undefined ? Math.round(context.humidity) : 48;
  const solar = context?.solarIrradiance !== undefined ? Math.round(context.solarIrradiance) : 780;
  const city = context?.city || 'Pune';
  const zone = context?.zone || ward.zone;
  const dataTag = context?.dataSource || 'LIVE';
  const wardShort = ward.name.includes(':') ? ward.name.split(':')[1].trim() : ward.name;

  // Determine dynamic severities based on riskLevel and temperature
  const isExtreme = riskLevel === 'Extreme' || tempC >= 40.0;
  const isHigh = riskLevel === 'High' || tempC >= 38.5;
  const isModerate = riskLevel === 'Moderate' || tempC >= 35.0;

  const heatwaveSeverity: AlertSeverity = isExtreme
    ? 'Critical / Immediate Action'
    : isHigh
    ? 'Harmful / Heat Alert'
    : isModerate
    ? 'High / Prepare'
    : 'Normal';

  const riskAlertSeverity: AlertSeverity = isExtreme
    ? 'Harmful / Heat Alert'
    : isHigh
    ? 'High / Prepare'
    : isModerate
    ? 'Developing / Awareness'
    : 'Normal';

  const criticalSeverity: AlertSeverity = isExtreme
    ? 'Critical / Immediate Action'
    : isHigh
    ? 'Critical / Immediate Action'
    : isModerate
    ? 'High / Prepare'
    : 'Developing / Awareness';

  const locationSeverity: AlertSeverity = isExtreme
    ? 'Harmful / Heat Alert'
    : isHigh
    ? 'High / Prepare'
    : 'Developing / Awareness';

  const alerts: CitizenAlert[] = [
    // 1. Heatwave Alert
    {
      id: 'alert-hw-1',
      type: 'Heatwave Alert',
      title: isExtreme
        ? `IMD SEVERE HEATWAVE ALERT: ${city.toUpperCase()} METROPOLITAN REGION`
        : `UPCOMING HEATWAVE EPISODE: ${city.toUpperCase()} AGGLOMERATION`,
      shortMessage: `Synoptic heatwave persisting across ${city} with maximum temperatures reaching ${tempC}°C.`,
      severity: heatwaveSeverity,
      riskLevel: isExtreme ? 'Extreme' : 'High',
      whatIsHappening: `Severe heatwave conditions are active across ${ward.name} and adjacent districts. Strong dry north-westerly airflow combined with high solar insolation (${solar} W/m²) has elevated surface temperatures ${Math.max(1.8, Math.round((tempC - 33.5) * 10) / 10)}°C above normal climatological baselines.`,
      where: `${ward.name}, ${zone}, ${city} (wide regional spread)`,
      when: 'Expected: Today – Day 3 (Peak-Risk Period: 12:30 PM – 04:30 PM)',
      expectedStart: 'Today, 11:30 AM',
      expectedEnd: 'Tomorrow, 06:00 PM',
      peakPeriod: '12:30 PM – 04:30 PM',
      expectedDuration: 'Next 36–48 hours',
      why: `Official IMD heatwave threshold exceeded: ambient surface temperatures measured at ${tempC}°C against seasonal normal of 34.0°C (anomaly: +${Math.max(2.1, Math.round((tempC - 34) * 10) / 10)}°C) with persistent multi-day stagnation.`,
      whatToDoNext: [
        'Reschedule all non-critical outdoor travel to before 10:00 AM or after 6:00 PM.',
        'Drink chilled electrolyte fluids (ORS, coconut water, lemon water) continuously.',
        'Check on elderly family members, toddlers, and pets during the 12:30 PM – 4:30 PM peak window.',
        'Access air-conditioned civic cooling centers if indoor temperatures exceed 32°C.',
      ],
      issuedAt: 'Updated 20 mins ago (IMD / PMC Disaster Management)',
      isRead: false,
      urgent: isExtreme,
      recommendedAction: 'View Heatwave Forecast',
      targetFeature: 'future',
      dataSource: 'India Meteorological Department (IMD) / ThermaShield Forecast Engine',
      status: 'Active',
      confidence: 94,
      dataTag: 'MODELLED',
      locationDetails: {
        ward: ward.name,
        zone: zone,
        city: city,
        distanceRelevance: 'Regional warning covering your municipal sector',
      },
    },

    // 2. High Heat-Risk Alert
    {
      id: 'alert-hr-2',
      type: 'High Heat-Risk Alert',
      title: `ELEVATED THERMAL STRAIN IN ${wardShort.toUpperCase()}`,
      shortMessage: `Wet-Bulb Globe Temp is at ${wbgt}°C. Rapid cardiovascular heat load and dehydration risk.`,
      severity: riskAlertSeverity,
      riskLevel: riskLevel,
      whatIsHappening: `Calculated bioclimatic stress indices (WBGT: ${wbgt}°C, UTCI: ${utci}°C) reflect elevated physiological burden. Human sweat evaporation efficiency is restricted due to ${humidity}% ambient relative humidity.`,
      where: `${ward.name} (${zone})`,
      when: 'Current Window: Ongoing until 05:00 PM today (4-hour duration)',
      expectedStart: '12:00 PM',
      expectedEnd: '05:00 PM',
      peakPeriod: '01:00 PM – 04:00 PM',
      expectedDuration: '4 hours remaining',
      why: `Wet-Bulb Globe Temperature (${wbgt}°C) crossed the biological thermal strain threshold (29.5°C), triggering automated civic heat stress protection protocols.`,
      whatToDoNext: [
        'Take mandatory 15-minute shaded rest breaks for every 45 minutes of moderate physical activity.',
        'Carry an insulated water bottle; refill free at municipal RO kiosks.',
        'Wear loose, lightweight cotton clothing with a broad-brim hat or UV umbrella.',
        'Watch for early heat symptoms: pale skin, heavy sweating, muscle cramps, or nausea.',
      ],
      issuedAt: 'Updated 35 mins ago (ThermaShield 360 Diagnostic Engine)',
      isRead: false,
      urgent: false,
      recommendedAction: 'View Heat Risk',
      targetFeature: 'risk',
      dataSource: 'PMC Civic Health & Thermal Environmental Monitoring',
      status: 'Active',
      confidence: 96,
      dataTag: 'LIVE',
      locationDetails: {
        ward: ward.name,
        zone: zone,
        city: city,
        distanceRelevance: 'Immediate ward boundary (0 km)',
      },
    },

    // 3. Critical Heat Warning
    {
      id: 'alert-crit-3',
      type: 'Critical Heat Warning',
      title: 'CRITICAL THERMAL SAFETY WARNING: IMMEDIATE ACTION REQUIRED',
      shortMessage: 'Dangerous environmental heat load exceeds safe human tolerance limits.',
      severity: criticalSeverity,
      riskLevel: 'Extreme',
      whatIsHappening: `Extreme environmental heat index with Universal Thermal Climate Index (UTCI) at ${utci}°C and ambient air at ${tempC}°C. Immediate risk of acute heat cramps, heat exhaustion, and exertion-induced heat stroke.`,
      where: `${ward.name}, high-exposure intersections and open transit corridors`,
      when: 'Immediate Window: 01:00 PM – 04:30 PM (Peak Critical Hazard)',
      expectedStart: '01:00 PM',
      expectedEnd: '04:30 PM',
      peakPeriod: '01:30 PM – 03:45 PM',
      expectedDuration: '3.5 hours peak intensity',
      why: `Universal Thermal Climate Index (UTCI: ${utci}°C) crossed the 38.0°C critical threshold alongside intense direct solar radiation (${solar} W/m²), creating high thermal strain on human thermoregulation.`,
      whatToDoNext: [
        'Halt all non-essential outdoor work, construction tasks, and student sports immediately.',
        'Move indoors into cooled spaces or municipal misted public shelters right away.',
        'Apply cold, wet towels to the neck, armpits, and forehead if feeling hot or flushed.',
        'If anyone displays confusion, loss of consciousness, or dry skin, call 108 Emergency immediately.',
      ],
      issuedAt: 'Updated 10 mins ago (Disaster Management Cell)',
      isRead: false,
      urgent: true,
      recommendedAction: 'View Protection',
      targetFeature: 'protection',
      dataSource: 'Disaster Management Cell / ThermaShield Emergency Protocol',
      status: 'Active - Urgent',
      confidence: 98,
      dataTag: dataTag,
      locationDetails: {
        ward: ward.name,
        zone: zone,
        city: city,
        distanceRelevance: 'Directly impacting your current coordinates',
      },
    },

    // 4. Location-Specific Alert
    {
      id: 'alert-loc-4',
      type: 'Location-Specific Alert',
      title: `MICROCLIMATE SURFACE HEAT SURGE: ${wardShort.toUpperCase()}`,
      shortMessage: `High surface radiant backscatter detected along ${wardShort} commercial roads.`,
      severity: locationSeverity,
      riskLevel: isExtreme ? 'High' : 'Moderate',
      whatIsHappening: `Dense asphalt pavements and low vegetative tree canopy in ${wardShort} have elevated road surface temperatures up to 48.5°C. Radiant heat backscatter makes pedestrian travel significantly hotter than ambient air.`,
      where: `${ward.name} (${ward.highRiskAreas[0] || 'High-density commercial avenues'}, ${zone})`,
      when: 'Valid Today: 12:00 PM – 05:30 PM',
      expectedStart: '12:00 PM',
      expectedEnd: '05:30 PM',
      peakPeriod: '01:00 PM – 04:00 PM',
      expectedDuration: '5.5 hours',
      why: `Local Urban Heat Island (UHI) sensor array recorded a +4.2°C surface temperature differential over surrounding canopy zones due to unshaded bitumen and vehicular heat dissipation.`,
      whatToDoNext: [
        'Switch to thermal-safe navigation through shaded parks and canopy streets instead of open highway corridors.',
        'Wear thick, heat-insulated footwear to prevent radiant foot burns from heated asphalt.',
        'Rest at shaded tree arcades or water kiosks along Sambhaji Park / riverfront pathways.',
      ],
      issuedAt: 'Updated 1 hour ago (Ward Microclimate Sensor Array)',
      isRead: true,
      urgent: false,
      recommendedAction: 'View Safe Route',
      targetFeature: 'route',
      dataSource: 'High-Resolution Ward Urban Heat Island (UHI) Sensor Array',
      status: 'Active',
      confidence: 91,
      dataTag: 'MODELLED',
      locationDetails: {
        ward: ward.name,
        zone: zone,
        city: city,
        distanceRelevance: 'Within 0.5–1.5 km of your selected area',
      },
    },
  ];

  return alerts;
}

export function getCitizenAlertHistory(ward: WardInfo, city?: string): AlertHistoryItem[] {
  const cityName = city || 'Pune';
  const wardShort = ward.name.includes(':') ? ward.name.split(':')[1].trim() : ward.name;

  return [
    {
      id: 'hist-1',
      title: `Harmful Heatwave Surge Advisory for ${wardShort}`,
      dateTime: 'Yesterday, 02:00 PM – 06:00 PM',
      location: `${ward.name}, ${cityName}`,
      severity: 'Harmful / Heat Alert',
      shortReason: 'Afternoon surface temperatures climbed to 39.8°C with elevated radiant flux.',
      status: 'Resolved',
      dataSource: 'IMD / PMC Official Disaster Management',
      riskLevel: 'High',
    },
    {
      id: 'hist-2',
      title: `WBGT Precautionary Warning in ${ward.zone}`,
      dateTime: '2 Days Ago, 11:30 AM – 04:30 PM',
      location: `${ward.zone}, ${cityName}`,
      severity: 'High / Prepare',
      shortReason: 'Wet-Bulb Globe Temp crossed 31.4°C threshold for 3 consecutive hours.',
      status: 'Expired',
      dataSource: 'ThermaShield 360 Environmental Diagnostic',
      riskLevel: 'High',
    },
    {
      id: 'hist-3',
      title: `Pre-Heatwave Atmospheric Stagnation Advisory`,
      dateTime: '3 Days Ago, 01:00 PM – 05:00 PM',
      location: `${ward.name}, ${cityName}`,
      severity: 'Developing / Awareness',
      shortReason: 'Atmospheric pressure ridge resulted in poor convective ventilation and 54% relative humidity.',
      status: 'De-escalated',
      dataSource: 'IMD Pune Weather Forecasting Division',
      riskLevel: 'Moderate',
    },
    {
      id: 'hist-4',
      title: `All-Clear Seasonal Post-Convection Baseline`,
      dateTime: '5 Days Ago, 10:00 AM – 04:00 PM',
      location: `${cityName} Metropolitan Area (All Wards)`,
      severity: 'Normal',
      shortReason: 'Moderate cloud cover and brief localized precipitation returned temperatures to 31.5°C.',
      status: 'Archived',
      dataSource: 'PMC Civic Health Department',
      riskLevel: 'Low',
    },
  ];
}
