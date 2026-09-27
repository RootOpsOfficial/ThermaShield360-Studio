import { RiskLevel } from './types.js';

/**
 * Calculates Wet-Bulb Temperature (Tw) using Stull's empirical formula (accuracy ±0.5°C)
 * T in °C, RH in %
 */
export function calculateWetBulbTemp(tempC: number, rhPct: number): number {
  const T = tempC;
  const RH = rhPct;
  const Tw =
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;
  return Math.round(Tw * 10) / 10;
}

/**
 * Estimates Black Globe Temperature (Tg) in °C based on ambient temperature, solar irradiance (W/m²), and wind speed (m/s)
 */
export function estimateGlobeTemp(tempC: number, solarIrradianceW: number, windSpeedMs: number): number {
  const windFactor = Math.max(0.5, windSpeedMs);
  const deltaTg = (solarIrradianceW * 0.015) / (1 + 0.08 * windFactor);
  return Math.round((tempC + deltaTg) * 10) / 10;
}

/**
 * Calculates Wet-Bulb Globe Temperature (WBGT) in °C for outdoor environments with solar radiation
 * Formula: WBGT = 0.7*Tw + 0.2*Tg + 0.1*Ta
 */
export function calculateWBGT(tempC: number, rhPct: number, solarIrradianceW: number, windSpeedMs: number): number {
  const Tw = calculateWetBulbTemp(tempC, rhPct);
  const Tg = estimateGlobeTemp(tempC, solarIrradianceW, windSpeedMs);
  const wbgt = 0.7 * Tw + 0.2 * Tg + 0.1 * tempC;
  return Math.round(wbgt * 10) / 10;
}

/**
 * Calculates NOAA Heat Index in °C
 */
export function calculateHeatIndex(tempC: number, rhPct: number): number {
  // Convert C to F
  const T = (tempC * 9) / 5 + 32;
  const R = rhPct;

  if (T < 80) {
    const simpleHI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + R * 0.094);
    return Math.round((((simpleHI - 32) * 5) / 9) * 10) / 10;
  }

  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  if (R < 13 && T >= 80 && T <= 112) {
    const adj = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
    HI -= adj;
  } else if (R > 85 && T >= 80 && T <= 87) {
    const adj = ((R - 85) / 10) * ((87 - T) / 5);
    HI += adj;
  }

  const hic = ((HI - 32) * 5) / 9;
  return Math.round(hic * 10) / 10;
}

/**
 * Approximates Universal Thermal Climate Index (UTCI) in °C based on Fiala multi-node regression
 */
export function calculateUTCI(tempC: number, rhPct: number, windSpeedMs: number, solarIrradianceW: number): number {
  // Vapor pressure in hPa
  const vp = (rhPct / 100) * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  const v10 = Math.max(0.5, windSpeedMs);
  const deltaRad = (solarIrradianceW / 1000) * 12.0;

  let utci =
    tempC +
    0.6075 * (vp - 10) -
    0.0288 * Math.pow(tempC - 20, 2) -
    0.185 * v10 * (tempC - 10) +
    deltaRad * 0.85;

  return Math.round(utci * 10) / 10;
}

/**
 * Categorizes risk level based on WBGT / UTCI thresholds and ambient temperature context
 */
export function categorizeThermalStress(wbgt: number, utci: number, tempC?: number): RiskLevel {
  // Extreme: WBGT >= 32.0 or (UTCI >= 42 and ambient >= 32)
  if (wbgt >= 32 || (utci >= 42 && (tempC === undefined || tempC >= 32))) return 'Extreme';
  // High: WBGT >= 29.0 or (UTCI >= 38 and ambient >= 28)
  if (wbgt >= 29 || (utci >= 38 && (tempC === undefined || tempC >= 28))) return 'High';
  // Moderate: WBGT >= 26.0 or (UTCI >= 32 and ambient >= 25)
  if (wbgt >= 26 || (utci >= 32 && (tempC === undefined || tempC >= 24))) return 'Moderate';
  return 'Low';
}

/**
 * Calculates a unified citizen risk score (0-100) from thermal hazard, vulnerability, and exposure
 */
export function calculateCompositeRiskScore(
  wbgt: number,
  utci: number,
  vulnerabilityIndex: number,
  hourOfDay: number,
  uhiOffset: number
): { score: number; level: RiskLevel } {
  // Base hazard normalized from WBGT (20C = 0, 36C = 100)
  const thermalHazard = Math.min(100, Math.max(0, ((wbgt + uhiOffset - 22) / (34 - 22)) * 100));

  // Exposure diurnal multiplier: peak sun exposure occurs between 11 AM and 5 PM
  let exposureFactor = 0.5;
  if (hourOfDay >= 11 && hourOfDay <= 16) {
    exposureFactor = 1.0;
  } else if ((hourOfDay >= 9 && hourOfDay < 11) || (hourOfDay > 16 && hourOfDay <= 18)) {
    exposureFactor = 0.75;
  } else {
    exposureFactor = 0.4;
  }

  // Weightings: 50% thermal hazard, 30% ward urban vulnerability, 20% temporal exposure
  const compositeScore = Math.round(
    thermalHazard * 0.5 + vulnerabilityIndex * 0.3 + exposureFactor * 100 * 0.2
  );

  const boundedScore = Math.min(100, Math.max(5, compositeScore));

  let level: RiskLevel = 'Low';
  if (boundedScore >= 75) level = 'Extreme';
  else if (boundedScore >= 55) level = 'High';
  else if (boundedScore >= 35) level = 'Moderate';

  return { score: boundedScore, level };
}

/**
 * Returns citizen friendly interpretation text for Thermal Stress
 */
export function getThermalCitizenExplanation(level: RiskLevel, wbgt: number, utci: number): {
  explanation: string;
  points: string[];
} {
  switch (level) {
    case 'Extreme':
      return {
        explanation: 'Critical heat stress warning. Heat stroke is imminent without protective intervention and shade.',
        points: [
          'Immediate danger of heat stroke and collapse with physical exertion.',
          'Sweat cannot evaporate effectively to cool down your body.',
          'Mandatory 45-minute rest in cooling centres for every 15 minutes of outdoor walking.',
          'Keep hydration salts (ORS) ready and monitor elderly neighbours.',
        ],
      };
    case 'High':
      return {
        explanation: 'Severe thermal discomfort. Outdoor activity leads to rapid exhaustion, dizziness, and cramping.',
        points: [
          'Direct sun exposure will elevate core body temperature within 20 minutes.',
          'Reschedule non-essential outdoor travel away from 12:00 PM – 4:30 PM.',
          'Drink at least 350ml of water every 30 minutes, even if not feeling thirsty.',
          'Opt for canopied green corridors and active cooling centres.',
        ],
      };
    case 'Moderate':
      return {
        explanation: 'Noticeable heat discomfort. Prolonged exposure causes fatigue and dehydration.',
        points: [
          'Moderate heat fatigue likely during afternoon sun.',
          'Seek shade under tree-canopied roads when travelling on foot.',
          'Carry a refillable water bottle and wear light, loose cotton clothing.',
          'Take short breaks in ventilated or shaded spaces.',
        ],
      };
    case 'Low':
    default:
      return {
        explanation: 'Comfortable thermal conditions. No significant physiological heat strain detected.',
        points: [
          'Safe for normal outdoor exercise and daytime transit.',
          'Maintain regular daily hydration.',
          'Ultraviolet radiation may still require sun protection during noon hours.',
        ],
      };
  }
}
