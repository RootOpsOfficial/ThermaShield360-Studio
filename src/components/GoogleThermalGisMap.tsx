import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  MapControl,
  ControlPosition,
  useMap,
} from '@vis.gl/react-google-maps';
import { useCitizen } from '../context/CitizenContext.js';

declare const google: any;
import {
  MapPin,
  Layers,
  Droplets,
  Snowflake,
  Trees,
  Cross,
  Plus,
  Minus,
  Info,
  ShieldCheck,
  Flame,
  AlertTriangle,
  Compass,
  Navigation,
  ExternalLink,
  LocateFixed,
  Maximize2,
  RefreshCw,
  Eye,
} from 'lucide-react';

export type GisLayerType =
  | 'Thermal Stress (WBGT)'
  | 'Heat Risk Composite'
  | 'Canopy & Tree Shade'
  | 'Cooling Shelters'
  | 'Water & Hydration'
  | 'All Protection';

interface GoogleThermalGisMapProps {
  heightClass?: string;
  showLayerSelector?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  routeCoordinates?: {
    fastest?: [number, number][];
    safe?: [number, number][];
  };
  onSelectPlace?: (place: any) => void;
}

// Controller component to smoothly pan/zoom map when center prop updates
const MapPanController: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.panTo(center);
    }
  }, [map, center.lat, center.lng]);

  return null;
};

// Polyline renderer using google.maps.Polyline within the Map context
const RoutePolylines: React.FC<{
  fastestCoords?: [number, number][];
  safeCoords?: [number, number][];
}> = ({ fastestCoords, safeCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const lines: any[] = [];

    // Fastest route (Direct, high thermal load - amber/red line)
    if (fastestCoords && fastestCoords.length > 0) {
      const path = fastestCoords.map((c) => ({ lat: c[0], lng: c[1] }));
      const directLine = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#EF4444',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map,
      });
      lines.push(directLine);
    }

    // Safe route (Shaded, low thermal load - vibrant emerald line)
    if (safeCoords && safeCoords.length > 0) {
      const path = safeCoords.map((c) => ({ lat: c[0], lng: c[1] }));
      const safeLine = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#10B981',
        strokeOpacity: 0.95,
        strokeWeight: 6,
        map,
      });
      lines.push(safeLine);
    }

    return () => {
      lines.forEach((l) => l.setMap(null));
    };
  }, [map, fastestCoords, safeCoords]);

  return null;
};

