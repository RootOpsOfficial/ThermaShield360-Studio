import { RiskLevel, WardInfo } from './types.js';
import { calculateWBGT, calculateUTCI, calculateHeatIndex, categorizeThermalStress } from './thermalEngine.js';

export type ActivityType =
  | 'Office / Desk Work'
  | 'College / Student'
  | 'Outdoor Construction'
  | 'Street Vendor'
  | 'Delivery / Rider'
  | 'Traffic / Police Duty'
  | 'Municipal Field Work'
  | 'Agriculture'
  | 'Walking / Commuting'
  | 'Driving'
  | 'Shop / Market Work'
  | 'General Outdoor Activity'
  | 'General Indoor Activity';

export interface PersonalHeatImpactInput {
  currentTemp: number;
  humidity: number;
  windSpeedKmH: number;
  solarRadiation: number;
  uvIndex?: number;
  wbgt?: number;
  utci?: number;
  heatIndex?: number;
  ward?: WardInfo;
  activityType?: ActivityType | string;
  outdoorExposure?: boolean;
  exposureDuration?: string; // e.g. "< 30 mins", "30-60 mins", "1-2 hours", "3+ hours"
  ageGroup?: string;
  hasHealthCondition?: boolean;
  isOutdoorWorker?: boolean;
  nearbyCoolingCount?: number;
  nearbyWaterCount?: number;
  nearbyShadeCount?: number;
  // Destination comparison
  destinationContext?: {
    name: string;
    temp: number;
    humidity: number;
    windSpeedKmH: number;
    solarRadiation: number;
    wbgt?: number;
    utci?: number;
    ward?: WardInfo;
    nearbyCoolingCount?: number;
    nearbyWaterCount?: number;
  };
}

export interface PersonalHeatImpact {
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical';
  headline: string;
  meaningForUser: string;
  thermalStress: {
    wbgt: number;
    utci: number;
    heatIndex: number;
    category: string;
  };
  environmentalFactors: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    solarRadiation: number;
    shadeAvailability: number | null;
    coolingAvailability: number | null;
  };
  activity: {
    type: string;
    outdoorExposure: boolean;
    exposureIntensity: 'Low' | 'Moderate' | 'High' | 'Severe';
    duration: string;
  };
  effects: string[];
  warnings: string[];
  recommendations: string[];
  peakRiskPeriod: string;
  protectionFactors: string[];
  riskReasons: string[];
  destinationComparison?: {
    destinationName: string;
    destinationRiskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical';
    differenceSummary: string;
    isHigherRisk: boolean;
    factors: string[];
    recommendations: string[];
  };
  dataStatus: 'LIVE' | 'MODELLED' | 'DEMO';
}

/**
 * Determines if an activity is primarily outdoors
 */
export function isActivityOutdoors(activity: string): boolean {
  const outdoorTypes = [
    'Outdoor Construction',
    'Street Vendor',
    'Delivery / Rider',
    'Traffic / Police Duty',
    'Municipal Field Work',
    'Agriculture',
    'Walking / Commuting',
    'General Outdoor Activity',
  ];
  return outdoorTypes.some((t) => activity.toLowerCase().includes(t.toLowerCase()));
}

/**
 * Evaluates personal human heat impact from environmental, location, and personal context
 */
