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
import {
  fetchWithSingleFlightAndCache,
  isOpenMeteoInCooldown,
  setOpenMeteoCooldown,
  getStaleCache,
} from '../../openMeteoLimiter.js';

export async function fetchNoaaGefsRaw(
  lat: number,
  lng: number,
  force = false
): Promise<RawProviderPayload<NoaaGefsRawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('noaaGefs', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<NoaaGefsRawData>;
  }

  // NOAA GEFS 0.5° 30-member global ensemble
  const endpoint = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lng}&models=gfs05&hourly=temperature_2m&forecast_days=7&timezone=auto`;
  const cacheKey = `noaaGefs:${lat.toFixed(2)},${lng.toFixed(2)}`;

  const gridLat = Math.round(lat * 2) / 2; // 0.5° grid
  const gridLng = Math.round(lng * 2) / 2;
  const distKm = calculateHaversineDistanceKm(lat, lng, gridLat, gridLng);

  // If in rate-limit backoff cooldown, return stale cache if available or RATE_LIMITED without hammering upstream
  if (!force && isOpenMeteoInCooldown()) {
    const stale = getStaleCache<RawProviderPayload<NoaaGefsRawData>>(cacheKey);
    if (stale) return stale;
    return createUnavailablePayload({
      provider: 'NOAA GEFS',
      providerId: 'noaaGefs',
      sourceUrl: endpoint,
      model: 'GEFS-30',
      availability: 'RATE_LIMITED',
      httpStatus: 429,
      responseTimeMs: 0,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'ENSEMBLE',
      errorMessage: 'Open-Meteo domain in rate-limit backoff cooldown',
      latitude: lat,
      longitude: lng,
      sourceLatitude: gridLat,
      sourceLongitude: gridLng,
      spatialMethod: 'NEAREST',
      spatialDistanceKm: distKm,
      resolution: '0.5 deg (~55km)',
    });
  }

  return fetchWithSingleFlightAndCache<RawProviderPayload<NoaaGefsRawData>>(
    cacheKey,
    180_000, // 3 minutes TTL
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
          const stale = getStaleCache<RawProviderPayload<NoaaGefsRawData>>(cacheKey);
          if (stale) return stale;
        }

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

        // Fail-safe validation: GEFS must return members to be LIVE
        if (members.length === 0) {
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
            errorMessage: 'GEFS payload missing ensemble member series',
            latitude: lat,
            longitude: lng,
            sourceLatitude: gridLat,
            sourceLongitude: gridLng,
            spatialMethod: 'NEAREST',
            spatialDistanceKm: distKm,
            resolution: '0.5 deg (~55km)',
          });
        }

        // Statistical reductions
        memberTemps.sort((a, b) => a - b);
        const meanTemp = Math.round((memberTemps.reduce((a, b) => a + b, 0) / memberTemps.length) * 10) / 10;
        const minTemp = memberTemps[0];
        const maxTemp = memberTemps[memberTemps.length - 1];
        const p10 = memberTemps[Math.floor(memberTemps.length * 0.1)];
        const p50 = memberTemps[Math.floor(memberTemps.length * 0.5)];
        const p90 = memberTemps[Math.floor(memberTemps.length * 0.9)];
        const variance = memberTemps.reduce((acc, t) => acc + Math.pow(t - meanTemp, 2), 0) / memberTemps.length;
        const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

        // Probabilities
        const probOver38 = Math.round((memberTemps.filter((t) => t >= 38.0).length / memberTemps.length) * 100);
        const probOver40 = Math.round((memberTemps.filter((t) => t >= 40.0).length / memberTemps.length) * 100);
        const probOver42 = Math.round((memberTemps.filter((t) => t >= 42.0).length / memberTemps.length) * 100);

        // Classification of ensemble spread
        let spreadConfidence: 'HIGH' | 'MODERATE' | 'LOW' = 'HIGH';
        if (stdDev > 2.5) spreadConfidence = 'LOW';
        else if (stdDev > 1.2) spreadConfidence = 'MODERATE';

        const rawData: NoaaGefsRawData = {
          model: 'GEFS-0.5',
          cycle: `${String(cycleHour).padStart(2, '0')}z` as '00z' | '06z' | '12z' | '18z',
          runTime,
          gridResolution: '0.5 deg (~55km)',
          latitude: gridLat,
          longitude: gridLng,
          forecastLeadHours: currentHourIndex,
          ensembleMemberCount: members.length,
          meanTemperatureC: meanTemp,
          p10TemperatureC: p10,
          p50TemperatureC: p50,
          p90TemperatureC: p90,
          minTemperatureC: minTemp,
          maxTemperatureC: maxTemp,
          stdDevTemperatureC: stdDev,
          probTempExceeding38C: probOver38,
          probTempExceeding40C: probOver40,
          probTempExceeding42C: probOver42,
          spreadConfidence,
          members,
          nomadsUrl: 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/gens/prod/',
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
    },
    force
  );
}
