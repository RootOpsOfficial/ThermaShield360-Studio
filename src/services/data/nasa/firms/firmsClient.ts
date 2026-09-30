import { RawProviderPayload } from '../../types.js';
import { NasaFirmsRawData, NasaFirmsHotspot } from './firmsTypes.js';
import { DataAvailabilityStatus } from '../../../normalization/thermaShieldRecord.js';
import {
  categorizeHttpStatus,
  createUnavailablePayload,
  getProviderFetchInterceptor,
  PROVIDER_REQUEST_TIMEOUT_MS,
} from '../../clientUtils.js';

/** Half-width of the query bounding box in degrees (~28 km) around the selected point */
const FIRMS_BBOX_HALF_DEG = 0.25;
/** Number of most-recent days to query (FIRMS NRT supports 1..5 days) */
const FIRMS_DAY_RANGE = 1;
/** Default sensor product */
const FIRMS_SOURCE = 'VIIRS_SNPP_NRT';

/**
 * Parse the NASA FIRMS area CSV response into structured hotspots.
 * VIIRS header: latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight
 * MODIS header: latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight
 */
function parseFirmsCsv(csv: string): NasaFirmsHotspot[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (name: string, alt?: string) => {
    const i = header.indexOf(name);
    if (i >= 0) return i;
    return alt ? header.indexOf(alt) : -1;
  };

  const iLat = idx('latitude');
  const iLon = idx('longitude');
  const iBright = idx('bright_ti4', 'brightness');
  const iScan = idx('scan');
  const iTrack = idx('track');
  const iDate = idx('acq_date');
  const iTime = idx('acq_time');
  const iSat = idx('satellite');
  const iInst = idx('instrument');
  const iConf = idx('confidence');
  const iFrp = idx('frp');
  const iDayNight = idx('daynight');

  if (iLat < 0 || iLon < 0) return [];

  const hotspots: NasaFirmsHotspot[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 2) continue;
    const lat = parseFloat(cols[iLat]);
    const lon = parseFloat(cols[iLon]);
    if (isNaN(lat) || isNaN(lon)) continue;

    hotspots.push({
      latitude: lat,
      longitude: lon,
      brightnessKelvin: iBright >= 0 ? parseFloat(cols[iBright]) || 0 : 0,
      scan: iScan >= 0 ? parseFloat(cols[iScan]) || 0 : 0,
      track: iTrack >= 0 ? parseFloat(cols[iTrack]) || 0 : 0,
      acqDate: iDate >= 0 ? (cols[iDate] || '').trim() : '',
      acqTime: iTime >= 0 ? (cols[iTime] || '').trim() : '',
      satellite: iSat >= 0 ? (cols[iSat] || '').trim() : '',
      instrument: iInst >= 0 ? (cols[iInst] || '').trim() : '',
      confidence: iConf >= 0 ? (cols[iConf] || '').trim() : '',
      frpMw: iFrp >= 0 ? parseFloat(cols[iFrp]) || 0 : 0,
      dayNight: iDayNight >= 0 ? (cols[iDayNight] || '').trim() : '',
    });
  }
  return hotspots;
}

function classifyConfidence(hotspots: NasaFirmsHotspot[]): 'nominal' | 'high' | 'low' | 'none' {
  if (hotspots.length === 0) return 'none';
  const highCount = hotspots.filter((h) => h.confidence === 'h' || h.confidence === 'high').length;
  const lowCount = hotspots.filter((h) => h.confidence === 'l' || h.confidence === 'low').length;
  if (highCount > 0 && highCount >= lowCount) return 'high';
  if (lowCount > 0 && lowCount > highCount) return 'low';
  return 'nominal';
}

