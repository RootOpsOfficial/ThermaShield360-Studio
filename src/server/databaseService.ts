import { supabase } from './supabase.js';

export interface WardRow {
  id: string;
  name: string;
  zone: string;
  center_lat: number;
  center_lng: number;
  center_point?: any;
  boundary?: any;
  provenance_type: string;
  source_attribution: string;
  verified_status: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WardDemographicsRow {
  id: string;
  ward_id: string;
  source_year: number;
  population: number;
  vulnerable_count: number;
  tree_canopy_pct?: number | null;
  built_density_pct?: number | null;
  slum_settlement_pct?: number | null;
  outdoor_worker_est?: number | null;
  high_risk_micro_areas?: string[];
  low_risk_buffer_areas?: string[];
  calculated_vulnerability_index?: number | null;
  calculated_uhi_offset_degc?: number | null;
  calculation_version?: string;
  calculated_at?: string | null;
  provenance_type: string;
  source_agency: string;
  source_document_url?: string | null;
  verified_status: boolean;
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CivicProtectionAssetRow {
  id: string;
  legacy_id?: string | null;
  ward_id?: string | null;
  name: string;
  asset_type: 'cooling_centre' | 'water_kiosk' | 'shade_structure' | 'public_shelter' | 'park_greenspace';
  category_label: string;
  lat: number;
  lng: number;
  location?: any;
  address: string;
  operating_hours_text: string;
  is_active: boolean;
  operational_status: string;
  daily_capacity?: number | null;
  current_occupancy?: number | null;
  occupancy_updated_at?: string | null;
  has_potable_drinking_water: boolean;
  has_active_cooling: boolean;
  has_emergency_power_backup: boolean;
  has_wheelchair_ramp: boolean;
  amenities: string[];
  contact_phone?: string | null;
  is_emergency_activation_ready: boolean;
  google_place_id?: string | null;
  osm_node_id?: number | null;
  provenance_type: string;
  source_attribution: string;
  source_url?: string | null;
  verified_status: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MunicipalActionQueueRow {
  id: string;
  ward_id: string;
  ward_display_name: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action_title: string;
  time_window_display: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  rationale: string;
  status: 'Approved' | 'In Progress' | 'Review' | 'Completed' | 'Cancelled';
  assigned_department: string;
  assigned_team?: string | null;
  triggered_by_wbgt_threshold?: number | null;
  calculated_protection_deficit_trigger?: number | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MunicipalAlertRow {
  id: string;
  ward_id?: string | null;
  severity: 'Critical' | 'High' | 'Developing' | 'Normal';
  lifecycle_status: 'Draft' | 'Scheduled' | 'Active' | 'Resolved' | 'Expired' | 'Revoked';
  valid_from: string;
  valid_until?: string | null;
  what: string;
  where_location: string;
  when_time: string;
  why_reason: string;
  action_directive: string;
  target_channels: string[];
  is_imd_official_declaration: boolean;
  issuing_authority: string;
  dispatched_at: string;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthcareFacilityRow {
  id: string;
  ward_id?: string | null;
  name: string;
  facility_type: string;
  lat: number;
  lng: number;
  location?: any;
  address: string;
  phone?: string | null;
  website?: string | null;
  is_open_24x7: boolean;
  emergency_indicator: boolean;
  operational_status: string;
  directions_url?: string | null;
  osm_id?: number | null;
  google_place_id?: string | null;
  designated_heat_treatment_protocol: boolean;
  ors_stabilization_unit_available: boolean;
  provenance_type: string;
  source_attribution: string;
  verified_status: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeatherObservationRow {
  id: string;
  location_key: string;
  lat: number;
  lng: number;
  observed_at: string;
  temp_c: number;
  feels_like_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  wind_direction_deg?: number | null;
  solar_irradiance_w_m2?: number | null;
  uv_index?: number | null;
  pressure_hpa?: number | null;
  weather_code: number;
  weather_description?: string | null;
  calculated_wbgt_c?: number | null;
  calculated_utci_c?: number | null;
  calculated_heat_index_c?: number | null;
  calculation_engine_version?: string;
  provenance_type: string;
  source_attribution: string;
  created_at: string;
}

export interface WeatherForecastRow {
  id: string;
  location_key: string;
  forecast_date: string;
  day_name: string;
  forecast_run_timestamp: string;
  temp_max_c: number;
  temp_min_c: number;
  feels_like_max_c: number;
  humidity_avg_pct: number;
  solar_radiation_max_w_m2?: number | null;
  calculated_risk_level: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical';
  calculated_wbgt_max_c?: number | null;
  thermashield_heatwave_classification: string;
  official_imd_status?: string | null;
  peak_period_description?: string;
  summary_text?: string | null;
  provenance_type: string;
  source_attribution: string;
  created_at: string;
}

export interface WardRiskSnapshotRow {
  id: string;
  ward_id: string;
  snapshot_timestamp: string;
  calculated_risk_score: number;
  calculated_risk_level: string;
  observed_or_modelled_wbgt_c: number;
  ambient_temp_c: number;
  vulnerable_population_exposed: number;
  calculated_protection_demand: number;
  active_protection_capacity: number;
  calculated_protection_gap: number;
  calculated_fulfillment_pct: number;
  why_attention_rationale?: string | null;
  recommended_intervention?: string | null;
  is_official_government_metric: boolean;
  calculation_pipeline_name: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// DATABASE ACCESS SERVICE LAYER
// ------------------------------------------------------------------------------

/**
 * Fetch all administrative wards
 */
export async function getWards(): Promise<WardRow[]> {
  const { data, error } = await supabase
    .from('wards')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('[DatabaseService] getWards error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch a single ward by ID
 */
export async function getWardById(id: string): Promise<WardRow | null> {
  const { data, error } = await supabase
    .from('wards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[DatabaseService] getWardById error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

/**
 * Fetch ward demographics (optionally filtered by ward_id, sorted by source_year desc)
 */
export async function getWardDemographics(wardId?: string): Promise<WardDemographicsRow[]> {
  let query = supabase
    .from('ward_demographics')
    .select('*')
    .order('source_year', { ascending: false });

  if (wardId) {
    query = query.eq('ward_id', wardId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getWardDemographics error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch civic protection assets (cooling shelters, water kiosks, shaded structures)
 */
export async function getProtectionAssets(options?: {
  wardId?: string;
  assetType?: string;
  activeOnly?: boolean;
}): Promise<CivicProtectionAssetRow[]> {
  let query = supabase.from('civic_protection_assets').select('*');

  if (options?.activeOnly !== false) {
    query = query.eq('is_active', true);
  }

  if (options?.wardId) {
    query = query.eq('ward_id', options.wardId);
  }

  if (options?.assetType) {
    query = query.eq('asset_type', options.assetType);
  }

  query = query.order('created_at', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getProtectionAssets error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch civic protection assets mapped to Citizen ProtectionPoint type
 */
export async function getProtectionPointsForCitizen(): Promise<any[]> {
  const assets = await getProtectionAssets({ activeOnly: true });
  return assets.map((a) => {
    let pointType: 'water' | 'cooling' | 'shade' | 'healthcare' = 'shade';
    if (a.asset_type === 'cooling_centre') pointType = 'cooling';
    else if (a.asset_type === 'water_kiosk') pointType = 'water';

    return {
      id: a.legacy_id || a.id,
      name: a.name,
      type: pointType,
      categoryLabel: a.category_label,
      lat: Number(a.lat),
      lng: Number(a.lng),
      address: a.address,
      wardId: a.ward_id || 'ward-21',
      zone: a.ward_id ? `Zone ${a.ward_id.replace('ward-', '')}` : 'Central Zone',
      status: a.operational_status || 'Available',
      capacity: a.daily_capacity || 100,
      currentOccupancy: a.current_occupancy || 0,
      availableCapacity: Math.max(0, (a.daily_capacity || 100) - (a.current_occupancy || 0)),
      amenities: a.amenities || [],
      contact: a.contact_phone || undefined,
      operatingHours: a.operating_hours_text || '09:00 AM - 06:00 PM',
      isEmergencyReady: a.is_emergency_activation_ready,
    };
  });
}

/**
 * Fetch healthcare facilities
 */
export async function getHealthcareFacilities(options?: {
  wardId?: string;
}): Promise<HealthcareFacilityRow[]> {
  let query = supabase.from('healthcare_facilities').select('*');

  if (options?.wardId) {
    query = query.eq('ward_id', options.wardId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getHealthcareFacilities error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch active and resolved municipal alerts
 */
export async function getActiveMunicipalAlerts(options?: {
  wardId?: string;
  includeAllLifecycle?: boolean;
}): Promise<MunicipalAlertRow[]> {
  let query = supabase.from('municipal_alerts').select('*');

  if (!options?.includeAllLifecycle) {
    query = query.in('lifecycle_status', ['Active', 'Resolved']);
  }

  if (options?.wardId) {
    query = query.or(`ward_id.eq.${options.wardId},ward_id.is.null`);
  }

  query = query.order('dispatched_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getActiveMunicipalAlerts error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Insert a new municipal broadcast alert
 */
export async function addMunicipalAlert(
  alert: Omit<MunicipalAlertRow, 'created_at' | 'updated_at'>
): Promise<MunicipalAlertRow> {
  const { data, error } = await supabase
    .from('municipal_alerts')
    .insert([alert])
    .select()
    .single();

  if (error) {
    console.error('[DatabaseService] addMunicipalAlert error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

/**
 * Fetch municipal operational actions queue
 */
export async function getMunicipalActions(options?: {
  status?: string;
  wardId?: string;
}): Promise<MunicipalActionQueueRow[]> {
  let query = supabase.from('municipal_action_queue').select('*');

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.wardId) {
    query = query.eq('ward_id', options.wardId);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getMunicipalActions error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Update the status of an operational action item
 */
export async function updateMunicipalActionStatus(
  id: string,
  status: MunicipalActionQueueRow['status']
): Promise<MunicipalActionQueueRow | null> {
  const updates: Partial<MunicipalActionQueueRow> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'Completed') {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('municipal_action_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[DatabaseService] updateMunicipalActionStatus error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

/**
 * Fetch latest weather observations
 */
export async function getWeatherObservations(locationKey?: string): Promise<WeatherObservationRow[]> {
  let query = supabase
    .from('weather_observations')
    .select('*')
    .order('observed_at', { ascending: false })
    .limit(48);

  if (locationKey) {
    query = query.eq('location_key', locationKey);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getWeatherObservations error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Save / Upsert weather observations into Supabase weather_observations table
 * Handled with conflict resolution on (location_key, observed_at)
 */
export async function saveWeatherObservations(
  observations: Array<Omit<WeatherObservationRow, 'id' | 'created_at'>>
): Promise<void> {
  if (!observations || observations.length === 0) return;

  const { error } = await supabase
    .from('weather_observations')
    .upsert(observations, { onConflict: 'location_key,observed_at' });

  if (error) {
    console.warn('[DatabaseService] saveWeatherObservations error:', error.message);
  }
}

/**
 * Fetch latest weather forecasts
 */
export async function getWeatherForecasts(locationKey?: string): Promise<WeatherForecastRow[]> {
  let query = supabase
    .from('weather_forecasts')
    .select('*')
    .order('forecast_date', { ascending: true })
    .limit(16);

  if (locationKey) {
    query = query.eq('location_key', locationKey);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getWeatherForecasts error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Save / Upsert weather forecasts into Supabase weather_forecasts table
 * Handled with conflict resolution on (location_key, forecast_date, forecast_run_timestamp)
 */
export async function saveWeatherForecasts(
  forecasts: Array<Omit<WeatherForecastRow, 'id' | 'created_at'>>
): Promise<void> {
  if (!forecasts || forecasts.length === 0) return;

  const { error } = await supabase
    .from('weather_forecasts')
    .upsert(forecasts, { onConflict: 'location_key,forecast_date,forecast_run_timestamp' });

  if (error) {
    console.warn('[DatabaseService] saveWeatherForecasts error:', error.message);
  }
}

/**
 * Fetch ward risk snapshots for historical audit log and municipal analytics
 */
export async function getWardRiskSnapshots(wardId?: string): Promise<WardRiskSnapshotRow[]> {
  let query = supabase
    .from('ward_risk_snapshots')
    .select('*')
    .order('snapshot_timestamp', { ascending: false })
    .limit(50);

  if (wardId) {
    query = query.eq('ward_id', wardId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DatabaseService] getWardRiskSnapshots error:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return data || [];
}

/**
 * Save / Insert ward risk snapshots into Supabase ward_risk_snapshots table
 */
export async function saveWardRiskSnapshots(
  snapshots: Array<Omit<WardRiskSnapshotRow, 'id' | 'created_at'>>
): Promise<void> {
  if (!snapshots || snapshots.length === 0) return;

  const { error } = await supabase.from('ward_risk_snapshots').insert(snapshots);

  if (error) {
    console.warn('[DatabaseService] saveWardRiskSnapshots error:', error.message);
  }
}
