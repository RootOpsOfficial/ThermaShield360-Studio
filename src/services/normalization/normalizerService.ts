import { RawProviderPayload } from '../data/types.js';
import { OpenMeteoRawData } from '../data/openMeteo/openMeteoTypes.js';
import { EcmwfRawData } from '../data/ecmwf/ecmwfTypes.js';
import { NoaaGfsRawData } from '../data/noaa/gfs/gfsTypes.js';
import { NoaaGefsRawData } from '../data/noaa/gefs/gefsTypes.js';
import { CopernicusEra5RawData } from '../data/copernicus/copernicusTypes.js';
import { NasaPowerRawData } from '../data/nasa/power/nasaPowerTypes.js';
import { ImdRawData } from '../data/imd/imdTypes.js';
import {
  NormalizedWeatherRecord,
  ThermaShieldNormalizedRecord,
  generateNormalizedRecordId,
  NormalizationQualityStatus,
  NormalizationValidationStatus,
} from './thermaShieldRecord.js';
import { kmhToMs, calculateDewPoint } from './unitConverter.js';

// Helper to determine if a payload represents accessible, non-failed data
function isPayloadOperational(availability: string): boolean {
  return availability === 'LIVE' || availability === 'DEGRADED';
}

// ==========================================
// 1. Open-Meteo Normalizer
// ==========================================
export function normalizeOpenMeteoPayload(
  payload: RawProviderPayload<OpenMeteoRawData>
): ThermaShieldNormalizedRecord {
  const isOperational = isPayloadOperational(payload.availability) && payload.rawData?.current != null;
  const current = payload.rawData?.current;

  // Strict null semantics: if unoperational or field missing, must be null
  const temp = isOperational && typeof current?.temperature_2m === 'number' && !isNaN(current.temperature_2m)
    ? Math.round(current.temperature_2m * 10) / 10
    : null;
  const rh = isOperational && typeof current?.relative_humidity_2m === 'number' && !isNaN(current.relative_humidity_2m)
    ? Math.round(current.relative_humidity_2m)
    : null;
  const ws = isOperational && typeof current?.wind_speed_10m === 'number' && !isNaN(current.wind_speed_10m)
    ? kmhToMs(current.wind_speed_10m)
    : null;
  const sp = isOperational && typeof current?.surface_pressure === 'number' && !isNaN(current.surface_pressure)
    ? Math.round(current.surface_pressure * 10) / 10
    : null;
  // If solar radiation is not in payload, strictly null (never substitute 0)
  const solar = isOperational && typeof current?.direct_normal_irradiance === 'number' && !isNaN(current.direct_normal_irradiance)
    ? Math.round(current.direct_normal_irradiance)
    : null;
  const dp = (temp !== null && rh !== null) ? calculateDewPoint(temp, rh) : null;

  const timestamp = current?.time ? new Date(current.time).toISOString() : payload.retrievedAt;
  const qualityStatus: NormalizationQualityStatus = isOperational ? (temp !== null ? 'VALID' : 'UNAVAILABLE') : 'UNAVAILABLE';
  const validationStatus: NormalizationValidationStatus = isOperational
    ? (payload.availability === 'DEGRADED' ? 'PARTIAL' : 'VERIFIED')
    : (payload.availability as NormalizationValidationStatus);
  const recordId = generateNormalizedRecordId('Open-Meteo', 'ICON-ECMWF-Mesh', payload.latitude, payload.longitude, timestamp);

  return {
    recordId,
    id: recordId,
    timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    temperatureC: temp,
    relativeHumidityPercent: rh,
    windSpeedMs: ws,
    solarRadiationWm2: solar,
    dewPointC: dp,
    surfacePressureHpa: sp,
    source: 'Open-Meteo',
    provider: 'Open-Meteo GmbH',
    dataset: 'NWP-Operational-Mesh',
    model: 'ICON / ECMWF Hybrid',
    run: payload.run || timestamp,
    issuedAt: payload.issuedAt || timestamp,
    validTime: payload.validTime || timestamp,
    forecastLeadHours: payload.forecastLeadHours ?? 0,
    sourceLatitude: payload.sourceLatitude ?? payload.latitude,
    sourceLongitude: payload.sourceLongitude ?? payload.longitude,
    spatialMethod: payload.spatialMethod ?? 'NEAREST',
    spatialDistanceKm: payload.spatialDistanceKm ?? 0,
    resolution: payload.resolution || '0.1 deg (~11km)',
    dataType: payload.dataType,
    sourceRole: payload.sourceRole,
    retrievedAt: payload.retrievedAt,
    qualityStatus,
    validationStatus,
    availability: payload.availability,
    errorCode: payload.errorCode ?? null,
    precipitationMm: isOperational && typeof current?.weather_code === 'number' ? null : null,
    uvIndex: null,
  };
}

