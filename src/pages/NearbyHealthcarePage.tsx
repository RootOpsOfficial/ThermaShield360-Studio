import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { useCitizen } from '../context/CitizenContext.js';
import { HealthcareFacility, HealthcareRouteResponse, HealthcareRouteStep } from '../types.js';
import {
  Cross,
  Phone,
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Bed,
  Search,
  RefreshCw,
  X,
  ExternalLink,
  LocateFixed,
  ChevronRight,
  Info,
  Shield,
  Layers,
  ArrowRight,
  Compass,
} from 'lucide-react';

// Popular Pune localities for manual selection if GPS is denied or for quick testing
const QUICK_LOCATIONS = [
  { name: 'Shivajinagar (Central Pune)', lat: 18.5314, lon: 73.8446 },
  { name: 'Kasba Peth (Heritage Core)', lat: 18.5196, lon: 73.8553 },
  { name: 'Kothrud (West Hills)', lat: 18.5074, lon: 73.8077 },
  { name: 'Aundh - Baner (North-West)', lat: 18.5580, lon: 73.8070 },
  { name: 'Hadapsar (East Industrial)', lat: 18.5089, lon: 73.9260 },
  { name: 'Viman Nagar (North-East)', lat: 18.5679, lon: 73.9143 },
  { name: 'Swargate - Parvati (South)', lat: 18.4988, lon: 73.8567 },
  { name: 'Deccan Gymkhana (Central West)', lat: 18.5167, lon: 73.8415 },
];

