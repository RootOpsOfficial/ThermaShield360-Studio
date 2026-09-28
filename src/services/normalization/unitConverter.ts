/**
 * Scientific Unit Conversion Utilities for ThermaShield 360
 * Standardizes disparate meteorological inputs into canonical units:
 * - Temperature: Celsius (°C)
 * - Humidity: Percentage (0-100%)
 * - Wind Speed: Meters per second (m/s)
 * - Solar Radiation: Watts per square meter (W/m²)
 * - Surface Pressure: Hectopascals (hPa)
 */

export function kelvinToCelsius(kelvin: number): number {
  return Math.round((kelvin - 273.15) * 10) / 10;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round(((fahrenheit - 32) * (5 / 9)) * 10) / 10;
}

export function celsiusToFahrenheit(celsius: number): number {
  return Math.round(((celsius * (9 / 5)) + 32) * 10) / 10;
}

export function kmhToMs(kmh: number): number {
  return Math.round((kmh / 3.6) * 10) / 10;
}

export function knotsToMs(knots: number): number {
  return Math.round((knots * 0.514444) * 10) / 10;
}

export function mphToMs(mph: number): number {
  return Math.round((mph * 0.44704) * 10) / 10;
}

export function msToKmh(ms: number): number {
  return Math.round((ms * 3.6) * 10) / 10;
}

export function paToHpa(pa: number): number {
  return Math.round((pa / 100) * 10) / 10;
}

export function kpaToHpa(kpa: number): number {
  return Math.round((kpa * 10) * 10) / 10;
}

export function inhgToHpa(inhg: number): number {
  return Math.round((inhg * 33.8639) * 10) / 10;
}

export function mjPerM2HrToWm2(mj: number): number {
  // 1 MJ / m² / hour = 1,000,000 Joules / (3600 seconds * m²) ≈ 277.78 W/m²
  return Math.round(mj * 277.7778);
}

/**
 * Calculates Dew Point using the Magnus-Tetens approximation
 * valid for -45°C <= T <= 60°C and 1% <= RH <= 100%
 */
export function calculateDewPoint(tempC: number, rhPercent: number): number {
  const boundedRh = Math.max(1, Math.min(100, rhPercent));
  const a = 17.625;
  const b = 243.04;
  const alpha = Math.log(boundedRh / 100) + (a * tempC) / (b + tempC);
  const dewPoint = (b * alpha) / (a - alpha);
  // Dew point cannot physically exceed dry bulb temperature
  return Math.min(tempC, Math.round(dewPoint * 10) / 10);
}

/**
 * Estimates relative humidity when temperature and dew point are known
 */
export function calculateRhFromDewPoint(tempC: number, dewPointC: number): number {
  const effectiveDp = Math.min(tempC, dewPointC);
  const a = 17.625;
  const b = 243.04;
  const actualVaporPressure = 6.112 * Math.exp((a * effectiveDp) / (b + effectiveDp));
  const saturationVaporPressure = 6.112 * Math.exp((a * tempC) / (b + tempC));
  const rh = (actualVaporPressure / saturationVaporPressure) * 100;
  return Math.max(0, Math.min(100, Math.round(rh)));
}

/**
 * Calculates Great Circle distance between two coordinates in kilometers using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

