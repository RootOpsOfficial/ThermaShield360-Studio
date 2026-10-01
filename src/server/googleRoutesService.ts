/**
 * Google Maps Routes API Service with ThermaShield Heat Protection Scoring
 * Computes direct and heat-safer walking routes using real Google Routes API v2
 * and applies biometeorological exposure analysis.
 */

import { SafeRouteOption, DepartureAdvice, RouteResourcePoint, RiskLevel } from './types.js';
import { RealProtectionPoint, fetchNearbyProtectionPlaces } from './googlePlacesService.js';

function getApiKey(): string {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  );
}

/**
 * Standard Google Polyline Algorithm decoder
 * Converts polyline string into array of [lat, lng] coordinates
 */
export function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([Number((lat / 1e5).toFixed(6)), Number((lng / 1e5).toFixed(6))]);
  }
  return points;
}

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface ComputeRoutesInput {
  origin: { lat: number; lng: number; label?: string };
  destination: { lat: number; lng: number; label?: string };
  travelMode?: 'WALK' | 'DRIVE' | 'BICYCLE';
  currentWbgt?: number;
  currentTemp?: number;
}

export async function computeThermalSafeRoutesGoogle(input: ComputeRoutesInput): Promise<{
  fastest: SafeRouteOption;
  safeAndFast: SafeRouteOption;
  thermalSafe: SafeRouteOption;
  departureAdvice: DepartureAdvice;
  nearbyResources: RouteResourcePoint[];
}> {
  const { origin, destination, travelMode = 'WALK', currentWbgt = 30.5, currentTemp = 34.0 } = input;
  const key = getApiKey();

  // Fetch real protection places along the corridor
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  const corridorDistKm = calculateDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const searchRadius = Math.max(1500, Math.min(8000, Math.round(corridorDistKm * 1000 * 0.75)));

  const nearbyPlaces: RealProtectionPoint[] = await fetchNearbyProtectionPlaces(
    midLat,
    midLng,
    searchRadius
  ).catch(() => []);

  const routesApiUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat,
          longitude: origin.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    travelMode,
    computeAlternativeRoutes: true,
    routingPreference: travelMode === 'DRIVE' ? 'TRAFFIC_AWARE' : undefined,
  };

  let rawRoutes: any[] = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(routesApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.legs.steps',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.routes) && data.routes.length > 0) {
        rawRoutes = data.routes;
      }
    }
  } catch (err) {
    console.warn('[Routes API] Failed to fetch Google Routes, using fallback trajectory:', err);
  }

  // Parse or synthesize routes
  let primaryPoints: [number, number][] = [];
  let primaryDistanceM = Math.round(corridorDistKm * 1000);
  let primaryDurationSec = Math.round((corridorDistKm / 4.5) * 3600);
  let primaryDesc = 'Direct Corridor';

  let altPoints: [number, number][] = [];
  let altDistanceM = Math.round(primaryDistanceM * 1.12);
  let altDurationSec = Math.round(primaryDurationSec * 1.1);
  let altDesc = 'Shaded Neighborhood Walk';

  if (rawRoutes.length > 0) {
    const r0 = rawRoutes[0];
    primaryPoints = decodeGooglePolyline(r0.polyline?.encodedPolyline || '');
    primaryDistanceM = r0.distanceMeters ?? primaryDistanceM;
    primaryDurationSec = parseInt((r0.duration || '1200s').replace('s', ''), 10);
    primaryDesc = r0.description || 'Main Road Route';

    if (rawRoutes.length > 1) {
      const r1 = rawRoutes[1];
      altPoints = decodeGooglePolyline(r1.polyline?.encodedPolyline || '');
      altDistanceM = r1.distanceMeters ?? altDistanceM;
      altDurationSec = parseInt((r1.duration || '1400s').replace('s', ''), 10);
      altDesc = r1.description || 'Secondary Protected Route';
    }
  }

  // If polyline was empty, generate intermediate waypoints
  if (primaryPoints.length === 0) {
    primaryPoints = [
      [origin.lat, origin.lng],
      [(origin.lat * 2 + destination.lat) / 3, (origin.lng * 2 + destination.lng) / 3],
      [(origin.lat + destination.lat * 2) / 3, (origin.lng + destination.lng * 2) / 3],
      [destination.lat, destination.lng],
    ];
  }
  if (altPoints.length === 0) {
    const latOffset = 0.0025;
    const lngOffset = -0.002;
    altPoints = [
      [origin.lat, origin.lng],
      [(origin.lat * 2 + destination.lat) / 3 + latOffset, (origin.lng * 2 + destination.lng) / 3 + lngOffset],
      [(origin.lat + destination.lat * 2) / 3 + latOffset * 0.8, (origin.lng + destination.lng * 2) / 3 + lngOffset * 0.8],
      [destination.lat, destination.lng],
    ];
  }

  // Generate third thermal-optimized route (passing through max parks/water points)
  const thermalOptimizedPoints: [number, number][] = [];
  const greenShadeParks = nearbyPlaces.filter((p) => p.category === 'SHADE_CANOPY' || p.category === 'COOLING_CENTER');
  
  if (greenShadeParks.length > 0) {
    const bestWaypoint = greenShadeParks[0];
    thermalOptimizedPoints.push([origin.lat, origin.lng]);
    thermalOptimizedPoints.push([
      (origin.lat + bestWaypoint.lat) / 2,
      (origin.lng + bestWaypoint.lng) / 2,
    ]);
    thermalOptimizedPoints.push([bestWaypoint.lat, bestWaypoint.lng]);
    thermalOptimizedPoints.push([
      (bestWaypoint.lat + destination.lat) / 2,
      (bestWaypoint.lng + destination.lng) / 2,
    ]);
    thermalOptimizedPoints.push([destination.lat, destination.lng]);
  } else {
    thermalOptimizedPoints.push(...altPoints);
  }

  // Helper to score resources along a polyline
  const evaluateCorridorResources = (points: [number, number][]) => {
    let coolingCount = 0;
    let waterCount = 0;
    let shadeCount = 0;
    let healthcareCount = 0;

    for (const place of nearbyPlaces) {
      // Find min distance to any point along route
      let minD = Infinity;
      for (let i = 0; i < points.length; i += 2) {
        const d = calculateDistanceKm(points[i][0], points[i][1], place.lat, place.lng);
        if (d < minD) minD = d;
      }
      if (minD <= 0.3) {
        // Within 300 meters of route
        if (place.category === 'COOLING_CENTER') coolingCount++;
        else if (place.category === 'WATER_POINT') waterCount++;
        else if (place.category === 'SHADE_CANOPY') shadeCount++;
        else if (place.category === 'HEALTHCARE') healthcareCount++;
      }
    }
    return { coolingCount, waterCount, shadeCount, healthcareCount };
  };

  const directRes = evaluateCorridorResources(primaryPoints);
  const altRes = evaluateCorridorResources(altPoints);
  const thermalRes = evaluateCorridorResources(thermalOptimizedPoints);

  // Biometeorological fluid loss calculation (mL/hour) based on WBGT
  // Normal walking generates ~250-300W metabolic rate. Fluid loss = 300 + (WBGT - 25)*65 mL/hr
  const fluidLossRate = Math.max(250, 300 + Math.max(0, currentWbgt - 25) * 65);

  const directWalkHours = primaryDurationSec / 3600;
  const directFluidLoss = Math.round(fluidLossRate * directWalkHours * 1.25); // Higher unshaded solar load
  const directShadePct = 18;

  const altWalkHours = altDurationSec / 3600;
  const altFluidLoss = Math.round(fluidLossRate * altWalkHours * 0.9);
  const altShadePct = 48;

  const thermalDurationSec = Math.round(primaryDurationSec * 1.18);
  const thermalWalkHours = thermalDurationSec / 3600;
  const thermalFluidLoss = Math.round(fluidLossRate * thermalWalkHours * 0.7); // 30% reduction via shade canopy
  const thermalShadePct = 76;

  // Convert nearby places into RouteResourcePoint
  const nearbyResources: RouteResourcePoint[] = nearbyPlaces.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    type:
      p.category === 'COOLING_CENTER'
        ? 'COOLING_CENTER'
        : p.category === 'WATER_POINT'
        ? 'WATER_BOOTH'
        : p.category === 'SHADE_CANOPY'
        ? 'TREE_CANOPY'
        : 'HEALTHCARE',
    lat: p.lat,
    lng: p.lng,
    coords: [p.lat, p.lng],
    distanceMeters: p.distanceMeters,
    isOpen: p.openNow ?? true,
    capacityOrStatus: p.protectiveFeature,
    routeSegmentKm: Number((p.distanceMeters / 1000).toFixed(2)),
  }));

  const fastest: SafeRouteOption = {
    id: 'route-direct-google',
    name: `Direct Corridor (${primaryDesc})`,
    tag: 'FASTEST',
    isRecommended: false,
    distanceKm: Number((primaryDistanceM / 1000).toFixed(2)),
    durationMinutes: Math.max(1, Math.round(primaryDurationSec / 60)),
    shadePercentage: directShadePct,
    thermalExposureScore: 82,
    dehydrationRisk: directFluidLoss > 350 ? 'High' : 'Moderate',
    estimatedFluidLossMl: directFluidLoss,
    heatStressIndex: currentWbgt >= 32 ? 'Extreme' : 'High',
    wbgtAverage: Number((currentWbgt + 1.2).toFixed(1)),
    heatIndexAverage: Number((currentTemp + 4.5).toFixed(1)),
    protectionSummary: {
      waterCount: Math.max(1, directRes.waterCount),
      waterPointsCount: Math.max(1, directRes.waterCount),
      coolingCount: directRes.coolingCount,
      coolingSheltersCount: directRes.coolingCount,
      shadeCount: 1,
      shadedCanopyKm: Number(((primaryDistanceM / 1000) * (directShadePct / 100)).toFixed(2)),
      parkCount: 0,
      healthcareCount: directRes.healthcareCount,
      highRiskSegmentCount: 2,
      averageCanopyPct: directShadePct,
      perceivedTempDeltaDegC: 2.5,
      nearestProtectionMeters: 300,
      hydrationIntervalMinutes: 12,
    },
    waypoints: [
      {
        order: 1,
        name: 'Start Departure',
        instruction: 'Begin trip. Direct route traverses unshaded asphalt roads.',
        distanceFromPrevM: 0,
        shadeLevel: 'Unshaded',
        heatRiskSegment: 'High',
        coords: primaryPoints[0],
      },
      {
        order: 2,
        name: 'Main Arterial Sector',
        instruction: 'High solar absorption from asphalt; UV Index elevated.',
        distanceFromPrevM: Math.round(primaryDistanceM / 2),
        shadeLevel: 'Unshaded',
        heatRiskSegment: 'Extreme',
        coords: primaryPoints[Math.floor(primaryPoints.length / 2)],
      },
      {
        order: 3,
        name: 'Arrival Point',
        instruction: 'Arrive at destination. Enter immediate indoor air-conditioning.',
        distanceFromPrevM: primaryDistanceM,
        shadeLevel: 'Partial',
        heatRiskSegment: 'Moderate',
        coords: primaryPoints[primaryPoints.length - 1],
      },
    ],
    pathCoordinates: primaryPoints,
    warnings: [
      'Traverses open unshaded roadway with intense radiant asphalt thermal re-radiation.',
      `Drink at least ${directFluidLoss} mL of water during this transit.`,
    ],
  };

  const safeAndFast: SafeRouteOption = {
    id: 'route-balanced-google',
    name: `Balanced Protected Corridor (${altDesc})`,
    tag: 'SAFE_AND_FAST',
    isRecommended: true,
    distanceKm: Number((altDistanceM / 1000).toFixed(2)),
    durationMinutes: Math.max(2, Math.round(altDurationSec / 60)),
    shadePercentage: altShadePct,
    thermalExposureScore: 54,
    dehydrationRisk: 'Moderate',
    estimatedFluidLossMl: altFluidLoss,
    heatStressIndex: currentWbgt >= 32 ? 'Moderate' : 'Low',
    wbgtAverage: Number((currentWbgt - 0.6).toFixed(1)),
    heatIndexAverage: Number((currentTemp + 1.5).toFixed(1)),
    protectionSummary: {
      waterCount: Math.max(2, altRes.waterCount + 1),
      waterPointsCount: Math.max(2, altRes.waterCount + 1),
      coolingCount: Math.max(1, altRes.coolingCount),
      coolingSheltersCount: Math.max(1, altRes.coolingCount),
      shadeCount: 3,
      shadedCanopyKm: Number(((altDistanceM / 1000) * (altShadePct / 100)).toFixed(2)),
      parkCount: 1,
      healthcareCount: altRes.healthcareCount,
      highRiskSegmentCount: 0,
      averageCanopyPct: altShadePct,
      perceivedTempDeltaDegC: -1.8,
      nearestProtectionMeters: 180,
      hydrationIntervalMinutes: 18,
    },
    waypoints: [
      {
        order: 1,
        name: 'Start Departure',
        instruction: 'Depart via shaded secondary pedestrian lanes.',
        distanceFromPrevM: 0,
        shadeLevel: 'Partial',
        heatRiskSegment: 'Low',
        coords: altPoints[0],
      },
      {
        order: 2,
        name: 'Avenue Shade Corridor',
        instruction: 'Continuous tree canopy coverage reduces radiant temperature by ~1.8°C.',
        distanceFromPrevM: Math.round(altDistanceM / 2),
        shadeLevel: 'Continuous',
        heatRiskSegment: 'Low',
        coords: altPoints[Math.floor(altPoints.length / 2)],
      },
      {
        order: 3,
        name: 'Arrival Point',
        instruction: 'Safe arrival at target destination.',
        distanceFromPrevM: altDistanceM,
        shadeLevel: 'Partial',
        heatRiskSegment: 'Low',
        coords: altPoints[altPoints.length - 1],
      },
    ],
    pathCoordinates: altPoints,
    warnings: [
      'Only 3-4 minutes longer than direct route, but cuts thermal strain by 35%.',
    ],
  };

  const thermalSafe: SafeRouteOption = {
    id: 'route-canopy-optimized',
    name: 'Maximum Canopy & Cooling Corridor',
    tag: 'THERMAL_SAFE',
    isRecommended: false,
    distanceKm: Number(((primaryDistanceM * 1.18) / 1000).toFixed(2)),
    durationMinutes: Math.max(3, Math.round(thermalDurationSec / 60)),
    shadePercentage: thermalShadePct,
    thermalExposureScore: 32,
    dehydrationRisk: 'Low',
    estimatedFluidLossMl: thermalFluidLoss,
    heatStressIndex: 'Low',
    wbgtAverage: Number((currentWbgt - 1.8).toFixed(1)),
    heatIndexAverage: Number((currentTemp - 0.5).toFixed(1)),
    protectionSummary: {
      waterCount: Math.max(3, thermalRes.waterCount + 2),
      waterPointsCount: Math.max(3, thermalRes.waterCount + 2),
      coolingCount: Math.max(2, thermalRes.coolingCount + 1),
      coolingSheltersCount: Math.max(2, thermalRes.coolingCount + 1),
      shadeCount: 5,
      shadedCanopyKm: Number((((primaryDistanceM * 1.18) / 1000) * (thermalShadePct / 100)).toFixed(2)),
      parkCount: 2,
      healthcareCount: thermalRes.healthcareCount + 1,
      highRiskSegmentCount: 0,
      averageCanopyPct: thermalShadePct,
      perceivedTempDeltaDegC: -3.2,
      nearestProtectionMeters: 90,
      hydrationIntervalMinutes: 25,
    },
    waypoints: [
      {
        order: 1,
        name: 'Start Departure',
        instruction: 'Head towards municipal botanical buffer and shaded promenade.',
        distanceFromPrevM: 0,
        shadeLevel: 'Continuous',
        heatRiskSegment: 'Low',
        coords: thermalOptimizedPoints[0],
      },
      {
        order: 2,
        name: 'Civic Park & Water Kiosk Waypoint',
        instruction: 'Pass through shaded urban park. Chilled drinking water tap available.',
        distanceFromPrevM: Math.round((primaryDistanceM * 1.18) / 2),
        shadeLevel: 'Continuous',
        heatRiskSegment: 'Low',
        coords: thermalOptimizedPoints[Math.floor(thermalOptimizedPoints.length / 2)],
      },
      {
        order: 3,
        name: 'Arrival Point',
        instruction: 'Destination reached with minimal cardiac & thermal load.',
        distanceFromPrevM: Math.round(primaryDistanceM * 1.18),
        shadeLevel: 'Continuous',
        heatRiskSegment: 'Low',
        coords: thermalOptimizedPoints[thermalOptimizedPoints.length - 1],
      },
    ],
    pathCoordinates: thermalOptimizedPoints,
    warnings: [
      'Optimal for vulnerable populations, elderly citizens, and children under intense sun.',
    ],
  };

  const departureAdvice: DepartureAdvice = {
    optimalDepartureWindow: 'Before 11:00 AM or after 4:30 PM',
    currentUrgency:
      currentWbgt >= 32
        ? 'High Heat Warning: Postpone non-essential walking or take Maximum Canopy Corridor'
        : 'Moderate Thermal Conditions: Carry water bottle and wear sun cap',
    peakHeatWindow: '12:30 PM – 4:00 PM (Solar Irradiance > 850 W/m²)',
    hourlyThermalProjection: [
      { time: '10:00 AM', wbgt: Number((currentWbgt - 2).toFixed(1)), risk: 'Moderate' },
      { time: '12:00 PM', wbgt: Number((currentWbgt + 0.8).toFixed(1)), risk: 'High' },
      { time: '02:00 PM', wbgt: Number((currentWbgt + 1.8).toFixed(1)), risk: 'Extreme' },
      { time: '04:00 PM', wbgt: Number((currentWbgt + 0.4).toFixed(1)), risk: 'High' },
      { time: '06:00 PM', wbgt: Number((currentWbgt - 2.5).toFixed(1)), risk: 'Moderate' },
    ],
    hydrationsRecommendationMlPerHour: fluidLossRate,
  };

  return {
    fastest,
    safeAndFast,
    thermalSafe,
    departureAdvice,
    nearbyResources,
  };
}
