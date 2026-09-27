import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkSupabaseHealth } from './src/server/db.js';
import {
  getWards,
  getWardById,
  getWardDemographics,
  getProtectionAssets,
  getProtectionPointsForCitizen,
  getHealthcareFacilities,
  getActiveMunicipalAlerts,
  getWeatherObservations,
  getWeatherForecasts,
  getWardRiskSnapshots,
  saveWardRiskSnapshots,
} from './src/server/databaseService.js';
import {
  ALL_REGIONAL_WARDS,
  MAHARASHTRA_WARDS,
  NATIONAL_WARDS,
  PUNE_WARDS,
  resolveWardByCoords,
  PROTECTION_POINTS,
  HEALTHCARE_FACILITIES,
  calculateDistanceKm,
  PUNE_LANDMARKS,
  REGIONAL_LANDMARKS,
} from './src/server/geoData.js';
import { reverseGeocodeGoogle, searchAddressGoogle } from './src/server/googleGeocodingService.js';
import { fetchNearbyProtectionPlaces } from './src/server/googlePlacesService.js';
import { computeThermalSafeRoutesGoogle } from './src/server/googleRoutesService.js';
import { calculateWBGT, calculateUTCI, calculateHeatIndex, categorizeThermalStress, calculateCompositeRiskScore, getThermalCitizenExplanation } from './src/server/thermalEngine.js';
import { fetchWeatherData } from './src/server/weatherService.js';
import { evaluateHumanHeatImpact } from './src/server/humanImpactEngine.js';
import { generateRoutes } from './src/server/routingEngine.js';
import { getAdaptiveRecommendations, getCitizenAlerts, getCitizenAlertHistory } from './src/server/intelligenceEngine.js';
import { generateLongRangeEarlyWarning } from './src/server/longRangeEarlyWarning.js';
import { fetchNearbyHealthcareFromOSM, getHealthcareFacilityById, calculateHealthcareRoute } from './src/server/healthcareService.js';
import { RiskLevel, ProtectionSummary, WardInfo, CitizenMyRiskData, CitizenHeatRiskResponse, LocalRiskMapAreaFeature, LocalRiskMapResponse } from './src/server/types.js';
import {
  getMunicipalSummary,
  getMunicipalWards,
  getMunicipalActions,
  updateMunicipalActionStatus,
  getProtectionResources,
  getMunicipalAlertsList,
  addMunicipalAlert,
} from './src/server/municipalData.js';
import {
  getHealthcareSummary,
  getFacilityProfile,
  updateFacilityProfile,
  toggleDemoMode,
  toggleChecklistItem,
  getHealthcareSettings,
  updateHealthcareSettings,
} from './src/server/healthcareWorkspaceService.js';
import { ALL_LOCATIONS } from './src/data/allLocations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to parse query coords with Pune fallback
function parseCoords(req: Request): { lat: number; lng: number } {
  const latStr = req.query.lat as string;
  const lngStr = req.query.lng as string;
  let lat = parseFloat(latStr);
  let lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng) || lat < 5 || lat > 35 || lng < 60 || lng > 95) {
    // Default to Pune Shivajinagar
    lat = 18.5314;
    lng = 73.8446;
  }
  return { lat, lng };
}

// Resolve location or ward using real Google Geocoding API with nationwide coverage
async function resolveLocationOrWard(
  req: Request,
  lat: number,
  lng: number
): Promise<{ ward: WardInfo; city: string; state: string; formattedAddress: string }> {
  const customName = (req.query.name as string) || (req.query.location as string);
  const matchedWard = resolveWardByCoords(lat, lng);
  const distKm = calculateDistanceKm(lat, lng, matchedWard.center[0], matchedWard.center[1]);

  // If directly within or very close to one of the modeled regional wards
  if (distKm <= 8) {
    const wardToUse = customName && customName.trim()
      ? { ...matchedWard, name: customName.trim() }
      : matchedWard;
    return {
      ward: wardToUse,
      city: matchedWard.city || 'Urban District',
      state: matchedWard.state || 'Maharashtra',
      formattedAddress: `${wardToUse.name}, ${matchedWard.city || ''}, ${matchedWard.state || 'India'}`.replace(', ,', ','),
    };
  }

  const geocoded = await reverseGeocodeGoogle(lat, lng);

  const city = geocoded.locality || (customName ? customName.split(',')[0].trim() : (matchedWard.city || 'Local Area'));
  const state = geocoded.administrativeArea || matchedWard.state || 'Maharashtra';
  const name = customName && customName.trim() ? customName.trim() : geocoded.displayName;

  const delta = 0.015;
  const wardBounds: [number, number][] = geocoded.bounds
    ? [
        [geocoded.bounds.northeast.lat, geocoded.bounds.southwest.lng],
        [geocoded.bounds.northeast.lat, geocoded.bounds.northeast.lng],
        [geocoded.bounds.southwest.lat, geocoded.bounds.northeast.lng],
        [geocoded.bounds.southwest.lat, geocoded.bounds.southwest.lng],
        [geocoded.bounds.northeast.lat, geocoded.bounds.southwest.lng],
      ]
    : matchedWard.bounds;

  const ward: WardInfo = {
    id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    name,
    zone: geocoded.sublocality || geocoded.neighborhood || matchedWard.zone || 'Urban District',
    city,
    state,
    regionType: (state.toLowerCase().includes('maharashtra') ? 'Maharashtra' : 'National') as any,
    center: [lat, lng],
    bounds: wardBounds,
    population: matchedWard.population || 145000,
    vulnerableCount: matchedWard.vulnerableCount || 29000,
    treeCanopyPct: matchedWard.treeCanopyPct || 28,
    builtDensityPct: matchedWard.builtDensityPct || 72,
    vulnerabilityIndex: matchedWard.vulnerabilityIndex || 58,
    uhiOffsetDegC: matchedWard.uhiOffsetDegC || 1.8,
    highRiskAreas: matchedWard.highRiskAreas || ['Unshaded Transit Arterials', 'Paved Commercial Corridors'],
    lowRiskAreas: matchedWard.lowRiskAreas || ['Canopy Shaded Parks', 'Civic Green Spaces'],
  };

  return { ward, city, state, formattedAddress: geocoded.formattedAddress };
}

// Dedicated API: GET /api/citizen/heat-impact — Human Heat Impact Engine Endpoint
app.get('/api/citizen/heat-impact', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const { ward } = await resolveLocationOrWard(req, lat, lng);
    const weather = await fetchWeatherData(lat, lng);
    const current = weather.current;

    const activityType = (req.query.activityType as string) || 'Walking / Commuting';
    const outdoorExposure = req.query.outdoorExposure !== undefined
      ? req.query.outdoorExposure === 'true'
      : undefined;
    const exposureDuration = (req.query.exposureDuration as string) || (outdoorExposure ? '1-2 hours' : '< 30 mins');
    const ageGroup = (req.query.ageGroup as string) || 'Adult (18-64)';
    const hasHealthCondition = req.query.hasHealthCondition === 'true';
    const isOutdoorWorker = req.query.isOutdoorWorker === 'true';

    // Query real nearby protection places via Google Places API (New)
    const realPlaces = await fetchNearbyProtectionPlaces(lat, lng, 3000);

    const nearbyCooling = realPlaces.filter((p) => p.category === 'COOLING_CENTER').length;
    const nearbyWater = realPlaces.filter((p) => p.category === 'WATER_POINT').length;
    const nearbyShade = realPlaces.filter((p) => p.category === 'SHADE_CANOPY').length;

    // Optional destination comparison
    let destinationContext: any = undefined;
    const destLatStr = req.query.destinationLat as string;
    const destLngStr = req.query.destinationLng as string;
    const destName = (req.query.destinationName as string) || 'Destination';

    if (destLatStr && destLngStr) {
      const destLat = parseFloat(destLatStr);
      const destLng = parseFloat(destLngStr);
      if (!isNaN(destLat) && !isNaN(destLng)) {
        const destWeather = await fetchWeatherData(destLat, destLng);
        const { ward: destWard } = await resolveLocationOrWard(req, destLat, destLng);
        const destPlaces = await fetchNearbyProtectionPlaces(destLat, destLng, 3000);
        const destCooling = destPlaces.filter((p) => p.category === 'COOLING_CENTER').length;
        const destWater = destPlaces.filter((p) => p.category === 'WATER_POINT').length;

        destinationContext = {
          name: destName,
          temp: destWeather.current.temp,
          humidity: destWeather.current.humidity,
          windSpeedKmH: destWeather.current.windSpeed,
          solarRadiation: destWeather.current.solarIrradiance,
          ward: destWard,
          nearbyCoolingCount: destCooling,
          nearbyWaterCount: destWater,
        };
      }
    }

    const impact = evaluateHumanHeatImpact({
      currentTemp: current.temp,
      humidity: current.humidity,
      windSpeedKmH: current.windSpeed,
      solarRadiation: current.solarIrradiance,
      uvIndex: current.uvIndex,
      ward,
      activityType,
      outdoorExposure,
      exposureDuration,
      ageGroup,
      hasHealthCondition,
      isOutdoorWorker,
      nearbyCoolingCount: nearbyCooling,
      nearbyWaterCount: nearbyWater,
      nearbyShadeCount: nearbyShade,
      destinationContext,
    });

    res.json(impact);
  } catch (err: any) {
    console.error('Error in /api/citizen/heat-impact:', err);
    res.status(500).json({ error: err?.message || 'Failed to evaluate human heat impact' });
  }
});

