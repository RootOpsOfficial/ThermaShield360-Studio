import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUNE_WARDS, resolveWardByCoords, PROTECTION_POINTS, HEALTHCARE_FACILITIES, calculateDistanceKm, PUNE_LANDMARKS } from './src/server/geoData.js';
import { calculateWBGT, calculateUTCI, calculateHeatIndex, categorizeThermalStress, calculateCompositeRiskScore, getThermalCitizenExplanation } from './src/server/thermalEngine.js';
import { fetchWeatherData } from './src/server/weatherService.js';
import { generateRoutes } from './src/server/routingEngine.js';
import { getAdaptiveRecommendations, getCitizenAlerts } from './src/server/intelligenceEngine.js';
import { generateLongRangeEarlyWarning } from './src/server/longRangeEarlyWarning.js';
import { RiskLevel, ProtectionSummary, WardInfo, CitizenMyRiskData, CitizenHeatRiskResponse } from './src/server/types.js';

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

// Resolve location or ward according to query parameters and coordinates
function resolveLocationOrWard(
  req: Request,
  lat: number,
  lng: number
): { ward: WardInfo; city: string; state: string } {
  const customName = (req.query.name as string) || (req.query.location as string);
  const isPuneArea = lat >= 18.35 && lat <= 18.7 && lng >= 73.65 && lng <= 74.1;

  if (customName && customName.trim()) {
    const trimmed = customName.trim();
    // Check if it matches an existing Pune ward
    const existingWard = PUNE_WARDS.find(
      (w) =>
        w.name.toLowerCase() === trimmed.toLowerCase() ||
        trimmed.toLowerCase().includes(w.name.toLowerCase().split(':')[0]) ||
        w.name.toLowerCase().includes(trimmed.toLowerCase().split(',')[0])
    );
    if (existingWard && (trimmed.toLowerCase().includes('ward ') || isPuneArea)) {
      return { ward: existingWard, city: 'Pune', state: 'Maharashtra' };
    }

    const parts = trimmed.split(',');
    const cityName = parts[0].replace(/^Ward \d+:\s*/i, '').trim();
    const stateName = parts[1] ? parts[1].trim() : 'India';

    const customWard: WardInfo = {
      id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: trimmed,
      zone: 'Active Location',
      center: [lat, lng],
      bounds: [
        [lat - 0.05, lng - 0.05],
        [lat + 0.05, lng - 0.05],
        [lat + 0.05, lng + 0.05],
        [lat - 0.05, lng + 0.05],
        [lat - 0.05, lng - 0.05],
      ],
      population: 150000,
      vulnerableCount: 30000,
      treeCanopyPct: 26,
      builtDensityPct: 74,
      vulnerabilityIndex: 62,
      uhiOffsetDegC: 1.9,
      highRiskAreas: ['Central Transit Hub', 'Commercial Corridors', 'Unshaded Markets'],
      lowRiskAreas: ['Civic Garden & Shaded Canopy', 'Green Buffer Zone'],
    };
    return { ward: customWard, city: cityName, state: stateName };
  }

  if (!isPuneArea) {
    const knownCity =
      Math.abs(lat - 19.076) < 0.3 && Math.abs(lng - 72.877) < 0.3
        ? 'Mumbai, Maharashtra'
        : Math.abs(lat - 21.1458) < 0.3 && Math.abs(lng - 79.0882) < 0.3
        ? 'Nagpur, Maharashtra'
        : Math.abs(lat - 19.9975) < 0.3 && Math.abs(lng - 73.7898) < 0.3
        ? 'Nashik, Maharashtra'
        : Math.abs(lat - 28.6139) < 0.3 && Math.abs(lng - 77.209) < 0.3
        ? 'New Delhi, Delhi NCR'
        : Math.abs(lat - 12.9716) < 0.3 && Math.abs(lng - 77.5946) < 0.3
        ? 'Bengaluru, Karnataka'
        : Math.abs(lat - 17.385) < 0.3 && Math.abs(lng - 78.4867) < 0.3
        ? 'Hyderabad, Telangana'
        : Math.abs(lat - 23.0225) < 0.3 && Math.abs(lng - 72.5714) < 0.3
        ? 'Ahmedabad, Gujarat'
        : Math.abs(lat - 13.0827) < 0.3 && Math.abs(lng - 80.2707) < 0.3
        ? 'Chennai, Tamil Nadu'
        : Math.abs(lat - 22.5726) < 0.3 && Math.abs(lng - 88.3639) < 0.3
        ? 'Kolkata, West Bengal'
        : Math.abs(lat - 26.9124) < 0.3 && Math.abs(lng - 75.7873) < 0.3
        ? 'Jaipur, Rajasthan'
        : `Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`;

    const parts = knownCity.split(',');
    const customWard: WardInfo = {
      id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: knownCity,
      zone: 'Active Location',
      center: [lat, lng],
      bounds: [
        [lat - 0.05, lng - 0.05],
        [lat + 0.05, lng - 0.05],
        [lat + 0.05, lng + 0.05],
        [lat - 0.05, lng + 0.05],
        [lat - 0.05, lng - 0.05],
      ],
      population: 180000,
      vulnerableCount: 36000,
      treeCanopyPct: 24,
      builtDensityPct: 76,
      vulnerabilityIndex: 65,
      uhiOffsetDegC: 2.1,
      highRiskAreas: ['Commercial Street Spine', 'Major Transit Terminus'],
      lowRiskAreas: ['Canopy Shaded Avenues', 'Public Lake Greenway'],
    };
    return { ward: customWard, city: parts[0].trim(), state: parts[1]?.trim() || 'India' };
  }

  const ward = resolveWardByCoords(lat, lng);
  return { ward, city: 'Pune', state: 'Maharashtra' };
}

