import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import { ALL_LOCATIONS, LocationItem } from '../../data/allLocations.js';
import {
  MapPin,
  ChevronDown,
  Navigation,
  Check,
  Search,
  X,
  Crosshair,
  RefreshCw,
  Sparkles,
  Globe,
} from 'lucide-react';

const REGION_CATEGORIES: Record<string, string[]> = {
  all: [],
  maharashtra: ['pune', 'nashik', 'mumbai', 'maharashtra'],
  north: ['north'],
  south: ['south'],
  'west-central': ['west', 'central'],
  'east-northeast': ['east', 'northeast', 'ut'],
};

const REGION_TABS = [
  { id: 'all', label: 'All India', count: ALL_LOCATIONS.length },
  {
    id: 'maharashtra',
    label: 'Maharashtra',
    count: ALL_LOCATIONS.filter((l) =>
      ['pune', 'nashik', 'mumbai', 'maharashtra'].includes(l.category)
    ).length,
  },
  {
    id: 'north',
    label: 'North India',
    count: ALL_LOCATIONS.filter((l) => l.category === 'north').length,
  },
  {
    id: 'south',
    label: 'South India',
    count: ALL_LOCATIONS.filter((l) => l.category === 'south').length,
  },
  {
    id: 'west-central',
    label: 'West & Central',
    count: ALL_LOCATIONS.filter((l) => ['west', 'central'].includes(l.category)).length,
  },
  {
    id: 'east-northeast',
    label: 'East & NE',
    count: ALL_LOCATIONS.filter((l) => ['east', 'northeast', 'ut'].includes(l.category)).length,
  },
];

interface HealthcareLocationSelectorProps {
  variant?: 'header' | 'sidebar';
}