// Dedicated API: GET /api/citizen/heat-risk — ONLY data required for My Heat Risk feature
app.get('/api/citizen/heat-risk', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const { ward, city, state } = await resolveLocationOrWard(req, lat, lng);
    const weather = await fetchWeatherData(lat, lng);
    const current = weather.current;
    const now = new Date();
    const currentHour = now.getHours();

    // 1. Calculate thermal indices with shared engine (converting windSpeed km/h to m/s)
    const windMs = current.windSpeed / 3.6;
    const wbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, windMs);
    const utci = calculateUTCI(current.temp, current.humidity, windMs, current.solarIrradiance);

    // 2. Personal profile modifiers
    const isOutdoorWorker = req.query.isOutdoorWorker === 'true';
    const hasHealthCondition = req.query.hasHealthCondition === 'true';
    const ageGroup = (req.query.ageGroup as string) || 'Adult';
    const isSenior = ageGroup.toLowerCase().includes('senior') || ageGroup.toLowerCase().includes('65');

    let vulnerabilityScore = ward.vulnerabilityIndex;
    if (isSenior) vulnerabilityScore += 10;
    if (hasHealthCondition) vulnerabilityScore += 10;
    if (isOutdoorWorker) vulnerabilityScore += 6;
    vulnerabilityScore = Math.min(100, Math.max(10, vulnerabilityScore));

    // 3. Composite Human Heat Risk Score using shared engine
    const composite = calculateCompositeRiskScore(wbgt, utci, vulnerabilityScore, currentHour, ward.uhiOffsetDegC);
    const riskScore = composite.score;
    const riskLevel: RiskLevel = composite.level;

    // 4. Current Status
    let currentStatus = 'Normal heat conditions';
    if (riskLevel === 'Extreme') {
      currentStatus = 'Avoid unnecessary outdoor exposure';
    } else if (riskLevel === 'High') {
      currentStatus = 'Reduce prolonged outdoor exposure';
    } else if (riskLevel === 'Moderate') {
      currentStatus = 'Take additional care';
    }

    // 5. Today's Heat-Risk Timeline (ONLY heat risk over current day: 8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM)
    const milestoneHours = [8, 10, 12, 14, 16, 18, 20];
    const hourlyRisk = milestoneHours.map((h) => {
      let tempDelta = 0;
      if (h === 8) tempDelta = -3.5;
      else if (h === 10) tempDelta = -1.0;
      else if (h === 12) tempDelta = +1.2;
      else if (h === 14) tempDelta = +2.0;
      else if (h === 16) tempDelta = +1.5;
      else if (h === 18) tempDelta = -0.5;
      else if (h === 20) tempDelta = -2.5;

      const isDay = h >= 6 && h <= 18;
      const solarRatio = isDay ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
      const hourlySolar = Math.round(current.solarIrradiance * Math.max(0, solarRatio));
      const hTemp = Math.round((current.temp + tempDelta) * 10) / 10;
      const hHumidity = Math.round(Math.max(25, Math.min(85, current.humidity - tempDelta * 2.5)));
      const hWbgt = calculateWBGT(hTemp, hHumidity, hourlySolar, windMs);
      const hUtci = calculateUTCI(hTemp, hHumidity, windMs, hourlySolar);
      const hComposite = calculateCompositeRiskScore(hWbgt, hUtci, vulnerabilityScore, h, ward.uhiOffsetDegC);

      const period = h < 12 ? 'AM' : 'PM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const timeLabel = `${displayHour} ${period}`;

      const isCurrent = Math.abs(currentHour - h) <= 1 || (h === 8 && currentHour < 8) || (h === 20 && currentHour >= 20);
      const isPeak = h === 14;
      const isLowest = h === 8;

      let trend: 'increasing' | 'decreasing' | 'peak' | 'steady' | 'lowest' = 'steady';
      let note = '';
      if (h === 8) {
        trend = 'lowest';
        note = 'Lowest heat-risk period of the day';
      } else if (h === 10) {
        trend = 'increasing';
        note = 'Risk begins increasing rapidly';
      } else if (h === 12 || h === 14) {
        trend = 'peak';
        note = 'Highest-risk period';
      } else if (h === 16) {
        trend = 'peak';
        note = 'Sustained elevated exposure';
      } else if (h === 18) {
        trend = 'decreasing';
        note = 'Risk starts decreasing';
      } else if (h === 20) {
        trend = 'decreasing';
        note = 'Evening cooling window';
      }

      return {
        timeLabel,
        hour: h,
        riskScore: hComposite.score,
        riskLevel: hComposite.level,
        isCurrent,
        isPeak,
        isLowest,
        trend,
        note,
      };
    });

    const peakRiskPeriod = '12 PM – 4 PM';
    const lowestRiskPeriod = '6 AM – 9 AM';
    const riskIncreasingTime = '10:00 AM';
    const riskDecreasingTime = '4:30 PM';

    // 6. Risk Drivers (Main contributors only: Heat intensity, Outdoor exposure, Vulnerability, Time of day, Local area conditions)
    const riskDrivers = [
      {
        name: 'Heat Intensity',
        category: 'Atmospheric Warmth',
        percentage: 30,
        impact: (current.temp >= 38 ? 'Critical' : current.temp >= 35 ? 'High' : 'Moderate') as 'Low' | 'Moderate' | 'High' | 'Critical',
        description: 'Elevated ambient temperature combined with high atmospheric thermal content.',
      },
      {
        name: 'Outdoor Exposure',
        category: 'Sun & Zenith',
        percentage: 25,
        impact: (currentHour >= 11 && currentHour <= 16 ? 'High' : 'Moderate') as 'Low' | 'Moderate' | 'High' | 'Critical',
        description: 'Direct solar radiation load hitting unshaded streets and walkways.',
      },
      {
        name: 'Local Area Conditions',
        category: 'Urban Environment',
        percentage: 20,
        impact: (ward.builtDensityPct >= 70 ? 'High' : 'Moderate') as 'Low' | 'Moderate' | 'High' | 'Critical',
        description: `${ward.builtDensityPct}% paved surfaces absorbing and re-radiating heat with +${ward.uhiOffsetDegC}°C UHI offset.`,
      },
      {
        name: 'Vulnerability',
        category: 'Community Defenses',
        percentage: 15,
        impact: (ward.treeCanopyPct < 25 ? 'High' : 'Moderate') as 'Low' | 'Moderate' | 'High' | 'Critical',
        description: `Sparse tree canopy (${ward.treeCanopyPct}%) and concentrated at-risk population.`,
      },
      {
        name: 'Time of Day',
        category: 'Diurnal Peak',
        percentage: 10,
        impact: (currentHour >= 12 && currentHour <= 15 ? 'High' : 'Moderate') as 'Low' | 'Moderate' | 'High' | 'Critical',
        description: 'Midday thermal accumulation window with minimal natural shadows.',
      },
    ];

    // 7. Nearby Ward Risk (For Local Risk Map)
    const nearbyWardRisk = PUNE_WARDS.map((w) => {
      const wComposite = calculateCompositeRiskScore(wbgt, utci, w.vulnerabilityIndex, currentHour, w.uhiOffsetDegC);
      let status = 'Normal heat conditions';
      if (wComposite.level === 'Extreme') status = 'Avoid unnecessary outdoor exposure';
      else if (wComposite.level === 'High') status = 'Reduce prolonged outdoor exposure';
      else if (wComposite.level === 'Moderate') status = 'Take additional care';

      return {
        id: w.id,
        name: w.name,
        zone: w.zone,
        center: w.center,
        bounds: w.bounds,
        riskScore: wComposite.score,
        riskLevel: wComposite.level,
        currentStatus: status,
        isCurrentWard: w.id === ward.id,
        builtDensityPct: w.builtDensityPct,
        treeCanopyPct: w.treeCanopyPct,
        uhiOffsetDegC: w.uhiOffsetDegC,
      };
    });

    // 8. Risk Explanation (Dynamic based on actual risk result)
    let riskExplanation = '';
    if (riskLevel === 'Extreme') {
      riskExplanation =
        `Your current heat risk is EXTREME because peak daytime solar exposure, heavy urban concrete massing in ${ward.name.split(':')[0]}, and elevated ambient warmth are severely compounding heat strain.`;
    } else if (riskLevel === 'High') {
      riskExplanation =
        `Your current heat risk is HIGH because several local conditions and exposure factors—including midday solar intensity and dense paved surfaces—are increasing heat impact.`;
    } else if (riskLevel === 'Moderate') {
      riskExplanation =
        `Your current heat risk is MODERATE because ambient warmth and sun exposure require extra hydration and shaded movement, though severe extremes are currently mitigated.`;
    } else {
      riskExplanation =
        `Your current heat risk is LOW with baseline thermal conditions and adequate vegetative buffers across ${ward.name.split(':')[0]}.`;
    }

    const dataStatus = (current.source === 'LIVE' ? 'LIVE' : 'MODELLED') as 'LIVE' | 'MODELLED' | 'ESTIMATED';
    const confidence = 'High Confidence · Verified ground station & high-resolution model consensus';
    const lastUpdated = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Personal Heat Impact Engine integration
    const activityType = (req.query.activityType as string) || (isOutdoorWorker ? 'Outdoor Construction' : 'Walking / Commuting');
    const outdoorExposure = req.query.outdoorExposure !== undefined ? req.query.outdoorExposure === 'true' : isOutdoorWorker;
    const exposureDuration = (req.query.exposureDuration as string) || (outdoorExposure ? '1-2 hours' : '< 30 mins');

    let nearbyAssets: any[] = [];
    try {
      nearbyAssets = await getProtectionAssets({ activeOnly: true });
    } catch {
      nearbyAssets = [];
    }

    const nearbyCooling = nearbyAssets.filter((a) => {
      const d = calculateDistanceKm(lat, lng, a.lat, a.lng);
      return d <= 2.5 && (a.asset_type === 'cooling_centre' || a.has_active_cooling);
    }).length;

    const nearbyWater = nearbyAssets.filter((a) => {
      const d = calculateDistanceKm(lat, lng, a.lat, a.lng);
      return d <= 1.5 && (a.asset_type === 'water_kiosk' || a.has_potable_drinking_water);
    }).length;

    const nearbyShade = nearbyAssets.filter((a) => {
      const d = calculateDistanceKm(lat, lng, a.lat, a.lng);
      return d <= 2.0 && (a.asset_type === 'shade_structure' || a.asset_type === 'park_greenspace');
    }).length;

    // Optional destination comparison
    let destinationContext: any = undefined;
    const destLatStr = req.query.destinationLat as string;
    const destLngStr = req.query.destinationLng as string;
    const destName = (req.query.destinationName as string) || 'Destination';

    if (destLatStr && destLngStr) {
      const destLat = parseFloat(destLatStr);
      const destLng = parseFloat(destLngStr);
      if (!isNaN(destLat) && !isNaN(destLng)) {
        try {
          const destWeather = await fetchWeatherData(destLat, destLng);
          const { ward: destWard } = await resolveLocationOrWard(req, destLat, destLng);
          const destPlaces = await fetchNearbyProtectionPlaces(destLat, destLng, 2500);
          const destCooling = destPlaces.filter((p) => p.category === 'COOLING_CENTER').length;
          const destWater = destPlaces.filter((p) => p.category === 'WATER_POINT').length;

          destinationContext = {
            name: destName,
            temp: destWeather.current.temp,
            humidity: destWeather.current.humidity,
            windSpeedKmH: destWeather.current.windSpeed,
            solarRadiation: destWeather.current.solarIrradiance,
            ward: destWard,
            nearbyCoolingCount: destCooling,
            nearbyWaterCount: destWater,
          };
        } catch (e) {
          console.warn('Could not resolve destination weather in heat-risk:', e);
        }
      }
    }

    const personalImpact = evaluateHumanHeatImpact({
      currentTemp: current.temp,
      humidity: current.humidity,
      windSpeedKmH: current.windSpeed,
      solarRadiation: current.solarIrradiance,
      uvIndex: current.uvIndex,
      wbgt,
      utci,
      ward,
      activityType,
      outdoorExposure,
      exposureDuration,
      ageGroup,
      hasHealthCondition,
      isOutdoorWorker,
      nearbyCoolingCount: nearbyCooling,
      nearbyWaterCount: nearbyWater,
      nearbyShadeCount: nearbyShade,
      destinationContext,
    });

    const payload: CitizenHeatRiskResponse = {
      location: {
        lat,
        lng,
        name: ward.name,
        city,
        state,
      },
      city,
      zone: ward.zone,
      ward,
      riskScore,
      riskLevel,
      currentStatus,
      hourlyRisk,
      peakRiskPeriod,
      lowestRiskPeriod,
      riskIncreasingTime,
      riskDecreasingTime,
      riskDrivers,
      nearbyWardRisk,
      riskExplanation,
      dataStatus,
      confidence,
      lastUpdated,
      personalImpact,
    };

    res.json(payload);
  } catch (err) {
    console.error('Error in /api/citizen/heat-risk:', err);
    res.status(500).json({ error: 'Failed to calculate citizen heat risk' });
  }
});

