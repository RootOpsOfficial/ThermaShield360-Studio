/**
 * ThermaShield 360 — Real-Data Early Warning & Heatwave Horizon Engine
 *
 * Every number produced here is derived from a verified provider response:
 *
 *  • 1 – 16 day operational horizon ... Open-Meteo operational daily forecast
 *                                       (gridded ICON/ECMWF hybrid, 16-day product)
 *  • probabilistic support ........... NOAA GEFS 31-member ensemble (real spread)
 *  • inter-model consensus ........... fused ECMWF IFS + NOAA GFS + Open-Meteo
 *                                       (skill weights, de-duplicated aggregator)
 *  • climatological baseline ......... NASA POWER 20-year monthly climatology
 *                                       (Jan 2001 – Dec 2020, MERRA-2 assimilated)
 *
 * IMD is **never** fabricated. The official IMD Mausam programmatic feed requires
 * authorization that is not available in this environment, so IMD is reported strictly
 * as NOT AVAILABLE in `dataBasis.unavailableSources` and never contributes a number.
 *
 * Long-lead (1 – 12 month) horizons carry no operational forecast skill. Instead of
 * inventing an "arrival window", those horizons report the location's REAL
 * climatological heat season from the 20-year record and are labelled CLIMATOLOGICAL.
 */

import {
  EarlyWarningHorizon,
  EvidenceBasis,
  LongRangeDataBasis,
  LongRangeEarlyWarningReport,
  ModelConfidenceData,
  UnifiedHeatwaveVerdict,
} from '../types.js';
import { fetchWeatherData } from './weatherService.js';
import { fetchNoaaGefsRaw } from '../services/data/noaa/gefs/gefsClient.js';
import { ingestAndAuditAllSources } from '../services/validation/provenanceLedger.js';
import { fuseMultiSourceRecords, FusedConsensusMeteorology } from '../services/fusion/multiSourceFusionEngine.js';
import {
  ClimatologyBaseline,
  MonthlyClimatologicalNormal,
  fetchClimatologyBaseline,
} from '../services/earlyWarning/climatologyBaseline.js';

/** ThermaShield urban heatwave watch threshold (IMD-aligned, urban UHI adjusted). */
export const HEATWAVE_THRESHOLD_C = 38.5;
/** IMD plains severe-heatwave threshold used consistently across ThermaShield. */
export const SEVERE_HEATWAVE_THRESHOLD_C = 40.0;

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface LongRangeLocationContext {
  lat: number;
  lng: number;
  ward?: {
    uhiOffsetDegC?: number;
    city?: string;
    state?: string;
    zone?: string;
    vulnerabilityIndex?: number;
  };
}

type DayClassification = 'None' | 'Heatwave' | 'Severe Heatwave';

interface PreparedDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  feelsLikeMax: number;
  adjustedMax: number; // UHI-adjusted ward maximum
  classification: DayClassification;
}

interface HeatwaveEpisode {
  startIndex: number;
  endIndex: number;
  lengthDays: number;
  peakAdjustedMaxC: number;
  isSevere: boolean;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function monthLabelFromIndex(monthIndex: number): string {
  return MONTH_LABELS[((monthIndex % 12) + 12) % 12];
}

/** '2026-10-05' -> 'Oct 05' */
function shortDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const monthShort = MONTH_LABELS[parseInt(parts[1], 10) - 1]?.slice(0, 3) ?? parts[1];
  return `${monthShort} ${parts[2]}`;
}

function classifyAdjustedMax(adjustedMaxC: number): DayClassification {
  if (adjustedMaxC >= SEVERE_HEATWAVE_THRESHOLD_C) return 'Severe Heatwave';
  if (adjustedMaxC >= HEATWAVE_THRESHOLD_C) return 'Heatwave';
  return 'None';
}

function severityFromAdjustedMax(adjustedMaxC: number | null): 'Extreme' | 'High' | 'Moderate' | 'Low' {
  if (adjustedMaxC === null) return 'Low';
  if (adjustedMaxC >= SEVERE_HEATWAVE_THRESHOLD_C + 2) return 'Extreme';
  if (adjustedMaxC >= SEVERE_HEATWAVE_THRESHOLD_C) return 'High';
  if (adjustedMaxC >= HEATWAVE_THRESHOLD_C) return 'Moderate';
  return 'Low';
}

function gradeFromConfidence(pct: number): 'Very High' | 'High' | 'Moderate' | 'Low' {
  if (pct >= 90) return 'Very High';
  if (pct >= 75) return 'High';
  if (pct >= 55) return 'Moderate';
  return 'Low';
}

/** First contiguous run of days at/above the heatwave threshold in the live forecast. */
function detectFirstEpisode(days: PreparedDay[]): HeatwaveEpisode | null {
  let start = -1;
  for (let i = 0; i < days.length; i++) {
    const isHot = days[i].classification !== 'None';
    if (isHot && start === -1) start = i;
    if (!isHot && start !== -1) {
      return summariseEpisode(days, start, i - 1);
    }
  }
  if (start !== -1) return summariseEpisode(days, start, days.length - 1);
  return null;
}

function summariseEpisode(days: PreparedDay[], startIndex: number, endIndex: number): HeatwaveEpisode {
  const slice = days.slice(startIndex, endIndex + 1);
  const peakAdjustedMaxC = Math.max(...slice.map((d) => d.adjustedMax));
  return {
    startIndex,
    endIndex,
    lengthDays: slice.length,
    peakAdjustedMaxC: round1(peakAdjustedMaxC),
    isSevere: slice.some((d) => d.classification === 'Severe Heatwave'),
  };
}

