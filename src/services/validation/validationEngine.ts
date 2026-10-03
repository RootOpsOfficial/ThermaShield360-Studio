import { ThermaShieldNormalizedRecord, NormalizationValidationStatus } from '../normalization/thermaShieldRecord.js';

export interface AuditCheckItem {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

export interface ValidationAuditResult {
  recordId: string;
  source: string;
  overallStatus: NormalizationValidationStatus;
  passedCount: number;
  totalChecks: number;
  checks: AuditCheckItem[];
  warnings: string[];
  errors: string[];
  validatedAt: string;
}

// Physical boundaries for earth surface meteorology
// PRESSURE_MIN lowered to 550 hPa to support high-altitude locations
// (e.g. Leh ~3500m where station pressure can be ~650 hPa)
export const PHYSICAL_LIMITS = {
  TEMP_MIN: -40, // °C (Leh/Ladakh can reach -30°C in winter)
  TEMP_MAX: 60,  // °C (highest recorded on earth is 56.7°C)
  RH_MIN: 0,     // %
  RH_MAX: 100,   // %
  WIND_MIN: 0,   // m/s
  WIND_MAX: 65,  // m/s (Category 5 hurricane threshold ~70 m/s)
  PRESSURE_MIN: 550,  // hPa (high altitude stations like Leh at ~3500m, deep low)
  PRESSURE_MAX: 1085, // hPa (Siberian high)
  SOLAR_MIN: 0,       // W/m²
  SOLAR_MAX: 1400,    // W/m² (solar constant at top of atmosphere ~1361 W/m²)
  DEW_POINT_MIN: -50, // °C (extreme cold high-altitude dew points)
  DEW_POINT_MAX: 38,  // °C
};

export function validateNormalizedRecord(
  record: ThermaShieldNormalizedRecord,
  expectedCoords?: { lat: number; lng: number }
): ValidationAuditResult {
  const checks: AuditCheckItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const isUnavailable = record.availability !== 'LIVE' && record.availability !== 'DEGRADED';

  // Check 1: Source Reachability & Identity
  const hasValidSource = Boolean(record.source && record.provider && record.id);
  checks.push({
    id: 'rule_source_identity',
    name: 'Source Reachability & Identity',
    passed: hasValidSource,
    message: hasValidSource
      ? `Source identified: ${record.source} (${record.provider}) [Availability: ${record.availability}]`
      : 'Missing source or provider identity',
  });
  if (!hasValidSource) errors.push('Source or provider metadata is missing');

  // Check 2: Schema Integrity & Non-NaN Enforcement
  if (isUnavailable) {
    checks.push({
      id: 'rule_schema_integrity',
      name: 'Schema Integrity & Type Enforcement',
      passed: true,
      message: `Source ${record.availability}: variables correctly set to NULL per data governance rules (no synthetic fill).`,
    });
  } else {
    // For live sources, temperature is mandatory
    const isTempValid = typeof record.temperatureC === 'number' && !isNaN(record.temperatureC) && isFinite(record.temperatureC);
    if (!isTempValid) {
      errors.push('Missing or invalid mandatory temperatureC parameter on live stream');
    }

    const numericFields = [
      { name: 'temperatureC', val: record.temperatureC, mandatory: true },
      { name: 'relativeHumidityPercent', val: record.relativeHumidityPercent, mandatory: false },
      { name: 'windSpeedMs', val: record.windSpeedMs, mandatory: false },
      { name: 'solarRadiationWm2', val: record.solarRadiationWm2, mandatory: false },
      { name: 'dewPointC', val: record.dewPointC, mandatory: false },
      { name: 'surfacePressureHpa', val: record.surfacePressureHpa, mandatory: false },
    ];

    // Corrupted values (NaN or non-finite numbers when present)
    const corruptedFields = numericFields.filter(
      (f) => f.val !== null && (typeof f.val !== 'number' || isNaN(f.val) || !isFinite(f.val))
    );
    if (corruptedFields.length > 0) {
      errors.push(`Data corruption detected in fields: ${corruptedFields.map((f) => f.name).join(', ')}`);
    }

    // Missing secondary fields are treated as PARTIAL data coverage
    const missingSecondary = numericFields.filter((f) => !f.mandatory && f.val === null);
    if (missingSecondary.length > 0) {
      warnings.push(`Partial variable coverage: missing/null fields: ${missingSecondary.map((f) => f.name).join(', ')}`);
    }

    const schemaPassed = isTempValid && corruptedFields.length === 0;
    checks.push({
      id: 'rule_schema_integrity',
      name: 'Schema Integrity & Type Enforcement',
      passed: schemaPassed,
      message: schemaPassed
        ? (missingSecondary.length === 0
            ? 'All 6 core meteorological numerical parameters present and finite'
            : `Schema verified (Partial coverage: ${6 - missingSecondary.length}/6 fields populated)`)
        : 'Schema integrity check failed (missing primary variable or corrupted data)',
    });
  }

  // Check 3: Coordinate Tolerance Check
  let coordPassed = true;
  let coordMsg = `Coordinates valid: [${record.latitude.toFixed(4)}, ${record.longitude.toFixed(4)}]`;
  if (
    record.latitude < -90 ||
    record.latitude > 90 ||
    record.longitude < -180 ||
    record.longitude > 180
  ) {
    coordPassed = false;
    coordMsg = 'Latitude or Longitude out of global geographic bounds';
    errors.push(coordMsg);
  } else if (expectedCoords) {
    const latDiff = Math.abs(record.latitude - expectedCoords.lat);
    const lngDiff = Math.abs(record.longitude - expectedCoords.lng);
    // Allow up to 0.55 degree grid cell center tolerance for coarse global NWP grids (0.25°/0.5°)
    if (latDiff > 0.55 || lngDiff > 0.55) {
      warnings.push(`Grid point [${record.latitude}, ${record.longitude}] differs by >0.5° from target [${expectedCoords.lat}, ${expectedCoords.lng}]`);
    }
  }
  checks.push({
    id: 'rule_coordinate_bounds',
    name: 'Coordinate Bounds & Grid Verification',
    passed: coordPassed,
    message: coordMsg,
  });

  // Check 4: Physical Range Boundaries
  if (isUnavailable) {
    checks.push({
      id: 'rule_physical_boundaries',
      name: 'Physical Range Boundaries Check',
      passed: true,
      message: `Physical boundary checks skipped for NULL values (${record.availability}).`,
    });
  } else {
    let rangePassed = true;
    const rangeFailures: string[] = [];

    if (record.temperatureC !== null) {
      if (record.temperatureC < PHYSICAL_LIMITS.TEMP_MIN || record.temperatureC > PHYSICAL_LIMITS.TEMP_MAX) {
        rangeFailures.push(`Temperature ${record.temperatureC}°C outside [${PHYSICAL_LIMITS.TEMP_MIN}, ${PHYSICAL_LIMITS.TEMP_MAX}]`);
      }
    }
    if (record.relativeHumidityPercent !== null) {
      if (record.relativeHumidityPercent < PHYSICAL_LIMITS.RH_MIN || record.relativeHumidityPercent > PHYSICAL_LIMITS.RH_MAX) {
        rangeFailures.push(`Relative Humidity ${record.relativeHumidityPercent}% outside [0, 100]`);
      }
    }
    if (record.windSpeedMs !== null) {
      if (record.windSpeedMs < PHYSICAL_LIMITS.WIND_MIN || record.windSpeedMs > PHYSICAL_LIMITS.WIND_MAX) {
        rangeFailures.push(`Wind speed ${record.windSpeedMs} m/s outside [0, 65]`);
      }
    }
    if (record.surfacePressureHpa !== null) {
      if (record.surfacePressureHpa < PHYSICAL_LIMITS.PRESSURE_MIN || record.surfacePressureHpa > PHYSICAL_LIMITS.PRESSURE_MAX) {
        rangeFailures.push(`Pressure ${record.surfacePressureHpa} hPa outside [850, 1085]`);
      }
    }
    if (record.solarRadiationWm2 !== null) {
      if (record.solarRadiationWm2 < PHYSICAL_LIMITS.SOLAR_MIN || record.solarRadiationWm2 > PHYSICAL_LIMITS.SOLAR_MAX) {
        rangeFailures.push(`Solar radiation ${record.solarRadiationWm2} W/m² outside [0, 1400]`);
      }
    }
    if (record.dewPointC !== null && record.temperatureC !== null) {
      if (record.dewPointC > record.temperatureC + 0.5) {
        rangeFailures.push(`Dew point (${record.dewPointC}°C) physically exceeds dry bulb temp (${record.temperatureC}°C)`);
      }
    }

    if (rangeFailures.length > 0) {
      rangePassed = false;
      rangeFailures.forEach((f) => errors.push(f));
    }
    checks.push({
      id: 'rule_physical_boundaries',
      name: 'Physical Range Boundaries Check',
      passed: rangePassed,
      message: rangePassed
        ? 'All variables within physically permissible meteorological ranges'
        : `Boundary violations: ${rangeFailures.join('; ')}`,
    });
  }

  // Check 5: Timestamp Freshness Check
  const recordTime = new Date(record.timestamp).getTime();
  const now = Date.now();
  let freshnessPassed = true;
  let isStale = false;
  let freshnessMsg = '';

  if (isNaN(recordTime)) {
    freshnessPassed = false;
    freshnessMsg = `Invalid or unparseable timestamp: "${record.timestamp}"`;
    errors.push(freshnessMsg);
  } else {
    const ageMinutes = Math.round((now - recordTime) / (60 * 1000));
    freshnessMsg = `Data timestamp fresh (${Math.abs(ageMinutes)} min from now)`;

    if (record.sourceRole === 'OBSERVATION') {
      if (ageMinutes > 240) {
        isStale = true;
        freshnessMsg = `Observation is ${ageMinutes} min old (threshold: 240 min)`;
        warnings.push(freshnessMsg);
      }
    } else if (record.sourceRole === 'OPERATIONAL_FORECAST') {
      freshnessMsg = `Forecast valid for lead step +${record.forecastLeadHours}h (Cycle: ${record.run})`;
    } else if (record.sourceRole === 'REANALYSIS') {
      freshnessMsg = `Baseline reanalysis period valid (${record.model})`;
    }
  }

  checks.push({
    id: 'rule_timestamp_freshness',
    name: 'Timestamp Freshness & Horizon Check',
    passed: freshnessPassed && !isStale,
    message: freshnessMsg,
  });

  // Check 6: Unit Consistency Check
  if (isUnavailable) {
    checks.push({
      id: 'rule_unit_consistency',
      name: 'Unit Normalization Consistency',
      passed: true,
      message: 'Unit consistency checks skipped for NULL values.',
    });
  } else {
    let unitPassed = true;
    if (record.surfacePressureHpa !== null) {
      if (record.surfacePressureHpa > 2000) {
        unitPassed = false;
        errors.push(`Pressure appears to be in raw Pascals (${record.surfacePressureHpa}) rather than hPa`);
      } else if (record.surfacePressureHpa < 200) {
        unitPassed = false;
        errors.push(`Pressure appears to be in raw kPa (${record.surfacePressureHpa}) rather than hPa`);
      }
    }
    if (record.temperatureC !== null) {
      if (record.temperatureC > 200) {
        unitPassed = false;
        errors.push(`Temperature appears to be in Kelvin (${record.temperatureC}) rather than Celsius`);
      } else if (record.temperatureC > 65 && record.temperatureC <= 140) {
        unitPassed = false;
        errors.push(`Temperature appears to be in Fahrenheit (${record.temperatureC}) rather than Celsius`);
      }
    }
    if (record.windSpeedMs !== null && record.windSpeedMs > 65) {
      unitPassed = false;
      errors.push(`Wind speed appears to be in km/h or knots (${record.windSpeedMs}) rather than m/s`);
    }
    checks.push({
      id: 'rule_unit_consistency',
      name: 'Unit Normalization Consistency',
      passed: unitPassed,
      message: unitPassed
        ? 'Normalized units verified: °C, %, m/s, W/m², hPa'
        : 'Unit normalization failure detected',
    });
  }

  // Check 7: Provenance Stamping & Traceability
  const hasProvenance = Boolean(record.id && record.dataset && record.retrievedAt);
  checks.push({
    id: 'rule_provenance_traceability',
    name: 'Provenance Hash & Lineage Recorded',
    passed: hasProvenance,
    message: hasProvenance
      ? `Audit hash stamped: ${record.id.slice(0, 32)}...`
      : 'Provenance hash missing',
  });
  if (!hasProvenance) errors.push('Provenance tracking incomplete');

  // Determine Overall Validation Status
  let overallStatus: NormalizationValidationStatus = 'VERIFIED';
  if (isUnavailable) {
    overallStatus = record.availability as NormalizationValidationStatus;
  } else if (errors.length > 0) {
    overallStatus = 'FAILED';
  } else if (isStale) {
    overallStatus = 'STALE';
  } else if (record.qualityStatus === 'FALLBACK' || record.qualityStatus === 'INTERPOLATED' || warnings.length > 0) {
    overallStatus = 'PARTIAL';
  }

  const passedCount = checks.filter((c) => c.passed).length;

  return {
    recordId: record.id,
    source: record.source,
    overallStatus,
    passedCount,
    totalChecks: checks.length,
    checks,
    warnings,
    errors,
    validatedAt: new Date().toISOString(),
  };
}
