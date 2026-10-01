# ThermaShield 360 — Extreme Heatwave Early Warning & Human Thermal Stress Index

> **SIH 2026 Solution:** SIH26083  
> **Core Principle:** Predict the Heat → Understand the Impact → Protect People → Verify the Outcome  
> **Target Audience:** Citizens, Outdoor Workforces, Municipal Corporations, Healthcare Grids, and Disaster Management Authorities (EOC).

---

## 1. System Architecture

ThermaShield 360 is engineered as a **Unified High-Performance Single-Service Application** (Option A) that builds both the interactive Vite React SPA and bundles the Express biometeorological intelligence server into a standalone production artifact.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER (Browser / Mobile)                    │
│  - React 19 + TypeScript + Tailwind CSS                                 │
│  - 5 Operational Workspaces: Citizen, Worker, Municipal, Health, EOC    │
│  - Real-Time GIS (Google Maps & CARTO Vector Layers)                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Same-Origin /api/* (Zero CORS issues)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    THERMASHIELD 360 UNIFIED SERVER                      │
│  - Express.js Engine (server.js - bundled via esbuild)                  │
│  - Static Asset Provider (serves dist/ with full SPA route fallback)    │
│  - Biometeorological Calculation Engine (WBGT, UTCI, Heat Index)        │
│  - 7-Point Provenance & Validation Ledger                               │
│  - Multi-Horizon Early Warning Ladder (0d to 12m)                       │
│  - Health Probes (/health, /api/health, /api/health/diagnostics)        │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌──────────────────────────────────┐   ┌──────────────────────────────────┐
│        SUPABASE CLOUD            │   │      LIVE DATA PROVIDERS         │
│  - PostgreSQL RLS Database       │   │  - Open-Meteo (Live NWP)         │
│  - Auth (Email, OTP, PKCE OAuth) │   │  - ECMWF IFS (0.25° NWP)         │
│  - Role Profiles & Onboarding    │   │  - NOAA GFS & GEFS Ensembles     │
│  - Institutional Review Desk     │   │  - Copernicus CDS / ERA5 Baseline│
│  - Municipal Actions & Alerts    │   │  - NASA FIRMS (Thermal Anomaly)  │
└──────────────────────────────────┘   │  - OpenAQ v3 (In-situ Stations)  │
                                       │  - Google Geocoding & Places     │
                                       └──────────────────────────────────┘
```

---

## 2. Prerequisites

- **Node.js:** v20.x, v22.x, or v24.x
- **Package Manager:** npm (v10+ or v11+)
- **Supabase Account:** Free tier PostgreSQL + Authentication project

---

## 3. Environment Variables Reference

Copy `.env.example` to `.env` for local development or input into your cloud hosting dashboard (e.g., Render, Railway, Cloud Run).

### A. Public Safe Configuration (Bundled to Frontend)

| Variable Name | Purpose | Required | Example / Default |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key | Yes | `eyJhbGciOi...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Browser Maps JavaScript key | Optional | Restricted browser key |
| `VITE_CARTO_API_KEY` | CARTO Vector Basemap key | Optional | |
| `VITE_OPEN_METEO_BASE_URL` | Open-Meteo public API base | Optional | `https://api.open-meteo.com/v1` |
| `VITE_API_BASE_URL` | Custom backend API URL (leave empty for same-origin) | Optional | `""` (same origin) |

### B. Server Secret Configuration (Backend Only — Never Visible to Browser)

| Variable Name | Purpose | Required | Sensitivity |
|---|---|---|---|
| `PORT` | HTTP port to bind (injected automatically by cloud host) | Optional | Public (Default `3000`) |
| `NODE_ENV` | Runtime environment (`production` or `development`) | Recommended | Public (`production`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed domains (e.g. `https://myapp.onrender.com`) | Optional | Server Config |
| `SUPABASE_URL` | Supabase project URL for server backend | Yes | Server Config |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key for backend DB operations | Yes | **CRITICAL SECRET** |
| `GOOGLE_MAPS_API_KEY` | Server-side Google Geocoding and Routes API key | Optional | **SECRET** |
| `COPERNICUS_CDS_API_KEY` | Copernicus Climate Data Store ERA5 reanalysis key | Optional | **SECRET** |
| `COPERNICUS_CDS_URL` | Copernicus CDS endpoint | Optional | `https://cds.climate.copernicus.eu/api` |
| `NASA_FIRMS_MAP_KEY` | NASA VIIRS 375m active thermal anomaly key | Optional | **SECRET** |
| `OPENAQ_API_KEY` | OpenAQ v3 air quality sensor network key | Optional | **SECRET** |
| `NOAA_NCEI_TOKEN` | NOAA NCEI CDO token for historical climate observations | Optional | **SECRET** |
| `DATA_MODE` | Enforcement mode (`live` quarantines synthetic models) | Yes | Default: `live` |

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run TypeScript lint check (0 errors guaranteed)
npm run lint

# 3. Run full real-data pipeline verification suite
npm run test:pipeline

# 4. Run 5-city location isolation & resilience test
npm run test:locations

# 5. Start unified development server
npm run dev
# Server listening at http://localhost:3000
```

---

## 5. Production Build & Start

The repository features a single-command build pipeline:
1. `vite build` builds the client application into `dist/`.
2. `esbuild server.ts` bundles the backend into a lean, self-contained `server.js`.

```bash
# 1. Build production client & bundled server
npm run build

# 2. Run standalone production server
npm start
# Output:
# [ThermaShield 360] Starting in PRODUCTION mode (serving ./dist)
# ThermaShield 360 Server running at http://0.0.0.0:3000
# Health check: http://0.0.0.0:3000/health
```

---

## 6. Cloud Deployment Guide (Free Tier Compatible)

### Option A: Render.com (Recommended — 100% Free Web Service)

Render provides a free web service tier running Node.js with automated SSL, continuous Git deployment, and dynamic port binding.

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click **New +** → **Blueprint** and select your repository (it automatically detects `render.yaml`), OR select **New Web Service**:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. In the **Environment Variables** tab, add your secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY`
   - `COPERNICUS_CDS_API_KEY`
   - `NASA_FIRMS_MAP_KEY`
   - `OPENAQ_API_KEY`
   - `DATA_MODE`: `live`
5. Click **Create Web Service**. Within 2 minutes, your service is live with a public HTTPS URL (e.g. `https://thermashield-360.onrender.com`).

### Option B: Docker Container (Portable to Any Cloud)

A production-grade multi-stage `Dockerfile` is included:

```bash
# Build Docker image
docker build -t thermashield-360 .

# Run Docker container
docker run -p 3000:3000 --env-file .env thermashield-360
```
Compatible with:
- Google Cloud Run
- Railway.app
- AWS App Runner / ECS
- Fly.io
- Any Linux VPS (Ubuntu/Debian)

---

## 7. Google OAuth & Supabase Authentication Configuration

For Google Sign-In and email authentication to work across both local testing and your deployed production domain:

### Step 1: Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Select your OAuth 2.0 Client ID (Web Application).
3. Under **Authorized JavaScript origins**, add:
   - `https://pdrcrtlihvscwzzmrbqn.supabase.co` (Your Supabase project URL)
   - `http://localhost:3000` (Local testing)
   - `https://<YOUR-DEPLOYED-DOMAIN>.onrender.com` (Your deployed production domain)
4. Under **Authorized redirect URIs**, add:
   - `https://pdrcrtlihvscwzzmrbqn.supabase.co/auth/v1/callback`  
     *(Note: Google redirects to Supabase; Supabase then redirects to your application).*
5. Click **Save**.

### Step 2: Supabase Dashboard Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Project `pdrcrtlihvscwzzmrbqn`.
2. Navigate to **Authentication** → **URL Configuration**.
3. Set **Site URL** to:
   - `https://<YOUR-DEPLOYED-DOMAIN>.onrender.com` (or `http://localhost:3000` for local dev)
4. Under **Redirect URLs**, add the following whitelist entries:
   - `http://localhost:3000/**`
   - `http://localhost:3000`
   - `http://127.0.0.1:3000/**`
   - `https://<YOUR-DEPLOYED-DOMAIN>.onrender.com/**`
   - `https://<YOUR-DEPLOYED-DOMAIN>.onrender.com`
5. Navigate to **Authentication** → **Providers** → **Google**:
   - Ensure Google provider is **Enabled**.
   - Input your Google Client ID and Google Client Secret from Google Cloud Console.
6. Click **Save**.

---

## 8. Health Checks & Diagnostics

The production server includes dedicated diagnostic endpoints:

- **Liveness Health Check:** `GET /health`  
  Returns `{ "status": "ok", "uptime": 120, "service": "ThermaShield-360-Engine" }` in < 2ms (ideal for Render/AWS/k8s probes).
- **API Health Check:** `GET /api/health`
- **System Diagnostics:** `GET /api/health/diagnostics`  
  Checks live database connectivity and provider readiness non-destructively without leaking secrets.

---

## 9. SIH Judge Evaluation & Smoke-Test Walkthrough

Follow these steps to demonstrate the full capabilities of ThermaShield 360:

1. **Open Public URL:** Navigate to `https://<YOUR-DEPLOYED-DOMAIN>.onrender.com`.
2. **Access Control & Multi-Role Demo:**
   - On the Login page, use **Instant Demo Access** to immediately enter any of the 5 authorized roles:
     - **Citizen:** Hyperlocal personal thermal stress, WBGT, shaded routes, healthcare triage.
     - **Outdoor Worker:** Construction / farm worker heat load, rest-water break scheduler.
     - **Healthcare:** Hospital surge forecast, cooling bath & emergency bed capacity.
     - **Municipal Corporation:** 15-ward vulnerability index, misting canopy action queue.
     - **Disaster EOC:** District-level heatwave escalation ladder, multi-agency directives.
   - Alternatively, sign in using **Google Sign-In** or **Email + Password**.
3. **Multi-Location Verification:**
   - In the Citizen or Municipal dashboard, switch locations between:
     - **Pune, Maharashtra**
     - **Mumbai, Maharashtra**
     - **Delhi, NCT**
     - **Nagpur, Maharashtra**
     - **London, UK / Dubai, UAE**
   - Verify that temperatures, humidity, WBGT, and forecasts reflect real, independent atmospheric data.
4. **Data Transparency & Provenance:**
   - Click the **Data Source & Provenance Ledger** badge.
   - Inspect the 7-point audit status (`VERIFIED`, `LIVE`, `MODELLED`) and model consensus breakdown (ECMWF, GFS, ERA5, OpenAQ, FIRMS).
5. **Deep Route Navigation:**
   - Refresh the browser on `/municipal`, `/healthcare`, or `/citizen` to verify that SPA routing preserves state without 404 errors.