/** Convert the real GEFS member spread into a probabilistic confidence percentage. */
function ensembleConfidenceFromSpread(spreadDegC: number | null): number | null {
  if (spreadDegC === null) return null;
  return clamp(Math.round(100 - spreadDegC * 12), 25, 98);
}

function fullNameForSource(source: string): string {
  switch (source) {
    case 'ECMWF IFS':
      return 'ECMWF IFS 0.25° global dynamic core (Open Data)';
    case 'NOAA GFS':
      return 'NOAA GFS 0.25° operational NWP cycle';
    case 'NOAA GEFS':
      return 'NOAA GEFS 31-member global ensemble';
    case 'Open-Meteo':
      return 'Open-Meteo gridded operational mesh (ICON / ECMWF hybrid)';
    case 'ERA5':
      return 'Copernicus ERA5 reanalysis (WMO 1991–2020 baseline)';
    case 'NASA POWER':
      return 'NASA POWER / MERRA-2 assimilated climatology';
    case 'IMD':
      return 'India Meteorological Department official station feed';
    default:
      return source;
  }
}

interface GefsSummary {
  available: boolean;
  spreadDegC: number | null;
  exceedancePct: number | null;
  memberCount: number | null;
}

/**
 * Evidence rows for the operational (1–16 day) horizon.
 * Only REAL providers that returned data for this location are included.
 */
function buildOperationalEvidence(params: {
  fusion: FusedConsensusMeteorology | null;
  gefs: GefsSummary | null;
  forecastSourceLabel: string;
  forecastDays: number;
  peakDailyMaxC: number | null;
  operationalConfidencePct: number | null;
  climatologyNormalThisMonthC: number | null;
  uhiOffsetDegC: number;
}): ModelConfidenceData[] {
  const {
    fusion,
    gefs,
    forecastSourceLabel,
    forecastDays,
    peakDailyMaxC,
    operationalConfidencePct,
    climatologyNormalThisMonthC,
    uhiOffsetDegC,
  } = params;

  const evidence: ModelConfidenceData[] = [];

  // 1. Real operational daily forecast (primary source for daily maxima)
  if (forecastDays > 0) {
    evidence.push({
      modelName: 'Open-Meteo Operational Mesh',
      fullName: fullNameForSource('Open-Meteo'),
      dataType: 'FORECAST',
      availability: 'LIVE',
      confidencePct: operationalConfidencePct,
      prediction:
        peakDailyMaxC !== null
          ? `Peak daily maximum ${peakDailyMaxC}°C across the live ${forecastDays}-day forecast`
          : `Live ${forecastDays}-day daily forecast available`,
      anomalyDegC:
        peakDailyMaxC !== null && climatologyNormalThisMonthC !== null
          ? round1(peakDailyMaxC - climatologyNormalThisMonthC)
          : null,
      agreement: true,
      notes: `${forecastSourceLabel}. Ward UHI offset +${uhiOffsetDegC}°C applied to daily maxima.`,
      observedValueC: peakDailyMaxC,
      retrievedAt: new Date().toISOString(),
    });
  }

  // 2. Every independent NWP core that actually participated in the weighted consensus
  if (fusion) {
    for (const model of fusion.contributingModels) {
      if (model.temperatureC === null) continue;
      evidence.push({
        modelName: model.source,
        fullName: fullNameForSource(model.source),
        dataType: 'FORECAST',
        availability: model.status,
        confidencePct: operationalConfidencePct,
        prediction: `${model.temperatureC}°C at valid time (consensus weight ${Math.round(model.weight * 100)}%)`,
        anomalyDegC:
          climatologyNormalThisMonthC !== null ? round1(model.temperatureC - climatologyNormalThisMonthC) : null,
        agreement: fusion.agreementMatrix.agreementLevel !== 'DIVERGENCE_DETECTED',
        notes: `${fullNameForSource(model.source)} — ${model.model}. Spread across cores: ${fusion.agreementMatrix.spreadTempDegC}°C (σ ${fusion.agreementMatrix.stdDevTempDegC}°C).`,
        observedValueC: model.temperatureC,
        retrievedAt: fusion.consensusTimestamp,
      });
    }
  }

  // 3. Real GEFS ensemble probability
  if (gefs?.available) {
    evidence.push({
      modelName: 'NOAA GEFS',
      fullName: fullNameForSource('NOAA GEFS'),
      dataType: 'ENSEMBLE',
      availability: 'LIVE',
      confidencePct: ensembleConfidenceFromSpread(gefs.spreadDegC),
      prediction:
        gefs.exceedancePct !== null
          ? `${gefs.exceedancePct}% of ensemble members exceed the 40°C severe-heatwave threshold at the current hourly valid time`
          : 'Ensemble member spread retrieved',
      anomalyDegC: null,
      agreement: true,
      notes: `${gefs.memberCount ?? 0} ensemble members. Member spread ${gefs.spreadDegC ?? '—'}°C.`,
      observedValueC: null,
      retrievedAt: new Date().toISOString(),
    });
  }

  // 4. Real reanalysis baseline (climatological reference, never a forecast vote)
  const era5Entry = fusion?.sourceComparison.find((s) => s.source === 'ERA5');
  if (era5Entry && era5Entry.temperatureC !== null) {
    evidence.push({
      modelName: 'ERA5 Reanalysis',
      fullName: fullNameForSource('ERA5'),
      dataType: 'REANALYSIS',
      availability: era5Entry.status,
      confidencePct: null,
      prediction: `Baseline ${era5Entry.temperatureC}°C for this grid cell and time of day`,
      anomalyDegC:
        typeof fusion?.climatologicalAnomalyDegC === 'number' ? fusion.climatologicalAnomalyDegC : null,
      agreement: true,
      notes: 'Reanalysis is treated as the climatological reference, not a forecast vote.',
      observedValueC: era5Entry.temperatureC,
      retrievedAt: fusion?.consensusTimestamp ?? new Date().toISOString(),
    });
  }

  return evidence;
}