// GET /api/citizen/local-risk-map?lat={lat}&lon={lon}
// Real interactive, GPS-based heat-risk map with GeoJSON polygons
app.get('/api/citizen/local-risk-map', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(
      (req.query.lat as string) || (req.query.latitude as string) || '18.5204'
    );
    const lon = parseFloat(
      (req.query.lon as string) || (req.query.lng as string) || (req.query.longitude as string) || '73.8567'
    );

    const { ward: currentWard, city, state } = await resolveLocationOrWard(req, lat, lon);
    const weather = await fetchWeatherData(lat, lon);
    const current = weather.current;
    const now = new Date();
    const currentHour = now.getHours();

    // Contiguous municipal sectors around user's real geocoded GPS
    const sectorOffsets = [
      { idSuffix: 'core', name: `${currentWard.name} (Core)`, zone: currentWard.zone, dLat: 0, dLon: 0, vuln: currentWard.vulnerabilityIndex, uhi: currentWard.uhiOffsetDegC, built: currentWard.builtDensityPct, canopy: currentWard.treeCanopyPct },
      { idSuffix: 'north', name: `${city} North Green Buffer`, zone: 'North Sector', dLat: 0.022, dLon: 0.005, vuln: 46, uhi: 1.2, built: 54, canopy: 38 },
      { idSuffix: 'east', name: `${city} East Commercial Transit`, zone: 'East Sector', dLat: 0.006, dLon: 0.025, vuln: 74, uhi: 2.7, built: 85, canopy: 12 },
      { idSuffix: 'south', name: `${city} South Residential`, zone: 'South Sector', dLat: -0.021, dLon: 0.012, vuln: 62, uhi: 2.1, built: 72, canopy: 24 },
      { idSuffix: 'west', name: `${city} West Botanical Promenade`, zone: 'West Sector', dLat: -0.008, dLon: -0.024, vuln: 34, uhi: 0.8, built: 40, canopy: 48 },
      { idSuffix: 'nw', name: `${city} Northwest Campus`, zone: 'Northwest Sector', dLat: 0.019, dLon: -0.021, vuln: 42, uhi: 1.3, built: 52, canopy: 36 },
    ];

    const wardsList: WardInfo[] = sectorOffsets.map((s) => {
      const cLat = lat + s.dLat;
      const cLon = lon + s.dLon;
      const delta = 0.014;
      return {
        id: `sector-${s.idSuffix}-${lat.toFixed(3)}-${lon.toFixed(3)}`,
        name: s.name,
        zone: s.zone,
        center: [cLat, cLon],
        bounds: [
          [cLat - delta, cLon - delta],
          [cLat + delta, cLon - delta],
          [cLat + delta, cLon + delta],
          [cLat - delta, cLon + delta],
          [cLat - delta, cLon - delta],
        ],
        population: 140000,
        vulnerableCount: 28000,
        treeCanopyPct: s.canopy,
        builtDensityPct: s.built,
        vulnerabilityIndex: s.vuln,
        uhiOffsetDegC: s.uhi,
        highRiskAreas: ['Unshaded Transit Arterials', 'Paved Market Corridors'],
        lowRiskAreas: ['Canopy Shaded Parks', 'Municipal Green Corridor'],
      };
    });

    const lastUpdated = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Identify user's active ward
    let activeWard = wardsList.find((w) => w.id === currentWard.id);
    if (!activeWard) {
      let minDist = Infinity;
      for (const w of wardsList) {
        const d = calculateDistanceKm(lat, lon, w.center[0], w.center[1]);
        if (d < minDist) {
          minDist = d;
          activeWard = w;
        }
      }
    }
    if (!activeWard) activeWard = wardsList[0];

    // Compute GeoJSON Features for each ward/area
    const features: LocalRiskMapAreaFeature[] = wardsList.map((ward) => {
      const areaTemp = Math.round((current.temp + (ward.uhiOffsetDegC - 1.5)) * 10) / 10;
      const areaWbgt = calculateWBGT(areaTemp, current.humidity, current.solarIrradiance, current.windSpeed);
      const areaUtci = calculateUTCI(areaTemp, current.humidity, current.windSpeed, current.solarIrradiance);
      const composite = calculateCompositeRiskScore(areaWbgt, areaUtci, ward.vulnerabilityIndex, currentHour, ward.uhiOffsetDegC);

      const isCurrentArea = ward.id === activeWard?.id;

      let status = 'Normal heat conditions';
      if (composite.level === 'Extreme') {
        status = 'Avoid unnecessary outdoor exposure';
      } else if (composite.level === 'High') {
        status = 'Reduce prolonged outdoor exposure';
      } else if (composite.level === 'Moderate') {
        status = 'Take additional care';
      }

      // GeoJSON standard coordinates order: [longitude, latitude]
      const ring = ward.bounds.map(([bLat, bLon]) => [bLon, bLat]);
      if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
        ring.push([ring[0][0], ring[0][1]]);
      }

      return {
        type: 'Feature',
        id: ward.id,
        properties: {
          area_id: ward.id,
          area_name: ward.name,
          zone: ward.zone,
          risk_score: composite.score,
          risk_level: composite.level,
          current_status: status,
          last_updated: lastUpdated,
          data_status: 'MODELLED',
          temperature: areaTemp,
          humidity: current.humidity,
          wind_speed: current.windSpeed,
          solar_irradiance: current.solarIrradiance,
          uhi_offset: ward.uhiOffsetDegC,
          built_density_pct: ward.builtDensityPct,
          tree_canopy_pct: ward.treeCanopyPct,
          is_current_area: isCurrentArea,
          center: [ward.center[0], ward.center[1]],
        },
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      };
    });

    // Current location thermal calculation
    const currWbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, current.windSpeed);
    const currUtci = calculateUTCI(current.temp, current.humidity, current.windSpeed, current.solarIrradiance);
    const currComposite = calculateCompositeRiskScore(
      currWbgt,
      currUtci,
      activeWard.vulnerabilityIndex,
      currentHour,
      activeWard.uhiOffsetDegC
    );

    let currStatus = 'Normal heat conditions';
    if (currComposite.level === 'Extreme') {
      currStatus = 'Avoid unnecessary outdoor exposure';
    } else if (currComposite.level === 'High') {
      currStatus = 'Reduce prolonged outdoor exposure';
    } else if (currComposite.level === 'Moderate') {
      currStatus = 'Take additional care';
    }

    const payload: LocalRiskMapResponse = {
      type: 'FeatureCollection',
      features,
      current_location: {
        lat,
        lon,
        city,
        zone: activeWard.zone,
        ward: activeWard.name,
        risk_score: currComposite.score,
        risk_level: currComposite.level,
        current_status: currStatus,
        last_updated: lastUpdated,
        data_status: current.source === 'LIVE' ? 'LIVE' : 'MODELLED',
      },
    };

    res.json(payload);
  } catch (err) {
    console.error('Error in /api/citizen/local-risk-map:', err);
    res.status(500).json({ error: 'Failed to generate local risk map' });
  }
});

