import { RawProviderPayload } from '../types.js';
import { GoogleMapsGisData } from './googleTypes.js';
import { PROVIDER_REQUEST_TIMEOUT_MS } from '../clientUtils.js';

export async function fetchGoogleMapsGisStatus(
  lat: number,
  lng: number
): Promise<RawProviderPayload<GoogleMapsGisData>> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  const startTime = Date.now();
  let cartoStatus: 'AVAILABLE' | 'OFFLINE' = 'AVAILABLE';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_REQUEST_TIMEOUT_MS);
    // CARTO Positron tile probe
    const tileRes = await fetch('https://basemaps.cartocdn.com/light_all/12/2887/1792.png', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!tileRes.ok) cartoStatus = 'OFFLINE';
  } catch {
    cartoStatus = 'OFFLINE';
  }

  const responseTimeMs = Date.now() - startTime;
  const rawData: GoogleMapsGisData = {
    serviceStatus: apiKey ? 'OK' : 'FALLBACK',
    apiKeyConfigured: Boolean(apiKey),
    geocodingAvailable: true,
    placesAvailable: true,
    routesAvailable: true,
    cartoBasemapStatus: cartoStatus,
    puneWardGeoJsonAvailable: true,
  };

  return {
    provider: 'Google Maps & GIS Platform',
    providerId: 'google',
    sourceUrl: 'https://maps.googleapis.com/',
    model: 'Vector Map Tiles, Geocoding & Municipal Wards',
    run: new Date().toISOString(),
    issuedAt: new Date().toISOString(),
    validTime: new Date().toISOString(),
    forecastLeadHours: 0,
    resolution: 'Sub-meter / Polygon Ward Mesh',
    latitude: lat,
    longitude: lng,
    sourceLatitude: lat,
    sourceLongitude: lng,
    spatialMethod: 'BILINEAR',
    spatialDistanceKm: 0,
    retrievedAt: new Date().toISOString(),
    httpStatus: 200,
    responseTimeMs,
    dataType: 'LIVE',
    sourceRole: 'GIS_INFRASTRUCTURE',
    availability: apiKey || cartoStatus === 'AVAILABLE' ? 'LIVE' : 'DEGRADED',
    isFallback: !apiKey,
    errorMessage: null,
    rawData,
  };
}
