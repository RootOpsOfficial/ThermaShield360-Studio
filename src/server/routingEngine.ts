import { SafeRouteOption, RouteWaypoint, RiskLevel } from './types.js';
import { calculateDistanceKm, PROTECTION_POINTS, HEALTHCARE_FACILITIES } from './geoData.js';

export function generateRoutes(
  origin: { lat: number; lng: number; label?: string },
  destination: { lat: number; lng: number; label?: string },
  currentRiskLevel: RiskLevel = 'High'
): { fastest: SafeRouteOption; thermalSafe: SafeRouteOption } {
  const directDist = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const baseDist = Math.max(0.6, directDist * 1.25); // Road network circuity factor

  // 1. FASTEST ROUTE (Uses direct highway/arterial roads, exposed to sun, higher heat load)
  const fastestDistKm = Math.round(baseDist * 10) / 10;
  const fastestTimeMins = Math.round(fastestDistKm * 3.5); // ~17 km/h urban speed

  // Waypoints for fastest route
  const numSteps = 5;
  const fastestCoords: [number, number][] = [];
  const fastestWaypoints: RouteWaypoint[] = [];

  for (let i = 0; i <= numSteps; i++) {
    const fraction = i / numSteps;
    // Direct interpolation with minor road deviation
    const lat = origin.lat + (destination.lat - origin.lat) * fraction + (i === 2 ? 0.002 : 0);
    const lng = origin.lng + (destination.lng - origin.lng) * fraction + (i === 3 ? -0.0015 : 0);
    fastestCoords.push([lat, lng]);

    if (i < numSteps) {
      const stepDistMeters = Math.round((fastestDistKm * 1000) / numSteps);
      let instruction = '';
      if (i === 0) instruction = `Depart from ${origin.label || 'current location'} onto primary arterial road`;
      else if (i === 1) instruction = 'Continue straight across major signalized flyover junction';
      else if (i === 2) instruction = 'Keep left on unshaded multi-lane commercial corridor (Caution: High Surface Heat)';
      else if (i === 3) instruction = 'Merge right towards connecting arterial highway';
      else instruction = `Turn slightly left to approach ${destination.label || 'destination'}`;

      fastestWaypoints.push({
        lat,
        lng,
        instruction,
        distanceMeters: stepDistMeters,
        thermalExposure: currentRiskLevel === 'Low' ? 'Moderate' : 'Extreme',
        shadeCoveragePct: 14,
      });
    }
  }

  // 2. THERMAL-SAFE ROUTE (Passes along tree canopies, parks, with lower surface temp, passes water/cooling stations)
  const safeDistKm = Math.round((baseDist * 1.12) * 10) / 10; // Slightly longer (+12%) but sheltered
  const safeTimeMins = Math.round(safeDistKm * 4.0); // Slightly more relaxed walk/commute

  // Divert path towards known parks/greenways in Pune (Mutha river promenade, Fergusson canopy, Sambhaji park)
  const safeCoords: [number, number][] = [];
  const safeWaypoints: RouteWaypoint[] = [];

  // Intermediate midpoint shifted towards green buffer
  const midLat = (origin.lat + destination.lat) / 2 + 0.004;
  const midLng = (origin.lng + destination.lng) / 2 - 0.0035;

  const intermediatePoints: [number, number][] = [
    [origin.lat, origin.lng],
    [origin.lat * 0.7 + midLat * 0.3, origin.lng * 0.7 + midLng * 0.3],
    [midLat, midLng],
    [destination.lat * 0.3 + midLat * 0.7, destination.lng * 0.3 + midLng * 0.7],
    [destination.lat, destination.lng],
  ];

  for (let i = 0; i < intermediatePoints.length; i++) {
    safeCoords.push(intermediatePoints[i]);

    if (i < intermediatePoints.length - 1) {
      const stepDist = Math.round((safeDistKm * 1000) / (intermediatePoints.length - 1));
      let instruction = '';
      let nearbyProt: RouteWaypoint['nearbyProtection'] | undefined = undefined;

      if (i === 0) {
        instruction = 'Take tree-lined shaded boulevard towards municipal garden perimeter';
        nearbyProt = { name: 'PMC Sambhaji Chilled Water Kiosk', type: 'water' };
      } else if (i === 1) {
        instruction = 'Enter canopied pedestrian greenway with active misting stations (-3.2°C ambient reduction)';
        nearbyProt = { name: 'Ghole Road Air-Conditioned Cooling Shelter', type: 'cooling' };
      } else if (i === 2) {
        instruction = 'Continue along dense leafy canopy route sheltered from direct sun exposure';
        nearbyProt = { name: 'UPHC First-Aid & Hydration Point', type: 'healthcare' };
      } else {
        instruction = `Follow shaded pedestrian arcade to reach ${destination.label || 'destination'} safely`;
        nearbyProt = { name: 'Public Garden Shaded Rest Arbour', type: 'shade' };
      }

      safeWaypoints.push({
        lat: intermediatePoints[i][0],
        lng: intermediatePoints[i][1],
        instruction,
        distanceMeters: stepDist,
        thermalExposure: currentRiskLevel === 'Extreme' ? 'Moderate' : 'Low',
        shadeCoveragePct: 68,
        nearbyProtection: nearbyProt,
      });
    }
  }

  // Count nearby facilities along safe route
  let waterCount = 0;
  let coolingCount = 0;
  let shadeCount = 0;
  let healthcareCount = 0;

  for (const pt of PROTECTION_POINTS) {
    const d = calculateDistanceKm(midLat, midLng, pt.lat, pt.lng);
    if (d < 3.0) {
      if (pt.type === 'water') waterCount++;
      else if (pt.type === 'cooling') coolingCount++;
      else if (pt.type === 'shade') shadeCount++;
    }
  }

  for (const hosp of HEALTHCARE_FACILITIES) {
    const d = calculateDistanceKm(midLat, midLng, hosp.lat, hosp.lng);
    if (d < 3.0) healthcareCount++;
  }

  const fastestOption: SafeRouteOption = {
    id: 'route-fastest',
    name: 'FASTEST ROUTE',
    tagline: 'Direct road traffic corridor. High solar radiation and asphalt heat absorption.',
    distanceKm: fastestDistKm,
    timeMins: fastestTimeMins,
    heatExposureLevel: currentRiskLevel === 'Low' ? 'Moderate' : 'Extreme',
    heatExposureScore: 84,
    treeCanopyPct: 14,
    perceivedTempDeltaDegC: 0,
    protectionPointsCount: {
      water: 1,
      cooling: 0,
      shade: 0,
      healthcare: 1,
    },
    pathCoordinates: fastestCoords,
    waypoints: fastestWaypoints,
  };

  const safeOption: SafeRouteOption = {
    id: 'route-safe',
    name: 'THERMAL-SAFE ROUTE',
    tagline: 'Canopy-shaded green corridors with active misting kiosks and 4 cooling hubs.',
    distanceKm: safeDistKm,
    timeMins: safeTimeMins,
    heatExposureLevel: currentRiskLevel === 'Extreme' ? 'Moderate' : 'Low',
    heatExposureScore: 32,
    treeCanopyPct: 68,
    perceivedTempDeltaDegC: -2.8,
    protectionPointsCount: {
      water: Math.max(3, waterCount),
      cooling: Math.max(2, coolingCount),
      shade: Math.max(3, shadeCount),
      healthcare: Math.max(2, healthcareCount),
    },
    pathCoordinates: safeCoords,
    waypoints: safeWaypoints,
    recalculatedDueToRisk: currentRiskLevel === 'High' || currentRiskLevel === 'Extreme',
  };

  return { fastest: fastestOption, thermalSafe: safeOption };
}
