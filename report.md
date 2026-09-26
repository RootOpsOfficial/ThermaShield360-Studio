# ThermaShield 360 — Citizen & Municipal Real-Data Integration Audit

---

## 1. Executive Summary

**ThermaShield 360** is an Extreme Heatwave Early Warning and Human Thermal Stress Intelligence Platform with two implemented workspaces:
1. **General Citizen Workspace** (`workspace === 'citizen'`): Microclimate heat risk, 16-day forecasts, thermal indices (WBGT, UTCI, Heat Index), safe pedestrian navigation, nearby healthcare, and adaptive protective guidance.
2. **Municipal Corporation Workspace** (`workspace === 'municipal'`): Command center, ward GIS risk maps, protection deficit analyses, operational intervention queues, Heat Action Plan (HAP) stage verification, and emergency broadcast dispatching.

### System Architecture State
* **Frontend**: React 19 SPA running on Vite + Tailwind CSS v4, Lucide icons, Leaflet vector layers, and SVG geometric GIS projections.
* **Backend Layer**: Node.js/Express (`server.ts`) acting as an API gateway, calculation engine, and proxy.
* **Real External APIs Currently Implemented**:
  * **Open-Meteo Weather API** (`api.open-meteo.com`): Live temperature, humidity, wind, solar radiation, apparent temperature, and 16-day daily forecast in `src/server/weatherService.ts`.
  * **OpenStreetMap Overpass API** (`overpass-api.de`): Live geospatial queries for hospitals, clinics, and doctors within a radius in `src/server/healthcareService.ts`.
  * **OSRM Public Routing API** (`router.project-osrm.org`): Turn-by-turn geometry for driving/walking routes in `src/server/routingEngine.ts`.
* **Primary Deficits Identified**:
  * Municipal data (demographics, vulnerable counts, cooling shelter capacities, ward boundaries) is hardcoded to static mock arrays in `src/server/municipalData.ts` and `src/server/geoData.ts`.
  * Google Maps Platform services are not yet integrated despite 34 APIs enabled on the account.
  * Environmental variables (Tree canopy density, land-surface temperature, building density) use static empirical approximations rather than satellite/GIS datasets.
  * Thermal-safe routing uses synthetic multi-route offset perturbations rather than genuine multi-criteria cost optimization over shaded segments.
  * Multi-model seasonal climate outlooks (8–12 month horizons) in `src/server/longRangeEarlyWarning.ts` use hardcoded synthetic predictions labeled as ECMWF/IMD/NOAA.

---

## 2. Current Application Architecture

```
[Browser / React 19 Client SPA]
   │
   ├── TopHeader.tsx (Role selector: General Citizen <-> Municipal Command)
   ├── Citizen Workspace (CitizenSidebar.tsx -> 12 Pages: Home, Risk, Forecast, Thermal, GIS Map, etc.)
   └── Municipal Workspace (MunicipalSidebar.tsx -> 6 Pages: Command Center, Ward Map, Protection Gap, etc.)
         │
         ▼  (Internal API calls /api/*)
[Express Server Gateway: server.ts]
   │
   ├── /api/weather/* ─────────► Open-Meteo API (Live fetch with in-memory fallback)
   ├── /api/thermal/* ─────────► thermalEngine.ts (Stull Tw, Fiala UTCI, NOAA HI, Outdoor WBGT)
   ├── /api/risk/* ────────────► geoData.ts + thermalEngine.ts (UHI offsets, vulnerability weights)
   ├── /api/routes ────────────► routingEngine.ts ──► OSRM Routing API (router.project-osrm.org)
   ├── /api/healthcare/* ──────► healthcareService.ts ──► OSM Overpass API (overpass-api.de)
   ├── /api/protection/* ──────► geoData.ts (Hardcoded 18 protection points)
   ├── /api/alerts/* ──────────► intelligenceEngine.ts (Algorithmic rule triggers)
   └── /api/municipal/* ───────► municipalData.ts (Hardcoded PMC wards, actions, alerts, resources)
```

---

## 3. Citizen UI Data Audit

| Page Component | Route / Endpoint | UI Elements Displayed | Current Code Location | Current Source Status |
| :--- | :--- | :--- | :--- | :--- |
| `CitizenHomePage.tsx` | `/api/citizen/my-risk`, `/api/weather/current` | Current Temp, Feels Like, Humidity, Wind, WBGT, UTCI, Heat Index, Primary Alert Banner, 5-Day Outlook | `src/pages/CitizenHomePage.tsx` | Real Weather (Open-Meteo) + Local Thermal Equations |
| `MyHeatRiskPage.tsx` | `/api/citizen/my-risk` | Composite Risk Score (0–100), Thermal Stress Level, Vulnerability Profile Multipliers, Contributing Factors Breakdown | `src/pages/MyHeatRiskPage.tsx` | Calculated from Weather + Static Ward Vulnerability Index (`geoData.ts`) |
| `EarlyWarningHeatwavePage.tsx` | `/api/risk/long-range-warning` | 8–12 Month, 5–8 Month, 1–3 Month, 7–15 Day Outlook Cards, IMD/ECMWF/NOAA Ensemble Confidence | `src/pages/EarlyWarningHeatwavePage.tsx`, `src/server/longRangeEarlyWarning.ts` | **STATIC MOCK DATA** (`generateLongRangeEarlyWarning`) |
| `HeatwaveForecastPage.tsx` | `/api/weather/forecast`, `/api/heatwave/status` | 16-Day Forecast Strip, IMD Heatwave Classification (Normal, Heatwave, Severe Heatwave), Peak Heat Hours | `src/pages/HeatwaveForecastPage.tsx` | Real Open-Meteo 16-day daily forecast + Local threshold calculations |
| `ThermalStressPage.tsx` | `/api/thermal/current`, `/api/thermal/forecast` | Current & Hourly WBGT (°C), UTCI (°C), NOAA Heat Index (°C), Diurnal Cycle Graph, Biological Threshold Bars | `src/pages/ThermalStressPage.tsx` | Real Open-Meteo hourly inputs processed through `src/server/thermalEngine.ts` |
| `HeatRiskMapPage.tsx` | `/api/citizen/local-risk-map` | Leaflet Map, Ward Polygon Overlays, Heat Risk Color Gradients, Cooling Centers, Drinking Water Points | `src/components/LocalHeatRiskMap.tsx`, `src/components/InteractiveGisMap.tsx` | Hybrid: Real Map Tiles (OSM) + Hardcoded Ward Bounds & POIs (`geoData.ts`) |
| `ProtectionPage.tsx` | `/api/protection/nearby`, `/api/protection/summary` | Cooling Sanctuary Cards, Water Kiosks, Distance (km), Capacity, Operating Hours, Verified Status | `src/pages/ProtectionPage.tsx` | **STATIC MOCK DATA** (18 hardcoded locations in `src/server/geoData.ts`) |
| `SafeRoutePage.tsx` | `/api/routes` | Origin/Destination inputs, Fastest vs Safe-and-Fast vs Thermal-Safe routes, Exposure Index, Shade Coverage % | `src/pages/SafeRoutePage.tsx`, `src/server/routingEngine.ts` | Hybrid: Real OSRM baseline geometry + Synthetic thermal-perturbed alternative lines |
| `NearbyHealthcarePage.tsx`| `/api/healthcare/nearby`, `/api/healthcare/:id` | Hospital Name, Distance, Emergency Heat Beds, ICU Available, Heat Triage Status, Directions | `src/pages/NearbyHealthcarePage.tsx`, `src/server/healthcareService.ts` | Hybrid: Real OSM hospital names/coordinates + Mocked bed capacities & heat triage status |
| `AdaptiveResponsePage.tsx`| `/api/adaptive-response` | Prioritized Actions (Immediate/Important/Advisory), What/Where/When/Why format, Category Pills | `src/pages/AdaptiveResponsePage.tsx`, `src/server/intelligenceEngine.ts` | Algorithmic: Dynamic rules based on real WBGT/UTCI + Hardcoded ward area strings |
| `AlertsPage.tsx` | `/api/alerts`, `/api/alerts/history` | Active Heat Warnings, Severity Badges, Trigger Thresholds, Historical Heat Event Archive | `src/pages/AlertsPage.tsx`, `src/server/intelligenceEngine.ts` | Hybrid: Live threshold alerts from current weather + Static historical log array |
| `SettingsPage.tsx` | Local State (`useCitizen`) | Vulnerability Profile (Age, Outdoor Worker, Chronic Illness), Alert Sound, Units (°C/°F) | `src/pages/SettingsPage.tsx` | Client Local Storage / React Context |

