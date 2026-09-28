import { RawProviderPayload } from '../types.js';
import { GoogleAirQualityRawData } from './googleTypes.js';
import { DataAvailabilityStatus } from '../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../clientUtils.js';

export async function fetchGoogleAirQualityRaw(
  lat: number = 18.5204,
  lng: number = 73.8567
): Promise<RawProviderPayload<GoogleAirQualityRawData>> {
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('google', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<GoogleAirQualityRawData>;
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  const endpoint = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey || ''}`;
  const startTime = Date.now();

  if (!apiKey) {
    return createUnavailablePayload({
      provider: 'Google Air Quality',
      providerId: 'google',
      sourceUrl: 'https://airquality.googleapis.com/v1/currentConditions:lookup',
      model: 'Google Universal AQI Model',
      availability: 'AUTH_ERROR',
      httpStatus: 401,
      responseTimeMs: 0,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      errorMessage: 'GOOGLE_MAPS_API_KEY not configured for Air Quality API',
      latitude: lat,
      longitude: lng,
      sourceLatitude: lat,
      sourceLongitude: lng,
      spatialMethod: 'GRID_CELL',
      spatialDistanceKm: 0,
      resolution: '500m Surface Grid',
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: { latitude: lat, longitude: lng },
        extraComputations: ['LOCAL_AQI', 'HEALTH_RECOMMENDATIONS', 'POLLUTANT_ADDITIONAL_INFO'],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const avail = categorizeHttpStatus(response.status);
      return createUnavailablePayload({
        provider: 'Google Air Quality',
        providerId: 'google',
        sourceUrl: 'https://airquality.googleapis.com/v1/currentConditions:lookup',
        model: 'Google Universal AQI Model',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: `Google Air Quality returned HTTP ${response.status}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: lat,
        sourceLongitude: lng,
        spatialMethod: 'GRID_CELL',
        spatialDistanceKm: 0,
        resolution: '500m Surface Grid',
      });
    }

    const rawData = (await response.json()) as GoogleAirQualityRawData;
    return {
      provider: 'Google Air Quality',
      providerId: 'google',
      sourceUrl: 'https://airquality.googleapis.com/v1/currentConditions:lookup',
      model: 'Google Universal AQI Model',
      run: new Date().toISOString(),
      issuedAt: new Date().toISOString(),
      validTime: new Date().toISOString(),
      forecastLeadHours: 0,
      resolution: '500m Surface Grid',
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
      provider: 'Google Air Quality',
      providerId: 'google',
      sourceUrl: 'https://airquality.googleapis.com/v1/currentConditions:lookup',
      model: 'Google Universal AQI Model',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      errorMessage: err.message || 'Connection failure',
      latitude: lat,
      longitude: lng,
      sourceLatitude: lat,
      sourceLongitude: lng,
      spatialMethod: 'GRID_CELL',
      spatialDistanceKm: 0,
      resolution: '500m Surface Grid',
    });
  }
}
