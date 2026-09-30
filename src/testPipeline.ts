import dotenv from 'dotenv';
dotenv.config();

import assert from 'node:assert';
import { checkAllProvidersHealth } from './services/data/providerHealthService.js';
import { ingestAndAuditAllSources } from './services/validation/provenanceLedger.js';
import { fuseMultiSourceRecords } from './services/fusion/multiSourceFusionEngine.js';
import { generateMultiHorizonLadder } from './services/earlyWarning/multiHorizonLadder.js';
import { validateNormalizedRecord } from './services/validation/validationEngine.js';
import {
  calculateWBGT,
  calculateUTCI,
  calculateHeatIndex,
  calculateTraceableWBGT,
  calculateTraceableUTCI,
  calculateTraceableHeatIndex,
} from './server/thermalEngine.js';
import { runPhase1TestSuite } from './tests/providerAvailabilityAndRecovery.test.js';

async function main() {
  console.log('=== 1. TESTING PROVIDER HEALTH PROBES ===');
  const health = await checkAllProvidersHealth(18.5204, 73.8567, true);
  console.log(`Probed ${health.length} providers successfully.`);
  assert.strictEqual(health.length, 11, 'Expected 11 data providers in health report');
  health.forEach((h) => {
    assert.ok(h.id && h.name && h.status, `Provider health report invalid for ${h.id}`);
    assert.ok(typeof h.latencyMs === 'number' && h.latencyMs >= 0, `Invalid latency for ${h.name}`);
    console.log(`- [${h.status}] ${h.name} (${h.latencyMs}ms) - Priority: ${h.priority}`);
  });

  console.log('\n=== 2. TESTING INGESTION, NORMALIZATION & 7-POINT AUDIT ===');
  const ledger = await ingestAndAuditAllSources(18.5204, 73.8567, true);
  console.log(`Normalized records: ${ledger.records.length}`);
  console.log(`Provenance entries: ${ledger.entries.length}`);
  assert.strictEqual(ledger.records.length, 6, 'Expected 6 normalized records');
  assert.ok(ledger.entries.length >= 12, 'Expected at least 12 provenance audit entries');

  ledger.records.forEach((r) => {
    const audit = ledger.auditResults[r.id];
    assert.ok(audit, `Audit result missing for record ${r.id}`);

    // Verify 20 core metadata fields exist
    assert.ok(r.recordId && r.id, `Missing recordId/id on ${r.source}`);
    assert.ok(r.source && r.provider && r.dataset && r.model, `Missing source metadata on ${r.source}`);
    assert.ok(r.dataType && r.sourceRole && r.retrievedAt, `Missing classification on ${r.source}`);
    assert.ok(r.qualityStatus && r.validationStatus && r.availability, `Missing status on ${r.source}`);

    if (r.availability === 'LIVE' || r.availability === 'DEGRADED') {
      assert.ok(typeof r.temperatureC === 'number' && !isNaN(r.temperatureC) && isFinite(r.temperatureC), `Invalid temp for live/degraded ${r.source}`);
      assert.strictEqual(audit.passedCount, 7, `${r.source} failed checks (${audit.passedCount}/${audit.totalChecks})`);
      assert.ok(audit.overallStatus === 'VERIFIED' || audit.overallStatus === 'PARTIAL', `Unexpected overallStatus on ${r.source}: ${audit.overallStatus}`);
      console.log(
        `- [${r.availability}] ${r.source}: ${r.temperatureC}°C, ${r.relativeHumidityPercent !== null ? r.relativeHumidityPercent + '% RH' : 'RH: NULL'} [${audit.overallStatus} - ${audit.passedCount}/${audit.totalChecks} checks]`
      );
    } else {
      // STRICT NULL SEMANTICS: Unavailable/unauthenticated sources MUST have null values, NEVER mock/proxy numbers
      assert.strictEqual(r.temperatureC, null, `Unavailable source ${r.source} must have temperatureC === null`);
      assert.strictEqual(r.validationStatus, r.availability, `Unavailable source ${r.source} must have validationStatus === ${r.availability}`);
      console.log(
        `- [${r.availability}] ${r.source}: temperatureC = NULL [${audit.overallStatus} - governance compliant]`
      );
    }
  });

  // Verify that provenance entries display correct dynamic checks without NaN
  ledger.entries.forEach((entry) => {
    assert.ok(!entry.checksPassed.includes('NaN'), `Entry has NaN in checksPassed: ${entry.checksPassed}`);
    assert.ok(entry.recordId, `Entry missing recordId: ${entry.variable}`);
    assert.ok(entry.value, `Entry missing value string: ${entry.variable}`);
  });

  console.log('\n=== 3. TESTING MULTI-SOURCE FUSION ENGINE ===');
  const fused = fuseMultiSourceRecords(ledger.records);
  assert.ok(fused.fusedTemperatureC !== null, 'Fused temperature must not be null when live operational sources exist');
  assert.ok(!isNaN(fused.fusedTemperatureC), 'Fused temperature must not be NaN');
  assert.ok(isFinite(fused.agreementMatrix.spreadTempDegC), 'Spread must be finite');
  assert.ok(fused.contributingModels.length > 0, 'Contributing models must not be empty');

  // Verify weights sum to approximately 1.0 (100%)
  const totalWeight = fused.contributingModels.reduce((s, m) => s + m.weight, 0);
  assert.ok(Math.abs(totalWeight - 1.0) < 0.05, `Weights must sum to 100%, got ${(totalWeight * 100).toFixed(1)}%`);

  console.log(`Agreement Level: ${fused.agreementMatrix.agreementLevel}`);
  console.log(
    `Temperature Spread: ±${fused.agreementMatrix.spreadTempDegC}°C (Mean: ${fused.agreementMatrix.meanTempC}°C)`
  );
  console.log(
    `Fused Consensus: ${fused.fusedTemperatureC}°C, ${fused.fusedHumidityPct}% RH, ${fused.fusedWindSpeedMs} m/s wind, ${fused.fusedSolarRadiationWm2} W/m² solar`
  );
  if (fused.climatologicalAnomalyDegC !== null) {
    console.log(`Climatological Departure from ERA5 Baseline: ${fused.climatologicalAnomalyDegC > 0 ? '+' : ''}${fused.climatologicalAnomalyDegC}°C`);
  }
  console.log(
    `Contributing Models (Dynamic 100% Re-weighted): ${fused.contributingModels.map((m) => `${m.source} (${(m.weight * 100).toFixed(1)}%)`).join(', ')}`
  );

  console.log('\n=== 4. TESTING THERMAL ENGINE TRACEABILITY & STRICT NULL SEMANTICS ===');
  // 4a. Valid input calculations
  const wbgt = calculateWBGT(32.0, 60, 800, 2.5);
  const utci = calculateUTCI(32.0, 60, 2.5, 800);
  const hi = calculateHeatIndex(32.0, 60);
  assert.ok(wbgt !== null && wbgt > 20 && wbgt < 45, `Invalid WBGT output: ${wbgt}`);
  assert.ok(utci !== null && utci > 20 && utci < 55, `Invalid UTCI output: ${utci}`);
  assert.ok(hi !== null && hi > 20 && hi < 55, `Invalid Heat Index output: ${hi}`);
  console.log(`✓ Direct calculations: WBGT = ${wbgt}°C, UTCI = ${utci}°C, Heat Index = ${hi}°C`);

  // 4b. Traceable calculations with provenance
  const traceableWbgt = calculateTraceableWBGT(32.0, 60, 800, 2.5, ['rec_open_meteo', 'rec_ecmwf']);
  assert.strictEqual(traceableWbgt.validationStatus, 'VALID');
  assert.strictEqual(traceableWbgt.output, wbgt);
  assert.strictEqual(traceableWbgt.inputRecordIds.length, 2);
  console.log(`✓ Traceable WBGT: ${traceableWbgt.output}°C (ID: ${traceableWbgt.calculationId})`);

  // 4c. Strict NULL semantics when inputs are missing
  const nullWbgt = calculateWBGT(null, 60, 800, 2.5);
  const nullTraceable = calculateTraceableWBGT(null, 60, 800, 2.5);
  assert.strictEqual(nullWbgt, null, 'calculateWBGT must return null when temperature is null');
  assert.strictEqual(nullTraceable.output, null, 'Traceable output must be null when input is null');
  assert.strictEqual(nullTraceable.validationStatus, 'INPUT_MISSING', 'Validation status must be INPUT_MISSING');
  console.log('✓ Strict NULL semantics verified: NULL inputs safely produce NULL outputs without synthetic hallucination');

  console.log('\n=== 5. TESTING MULTI-HORIZON EARLY WARNING LADDER ===');
  const ladder = generateMultiHorizonLadder('Pune, Maharashtra', 18.5204, 73.8567, fused);
  assert.strictEqual(ladder.horizons.length, 5, 'Ladder must have 5 distinct horizons');
  console.log(`Ladder Horizons Count: ${ladder.horizons.length}`);

  // Test decaying confidence
  for (let i = 0; i < ladder.horizons.length - 1; i++) {
    const cur = ladder.horizons[i];
    const nxt = ladder.horizons[i + 1];
    assert.ok(
      cur.confidencePct >= nxt.confidencePct,
      `Horizon ${cur.leadTimeLabel} confidence (${cur.confidencePct}%) should be >= ${nxt.leadTimeLabel} (${nxt.confidencePct}%)`
    );
    console.log(`- ${cur.leadTimeLabel}: ${cur.title} (Confidence: ${cur.confidencePct}%)`);
  }
  const lastHorizon = ladder.horizons[ladder.horizons.length - 1];
  console.log(`- ${lastHorizon.leadTimeLabel}: ${lastHorizon.title} (Confidence: ${lastHorizon.confidencePct}%)`);

  // Verify Horizon B distinguishes event probability from confidence score
  const horizonB = ladder.horizons[1];
  const bData = horizonB.data as any;
  assert.ok(typeof bData.eventProbabilityPct === 'number', 'Horizon B must define eventProbabilityPct');
  assert.ok(typeof bData.confidencePct === 'number', 'Horizon B must define confidencePct');
  console.log(`✓ Horizon B distinction verified: Event Probability = ${bData.eventProbabilityPct}%, Confidence Score = ${bData.confidencePct}%`);

  console.log('\n=== 6. ADVERSARIAL EDGE CASE TESTING ===');
  // Edge Case A: Empty records input to fusion engine
  const emptyFused = fuseMultiSourceRecords([]);
  assert.strictEqual(emptyFused.fusedTemperatureC, null, 'Empty fusion must return null temperature');
  assert.strictEqual(emptyFused.agreementMatrix.confidenceScorePct, 0, 'Empty fusion must have 0% confidence');
  console.log('✓ Edge Case A passed: Empty input to fusion engine safely produces NULL temperature and 0% confidence');

  // Edge Case B: Invalid / unparseable timestamp
  const invalidTimestampRec = {
    ...ledger.records[0],
    id: 'test_invalid_ts',
    timestamp: 'corrupted-timestamp-string',
  };
  const auditB = validateNormalizedRecord(invalidTimestampRec);
  const tsCheck = auditB.checks.find((c) => c.id === 'rule_timestamp_freshness');
  assert.strictEqual(tsCheck?.passed, false, 'Invalid timestamp must fail freshness check');
  console.log('✓ Edge Case B passed: Corrupted timestamp correctly caught and rejected by audit check 5');

  // Edge Case C: Pressure in kPa instead of hPa
  const kpaRec = {
    ...ledger.records[0],
    id: 'test_kpa',
    surfacePressureHpa: 101.325, // in kPa
  };
  const auditC = validateNormalizedRecord(kpaRec);
  const unitCheck = auditC.checks.find((c) => c.id === 'rule_unit_consistency');
  assert.strictEqual(unitCheck?.passed, false, 'Pressure in kPa must fail unit consistency check');
  console.log('✓ Edge Case C passed: kPa pressure detected and flagged by unit consistency check 6');

  // Edge Case D: Extreme physically impossible boundaries
  const extremeRec = {
    ...ledger.records[0],
    id: 'test_extreme',
    temperatureC: 72.5,
    windSpeedMs: 85.0,
    relativeHumidityPercent: 120,
  };
  const auditD = validateNormalizedRecord(extremeRec);
  const rangeCheck = auditD.checks.find((c) => c.id === 'rule_physical_boundaries');
  assert.strictEqual(rangeCheck?.passed, false, 'Extreme out-of-bounds weather must fail physical range check');
  console.log('✓ Edge Case D passed: Physically impossible values (72.5°C, 85 m/s, 120% RH) correctly rejected');

  console.log('\n=== 7. PHASE 1: PROVIDER AVAILABILITY, STRICT NULLS & AUTOMATIC RECOVERY ===');
  await runPhase1TestSuite();

  console.log('\nALL TEST SUITES & ADVERSARIAL EDGE CASES PASSED WITH 100% DATA INTEGRITY COMPLIANCE!');
}

main().catch((err) => {
  console.error('Test pipeline error:', err);
  process.exit(1);
});