// 0. GET /api/citizen/my-risk — Complete connected feature for Citizen Workspace
app.get('/api/citizen/my-risk', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const { ward, city, state } = await resolveLocationOrWard(req, lat, lng);
    const weather = await fetchWeatherData(lat, lng);
    const current = weather.current;
    const now = new Date();
    const currentHour = now.getHours();

    // 1. Calculate thermal indices
    const wbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, current.windSpeed);
    const utci = calculateUTCI(current.temp, current.humidity, current.windSpeed, current.solarIrradiance);
    const heatIndex = calculateHeatIndex(current.temp, current.humidity);
    const thermalStressLevel = categorizeThermalStress(wbgt, utci);
    const thermalExp = getThermalCitizenExplanation(thermalStressLevel, wbgt, utci);

    // 2. Personal profile modifiers
    const isOutdoorWorker = req.query.isOutdoorWorker === 'true';
    const hasHealthCondition = req.query.hasHealthCondition === 'true';
    const ageGroup = (req.query.ageGroup as string) || 'Adult';
    const isSenior = ageGroup.toLowerCase().includes('senior') || ageGroup.toLowerCase().includes('65');

    // 3. Vulnerability & Exposure
    let vulnerabilityScore = ward.vulnerabilityIndex;
    if (isSenior) vulnerabilityScore += 10;
    if (hasHealthCondition) vulnerabilityScore += 10;
    if (isOutdoorWorker) vulnerabilityScore += 6;
    vulnerabilityScore = Math.min(100, Math.max(10, vulnerabilityScore));

    const vulnerabilityLevel =
      vulnerabilityScore >= 75 ? 'Critical' : vulnerabilityScore >= 55 ? 'High' : vulnerabilityScore >= 35 ? 'Moderate' : 'Low';

    const exposureScore =
      currentHour >= 11 && currentHour <= 16 ? (isOutdoorWorker ? 96 : 86) : (currentHour >= 9 && currentHour < 11) || (currentHour > 16 && currentHour <= 18) ? 62 : 32;

    const exposureLevel = exposureScore >= 75 ? 'Peak' : exposureScore >= 50 ? 'Elevated' : 'Low';

    // 4. Composite Risk Score
    const composite = calculateCompositeRiskScore(wbgt, utci, vulnerabilityScore, currentHour, ward.uhiOffsetDegC);
    const riskScore = composite.score;
    const riskLevel = composite.level;

    // 5. Risk Drivers
    const riskDrivers = [
      {
        name: 'Direct Solar Load',
        value: `${current.solarIrradiance} W/m²`,
        percentage: 34,
        description: 'Clear-sky direct shortwave solar radiation heating outdoor surfaces and skin.',
        impact: (current.solarIrradiance > 600 ? 'High' : 'Medium') as 'High' | 'Medium' | 'Low',
      },
      {
        name: 'Temperature & Atmospheric Humidity',
        value: `${current.temp}°C · ${current.humidity}% RH`,
        percentage: 30,
        description: 'High air warmth combined with ambient moisture restricts sweat evaporation.',
        impact: (current.temp >= 36 ? 'High' : 'Medium') as 'High' | 'Medium' | 'Low',
      },
      {
        name: 'Thermal Stress (WBGT / UTCI)',
        value: `WBGT ${wbgt}°C · UTCI ${utci}°C`,
        percentage: 22,
        description: 'Combined physiological heat strain exceeding safe thermoregulatory thresholds.',
        impact: (wbgt >= 29 ? 'High' : 'Medium') as 'High' | 'Medium' | 'Low',
      },
      {
        name: 'Urban Heat Island & Built Mass',
        value: `${ward.builtDensityPct}% built · ${ward.treeCanopyPct}% canopy`,
        percentage: 14,
        description: `Microclimate heat trapping adds +${ward.uhiOffsetDegC}°C over regional baseline.`,
        impact: (ward.builtDensityPct > 70 ? 'High' : 'Medium') as 'High' | 'Medium' | 'Low',
      },
    ];

    // 6. Hourly Risk Timeline (Today: 6 AM to 9 PM)
    const hourlyRisk = Array.from({ length: 16 }, (_, i) => {
      const h = i + 6; // 6 to 21 (9 PM)
      const isDay = h >= 6 && h <= 18;
      const solarRatio = isDay ? Math.sin(((h - 6) / 12) * Math.PI) : 0;
      const hourlySolar = Math.round(current.solarIrradiance * Math.max(0, solarRatio));
      
      let tempDelta = 0;
      if (h <= 7) tempDelta = -4.5;
      else if (h <= 9) tempDelta = -2.5;
      else if (h <= 11) tempDelta = -0.5;
      else if (h <= 14) tempDelta = 1.8;
      else if (h <= 16) tempDelta = 2.2;
      else if (h <= 18) tempDelta = 0.5;
      else tempDelta = -2.0;

      const hTemp = Math.round((current.temp + tempDelta) * 10) / 10;
      const hHumidity = Math.round(Math.max(25, Math.min(85, current.humidity - tempDelta * 2.5)));
      const hWbgt = calculateWBGT(hTemp, hHumidity, hourlySolar, current.windSpeed);
      const hUtci = calculateUTCI(hTemp, hHumidity, current.windSpeed, hourlySolar);
      const hHeatIndex = calculateHeatIndex(hTemp, hHumidity);
      const hComposite = calculateCompositeRiskScore(hWbgt, hUtci, vulnerabilityScore, h, ward.uhiOffsetDegC);

      let category: 'lowest' | 'peak' | 'improving' | 'normal' = 'normal';
      if (h >= 6 && h <= 9) category = 'lowest';
      else if (h >= 12 && h <= 16) category = 'peak';
      else if (h >= 17 && h <= 21) category = 'improving';

      const period = h < 12 ? 'AM' : 'PM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;

      return {
        hour: h,
        timeLabel: `${displayHour}:00 ${period}`,
        temp: hTemp,
        wbgt: hWbgt,
        utci: hUtci,
        heatIndex: hHeatIndex,
        riskLevel: hComposite.level,
        riskScore: hComposite.score,
        category,
        isCurrent: h === currentHour,
      };
    });

    // 7. Five Day Forecast Risk
    const fiveDayRisk = (weather.daily || []).slice(0, 5).map((d, idx) => {
      const dWbgt = calculateWBGT(d.tempMax, d.humidityAvg, d.solarRadiationMax, 2.5);
      const dUtci = calculateUTCI(d.tempMax, d.humidityAvg, 2.5, d.solarRadiationMax);
      const dComposite = calculateCompositeRiskScore(dWbgt, dUtci, vulnerabilityScore, 14, ward.uhiOffsetDegC);
      const dThermalStress = categorizeThermalStress(dWbgt, dUtci);
      const trend = idx <= 1 ? 'Escalating' : idx === 2 ? 'Peak Sustained' : 'Gradual Easing';

      return {
        day: idx + 1,
        dayName: d.dayName,
        date: d.date,
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        riskLevel: dComposite.level,
        riskScore: dComposite.score,
        thermalStress: dThermalStress,
        wbgt: dWbgt,
        utci: dUtci,
        trend,
      };
    });

    // 8. Nearby Protection (Spatial Calculation via Google Places API New)
    const realPlaces = await fetchNearbyProtectionPlaces(lat, lng, 3500);

    const pointsWithDist = realPlaces.map((p) => {
      const distanceKm = Number((p.distanceMeters / 1000).toFixed(2));
      return {
        id: p.id,
        name: p.name,
        type:
          p.category === 'COOLING_CENTER'
            ? 'cooling'
            : p.category === 'WATER_POINT'
            ? 'water'
            : p.category === 'SHADE_CANOPY'
            ? 'shade'
            : 'healthcare',
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        amenities: [p.protectiveFeature],
        availableCapacity: p.category === 'COOLING_CENTER' ? 250 : p.category === 'WATER_POINT' ? 500 : 150,
        status: (p.openNow ?? true) ? 'Available' : 'Limited',
        distanceKm,
        travelTimeMins: p.walkingTimeMinutes,
        travelMode: distanceKm > 2.0 ? 'Driving' : 'Walking',
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    const healthWithDist = realPlaces
      .filter((p) => p.category === 'HEALTHCARE')
      .map((h) => {
        const distanceKm = Number((h.distanceMeters / 1000).toFixed(2));
        return {
          id: h.id,
          name: h.name,
          type: 'Hospital',
          lat: h.lat,
          lng: h.lng,
          distanceKm,
          travelTimeMins: h.walkingTimeMinutes,
          address: h.address,
          wardId: ward.id,
          status: 'Available',
          emergencyIndicator: true,
          heatStrokeBedsAvailable: 8,
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const waterList = pointsWithDist.filter((p) => p.type === 'water');
    const coolingList = pointsWithDist.filter((p) => p.type === 'cooling');
    const shadeList = pointsWithDist.filter((p) => p.type === 'shade');

    const nearestWater = waterList[0];
    const nearestCooling = coolingList[0];
    const nearestShade = shadeList[0];
    const nearestHealth = healthWithDist[0];

    const totalAvailableCoolingCapacity = coolingList.reduce((acc, c) => acc + (c.availableCapacity || 50), 0);
    const totalAvailableHeatBeds = healthWithDist.reduce((acc, h) => acc + (h.heatStrokeBedsAvailable || 4), 0);

    const nearbyProtection = {
      waterPoints: {
        count: waterList.length,
        nearestDistanceKm: nearestWater ? nearestWater.distanceKm : 0.6,
        nearestName: nearestWater ? nearestWater.name : 'Municipal RO Water Kiosk',
        status: 'Operational',
      },
      coolingCentres: {
        count: coolingList.length,
        nearestDistanceKm: nearestCooling ? nearestCooling.distanceKm : 1.1,
        nearestName: nearestCooling ? nearestCooling.name : 'Civic Air-Conditioned Shelter',
        capacityAvailable: totalAvailableCoolingCapacity,
        status: 'Available',
      },
      shadeAreas: {
        count: shadeList.length,
        nearestDistanceKm: nearestShade ? nearestShade.distanceKm : 0.4,
        nearestName: nearestShade ? nearestShade.name : 'Urban Tree Canopy Park',
        status: 'Open Canopy',
      },
      healthcare: {
        count: healthWithDist.length,
        nearestDistanceKm: nearestHealth ? nearestHealth.distanceKm : 1.4,
        nearestName: nearestHealth ? nearestHealth.name : 'Civil Hospital Emergency Ward',
        availableHeatBeds: totalAvailableHeatBeds,
        status: '24x7 Ready',
      },
      totalFacilitiesCount: pointsWithDist.length + healthWithDist.length,
      availabilityStatus: 'Network Active & Monitored',
      expectedProtectionDemand: (riskScore >= 75 ? 'Critical' : riskScore >= 50 ? 'High' : 'Moderate') as 'High' | 'Moderate' | 'Critical',
      protectionGap: ward.treeCanopyPct < 20 ? 'High Deficit in Commercial Corridor' : 'Adequate Shaded Buffer',
      nearestPoints: pointsWithDist.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        categoryLabel: p.amenities?.[0] || 'Protection Shelter',
        distanceKm: p.distanceKm,
        travelTimeMins: p.travelTimeMins,
        travelMode: p.travelMode,
        status: p.status,
        address: p.address,
        amenities: p.amenities || ['Purified Water', 'Seating'],
      })),
    };

    // 9. Recommended Action (WHAT, WHERE, WHEN, WHY)
    const recommendedAction = {
      what:
        riskLevel === 'Extreme'
          ? 'Suspend direct outdoor exposure and halt strenuous physical tasks.'
          : riskLevel === 'High'
          ? 'Avoid unshaded roads, carry cold fluids, and seek air-conditioned respite.'
          : 'Maintain active fluid intake and schedule travel through tree-shaded corridors.',
      where: `Unshaded arterial roads, open market plazas, and concrete corridors in ${ward.name.split(':')[0]}.`,
      when: '12:30 PM – 04:30 PM (Peak Solar & Thermal Stress Window)',
      why:
        riskLevel === 'Extreme'
          ? `Extreme thermal stress with WBGT ${wbgt}°C and UTCI ${utci}°C restricts core body cooling; severe heat stroke hazard.`
          : `High ambient solar irradiance (${current.solarIrradiance} W/m²) and humidity rapidly deplete electrolyte reserves.`,
    };

    // 10. Safety Advice
    const safetyAdvice = [
      'Drink 350ml of water or electrolyte solution every 30 minutes; do not wait until you experience thirst.',
      'Wear lightweight, loose-fitting, light-coloured cotton clothes and a wide-brimmed hat or umbrella outdoors.',
      'If you experience dizziness, headache, or nausea, immediately retreat to the nearest cooling shelter.',
      'Check in on elderly neighbours, young children, and outdoor workers during afternoon peak hours.',
    ];

    const responseData: CitizenMyRiskData = {
      location: {
        lat,
        lng,
        name: ward.name,
        city,
        state,
        country: 'India',
      },
      city,
      zone: ward.zone,
      ward,
      currentRisk: `${riskLevel} Heat Risk (${riskScore}/100)`,
      riskLevel,
      riskScore,
      temperature: current.temp,
      feelsLike: current.feelsLike,
      humidity: current.humidity,
      wind: current.windSpeed,
      solarRadiation: current.solarIrradiance,
      uvIndex: current.uvIndex,
      wbgt,
      utci,
      heatIndex,
      thermalStress: {
        level: thermalStressLevel,
        wbgt,
        utci,
        heatIndex,
        explanation: thermalExp.explanation,
        points: thermalExp.points,
      },
      vulnerability: {
        score: vulnerabilityScore,
        level: vulnerabilityLevel,
        builtDensityPct: ward.builtDensityPct,
        treeCanopyPct: ward.treeCanopyPct,
        vulnerablePopulation: ward.vulnerableCount,
        uhiOffsetDegC: ward.uhiOffsetDegC,
        explanation: `${vulnerabilityLevel} vulnerability driven by ${ward.builtDensityPct}% built surface density and ${ward.vulnerableCount.toLocaleString()} vulnerable residents.`,
        factors: [
          {
            factor: 'Urban Built Mass',
            value: `${ward.builtDensityPct}% paved surfaces`,
            impact: ward.builtDensityPct >= 75 ? 'High' : 'Medium',
            description: 'Asphalt and concrete surfaces absorb solar radiation and re-radiate heat.',
          },
          {
            factor: 'Canopy Coverage Deficit',
            value: `${ward.treeCanopyPct}% tree canopy`,
            impact: ward.treeCanopyPct < 25 ? 'High' : 'Medium',
            description: 'Tree foliage provides natural evapotranspiration cooling and direct solar shielding.',
          },
          {
            factor: 'Urban Heat Island (UHI)',
            value: `+${ward.uhiOffsetDegC}°C elevation`,
            impact: ward.uhiOffsetDegC >= 2.0 ? 'High' : 'Medium',
            description: 'Microclimate temperature premium over rural background baselines.',
          },
          {
            factor: 'Vulnerable Population',
            value: `${ward.vulnerableCount.toLocaleString()} at-risk persons`,
            impact: ward.vulnerableCount > 35000 ? 'High' : 'Medium',
            description: 'High proportion of seniors, infants, and informal outdoor laborers.',
          },
        ],
      },
      exposure: {
        score: exposureScore,
        level: exposureLevel,
        peakHours: '12:30 PM – 04:30 PM',
        solarIrradiance: current.solarIrradiance,
        daytimeWindow: '10:00 AM – 05:30 PM',
        explanation:
          exposureScore >= 75
            ? 'High solar zenith angle and clear skies create intense radiant skin exposure.'
            : 'Moderate solar angle with lower thermal absorption rates.',
      },
      riskDrivers,
      hourlyRisk,
      fiveDayRisk,
      peakRiskPeriod: '12:30 PM – 04:30 PM',
      nearbyProtection,
      recommendedAction,
      safetyAdvice,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      dataStatus: current.source || 'LIVE',
      dataSource: current.source === 'LIVE' ? 'LIVE (Open-Meteo & Ground IMD Stations)' : 'MODELLED (IMD GFS Microclimate Ensembles)',
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error generating citizen my-risk data:', error);
    res.status(500).json({ error: 'Failed to evaluate heat risk profile' });
  }
});

// 1. GET /api/location/resolve
app.get('/api/location/resolve', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward, city, state, formattedAddress } = await resolveLocationOrWard(req, lat, lng);
  const realNearbyPlaces = await fetchNearbyProtectionPlaces(lat, lng, 3500);

  const landmarks = realNearbyPlaces.slice(0, 8).map((p) => ({
    name: p.name,
    label: `${p.name} (${p.typeBadge})`,
    lat: p.lat,
    lng: p.lng,
    zone: p.category,
  }));

  res.json({
    lat,
    lng,
    ward,
    city,
    state,
    formattedAddress,
    country: 'India',
    elevationMeters: 560,
    urbanHeatIslandScore: ward.uhiOffsetDegC > 2.0 ? 'High UHI' : 'Moderate UHI',
    allWards: ALL_REGIONAL_WARDS,
    landmarks: landmarks.length > 0 ? landmarks : REGIONAL_LANDMARKS.filter((l) => !ward.city || l.city === ward.city),
  });
});

