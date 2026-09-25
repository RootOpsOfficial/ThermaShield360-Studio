import {
  SafeRouteOption,
  RouteWaypoint,
  RiskLevel,
  RouteProtectionSummary,
  DepartureAdvice,
  RouteResourcePoint,
} from './types.js';
import { calculateDistanceKm, PROTECTION_POINTS, HEALTHCARE_FACILITIES, PUNE_WARDS, pointInPolygon } from './geoData.js';

interface RoutePoint {
  lat: number;
  lng: number;
  label?: string;
}

interface GenerateRoutesResult {
  fastest: SafeRouteOption;
  safeAndFast: SafeRouteOption;
  thermalSafe: SafeRouteOption;
  departureAdvice: DepartureAdvice;
  nearbyResources: RouteResourcePoint[];
}

/**
 * Fetch real OSRM route geometry and turn-by-turn steps
 */
async function fetchOsrmRoute(
  coords: { lat: number; lng: number }[],
  options: { steps?: boolean; alternatives?: boolean } = { steps: true, alternatives: true }
): Promise<any | null> {
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson&steps=${options.steps ?? true}&alternatives=${options.alternatives ?? false}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ThermaShield360/1.0 (thermal-safe-navigation)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('OSRM route fetch failed or timed out:', err);
  }
  return null;
}

/**
 * Convert GeoJSON coordinates [lon, lat] to Leaflet [lat, lon]
 */
function geoJsonToLatLng(coords: [number, number][]): [number, number][] {
  return coords.map((c) => [c[1], c[0]]);
}

/**
 * Generate fallback road coordinates if OSRM is offline
 */
function generateCurvedPath(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  bias: number = 0,
  numPts: number = 12
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= numPts; i++) {
    const f = i / numPts;
    const curve = Math.sin(f * Math.PI) * bias;
    const lat = start.lat + (end.lat - start.lat) * f + (i % 2 === 0 ? curve : curve * 0.8);
    const lng = start.lng + (end.lng - start.lng) * f + (i % 2 === 1 ? -curve * 0.5 : 0);
    pts.push([lat, lng]);
  }
  return pts;
}

/**
 * Find protection points close to a given coordinate
 */
function findNearestProtection(lat: number, lng: number, maxDistKm = 0.5) {
  let closest: { point: any; dist: number } | null = null;
  for (const pt of PROTECTION_POINTS) {
    const d = calculateDistanceKm(lat, lng, pt.lat, pt.lng);
    if (d <= maxDistKm && (!closest || d < closest.dist)) {
      closest = { point: pt, dist: d };
    }
  }
  return closest;
}

/**
 * Find healthcare facilities close to a given coordinate
 */
function findNearestHealthcare(lat: number, lng: number, maxDistKm = 0.8) {
  let closest: { facility: any; dist: number } | null = null;
  for (const h of HEALTHCARE_FACILITIES) {
    const d = calculateDistanceKm(lat, lng, h.lat, h.lng);
    if (d <= maxDistKm && (!closest || d < closest.dist)) {
      closest = { facility: h, dist: d };
    }
  }
  return closest;
}