export const HealthcareLocationSelector: React.FC<HealthcareLocationSelectorProps> = ({
  variant = 'header',
}) => {
  const { currentLocation, setLocation, detectUserGpsLocation, isLocatingGps, summary } =
    useHealthcare();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Filter across all locations in India
  const filteredLocations = useMemo(() => {
    let list = ALL_LOCATIONS;

    // Filter by Region if selected and not 'all'
    if (selectedRegion !== 'all') {
      const allowedCategories = REGION_CATEGORIES[selectedRegion] || [];
      list = list.filter((loc) => allowedCategories.includes(loc.category));
    }

    // Filter by search query if typed
    if (trimmedQuery) {
      return list.filter((loc) => {
        return (
          loc.name.toLowerCase().includes(trimmedQuery) ||
          loc.shortName.toLowerCase().includes(trimmedQuery) ||
          loc.city.toLowerCase().includes(trimmedQuery) ||
          loc.state.toLowerCase().includes(trimmedQuery)
        );
      });
    }

    return list;
  }, [trimmedQuery, selectedRegion]);

  const handleSelectLocation = (loc: LocationItem) => {
    setLocation({
      name: loc.name,
      shortName: loc.shortName,
      lat: loc.lat,
      lng: loc.lng,
      isUserLocation: false,
    });
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleUseGps = () => {
    detectUserGpsLocation();
    setIsOpen(false);
  };

  // ==========================================
  // VARIANT: SIDEBAR (Above HOME in Sidebar)
  // ==========================================
  if (variant === 'sidebar') {
    return (
      <div className="relative mb-3" ref={containerRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 border border-emerald-200/80 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-700">
                <MapPin className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                MONITORING LOCATION
              </span>
            </div>

            {currentLocation.isUserLocation ? (
              <span className="text-[9px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                GPS Active
              </span>
            ) : (
              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                India Grid
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-900 leading-snug truncate group-hover:text-emerald-800 transition-colors">
                {currentLocation.shortName || currentLocation.name}
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {summary?.highRiskAreas?.length || 6} wards • Click to change
              </p>
            </div>
            <div className="shrink-0 p-1 rounded-lg bg-white border border-slate-200 text-slate-500 group-hover:text-emerald-700 group-hover:border-emerald-300 transition-all">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Dropdown Modal for Sidebar */}
        {isOpen && (
          <div className="absolute left-0 right-0 sm:left-full sm:ml-2 sm:right-auto top-0 sm:w-96 w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  Monitoring Location
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  All {ALL_LOCATIONS.length} locations across India available
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* GPS Button */}
            <div className="pt-2 pb-2">
              <button
                type="button"
                onClick={handleUseGps}
                disabled={isLocatingGps}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
              >
                {isLocatingGps ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>{isLocatingGps ? 'Locating GPS...' : 'Use My Live GPS Location'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any city, ward or state in India..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Region Filter Chips */}
            <div className="flex flex-wrap gap-1 mb-2">
              {REGION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRegion(tab.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                    selectedRegion === tab.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Location Count & Info */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pb-1">
              <span>Showing {filteredLocations.length} locations</span>
              <span className="text-emerald-700 font-semibold">India Grid</span>
            </div>

            {/* Scrollable Location List */}
            <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
              {filteredLocations.map((loc) => {
                const isCurrent =
                  Math.abs(loc.lat - currentLocation.lat) < 0.01 &&
                  Math.abs(loc.lng - currentLocation.lng) < 0.01;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold">{loc.shortName || loc.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {loc.city}, <span className="text-slate-500 font-medium">{loc.state}</span>
                      </p>
                    </div>
                    {isCurrent && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
              {filteredLocations.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No locations found matching &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VARIANT: HEADER (Top Header Bar)
  // ==========================================
  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-950 text-xs font-semibold border border-emerald-200/80 transition-all shadow-xs cursor-pointer group"
        title="Monitoring Location - Click to choose any location in India"
      >
        <MapPin
          className={`w-3.5 h-3.5 shrink-0 ${
            currentLocation.isUserLocation ? 'text-blue-600' : 'text-emerald-700'
          }`}
        />
        <div className="text-left flex flex-col">
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider leading-tight flex items-center gap-1">
            <span>Monitoring Location</span>
            {currentLocation.isUserLocation && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </span>
          <span className="truncate max-w-[140px] sm:max-w-[220px] leading-tight font-bold text-slate-900 group-hover:text-emerald-900">
            {currentLocation.shortName || currentLocation.name}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-emerald-700/70 shrink-0" />
      </button>

      {/* Dropdown Modal for Top Header */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-black/10 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-700" />
                Monitoring Location
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Choose from all {ALL_LOCATIONS.length} monitored locations in India
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* GPS Quick Action */}
          <div className="pt-2 pb-2">
            <button
              type="button"
              onClick={handleUseGps}
              disabled={isLocatingGps}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-colors"
            >
              {isLocatingGps ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>{isLocatingGps ? 'Detecting GPS...' : 'Use My Live GPS Location'}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city, ward, state or hospital..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Region Tabs (All India, Maharashtra, North, South, West/Central, East/NE) */}
          <div className="flex flex-wrap gap-1 mb-2">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRegion(tab.id)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                  selectedRegion === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Location Count & Info */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pb-1">
            <span>Showing {filteredLocations.length} locations</span>
            <span className="text-emerald-700 font-semibold">Pan-India Coverage</span>
          </div>

          {/* Scrollable list of ALL locations */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
            {filteredLocations.map((loc) => {
              const isCurrent =
                Math.abs(loc.lat - currentLocation.lat) < 0.01 &&
                Math.abs(loc.lng - currentLocation.lng) < 0.01;

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                    isCurrent
                      ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-semibold text-slate-800">
                      {loc.shortName || loc.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {loc.city}, <span className="text-slate-500 font-medium">{loc.state}</span>
                    </p>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
            {filteredLocations.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No locations found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>All forecast, wards & clinical capacity follow this location</span>
          </div>
        </div>
      )}
    </div>
  );
};
