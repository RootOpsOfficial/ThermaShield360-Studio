-- ==============================================================================
-- THERMASHIELD 360 — MASTER DATABASE SCHEMA (FINAL PRODUCTION INITIALIZATION)
-- Filename: thermashield_360_final.sql
-- Target Platform: Supabase PostgreSQL 15+ with PostGIS Spatial Extension
-- Safety: Fully Idempotent & Re-run Safe on Clean or Existing Databases
-- ==============================================================================

-- ==============================================================================
-- 01 — EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ==============================================================================
-- 02 — TYPES & ENUMS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE risk_level_enum AS ENUM (
        'Low', 
        'Moderate', 
        'High', 
        'Extreme', 
        'Critical'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE facility_status_enum AS ENUM (
        'Available', 
        'Limited', 
        'Unavailable', 
        'Standby Ready', 
        'Operational', 
        'Active', 
        'Decommissioned', 
        'Under Maintenance', 
        'Unknown'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE asset_type_enum AS ENUM (
        'cooling_centre', 
        'water_kiosk', 
        'shade_structure', 
        'public_shelter', 
        'park_greenspace'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE priority_level_enum AS ENUM (
        'CRITICAL', 
        'HIGH', 
        'MEDIUM', 
        'LOW'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE action_status_enum AS ENUM (
        'Approved', 
        'In Progress', 
        'Review', 
        'Completed', 
        'Cancelled'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity_enum AS ENUM (
        'Critical', 
        'High', 
        'Developing', 
        'Normal'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE alert_lifecycle_status_enum AS ENUM (
        'Draft', 
        'Scheduled', 
        'Active', 
        'Resolved', 
        'Expired', 
        'Revoked'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE healthcare_facility_type_enum AS ENUM (
        'Hospital', 
        'Emergency Care', 
        'Urban Health Post', 
        'Community Health Centre', 
        'Clinic', 
        'Dispensary', 
        'Doctor'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE imd_heatwave_status_enum AS ENUM (
        'Normal', 
        'Heatwave Warning', 
        'Severe Heatwave Warning', 
        'Warm Night Condition'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE data_provenance_type_enum AS ENUM (
        'OFFICIAL_GOVERNMENT', 
        'MET_AGENCY_OPEN_DATA', 
        'COMMUNITY_OSM', 
        'COMMERCIAL_API', 
        'CALCULATED_DERIVED', 
        'DEMO_IMPORT'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 03 — FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 04 — TABLES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 4.1 TABLE: wards (Master Spatial Ward Registry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wards (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    center_lat NUMERIC(9,6) NOT NULL,
    center_lng NUMERIC(9,6) NOT NULL,
    center_point GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    ) STORED,
    boundary GEOMETRY(MultiPolygon, 4326) DEFAULT NULL,
    provenance_type data_provenance_type_enum NOT NULL DEFAULT 'DEMO_IMPORT',
    source_attribution TEXT DEFAULT 'Pune Municipal Corporation Administrative Setup',
    verified_status BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ DEFAULT NULL,
    verified_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.2 TABLE: ward_demographics (Temporal Demographic Baseline & Surface Metrics)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ward_demographics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id VARCHAR(50) NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    source_year INT NOT NULL,
    
    -- Raw Census / Municipal Baseline Data
    population INT NOT NULL,
    vulnerable_count INT NOT NULL DEFAULT 0,
    tree_canopy_pct NUMERIC(5,2) DEFAULT NULL,
    built_density_pct NUMERIC(5,2) DEFAULT NULL,
    slum_settlement_pct NUMERIC(5,2) DEFAULT NULL,
    outdoor_worker_est INT DEFAULT NULL,
    high_risk_micro_areas TEXT[] DEFAULT '{}',
    low_risk_buffer_areas TEXT[] DEFAULT '{}',
    
    -- ThermaShield Calculated Attributes (Derived, not official census metrics)
    calculated_vulnerability_index INT DEFAULT NULL,
    calculated_uhi_offset_degc NUMERIC(4,2) DEFAULT NULL,
    calculation_version VARCHAR(50) DEFAULT 'v1.0-standard-weights',
    calculated_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Provenance & Integrity Tracking
    provenance_type data_provenance_type_enum NOT NULL DEFAULT 'DEMO_IMPORT',
    source_agency VARCHAR(150) NOT NULL DEFAULT 'Census of India / PMC Draft Estimation',
    source_document_url TEXT DEFAULT NULL,
    verified_status BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_ward_demographics_year UNIQUE (ward_id, source_year)
);

-- ------------------------------------------------------------------------------
-- 4.3 TABLE: civic_protection_assets (Cooling, Water, Shade Infrastructure)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS civic_protection_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(50) UNIQUE DEFAULT NULL,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    asset_type asset_type_enum NOT NULL,
    category_label VARCHAR(100) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) STORED,
    address TEXT NOT NULL,
    operating_hours_text VARCHAR(100) NOT NULL DEFAULT 'Check with Local Facility',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    operational_status facility_status_enum NOT NULL DEFAULT 'Available',
    
    -- Capacity Metrics (Nullable if unverified/unknown to avoid false precision)
    daily_capacity INT DEFAULT NULL,
    current_occupancy INT DEFAULT NULL,
    occupancy_updated_at TIMESTAMPTZ DEFAULT NULL,
    
    -- Amenity & Readiness Flags
    has_potable_drinking_water BOOLEAN NOT NULL DEFAULT FALSE,
    has_active_cooling BOOLEAN NOT NULL DEFAULT FALSE,
    has_emergency_power_backup BOOLEAN NOT NULL DEFAULT FALSE,
    has_wheelchair_ramp BOOLEAN NOT NULL DEFAULT FALSE,
    amenities TEXT[] DEFAULT '{}',
    contact_phone VARCHAR(50) DEFAULT NULL,
    is_emergency_activation_ready BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- External System Links
    google_place_id VARCHAR(150) DEFAULT NULL,
    osm_node_id BIGINT DEFAULT NULL,
    
    -- Provenance & Verification Tracking
    provenance_type data_provenance_type_enum NOT NULL DEFAULT 'DEMO_IMPORT',
    source_attribution VARCHAR(200) NOT NULL DEFAULT 'Civic Protection Database',
    source_url TEXT DEFAULT NULL,
    verified_status BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ DEFAULT NULL,
    verified_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.4 TABLE: municipal_action_queue (Operational Incident & Dispatch Directives)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_action_queue (
    id VARCHAR(50) PRIMARY KEY,
    ward_id VARCHAR(50) NOT NULL REFERENCES wards(id) ON DELETE RESTRICT,
    ward_display_name VARCHAR(150) NOT NULL,
    priority priority_level_enum NOT NULL DEFAULT 'MEDIUM',
    action_title VARCHAR(255) NOT NULL,
    time_window_display VARCHAR(100) NOT NULL,
    scheduled_start TIMESTAMPTZ DEFAULT NULL,
    scheduled_end TIMESTAMPTZ DEFAULT NULL,
    rationale TEXT NOT NULL,
    status action_status_enum NOT NULL DEFAULT 'Approved',
    assigned_department VARCHAR(100) DEFAULT 'Disaster Management Cell',
    assigned_team VARCHAR(100) DEFAULT NULL,
    
    -- ThermaShield Analytical Link
    triggered_by_wbgt_threshold NUMERIC(4,1) DEFAULT NULL,
    calculated_protection_deficit_trigger INT DEFAULT NULL,
    
    resolved_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.5 TABLE: municipal_alerts (Broadcast Heatwave Warnings & Directives)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_alerts (
    id VARCHAR(50) PRIMARY KEY,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    severity alert_severity_enum NOT NULL DEFAULT 'High',
    lifecycle_status alert_lifecycle_status_enum NOT NULL DEFAULT 'Active',
    
    -- Structured Machine Timeframes
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ DEFAULT NULL,
    
    -- Human-Readable Communication Payload
    what TEXT NOT NULL,
    where_location TEXT NOT NULL,
    when_time TEXT NOT NULL,
    why_reason TEXT NOT NULL,
    action_directive TEXT NOT NULL,
    target_channels TEXT[] NOT NULL DEFAULT ARRAY['CITIZEN_APP', 'SMS_BROADCAST', 'FIELD_CREW'],
    
    -- Meteorological & Regulatory Basis
    is_imd_official_declaration BOOLEAN NOT NULL DEFAULT FALSE,
    issuing_authority VARCHAR(150) NOT NULL DEFAULT 'ThermaShield Early Warning System / PMC Disaster Cell',
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.6 TABLE: healthcare_facilities (Clinics, Hospitals, Heat Triage Directory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS healthcare_facilities (
    id VARCHAR(100) PRIMARY KEY,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    facility_type healthcare_facility_type_enum NOT NULL DEFAULT 'Hospital',
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) STORED,
    address TEXT NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    website TEXT DEFAULT NULL,
    is_open_24x7 BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_indicator BOOLEAN NOT NULL DEFAULT FALSE,
    operational_status facility_status_enum NOT NULL DEFAULT 'Available',
    directions_url TEXT DEFAULT NULL,
    
    -- External System Integrations
    osm_id BIGINT DEFAULT NULL,
    google_place_id VARCHAR(150) DEFAULT NULL,
    
    -- Clinical Protocol Readiness Flags (NO fabricated bed availability numbers)
    designated_heat_treatment_protocol BOOLEAN NOT NULL DEFAULT FALSE,
    ors_stabilization_unit_available BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Provenance & Verification Tracking
    provenance_type data_provenance_type_enum NOT NULL DEFAULT 'COMMUNITY_OSM',
    source_attribution VARCHAR(200) NOT NULL DEFAULT 'OpenStreetMap Overpass Query',
    verified_status BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ DEFAULT NULL,
    verified_by VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4.7 TABLE: weather_observations (Persistent Weather & Thermal Cache)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_key VARCHAR(100) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    
    -- Raw Meteorological Observations
    temp_c NUMERIC(4,1) NOT NULL,
    feels_like_c NUMERIC(4,1) NOT NULL,
    humidity_pct INT NOT NULL,
    wind_speed_kmh NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    wind_direction_deg INT DEFAULT NULL,
    solar_irradiance_w_m2 INT DEFAULT NULL,
    uv_index NUMERIC(3,1) DEFAULT NULL,
    pressure_hpa NUMERIC(6,1) DEFAULT NULL,
    weather_code INT DEFAULT 0,
    weather_description VARCHAR(100) DEFAULT NULL,
    
    -- ThermaShield Physiological Indices (Nullable if raw parameters are missing)
    calculated_wbgt_c NUMERIC(4,1) DEFAULT NULL,
    calculated_utci_c NUMERIC(4,1) DEFAULT NULL,
    calculated_heat_index_c NUMERIC(4,1) DEFAULT NULL,
    calculation_engine_version VARCHAR(50) DEFAULT 'ThermaShield-Stull-Fiala-v1.0',
    
    -- Provenance Tracking
    provenance_type data_provenance_type_enum NOT NULL DEFAULT 'MET_AGENCY_OPEN_DATA',
    source_attribution VARCHAR(100) NOT NULL DEFAULT 'Open-Meteo GFS/ECMWF Seamless',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_weather_obs_loc_time UNIQUE (location_key, observed_at)
);

-- ------------------------------------------------------------------------------
-- 4.8 TABLE: weather_forecasts (Multi-Day Forecast Horizon & Heatwave Triggers)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_key VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    forecast_run_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Forecasted Meteorological Parameters
    temp_max_c NUMERIC(4,1) NOT NULL,
    temp_min_c NUMERIC(4,1) NOT NULL,
    feels_like_max_c NUMERIC(4,1) NOT NULL,
    humidity_avg_pct INT NOT NULL,
    solar_radiation_max_w_m2 INT DEFAULT NULL,
    
    -- ThermaShield Calculated Risk & Heatwave Status
    calculated_risk_level risk_level_enum NOT NULL,
    calculated_wbgt_max_c NUMERIC(4,1) DEFAULT NULL,
    thermashield_heatwave_classification imd_heatwave_status_enum NOT NULL DEFAULT 'Normal',
    
    -- Official IMD Declaration (Populated ONLY when genuine official IMD bulletin is received)
    official_imd_status VARCHAR(100) DEFAULT NULL,
    
    peak_period_description VARCHAR(50) DEFAULT '12:00 PM - 04:00 PM',
    summary_text TEXT DEFAULT NULL,
    
    -- Provenance Tracking
    provenance_type data_provenance_type_enum NOT NULL DEFAULT 'MET_AGENCY_OPEN_DATA',
    source_attribution VARCHAR(100) NOT NULL DEFAULT 'Open-Meteo Multi-Model Ensemble',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Multi-Run Storage Support: Location + Forecast Target Date + Generation Run Timestamp
    CONSTRAINT uq_weather_forecast_run UNIQUE (location_key, forecast_date, forecast_run_timestamp)
);

-- ------------------------------------------------------------------------------
-- 4.9 TABLE: ward_risk_snapshots (Historical Municipal Analytics & Deficit Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ward_risk_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id VARCHAR(50) NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Computed Thermal Risk
    calculated_risk_score INT NOT NULL,
    calculated_risk_level risk_level_enum NOT NULL,
    observed_or_modelled_wbgt_c NUMERIC(4,1) NOT NULL,
    ambient_temp_c NUMERIC(4,1) NOT NULL,
    
    -- Protection Gap Equation Snapshot
    vulnerable_population_exposed INT NOT NULL,
    calculated_protection_demand INT NOT NULL,
    active_protection_capacity INT NOT NULL,
    calculated_protection_gap INT NOT NULL,
    calculated_fulfillment_pct INT NOT NULL,
    
    -- Actionable Insights
    why_attention_rationale TEXT DEFAULT NULL,
    recommended_intervention TEXT DEFAULT NULL,
    
    -- Analytical Provenance
    is_official_government_metric BOOLEAN NOT NULL DEFAULT FALSE,
    calculation_pipeline_name VARCHAR(100) NOT NULL DEFAULT 'ThermaShield-Urban-Intelligence-Pipeline-v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 05 — CONSTRAINTS & AUDIT CHECKS
-- ==============================================================================

-- 5.1 Location Latitude & Longitude Validation
ALTER TABLE wards
    DROP CONSTRAINT IF EXISTS chk_wards_lat,
    ADD CONSTRAINT chk_wards_lat CHECK (center_lat BETWEEN -90.0 AND 90.0),
    DROP CONSTRAINT IF EXISTS chk_wards_lng,
    ADD CONSTRAINT chk_wards_lng CHECK (center_lng BETWEEN -180.0 AND 180.0);

ALTER TABLE civic_protection_assets
    DROP CONSTRAINT IF EXISTS chk_protection_lat,
    ADD CONSTRAINT chk_protection_lat CHECK (lat BETWEEN -90.0 AND 90.0),
    DROP CONSTRAINT IF EXISTS chk_protection_lng,
    ADD CONSTRAINT chk_protection_lng CHECK (lng BETWEEN -180.0 AND 180.0),
    DROP CONSTRAINT IF EXISTS chk_protection_capacity,
    ADD CONSTRAINT chk_protection_capacity CHECK (daily_capacity IS NULL OR daily_capacity >= 0),
    DROP CONSTRAINT IF EXISTS chk_protection_occupancy,
    ADD CONSTRAINT chk_protection_occupancy CHECK (current_occupancy IS NULL OR current_occupancy >= 0);

ALTER TABLE healthcare_facilities
    DROP CONSTRAINT IF EXISTS chk_healthcare_lat,
    ADD CONSTRAINT chk_healthcare_lat CHECK (lat BETWEEN -90.0 AND 90.0),
    DROP CONSTRAINT IF EXISTS chk_healthcare_lng,
    ADD CONSTRAINT chk_healthcare_lng CHECK (lng BETWEEN -180.0 AND 180.0);

ALTER TABLE weather_observations
    DROP CONSTRAINT IF EXISTS chk_weather_obs_lat,
    ADD CONSTRAINT chk_weather_obs_lat CHECK (lat BETWEEN -90.0 AND 90.0),
    DROP CONSTRAINT IF EXISTS chk_weather_obs_lng,
    ADD CONSTRAINT chk_weather_obs_lng CHECK (lng BETWEEN -180.0 AND 180.0),
    DROP CONSTRAINT IF EXISTS chk_weather_obs_humidity,
    ADD CONSTRAINT chk_weather_obs_humidity CHECK (humidity_pct BETWEEN 0 AND 100),
    DROP CONSTRAINT IF EXISTS chk_weather_obs_wind,
    ADD CONSTRAINT chk_weather_obs_wind CHECK (wind_speed_kmh >= 0);

ALTER TABLE weather_forecasts
    DROP CONSTRAINT IF EXISTS chk_weather_forecast_humidity,
    ADD CONSTRAINT chk_weather_forecast_humidity CHECK (humidity_avg_pct BETWEEN 0 AND 100);

ALTER TABLE ward_demographics
    DROP CONSTRAINT IF EXISTS chk_demographics_population,
    ADD CONSTRAINT chk_demographics_population CHECK (population >= 0),
    DROP CONSTRAINT IF EXISTS chk_demographics_vulnerable,
    ADD CONSTRAINT chk_demographics_vulnerable CHECK (vulnerable_count >= 0),
    DROP CONSTRAINT IF EXISTS chk_demographics_canopy,
    ADD CONSTRAINT chk_demographics_canopy CHECK (tree_canopy_pct IS NULL OR (tree_canopy_pct >= 0 AND tree_canopy_pct <= 100)),
    DROP CONSTRAINT IF EXISTS chk_demographics_built,
    ADD CONSTRAINT chk_demographics_built CHECK (built_density_pct IS NULL OR (built_density_pct >= 0 AND built_density_pct <= 100)),
    DROP CONSTRAINT IF EXISTS chk_demographics_vuln_idx,
    ADD CONSTRAINT chk_demographics_vuln_idx CHECK (calculated_vulnerability_index IS NULL OR (calculated_vulnerability_index >= 0 AND calculated_vulnerability_index <= 100));

-- 5.2 Strict Snapshot Count & Percentage Constraints
ALTER TABLE ward_risk_snapshots
    DROP CONSTRAINT IF EXISTS chk_snapshots_risk_score,
    ADD CONSTRAINT chk_snapshots_risk_score CHECK (calculated_risk_score BETWEEN 0 AND 100),
    DROP CONSTRAINT IF EXISTS chk_snapshots_fulfillment,
    ADD CONSTRAINT chk_snapshots_fulfillment CHECK (calculated_fulfillment_pct BETWEEN 0 AND 100),
    DROP CONSTRAINT IF EXISTS chk_snapshots_vulnerable_pop,
    ADD CONSTRAINT chk_snapshots_vulnerable_pop CHECK (vulnerable_population_exposed >= 0),
    DROP CONSTRAINT IF EXISTS chk_snapshots_demand,
    ADD CONSTRAINT chk_snapshots_demand CHECK (calculated_protection_demand >= 0),
    DROP CONSTRAINT IF EXISTS chk_snapshots_capacity,
    ADD CONSTRAINT chk_snapshots_capacity CHECK (active_protection_capacity >= 0),
    DROP CONSTRAINT IF EXISTS chk_snapshots_protection_gap,
    ADD CONSTRAINT chk_snapshots_protection_gap CHECK (calculated_protection_gap >= 0);

-- ==============================================================================
-- 06 — INDEXES
-- ==============================================================================

-- Spatial PostGIS GIST Indexes
CREATE INDEX IF NOT EXISTS idx_wards_center_point ON wards USING GIST(center_point);
CREATE INDEX IF NOT EXISTS idx_wards_boundary ON wards USING GIST(boundary);
CREATE INDEX IF NOT EXISTS idx_protection_assets_location ON civic_protection_assets USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_healthcare_location ON healthcare_facilities USING GIST(location);

-- Relational Foreign Key & Analytical Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_ward_demographics_ward_year ON ward_demographics(ward_id, source_year DESC);
CREATE INDEX IF NOT EXISTS idx_protection_assets_legacy_id ON civic_protection_assets(legacy_id);
CREATE INDEX IF NOT EXISTS idx_protection_assets_ward ON civic_protection_assets(ward_id);
CREATE INDEX IF NOT EXISTS idx_protection_assets_type ON civic_protection_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_protection_assets_google_id ON civic_protection_assets(google_place_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_facilities_ward ON healthcare_facilities(ward_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_facilities_osm_id ON healthcare_facilities(osm_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_facilities_google_id ON healthcare_facilities(google_place_id);
CREATE INDEX IF NOT EXISTS idx_action_queue_ward ON municipal_action_queue(ward_id);
CREATE INDEX IF NOT EXISTS idx_action_queue_status ON municipal_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_municipal_alerts_ward ON municipal_alerts(ward_id);
CREATE INDEX IF NOT EXISTS idx_municipal_alerts_status ON municipal_alerts(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_municipal_alerts_validity ON municipal_alerts(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_weather_observations_loc_time ON weather_observations(location_key, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_forecasts_run ON weather_forecasts(location_key, forecast_date, forecast_run_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ward_risk_snapshots_ward_time ON ward_risk_snapshots(ward_id, snapshot_timestamp DESC);

-- ==============================================================================
-- 07 — TRIGGERS
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_wards_updated_at ON wards;
CREATE TRIGGER trg_wards_updated_at
BEFORE UPDATE ON wards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_ward_demographics_updated_at ON ward_demographics;
CREATE TRIGGER trg_ward_demographics_updated_at
BEFORE UPDATE ON ward_demographics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_civic_protection_assets_updated_at ON civic_protection_assets;
CREATE TRIGGER trg_civic_protection_assets_updated_at
BEFORE UPDATE ON civic_protection_assets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_municipal_action_queue_updated_at ON municipal_action_queue;
CREATE TRIGGER trg_municipal_action_queue_updated_at
BEFORE UPDATE ON municipal_action_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_municipal_alerts_updated_at ON municipal_alerts;
CREATE TRIGGER trg_municipal_alerts_updated_at
BEFORE UPDATE ON municipal_alerts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_healthcare_facilities_updated_at ON healthcare_facilities;
CREATE TRIGGER trg_healthcare_facilities_updated_at
BEFORE UPDATE ON healthcare_facilities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 08 — ROW LEVEL SECURITY (RLS) ACTIVATION
-- ==============================================================================
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_protection_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_risk_snapshots ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 09 — ACCESS POLICIES
-- ==============================================================================

-- Drop existing policies safely for rerun idempotency
DROP POLICY IF EXISTS "Allow public read on wards" ON wards;
DROP POLICY IF EXISTS "Allow public read on ward_demographics" ON ward_demographics;
DROP POLICY IF EXISTS "Allow public read on civic_protection_assets" ON civic_protection_assets;
DROP POLICY IF EXISTS "Allow public read on municipal_alerts" ON municipal_alerts;
DROP POLICY IF EXISTS "Allow public read on healthcare_facilities" ON healthcare_facilities;
DROP POLICY IF EXISTS "Allow public read on weather_observations" ON weather_observations;
DROP POLICY IF EXISTS "Allow public read on weather_forecasts" ON weather_forecasts;
DROP POLICY IF EXISTS "Allow staff read on municipal_action_queue" ON municipal_action_queue;
DROP POLICY IF EXISTS "Allow staff read on ward_risk_snapshots" ON ward_risk_snapshots;
DROP POLICY IF EXISTS "Allow public read on municipal_action_queue" ON municipal_action_queue;
DROP POLICY IF EXISTS "Allow public read on ward_risk_snapshots" ON ward_risk_snapshots;

-- 9.1 Public Read-Only Access (For General Citizen UI, Public Safety, and Discovery)
CREATE POLICY "Allow public read on wards" 
    ON wards FOR SELECT USING (true);

CREATE POLICY "Allow public read on ward_demographics" 
    ON ward_demographics FOR SELECT USING (true);

CREATE POLICY "Allow public read on civic_protection_assets" 
    ON civic_protection_assets FOR SELECT USING (is_active = true);

CREATE POLICY "Allow public read on healthcare_facilities" 
    ON healthcare_facilities FOR SELECT USING (true);

CREATE POLICY "Allow public read on weather_observations" 
    ON weather_observations FOR SELECT USING (true);

CREATE POLICY "Allow public read on weather_forecasts" 
    ON weather_forecasts FOR SELECT USING (true);

-- Only broadcast/active alerts are publicly readable; draft/scheduled/revoked are hidden
CREATE POLICY "Allow public read on municipal_alerts" 
    ON municipal_alerts FOR SELECT 
    USING (lifecycle_status IN ('Active', 'Resolved'));

-- 9.2 Privileged Operational Tables (Restricted to Authenticated Staff or Service-Role Backend)
-- Anonymous users CANNOT read these tables directly.
-- The Express backend uses SUPABASE_SERVICE_ROLE_KEY which automatically bypasses RLS.
CREATE POLICY "Allow staff read on municipal_action_queue" 
    ON municipal_action_queue FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow staff read on ward_risk_snapshots" 
    ON ward_risk_snapshots FOR SELECT TO authenticated USING (true);

-- Zero public write policies created: write mutations are reserved strictly for the server-side backend.

-- ==============================================================================
-- 10 — OPTIONAL DEVELOPMENT DEMO DATA
-- NOT OFFICIAL GOVERNMENT DATA
-- DO NOT USE AS REAL-WORLD OPERATIONAL DATA
-- ALL RECORDS EXPLICITLY TAGGED WITH provenance_type = 'DEMO_IMPORT'
-- ==============================================================================

-- 10.1 Demo Wards (Centroids only; boundary remains NULL until official GIS GeoJSON is imported)
INSERT INTO wards (id, name, zone, center_lat, center_lng, provenance_type, verified_status, source_attribution)
VALUES
('ward-21', 'Ward 21: Kasba Peth - Vishrambaug Wada', 'Heritage Core Zone', 18.5178, 73.8582, 'DEMO_IMPORT', FALSE, 'Demo Initialization Record'),
('ward-18', 'Ward 18: Hadapsar - Mundhwa', 'East Industrial Zone', 18.5020, 73.9270, 'DEMO_IMPORT', FALSE, 'Demo Initialization Record'),
('ward-25', 'Ward 25: Swargate - Parvati', 'South Transit Zone', 18.4980, 73.8560, 'DEMO_IMPORT', FALSE, 'Demo Initialization Record'),
('ward-14', 'Ward 14: Shivajinagar - Ghole Road', 'Central Pune Zone', 18.5314, 73.8446, 'DEMO_IMPORT', FALSE, 'Demo Initialization Record'),
('ward-08', 'Ward 08: Aundh - Baner', 'North-West Tech Zone', 18.5600, 73.8050, 'DEMO_IMPORT', FALSE, 'Demo Initialization Record'),
('ward-11', 'Ward 11: Kothrud - Bavdhan', 'West Residential Zone', 18.5074, 73.8077, 'DEMO_IMPORT', FALSE, 'Demo Initialization Record'),
('ward-05', 'Ward 05: Yerwada - Kalas - Dhanori', 'North Airport Zone', 18.5529, 73.8797, 'DEMO_IMPORT', FALSE, 'Demo Initialization Record')
ON CONFLICT (id) DO NOTHING;

-- 10.2 Demo Ward Demographics (Supporting Historical Census Modeling via (ward_id, source_year))
INSERT INTO ward_demographics (
    ward_id, 
    source_year, 
    population, 
    vulnerable_count, 
    tree_canopy_pct, 
    built_density_pct, 
    calculated_vulnerability_index, 
    calculated_uhi_offset_degc, 
    high_risk_micro_areas, 
    low_risk_buffer_areas, 
    provenance_type, 
    source_agency, 
    verified_status
)
VALUES
('ward-21', 2011, 178000, 46200, 12.0, 89.0, 82, 3.2, ARRAY['Mandai Wholesale Market', 'Phadke Haud Chowk'], ARRAY['Shaniwar Wada Garden Area'], 'DEMO_IMPORT', 'Demo Census 2011 Baseline', FALSE),
('ward-18', 2011, 230000, 57500, 16.0, 78.0, 75, 2.6, ARRAY['Gadital Bus Interchange', 'Mundhwa Industrial Strip'], ARRAY['Magarpatta Green Buffer'], 'DEMO_IMPORT', 'Demo Census 2011 Baseline', FALSE),
('ward-25', 2011, 188000, 48800, 19.0, 76.0, 71, 2.3, ARRAY['Jedhe Chowk / Swargate ST Stand'], ARRAY['Sarasbaug & Peshwe Park Corridor'], 'DEMO_IMPORT', 'Demo Census 2011 Baseline', FALSE),
('ward-14', 2011, 165000, 36300, 31.0, 68.0, 58, 1.4, ARRAY['FC Road Commercial Corridor'], ARRAY['COEP Riverfront Promenade'], 'DEMO_IMPORT', 'Demo Census 2011 Baseline', FALSE),
('ward-08', 2011, 210000, 37800, 38.0, 62.0, 48, 1.1, ARRAY['Parihar Chowk Plaza'], ARRAY['Baner Hill Bio-Diversity Reserve'], 'DEMO_IMPORT', 'Demo Census 2011 Baseline', FALSE),
('ward-11', 2011, 195000, 37050, 44.0, 56.0, 42, 0.9, ARRAY['Chandani Chowk Junction'], ARRAY['ARAI Vetal Tekdi Forest Ridge'], 'DEMO_IMPORT', 'Demo Census 2011 Baseline', FALSE),
('ward-05', 2011, 225000, 56250, 21.0, 74.0, 69, 2.1, ARRAY['Yerwada Gunjan Chowk Slum Clusters'], ARRAY['Bund Garden Riverside Buffer'], 'DEMO_IMPORT', 'Demo Census 2011 Baseline', FALSE)
ON CONFLICT (ward_id, source_year) DO NOTHING;

-- 10.3 Demo Civic Protection Assets (Idempotent seed using legacy_id conflict target)
INSERT INTO civic_protection_assets (
    legacy_id, 
    ward_id, 
    name, 
    asset_type, 
    category_label, 
    lat, 
    lng, 
    address, 
    operating_hours_text, 
    operational_status, 
    daily_capacity, 
    has_potable_drinking_water, 
    has_active_cooling, 
    amenities, 
    provenance_type, 
    verified_status
)
VALUES
('cw-01', 'ward-21', 'Kasba Peth Shaniwarwada Cooling Pavilion', 'cooling_centre', 'Air-Conditioned Public Respite', 18.5195, 73.8553, 'Near Shaniwar Wada North Gate, Kasba Peth', '10:00 AM - 08:00 PM', 'Available', 150, TRUE, TRUE, ARRAY['Air Conditioning', 'Chilled Drinking Water', 'Seating Benches'], 'DEMO_IMPORT', FALSE),
('cw-02', 'ward-21', 'Mandai Municipal Market Chilled Water Station', 'water_kiosk', 'Chilled Drinking Water Kiosk', 18.5146, 73.8566, 'Mahatma Phule Mandai Central Square', '06:00 AM - 10:00 PM', 'Available', 600, TRUE, FALSE, ARRAY['Chilled RO Water', 'ORS Sachets'], 'DEMO_IMPORT', FALSE),
('cw-03', 'ward-18', 'Gadital Bus Interchange Mist Shelter', 'shade_structure', 'Mist-Cooled High-Capacity Canopy', 18.5033, 73.9288, 'Gadital PMT Terminal, Hadapsar', '24 Hours', 'Available', 250, TRUE, FALSE, ARRAY['High-Pressure Water Misters', 'Shaded Seating'], 'DEMO_IMPORT', FALSE),
('cw-04', 'ward-18', 'Hadapsar Ward Office Public AC Hall', 'cooling_centre', 'Municipal AC Auditorium Sanctuary', 18.5015, 73.9312, 'Hadapsar Ward Office Campus, Pune-Solapur Road', '09:30 AM - 07:00 PM', 'Available', 180, TRUE, TRUE, ARRAY['Air Conditioning', 'First Aid Station'], 'DEMO_IMPORT', FALSE),
('cw-05', 'ward-25', 'Swargate Jedhe Chowk Hydration Point', 'water_kiosk', 'High-Flow RO Water Dispenser', 18.5005, 73.8582, 'Jedhe Chowk Sub-Station, Swargate', '24 Hours', 'Available', 800, TRUE, FALSE, ARRAY['Cold RO Water'], 'DEMO_IMPORT', FALSE),
('cw-06', 'ward-25', 'Sarasbaug Shaded Bio-Corridor Sanctuary', 'park_greenspace', 'Tree-Covered Microclimate Garden', 18.5008, 73.8529, 'Sarasbaug Lakeside Pavilion, Parvati', '06:00 AM - 08:30 PM', 'Available', 300, TRUE, FALSE, ARRAY['Dense Tree Canopy', 'Drinking Water Fountains'], 'DEMO_IMPORT', FALSE),
('cw-07', 'ward-14', 'FC Road Dnyaneshwar Paduka Chowk Water ATM', 'water_kiosk', 'Chilled Solar-Powered Water ATM', 18.5284, 73.8407, 'Fergusson College Road, Shivajinagar', '07:00 AM - 11:00 PM', 'Available', 500, TRUE, FALSE, ARRAY['Touchless Water Dispenser'], 'DEMO_IMPORT', FALSE),
('cw-08', 'ward-14', 'Sambhaji Park Shaded Green Sanctuary', 'park_greenspace', 'Dense Urban Tree Canopy Zone', 18.5186, 73.8465, 'Chhatrapati Sambhaji Garden, JM Road', '06:00 AM - 09:00 PM', 'Available', 400, TRUE, FALSE, ARRAY['Mature Canopy', 'Public Restrooms'], 'DEMO_IMPORT', FALSE)
ON CONFLICT (legacy_id) DO NOTHING;

-- 10.4 Demo Municipal Actions (Explicitly tagged as demonstration directives)
INSERT INTO municipal_action_queue (
    id, 
    ward_id, 
    ward_display_name, 
    priority, 
    action_title, 
    time_window_display, 
    scheduled_start, 
    scheduled_end, 
    rationale, 
    status, 
    assigned_department
)
VALUES
('act-1', 'ward-21', 'Ward 21: Kasba Peth', 'HIGH', 'Deploy Mobile Mist-Cooling & Water Tankers', '11:30 AM – 4:30 PM (Peak Solar)', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '5 hours', 'Critical WBGT (31.8°C), 89% paved surface mass, and 4,380 citizen protection gap.', 'In Progress', 'PMC Disaster Operations'),
('act-2', 'ward-18', 'Ward 18: Hadapsar', 'HIGH', 'Open 2 Additional Community AC Cooling Centers', '10:00 AM – 6:00 PM', NOW(), NOW() + INTERVAL '8 hours', '57,500 vulnerable industrial workers under uninsulated metal roofs with high gap.', 'Approved', 'PMC Social Welfare Cell'),
('act-3', 'ward-25', 'Ward 25: Swargate', 'HIGH', 'Erect Tensile Shading & Distribute Free ORS', '12:00 PM – 5:00 PM', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '7 hours', 'High transit pedestrian volume without continuous natural tree shade.', 'Review', 'PMC Urban Development'),
('act-4', 'ward-14', 'Ward 14: Shivajinagar', 'MEDIUM', 'Replenish Smart Water Kiosks along FC Road', '09:00 AM – 1:00 PM', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '1 hour', 'Heavy footfall corridor experiencing rapid daytime electrolyte depletion.', 'Completed', 'PMC Water Supply Department')
ON CONFLICT (id) DO NOTHING;

-- 10.5 Demo Municipal Alerts (Marked as non-official ThermaShield simulation)
INSERT INTO municipal_alerts (
    id, 
    ward_id, 
    severity, 
    lifecycle_status, 
    valid_from, 
    valid_until, 
    what, 
    where_location, 
    when_time, 
    why_reason, 
    action_directive, 
    is_imd_official_declaration, 
    issuing_authority
)
VALUES
('al-1', 'ward-21', 'Critical', 'Active', NOW(), NOW() + INTERVAL '8 hours', 'Extreme thermal stress with severe daytime protection shortfall.', 'Ward 21 (Kasba Peth - Mandai Wholesale Market)', 'Today, 11:30 AM – 4:30 PM (Peak Solar Load)', 'Dense asphalt massing (+3.2°C UHI elevation) combined with heavy informal crowd presence.', 'Deploy 3 mobile misting tankers and activate 24/7 cooling centers.', FALSE, 'ThermaShield Simulation Engine'),
('al-2', 'ward-18', 'High', 'Active', NOW(), NOW() + INTERVAL '6 hours', 'High daytime thermal strain across industrial worker sheds.', 'Ward 18 (Hadapsar - Gadital Interchange)', 'Today, 12:00 PM – 4:00 PM', 'Low tree canopy (16%) and metal roofing causing extreme radiant heat buildup.', 'Enforce mandatory construction cool-down pauses and open civic centers.', FALSE, 'ThermaShield Simulation Engine'),
('al-3', 'ward-25', 'Developing', 'Active', NOW(), NOW() + INTERVAL '6 hours', 'Elevated daytime sun exposure on intercity transit corridors.', 'Ward 25 (Swargate Bus Terminus & Jedhe Chowk)', 'Today, 1:00 PM – 5:00 PM', 'Paved transit concourse absorbing intense solar irradiance without shade.', 'Erect temporary fabric tensile canopies and verify cold drinking water taps.', FALSE, 'ThermaShield Simulation Engine')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 11 — VERIFICATION QUERIES (Read-Only)
-- ==============================================================================

-- 11.1 Verify PostGIS and UUID Extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('postgis', 'uuid-ossp');

-- 11.2 List All Created Tables in the Public Schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 11.3 Verify Spatial Columns and Registered Geometries
SELECT f_table_name, f_geometry_column, coord_dimension, srid, type 
FROM geometry_columns;

-- 11.4 Check Active Row Level Security Status Across Tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 11.5 Verify Unique Constraints (Deduplication, Multi-Run Forecasts, Demographics History)
SELECT conname, conrelid::regclass AS table_name, pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE n.nspname = 'public' AND contype = 'u'
ORDER BY table_name, conname;

-- 11.6 Verify Active RLS Policies and Restrictions
SELECT tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 11.7 Verify Demo Seed Record Counts
SELECT 
    (SELECT COUNT(*) FROM wards) AS total_wards,
    (SELECT COUNT(*) FROM ward_demographics) AS total_demographic_records,
    (SELECT COUNT(*) FROM civic_protection_assets) AS total_protection_assets,
    (SELECT COUNT(*) FROM municipal_action_queue) AS total_actions,
    (SELECT COUNT(*) FROM municipal_alerts) AS total_alerts;

-- ==============================================================================
-- END OF THERMASHIELD 360 FINAL SCHEMA
-- ==============================================================================