---

## 4. Municipal UI Data Audit

| Page Component | Route / Endpoint | UI Elements Displayed | Current Code Location | Current Source Status |
| :--- | :--- | :--- | :--- | :--- |
| `MunicipalCommandCenterPage.tsx` | `/api/municipal/summary` | Heat Risk Score, High-Risk Wards Count, Total Protection Gap, Priority Ward, 5-Day Strip, Active Broadcast | `src/pages/municipal/MunicipalCommandCenterPage.tsx` | **STATIC MOCK DATA** (`getMunicipalSummary` in `src/server/municipalData.ts`) |
| `WardRiskMapPage.tsx` | `/api/municipal/wards` | SVG City Ward GIS Layer, Risk Badges, Side Panel (WBGT, Vulnerability, Protection Gap, Mandate), Full Detail Modal | `src/pages/municipal/WardRiskMapPage.tsx`, `src/components/PuneWardMap.tsx` | **STATIC MOCK DATA** (`getMunicipalWards` with 7 hardcoded Pune wards) |
| `ProtectionGapPage.tsx` | `/api/municipal/summary`, `/api/municipal/resources` | Highest Deficit Ward, Active Sanctuaries (24), Water Kiosks (142), Adequacy % (46%), Resource Directory, What-If Simulator | `src/pages/municipal/ProtectionGapPage.tsx` | **STATIC MOCK DATA** (Inventory counts and deficit math derived from mock arrays) |
| `RecommendedActionsPage.tsx`| `/api/municipal/actions`, `/api/municipal/actions/:id/status`| Operational Queue Items, Action Status Buttons, Heat Action Plan (HAP) Stage Checklist, Budget Optimizer Slider | `src/pages/municipal/RecommendedActionsPage.tsx` | **STATIC MOCK DATA** (In-memory `actionsStore` array in `src/server/municipalData.ts`) |
| `MunicipalAlertsPage.tsx` | `/api/municipal/alerts` (GET/POST) | Dispatched Heatwave Warnings, Channel Delivery Status (Citizen, Field Teams, 108), Broadcast Modal Form | `src/pages/municipal/MunicipalAlertsPage.tsx` | **STATIC MOCK DATA** (In-memory `alertsStore` array in `src/server/municipalData.ts`) |
| `MunicipalSettingsPage.tsx` | Local / `/api/municipal/summary` | Corporation Title, Officer Name, Shift Hours, WBGT Trigger Threshold Slider, AWS Telemetry Checkboxes | `src/pages/municipal/MunicipalSettingsPage.tsx` | Client Local State (No persistent backend storage) |

---

## 5. Demo / Static Data Inventory

The following elements in the codebase contain hardcoded, synthetic, or mock data that must be replaced or connected to genuine authoritative sources:

| # | File / Component | Code Line / Element | Nature of Demo Data | Real Authoritative Replacement Source | Replacement Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `src/server/geoData.ts` | Lines 35–140 (`PUNE_WARDS`) | Hardcoded populations, vulnerable counts, tree canopy % (11–44%), built density % (56–89%), UHI offsets (0.9–3.2°C). | Municipal GIS boundaries (GeoJSON), Census of India / Pune Municipal Corporation Ward Factsheets, ESA WorldCover 10m Tree Canopy. | **HIGH** |
| 2 | `src/server/geoData.ts` | Lines 220–290 (`PROTECTION_POINTS`) | 18 hardcoded static points (e.g. "Sambhaji Chhatrapati Garden Water Kiosk"). | PMC Disaster Management Heat Action Plan Shelters Directory, Google Places API (New) searching civic parks, transit shelters, public fountains. | **HIGH** |
| 3 | `src/server/geoData.ts` | Lines 320–360 (`HEALTHCARE_FACILITIES`) | Fallback static hospital array with mock bed counts and heat triage readiness. | OpenStreetMap Overpass API + State Health Department / PM-JAY Registry + Google Places API. | **MEDIUM** |
| 4 | `src/server/longRangeEarlyWarning.ts`| Lines 19–260 (`generateLongRangeEarlyWarning`) | Hardcoded prediction strings and synthetic confidence numbers claiming to be ECMWF, IMD, NOAA CFSv2. | ECMWF Open Data / Copernicus Climate Data Store (CDS) seasonal forecasts API + IMD Long Range Forecast Bulletins. | **MEDIUM** |
| 5 | `src/server/municipalData.ts`| Lines 11–202 (`getMunicipalWards`) | Hardcoded WBGT (31.8°C), temps (39.2°C), demand (5,800), capacity (1,420), protection gaps (4,380). | Dynamic computation: Spatial intersection of real grid-level weather + actual ward population density + actual verified civic shelter capacity. | **HIGH** |
| 6 | `src/server/municipalData.ts`| Lines 248–289 (`actionsStore`) | 4 hardcoded operational queue items. | Backend relational database table (`municipal_action_queue`) updated by ward officers or triggered automatically by thermal engine rules. | **HIGH** |
| 7 | `src/server/municipalData.ts`| Lines 304–339 (`getProtectionResources`) | 4 static aggregate cards ("24 cooling sanctuaries, 142 water kiosks"). | Real database count aggregated from verified municipal infrastructure table (`civic_protection_assets`). | **HIGH** |
| 8 | `src/server/municipalData.ts`| Lines 341–373 (`alertsStore`) | 3 static pre-written municipal warning items. | Real database table (`municipal_alerts_broadcast`) integrated with notification dispatch engines. | **HIGH** |
| 9 | `src/server/healthcareService.ts` | Lines 120–165 (`enrichFacilityWithHeatCapabilities`) | Mock heat stroke beds (3–14), available beds, and heat triage readiness algorithmically assigned via random-seeded hash. | **Explicit disclaimer required**: Real clinical bed telemetry cannot be queried via public API without an integrated Hospital Management Information System (HMIS). | **MEDIUM** |
| 10| `src/server/routingEngine.ts` | Lines 67–82, 450–520 (`generateCurvedPath`) | Synthetic curved offset coordinates generated when computing "Thermal Safe Route" alternatives. | True multi-route evaluation using Google Routes API alternatives or OSRM route options scored against raster canopy shade / surface heat layers. | **HIGH** |

---

## 6. Master Data Dependency Matrix