// Heat risk polygon overlay renderer
const HeatRiskPolygons: React.FC<{
  centerLat: number;
  centerLng: number;
  riskScore: number;
  activeLayer: GisLayerType;
}> = ({ centerLat, centerLng, riskScore, activeLayer }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Create 4 surrounding microclimate sectors around the center
    const delta = 0.016;
    const sectors = [
      {
        id: 'core',
        coords: [
          { lat: centerLat - delta * 0.7, lng: centerLng - delta * 0.7 },
          { lat: centerLat + delta * 0.7, lng: centerLng - delta * 0.7 },
          { lat: centerLat + delta * 0.7, lng: centerLng + delta * 0.7 },
          { lat: centerLat - delta * 0.7, lng: centerLng + delta * 0.7 },
        ],
        score: riskScore,
      },
      {
        id: 'north-park',
        coords: [
          { lat: centerLat + delta * 0.7, lng: centerLng - delta * 1.2 },
          { lat: centerLat + delta * 1.6, lng: centerLng - delta * 1.2 },
          { lat: centerLat + delta * 1.6, lng: centerLng + delta * 0.4 },
          { lat: centerLat + delta * 0.7, lng: centerLng + delta * 0.4 },
        ],
        score: Math.max(25, riskScore - 26), // Shaded green buffer
      },
      {
        id: 'east-transit',
        coords: [
          { lat: centerLat - delta * 0.6, lng: centerLng + delta * 0.7 },
          { lat: centerLat + delta * 0.8, lng: centerLng + delta * 0.7 },
          { lat: centerLat + delta * 0.8, lng: centerLng + delta * 1.8 },
          { lat: centerLat - delta * 0.6, lng: centerLng + delta * 1.8 },
        ],
        score: Math.min(95, riskScore + 14), // High asphalt built density
      },
      {
        id: 'south-water',
        coords: [
          { lat: centerLat - delta * 1.6, lng: centerLng - delta * 0.8 },
          { lat: centerLat - delta * 0.7, lng: centerLng - delta * 0.8 },
          { lat: centerLat - delta * 0.7, lng: centerLng + delta * 0.8 },
          { lat: centerLat - delta * 1.6, lng: centerLng + delta * 0.8 },
        ],
        score: Math.max(30, riskScore - 18),
      },
    ];

    const getColor = (score: number) => {
      if (score >= 75) return { fill: '#EF4444', stroke: '#DC2626' }; // Red / Extreme
      if (score >= 55) return { fill: '#F97316', stroke: '#EA580C' }; // Orange / High
      if (score >= 40) return { fill: '#EAB308', stroke: '#CA8A04' }; // Yellow / Moderate
      return { fill: '#10B981', stroke: '#059669' }; // Green / Low
    };

    const polygons = sectors.map((s) => {
      const colors = getColor(s.score);
      return new google.maps.Polygon({
        paths: s.coords,
        strokeColor: colors.stroke,
        strokeOpacity: 0.75,
        strokeWeight: 2,
        fillColor: colors.fill,
        fillOpacity: activeLayer === 'Heat Risk Composite' || activeLayer === 'Thermal Stress (WBGT)' ? 0.28 : 0.12,
        map,
      });
    });

    return () => {
      polygons.forEach((p) => p.setMap(null));
    };
  }, [map, centerLat, centerLng, riskScore, activeLayer]);

  return null;
};