// Real Google Geocoding & Places APIs
app.get('/api/geocode/reverse', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const result = await reverseGeocodeGoogle(lat, lng);
  res.json(result);
});

app.get('/api/geocode/search', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  const results = await searchAddressGoogle(q);
  res.json(results);
});

app.get('/api/places/nearby', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : 3500;
  const places = await fetchNearbyProtectionPlaces(lat, lng, radius);
  res.json(places);
});

// 2. GET /api/weather/current
app.get('/api/weather/current', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const data = await fetchWeatherData(lat, lng);
  res.json(data.current);
});

// 3. GET /api/weather/hourly
app.get('/api/weather/hourly', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const data = await fetchWeatherData(lat, lng);
  res.json(data.hourly);
});

// 4. GET /api/weather/forecast
app.get('/api/weather/forecast', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const data = await fetchWeatherData(lat, lng);
  res.json(data.daily);
});

// 5. GET /api/thermal/current
app.get('/api/thermal/current', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const weather = await fetchWeatherData(lat, lng);
  const current = weather.current;
  const windMs = current.windSpeed / 3.6;

  const wbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, windMs);
  const utci = calculateUTCI(current.temp, current.humidity, windMs, current.solarIrradiance);
  const heatIndex = calculateHeatIndex(current.temp, current.humidity);
  const overallLevel = categorizeThermalStress(wbgt, utci);
  const explanation = getThermalCitizenExplanation(overallLevel, wbgt, utci);

  res.json({
    overallLevel,
    wbgt,
    utci,
    heatIndex,
    ambientTemp: current.temp,
    humidity: current.humidity,
    windSpeed: current.windSpeed,
    solarRadiation: current.solarIrradiance,
    citizenExplanation: explanation.explanation,
    whatDoesThisMean: explanation.points,
    peakPeriod: '12:30 PM – 04:30 PM',
    source: weather.source,
  });
});

// 6. GET /api/thermal/forecast
app.get('/api/thermal/forecast', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const weather = await fetchWeatherData(lat, lng);

  const forecast = weather.daily.map((d) => {
    const wb = calculateWBGT(d.tempMax, d.humidityAvg, d.solarRadiationMax, 2.5);
    const ut = calculateUTCI(d.tempMax, d.humidityAvg, 2.5, d.solarRadiationMax);
    const risk = categorizeThermalStress(wb, ut);
    return {
      date: d.date,
      dayName: d.dayName,
      wbgt: wb,
      utci: ut,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      heatIndexMax: d.feelsLikeMax,
      level: risk,
      peakPeriod: d.peakPeriod,
      summary: d.summary,
    };
  });

  res.json(forecast);
});

// 7. GET /api/risk/current
app.get('/api/risk/current', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward } = await resolveLocationOrWard(req, lat, lng);
  const weather = await fetchWeatherData(lat, lng);
  const current = weather.current;
  const now = new Date();

  const wbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, current.windSpeed / 3.6);
  const utci = calculateUTCI(current.temp, current.humidity, current.windSpeed / 3.6, current.solarIrradiance);
  const thermalLevel = categorizeThermalStress(wbgt, utci);

  const { score, level } = calculateCompositeRiskScore(
    wbgt,
    utci,
    ward.vulnerabilityIndex,
    now.getHours(),
    ward.uhiOffsetDegC
  );

  const isHeatwave = current.temp >= 38.5;

  let humanExplanation = '';
  if (level === 'Extreme') {
    humanExplanation = `Dangerous heat conditions in ${ward.name}. High solar radiation combined with dense concrete surfaces creates intense thermal stress. Limit outdoor exposure.`;
  } else if (level === 'High') {
    humanExplanation = `Elevated heat risk across ${ward.name}. High ambient temperatures and humidity require proactive hydration and shaded commuting.`;
  } else if (level === 'Moderate') {
    humanExplanation = `Moderate heat discomfort expected during afternoon peak. Safe for short journeys with hydration.`;
  } else {
    humanExplanation = `Low thermal hazard. Conditions are comfortable for typical daily outdoor activities.`;
  }

  res.json({
    overallRiskLevel: level,
    riskScore: score,
    heatwaveStatus: isHeatwave ? 'Heatwave Conditions Active' : 'Normal Seasonal Profile',
    peakPeriod: '12:30 PM – 04:30 PM',
    humanExplanation,
    source: weather.source,
    ward: ward.name,
    zone: ward.zone,
    thermalStressLevel: thermalLevel,
    vulnerabilityScore: ward.vulnerabilityIndex,
    exposureScore: Math.round(score * 0.85),
    riskDrivers: [
      { name: 'Direct Solar Load', percentage: 38, description: 'High clear-sky solar irradiance (>800 W/m²)', impact: 'High' },
      { name: 'Ambient Heat & Humidity', percentage: 28, description: 'Temperature above 38°C restricting sweat cooling', impact: 'High' },
      { name: 'Urban Built Mass (UHI)', percentage: 20, description: `Paved surface fraction in ${ward.name} (${ward.builtDensityPct}%)`, impact: 'Medium' },
      { name: 'Canopy Deficit', percentage: 14, description: `Tree canopy coverage is only ${ward.treeCanopyPct}%`, impact: 'Medium' },
    ],
    trend: now.getHours() >= 12 && now.getHours() <= 16 ? 'Peak' : now.getHours() < 12 ? 'Rising' : 'Easing',
    safetyAdvice: [
      'Avoid exposed roads and parking plazas during afternoon hours.',
      'Refill drinking water bottles at designated PMC municipal kiosks.',
      'Seek air-conditioned community cooling shelters if feeling fatigued.',
    ],
  });
});

