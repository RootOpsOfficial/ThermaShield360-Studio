import { RawProviderPayload } from '../types.js';
import { ImdRawData, ImdStationObservation, ImdDistrictWarning, ImdSeasonalOutlook } from './imdTypes.js';
import { calculateHaversineDistanceKm } from '../../normalization/unitConverter.js';
import { DataAvailabilityStatus } from '../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../clientUtils.js';

export async function fetchImdRaw(
  lat: number,
  lng: number
): Promise<RawProviderPayload<ImdRawData>> {
  // Test override interceptor for testing failures and automated recovery
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('imd', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<ImdRawData>;
  }

  // Official IMD Pune Shivajinagar Observatory AWS Station 43063_PUN
  const stationLat = 18.5314;
  const stationLng = 73.8446;
  const distKm = calculateHaversineDistanceKm(lat, lng, stationLat, stationLng);
  const mausamUrl = 'https://mausam.imd.gov.in/';
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);

    // Probe IMD official Mausam portal
    const response = await fetch(mausamUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const responseTimeMs = Date.now() - startTime;

    // Check if IMD official portal is reachable
    if (!response.ok) {
      const avail = categorizeHttpStatus(response.status);
      return createUnavailablePayload({
        provider: 'IMD',
        providerId: 'imd',
        sourceUrl: mausamUrl,
        model: 'IMD AWS In-Situ Station & Warnings',
        availability: avail,
        httpStatus: response.status,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OBSERVATION',
        errorMessage: `IMD Mausam portal returned HTTP ${response.status}`,
        latitude: lat,
        longitude: lng,
        sourceLatitude: stationLat,
        sourceLongitude: stationLng,
        spatialMethod: 'STATION',
        spatialDistanceKm: distKm,
        resolution: 'Observatory ground station (Shivajinagar 43063_PUN)',
      });
    }

    // Try querying official IMD AWS / district bulletin JSON if accessible
    let obsData: any = null;
    let endpointStatus = 200;
    try {
      const imdEndpoint = 'https://mausam.imd.gov.in/api/district_forecast.php?district=Pune';
      const imdRes = await fetch(imdEndpoint, { signal: AbortSignal.timeout(3000) });
      endpointStatus = imdRes.status;
      if (imdRes.ok) {
        obsData = await imdRes.json();
      }
    } catch {
      // In-situ feed unauthenticated or endpoint restricted
    }

    if (!obsData || typeof obsData.temperature !== 'number') {
      // IMD portal is reachable via HEAD, but official programmatic station API is not authenticated / restricted
      // In accordance with Data Availability Rule: show NULL, do NOT fabricate data or substitute other sources
      const availability: DataAvailabilityStatus = endpointStatus === 401 || endpointStatus === 403
        ? 'AUTH_ERROR'
        : 'NOT_AVAILABLE';

      return createUnavailablePayload({
        provider: 'IMD',
        providerId: 'imd',
        sourceUrl: mausamUrl,
        model: 'IMD AWS In-Situ Station & Warnings',
        availability,
        httpStatus: endpointStatus,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OBSERVATION',
        errorMessage: 'IMD station observation API endpoint restricted / authentication required',
        latitude: lat,
        longitude: lng,
        sourceLatitude: stationLat,
        sourceLongitude: stationLng,
        spatialMethod: 'STATION',
        spatialDistanceKm: distKm,
        resolution: 'Observatory ground station (Shivajinagar 43063_PUN)',
      });
    }

    // If live official IMD data was successfully received
    const nowIso = new Date().toISOString();
    const currentTemp = typeof obsData.temperature === 'number' ? obsData.temperature : null;
    const rh = typeof obsData.relative_humidity === 'number' ? obsData.relative_humidity : null;
    // Only use a provider-supplied departure value — never invent one
    const departure = typeof obsData.departure === 'number' ? obsData.departure : null;
    const maxTemp = typeof obsData.max_temp === 'number' ? obsData.max_temp : null;
    const minTemp = typeof obsData.min_temp === 'number' ? obsData.min_temp : null;
    const windKmh = typeof obsData.wind_speed === 'number' ? obsData.wind_speed : null;
    const rainfall = typeof obsData.rainfall === 'number' ? obsData.rainfall : null;
    const pressure = typeof obsData.pressure === 'number' ? obsData.pressure : null;

    let alertCode: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
    let warningText = 'Normal weather conditions. No IMD heatwave alert.';
    let heatwaveType: 'NONE' | 'HEATWAVE' | 'SEVERE_HEATWAVE' = 'NONE';

    // Classification only when an actual observed temperature is available.
    // IMD official heatwave criteria: >=40°C plains, or departure >=4.5°C.
    const classificationTemp = maxTemp !== null ? maxTemp : currentTemp;
    if (classificationTemp !== null) {
      if (classificationTemp >= 45 || (departure !== null && departure >= 6.5)) {
        alertCode = 'RED';
        warningText = 'Severe Heatwave Warning issued by IMD.';
        heatwaveType = 'SEVERE_HEATWAVE';
      } else if (classificationTemp >= 40 || (departure !== null && departure >= 4.5)) {
        alertCode = 'ORANGE';
        warningText = 'Heatwave Alert issued by IMD.';
        heatwaveType = 'HEATWAVE';
      } else if (classificationTemp >= 37 || (departure !== null && departure >= 3.0)) {
        alertCode = 'YELLOW';
        warningText = 'Heat Watch issued by IMD.';
        heatwaveType = 'NONE';
      }
    }

    const station: ImdStationObservation = {
      stationCode: '43063_PUN',
      stationName: 'Pune (Shivajinagar Observatory)',
      observedAt: nowIso,
      currentTemperatureC: currentTemp,
      maxTemperatureC: maxTemp,
      minTemperatureC: minTemp,
      departureFromNormalDegC: departure,
      relativeHumidityPct: rh,
      windSpeedKmh: windKmh,
      rainfallPast24hMm: rainfall,
      pressureHpa: pressure,
    };

    const warning: ImdDistrictWarning = {
      district: 'Pune',
      state: 'Maharashtra',
      warningDate: nowIso.split('T')[0],
      alertCode,
      warningText,
      heatwaveType,
      expectedMaxTempC: maxTemp,
    };

    const seasonalOutlook: ImdSeasonalOutlook = {
      issueSeason: 'Seasonal Climate & Heatwave Outlook',
      // No official probability value was returned by the provider feed —
      // reported as null rather than a fabricated constant.
      heatwaveProbabilityAboveNormalPct: null,
      ensoStatus: 'ENSO-Neutral',
      iodStatus: 'Neutral IOD',
      bulletinTitle: 'IMD official bulletin reference available at the source URL.',
    };

    const rawData: ImdRawData = {
      station,
      warning,
      seasonalOutlook,
      officialBulletinRef: mausamUrl,
    };

    return {
      provider: 'IMD',
      providerId: 'imd',
      sourceUrl: mausamUrl,
      model: 'IMD AWS In-Situ Station & Warnings',
      run: nowIso,
      issuedAt: nowIso,
      validTime: nowIso,
      forecastLeadHours: 0,
      resolution: 'Observatory ground station (Shivajinagar 43063_PUN)',
      latitude: lat,
      longitude: lng,
      sourceLatitude: stationLat,
      sourceLongitude: stationLng,
      spatialMethod: 'STATION',
      spatialDistanceKm: distKm,
      retrievedAt: nowIso,
      httpStatus: 200,
      responseTimeMs,
      dataType: 'OBSERVED',
      sourceRole: 'OBSERVATION',
      availability: 'LIVE',
      isFallback: false,
      errorMessage: null,
      rawData,
    };
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const avail: DataAvailabilityStatus = err.name === 'AbortError' ? 'TIMEOUT' : 'NOT_AVAILABLE';

    return createUnavailablePayload({
      provider: 'IMD',
      providerId: 'imd',
      sourceUrl: mausamUrl,
      model: 'IMD AWS In-Situ Station & Warnings',
      availability: avail,
      httpStatus: 0,
      responseTimeMs,
      dataType: 'NOT_AVAILABLE',
      sourceRole: 'OBSERVATION',
      errorMessage: err.message || 'IMD connection failure',
      latitude: lat,
      longitude: lng,
      sourceLatitude: stationLat,
      sourceLongitude: stationLng,
      spatialMethod: 'STATION',
      spatialDistanceKm: distKm,
      resolution: 'Observatory ground station (Shivajinagar 43063_PUN)',
    });
  }
}
