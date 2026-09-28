import { ProviderHealthReport } from './types.js';
import { getCanonicalErrorCode } from './clientUtils.js';
import { fetchOpenMeteoRaw } from './openMeteo/openMeteoClient.js';
import { fetchEcmwfRaw } from './ecmwf/ecmwfClient.js';
import { fetchNoaaGfsRaw } from './noaa/gfs/gfsClient.js';
import { fetchNoaaGefsRaw } from './noaa/gefs/gefsClient.js';
import { fetchNoaaNceiRaw } from './noaa/ncei/nceiClient.js';
import { fetchCopernicusEra5Raw } from './copernicus/era5Client.js';
import { fetchNasaPowerRaw } from './nasa/power/nasaPowerClient.js';
import { fetchNasaFirmsRaw } from './nasa/firms/firmsClient.js';
import { fetchOpenAqRaw } from './openaq/openaqClient.js';
import { fetchImdRaw } from './imd/imdClient.js';
import { fetchGoogleMapsGisStatus } from './google/googleMapsClient.js';

let cachedHealth: ProviderHealthReport[] | null = null;
let lastHealthCheckTime = 0;
const HEALTH_CACHE_TTL_MS = 60 * 1000; // 1 minute probe cache

export function clearProviderHealthCache(): void {
  cachedHealth = null;
  lastHealthCheckTime = 0;
}

let healthMonitoringInterval: NodeJS.Timeout | null = null;

/**
 * Requirement F: Centralized health-check monitoring interval.
 * Reuses a single centralized timer on the backend to avoid browser client duplication.
 */
export function startProviderHealthMonitoring(
  lat: number = 18.5204,
  lng: number = 73.8567,
  intervalMs: number = 60000
): void {
  if (healthMonitoringInterval) return; // Prevent duplicate polling loops
  healthMonitoringInterval = setInterval(() => {
    checkAllProvidersHealth(lat, lng, true).catch((err) => {
      console.warn('Scheduled provider health monitoring warning:', err);
    });
  }, intervalMs);
}

export function stopProviderHealthMonitoring(): void {
  if (healthMonitoringInterval) {
    clearInterval(healthMonitoringInterval);
    healthMonitoringInterval = null;
  }
}

function resolveHealthMeta(
  res: PromiseSettledResult<any>,
  defaultHttpStatus: number,
  fallbackMessage: string
) {
  if (res.status === 'fulfilled') {
    const val = res.value;
    const isSuccess = val.availability === 'LIVE' || val.availability === 'DEGRADED';
    const errCode = val.errorCode ?? (!isSuccess && val.httpStatus > 0 ? getCanonicalErrorCode(val.httpStatus) : null);
    return {
      status: val.availability,
      httpStatus: val.httpStatus,
      latencyMs: val.responseTimeMs,
      errorCode: errCode,
      message: val.errorMessage || fallbackMessage,
    };
  }
  return {
    status: 'TIMEOUT' as const,
    httpStatus: defaultHttpStatus,
    latencyMs: 0,
    errorCode: 'REQUEST_TIMEOUT',
    message: 'Connection timed out',
  };
}

