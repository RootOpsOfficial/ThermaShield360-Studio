import { RawProviderPayload } from '../../types.js';
import { NasaPowerRawData } from './nasaPowerTypes.js';
import { calculateHaversineDistanceKm } from '../../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../../clientUtils.js';

export async function fetchNasaPowerRaw(
  lat: number,
  lng: number
): Promise<RawProviderPayload<NasaPowerRawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('nasaPower', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<NasaPowerRawData>;
  }

  // NASA POWER provides hourly solar and surface meteorology with 2-3 day reanalysis latency
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 3);
  const yyyymmdd = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
  const endpoint = `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=T2M,RH2M,ALLSKY_SFC_SW_DWN,PS,WS10M&community=RE&longitude=${lng}&latitude=${lat}&format=JSON&start=${yyyymmdd}&end=${yyyymmdd}`;
  const startTime = Date.now();

  const gridLat = Math.round(lat * 2) / 2;
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
        provider: 'NASA POWER',
        providerId: 'nasaPower',
        sourceUrl: endpoint,
        model: 'MERRA-2 / GEOS-5.12.4',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: `NASA POWER HTTP ${response.status}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: '0.5 x 0.625 deg',
      });
    }

    const parseResult = await safeParseJson<any>(response);
    if (!parseResult.ok) {
      return createUnavailablePayload({
        provider: 'NASA POWER',
        providerId: 'nasaPower',
        sourceUrl: endpoint,
        model: 'MERRA-2 / GEOS-5.12.4',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: parseResult.error,
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: '0.5 x 0.625 deg',
      });
    }

    const json = parseResult.data;
    const props = json.properties?.parameter || {};
    const t2mMap = props.T2M || {};
    const rh2mMap = props.RH2M || {};
    const solMap = props.ALLSKY_SFC_SW_DWN || {};
    const psMap = props.PS || {};
    const wsMap = props.WS10M || {};

    const keys = Object.keys(t2mMap);
    const currentUtcHour = new Date().getUTCHours();
    const targetKey = `${yyyymmdd}${String(currentUtcHour).padStart(2, '0')}`;
    const selectedKey =
      targetKey in t2mMap && t2mMap[targetKey] !== -999
        ? targetKey
        : keys.find((k) => t2mMap[k] !== -999) || keys[keys.length - 1] || '';

    const rawTemp = selectedKey && t2mMap[selectedKey] !== -999 ? t2mMap[selectedKey] : null;

    // A LIVE provider must return a valid, parseable payload containing the requested variable
    if (rawTemp === null || typeof rawTemp !== 'number' || isNaN(rawTemp)) {
      return createUnavailablePayload({
        provider: 'NASA POWER',
        providerId: 'nasaPower',
        sourceUrl: endpoint,
        model: 'MERRA-2 / GEOS-5.12.4',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: 'Payload missing valid temperature parameter (T2M)',
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'NEAREST',
        spatialDistanceKm: distKm,
        resolution: '0.5 x 0.625 deg',
      });
    }

    const validTime = selectedKey
      ? new Date(
          Date.UTC(
            parseInt(selectedKey.slice(0, 4)),
            parseInt(selectedKey.slice(4, 6)) - 1,
            parseInt(selectedKey.slice(6, 8)),
            parseInt(selectedKey.slice(8, 10)) || 0
          )
        ).toISOString()
      : targetDate.toISOString();

    const rawRh = selectedKey && rh2mMap[selectedKey] !== -999 ? rh2mMap[selectedKey] : null;
    const rawSolar = selectedKey && solMap[selectedKey] !== undefined && solMap[selectedKey] !== -999 ? solMap[selectedKey] : null;
    const currentSolar = typeof rawSolar === 'number' && rawSolar < 0 ? 0 : rawSolar;
    const rawPs = selectedKey && psMap[selectedKey] !== -999 ? psMap[selectedKey] * 10 : null; // kPa to hPa
    const currentWs = selectedKey && wsMap[selectedKey] !== -999 ? wsMap[selectedKey] : null;

    const isDegraded = rawRh === null || rawSolar === null || rawPs === null || currentWs === null;
    const availability: DataAvailabilityStatus = isDegraded ? 'DEGRADED' : 'LIVE';

    const rawData: NasaPowerRawData = {
      parameters: props,
      header: json.header,
      currentSample: {
        temperatureC: Math.round(rawTemp * 10) / 10,
        relativeHumidityPct: typeof rawRh === 'number' ? Math.round(rawRh) : (null as any),
        solarIrradianceWm2: typeof currentSolar === 'number' ? Math.round(currentSolar) : (null as any),
        surfacePressureHpa: typeof rawPs === 'number' ? Math.round(rawPs * 10) / 10 : (null as any),
        windSpeedMs: typeof currentWs === 'number' ? Math.round(currentWs * 10) / 10 : (null as any),
      },
    };

    return {
      provider: 'NASA POWER',
      providerId: 'nasaPower',
      sourceUrl: endpoint,
      model: 'MERRA-2 / GEOS-5.12.4',
      run: yyyymmdd,
      issuedAt: targetDate.toISOString(),
      validTime,
      forecastLeadHours: 0,
      resolution: '0.5 x 0.625 deg',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: distKm,
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      responseTimeMs,
      dataType: 'REANALYSIS',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      availability,
      isFallback: false,
      errorMessage: isDegraded ? 'NASA POWER sample has partial variable coverage' : null,
      rawData,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'NASA POWER',
      providerId: 'nasaPower',
      sourceUrl: endpoint,
      model: 'MERRA-2 / GEOS-5.12.4',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      errorMessage: err.message || 'Connection failure',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: distKm,
      resolution: '0.5 x 0.625 deg',
    });
  }
}
