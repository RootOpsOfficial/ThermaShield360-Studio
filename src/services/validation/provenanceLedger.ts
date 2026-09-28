import {
  ThermaShieldNormalizedRecord,
  NormalizationValidationStatus,
  DataAvailabilityStatus,
} from '../normalization/thermaShieldRecord.js';
import { ValidationAuditResult, validateNormalizedRecord } from './validationEngine.js';
import { fetchOpenMeteoRaw } from '../data/openMeteo/openMeteoClient.js';
import { fetchEcmwfRaw } from '../data/ecmwf/ecmwfClient.js';
import { fetchNoaaGfsRaw } from '../data/noaa/gfs/gfsClient.js';
import { fetchCopernicusEra5Raw } from '../data/copernicus/era5Client.js';
import { fetchNasaPowerRaw } from '../data/nasa/power/nasaPowerClient.js';
import { fetchImdRaw } from '../data/imd/imdClient.js';
import {
  normalizeOpenMeteoPayload,
  normalizeEcmwfPayload,
  normalizeNoaaGfsPayload,
  normalizeCopernicusEra5Payload,
  normalizeNasaPowerPayload,
  normalizeImdPayload,
} from '../normalization/normalizerService.js';
import { isRecordQuarantined } from '../fusion/multiSourceFusionEngine.js';

export interface ProvenanceAuditEntry {
  // Canonical 25-Field Traceability Contract
  source: string;              // 1. Source
  provider: string;            // 2. Provider
  dataset: string;             // 3. Dataset
  model: string;               // 4. Model
  variable: string;            // 5. Variable
  value: string;               // 6. Value
  numericValue: number | null; // Value as raw number (or null)
  unit: string;                // 7. Unit
  dataType: string;            // 8. Data Type
  run: string | null;          // 9. Run
  issuedAt: string | null;     // 10. Issued At
  validTime: string | null;    // 11. Valid Time
  forecastLead: string | null; // 12. Forecast Lead
  latitude: number;            // 13. Latitude
  longitude: number;           // 14. Longitude
  sourceLatitude: number | null;  // 15. Source Latitude
  sourceLongitude: number | null; // 16. Source Longitude
  spatialMethod: string | null;   // 17. Spatial Method
  spatialDistanceKm: number | null; // 18. Spatial Distance (km)
  resolution: string | null;      // 19. Resolution
  spatialResolution: string | null; // Alias for Resolution
  retrievedAt: string;         // 20. Retrieved At
  availability: DataAvailabilityStatus; // 21. Availability
  validationStatus: NormalizationValidationStatus; // 22. Validation Status
  qualityStatus: string;       // 23. Quality Status
  errorCode?: string | null;   // 24. Error Code
  recordId: string;            // 25. Record ID

  // UI helpers
  type: string;
  checksPassed: string;
  details: string;
}

export interface ProvenanceLedgerState {
  lastUpdated: string;
  location: { lat: number; lng: number };
  entries: ProvenanceAuditEntry[];
  records: ThermaShieldNormalizedRecord[];
  auditResults: Record<string, ValidationAuditResult>;
}

let activeLedger: ProvenanceLedgerState | null = null;
let lastIngestTime = 0;
const LEDGER_TTL_MS = 60 * 1000; // 60 seconds cache

export function clearProvenanceCache(): void {
  activeLedger = null;
  lastIngestTime = 0;
}

