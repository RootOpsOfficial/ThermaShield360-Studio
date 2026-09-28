import { RawProviderPayload } from '../types.js';
import { OpenAqRawData, OpenAqMeasurement } from './openaqTypes.js';
import { calculateHaversineDistanceKm } from '../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../clientUtils.js';

export async function fetchOpenAqRaw(
  lat: number = 18.5204,
  lng: number = 73.8567
): Promise<RawProviderPayload<OpenAqRawData>> {
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('openaq', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<OpenAqRawData>;
  }

  const apiKey = process.env.OPENAQ_API_KEY;
  // OpenAQ v3 API endpoint
  const endpoint = `https://api.openaq.org/v3/locations?coordinates=${lat},${lng}&radius=25000`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

    const headers: Record<string, string> = {};
    if (apiKey) headers['X-API-Key'] = apiKey;

    const response = await fetch(endpoint, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const avail = categorizeHttpStatus(response.status);
      return createUnavailablePayload({
        provider: 'OpenAQ',
        providerId: 'openaq',
        sourceUrl: endpoint,
        model: 'CPCB / SAFAR In-Situ Stations',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: `OpenAQ returned HTTP ${response.status} (API key required)`,
        latitude: lat,
        longitude: lng,
        resolution: 'Point sensor observation',
      });
    }

    const parseResult = await safeParseJson<any>(response);
    if (!parseResult.ok) {
      return createUnavailablePayload({
        provider: 'OpenAQ',
        providerId: 'openaq',
        sourceUrl: endpoint,
        model: 'CPCB / SAFAR In-Situ Stations',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: parseResult.error,
        latitude: lat,
        longitude: lng,
        resolution: 'Point sensor observation',
      });
    }

    const json = parseResult.data;
    const firstResult = json.results?.[0];
    if (firstResult && firstResult.sensors) {
      const sensorLat = firstResult.coordinates?.latitude || lat;
      const sensorLng = firstResult.coordinates?.longitude || lng;
      const distKm = calculateHaversineDistanceKm(lat, lng, sensorLat, sensorLng);

      const measurements: OpenAqMeasurement[] = (firstResult.sensors || []).map((m: any) => ({
        parameter: m.parameter?.name,
        value: m.latest?.value,
        unit: m.parameter?.units,
        lastUpdated: m.latest?.datetime,
      }));

      const pm25Obj = measurements.find((m) => m.parameter === 'pm25');
      const pm10Obj = measurements.find((m) => m.parameter === 'pm10');
      const o3Obj = measurements.find((m) => m.parameter === 'o3');

      const pm25 = pm25Obj ? pm25Obj.value : null;
      const pm10 = pm10Obj ? pm10Obj.value : null;

      const rawData: OpenAqRawData = {
        locationId: String(firstResult.id || 'pune-station'),
        locationName: firstResult.name || 'Pune Central Monitoring Station',
        city: 'Pune',
        country: 'IN',
        coordinates: {
          latitude: sensorLat,
          longitude: sensorLng,
        },
        measurements,
        pm25: pm25 ?? (null as any),
        pm10: pm10 ?? (null as any),
        o3: o3Obj?.value,
        aqiEstimated: pm25 ? Math.round(pm25 * 2.1) : (null as any),
      };

      return {
        provider: 'OpenAQ',
        providerId: 'openaq',
        sourceUrl: endpoint,
        model: 'CPCB / SAFAR In-Situ Stations',
        run: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
        validTime: new Date().toISOString(),
        forecastLeadHours: 0,
        resolution: 'Point sensor observation',
        latitude: lat,
        longitude: lng,
        sourceLatitude: sensorLat,
        sourceLongitude: sensorLng,
        spatialMethod: 'STATION',
        spatialDistanceKm: distKm,
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
    }

    return createUnavailablePayload({
      provider: 'OpenAQ',
      providerId: 'openaq',
      sourceUrl: endpoint,
      model: 'CPCB / SAFAR In-Situ Stations',
      availability: 'NOT_AVAILABLE',
      httpStatus: 200,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      errorMessage: 'No active monitoring stations within search radius',
      latitude: lat,
      longitude: lng,
      resolution: 'Point sensor observation',
    });
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'OpenAQ',
      providerId: 'openaq',
      sourceUrl: endpoint,
      model: 'CPCB / SAFAR In-Situ Stations',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'DERIVED_ENVIRONMENTAL',
      errorMessage: err.message || 'OpenAQ connection failure',
      latitude: lat,
      longitude: lng,
      resolution: 'Point sensor observation',
    });
  }
}
