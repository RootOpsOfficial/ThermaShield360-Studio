import React, { useState, useMemo } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { ALL_LOCATIONS, LocationItem } from '../../data/allLocations.js';
import { REGION_TABS, REGION_CATEGORIES } from '../../data/allIndiaDisasterService.js';
import {
  MapPin,
  Navigation,
  Globe,
  Search,
  AlertTriangle,
  X,
  RotateCcw,
  Check,
  Building,
  Flame,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const DisasterRegionSelector: React.FC = () => {
  const {
    allIndiaLocations,
    selectedIndiaLocation,
    selectIndiaLocation,
    availableRegions,
    selectedRegion,
    selectRegion,
    affectedAreas,
    selectedArea,
    selectArea,
    userLocation,
    isLocating,
    locationError,
    requestUserLocation,
    dismissLocationError,
    searchQuery,
    setSearchQuery,
    recenterMap,
    activeLocationLabel,
    activeLocationRisk,
    activeLocationTemp,
  } = useDisaster();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all-india' | 'divisions' | 'hotspots'>('all-india');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');

  // Collect all unique states across India from ALL_LOCATIONS
  const allStates = useMemo(() => {
    const set = new Set<string>();
    ALL_LOCATIONS.forEach((l) => set.add(l.state));
    return Array.from(set).sort();
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Filtered All India locations
  const filteredIndiaLocations = useMemo(() => {
    let list = allIndiaLocations;

    // Filter by Zone category
    if (categoryFilter !== 'all') {
      const allowedCategories = REGION_CATEGORIES[categoryFilter] || [];
      list = list.filter((loc) => allowedCategories.includes(loc.category));
    }

    // Filter by State
    if (stateFilter !== 'all') {
      list = list.filter((loc) => loc.state === stateFilter);
    }

    // Filter by Search Query
    if (trimmedQuery) {
      list = list.filter(
        (loc) =>
          loc.name.toLowerCase().includes(trimmedQuery) ||
          loc.shortName.toLowerCase().includes(trimmedQuery) ||
          loc.city.toLowerCase().includes(trimmedQuery) ||
          loc.state.toLowerCase().includes(trimmedQuery)
      );
    }

    return list;
  }, [allIndiaLocations, categoryFilter, stateFilter, trimmedQuery]);

  // Filtered Regional Command Divisions
  const filteredRegions = useMemo(() => {
    let list = availableRegions;

    if (stateFilter !== 'all') {
      list = list.filter((r) => r.state.includes(stateFilter) || stateFilter.includes(r.state));
    }

    if (trimmedQuery) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(trimmedQuery) ||
          r.state.toLowerCase().includes(trimmedQuery) ||
          r.division.toLowerCase().includes(trimmedQuery) ||
          r.assignedGeography.toLowerCase().includes(trimmedQuery)
      );
    }

    return list;
  }, [availableRegions, stateFilter, trimmedQuery]);

  // Filtered Local Hotspots in active jurisdiction
  const filteredHotspots = useMemo(() => {
    if (!trimmedQuery) return affectedAreas;
    return affectedAreas.filter(
      (a) =>
        a.name.toLowerCase().includes(trimmedQuery) ||
        a.district.toLowerCase().includes(trimmedQuery) ||
        a.zone.toLowerCase().includes(trimmedQuery)
    );
  }, [affectedAreas, trimmedQuery]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-600 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Harmful':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  const handleSelectLocation = (loc: LocationItem) => {
    selectIndiaLocation(loc);
    setIsDropdownOpen(false);
  };

  const handleSelectRegionDivision = (regionId: string) => {
    selectRegion(regionId);
    setIsDropdownOpen(false);
  };

  const handleSelectHotspot = (area: any) => {
    selectArea(area);
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Geolocation Notice / Error Banner */}
      {locationError && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            onClick={dismissLocationError}
            className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Active Location Command Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-black/5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Active Location Spotlight & Dropdown Switcher Button */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-sm shrink-0 relative">
            <MapPin className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
          </div>

          <div className="relative min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200/80">
                ACTIVE LOCATION • ALL INDIA
              </span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs ${getRiskColor(
                  activeLocationRisk
                )}`}
              >
                {activeLocationTemp}°C • {activeLocationRisk}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {selectedIndiaLocation
                  ? selectedIndiaLocation.state
                  : selectedRegion.state}
              </span>
            </div>

            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="mt-1 flex items-center gap-2 text-left group"
              title="Click to choose ANY location across India"
            >
              <h2 className="text-base sm:text-xl font-black text-slate-900 group-hover:text-red-700 transition-colors leading-tight truncate max-w-[280px] sm:max-w-[480px]">
                {activeLocationLabel}
              </h2>
              <span className="text-xs text-red-700 font-bold px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200/80 transition-colors flex items-center gap-1 shrink-0">
                <Globe className="w-3 h-3 text-red-600" />
                <span>Change Active Location</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </span>
            </button>

            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[320px] sm:max-w-[550px] mt-0.5">
              {selectedIndiaLocation
                ? `${selectedIndiaLocation.city} District, ${selectedIndiaLocation.state} • Lat: ${selectedIndiaLocation.lat.toFixed(2)}, Lng: ${selectedIndiaLocation.lng.toFixed(2)}`
                : selectedRegion.assignedGeography}
            </p>
          </div>
        </div>

        {/* Right: Quick Search & Use My Location (GPS) & Recenter */}
        <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-center">
          {/* Quick Search across India */}
          <div className="relative flex-1 sm:w-64 min-w-[190px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search any location in India..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isDropdownOpen && e.target.value.trim().length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Use My Location (GPS) across India */}
          <button
            onClick={() => requestUserLocation()}
            disabled={isLocating}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
            title="Locate device GPS position and automatically select nearest Indian location"
          >
            <Navigation
              className={`w-3.5 h-3.5 ${
                isLocating ? 'animate-spin text-red-600' : 'text-blue-600'
              }`}
            />
            <span>{isLocating ? 'Scanning GPS...' : 'Use My Location'}</span>
          </button>

          {/* Recenter Button */}
          <button
            onClick={recenterMap}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
            title="Recenter Google Map on active location"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Recenter</span>
          </button>
        </div>
      </div>

      {/* ALL INDIA ACTIVE LOCATION PICKER MODAL / DROPDOWN */}
      {isDropdownOpen && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                  CHOOSE ACTIVE LOCATION (ALL OF INDIA)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Select any location, city, ward, or division in India — maps, thermal alerts, hospital surge signals, and response tasks update instantly.
              </p>
            </div>

            <button
              onClick={() => setIsDropdownOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Three View Tabs: All India Locations | Regional Command Divisions | Monitored Hotspots */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-black/5 text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('all-india')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'all-india'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-red-600" />
                <span>All India Locations ({filteredIndiaLocations.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('divisions')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'divisions'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-slate-600" />
                <span>Command Divisions ({filteredRegions.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('hotspots')}
                className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'hotspots'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-orange-600" />
                <span>Monitored Hotspots ({filteredHotspots.length})</span>
              </button>
            </div>

            {/* Quick Zone Category Pills */}
            {activeTab === 'all-india' && (
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                {REGION_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setCategoryFilter(tab.id);
                      setStateFilter('all');
                    }}
                    className={`px-3 py-1 rounded-xl font-bold shrink-0 transition-all ${
                      categoryFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* State Filter Chips for All India */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <button
              onClick={() => setStateFilter('all')}
              className={`text-[11px] font-bold px-3 py-1 rounded-xl shrink-0 transition-all ${
                stateFilter === 'all'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All States ({allStates.length})
            </button>
            {allStates.map((st) => (
              <button
                key={st}
                onClick={() => setStateFilter(st)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 transition-all ${
                  stateFilter === st
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* TAB 1: ALL INDIA LOCATIONS GRID */}
          {activeTab === 'all-india' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredIndiaLocations.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium">
                  No Indian locations match "{searchQuery}"
                </div>
              ) : (
                filteredIndiaLocations.map((loc) => {
                  const isSelected =
                    selectedIndiaLocation?.id === loc.id ||
                    (!selectedIndiaLocation &&
                      selectedRegion.name.toLowerCase().includes(loc.city.toLowerCase()));

                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-red-50/80 border-red-500 shadow-md ring-1 ring-red-400'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 truncate">
                            {loc.state}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                          {loc.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {loc.city}, {loc.state}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          Lat: {loc.lat.toFixed(2)}, Lng: {loc.lng.toFixed(2)}
                        </span>
                        <span className="text-red-600 font-bold hover:underline">
                          Select
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: COMMAND DIVISIONS (36 HEADQUARTERS) */}
          {activeTab === 'divisions' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredRegions.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-slate-400 font-medium">
                  No command divisions match your search
                </div>
              ) : (
                filteredRegions.map((region) => {
                  const isSelected = selectedRegion.id === region.id && !selectedIndiaLocation;
                  return (
                    <div
                      key={region.id}
                      onClick={() => handleSelectRegionDivision(region.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-red-50/80 border-red-500 shadow-md ring-1 ring-red-400'
                          : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 truncate">
                            {region.state}
                          </span>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                              {region.summary.regionalHeatStatus.tier.split(' ')[0]}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                          {region.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-2">
                          {region.assignedGeography}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>
                          Peak: {region.summary.regionalHeatStatus.currentPeakTempC}°C
                        </span>
                        <span className="font-bold text-red-600">
                          {region.summary.highRiskAreas.criticalCount} Critical Sites
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: MONITORED HOTSPOTS IN CURRENT ZONE */}
          {activeTab === 'hotspots' && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              <button
                onClick={() => {
                  selectArea(null);
                  setIsDropdownOpen(false);
                }}
                className={`w-full p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${
                  selectedArea === null
                    ? 'bg-red-50 border-red-400 text-red-950 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="font-bold block">
                      Scope to Entire {selectedRegion.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Regional overview covering all monitored areas in this division
                    </span>
                  </div>
                </div>
                {selectedArea === null && (
                  <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredHotspots.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400 font-medium">
                    No hotspots match "{searchQuery}"
                  </div>
                ) : (
                  filteredHotspots.map((area) => {
                    const isSelected = selectedArea?.id === area.id;
                    return (
                      <div
                        key={area.id}
                        onClick={() => handleSelectHotspot(area)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-50/80 border-red-500 shadow-md ring-1 ring-red-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded ${getRiskColor(
                                area.heatRisk
                              )}`}
                            >
                              {area.heatRisk}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" /> Active
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                            {area.name}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {area.district} • {area.zone}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Temp: {area.temperatureC}°C</span>
                          <span className="text-rose-600 font-medium">
                            Surge: {area.healthImpact.estimatedDailyAdmissions}/d
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="truncate max-w-[320px]">
              Current Active Selection:{' '}
              <strong className="text-slate-800 font-bold">{activeLocationLabel}</strong>
            </span>
            <span className="font-bold text-red-600 shrink-0">
              {activeLocationTemp}°C • {activeLocationRisk} Severity
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
