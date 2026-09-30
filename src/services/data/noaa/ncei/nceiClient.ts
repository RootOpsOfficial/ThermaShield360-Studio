import { RawProviderPayload } from '../../types.js';
import { NoaaNceiRawData } from './nceiTypes.js';
import { calculateHaversineDistanceKm } from '../../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../../clientUtils.js';

/** Half-width of the station-search bounding box in degrees (~55 km) */
const NCEI_BBOX_HALF_DEG = 0.5;
/** Historic lookback window for climatological derivation */
const NCEI_LOOKBACK_YEARS = 3;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * NOAA NCEI (GHCN-Daily via CDO v2) — HISTORICAL station observations & climatology.
 *
 * IMPORTANT DATA SEMANTICS:
 * NCEI GHCN-Daily is a HISTORICAL archive. For many regions (including most Indian
 * GHCN stations) the record ends decades ago. This adapter therefore:
 *   1. Resolves the nearest real station from the provider (no hardcoded station id).
 *   2. Requests the most recent available window.
 *   3. Derives climatological statistics ONLY from observations actually returned.
 *   4. Reports NOT_AVAILABLE honestly when the provider has no data for the window,
 *      instead of fabricating statistics.
 * It must never be presented as live current weather.
 */
export async function fetchNoaaNceiRaw(
  lat: number,
  lng: number
): Promise<RawProviderPayload<NoaaNceiRawData>> {
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('noaaNcei', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<NoaaNceiRawData>;
  }

  const token = process.env.NOAA_NCEI_TOKEN;
  const searchEndpoint = 'https://www.ncei.noaa.gov/cdo-web/api/v2/stations';
  const startTime = Date.now();

  const south = (lat - NCEI_BBOX_HALF_DEG).toFixed(4);
  const north = (lat + NCEI_BBOX_HALF_DEG).toFixed(4);
  const west = (lng - NCEI_BBOX_HALF_DEG).toFixed(4);
  const east = (lng + NCEI_BBOX_HALF_DEG).toFixed(4);
  const extent = `${south},${west},${north},${east}`;

  const nowYear = new Date().getUTCFullYear();
  const windowEnd = new Date().toISOString().split('T')[0];
  const windowStart = `${nowYear - NCEI_LOOKBACK_YEARS}-01-01`;

  if (!token) {
    return createUnavailablePayload({
      provider: 'NOAA NCEI',
      providerId: 'noaaNcei',
      sourceUrl: searchEndpoint,
      model: 'GHCN-Daily',
      availability: 'AUTH_ERROR',
      httpStatus: 401,
      responseTimeMs: 0,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'OBSERVATION',
      errorMessage: 'NOAA_NCEI_TOKEN not configured in server environment',
      latitude: lat,
      longitude: lng,
      sourceLatitude: lat,
      sourceLongitude: lng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: 0,
      resolution: 'Point station observation',
    });
  }


  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

    // STEP 1: resolve the nearest real GHCN-Daily station via bounding box
    const searchRes = await fetch(
      `${searchEndpoint}?datasetid=GHCND&extent=${extent}&limit=5`,
      { headers: { token }, signal: controller.signal }
    );
    clearTimeout(timeout);
    const searchTimeMs = Date.now() - startTime;

    if (!searchRes.ok) {
      const avail = categorizeHttpStatus(searchRes.status);
      return createUnavailablePayload({
        provider: 'NOAA NCEI',
        providerId: 'noaaNcei',
        sourceUrl: searchEndpoint,
        model: 'GHCN-Daily',
        availability: avail,
        httpStatus: searchRes.status,
        responseTimeMs: searchTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OBSERVATION',
        errorMessage: `NOAA NCEI CDO station search returned HTTP ${searchRes.status}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: lat,
        sourceLongitude: lng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: 0,
        resolution: 'Point station observation',
      });
    }

    const searchParse = await safeParseJson<any>(searchRes);
    if (!searchParse.ok) {
      return createUnavailablePayload({
        provider: 'NOAA NCEI',
        providerId: 'noaaNcei',
        sourceUrl: searchEndpoint,
        model: 'GHCN-Daily',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs: searchTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OBSERVATION',
        errorMessage: searchParse.error,
        latitude: lat,
        longitude: lng,
        sourceLatitude: lat,
        sourceLongitude: lng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: 0,
        resolution: 'Point station observation',
      });
    }

    const stations: any[] = Array.isArray(searchParse.data?.results) ? searchParse.data.results : [];
    if (stations.length === 0) {
      return createUnavailablePayload({
        provider: 'NOAA NCEI',
        providerId: 'noaaNcei',
        sourceUrl: searchEndpoint,
        model: 'GHCN-Daily',
        availability: 'NOT_AVAILABLE',
        httpStatus: 200,
        responseTimeMs: searchTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OBSERVATION',
        errorMessage: `No GHCN-Daily station found within ~${Math.round(NCEI_BBOX_HALF_DEG * 111)} km`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: lat,
        sourceLongitude: lng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: 0,
        resolution: 'Point station observation',
      });
    }

    // Choose the closest station to the requested point
    let best: any = stations[0];
    let bestDist = Infinity;
    for (const s of stations) {
      if (typeof s?.latitude !== 'number' || typeof s?.longitude !== 'number') continue;
      const d = calculateHaversineDistanceKm(lat, lng, s.latitude, s.longitude);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    const stationId: string = best.id;
    const stationLat: number = typeof best.latitude === 'number' ? best.latitude : lat;
    const stationLng: number = typeof best.longitude === 'number' ? best.longitude : lng;
    const stationName: string = best.name || stationId;
    const distKm = calculateHaversineDistanceKm(lat, lng, stationLat, stationLng);

    // STEP 2: request the actual daily observations for the window
    const dataUrl =
      `https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=${encodeURIComponent(stationId)}` +
      `&startdate=${windowStart}&enddate=${windowEnd}&datatypeid=TMAX,TMIN&units=metric&limit=1000`;

    const maxes: number[] = [];
    const mins: number[] = [];
    let dataHttpStatus = 200;

    try {
      const dataRes = await fetch(dataUrl, {
        headers: { token },
        signal: AbortSignal.timeout(PROVIDER_REQUEST_TIMEOUT_MS),
      });
      dataHttpStatus = dataRes.status;
      if (dataRes.ok) {
        const dataJson: any = await dataRes.json();
        const rows: any[] = Array.isArray(dataJson?.results) ? dataJson.results : [];
        for (const r of rows) {
          const v = typeof r?.value === 'number' ? r.value : parseFloat(r?.value);
          if (v === null || v === undefined || isNaN(v)) continue;
          if (r?.datatype === 'TMAX') maxes.push(v);
          else if (r?.datatype === 'TMIN') mins.push(v);
        }
      }
    } catch {
      // Non-fatal — reported honestly via the hasObservations branch below
    }

    const responseTimeMs = Date.now() - startTime;
    const hasObservations = maxes.length > 0 || mins.length > 0;

    if (!hasObservations) {
      // Station exists but the archive contains no recent observation for the window.
      // Report this honestly as NOT_AVAILABLE while preserving station identity.
      const avail: DataAvailabilityStatus =
        dataHttpStatus === 401 || dataHttpStatus === 403
          ? 'AUTH_ERROR'
          : dataHttpStatus === 429
          ? 'RATE_LIMITED'
          : 'NOT_AVAILABLE';

      return createUnavailablePayload({
        provider: 'NOAA NCEI',
        providerId: 'noaaNcei',
        sourceUrl: dataUrl,
        model: 'GHCN-Daily',
        availability: avail,
        httpStatus: dataHttpStatus,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OBSERVATION',
        errorMessage: `GHCN-Daily station ${stationId} returned no observations for ${windowStart}..${windowEnd}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: stationLat,
        sourceLongitude: stationLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: 'Point station observation',
      });
    }

    // Derive statistics STRICTLY from observations actually returned
    const maxSorted = [...maxes].sort((a, b) => a - b);
    const minSorted = [...mins].sort((a, b) => a - b);
    const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const stdDev = (arr: number[]) => {
      if (arr.length < 2) return 0;
      const m = mean(arr);
      return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
    };
    const r1 = (n: number) => Math.round(n * 10) / 10;

    const rawData: NoaaNceiRawData = {
      datasetId: 'GHCND',
      stationId,
      stationName,
      latitude: stationLat,
      longitude: stationLng,
      elevationMeters: typeof best.elevation === 'number' ? best.elevation : null,
      hasObservations: true,
      windowStart,
      windowEnd,
      sampleCount: maxes.length + mins.length,
      climatologicalMaxTempC: maxSorted.length > 0 ? r1(maxSorted[maxSorted.length - 1]) : null,
      climatologicalMinTempC: minSorted.length > 0 ? r1(minSorted[0]) : null,
      normalMaxTempC: maxSorted.length > 0 ? r1(mean(maxSorted)) : null,
      standardDeviationC: maxSorted.length > 1 ? r1(stdDev(maxSorted)) : null,
      percentile90TempC: maxSorted.length > 0 ? r1(percentile(maxSorted, 90)) : null,
      percentile95TempC: maxSorted.length > 0 ? r1(percentile(maxSorted, 95)) : null,
      dataSemantics: 'HISTORICAL_STATION_OBSERVATION',
    };

    return {
      provider: 'NOAA NCEI',
      providerId: 'noaaNcei',
      sourceUrl: dataUrl,
      model: 'GHCN-Daily',
      run: windowStart,
      issuedAt: windowEnd,
      validTime: `${windowEnd}T12:00:00Z`,
      forecastLeadHours: 0,
      resolution: 'Point station observation',
      latitude: lat,
      longitude: lng,
      sourceLatitude: stationLat,
      sourceLongitude: stationLng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: distKm,
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      responseTimeMs,
      dataType: 'HISTORICAL',
      sourceRole: 'OBSERVATION',
      availability: 'LIVE',
      isFallback: false,
      errorMessage: null,
      rawData,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'NOAA NCEI',
      providerId: 'noaaNcei',
      sourceUrl: searchEndpoint,
      model: 'GHCN-Daily',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'OBSERVATION',
      errorMessage: err.message || 'Connection failure',
      latitude: lat,
      longitude: lng,
      sourceLatitude: lat,
      sourceLongitude: lng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: 0,
      resolution: 'Point station observation',
    });
  }
}

