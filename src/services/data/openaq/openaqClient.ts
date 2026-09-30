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
  lat: number,
  lng: number
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
    const results: any[] = Array.isArray(json?.results) ? json.results : [];

    // Pick the nearest station that actually exposes sensors
    const firstResult = results.find((r) => Array.isArray(r?.sensors) && r.sensors.length > 0) || results[0];

    if (!firstResult) {
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
    }

    const sensorLat = firstResult.coordinates?.latitude ?? lat;
    const sensorLng = firstResult.coordinates?.longitude ?? lng;
    const distKm = calculateHaversineDistanceKm(lat, lng, sensorLat, sensorLng);
    const locationId = firstResult.id;

    // Build sensorId -> parameter metadata map from the location record
    const sensorParamMap = new Map<number, { name: string; units: string }>();
    for (const s of firstResult.sensors || []) {
      if (s?.id !== undefined && s?.parameter?.name) {
        sensorParamMap.set(Number(s.id), {
          name: String(s.parameter.name).toLowerCase(),
          units: String(s.parameter.units || ''),
        });
      }
    }

    // SECOND CALL: fetch the actual latest measurements for this location
    let measurements: OpenAqMeasurement[] = [];
    let observedAt: string | null = ((firstResult.datetimeLast?.utc as string) || null);

    if (locationId !== undefined) {
      try {
        const latestRes = await fetch(`https://api.openaq.org/v3/locations/${locationId}/latest?limit=100`, {
          headers: apiKey ? { 'X-API-Key': apiKey } : {},
          signal: AbortSignal.timeout(PROVIDER_REQUEST_TIMEOUT_MS),
        });
        if (latestRes.ok) {
          const latestJson: any = await latestRes.json();
          const latestRows: any[] = Array.isArray(latestJson?.results) ? latestJson.results : [];
          for (const row of latestRows) {
            const meta = sensorParamMap.get(Number(row?.sensorsId));
            if (!meta) continue;
            const v = typeof row?.value === 'number' ? row.value : parseFloat(row?.value);
            if (v === null || v === undefined || isNaN(v)) continue;
            const ts: string | null = row?.datetime?.utc || row?.datetime?.local || null;
            measurements.push({
              parameter: meta.name,
              value: v,
              unit: meta.units,
              lastUpdated: ts || '',
            });
            if (ts && (!observedAt || ts > observedAt)) observedAt = ts;
          }
        }
      } catch {
        // Non-fatal: location metadata is still valid; measurements remain empty and are reported as such
      }
    }

    const pick = (name: string): number | null => {
      const m = measurements.find((x) => x.parameter === name);
      return m && typeof m.value === 'number' && !isNaN(m.value) ? m.value : null;
    };

    const pm25 = pick('pm25');
    const pm10 = pick('pm10');
    const o3 = pick('o3');
    const no2 = pick('no2');
    const so2 = pick('so2');
    const co = pick('co');

    const rawData: OpenAqRawData = {
      locationId: locationId !== undefined ? locationId : 'unknown',
      locationName: firstResult.name || 'Unnamed monitoring station',
      city: firstResult.locality || firstResult.city || null,
      country: firstResult.country?.code || null,
      reportingProvider: firstResult.provider?.name || null,
      timezone: firstResult.timezone || null,
      coordinates: { latitude: sensorLat, longitude: sensorLng },
      measurements,
      pm25,
      pm10,
      o3,
      no2,
      so2,
      co,
      // NOTE: DERIVED index from observed PM2.5. Not a provider-published AQI.
      aqiEstimated: pm25 !== null ? Math.round(pm25 * 2.1) : null,
      observedAt,
      stationDistanceKm: distKm,
      dataSemantics: 'AIR_QUALITY_SURFACE_MEASUREMENT',
    };

    return {
      provider: 'OpenAQ',
      providerId: 'openaq',
      sourceUrl: endpoint,
      model: firstResult.provider?.name
        ? `OpenAQ v3 — ${firstResult.provider.name} station`
        : 'CPCB / SAFAR In-Situ Stations',
      run: new Date().toISOString(),
      issuedAt: observedAt || new Date().toISOString(),
      validTime: observedAt || new Date().toISOString(),
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
      // Station metadata is live even when a particular pollutant has no value in the window
      availability: measurements.length > 0 ? 'LIVE' : 'DEGRADED',
      isFallback: false,
      errorMessage: measurements.length > 0 ? null : 'Station found but no recent measurements returned',
      rawData,
    };
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