export async function checkAllProvidersHealth(
  lat: number = 18.5204,
  lng: number = 73.8567,
  forceRefresh = false
): Promise<ProviderHealthReport[]> {
  const now = Date.now();
  if (!forceRefresh && cachedHealth && now - lastHealthCheckTime < HEALTH_CACHE_TTL_MS) {
    return cachedHealth;
  }

  // Execute probes in parallel with individual error protection
  const [
    openMeteoRes,
    ecmwfRes,
    noaaGfsRes,
    noaaGefsRes,
    noaaNceiRes,
    copernicusRes,
    nasaPowerRes,
    nasaFirmsRes,
    openaqRes,
    imdRes,
    googleMapsRes,
  ] = await Promise.allSettled([
    fetchOpenMeteoRaw(lat, lng),
    fetchEcmwfRaw(lat, lng),
    fetchNoaaGfsRaw(lat, lng),
    fetchNoaaGefsRaw(lat, lng),
    fetchNoaaNceiRaw(lat, lng),
    fetchCopernicusEra5Raw(lat, lng),
    fetchNasaPowerRaw(lat, lng),
    fetchNasaFirmsRaw(lat, lng),
    fetchOpenAqRaw(lat, lng),
    fetchImdRaw(lat, lng),
    fetchGoogleMapsGisStatus(lat, lng),
  ]);

  const hOpenMeteo = resolveHealthMeta(openMeteoRes, 503, 'Operational hourly NWP connected');
  const hEcmwf = resolveHealthMeta(ecmwfRes, 503, 'Global IFS cycle synchronized (51-member atmospheric core)');
  const hGfs = resolveHealthMeta(noaaGfsRes, 503, 'NCEP operational numerical cycle online');
  const hGefs = resolveHealthMeta(noaaGefsRes, 503, '30-member probabilistic ensemble spread online');
  const hEra5 = resolveHealthMeta(copernicusRes, 503, 'WMO 30-year climatological normal baseline connected');
  const hImd = resolveHealthMeta(imdRes, 503, 'Official district warning bulletin & Pune observatory synchronized');
  const hNasaPower = resolveHealthMeta(nasaPowerRes, 503, 'Global Horizontal Irradiance (GHI) and surface fluxes active');
  const hNcei = resolveHealthMeta(noaaNceiRes, 503, 'Pune Lohegaon Airport GHCN station observation records available');
  const hFirms = resolveHealthMeta(nasaFirmsRes, 503, 'VIIRS 375m active thermal anomaly scanner online');
  const hOpenAq = resolveHealthMeta(openaqRes, 503, 'Pune CPCB / SAFAR air quality stations reporting');
  const hGoogle = resolveHealthMeta(googleMapsRes, 200, 'Ward polygon mesh & spatial geocoding active');

  const reports: ProviderHealthReport[] = [
    // 1. Open-Meteo
    {
      id: 'openMeteo',
      name: 'Open-Meteo',
      role: 'Current + forecast operational feed',
      priority: 'CRITICAL',
      status: hOpenMeteo.status,
      httpStatus: hOpenMeteo.httpStatus,
      latencyMs: hOpenMeteo.latencyMs,
      errorCode: hOpenMeteo.errorCode,
      endpointUrl: 'https://api.open-meteo.com/v1/forecast',
      lastChecked: new Date().toISOString(),
      message: hOpenMeteo.message,
      supportedVariables: ['Dry Bulb Temperature', 'Relative Humidity', 'Surface Pressure', 'Wind Speed', 'Solar Irradiance'],
    },
    // 2. ECMWF IFS/AIFS
    {
      id: 'ecmwf',
      name: 'ECMWF IFS / AIFS',
      role: 'Independent global numerical weather prediction',
      priority: 'CRITICAL',
      status: hEcmwf.status,
      httpStatus: hEcmwf.httpStatus,
      latencyMs: hEcmwf.latencyMs,
      errorCode: hEcmwf.errorCode,
      endpointUrl: 'https://data.ecmwf.int/forecasts/ (Open Data IFS 0.25°)',
      lastChecked: new Date().toISOString(),
      message: hEcmwf.message,
      supportedVariables: ['Temperature', 'Dew Point', 'Relative Humidity', 'Pressure', 'Wind Speed'],
    },
    // 3. NOAA GFS
    {
      id: 'noaaGfs',
      name: 'NOAA GFS',
      role: 'Global Forecast System (0.25° deterministic run)',
      priority: 'CRITICAL',
      status: hGfs.status,
      httpStatus: hGfs.httpStatus,
      latencyMs: hGfs.latencyMs,
      errorCode: hGfs.errorCode,
      endpointUrl: 'https://nomads.ncep.noaa.gov/ (GFS 0.25°)',
      lastChecked: new Date().toISOString(),
      message: hGfs.message,
      supportedVariables: ['Temperature', 'Relative Humidity', 'Pressure', 'Wind Speed', 'Precipitation'],
    },
    // 4. NOAA GEFS
    {
      id: 'noaaGefs',
      name: 'NOAA GEFS',
      role: 'Global Ensemble Forecast System (31 members)',
      priority: 'CRITICAL',
      status: hGefs.status,
      httpStatus: hGefs.httpStatus,
      latencyMs: hGefs.latencyMs,
      errorCode: hGefs.errorCode,
      endpointUrl: 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/gens/',
      lastChecked: new Date().toISOString(),
      message: hGefs.message,
      supportedVariables: ['Ensemble Mean', 'Ensemble Spread', 'Exceedance Probability', 'Max/Min Bounds'],
    },
    // 5. Copernicus CDS / ERA5
    {
      id: 'copernicusEra5',
      name: 'Copernicus CDS / ERA5',
      role: 'Historical 1991–2020 reanalysis & seasonal forecasts',
      priority: 'CRITICAL',
      status: hEra5.status,
      httpStatus: hEra5.httpStatus,
      latencyMs: hEra5.latencyMs,
      errorCode: hEra5.errorCode,
      endpointUrl: 'https://cds.climate.copernicus.eu/api/v2',
      lastChecked: new Date().toISOString(),
      message: hEra5.message,
      supportedVariables: ['Climatological Normal Temp', 'Monthly Anomaly', 'Extreme Percentiles', 'Relative Humidity'],
    },
    // 6. IMD (India Meteorological Department)
    {
      id: 'imd',
      name: 'IMD (India Meteorological Dept)',
      role: 'Official India warnings, AWS stations & heatwave bulletins',
      priority: 'CRITICAL',
      status: hImd.status,
      httpStatus: hImd.httpStatus,
      latencyMs: hImd.latencyMs,
      errorCode: hImd.errorCode,
      endpointUrl: 'https://mausam.imd.gov.in/pune/',
      lastChecked: new Date().toISOString(),
      message: hImd.message,
      supportedVariables: ['Station Max/Min Temp', 'District Warning Color', 'Departure From Normal', 'Rainfall 24h'],
    },
    // 7. NASA POWER
    {
      id: 'nasaPower',
      name: 'NASA POWER',
      role: 'Solar irradiance & climatological meteorology',
      priority: 'HIGH',
      status: hNasaPower.status,
      httpStatus: hNasaPower.httpStatus,
      latencyMs: hNasaPower.latencyMs,
      errorCode: hNasaPower.errorCode,
      endpointUrl: 'https://power.larc.nasa.gov/api/temporal/hourly/point',
      lastChecked: new Date().toISOString(),
      message: hNasaPower.message,
      supportedVariables: ['Solar Radiation (W/m²)', 'Surface Pressure', 'Air Temperature', 'Wind Speed 10m'],
    },
    // 8. NOAA NCEI
    {
      id: 'noaaNcei',
      name: 'NOAA NCEI',
      role: 'Global Historical Climatology Network (GHCN-Daily)',
      priority: 'HIGH',
      status: hNcei.status,
      httpStatus: hNcei.httpStatus,
      latencyMs: hNcei.latencyMs,
      errorCode: hNcei.errorCode,
      endpointUrl: 'https://www.ncei.noaa.gov/cdo-web/api/v2/',
      lastChecked: new Date().toISOString(),
      message: hNcei.message,
      supportedVariables: ['Historical Daily Max/Min', 'Extreme Percentiles', '30-Year Trend'],
    },
    // 9. NASA FIRMS
    {
      id: 'nasaFirms',
      name: 'NASA FIRMS',
      role: 'MODIS & VIIRS active fire & thermal anomaly hotspots',
      priority: 'MEDIUM',
      status: hFirms.status,
      httpStatus: hFirms.httpStatus,
      latencyMs: hFirms.latencyMs,
      errorCode: hFirms.errorCode,
      endpointUrl: 'https://firms.modaps.eosdis.nasa.gov/api/area/',
      lastChecked: new Date().toISOString(),
      message: hFirms.message,
      supportedVariables: ['Thermal Hotspots', 'Brightness Temp (K)', 'Fire Radiative Power (MW)'],
    },
    // 10. OpenAQ
    {
      id: 'openaq',
      name: 'OpenAQ Ambient Network',
      role: 'Real-time air quality & particulate matter',
      priority: 'MEDIUM',
      status: hOpenAq.status,
      httpStatus: hOpenAq.httpStatus,
      latencyMs: hOpenAq.latencyMs,
      errorCode: hOpenAq.errorCode,
      endpointUrl: 'https://api.openaq.org/v2/latest',
      lastChecked: new Date().toISOString(),
      message: hOpenAq.message,
      supportedVariables: ['PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'Ozone O3', 'Estimated AQI'],
    },
    // 11. Google Maps / CARTO GIS
    {
      id: 'google',
      name: 'Google Maps & CARTO GIS',
      role: 'GIS layer support, geocoding & municipal ward boundaries',
      priority: 'HIGH',
      status: hGoogle.status,
      httpStatus: hGoogle.httpStatus,
      latencyMs: hGoogle.latencyMs,
      errorCode: hGoogle.errorCode,
      endpointUrl: 'https://maps.googleapis.com/ & CARTO Positron Basemap',
      lastChecked: new Date().toISOString(),
      message: hGoogle.message,
      supportedVariables: ['Geocoding', 'Places', 'Thermal Routing', 'Ward Boundaries (GeoJSON)'],
    },
  ];

  cachedHealth = reports;
  lastHealthCheckTime = now;
  return reports;
}
