import { RawProviderPayload } from '../../types.js';
import { NoaaGfsRawData } from './gfsTypes.js';
import { calculateHaversineDistanceKm } from '../../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  safeParseJson,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../../clientUtils.js';
import {
  fetchWithSingleFlightAndCache,
  isOpenMeteoInCooldown,
  setOpenMeteoCooldown,
  getStaleCache,
} from '../../openMeteoLimiter.js';

export async function fetchNoaaGfsRaw(
  lat: number,
  lng: number,
  force = false
): Promise<RawProviderPayload<NoaaGfsRawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('noaaGfs', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<NoaaGfsRawData>;
  }

  const nomadsEndpoint = `https://api.open-meteo.com/v1/gfs?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,dew_point_2m,direct_normal_irradiance,precipitation&forecast_days=7&timezone=auto`;
  const cacheKey = `noaaGfs:${lat.toFixed(3)},${lng.toFixed(3)}`;

  const gridLat = Math.round(lat * 4) / 4;
  const gridLng = Math.round(lng * 4) / 4;
  const distKm = calculateHaversineDistanceKm(lat, lng, gridLat, gridLng);

  // If in rate-limit backoff cooldown, return stale cache if available or RATE_LIMITED without hammering upstream
  if (!force && isOpenMeteoInCooldown()) {
    const stale = getStaleCache<RawProviderPayload<NoaaGfsRawData>>(cacheKey);
    if (stale) return stale;
    return createUnavailablePayload({
      provider: 'NOAA GFS',
      providerId: 'noaaGfs',
      sourceUrl: nomadsEndpoint,
      model: 'GFS-0.25',
      availability: 'RATE_LIMITED',
      httpStatus: 429,
      responseTimeMs: 0,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'OPERATIONAL_FORECAST',
      errorMessage: 'Open-Meteo domain in rate-limit backoff cooldown',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'BILINEAR',
      spatialDistanceKm: distKm,
      resolution: '0.25 deg (~28km)',
    });
  }

  return fetchWithSingleFlightAndCache<RawProviderPayload<NoaaGfsRawData>>(
    cacheKey,
    120_000, // 2 minutes TTL
    async () => {
      const startTime = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

        const response = await fetch(nomadsEndpoint, { signal: controller.signal });
        clearTimeout(timeout);
        const responseTimeMs = Date.now() - startTime;

        if (response.status === 429) {
          const retryHeader = response.headers.get('retry-after');
          const backoff = retryHeader ? Math.min(60, parseInt(retryHeader, 10) || 25) : 25;
          setOpenMeteoCooldown(backoff);
          const stale = getStaleCache<RawProviderPayload<NoaaGfsRawData>>(cacheKey);
          if (stale) return stale;
        }

        if (!response.ok) {
          const avail = categorizeHttpStatus(response.status);
          return createUnavailablePayload({
            provider: 'NOAA GFS',
            providerId: 'noaaGfs',
            sourceUrl: nomadsEndpoint,
            model: 'GFS-0.25',
            availability: avail,
            httpStatus: response.status,
            responseTimeMs,
            dataType: 'NOT_AVAILABLE',
            sourceRole: 'OPERATIONAL_FORECAST',
            errorMessage: `NOAA GFS HTTP ${response.status}: ${response.statusText}`,
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
            provider: 'NOAA GFS',
            providerId: 'noaaGfs',
            sourceUrl: nomadsEndpoint,
            model: 'GFS-0.25',
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
            provider: 'NOAA GFS',
            providerId: 'noaaGfs',
            sourceUrl: nomadsEndpoint,
            model: 'GFS-0.25',
            availability: 'INVALID_RESPONSE',
            httpStatus: 200,
            responseTimeMs,
            dataType: 'NOT_AVAILABLE',
            sourceRole: 'OPERATIONAL_FORECAST',
            errorMessage: json.reason || 'NOAA GFS API returned error',
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
            provider: 'NOAA GFS',
            providerId: 'noaaGfs',
            sourceUrl: nomadsEndpoint,
            model: 'GFS-0.25',
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
        const precip = json.hourly?.precipitation?.[currentHourIndex];

        const hasRh = typeof rh === 'number';
        const hasWs = typeof ws === 'number';
        const hasSp = typeof sp === 'number';
        const isDegraded = !hasRh || !hasWs || !hasSp;
        const availability: DataAvailabilityStatus = isDegraded ? 'DEGRADED' : 'LIVE';

        const now = new Date();
        // GFS runs are 00z, 06z, 12z, 18z
        const utcHour = now.getUTCHours();
        const cycleHour = Math.floor(utcHour / 6) * 6;
        const runTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), cycleHour, 0, 0)).toISOString();
        const validTime = json.hourly?.time?.[currentHourIndex]
          ? new Date(json.hourly.time[currentHourIndex]).toISOString()
          : now.toISOString();

        const rawData: NoaaGfsRawData = {
          model: 'GFS-0.25',
          cycle: `${String(cycleHour).padStart(2, '0')}z` as '00z' | '06z' | '12z' | '18z',
          runTime,
          gridResolution: '0.25 deg (~28km)',
          latitude: gridLat,
          longitude: gridLng,
          forecastLeadHours: currentHourIndex,
          temperature_2m_c: Math.round(temp * 10) / 10,
          relative_humidity_2m_pct: hasRh ? Math.round(rh) : (null as any),
          dew_point_2m_c: typeof dp === 'number' ? Math.round(dp * 10) / 10 : (null as any),
          surface_pressure_hpa: hasSp ? Math.round(sp * 10) / 10 : (null as any),
          wind_speed_10m_ms: hasWs ? Math.round(ws * 10) / 10 : (null as any),
          solar_radiation_wm2: solar,
          precip_rate_mm_hr: typeof precip === 'number' ? precip : 0,
          nomadsUrl: 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/',
        };

        return {
          provider: 'NOAA GFS',
          providerId: 'noaaGfs',
          sourceUrl: nomadsEndpoint,
          model: 'GFS-0.25',
          run: runTime,
          issuedAt: runTime,
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
          provider: 'NOAA GFS',
          providerId: 'noaaGfs',
          sourceUrl: nomadsEndpoint,
          model: 'GFS-0.25',
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
    },
    force
  );
}
