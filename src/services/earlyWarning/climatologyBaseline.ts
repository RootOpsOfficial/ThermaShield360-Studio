/**
 * ThermaShield 360 — Climatological Baseline Service
 *
 * Provides REAL, verifiable monthly climatology for any requested coordinate from the
 * NASA POWER Climatology API (MERRA-2 / POWER Source Native Resolution,
 * 20-year monthly climatology: January 2001 – December 2020). No API key required.
 *
 * WHY THIS EXISTS
 * ---------------
 * Operational heatwave forecasts (ECMWF IFS / NOAA GFS / GEFS ensembles) only carry skill
 * out to roughly 10–16 days. Beyond that lead time no honest day-level heatwave prediction
 * is possible. Instead of fabricating long-range "arrival windows", the early-warning ladder
 * reports the location's REAL 20-year climatological heat season (e.g. the pre-monsoon
 * March–May build-up for Deccan interior locations) and labels it clearly as CLIMATOLOGY.
 *
 * DATA SEMANTICS: REANALYSIS / CLIMATOLOGY. This is a baseline, never a forecast.
 *
 * FAILURE BEHAVIOUR: on any provider failure the baseline is returned with
 * `available: false` and strict NULLs — never a substituted or invented value.
 */

import { PROVIDER_REQUEST_TIMEOUT_MS, safeParseJson } from '../data/clientUtils.js';

const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export interface MonthlyClimatologicalNormal {
  monthKey: string;      // 'JAN'
  monthIndex: number;    // 0 = January
  monthLabel: string;    // 'January'
  normalMaxTempC: number | null;
  normalMeanTempC: number | null;
  normalRhPct: number | null;
}

export interface ClimatologyBaseline {
  available: boolean;
  status: 'LIVE' | 'PARTIAL' | 'NOT_AVAILABLE';
  source: string;
  provider: string;
  dataset: string;
  referencePeriod: string;
  spatialResolution: string;
  latitude: number;
  longitude: number;
  sourceLatitude: number | null;
  sourceLongitude: number | null;
  retrievedAt: string;
  dataType: 'REANALYSIS';
  monthlyNormals: MonthlyClimatologicalNormal[];
  /** Warmest month across the 20-year record for this grid cell */
  annualPeakMonth: string | null;
  annualPeakNormalMaxC: number | null;
  /** Month keys whose 20-year normal daily maximum reaches the heatwave threshold */
  heatProneMonthKeys: string[];
  errorMessage: string | null;
}

const cache: Map<string, { timestamp: number; baseline: ClimatologyBaseline }> = new Map();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours — climatology changes on decade timescales

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function buildEmptyClimatologyBaseline(lat: number, lng: number, message: string): ClimatologyBaseline {
  return {
    available: false,
    status: 'NOT_AVAILABLE',
    source: 'NASA POWER Climatology',
    provider: 'NASA POWER (Prediction Of Worldwide Energy Resources)',
    dataset: 'POWER Monthly Climatology (MERRA-2 assimilated)',
    referencePeriod: 'January 2001 – December 2020',
    spatialResolution: '0.5 x 0.625 deg',
    latitude: lat,
    longitude: lng,
    sourceLatitude: null,
    sourceLongitude: null,
    retrievedAt: new Date().toISOString(),
    dataType: 'REANALYSIS',
    monthlyNormals: MONTH_KEYS.map((monthKey, monthIndex) => ({
      monthKey,
      monthIndex,
      monthLabel: MONTH_LABELS[monthIndex],
      normalMaxTempC: null,
      normalMeanTempC: null,
      normalRhPct: null,
    })),
    annualPeakMonth: null,
    annualPeakNormalMaxC: null,
    heatProneMonthKeys: [],
    errorMessage: message,
  };
}

/**
 * Fetch the real 20-year monthly climatology for a coordinate.
 *
 * @param lat                  requested latitude
 * @param lng                  requested longitude
 * @param heatwaveThresholdC   threshold (°C) at/above which a month is flagged heat-prone
 */
