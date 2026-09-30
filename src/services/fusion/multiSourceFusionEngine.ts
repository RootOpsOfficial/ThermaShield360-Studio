import { ThermaShieldNormalizedRecord } from '../normalization/thermaShieldRecord.js';

export type AgreementLevel = 'STRONG_AGREEMENT' | 'MODERATE_AGREEMENT' | 'DIVERGENCE_DETECTED';

export interface ModelContribution {
  source: string;
  model: string;
  weight: number;
  temperatureC: number;
  humidityPct: number | null;
  windSpeedMs: number | null;
  solarRadiationWm2: number | null;
  status: string;
}

/**
 * A single, comparable row for EVERY source that returned data for this location,
 * whether or not it participates in the weighted consensus. This allows authorities
 * to compare independent source signals (e.g. ECMWF vs GFS vs Open-Meteo vs ERA5)
 * side-by-side without altering the scientifically-correct consensus weighting.
 */
export interface SourceComparisonEntry {
  source: string;
  model: string;
  /** Data semantics for this row (LIVE / FORECAST / REANALYSIS / OBSERVED …) */
  dataType: string;
  temperatureC: number | null;
  humidityPct: number | null;
  windSpeedMs: number | null;
  solarRadiationWm2: number | null;
  /** Whether this source participates in the weighted temperature consensus */
  inConsensus: boolean;
  agreementWithFusedDegC: number | null;
  status: string;
  run: string | null;
  validTime: string | null;
}

export interface InterModelAgreementMatrix {
  spreadTempDegC: number;
  stdDevTempDegC: number;
  meanTempC: number | null;
  medianTempC: number | null;
  spreadRhPct: number;
  agreementLevel: AgreementLevel;
  confidenceScorePct: number;
  divergenceAlert?: {
    isDivergent: boolean;
    headline: string;
    details: string;
    affectedModels: string[];
    recommendedAction: string;
  };
}

export interface GroundObservationTruth {
  source: string;
  temperatureC: number;
  relativeHumidityPercent: number | null;
  windSpeedMs: number | null;
  observedAt: string | null;
  nwpBiasDegC: number | null;
}

export interface FusedConsensusMeteorology {
  fusedTemperatureC: number | null;
  fusedHumidityPct: number | null;
  fusedWindSpeedMs: number | null;
  fusedSolarRadiationWm2: number | null;
  fusedPressureHpa: number | null;
  fusedDewPointC: number | null;
  climatologicalAnomalyDegC: number | null;
  groundObservation: GroundObservationTruth | null;
  agreementMatrix: InterModelAgreementMatrix;
  contributingModels: ModelContribution[];
  /** Every source that returned data for this location, for side-by-side comparison */
  sourceComparison: SourceComparisonEntry[];
  consensusTimestamp: string;
  provenanceSummary: string;
}

// Base Operational Forecast Model Weights for Western Maharashtra / Pune domain
const BASE_WEIGHTS: Record<string, number> = {
  'ECMWF IFS': 0.55,  // Global high-res dynamic core (primary)
  'NOAA GFS': 0.45,   // Global numerical prediction (primary)
  'Open-Meteo': 1.0,  // Operational mesh fallback when primary NWP is down
};

/**
 * Requirement D: Demo Quarantine Check
 * In DATA_MODE=live (or production default), records tagged as DEMO or SIMULATED_REPLAY
 * must NEVER enter operational fusion, thermal calculations, or risk calculations.
 */
export function isRecordQuarantined(record: ThermaShieldNormalizedRecord): boolean {
  const dataMode = (
    (typeof process !== 'undefined' && process.env?.DATA_MODE) ||
    'live'
  ).toLowerCase();
  if (dataMode === 'live') {
    if (record.dataType === 'DEMO' || (record.dataType as string) === 'SIMULATED_REPLAY') {
      return true;
    }
  }
  return false;
}

/**
 * Builds a comparable row for every source that returned a usable observation,
 * regardless of whether it enters the weighted consensus. This preserves source
 * identity and lets the UI show a true multi-source comparison.
 */