/**
 * Evidence rows for a long-lead (1–12 month) climatological horizon.
 * At these lead times there is no operational forecast — only the real 20-year record.
 */
function buildSeasonalEvidence(params: {
  targetNormals: MonthlyClimatologicalNormal[];
  climatology: ClimatologyBaseline | null;
  operationalSources: { name: string; availability: string }[];
  seasonalConfidencePct: number;
}): ModelConfidenceData[] {
  const { targetNormals, climatology, operationalSources, seasonalConfidencePct } = params;
  const evidence: ModelConfidenceData[] = [];

  const withValues = targetNormals.filter((m) => m.normalMaxTempC !== null);

  if (climatology?.available && withValues.length > 0) {
    const peak = withValues.reduce((best, m) =>
      (m.normalMaxTempC as number) > (best.normalMaxTempC as number) ? m : best
    );
    evidence.push({
      modelName: 'NASA POWER Climatology',
      fullName: fullNameForSource('NASA POWER'),
      dataType: 'REANALYSIS',
      availability: climatology.status,
      confidencePct: seasonalConfidencePct,
      prediction: `20-year ${peak.monthLabel} normal daily maximum ${peak.normalMaxTempC}°C for this grid cell`,
      anomalyDegC: null,
      agreement: true,
      notes: `${climatology.dataset}. Reference period ${climatology.referencePeriod}. Spatial ${climatology.spatialResolution}.`,
      observedValueC: peak.normalMaxTempC,
      retrievedAt: climatology.retrievedAt,
    });
  }

  // Operational cores are listed for provenance continuity only — clearly marked as
  // carrying no skill at this lead time.
  for (const source of operationalSources) {
    evidence.push({
      modelName: `${source.name} (no long-lead skill)`,
      fullName: fullNameForSource(source.name),
      dataType: 'FORECAST',
      availability: source.availability,
      confidencePct: null,
      prediction: 'Operational NWP skill does not extend to this lead time — listed for provenance only',
      anomalyDegC: null,
      agreement: false,
      notes: 'Not used to compute this horizon. Shown so the evidence chain stays fully transparent.',
      observedValueC: null,
      retrievedAt: new Date().toISOString(),
    });
  }

  return evidence;
}

function buildGuidance(
  isComing: boolean,
  basis: EvidenceBasis,
  window: string,
  peakC: number | null
): { title: string; actionItems: string[]; prepStage: string } {
  if (!isComing) {
    return {
      title: 'No heatwave threshold breach in this window',
      actionItems: [
        'Maintain routine hydration (2.5–3 litres/day) and normal outdoor schedules.',
        'Monitor official forecasts for any upward revision of the daytime maximum.',
        'Keep electrolytes available for outdoor workers as a standing precaution.',
      ],
      prepStage: 'Routine Monitoring',
    };
  }

  if (basis === 'CLIMATOLOGICAL') {
    return {
      title: 'Climatological heat-season preparation',
      actionItems: [
        `Plan heat mitigation for ${window} — this is the historically warmest window for this location.`,
        'Schedule roof/cooling maintenance, tree-canopy audits and water-point checks before the season.',
        'Pre-register vulnerable residents (seniors, outdoor workers, children) for wellness checks.',
        'Confirm cooling-centre readiness and staffing rosters ahead of the season onset.',
      ],
      prepStage: 'Seasonal Preparedness',
    };
  }

  return {
    title: 'Immediate operational heatwave response',
    actionItems: [
      peakC !== null
        ? `Expect daytime maxima near ${peakC}°C during ${window}. Avoid all non-essential outdoor work between 12:30 PM and 4:30 PM.`
        : `Avoid all non-essential outdoor work between 12:30 PM and 4:30 PM during ${window}.`,
      'Drink water every 20–30 minutes; add electrolytes for outdoor workers.',
      'Move the most vulnerable household members to the coolest available room or a civic cooling shelter.',
      'Check on neighbours who live alone, are elderly, or have pre-existing illness.',
    ],
    prepStage: 'Immediate',
  };
}

/**
 * Build the ThermaShield early-warning ladder for a location from REAL provider data.
 *
 * @param locationName human-readable location label shown in the UI
 * @param context      resolved coordinates + optional ward micro-climate attributes
 */