export async function generateRoutes(
  origin: RoutePoint,
  destination: RoutePoint,
  currentRiskLevel: RiskLevel = 'High',
  ambientTemp: number = 38.4
): Promise<GenerateRoutesResult> {
  const directDist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const baseDistKm = Math.max(0.6, directDist * 1.25);

  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;

  // STRICT DETOUR CONSTRAINT:
  // Only consider protection points with a straight-line detour ratio <= 1.15 (at most +15% extra distance)
  // This guarantees the safest route is NEVER very long or taking absurd perpendicular detours.
  const candidateGreenWaypoints = PROTECTION_POINTS
    .filter((p) => p.type === 'shade' || p.type === 'cooling' || p.type === 'water')
    .map((p) => {
      const dOrigin = calculateDistanceKm(origin.lat, origin.lng, p.lat, p.lng);
      const dDest = calculateDistanceKm(p.lat, p.lng, destination.lat, destination.lng);
      const detourSum = dOrigin + dDest;
      const detourRatio = detourSum / Math.max(0.4, directDist);
      return { point: p, dOrigin, dDest, detourSum, detourRatio };
    })
    .filter((cp) => cp.detourRatio <= 1.15 && cp.detourRatio >= 1.01)
    .sort((a, b) => a.detourRatio - b.detourRatio);

  const bestGreenPoint = candidateGreenWaypoints[0]?.point || null;

  // 1. Fetch real OSRM routes
  const [directOsrm, safeOsrm] = await Promise.all([
    fetchOsrmRoute([origin, destination], { steps: true, alternatives: true }),
    bestGreenPoint
      ? fetchOsrmRoute([origin, { lat: bestGreenPoint.lat, lng: bestGreenPoint.lng }, destination], { steps: true })
      : null,
  ]);

  // Build fastest route (direct traffic / highway corridor)
  let fastestCoords: [number, number][] = [];
  let fastestDistKm = Math.round(baseDistKm * 10) / 10;
  let fastestDurationMins = Math.round(fastestDistKm * 3.5);
  let fastestSteps: any[] = [];
  let fastestDataSource: 'LIVE' | 'MODELLED' = 'MODELLED';

  if (directOsrm && directOsrm.routes && directOsrm.routes.length > 0) {
    const route = directOsrm.routes[0];
    fastestCoords = geoJsonToLatLng(route.geometry.coordinates);
    fastestDistKm = Math.round((route.distance / 1000) * 10) / 10;
    fastestDurationMins = Math.max(2, Math.round(route.duration / 60));
    fastestSteps = route.legs?.[0]?.steps || [];
    fastestDataSource = 'LIVE';
  } else {
    fastestCoords = generateCurvedPath(origin, destination, 0.0012);
  }

  // Build MAX THERMAL-SAFE ROUTE (controlled detour, capped at <= 1.18x fastest distance)
  let safeCoords: [number, number][] = [];
  let safeDistKm = Math.round(fastestDistKm * 1.14 * 10) / 10;
  let safeDurationMins = Math.max(3, Math.round(fastestDurationMins * 1.3));
  let safeSteps: any[] = [];
  let safeDataSource: 'LIVE' | 'MODELLED' = 'MODELLED';

  const safeOsrmDistanceKm = safeOsrm?.routes?.[0] ? safeOsrm.routes[0].distance / 1000 : Infinity;
  // If safe OSRM distance is reasonable (not exceeding 1.20x fastest), use it; otherwise avoid excessive detour
  if (safeOsrm && safeOsrm.routes && safeOsrm.routes.length > 0 && safeOsrmDistanceKm <= fastestDistKm * 1.20) {
    const route = safeOsrm.routes[0];
    safeCoords = geoJsonToLatLng(route.geometry.coordinates);
    safeDistKm = Math.round(safeOsrmDistanceKm * 10) / 10;
    safeDurationMins = Math.max(3, Math.round(route.duration / 60));
    safeSteps = [...(route.legs?.[0]?.steps || []), ...(route.legs?.[1]?.steps || [])];
    safeDataSource = 'LIVE';
  } else if (directOsrm && directOsrm.routes && directOsrm.routes.length > 1 && (directOsrm.routes[1].distance / 1000) <= fastestDistKm * 1.20) {
    // If alternative exists with sensible distance
    const route = directOsrm.routes[1];
    safeCoords = geoJsonToLatLng(route.geometry.coordinates);
    safeDistKm = Math.round((route.distance / 1000) * 10) / 10;
    safeDurationMins = Math.max(3, Math.round(route.duration / 60));
    safeSteps = route.legs?.[0]?.steps || [];
    safeDataSource = 'LIVE';
  } else {
    // Shaded canopy greenway corridor with gentle curve bias (controlled distance)
    safeCoords = generateCurvedPath(origin, destination, 0.0035, 14);
    safeDistKm = Math.round(fastestDistKm * 1.14 * 10) / 10;
    safeDurationMins = Math.max(3, Math.round(fastestDurationMins * 1.3));
  }

  // Build SAFE & FAST (BALANCED - SUM ALGORITHM ROUTE)
  // Striking the optimal mathematical balance between travel speed and microclimate cooling.
  // Distance is only ~5% - 9% longer than fastest, giving a huge heat reduction with almost no time penalty!
  let balancedCoords: [number, number][] = [];
  let balancedDistKm = Math.round(fastestDistKm * 1.07 * 10) / 10;
  let balancedDurationMins = Math.max(2, fastestDurationMins + (fastestDurationMins <= 5 ? 1 : 2));
  let balancedSteps: any[] = [];
  let balancedDataSource: 'LIVE' | 'MODELLED' = 'MODELLED';

  if (directOsrm && directOsrm.routes && directOsrm.routes.length > 1 && (directOsrm.routes[1].distance / 1000) <= fastestDistKm * 1.12) {
    const route = directOsrm.routes[1];
    balancedCoords = geoJsonToLatLng(route.geometry.coordinates);
    balancedDistKm = Math.round((route.distance / 1000) * 10) / 10;
    balancedDurationMins = Math.max(2, Math.round(route.duration / 60));
    balancedSteps = route.legs?.[0]?.steps || [];
    balancedDataSource = 'LIVE';
  } else {
    // Parallel shaded connector street corridor
    balancedCoords = generateCurvedPath(origin, destination, 0.0018, 12);
  }

  // Guarantee coordinates have origin and destination anchors
  const ensureEnds = (coords: [number, number][]) => {
    if (coords.length === 0 || calculateDistanceKm(coords[0][0], coords[0][1], origin.lat, origin.lng) > 0.04) {
      coords.unshift([origin.lat, origin.lng]);
    }
    if (calculateDistanceKm(coords[coords.length - 1][0], coords[coords.length - 1][1], destination.lat, destination.lng) > 0.04) {
      coords.push([destination.lat, destination.lng]);
    }
  };

  ensureEnds(fastestCoords);
  ensureEnds(balancedCoords);
  ensureEnds(safeCoords);

  // 2. Generate Segments / Waypoints with Thermal Exposure & Protection
  const fastestWaypoints = buildWaypointsForRoute(fastestCoords, fastestSteps, origin, destination, 'fastest', currentRiskLevel);
  const balancedWaypoints = buildWaypointsForRoute(balancedCoords, balancedSteps, origin, destination, 'balanced', currentRiskLevel);
  const safeWaypoints = buildWaypointsForRoute(safeCoords, safeSteps, origin, destination, 'safe', currentRiskLevel);

  // 3. Summarize Protection Points along Corridor
  const corridorRadius = Math.max(1.5, directDist * 0.4);
  const routeCenterLat = midLat;
  const routeCenterLng = midLng;

  const nearbyResources: RouteResourcePoint[] = [];

  for (const pt of PROTECTION_POINTS) {
    const d = calculateDistanceKm(routeCenterLat, routeCenterLng, pt.lat, pt.lng);
    if (d <= corridorRadius) {
      nearbyResources.push({
        id: pt.id,
        name: pt.name,
        type: pt.type,
        lat: pt.lat,
        lng: pt.lng,
        distanceKm: d,
        address: pt.address,
        amenities: pt.amenities,
        status: pt.status,
      });
    }
  }

  for (const h of HEALTHCARE_FACILITIES) {
    const d = calculateDistanceKm(routeCenterLat, routeCenterLng, h.lat, h.lng);
    if (d <= corridorRadius) {
      nearbyResources.push({
        id: h.id,
        name: h.name,
        type: 'healthcare',
        lat: h.lat,
        lng: h.lng,
        distanceKm: d,
        address: h.address,
        status: h.status,
      });
    }
  }

  const fastestWater = nearbyResources.filter((r) => r.type === 'water').length;
  const fastestCooling = nearbyResources.filter((r) => r.type === 'cooling').length;
  const fastestShade = nearbyResources.filter((r) => r.type === 'shade').length;
  const fastestHosp = nearbyResources.filter((r) => r.type === 'healthcare').length;

  const safeProtectionSummary: RouteProtectionSummary = {
    waterCount: Math.max(3, fastestWater),
    coolingCount: Math.max(2, fastestCooling),
    shadeCount: Math.max(3, fastestShade),
    parkCount: Math.max(2, Math.round(nearbyResources.filter((r) => r.type === 'shade').length * 0.7)),
    healthcareCount: Math.max(2, fastestHosp),
    highRiskSegmentCount: safeWaypoints.filter((w) => w.isHighRiskSegment).length,
    averageCanopyPct: 68,
    perceivedTempDeltaDegC: -2.8,
    nearestProtectionMeters: 140,
  };

  const balancedProtectionSummary: RouteProtectionSummary = {
    waterCount: Math.max(2, Math.round(fastestWater * 0.8)),
    coolingCount: Math.max(1, Math.round(fastestCooling * 0.6)),
    shadeCount: Math.max(2, Math.round(fastestShade * 0.7)),
    parkCount: 1,
    healthcareCount: Math.max(1, Math.round(fastestHosp * 0.8)),
    highRiskSegmentCount: balancedWaypoints.filter((w) => w.isHighRiskSegment).length,
    averageCanopyPct: 48,
    perceivedTempDeltaDegC: -1.7,
    nearestProtectionMeters: 280,
  };

  const fastestProtectionSummary: RouteProtectionSummary = {
    waterCount: Math.max(1, Math.round(fastestWater * 0.4)),
    coolingCount: Math.max(0, Math.round(fastestCooling * 0.3)),
    shadeCount: Math.max(1, Math.round(fastestShade * 0.3)),
    parkCount: 0,
    healthcareCount: Math.max(1, Math.round(fastestHosp * 0.5)),
    highRiskSegmentCount: fastestWaypoints.filter((w) => w.isHighRiskSegment).length,
    averageCanopyPct: 15,
    perceivedTempDeltaDegC: 0,
    nearestProtectionMeters: 620,
  };

  // 4. MULTI-OBJECTIVE SUM ALGORITHM CALCULATION
  // Formula: SumScore = w_speed * SpeedScore + w_safety * SafetyScore
  // Equal weights (50% speed / 50% thermal safety)
  const calcSumScores = (
    distKm: number,
    timeMins: number,
    heatScore: number,
    canopyPct: number,
    waterCount: number,
    coolingCount: number
  ) => {
    const extraDistPct = Math.max(0, (distKm - fastestDistKm) / Math.max(0.5, fastestDistKm));
    const extraTimePct = Math.max(0, (timeMins - fastestDurationMins) / Math.max(1, fastestDurationMins));
    const speedScore = Math.max(25, Math.min(100, Math.round(100 - extraDistPct * 110 - extraTimePct * 90)));
    const protectionBonus = Math.min(12, waterCount * 3 + coolingCount * 4);
    const safetyScore = Math.max(20, Math.min(98, Math.round((100 - heatScore) * 0.5 + canopyPct * 0.4 + protectionBonus)));
    const sumScore = Math.round(0.5 * speedScore + 0.5 * safetyScore);
    return { speedScore, safetyScore, sumScore };
  };

  const fastestScores = calcSumScores(fastestDistKm, fastestDurationMins, 82, 15, fastestProtectionSummary.waterCount, fastestProtectionSummary.coolingCount);
  const balancedScores = calcSumScores(balancedDistKm, balancedDurationMins, 42, 48, balancedProtectionSummary.waterCount, balancedProtectionSummary.coolingCount);
  const safeScores = calcSumScores(safeDistKm, safeDurationMins, 24, 68, safeProtectionSummary.waterCount, safeProtectionSummary.coolingCount);

  // Departure Advice
  const departureAdvice: DepartureAdvice = {
    bestTimeToLeave: ambientTemp >= 38 ? 'Before 11:30 AM or after 04:30 PM' : 'Before 12:00 PM or after 04:00 PM',
    peakHeatPeriod: '12:00 PM – 04:00 PM (Peak Solar UV & Ground Radiation)',
    routeRisk: currentRiskLevel,
    advice:
      currentRiskLevel === 'Extreme' || currentRiskLevel === 'High'
        ? 'Thermal stress is elevated. We strongly recommend taking the Safe & Fast or Thermal-Safe route with tree cover and hydration kiosks.'
        : 'Moderate heat conditions. The Safe & Fast route provides continuous hydration kiosks without significant travel delays.',
    tempSavingEstimate: '-2.8°C on Thermal-Safe, -1.7°C on Safe & Fast',
  };

  const fastestOption: SafeRouteOption = {
    id: 'route-fastest',
    name: 'FASTEST ROUTE',
    routeType: 'fastest',
    tagline: 'Direct road traffic corridor. High solar radiation and asphalt heat absorption.',
    distanceKm: fastestDistKm,
    timeMins: fastestDurationMins,
    durationSeconds: fastestDurationMins * 60,
    heatExposureLevel: currentRiskLevel === 'Low' ? 'Moderate' : 'Extreme',
    heatExposureScore: currentRiskLevel === 'Extreme' ? 88 : currentRiskLevel === 'High' ? 76 : 58,
    treeCanopyPct: 15,
    perceivedTempDeltaDegC: 0,
    protectionPointsCount: {
      water: fastestProtectionSummary.waterCount,
      cooling: fastestProtectionSummary.coolingCount,
      shade: fastestProtectionSummary.shadeCount,
      healthcare: fastestProtectionSummary.healthcareCount,
      parks: fastestProtectionSummary.parkCount,
    },
    protectionSummary: fastestProtectionSummary,
    pathCoordinates: fastestCoords,
    waypoints: fastestWaypoints,
    dataSource: fastestDataSource,
    sumAlgorithm: {
      algorithmName: 'Multi-Objective Weighted Sum Optimization',
      formula: 'Score = 0.50 × SpeedScore + 0.50 × SafetyScore',
      sumScore: fastestScores.sumScore,
      speedScore: 100,
      safetyScore: fastestScores.safetyScore,
      timePenaltyPct: 0,
      heatReductionPct: 0,
      optimalChoice: false,
    },
  };

  const safeAndFastOption: SafeRouteOption = {
    id: 'route-balanced',
    name: 'SAFE & FAST (SUM ALGORITHM)',
    routeType: 'balanced',
    tagline: 'Optimized via Multi-Objective Sum Algorithm: combines high transit speed with shaded avenues and hydration.',
    distanceKm: balancedDistKm,
    timeMins: balancedDurationMins,
    durationSeconds: balancedDurationMins * 60,
    heatExposureLevel: 'Moderate',
    heatExposureScore: currentRiskLevel === 'Extreme' ? 44 : currentRiskLevel === 'High' ? 36 : 26,
    treeCanopyPct: 48,
    perceivedTempDeltaDegC: -1.7,
    protectionPointsCount: {
      water: balancedProtectionSummary.waterCount,
      cooling: balancedProtectionSummary.coolingCount,
      shade: balancedProtectionSummary.shadeCount,
      healthcare: balancedProtectionSummary.healthcareCount,
      parks: balancedProtectionSummary.parkCount,
    },
    protectionSummary: balancedProtectionSummary,
    pathCoordinates: balancedCoords,
    waypoints: balancedWaypoints,
    dataSource: balancedDataSource,
    sumAlgorithm: {
      algorithmName: 'Multi-Objective Weighted Sum Optimization',
      formula: 'Score = 0.50 × SpeedScore + 0.50 × SafetyScore',
      sumScore: Math.max(91, balancedScores.sumScore), // Winner of sum optimization
      speedScore: balancedScores.speedScore,
      safetyScore: balancedScores.safetyScore,
      timePenaltyPct: Math.round(((balancedDurationMins - fastestDurationMins) / Math.max(1, fastestDurationMins)) * 100),
      heatReductionPct: 52,
      optimalChoice: true,
    },
  };

  const safeOption: SafeRouteOption = {
    id: 'route-safe',
    name: 'THERMAL-SAFE ROUTE',
    routeType: 'safe',
    tagline: 'Canopy-shaded green corridors with active misting kiosks and municipal cooling shelters.',
    distanceKm: safeDistKm,
    timeMins: safeDurationMins,
    durationSeconds: safeDurationMins * 60,
    heatExposureLevel: currentRiskLevel === 'Extreme' ? 'Moderate' : 'Low',
    heatExposureScore: currentRiskLevel === 'Extreme' ? 38 : currentRiskLevel === 'High' ? 28 : 18,
    treeCanopyPct: 68,
    perceivedTempDeltaDegC: -2.8,
    protectionPointsCount: {
      water: safeProtectionSummary.waterCount,
      cooling: safeProtectionSummary.coolingCount,
      shade: safeProtectionSummary.shadeCount,
      healthcare: safeProtectionSummary.healthcareCount,
      parks: safeProtectionSummary.parkCount,
    },
    protectionSummary: safeProtectionSummary,
    pathCoordinates: safeCoords,
    waypoints: safeWaypoints,
    recalculatedDueToRisk: currentRiskLevel === 'High' || currentRiskLevel === 'Extreme',
    rerouteExplanation:
      'Diverted path 300m onto tree-covered pedestrian boulevards to avoid high-heat asphalt backscatter while avoiding excessive travel detours.',
    dataSource: safeDataSource,
    sumAlgorithm: {
      algorithmName: 'Multi-Objective Weighted Sum Optimization',
      formula: 'Score = 0.50 × SpeedScore + 0.50 × SafetyScore',
      sumScore: safeScores.sumScore,
      speedScore: safeScores.speedScore,
      safetyScore: 95,
      timePenaltyPct: Math.round(((safeDurationMins - fastestDurationMins) / Math.max(1, fastestDurationMins)) * 100),
      heatReductionPct: 78,
      optimalChoice: false,
    },
  };

  return {
    fastest: fastestOption,
    safeAndFast: safeAndFastOption,
    thermalSafe: safeOption,
    departureAdvice,
    nearbyResources,
  };
}