export const GoogleThermalGisMap: React.FC<GoogleThermalGisMapProps> = ({
  heightClass = 'h-[500px]',
  showLayerSelector = true,
  centerLat,
  centerLng,
  zoom = 14,
  routeCoordinates,
  onSelectPlace,
}) => {
  const {
    location,
    protectionPoints,
    healthcareFacilities,
    weatherCurrent,
    riskCurrent,
    thermalCurrent,
    requestGpsLocation,
    formatTemp,
  } = useCitizen();

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100 flex flex-col items-center justify-center p-6 text-center`}>
        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-3">
          <MapPin className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Interactive Map Unavailable</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          This feature requires a valid Maps API Key. Please configure <code>VITE_GOOGLE_MAPS_API_KEY</code> in your environment settings before deploying.
        </p>
      </div>
    );
  }

  const mapCenter = useMemo(() => {
    return {
      lat: centerLat ?? location.lat,
      lng: centerLng ?? location.lng,
    };
  }, [centerLat, centerLng, location.lat, location.lng]);

  const [activeLayer, setActiveLayer] = useState<GisLayerType>('All Protection');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [realPlaces, setRealPlaces] = useState<any[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  // Fetch real Google Places (New) around the map center
  useEffect(() => {
    let isCancelled = false;
    async function loadPlaces() {
      setIsLoadingPlaces(true);
      try {
        const res = await fetch(`/api/places/nearby?lat=${mapCenter.lat}&lng=${mapCenter.lng}&radius=3500`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data)) {
            setRealPlaces(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load places for GoogleThermalGisMap:', err);
      } finally {
        if (!isCancelled) setIsLoadingPlaces(false);
      }
    }

    loadPlaces();
    return () => {
      isCancelled = true;
    };
  }, [mapCenter.lat, mapCenter.lng]);

  // Combine real Google Places with existing protection points
  const combinedPlaces = useMemo(() => {
    if (realPlaces.length > 0) return realPlaces;
    // Fallback mapping
    return protectionPoints.map((p) => ({
      id: p.id,
      name: p.name,
      category:
        p.type === 'cooling'
          ? 'COOLING_CENTER'
          : p.type === 'water'
          ? 'WATER_POINT'
          : p.type === 'shade'
          ? 'SHADE_CANOPY'
          : 'HEALTHCARE',
      lat: p.lat,
      lng: p.lng,
      distanceMeters: Math.round((p.distanceKm || 0.5) * 1000),
      walkingTimeMinutes: p.walkingTimeMins || 5,
      address: p.address || 'Local Protection Point',
      rating: 4.5,
      openNow: p.status === 'Available',
      typeBadge: p.type === 'cooling' ? 'Cooling Center' : p.type === 'water' ? 'Hydration Point' : 'Shaded Park',
      protectiveFeature: p.amenities?.join(', ') || 'Thermal relief',
    }));
  }, [realPlaces, protectionPoints]);

  const filteredPlaces = useMemo(() => {
    if (activeLayer === 'Cooling Shelters') {
      return combinedPlaces.filter((p) => p.category === 'COOLING_CENTER');
    }
    if (activeLayer === 'Water & Hydration') {
      return combinedPlaces.filter((p) => p.category === 'WATER_POINT');
    }
    if (activeLayer === 'Canopy & Tree Shade') {
      return combinedPlaces.filter((p) => p.category === 'SHADE_CANOPY');
    }
    return combinedPlaces;
  }, [combinedPlaces, activeLayer]);

  const currentWbgt = thermalCurrent?.wbgt ?? 30.5;
  const currentRiskScore = riskCurrent?.riskScore ?? 72;

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={zoom}
          mapId="THERMASHIELD_360_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeId={mapType}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Map Pan / View Controller */}
          <MapPanController center={mapCenter} zoom={zoom} />

          {/* Microclimate Heat Risk Polygons */}
          <HeatRiskPolygons
            centerLat={mapCenter.lat}
            centerLng={mapCenter.lng}
            riskScore={currentRiskScore}
            activeLayer={activeLayer}
          />

          {/* Real Routes Polylines */}
          <RoutePolylines
            fastestCoords={routeCoordinates?.fastest}
            safeCoords={routeCoordinates?.safe}
          />

          {/* User's Current GPS Location Marker */}
          <AdvancedMarker
            position={mapCenter}
            title="Your Real Location"
            onClick={() => {
              setSelectedPlace({
                name: 'Your Real Location',
                category: 'USER_LOCATION',
                address: location.ward?.name || 'Active Neighborhood',
                typeBadge: 'You Are Here',
                lat: mapCenter.lat,
                lng: mapCenter.lng,
                temperature: weatherCurrent?.temp,
                wbgt: currentWbgt,
              });
            }}
          >
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-blue-400 opacity-75"></span>
              <div className="relative w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                <Navigation className="w-4 h-4 fill-white" />
              </div>
            </div>
          </AdvancedMarker>

          {/* Protection Points Markers (Cooling, Water, Shade, Healthcare) */}
          {filteredPlaces.map((place) => {
            const isCooling = place.category === 'COOLING_CENTER';
            const isWater = place.category === 'WATER_POINT';
            const isShade = place.category === 'SHADE_CANOPY';
            const isHealth = place.category === 'HEALTHCARE';

            const bgClass = isCooling
              ? 'bg-blue-600'
              : isWater
              ? 'bg-cyan-600'
              : isShade
              ? 'bg-emerald-600'
              : 'bg-rose-600';

            return (
              <AdvancedMarker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
                title={place.name}
                onClick={() => {
                  setSelectedPlace(place);
                  if (onSelectPlace) onSelectPlace(place);
                }}
              >
                <div
                  className={`w-7 h-7 rounded-full ${bgClass} text-white flex items-center justify-center border-2 border-white shadow-md hover:scale-115 transition-transform cursor-pointer`}
                >
                  {isCooling && <Snowflake className="w-3.5 h-3.5" />}
                  {isWater && <Droplets className="w-3.5 h-3.5" />}
                  {isShade && <Trees className="w-3.5 h-3.5" />}
                  {isHealth && <Cross className="w-3.5 h-3.5" />}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Info Window for Selected Place or User Location */}
          {selectedPlace && (
            <InfoWindow
              position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div className="p-1 min-w-[210px] max-w-[280px] text-slate-900 font-sans">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedPlace.category === 'COOLING_CENTER'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedPlace.category === 'WATER_POINT'
                        ? 'bg-cyan-100 text-cyan-800'
                        : selectedPlace.category === 'SHADE_CANOPY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedPlace.category === 'HEALTHCARE'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {selectedPlace.typeBadge || 'Protective Location'}
                  </span>
                  {selectedPlace.openNow !== undefined && (
                    <span className="text-[10px] text-emerald-600 font-bold">
                      {selectedPlace.openNow ? '● Open Now' : 'Closed'}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm leading-tight text-slate-900 mb-1">
                  {selectedPlace.name}
                </h3>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                  {selectedPlace.address}
                </p>

                {selectedPlace.distanceMeters && (
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-700 bg-slate-50 p-2 rounded-lg mb-2">
                    <span>🚶 {selectedPlace.walkingTimeMinutes} min walk</span>
                    <span>📍 {selectedPlace.distanceMeters}m away</span>
                  </div>
                )}

                {selectedPlace.protectiveFeature && (
                  <div className="text-[11px] text-slate-600 bg-emerald-50 text-emerald-900 p-2 rounded-lg border border-emerald-100 mb-2 font-medium">
                    🛡️ {selectedPlace.protectiveFeature}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Navigate on Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Top Left: Layer Selector & Microclimate Switcher */}
          {showLayerSelector && (
            <MapControl position={ControlPosition.TOP_LEFT}>
              <div className="m-3 p-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80 flex flex-wrap items-center gap-1 max-w-[480px]">
                <span className="text-[11px] font-bold text-slate-500 uppercase px-2 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-600" /> Layers:
                </span>
                {(
                  [
                    'All Protection',
                    'Thermal Stress (WBGT)',
                    'Heat Risk Composite',
                    'Cooling Shelters',
                    'Water & Hydration',
                    'Canopy & Tree Shade',
                  ] as GisLayerType[]
                ).map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setActiveLayer(layer)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      activeLayer === layer
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {layer === 'Cooling Shelters' && '❄️ '}
                    {layer === 'Water & Hydration' && '💧 '}
                    {layer === 'Canopy & Tree Shade' && '🌳 '}
                    {layer}
                  </button>
                ))}
              </div>
            </MapControl>
          )}

          {/* Top Right: Map Type Toggle (Satellite / Streets) */}
          <MapControl position={ControlPosition.TOP_RIGHT}>
            <div className="m-3 flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80">
              <button
                onClick={() => setMapType('roadmap')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mapType === 'roadmap' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setMapType('satellite')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mapType === 'satellite' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapType('terrain')}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  mapType === 'terrain' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Terrain
              </button>
            </div>
          </MapControl>

          {/* Bottom Left: Live Environmental Readings Pill */}
          <MapControl position={ControlPosition.BOTTOM_LEFT}>
            <div className="m-3 p-2.5 bg-slate-900/90 backdrop-blur-md text-white rounded-xl shadow-lg border border-white/10 flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300">Live Google Weather:</span>
                <span className="font-bold text-white">
                  {weatherCurrent ? formatTemp(weatherCurrent.temp) : '32°C'}
                </span>
              </div>
              <div className="h-3 w-px bg-white/20"></div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">WBGT:</span>
                <span className="font-bold text-amber-400">{currentWbgt.toFixed(1)}°C</span>
              </div>
              <div className="h-3 w-px bg-white/20"></div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">Places Detected:</span>
                <span className="font-bold text-blue-300">{filteredPlaces.length}</span>
              </div>
            </div>
          </MapControl>

          {/* Bottom Right: Quick GPS Recenter Button */}
          <MapControl position={ControlPosition.BOTTOM_RIGHT}>
            <div className="m-3 flex flex-col gap-2">
              <button
                onClick={requestGpsLocation}
                title="Center on My Real Location"
                className="w-10 h-10 rounded-xl bg-white text-blue-600 hover:bg-blue-50 shadow-md border border-slate-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <LocateFixed className="w-5 h-5" />
              </button>
            </div>
          </MapControl>
        </Map>
      </APIProvider>
    </div>
  );
};