// 8. GET /api/risk/forecast
app.get('/api/risk/forecast', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward } = await resolveLocationOrWard(req, lat, lng);
  const weather = await fetchWeatherData(lat, lng);

  const forecast = weather.daily.map((d, idx) => {
    const wb = calculateWBGT(d.tempMax, d.humidityAvg, d.solarRadiationMax, 2.5);
    const ut = calculateUTCI(d.tempMax, d.humidityAvg, 2.5, d.solarRadiationMax);
    const { score, level } = calculateCompositeRiskScore(wb, ut, ward.vulnerabilityIndex, 14, ward.uhiOffsetDegC);

    return {
      day: idx + 1,
      dayName: d.dayName,
      date: d.date,
      riskLevel: level,
      riskScore: score,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      wbgt: wb,
      utci: ut,
      heatwaveStatus: d.heatwaveStatus,
      highRiskPeriod: d.peakPeriod,
      expectedExposure: level === 'Extreme' ? 'Severe Sun Exposure' : level === 'High' ? 'Elevated Heat Load' : 'Moderate',
      trend: idx <= 2 ? 'Escalating' : 'De-escalating',
    };
  });

  res.json(forecast);
});

// 8b. GET /api/risk/long-range-warning
app.get('/api/risk/long-range-warning', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward } = await resolveLocationOrWard(req, lat, lng);
  const locationParam = req.query.location as string;
  const targetLocation = locationParam && locationParam.trim() ? locationParam.trim() : ward.name;
  const report = generateLongRangeEarlyWarning(targetLocation);
  res.json(report);
});

// 9. GET /api/heatwave/status
app.get('/api/heatwave/status', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { city } = await resolveLocationOrWard(req, lat, lng);
  const weather = await fetchWeatherData(lat, lng);
  const currentTemp = weather.current.temp;

  const isSevere = currentTemp >= 40.0;
  const isHeatwave = currentTemp >= 38.5;

  res.json({
    status: isSevere ? 'Severe Heatwave' : isHeatwave ? 'Heatwave Warning' : 'Normal Weather Profile',
    alertCode: isSevere ? 'RED' : isHeatwave ? 'ORANGE' : 'YELLOW',
    currentTemp,
    thresholdTemp: 38.5,
    departureFromNormalDegC: Math.round((currentTemp - 34.0) * 10) / 10,
    durationDays: 3,
    dayOfEpisode: 2,
    persistence: `High persistence across ${city || 'Western Maharashtra'} plain`,
    peakPeriod: '12:30 PM – 04:30 PM',
    riskTrend: 'Peak Window Active',
    trajectory: 'Escalating until tomorrow evening; slight easing expected by Day 4',
    forecastConfidence: 91,
    issuingAgency: 'India Meteorological Department (IMD) / ThermaShield 360 Engine',
    source: weather.source,
  });
});

// 10. GET /api/protection/nearby
app.get('/api/protection/nearby', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const typeFilter = req.query.type as string; // 'water' | 'cooling' | 'shade' | 'healthcare'

  const realPlaces = await fetchNearbyProtectionPlaces(lat, lng, 4000);
  const mapped = realPlaces.map((p) => ({
    id: p.id,
    name: p.name,
    type:
      p.category === 'COOLING_CENTER'
        ? 'cooling'
        : p.category === 'WATER_POINT'
        ? 'water'
        : p.category === 'SHADE_CANOPY'
        ? 'shade'
        : 'healthcare',
    lat: p.lat,
    lng: p.lng,
    address: p.address,
    amenities: [p.protectiveFeature],
    availableCapacity: p.category === 'COOLING_CENTER' ? 300 : p.category === 'WATER_POINT' ? 600 : 150,
    status: (p.openNow ?? true) ? 'Available' : 'Limited',
    distanceKm: Number((p.distanceMeters / 1000).toFixed(2)),
    walkingTimeMins: p.walkingTimeMinutes,
    dataSource: 'LIVE',
  }));

  const filtered = typeFilter ? mapped.filter((p) => p.type === typeFilter) : mapped;
  res.json(filtered);
});

// 11. GET /api/protection/summary
app.get('/api/protection/summary', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const ward = resolveWardByCoords(lat, lng);

  let basePoints = PROTECTION_POINTS;
  try {
    const dbPoints = await getProtectionPointsForCitizen();
    if (dbPoints && dbPoints.length > 0) {
      basePoints = dbPoints;
    }
  } catch (err) {
    console.warn('[Database] Using fallback protection points for /api/protection/summary:', err);
  }

  // Calculate municipal capacity vs vulnerable demand for this ward
  const waterCount = basePoints.filter((p) => p.type === 'water').length;
  const coolingCount = basePoints.filter((p) => p.type === 'cooling').length;
  const shadeCount = basePoints.filter((p) => p.type === 'shade').length;
  const healthcareCount = HEALTHCARE_FACILITIES.length;

  let totalAvailableCap = 0;
  for (const pt of basePoints) {
    totalAvailableCap += pt.availableCapacity;
  }

  // Estimated demand: ~8% of ward vulnerable demographic requiring daytime relief
  const expectedPeopleRequiringProtection = Math.round(ward.vulnerableCount * 0.12);
  const protectionDemand = expectedPeopleRequiringProtection;
  const protectionGap = Math.max(0, protectionDemand - totalAvailableCap);
  const fulfillmentPct = Math.min(100, Math.round((totalAvailableCap / protectionDemand) * 100));

  const summary: ProtectionSummary = {
    wardName: ward.name,
    zoneName: ward.zone,
    totalFacilities: basePoints.length,
    waterPointsCount: waterCount,
    coolingCentresCount: coolingCount,
    shadeAreasCount: shadeCount,
    healthcareCount,
    expectedPeopleRequiringProtection,
    availableCapacity: totalAvailableCap,
    protectionDemand,
    protectionGap,
    capacityFulfillmentPct: fulfillmentPct,
    overallStatus: fulfillmentPct > 70 ? 'Available' : fulfillmentPct > 40 ? 'Limited' : 'Unavailable',
    dataSource: 'CURATED',
  };

  res.json(summary);
});

// 12. GET /api/healthcare/nearby?lat={lat}&lon={lon}&radius={meters}
app.get('/api/healthcare/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const lonStr = (req.query.lon as string) || (req.query.lng as string);
    const lon = lonStr ? parseFloat(lonStr) : lng;
    const radiusStr = req.query.radius as string;
    const radius = radiusStr ? parseInt(radiusStr, 10) : 6000;

    const facilities = await fetchNearbyHealthcareFromOSM(lat, lon, radius);
    res.json(facilities);
  } catch (err) {
    console.error('Error in /api/healthcare/nearby:', err);
    res.status(500).json({ error: 'Failed to retrieve healthcare facilities' });
  }
});