// ==========================================
// 2. ECMWF IFS / AIFS Normalizer
// ==========================================
export function normalizeEcmwfPayload(
  payload: RawProviderPayload<EcmwfRawData>
): ThermaShieldNormalizedRecord {
  const isOperational = isPayloadOperational(payload.availability) && payload.rawData != null;
  const data = payload.rawData;

  const temp = isOperational && typeof data?.temperature_2m === 'number' && !isNaN(data.temperature_2m)
    ? Math.round(data.temperature_2m * 10) / 10
    : null;
  const rh = isOperational && typeof data?.relative_humidity_2m === 'number' && !isNaN(data.relative_humidity_2m)
    ? Math.round(data.relative_humidity_2m)
    : null;
  const ws = isOperational && typeof data?.wind_speed_10m_ms === 'number' && !isNaN(data.wind_speed_10m_ms)
    ? Math.round(data.wind_speed_10m_ms * 10) / 10
    : null;
  const dp = isOperational && typeof data?.dew_point_2m === 'number' && !isNaN(data.dew_point_2m)
    ? Math.round(data.dew_point_2m * 10) / 10
    : (temp !== null && rh !== null ? calculateDewPoint(temp, rh) : null);
  const sp = isOperational && typeof data?.surface_pressure_hpa === 'number' && !isNaN(data.surface_pressure_hpa)
    ? Math.round(data.surface_pressure_hpa * 10) / 10
    : null;
  const solar = isOperational && typeof data?.solar_radiation_wm2 === 'number' && !isNaN(data.solar_radiation_wm2)
    ? Math.round(data.solar_radiation_wm2)
    : null;

  const timestamp = payload.run || payload.retrievedAt;
  const qualityStatus: NormalizationQualityStatus = isOperational ? (temp !== null ? 'VALID' : 'UNAVAILABLE') : 'UNAVAILABLE';
  const validationStatus: NormalizationValidationStatus = isOperational
    ? (payload.availability === 'DEGRADED' ? 'PARTIAL' : 'VERIFIED')
    : (payload.availability as NormalizationValidationStatus);
  const recordId = generateNormalizedRecordId('ECMWF', data?.model || 'IFS', payload.latitude, payload.longitude, timestamp);

  return {
    recordId,
    id: recordId,
    timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    temperatureC: temp,
    relativeHumidityPercent: rh,
    windSpeedMs: ws,
    solarRadiationWm2: solar,
    dewPointC: dp,
    surfacePressureHpa: sp,
    source: 'ECMWF IFS',
    provider: 'European Centre for Medium-Range Weather Forecasts',
    dataset: 'Open-Data-IFS-0.25',
    model: data?.model || 'IFS',
    run: data?.run || timestamp,
    issuedAt: payload.issuedAt || timestamp,
    validTime: payload.validTime || timestamp,
    forecastLeadHours: payload.forecastLeadHours ?? 0,
    sourceLatitude: payload.sourceLatitude ?? payload.latitude,
    sourceLongitude: payload.sourceLongitude ?? payload.longitude,
    spatialMethod: payload.spatialMethod ?? 'GRID_CELL',
    spatialDistanceKm: payload.spatialDistanceKm ?? 0,
    resolution: data?.gridResolution || payload.resolution || '0.25 deg (~28km)',
    dataType: payload.dataType,
    sourceRole: payload.sourceRole,
    retrievedAt: payload.retrievedAt,
    qualityStatus,
    validationStatus,
    availability: payload.availability,
    errorCode: payload.errorCode ?? null,
    uvIndex: null,
  };
}

