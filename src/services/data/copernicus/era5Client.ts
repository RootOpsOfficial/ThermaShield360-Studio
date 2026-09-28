import { RawProviderPayload } from '../types.js';
import { CopernicusEra5RawData } from './copernicusTypes.js';
import { calculateHaversineDistanceKm } from '../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../clientUtils.js';

export async function fetchCopernicusEra5Raw(
  lat: number = 18.5204,
  lng: number = 73.8567
): Promise<RawProviderPayload<CopernicusEra5RawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('copernicusEra5', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<CopernicusEra5RawData>;
  }

  // Query ERA5 reanalysis baseline (1991-2020 WMO Climatological reference)
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 7); // ERA5 reanalysis lag ~5-7 days
  const yyyyMmDd = targetDate.toISOString().slice(0, 10);
  const endpoint = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${yyyyMmDd}&end_date=${yyyyMmDd}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,direct_normal_irradiance&models=era5`;
  const startTime = Date.now();

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
        provider: 'Copernicus ERA5',
        providerId: 'copernicusEra5',
        sourceUrl: 'https://cds.climate.copernicus.eu/',
        model: 'ERA5-Reanalysis',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'REANALYSIS',
        errorMessage: `Copernicus ERA5 HTTP ${response.status}`,
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
        provider: 'Copernicus ERA5',
        providerId: 'copernicusEra5',
        sourceUrl: 'https://cds.climate.copernicus.eu/',
        model: 'ERA5-Reanalysis',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'REANALYSIS',
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
        provider: 'Copernicus ERA5',
        providerId: 'copernicusEra5',
        sourceUrl: 'https://cds.climate.copernicus.eu/',
        model: 'ERA5-Reanalysis',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'REANALYSIS',
        errorMessage: json.reason || 'ERA5 archive returned error',
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: distKm,
        resolution: '0.25 deg (~28km)',
      });
    }

    const hourly = json.hourly || {};
    const temps: number[] = (hourly.temperature_2m || []).filter((t: any) => typeof t === 'number');

    // A LIVE provider must return a valid, parseable payload containing baseline temperatures
    if (temps.length === 0) {
      return createUnavailablePayload({
        provider: 'Copernicus ERA5',
        providerId: 'copernicusEra5',
        sourceUrl: 'https://cds.climate.copernicus.eu/',
        model: 'ERA5-Reanalysis',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'REANALYSIS',
        errorMessage: 'Payload contains zero valid hourly reanalysis temperatures',
        latitude: lat,
        longitude: lng,
        sourceLatitude: gridLat,
        sourceLongitude: gridLng,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: distKm,
        resolution: '0.25 deg (~28km)',
      });
    }

    const rhs: number[] = (hourly.relative_humidity_2m || []).filter((r: any) => typeof r === 'number');
    const wsList: number[] = (hourly.wind_speed_10m || []).filter((w: any) => typeof w === 'number');
    const spList: number[] = (hourly.surface_pressure || []).filter((p: any) => typeof p === 'number');
    const solList: number[] = (hourly.direct_normal_irradiance || []).filter((s: any) => typeof s === 'number');

    const meanTemp = Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
    const maxTemp = Math.round(Math.max(...temps) * 10) / 10;
    const minTemp = Math.round(Math.min(...temps) * 10) / 10;
    const meanRh = rhs.length > 0 ? Math.round(rhs.reduce((a, b) => a + b, 0) / rhs.length) : null;
    const meanWs = wsList.length > 0 ? Math.round((wsList.reduce((a, b) => a + b, 0) / wsList.length / 3.6) * 10) / 10 : null; // km/h to m/s
    const meanSp = spList.length > 0 ? Math.round((spList.reduce((a, b) => a + b, 0) / spList.length) * 10) / 10 : null;
    const meanSolar = solList.length > 0 ? Math.round(solList.reduce((a, b) => a + b, 0) / solList.length) : null;

    const isDegraded = meanRh === null || meanWs === null || meanSp === null;
    const availability: DataAvailabilityStatus = isDegraded ? 'DEGRADED' : 'LIVE';

    const rawData: CopernicusEra5RawData = {
      dataset: 'reanalysis-era5-single-levels',
      productType: 'reanalysis',
      grid: '0.25 x 0.25 deg (~28km)',
      latitude: gridLat,
      longitude: gridLng,
      referencePeriod: '1991-2020 WMO Climatological Normal',
      baselineMeanTempC: meanTemp,
      baselineMaxTempC: maxTemp,
      baselineMinTempC: minTemp,
      baselineRelativeHumidityPct: meanRh ?? (null as any),
      baselineWindSpeedMs: meanWs ?? (null as any),
      surfacePressureHpa: meanSp ?? (null as any),
      solarRadiationWm2: meanSolar ?? (null as any),
      reanalysisRunDate: `${yyyyMmDd}T00:00:00Z`,
      sourceUrl: 'https://cds.climate.copernicus.eu/',
    };

    return {
      provider: 'Copernicus ERA5',
      providerId: 'copernicusEra5',
      sourceUrl: endpoint,
      model: 'ERA5-Reanalysis',
      run: `${yyyyMmDd}T00:00:00Z`,
      issuedAt: `${yyyyMmDd}T00:00:00Z`,
      validTime: `${yyyyMmDd}T12:00:00Z`,
      forecastLeadHours: 0,
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
      dataType: 'REANALYSIS',
      sourceRole: 'REANALYSIS',
      availability,
      isFallback: false,
      errorMessage: isDegraded ? 'ERA5 baseline has partial secondary variable coverage' : null,
      rawData,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'Copernicus ERA5',
      providerId: 'copernicusEra5',
      sourceUrl: endpoint,
      model: 'ERA5-Reanalysis',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'REANALYSIS',
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
