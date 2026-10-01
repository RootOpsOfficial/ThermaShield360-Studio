import { RawProviderPayload } from '../types.js';
import { OpenMeteoRawData } from './openMeteoTypes.js';
import { calculateHaversineDistanceKm } from '../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../clientUtils.js';
import {
  fetchWithSingleFlightAndCache,
  isOpenMeteoInCooldown,
  setOpenMeteoCooldown,
  getStaleCache,
} from '../openMeteoLimiter.js';

export async function fetchOpenMeteoRaw(
  lat: number,
  lng: number,
  force = false
): Promise<RawProviderPayload<OpenMeteoRawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('openMeteo', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<OpenMeteoRawData>;
  }

  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,direct_normal_irradiance,weather_code&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,surface_pressure,wind_speed_10m,direct_normal_irradiance,weather_code&forecast_days=7&timezone=auto`;
  const cacheKey = `openMeteo:${lat.toFixed(3)},${lng.toFixed(3)}`;

  // If in rate-limit backoff cooldown, return stale cache if available or RATE_LIMITED without hammering upstream
  if (!force && isOpenMeteoInCooldown()) {
    const stale = getStaleCache<RawProviderPayload<OpenMeteoRawData>>(cacheKey);
    if (stale) return stale;
    return createUnavailablePayload({
      provider: 'Open-Meteo',
      providerId: 'openMeteo',
      sourceUrl: endpoint,
      model: 'ICON / ECMWF Hybrid Mesh',
      availability: 'RATE_LIMITED',
      httpStatus: 429,
      responseTimeMs: 0,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'OPERATIONAL_FORECAST',
      errorMessage: 'Open-Meteo domain in rate-limit backoff cooldown',
      latitude: lat,
      longitude: lng,
      resolution: '0.1 deg (~11km)',
    });
  }

  return fetchWithSingleFlightAndCache<RawProviderPayload<OpenMeteoRawData>>(
    cacheKey,
    120_000, // 2 minutes TTL
    async () => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

        const response = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeout);
        const responseTimeMs = Date.now() - startTime;

        if (response.status === 429) {
          const retryHeader = response.headers.get('retry-after');
          const backoff = retryHeader ? Math.min(60, parseInt(retryHeader, 10) || 25) : 25;
          setOpenMeteoCooldown(backoff);
          const stale = getStaleCache<RawProviderPayload<OpenMeteoRawData>>(cacheKey);
          if (stale) return stale;
        }

        if (!response.ok) {
          const avail = categorizeHttpStatus(response.status);
          return createUnavailablePayload({
            provider: 'Open-Meteo',
            providerId: 'openMeteo',
            sourceUrl: endpoint,
            model: 'ICON / ECMWF Hybrid Mesh',
            availability: avail,
            httpStatus: response.status,
            responseTimeMs,
            dataType: 'NOT_AVAILABLE',
            sourceRole: 'OPERATIONAL_FORECAST',
            errorMessage: `Open-Meteo HTTP ${response.status}: ${response.statusText}`,
            latitude: lat,
            longitude: lng,
            resolution: '0.1 deg (~11km)',
          });
        }

        const parseResult = await safeParseJson<OpenMeteoRawData>(response);
        if (!parseResult.ok) {
          return createUnavailablePayload({
            provider: 'Open-Meteo',
            providerId: 'openMeteo',
            sourceUrl: endpoint,
            model: 'ICON / ECMWF Hybrid Mesh',
            availability: 'INVALID_RESPONSE',
            httpStatus: 200,
            responseTimeMs,
            dataType: 'NOT_AVAILABLE',
            sourceRole: 'OPERATIONAL_FORECAST',
            errorMessage: parseResult.error,
            latitude: lat,
            longitude: lng,
            resolution: '0.1 deg (~11km)',
          });
        }

        const data = parseResult.data;

        // Check if provider returned an API-level error object
        if ((data as any).error) {
          return createUnavailablePayload({
            provider: 'Open-Meteo',
            providerId: 'openMeteo',
            sourceUrl: endpoint,
            model: 'ICON / ECMWF Hybrid Mesh',
            availability: 'INVALID_RESPONSE',
            httpStatus: 200,
            responseTimeMs,
            dataType: 'NOT_AVAILABLE',
            sourceRole: 'OPERATIONAL_FORECAST',
            errorMessage: (data as any).reason || 'Open-Meteo API returned error object',
            latitude: lat,
            longitude: lng,
            resolution: '0.1 deg (~11km)',
          });
        }

        // A LIVE provider must return a valid, parseable payload containing the requested product/variable
        if (!data.current || typeof data.current.temperature_2m !== 'number') {
          return createUnavailablePayload({
            provider: 'Open-Meteo',
            providerId: 'openMeteo',
            sourceUrl: endpoint,
            model: 'ICON / ECMWF Hybrid Mesh',
            availability: 'INVALID_RESPONSE',
            httpStatus: 200,
            responseTimeMs,
            dataType: 'NOT_AVAILABLE',
            sourceRole: 'OPERATIONAL_FORECAST',
            errorMessage: 'Payload missing mandatory current temperature_2m property',
            latitude: lat,
            longitude: lng,
            resolution: '0.1 deg (~11km)',
          });
        }

        const sourceLat = data.latitude ?? lat;
        const sourceLng = data.longitude ?? lng;
        const distKm = calculateHaversineDistanceKm(lat, lng, sourceLat, sourceLng);
        const validTime = data.current.time ? new Date(data.current.time).toISOString() : new Date().toISOString();

        // Check if secondary fields are present or incomplete (DEGRADED)
        const hasRelativeHumidity = typeof data.current.relative_humidity_2m === 'number';
        const hasWindSpeed = typeof data.current.wind_speed_10m === 'number';
        const hasPressure = typeof data.current.surface_pressure === 'number';
        const isDegraded = !hasRelativeHumidity || !hasWindSpeed || !hasPressure;
        const availability: DataAvailabilityStatus = isDegraded ? 'DEGRADED' : 'LIVE';

        return {
          provider: 'Open-Meteo',
          providerId: 'openMeteo',
          sourceUrl: endpoint,
          model: 'ICON / ECMWF Hybrid Mesh',
          run: validTime,
          issuedAt: validTime,
          validTime,
          forecastLeadHours: 0,
          resolution: '0.1 deg (~11km)',
          latitude: lat,
          longitude: lng,
          sourceLatitude: sourceLat,
          sourceLongitude: sourceLng,
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
          rawData: data,
        };
      } catch (err: any) {
        const responseTimeMs = Date.now() - startTime;
        const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

        return createUnavailablePayload({
          provider: 'Open-Meteo',
          providerId: 'openMeteo',
          sourceUrl: endpoint,
          model: 'ICON / ECMWF Hybrid Mesh',
          availability: avail,
          httpStatus: 0,
          responseTimeMs,
          dataType: 'NOT_AVAILABLE',
          sourceRole: 'OPERATIONAL_FORECAST',
          errorMessage: err.message || 'Connection failure',
          latitude: lat,
          longitude: lng,
          resolution: '0.1 deg (~11km)',
        });
      }
    },
    force
  );
}
