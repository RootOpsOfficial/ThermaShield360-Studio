import { RawProviderPayload } from '../../types.js';
import { NasaFirmsRawData } from './firmsTypes.js';
import { DataAvailabilityStatus } from '../../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../../clientUtils.js';

export async function fetchNasaFirmsRaw(
  lat: number = 18.5204,
  lng: number = 73.8567
): Promise<RawProviderPayload<NasaFirmsRawData>> {
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('nasaFirms', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<NasaFirmsRawData>;
  }

  const mapKey = process.env.NASA_FIRMS_MAP_KEY;
  const endpoint = `https://firms.modaps.eosdis.nasa.gov/api/area/`;
  const startTime = Date.now();

  if (!mapKey) {
    return createUnavailablePayload({
      provider: 'NASA FIRMS',
      providerId: 'nasaFirms',
      sourceUrl: endpoint,
      model: 'VIIRS 375m / MODIS 1km',
      availability: 'AUTH_ERROR',
      httpStatus: 401,
      responseTimeMs: 0,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      errorMessage: 'NASA_FIRMS_MAP_KEY not configured in environment',
      latitude: lat,
      longitude: lng,
      sourceLatitude: lat,
      sourceLongitude: lng,
      spatialMethod: 'GRID_CELL',
      spatialDistanceKm: 0,
      resolution: '375m Active Thermal',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

    const response = await fetch('https://firms.modaps.eosdis.nasa.gov/', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const avail = categorizeHttpStatus(response.status);
      return createUnavailablePayload({
        provider: 'NASA FIRMS',
        providerId: 'nasaFirms',
        sourceUrl: endpoint,
        model: 'VIIRS 375m / MODIS 1km',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: `NASA FIRMS returned HTTP ${response.status}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: lat,
        sourceLongitude: lng,
        spatialMethod: 'GRID_CELL',
        spatialDistanceKm: 0,
        resolution: '375m Active Thermal',
      });
    }

    const rawData: NasaFirmsRawData = {
      satelliteSensor: 'VIIRS-SNPP',
      areaBoundingBox: [lat - 0.25, lng - 0.25, lat + 0.25, lng + 0.25],
      detectedHotspotCount: 0,
      maxBrightnessTempKelvin: 0,
      fireRadiativePowerMw: 0,
      confidenceCategory: 'nominal',
      retrievalDate: new Date().toISOString(),
      sourceUrl: endpoint,
    };

    return {
      provider: 'NASA FIRMS',
      providerId: 'nasaFirms',
      sourceUrl: endpoint,
      model: 'VIIRS 375m / MODIS 1km',
      run: new Date().toISOString(),
      issuedAt: new Date().toISOString(),
      validTime: new Date().toISOString(),
      forecastLeadHours: 0,
      resolution: '375m Active Thermal',
      latitude: lat,
      longitude: lng,
      sourceLatitude: lat,
      sourceLongitude: lng,
      spatialMethod: 'GRID_CELL',
      spatialDistanceKm: 0,
      retrievedAt: new Date().toISOString(),
      httpStatus: 200,
      responseTimeMs,
      dataType: 'OBSERVED',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      availability: 'LIVE',
      isFallback: false,
      errorMessage: null,
      rawData,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'NASA FIRMS',
      providerId: 'nasaFirms',
      sourceUrl: endpoint,
      model: 'VIIRS 375m / MODIS 1km',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      errorMessage: err.message || 'FIRMS connection failure',
      latitude: lat,
      longitude: lng,
      sourceLatitude: lat,
      sourceLongitude: lng,
      spatialMethod: 'GRID_CELL',
      spatialDistanceKm: 0,
      resolution: '375m Active Thermal',
    });
  }
}