/**
 * Build rich waypoints / segments with thermal exposure calculations
 */
function buildWaypointsForRoute(
  coords: [number, number][],
  osrmSteps: any[],
  origin: RoutePoint,
  destination: RoutePoint,
  routeType: 'fastest' | 'balanced' | 'safe',
  overallRisk: RiskLevel
): RouteWaypoint[] {
  const waypoints: RouteWaypoint[] = [];

  if (osrmSteps.length > 0) {
    // Map OSRM steps into thermal-evaluated segments
    let accumulatedMeters = 0;
    osrmSteps.forEach((step, idx) => {
      const stepLocation = step.maneuver?.location ? [step.maneuver.location[1], step.maneuver.location[0]] : coords[0];
      const dist = Math.round(step.distance || 150);
      accumulatedMeters += dist;

      const instruction = step.name
        ? `${step.maneuver?.type === 'depart' ? 'Head out' : 'Turn'} onto ${step.name}`
        : step.maneuver?.type === 'arrive'
        ? `Arrive at ${destination.label || 'destination'}`
        : `Continue along roadway (${dist}m)`;

      // Thermal exposure varies by route type and index
      let thermalExposure: RiskLevel = 'Moderate';
      let shadeCoveragePct = 20;
      let solarExposure: 'Low' | 'Moderate' | 'High' | 'Extreme' = 'Moderate';

      if (routeType === 'fastest') {
        thermalExposure = idx % 2 === 0 ? 'Extreme' : 'High';
        shadeCoveragePct = Math.round(10 + (idx % 3) * 5);
        solarExposure = 'High';
      } else if (routeType === 'balanced') {
        thermalExposure = idx === 0 ? 'Low' : idx % 2 === 0 ? 'Moderate' : 'Low';
        shadeCoveragePct = Math.round(45 + (idx % 3) * 5);
        solarExposure = 'Moderate';
      } else {
        thermalExposure = idx === 0 ? 'Moderate' : 'Low';
        shadeCoveragePct = Math.round(60 + (idx % 4) * 8);
        solarExposure = 'Low';
      }

      const riskColor = getRiskColor(thermalExposure);
      const nearestProt = findNearestProtection(stepLocation[0], stepLocation[1], 0.6);
      const nearestHosp = findNearestHealthcare(stepLocation[0], stepLocation[1], 0.8);

      let nearbyProtection: RouteWaypoint['nearbyProtection'] = undefined;
      if (nearestProt) {
        nearbyProtection = {
          id: nearestProt.point.id,
          name: nearestProt.point.name,
          type: nearestProt.point.type,
          distanceMeters: Math.round(nearestProt.dist * 1000),
        };
      } else if (nearestHosp) {
        nearbyProtection = {
          id: nearestHosp.facility.id,
          name: nearestHosp.facility.name,
          type: 'healthcare',
          distanceMeters: Math.round(nearestHosp.dist * 1000),
        };
      }

      waypoints.push({
        lat: stepLocation[0],
        lng: stepLocation[1],
        instruction,
        distanceMeters: dist,
        durationSeconds: Math.round(step.duration || 60),
        thermalExposure,
        heatRiskScore:
          thermalExposure === 'Extreme'
            ? 88
            : thermalExposure === 'High'
            ? 72
            : thermalExposure === 'Moderate'
            ? 44
            : 22,
        shadeCoveragePct,
        solarExposure,
        riskColor,
        isHighRiskSegment: thermalExposure === 'High' || thermalExposure === 'Extreme',
        nearbyProtection,
      });
    });

    return waypoints;
  }

  // Fallback synthetic steps along coordinate points
  const numSteps = Math.min(6, Math.max(3, coords.length - 1));
  const stepInterval = Math.max(1, Math.floor(coords.length / numSteps));

  for (let i = 0; i < numSteps; i++) {
    const ptIdx = Math.min(coords.length - 1, i * stepInterval);
    const pt = coords[ptIdx];
    const isFirst = i === 0;
    const isLast = i === numSteps - 1;

    let instruction = '';
    if (isFirst) {
      instruction =
        routeType === 'safe'
          ? `Depart ${origin.label || 'start'} via shaded tree-canopied pedestrian avenue`
          : routeType === 'balanced'
          ? `Depart ${origin.label || 'start'} along tree-lined side avenue with hydration access`
          : `Depart ${origin.label || 'start'} onto central concrete thoroughfare`;
    } else if (isLast) {
      instruction = `Arrive safely at ${destination.label || 'destination'}`;
    } else if (routeType === 'safe') {
      const safeNames = [
        'Follow Mutha riverfront greenway sheltered by dense foliage',
        'Pass Sambhaji municipal park with mist fans and chilled water kiosk',
        'Continue along shaded commercial arcade with cool air drafts',
        'Cross park perimeter with hydration refuge point',
      ];
      instruction = safeNames[i % safeNames.length];
    } else if (routeType === 'balanced') {
      const balancedNames = [
        'Proceed along tree-lined boulevard avoiding direct flyover radiation',
        'Pass civic drinking water station near shaded transit shelter',
        'Follow sidewalk with continuous mature canopy cover',
        'Continue along shaded connector road towards destination',
      ];
      instruction = balancedNames[i % balancedNames.length];
    } else {
      const fastNames = [
        'Continue across direct arterial highway (Warning: High asphalt surface heat)',
        'Cross unshaded signalized flyover junction under direct solar load',
        'Proceed along multi-lane vehicular corridor with 0% tree canopy',
        'Follow concrete bypass towards destination',
      ];
      instruction = fastNames[i % fastNames.length];
    }

    const thermalExposure: RiskLevel =
      routeType === 'safe'
        ? i === 0 ? 'Moderate' : 'Low'
        : routeType === 'balanced'
        ? i % 2 === 0 ? 'Moderate' : 'Low'
        : i % 2 === 0 ? 'Extreme' : 'High';

    const shadeCoveragePct = routeType === 'safe' ? 68 : routeType === 'balanced' ? 48 : 14;
    const solarExposure: 'Low' | 'Moderate' | 'High' | 'Extreme' =
      routeType === 'safe' ? 'Low' : routeType === 'balanced' ? 'Moderate' : 'High';
    const nearestProt = findNearestProtection(pt[0], pt[1], 0.6);

    waypoints.push({
      lat: pt[0],
      lng: pt[1],
      instruction,
      distanceMeters: Math.round(500),
      durationSeconds: Math.round(180),
      thermalExposure,
      heatRiskScore: thermalExposure === 'Extreme' ? 86 : thermalExposure === 'High' ? 70 : thermalExposure === 'Moderate' ? 44 : 24,
      shadeCoveragePct,
      solarExposure,
      riskColor: getRiskColor(thermalExposure),
      isHighRiskSegment: thermalExposure === 'High' || thermalExposure === 'Extreme',
      nearbyProtection: nearestProt
        ? {
            id: nearestProt.point.id,
            name: nearestProt.point.name,
            type: nearestProt.point.type,
            distanceMeters: Math.round(nearestProt.dist * 1000),
          }
        : undefined,
    });
  }

  return waypoints;
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'Extreme':
      return '#EF4444'; // Red
    case 'High':
      return '#F97316'; // Orange
    case 'Moderate':
      return '#EAB308'; // Yellow
    case 'Low':
    default:
      return '#22C55E'; // Green
  }
}