export function evaluateHumanHeatImpact(input: PersonalHeatImpactInput): PersonalHeatImpact {
  const temp = input.currentTemp;
  const rh = input.humidity;
  const windMs = input.windSpeedKmH / 3.6;
  const solar = input.solarRadiation;
  const uv = input.uvIndex ?? 0;

  // 1. Calculate thermal indices
  const wbgt = input.wbgt ?? calculateWBGT(temp, rh, solar, windMs);
  const utci = input.utci ?? calculateUTCI(temp, rh, windMs, solar);
  const hi = input.heatIndex ?? calculateHeatIndex(temp, rh);
  const baseThermalCategory = categorizeThermalStress(wbgt, utci, temp);

  // 2. Personal Context
  const activityStr = (input.activityType || 'General Outdoor Activity') as string;
  const isOutdoor = input.outdoorExposure !== undefined ? input.outdoorExposure : isActivityOutdoors(activityStr);
  const duration = input.exposureDuration || (isOutdoor ? '1-2 hours' : '< 30 mins');
  const isSenior = (input.ageGroup || '').toLowerCase().includes('senior') || (input.ageGroup || '').includes('65');
  const isChild = (input.ageGroup || '').toLowerCase().includes('child') || (input.ageGroup || '').includes('12');
  const hasHealthCondition = Boolean(input.hasHealthCondition);

  // 3. Environmental & Location Factors
  const shadePct = input.ward?.treeCanopyPct !== undefined ? input.ward.treeCanopyPct : null;
  const builtDensity = input.ward?.builtDensityPct !== undefined ? input.ward.builtDensityPct : null;
  const coolingCount = input.nearbyCoolingCount ?? 0;
  const waterCount = input.nearbyWaterCount ?? 0;
  const shadeCount = input.nearbyShadeCount ?? 0;

  // 4. Determine Personal Impact Intensity & Adjusted Risk Level
  let intensity: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
  if (baseThermalCategory === 'Extreme' || (baseThermalCategory === 'High' && isOutdoor && duration === '3+ hours')) {
    intensity = 'Severe';
  } else if (baseThermalCategory === 'High' || (baseThermalCategory === 'Moderate' && isOutdoor)) {
    intensity = 'High';
  } else if (baseThermalCategory === 'Moderate' || (isOutdoor && temp >= 30)) {
    intensity = 'Moderate';
  }

  // Adjust risk level based on Personal + Location context (never relying on temperature alone!)
  let riskScoreNum = 20; // baseline
  if (baseThermalCategory === 'Extreme') riskScoreNum = 80;
  else if (baseThermalCategory === 'High') riskScoreNum = 60;
  else if (baseThermalCategory === 'Moderate') riskScoreNum = 40;

  // Location modifiers
  if (builtDensity && builtDensity > 70) riskScoreNum += 6; // high asphalt trapping heat
  if (shadePct && shadePct < 20) riskScoreNum += 6; // low tree canopy
  if (coolingCount === 0 && waterCount === 0 && isOutdoor) riskScoreNum += 8; // protection deficit
  if (coolingCount >= 2 || waterCount >= 2) riskScoreNum -= 6; // protective buffering

  // Personal modifiers
  if (isOutdoor) {
    if (duration === '3+ hours') riskScoreNum += 10;
    else if (duration === '1-2 hours') riskScoreNum += 5;
  } else {
    riskScoreNum -= 14; // indoor buffer
  }

  if (isSenior || isChild) riskScoreNum += 8;
  if (hasHealthCondition) riskScoreNum += 8;

  riskScoreNum = Math.min(100, Math.max(5, riskScoreNum));

  let finalRiskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical' = 'Low';
  if (riskScoreNum >= 82) finalRiskLevel = 'Critical';
  else if (riskScoreNum >= 68) finalRiskLevel = 'Extreme';
  else if (riskScoreNum >= 50) finalRiskLevel = 'High';
  else if (riskScoreNum >= 32) finalRiskLevel = 'Moderate';

  // 5. Plain Language "What this means for YOU"
  let headline = 'NORMAL THERMAL CONDITIONS';
  let meaningForUser = 'Current environmental conditions are within comfortable limits for normal daily activities.';

  if (finalRiskLevel === 'Critical' || finalRiskLevel === 'Extreme') {
    headline = 'DANGEROUS HEAT STRESS';
    meaningForUser = isOutdoor
      ? `Because of the intense combination of ambient warmth (${temp}°C), radiant solar load (${solar} W/m²), and high humidity (${rh}%), prolonged outdoor activity may cause rapid fatigue, dehydration, and elevated heat strain.`
      : `Indoor heat buildup and outdoor transit pose high heat strain. Airless or poorly ventilated spaces can cause fatigue and decreased concentration.`;
  } else if (finalRiskLevel === 'High') {
    headline = 'HIGH HEAT STRESS';
    meaningForUser = isOutdoor
      ? `The combination of temperature (${temp}°C), sunlight, and humidity creates noticeable heat strain during outdoor physical activity. Sweating may be less effective at cooling your body.`
      : `Moderate to high heat load outdoors. Keep well-hydrated and minimize direct sunlight exposure when moving between indoor spaces.`;
  } else if (finalRiskLevel === 'Moderate') {
    headline = 'MODERATE HEAT STRAIN';
    meaningForUser = isOutdoor
      ? `Noticeable daytime heat discomfort. Prolonged exposure without adequate water or shade breaks can lead to increased fatigue and mild dehydration.`
      : `Comfortable indoors with adequate ventilation. Short outdoor travel requires routine hydration and sun awareness.`;
  }

  // 6. Deterministic, Activity-Specific Effects & Warnings
  const effects: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const riskReasons: string[] = [];

  // Reasons breakdown
  if (solar > 500) riskReasons.push(`Intense direct solar radiation (${solar} W/m²) accelerating surface heating`);
  if (rh > 60 && temp >= 28) riskReasons.push(`High relative humidity (${rh}%) restricting natural sweat evaporation`);
  if (input.windSpeedKmH < 6) riskReasons.push(`Low wind speed (${input.windSpeedKmH} km/h) providing minimal convective cooling`);
  if (shadePct !== null && shadePct < 25) riskReasons.push(`Low ward tree canopy (${shadePct}%) offering limited natural shade`);
  if (builtDensity !== null && builtDensity > 70) riskReasons.push(`High built-up density (${builtDensity}%) increasing radiant surface backscatter`);
  if (coolingCount === 0 && isOutdoor) riskReasons.push('Absence of immediate air-conditioned cooling centres within 500m');

  const actLower = activityStr.toLowerCase();

  if (actLower.includes('construction') || actLower.includes('agriculture') || actLower.includes('field work')) {
    effects.push('Accelerated fluid loss and rapid dehydration during sustained physical labor');
    effects.push('Increased muscle fatigue and reduced safe continuous exertion capacity');
    effects.push('Elevated risk of heat cramps and heat exhaustion without frequent shade breaks');
    warnings.push('Continuous metabolic heat generation under direct sun significantly elevates core body temperature.');
    warnings.push('Early warning signs include dizziness, muscle spasms, profuse sweating, and headache.');
    recommendations.push('Take mandatory 15-minute rest breaks in deep shade for every 45 minutes of heavy work.');
    recommendations.push('Drink 300–400 ml of water or electrolyte solution every 30 minutes, even without thirst.');
    recommendations.push('Shift heaviest manual tasks to cooler early morning hours before 11:00 AM.');
  } else if (actLower.includes('vendor') || actLower.includes('market') || actLower.includes('shop')) {
    effects.push('Radiant heat accumulation from heated asphalt and metal stalls elevating local thermal strain');
    effects.push('Steadily increasing dehydration throughout afternoon trading hours');
    effects.push('Physical lethargy and reduced concentration from prolonged standing');
    warnings.push('Bitumen road surfaces can become 10°C to 15°C hotter than ambient air in the afternoon.');
    recommendations.push('Erect reflective fabric awnings or wet shade mats over stall counters.');
    recommendations.push('Keep a shaded, insulated drinking water container and sip continuously.');
    recommendations.push('Take rotational cooling breaks at nearby civic centres or air-conditioned shops.');
  } else if (actLower.includes('delivery') || actLower.includes('rider') || actLower.includes('police') || actLower.includes('traffic')) {
    effects.push('Continuous radiant sun and hot air exposure during repeated road trips');
    effects.push('Hot wind and optical glare accelerating eye strain and mental exhaustion');
    effects.push('Dehydration risk compounded by vehicular engine heat dissipation');
    warnings.push('Thermal strain can reduce alertness and slow reaction times on congested roadways.');
    recommendations.push('Wear light-colored, breathable UV-blocking arm sleeves and a wet neck scarf.');
    recommendations.push('Schedule routine 10-minute hydration pauses at municipal water kiosks.');
    recommendations.push('Keep helmet vents open and carry electrolyte packets.');
  } else if (actLower.includes('office') || actLower.includes('desk') || actLower.includes('indoor')) {
    effects.push('Indoor thermal discomfort during afternoon hours in poorly ventilated rooms');
    effects.push('Reduced cognitive stamina and increased afternoon drowsiness');
    effects.push('Subtle dehydration from air-conditioning drying skin without noticeable sweat');
    warnings.push('Sharp thermal contrast when stepping from AC indoors to high-heat outdoor environments.');
    recommendations.push('Drink water regularly throughout office hours even without feeling thirsty.');
    recommendations.push('Reschedule non-essential outdoor meetings and walking errands away from 12:00 PM – 4:00 PM.');
    recommendations.push('Use shaded park walkways or covered arcades for lunchtime transit.');
  } else if (actLower.includes('student') || actLower.includes('college')) {
    effects.push('Thermal fatigue reducing classroom focus and study concentration');
    effects.push('Increased heat strain when walking between unshaded campus buildings');
    effects.push('Mild headache or flushed skin following prolonged courtyard exposure');
    warnings.push('Avoid unshaded outdoor sports and strenuous physical drills during peak afternoon hours.');
    recommendations.push('Carry a refillable insulated water bottle between lectures.');
    recommendations.push('Utilize air-cooled library sanctuaries or shaded tree corridors during class breaks.');
    recommendations.push('Wear loose, light-colored cotton clothing.');
  } else {
    // Walking / Commuting / General Outdoor
    effects.push('Noticeable thermal discomfort and accelerated fluid loss through perspiration');
    effects.push('Elevated fatigue and increased pulse rate when walking under unshaded sun');
    effects.push('Higher heat strain during extended journeys on paved arterial roads');
    warnings.push('Direct sunlight exposure can elevate core body temperature within 20–30 minutes.');
    recommendations.push('Select canopy-covered green routes and tree-lined pedestrian avenues.');
    recommendations.push('Carry a water bottle and refill at municipal chilled drinking kiosks.');
    recommendations.push('Carry an umbrella or wear a wide-brim hat to shield against radiant solar load.');
  }

  // Vulnerability recommendations
  if (isSenior || hasHealthCondition) {
    warnings.push('Pre-existing cardiovascular or age-related factors reduce physiological heat dissipation capacity.');
    recommendations.push('Stay in well-ventilated or air-conditioned environments during the 12:00 PM – 4:00 PM window.');
  }

  // 7. Protection Factors
  const protectionFactors: string[] = [];
  if (coolingCount > 0) protectionFactors.push(`${coolingCount} Public AC cooling centre(s) available in your vicinity`);
  if (waterCount > 0) protectionFactors.push(`${waterCount} Municipal chilled drinking water kiosk(s) nearby`);
  if (shadeCount > 0) protectionFactors.push(`${shadeCount} Shaded public green space(s) / parks accessible`);
  if (shadePct !== null && shadePct >= 30) protectionFactors.push(`Good natural tree canopy coverage (${shadePct}%) in this ward`);
  if (protectionFactors.length === 0) protectionFactors.push('Limited civic cooling infrastructure in immediate 500m zone');

  // 8. Destination Comparison (if provided)
  let destinationComparison: PersonalHeatImpact['destinationComparison'];
  if (input.destinationContext) {
    const dest = input.destinationContext;
    const destWbgt = dest.wbgt ?? calculateWBGT(dest.temp, dest.humidity, dest.solarRadiation, (dest.windSpeedKmH || 8) / 3.6);
    const destUtci = dest.utci ?? calculateUTCI(dest.temp, dest.humidity, (dest.windSpeedKmH || 8) / 3.6, dest.solarRadiation);
    const destRisk = categorizeThermalStress(destWbgt, destUtci, dest.temp);

    const isHigher = destWbgt > wbgt + 0.8 || dest.temp > temp + 1.5;
    const destFactors: string[] = [];
    if (dest.temp > temp + 0.8) destFactors.push(`Higher ambient temperature (+${(dest.temp - temp).toFixed(1)}°C)`);
    if (dest.humidity > rh + 5) destFactors.push(`Higher relative humidity (+${dest.humidity - rh}%)`);
    if (dest.solarRadiation > solar + 50) destFactors.push(`Greater direct solar exposure`);
    if (dest.windSpeedKmH < input.windSpeedKmH - 3) destFactors.push(`Lower wind ventilation`);
    if ((dest.nearbyCoolingCount ?? 0) < coolingCount) destFactors.push(`Fewer nearby cooling sanctuaries`);

    destinationComparison = {
      destinationName: dest.name,
      destinationRiskLevel: destRisk,
      isHigherRisk: isHigher,
      differenceSummary: isHigher
        ? `Your destination (${dest.name}) is forecasted to have HIGHER thermal stress during your travel window.`
        : `Your destination (${dest.name}) has similar or lower thermal stress compared to your current location.`,
      factors: destFactors.length > 0 ? destFactors : ['Comparable microclimate conditions between both locations'],
      recommendations: isHigher
        ? [
            'Carry extra drinking water before departing',
            'Plan a 10-minute cooling break immediately upon arrival',
            'Prefer canopied or transit routes that avoid open asphalt avenues',
          ]
        : ['Maintain routine hydration throughout your trip'],
    };
  }

  return {
    riskLevel: finalRiskLevel,
    headline,
    meaningForUser,
    thermalStress: {
      wbgt: Number(wbgt.toFixed(1)),
      utci: Number(utci.toFixed(1)),
      heatIndex: Number(hi.toFixed(1)),
      category: baseThermalCategory,
    },
    environmentalFactors: {
      temperature: Number(temp.toFixed(1)),
      humidity: Math.round(rh),
      windSpeed: Number(input.windSpeedKmH.toFixed(1)),
      solarRadiation: Math.round(solar),
      shadeAvailability: shadePct,
      coolingAvailability: coolingCount,
    },
    activity: {
      type: activityStr,
      outdoorExposure: isOutdoor,
      exposureIntensity: intensity,
      duration,
    },
    effects,
    warnings,
    recommendations,
    peakRiskPeriod: '12:00 PM – 04:30 PM',
    protectionFactors,
    riskReasons,
    destinationComparison,
    dataStatus: 'LIVE',
  };
}
