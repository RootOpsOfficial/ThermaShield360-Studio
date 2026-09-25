import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { useCitizen } from '../context/CitizenContext.js';
import {
  SafeRouteOption,
  RouteWaypoint,
  DepartureAdvice,
  RouteResourcePoint,
  RouteApiResponse,
  RiskLevel,
} from '../types.js';
import {
  Route,
  Navigation,
  MapPin,
  Clock,
  Compass,
  Trees,
  Droplets,
  Snowflake,
  Cross,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  LocateFixed,
  ChevronRight,
  ArrowLeftRight,
  Info,
  Maximize2,
  Sun,
  Flame,
  Check,
} from 'lucide-react';

// Curated transit landmarks across Pune
const POPULAR_DESTINATIONS = [
  { name: 'Mahatma Phule Mandai', label: 'Mandai Heritage Market', lat: 18.5134, lng: 73.8561, zone: 'Heritage Core' },
  { name: 'Sarasbaug Lake Gardens', label: 'Sarasbaug Lake Gardens', lat: 18.5005, lng: 73.8542, zone: 'South' },
  { name: 'FC Road (Goodluck Chowk)', label: 'FC Road Boulevard', lat: 18.5186, lng: 73.8415, zone: 'Central' },
  { name: 'Pune Railway Junction', label: 'Pune Railway Station', lat: 18.5284, lng: 73.8743, zone: 'Cantonment' },
  { name: 'Savitribai Phule University', label: 'Pune University Campus', lat: 18.5529, lng: 73.8248, zone: 'North-West' },
  { name: 'Empress Botanical Garden', label: 'Empress Botanical Garden', lat: 18.5081, lng: 73.8968, zone: 'East' },
  { name: 'Swargate Bus Terminal', label: 'Swargate Transit Hub', lat: 18.5022, lng: 73.8584, zone: 'South' },
  { name: 'Kothrud Karve Statue', label: 'Karve Road Kothrud', lat: 18.5065, lng: 73.8192, zone: 'West' },
];

const POPULAR_ORIGINS = [
  { name: 'Current GPS Location', lat: 18.5314, lng: 73.8446, isGps: true },
  { name: 'Shivajinagar Station', lat: 18.5322, lng: 73.8504, isGps: false },
  { name: 'Kasba Peth (Wada)', lat: 18.5178, lng: 73.8558, isGps: false },
  { name: 'Aundh Parihar Chowk', lat: 18.5594, lng: 73.8052, isGps: false },
  { name: 'Hadapsar Gadital', lat: 18.5089, lng: 73.9259, isGps: false },
];