export const NearbyHealthcarePage: React.FC = () => {
  const { location, targetFacilityForDirections, setTargetFacilityForDirections } = useCitizen();

  // Coordinates state: default to user's ward center or Pune Shivajinagar
  const initialLat = location.ward?.center?.[0] || 18.5314;
  const initialLon = location.ward?.center?.[1] || 73.8446;

  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: initialLat,
    lon: initialLon,
  });

  const [locationLabel, setLocationLabel] = useState<string>(location.ward?.name || 'Shivajinagar, Pune');
  const [gpsStatus, setGpsStatus] = useState<'prompt' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('prompt');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Search, radius, and filter state
  const [radiusMeters, setRadiusMeters] = useState<number>(6000);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Details drawer / panel
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(null);

  // In-app navigation state
  const [navigationMode, setNavigationMode] = useState<boolean>(false);
  const [navDestination, setNavDestination] = useState<HealthcareFacility | null>(null);
  const [activeRoute, setActiveRoute] = useState<HealthcareRouteResponse | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const facilityMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);

  // 1. Fetch real healthcare facilities from Overpass backend API
  const fetchFacilities = useCallback(async (lat: number, lon: number, radius: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/healthcare/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data: HealthcareFacility[] = await res.json();
      setFacilities(data);
    } catch (err: any) {
      console.error('Failed to load healthcare facilities:', err);
      setError('Unable to fetch live OpenStreetMap healthcare data. Using cached medical directory.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Request user GPS geolocation
  const requestUserGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    setGpsStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lon: longitude });
        setLocationLabel('Current GPS Location');
        setGpsStatus('granted');
        fetchFacilities(latitude, longitude, radiusMeters);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 14, { animate: true });
        }
      },
      (err) => {
        console.warn('Geolocation access error:', err.message);
        setGpsStatus('denied');
        // Still fetch for current coords
        fetchFacilities(coords.lat, coords.lon, radiusMeters);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, [coords.lat, coords.lon, radiusMeters, fetchFacilities]);

  // Initial load
  useEffect(() => {
    requestUserGps();
  }, []);

  // When radius changes, reload
  const handleRadiusChange = (newRadius: number) => {
    setRadiusMeters(newRadius);
    fetchFacilities(coords.lat, coords.lon, newRadius);
  };

  // Manual location selection
  const handleSelectManualLocation = (loc: { name: string; lat: number; lon: number }) => {
    setCoords({ lat: loc.lat, lon: loc.lon });
    setLocationLabel(loc.name);
    setIsManualModalOpen(false);
    fetchFacilities(loc.lat, loc.lon, radiusMeters);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([loc.lat, loc.lon], 14, { animate: true });
    }
  };

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lon],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    facilityMarkersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Marker icon builder helper
  const createFacilityMarkerIcon = (type: string, isEmergency: boolean, isSelected: boolean) => {
    let bgColor = '#2563EB'; // Blue
    let emoji = '🏥';

    if (isEmergency || type === 'Emergency Care') {
      bgColor = '#DC2626'; // Red
      emoji = '🚑';
    } else if (type === 'Clinic' || type === 'Urban Clinic' || type === 'Heat Health Centre') {
      bgColor = '#059669'; // Emerald
      emoji = '🩺';
    } else if (type === 'Doctor') {
      bgColor = '#7C3AED'; // Indigo
      emoji = '⚕';
    }

    const size = isSelected ? 42 : 34;
    const border = isSelected ? '3px solid #FFFFFF' : '2px solid #FFFFFF';
    const shadow = isSelected ? '0 4px 14px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.25)';

    return L.divIcon({
      className: 'healthcare-facility-pin',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bgColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: ${border};
          box-shadow: ${shadow};
          font-size: ${isSelected ? '20px' : '16px'};
          cursor: pointer;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.15s ease;
        ">
          ${emoji}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // 4. Update Map Markers & User Location Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A. User GPS Marker
    const pulsingUserIcon = L.divIcon({
      className: 'user-gps-pin',
      html: `
        <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style="overflow:visible;">
            <circle cx="22" cy="22" r="18" fill="#0071E3" fill-opacity="0.25">
              <animate attributeName="r" values="10;20;10" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="22" cy="22" r="8" fill="#0071E3" stroke="#FFFFFF" stroke-width="3.5" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));" />
          </svg>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([coords.lat, coords.lon], {
        icon: pulsingUserIcon,
        zIndexOffset: 1000,
      }).addTo(map);
      userMarkerRef.current.bindTooltip('<strong>You Are Here</strong>', {
        permanent: false,
        direction: 'top',
        className: 'user-gps-tooltip',
      });
    } else {
      userMarkerRef.current.setLatLng([coords.lat, coords.lon]);
    }

    // B. Facility Markers (only when not in active navigation mode)
    if (!facilityMarkersLayerRef.current) return;
    facilityMarkersLayerRef.current.clearLayers();

    if (!navigationMode) {
      filteredFacilities.forEach((hosp) => {
        const isSelected = selectedFacility?.id === hosp.id;
        const icon = createFacilityMarkerIcon(hosp.type, hosp.emergencyIndicator, isSelected);

        const marker = L.marker([hosp.lat, hosp.lng], {
          icon,
          zIndexOffset: isSelected ? 500 : 100,
        });

        marker.bindTooltip(
          `<strong>${hosp.name}</strong><br/><span style="font-size:10px; color:#666;">${hosp.type} • ${hosp.distanceKm} km away</span>`,
          { direction: 'top', offset: [0, -10] }
        );

        marker.on('click', () => {
          setSelectedFacility(hosp);
        });

        marker.addTo(facilityMarkersLayerRef.current!);
      });
    }
  }, [coords.lat, coords.lon, facilities, filterType, selectedFacility, navigationMode]);

  // Auto-route if redirected from another page (Home, Protection, Safe Route)
  useEffect(() => {
    if (targetFacilityForDirections) {
      const target = targetFacilityForDirections;
      setTargetFacilityForDirections(null);
      handleStartDirections(target);
    }
  }, [targetFacilityForDirections]);

  // 5. In-App Navigation Flow (OSRM Routing inside ThermaShield)
  const handleStartDirections = async (facility: HealthcareFacility) => {
    // Close details drawer immediately so it never blocks the map/navigation interface
    setSelectedFacility(null);
    setNavDestination(facility);
    setIsCalculatingRoute(true);
    setRouteError(null);
    setNavigationMode(true);

    // Smoothly scroll the interactive map into view so user sees the direction and HUD
    setTimeout(() => {
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    // Give Leaflet time to expand with CSS layout
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }

    try {
      const res = await fetch('/api/healthcare/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { lat: coords.lat, lon: coords.lon },
          destination: { lat: facility.lat, lon: facility.lng },
          facilityName: facility.name,
        }),
      });

      if (!res.ok) {
        throw new Error('Routing calculation failed');
      }

      const routeData: HealthcareRouteResponse = await res.json();
      setActiveRoute(routeData);

      // Render route geometry on Leaflet map
      const map = mapInstanceRef.current;
      if (map) {
        map.invalidateSize();

        // Remove previous route & pin
        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
          routePolylineRef.current = null;
        }
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.remove();
          destinationMarkerRef.current = null;
        }

        // Convert [lon, lat] from GeoJSON into Leaflet [lat, lon]
        let latLngs = (routeData.routeGeometry?.coordinates || []).map((c) => [c[1], c[0]] as [number, number]);

        // Connect user GPS directly to the route start, and end to facility
        if (latLngs.length > 0) {
          latLngs = [[coords.lat, coords.lon], ...latLngs, [facility.lat, facility.lng]];
        } else {
          latLngs = [[coords.lat, coords.lon], [facility.lat, facility.lng]];
        }

        // Draw Route Line in Apple Maps Blue (#0071E3)
        routePolylineRef.current = L.polyline(latLngs, {
          color: '#0071E3',
          weight: 6,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);

        routePolylineRef.current.bringToFront();

        // Destination Pin
        const destIcon = L.divIcon({
          className: 'destination-flag-pin',
          html: `
            <div style="
              width: 44px;
              height: 44px;
              background: #DC2626;
              border-radius: 50%;
              border: 3px solid #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 20px;
              box-shadow: 0 4px 15px rgba(220,38,38,0.5);
            ">
              🏥
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

        destinationMarkerRef.current = L.marker([facility.lat, facility.lng], {
          icon: destIcon,
          zIndexOffset: 1200,
        }).addTo(map);

        destinationMarkerRef.current.bindTooltip(
          `<strong>${facility.name}</strong><br/><span style="color:#0071E3; font-weight:bold;">Destination • ~${routeData.durationMins} mins</span>`,
          {
            permanent: true,
            direction: 'top',
            offset: [0, -12],
          }
        );

        // Fit map bounds to show full route
        const bounds = routePolylineRef.current.getBounds();
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });

        // Re-fit bounds after CSS layout animation finishes
        setTimeout(() => {
          if (mapInstanceRef.current && routePolylineRef.current) {
            mapInstanceRef.current.invalidateSize();
            mapInstanceRef.current.fitBounds(routePolylineRef.current.getBounds(), { padding: [60, 60], maxZoom: 16 });
          }
        }, 320);
      }
    } catch (err: any) {
      console.error('Route generation failed:', err);
      setRouteError('Failed to calculate in-app directions. Please try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Exit navigation mode
  const handleExitNavigation = () => {
    setNavigationMode(false);
    setNavDestination(null);
    setActiveRoute(null);
    setRouteError(null);

    const map = mapInstanceRef.current;
    if (map) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
        routePolylineRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
        destinationMarkerRef.current = null;
      }
      map.invalidateSize();
      map.setView([coords.lat, coords.lon], 14, { animate: true });
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 320);
    }
  };

  // Recenter map on route
  const handleRecenterRoute = () => {
    const map = mapInstanceRef.current;
    if (map && routePolylineRef.current) {
      map.invalidateSize();
      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50], animate: true });
    } else if (map) {
      map.setView([coords.lat, coords.lon], 14, { animate: true });
    }
  };

  // Recenter map on user location
  const handleRecenterUser = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.invalidateSize();
      map.setView([coords.lat, coords.lon], 14, { animate: true });
    }
  };

  // Filter facilities
  const filteredFacilities = facilities.filter((h) => {
    if (filterType === 'Emergency Care' && !h.emergencyIndicator) return false;
    if (filterType !== 'all' && filterType !== 'Emergency Care' && h.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchAddr = h.address.toLowerCase().includes(q);
      const matchType = h.type.toLowerCase().includes(q);
      return matchName || matchAddr || matchType;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-14 animate-in fade-in duration-200">
      {/* 1. Header with Apple-Style Discovery Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <Cross className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Nearby Healthcare
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  {locationLabel}
                </span>
                <span>•</span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    gpsStatus === 'granted'
                      ? 'text-emerald-700'
                      : gpsStatus === 'denied'
                      ? 'text-amber-700'
                      : 'text-slate-600'
                  }`}
                >
                  {gpsStatus === 'granted' ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GPS Active
                    </>
                  ) : gpsStatus === 'denied' ? (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Manual Location
                    </>
                  ) : (
                    'Locating...'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Radius Selector */}
          <div className="flex items-center bg-white border border-slate-200/90 rounded-xl px-2 py-1 shadow-2xs text-xs font-semibold text-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-bold mr-1.5 hidden sm:inline">Radius:</span>
            <select
              value={radiusMeters}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
              className="bg-transparent text-slate-900 font-bold focus:outline-hidden cursor-pointer"
            >
              <option value={3000}>Within 3 km</option>
              <option value={6000}>Within 6 km</option>
              <option value={10000}>Within 10 km</option>
              <option value={15000}>Within 15 km</option>
            </select>
          </div>

          {/* Change Location Button */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
            title="Select location manually"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Change Area</span>
          </button>

          {/* Refresh Location Button */}
          <button
            onClick={requestUserGps}
            disabled={gpsStatus === 'requesting'}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'requesting' ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* GPS Denied Notice */}
      {gpsStatus === 'denied' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Browser GPS was denied. Showing medical facilities around <strong>{locationLabel}</strong>. You can switch to any Pune area.
            </span>
          </div>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors"
          >
            Choose Area
          </button>
        </div>
      )}

      {/* Heat Stroke Emergency Protocol Ribbon */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600/10 via-orange-500/10 to-amber-500/10 border-l-4 border-l-red-600 border border-red-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <HeartPulse className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-extrabold text-red-950 block">National Heat Emergency Advisory</span>
            <span className="text-slate-600">
              For heat stroke (temp &gt; 40°C, altered mental state, cessation of sweating), initiate rapid cold water cooling & dial 108.
            </span>
          </div>
        </div>
        <a
          href="tel:108"
          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" /> Call 108 Emergency
        </a>
      </div>

      {/* 2. Main Interactive Map Area with Live Navigation Mode */}
      <div className="space-y-3">
        <div className="apple-card overflow-hidden relative shadow-sm border border-slate-200/80 bg-slate-100 rounded-3xl">
          {/* Map Container */}
          <div
            ref={mapContainerRef}
            className={`w-full transition-all duration-300 ${
              navigationMode ? 'h-[440px] sm:h-[500px]' : 'h-[360px] sm:h-[420px]'
            }`}
          />

          {/* Top In-App Navigation HUD (Visible in navigation mode) */}
          {navigationMode && (
            <div className="absolute top-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-slate-200/80 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">
                      In-App Turn-By-Turn Route
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                      {navDestination?.name}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={handleExitNavigation}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Exit Route
                </button>
              </div>

              {/* Navigation Stats & Next Maneuver */}
              {isCalculatingRoute ? (
                <div className="flex items-center gap-2 text-xs text-blue-700 py-1">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Computing shortest emergency transit geometry via OSRM...</span>
                </div>
              ) : activeRoute ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Distance</span>
                      <span className="text-base font-black text-slate-900">{activeRoute.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Time</span>
                      <span className="text-base font-black text-blue-600">~{activeRoute.durationMins} mins</span>
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Route Corridor</span>
                      <span className="text-xs font-bold text-slate-700">{activeRoute.summary}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRecenterRoute}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors"
                    >
                      Fit Route
                    </button>
                    <button
                      onClick={handleRecenterUser}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                    >
                      My Location
                    </button>
                  </div>
                </div>
              ) : null}

              {routeError && (
                <div className="text-xs text-red-600 font-semibold">{routeError}</div>
              )}
            </div>
          )}

          {/* Quick Floating Map Controls (When not in navigation mode) */}
          {!navigationMode && (
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
              <button
                onClick={handleRecenterUser}
                className="p-2 rounded-xl bg-white/95 backdrop-blur-sm hover:bg-white text-slate-700 shadow-md border border-slate-200/80 transition-colors"
                title="Recenter on your location"
              >
                <LocateFixed className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          )}

          {/* Bottom Map Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-md border border-slate-200/80 text-[11px] flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-500 text-[10px] uppercase">Legend:</span>
            <span className="flex items-center gap-1 text-slate-700 font-semibold">🏥 Hospital</span>
            <span className="flex items-center gap-1 text-slate-700 font-semibold">🚑 Emergency</span>
            <span className="flex items-center gap-1 text-slate-700 font-semibold">🩺 Clinic</span>
            <span className="flex items-center gap-1 text-slate-700 font-semibold">⚕ Doctor</span>
          </div>
        </div>

        {/* OSM Provenance Note */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
          <span>Data © OpenStreetMap contributors (ODbL). Real-time querying via Overpass API.</span>
          <span>Disclaimer: OSM data is crowd-sourced and not guaranteed complete or current.</span>
        </div>
      </div>

      {/* 3. Turn-by-Turn Navigation Steps Panel (When Navigation Active) */}
      {navigationMode && activeRoute && (
        <div className="apple-card p-5 border border-slate-200/80 space-y-3.5 bg-white rounded-3xl animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                Turn-by-Turn Route to {navDestination?.name}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {activeRoute.steps.length} Steps • {activeRoute.distanceKm} km
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
            {activeRoute.steps.map((step, idx) => (
              <div key={idx} className="py-2.5 flex items-start gap-3 text-xs">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 leading-snug">{step.instruction}</p>
                  {step.distanceMeters > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                      Distance: {step.distanceMeters} m
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            <button
              onClick={handleExitNavigation}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              Back to Healthcare List
            </button>
            <button
              onClick={handleRecenterRoute}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
            >
              Recenter Route
            </button>
          </div>
        </div>
      )}

      {/* 4. Filter Pills & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${facilities.length})` },
              { id: 'Hospital', label: '🏥 Hospitals' },
              { id: 'Emergency Care', label: '🚑 24/7 Emergency' },
              { id: 'Clinic', label: '🩺 Clinics' },
              { id: 'Doctor', label: '⚕ Doctors' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  filterType === f.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by facility name or road..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 5. Healthcare Directory List (Sorted Nearest First) */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              Querying OpenStreetMap Overpass API for real facilities within {radiusMeters / 1000} km...
            </p>
          </div>
        ) : error && facilities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-red-200 space-y-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
            <p className="text-xs font-bold text-slate-800">{error}</p>
            <button
              onClick={() => fetchFacilities(coords.lat, coords.lon, radiusMeters)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              Retry
            </button>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200/80 space-y-3">
            <Info className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              No healthcare facilities matching your filter within {radiusMeters / 1000} km.
            </p>
            <button
              onClick={() => handleRadiusChange(15000)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
            >
              Expand Search Radius to 15 km
            </button>
          </div>
        ) : (
          filteredFacilities.map((hosp) => {
            const isSelected = selectedFacility?.id === hosp.id;
            return (
              <div
                key={hosp.id}
                onClick={() => setSelectedFacility(hosp)}
                className={`apple-card p-4 sm:p-5 border transition-all rounded-2xl cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/20 shadow-md ring-1 ring-blue-500/30'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-900 text-sm sm:text-base">{hosp.name}</h3>

                      {hosp.emergencyIndicator && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                          24/7 Emergency
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                        {hosp.type}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          hosp.source === 'LIVE/EXTERNAL DATA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {hosp.source || 'LIVE/EXTERNAL DATA'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hosp.address || 'Address not listed on OpenStreetMap'}</span>
                    </p>

                    {/* Resuscitation / Bed Info */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      {hosp.heatStrokeBedsAvailable !== undefined && hosp.heatStrokeBedsAvailable > 0 && (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-emerald-600" />
                          {hosp.heatStrokeBedsAvailable} Heat Resuscitation Beds Available
                        </span>
                      )}
                      <span className="text-slate-400 hidden sm:inline">•</span>
                      <span className="text-slate-600 text-[11px]">
                        Emergency Status: <strong>{hosp.emergencyAvailability || 'Available'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: Distance & Direct Action Buttons */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-2 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        {hosp.distanceKm} km
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        ~{hosp.travelTimeMins} mins via {hosp.travelMode}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {/* Phone button */}
                      {hosp.phone ? (
                        <a
                          href={`tel:${hosp.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                          title={`Call ${hosp.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>Call</span>
                        </a>
                      ) : (
                        <span
                          className="px-2.5 py-1.5 rounded-xl bg-slate-50 text-slate-400 text-xs font-medium flex items-center gap-1 cursor-default"
                          title="Phone not listed on OSM"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-300" />
                          <span className="hidden sm:inline">No Phone</span>
                        </span>
                      )}

                      {/* In-App Directions Button (NO REDIRECTS) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartDirections(hosp);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Start In-App Navigation"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Directions</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Apple-Style In-App Healthcare Details Panel (Slide-Over Drawer) */}
      {!navigationMode && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                    {selectedFacility.type}
                  </span>
                  {selectedFacility.emergencyIndicator && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">
                      24/7 Emergency
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {selectedFacility.source || 'LIVE/EXTERNAL DATA'}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-tight">
                  {selectedFacility.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedFacility(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Distance</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{selectedFacility.distanceKm} km</span>
                <span className="text-[10px] text-slate-500 font-medium">From your GPS location</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-extrabold text-blue-600 uppercase block">Travel Time</span>
                <span className="text-xl font-black text-blue-600 mt-0.5 block">~{selectedFacility.travelTimeMins} mins</span>
                <span className="text-[10px] text-slate-500 font-medium">via {selectedFacility.travelMode} transit</span>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="space-y-2.5 text-xs">
              {/* Address */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="font-extrabold text-slate-400 text-[10px] uppercase block">Address</span>
                <p className="font-bold text-slate-800">{selectedFacility.address || 'Not available on OSM'}</p>
              </div>

              {/* Phone */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-400 text-[10px] uppercase block">Contact Phone</span>
                  <span className="font-bold text-slate-800">
                    {selectedFacility.phone || 'Not available on OSM'}
                  </span>
                </div>
                {selectedFacility.phone && (
                  <a
                    href={`tel:${selectedFacility.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call Now
                  </a>
                )}
              </div>

              {/* Website */}
              {selectedFacility.website && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-400 text-[10px] uppercase block">Website</span>
                    <span className="font-bold text-blue-600 truncate max-w-[220px] block">
                      {selectedFacility.website}
                    </span>
                  </div>
                  <a
                    href={selectedFacility.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Emergency Readiness */}
              <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/80 space-y-1">
                <span className="font-extrabold text-red-900 text-[10px] uppercase block">
                  Emergency Availability & Resuscitation
                </span>
                <p className="font-semibold text-slate-800">
                  {selectedFacility.emergencyAvailability || 'Standard medical triage and referral available'}
                </p>
                {selectedFacility.heatStrokeBedsAvailable !== undefined && (
                  <div className="text-[11px] font-bold text-emerald-800 pt-0.5">
                    Heat Resuscitation Beds: {selectedFacility.heatStrokeBedsAvailable} active
                  </div>
                )}
              </div>

              {/* Provenance & Last Updated */}
              <div className="p-3 rounded-xl bg-slate-100 text-[10px] text-slate-600 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Data Source:</span>
                  <strong className="text-slate-800">{selectedFacility.sourceDetail || 'OpenStreetMap (Overpass API)'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>Last Verified / Updated:</span>
                  <strong className="text-slate-800">{selectedFacility.lastUpdated || 'Current'}</strong>
                </div>
                <p className="text-[9px] text-slate-400 pt-1">
                  Data © OpenStreetMap contributors under ODbL license.
                </p>
              </div>
            </div>

            {/* Direct Action Button */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setSelectedFacility(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedFacility;
                  setSelectedFacility(null);
                  handleStartDirections(target);
                }}
                className="flex-2 py-2.5 rounded-xl bg-[#0071E3] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Start In-App Navigation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal for Manual Location Selection (When GPS is denied or user wants to browse) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-slate-900 text-base">Select Pune Area</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Choose an urban sector to find nearby healthcare facilities and view in-app directions:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleSelectManualLocation(loc)}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                    <span className="font-bold text-slate-800 text-xs">{loc.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