// ==========================================
// 3. NOAA GFS Normalizer
// ==========================================
export function normalizeNoaaGfsPayload(
  payload: RawProviderPayload<NoaaGfsRawData>
): ThermaShieldNormalizedRecord {
  const isOperational = isPayloadOperational(payload.availability) && payload.rawData != null;
  const data = payload.rawData;

  const temp = isOperational && typeof data?.temperature_2m_c === 'number' && !isNaN(data.temperature_2m_c)
    ? Math.round(data.temperature_2m_c * 10) / 10
    : null;
  const rh = isOperational && typeof data?.relative_humidity_2m_pct === 'number' && !isNaN(data.relative_humidity_2m_pct)
    ? Math.round(data.relative_humidity_2m_pct)
    : null;
  const ws = isOperational && typeof data?.wind_speed_10m_ms === 'number' && !isNaN(data.wind_speed_10m_ms)
    ? Math.round(data.wind_speed_10m_ms * 10) / 10
    : null;
  const dp = isOperational && typeof data?.dew_point_2m_c === 'number' && !isNaN(data.dew_point_2m_c)
    ? Math.round(data.dew_point_2m_c * 10) / 10
    : (temp !== null && rh !== null ? calculateDewPoint(temp, rh) : null);
  const sp = isOperational && typeof data?.surface_pressure_hpa === 'number' && !isNaN(data.surface_pressure_hpa)
    ? Math.round(data.surface_pressure_hpa * 10) / 10
    : null;
  const solar = isOperational && typeof data?.solar_radiation_wm2 === 'number' && !isNaN(data.solar_radiation_wm2)
    ? Math.round(data.solar_radiation_wm2)
    : null;
  const precip = isOperational && typeof data?.precip_rate_mm_hr === 'number' && !isNaN(data.precip_rate_mm_hr)
    ? data.precip_rate_mm_hr
    : null;

  const timestamp = data?.runTime || payload.retrievedAt;
  const qualityStatus: NormalizationQualityStatus = isOperational ? (temp !== null ? 'VALID' : 'UNAVAILABLE') : 'UNAVAILABLE';
  const validationStatus: NormalizationValidationStatus = isOperational
    ? (payload.availability === 'DEGRADED' ? 'PARTIAL' : 'VERIFIED')
    : (payload.availability as NormalizationValidationStatus);
  const recordId = generateNormalizedRecordId('NOAA-GFS', data?.model || 'GFS', payload.latitude, payload.longitude, timestamp);

  return {
    recordId,
    id: recordId,
    timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    temperatureC: temp,
    relativeHumidityPercent: rh,
    windSpeedMs: ws,
    solarRadiationWm2: solar,
    dewPointC: dp,
    surfacePressureHpa: sp,
    source: 'NOAA GFS',
    provider: 'National Oceanic and Atmospheric Administration (NCEP)',
    dataset: 'GFS-Global-0.25',
    model: data?.model || 'GFS-0.25',
    run: data?.runTime || timestamp,
    issuedAt: payload.issuedAt || timestamp,
    validTime: payload.validTime || timestamp,
    forecastLeadHours: payload.forecastLeadHours ?? 0,
    sourceLatitude: payload.sourceLatitude ?? payload.latitude,
    sourceLongitude: payload.sourceLongitude ?? payload.longitude,
    spatialMethod: payload.spatialMethod ?? 'GRID_CELL',
    spatialDistanceKm: payload.spatialDistanceKm ?? 0,
    resolution: data?.gridResolution || payload.resolution || '0.25 deg (~28km)',
    dataType: payload.dataType,
    sourceRole: payload.sourceRole,
    retrievedAt: payload.retrievedAt,
    qualityStatus,
    validationStatus,
    availability: payload.availability,
    errorCode: payload.errorCode ?? null,
    precipitationMm: precip,
    uvIndex: null,
  };
}

