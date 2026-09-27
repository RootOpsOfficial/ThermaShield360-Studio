-- ==============================================================================
-- THERMASHIELD 360 — MASTER DATABASE SCHEMA
-- PostgreSQL 15+ with PostGIS Spatial Extension
-- Target Platform: Supabase PostgreSQL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 2. CUSTOM TYPES / ENUMS
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE risk_level_enum AS ENUM ('Low', 'Moderate', 'High', 'Extreme', 'Critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE facility_status_enum AS ENUM ('Available', 'Limited', 'Unavailable', 'Standby Ready', 'Operational', 'Active');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_source_type_enum AS ENUM ('OFFICIAL_PMC', 'IMD_AWS', 'OPEN_METEO', 'OSM_OVERPASS', 'GOOGLE_PLACES', 'SURVEY_OF_INDIA', 'DEMO_IMPORT', 'CALCULATED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_type_enum AS ENUM ('cooling', 'water', 'shade', 'healthcare');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_status_enum AS ENUM ('Approved', 'In Progress', 'Review', 'Completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE alert_severity_enum AS ENUM ('Critical', 'High', 'Developing', 'Normal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE healthcare_type_enum AS ENUM ('Hospital', 'Emergency Care', 'Urban Clinic', 'Heat Health Centre', 'Clinic', 'Doctor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. TABLE: wards (Master Spatial Ward Registry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wards (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'ward-21', 'ward-18'
    name VARCHAR(150) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    center_lat NUMERIC(9,6) NOT NULL,
    center_lng NUMERIC(9,6) NOT NULL,
    center_point GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography) STORED,
    boundary GEOMETRY(MultiPolygon, 4326),
    source_type data_source_type_enum DEFAULT 'DEMO_IMPORT',
    verified_status BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_wards_updated_at ON wards;
CREATE TRIGGER trg_wards_updated_at
BEFORE UPDATE ON wards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_wards_center_point ON wards USING GIST(center_point);
CREATE INDEX IF NOT EXISTS idx_wards_boundary ON wards USING GIST(boundary);

-- ------------------------------------------------------------------------------
-- 5. TABLE: ward_demographics (Vulnerability & Surface Cover)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ward_demographics (
    ward_id VARCHAR(50) PRIMARY KEY REFERENCES wards(id) ON DELETE CASCADE,
    population INT NOT NULL CHECK (population >= 0),
    vulnerable_count INT NOT NULL DEFAULT 0 CHECK (vulnerable_count >= 0),
    tree_canopy_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0 CHECK (tree_canopy_pct >= 0 AND tree_canopy_pct <= 100),
    built_density_pct NUMERIC(5,2) NOT NULL DEFAULT 0.0 CHECK (built_density_pct >= 0 AND built_density_pct <= 100),
    vulnerability_index INT NOT NULL DEFAULT 50 CHECK (vulnerability_index >= 0 AND vulnerability_index <= 100),
    uhi_offset_degc NUMERIC(4,2) NOT NULL DEFAULT 0.0 CHECK (uhi_offset_degc >= -5.0 AND uhi_offset_degc <= 10.0),
    high_risk_areas TEXT[] DEFAULT '{}',
    low_risk_areas TEXT[] DEFAULT '{}',
    source_type data_source_type_enum DEFAULT 'DEMO_IMPORT',
    census_year INT DEFAULT 2011,
    verified_status BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_ward_demographics_updated_at ON ward_demographics;
CREATE TRIGGER trg_ward_demographics_updated_at
BEFORE UPDATE ON ward_demographics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 6. TABLE: civic_protection_assets (Cooling, Water, Shade Infrastructure)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS civic_protection_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    legacy_id VARCHAR(50) UNIQUE,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    asset_type asset_type_enum NOT NULL,
    category_label VARCHAR(100) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
    address TEXT NOT NULL,
    zone VARCHAR(100),
    status facility_status_enum NOT NULL DEFAULT 'Available',
    capacity INT NOT NULL DEFAULT 100 CHECK (capacity >= 0),
    current_occupancy INT NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    available_capacity INT GENERATED ALWAYS AS (GREATEST(0, capacity - current_occupancy)) STORED,
    amenities TEXT[] DEFAULT '{}',
    contact_phone VARCHAR(50),
    operating_hours VARCHAR(100) NOT NULL DEFAULT '09:00 AM - 06:00 PM',
    is_emergency_ready BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    source_type data_source_type_enum DEFAULT 'DEMO_IMPORT',
    source_url TEXT,
    verified_status BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_civic_protection_assets_updated_at ON civic_protection_assets;
CREATE TRIGGER trg_civic_protection_assets_updated_at
BEFORE UPDATE ON civic_protection_assets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_protection_assets_location ON civic_protection_assets USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_protection_assets_ward ON civic_protection_assets(ward_id);
CREATE INDEX IF NOT EXISTS idx_protection_assets_type ON civic_protection_assets(asset_type);

-- ------------------------------------------------------------------------------
-- 7. TABLE: municipal_action_queue (Operational Command Directives)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_action_queue (
    id VARCHAR(50) PRIMARY KEY,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE RESTRICT,
    ward_display_name VARCHAR(150) NOT NULL,
    priority priority_level_enum NOT NULL DEFAULT 'MEDIUM',
    action_title VARCHAR(255) NOT NULL,
    time_window VARCHAR(100) NOT NULL,
    rationale TEXT NOT NULL,
    status action_status_enum NOT NULL DEFAULT 'Approved',
    assigned_team VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_municipal_action_queue_updated_at ON municipal_action_queue;
CREATE TRIGGER trg_municipal_action_queue_updated_at
BEFORE UPDATE ON municipal_action_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_action_queue_ward ON municipal_action_queue(ward_id);
CREATE INDEX IF NOT EXISTS idx_action_queue_status ON municipal_action_queue(status);

-- ------------------------------------------------------------------------------
-- 8. TABLE: municipal_alerts (Broadcast Heatwave Warnings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_alerts (
    id VARCHAR(50) PRIMARY KEY,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    severity alert_severity_enum NOT NULL DEFAULT 'High',
    what TEXT NOT NULL,
    where_location TEXT NOT NULL,
    when_time TEXT NOT NULL,
    why_reason TEXT NOT NULL,
    action_directive TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    target_channels TEXT[] DEFAULT ARRAY['CITIZEN_APP', 'SMS_BROADCAST', 'FIELD_CREW'],
    dispatched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_municipal_alerts_updated_at ON municipal_alerts;
CREATE TRIGGER trg_municipal_alerts_updated_at
BEFORE UPDATE ON municipal_alerts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_municipal_alerts_status ON municipal_alerts(status);
CREATE INDEX IF NOT EXISTS idx_municipal_alerts_severity ON municipal_alerts(severity);

-- ------------------------------------------------------------------------------
-- 9. TABLE: healthcare_facilities (Clinics, Hospitals, Heat Triage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS healthcare_facilities (
    id VARCHAR(100) PRIMARY KEY,
    ward_id VARCHAR(50) REFERENCES wards(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    facility_type healthcare_type_enum NOT NULL DEFAULT 'Hospital',
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    website TEXT,
    is_open_24x7 BOOLEAN DEFAULT FALSE,
    emergency_indicator BOOLEAN DEFAULT FALSE,
    status facility_status_enum DEFAULT 'Available',
    directions_url TEXT,
    osm_id BIGINT,
    source_type data_source_type_enum DEFAULT 'OSM_OVERPASS',
    source_detail VARCHAR(255),
    verified_status BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_healthcare_facilities_updated_at ON healthcare_facilities;
CREATE TRIGGER trg_healthcare_facilities_updated_at
BEFORE UPDATE ON healthcare_facilities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_healthcare_location ON healthcare_facilities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_healthcare_ward ON healthcare_facilities(ward_id);

-- ------------------------------------------------------------------------------
-- 10. TABLE: weather_observations (Persistent Weather & Thermal Cache)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_key VARCHAR(100) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    temp_c NUMERIC(4,1) NOT NULL,
    feels_like_c NUMERIC(4,1) NOT NULL,
    humidity_pct INT NOT NULL CHECK (humidity_pct >= 0 AND humidity_pct <= 100),
    wind_speed_kmh NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    wind_direction_deg INT DEFAULT 0,
    solar_irradiance_w_m2 INT DEFAULT 0,
    uv_index NUMERIC(3,1) DEFAULT 0.0,
    pressure_hpa NUMERIC(6,1) DEFAULT 1013.2,
    weather_code INT DEFAULT 0,
    weather_description VARCHAR(100),
    wbgt_c NUMERIC(4,1) NOT NULL,
    utci_c NUMERIC(4,1) NOT NULL,
    heat_index_c NUMERIC(4,1) NOT NULL,
    source_type data_source_type_enum DEFAULT 'OPEN_METEO',
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_obs_lookup ON weather_observations(location_key, observed_at DESC);

-- ------------------------------------------------------------------------------
-- 11. TABLE: weather_forecasts (Multi-Day Daily Forecast Curves)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weather_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_key VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    temp_max_c NUMERIC(4,1) NOT NULL,
    temp_min_c NUMERIC(4,1) NOT NULL,
    feels_like_max_c NUMERIC(4,1) NOT NULL,
    humidity_avg_pct INT NOT NULL,
    solar_radiation_max_w_m2 INT,
    risk_level risk_level_enum NOT NULL,
    heatwave_status VARCHAR(30) NOT NULL DEFAULT 'None',
    peak_period VARCHAR(50),
    summary TEXT,
    source_type data_source_type_enum DEFAULT 'OPEN_METEO',
    forecast_generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_forecast_loc_date UNIQUE (location_key, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_weather_forecast_date ON weather_forecasts(location_key, forecast_date);

-- ------------------------------------------------------------------------------
-- 12. TABLE: ward_risk_snapshots (Historical Municipal Audit & Trend Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ward_risk_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id VARCHAR(50) NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    snapshot_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    risk_score INT NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level risk_level_enum NOT NULL,
    wbgt_c NUMERIC(4,1) NOT NULL,
    ambient_temp_c NUMERIC(4,1) NOT NULL,
    protection_demand INT NOT NULL,
    protection_capacity INT NOT NULL,
    protection_gap INT NOT NULL,
    fulfillment_pct INT NOT NULL,
    why_attention TEXT,
    recommended_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_ward_time ON ward_risk_snapshots(ward_id, snapshot_time DESC);

-- ------------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_demographics ENABLE ROW LEVEL SECURITY;
ALTER TABLE civic_protection_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipal_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ward_risk_snapshots ENABLE ROW LEVEL SECURITY;

-- Clean drop if re-running
DROP POLICY IF EXISTS "Allow public read on wards" ON wards;
DROP POLICY IF EXISTS "Allow public read on ward_demographics" ON ward_demographics;
DROP POLICY IF EXISTS "Allow public read on civic_protection_assets" ON civic_protection_assets;
DROP POLICY IF EXISTS "Allow public read on municipal_alerts" ON municipal_alerts;
DROP POLICY IF EXISTS "Allow public read on healthcare_facilities" ON healthcare_facilities;
DROP POLICY IF EXISTS "Allow public read on weather_observations" ON weather_observations;
DROP POLICY IF EXISTS "Allow public read on weather_forecasts" ON weather_forecasts;
DROP POLICY IF EXISTS "Allow public read on municipal_action_queue" ON municipal_action_queue;
DROP POLICY IF EXISTS "Allow public read on ward_risk_snapshots" ON ward_risk_snapshots;

-- Public read policies
CREATE POLICY "Allow public read on wards" ON wards FOR SELECT USING (true);
CREATE POLICY "Allow public read on ward_demographics" ON ward_demographics FOR SELECT USING (true);
CREATE POLICY "Allow public read on civic_protection_assets" ON civic_protection_assets FOR SELECT USING (true);
CREATE POLICY "Allow public read on municipal_alerts" ON municipal_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read on healthcare_facilities" ON healthcare_facilities FOR SELECT USING (true);
CREATE POLICY "Allow public read on weather_observations" ON weather_observations FOR SELECT USING (true);
CREATE POLICY "Allow public read on weather_forecasts" ON weather_forecasts FOR SELECT USING (true);
CREATE POLICY "Allow public read on municipal_action_queue" ON municipal_action_queue FOR SELECT USING (true);
CREATE POLICY "Allow public read on ward_risk_snapshots" ON ward_risk_snapshots FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 14. SEED DATA (Explicitly marked as DEMO_IMPORT)
-- ------------------------------------------------------------------------------
INSERT INTO wards (id, name, zone, center_lat, center_lng, source_type, verified_status)
VALUES
('ward-21', 'Ward 21: Kasba Peth - Vishrambaug Wada', 'Heritage Core Zone', 18.5178, 73.8582, 'DEMO_IMPORT', FALSE),
('ward-18', 'Ward 18: Hadapsar - Mundhwa', 'East Industrial Zone', 18.5020, 73.9270, 'DEMO_IMPORT', FALSE),
('ward-25', 'Ward 25: Swargate - Parvati', 'South Transit Zone', 18.4980, 73.8560, 'DEMO_IMPORT', FALSE),
('ward-14', 'Ward 14: Shivajinagar - Ghole Road', 'Central Pune Zone', 18.5314, 73.8446, 'DEMO_IMPORT', FALSE),
('ward-08', 'Ward 08: Aundh - Baner', 'North-West Tech Zone', 18.5600, 73.8050, 'DEMO_IMPORT', FALSE),
('ward-11', 'Ward 11: Kothrud - Bavdhan', 'West Residential Zone', 18.5074, 73.8077, 'DEMO_IMPORT', FALSE),
('ward-05', 'Ward 05: Yerwada - Kalas - Dhanori', 'North Airport Zone', 18.5529, 73.8797, 'DEMO_IMPORT', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ward_demographics (ward_id, population, vulnerable_count, tree_canopy_pct, built_density_pct, vulnerability_index, uhi_offset_degc, high_risk_areas, low_risk_areas, source_type, verified_status)
VALUES
('ward-21', 178000, 46200, 12.0, 89.0, 82, 3.2, ARRAY['Mandai Wholesale Market', 'Phadke Haud Chowk'], ARRAY['Shaniwar Wada Garden Area'], 'DEMO_IMPORT', FALSE),
('ward-18', 230000, 57500, 16.0, 78.0, 75, 2.6, ARRAY['Gadital Bus Interchange', 'Mundhwa Industrial Strip'], ARRAY['Magarpatta Green Buffer'], 'DEMO_IMPORT', FALSE),
('ward-25', 188000, 48800, 19.0, 76.0, 71, 2.3, ARRAY['Jedhe Chowk / Swargate ST Stand'], ARRAY['Sarasbaug & Peshwe Park Corridor'], 'DEMO_IMPORT', FALSE),
('ward-14', 165000, 36300, 31.0, 68.0, 58, 1.4, ARRAY['FC Road Commercial Corridor'], ARRAY['COEP Riverfront Promenade'], 'DEMO_IMPORT', FALSE),
('ward-08', 210000, 37800, 38.0, 62.0, 48, 1.1, ARRAY['Parihar Chowk Plaza'], ARRAY['Baner Hill Bio-Diversity Reserve'], 'DEMO_IMPORT', FALSE),
('ward-11', 195000, 37050, 44.0, 56.0, 42, 0.9, ARRAY['Chandani Chowk Junction'], ARRAY['ARAI Vetal Tekdi Forest Ridge'], 'DEMO_IMPORT', FALSE),
('ward-05', 225000, 56250, 21.0, 74.0, 69, 2.1, ARRAY['Yerwada Gunjan Chowk Slum Clusters'], ARRAY['Bund Garden Riverside Buffer'], 'DEMO_IMPORT', FALSE)
ON CONFLICT (ward_id) DO NOTHING;

INSERT INTO municipal_action_queue (id, ward_id, ward_display_name, priority, action_title, time_window, rationale, status)
VALUES
('act-1', 'ward-21', 'Ward 21: Kasba Peth', 'HIGH', 'Deploy Mobile Mist-Cooling & Water Tankers', '11:30 AM – 4:30 PM (Peak Solar)', 'Critical WBGT (31.8°C), 89% paved surface mass, and 4,380 citizen protection gap.', 'In Progress'),
('act-2', 'ward-18', 'Ward 18: Hadapsar', 'HIGH', 'Open 2 Additional Community AC Cooling Centers', '10:00 AM – 6:00 PM', '57,500 vulnerable industrial workers under uninsulated metal roofs with high gap.', 'Approved'),
('act-3', 'ward-25', 'Ward 25: Swargate', 'HIGH', 'Erect Tensile Shading & Distribute Free ORS', '12:00 PM – 5:00 PM', 'High transit pedestrian volume without continuous natural tree shade.', 'Review'),
('act-4', 'ward-14', 'Ward 14: Shivajinagar', 'MEDIUM', 'Replenish Smart Water Kiosks along FC Road', '09:00 AM – 1:00 PM', 'Heavy footfall corridor experiencing rapid daytime electrolyte depletion.', 'Completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO municipal_alerts (id, ward_id, severity, what, where_location, when_time, why_reason, action_directive, status)
VALUES
('al-1', 'ward-21', 'Critical', 'Extreme thermal stress with severe daytime protection shortfall.', 'Ward 21 (Kasba Peth - Mandai Wholesale Market)', 'Today, 11:30 AM – 4:30 PM (Peak Solar Load)', 'Dense asphalt massing (+3.2°C UHI elevation) combined with heavy informal crowd presence.', 'Deploy 3 mobile misting tankers and activate 24/7 cooling centers.', 'Active'),
('al-2', 'ward-18', 'High', 'High daytime thermal strain across industrial worker sheds.', 'Ward 18 (Hadapsar - Gadital Interchange)', 'Today, 12:00 PM – 4:00 PM', 'Low tree canopy (16%) and metal roofing causing extreme radiant heat buildup.', 'Enforce mandatory construction cool-down pauses and open civic centers.', 'Active'),
('al-3', 'ward-25', 'Developing', 'Elevated daytime sun exposure on intercity transit corridors.', 'Ward 25 (Swargate Bus Terminus & Jedhe Chowk)', 'Today, 1:00 PM – 5:00 PM', 'Paved transit concourse absorbing intense solar irradiance without shade.', 'Erect temporary fabric tensile canopies and verify cold drinking water taps.', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Seed Protection Points from existing geoData.ts
INSERT INTO civic_protection_assets (legacy_id, ward_id, name, asset_type, category_label, lat, lng, address, status, capacity, operating_hours)
VALUES
('cw-01', 'ward-21', 'Kasba Peth Shaniwarwada Cooling Pavilion', 'cooling', 'Air-Conditioned Public Respite', 18.5195, 73.8553, 'Near Shaniwar Wada North Gate, Kasba Peth', 'Available', 150, '10:00 AM - 08:00 PM'),
('cw-02', 'ward-21', 'Mandai Municipal Market Chilled Water Station', 'water', 'Chilled Drinking Water Kiosk', 18.5146, 73.8566, 'Mahatma Phule Mandai Central Square', 'Available', 600, '06:00 AM - 10:00 PM'),
('cw-03', 'ward-18', 'Gadital Bus Interchange Mist Shelter', 'shade', 'Mist-Cooled High-Capacity Canopy', 18.5033, 73.9288, 'Gadital PMT Terminal, Hadapsar', 'Available', 250, '24 Hours'),
('cw-04', 'ward-18', 'Hadapsar Ward Office Public AC Hall', 'cooling', 'Municipal AC Auditorium Sanctuary', 18.5015, 73.9312, 'Hadapsar Ward Office Campus, Pune-Solapur Road', 'Available', 180, '09:30 AM - 07:00 PM'),
('cw-05', 'ward-25', 'Swargate Jedhe Chowk Hydration Point', 'water', 'High-Flow RO Water Dispenser', 18.5005, 73.8582, 'Jedhe Chowk Sub-Station, Swargate', 'Available', 800, '24 Hours'),
('cw-06', 'ward-25', 'Sarasbaug Shaded Bio-Corridor Sanctuary', 'shade', 'Tree-Covered Microclimate Garden', 18.5008, 73.8529, 'Sarasbaug Lakeside Pavilion, Parvati', 'Available', 300, '06:00 AM - 08:30 PM'),
('cw-07', 'ward-14', 'FC Road Dnyaneshwar Paduka Chowk Water ATM', 'water', 'Chilled Solar-Powered Water ATM', 18.5284, 73.8407, 'Fergusson College Road, Shivajinagar', 'Available', 500, '07:00 AM - 11:00 PM'),
('cw-08', 'ward-14', 'Sambhaji Park Shaded Green Sanctuary', 'shade', 'Dense Urban Tree Canopy Zone', 18.5186, 73.8465, 'Chhatrapati Sambhaji Garden, JM Road', 'Available', 400, '06:00 AM - 09:00 PM')
ON CONFLICT (legacy_id) DO NOTHING;