| ID | Role | Screen / View | UI Element | Current Source | Static? | Required Real Data | Data Type | Provider / API | Endpoint / Service | Parameters Required | Refresh Freq | Real-Time / Derived | Local Calc? | Backend Req? | DB Req? | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **D-01** | Citizen | Home | Ambient Temp | Open-Meteo | No | Air temperature (2m) | Float (°C) | Open-Meteo / Google Weather | `/v1/forecast` or Google Weather API | `latitude, longitude` | 15 mins | Real-Time | No | Yes | Optional | **P1** |
| **D-02** | Citizen | Home | Humidity | Open-Meteo | No | Relative humidity (2m) | Int (%) | Open-Meteo / Google Weather | `/v1/forecast` | `latitude, longitude` | 15 mins | Real-Time | No | Yes | Optional | **P1** |
| **D-03** | Citizen | Home | Solar Irradiance | Open-Meteo | No | Direct Normal Irradiance | Int (W/m²) | Open-Meteo | `/v1/forecast?current=direct_normal_irradiance` | `latitude, longitude` | 15 mins | Real-Time | No | Yes | Optional | **P1** |
| **D-04** | Citizen | Home | Wind Speed/Dir | Open-Meteo | No | 10m Wind Speed & Azimuth | Float, Int | Open-Meteo / Google Weather | `/v1/forecast` | `latitude, longitude` | 15 mins | Real-Time | No | Yes | Optional | **P1** |
| **D-05** | Citizen | Thermal | Wet Bulb Globe Temp | `thermalEngine.ts` | No (Derived) | WBGT Index | Float (°C) | Derived (Stull formula + Globe delta) | Internal Engine | `temp, rh, wind, solar` | 15 mins | Derived | **Yes** | Yes | Optional | **P1** |
| **D-06** | Citizen | Thermal | UTCI Index | `thermalEngine.ts` | No (Derived) | Universal Thermal Climate Index | Float (°C) | Derived (Fiala multi-node polynomial) | Internal Engine | `temp, rh, wind, solar` | 15 mins | Derived | **Yes** | Yes | Optional | **P1** |
| **D-07** | Citizen | Thermal | NOAA Heat Index | `thermalEngine.ts` | No (Derived) | Apparent Temperature | Float (°C) | Derived (Rothfusz regression) | Internal Engine | `temp, rh` | 15 mins | Derived | **Yes** | Yes | Optional | **P1** |
| **D-08** | Citizen | Risk | Ward Microclimate Risk | `geoData.ts` + Weather | **Yes (Geo)** | UHI Offset + Tree Canopy Deficit | Float (°C, %) | Global Surface Temp (Landsat-8/Sentinel-2 LST) | Earth Engine / Open Urban Data | `ward_polygon` | Monthly / Seasonal | Stored / Derived | **Yes** | Yes | **Yes** | **P2** |
| **D-09** | Citizen | Forecast | 16-Day Daily Forecast | Open-Meteo | No | Tmax, Tmin, Apparent Tmax | Daily Array | Open-Meteo / Google Weather | `/v1/forecast?daily=...&forecast_days=16`| `latitude, longitude` | 1 hour | Forecast | No | Yes | Optional | **P1** |
| **D-10** | Citizen | Forecast | IMD Heatwave Classification | `thermalEngine.ts` | No (Derived) | IMD Heatwave Status | Categorical | Derived (IMD Normal vs Departure criteria) | Internal Engine | `Tmax, Climatological Normal` | 1 hour | Derived | **Yes** | Yes | **Yes** | **P1** |
| **D-11** | Citizen | Future | Long-Range Outlook | `longRangeEarlyWarning.ts` | **YES** | Multi-Month Thermal Anomalies | Forecast Grids | Copernicus CDS (SEAS5) / IMD Seasonal | CDS API / IMD Bulletin | `grid_box, lead_time_months` | Monthly | Forecast / Model | No | Yes | **Yes** | **P3** |
| **D-12** | Citizen | Map | Ward Polygons | `geoData.ts` | **YES** | Official Ward Boundaries | GeoJSON | PMC Open Data / Survey of India | GeoJSON Asset / PostGIS | Administrative boundary ID | Annual | Static GIS | No | Yes | **Yes** | **P1** |
| **D-13** | Citizen | Protection | Civic Cooling Sanctuaries | `geoData.ts` | **YES** | Public AC Shelters, Parks, Kiosks | GeoJSON / Records | PMC Heat Action Plan Directory / Google Places | Places API (New) / Database | `location, radius, includedTypes` | Daily | Stored / Live | No | Yes | **Yes** | **P1** |
| **D-14** | Citizen | Route | Road Geometry & Turns | OSRM Public API | No | Road coordinates & maneuvers | LineString / Steps | OSRM / Google Routes API | `computeRoutes` | `origin, destination, travelMode` | On demand | Real-Time | No | Yes | No | **P1** |
| **D-15** | Citizen | Route | Thermal-Safe Route | `routingEngine.ts` | **YES (Perturbed)**| Shade-Weighted Optimal Path | LineString / Polylines | Proprietary Cost Optimization over Canopy/Shade | Internal Routing Engine | `Routes alternatives, Canopy raster`| On demand | Derived | **Yes** | Yes | **Yes** | **P2** |
| **D-16** | Citizen | Healthcare | Hospitals & Clinics | OSM Overpass API | No | Verified Healthcare POIs | POI Array | OSM Overpass / Google Places | `overpass-api.de` or Places API | `lat, lon, radius` | Weekly cache | Real-Time / Stored | No | Yes | Optional | **P1** |
| **D-17** | Citizen | Healthcare | Heat Stroke ICU Beds | `healthcareService.ts` | **YES** | Operational Emergency Heat Beds | Integer | State HMIS API (Partnership Required) | No Public API | `facility_id` | Real-Time | Stored | No | Yes | **Yes** | **P4** |
| **D-18** | Citizen | Alerts | Citizen Heat Advisory | `intelligenceEngine.ts` | No (Derived) | Location-based warning triggers | Alert Object | Derived from real WBGT + IMD Status | Internal Engine | `current_wbgt, user_profile` | Real-Time | Derived | **Yes** | Yes | Optional | **P1** |
| **D-19** | Municipal | Command | Citywide Heat Risk KPI | `municipalData.ts` | **YES** | Composite Citywide Threat Level | Score & Category | Derived (Aggregated ward WBGT & population) | Internal Engine | `all_wards_metrics` | 30 mins | Derived | **Yes** | Yes | **Yes** | **P1** |
| **D-20** | Municipal | Command | High-Risk Wards Count | `municipalData.ts` | **YES** | Wards where WBGT > 29.5°C | Integer | Derived (Real-time count of active ward alerts) | Internal Engine | `ward_risk_scores` | 30 mins | Derived | **Yes** | Yes | **Yes** | **P1** |
| **D-21** | Municipal | Command | Protection Deficit Sum | `municipalData.ts` | **YES** | Total Unserved Exposed Citizens | Integer | Derived: `∑(Ward_Demand - Ward_Capacity)` | Internal Engine | `demographics, active_assets` | Hourly | Derived | **Yes** | Yes | **Yes** | **P2** |
| **D-22** | Municipal | Ward Map | Ward Demographics & Density | `geoData.ts` | **YES** | Total Pop, Senior/Labor Counts | Demographic Records | Census of India / Municipal Register | Database table `ward_demographics` | `ward_id` | Decennial / Annual | Stored | No | Yes | **Yes** | **P1** |
| **D-23** | Municipal | Actions | Operational Action Queue | `municipalData.ts` | **YES** | Dispatch directives with statuses | Record Array | Municipal Database + Algorithmic Triggers | Database table `action_queue` | `ward_id, shift_id` | Real-Time | Stored / Derived | **Yes** | Yes | **Yes** | **P1** |
| **D-24** | Municipal | Protection | Asset Inventory (Kiosks/AC) | `municipalData.ts` | **YES** | Verified active units & capacity | Inventory Records | Municipal Smart City IoT / Asset Register | Database table `civic_assets` | `department_id` | Daily | Stored / Live | No | Yes | **Yes** | **P1** |
| **D-25** | Municipal | Alerts | Emergency Broadcast Engine | `municipalData.ts` | **YES** | Broadcast history, recipients, delivery | Alert Logs | Backend Database + SMS/FCM Gateway | Twilio / Firebase Cloud Messaging | `target_ward, severity, message` | On dispatch | Stored | No | Yes | **Yes** | **P2** |

---

## 7. Google Maps Platform Audit

A comprehensive evaluation of the 34 enabled Google services on the project's paid account indicates that only a specific subset is required or recommended for ThermaShield 360:

```
+--------------------------------------------------------------------------------------------------+
|                                GOOGLE MAPS PLATFORM AUDIT MATRIX                                 |
+------------------------------+--------------------+----------------------------------------------+
| Service                      | Classification     | Technical Justification                     |
+------------------------------+--------------------+----------------------------------------------+
| Geocoding API                | REQUIRED NOW       | Convert user city/ward text searches to GPS. |
| Places API (New)             | REQUIRED NOW       | Locate real public parks, fountains, clinics.|
| Routes API                   | REQUIRED NOW       | Baseline turn-by-turn routes & alternatives. |
| Maps JavaScript API          | REQUIRED NOW       | Interactive mapping client & GeoJSON layers. |
| Air Quality API              | REQUIRED NOW       | Hourly ambient AQI, PM2.5, PM10, Ozone.      |
| Time Zone API                | REQUIRED NOW       | Accurate local solar noon and diurnal cycle. |
| Distance Matrix API          | USEFUL (PHASE 2)   | Matrix distance to cooling shelters.         |
| Solar API                    | USEFUL (PHASE 2)   | Rooftop solar potential & shade modeling.    |
| Elevation API                | USEFUL (PHASE 2)   | Topographic thermal lapse rate adjustment.   |
| Maps Static API              | USEFUL (PHASE 2)   | Pre-rendered route cards & push thumbnails.  |
| Weather API                  | EVALUATED          | Open-Meteo is superior for WBGT parameters.  |
| 23 Other Google APIs         | NOT REQUIRED       | SDKs, 3D, Aerial, Roads, Navigation Connect. |
+------------------------------+--------------------+----------------------------------------------+
```

### Detailed Evaluation of Key Google Services