// ==========================================
// 4. NOAA GEFS Ensemble Normalizer
// ==========================================
export function normalizeNoaaGefsPayload(
  payload: RawProviderPayload<NoaaGefsRawData>
): ThermaShieldNormalizedRecord {
  const isOperational = isPayloadOperational(payload.availability) && payload.rawData != null;
  const data = payload.rawData;

  const temp = isOperational && typeof data?.ensembleMeanTempC === 'number' && !isNaN(data.ensembleMeanTempC)
    ? Math.round(data.ensembleMeanTempC * 10) / 10
    : null;
  const rh = isOperational && typeof data?.relativeHumidityMeanPct === 'number' && !isNaN(data.relativeHumidityMeanPct)
    ? Math.round(data.relativeHumidityMeanPct)
    : null;
  const ws = isOperational && typeof data?.windSpeedMeanMs === 'number' && !isNaN(data.windSpeedMeanMs)
    ? Math.round(data.windSpeedMeanMs * 10) / 10
    : null;
  const dp = (temp !== null && rh !== null) ? calculateDewPoint(temp, rh) : null;

  // Strict NULL: GEFS ensemble does not report surface pressure or solar radiation. Zero fake constants.
  const sp = null;
  const solar = null;

  const timestamp = data?.run || payload.retrievedAt;
  const qualityStatus: NormalizationQualityStatus = isOperational ? (temp !== null ? 'VALID' : 'UNAVAILABLE') : 'UNAVAILABLE';
  const validationStatus: NormalizationValidationStatus = isOperational
    ? (payload.availability === 'DEGRADED' ? 'PARTIAL' : 'VERIFIED')
    : (payload.availability as NormalizationValidationStatus);
  const recordId = generateNormalizedRecordId('NOAA-GEFS', data?.model || 'GEFS-31', payload.latitude, payload.longitude, timestamp);

  return {
    recordId,
    id: recordId,
    timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    temperatureC: temp,
    relativeHumidityPercent: rh,
    windSpeedMs: ws,
    solarRadiationWm2: solar,
    dewPointC: dp,
    surfacePressureHpa: sp,
    source: 'NOAA GEFS',
    provider: 'National Oceanic and Atmospheric Administration (NCEP)',
    dataset: 'GEFS-31-Member-Ensemble',
    model: data?.model || 'GEFS-Ensemble',
    run: data?.run || timestamp,
    issuedAt: payload.issuedAt || timestamp,
    validTime: payload.validTime || timestamp,
    forecastLeadHours: payload.forecastLeadHours ?? 168,
    sourceLatitude: payload.sourceLatitude ?? payload.latitude,
    sourceLongitude: payload.sourceLongitude ?? payload.longitude,
    spatialMethod: payload.spatialMethod ?? 'GRID_CELL',
    spatialDistanceKm: payload.spatialDistanceKm ?? 0,
    resolution: payload.resolution || '0.5 deg (~55km)',
    dataType: payload.dataType,
    sourceRole: payload.sourceRole,
    retrievedAt: payload.retrievedAt,
    qualityStatus,
    validationStatus,
    availability: payload.availability,
    errorCode: payload.errorCode ?? null,
  };
}

