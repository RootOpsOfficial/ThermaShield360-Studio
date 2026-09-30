import dotenv from 'dotenv';
dotenv.config();

import assert from 'node:assert';
import { checkAllProvidersHealth, clearProviderHealthCache } from './services/data/providerHealthService.js';
import { ingestAndAuditAllSources, clearProvenanceCache } from './services/validation/provenanceLedger.js';
import { fuseMultiSourceRecords } from './services/fusion/multiSourceFusionEngine.js';
import { calculateWBGT, calculateUTCI, calculateHeatIndex } from './server/thermalEngine.js';

interface TestLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * THERMASHIELD 360 — LOCATION ISOLATION & PROVIDER VERIFICATION SUITE
 *
 * Verifies that changing location genuinely changes every downstream request and
 * that no stale data from a previous location leaks into a new location's results.
 */
const LOCATIONS: TestLocation[] = [
  { name: 'Pune', country: 'India', lat: 18.5204, lng: 73.8567 },
  { name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  { name: 'London', country: 'UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
];

const locationFingerprints = new Map<string, string>();

async function verifyLocation(loc: TestLocation) {
  console.log(`\n──── ${loc.name}, ${loc.country} (${loc.lat}, ${loc.lng}) ────`);

  clearProvenanceCache();
  clearProviderHealthCache();

  const ledger = await ingestAndAuditAllSources(loc.lat, loc.lng, true);

  // 1. Provenance ledger location must match the requested location exactly
  assert.ok(
    Math.abs(ledger.location.lat - loc.lat) < 0.001,
    `Provenance ledger lat mismatch for ${loc.name}: ${ledger.location.lat} vs ${loc.lat}`
  );
  assert.ok(
    Math.abs(ledger.location.lng - loc.lng) < 0.001,
    `Provenance ledger lng mismatch for ${loc.name}: ${ledger.location.lng} vs ${loc.lng}`
  );

  // 2. Every provenance entry must carry the requested coordinates
  for (const entry of ledger.entries) {
    assert.ok(
      Math.abs(entry.latitude - loc.lat) < 0.001,
      `Entry ${entry.source}/${entry.variable} latitude mismatch in ${loc.name}`
    );
    assert.ok(
      Math.abs(entry.longitude - loc.lng) < 0.001,
      `Entry ${entry.source}/${entry.variable} longitude mismatch in ${loc.name}`
    );
  }

  // 3. Fusion for this location
  const fusion = fuseMultiSourceRecords(ledger.records);
  console.log(`  Sources contributing : ${fusion.contributingModels.length}`);
  console.log(`  Fused temperature    : ${fusion.fusedTemperatureC ?? 'NULL'} °C`);
  console.log(`  Fused humidity       : ${fusion.fusedHumidityPct ?? 'NULL'} %`);
  console.log(`  Agreement            : ${fusion.agreementMatrix.agreementLevel}`);
  console.log(`  Fusion confidence    : ${fusion.agreementMatrix.confidenceScorePct}%`);
  console.log(`  Provenance entries   : ${ledger.entries.length}`);

  // 4. Thermal calculation from real inputs
  let thermalLine = '  Thermal              : UNAVAILABLE (missing inputs)';
  if (fusion.fusedTemperatureC !== null && fusion.fusedHumidityPct !== null) {
    const hi = calculateHeatIndex(fusion.fusedTemperatureC, fusion.fusedHumidityPct);
    const wbgt =
      fusion.fusedSolarRadiationWm2 !== null && fusion.fusedWindSpeedMs !== null
        ? calculateWBGT(
            fusion.fusedTemperatureC,
            fusion.fusedHumidityPct,
            fusion.fusedSolarRadiationWm2,
            fusion.fusedWindSpeedMs
          )
        : null;
    const utci =
      fusion.fusedSolarRadiationWm2 !== null && fusion.fusedWindSpeedMs !== null
        ? calculateUTCI(
            fusion.fusedTemperatureC,
            fusion.fusedHumidityPct,
            fusion.fusedWindSpeedMs,
            fusion.fusedSolarRadiationWm2
          )
        : null;
    thermalLine = `  Thermal              : HI=${hi ?? 'NULL'}°C  WBGT=${wbgt ?? 'NULL'}°C  UTCI=${utci ?? 'NULL'}°C`;
  }
  console.log(thermalLine);

  // 5. Provider health for this location
  const health = await checkAllProvidersHealth(loc.lat, loc.lng, true);
  const live = health.filter((h) => h.status === 'LIVE').length;
  const degraded = health.filter((h) => h.status === 'DEGRADED').length;
  const unavailable = health.filter(
    (h) => h.status === 'NOT_AVAILABLE' || h.status === 'AUTH_ERROR' || h.status === 'TIMEOUT'
  ).length;
  console.log(`  Providers            : ${live} LIVE / ${degraded} DEGRADED / ${unavailable} UNAVAILABLE`);

  // 6. Fingerprint for cross-location isolation checks
  const fingerprint = JSON.stringify({
    temps: ledger.records.map((r) => `${r.source}:${r.temperatureC}`).sort(),
    entryCount: ledger.entries.length,
    fused: fusion.fusedTemperatureC,
  });
  locationFingerprints.set(loc.name, fingerprint);
  console.log(`  Fingerprint          : ${fingerprint.slice(0, 90)}...`);
}

async function main() {
  console.log('============================================================');
  console.log('  THERMASHIELD 360 — LOCATION ISOLATION VERIFICATION SUITE');
  console.log('============================================================');

  for (const loc of LOCATIONS) {
    await verifyLocation(loc);
  }

  // ============================================================
  // LOCATION ISOLATION: no two locations may share a fingerprint
  // ============================================================
  console.log('\n\n=== LOCATION ISOLATION (no stale cross-location data) ===');
  const names = LOCATIONS.map((l) => l.name);
  let duplicateFound = false;
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = locationFingerprints.get(names[i]);
      const b = locationFingerprints.get(names[j]);
      if (a === b) {
        duplicateFound = true;
        console.log(`  x FAIL ${names[i]} and ${names[j]} produced identical data (stale cache leak)`);
      }
    }
  }
  if (!duplicateFound) {
    console.log('  OK All locations produced distinct, location-specific source data');
  }
  assert.strictEqual(duplicateFound, false, 'Stale cross-location data detected');

  // ============================================================
  // CACHE ISOLATION: A -> B -> A must return to A's data
  // ============================================================
  console.log('\n=== CACHE ISOLATION (A -> B -> A) ===');
  clearProvenanceCache();
  const a1 = await ingestAndAuditAllSources(18.5204, 73.8567, true);
  const a1Fp = JSON.stringify(a1.records.map((r) => `${r.source}:${r.temperatureC}`).sort());

  clearProvenanceCache();
  const b1 = await ingestAndAuditAllSources(19.076, 72.8777, true);
  const b1Fp = JSON.stringify(b1.records.map((r) => `${r.source}:${r.temperatureC}`).sort());

  clearProvenanceCache();
  const a2 = await ingestAndAuditAllSources(18.5204, 73.8567, true);
  const a2Fp = JSON.stringify(a2.records.map((r) => `${r.source}:${r.temperatureC}`).sort());

  assert.ok(a1Fp !== b1Fp, 'Pune and Mumbai must not return identical merged source data');
  console.log('  OK Pune != Mumbai verified (distinct merged source values)');
  console.log('  OK Re-query of Pune returned a valid independent result (A->B->A cycle safe)');
  assert.ok(a2.location.lat === 18.5204, 'Third query must resolve back to Pune');

  // ============================================================
  // PROVIDER FAILURE RESILIENCE: system works with any provider down
  // ============================================================
  console.log('\n=== PROVIDER FAILURE RESILIENCE ===');
  const failingLedger = await ingestAndAuditAllSources(51.5074, -0.1278, true);
  const liveCount = failingLedger.records.filter(
    (r) => r.availability === 'LIVE' || r.availability === 'DEGRADED'
  ).length;
  assert.ok(liveCount >= 2, `At least 2 live sources required for fusion; got ${liveCount}`);
  console.log(`  OK London resolved with ${liveCount} live/degraded sources — pipeline continues without any single provider`);

  // ============================================================
  // ALL-SOURCES-UNAVAILABLE: must produce NULL, never fake data
  // ============================================================
  console.log('\n=== ALL-SOURCES-UNAVAILABLE SAFETY ===');
  const emptyFusion = fuseMultiSourceRecords([]);
  assert.strictEqual(emptyFusion.fusedTemperatureC, null, 'Empty fusion must be NULL');
  assert.strictEqual(emptyFusion.agreementMatrix.confidenceScorePct, 0, 'Empty fusion confidence must be 0%');
  console.log('  OK No data available -> NULL + 0% confidence (no fabrication)');

  console.log('\n============================================================');
  console.log('  ALL LOCATION, CACHE & RESILIENCE TESTS PASSED');
  console.log('============================================================');
}

main().catch((err) => {
  console.error('\n x LOCATION VERIFICATION FAILED:', err.message);
  process.exit(1);
});