#### 1. Geocoding API (`REQUIRED NOW`)
* **Role/Screen**: TopHeader Location Search, Ward Detail lookups, Safe Route Origin/Destination inputs.
* **Why Needed**: Resolves arbitrary Indian addresses, landmarks, chowks, and postal codes into precise `(lat, lng)` coordinates.
* **Execution Location**: **Server-Side Proxy Only** (`/api/geocode?q=...`). Exposing keys to the client without IP restrictions allows unauthorized quota drainage.
* **Expected Request Volume**: ~1,000–3,000 calls/month for a prototype; comfortably within free quotas.

#### 2. Places API (New) (`REQUIRED NOW`)
* **Role/Screen**: Citizen `ProtectionPage.tsx`, `NearbyHealthcarePage.tsx`.
* **Why Needed**: Discovers actual physical parks, shaded municipal gardens, transit hubs, community centers, and public water points in any Indian municipality where local government databases are unavailable.
* **Endpoint**: `https://places.googleapis.com/v1/places:searchNearby`
* **Parameters**: `locationRestriction.circle { center, radius }`, `includedTypes: ["park", "hospital", "transit_station", "community_center"]`.
* **Security & Caching**: Server-side proxy with a 24-hour Redis/in-memory cache per coordinate cluster to prevent repeated identical billing.

#### 3. Routes API (`REQUIRED NOW`)
* **Role/Screen**: Citizen `SafeRoutePage.tsx`.
* **Why Needed**: High-precision pedestrian and two-wheeler routing graph with real-world road geometry, avoiding closed alleys or restricted corridors.
* **Endpoint**: `https://routes.googleapis.com/directions/v2:computeRoutes`
* **Parameters**: `origin`, `destination`, `travelMode: "WALK"`, `computeAlternativeRoutes: true`, `extraComputations: ["TRAFFIC_ON_POLYLINE"]`.
* **Cost / Quota Optimization**: Cache route geometries based on hashed `[start, end, mode]` tuples for 30 minutes.

#### 4. Air Quality API (`REQUIRED NOW`)
* **Role/Screen**: Citizen `MyHeatRiskPage.tsx`, `ThermalStressPage.tsx`.
* **Why Needed**: Extreme heat combined with elevated particulate matter (PM2.5) or surface Ozone creates compounded cardiovascular and respiratory mortality risks.
* **Endpoint**: `https://airquality.googleapis.com/v1/currentConditions:lookup`
* **Parameters**: `location: { latitude, longitude }`, `extraComputations: ["DOMINANT_POLLUTANT_CONCENTRATION", "LOCAL_AQI"]`.
* **Execution Location**: Server-side proxy cached for 1 hour.

#### 5. Google Weather API Evaluation (`EVALUATED`)
* **Findings**: Google Maps Platform Weather API offers standard forecast variables (temperature, relative humidity, precipitation probability, weather icon).
* **Deficit for ThermaShield 360**: It **does not** natively supply direct solar radiation flux ($W/m^2$), dew point, or wet bulb temperature required to compute outdoor WBGT or Fiala UTCI equations.
* **Architectural Decision**: Retain **Open-Meteo Weather API** as the primary scientific meteorological engine because it provides solar irradiance, multi-level atmospheric pressure, and 16-day hourly curves free of licensing friction, while using Google Weather API strictly as an auxiliary fallback.

---

## 8. Weather API Audit

ThermaShield 360 requires specific scientific variables that standard commercial weather APIs frequently omit:

```
+------------------------------------------------------------------------------------+
|                         METEOROLOGICAL PARAMETER AUDIT                             |
+---------------------------+----------------+------------------+--------------------+
| Variable                  | Open-Meteo     | Google Weather   | IMD AWS Telemetry  |
+---------------------------+----------------+------------------+--------------------+
| Air Temperature (2m)      | YES (0.1°C)    | YES (1°C)        | YES (Station-level)|
| Relative Humidity         | YES (1%)       | YES (1%)         | YES (Station-level)|
| Direct Normal Irradiance  | YES (W/m²)     | NO               | NO (Manual pyrano) |
| Surface Pressure          | YES (hPa)      | YES (hPa)        | YES (Station-level)|
| 10m Wind Speed & Dir      | YES (km/h, °)  | YES (km/h, °)    | YES (Station-level)|
| Apparent Temperature      | YES (°C)       | YES (°C)         | NO (Derived)       |
| Hourly Horizon            | 168 hours      | 24–48 hours      | Variable           |
| Extended Daily Horizon    | 16 days        | 10 days          | 5–7 days           |
| Cost / Authentication     | Free / Open    | Paid Google Key  | Restricted API     |
+---------------------------+----------------+------------------+--------------------+
```

### Recommendation
* Primary operational pipeline: **Open-Meteo ECMWF/GFS Ensemble API**.
* Station-level ground truth: Ingest **IMD Automatic Weather Station (AWS)** daily bulletins for Indian capital cities to calibrate regional thermal offsets.

---

## 9. Air Quality Audit

High ambient temperatures accelerate photochemical reactions, spiking ground-level Ozone ($O_3$) and concentrating airborne particulate matter ($PM_{2.5}, PM_{10}$) during atmospheric stagnation events.

* **Recommended Service**: Google Air Quality API (`https://airquality.googleapis.com/v1/currentConditions:lookup`).
* **Required Parameters**:
  ```json
  {
    "location": { "latitude": 18.5204, "longitude": 73.8567 },
    "extraComputations": ["HEALTH_RECOMMENDATIONS", "DOMINANT_POLLUTANT_CONCENTRATION", "LOCAL_AQI"]
  }
  ```
* **Expected Output Fields**: `universalAqi`, `indexes[0].category`, `pollutants[] { code: "pm25", concentration: { value, units } }`.
* **Integration Strategy**: Integrate via server-side endpoint `/api/environmental/air-quality` with a 60-minute in-memory cache keyed by rounded coordinate `(lat.toFixed(2), lng.toFixed(2))`.

---

## 10. Thermal Stress Data Requirements

ThermaShield 360 models three distinct physiological thermal indices. None should be mocked or hardcoded:

```
[Meteorological Inputs: Temp (T), Humidity (RH), Wind (V), Solar (S)]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 [Wet Bulb Temp (Tw)] [Globe Temp (Tg)] [Vapor Pressure (vp)]
       │                   │                   │
       └─────────┬─────────┘                   │
                 ▼                             ▼
        [Outdoor WBGT (°C)]              [UTCI (°C)]
  0.7*Tw + 0.2*Tg + 0.1*Ta             Fiala Multi-Node
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
           [Human Thermal Strain Classification]
           Normal (<26°C) | Moderate (26-29°C)
           High (29-32°C) | Extreme (>=32°C)
```

### Mathematical Formulation Implemented in `src/server/thermalEngine.ts`

1. **Wet-Bulb Temperature ($T_w$)**: Computed using Stull's empirical formula:
   $$T_w = T \cdot \text{atan}\left(0.151977 \sqrt{RH + 8.313659}\right) + \text{atan}(T + RH) - \text{atan}(RH - 1.676331) + 0.00391838 \cdot RH^{1.5} \cdot \text{atan}(0.023101 \cdot RH) - 4.686035$$
2. **Black Globe Temperature ($T_g$)**: Approximated from direct solar irradiance ($S$ in $W/m^2$) and wind speed ($v$ in $m/s$):
   $$T_g = T + \frac{S \cdot 0.015}{1 + 0.08 \cdot \max(0.5, v)}$$
3. **Outdoor Wet Bulb Globe Temperature (WBGT)**:
   $$\text{WBGT} = 0.7 \cdot T_w + 0.2 \cdot T_g + 0.1 \cdot T$$
4. **Universal Thermal Climate Index (UTCI)**: Modeled via simplified 6th-order polynomial approximation evaluating physiological energy budgets across human skin, clothing, and perspiration.

### Execution Requirement
**100% Calculated Server-Side**: Because raw weather APIs do not return outdoor WBGT or UTCI, the server engine must compute these on the fly using live temperature, humidity, wind, and solar irradiance.

---

## 11. Heatwave Forecast Data Requirements

### India Meteorological Department (IMD) Regulatory Criteria
For Indian territories, heatwave definitions are strictly codified by the IMD and must govern all automated alerts:

1. **Plains Criteria**:
   * Heatwave declared when maximum temperature reaches $\ge 40.0^\circ\text{C}$.
   * **Normal Heatwave**: Departure from normal temperature is $+4.5^\circ\text{C}$ to $+6.4^\circ\text{C}$.
   * **Severe Heatwave**: Departure from normal temperature is $> +6.4^\circ\text{C}$, OR absolute temperature reaches $\ge 47.0^\circ\text{C}$.