// ==========================================
// 5. Copernicus ERA5 Reanalysis Normalizer
// ==========================================
export function normalizeCopernicusEra5Payload(
  payload: RawProviderPayload<CopernicusEra5RawData>
): ThermaShieldNormalizedRecord {
  const isOperational = isPayloadOperational(payload.availability) && payload.rawData != null;
  const data = payload.rawData;

  const temp = isOperational && typeof data?.baselineMeanTempC === 'number' && !isNaN(data.baselineMeanTempC)
    ? Math.round(data.baselineMeanTempC * 10) / 10
    : null;
  const rh = isOperational && typeof data?.baselineRelativeHumidityPct === 'number' && !isNaN(data.baselineRelativeHumidityPct)
    ? Math.round(data.baselineRelativeHumidityPct)
    : null;
  const ws = isOperational && typeof data?.baselineWindSpeedMs === 'number' && !isNaN(data.baselineWindSpeedMs)
    ? Math.round(data.baselineWindSpeedMs * 10) / 10
    : null;
  const dp = (temp !== null && rh !== null) ? calculateDewPoint(temp, rh) : null;
  const sp = isOperational && typeof data?.surfacePressureHpa === 'number' && !isNaN(data.surfacePressureHpa)
    ? Math.round(data.surfacePressureHpa * 10) / 10
    : null;
  const solar = isOperational && typeof data?.solarRadiationWm2 === 'number' && !isNaN(data.solarRadiationWm2)
    ? Math.round(data.solarRadiationWm2)
    : null;

  const timestamp = data?.reanalysisRunDate || payload.retrievedAt;
  const qualityStatus: NormalizationQualityStatus = isOperational ? (temp !== null ? 'VALID' : 'UNAVAILABLE') : 'UNAVAILABLE';
  const validationStatus: NormalizationValidationStatus = isOperational
    ? (payload.availability === 'DEGRADED' ? 'PARTIAL' : 'VERIFIED')
    : (payload.availability as NormalizationValidationStatus);
  const recordId = generateNormalizedRecordId('ERA5', 'ERA5-Reanalysis', payload.latitude, payload.longitude, timestamp);

  return {
    recordId,
    id: recordId,
    timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    temperatureC: temp,
    relativeHumidityPercent: rh,
    windSpeedMs: ws,
    solarRadiationWm2: solar,
    dewPointC: dp,
    surfacePressureHpa: sp,
    source: 'ERA5',
    provider: 'Copernicus Climate Change Service (ECMWF)',
    dataset: 'ERA5-Single-Levels',
    model: 'ERA5-Reanalysis',
    run: timestamp,
    issuedAt: payload.issuedAt || timestamp,
    validTime: payload.validTime || timestamp,
    forecastLeadHours: 0,
    sourceLatitude: payload.sourceLatitude ?? payload.latitude,
    sourceLongitude: payload.sourceLongitude ?? payload.longitude,
    spatialMethod: payload.spatialMethod ?? 'GRID_CELL',
    spatialDistanceKm: payload.spatialDistanceKm ?? 0,
    resolution: data?.grid || payload.resolution || '0.25 deg (~28km)',
    dataType: payload.dataType,
    sourceRole: payload.sourceRole,
    retrievedAt: payload.retrievedAt,
    qualityStatus,
    validationStatus,
    availability: payload.availability,
    errorCode: payload.errorCode ?? null,
  };
}