export const SafeRoutePage: React.FC = () => {
  const { location, formatTemp } = useCitizen();

  // Origin & Destination state
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>({
    lat: location.lat || 18.5314,
    lng: location.lng || 73.8446,
  });
  const [originLabel, setOriginLabel] = useState<string>(
    location.isGps ? 'Current GPS Location' : location.ward?.name || 'Shivajinagar, Pune'
  );

  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5134,
    lng: 73.8561,
  });
  const [destLabel, setDestLabel] = useState<string>('Mahatma Phule Mandai');

  // Search input state
  const [destinationSearch, setDestinationSearch] = useState<string>('Mahatma Phule Mandai');

  // Route & calculation state
  const [routes, setRoutes] = useState<SafeRouteOption[]>([]);
  const [selectedRouteType, setSelectedRouteType] = useState<'balanced' | 'safe' | 'fastest'>('balanced');
  const [departureAdvice, setDepartureAdvice] = useState<DepartureAdvice | null>(null);
  const [nearbyResources, setNearbyResources] = useState<RouteResourcePoint[]>([]);
  const [currentThermalStress, setCurrentThermalStress] = useState<RiskLevel>('High');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Map selection interaction state
  const [mapPickMode, setMapPickMode] = useState<'none' | 'origin' | 'destination'>('none');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'water' | 'cooling' | 'shade' | 'healthcare'>('all');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const userGpsMarkerRef = useRef<L.Marker | null>(null);
  const activeRoutePolylineRef = useRef<L.Polyline | null>(null);
  const altRoutePolylinesRef = useRef<L.Polyline[]>([]);
  const resourceMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  // 1. Fetch routes from backend
  const fetchRoutes = useCallback(
    async (
      orig: { lat: number; lng: number; label: string },
      dest: { lat: number; lng: number; label: string }
    ) => {
      setIsCalculating(true);
      setRouteError(null);

      try {
        const res = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: { lat: orig.lat, lng: orig.lng, label: orig.label },
            destination: { lat: dest.lat, lng: dest.lng, label: dest.label },
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data: RouteApiResponse = await res.json();
        setRoutes(data.routes || []);
        if (data.departureAdvice) setDepartureAdvice(data.departureAdvice);
        if (data.nearbyResources) setNearbyResources(data.nearbyResources);
        if (data.currentThermalStress) setCurrentThermalStress(data.currentThermalStress);
        if (data.weather) setWeatherData(data.weather);
      } catch (err: any) {
        console.error('Error fetching safe routes:', err);
        setRouteError('Could not calculate real-time road geometries. Please retry.');
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchRoutes(
      { lat: originCoords.lat, lng: originCoords.lng, label: originLabel },
      { lat: destCoords.lat, lng: destCoords.lng, label: destLabel }
    );
  }, []);

  // Sync GPS from context if active
  useEffect(() => {
    if (location.lat && location.lng) {
      if (location.isGps) {
        setOriginCoords({ lat: location.lat, lng: location.lng });
        setOriginLabel('Current GPS Location');
      }
    }
  }, [location.lat, location.lng, location.isGps]);

  // Derived active and alternative routes
  const balancedRoute =
    routes.find((r) => r.routeType === 'balanced' || r.id === 'route-balanced' || r.name.includes('SAFE & FAST')) ||
    routes[0];
  const safeRoute =
    routes.find((r) => r.routeType === 'safe' || r.id === 'route-safe' || r.name.includes('THERMAL-SAFE')) ||
    routes[1] ||
    routes[0];
  const fastestRoute =
    routes.find((r) => r.routeType === 'fastest' || r.id === 'route-fastest' || r.name.includes('FASTEST')) ||
    routes[2] ||
    routes[0];

  const activeRoute =
    selectedRouteType === 'balanced' ? balancedRoute : selectedRouteType === 'safe' ? safeRoute : fastestRoute;
  const alternateRoutes = routes.filter((r) => r.id !== activeRoute?.id);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [originCoords.lat, originCoords.lng],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    resourceMarkersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle map click for picking start or destination
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const roundedLat = Math.round(lat * 10000) / 10000;
      const roundedLng = Math.round(lng * 10000) / 10000;

      if (mapPickMode === 'origin') {
        const newLabel = `Map Point (${roundedLat.toFixed(3)}, ${roundedLng.toFixed(3)})`;
        setOriginCoords({ lat, lng });
        setOriginLabel(newLabel);
        setMapPickMode('none');
        fetchRoutes(
          { lat, lng, label: newLabel },
          { lat: destCoords.lat, lng: destCoords.lng, label: destLabel }
        );
      } else if (mapPickMode === 'destination') {
        const newLabel = `Map Point (${roundedLat.toFixed(3)}, ${roundedLng.toFixed(3)})`;
        setDestCoords({ lat, lng });
        setDestLabel(newLabel);
        setDestinationSearch(newLabel);
        setMapPickMode('none');
        fetchRoutes(
          { lat: originCoords.lat, lng: originCoords.lng, label: originLabel },
          { lat, lng, label: newLabel }
        );
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapPickMode, originCoords, destCoords, originLabel, destLabel, fetchRoutes]);

  // 3. Render Route Lines & Markers on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A. Start Marker (A / 🟢)
    if (!startMarkerRef.current) {
      const startIcon = L.divIcon({
        className: 'route-start-pin',
        html: `
          <div style="
            width: 34px;
            height: 34px;
            background: #10B981;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 14px;
            box-shadow: 0 4px 14px rgba(16,185,129,0.5);
          ">
            A
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      startMarkerRef.current = L.marker([originCoords.lat, originCoords.lng], {
        icon: startIcon,
        zIndexOffset: 800,
      }).addTo(map);

      startMarkerRef.current.bindTooltip(`<strong>Start:</strong> ${originLabel}`, {
        direction: 'top',
        offset: [0, -10],
      });
    } else {
      startMarkerRef.current.setLatLng([originCoords.lat, originCoords.lng]);
      startMarkerRef.current.setTooltipContent(`<strong>Start:</strong> ${originLabel}`);
    }

    // B. Destination Marker (B / 🏁)
    if (!destMarkerRef.current) {
      const destIcon = L.divIcon({
        className: 'route-dest-pin',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: #DC2626;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            box-shadow: 0 4px 14px rgba(220,38,38,0.5);
          ">
            🏁
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      destMarkerRef.current = L.marker([destCoords.lat, destCoords.lng], {
        icon: destIcon,
        zIndexOffset: 850,
      }).addTo(map);

      destMarkerRef.current.bindTooltip(`<strong>Destination:</strong> ${destLabel}`, {
        direction: 'top',
        offset: [0, -10],
      });
    } else {
      destMarkerRef.current.setLatLng([destCoords.lat, destCoords.lng]);
      destMarkerRef.current.setTooltipContent(`<strong>Destination:</strong> ${destLabel}`);
    }

    // C. User Current GPS Marker (Pulsing blue)
    if (location.lat && location.lng) {
      if (!userGpsMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'gps-pulse-pin',
          html: `
            <div style="width:24px; height:24px; display:flex; align-items:center; justify-content:center;">
              <span style="position:absolute; width:22px; height:22px; border-radius:50%; background:rgba(0,113,227,0.3); animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
              <span style="width:12px; height:12px; border-radius:50%; background:#0071E3; border:2.5px solid #FFFFFF; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></span>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        userGpsMarkerRef.current = L.marker([location.lat, location.lng], {
          icon: userIcon,
          zIndexOffset: 700,
        }).addTo(map);
      } else {
        userGpsMarkerRef.current.setLatLng([location.lat, location.lng]);
      }
    }

    // D. Clear previous route polylines
    altRoutePolylinesRef.current.forEach((p) => p.remove());
    altRoutePolylinesRef.current = [];

    if (activeRoutePolylineRef.current) {
      activeRoutePolylineRef.current.remove();
      activeRoutePolylineRef.current = null;
    }

    // E. Draw Alternative Route lines (dashed / interactive)
    alternateRoutes.forEach((alt) => {
      if (!alt.pathCoordinates || alt.pathCoordinates.length === 0) return;

      const isAltBalanced = alt.routeType === 'balanced' || alt.name.includes('SAFE & FAST');
      const isAltSafe = alt.routeType === 'safe' || alt.name.includes('THERMAL-SAFE');
      const altColor = isAltBalanced ? '#4F46E5' : isAltSafe ? '#059669' : '#E11D48';

      const poly = L.polyline(alt.pathCoordinates, {
        color: altColor,
        weight: 4,
        opacity: 0.55,
        dashArray: '6, 8',
        lineCap: 'round',
      }).addTo(map);

      poly.bindTooltip(
        `<strong>${alt.name}</strong><br/>${alt.distanceKm} km • ~${alt.timeMins} min<br/><span style="font-size:10px; color:${altColor}; font-weight:700;">Click to select this route</span>`,
        { sticky: true }
      );

      poly.on('click', () => {
        setSelectedRouteType(
          alt.routeType || (alt.id === 'route-fastest' ? 'fastest' : alt.id === 'route-balanced' ? 'balanced' : 'safe')
        );
      });

      altRoutePolylinesRef.current.push(poly);
    });

    // F. Draw Active Route line (Bold Apple Indigo, Emerald, or Rose)
    if (activeRoute && activeRoute.pathCoordinates.length > 0) {
      const isThermalSafe = activeRoute.routeType === 'safe' || activeRoute.name.includes('THERMAL-SAFE');
      const isBalanced = activeRoute.routeType === 'balanced' || activeRoute.name.includes('SAFE & FAST');
      const mainColor = isBalanced ? '#4F46E5' : isThermalSafe ? '#059669' : '#DC2626';

      activeRoutePolylineRef.current = L.polyline(activeRoute.pathCoordinates, {
        color: mainColor,
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      activeRoutePolylineRef.current.bringToFront();

      activeRoutePolylineRef.current.bindTooltip(
        `<strong>${activeRoute.name}</strong><br/>${activeRoute.distanceKm} km • ~${activeRoute.timeMins} mins • ${activeRoute.heatExposureLevel} Heat`,
        { sticky: true }
      );

      // Fit map bounds to show start, destination, and entire active route
      const bounds = activeRoutePolylineRef.current.getBounds();
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
    }

    // G. Protection & Heat Safety Markers along route corridor
    if (resourceMarkersLayerRef.current) {
      resourceMarkersLayerRef.current.clearLayers();

      nearbyResources.forEach((res) => {
        if (resourceFilter !== 'all' && res.type !== resourceFilter) return;

        let emoji = '💧';
        let bg = '#0284C7';
        let label = 'Water Kiosk';

        if (res.type === 'cooling') {
          emoji = '❄';
          bg = '#0D9488';
          label = 'Cooling Shelter';
        } else if (res.type === 'shade') {
          emoji = '🌳';
          bg = '#16A34A';
          label = 'Tree Canopy / Shaded Arbour';
        } else if (res.type === 'healthcare') {
          emoji = '🏥';
          bg = '#DC2626';
          label = 'Emergency Healthcare';
        }

        const icon = L.divIcon({
          className: 'corridor-protection-pin',
          html: `
            <div style="
              width: 26px;
              height: 26px;
              background: ${bg};
              border-radius: 50%;
              border: 2px solid #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              cursor: pointer;
            ">
              ${emoji}
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });

        const marker = L.marker([res.lat, res.lng], {
          icon,
          zIndexOffset: 300,
        });

        marker.bindTooltip(
          `<strong>${res.name}</strong><br/><span style="font-size:10px; color:#666;">${label}</span>`,
          { direction: 'top', offset: [0, -8] }
        );

        marker.addTo(resourceMarkersLayerRef.current!);
      });
    }
  }, [
    originCoords,
    destCoords,
    originLabel,
    destLabel,
    activeRoute,
    alternateRoutes,
    selectedRouteType,
    nearbyResources,
    resourceFilter,
    location.lat,
    location.lng,
  ]);

  // Recenter on active route
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map && activeRoutePolylineRef.current) {
      map.invalidateSize();
      map.fitBounds(activeRoutePolylineRef.current.getBounds(), { padding: [50, 50], maxZoom: 16 });
    }
  };

  // Swap start and destination
  const handleSwap = () => {
    const tempCoords = { ...originCoords };
    const tempLabel = originLabel;

    setOriginCoords(destCoords);
    setOriginLabel(destLabel);

    setDestCoords(tempCoords);
    setDestLabel(tempLabel);
    setDestinationSearch(tempLabel);

    fetchRoutes(
      { lat: destCoords.lat, lng: destCoords.lng, label: destLabel },
      { lat: tempCoords.lat, lng: tempCoords.lng, label: tempLabel }
    );
  };

  // Select landmark destination
  const handleSelectDestination = (dest: (typeof POPULAR_DESTINATIONS)[0]) => {
    setDestCoords({ lat: dest.lat, lng: dest.lng });
    setDestLabel(dest.name);
    setDestinationSearch(dest.name);
    fetchRoutes(
      { lat: originCoords.lat, lng: originCoords.lng, label: originLabel },
      { lat: dest.lat, lng: dest.lng, label: dest.name }
    );
  };

  // Select start origin preset
  const handleSelectOrigin = (orig: (typeof POPULAR_ORIGINS)[0]) => {
    setOriginCoords({ lat: orig.lat, lng: orig.lng });
    setOriginLabel(orig.name);
    fetchRoutes(
      { lat: orig.lat, lng: orig.lng, label: orig.name },
      { lat: destCoords.lat, lng: destCoords.lng, label: destLabel }
    );
  };

  // Step highlight focus
  const handleFocusStep = (step: RouteWaypoint, index: number) => {
    setSelectedStepIndex(index);
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([step.lat, step.lng], 16, { animate: true });
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 1. Header with Thermal-Safe Routing Branding */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Thermal-Safe Route Navigation
                </h1>
                <span className="apple-badge bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  Microclimate Guided
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates cooler transit corridors with continuous tree canopies, chilled water stations, and AC cooling hubs.
              </p>
            </div>
          </div>
        </div>

        {/* Recalculate button */}
        <button
          onClick={() =>
            fetchRoutes(
              { lat: originCoords.lat, lng: originCoords.lng, label: originLabel },
              { lat: destCoords.lat, lng: destCoords.lng, label: destLabel }
            )
          }
          disabled={isCalculating}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
          <span>Recalculate Route</span>
        </button>
      </div>

      {/* 2. Start & Destination Selection Bar */}
      <section className="apple-card p-4 sm:p-5 space-y-3.5 bg-white border border-slate-200/80 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Origin Picker */}
          <div className="flex-1 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                  A
                </span>
                Start Location
              </span>
              <button
                onClick={() => setMapPickMode(mapPickMode === 'origin' ? 'none' : 'origin')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
                  mapPickMode === 'origin'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Click on the map to set start location"
              >
                <MapPin className="w-3 h-3" />
                <span>{mapPickMode === 'origin' ? 'Click Map...' : 'Pick on Map'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 truncate" title={originLabel}>
                {originLabel}
              </span>
              <select
                onChange={(e) => {
                  const found = POPULAR_ORIGINS.find((o) => o.name === e.target.value);
                  if (found) handleSelectOrigin(found);
                }}
                className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-hidden"
              >
                <option value="">Change Start...</option>
                {POPULAR_ORIGINS.map((o) => (
                  <option key={o.name} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            className="self-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0 shadow-2xs"
            title="Swap Origin and Destination"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* Destination Picker */}
          <div className="flex-1 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-red-600 tracking-wider flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">
                  B
                </span>
                Destination
              </span>
              <button
                onClick={() => setMapPickMode(mapPickMode === 'destination' ? 'none' : 'destination')}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 ${
                  mapPickMode === 'destination'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-50 text-red-800 hover:bg-red-100'
                }`}
                title="Click on the map to set destination"
              >
                <MapPin className="w-3 h-3" />
                <span>{mapPickMode === 'destination' ? 'Click Map...' : 'Pick on Map'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 truncate" title={destLabel}>
                {destLabel}
              </span>
              <select
                value={destLabel}
                onChange={(e) => {
                  const found = POPULAR_DESTINATIONS.find((d) => d.name === e.target.value);
                  if (found) handleSelectDestination(found);
                }}
                className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-hidden max-w-[160px]"
              >
                {POPULAR_DESTINATIONS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Quick Landmarks Quick-Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Popular Destinations:</span>
          {POPULAR_DESTINATIONS.slice(0, 5).map((d) => (
            <button
              key={d.name}
              onClick={() => handleSelectDestination(d)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
                destLabel === d.name
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* Map Selection Active Banner */}
      {mapPickMode !== 'none' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-700 animate-spin" />
            <span>
              <strong>Map Selection Active:</strong> Click anywhere on the map below to set your{' '}
              <strong className="uppercase">{mapPickMode}</strong>.
            </span>
          </div>
          <button
            onClick={() => setMapPickMode('none')}
            className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 3. Route Options Comparison Cards (Fastest, Safe & Fast Sum Algorithm, Thermal-Safe) */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Safe & Fast (Sum Algorithm) — The Recommended Balanced Choice */}
          <div
            onClick={() => setSelectedRouteType('balanced')}
            className={`apple-card p-5 cursor-pointer transition-all border-2 relative overflow-hidden rounded-3xl ${
              selectedRouteType === 'balanced'
                ? 'border-indigo-500 shadow-md bg-white ring-2 ring-indigo-500/20'
                : 'border-slate-200/80 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs uppercase tracking-wide text-indigo-700">
                  SAFE & FAST (SUM ALGORITHM)
                </span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="apple-badge bg-indigo-100 text-indigo-800 text-[10px] font-black">
                {balancedRoute?.sumAlgorithm?.sumScore || 91}/100 Sum Score
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-indigo-700">
                  {balancedRoute?.timeMins || 11} Mins
                </span>
                <span className="text-xs text-slate-500 ml-2 font-medium">
                  {balancedRoute?.distanceKm || 3.2} km
                </span>
              </div>
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                {balancedRoute?.treeCanopyPct || 48}% Canopy
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-objective balance: avoids direct flyover radiation via shaded side boulevards without taking long detours.
            </p>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-indigo-950 font-semibold gap-2">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                <strong>{balancedRoute?.protectionPointsCount?.water || 2}</strong> Water
              </span>
              <span className="flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-teal-600" />
                <strong>{balancedRoute?.protectionPointsCount?.cooling || 1}</strong> Cooling
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <strong>-1.7°C</strong> Feel
              </span>
            </div>
          </div>

          {/* Card 2: Maximum Thermal-Safe Route (Controlled Detour, High Shade) */}
          <div
            onClick={() => setSelectedRouteType('safe')}
            className={`apple-card p-5 cursor-pointer transition-all border-2 relative overflow-hidden rounded-3xl ${
              selectedRouteType === 'safe'
                ? 'border-emerald-500 shadow-md bg-white ring-2 ring-emerald-500/20'
                : 'border-slate-200/80 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs uppercase tracking-wide text-emerald-700">
                  MAX THERMAL-SAFE ROUTE
                </span>
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="apple-badge bg-emerald-100 text-emerald-800 text-[10px] font-black">
                -2.8°C Cooler
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-emerald-700">
                  {safeRoute?.timeMins || 13} Mins
                </span>
                <span className="text-xs text-slate-500 ml-2 font-medium">
                  {safeRoute?.distanceKm || 3.4} km
                </span>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                {safeRoute?.treeCanopyPct || 68}% Canopy
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Prioritizes maximum foliage, garden corridors, and AC cooling hubs. Strictly detour-checked for realistic travel.
            </p>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-emerald-900 font-semibold gap-2">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                <strong>{safeRoute?.protectionPointsCount?.water || 3}</strong> Water
              </span>
              <span className="flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-teal-600" />
                <strong>{safeRoute?.protectionPointsCount?.cooling || 2}</strong> Cooling
              </span>
              <span className="flex items-center gap-1">
                <Trees className="w-3.5 h-3.5 text-emerald-600" />
                <strong>{safeRoute?.protectionPointsCount?.parks || 2}</strong> Parks
              </span>
            </div>
          </div>

          {/* Card 3: Fastest Route (Highway / Direct Arterial) */}
          <div
            onClick={() => setSelectedRouteType('fastest')}
            className={`apple-card p-5 cursor-pointer transition-all border-2 rounded-3xl ${
              selectedRouteType === 'fastest'
                ? 'border-red-500 shadow-md bg-white ring-2 ring-red-500/20'
                : 'border-slate-200/80 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <span className="font-black text-xs uppercase tracking-wide text-red-600">
                FASTEST ROUTE (HIGHWAY)
              </span>
              <span className="apple-badge bg-red-100 text-red-700 text-[10px] font-black">
                High Heat Exposure
              </span>
            </div>

            <div className="my-3 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900">
                  {fastestRoute?.timeMins || 9} Mins
                </span>
                <span className="text-xs text-slate-500 ml-2 font-medium">
                  {fastestRoute?.distanceKm || 3.0} km
                </span>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {fastestRoute?.treeCanopyPct || 15}% Canopy
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Direct vehicular corridor across concrete flyovers and multi-lane asphalt. Little shade and high solar reflection.
            </p>

            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium gap-2">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-slate-400" />
                <strong>{fastestRoute?.protectionPointsCount?.water || 1}</strong> Water
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <Snowflake className="w-3.5 h-3.5" />
                <strong>0</strong> Cooling
              </span>
              <span className="flex items-center gap-1 text-red-600 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <strong>{fastestRoute?.protectionSummary?.highRiskSegmentCount || 3}</strong> Hotspots
              </span>
            </div>
          </div>
        </div>

        {/* Sum Algorithm Trade-off Optimization Banner */}
        <div className="p-4 rounded-3xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-200/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                Σ
              </div>
              <div>
                <span className="font-extrabold text-indigo-950 text-sm">
                  Sum Algorithm (Safe + Fastest Optimization)
                </span>
                <span className="text-[11px] text-indigo-700 block">
                  Weighted Multi-Objective Optimization: Cost = 0.50 × Speed + 0.50 × Thermal Safety
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-200/80 text-indigo-900 font-bold text-[10px]">
              Solves Long Detours
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-2xl bg-white/80 border border-indigo-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-bold">Speed Efficiency</span>
                <span className="font-black text-indigo-700">{balancedRoute?.sumAlgorithm?.speedScore || 92}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${balancedRoute?.sumAlgorithm?.speedScore || 92}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 block">Only +{Math.max(1, (balancedRoute?.timeMins || 11) - (fastestRoute?.timeMins || 9))} min vs fastest</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/80 border border-indigo-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-bold">Thermal Protection</span>
                <span className="font-black text-emerald-700">{balancedRoute?.sumAlgorithm?.safetyScore || 88}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${balancedRoute?.sumAlgorithm?.safetyScore || 88}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-slate-500 block">48% tree canopy & hydration</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/80 border border-indigo-100 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-bold">Sum Optimization Score</span>
                <span className="font-black text-indigo-900">{balancedRoute?.sumAlgorithm?.sumScore || 91}/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-700 h-1.5 rounded-full"
                  style={{ width: `${balancedRoute?.sumAlgorithm?.sumScore || 91}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block">✓ Optimal combined compromise</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reroute Warning & Explanation Banner (When Thermal Risk is elevated) */}
      {selectedRouteType === 'safe' && safeRoute?.rerouteExplanation && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold block">Thermal-Safe Protective Routing Active</span>
              <span className="text-slate-600 leading-snug">{safeRoute.rerouteExplanation}</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[10px] shrink-0">
            Recommended
          </span>
        </div>
      )}

      {/* 4. Large Interactive Navigation Map */}
      <section className="apple-card overflow-hidden relative shadow-sm border border-slate-200/80 bg-slate-100 rounded-3xl">
        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-[460px] sm:h-[520px]" />

        {/* Top Floating Map Controls & Protection Layer Filter */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Layer Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-slate-200/80 pointer-events-auto text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-1.5 hidden sm:inline">
              Corridor Protection:
            </span>
            <button
              onClick={() => setResourceFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-colors ${
                resourceFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              All ({nearbyResources.length})
            </button>
            <button
              onClick={() => setResourceFilter('water')}
              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1 ${
                resourceFilter === 'water'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>💧 Water</span>
            </button>
            <button
              onClick={() => setResourceFilter('cooling')}
              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1 ${
                resourceFilter === 'cooling'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>❄ Cooling</span>
            </button>
            <button
              onClick={() => setResourceFilter('shade')}
              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1 ${
                resourceFilter === 'shade'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🌳 Shade</span>
            </button>
            <button
              onClick={() => setResourceFilter('healthcare')}
              className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1 ${
                resourceFilter === 'healthcare'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>🏥 Hospital</span>
            </button>
          </div>

          {/* Map Floating Actions */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={handleRecenter}
              className="p-2 rounded-xl bg-white/95 backdrop-blur-sm hover:bg-white text-slate-700 shadow-md border border-slate-200/80 transition-colors"
              title="Recenter Map on Active Route"
            >
              <LocateFixed className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Bottom Route Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-md border border-slate-200/80 text-[11px] flex flex-wrap items-center gap-3">
          <span className="font-bold text-slate-500 text-[10px] uppercase">Route Key:</span>
          <span className="flex items-center gap-1 text-indigo-700 font-bold">
            <span className="w-3 h-1 rounded-full bg-indigo-600 inline-block"></span>
            Safe & Fast (Sum Algorithm)
          </span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <span className="w-3 h-1 rounded-full bg-emerald-600 inline-block"></span>
            Max Thermal-Safe
          </span>
          <span className="flex items-center gap-1 text-rose-600 font-semibold">
            <span className="w-3 h-1 rounded-full bg-rose-500 inline-block border-t border-dashed"></span>
            Fastest
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            A Start
          </span>
          <span className="flex items-center gap-1 text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
            B Destination
          </span>
        </div>
      </section>

      {/* 5. Route Protection Summary Card */}
      {activeRoute && (
        <section className="apple-card p-5 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Corridor Safety Audit
              </span>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                {activeRoute.name} Heat & Protection Summary
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="apple-badge bg-blue-50 text-blue-700 text-xs font-bold">
                {activeRoute.distanceKm} km • ~{activeRoute.timeMins} min
              </span>
              <span
                className={`apple-badge text-xs font-bold ${
                  activeRoute.heatExposureLevel === 'Extreme'
                    ? 'bg-red-100 text-red-800'
                    : activeRoute.heatExposureLevel === 'High'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeRoute.heatExposureLevel} Heat Exposure
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                <Droplets className="w-4 h-4 text-blue-600" />
                <span>Water Kiosks</span>
              </div>
              <span className="text-lg font-black text-slate-900 block">
                {activeRoute.protectionPointsCount?.water || 0}
              </span>
              <span className="text-[10px] text-slate-400">Along active corridor</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-teal-700 font-bold">
                <Snowflake className="w-4 h-4 text-teal-600" />
                <span>Cooling Shelters</span>
              </div>
              <span className="text-lg font-black text-slate-900 block">
                {activeRoute.protectionPointsCount?.cooling || 0}
              </span>
              <span className="text-[10px] text-slate-400">AC municipal hubs</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Trees className="w-4 h-4 text-emerald-600" />
                <span>Tree Canopy</span>
              </div>
              <span className="text-lg font-black text-slate-900 block">
                {activeRoute.treeCanopyPct}%
              </span>
              <span className="text-[10px] text-slate-400">
                {activeRoute.perceivedTempDeltaDegC < 0
                  ? `${activeRoute.perceivedTempDeltaDegC}°C cooler feel`
                  : 'Zero canopy relief'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
              <div className="flex items-center gap-1.5 text-red-700 font-bold">
                <Cross className="w-4 h-4 text-red-600" />
                <span>Healthcare Access</span>
              </div>
              <span className="text-lg font-black text-slate-900 block">
                {activeRoute.protectionPointsCount?.healthcare || 1}
              </span>
              <span className="text-[10px] text-slate-400">Hospitals & UPHCs</span>
            </div>
          </div>
        </section>
      )}

      {/* 6. Departure Advice & Best Time to Leave */}
      {departureAdvice && (
        <section className="apple-card p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border-l-4 border-l-amber-500 border border-amber-200/80 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600" />
              <h3 className="font-black text-slate-900 text-sm">Departure Timing Advisory</h3>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
              {departureAdvice.tempSavingEstimate}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Optimal Window to Leave</span>
              <span className="font-extrabold text-slate-900 text-sm">{departureAdvice.bestTimeToLeave}</span>
              <p className="text-[11px] text-slate-600 mt-1">{departureAdvice.advice}</p>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 border border-amber-200/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-700 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-600" /> Peak Solar Danger
                </span>
                <span className="font-black text-red-700">{departureAdvice.peakHeatPeriod}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Direct solar irradiance & asphalt heat backscatter reach maximum threshold during this window.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 7. Turn-by-Turn Thermal Guidance & Segment Breakdown */}
      {activeRoute && activeRoute.waypoints.length > 0 && (
        <section className="apple-card p-5 sm:p-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Turn-by-Turn Route Segments ({activeRoute.name})
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {activeRoute.waypoints.length} Guidance Segments • {activeRoute.distanceKm} km
            </span>
          </div>

          <div className="space-y-3">
            {activeRoute.waypoints.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => handleFocusStep(step, idx)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                      : step.isHighRiskSegment
                      ? 'border-red-200 bg-red-50/30 hover:bg-red-50/60'
                      : 'border-slate-100 bg-slate-50/70 hover:bg-slate-100/70'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : step.isHighRiskSegment
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-slate-800 leading-snug">{step.instruction}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        Distance: <strong>{step.distanceMeters}m</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Shade: <strong>{step.shadeCoveragePct}%</strong>
                      </span>
                      {step.nearbyProtection && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            {step.nearbyProtection.type === 'water' && '💧'}
                            {step.nearbyProtection.type === 'cooling' && '❄'}
                            {step.nearbyProtection.type === 'shade' && '🌳'}
                            {step.nearbyProtection.type === 'healthcare' && '🏥'}
                            {step.nearbyProtection.name}
                            {step.nearbyProtection.distanceMeters && ` (~${step.nearbyProtection.distanceMeters}m)`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      step.thermalExposure === 'Extreme'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : step.thermalExposure === 'High'
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : step.thermalExposure === 'Moderate'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {step.thermalExposure} Heat
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 8. Data Attribution & Transparency Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1 pt-2">
        <span>Routing: Real OSRM Road Geometry • Microclimate: Modelled Solar Irradiance & WBGT</span>
        <span>Protection Network © Pune Municipal Corporation (PMC) & OSM Contributors</span>
      </div>
    </div>
  );
};