2. **Coastal & Hill Regions**:
   * Coastal: Maximum temperature $\ge 37.0^\circ\text{C}$ with departure $\ge +4.5^\circ\text{C}$.
   * Hills: Maximum temperature $\ge 30.0^\circ\text{C}$ with departure $\ge +4.5^\circ\text{C}$.
3. **Warm Night Criteria**:
   * Maximum temperature $\ge 40.0^\circ\text{C}$ AND minimum night temperature departure $\ge +4.5^\circ\text{C}$.

### Data Requirement
* Daily climatological normal maximum temperature baseline for each target location (30-year normal dataset from IMD Pune/New Delhi).
* Ingested live 16-day daily forecast maximums compared against this normal to trigger official IMD Yellow, Orange, and Red alert stages.

---

## 12. GIS Requirements

```
+---------------------------------------------------------------------------------------------+
|                                    GIS PIPELINE ARCHITECTURE                                |
+---------------------------------------------------------------------------------------------+
| Vector Base Layer      | OpenStreetMap Vector Tiles / Google Maps Platform JS API           |
| Administrative Bounds  | GeoJSON MultiPolygons (PMC 15 Administrative Wards / Electoral Wards)|
| Microclimate Grids     | 250m x 250m Spatial Analysis Grid (PostGIS ST_Hexagon / ST_MakeGrid) |
| Raster Layers          | Landsat-8 Surface Temperature (LST) & Sentinel-2 NDVI Tree Cover   |
| Point Features         | Civic Cooling Centers, Water Kiosks, Hospitals (GeoJSON Points)    |
| Coordinate Reference   | EPSG:4326 (WGS 84 Lat/Lng) -> Web Mercator EPSG:3857               |
+---------------------------------------------------------------------------------------------+
```

### Real Implementation Requirement
* Replace synthetic coordinates in `src/components/PuneWardMap.tsx` and `src/components/LocalHeatRiskMap.tsx` with true administrative GeoJSON boundary files obtained from PMC Open Data or the Survey of India Open Data portal.
* Store geometries in a PostgreSQL/PostGIS database or serve as static GeoJSON assets through the Express backend.

---

## 13. Cooling Center Requirements

Real cooling sanctuaries and water distribution kiosks require authoritative facility data. The system cannot rely on general commercial POI queries alone:

### Required Schema & Fields

| Field Name | Data Type | Source Provider | Real-Time vs Static |
| :--- | :--- | :--- | :--- |
| `facility_id` | UUID / String | Municipal Database | Static |
| `name` | String | Municipal Asset Registry / Google Places | Static |
| `category` | Enum (`AC_SHELTER`, `WATER_KIOSK`, `SHADED_PARK`, `HOSPITAL`) | Municipal Database | Static |
| `latitude, longitude` | Float, Float | Municipal GIS / Google Geocoding | Static |
| `address` | String | Municipal GIS / Google Places | Static |
| `operating_hours` | String (e.g. `10:00-20:00`) | Municipal Department Order | Static / Seasonal |
| `verified_status` | Boolean | Field Officer Inspection Check | Dynamic |
| `daily_capacity_citizens` | Integer | Municipal Facility Specification | Static |
| `current_operational_status`| Enum (`ACTIVE`, `STANDBY`, `OFFLINE`) | Municipal Action Dispatch | Dynamic (Admin update) |
| `water_dispenser_available` | Boolean | Municipal Water Department | Static |
| `contact_phone` | String | Municipal Disaster Cell Directory | Static |

---

## 14. Cooling-Aware / Coolest Path Routing Algorithm

Standard routing engines (Google Directions, OSRM, GraphHopper) minimize travel time or Euclidean distance, routing pedestrians down unshaded asphalt corridors with extreme radiant heat loads.

### Algorithmic Architecture for Heat-Resilient Pedestrian Routing

```
[Origin / Destination Coordinates]
               │
               ▼
[Step 1: Compute Candidate Route Alternatives via Google Routes API or OSRM]
               │
               ├── Route A (Direct Arterial Highway - Fast, 0% Shade, High Solar)
               ├── Route B (Secondary Road - Moderate Distance, Partial Canopy)
               └── Route C (Park Greenway / Shaded Arcade - Longer, High Canopy)
               │
               ▼
[Step 2: Spatial Discretization of Routes into 50m Waypoint Segments]
               │
               ▼
[Step 3: Overlay Environmental Attributes per Segment]
               ├── Canopy Shade Factor: S_shade (0.0 to 0.8 from Tree Canopy Layer)
               ├── Surface Albedo / Material: M_surf (Asphalt = 1.0, Pavers = 0.7, Grass = 0.3)
               └── Local Thermal Stress: WBGT_segment = WBGT_ambient * (1 - 0.15 * S_shade)
               │
               ▼
[Step 4: Compute Objective Cost Function per Route]
```

### The Cost Function
$$\text{Cost}_{\text{Route}} = \sum_{i=1}^{N} \left( w_{\text{time}} \cdot \Delta t_i + w_{\text{thermal}} \cdot \Delta t_i \cdot \max\left(0, \text{WBGT}_i - \text{WBGT}_{\text{threshold}}\right) - w_{\text{protection}} \cdot P_i \right)$$

Where:
* $\Delta t_i$: Walking duration through segment $i$ (seconds).
* $\text{WBGT}_i$: Thermal stress in segment $i$ calibrated by tree canopy shading.
* $\text{WBGT}_{\text{threshold}}$: Physiological baseline ($28.0^\circ\text{C}$).
* $P_i$: Bonus credit if a verified municipal water kiosk or cooling center is located within 100m of the segment.
* $w_{\text{time}}, w_{\text{thermal}}, w_{\text{protection}}$: Weighting coefficients tuned to user profile (e.g. higher $w_{\text{thermal}}$ for senior citizens or cardiac patients).

---

## 15. Health Data Requirements

### Audit of Existing Health Metrics in UI
The application displays numbers such as "46,200 At-Risk Residents", "65 Dedicated ICU/Ward Beds", and "Heat Stroke Beds Available".

### Authoritative Classification

```
+-------------------------------------------------------------------------------------------+
|                              HEALTH DATA FEASIBILITY AUDIT                                |
+-----------------------------+-------------------------------+-----------------------------+
| Metric                      | Public API Availability       | Engineering Recommendation  |
+-----------------------------+-------------------------------+-----------------------------+
| Vulnerable Population Count | Real Census Datasets Exist    | Ingest from Census of India |
| Hospital Name / Location    | Real APIs Exist (OSM / Google)| Overpass & Places API       |
| Live Emergency Bed Counts   | NO PUBLIC API EXISTS          | Label as Municipal Estimate |
| Real-Time Heat Casualties   | NO PUBLIC API EXISTS          | Restricted Dept. Portal     |
| Clinical Triage Readiness   | NO PUBLIC API EXISTS          | Protocol Checklist Model    |
+-----------------------------+-------------------------------+-----------------------------+
```

**Policy Mandate**: The application must not fabricate live clinical hospitalizations. Public data feeds do not supply live emergency room occupancy in India without state-level HMIS integration. Such metrics must be explicitly designated as **"MODELED ESTIMATION"** or **"MUNICIPAL PLANNING PROJECTION"** unless populated by verified departmental manual uploads.

---

## 16. Municipal Data Requirements

To convert `src/server/municipalData.ts` from static arrays to a real operational decision engine, the following municipal datasets are required:

1. **Administrative Ward GeoJSON**: Official polygons for all 15 administrative zones of Pune Municipal Corporation (PMC).
2. **Socio-Demographic Census Baseline**:
   * Total resident population per ward.
   * Population above 65 years and children under 5 years.
   * Informal settlement (slum) resident percentage (reflecting tin/asbestos roof vulnerability).
   * Outdoor informal vendor/labor density indices.
3. **Civic Asset Register**:
   * Verified municipal school halls, community centers, and air-conditioned libraries earmarked for Heat Action Plan activations.
   * PMC Smart Water ATM locations and operative status.
4. **Heat Action Plan (HAP) Standard Operating Procedures**:
   * Official trigger thresholds defined by PMC Disaster Management Cell (typically Amber alert at $39.0^\circ\text{C}$ and Red alert at $42.0^\circ\text{C}$).

