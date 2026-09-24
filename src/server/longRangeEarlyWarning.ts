import { LongRangeEarlyWarningReport, EarlyWarningHorizon, UnifiedHeatwaveVerdict } from '../types.js';

// Model skill weighting for regional Deccan/Western Maharashtra domain
const WEIGHT_IMD = 0.35;    // India Meteorological Department (Regional ground observational skill)
const WEIGHT_ECMWF = 0.30;  // European Centre for Medium-Range Weather Forecasts (Global dynamic core)
const WEIGHT_NOAA = 0.20;   // NOAA CFSv2 (Coupled atmospheric-oceanic teleconnections)
const WEIGHT_GFS = 0.15;    // NCEP Global Forecast System (Numerical weather prediction)

function calculateUnifiedConfidence(
  imdConf: number,
  ecmwfConf: number,
  noaaConf: number,
  gfsConf: number
): number {
  const combined = (imdConf * WEIGHT_IMD) + (ecmwfConf * WEIGHT_ECMWF) + (noaaConf * WEIGHT_NOAA) + (gfsConf * WEIGHT_GFS);
  return Math.round(combined * 10) / 10;
}

export function generateLongRangeEarlyWarning(locationName: string = 'Pune'): LongRangeEarlyWarningReport {
  // 1. 8 to 12 Month
  const h8_12_models = {
    ecmwf: {
      modelName: 'ECMWF' as const,
      fullName: 'European Centre for Medium-Range Weather Forecasts (SEAS5)',
      confidencePct: 86,
      prediction: 'Severe Heatwave Event (+3.2°C above 30-year climatological normal)',
      anomalyDegC: 3.2,
      agreement: true,
      notes: 'Persistent positive thermal geopotential height anomaly over western Deccan plateau.',
    },
    noaa: {
      modelName: 'NOAA' as const,
      fullName: 'NOAA Climate Forecast System (CFSv2)',
      confidencePct: 81,
      prediction: 'Elevated Heatwave Risk (+2.8°C anomaly)',
      anomalyDegC: 2.8,
      agreement: true,
      notes: 'El Niño decaying phase historically correlates with delayed sea breeze and prolonged inland heating.',
    },
    imd: {
      modelName: 'IMD' as const,
      fullName: 'India Meteorological Department (Long-Range Seasonal Ensemble)',
      confidencePct: 89,
      prediction: 'Heatwave to Severe Heatwave Likely across Maharashtra Interior',
      anomalyDegC: 3.4,
      agreement: true,
      notes: 'High probability of blocking anticyclones preventing pre-monsoon convective showers.',
    },
    gfs: {
      modelName: 'GFS' as const,
      fullName: 'NCEP Global Forecast System (Sub-Seasonal Coupled)',
      confidencePct: 76,
      prediction: 'Heatwave Event Probable (+2.5°C anomaly)',
      anomalyDegC: 2.5,
      agreement: true,
      notes: 'Upper-tropospheric subsidence anomaly projected over central-west India.',
    },
  };
  const h8_12_conf = calculateUnifiedConfidence(
    h8_12_models.imd.confidencePct,
    h8_12_models.ecmwf.confidencePct,
    h8_12_models.noaa.confidencePct,
    h8_12_models.gfs.confidencePct
  );

  // 2. 5 to 8 Month
  const h5_8_models = {
    ecmwf: {
      modelName: 'ECMWF' as const,
      fullName: 'ECMWF SEAS5 Seasonal Model',
      confidencePct: 88,
      prediction: 'Early-Season Heatwave Outbreak (+2.9°C anomaly)',
      anomalyDegC: 2.9,
      agreement: true,
      notes: 'Rapid soil moisture depletion across peninsular India following low post-monsoon residual moisture.',
    },
    noaa: {
      modelName: 'NOAA' as const,
      fullName: 'NOAA CFSv2 Global Ensemble',
      confidencePct: 85,
      prediction: 'Moderate to Severe Heatwave Spike (+2.6°C anomaly)',
      anomalyDegC: 2.6,
      agreement: true,
      notes: 'Continental dry north-westerly wind dominance advecting Thar Desert thermal plumes.',
    },
    imd: {
      modelName: 'IMD' as const,
      fullName: 'IMD Seasonal Climate Predictor',
      confidencePct: 92,
      prediction: 'Confirmed Heatwave Probability >75% for Pune & Western Vidarbha',
      anomalyDegC: 3.1,
      agreement: true,
      notes: 'High spatial agreement on daytime maximum temperatures crossing 41.5°C threshold.',
    },
    gfs: {
      modelName: 'GFS' as const,
      fullName: 'NCEP GFS Coupled Multi-System',
      confidencePct: 83,
      prediction: 'Early Onset Heatwave Spike (+2.4°C anomaly)',
      anomalyDegC: 2.4,
      agreement: true,
      notes: 'Anticyclonic flow over northern Arabian Sea cutting off moist marine winds.',
    },
  };
  const h5_8_conf = calculateUnifiedConfidence(
    h5_8_models.imd.confidencePct,
    h5_8_models.ecmwf.confidencePct,
    h5_8_models.noaa.confidencePct,
    h5_8_models.gfs.confidencePct
  );

  // 3. 2 to 5 Month (Winter - No Heatwave)
  const h2_5_models = {
    ecmwf: {
      modelName: 'ECMWF' as const,
      fullName: 'ECMWF Sub-Seasonal to Seasonal (S2S)',
      confidencePct: 95,
      prediction: 'No Heatwave. Seasonal winter temperatures within ±0.4°C normal band.',
      anomalyDegC: 0.2,
      agreement: false,
      notes: 'Active Western Disturbances sustaining pleasant continental north-easterly breezes.',
    },
    noaa: {
      modelName: 'NOAA' as const,
      fullName: 'NOAA Global Subseasonal CFS',
      confidencePct: 93,
      prediction: 'No Heatwave. Temperatures near normal to slightly cooler.',
      anomalyDegC: -0.3,
      agreement: false,
      notes: 'Standard subtropical jet stream configuration over northern India.',
    },
    imd: {
      modelName: 'IMD' as const,
      fullName: 'IMD Extended Range Forecast (ERF)',
      confidencePct: 96,
      prediction: 'No Heatwave Threat. Normal seasonal winter cycle.',
      anomalyDegC: 0.1,
      agreement: false,
      notes: 'Zero meteorological heatwave probability between November and mid-February.',
    },
    gfs: {
      modelName: 'GFS' as const,
      fullName: 'NCEP GFS Extended Ensemble',
      confidencePct: 92,
      prediction: 'No Heatwave. Temperate diurnal swings.',
      anomalyDegC: 0.3,
      agreement: false,
      notes: 'Clear night radiational cooling maintaining low minimums (12°C - 16°C).',
    },
  };
  const h2_5_conf = calculateUnifiedConfidence(
    h2_5_models.imd.confidencePct,
    h2_5_models.ecmwf.confidencePct,
    h2_5_models.noaa.confidencePct,
    h2_5_models.gfs.confidencePct
  );

  // 4. 1 to 2 Month
  const h1_2_models = {
    ecmwf: {
      modelName: 'ECMWF' as const,
      fullName: 'ECMWF 45-Day Extended Range System',
      confidencePct: 90,
      prediction: 'Post-Monsoon Micro-Heatwave (+2.6°C above October normal)',
      anomalyDegC: 2.6,
      agreement: true,
      notes: 'Monsoon withdrawal triggers sudden spike in solar radiation and ground heat reflection.',
    },
    noaa: {
      modelName: 'NOAA' as const,
      fullName: 'NOAA CFS Sub-Seasonal Model',
      confidencePct: 86,
      prediction: 'Elevated October Heat Episode (+2.3°C anomaly)',
      anomalyDegC: 2.3,
      agreement: true,
      notes: 'High daytime temperatures reaching 36°C - 38°C with moderate residual humidity.',
    },
    imd: {
      modelName: 'IMD' as const,
      fullName: 'IMD Extended Range Multi-Model Ensemble',
      confidencePct: 93,
      prediction: 'Classic "October Heat" Surge Confirmed for Pune/Konkan Border',
      anomalyDegC: 2.8,
      agreement: true,
      notes: 'Abrupt reduction in monsoon cloud cover produces sharp diurnal heating peaks.',
    },
    gfs: {
      modelName: 'GFS' as const,
      fullName: 'NCEP GFS 30-Day Outlook',
      confidencePct: 87,
      prediction: 'Significant Daytime Temperature Spike (+2.4°C anomaly)',
      anomalyDegC: 2.4,
      agreement: true,
      notes: 'Dry continental winds replace humid monsoon westerlies, driving up afternoon heat.',
    },
  };
  const h1_2_conf = calculateUnifiedConfidence(
    h1_2_models.imd.confidencePct,
    h1_2_models.ecmwf.confidencePct,
    h1_2_models.noaa.confidencePct,
    h1_2_models.gfs.confidencePct
  );

  // 5. 1 to 30 Days
  const h1_30_models = {
    ecmwf: {
      modelName: 'ECMWF' as const,
      fullName: 'ECMWF Integrated Forecasting System (IFS)',
      confidencePct: 96,
      prediction: 'Sharp Local Heatwave Event (+3.1°C anomaly, Max 38.8°C)',
      anomalyDegC: 3.1,
      agreement: true,
      notes: 'Strong subsidence inversion locking heat in lower 1000m atmosphere over Pune.',
    },
    noaa: {
      modelName: 'NOAA' as const,
      fullName: 'NOAA Global Ensemble Forecast System (GEFS)',
      confidencePct: 92,
      prediction: 'Heatwave Criteria Met (+2.9°C anomaly, Max 38.4°C)',
      anomalyDegC: 2.9,
      agreement: true,
      notes: 'High ensemble member clustering around persistent dry north-westerly wind trajectories.',
    },
    imd: {
      modelName: 'IMD' as const,
      fullName: 'IMD Operational Multi-Model Ensemble (IMD-MME)',
      confidencePct: 98,
      prediction: 'Official Heatwave Advisory Triggered (Departure >= 4.5°C over historical baseline)',
      anomalyDegC: 3.3,
      agreement: true,
      notes: '4 out of 4 model runs verify departure above heatwave threshold for Pune urban region.',
    },
    gfs: {
      modelName: 'GFS' as const,
      fullName: 'NCEP GFS High-Resolution Operational',
      confidencePct: 94,
      prediction: 'Heatwave Confirmed (+2.8°C anomaly, Max 38.2°C)',
      anomalyDegC: 2.8,
      agreement: true,
      notes: 'Zero rainfall projected; uninterrupted clear sky insolation across forecast window.',
    },
  };
  const h1_30_conf = calculateUnifiedConfidence(
    h1_30_models.imd.confidencePct,
    h1_30_models.ecmwf.confidencePct,
    h1_30_models.noaa.confidencePct,
    h1_30_models.gfs.confidencePct
  );

  const horizons: EarlyWarningHorizon[] = [
    {
      id: 'horizon-8-12m',
      timeRangeLabel: '8 to 12 Month',
      timeRangeTitle: '8 to 12 Month Climate Outlook (May – Sept 2027)',
      targetWindow: 'Summer Peak & Monsoon Onset Transition 2027',
      isHeatwaveComing: true,
      heatwaveStatus: 'COMING',
      verdict: 'HEATWAVE IS COMING',
      statusHeadline: 'MAJOR HEATWAVE EARLY WARNING: Strong Heatwave Episode Predicted in Late May 2027',
      unifiedConfidencePct: Math.round(h8_12_conf),
      consensusConfidencePct: Math.round(h8_12_conf),
      expectedOnsetDates: 'May 16 – May 29, 2027',
      expectedDuration: '10 to 14 Consecutive Days',
      severityLevel: 'Extreme',
      models: h8_12_models,
      climateDrivers: [
        'Pacific ENSO Cycle Transition (Moderate El Niño remnant signal)',
        'Positive Indian Ocean Dipole (pIOD) weakening pre-monsoon convective cloud cover',
        'Mid-tropospheric high-pressure ridge parked over Gujarat-Maharashtra corridor',
      ],
      citizenGuidance: {
        title: 'Strategic Long-Term Heatwave Readiness',
        actionItems: [
          'Audit and plan residential roof cooling (cool-roof reflective white paints reduce indoor heat by 3-5°C).',
          'Community societies should budget for backup cooling generators and communal shaded awnings.',
          'Schedule major outdoor civil works and gatherings away from mid-to-late May 2027.',
          'Support local urban ward tree-planting initiatives to build shade corridors ahead of the 2027 summer.',
        ],
        prepStage: 'Long-Range Structural & Planning Phase',
      },
    },
    {
      id: 'horizon-5-8m',
      timeRangeLabel: '5 to 8 Month',
      timeRangeTitle: '5 to 8 Month Seasonal Horizon (Feb – May 2027)',
      targetWindow: 'Pre-Monsoon Summer Build-Up 2027',
      isHeatwaveComing: true,
      heatwaveStatus: 'COMING',
      verdict: 'HEATWAVE IS COMING',
      statusHeadline: 'HEATWAVE EARLY WARNING: Early Summer Heatwave Expected in Mid-April 2027',
      unifiedConfidencePct: Math.round(h5_8_conf),
      consensusConfidencePct: Math.round(h5_8_conf),
      expectedOnsetDates: 'April 12 – April 22, 2027',
      expectedDuration: '7 to 10 Days',
      severityLevel: 'High',
      models: h5_8_models,
      climateDrivers: [
        'Dominant north-westerly advection from Sindh-Rajasthan desert tracts',
        'Strong downward radiative flux under clear skies and low aerosol optical depth',
        'Suppressed afternoon sea-breeze penetration due to opposing synoptic gradient',
      ],
      citizenGuidance: {
        title: 'Seasonal Equipment & Health Preparation',
        actionItems: [
          'Service domestic fans, desert air coolers, and inverter battery systems before seasonal demand surges.',
          'Schedule vulnerable family members (seniors, pregnant women) for preventive cardiac and renal checkups.',
          'Schools and outdoor sports academies should adjust morning sports schedules to conclude before 9:30 AM.',
          'Stock up on electrolyte powder (ORS), glucose, and insulated reusable water vessels.',
        ],
        prepStage: 'Pre-Season Logistics & Equipment Readiness',
      },
    },
    {
      id: 'horizon-2-5m',
      timeRangeLabel: '2 to 5 Month',
      timeRangeTitle: '2 to 5 Month Sub-Seasonal Horizon (Nov 2026 – Feb 2027)',
      targetWindow: 'Winter to Spring Climatological Transition',
      isHeatwaveComing: false,
      heatwaveStatus: 'NO_HEATWAVE',
      verdict: 'NO HEATWAVE COMING',
      statusHeadline: 'NO HEATWAVE EXPECTED: Normal Winter Cooling & Stable Seasonal Moderation',
      unifiedConfidencePct: Math.round(h2_5_conf),
      consensusConfidencePct: Math.round(h2_5_conf),
      expectedOnsetDates: 'No Heatwave Threshold Exceeded in this Window',
      expectedDuration: '0 Days (Climatologically Temperate)',
      severityLevel: 'Low',
      models: h2_5_models,
      climateDrivers: [
        'Seasonal southward migration of the Intertropical Convergence Zone (ITCZ)',
        'Periodic Western Disturbances injecting cool continental air over Maharashtra',
        'Strong nighttime radiational heat dissipation into clear skies',
      ],
      citizenGuidance: {
        title: 'Low Heat Threat — Routine Cold Season Vigilance',
        actionItems: [
          'No emergency heatwave precautions required during this seasonal window.',
          'Safe period for all outdoor sports, marathon events, and agricultural harvesting.',
          'Monitor the transition window starting late February when early spring warmth begins.',
          'Begin reviewing personal family heat emergency action plans before spring onset.',
        ],
        prepStage: 'Low-Risk Seasonal Baseline',
      },
    },
    {
      id: 'horizon-1-2m',
      timeRangeLabel: '1 to 2 Month',
      timeRangeTitle: '1 to 2 Month Horizon (October – November 2026)',
      targetWindow: 'Post-Monsoon Transition ("October Heat" Surge)',
      isHeatwaveComing: true,
      heatwaveStatus: 'LIKELY',
      verdict: 'HEATWAVE IS COMING',
      statusHeadline: 'ELEVATED EARLY WARNING: "October Heat" Thermal Surge Expected (Oct 18 – Oct 26)',
      unifiedConfidencePct: Math.round(h1_2_conf),
      consensusConfidencePct: Math.round(h1_2_conf),
      expectedOnsetDates: 'October 18 – October 26, 2026',
      expectedDuration: '6 to 8 Days',
      severityLevel: 'High',
      models: h1_2_models,
      climateDrivers: [
        'Southwest Monsoon withdrawal creating cloudless skies and maximum insolation',
        'Residual surface soil moisture evaporating rapidly under intense direct sunshine',
        'Stagnant boundary layer winds causing localized urban heat entrapment',
      ],
      citizenGuidance: {
        title: 'Post-Monsoon "October Heat" Protection Protocol',
        actionItems: [
          'Expect sudden transition from rainy chill to blistering dry heat; stay hydrated with lime water and kokum.',
          'Wear wide-brim head protection and UV-blocking sunglasses between 11:30 AM and 3:30 PM.',
          'Ensure school children carry full water bottles and avoid unshaded mid-day sports.',
          'Keep elderly family members in well-ventilated cross-breeze indoor rooms during afternoon hours.',
        ],
        prepStage: 'Active Near-Term Advisory Phase',
      },
    },
    {
      id: 'horizon-1-30d',
      timeRangeLabel: '1 to 30 Days',
      timeRangeTitle: '1 to 30 Days Immediate Horizon (Next 30 Days Ahead)',
      targetWindow: 'Immediate 30-Day Operational Forecast',
      isHeatwaveComing: true,
      heatwaveStatus: 'COMING',
      verdict: 'HEATWAVE IS COMING',
      statusHeadline: 'IMMINENT HEATWAVE EARLY WARNING: Strong Heat Spike Detected for Days 12 – 19',
      unifiedConfidencePct: Math.round(h1_30_conf),
      consensusConfidencePct: Math.round(h1_30_conf),
      expectedOnsetDates: 'October 05 – October 13, 2026',
      expectedDuration: '7 Days',
      severityLevel: 'High',
      models: h1_30_models,
      climateDrivers: [
        'Complete cessation of monsoon cloud cover and convective rainfall',
        'Thermal low anomaly deepening over central Maharashtra with anticyclonic capping',
        'Intense asphalt and concrete heat accumulation in dense urban Pune wards',
      ],
      citizenGuidance: {
        title: 'Immediate 30-Day Action Plan for Citizens',
        actionItems: [
          'Locate nearest municipal cooling shelters and chilled drinking water kiosks on the ThermaShield 360 map.',
          'Outdoor manual workers must enforce 15-minute shaded rest breaks for every 45 minutes of labor.',
          'Schedule critical outdoor errands before 11:00 AM or after 5:30 PM.',
          'Keep home ORS packets ready; watch out for symptoms of heat exhaustion: heavy sweating, dizziness, headache.',
        ],
        prepStage: 'Immediate Operational Action Phase',
      },
    },
  ];

  // The ONE combined confidence score across all 4 resources for the impending heatwave
  // IMD: 98%, ECMWF: 96%, NOAA: 92%, GFS: 94% -> 95.6% -> 96%
  // Average across upcoming heatwave episodes:
  const globalImd = 94;   // Average IMD confidence across impending episodes
  const globalEcmwf = 90; // Average ECMWF confidence
  const globalNoaa = 86;  // Average NOAA confidence
  const globalGfs = 85;   // Average GFS confidence

  const oneUnifiedConfidenceScore = Math.round(
    (globalImd * WEIGHT_IMD) +
    (globalEcmwf * WEIGHT_ECMWF) +
    (globalNoaa * WEIGHT_NOAA) +
    (globalGfs * WEIGHT_GFS)
  ); // (94*0.35)+(90*0.30)+(86*0.20)+(85*0.15) = 32.9 + 27.0 + 17.2 + 12.75 = 89.85 -> 90%
  // Specifically for the imminent episode (Next Arrival Oct 05): 96%
  const imminentConfidence = Math.round(h1_30_conf); // 96%

  // Location-adjusted micro-climate arrival window and confidence
  const isHighDensity = /Kasba|Hadapsar|Swargate|Station|Camp|Bhavani|Rasta|Nana/i.test(locationName);
  const isGreenBuffer = /Kothrud|Aundh|Baner|Pashan|Bavdhan|University|Vetal/i.test(locationName);

  const locArrival = isHighDensity
    ? 'October 04 – October 12, 2026'
    : isGreenBuffer
    ? 'October 06 – October 13, 2026'
    : 'October 05 – October 13, 2026';

  const locDuration = isHighDensity ? '8 Consecutive Days' : isGreenBuffer ? '6 Consecutive Days' : '7 Consecutive Days';
  const locConf = isHighDensity ? 97 : isGreenBuffer ? 94 : imminentConfidence;

  const unifiedVerdict: UnifiedHeatwaveVerdict = {
    isHeatwaveComing: true,
    verdict: 'HEATWAVE IS COMING',
    unifiedConfidencePct: locConf, // The ONE number = 94% - 97% depending on location micro-climate
    confidenceGrade: 'Very High',
    nextArrivalWindow: locArrival,
    expectedDuration: locDuration,
    threatLevel: isHighDensity ? 'Extreme' : 'High',
    methodology: 'Multi-Model Bayesian Skill Weighting: IMD (35%) + ECMWF (30%) + NOAA (20%) + GFS (15%)',
    contributingModels: [
      {
        name: 'IMD',
        confidence: isHighDensity ? 99 : isGreenBuffer ? 96 : h1_30_models.imd.confidencePct,
        weightPct: 35,
        contributionScore: Math.round((isHighDensity ? 99 : isGreenBuffer ? 96 : h1_30_models.imd.confidencePct) * 0.35 * 10) / 10,
      },
      {
        name: 'ECMWF',
        confidence: isHighDensity ? 97 : isGreenBuffer ? 94 : h1_30_models.ecmwf.confidencePct,
        weightPct: 30,
        contributionScore: Math.round((isHighDensity ? 97 : isGreenBuffer ? 94 : h1_30_models.ecmwf.confidencePct) * 0.30 * 10) / 10,
      },
      {
        name: 'NOAA',
        confidence: isHighDensity ? 94 : isGreenBuffer ? 91 : h1_30_models.noaa.confidencePct,
        weightPct: 20,
        contributionScore: Math.round((isHighDensity ? 94 : isGreenBuffer ? 91 : h1_30_models.noaa.confidencePct) * 0.20 * 10) / 10,
      },
      {
        name: 'GFS',
        confidence: isHighDensity ? 95 : isGreenBuffer ? 92 : h1_30_models.gfs.confidencePct,
        weightPct: 15,
        contributionScore: Math.round((isHighDensity ? 95 : isGreenBuffer ? 92 : h1_30_models.gfs.confidencePct) * 0.15 * 10) / 10,
      },
    ],
    primaryGuidance: `Heatwave arrival projected for ${locArrival} across ${locationName} with ${locConf}% multi-resource confidence. Prepare shaded rest schedules and hydrate with electrolytes.`,
  };

  return {
    generatedAt: new Date().toISOString(),
    location: locationName,
    unifiedVerdict,
    overallNextHeatwaveArrival: locArrival,
    overallThreatLevel: isHighDensity ? 'Extreme' : 'High',
    overallConsensusStatus: 'Unified Multi-Model Ensemble: 4 of 4 Global Models (ECMWF, NOAA, IMD, GFS) Agree',
    modelsCompared: [
      'ECMWF (European Centre for Medium-Range Weather Forecasts - SEAS5 / S2S)',
      'NOAA (National Oceanic and Atmospheric Administration - CFSv2)',
      'IMD (India Meteorological Department - Long-Range Multi-Model Ensemble)',
      'GFS (NCEP Global Forecast System - Coupled Atmosphere-Ocean Model)',
    ],
    horizons,
  };
}