export async function ingestAndAuditAllSources(
  lat: number = 18.5204,
  lng: number = 73.8567,
  forceRefresh = false
): Promise<ProvenanceLedgerState> {
  const now = Date.now();
  if (!forceRefresh && activeLedger && now - lastIngestTime < LEDGER_TTL_MS) {
    return activeLedger;
  }

  // Fetch all weather/climate sources in parallel
  const [
    openMeteoRaw,
    ecmwfRaw,
    noaaGfsRaw,
    era5Raw,
    nasaPowerRaw,
    imdRaw,
  ] = await Promise.all([
    fetchOpenMeteoRaw(lat, lng),
    fetchEcmwfRaw(lat, lng),
    fetchNoaaGfsRaw(lat, lng),
    fetchCopernicusEra5Raw(lat, lng),
    fetchNasaPowerRaw(lat, lng),
    fetchImdRaw(lat, lng),
  ]);

  // Normalize
  const openMeteoRecord = normalizeOpenMeteoPayload(openMeteoRaw);
  const ecmwfRecord = normalizeEcmwfPayload(ecmwfRaw);
  const noaaRecord = normalizeNoaaGfsPayload(noaaGfsRaw);
  const era5Record = normalizeCopernicusEra5Payload(era5Raw);
  const nasaRecord = normalizeNasaPowerPayload(nasaPowerRaw);
  const imdRecord = normalizeImdPayload(imdRaw);

  const rawRecords = [openMeteoRecord, ecmwfRecord, noaaRecord, era5Record, nasaRecord, imdRecord];
  const records = rawRecords.filter((rec) => !isRecordQuarantined(rec));

  // Validate each record
  const auditResults: Record<string, ValidationAuditResult> = {};
  records.forEach((rec) => {
    const audit = validateNormalizedRecord(rec, { lat, lng });
    auditResults[rec.id] = audit;
    rec.validationStatus = audit.overallStatus;
  });

  // Build provenance audit entries
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';
    } catch {
      return '12:04 IST';
    }
  };

  const getAuditPassedStr = (recId: string) => {
    const audit = auditResults[recId];
    return audit ? `${audit.passedCount}/${audit.totalChecks} Passed` : '0/7 Passed';
  };

  const buildEntry = (
    rec: ThermaShieldNormalizedRecord,
    variable: string,
    numVal: number | null,
    unit: string,
    typeLabel: string,
    details: string
  ): ProvenanceAuditEntry => {
    const isLiveOrDegraded = rec.availability === 'LIVE' || rec.availability === 'DEGRADED';
    const finalNumVal = isLiveOrDegraded ? numVal : null;
    const valueStr = finalNumVal !== null
      ? (unit === '%' || unit === 'W/m²' ? `${Math.round(finalNumVal)}${unit}` : `${finalNumVal.toFixed(1)}${unit ? ' ' + unit : ''}`)
      : 'NULL';

    return {
      variable,
      value: valueStr,
      numericValue: finalNumVal,
      unit,
      source: rec.source,
      provider: rec.provider,
      dataset: rec.dataset,
      model: rec.model,
      run: rec.run,
      issuedAt: rec.issuedAt,
      validTime: rec.validTime,
      forecastLead: rec.forecastLeadHours !== null ? `+${rec.forecastLeadHours}h` : null,
      latitude: rec.latitude,
      longitude: rec.longitude,
      sourceLatitude: rec.sourceLatitude,
      sourceLongitude: rec.sourceLongitude,
      spatialResolution: rec.resolution,
      resolution: rec.resolution,
      spatialMethod: rec.spatialMethod,
      spatialDistanceKm: rec.spatialDistanceKm,
      dataType: rec.dataType,
      retrievedAt: formatTime(rec.retrievedAt),
      qualityStatus: rec.qualityStatus,
      validationStatus: rec.validationStatus,
      availability: rec.availability,
      errorCode: rec.errorCode ?? null,
      recordId: rec.id,
      type: typeLabel,
      checksPassed: getAuditPassedStr(rec.id),
      details,
    };
  };

  const rawEntries: { rec: ThermaShieldNormalizedRecord; variable: string; val: number | null; unit: string; type: string; details: string }[] = [
    // Temperature entries
    { rec: openMeteoRecord, variable: 'Temperature', val: openMeteoRecord.temperatureC, unit: '°C', type: 'Current Observation', details: 'High-res operational mesh' },
    { rec: ecmwfRecord, variable: 'Temperature', val: ecmwfRecord.temperatureC, unit: '°C', type: 'Global Forecast (IFS)', details: 'ECMWF 0.25° dynamic core' },
    { rec: noaaRecord, variable: 'Temperature', val: noaaRecord.temperatureC, unit: '°C', type: 'Global Forecast (GFS)', details: 'NOAA 0.25° NWP cycle' },
    { rec: imdRecord, variable: 'Temperature', val: imdRecord.temperatureC, unit: '°C', type: 'In-Situ Station (IMD)', details: 'Shivajinagar AWS Observatory' },
    { rec: era5Record, variable: 'Temperature', val: era5Record.temperatureC, unit: '°C', type: 'Historical Reanalysis', details: 'WMO 30-year climatological normal' },

    // Relative Humidity entries
    { rec: openMeteoRecord, variable: 'Relative Humidity', val: openMeteoRecord.relativeHumidityPercent, unit: '%', type: 'Current Observation', details: 'Near-surface hygrometer reading' },
    { rec: ecmwfRecord, variable: 'Relative Humidity', val: ecmwfRecord.relativeHumidityPercent, unit: '%', type: 'Global Forecast (IFS)', details: 'Integrated Forecasting System 2m RH' },
    { rec: noaaRecord, variable: 'Relative Humidity', val: noaaRecord.relativeHumidityPercent, unit: '%', type: 'Global Forecast (GFS)', details: 'GFS 2m Relative Humidity' },
    { rec: imdRecord, variable: 'Relative Humidity', val: imdRecord.relativeHumidityPercent, unit: '%', type: 'In-Situ Station (IMD)', details: 'IMD Pune Psychrometer' },

    // Solar Radiation entries
    { rec: nasaRecord, variable: 'Solar Radiation', val: nasaRecord.solarRadiationWm2, unit: 'W/m²', type: 'Solar Irradiance (GHI)', details: 'NASA POWER satellite flux assimilation' },
    { rec: openMeteoRecord, variable: 'Solar Radiation', val: openMeteoRecord.solarRadiationWm2, unit: 'W/m²', type: 'Direct Normal Irradiance', details: 'Radiative transfer calculation' },

    // Wind Speed entries
    { rec: openMeteoRecord, variable: 'Wind Speed', val: openMeteoRecord.windSpeedMs, unit: 'm/s', type: 'Current Observation', details: '10m anemometer speed' },
    { rec: imdRecord, variable: 'Wind Speed', val: imdRecord.windSpeedMs, unit: 'm/s', type: 'Station Observation', details: 'IMD Pune Anemometer' },

    // Surface Pressure
    { rec: openMeteoRecord, variable: 'Surface Pressure', val: openMeteoRecord.surfacePressureHpa, unit: 'hPa', type: 'Current Observation', details: 'Station barometric pressure' },
  ];

  const entries: ProvenanceAuditEntry[] = rawEntries
    .filter((e) => records.some((r) => r.id === e.rec.id))
    .map((e) => buildEntry(e.rec, e.variable, e.val, e.unit, e.type, e.details));

  activeLedger = {
    lastUpdated: new Date().toISOString(),
    location: { lat, lng },
    entries,
    records,
    auditResults,
  };
  lastIngestTime = now;

  return activeLedger;
}