---

## 17. Alert Data Requirements

ThermaShield 360 generates both automated environmental warnings and authoritative municipal broadcasts:

### Multi-Tier Alert Matrix

```
[Meteorological Sensor Ingestion: Temp >= 39°C OR WBGT >= 30°C]
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
[Automatic Rule Engine Alert]          [Municipal Command Dispatch]
  - Triggered locally on client/server    - Authored by Disaster Officer
  - In-app toast / banner                 - Dispatched to database table
  - Browser Push Notification (Web Push)  - Broadcast to Citizen App Feed
  - Free & Immediate                      - SMS / WhatsApp Gateway (Twilio/Gupshup)
```

### Notification Delivery Infrastructure
* **In-App Alerts**: Stored in client context / database, queried via `/api/alerts`.
* **Web Push Notifications**: Web Push API via browser Service Worker using standard VAPID keys.
* **Emergency SMS/WhatsApp Broadcasts**: Requires integration with an authorized Indian telecom SMS gateway (e.g. CDAC Emergency Communication Gateway or commercial providers like Gupshup/Twilio).

---

## 18. Database Requirements

The application currently has no persistent database; all municipal action status changes and broadcasts reside in volatile server memory (`actionsStore`, `alertsStore`).

### Minimum Production Relational Schema (PostgreSQL / PostGIS)

```sql
-- 1. Administrative Wards
CREATE TABLE wards (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    population INT NOT NULL,
    vulnerable_count INT NOT NULL,
    tree_canopy_pct NUMERIC(5,2),
    built_density_pct NUMERIC(5,2),
    vulnerability_index INT,
    uhi_offset_degc NUMERIC(4,2),
    boundary GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Civic Protection Assets (Cooling & Water Points)
CREATE TABLE civic_protection_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id VARCHAR(50) REFERENCES wards(id),
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('COOLING_CENTRE', 'WATER_KIOSK', 'SHADE_STRUCTURE', 'HEALTHCARE')),
    address TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    capacity INT NOT NULL,
    operating_hours VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Municipal Operational Action Queue
CREATE TABLE municipal_action_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id VARCHAR(50) REFERENCES wards(id),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    action_title VARCHAR(255) NOT NULL,
    time_window VARCHAR(100) NOT NULL,
    rationale TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Approved' CHECK (status IN ('Approved', 'In Progress', 'Completed', 'Review')),
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Municipal Alerts & Broadcasts
CREATE TABLE municipal_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity VARCHAR(30) NOT NULL CHECK (severity IN ('Critical', 'High', 'Developing', 'Normal')),
    target_ward_id VARCHAR(50) REFERENCES wards(id),
    headline VARCHAR(255) NOT NULL,
    statement TEXT NOT NULL,
    action_directive TEXT NOT NULL,
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. Weather & Microclimate Cache
CREATE TABLE weather_observations_cache (
    coordinate_hash VARCHAR(50) PRIMARY KEY,
    latitude NUMERIC(8,5) NOT NULL,
    longitude NUMERIC(8,5) NOT NULL,
    temp_c NUMERIC(4,1) NOT NULL,
    rh_pct INT NOT NULL,
    wind_kmh NUMERIC(5,2),
    solar_w_m2 INT,
    wbgt_c NUMERIC(4,1) NOT NULL,
    utci_c NUMERIC(4,1) NOT NULL,
    cached_payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 19. Backend Processing Architecture

```
                    [Inbound Client Request]
                               │
                               ▼
                    [Express API Middleware]
                  (Rate Limiting & Validation)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    [Read Cache in Memory/DB]         [External API Aggregators]
    (Hit: Return in <15ms)            (Open-Meteo, Google, Overpass)
                                               │
                                               ▼
                                      [Calculation Engines]
                                   - thermalEngine (WBGT, UTCI)
                                   - intelligenceEngine (Rules)
                                   - routingEngine (Cost weights)
                                               │
                                               ▼
                                      [Response Envelope]
                                   { data, source, provenance, timestamp }
