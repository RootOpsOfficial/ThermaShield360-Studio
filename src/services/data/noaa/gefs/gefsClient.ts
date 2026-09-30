import { RawProviderPayload } from '../../types.js';
import { NoaaGefsRawData, GefsMemberData } from './gefsTypes.js';
import { calculateHaversineDistanceKm } from '../../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../../clientUtils.js';

export async function fetchNoaaGefsRaw(
  lat: number,
  lng: number
): Promise<RawProviderPayload<NoaaGefsRawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('noaaGefs', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<NoaaGefsRawData>;
  }

  // NOAA GEFS 0.5° 30-member global ensemble
  const endpoint = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lng}&models=gfs05&hourly=temperature_2m&forecast_days=7&timezone=auto`;
  const startTime = Date.now();

  const gridLat = Math.round(lat * 2) / 2; // 0.5° grid
  const gridLng = Math.round(lng * 2) / 2;
  const distKm = calculateHaversineDistanceKm(lat, lng, gridLat, gridLng);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, { signal: controller.signal });
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const avail = categorizeHttpStatus(response.status);
      return createUnavailablePayload({
        provider: 'NOAA GEFS',
        providerId: 'noaaGefs',
        sourceUrl: endpoint,
        model: 'GEFS-30',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'ENSEMBLE',
        errorMessage: `NOAA GEFS ensemble API HTTP ${response.status}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: '0.5 deg (~55km)',
      });
    }

    const parseResult = await safeParseJson<any>(response);
    if (!parseResult.ok) {
      return createUnavailablePayload({
        provider: 'NOAA GEFS',
        providerId: 'noaaGefs',
        sourceUrl: endpoint,
        model: 'GEFS-30',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'ENSEMBLE',
        errorMessage: parseResult.error,
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: '0.5 deg (~55km)',
      });
    }

    const json = parseResult.data;
    if (json.error) {
      return createUnavailablePayload({
        provider: 'NOAA GEFS',
        providerId: 'noaaGefs',
        sourceUrl: endpoint,
        model: 'GEFS-30',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'ENSEMBLE',
        errorMessage: json.reason || 'GEFS API returned error',
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: '0.5 deg (~55km)',
      });
    }

    const currentHourIndex = new Date().getHours();
    const hourly = json.hourly || {};
    const validTime = hourly.time?.[currentHourIndex]
      ? new Date(hourly.time[currentHourIndex]).toISOString()
      : new Date().toISOString();

    const now = new Date();
    const utcHour = now.getUTCHours();
    const cycleHour = Math.floor(utcHour / 6) * 6;
    const runTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), cycleHour, 0, 0)).toISOString();

    // Extract actual members
    const memberKeys = Object.keys(hourly).filter((k) => k.startsWith('temperature_2m_member'));
    const members: GefsMemberData[] = [];
    const memberTemps: number[] = [];

    memberKeys.forEach((key) => {
      const val = hourly[key]?.[currentHourIndex];
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        const rounded = Math.round(val * 10) / 10;
        memberTemps.push(rounded);
        members.push({
          memberId: key.replace('temperature_2m_', ''),
          runTime,
          validTime,
          variable: 'temperature_2m',
          value: rounded,
          source: 'NOAA GEFS',
          model: 'GEFS-0.5',
        });
      }
    });

    if (memberTemps.length === 0) {
      return createUnavailablePayload({
        provider: 'NOAA GEFS',
        providerId: 'noaaGefs',
        sourceUrl: endpoint,
        model: 'GEFS-30',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'ENSEMBLE',
        errorMessage: 'No valid ensemble member temperatures parsed from GEFS feed',
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: '0.5 deg (~55km)',
      });
    }

    // Mathematical ensemble metrics derived strictly from actual members
    memberTemps.sort((a, b) => a - b);
    const n = memberTemps.length;
    const minTemp = memberTemps[0];
    const maxTemp = memberTemps[n - 1];
    const meanTemp = Math.round((memberTemps.reduce((a, b) => a + b, 0) / n) * 10) / 10;

    // Real ensemble spread (sample standard deviation across members)
    const variance = memberTemps.reduce((acc, t) => acc + Math.pow(t - meanTemp, 2), 0) / (n - 1 || 1);
    const ensembleSpread = Math.round(Math.sqrt(variance) * 10) / 10;

    // Quantiles
    const p10 = memberTemps[Math.floor(n * 0.1)] ?? minTemp;
    const p50 = memberTemps[Math.floor(n * 0.5)] ?? meanTemp;
    const p90 = memberTemps[Math.floor(n * 0.9)] ?? maxTemp;

    // Heatwave exceedance: percentage of members with T >= 40.0°C
    const exceedanceCount = memberTemps.filter((t) => t >= 40.0).length;
    const exceedancePct = Math.round((exceedanceCount / n) * 100);

    const rawData: NoaaGefsRawData = {
      model: 'GEFS-Global-Ensemble',
      ensembleMemberCount: n,
      run: runTime,
      issuedAt: runTime,
      validTime,
      leadHours: currentHourIndex,
      latitude: gridLat,
      longitude: gridLng,
      ensembleMeanTempC: meanTemp,
      ensembleSpreadDegC: ensembleSpread,
      ensembleP10TempC: p10,
      ensembleP50TempC: p50,
      ensembleP90TempC: p90,
      ensembleMaxTempC: maxTemp,
      ensembleMinTempC: minTemp,
      heatwaveExceedanceProbabilityPct: exceedancePct,
      relativeHumidityMeanPct: null, // Strictly null: no hardcoded constants
      windSpeedMeanMs: null,         // Strictly null: no hardcoded constants
      members,
      sourceUrl: endpoint,
    };

    return {
      provider: 'NOAA GEFS',
      providerId: 'noaaGefs',
      sourceUrl: endpoint,
      model: 'GEFS-30',
      run: runTime,
      issuedAt: runTime,
      validTime,
      forecastLeadHours: currentHourIndex,
      resolution: '0.5 deg (~55km)',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: distKm,
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      responseTimeMs,
      dataType: 'ENSEMBLE',
      sourceRole: 'ENSEMBLE',
      availability: 'LIVE',
      isFallback: false,
      errorMessage: null,
      rawData,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'NOAA GEFS',
      providerId: 'noaaGefs',
      sourceUrl: endpoint,
      model: 'GEFS-30',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'ENSEMBLE',
      errorMessage: err.message || 'Connection failure',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: distKm,
      resolution: '0.5 deg (~55km)',
    });
  }
}
