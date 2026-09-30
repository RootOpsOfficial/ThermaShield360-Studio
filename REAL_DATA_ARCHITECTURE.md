# ThermaShield 360 — Real-Data Architecture

> **Product principle:** Predict the Heat → Understand the Impact → Protect People → Verify the Outcome

This document describes the verified real-data pipeline, provider contracts, data semantics,
location architecture, thermal calculations and provenance rules.

---

## 1. Pipeline

```
REAL PROVIDERS → INGESTION → NORMALIZATION → VALIDATION → PROVENANCE LEDGER
      → MULTI-SOURCE FUSION → THERMAL ENGINE → HUMAN HEAT IMPACT
      → HYPERLOCAL GIS → ROLE DASHBOARDS → VERIFIED / NULL / UNAVAILABLE
```

One shared intelligence engine. Five role experiences (Citizen, Worker, Healthcare,
Municipal, Disaster Management) consume the same canonical intelligence.

---

## 2. Provider Registry (verified 2026-09-30)

| Provider | Status | Role | Data type | Auth |
|---|---|---|---|---|
| Open-Meteo | **LIVE** | Current + 16-day hourly/daily forecast | OBSERVED / FORECAST | None |
| ECMWF IFS | **LIVE** | Medium-range NWP (0.25° open data) | FORECAST | None |
| NOAA GFS | **LIVE** | Operational NWP (0.25°) | FORECAST | None |
| NOAA GEFS | **LIVE** | 31-member ensemble / spread | ENSEMBLE | None |
| Copernicus ERA5 | **LIVE** | Historical reanalysis / climate baseline | REANALYSIS | CDS key |
| **NASA FIRMS** | **LIVE** | VIIRS 375m active-fire / thermal anomaly | OBSERVED (satellite) | MAP_KEY |
| **OpenAQ v3** | **LIVE** | Verified AQ stations (PM2.5/PM10/O3/NO2/SO2/CO) | OBSERVED | X-API-Key |
| Google Maps | **LIVE** | GIS / geocoding / routes | GIS_INFRASTRUCTURE | API key |
| NOAA NCEI | NOT_AVAILABLE* | Historical GHCN-Daily observations | HISTORICAL | CDO token |
| NASA POWER | DEGRADED | Satellite/reanalysis met + radiation | HISTORICAL / REANALYSIS | None |
| IMD | NOT_AVAILABLE** | Official India warnings/observations | OFFICIAL | Restricted |

\* NCEI: credentials valid and endpoint reachable; the nearest GHCN-Daily station is resolved
dynamically, but most Indian GHCN stations contain no observations inside the recent query
window. Reported honestly as NOT_AVAILABLE rather than fabricating climatology.

\*\* IMD: the Mausam portal is reachable (HTTP 200) but the programmatic station/bulletin API
requires authorization not available in this environment. Never fabricated.

Data.gov.in: **NOT CONFIGURED** (API key required). Integration architecture is ready.

---

## 3. Data Semantics Rules

Every value carries an explicit data type. These are **never collapsed into "live"**:

| Category | Meaning | Example |
|---|---|---|
| `OBSERVED` | Measured at a station/sensor | OpenAQ PM2.5, FIRMS fire pixel |
| `FORECAST` | Model prediction for a future valid time | ECMWF/GFS 2 m temperature |
| `ENSEMBLE` | Probabilistic / spread | GEFS member spread |
| `REANALYSIS` / `HISTORICAL` | Archived model/past observation | ERA5, NCEI GHCN |
| `CALCULATED` / `DERIVED` | Computed by ThermaShield | WBGT, UTCI, heat index, PM2.5-AQI |
| `MODELLED` | Health/impact projection | Hospitalisation risk |
| `ESTIMATED` | Approximate/curated input | Ward vulnerability |
| `CURATED` | Configured inventory | Protection assets |
| `NOT_AVAILABLE` | Provider returned nothing | IMD, unavailable NCEI |

**FIRMS note:** satellite active-fire detections are *never* interpreted as air temperature
and are never used as a thermal-stress input.

---

## 4. Location Architecture

A single requested `(lat, lng)` governs the entire pipeline:

- `parseCoords()` in `server.ts` **never** defaults to a location. Missing/invalid coordinates
  produce `HTTP 400` or a controlled error — never a silent city substitution.
- `provenanceLedger` and `providerHealthService` caches are **location-keyed**
  (`lat.toFixed(4):lng.toFixed(4)`), so switching location always invalidates.
- `weatherService` cache key is `${lat.toFixed(2)},${lng.toFixed(2)}`.
- `CitizenContext` auto-detects GPS on load; if denied it does **not** load a default city —
  the user selects a location.
