import { RiskLevel } from './types.js';

/**
 * TraceableThermalResult wrapper enforcing complete audit lineage
 * If required meteorological inputs are NULL, output is strictly NULL.
 */
export interface TraceableThermalResult<T = number> {
  calculationId: string;
  method: string;
  inputRecordIds: string[];
  calculatedAt: string;
  output: T | null;
  unit: string;
  validationStatus: 'VALID' | 'INPUT_MISSING' | 'OUT_OF_BOUNDS';
}

/**
 * Calculates Wet-Bulb Temperature (Tw) using Stull's empirical formula (accuracy ±0.5°C)
 * T in °C, RH in %
 * Returns null if any input is missing or NaN.
 */
export function calculateWetBulbTemp(tempC: number, rhPct: number): number;
export function calculateWetBulbTemp(tempC: number | null, rhPct: number | null): number | null;
export function calculateWetBulbTemp(tempC: number | null, rhPct: number | null): number | null {
  if (tempC === null || rhPct === null || isNaN(tempC) || isNaN(rhPct)) return null;

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
 * Returns null if any input is missing or NaN.
 */
export function estimateGlobeTemp(tempC: number, solarIrradianceW: number, windSpeedMs: number): number;
export function estimateGlobeTemp(tempC: number | null, solarIrradianceW: number | null, windSpeedMs: number | null): number | null;
export function estimateGlobeTemp(
  tempC: number | null,
  solarIrradianceW: number | null,
  windSpeedMs: number | null
): number | null {
  if (tempC === null || solarIrradianceW === null || windSpeedMs === null || isNaN(tempC) || isNaN(solarIrradianceW) || isNaN(windSpeedMs)) {
    return null;
  }

  const windFactor = Math.max(0.5, windSpeedMs);
  const deltaTg = (solarIrradianceW * 0.015) / (1 + 0.08 * windFactor);
  return Math.round((tempC + deltaTg) * 10) / 10;
}

/**
 * Calculates Wet-Bulb Globe Temperature (WBGT) in °C for outdoor environments with solar radiation
 * Formula: WBGT = 0.7*Tw + 0.2*Tg + 0.1*Ta
 * Returns null if any required input is null.
 */
export function calculateWBGT(tempC: number, rhPct: number, solarIrradianceW: number, windSpeedMs: number): number;
export function calculateWBGT(tempC: number | null, rhPct: number | null, solarIrradianceW: number | null, windSpeedMs: number | null): number | null;
export function calculateWBGT(
  tempC: number | null,
  rhPct: number | null,
  solarIrradianceW: number | null,
  windSpeedMs: number | null
): number | null {
  if (tempC === null || rhPct === null || solarIrradianceW === null || windSpeedMs === null) {
    return null;
  }

  const Tw = calculateWetBulbTemp(tempC, rhPct);
  const Tg = estimateGlobeTemp(tempC, solarIrradianceW, windSpeedMs);
  if (Tw === null || Tg === null) return null;

  const wbgt = 0.7 * Tw + 0.2 * Tg + 0.1 * tempC;
  return Math.round(wbgt * 10) / 10;
}

/**
 * Calculates NOAA Heat Index in °C
 * Returns null if any input is missing or NaN.
 */
export function calculateHeatIndex(tempC: number, rhPct: number): number;
export function calculateHeatIndex(tempC: number | null, rhPct: number | null): number | null;
export function calculateHeatIndex(tempC: number | null, rhPct: number | null): number | null {
  if (tempC === null || rhPct === null || isNaN(tempC) || isNaN(rhPct)) return null;

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
 * Calculates saturation vapour pressure over water in hPa based on the
 * ITS-90 formulation (Hardy 1998 / Bröde et al. 2012 / ECMWF thermofeel).
 */
export function calculateSaturationVapourPressureHpa(tempC: number): number {
  const tk = tempC + 273.15;
  const g = [
    -2.8365744e3,
    -6.028076559e3,
    1.954263612e1,
    -2.737830188e-2,
    1.6261698e-5,
    7.0229056e-10,
    -1.8680009e-13,
    2.7150305,
  ];
  let ess = g[7] * Math.log(tk);
  for (let i = 0; i < 7; i++) {
    ess += g[i] * Math.pow(tk, i - 2);
  }
  return Math.exp(ess) * 0.01; // hPa
}

/**
 * Estimates Mean Radiant Temperature (Tmrt) in °C.
 * 
 * Nighttime MRT approximation: MRT = Ta when available shortwave radiation
 * is zero and no complete longwave/radiative dataset is available.
 * 
 * When solar irradiance (W/m²) is present during daytime, approximates
 * shortwave radiant heating modulated by ambient wind speed.
 */
export function estimateMeanRadiantTemperature(
  tempC: number,
  solarIrradianceW: number,
  windSpeedMs: number = 1.0
): number {
  if (solarIrradianceW <= 0) {
    // Nighttime MRT approximation: MRT = Ta when available shortwave radiation
    // is zero and no complete longwave/radiative dataset is available.
    return tempC;
  }
  const deltaMrt = (solarIrradianceW * 0.02) / (1 + 0.08 * Math.max(0.5, windSpeedMs));
  return Math.round((tempC + deltaMrt) * 10) / 10;
}

/**
 * Official 6th-order polynomial regression approximation for UTCI
 * based on the COST Action 730 framework (Bröde et al., 2012; ECMWF thermofeel).
 * 
 * Inputs:
 * - t2m: 2m dry-bulb air temperature in °C
 * - mrt: mean radiant temperature in °C
 * - va: 10m wind speed in m/s
 * - wvp: water vapour pressure in kPa
 * 
 * Returns raw unrounded UTCI equivalent temperature in °C.
 */
export function calculateUTCIPolynomial(
  t2m: number,
  mrt: number,
  va: number,
  wvp: number
): number {
  const e_mrt = mrt - t2m;

  const t2m2 = t2m * t2m;
  const t2m3 = t2m2 * t2m;
  const t2m4 = t2m3 * t2m;
  const t2m5 = t2m4 * t2m;
  const t2m6 = t2m5 * t2m;

  const va2 = va * va;
  const va3 = va2 * va;
  const va4 = va3 * va;
  const va5 = va4 * va;
  const va6 = va5 * va;

  const e_mrt2 = e_mrt * e_mrt;
  const e_mrt3 = e_mrt2 * e_mrt;
  const e_mrt4 = e_mrt3 * e_mrt;
  const e_mrt5 = e_mrt4 * e_mrt;
  const e_mrt6 = e_mrt5 * e_mrt;

  const wvp2 = wvp * wvp;
  const wvp3 = wvp2 * wvp;
  const wvp4 = wvp3 * wvp;
  const wvp5 = wvp4 * wvp;
  const wvp6 = wvp5 * wvp;

  const varh2 = va * wvp2;
  const va2_rh = va2 * wvp;
  const va2_e_mrt = va2 * e_mrt;
  const e_mrt_rh = e_mrt * wvp;
  const e_mrt_rh2 = e_mrt * wvp2;
  const e_mrt2_rh = e_mrt2 * wvp;
  const e_mrt2_rh2 = e_mrt2 * wvp2;
  const e_mrt_rh3 = e_mrt * wvp3;
  const va_e_mrt = va * e_mrt;
  const va_e_mrt2 = va * e_mrt2;
  const va_rh = va * wvp;
  const t2m_va = t2m * va;
  const e_mrt3_rh = e_mrt3 * wvp;
  const e_mrt4_rh = e_mrt4 * wvp;

  return (
    t2m
    + 6.07562052e-01
    + -2.27712343e-02 * t2m
    + 8.06470249e-04 * t2m2
    + -1.54271372e-04 * t2m3
    + -3.24651735e-06 * t2m4
    + 7.32602852e-08 * t2m5
    + 1.35959073e-09 * t2m6
    + -2.25836520e00 * va
    + 8.80326035e-02 * t2m * va
    + 2.16844454e-03 * t2m2 * va
    + -1.53347087e-05 * t2m3 * va
    + -5.72983704e-07 * t2m4 * va
    + -2.55090145e-09 * t2m5 * va
    + -7.51269505e-01 * va2
    + -4.08350271e-03 * t2m * va2
    + -5.21670675e-05 * t2m2 * va2
    + 1.94544667e-06 * t2m3 * va2
    + 1.14099531e-08 * t2m4 * va2
    + 1.58137256e-01 * va3
    + -6.57263143e-05 * t2m * va3
    + 2.22697524e-07 * t2m2 * va3
    + -4.16117031e-08 * t2m3 * va3
    + -1.27762753e-02 * va4
    + 9.66891875e-06 * t2m * va4
    + 2.52785852e-09 * t2m2 * va4
    + 4.56306672e-04 * va5
    + -1.74202546e-07 * t2m * va5
    + -5.91491269e-06 * va6
    + 3.98374029e-01 * e_mrt
    + 1.83945314e-04 * t2m * e_mrt
    + -1.73754510e-04 * t2m2 * e_mrt
    + -7.60781159e-07 * t2m3 * e_mrt
    + 3.77830287e-08 * t2m4 * e_mrt
    + 5.43079673e-10 * t2m5 * e_mrt
    + -2.00518269e-02 * va_e_mrt
    + 8.92859837e-04 * t2m * va_e_mrt
    + 3.45433048e-06 * t2m2 * va_e_mrt
    + -3.77925774e-07 * t2m3 * va_e_mrt
    + -1.69699377e-09 * t2m4 * va_e_mrt
    + 1.69992415e-04 * va2_e_mrt
    + -4.99204314e-05 * t2m * va2_e_mrt
    + 2.47417178e-07 * t2m2 * va2_e_mrt
    + 1.07596466e-08 * t2m3 * va2_e_mrt
    + 8.49242932e-05 * va3 * e_mrt
    + 1.35191328e-06 * t2m * va3 * e_mrt
    + -6.21531254e-09 * t2m2 * va3 * e_mrt
    + -4.99410301e-06 * va4 * e_mrt
    + -1.89489258e-08 * t2m * va4 * e_mrt
    + 8.15300114e-08 * va5 * e_mrt
    + 7.55043090e-04 * e_mrt2
    + -5.65095215e-05 * t2m * e_mrt2
    + -4.52166564e-07 * t2m2 * e_mrt2
    + 2.46688878e-08 * t2m3 * e_mrt2
    + 2.42674348e-10 * t2m4 * e_mrt2
    + 1.54547250e-04 * va_e_mrt2
    + 5.24110970e-06 * t2m * va_e_mrt2
    + -8.75874982e-08 * t2m2 * va_e_mrt2
    + -1.50743064e-09 * t2m3 * va_e_mrt2
    + -1.56236307e-05 * va2 * e_mrt2
    + -1.33895614e-07 * t2m * va2 * e_mrt2
    + 2.49709824e-09 * t2m2 * va2 * e_mrt2
    + 6.51711721e-07 * va3 * e_mrt2
    + 1.94960053e-09 * t2m * va3 * e_mrt2
    + -1.00361113e-08 * va4 * e_mrt2
    + -1.21206673e-05 * e_mrt3
    + -2.18203660e-07 * t2m * e_mrt3
    + 7.51269482e-09 * t2m2 * e_mrt3
    + 9.79063848e-11 * t2m3 * e_mrt3
    + 1.25006734e-06 * va * e_mrt3
    + -1.81584736e-09 * t2m_va * e_mrt3
    + -3.52197671e-10 * t2m2 * va * e_mrt3
    + -3.36514630e-08 * va2 * e_mrt3
    + 1.35908359e-10 * t2m * va2 * e_mrt3
    + 4.17032620e-10 * va3 * e_mrt3
    + -1.30369025e-09 * e_mrt4
    + 4.13908461e-10 * t2m * e_mrt4
    + 9.22652254e-12 * t2m2 * e_mrt4
    + -5.08220384e-09 * va * e_mrt4
    + -2.24730961e-11 * t2m_va * e_mrt4
    + 1.17139133e-10 * va2 * e_mrt4
    + 6.62154879e-10 * e_mrt5
    + 4.03863260e-13 * t2m * e_mrt5
    + 1.95087203e-12 * va * e_mrt5
    + -4.73602469e-12 * e_mrt6
    + 5.12733497e00 * wvp
    + -3.12788561e-01 * t2m * wvp
    + -1.96701861e-02 * t2m2 * wvp
    + 9.99690870e-04 * t2m3 * wvp
    + 9.51738512e-06 * t2m4 * wvp
    + -4.66426341e-07 * t2m5 * wvp
    + 5.48050612e-01 * va_rh
    + -3.30552823e-03 * t2m * va_rh
    + -1.64119440e-03 * t2m2 * va_rh
    + -5.16670694e-06 * t2m3 * va_rh
    + 9.52692432e-07 * t2m4 * va_rh
    + -4.29223622e-02 * va2_rh
    + 5.00845667e-03 * t2m * va2_rh
    + 1.00601257e-06 * t2m2 * va2_rh
    + -1.81748644e-06 * t2m3 * va2_rh
    + -1.25813502e-03 * va3 * wvp
    + -1.79330391e-04 * t2m * va3 * wvp
    + 2.34994441e-06 * t2m2 * va3 * wvp
    + 1.29735808e-04 * va4 * wvp
    + 1.29064870e-06 * t2m * va4 * wvp
    + -2.28558686e-06 * va5 * wvp
    + -3.69476348e-02 * e_mrt_rh
    + 1.62325322e-03 * t2m * e_mrt_rh
    + -3.14279680e-05 * t2m2 * e_mrt_rh
    + 2.59835559e-06 * t2m3 * e_mrt_rh
    + -4.77136523e-08 * t2m4 * e_mrt_rh
    + 8.64203390e-03 * va * e_mrt_rh
    + -6.87405181e-04 * t2m_va * e_mrt_rh
    + -9.13863872e-06 * t2m2 * va * e_mrt_rh
    + 5.15916806e-07 * t2m3 * va * e_mrt_rh
    + -3.59217476e-05 * va2 * e_mrt_rh
    + 3.28696511e-05 * t2m * va2 * e_mrt_rh
    + -7.10542454e-07 * t2m2 * va2 * e_mrt_rh
    + -1.24382300e-05 * va3 * e_mrt_rh
    + -7.38584400e-09 * t2m * va3 * e_mrt_rh
    + 2.20609296e-07 * va4 * e_mrt_rh
    + -7.32469180e-04 * e_mrt2_rh
    + -1.87381964e-05 * t2m * e_mrt2_rh
    + 4.80925239e-06 * t2m2 * e_mrt2_rh
    + -8.75492040e-08 * t2m3 * e_mrt2_rh
    + 2.77862930e-05 * va * e_mrt2_rh
    + -5.06004592e-06 * t2m_va * e_mrt2_rh
    + 1.14325367e-07 * t2m2 * va * e_mrt2_rh
    + 2.53016723e-06 * va2 * e_mrt2_rh
    + -1.72857035e-08 * t2m * va2 * e_mrt2_rh
    + -3.95079398e-08 * va3 * e_mrt2_rh
    + -3.59413173e-07 * e_mrt3_rh
    + 7.04388046e-07 * t2m * e_mrt3_rh
    + -1.89309167e-08 * t2m2 * e_mrt3_rh
    + -4.79768731e-07 * va * e_mrt3_rh
    + 7.96079978e-09 * t2m_va * e_mrt3_rh
    + 1.62897058e-09 * va2 * e_mrt3_rh
    + 3.94367674e-08 * e_mrt4_rh
    + -1.18566247e-09 * t2m * e_mrt4_rh
    + 3.34678041e-10 * va * e_mrt4_rh
    + -1.15606447e-10 * e_mrt5 * wvp
    + -2.80626406e00 * wvp2
    + 5.48712484e-01 * t2m * wvp2
    + -3.99428410e-03 * t2m2 * wvp2
    + -9.54009191e-04 * t2m3 * wvp2
    + 1.93090978e-05 * t2m4 * wvp2
    + -3.08806365e-01 * varh2
    + 1.16952364e-02 * t2m * varh2
    + 4.95271903e-04 * t2m2 * varh2
    + -1.90710882e-05 * t2m3 * varh2
    + 2.10787756e-03 * va2 * wvp2
    + -6.98445738e-04 * t2m * va2 * wvp2
    + 2.30109073e-05 * t2m2 * va2 * wvp2
    + 4.17856590e-04 * va3 * wvp2
    + -1.27043871e-05 * t2m * va3 * wvp2
    + -3.04620472e-06 * va4 * wvp2
    + 5.14507424e-02 * e_mrt_rh2
    + -4.32510997e-03 * t2m * e_mrt_rh2
    + 8.99281156e-05 * t2m2 * e_mrt_rh2
    + -7.14663943e-07 * t2m3 * e_mrt_rh2
    + -2.66016305e-04 * va * e_mrt_rh2
    + 2.63789586e-04 * t2m_va * e_mrt_rh2
    + -7.01199003e-06 * t2m2 * va * e_mrt_rh2
    + -1.06823306e-04 * va2 * e_mrt_rh2
    + 3.61341136e-06 * t2m * va2 * e_mrt_rh2
    + 2.29748967e-07 * va3 * e_mrt_rh2
    + 3.04788893e-04 * e_mrt2_rh2
    + -6.42070836e-05 * t2m * e_mrt2_rh2
    + 1.16257971e-06 * t2m2 * e_mrt2_rh2
    + 7.68023384e-06 * va * e_mrt2_rh2
    + -5.47446896e-07 * t2m_va * e_mrt2_rh2
    + -3.59937910e-08 * va2 * e_mrt2_rh2
    + -4.36497725e-06 * e_mrt3 * wvp2
    + 1.68737969e-07 * t2m * e_mrt3 * wvp2
    + 2.67489271e-08 * va * e_mrt3 * wvp2
    + 3.23926897e-09 * e_mrt4 * wvp2
    + -3.53874123e-02 * wvp3
    + -2.21201190e-01 * t2m * wvp3
    + 1.55126038e-02 * t2m2 * wvp3
    + -2.63917279e-04 * t2m3 * wvp3
    + 4.53433455e-02 * va * wvp3
    + -4.32943862e-03 * t2m_va * wvp3
    + 1.45389826e-04 * t2m2 * va * wvp3
    + 2.17508610e-04 * va2 * wvp3
    + -6.66724702e-05 * t2m * va2 * wvp3
    + 3.33217140e-05 * va3 * wvp3
    + -2.26921615e-03 * e_mrt_rh3
    + 3.80261982e-04 * t2m * e_mrt_rh3
    + -5.45314314e-09 * t2m2 * e_mrt_rh3
    + -7.96355448e-04 * va * e_mrt_rh3
    + 2.53458034e-05 * t2m_va * e_mrt_rh3
    + -6.31223658e-06 * va2 * e_mrt_rh3
    + 3.02122035e-04 * e_mrt2 * wvp3
    + -4.77403547e-06 * t2m * e_mrt2 * wvp3
    + 1.73825715e-06 * va * e_mrt2 * wvp3
    + -4.09087898e-07 * e_mrt3 * wvp3
    + 6.14155345e-01 * wvp4
    + -6.16755931e-02 * t2m * wvp4
    + 1.33374846e-03 * t2m2 * wvp4
    + 3.55375387e-03 * va * wvp4
    + -5.13027851e-04 * t2m_va * wvp4
    + 1.02449757e-04 * va2 * wvp4
    + -1.48526421e-03 * e_mrt * wvp4
    + -4.11469183e-05 * t2m * e_mrt * wvp4
    + -6.80434415e-06 * va * e_mrt * wvp4
    + -9.77675906e-06 * e_mrt2 * wvp4
    + 8.82773108e-02 * wvp5
    + -3.01859306e-03 * t2m * wvp5
    + 1.04452989e-03 * va * wvp5
    + 2.47090539e-04 * e_mrt * wvp5
    + 1.48348065e-03 * wvp6
  );
}

/**
 * Calculates Universal Thermal Climate Index (UTCI) in °C using the standard
 * 6th-order polynomial approximation from the COST Action 730 / UTCI framework
 * (Bröde et al., 2012).
 * 
 * Inputs:
 * - tempC: 2m dry-bulb air temperature in °C
 * - rhPct: 2m relative humidity in %
 * - windSpeedMs: 10m wind speed in m/s
 * - solarOrMrt: Mean radiant temperature in °C or shortwave solar irradiance in W/m²
 * - isExplicitMrt: (optional) flag if solarOrMrt is explicitly Tmrt in °C
 * 
 * Returns null if any input is missing or NaN.
 */
export function calculateUTCI(
  tempC: number,
  rhPct: number,
  windSpeedMs: number,
  solarOrMrt: number,
  isExplicitMrt?: boolean
): number;
export function calculateUTCI(
  tempC: number | null,
  rhPct: number | null,
  windSpeedMs: number | null,
  solarOrMrt: number | null,
  isExplicitMrt?: boolean
): number | null;
export function calculateUTCI(
  tempC: number | null,
  rhPct: number | null,
  windSpeedMs: number | null,
  solarOrMrt: number | null,
  isExplicitMrt: boolean = false
): number | null {
  if (
    tempC === null ||
    rhPct === null ||
    windSpeedMs === null ||
    solarOrMrt === null ||
    isNaN(tempC) ||
    isNaN(rhPct) ||
    isNaN(windSpeedMs) ||
    isNaN(solarOrMrt)
  ) {
    return null;
  }

  // 10m wind speed in m/s (non-negative)
  const va = Math.max(0, windSpeedMs);

  // Water vapour pressure in kPa (standard input for COST Action 730 polynomial)
  const ehPa = calculateSaturationVapourPressureHpa(tempC) * (rhPct / 100.0);
  const wvpKPa = ehPa / 10.0;

  // Mean Radiant Temperature (Tmrt in °C)
  let mrt: number;
  if (isExplicitMrt || solarOrMrt === tempC) {
    mrt = solarOrMrt;
  } else if (solarOrMrt <= 0) {
    // Nighttime MRT approximation: MRT = Ta when available shortwave radiation
    // is zero and no complete longwave/radiative dataset is available.
    mrt = tempC;
  } else {
    mrt = estimateMeanRadiantTemperature(tempC, solarOrMrt, va);
  }

  const utci = calculateUTCIPolynomial(tempC, mrt, va, wvpKPa);
  return Math.round(utci * 10) / 10;
}

// ==========================================
// Traceable Wrappers with Full Audit Provenance
// ==========================================

export function calculateTraceableWBGT(
  tempC: number | null,
  rhPct: number | null,
  solarIrradianceW: number | null,
  windSpeedMs: number | null,
  inputRecordIds: string[] = []
): TraceableThermalResult<number> {
  const calculatedAt = new Date().toISOString();
  const calculationId = `wbgt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const wbgt = calculateWBGT(tempC, rhPct, solarIrradianceW, windSpeedMs);

  return {
    calculationId,
    method: 'Liljegren / Stull Empirical WBGT (ISO 7243 outdoor formula: 0.7*Tw + 0.2*Tg + 0.1*Ta)',
    inputRecordIds,
    calculatedAt,
    output: wbgt,
    unit: '°C',
    validationStatus: wbgt !== null ? 'VALID' : 'INPUT_MISSING',
  };
}

export function calculateTraceableUTCI(
  tempC: number | null,
  rhPct: number | null,
  windSpeedMs: number | null,
  solarIrradianceW: number | null,
  inputRecordIds: string[] = []
): TraceableThermalResult<number> {
  const calculatedAt = new Date().toISOString();
  const calculationId = `utci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const utci = calculateUTCI(tempC, rhPct, windSpeedMs, solarIrradianceW);

  return {
    calculationId,
    method: 'Standard UTCI polynomial approximation based on the COST Action 730 / UTCI framework (with documented MRT approximation)',
    inputRecordIds,
    calculatedAt,
    output: utci,
    unit: '°C',
    validationStatus: utci !== null ? 'VALID' : 'INPUT_MISSING',
  };
}

export function calculateTraceableHeatIndex(
  tempC: number | null,
  rhPct: number | null,
  inputRecordIds: string[] = []
): TraceableThermalResult<number> {
  const calculatedAt = new Date().toISOString();
  const calculationId = `hi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const hi = calculateHeatIndex(tempC, rhPct);

  return {
    calculationId,
    method: 'NOAA NWS Rothfusz / Steadman Heat Index Polynomial',
    inputRecordIds,
    calculatedAt,
    output: hi,
    unit: '°C',
    validationStatus: hi !== null ? 'VALID' : 'INPUT_MISSING',
  };
}

/**
 * Categorizes risk level based on WBGT / UTCI thresholds and ambient temperature context
 */
export function categorizeThermalStress(
  wbgt: number | null,
  utci: number | null,
  tempC?: number | null
): RiskLevel {
  if (wbgt === null || utci === null) return 'Low';

  // Extreme: WBGT >= 32.0 or (UTCI >= 42 and ambient >= 32)
  if (wbgt >= 32 || (utci >= 42 && (tempC === undefined || tempC === null || tempC >= 32))) return 'Extreme';
  // High: WBGT >= 29.0 or (UTCI >= 38 and ambient >= 28)
  if (wbgt >= 29 || (utci >= 38 && (tempC === undefined || tempC === null || tempC >= 28))) return 'High';
  // Moderate: WBGT >= 26.0 or (UTCI >= 32 and ambient >= 25)
  if (wbgt >= 26 || (utci >= 32 && (tempC === undefined || tempC === null || tempC >= 24))) return 'Moderate';
  return 'Low';
}

/**
 * Calculates a unified citizen risk score (0-100) from thermal hazard, vulnerability, and exposure
 */
export function calculateCompositeRiskScore(
  wbgt: number | null,
  utci: number | null,
  vulnerabilityIndex: number,
  hourOfDay: number,
  uhiOffset: number
): { score: number; level: RiskLevel } {
  if (wbgt === null || utci === null) {
    return { score: 10, level: 'Low' };
  }

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
export function getThermalCitizenExplanation(level: RiskLevel, wbgt: number | null, utci: number | null): {
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