export async function generateLongRangeEarlyWarning(
  locationName: string,
  context: LongRangeLocationContext
): Promise<LongRangeEarlyWarningReport> {
  const { lat, lng } = context;
  const uhiOffsetDegC = context.ward?.uhiOffsetDegC ?? 0;
  const now = new Date();

  // ---------------------------------------------------------------------------
  // 1. Real data acquisition — every call degrades independently, never fabricates
  // ---------------------------------------------------------------------------
  const [weather, ledger, gefsPayload, climatology] = await Promise.all([
    fetchWeatherData(lat, lng).catch(() => null),
    ingestAndAuditAllSources(lat, lng).catch(() => null),
    fetchNoaaGefsRaw(lat, lng).catch(() => null),
    fetchClimatologyBaseline(lat, lng, HEATWAVE_THRESHOLD_C).catch(() => null),
  ]);

  const fusion: FusedConsensusMeteorology | null = ledger ? fuseMultiSourceRecords(ledger.records) : null;

  // The MODELLED weather fallback must never be presented as a real forecast.
  const liveForecastAvailable =
    weather !== null && weather.source === 'LIVE' && Array.isArray(weather.daily) && weather.daily.length > 0;
  const dailyList = liveForecastAvailable ? weather!.daily : [];
  const forecastDays = dailyList.length;

  const preparedDays: PreparedDay[] = dailyList.map((day) => {
    const adjustedMax = round1(day.tempMax + uhiOffsetDegC);
    return {
      date: day.date,
      dayName: day.dayName,
      tempMax: day.tempMax,
      tempMin: day.tempMin,
      feelsLikeMax: day.feelsLikeMax,
      adjustedMax,
      classification: classifyAdjustedMax(adjustedMax),
    };
  });

  const episode = detectFirstEpisode(preparedDays);
  const peakDailyMaxC =
    preparedDays.length > 0 ? round1(Math.max(...preparedDays.map((d) => d.adjustedMax))) : null;

  // Human-readable episode window (handles single-day and multi-day episodes)
  const episodeWindowLabel =
    episode === null
      ? null
      : episode.startIndex === episode.endIndex
      ? `${shortDate(preparedDays[episode.startIndex].date)}, ${new Date(preparedDays[episode.startIndex].date).getFullYear()} (1 day)`
      : `${shortDate(preparedDays[episode.startIndex].date)} – ${shortDate(preparedDays[episode.endIndex].date)}, ${new Date(preparedDays[episode.startIndex].date).getFullYear()}`;

  // ---------------------------------------------------------------------------
  // 2. Real ensemble summary (NOAA GEFS)
  // ---------------------------------------------------------------------------
  const gefsRaw = gefsPayload?.rawData ?? null;
  const gefsLive =
    gefsPayload !== null &&
    gefsRaw !== null &&
    (gefsPayload.availability === 'LIVE' || gefsPayload.availability === 'DEGRADED');

  const gefs: GefsSummary | null = gefsLive
    ? {
        available: true,
        spreadDegC: gefsRaw!.ensembleSpreadDegC ?? null,
        exceedancePct: gefsRaw!.heatwaveExceedanceProbabilityPct ?? null,
        memberCount: gefsRaw!.ensembleMemberCount ?? null,
      }
    : null;

  // ---------------------------------------------------------------------------
  // 3. Confidence derived strictly from real signal quality
  // ---------------------------------------------------------------------------
  const fusionAgreementPct = fusion ? fusion.agreementMatrix.confidenceScorePct : null;
  const ensembleConfPct = ensembleConfidenceFromSpread(gefs?.spreadDegC ?? null);

  let operationalConfidencePct: number | null = null;
  let operationalConfidenceBasis = 'No verified operational model returned data for this location.';

  if (fusionAgreementPct !== null && ensembleConfPct !== null) {
    operationalConfidencePct = Math.round(fusionAgreementPct * 0.65 + ensembleConfPct * 0.35);
    operationalConfidenceBasis = `65% weight on real inter-model agreement across ${fusion!.contributingModels.length} NWP cores (${fusionAgreementPct}%) + 35% weight on the NOAA GEFS ${gefs?.memberCount ?? 0}-member spread (σ ${gefs?.spreadDegC}°C → ${ensembleConfPct}%).`;
  } else if (fusionAgreementPct !== null) {
    operationalConfidencePct = fusionAgreementPct;
    operationalConfidenceBasis = `Derived from real inter-model agreement across ${fusion!.contributingModels.length} NWP cores (spread ${fusion!.agreementMatrix.spreadTempDegC}°C, ${fusion!.agreementMatrix.agreementLevel}).`;
  } else if (ensembleConfPct !== null) {
    operationalConfidencePct = ensembleConfPct;
    operationalConfidenceBasis = `Derived from the NOAA GEFS ensemble spread (σ ${gefs?.spreadDegC}°C).`;
  }

  const currentMonthNormal =
    climatology?.monthlyNormals.find((m) => m.monthIndex === now.getMonth()) ?? null;

  const allRecords = ledger?.records ?? [];
  const unavailableSources = Array.from(
    new Set(
      allRecords
        .filter((r) => r.availability !== 'LIVE' && r.availability !== 'DEGRADED')
        .map((r) => `${r.source} — ${r.availability} (${r.model}, ${r.dataType})`)
    )
  );
  if (!gefsLive && !unavailableSources.some((s) => s.startsWith('NOAA GEFS'))) {
    unavailableSources.push(`NOAA GEFS (${gefsPayload?.availability ?? 'NOT_AVAILABLE'})`);
  }
  const imdRecord = allRecords.find((r) => r.source === 'IMD');
  if (
    (!imdRecord || (imdRecord.availability !== 'LIVE' && imdRecord.availability !== 'DEGRADED')) &&
    !unavailableSources.some((s) => s.startsWith('IMD'))
  ) {
    unavailableSources.push('IMD (NOT_AVAILABLE — official Mausam programmatic feed requires authorization)');
  }

  const consensusSources = fusion ? Array.from(new Set(fusion.sourceComparison.map((s) => s.source))) : [];

  const buildClimateDrivers = (): string[] => {
    const drivers: string[] = [];
    if (fusion) {
      drivers.push(
        `${fusion.contributingModels.length} independent NWP cores in consensus (spread ${fusion.agreementMatrix.spreadTempDegC}°C, ${fusion.agreementMatrix.agreementLevel})`
      );
    }
    if (gefs) {
      drivers.push(`NOAA GEFS ${gefs.memberCount ?? 0}-member ensemble, spread σ ${gefs.spreadDegC}°C`);
    }
    if (uhiOffsetDegC) {
      drivers.push(`Ward UHI offset +${uhiOffsetDegC}°C applied to daily maxima`);
    }
    if (typeof fusion?.climatologicalAnomalyDegC === 'number') {
      drivers.push(`Fused anomaly vs ERA5 baseline ${fusion.climatologicalAnomalyDegC}°C`);
    }
    if (climatology?.available) {
      drivers.push(`${climatology.referencePeriod} monthly climatology loaded for this grid cell`);
    }
    return drivers;
  };

  // ---------------------------------------------------------------------------
  // 4. Horizon A — 1–30 day operational (backed by the real 16-day forecast)
  // ---------------------------------------------------------------------------
  const operationalBasis: EvidenceBasis = forecastDays > 0 ? 'OPERATIONAL_FORECAST' : 'UNAVAILABLE';
  const firstDate = preparedDays[0]?.date ?? null;
  const lastDate = preparedDays[preparedDays.length - 1]?.date ?? null;
  const operationalWindow =
    firstDate && lastDate
      ? `${shortDate(firstDate)} – ${shortDate(lastDate)} ${new Date(lastDate).getFullYear()}`
      : 'Live forecast unavailable';

  const operationalHorizon: EarlyWarningHorizon = {
    id: 'horizon-1-30d',
    timeRangeLabel: '1 Day to 30 Days',
    timeRangeTitle: `Immediate Horizon — ${forecastDays > 0 ? `Operational ${forecastDays}-Day Forecast` : 'Operational Forecast Unavailable'}`,
    targetWindow: operationalWindow,
    isHeatwaveComing: episode !== null,
    heatwaveStatus: episode ? 'COMING' : 'NO_HEATWAVE',
    verdict: episode ? 'HEATWAVE IS COMING' : 'NO HEATWAVE COMING',
    statusHeadline:
      episode !== null
        ? `Heatwave threshold (${HEATWAVE_THRESHOLD_C}°C UHI-adjusted maximum) breached for ${episode.lengthDays} consecutive day(s) from ${shortDate(preparedDays[episode.startIndex].date)}.`
        : forecastDays > 0
        ? `No day in the live ${forecastDays}-day forecast breaches the ${HEATWAVE_THRESHOLD_C}°C UHI-adjusted heatwave threshold.`
        : 'No verified operational forecast is available for this location.',
    unifiedConfidencePct: operationalBasis === 'UNAVAILABLE' ? 0 : operationalConfidencePct ?? 0,
    consensusConfidencePct: fusionAgreementPct ?? 0,
    expectedOnsetDates:
      episodeWindowLabel !== null
        ? episodeWindowLabel
        : forecastDays > 0
        ? `No heatwave threshold exceeded in the live ${forecastDays}-day window`
        : 'Operational forecast unavailable',
    expectedDuration:
      episode !== null
        ? `${episode.lengthDays} Consecutive Day${episode.lengthDays > 1 ? 's' : ''}`
        : '0 Days (below heatwave threshold)',
    severityLevel: severityFromAdjustedMax(episode ? episode.peakAdjustedMaxC : peakDailyMaxC),
    models: buildOperationalEvidence({
      fusion,
      gefs,
      forecastSourceLabel:
        weather?.current?.weatherDescription?.startsWith('MODELLED') === true
          ? 'Modelled fallback flagged'
          : 'Open-Meteo operational 16-day daily product',
      forecastDays,
      peakDailyMaxC,
      operationalConfidencePct,
      climatologyNormalThisMonthC: currentMonthNormal?.normalMaxTempC ?? null,
      uhiOffsetDegC,
    }),
    climateDrivers: buildClimateDrivers(),
    citizenGuidance: buildGuidance(
      episode !== null,
      operationalBasis,
      operationalWindow,
      episode?.peakAdjustedMaxC ?? peakDailyMaxC
    ),
    evidenceBasis: operationalBasis,
    confidenceBasis: operationalConfidenceBasis,
    liveForecastDays: forecastDays,
    disclaimer:
      'The horizon label spans 30 days; verified operational coverage is the day range shown in "Target Window". Nothing is extrapolated beyond real provider output.',
  };

  // ---------------------------------------------------------------------------
  // 5. Horizons B–E — long-lead climatological outlook (no forecast skill exists)
  // ---------------------------------------------------------------------------
  const seasonalDescriptors: { id: string; label: string; title: string; offsets: number[] }[] = [
    { id: 'horizon-1-3m', label: '1 to 3 Months', title: 'Sub-Seasonal / Seasonal Transition Horizon', offsets: [1, 2, 3] },
    { id: 'horizon-3-5m', label: '3 to 5 Months', title: 'Sub-Seasonal Outlook Horizon', offsets: [3, 4, 5] },
    { id: 'horizon-5-8m', label: '5 to 8 Months', title: 'Seasonal Forecast Outlook Horizon', offsets: [5, 6, 7, 8] },
    { id: 'horizon-8-12m', label: '8 to 12 Months', title: 'Climate Teleconnection Outlook Horizon', offsets: [8, 9, 10, 11, 12] },
  ];

  const operationalSourceList = (fusion ? fusion.sourceComparison : [])
    .filter((s) => s.dataType === 'FORECAST')
    .slice(0, 4)
    .map((s) => ({ name: s.source, availability: s.status }));

  const seasonalHorizons: EarlyWarningHorizon[] = seasonalDescriptors.map((descriptor) => {
    const windows = descriptor.offsets.map((offset) => {
      const absoluteMonth = now.getMonth() + offset;
      const monthIndex = ((absoluteMonth % 12) + 12) % 12;
      const year = now.getFullYear() + Math.floor(absoluteMonth / 12);
      const normal = climatology?.monthlyNormals.find((m) => m.monthIndex === monthIndex) ?? null;
      return { monthIndex, year, label: `${monthLabelFromIndex(monthIndex)} ${year}`, normal };
    });

    const windowLabel = `${windows[0].label} – ${windows[windows.length - 1].label}`;

    const withNormals = windows.filter(
      (w): w is { monthIndex: number; year: number; label: string; normal: MonthlyClimatologicalNormal } =>
        w.normal !== null && w.normal.normalMaxTempC !== null
    );
    const peak =
      withNormals.length > 0
        ? withNormals.reduce((best, w) =>
            (w.normal.normalMaxTempC as number) > (best.normal.normalMaxTempC as number) ? w : best
          )
        : null;

    const peakNormalC = peak ? peak.normal.normalMaxTempC : null;
    const climatologyAvailable = climatology?.available === true && peakNormalC !== null;
    const heatProne = climatologyAvailable && (peakNormalC as number) >= HEATWAVE_THRESHOLD_C;
    const margin = climatologyAvailable ? round1((peakNormalC as number) - HEATWAVE_THRESHOLD_C) : null;

    const seasonalConfidencePct =
      !climatologyAvailable || margin === null
        ? 0
        : heatProne
        ? clamp(Math.round(45 + Math.min(margin, 6) * 5), 45, 75)
        : clamp(Math.round(50 + Math.min(-margin, 8) * 3), 45, 78);

    const heatProneInWindow = withNormals
      .filter((w) => (w.normal.normalMaxTempC as number) >= HEATWAVE_THRESHOLD_C)
      .map((w) => `${w.normal.monthLabel} ${w.year}`);

    const basis: EvidenceBasis = climatologyAvailable ? 'CLIMATOLOGICAL' : 'UNAVAILABLE';

    return {
      id: descriptor.id,
      timeRangeLabel: descriptor.label,
      timeRangeTitle: `${descriptor.title}${climatologyAvailable ? ' (20-Year Climatology)' : ' (Unavailable)'}`,
      targetWindow: windowLabel,
      isHeatwaveComing: heatProne,
      heatwaveStatus: heatProne ? 'LIKELY' : 'NO_HEATWAVE',
      verdict: heatProne ? 'HEATWAVE IS COMING' : 'NO HEATWAVE COMING',
      statusHeadline: !climatologyAvailable
        ? 'No verified 20-year climatology is available for this location — reported as NOT AVAILABLE.'
        : heatProne
        ? `Climatological warm season detected: the 20-year normal daily maximum reaches ${peakNormalC}°C in ${peak!.label}.`
        : `The 20-year normal daily maximum for this window peaks at ${peakNormalC}°C in ${peak!.label} — below the ${HEATWAVE_THRESHOLD_C}°C heatwave threshold.`,
      unifiedConfidencePct: seasonalConfidencePct,
      consensusConfidencePct: seasonalConfidencePct,
      expectedOnsetDates: !climatologyAvailable
        ? 'Long-lead guidance unavailable for this location'
        : heatProne
        ? `${peak!.label} (climatological peak)`
        : 'No heatwave threshold in the 20-year record for this window',
      expectedDuration: !climatologyAvailable
        ? '0 Days (no verified baseline)'
        : heatProne
        ? `Climatological heat season: ${heatProneInWindow.join(', ')}`
        : '0 Days (climatologically below threshold)',
      severityLevel: climatologyAvailable ? severityFromAdjustedMax(peakNormalC) : 'Low',
      models: buildSeasonalEvidence({
        targetNormals: withNormals.map((w) => w.normal),
        climatology: climatology ?? null,
        operationalSources: operationalSourceList,
        seasonalConfidencePct,
      }),
      climateDrivers: [
        ...buildClimateDrivers(),
        ...(climatologyAvailable ? [`20-year normal peak ${peakNormalC}°C in ${peak!.label}`] : []),
      ],
      citizenGuidance: buildGuidance(heatProne, basis, windowLabel, peakNormalC),
      evidenceBasis: basis,
      confidenceBasis: !climatologyAvailable
        ? 'No verified long-lead dataset returned data for this location, so confidence is 0% by definition.'
        : heatProne
        ? `Climatological confidence ${seasonalConfidencePct}% derived from how far the 20-year normal daily maximum (${peakNormalC}°C) exceeds the ${HEATWAVE_THRESHOLD_C}°C threshold (+${margin}°C). This is climatological risk, not a probabilistic forecast.`
        : `Climatological confidence ${seasonalConfidencePct}% derived from how far the 20-year normal daily maximum (${peakNormalC}°C) stays below the ${HEATWAVE_THRESHOLD_C}°C threshold (${margin}°C).`,
      liveForecastDays: 0,
      disclaimer: !climatologyAvailable
        ? 'Reported as NOT AVAILABLE rather than estimated. No value is invented for this horizon.'
        : `Climatological baseline only — operational heatwave forecast skill does not exist at this lead time. Values are the real ${climatology!.referencePeriod} monthly normals for this grid cell (${climatology!.spatialResolution}).`,
    };
  });

  const horizons: EarlyWarningHorizon[] = [operationalHorizon, ...seasonalHorizons];

  // ---------------------------------------------------------------------------
  // 6. Unified verdict — operational signal first, then real climatology
  // ---------------------------------------------------------------------------
  const nearestHeatProneSeasonalHorizon = seasonalHorizons.find((h) => h.isHeatwaveComing) ?? null;

  const isHeatwaveComing = operationalHorizon.isHeatwaveComing || nearestHeatProneSeasonalHorizon !== null;
  const verdict: 'HEATWAVE IS COMING' | 'NO HEATWAVE COMING' = isHeatwaveComing
    ? 'HEATWAVE IS COMING'
    : 'NO HEATWAVE COMING';

  const overallBasis: EvidenceBasis = operationalHorizon.isHeatwaveComing
    ? operationalHorizon.evidenceBasis
    : nearestHeatProneSeasonalHorizon
    ? 'CLIMATOLOGICAL'
    : operationalHorizon.evidenceBasis;

  const unifiedConfidencePct = operationalHorizon.isHeatwaveComing
    ? operationalHorizon.unifiedConfidencePct
    : nearestHeatProneSeasonalHorizon
    ? nearestHeatProneSeasonalHorizon.unifiedConfidencePct
    : operationalHorizon.unifiedConfidencePct;

  const nextArrivalWindow = operationalHorizon.isHeatwaveComing
    ? operationalHorizon.expectedOnsetDates
    : nearestHeatProneSeasonalHorizon
    ? `${nearestHeatProneSeasonalHorizon.targetWindow} (20-year climatological warm season)`
    : 'No heatwave threshold breach detected in verified data';

  const expectedDuration = operationalHorizon.isHeatwaveComing
    ? operationalHorizon.expectedDuration
    : nearestHeatProneSeasonalHorizon
    ? nearestHeatProneSeasonalHorizon.expectedDuration
    : '0 Days';

  const threatLevel: 'Extreme' | 'High' | 'Moderate' | 'Low' = operationalHorizon.isHeatwaveComing
    ? operationalHorizon.severityLevel
    : nearestHeatProneSeasonalHorizon
    ? nearestHeatProneSeasonalHorizon.severityLevel
    : 'Low';

  const overallConfidenceBasis = operationalHorizon.isHeatwaveComing
    ? operationalHorizon.confidenceBasis
    : nearestHeatProneSeasonalHorizon
    ? `No heatwave threshold breach in the live ${forecastDays}-day operational forecast. The nearest warm signal is climatological (${nearestHeatProneSeasonalHorizon.targetWindow}) from the real ${climatology?.referencePeriod ?? '20-year'} monthly normals. ${nearestHeatProneSeasonalHorizon.confidenceBasis}`
    : operationalHorizon.confidenceBasis;

  const overallDisclaimer = operationalHorizon.isHeatwaveComing
    ? operationalHorizon.disclaimer ?? ''
    : nearestHeatProneSeasonalHorizon
    ? 'Climatological outlook — not a day-specific forecast. Operational heatwave forecast skill does not extend to this lead time.'
    : operationalHorizon.disclaimer ?? '';

  // ---------------------------------------------------------------------------
  // 7. Real contributing models (no unavailable provider ever contributes a number)
  // ---------------------------------------------------------------------------
  const contributingModels: UnifiedHeatwaveVerdict['contributingModels'] = [];

  if (fusion && fusion.contributingModels.length > 0 && operationalConfidencePct !== null) {
    const weightPoolPct = overallBasis === 'CLIMATOLOGICAL' ? 0 : gefsLive ? 65 : 100;
    const totalRawWeight = fusion.contributingModels.reduce((sum, m) => sum + m.weight, 0) || 1;
    for (const m of fusion.contributingModels) {
      const weightPct = Math.round((m.weight / totalRawWeight) * weightPoolPct);
      contributingModels.push({
        name: m.source,
        confidence: operationalConfidencePct,
        weightPct,
        contributionScore: Math.round(operationalConfidencePct * weightPct) / 100,
        availability: m.status,
        dataType: 'FORECAST',
      });
    }
  }
  if (gefsLive && ensembleConfPct !== null) {
    const gefsWeight = overallBasis === 'CLIMATOLOGICAL' ? 0 : 35;
    contributingModels.push({
      name: 'NOAA GEFS',
      confidence: ensembleConfPct,
      weightPct: gefsWeight,
      contributionScore: Math.round(ensembleConfPct * gefsWeight) / 100,
      availability: 'LIVE',
      dataType: 'ENSEMBLE',
    });
  }

  if (climatology?.available) {
    const seasonalSummaryConfidence =
      nearestHeatProneSeasonalHorizon?.unifiedConfidencePct ?? seasonalHorizons[0]?.unifiedConfidencePct ?? 0;
    contributingModels.push({
      name: 'NASA POWER Climatology',
      confidence: seasonalSummaryConfidence,
      weightPct: overallBasis === 'CLIMATOLOGICAL' ? 100 : 0,
      contributionScore: overallBasis === 'CLIMATOLOGICAL' ? seasonalSummaryConfidence : 0,
      availability: climatology.status,
      dataType: 'REANALYSIS',
    });
  }

  const methodology =
    overallBasis === 'CLIMATOLOGICAL'
      ? `Long-lead horizon (beyond operational NWP skill): real 20-year monthly climatology from ${climatology?.source ?? 'NASA POWER'} (${climatology?.referencePeriod ?? 'reference period unavailable'}) for the requested grid cell. Operational cores carry no heatwave skill at this lead time and are not used. IMD official feed: NOT AVAILABLE (authorization required) — never substituted.`
      : `Skill-weighted multi-source fusion across ${fusion?.contributingModels.length ?? 0} independent NWP core(s) (ECMWF IFS 0.55 / NOAA GFS 0.45, Open-Meteo aggregator de-duplicated) blended with the NOAA GEFS ${gefs?.memberCount ?? 0}-member ensemble spread. ERA5 reanalysis and NASA POWER 20-year climatology supply the anomaly baseline. IMD official feed: NOT AVAILABLE (authorization required) — never substituted.`;

  const primaryGuidance = isHeatwaveComing
    ? overallBasis === 'CLIMATOLOGICAL'
      ? `The live ${forecastDays}-day outlook for ${locationName} shows no heatwave threshold breach. This location's climatological warm season centres on ${nextArrivalWindow}. Use that window for seasonal preparedness planning.`
      : `Operational forecast for ${locationName} projects a heatwave episode ${nextArrivalWindow} (${expectedDuration}). Activate heat-response measures before onset.`
    : `No verified heatwave signal for ${locationName} in ${forecastDays > 0 ? `the live ${forecastDays}-day forecast` : 'the available forecast window'} or in the 20-year climatological record.`;

  const unifiedVerdict: UnifiedHeatwaveVerdict = {
    isHeatwaveComing,
    verdict,
    unifiedConfidencePct,
    confidenceGrade:
      overallBasis === 'CLIMATOLOGICAL' ? 'Moderate' : gradeFromConfidence(unifiedConfidencePct),
    nextArrivalWindow,
    expectedDuration,
    threatLevel,
    methodology,
    evidenceBasis: overallBasis,
    confidenceBasis: overallConfidenceBasis,
    contributingModels,
    primaryGuidance,
    disclaimer: overallDisclaimer,
  };

  const dataBasis: LongRangeDataBasis = {
    operationalForecastSource:
      forecastDays > 0
        ? 'Open-Meteo operational 16-day daily product (ICON / ECMWF hybrid mesh)'
        : 'Unavailable — no verified operational forecast returned',
    operationalForecastDays: forecastDays,
    consensusSources,
    operationalAgreementPct: fusionAgreementPct,
    ensembleSpreadDegC: gefs?.spreadDegC ?? null,
    ensembleExceedancePct: gefs?.exceedancePct ?? null,
    ensembleAvailable: gefsLive,
    climatologyAvailable: climatology?.available === true,
    climatologySource: climatology?.source ?? 'NASA POWER Climatology',
    climatologyReferencePeriod: climatology?.referencePeriod ?? 'Unavailable',
    unavailableSources,
    lastUpdated: new Date().toISOString(),
  };

  const climatologySummary: LongRangeEarlyWarningReport['climatology'] = {
    available: climatology?.available === true,
    source: climatology?.source ?? 'NASA POWER Climatology',
    referencePeriod: climatology?.referencePeriod ?? 'Unavailable',
    monthlyNormals: (climatology?.monthlyNormals ?? []).map((m) => ({
      monthKey: m.monthKey,
      monthLabel: m.monthLabel,
      normalMaxTempC: m.normalMaxTempC,
      normalRhPct: m.normalRhPct,
    })),
    annualPeakMonth: climatology?.annualPeakMonth ?? null,
    annualPeakNormalMaxC: climatology?.annualPeakNormalMaxC ?? null,
    heatProneMonthLabels: (climatology?.heatProneMonthKeys ?? []).map((key) => {
      const match = climatology?.monthlyNormals.find((m) => m.monthKey === key);
      return match ? match.monthLabel : key;
    }),
  };

  const modelsCompared = [
    'Open-Meteo operational 16-day daily forecast (ICON / ECMWF hybrid mesh)',
    'ECMWF IFS 0.25° global dynamic core',
    'NOAA GFS 0.25° operational NWP',
    'NOAA GEFS 31-member global ensemble',
    'Copernicus ERA5 reanalysis (WMO 1991–2020 baseline)',
    'NASA POWER / MERRA-2 20-year monthly climatology',
  ];

  const overallConsensusStatus =
    fusion && fusion.contributingModels.length > 0
      ? `${fusion.contributingModels.length} NWP core(s) in real consensus (spread ${fusion.agreementMatrix.spreadTempDegC}°C, ${fusion.agreementMatrix.agreementLevel}); ${gefsLive ? `NOAA GEFS ${gefs?.memberCount ?? 0} members (σ ${gefs?.spreadDegC}°C)` : 'NOAA GEFS unavailable'}; ${climatology?.available ? `20-year climatology ${climatology.referencePeriod}` : 'climatology unavailable'}`
      : 'No verified operational consensus available for this location.';

  return {
    generatedAt: new Date().toISOString(),
    location: locationName,
    coordinates: { lat, lng },
    unifiedVerdict,
    overallNextHeatwaveArrival: isHeatwaveComing ? nextArrivalWindow : 'No heatwave signal in verified data',
    overallThreatLevel: threatLevel,
    overallConsensusStatus,
    modelsCompared,
    horizons,
    dataBasis,
    climatology: climatologySummary,
  };
}