- **All provider client functions require explicit `lat`/`lng`** — no default parameters exist.

Verified transitions: Pune → Mumbai → Delhi → London → Dubai, all producing distinct,
location-correct data (e.g. London ≈16 °C vs Dubai ≈29 °C).

---

## 5. Thermal Engine

Inputs are *always* normalised + validated observations or forecasts. If a required input is
missing the output is **NULL** — no synthetic defaults.

| Index | Method | Required inputs |
|---|---|---|
| Heat Index | Rothfusz / NOAA regression (with low-RH adjustment) | T, RH |
| Wet-bulb | Stull empirical | T, RH |
| Globe temp | Irradiance/wind approximation | T, solar, wind |
| **WBGT (outdoor)** | `0.7·Tw + 0.2·Tg + 0.1·Ta` — **CALCULATED** estimate | T, RH, solar, wind |
| **UTCI** | Polynomial approximation — **CALCULATED** | T, wind, RH, radiation |

WBGT and UTCI are **CALCULATED** values derived from ThermaShield inputs, not provider-published
measurements. When required inputs are unavailable the value is returned as `NULL`.

---

## 6. Fusion & Confidence

`fuseMultiSourceRecords()`:

1. Quarantines `DEMO` / `SIMULATED_REPLAY` records when `DATA_MODE=live`.
2. Applies skill weights: ECMWF IFS 0.55, NOAA GFS 0.45, Open-Meteo 1.0 (aggregator).
3. **De-duplicates** the Open-Meteo aggregator when dedicated ECMWF/GFS cores are live
   (prevents double-counting ECMWF data).
4. Treats reanalysis (ERA5) as the **climatological baseline**, not a forecast vote.
5. Treats in-situ observations as **ground truth** (bias reference), not a forecast vote.

Outputs:
- `agreementMatrix` — spread, σ, mean, median, agreement level, **confidence score**
- `contributingModels` — the weighted consensus members
- **`sourceComparison`** — *every* source that returned data, side-by-side, with
  `Δ vs fused`, `inConsensus` flag, run/valid time and status. This satisfies the
  four-or-more-source comparison requirement without compromising consensus science.

Confidence derives from spread + source count (documented in code) — **not** a fabricated
percentage. Fewer available sources lower both coverage and confidence; disagreement lowers it.

---

## 7. Provenance Contract (25 fields)

`source · provider · dataset · model · variable · value · unit · dataType · run ·
issuedAt · validTime · forecastLead · latitude · longitude · sourceLatitude ·
sourceLongitude · spatialMethod · spatialDistanceKm · resolution · retrievedAt ·
availability · validationStatus · qualityStatus · errorCode · recordId`

Unavailable sources are recorded with strict `NULL` values and an explicit status
(`NOT_AVAILABLE`, `AUTH_ERROR`, `RATE_LIMITED`, `TIMEOUT`, `INVALID_RESPONSE`).

---

## 8. Validation Engine (7-point audit)

1. Schema completeness 2. Geographic bounds 3. Physical plausibility 4. Timestamp freshness
5. Unit consistency 6. Cross-field consistency 7. Source integrity

Statuses: `VERIFIED · PARTIAL · STALE · FAILED · NOT_AVAILABLE`.

---

## 9. Modelled / Estimated Outputs (must remain labelled)

| Output | Label |
|---|---|
| Hospitalisation / mortality projection | MODELLED |
| Heat-health risk | MODELLED |
| Population vulnerability | ESTIMATED |
| Ward UHI offset | ESTIMATED / CALIBRATED |
| Protection assets & capacity | CURATED |
| Protection deficit | DERIVED |
| PM2.5-derived AQI | DERIVED |
| Weather fallback (all sources down) | MODELLED — LIVE SOURCE UNAVAILABLE |

---

## 10. Failure Handling

- One provider failing never breaks the pipeline — remaining valid sources continue.
- All providers failing → fused values become `NULL` and confidence `0%`; the UI shows
  `MODELLED — LIVE SOURCE UNAVAILABLE`, never fabricated live weather.
- Missing coordinates → `HTTP 400`, never a silent city substitution.
- FIRMS "0 hotspots" is a legitimate observation (no fire in window) → `LIVE`, not a failure.

---

## 11. Verification

```bash
npm run lint            # TypeScript: 0 errors
npm run build           # Vite production build
npm run test:pipeline   # 14 provider / validation / recovery tests
npm run test:locations  # 5-city isolation, cache A→B→A, resilience
```

All suites pass against live providers.

