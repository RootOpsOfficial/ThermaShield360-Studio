import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Crosshair,
  Flame,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronDown,
  Building2,
  Globe2,
  Compass,
  Activity,
} from 'lucide-react';
import { ALL_LOCATIONS, LocationItem } from '../../data/allLocations.js';
import { useHealthcare } from '../../context/HealthcareContext.js';

export interface LocationHeatData {
  location: {
    name: string;
    shortName: string;
    lat: number;
    lng: number;
  };
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    weatherDescription: string;
    wbgt: number;
    utci: number;
    heat: {
      level: 'High' | 'Moderate' | 'Low';
      circleColor: 'red' | 'yellow' | 'green';
      hex: string;
      label: string;
      badgeClass: string;
      advice: string;
    };
  };
  peak: {
    tempMax: number;
    feelsLikeMax: number;
    heat: {
      level: 'High' | 'Moderate' | 'Low';
      circleColor: 'red' | 'yellow' | 'green';
      hex: string;
      label: string;
      badgeClass: string;
      advice: string;
    };
  };
  activeHeat: {
    level: 'High' | 'Moderate' | 'Low';
    circleColor: 'red' | 'yellow' | 'green';
    hex: string;
    label: string;
    badgeClass: string;
    advice: string;
  };
  timestamp: string;
}

type RegionFilter = 'all' | 'pune' | 'nashik' | 'maharashtra' | 'north' | 'south' | 'west_central' | 'east_northeast';