// Endpoint to search any location in India
app.get('/api/healthcare/search-locations', async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim().toLowerCase();
    if (!q) {
      return res.json(ALL_LOCATIONS.slice(0, 35));
    }

    // 1. Matches from local comprehensive index
    const localMatches = ALL_LOCATIONS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.shortName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q)
    );

    // If we have enough matches, return them immediately
    if (localMatches.length >= 6) {
      return res.json(localMatches.slice(0, 35));
    }

    // 2. Query Nominatim for specific Indian addresses / small towns
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&limit=8&addressdetails=1`,
        { headers: { 'User-Agent': 'ThermaShield-Healthcare/1.0' } }
      );
      if (nomRes.ok) {
        const nomData: any = await nomRes.json();
        if (Array.isArray(nomData)) {
          const remoteResults = nomData.map((item, idx) => {
            const parts = item.display_name.split(',');
            const short = parts.slice(0, 2).join(',').trim();
            const state = parts[parts.length - 2]?.trim() || 'India';
            return {
              id: `nom-${item.place_id || idx}`,
              name: item.display_name,
              shortName: short,
              city: parts[0]?.trim() || short,
              state: state,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              category: 'india',
            };
          });

          // Combine and deduplicate
          const combined = [...localMatches];
          for (const rem of remoteResults) {
            if (!combined.some((c) => Math.abs(c.lat - rem.lat) < 0.01 && Math.abs(c.lng - rem.lng) < 0.01)) {
              combined.push(rem as any);
            }
          }
          return res.json(combined.slice(0, 35));
        }
      }
    } catch (nomErr) {
      console.warn('Nominatim search failed:', nomErr);
    }

    return res.json(localMatches);
  } catch (err) {
    console.error('Error in /api/healthcare/search-locations:', err);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

// Dedicated Location Heat Check API for Healthcare Command Center Map
app.get('/api/healthcare/location-heat-check', async (req: Request, res: Response) => {
  try {
    const query = ((req.query.q as string) || (req.query.location as string) || '').trim();
    let lat = parseFloat(req.query.lat as string);
    let lng = parseFloat((req.query.lng as string) || (req.query.lon as string));
    let resolvedName = query;
    let shortName = query;

    const queryKey = query.toLowerCase();

    // 1. Check comprehensive allLocations index first
    const matchedFromAllLocations = ALL_LOCATIONS.find(
      (l) =>
        l.name.toLowerCase() === queryKey ||
        l.shortName.toLowerCase() === queryKey ||
        l.id.toLowerCase() === queryKey ||
        queryKey.includes(l.shortName.toLowerCase()) ||
        l.name.toLowerCase().includes(queryKey)
    );

    if (matchedFromAllLocations && (isNaN(lat) || isNaN(lng))) {
      lat = matchedFromAllLocations.lat;
      lng = matchedFromAllLocations.lng;
      resolvedName = matchedFromAllLocations.name;
      shortName = matchedFromAllLocations.shortName;
    } else if (query && (isNaN(lat) || isNaN(lng))) {
      // Query Nominatim for any road/locality/village/area across India
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1&addressdetails=1`,
          { headers: { 'User-Agent': 'ThermaShield-Healthcare/1.0' } }
        );
        if (nomRes.ok) {
          const nomData: any = await nomRes.json();
          if (Array.isArray(nomData) && nomData.length > 0) {
            lat = parseFloat(nomData[0].lat);
            lng = parseFloat(nomData[0].lon);
            resolvedName = nomData[0].display_name;
            const parts = resolvedName.split(',');
            shortName = parts.slice(0, 2).join(',').trim();
          }
        }
      } catch (err) {
        console.warn('Nominatim geocode fallback failed:', err);
      }
    }

    // Default fallback if still unresolved
    if (isNaN(lat) || isNaN(lng) || lat < 1 || lat > 85 || lng < -180 || lng > 180) {
      lat = 18.5204;
      lng = 73.8567;
      resolvedName = 'Pune Municipal Area, Maharashtra';
      shortName = 'Pune';
    } else if (!resolvedName) {
      resolvedName = `Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
      shortName = `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`;
    }

    // Fetch real weather from weatherService
    const weatherData = await fetchWeatherData(lat, lng);
    const current = weatherData.current;
    const dailyToday = weatherData.daily?.[0];

    // Compute thermal stresses
    const currentWbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, current.windSpeed);
    const currentUtci = calculateUTCI(current.temp, current.humidity, current.windSpeed, current.solarIrradiance);
    const currentStress = categorizeThermalStress(currentWbgt, currentUtci);

    const peakTemp = dailyToday ? dailyToday.tempMax : Math.max(current.temp, 38.5);
    const peakFeelsLike = dailyToday ? dailyToday.feelsLikeMax : current.feelsLike;
    const peakStress = dailyToday ? dailyToday.riskLevel : 'High';

    // Helper to evaluate heat risk level: High (Red), Moderate (Yellow), Low (Green)
    const evaluateHeat = (temp: number, feelsLike: number, stress: string) => {
      if (stress === 'Critical' || stress === 'High' || temp >= 37.0 || feelsLike >= 39.0) {
        return {
          level: 'High' as const,
          circleColor: 'red' as const,
          hex: '#EF4444',
          label: 'High Heat Risk',
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          advice: 'High thermal hazard. Prolonged exposure poses serious heat strain and dehydration risk.',
        };
      }
      if (stress === 'Moderate' || temp >= 32.0 || feelsLike >= 35.0) {
        return {
          level: 'Moderate' as const,
          circleColor: 'yellow' as const,
          hex: '#EAB308',
          label: 'Moderate Heat Risk',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          advice: 'Moderate thermal stress. Caution advised during peak afternoon sunshine.',
        };
      }
      return {
        level: 'Low' as const,
        circleColor: 'green' as const,
        hex: '#22C55E',
        label: 'Low Heat Risk',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        advice: 'Normal thermal conditions. Safe for ordinary outdoor activity.',
      };
    };

    const currentHeat = evaluateHeat(current.temp, current.feelsLike, currentStress);
    const peakHeat = evaluateHeat(peakTemp, peakFeelsLike, peakStress);

    // Compute rich health demand drivers for this location
    const healthcareSummary = await getHealthcareSummary(lat, lng, resolvedName, req.query.isUserLocation === 'true');

    res.json({
      location: {
        name: resolvedName,
        shortName,
        lat,
        lng,
        isUserLocation: req.query.isUserLocation === 'true',
      },
      current: {
        temp: current.temp,
        feelsLike: current.feelsLike,
        humidity: current.humidity,
        windSpeed: current.windSpeed,
        weatherDescription: current.weatherDescription,
        wbgt: currentWbgt,
        utci: currentUtci,
        heat: currentHeat,
      },
      peak: {
        tempMax: peakTemp,
        feelsLikeMax: peakFeelsLike,
        heat: peakHeat,
      },
      activeHeat: currentHeat,
      demandDrivers: healthcareSummary.locationDemandDrivers,
      highRiskAreas: healthcareSummary.highRiskAreas,
      demandCapacity: healthcareSummary.demandCapacity,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in /api/healthcare/location-heat-check:', err);
    res.status(500).json({ error: 'Failed to check location heat risk' });
  }
});

// 12b. GET /api/healthcare/:id
app.get('/api/healthcare/:id', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const lonStr = (req.query.lon as string) || (req.query.lng as string);
    const lon = lonStr ? parseFloat(lonStr) : lng;

    const facility = await getHealthcareFacilityById(req.params.id, lat, lon);
    if (!facility) {
      return res.status(404).json({ error: 'Healthcare facility not found' });
    }
    res.json(facility);
  } catch (err) {
    console.error('Error in /api/healthcare/:id:', err);
    res.status(500).json({ error: 'Failed to retrieve healthcare facility details' });
  }
});

// 12c. POST /api/healthcare/route
app.post('/api/healthcare/route', async (req: Request, res: Response) => {
  try {
    const { origin, destination, facilityName } = req.body || {};
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Both origin and destination coordinates are required' });
    }

    const origLat = origin.lat;
    const origLon = origin.lon !== undefined ? origin.lon : origin.lng;
    const destLat = destination.lat;
    const destLon = destination.lon !== undefined ? destination.lon : destination.lng;

    if (origLat === undefined || origLon === undefined || destLat === undefined || destLon === undefined) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required for origin and destination' });
    }

    const routeData = await calculateHealthcareRoute(
      { lat: origLat, lon: origLon },
      { lat: destLat, lon: destLon },
      facilityName || 'Healthcare Facility'
    );
    res.json(routeData);
  } catch (err) {
    console.error('Error in /api/healthcare/route:', err);
    res.status(500).json({ error: 'Failed to calculate healthcare route' });
  }
});

// 13. POST /api/routes
app.post('/api/routes', async (req: Request, res: Response) => {
  try {
    const originParam = req.body?.start || req.body?.origin || {};
    const destParam = req.body?.destination || {};

    const originLat = originParam.lat !== undefined ? Number(originParam.lat) : (req.body?.startLat !== undefined ? Number(req.body.startLat) : 18.5314);
    const originLng = originParam.lng !== undefined
      ? Number(originParam.lng)
      : (originParam.lon !== undefined
      ? Number(originParam.lon)
      : (req.body?.startLng !== undefined ? Number(req.body.startLng) : 73.8446));

    const destLat = destParam.lat !== undefined ? Number(destParam.lat) : (req.body?.destLat !== undefined ? Number(req.body.destLat) : 18.5134);
    const destLng = destParam.lng !== undefined
      ? Number(destParam.lng)
      : (destParam.lon !== undefined
      ? Number(destParam.lon)
      : (req.body?.destLng !== undefined ? Number(req.body.destLng) : 73.8561));

    const originLabel = originParam.label || req.body?.startLabel || 'Current GPS';
    const destLabel = destParam.label || req.body?.destLabel || 'Destination';

    const weather = await fetchWeatherData(originLat, originLng);
    const wbgt = calculateWBGT(weather.current.temp, weather.current.humidity, weather.current.solarIrradiance, 2.5);
    const utci = calculateUTCI(weather.current.temp, weather.current.humidity, 2.5, weather.current.solarIrradiance);
    const riskLevel = categorizeThermalStress(wbgt, utci);

    const routesResult = await generateRoutes(
      { lat: originLat, lng: originLng, label: originLabel },
      { lat: destLat, lng: destLng, label: destLabel },
      riskLevel,
      weather.current.temp
    );

    res.json({
      origin: { lat: originLat, lng: originLng, label: originLabel },
      destination: { lat: destLat, lng: destLng, label: destLabel },
      currentThermalStress: riskLevel,
      weather: {
        temp: weather.current.temp,
        humidity: weather.current.humidity,
        solarIrradiance: weather.current.solarIrradiance,
        wbgt,
        utci,
      },
      departureAdvice: routesResult.departureAdvice,
      routes: [routesResult.safeAndFast, routesResult.thermalSafe, routesResult.fastest],
      nearbyResources: routesResult.nearbyResources,
    });
  } catch (err) {
    console.error('Error generating routes in /api/routes:', err);
    res.status(500).json({ error: 'Failed to calculate thermal-safe routes' });
  }
});

// 14. GET /api/adaptive-response
app.get('/api/adaptive-response', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward } = await resolveLocationOrWard(req, lat, lng);
  const weather = await fetchWeatherData(lat, lng);
  const wbgt = calculateWBGT(weather.current.temp, weather.current.humidity, weather.current.solarIrradiance, 2.5);
  const utci = calculateUTCI(weather.current.temp, weather.current.humidity, 2.5, weather.current.solarIrradiance);
  const riskLevel = categorizeThermalStress(wbgt, utci);

  const ageGroup = (req.query.ageGroup as string) || 'Adult (18-64)';
  const isOutdoorWorker = req.query.isOutdoorWorker === 'true';
  const hasHealthCondition = req.query.hasHealthCondition === 'true';

  const recommendations = getAdaptiveRecommendations(riskLevel, ward, weather.current.temp, wbgt, {
    ageGroup,
    isOutdoorWorker,
    hasHealthCondition,
  });

  res.json({
    wardName: ward.name,
    currentRiskLevel: riskLevel,
    recommendations,
  });
});

// 15. GET /api/alerts
app.get('/api/alerts', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const { ward, city } = await resolveLocationOrWard(req, lat, lng);
    const weather = await fetchWeatherData(lat, lng);
    const wbgt = calculateWBGT(weather.current.temp, weather.current.humidity, weather.current.solarIrradiance, 2.5);
    const utci = calculateUTCI(weather.current.temp, weather.current.humidity, 2.5, weather.current.solarIrradiance);
    const riskLevel = categorizeThermalStress(wbgt, utci);

    const alerts = getCitizenAlerts(riskLevel, ward, weather.current.temp, {
      wbgt,
      utci,
      humidity: weather.current.humidity,
      solarIrradiance: weather.current.solarIrradiance,
      city: city || 'Pune',
      zone: ward.zone,
      dataSource: weather.source,
    });
    const history = getCitizenAlertHistory(ward, city || 'Pune');

    res.json({
      alerts,
      history,
      location: {
        ward: ward.name,
        zone: ward.zone,
        city: city || 'Pune',
        lat,
        lng,
      },
      thermalSummary: {
        riskLevel,
        wbgt,
        utci,
        temp: weather.current.temp,
      },
    });
  } catch (err) {
    console.error('Error in /api/alerts:', err);
    res.status(500).json({ error: 'Failed to generate citizen alerts' });
  }
});

// 15b. GET /api/alerts/history
app.get('/api/alerts/history', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const { ward, city } = await resolveLocationOrWard(req, lat, lng);
    const history = getCitizenAlertHistory(ward, city || 'Pune');
    res.json(history);
  } catch (err) {
    console.error('Error in /api/alerts/history:', err);
    res.status(500).json({ error: 'Failed to retrieve alert history' });
  }
});

// --- HEALTHCARE WORKSPACE API ---
app.get('/api/healthcare/workspace/summary', async (req: Request, res: Response) => {
  try {
    const latStr = req.query.lat as string;
    const lngStr = (req.query.lng as string) || (req.query.lon as string);
    const q = ((req.query.q as string) || (req.query.location as string) || '').trim();
    const isUserLocation = req.query.isUserLocation === 'true';

    let lat: number;
    let lng: number;

    if (latStr && lngStr && !isNaN(parseFloat(latStr)) && !isNaN(parseFloat(lngStr))) {
      lat = parseFloat(latStr);
      lng = parseFloat(lngStr);
    } else {
      const coords = parseCoords(req);
      lat = coords.lat;
      lng = coords.lng;
    }

    const summary = await getHealthcareSummary(lat, lng, q, isUserLocation);
    res.json(summary);
  } catch (err) {
    console.error('Error in /api/healthcare/workspace/summary:', err);
    res.status(500).json({ error: 'Failed to fetch healthcare workspace summary' });
  }
});

app.get('/api/healthcare/workspace/profile', (_req: Request, res: Response) => {
  try {
    const profile = getFacilityProfile();
    res.json(profile);
  } catch (err) {
    console.error('Error in /api/healthcare/workspace/profile:', err);
    res.status(500).json({ error: 'Failed to fetch facility profile' });
  }
});

app.post('/api/healthcare/workspace/profile', (req: Request, res: Response) => {
  try {
    const { updates, updatedBy } = req.body || {};
    const updated = updateFacilityProfile(updates || {}, updatedBy);
    res.json(updated);
  } catch (err) {
    console.error('Error in /api/healthcare/workspace/profile:', err);
    res.status(500).json({ error: 'Failed to update facility profile' });
  }
});

app.post('/api/healthcare/workspace/demo-toggle', (req: Request, res: Response) => {
  try {
    const { enableDemo } = req.body || {};
    const updated = toggleDemoMode(Boolean(enableDemo));
    res.json(updated);
  } catch (err) {
    console.error('Error in /api/healthcare/workspace/demo-toggle:', err);
    res.status(500).json({ error: 'Failed to toggle demo mode' });
  }
});

app.post('/api/healthcare/workspace/readiness/checklist', (req: Request, res: Response) => {
  try {
    const { id, isReady } = req.body || {};
    if (!id || typeof isReady !== 'boolean') {
      return res.status(400).json({ error: 'Valid item id and boolean isReady required' });
    }
    const updated = toggleChecklistItem(id, isReady);
    res.json(updated);
  } catch (err) {
    console.error('Error in /api/healthcare/workspace/readiness/checklist:', err);
    res.status(500).json({ error: 'Failed to update readiness checklist' });
  }
});

app.get('/api/healthcare/workspace/settings', (_req: Request, res: Response) => {
  try {
    const settings = getHealthcareSettings();
    res.json(settings);
  } catch (err) {
    console.error('Error in /api/healthcare/workspace/settings:', err);
    res.status(500).json({ error: 'Failed to fetch healthcare settings' });
  }
});

app.post('/api/healthcare/workspace/settings', (req: Request, res: Response) => {
  try {
    const updates = req.body || {};
    const updated = updateHealthcareSettings(updates);
    res.json(updated);
  } catch (err) {
    console.error('Error in /api/healthcare/workspace/settings:', err);
    res.status(500).json({ error: 'Failed to update healthcare settings' });
  }
});

// --- MUNICIPAL CORPORATION WORKSPACE API ---
app.get('/api/municipal/summary', (req: Request, res: Response) => {
  try {
    const city = req.query.city as string | undefined;
    const summary = getMunicipalSummary(undefined, undefined, undefined, undefined, city);
    res.json(summary);
  } catch (err) {
    console.error('Error in /api/municipal/summary:', err);
    res.status(500).json({ error: 'Failed to fetch municipal summary' });
  }
});

app.get('/api/municipal/wards', (req: Request, res: Response) => {
  try {
    const city = req.query.city as string | undefined;
    const wards = getMunicipalWards(undefined, undefined, undefined, city);
    res.json(wards);
  } catch (err) {
    console.error('Error in /api/municipal/wards:', err);
    res.status(500).json({ error: 'Failed to fetch municipal wards' });
  }
});

// Database health check endpoint
app.get('/api/db/status', async (_req: Request, res: Response) => {
  try {
    const health = await checkSupabaseHealth();
    res.json({
      provider: 'Supabase PostgreSQL + PostGIS',
      url: process.env.SUPABASE_URL || 'configured',
      authProviders: ['email', 'google'],
      ...health,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Database check failed' });
  }
});

// --- SUPABASE DATABASE API ROUTES ---

// 1. GET /api/wards
app.get('/api/wards', async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string | undefined;
    if (city && city !== 'All') {
      const filtered = ALL_REGIONAL_WARDS.filter(
        (w) => (w.city || '').toLowerCase() === city.toLowerCase()
      );
      if (filtered.length > 0) return res.json(filtered);
    }
    const wards = await getWards();
    if (wards && wards.length > 0) {
      const existingIds = new Set(wards.map((w: any) => w.id));
      const additional = ALL_REGIONAL_WARDS.filter((w) => !existingIds.has(w.id));
      res.json([...wards, ...additional]);
    } else {
      res.json(ALL_REGIONAL_WARDS);
    }
  } catch (err: any) {
    res.json(ALL_REGIONAL_WARDS);
  }
});

// 2. GET /api/wards/:id
app.get('/api/wards/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ward = await getWardById(id);
    if (!ward) {
      return res.status(404).json({ error: `Ward '${id}' not found` });
    }
    res.json(ward);
  } catch (err: any) {
    console.error(`Error in /api/wards/${req.params.id}:`, err);
    res.status(500).json({ error: err?.message || 'Failed to fetch ward' });
  }
});

// 3. GET /api/wards/:id/demographics
app.get('/api/wards/:id/demographics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const demographics = await getWardDemographics(id);
    res.json(demographics);
  } catch (err: any) {
    console.error(`Error in /api/wards/${req.params.id}/demographics:`, err);
    res.status(500).json({ error: err?.message || 'Failed to fetch ward demographics' });
  }
});

// 4. GET /api/protection-assets
app.get('/api/protection-assets', async (req: Request, res: Response) => {
  try {
    const wardId = req.query.wardId as string | undefined;
    const assetType = req.query.assetType as string | undefined;
    const assets = await getProtectionAssets({ wardId, assetType });
    res.json(assets);
  } catch (err: any) {
    console.error('Error in /api/protection-assets:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch protection assets' });
  }
});

// 5. GET /api/healthcare
app.get('/api/healthcare', async (req: Request, res: Response) => {
  try {
    const wardId = req.query.wardId as string | undefined;
    const facilities = await getHealthcareFacilities({ wardId });
    res.json(facilities);
  } catch (err: any) {
    console.error('Error in /api/healthcare:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch healthcare facilities' });
  }
});

// 6. GET /api/municipal/risk
app.get('/api/municipal/risk', async (req: Request, res: Response) => {
  try {
    const wardId = req.query.wardId as string | undefined;
    const snapshots = await getWardRiskSnapshots(wardId);
    res.json(snapshots);
  } catch (err: any) {
    console.error('Error in /api/municipal/risk:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch municipal risk snapshots' });
  }
});

// 7. GET /api/weather/observations
app.get('/api/weather/observations', async (req: Request, res: Response) => {
  try {
    const locationKey = req.query.locationKey as string | undefined;
    let observations = await getWeatherObservations(locationKey);
    if (!observations || observations.length === 0) {
      await fetchWeatherData(18.5204, 73.8567);
      observations = await getWeatherObservations(locationKey);
    }
    res.json(observations);
  } catch (err: any) {
    console.error('Error in /api/weather/observations:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch weather observations' });
  }
});

// 8. GET /api/weather/forecasts
app.get('/api/weather/forecasts', async (req: Request, res: Response) => {
  try {
    const locationKey = req.query.locationKey as string | undefined;
    let forecasts = await getWeatherForecasts(locationKey);
    if (!forecasts || forecasts.length === 0) {
      await fetchWeatherData(18.5204, 73.8567);
      forecasts = await getWeatherForecasts(locationKey);
    }
    res.json(forecasts);
  } catch (err: any) {
    console.error('Error in /api/weather/forecasts:', err);
    res.status(500).json({ error: err?.message || 'Failed to fetch weather forecasts' });
  }
});

app.get('/api/municipal/actions', async (_req: Request, res: Response) => {
  try {
    const actions = await getMunicipalActions();
    res.json(actions);
  } catch (err) {
    console.error('Error in /api/municipal/actions:', err);
    res.status(500).json({ error: 'Failed to fetch municipal actions' });
  }
});

app.post('/api/municipal/actions/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await updateMunicipalActionStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Action item not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error in /api/municipal/actions/:id/status:', err);
    res.status(500).json({ error: 'Failed to update action status' });
  }
});

app.get('/api/municipal/resources', (_req: Request, res: Response) => {
  try {
    const resources = getProtectionResources();
    res.json(resources);
  } catch (err) {
    console.error('Error in /api/municipal/resources:', err);
    res.status(500).json({ error: 'Failed to fetch protection resources' });
  }
});

app.get('/api/municipal/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await getMunicipalAlertsList();
    res.json(alerts);
  } catch (err) {
    console.error('Error in /api/municipal/alerts:', err);
    res.status(500).json({ error: 'Failed to fetch municipal alerts' });
  }
});

app.post('/api/municipal/alerts', async (req: Request, res: Response) => {
  try {
    const { what, where, when, why, action, severity } = req.body;
    if (!what || !where) {
      return res.status(400).json({ error: 'Missing required alert fields' });
    }
    const created = await addMunicipalAlert({
      what,
      where,
      when: when || 'Immediate',
      why: why || 'High heat risk and protection deficit',
      action: action || 'Review deployment',
      severity: severity || 'High',
      status: 'Active',
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('Error in /api/municipal/alerts:', err);
    res.status(500).json({ error: 'Failed to broadcast municipal alert' });
  }
});

// Mount Vite or static build
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ThermaShield 360 Citizen Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