function buildSourceComparison(
  unquarantined: ThermaShieldNormalizedRecord[],
  fusedTemp: number | null,
  consensusRecords: ThermaShieldNormalizedRecord[]
): SourceComparisonEntry[] {
  const consensusIds = new Set(consensusRecords.map((r) => r.id));
  return unquarantined
    .filter((r) => r.availability === 'LIVE' || r.availability === 'DEGRADED')
    .map((r) => ({
      source: r.source,
      model: r.model,
      dataType: r.dataType,
      temperatureC: typeof r.temperatureC === 'number' ? r.temperatureC : null,
      humidityPct: r.relativeHumidityPercent,
      windSpeedMs: r.windSpeedMs,
      solarRadiationWm2: r.solarRadiationWm2,
      inConsensus: consensusIds.has(r.id),
      agreementWithFusedDegC:
        fusedTemp !== null && typeof r.temperatureC === 'number'
          ? Math.round((r.temperatureC - fusedTemp) * 10) / 10
          : null,
      status: r.validationStatus,
      run: r.run,
      validTime: r.validTime,
    }))
    .sort((a, b) => a.source.localeCompare(b.source));
}

export function fuseMultiSourceRecords(
  records: ThermaShieldNormalizedRecord[]
): FusedConsensusMeteorology {
  // CRITICAL ARCHITECTURAL RULES:
  // 1. DEMO QUARANTINE: Any DEMO or SIMULATED_REPLAY record is strictly quarantined in DATA_MODE=live.
  // 2. Operational NWP fusion applies strictly to LIVE or DEGRADED OPERATIONAL_FORECAST streams from independent models.
  // 3. Aggregator streams (Open-Meteo) blend ECMWF and ICON. If ECMWF IFS or NOAA GFS are live,
  //    Open-Meteo is excluded from the consensus to prevent double-counting ECMWF data.
  // 4. Observations (IMD AWS, NCEI) are quarantined from forecast averaging and treated as Ground Truth benchmarks.
  // 5. Reanalysis (ERA5) is quarantined and used strictly for Climatological Departure (Delta T).
  const unquarantined = records.filter((r) => !isRecordQuarantined(r));

  const liveOperationalForecasts = unquarantined.filter(
    (r) =>
      (r.availability === 'LIVE' || r.availability === 'DEGRADED') &&
      r.sourceRole === 'OPERATIONAL_FORECAST' &&
      typeof r.temperatureC === 'number' &&
      !isNaN(r.temperatureC) &&
      isFinite(r.temperatureC)
  );

  const hasDedicatedModels = liveOperationalForecasts.some(
    (r) => r.source === 'ECMWF IFS' || r.source === 'NOAA GFS'
  );

  // De-duplicate aggregator when constituent NWP cores are active
  const activeRecords = hasDedicatedModels
    ? liveOperationalForecasts.filter((r) => r.source !== 'Open-Meteo')
    : liveOperationalForecasts;

  // Extract separate in-situ ground observation if present
  const liveObs = unquarantined.find(
    (r) =>
      (r.availability === 'LIVE' || r.availability === 'DEGRADED') &&
      r.sourceRole === 'OBSERVATION' &&
      typeof r.temperatureC === 'number' &&
      !isNaN(r.temperatureC) &&
      isFinite(r.temperatureC)
  );

  // If no live operational records available, return safe NULL state with 0% confidence
  if (activeRecords.length === 0) {
    return {
      fusedTemperatureC: null,
      fusedHumidityPct: null,
      fusedWindSpeedMs: null,
      fusedSolarRadiationWm2: null,
      fusedPressureHpa: null,
      fusedDewPointC: null,
      climatologicalAnomalyDegC: null,
      groundObservation: null,
      agreementMatrix: {
        spreadTempDegC: 0,
        stdDevTempDegC: 0,
        meanTempC: null,
        medianTempC: null,
        spreadRhPct: 0,
        agreementLevel: 'MODERATE_AGREEMENT',
        confidenceScorePct: 0,
        divergenceAlert: {
          isDivergent: false,
          headline: 'No Live Operational Sources Available',
          details: 'Zero verified operational forecast or observation sources are reachable.',
          affectedModels: [],
          recommendedAction: 'Verify API network reachability, tokens, and endpoint status.',
        },
      },
      contributingModels: [],
      sourceComparison: buildSourceComparison(unquarantined, null, []),
      consensusTimestamp: new Date().toISOString(),
      provenanceSummary: 'Zero live operational sources available for consensus computation',
    };
  }

  // Extract temperatures from live operational sources
  const temps = activeRecords.map((r) => r.temperatureC as number);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const spreadTemp = Math.round((maxTemp - minTemp) * 10) / 10;

  // Mean & Std Dev
  const meanTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
  const variance = temps.reduce((sum, t) => sum + Math.pow(t - meanTemp, 2), 0) / temps.length;
  const stdDevTemp = Math.round(Math.sqrt(variance) * 10) / 10;

  // Median
  const sortedTemps = [...temps].sort((a, b) => a - b);
  const mid = Math.floor(sortedTemps.length / 2);
  const medianTemp = sortedTemps.length % 2 === 0
    ? (sortedTemps[mid - 1] + sortedTemps[mid]) / 2
    : sortedTemps[mid];

  // Relative humidity spread
  const rhs = activeRecords
    .map((r) => r.relativeHumidityPercent)
    .filter((v): v is number => typeof v === 'number' && !isNaN(v));
  const spreadRh = rhs.length > 0 ? Math.max(...rhs) - Math.min(...rhs) : 0;

  // Agreement Classification & Dynamically Calculated Confidence
  let agreementLevel: AgreementLevel = 'STRONG_AGREEMENT';
  let confidenceScorePct = Math.min(95, Math.max(50, 75 + activeRecords.length * 5));
  let divergenceAlert: InterModelAgreementMatrix['divergenceAlert'];

  if (spreadTemp > 3.0) {
    agreementLevel = 'DIVERGENCE_DETECTED';
    confidenceScorePct = Math.max(30, Math.round(85 - spreadTemp * 8));
    divergenceAlert = {
      isDivergent: true,
      headline: 'Model Divergence Detected Across Operational Streams',
      details: `Disagreement detected: Models exhibit a ${spreadTemp}°C spread (Min: ${minTemp}°C, Max: ${maxTemp}°C). Confidence reduced to ${confidenceScorePct}%. Compare cycle run and valid times before civic escalation.`,
      affectedModels: activeRecords.map((r) => `${r.source}: ${(r.temperatureC as number).toFixed(1)}°C (Run: ${r.run || 'N/A'}, Valid: ${r.validTime || 'N/A'})`),
      recommendedAction: 'Authorities should continue monitoring the upcoming model cycles before issuing irreversible civic escalations.',
    };
  } else if (spreadTemp > 1.5) {
    agreementLevel = 'MODERATE_AGREEMENT';
    confidenceScorePct = Math.min(85, confidenceScorePct);
  }

  // Dynamic Re-weighting: Normalize weights across active live operational models to exactly 100%
  const rawWeights = activeRecords.map((rec) => BASE_WEIGHTS[rec.source] || 0.15);
  const totalRawWeight = rawWeights.reduce((a, b) => a + b, 0);

  let weightedTempSum = 0;
  let weightedRhSum = 0;
  let totalRhWeight = 0;
  let weightedWsSum = 0;
  let totalWsWeight = 0;
  let weightedSolarSum = 0;
  let totalSolarWeight = 0;
  let weightedPressureSum = 0;
  let totalPressureWeight = 0;

  const contributingModels: ModelContribution[] = [];

  activeRecords.forEach((rec, idx) => {
    const normalizedWeight = totalRawWeight > 0 ? rawWeights[idx] / totalRawWeight : 1 / activeRecords.length;
    const temp = rec.temperatureC as number;

    weightedTempSum += temp * normalizedWeight;

    if (rec.relativeHumidityPercent !== null) {
      weightedRhSum += rec.relativeHumidityPercent * normalizedWeight;
      totalRhWeight += normalizedWeight;
    }
    if (rec.windSpeedMs !== null) {
      weightedWsSum += rec.windSpeedMs * normalizedWeight;
      totalWsWeight += normalizedWeight;
    }
    if (rec.solarRadiationWm2 !== null) {
      weightedSolarSum += rec.solarRadiationWm2 * normalizedWeight;
      totalSolarWeight += normalizedWeight;
    }
    if (rec.surfacePressureHpa !== null) {
      weightedPressureSum += rec.surfacePressureHpa * normalizedWeight;
      totalPressureWeight += normalizedWeight;
    }

    contributingModels.push({
      source: rec.source,
      model: rec.model,
      weight: Math.round(normalizedWeight * 1000) / 1000,
      temperatureC: temp,
      humidityPct: rec.relativeHumidityPercent,
      windSpeedMs: rec.windSpeedMs,
      solarRadiationWm2: rec.solarRadiationWm2,
      status: rec.validationStatus,
    });
  });

  const fusedTemp = Math.round(weightedTempSum * 10) / 10;
  const fusedRh = totalRhWeight > 0 ? Math.round(weightedRhSum / totalRhWeight) : null;
  const fusedWs = totalWsWeight > 0 ? Math.round((weightedWsSum / totalWsWeight) * 10) / 10 : null;
  const fusedSolar = totalSolarWeight > 0 ? Math.round(weightedSolarSum / totalSolarWeight) : null;
  const fusedPressure = totalPressureWeight > 0 ? Math.round((weightedPressureSum / totalPressureWeight) * 10) / 10 : null;

  // Magnus-Tetens Dew Point for fused consensus
  let fusedDewPoint: number | null = null;
  if (fusedTemp !== null && fusedRh !== null) {
    const a = 17.625;
    const b = 243.04;
    const alpha = Math.log(Math.max(1, fusedRh) / 100) + (a * fusedTemp) / (b + fusedTemp);
    fusedDewPoint = Math.min(fusedTemp, Math.round(((b * alpha) / (a - alpha)) * 10) / 10);
  }

  // Climatological departure calculation: Delta T = Fused Forecast - ERA5 30-year normal
  const era5Rec = unquarantined.find(
    (r) =>
      r.sourceRole === 'REANALYSIS' &&
      (r.availability === 'LIVE' || r.availability === 'DEGRADED') &&
      typeof r.temperatureC === 'number'
  );
  const climatologicalAnomalyDegC = era5Rec?.temperatureC != null
    ? Math.round((fusedTemp - era5Rec.temperatureC) * 10) / 10
    : null;

  // Ground Observation Truth & Bias Offset (Obs - Fused NWP)
  const groundObservation: GroundObservationTruth | null = liveObs && typeof liveObs.temperatureC === 'number'
    ? {
        source: liveObs.source,
        temperatureC: liveObs.temperatureC,
        relativeHumidityPercent: liveObs.relativeHumidityPercent,
        windSpeedMs: liveObs.windSpeedMs,
        observedAt: liveObs.validTime,
        nwpBiasDegC: Math.round((liveObs.temperatureC - fusedTemp) * 10) / 10,
      }
    : null;

  const agreementMatrix: InterModelAgreementMatrix = {
    spreadTempDegC: spreadTemp,
    stdDevTempDegC: stdDevTemp,
    meanTempC: Math.round(meanTemp * 10) / 10,
    medianTempC: Math.round(medianTemp * 10) / 10,
    spreadRhPct: spreadRh,
    agreementLevel,
    confidenceScorePct,
    divergenceAlert,
  };

  return {
    fusedTemperatureC: fusedTemp,
    fusedHumidityPct: fusedRh,
    fusedWindSpeedMs: fusedWs,
    fusedSolarRadiationWm2: fusedSolar,
    fusedPressureHpa: fusedPressure,
    fusedDewPointC: fusedDewPoint,
    climatologicalAnomalyDegC,
    groundObservation,
    agreementMatrix,
    contributingModels,
    sourceComparison: buildSourceComparison(unquarantined, fusedTemp, activeRecords),
    consensusTimestamp: new Date().toISOString(),
    provenanceSummary: `Fused consensus across ${activeRecords.length} live operational sources (${activeRecords.map((r) => r.source).join(', ')})`,
  };
}