export async function fetchClimatologyBaseline(
  lat: number,
  lng: number,
  heatwaveThresholdC: number
): Promise<ClimatologyBaseline> {
  const cacheKey = `${lat.toFixed(2)}:${lng.toFixed(2)}:${heatwaveThresholdC}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.baseline;
  }

  const endpoint =
    `https://power.larc.nasa.gov/api/temporal/climatology/point` +
    `?parameters=T2M,T2M_MAX,RH2M&community=RE` +
    `&longitude=${lng}&latitude=${lat}&format=JSON`;

  const store = (baseline: ClimatologyBaseline): ClimatologyBaseline => {
    cache.set(cacheKey, { timestamp: Date.now(), baseline });
    return baseline;
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return store(buildEmptyClimatologyBaseline(lat, lng, `NASA POWER climatology HTTP ${response.status}`));
    }

    const parsed = await safeParseJson<any>(response);
    if (!parsed.ok) {
      return store(buildEmptyClimatologyBaseline(lat, lng, parsed.error));
    }

    const json = parsed.data;
    const params = json?.properties?.parameter;
    const t2mMax = params?.T2M_MAX;
    if (!t2mMax || typeof t2mMax !== 'object') {
      return store(
        buildEmptyClimatologyBaseline(lat, lng, 'NASA POWER climatology response contained no T2M_MAX monthly normals')
      );
    }

    const t2m = params?.T2M || {};
    const rh2m = params?.RH2M || {};

    const monthlyNormals: MonthlyClimatologicalNormal[] = MONTH_KEYS.map((monthKey, monthIndex) => {
      const rawMax = numOrNull(t2mMax[monthKey]);
      const rawMean = numOrNull(t2m[monthKey]);
      const rawRh = numOrNull(rh2m[monthKey]);
      return {
        monthKey,
        monthIndex,
        monthLabel: MONTH_LABELS[monthIndex],
        normalMaxTempC: rawMax !== null ? round1(rawMax) : null,
        normalMeanTempC: rawMean !== null ? round1(rawMean) : null,
        normalRhPct: rawRh !== null && rawRh >= 0 ? Math.round(rawRh) : null,
      };
    });

    const withNormals = monthlyNormals.filter((m) => m.normalMaxTempC !== null);
    if (withNormals.length === 0) {
      return store(buildEmptyClimatologyBaseline(lat, lng, 'NASA POWER climatology returned no usable monthly normals'));
    }

    const heatProneMonthKeys = withNormals
      .filter((m) => (m.normalMaxTempC as number) >= heatwaveThresholdC)
      .map((m) => m.monthKey);

    const peak = withNormals.reduce((best, m) =>
      (m.normalMaxTempC as number) > (best.normalMaxTempC as number) ? m : best
    );

    const coords = json?.geometry?.coordinates;
    const sourceLatitude = Array.isArray(coords) && typeof coords[1] === 'number' ? coords[1] : null;
    const sourceLongitude = Array.isArray(coords) && typeof coords[0] === 'number' ? coords[0] : null;

    return store({
      available: true,
      status: withNormals.length === 12 ? 'LIVE' : 'PARTIAL',
      source: 'NASA POWER Climatology',
      provider: 'NASA POWER (Prediction Of Worldwide Energy Resources)',
      dataset: 'POWER Monthly Climatology (MERRA-2 assimilated)',
      referencePeriod: json?.header?.range || '20-year Meteorological Monthly Climatologies (2001–2020)',
      spatialResolution: '0.5 x 0.625 deg',
      latitude: lat,
      longitude: lng,
      sourceLatitude,
      sourceLongitude,
      retrievedAt: new Date().toISOString(),
      dataType: 'REANALYSIS',
      monthlyNormals,
      annualPeakMonth: peak.monthLabel,
      annualPeakNormalMaxC: peak.normalMaxTempC,
      heatProneMonthKeys,
      errorMessage: null,
    });
  } catch (err: any) {
    const message =
      err?.name === 'AbortError' ? 'NASA POWER climatology request timed out' : err?.message || 'Connection failure';
    return store(buildEmptyClimatologyBaseline(lat, lng, message));
  }
}