// ==========================================
// 6. NASA POWER Normalizer
// ==========================================
export function normalizeNasaPowerPayload(
  payload: RawProviderPayload<NasaPowerRawData>
): ThermaShieldNormalizedRecord {
  const isOperational = isPayloadOperational(payload.availability) && payload.rawData?.currentSample != null;
  const sample = payload.rawData?.currentSample;

  const temp = isOperational && typeof sample?.temperatureC === 'number' && !isNaN(sample.temperatureC)
    ? Math.round(sample.temperatureC * 10) / 10
    : null;
  const rh = isOperational && typeof sample?.relativeHumidityPct === 'number' && !isNaN(sample.relativeHumidityPct)
    ? Math.round(sample.relativeHumidityPct)
    : null;
  const ws = isOperational && typeof sample?.windSpeedMs === 'number' && !isNaN(sample.windSpeedMs)
    ? Math.round(sample.windSpeedMs * 10) / 10
    : null;
  const dp = (temp !== null && rh !== null) ? calculateDewPoint(temp, rh) : null;
  const sp = isOperational && typeof sample?.surfacePressureHpa === 'number' && !isNaN(sample.surfacePressureHpa)
    ? Math.round(sample.surfacePressureHpa * 10) / 10
    : null;
  const solar = isOperational && typeof sample?.solarIrradianceWm2 === 'number' && !isNaN(sample.solarIrradianceWm2)
    ? Math.round(sample.solarIrradianceWm2)
    : null;

  const timestamp = payload.retrievedAt;
  const qualityStatus: NormalizationQualityStatus = isOperational ? (temp !== null ? 'VALID' : 'UNAVAILABLE') : 'UNAVAILABLE';
  const validationStatus: NormalizationValidationStatus = isOperational
    ? (payload.availability === 'DEGRADED' ? 'PARTIAL' : 'VERIFIED')
    : (payload.availability as NormalizationValidationStatus);
  const recordId = generateNormalizedRecordId('NASA-POWER', 'MERRA-2', payload.latitude, payload.longitude, timestamp);

  return {
    recordId,
    id: recordId,
    timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    temperatureC: temp,
    relativeHumidityPercent: rh,
    windSpeedMs: ws,
    solarRadiationWm2: solar,
    dewPointC: dp,
    surfacePressureHpa: sp,
    source: 'NASA POWER',
    provider: 'NASA Langley Research Center',
    dataset: 'POWER-Hourly-Point',
    model: 'MERRA-2 / GEOS-5',
    run: payload.run || timestamp,
    issuedAt: payload.issuedAt || timestamp,
    validTime: payload.validTime || timestamp,
    forecastLeadHours: 0,
    sourceLatitude: payload.sourceLatitude ?? payload.latitude,
    sourceLongitude: payload.sourceLongitude ?? payload.longitude,
    spatialMethod: payload.spatialMethod ?? 'GRID_CELL',
    spatialDistanceKm: payload.spatialDistanceKm ?? 0,
    resolution: payload.resolution || '0.5 x 0.625 deg',
    dataType: payload.dataType,
    sourceRole: payload.sourceRole,
    retrievedAt: payload.retrievedAt,
    qualityStatus,
    validationStatus,
    availability: payload.availability,
    errorCode: payload.errorCode ?? null,
  };
}

// ==========================================
// 7. IMD In-Situ Station Normalizer
// ==========================================
export function normalizeImdPayload(
  payload: RawProviderPayload<ImdRawData>
): ThermaShieldNormalizedRecord {
  const isOperational = isPayloadOperational(payload.availability) && payload.rawData?.station != null;
  const station = payload.rawData?.station;

  const temp = isOperational && typeof station?.currentTemperatureC === 'number' && !isNaN(station.currentTemperatureC)
    ? Math.round(station.currentTemperatureC * 10) / 10
    : null;
  const rh = isOperational && typeof station?.relativeHumidityPct === 'number' && !isNaN(station.relativeHumidityPct)
    ? Math.round(station.relativeHumidityPct)
    : null;
  const ws = isOperational && typeof station?.windSpeedKmh === 'number' && !isNaN(station.windSpeedKmh)
    ? kmhToMs(station.windSpeedKmh)
    : null;
  const sp = isOperational && typeof station?.pressureHpa === 'number' && !isNaN(station.pressureHpa)
    ? Math.round(station.pressureHpa * 10) / 10
    : null;
  const dp = (temp !== null && rh !== null) ? calculateDewPoint(temp, rh) : null;
  const solar = null; // Ground station does not report direct solar radiation flux
  const precip = isOperational && typeof station?.rainfallPast24hMm === 'number' && !isNaN(station.rainfallPast24hMm)
    ? station.rainfallPast24hMm
    : null;

  const timestamp = station?.observedAt || payload.retrievedAt;
  const qualityStatus: NormalizationQualityStatus = isOperational ? (temp !== null ? 'VALID' : 'UNAVAILABLE') : 'UNAVAILABLE';
  const validationStatus: NormalizationValidationStatus = isOperational
    ? (payload.availability === 'DEGRADED' ? 'PARTIAL' : 'VERIFIED')
    : (payload.availability as NormalizationValidationStatus);
  const recordId = generateNormalizedRecordId('IMD', 'IMD-AWS-Mesh', payload.latitude, payload.longitude, timestamp);

  return {
    recordId,
    id: recordId,
    timestamp,
    latitude: payload.latitude,
    longitude: payload.longitude,
    temperatureC: temp,
    relativeHumidityPercent: rh,
    windSpeedMs: ws,
    solarRadiationWm2: solar,
    dewPointC: dp,
    surfacePressureHpa: sp,
    source: 'IMD',
    provider: 'India Meteorological Department (Mausam)',
    dataset: 'AWS-Surface-Observatory',
    model: 'Pune Lohegaon / Shivajinagar In-Situ',
    run: timestamp,
    issuedAt: payload.issuedAt || timestamp,
    validTime: payload.validTime || timestamp,
    forecastLeadHours: 0,
    sourceLatitude: payload.sourceLatitude ?? 18.5314,
    sourceLongitude: payload.sourceLongitude ?? 73.8446,
    spatialMethod: payload.spatialMethod ?? 'STATION',
    spatialDistanceKm: payload.spatialDistanceKm ?? 0,
    resolution: 'Station point (~1km radius)',
    dataType: payload.dataType,
    sourceRole: payload.sourceRole,
    retrievedAt: payload.retrievedAt,
    qualityStatus,
    validationStatus,
    availability: payload.availability,
    errorCode: payload.errorCode ?? null,
    precipitationMm: precip,
  };
}

