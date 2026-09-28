import assert from 'node:assert';
import {
  setProviderFetchInterceptor,
  createUnavailablePayload,
} from '../services/data/clientUtils.js';
import { fetchOpenMeteoRaw } from '../services/data/openMeteo/openMeteoClient.js';
import { fetchEcmwfRaw } from '../services/data/ecmwf/ecmwfClient.js';
import { fetchNoaaGfsRaw } from '../services/data/noaa/gfs/gfsClient.js';
import {
  normalizeOpenMeteoPayload,
  normalizeEcmwfPayload,
  normalizeNoaaGfsPayload,
} from '../services/normalization/normalizerService.js';
import {
  ingestAndAuditAllSources,
  clearProvenanceCache,
} from '../services/validation/provenanceLedger.js';
import {
  fuseMultiSourceRecords,
  isRecordQuarantined,
} from '../services/fusion/multiSourceFusionEngine.js';
import { validateNormalizedRecord } from '../services/validation/validationEngine.js';
import { clearProviderHealthCache, checkAllProvidersHealth } from '../services/data/providerHealthService.js';
import { calculateWBGT, calculateUTCI, calculateHeatIndex } from '../server/thermalEngine.js';

export async function runPhase1TestSuite(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║        THERMASHIELD 360 — PHASE 1 VALIDATION & RECOVERY SUITE     ║');
  console.log('║        Strict NULL Semantics & Provider Availability Verification ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

  // Reset interceptor at start
  setProviderFetchInterceptor(null);
  clearProvenanceCache();
  clearProviderHealthCache();

  // -------------------------------------------------------------
  // Test 1: LIVE Provider
  // -------------------------------------------------------------
  console.log('Test 1: LIVE Provider Payload & Schema Integrity');
  const livePayload = await fetchOpenMeteoRaw(18.5204, 73.8567);
  assert.ok(
    livePayload.availability === 'LIVE' || livePayload.availability === 'DEGRADED',
    `Expected LIVE or DEGRADED, got ${livePayload.availability}`
  );
  assert.strictEqual(livePayload.httpStatus, 200);
  assert.ok(livePayload.rawData !== null, 'LIVE payload must contain rawData');
  const normalizedLive = normalizeOpenMeteoPayload(livePayload);
  assert.ok(typeof normalizedLive.temperatureC === 'number', 'LIVE temperature must be a valid number');
  assert.ok(normalizedLive.validationStatus === 'VERIFIED' || normalizedLive.validationStatus === 'PARTIAL');
  console.log(`  ✓ LIVE provider verified: ${normalizedLive.source} -> ${normalizedLive.temperatureC}°C [${normalizedLive.availability}]`);

  // -------------------------------------------------------------
  // Test 2: HTTP 401 Unauthorized
  // -------------------------------------------------------------
  console.log('\nTest 2: HTTP 401 Unauthorized Handling');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'openMeteo') {
      return createUnavailablePayload({
        provider: 'Open-Meteo',
        providerId: 'openMeteo',
        sourceUrl: 'https://api.open-meteo.com/v1/forecast',
        model: 'ICON-Mesh',
        availability: 'AUTH_ERROR',
        httpStatus: 401,
        responseTimeMs: 45,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'HTTP 401 Unauthorized: Invalid API key',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  const p401 = await fetchOpenMeteoRaw(18.5204, 73.8567);
  assert.strictEqual(p401.availability, 'AUTH_ERROR');
  assert.strictEqual(p401.errorCode, 'HTTP_401');
  assert.strictEqual(p401.httpStatus, 401);
  assert.strictEqual(p401.rawData, null);
  const norm401 = normalizeOpenMeteoPayload(p401);
  assert.strictEqual(norm401.temperatureC, null, 'HTTP 401 temperature must be NULL');
  assert.strictEqual(norm401.relativeHumidityPercent, null, 'HTTP 401 RH must be NULL');
  assert.strictEqual(norm401.availability, 'AUTH_ERROR');
  assert.strictEqual(norm401.errorCode, 'HTTP_401');
  assert.strictEqual(norm401.validationStatus, 'AUTH_ERROR', 'HTTP 401 must maintain AUTH_ERROR validation status');
  console.log('  ✓ HTTP 401 correctly yields AUTH_ERROR with strict NULL variables and errorCode HTTP_401');

  // -------------------------------------------------------------
  // Test 3: HTTP 403 Forbidden
  // -------------------------------------------------------------
  console.log('\nTest 3: HTTP 403 Forbidden Handling');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'ecmwf') {
      return createUnavailablePayload({
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: 'https://data.ecmwf.int/',
        model: 'IFS-0.25',
        availability: 'AUTH_ERROR',
        httpStatus: 403,
        responseTimeMs: 38,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'HTTP 403 Forbidden: IP address access restricted',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  const p403 = await fetchEcmwfRaw(18.5204, 73.8567);
  assert.strictEqual(p403.availability, 'AUTH_ERROR');
  assert.strictEqual(p403.errorCode, 'HTTP_403');
  assert.strictEqual(p403.httpStatus, 403);
  const norm403 = normalizeEcmwfPayload(p403);
  assert.strictEqual(norm403.temperatureC, null);
  assert.strictEqual(norm403.dewPointC, null);
  assert.strictEqual(norm403.availability, 'AUTH_ERROR');
  assert.strictEqual(norm403.errorCode, 'HTTP_403');
  assert.strictEqual(norm403.validationStatus, 'AUTH_ERROR', 'HTTP 403 must maintain AUTH_ERROR validation status');
  console.log('  ✓ HTTP 403 correctly yields AUTH_ERROR with strict NULL variables and errorCode HTTP_403');

  // -------------------------------------------------------------
  // Test 4: HTTP 429 Rate Limited
  // -------------------------------------------------------------
  console.log('\nTest 4: HTTP 429 Rate Limited Handling');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'noaaGfs') {
      return createUnavailablePayload({
        provider: 'NOAA GFS',
        providerId: 'noaaGfs',
        sourceUrl: 'https://nomads.ncep.noaa.gov/',
        model: 'GFS-0.25',
        availability: 'RATE_LIMITED',
        httpStatus: 429,
        responseTimeMs: 25,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'HTTP 429 Too Many Requests: Cooldown active',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  const p429 = await fetchNoaaGfsRaw(18.5204, 73.8567);
  assert.strictEqual(p429.availability, 'RATE_LIMITED');
  assert.strictEqual(p429.errorCode, 'HTTP_429');
  assert.strictEqual(p429.httpStatus, 429);
  const norm429 = normalizeNoaaGfsPayload(p429);
  assert.strictEqual(norm429.temperatureC, null);
  assert.strictEqual(norm429.solarRadiationWm2, null);
  assert.strictEqual(norm429.availability, 'RATE_LIMITED');
  assert.strictEqual(norm429.errorCode, 'HTTP_429');
  assert.strictEqual(norm429.validationStatus, 'RATE_LIMITED');
  console.log('  ✓ HTTP 429 correctly yields RATE_LIMITED with strict NULL variables and errorCode HTTP_429');

  // -------------------------------------------------------------
  // Test 5: Timeout / Aborted Controller
  // -------------------------------------------------------------
  console.log('\nTest 5: Timeout Handling');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'openMeteo') {
      return createUnavailablePayload({
        provider: 'Open-Meteo',
        providerId: 'openMeteo',
        sourceUrl: 'https://api.open-meteo.com/v1/forecast',
        model: 'ICON-Mesh',
        availability: 'TIMEOUT',
        httpStatus: 0,
        responseTimeMs: 6000,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'Request exceeded timeout limit',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  const pTimeout = await fetchOpenMeteoRaw(18.5204, 73.8567);
  assert.strictEqual(pTimeout.availability, 'TIMEOUT');
  assert.strictEqual(pTimeout.errorCode, 'REQUEST_TIMEOUT');
  assert.strictEqual(pTimeout.httpStatus, 0);
  const normTimeout = normalizeOpenMeteoPayload(pTimeout);
  assert.strictEqual(normTimeout.temperatureC, null);
  assert.strictEqual(normTimeout.availability, 'TIMEOUT');
  assert.strictEqual(normTimeout.errorCode, 'REQUEST_TIMEOUT');
  assert.strictEqual(normTimeout.validationStatus, 'TIMEOUT');
  console.log('  ✓ Connection timeout correctly yields TIMEOUT with strict NULL variables and errorCode REQUEST_TIMEOUT');

  // -------------------------------------------------------------
  // Test 6: HTTP 500 / 503 Server Error
  // -------------------------------------------------------------
  console.log('\nTest 6: HTTP 500/503 Upstream Failure');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'ecmwf') {
      return createUnavailablePayload({
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: 'https://data.ecmwf.int/',
        model: 'IFS-0.25',
        availability: 'NOT_AVAILABLE',
        httpStatus: 503,
        responseTimeMs: 120,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'HTTP 503 Service Unavailable: Gateway maintenance',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  const p503 = await fetchEcmwfRaw(18.5204, 73.8567);
  assert.strictEqual(p503.availability, 'NOT_AVAILABLE');
  assert.strictEqual(p503.errorCode, 'HTTP_503');
  assert.strictEqual(p503.httpStatus, 503);
  const norm503 = normalizeEcmwfPayload(p503);
  assert.strictEqual(norm503.temperatureC, null);
  assert.strictEqual(norm503.availability, 'NOT_AVAILABLE');
  assert.strictEqual(norm503.errorCode, 'HTTP_503');
  assert.strictEqual(norm503.validationStatus, 'NOT_AVAILABLE');
  console.log('  ✓ HTTP 503 correctly yields NOT_AVAILABLE with strict NULL variables and errorCode HTTP_503');

  // -------------------------------------------------------------
  // Test 7: HTTP 200 Invalid Payload (HTML / Corrupt JSON)
  // -------------------------------------------------------------
  console.log('\nTest 7: HTTP 200 Malformed Payload Handling');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'openMeteo') {
      return createUnavailablePayload({
        provider: 'Open-Meteo',
        providerId: 'openMeteo',
        sourceUrl: 'https://api.open-meteo.com/v1/forecast',
        model: 'ICON-Mesh',
        availability: 'INVALID_RESPONSE',
        httpStatus: 200,
        responseTimeMs: 80,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'Invalid JSON payload received from provider: Unexpected token < in JSON',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  const pInvalid = await fetchOpenMeteoRaw(18.5204, 73.8567);
  assert.strictEqual(pInvalid.availability, 'INVALID_RESPONSE');
  assert.strictEqual(pInvalid.errorCode, 'INVALID_JSON');
  assert.strictEqual(pInvalid.httpStatus, 200);
  const normInvalid = normalizeOpenMeteoPayload(pInvalid);
  assert.strictEqual(normInvalid.temperatureC, null);
  assert.strictEqual(normInvalid.availability, 'INVALID_RESPONSE');
  assert.strictEqual(normInvalid.errorCode, 'INVALID_JSON');
  assert.strictEqual(normInvalid.validationStatus, 'INVALID_RESPONSE');
  console.log('  ✓ HTTP 200 HTML error body correctly detected as INVALID_RESPONSE with NULL values and errorCode INVALID_JSON');

  // -------------------------------------------------------------
  // Test 8: Valid Partial Payload (DEGRADED)
  // -------------------------------------------------------------
  console.log('\nTest 8: Valid Partial Payload (DEGRADED)');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'openMeteo') {
      return {
        provider: 'Open-Meteo',
        providerId: 'openMeteo',
        sourceUrl: 'https://api.open-meteo.com/v1/forecast',
        model: 'ICON-Mesh',
        run: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
        validTime: new Date().toISOString(),
        forecastLeadHours: 0,
        resolution: '0.1 deg (~11km)',
        latitude: lat,
        longitude: lng,
        sourceLatitude: lat,
        sourceLongitude: lng,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: 0,
        retrievedAt: new Date().toISOString(),
        httpStatus: 200,
        responseTimeMs: 65,
        dataType: 'FORECAST',
        sourceRole: 'OPERATIONAL_FORECAST',
        availability: 'DEGRADED',
        isFallback: false,
        errorMessage: 'Payload has partial variable coverage',
        rawData: {
          latitude: lat,
          longitude: lng,
          current: {
            time: new Date().toISOString(),
            temperature_2m: 33.4,
            // relative_humidity_2m, wind_speed_10m missing
          } as any,
        } as any,
      };
    }
    return null;
  });

  const pDegraded = await fetchOpenMeteoRaw(18.5204, 73.8567);
  assert.strictEqual(pDegraded.availability, 'DEGRADED');
  const normDegraded = normalizeOpenMeteoPayload(pDegraded);
  assert.strictEqual(normDegraded.temperatureC, 33.4);
  assert.strictEqual(normDegraded.relativeHumidityPercent, null, 'Missing humidity must be strictly NULL');
  assert.strictEqual(normDegraded.windSpeedMs, null, 'Missing wind speed must be strictly NULL');
  assert.strictEqual(normDegraded.validationStatus, 'PARTIAL');
  console.log('  ✓ Partial payload correctly classified as DEGRADED with PARTIAL status and NULL secondary variables');

  // -------------------------------------------------------------
  // Test 9: Unavailable Product / Geographic Bounds
  // -------------------------------------------------------------
  console.log('\nTest 9: Unavailable Product');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'noaaGfs') {
      return createUnavailablePayload({
        provider: 'NOAA GFS',
        providerId: 'noaaGfs',
        sourceUrl: 'https://nomads.ncep.noaa.gov/',
        model: 'GFS-0.25',
        availability: 'NOT_AVAILABLE',
        httpStatus: 404,
        responseTimeMs: 50,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'Requested variable/model not available for this spatial domain',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  const pUnavail = await fetchNoaaGfsRaw(18.5204, 73.8567);
  assert.strictEqual(pUnavail.availability, 'NOT_AVAILABLE');
  const normUnavail = normalizeNoaaGfsPayload(pUnavail);
  assert.strictEqual(normUnavail.temperatureC, null);
  console.log('  ✓ Unavailable product correctly yields NOT_AVAILABLE with NULL values');

  // -------------------------------------------------------------
  // Test 10: DEMO Record Quarantine in DATA_MODE=live
  // -------------------------------------------------------------
  console.log('\nTest 10: DEMO Quarantine in DATA_MODE=live');
  const prevDataMode = process.env.DATA_MODE;
  process.env.DATA_MODE = 'live';

  const demoRecord = {
    ...normDegraded,
    id: 'demo_record_001',
    recordId: 'demo_record_001',
    dataType: 'DEMO' as any,
    temperatureC: 48.5,
  };
  const liveRecord = {
    ...normDegraded,
    id: 'live_record_001',
    recordId: 'live_record_001',
    source: 'ECMWF IFS',
    sourceRole: 'OPERATIONAL_FORECAST' as any,
    availability: 'LIVE' as any,
    dataType: 'FORECAST' as any,
    temperatureC: 31.0,
  };

  assert.strictEqual(isRecordQuarantined(demoRecord), true, 'DEMO record must be flagged as quarantined');
  assert.strictEqual(isRecordQuarantined(liveRecord), false, 'Live record must NOT be quarantined');

  const fusedDemoTest = fuseMultiSourceRecords([demoRecord, liveRecord]);
  assert.strictEqual(fusedDemoTest.contributingModels.length, 1);
  assert.strictEqual(fusedDemoTest.contributingModels[0].source, 'ECMWF IFS');
  assert.strictEqual(fusedDemoTest.fusedTemperatureC, 31.0, 'DEMO temperature must NEVER affect fused consensus');
  console.log('  ✓ DEMO record successfully quarantined: excluded from operational fusion and consensus');

  process.env.DATA_MODE = prevDataMode;

  // -------------------------------------------------------------
  // Test 11: Missing Numeric Variable
  // -------------------------------------------------------------
  console.log('\nTest 11: Missing Numeric Variable Audit');
  const missingVarRecord = {
    ...normDegraded,
    id: 'rec_missing_temp',
    availability: 'LIVE' as any,
    temperatureC: null,
  };
  const auditMissing = validateNormalizedRecord(missingVarRecord);
  assert.strictEqual(auditMissing.overallStatus, 'FAILED', 'Live record missing mandatory temperature must fail schema check');
  assert.ok(auditMissing.errors.some((e) => e.includes('Missing or invalid mandatory temperatureC')));
  console.log('  ✓ Missing mandatory variable correctly caught by validation check without synthetic fallback');

  // -------------------------------------------------------------
  // Test 12: Complete Automatic Recovery Lifecycle
  // -------------------------------------------------------------
  console.log('\nTest 12: COMPLETE PROVIDER RECOVERY LIFECYCLE (FAILURE -> NULL -> RECOVERY -> LIVE -> REAL VALUE)');

  // Phase 12.1: Inject outage on ECMWF
  console.log('  Step 12A: Simulating outage on ECMWF endpoint (HTTP 503 Service Unavailable)...');
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'ecmwf') {
      return createUnavailablePayload({
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: 'https://data.ecmwf.int/',
        model: 'IFS-0.25',
        availability: 'NOT_AVAILABLE',
        httpStatus: 503,
        responseTimeMs: 150,
        dataType: 'NOT_AVAILABLE',
        sourceRole: 'OPERATIONAL_FORECAST',
        errorMessage: 'HTTP 503: ECMWF Open Data service temporarily unavailable',
        latitude: lat,
        longitude: lng,
      });
    }
    return null;
  });

  clearProvenanceCache();
  const failingLedger = await ingestAndAuditAllSources(18.5204, 73.8567, true);
  const failingEcmwf = failingLedger.records.find((r) => r.source === 'ECMWF IFS');
  assert.ok(failingEcmwf, 'ECMWF record must exist in ledger');
  assert.strictEqual(failingEcmwf.availability, 'NOT_AVAILABLE', 'ECMWF must reflect NOT_AVAILABLE during outage');
  assert.strictEqual(failingEcmwf.temperatureC, null, 'ECMWF temperature must be strictly NULL during outage');

  const failingEntry = failingLedger.entries.find((e) => e.source === 'ECMWF IFS' && e.variable === 'Temperature');
  assert.ok(failingEntry, 'ECMWF temperature entry must exist in provenance');
  assert.strictEqual(failingEntry.value, 'NULL', 'Provenance value string must be "NULL"');
  assert.strictEqual(failingEntry.numericValue, null, 'Provenance numericValue must be null');
  console.log('  ✓ Failure confirmed: ECMWF is NOT_AVAILABLE, temperatureC === NULL, provenance displays NULL');

  // Verify fusion excludes failed provider
  const failingFusion = fuseMultiSourceRecords(failingLedger.records);
  assert.ok(
    !failingFusion.contributingModels.some((m) => m.source === 'ECMWF IFS'),
    'ECMWF must be excluded from consensus during outage'
  );
  console.log('  ✓ Fused consensus safely excluded failed ECMWF model');

  // Phase 12.2: Provider recovers automatically
  console.log('  Step 12B: Simulating endpoint recovery (HTTP 200 with valid atmospheric payload)...');
  const restoredTempC = 30.6;
  setProviderFetchInterceptor(async (providerId, lat, lng) => {
    if (providerId === 'ecmwf') {
      const nowIso = new Date().toISOString();
      return {
        provider: 'ECMWF IFS',
        providerId: 'ecmwf',
        sourceUrl: 'https://data.ecmwf.int/',
        model: 'IFS-0.25',
        run: nowIso,
        issuedAt: nowIso,
        validTime: nowIso,
        forecastLeadHours: 0,
        resolution: '0.25 deg (~28km)',
        latitude: lat,
        longitude: lng,
        sourceLatitude: 18.50,
        sourceLongitude: 73.75,
        spatialMethod: 'BILINEAR',
        spatialDistanceKm: 5.8,
        retrievedAt: nowIso,
        httpStatus: 200,
        responseTimeMs: 85,
        dataType: 'FORECAST',
        sourceRole: 'OPERATIONAL_FORECAST',
        availability: 'LIVE',
        isFallback: false,
        errorMessage: null,
        rawData: {
          model: 'IFS',
          run: nowIso,
          gridResolution: '0.25 deg (~28km)',
          latitude: 18.50,
          longitude: 73.75,
          forecastLeadHours: 0,
          temperature_2m: restoredTempC,
          relative_humidity_2m: 54,
          dew_point_2m: 20.2,
          surface_pressure_hpa: 1012.4,
          wind_speed_10m_ms: 3.2,
          solar_radiation_wm2: 840,
          ensembleMemberCount: 51,
          openDataBucketUrl: 's3://ecmwf-open-data/',
          hourlyForecast: {
            time: [nowIso],
            temperature_2m: [restoredTempC],
            relative_humidity_2m: [54],
            wind_speed_10m: [3.2],
          },
        },
      };
    }
    return null;
  });

  // Next scheduled check or refresh
  clearProvenanceCache();
  const recoveredLedger = await ingestAndAuditAllSources(18.5204, 73.8567, true);
  const recoveredEcmwf = recoveredLedger.records.find((r) => r.source === 'ECMWF IFS');
  assert.ok(recoveredEcmwf, 'ECMWF record must exist');
  assert.strictEqual(recoveredEcmwf.availability, 'LIVE', 'ECMWF must automatically return to LIVE');
  assert.strictEqual(recoveredEcmwf.temperatureC, restoredTempC, `ECMWF temperature must be restored to ${restoredTempC}°C`);
  assert.strictEqual(recoveredEcmwf.validationStatus, 'VERIFIED');

  const recoveredEntry = recoveredLedger.entries.find((e) => e.source === 'ECMWF IFS' && e.variable === 'Temperature');
  assert.ok(recoveredEntry);
  assert.strictEqual(recoveredEntry.numericValue, restoredTempC, `Provenance numericValue must be restored to ${restoredTempC}`);
  assert.ok(recoveredEntry.value.includes('30.6 °C'), `Provenance string must show "30.6 °C", got "${recoveredEntry.value}"`);

  // Verify fusion dynamically includes restored provider
  const recoveredFusion = fuseMultiSourceRecords(recoveredLedger.records);
  const ecmwfContrib = recoveredFusion.contributingModels.find((m) => m.source === 'ECMWF IFS');
  assert.ok(ecmwfContrib, 'ECMWF must dynamically re-enter operational fusion consensus');
  assert.strictEqual(ecmwfContrib.temperatureC, restoredTempC);
  console.log(`  ✓ Application recovery state machine verified: ECMWF returned to LIVE -> real value ${recoveredEcmwf.temperatureC}°C restored -> provenance updated -> re-entered consensus without restart!`);

  // -------------------------------------------------------------
  // Test 13: Thermal Safety Boundary on DEGRADED Record
  // -------------------------------------------------------------
  console.log('\nTest 13: Thermal Safety Boundary Enforcement on DEGRADED Record');
  // normDegraded has valid temperatureC (33.4) but NULL humidity, wind speed, solar radiation
  const wbgtResult = calculateWBGT(
    normDegraded.temperatureC,
    normDegraded.relativeHumidityPercent,
    normDegraded.solarRadiationWm2,
    normDegraded.windSpeedMs
  );
  assert.strictEqual(wbgtResult, null, 'WBGT calculation must return NULL when secondary parameters are missing');

  const utciResult = calculateUTCI(
    normDegraded.temperatureC,
    normDegraded.relativeHumidityPercent,
    normDegraded.windSpeedMs,
    normDegraded.solarRadiationWm2
  );
  assert.strictEqual(utciResult, null, 'UTCI calculation must return NULL when secondary parameters are missing');

  const hiResult = calculateHeatIndex(
    normDegraded.temperatureC,
    normDegraded.relativeHumidityPercent
  );
  assert.strictEqual(hiResult, null, 'Heat Index calculation must return NULL when humidity is missing');
  console.log('  ✓ Thermal safety boundary verified: DEGRADED records missing required thermal inputs strictly return NULL from biometeorological functions');

  // -------------------------------------------------------------
  // Test 14: Non-Destructive Real External Provider Smoke Verification
  // -------------------------------------------------------------
  console.log('\nTest 14: Non-Destructive Real External Provider Smoke Verification');
  // Reset any interceptors to contact real configured endpoints
  setProviderFetchInterceptor(null);
  clearProvenanceCache();
  clearProviderHealthCache();

  const realOpenMeteo = await fetchOpenMeteoRaw(18.5204, 73.8567);
  console.log(`  Real Open-Meteo Contact: HTTP ${realOpenMeteo.httpStatus} -> Status: [${realOpenMeteo.availability}] (Latency: ${realOpenMeteo.responseTimeMs}ms)`);
  assert.ok(
    realOpenMeteo.availability === 'LIVE' || realOpenMeteo.availability === 'DEGRADED' || realOpenMeteo.availability === 'RATE_LIMITED' || realOpenMeteo.availability === 'NOT_AVAILABLE',
    'Real provider must return valid canonical availability status'
  );
  if (realOpenMeteo.availability === 'LIVE' || realOpenMeteo.availability === 'DEGRADED') {
    assert.ok(realOpenMeteo.rawData !== null, 'Real live provider must return non-null raw data');
  }

  const realEcmwf = await fetchEcmwfRaw(18.5204, 73.8567);
  console.log(`  Real ECMWF Contact: HTTP ${realEcmwf.httpStatus} -> Status: [${realEcmwf.availability}] (Latency: ${realEcmwf.responseTimeMs}ms)`);
  assert.ok(
    realEcmwf.availability === 'LIVE' || realEcmwf.availability === 'DEGRADED' || realEcmwf.availability === 'RATE_LIMITED' || realEcmwf.availability === 'NOT_AVAILABLE',
    'Real provider must return valid canonical availability status'
  );

  console.log('  ✓ Real external provider smoke verification executed non-destructively.');
  console.log('  [NOTE] Real external provider outage/recovery is not deterministically reproducible and remains a smoke-test limitation.');

  // Cleanup
  setProviderFetchInterceptor(null);
  clearProvenanceCache();
  clearProviderHealthCache();

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('  ALL 14 PHASE 1 SPECIFICATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('═══════════════════════════════════════════════════════════════════\n');
}

// Auto-run if executed directly via tsx
if (process.argv[1]?.endsWith('providerAvailabilityAndRecovery.test.ts') || process.argv[1]?.endsWith('providerAvailabilityAndRecovery.test.js')) {
  runPhase1TestSuite().catch((err) => {
    console.error('Phase 1 test failure:', err);
    process.exit(1);
  });
}