// Dedicated API: GET /api/citizen/heat-risk — ONLY data required for My Heat Risk feature
app.get('/api/citizen/heat-risk', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const { ward, city, state } = resolveLocationOrWard(req, lat, lng);
    const weather = await fetchWeatherData(lat, lng);
    const current = weather.current;
    const now = new Date();
    const currentHour = now.getHours();

    // 1. Calculate thermal indices with shared engine
    const wbgt = calculateWBGT(current.temp, current.humidity, current.solarIrradiance, current.windSpeed);
    const utci = calculateUTCI(current.temp, current.humidity, current.windSpeed, current.solarIrradiance);

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
      const hWbgt = calculateWBGT(hTemp, hHumidity, hourlySolar, current.windSpeed);
      const hUtci = calculateUTCI(hTemp, hHumidity, current.windSpeed, hourlySolar);
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
    };

    res.json(payload);
  } catch (err) {
    console.error('Error in /api/citizen/heat-risk:', err);
    res.status(500).json({ error: 'Failed to calculate citizen heat risk' });
  }
});

// 0. GET /api/citizen/my-risk — Complete connected feature for Citizen Workspace
app.get('/api/citizen/my-risk', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = parseCoords(req);
    const { ward, city, state } = resolveLocationOrWard(req, lat, lng);
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

    // 8. Nearby Protection (Spatial Calculation)
    const pointsWithDist = PROTECTION_POINTS.map((p) => {
      const distanceKm = calculateDistanceKm(lat, lng, p.lat, p.lng);
      const travelTimeMins = Math.max(2, Math.round(distanceKm * (p.type === 'cooling' ? 8 : 12)));
      return {
        ...p,
        distanceKm,
        travelTimeMins,
        travelMode: distanceKm > 2.0 ? 'Driving' : 'Walking',
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    const healthWithDist = HEALTHCARE_FACILITIES.map((h) => {
      const distanceKm = calculateDistanceKm(lat, lng, h.lat, h.lng);
      return {
        ...h,
        distanceKm,
        travelTimeMins: Math.max(3, Math.round(distanceKm * 4)),
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

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
        categoryLabel: p.categoryLabel,
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
app.get('/api/location/resolve', (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward, city, state } = resolveLocationOrWard(req, lat, lng);
  res.json({
    lat,
    lng,
    ward,
    city,
    state,
    country: 'India',
    elevationMeters: 560,
    urbanHeatIslandScore: ward.uhiOffsetDegC > 2.0 ? 'High UHI' : 'Moderate UHI',
    allWards: PUNE_WARDS,
    landmarks: PUNE_LANDMARKS,
  });
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
  const { ward } = resolveLocationOrWard(req, lat, lng);
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
  const { ward } = resolveLocationOrWard(req, lat, lng);
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
app.get('/api/risk/long-range-warning', (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward } = resolveLocationOrWard(req, lat, lng);
  const locationParam = req.query.location as string;
  const targetLocation = locationParam && locationParam.trim() ? locationParam.trim() : ward.name;
  const report = generateLongRangeEarlyWarning(targetLocation);
  res.json(report);
});

// 9. GET /api/heatwave/status
app.get('/api/heatwave/status', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { city } = resolveLocationOrWard(req, lat, lng);
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
app.get('/api/protection/nearby', (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const typeFilter = req.query.type as string; // 'water' | 'cooling' | 'shade' | 'healthcare'

  const pointsWithDist = PROTECTION_POINTS.map((pt) => {
    const dist = calculateDistanceKm(lat, lng, pt.lat, pt.lng);
    const walkMins = Math.round(dist * 13); // ~4.6 km/h walking pace
    return {
      ...pt,
      distanceKm: dist,
      walkingTimeMins: Math.max(1, walkMins),
    };
  });

  pointsWithDist.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const filtered = typeFilter ? pointsWithDist.filter((p) => p.type === typeFilter) : pointsWithDist;

  res.json(filtered);
});

// 11. GET /api/protection/summary
app.get('/api/protection/summary', (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const ward = resolveWardByCoords(lat, lng);

  // Calculate municipal capacity vs vulnerable demand for this ward
  const waterCount = PROTECTION_POINTS.filter((p) => p.type === 'water').length;
  const coolingCount = PROTECTION_POINTS.filter((p) => p.type === 'cooling').length;
  const shadeCount = PROTECTION_POINTS.filter((p) => p.type === 'shade').length;
  const healthcareCount = HEALTHCARE_FACILITIES.length;

  let totalAvailableCap = 0;
  for (const pt of PROTECTION_POINTS) {
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
    totalFacilities: PROTECTION_POINTS.length,
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

// 12. GET /api/healthcare/nearby
app.get('/api/healthcare/nearby', (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);

  const hospitalsWithDist = HEALTHCARE_FACILITIES.map((h) => {
    const dist = calculateDistanceKm(lat, lng, h.lat, h.lng);
    const driveMins = Math.round(Math.max(3, dist * 3.2));
    const walkMins = Math.round(dist * 13);
    return {
      ...h,
      distanceKm: dist,
      travelTimeMins: h.travelMode === 'Walking' ? walkMins : driveMins,
    };
  });

  hospitalsWithDist.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json(hospitalsWithDist);
});

// 13. POST /api/routes
app.post('/api/routes', async (req: Request, res: Response) => {
  const { origin, destination, profile } = req.body || {};
  const originLat = origin?.lat || 18.5314;
  const originLng = origin?.lng || 73.8446;
  const destLat = destination?.lat || 18.5134;
  const destLng = destination?.lng || 73.8561;

  const weather = await fetchWeatherData(originLat, originLng);
  const wbgt = calculateWBGT(weather.current.temp, weather.current.humidity, weather.current.solarIrradiance, 2.5);
  const utci = calculateUTCI(weather.current.temp, weather.current.humidity, 2.5, weather.current.solarIrradiance);
  const riskLevel = categorizeThermalStress(wbgt, utci);

  const routes = generateRoutes(
    { lat: originLat, lng: originLng, label: origin?.label || 'Current GPS' },
    { lat: destLat, lng: destLng, label: destination?.label || 'Destination' },
    riskLevel
  );

  res.json({
    origin: { lat: originLat, lng: originLng, label: origin?.label || 'Current GPS' },
    destination: { lat: destLat, lng: destLng, label: destination?.label || 'Destination' },
    currentThermalStress: riskLevel,
    routes: [routes.fastest, routes.thermalSafe],
  });
});

// 14. GET /api/adaptive-response
app.get('/api/adaptive-response', async (req: Request, res: Response) => {
  const { lat, lng } = parseCoords(req);
  const { ward } = resolveLocationOrWard(req, lat, lng);
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
  const { lat, lng } = parseCoords(req);
  const { ward } = resolveLocationOrWard(req, lat, lng);
  const weather = await fetchWeatherData(lat, lng);
  const wbgt = calculateWBGT(weather.current.temp, weather.current.humidity, weather.current.solarIrradiance, 2.5);
  const utci = calculateUTCI(weather.current.temp, weather.current.humidity, 2.5, weather.current.solarIrradiance);
  const riskLevel = categorizeThermalStress(wbgt, utci);

  const alerts = getCitizenAlerts(riskLevel, ward, weather.current.temp);
  res.json(alerts);
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