// ==========================================
// 8. Generic Normalizer
// ==========================================
export function normalizeAnyPayload(payload: RawProviderPayload<any>): ThermaShieldNormalizedRecord {
  switch (payload.providerId) {
    case 'openMeteo':
      return normalizeOpenMeteoPayload(payload as RawProviderPayload<OpenMeteoRawData>);
    case 'ecmwf':
      return normalizeEcmwfPayload(payload as RawProviderPayload<EcmwfRawData>);
    case 'noaaGfs':
      return normalizeNoaaGfsPayload(payload as RawProviderPayload<NoaaGfsRawData>);
    case 'noaaGefs':
      return normalizeNoaaGefsPayload(payload as RawProviderPayload<NoaaGefsRawData>);
    case 'copernicusEra5':
      return normalizeCopernicusEra5Payload(payload as RawProviderPayload<CopernicusEra5RawData>);
    case 'nasaPower':
      return normalizeNasaPowerPayload(payload as RawProviderPayload<NasaPowerRawData>);
    case 'imd':
      return normalizeImdPayload(payload as RawProviderPayload<ImdRawData>);
    default: {
      const isOperational = isPayloadOperational(payload.availability);
      const recordId = generateNormalizedRecordId(
        payload.provider,
        payload.model || 'Standard',
        payload.latitude,
        payload.longitude,
        payload.retrievedAt
      );

      return {
        recordId,
        id: recordId,
        timestamp: payload.retrievedAt,
        latitude: payload.latitude,
        longitude: payload.longitude,
        temperatureC: null,
        relativeHumidityPercent: null,
        windSpeedMs: null,
        solarRadiationWm2: null,
        dewPointC: null,
        surfacePressureHpa: null,
        source: payload.provider,
        provider: payload.provider,
        dataset: 'Standard-Dataset',
        model: payload.model || 'Standard',
        run: payload.run || payload.retrievedAt,
        issuedAt: payload.issuedAt || payload.retrievedAt,
        validTime: payload.validTime || payload.retrievedAt,
        forecastLeadHours: payload.forecastLeadHours || 0,
        sourceLatitude: payload.sourceLatitude ?? payload.latitude,
        sourceLongitude: payload.sourceLongitude ?? payload.longitude,
        spatialMethod: payload.spatialMethod ?? 'NEAREST',
        spatialDistanceKm: payload.spatialDistanceKm ?? 0,
        resolution: payload.resolution || '0.25 deg',
        dataType: payload.dataType,
        sourceRole: payload.sourceRole,
        retrievedAt: payload.retrievedAt,
        qualityStatus: isOperational ? 'VALID' : 'UNAVAILABLE',
        validationStatus: isOperational ? 'VERIFIED' : (payload.availability as NormalizationValidationStatus),
        availability: payload.availability,
        errorCode: payload.errorCode ?? null,
      };
    }
  }
}