/**
 * NASA FIRMS — Satellite active-fire / thermal-anomaly detection (VIIRS 375m NRT).
 *
 * IMPORTANT DATA SEMANTICS:
 * This provider reports SATELLITE ACTIVE FIRE DETECTIONS ONLY.
 * Its output is never air temperature and is never used as a thermal-stress input.
 * A "0 hotspots" result is a legitimate observed value (no fire detected in the window),
 * NOT a failure — so it is reported with availability LIVE, not NOT_AVAILABLE.
 */
export async function fetchNasaFirmsRaw(
  lat: number,
  lng: number
): Promise<RawProviderPayload<NasaFirmsRawData>> {
  const interceptor = getProviderFetchInterceptor();
  if (interceptor) {
    const intercepted = await interceptor('nasaFirms', lat, lng);
    if (intercepted) return intercepted as RawProviderPayload<NasaFirmsRawData>;
  }

  const mapKey = process.env.NASA_FIRMS_MAP_KEY;

  const south = lat - FIRMS_BBOX_HALF_DEG;
  const north = lat + FIRMS_BBOX_HALF_DEG;
  const west = lng - FIRMS_BBOX_HALF_DEG;
  const east = lng + FIRMS_BBOX_HALF_DEG;
  // FIRMS area API expects: west,south,east,north
  const bboxParam = `${west.toFixed(4)},${south.toFixed(4)},${east.toFixed(4)},${north.toFixed(4)}`;
  const endpoint = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey || 'MAP_KEY'}/${FIRMS_SOURCE}/${bboxParam}/${FIRMS_DAY_RANGE}`;
  const startTime = Date.now();

  const bbox: [number, number, number, number] = [south, west, north, east];

  const now = new Date();
  const windowEnd = now.toISOString().split('T')[0];
  const windowStart = new Date(now.getTime() - FIRMS_DAY_RANGE * 86400000).toISOString().split('T')[0];

  if (!mapKey) {
    return createUnavailablePayload({
      provider: 'NASA FIRMS',
      providerId: 'nasaFirms',
      sourceUrl: 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/',
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

    const response = await fetch(endpoint, { signal: controller.signal });
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

    const csv = await response.text();

    // Robustness: never treat an HTML error page as valid CSV
    if (/^\s*</.test(csv)) {
      return createUnavailablePayload({
        provider: 'NASA FIRMS',
        providerId: 'nasaFirms',
        sourceUrl: endpoint,
        model: 'VIIRS 375m / MODIS 1km',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'DERIVED_ENVIRONMENTAL',
        errorMessage: 'NASA FIRMS returned an HTML document where CSV was expected',
        latitude: lat,
        longitude: lng,
        sourceLatitude: lat,
        sourceLongitude: lng,
        spatialMethod: 'GRID_CELL',
        spatialDistanceKm: 0,
        resolution: '375m Active Thermal',
      });
    }

    const hotspots = parseFirmsCsv(csv);
    const maxBrightness = hotspots.length > 0 ? Math.max(...hotspots.map((h) => h.brightnessKelvin)) : null;
    const totalFrp = hotspots.length > 0 ? hotspots.reduce((a, h) => a + h.frpMw, 0) : null;

    const rawData: NasaFirmsRawData = {
      satelliteSensor: 'VIIRS-SNPP',
      areaBoundingBox: bbox,
      detectedHotspotCount: hotspots.length,
      maxBrightnessTempKelvin: maxBrightness,
      fireRadiativePowerMw: totalFrp,
      confidenceCategory: classifyConfidence(hotspots),
      retrievalDate: now.toISOString(),
      sourceUrl: endpoint,
      hotspots,
      temporalWindowStart: windowStart,
      temporalWindowEnd: windowEnd,
      dataSemantics: 'SATELLITE_ACTIVE_FIRE_DETECTION',
    };

    return {
      provider: 'NASA FIRMS',
      providerId: 'nasaFirms',
      sourceUrl: endpoint,
      model: 'VIIRS 375m NRT Active Fire',
      run: now.toISOString(),
      issuedAt: now.toISOString(),
      validTime: now.toISOString(),
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