```

### Backend Responsibilities
1. **API Key Isolation**: Protect the paid Google Maps API key by executing all Geocoding, Places, Routes, and Air Quality calls server-side.
2. **Scientific Processing**: Execute numerical algorithms (Stull wet-bulb, Fiala UTCI approximation, IMD heatwave criteria) away from the client browser.
3. **Spatial Queries**: Execute PostGIS radius intersections (`ST_DWithin`, `ST_Contains`) to find facilities within ward boundaries.
4. **Data Standardization**: Normalize disparate formats (WMO codes, Overpass tags, Google Places New objects) into uniform TypeScript interfaces.

---

## 20. Security Audit

### Current Vulnerability State
1. **Unrestricted Paid Google Maps Key**: The Google Cloud project currently maintains an API key with **no application restrictions** and **no API restrictions**.
2. **Risk**: If exposed in frontend bundles or client-side network requests, unauthorized third parties can scrape the key, draining the 300 free trial credits and generating billed overages.

### Security Remediation Directives
1. **Zero Client-Side Google API Keys**:
   * All Google Maps Platform calls must be proxied through backend routes (`/api/places/*`, `/api/routes/*`, `/api/geocode/*`).
   * Never inject `VITE_GOOGLE_MAPS_KEY` into browser bundles.
2. **Google Cloud Console Restrictions**:
   * **Application Restriction**: Restrict the key by **IP addresses** corresponding to the production server hosting IP (`asia-east1.run.app` outbound CIDR).
   * **API Restriction**: Restrict the key to explicitly allow only the 5 required services: *Geocoding API, Places API (New), Routes API, Maps JavaScript API, Air Quality API*.
3. **Frontend Map Security**:
   * For the interactive client map, if Maps JavaScript API is initialized directly on the client, create an **isolated second API key** restricted strictly to **HTTP referrers** (`ais-dev-*.run.app/*`, `thermashield360.gov.in/*`) with only *Maps JavaScript API* enabled.

---

## 21. API Master Catalog

### Category A: Required to Make Current Citizen UI Functional

#### 1. Open-Meteo Forecast API
* **Provider**: Open-Meteo GmbH
* **Documentation**: `https://open-meteo.com/en/docs`
* **Purpose**: Primary meteorological feed (temperature, humidity, wind, solar irradiance, surface pressure, 16-day forecast).
* **Endpoint**: `https://api.open-meteo.com/v1/forecast`
* **Authentication**: None required for standard non-commercial tier (<10,000 calls/day).
* **Parameters**: `latitude, longitude, current=..., hourly=..., daily=..., forecast_days=16`.
* **Execution Location**: Server-side proxy (`/api/weather/*`) with 10-minute caching.
* **Status**: **Already Integrated** in `src/server/weatherService.ts`.

#### 2. Google Places API (New)
* **Provider**: Google Maps Platform
* **Documentation**: `https://developers.google.com/maps/documentation/places/web-service/op-overview`
* **Purpose**: Retrieve verified physical parks, gardens, transit shelters, and community hubs for cooling sanctuaries.
* **Endpoint**: `https://places.googleapis.com/v1/places:searchNearby`
* **Authentication**: Google API Key via `X-Goog-Api-Key` header.
* **Parameters**: `locationRestriction.circle`, `includedTypes: ["park", "transit_station", "hospital"]`.
* **Execution Location**: Server-side proxy (`/api/protection/nearby-real`).
* **Status**: **Ready for Integration**.

#### 3. OpenStreetMap Overpass API
* **Provider**: OpenStreetMap Foundation
* **Documentation**: `https://wiki.openstreetmap.org/wiki/Overpass_API`
* **Purpose**: Zero-cost spatial lookup of medical facilities, clinics, and emergency rooms in Indian cities.
* **Endpoint**: `https://overpass-api.de/api/interpreter`
* **Authentication**: Public open access with strict rate-limit discipline and custom User-Agent.
* **Execution Location**: Server-side in `src/server/healthcareService.ts`.
* **Status**: **Already Integrated** in `src/server/healthcareService.ts`.

#### 4. Google Geocoding API
* **Provider**: Google Maps Platform
* **Documentation**: `https://developers.google.com/maps/documentation/geocoding`
* **Purpose**: Convert search strings ("Swargate Bus Station", "Hadapsar Industrial Area") into verified `[lat, lng]`.
* **Endpoint**: `https://maps.googleapis.com/maps/api/geocode/json`
* **Authentication**: Google API Key (`key=...`).
* **Execution Location**: Server-side proxy (`/api/location/geocode`).
* **Status**: **Ready for Integration**.

---

### Category B: Required to Make Current Municipal UI Functional

#### 5. Local Municipal PostGIS / GeoJSON Store
* **Provider**: Internal Express Backend / PostGIS
* **Purpose**: Serves official administrative ward MultiPolygons, verified civic assets, and operational action queue.
* **Endpoints**: `/api/municipal/summary`, `/api/municipal/wards`, `/api/municipal/actions`.
* **Authentication**: Session / JWT token (to be added in later phase).
* **Execution Location**: Internal Server.
* **Status**: Currently mocked in `src/server/municipalData.ts`; requires database connection.

---

### Category C: Required for Cooling-Aware Routing

#### 6. Google Routes API
* **Provider**: Google Maps Platform
* **Documentation**: `https://developers.google.com/maps/documentation/routes`
* **Purpose**: Baseline pedestrian and two-wheeler route geometry generation with alternative paths.
* **Endpoint**: `https://routes.googleapis.com/directions/v2:computeRoutes`
* **Authentication**: Google API Key (`X-Goog-Api-Key`).
* **Execution Location**: Server-side proxy (`/api/routes`).
* **Status**: **Ready for Integration** (currently using public OSRM in `routingEngine.ts`).

---

### Category D: Required for Environmental Context

#### 7. Google Air Quality API
* **Provider**: Google Maps Platform
* **Documentation**: `https://developers.google.com/maps/documentation/air-quality`
* **Purpose**: Hourly surface AQI, PM2.5, PM10, and Ozone concentrations.
* **Endpoint**: `https://airquality.googleapis.com/v1/currentConditions:lookup`
* **Authentication**: Google API Key.
* **Execution Location**: Server-side proxy (`/api/environmental/air-quality`).
* **Status**: **Ready for Integration**.

---

## 22. Data Source Comparison Matrix

```
+--------------------------------------------------------------------------------------------------------------------+
|                                             DATA SOURCE TRADE-OFF MATRIX                                           |
+--------------------------+------------------------------+---------------------------+------------------------------+
| Domain                   | Selected Primary Source      | Alternative Evaluated     | Rationale for Selection      |
+--------------------------+------------------------------+---------------------------+------------------------------+
| Meteorological Core      | Open-Meteo ECMWF/GFS         | Google Weather API        | Open-Meteo includes solar    |
|                          |                              |                           | radiation needed for WBGT.   |
+--------------------------+------------------------------+---------------------------+------------------------------+
| Thermal Stress Indices   | Internal Server Engine       | Commercial Thermal APIs   | Transparent Stull/Fiala math |
|                          | (thermalEngine.ts)           |                           | with zero licensing fees.    |
+--------------------------+------------------------------+---------------------------+------------------------------+
| Healthcare Facilities    | OSM Overpass API             | Google Places API         | Comprehensive clinic tagging |
|                          |                              |                           | across Indian suburbs at $0. |
+--------------------------+------------------------------+---------------------------+------------------------------+
| Public POIs & Parks      | Google Places API (New)      | Foursquare Places API     | Highest coverage and active  |
|                          |                              |                           | hours accuracy in India.     |
+--------------------------+------------------------------+---------------------------+------------------------------+
| Pedestrian Routing Graph | Google Routes API + Internal | OSRM Public Server        | OSRM public server has rate  |
|                          | Thermal Cost Scoring         |                           | limits; Google is robust.    |
+--------------------------+------------------------------+---------------------------+------------------------------+
| Air Quality Indicators   | Google Air Quality API       | OpenAQ / CPCB             | Global unified JSON format   |
|                          |                              |                           | with street-level resolution.|
+--------------------------+------------------------------+---------------------------+------------------------------+
| Ward Boundaries & Census | Official Municipal GeoJSON   | Synthetic Grid Box        | Real civic decision-making   |
|                          | (PMC Open Data)              |                           | requires actual ward borders.|
+--------------------------+------------------------------+---------------------------+------------------------------+
```

---

## 23. API Dependency Graph

```
[User GPS Coordinates (Lat, Lng)]
        │
        ├──► Google Geocoding API ────────► [Normalized Address & City Jurisdiction]
        │
        ├──► Open-Meteo Forecast API ─────► [Temperature, Humidity, Wind, Solar Irradiance]
        │                                         │
        │                                         ▼
        │                                 [thermalEngine.ts]
        │                                 ├── Calculates Stull Wet Bulb Temp (Tw)
        │                                 ├── Calculates Globe Temp (Tg)
        │                                 ├── Calculates Outdoor WBGT Index (°C)
        │                                 ├── Calculates Fiala UTCI Index (°C)
        │                                 └── Calculates NOAA Heat Index (°C)
        │                                         │
        │                                         ├──► [Citizen Home / Thermal Displays]
        │                                         └──► [Heatwave Detection (IMD Normal Comparison)]
        │                                                    │
        │                                                    └──► [Automated Citizen Alerts]
        │
        ├──► Google Air Quality API ──────► [AQI, PM2.5, Ozone] ──► [Compounded Respiratory Risk]
        │
        ├──► Municipal GIS Database ──────► [Ward Polygons, Population, Tree Canopy, Built Density]
        │                                         │
        │                                         ▼
        │                                 [Spatial Risk Engine]
        │                                 ├── Combines WBGT + UHI Offset + Canopy Deficit
        │                                 ├── Computes Ward Composite Risk Score (0–100)
        │                                 └── Evaluates Shelter Demand vs Capacity
        │                                         │
        │                                         ├──► [Citizen Ward GIS Map Layer]
        │                                         └──► [Municipal Command Center Dashboard]
        │
        ├──► Google Places API (New) ─────► [Discovered Parks, Transit Sanctuaries, Public Fountains]
        │                                         │
        │                                         ▼
        │                                 [civic_protection_assets DB Table]
        │                                         │
        │                                         ├──► [Citizen Nearby Protection Map]
        │                                         └──► [Municipal Protection Deficit Calculator]
        │
        └──► Google Routes API ───────────► [Candidate Route Alternatives LineStrings]
                                                  │
                                                  ▼
                                          [routingEngine.ts]
                                          ├── Discretizes into 50m Waypoints
                                          ├── Penalizes Unshaded Solar Segments
                                          ├── Credits Proximity to Chilled Water Points
                                          └── Yields: "Thermal-Safe Route" Alternative
                                                  │
                                                  └──► [Citizen Safe Route Navigation]
```

---

## 24. Blockers and Limitations

1. **Live Hospital Heat Stroke Bed Telemetry**:
   * *Blocker*: No open government API exists in India providing real-time ICU/heat bed availability to third-party applications.
   * *Practical Engineering Solution*: Retain OSM/Google Places for hospital locations and emergency phone contacts. Explicitly replace live bed count numbers with **"Municipal Designated Heat Center"** badges, displaying authorized capacities rather than claiming unverified real-time availability.
2. **Seasonal 12-Month Numerical Predictions**:
   * *Blocker*: Seamless multi-model seasonal forecasts (ECMWF SEAS5) require specialized processing of NetCDF/GRIB binary climate grids.
   * *Practical Engineering Solution*: Restrict live numerical forecasts to the verified **16-day daily horizon** (Open-Meteo), and present 30-day+ outlooks as **historical climatological vulnerability zones** grounded in published IMD seasonal advisory bulletins.
3. **Live Municipal Action Queue Sync**:
   * *Blocker*: No live webhook exists between PMC field radios and the web platform.
   * *Practical Engineering Solution*: Implement a PostgreSQL table (`municipal_action_queue`) where actions can be inserted automatically by the server thermal engine and marked as "In Progress" / "Completed" by authorized session users.

---

## 25. Priority-Based Implementation Plan

### Phase 1: Real Core Meteorological & Spatial Pipeline
* Implement server-side proxy for **Google Geocoding API** to replace fallback city coordinate switches.
* Enhance `src/server/weatherService.ts` to cache Open-Meteo data in PostgreSQL/Redis with graceful failover.
* Replace synthetic coordinates in `src/server/geoData.ts` with genuine **Pune Municipal Corporation GeoJSON ward polygons**.
* Connect real outdoor WBGT, UTCI, and Heat Index to all 12 Citizen pages and the Municipal Command Center.

### Phase 2: Protection Infrastructure & Air Quality Integration
* Integrate **Google Air Quality API** proxy on `/api/environmental/air-quality`.
* Integrate **Google Places API (New)** on `/api/protection/discover` to dynamically index public shaded parks, community centers, and transit shelters.
* Populate the relational table `civic_protection_assets` to replace the 18 hardcoded entries in `src/server/geoData.ts`.
* Dynamically compute the Municipal Protection Gap by comparing real ward population density against verified protection assets.

### Phase 3: True Cooling-Aware Routing Engine
* Migrate `src/server/routingEngine.ts` to query **Google Routes API** for pedestrian multi-route alternatives.
* Implement waypoint segmentation (50m intervals) and overlay shade coefficients to compute the real heat exposure index.
* Inject verified water points and cooling centers as positive utility waypoints.

### Phase 4: Municipal Database Persistence & Automated Alerts
* Connect PostgreSQL database schema (`wards`, `civic_protection_assets`, `municipal_action_queue`, `municipal_alerts`).
* Replace volatile in-memory arrays in `src/server/municipalData.ts` with persistent SQL queries.
* Implement IMD threshold comparison logic to trigger automatic Yellow/Orange/Red heatwave warning banners.

---

## 26. Final Required API Checklist

```
+--------------------------------------------------------------------------------------------------------------------+
|                                           FINAL PRODUCTION API CHECKLIST                                           |
+------------------------------+--------------------+-----------------------------+----------------------------------+
| API Name                     | Provider           | Purpose                     | Current Status                   |
+------------------------------+--------------------+-----------------------------+----------------------------------+
| Forecast API                 | Open-Meteo         | Scientific weather & solar  | IMPLEMENTED                      |
| Overpass API                 | OpenStreetMap      | Medical facility lookup     | IMPLEMENTED                      |
| Geocoding API                | Google Maps        | Address & landmark coords   | READY TO INTEGRATE               |
| Places API (New)             | Google Maps        | Civic parks & shelters      | READY TO INTEGRATE               |
| Routes API                   | Google Maps        | Route alternatives baseline | READY TO INTEGRATE               |
| Air Quality API              | Google Maps        | Ambient AQI & pollutants    | READY TO INTEGRATE               |
| Maps JavaScript API          | Google Maps        | Web mapping canvas (opt)    | LEAFLET ACTIVE / READY           |
| Time Zone API                | Google Maps        | Solar noon calculations     | READY TO INTEGRATE               |
| Administrative GeoJSON Store | PMC / Open Data    | Ward boundary MultiPolygons | SPECIFIED (MOCK ACTIVE)          |
| Relational DB (PostgreSQL)   | Supabase/Cloud SQL | Action queue & asset store  | SPECIFIED (IN-MEMORY ACTIVE)     |
+------------------------------+--------------------+-----------------------------+----------------------------------+
```

### Action Items for Developer Implementation Turn
1. **Security**: Configure IP and API restrictions in Google Cloud Console before pushing code.
2. **Environment**: Add `GOOGLE_MAPS_API_KEY` to backend `.env` variables (never in client `.env`).
3. **Execution**: Follow the phased implementation plan, starting with Phase 1 to replace mock ward geography and connect the Google Geocoding proxy.

---

## 27. Final Executive Summary

1. **Exactly which APIs do we need RIGHT NOW?**
   * **Open-Meteo Forecast API**: Continuous live ingestion of temperature, humidity, wind, and solar radiation flux ($W/m^2$).
   * **Google Geocoding API**: Server-side translation of user landmark/ward searches into coordinates.
   * **Google Places API (New)**: Discovery of physical shaded gardens, transit shelters, and public drinking fountains.
   * **Google Routes API**: Pedestrian alternative route geometries for the thermal routing engine.
   * **Google Air Quality API**: Street-level AQI, PM2.5, and Ozone concentrations.
   * **OpenStreetMap Overpass API**: Free, unrestricted clinical and hospital facility discovery across Indian cities.

2. **Which Google APIs should we use?**
   * Use **Geocoding API**, **Places API (New)**, **Routes API**, **Air Quality API**, and **Time Zone API**.
   * Optionally use **Maps JavaScript API** if standardizing client-side rendering from Leaflet to Google Maps.

3. **Which Google APIs should NOT be used?**
   * Do **NOT** use Google Weather API (it lacks direct solar radiation required for outdoor WBGT and UTCI calculations).
   * Do **NOT** use Roads API, Navigation SDK, Aerial View API, 3D SDKs, Street View Publish API, or Isochrones API for the current project phase.

4. **Which non-Google APIs / data sources are required?**
   * **Open-Meteo Forecast API** for high-precision scientific solar radiation and 16-day hourly models.
   * **OpenStreetMap Overpass API** for medical and emergency triage POIs.
   * **Official Municipal GeoJSON Boundaries** (Pune Municipal Corporation open data) for real ward polygons.
   * **Census of India Demographics** for population, elderly count, and informal settlement densities.
   * **IMD Climatological Normal Tables** for official Indian heatwave classification thresholds.

5. **Which data must be calculated ourselves?**
   * **Wet Bulb Globe Temperature (WBGT)**: Stull wet-bulb formula + solar-wind globe temperature equation.
   * **Universal Thermal Climate Index (UTCI)**: Fiala multi-node human heat balance equation.
   * **NOAA Heat Index**: Rothfusz apparent temperature regression.
   * **Thermal-Safe Routing Cost Matrix**: Weighted path optimization combining walking duration, shade canopy coverage, and proximity to municipal water points.
   * **Composite Microclimate Heat Risk Score (0–100)**: Multi-factor index combining ambient WBGT, Urban Heat Island surface offset, tree canopy deficit, and demographic vulnerability.
   * **Municipal Protection Deficit**: Algorithmic subtraction of active civic shelter capacity from vulnerable exposed population.

6. **Which data requires a database?**
   * Official ward boundaries and socio-demographic indicators.
   * Verified civic cooling sanctuaries and water ATMs (`civic_protection_assets`).
   * Municipal operational action queue items (`municipal_action_queue`).
   * Municipal broadcast alert logs (`municipal_alerts`).
   * Weather and microclimate observation cache to minimize external API costs.

7. **Which data requires a backend?**
   * All Google API proxy requests to protect API keys.
   * Real-time thermal physics calculations (WBGT, UTCI, Heat Index).
   * Candidate route segmentation and shade cost calculation.
   * Spatial point-in-polygon queries for ward-level metrics.

8. **What must be supplied by a municipality?**
   * Official GeoJSON administrative boundary files.
   * Directory of designated municipal heat sanctuaries (AC civic halls, school auditoriums).
   * Verified operational water tanker and water kiosk locations.
   * Official operational action queue sign-offs and Heat Action Plan activation stages.

9. **What can be made completely real immediately?**
   * Ambient weather, hourly forecasts, 16-day forecast curves (Open-Meteo).
   * Precise WBGT, UTCI, and Heat Index thermal stress metrics (calculated).
   * IMD heatwave status classifications (calculated from forecast vs normal).
   * Address search and geocoding (Google Geocoding API).
   * Nearby hospital and clinic discovery (OSM Overpass API).
   * Ambient AQI and air pollution metrics (Google Air Quality API).

10. **What cannot be made genuinely real without external datasets / partnerships?**
    * Live emergency room ICU bed availability (requires hospital management system partnership).
    * Real-time heat casualty and heat-stroke admissions data.
    * Multi-month climate predictions beyond 16 days (requires institutional climate center access).
    * Dynamic real-time water flow rates at municipal kiosks (requires municipal SCADA/IoT telemetry).

11. **What is the minimum API set needed to make Citizen + Municipal functional?**
    * **Open-Meteo API** (Meteorological core)
    * **Google Geocoding API** (Search & location)
    * **Google Places API (New)** (Parks & cooling shelters)
    * **Google Routes API** (Pedestrian navigation)
    * **PostgreSQL / PostGIS Database** (Wards, assets, action queue)

12. **What should we integrate first?**
    * **Step 1**: Establish backend server proxies for Google Geocoding and Places API.
    * **Step 2**: Connect real Pune Municipal Corporation GeoJSON ward boundaries.
    * **Step 3**: Implement PostgreSQL schema for civic protection assets and the operational action queue.

13. **What should NOT be touched yet?**
    * User authentication, OAuth, user registration, and onboarding flows (explicitly scheduled for a subsequent phase).
    * Future role workspaces (Healthcare Worker, Farmer, Industrial Manager).
    * 3D visualization or complex satellite raster tiling pipelines.
