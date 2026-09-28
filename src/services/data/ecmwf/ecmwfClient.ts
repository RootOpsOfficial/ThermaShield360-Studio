import { RawProviderPayload } from '../types.js';
import { EcmwfRawData } from './ecmwfTypes.js';
import { calculateHaversineDistanceKm } from '../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../clientUtils.js';

export async function fetchEcmwfRaw(
  lat: number = 18.5204,
  lng: number = 73.8567
): Promise<RawProviderPayload<EcmwfRawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('ecmwf', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<EcmwfRawData>;
  }

  // ECMWF IFS 0.25° run via ECMWF Open Data / Open-Meteo ECMWF gateway
  const endpoint = `https://api.open-meteo.com/v1/ecmwf?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,dew_point_2m,direct_normal_irradiance&forecast_days=7&timezone=auto`;
  const startTime = Date.now();

  // 0.25° ECMWF IFS grid center
  const gridLat = Math.round(lat * 4) / 4;
  const gridLng = Math.round(lng * 4) / 4;
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
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: endpoint,
        model: 'IFS-0.25',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: `ECMWF Open Data gateway HTTP ${response.status}: ${response.statusText}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: distKm,
        resolution: '0.25 deg (~28km)',
      });
    }

    const parseResult = await safeParseJson<any>(response);
    if (!parseResult.ok) {
      return createUnavailablePayload({
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: endpoint,
        model: 'IFS-0.25',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: parseResult.error,
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: distKm,
        resolution: '0.25 deg (~28km)',
      });
    }

    const json = parseResult.data;
    if (json.error) {
      return createUnavailablePayload({
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: endpoint,
        model: 'IFS-0.25',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: json.reason || 'ECMWF API returned error',
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: distKm,
        resolution: '0.25 deg (~28km)',
      });
    }

    const currentHourIndex = new Date().getHours();
    const temp = json.hourly?.temperature_2m?.[currentHourIndex];

    // A LIVE provider must return a valid, parseable payload containing the requested variable
    if (typeof temp !== 'number' || isNaN(temp)) {
      return createUnavailablePayload({
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: endpoint,
        model: 'IFS-0.25',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'Payload missing valid hourly temperature_2m data',
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: distKm,
        resolution: '0.25 deg (~28km)',
      });
    }

    const rh = json.hourly?.relative_humidity_2m?.[currentHourIndex];
    const dp = json.hourly?.dew_point_2m?.[currentHourIndex];
    const sp = json.hourly?.surface_pressure?.[currentHourIndex];
    const rawWs = json.hourly?.wind_speed_10m?.[currentHourIndex];
    const ws = typeof rawWs === 'number' ? rawWs / 3.6 : null; // km/h to m/s
    const rawSolar = json.hourly?.direct_normal_irradiance?.[currentHourIndex];
    const solar = typeof rawSolar === 'number' && !isNaN(rawSolar) ? Math.round(rawSolar) : null;

    const hasRh = typeof rh === 'number';
    const hasWs = typeof ws === 'number';
    const hasSp = typeof sp === 'number';
    const isDegraded = !hasRh || !hasWs || !hasSp;
    const availability: DataAvailabilityStatus = isDegraded ? 'DEGRADED' : 'LIVE';

    const now = new Date();
    // ECMWF runs are 00z and 12z
    const runHour = now.getUTCHours() >= 12 ? 12 : 0;
    const runTimestamp = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), runHour, 0, 0)).toISOString();
    const validTime = json.hourly?.time?.[currentHourIndex]
      ? new Date(json.hourly.time[currentHourIndex]).toISOString()
      : now.toISOString();

    const rawData: EcmwfRawData = {
      model: 'IFS',
      run: runTimestamp,
      gridResolution: '0.25 deg (~28km)',
      latitude: gridLat,
      longitude: gridLng,
      forecastLeadHours: currentHourIndex,
      temperature_2m: Math.round(temp * 10) / 10,
      relative_humidity_2m: hasRh ? Math.round(rh) : (null as any),
      dew_point_2m: typeof dp === 'number' ? Math.round(dp * 10) / 10 : (null as any),
      surface_pressure_hpa: hasSp ? Math.round(sp * 10) / 10 : (null as any),
      wind_speed_10m_ms: hasWs ? Math.round(ws * 10) / 10 : (null as any),
      solar_radiation_wm2: solar,
      ensembleMemberCount: 51,
      openDataBucketUrl: 's3://ecmwf-open-data/',
      hourlyForecast: {
        time: json.hourly?.time?.slice(0, 24) || [],
        temperature_2m: json.hourly?.temperature_2m?.slice(0, 24) || [],
        relative_humidity_2m: json.hourly?.relative_humidity_2m?.slice(0, 24) || [],
        wind_speed_10m: json.hourly?.wind_speed_10m?.slice(0, 24) || [],
      },
    };

    return {
      provider: 'ECMWF IFS',
      providerId: 'ecmwf',
      sourceUrl: endpoint,
      model: 'IFS-0.25',
      run: runTimestamp,
      issuedAt: runTimestamp,
      validTime,
      forecastLeadHours: currentHourIndex,
      resolution: '0.25 deg (~28km)',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'BILINEAR',
      spatialDistanceKm: distKm,
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      responseTimeMs,
      dataType: 'FORECAST',
      sourceRole: 'OPERATIONAL_FORECAST',
      availability,
      isFallback: false,
      errorMessage: isDegraded ? 'Payload has partial variable coverage' : null,
      rawData,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'ECMWF IFS',
      providerId: 'ecmwf',
      sourceUrl: endpoint,
      model: 'IFS-0.25',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'OPERATIONAL_FORECAST',
      errorMessage: err.message || 'Connection failure',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: distKm,
      resolution: '0.25 deg (~28km)',
    });
  }
}