export const LocationHeatRiskMap: React.FC = () => {
  const { currentLocation, setLocation, detectUserGpsLocation, isLocatingGps } = useHealthcare();
  const [searchQuery, setSearchQuery] = useState(currentLocation?.name || 'Gangapur Road, Canada Corner, Nashik');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'current' | 'peak'>('peak');
  const [data, setData] = useState<LocationHeatData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic live search results from remote geocoder (for arbitrary Indian villages / streets)
  const [remoteResults, setRemoteResults] = useState<LocationItem[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const markerLayerRef = useRef<L.Marker | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Region tabs definition
  const REGION_TABS: { id: RegionFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All India', count: ALL_LOCATIONS.length },
    { id: 'pune', label: 'Pune Areas', count: ALL_LOCATIONS.filter((l) => l.category === 'pune').length },
    { id: 'nashik', label: 'Nashik Areas', count: ALL_LOCATIONS.filter((l) => l.category === 'nashik').length },
    { id: 'maharashtra', label: 'Maharashtra', count: ALL_LOCATIONS.filter((l) => l.category === 'maharashtra').length },
    { id: 'north', label: 'North India', count: ALL_LOCATIONS.filter((l) => l.category === 'north').length },
    { id: 'south', label: 'South India', count: ALL_LOCATIONS.filter((l) => l.category === 'south').length },
    { id: 'west_central', label: 'West & Central', count: ALL_LOCATIONS.filter((l) => l.category === 'west' || l.category === 'central').length },
    { id: 'east_northeast', label: 'East & North-East', count: ALL_LOCATIONS.filter((l) => l.category === 'east' || l.category === 'northeast' || l.category === 'ut').length },
  ];

  // Dynamic filtering
  const filteredLocalLocations = useMemo(() => {
    return ALL_LOCATIONS.filter((loc) => {
      // If a region filter other than 'all' is picked and user didn't enter a specific text search
      if (selectedRegion !== 'all' && !trimmedQuery) {
        if (selectedRegion === 'pune') return loc.category === 'pune';
        if (selectedRegion === 'nashik') return loc.category === 'nashik';
        if (selectedRegion === 'maharashtra') return loc.category === 'maharashtra';
        if (selectedRegion === 'north') return loc.category === 'north';
        if (selectedRegion === 'south') return loc.category === 'south';
        if (selectedRegion === 'west_central') return loc.category === 'west' || loc.category === 'central';
        if (selectedRegion === 'east_northeast') return loc.category === 'east' || loc.category === 'northeast' || loc.category === 'ut';
      }

      if (!trimmedQuery) return true;

      // When search query is entered, match across name, shortName, city, or state
      const matchesText =
        loc.name.toLowerCase().includes(trimmedQuery) ||
        loc.shortName.toLowerCase().includes(trimmedQuery) ||
        loc.city.toLowerCase().includes(trimmedQuery) ||
        loc.state.toLowerCase().includes(trimmedQuery);

      if (!matchesText) return false;

      // If user selected a specific region tab, honor it
      if (selectedRegion === 'pune') return loc.category === 'pune';
      if (selectedRegion === 'nashik') return loc.category === 'nashik';
      if (selectedRegion === 'maharashtra') return loc.category === 'maharashtra';
      if (selectedRegion === 'north') return loc.category === 'north';
      if (selectedRegion === 'south') return loc.category === 'south';
      if (selectedRegion === 'west_central') return loc.category === 'west' || loc.category === 'central';
      if (selectedRegion === 'east_northeast') return loc.category === 'east' || loc.category === 'northeast' || loc.category === 'ut';

      return true;
    });
  }, [trimmedQuery, selectedRegion]);

  // Combine local matches + remote geocoded matches
  const combinedLocations = useMemo(() => {
    if (!trimmedQuery) return filteredLocalLocations;
    const combined = [...filteredLocalLocations];
    for (const rem of remoteResults) {
      if (!combined.some((c) => Math.abs(c.lat - rem.lat) < 0.01 && Math.abs(c.lng - rem.lng) < 0.01)) {
        combined.push(rem);
      }
    }
    return combined;
  }, [filteredLocalLocations, remoteResults, trimmedQuery]);

  // Debounced remote search across India for specific addresses
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!trimmedQuery || trimmedQuery.length < 3) {
      setRemoteResults([]);
      setIsSearchingRemote(false);
      return;
    }

    // If we already have 5+ strong local matches, skip remote query to avoid overhead
    if (filteredLocalLocations.length >= 8) {
      setRemoteResults([]);
      setIsSearchingRemote(false);
      return;
    }

    setIsSearchingRemote(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/healthcare/search-locations?q=${encodeURIComponent(trimmedQuery)}`);
        if (res.ok) {
          const list: LocationItem[] = await res.json();
          setRemoteResults(list);
        }
      } catch (err) {
        console.warn('Remote location search failed:', err);
      } finally {
        setIsSearchingRemote(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [trimmedQuery, filteredLocalLocations.length]);

  // Fetch heat risk for location
  const checkHeatRisk = async (query: string, customLat?: number, customLng?: number) => {
    setIsLoading(true);
    setError(null);
    setIsDropdownOpen(false);
    try {
      let url = `/api/healthcare/location-heat-check?q=${encodeURIComponent(query)}`;
      if (customLat !== undefined && customLng !== undefined) {
        url += `&lat=${customLat}&lng=${customLng}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json: LocationHeatData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Failed to load location heat risk:', err);
      setError('Unable to load heat data for this area. Please check the spelling or select another locality.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync with context location
  useEffect(() => {
    if (currentLocation) {
      setSearchQuery(currentLocation.name);
      checkHeatRisk(currentLocation.name, currentLocation.lat, currentLocation.lng);
    }
  }, [currentLocation.name, currentLocation.lat, currentLocation.lng]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Handle GPS location
  const handleUseGps = () => {
    detectUserGpsLocation();
  };

  // Handle selecting an item from the dropdown
  const handleSelectLocation = (loc: LocationItem) => {
    setSearchQuery(loc.name);
    setIsDropdownOpen(false);
    setLocation({
      name: loc.name,
      shortName: loc.shortName,
      lat: loc.lat,
      lng: loc.lng,
      isUserLocation: false,
    });
    checkHeatRisk(loc.name, loc.lat, loc.lng);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.0082, 73.7691], // Centered near Nashik Gangapur Road
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Map layers whenever data or viewMode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !data) return;

    const lat = data.location.lat;
    const lng = data.location.lng;

    // Fly to the resolved location
    map.flyTo([lat, lng], 13.5, { duration: 1.2 });

    // Active heat risk according to viewMode (current vs peak daytime)
    const activeHeat = viewMode === 'peak' ? data.peak.heat : data.current.heat;
    const activeTemp = viewMode === 'peak' ? data.peak.tempMax : data.current.temp;
    const activeFeels = viewMode === 'peak' ? data.peak.feelsLikeMax : data.current.feelsLike;

    // Remove old circle and marker
    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }
    if (markerLayerRef.current) {
      map.removeLayer(markerLayerRef.current);
      markerLayerRef.current = null;
    }

    // 1. Draw the heat circle:
    // High heat = Red circle (#EF4444)
    // Moderate heat = Yellow circle (#EAB308)
    // Low heat = Green circle (#22C55E)
    const circle = L.circle([lat, lng], {
      radius: 1400,
      color: activeHeat.hex,
      fillColor: activeHeat.hex,
      fillOpacity: activeHeat.level === 'High' ? 0.42 : activeHeat.level === 'Moderate' ? 0.38 : 0.32,
      weight: 3.5,
    }).addTo(map);

    circleLayerRef.current = circle;

    // 2. Add Center Marker with Icon & Tooltip
    const iconHtml = `
      <div style="
        width: 38px;
        height: 38px;
        background: ${activeHeat.hex};
        border: 3.5px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
        font-size: 15px;
        cursor: pointer;
      ">
        ${activeHeat.level === 'High' ? '🔴' : activeHeat.level === 'Moderate' ? '🟡' : '🟢'}
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'heat-risk-center-pin',
      html: iconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    markerLayerRef.current = marker;

    const popupContent = `
      <div style="font-family: inherit; padding: 4px; min-width: 210px;">
        <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748B; margin-bottom: 2px;">
          ${viewMode === 'peak' ? "TODAY'S PEAK HEAT" : 'CURRENT CONDITIONS'}
        </div>
        <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 4px; line-height: 1.2;">
          ${data.location.shortName}
        </div>
        <div style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; background: ${activeHeat.hex}22; color: ${activeHeat.hex}; border: 1px solid ${activeHeat.hex}44; margin-bottom: 6px;">
          ${activeHeat.label}
        </div>
        <div style="font-size: 11px; color: #334155; line-height: 1.4;">
          <strong>Temperature:</strong> ${activeTemp}°C (Feels ${activeFeels}°C)<br/>
          <strong>Circle Color:</strong> ${activeHeat.circleColor.toUpperCase()} CIRCLE
        </div>
      </div>
    `;

    marker.bindPopup(popupContent).openPopup();
  }, [data, viewMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setIsDropdownOpen(false);

    const match = ALL_LOCATIONS.find(
      (l) =>
        l.name.toLowerCase() === query.toLowerCase() ||
        l.shortName.toLowerCase() === query.toLowerCase() ||
        l.name.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      setLocation({
        name: match.name,
        shortName: match.shortName,
        lat: match.lat,
        lng: match.lng,
        isUserLocation: false,
      });
      checkHeatRisk(match.name, match.lat, match.lng);
    } else {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/healthcare/location-heat-check?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const json: LocationHeatData = await res.json();
          setData(json);
          setLocation({
            name: json.location.name,
            shortName: json.location.shortName,
            lat: json.location.lat,
            lng: json.location.lng,
            isUserLocation: false,
          });
        } else {
          checkHeatRisk(query);
        }
      } catch (err) {
        console.error('Failed to geocode location:', err);
        checkHeatRisk(query);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const activeHeat = data
    ? viewMode === 'peak'
      ? data.peak.heat
      : data.current.heat
    : null;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
              <Flame className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              India Heat Risk Map & Location Checker
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Check heat conditions across all of India — Pune wards, Nashik areas, Maharashtra districts & all States
          </p>
        </div>

        {/* MAP COLOR LEGEND */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
          <span className="text-slate-400 font-medium">Map Legend:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span>High Heat (Red)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Moderate (Yellow)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Low (Green)</span>
          </span>
        </div>
      </div>

      {/* LOCATION SEARCH & AUTOCOMPLETE DROPDOWN */}
      <div className="my-4 relative" ref={dropdownRef}>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder="Search all India (e.g. Pune, Nashik Gangapur Road, Kothrud, Mumbai, Delhi, Lucknow...)"
              className="w-full pl-10 pr-16 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-slate-800 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-2xs"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('all');
                  setIsDropdownOpen(true);
                }}
                className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              title="Toggle all India locations list"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-slate-700' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Check Heat</span>
            </button>

            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLoading}
              title="Use current GPS device location"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My GPS</span>
            </button>
          </div>
        </form>

        {/* ALL INDIA LOCATIONS DROPDOWN MENU */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[620px] mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-[1500] max-h-[440px] overflow-hidden flex flex-col animate-in fade-in duration-150">
            {/* REGION FILTER TABS */}
            <div className="p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto flex items-center gap-1.5 scrollbar-thin">
              {REGION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRegion(tab.id)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedRegion === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="ml-1 opacity-70 text-[9px]">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* STATUS / INFO BAR */}
            <div className="px-3.5 py-2 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5 truncate">
                <Globe2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {isSearchingRemote ? (
                  <span className="text-orange-600 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Searching across India...
                  </span>
                ) : trimmedQuery ? (
                  <span>
                    Locations matching "{searchQuery}" ({combinedLocations.length})
                  </span>
                ) : (
                  <span>
                    Showing {selectedRegion === 'all' ? 'All India' : REGION_TABS.find((r) => r.id === selectedRegion)?.label} (
                    {combinedLocations.length} locations)
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">1-Click to view heat</span>
            </div>

            {/* SCROLLABLE LIST OF ALL INDIA LOCATIONS */}
            <div className="overflow-y-auto divide-y divide-slate-100 py-1 max-h-[300px]">
              {combinedLocations.length > 0 ? (
                combinedLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 text-[11px] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-900" />
                      </span>
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-slate-900">
                          {loc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {loc.city}, {loc.state} • {loc.lat.toFixed(4)}°N, {loc.lng.toFixed(4)}°E
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                      {loc.city}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-6 px-4 text-center">
                  <p className="text-xs font-medium text-slate-500">
                    No predefined locality matches "{searchQuery}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      checkHeatRisk(searchQuery.trim());
                    }}
                    className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Check live heat for "{searchQuery}" anywhere in India</span>
                  </button>
                </div>
              )}
            </div>

            {/* DROPDOWN FOOTER SEARCH ANYWHERE OPTION */}
            {searchQuery.trim() && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    checkHeatRisk(searchQuery.trim());
                  }}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>Check live heat for custom query: "{searchQuery}"</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* MAP & SUMMARY LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEAFLET MAP CONTAINER (8 Cols) */}
        <div className="lg:col-span-8 relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[380px] sm:h-[420px] rounded-2xl border border-slate-200 overflow-hidden shadow-inner bg-slate-100 relative z-0"
          />

          {/* VIEW MODE TOGGLE OVERLAY */}
          <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-md border border-slate-200/90 flex items-center gap-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('peak')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'peak'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today's Peak Heat
            </button>
            <button
              type="button"
              onClick={() => setViewMode('current')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'current'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Heat
            </button>
          </div>

          {/* MAP WATERMARK BADGE */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-500 pointer-events-none">
            {data ? data.location.shortName : 'Loading location...'}
          </div>
        </div>

        {/* DETAILS SIDEBAR CARD (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                ACTIVE AREA DETAILS
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Real-time Weather</span>
            </div>

            {data ? (
              <div className="space-y-3.5">
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-snug">
                    {data.location.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {data.location.lat.toFixed(4)}°N, {data.location.lng.toFixed(4)}°E
                  </p>
                </div>

                {/* CURRENT HEAT STATUS CARD */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    activeHeat?.level === 'High'
                      ? 'bg-rose-100/70 border-rose-300 text-rose-950'
                      : activeHeat?.level === 'Moderate'
                      ? 'bg-amber-100/70 border-amber-300 text-amber-950'
                      : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {viewMode === 'peak' ? "TODAY'S PEAK STATUS" : 'CURRENT STATUS'}
                    </span>
                    <span className="text-xs">
                      {activeHeat?.level === 'High' ? '🔴' : activeHeat?.level === 'Moderate' ? '🟡' : '🟢'}
                    </span>
                  </div>

                  <div className="my-1.5 flex items-baseline justify-between">
                    <span className="text-lg font-black tracking-tight">
                      {activeHeat?.label}
                    </span>
                    <span className="text-sm font-extrabold">
                      {viewMode === 'peak' ? data.peak.tempMax : data.current.temp}°C
                    </span>
                  </div>

                  <p className="text-[11px] font-medium leading-relaxed opacity-90 mt-1">
                    {activeHeat?.advice}
                  </p>

                  <div className="mt-2 pt-2 border-t border-black/10 flex items-center justify-between text-[10px] font-bold">
                    <span>Map Circle Color:</span>
                    <span className="uppercase">{activeHeat?.circleColor} CIRCLE</span>
                  </div>
                </div>

                {/* METEOROLOGICAL BREAKDOWN */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Feels Like
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {viewMode === 'peak' ? data.peak.feelsLikeMax : data.current.feelsLike}°C
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Humidity
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {data.current.humidity}%
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Wind Speed
                    </span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {data.current.windSpeed} km/h
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Condition
                    </span>
                    <span className="font-extrabold text-slate-800 text-xs truncate block" title={data.current.weatherDescription}>
                      {data.current.weatherDescription.split('&')[0]}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                <span>Fetching meteorological heat data...</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 mt-3 text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>Thermal Engine Model</span>
            <span className="font-bold text-slate-700">WBGT & UTCI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
