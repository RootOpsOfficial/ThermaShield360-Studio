import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { LocationItem } from '../../data/allLocations.js';
import { REGION_TABS, REGION_CATEGORIES } from '../../data/allIndiaDisasterService.js';
import {
  MapPin,
  Navigation,
  Search,
  ChevronDown,
  RotateCcw,
  Check,
  AlertTriangle,
  Flame,
  X,
  Building,
  Radio,
  Layers,
  Globe,
  Compass,
} from 'lucide-react';

interface DisasterActiveLocationSelectorProps {
  variant?: 'header' | 'bar';
}

export const DisasterActiveLocationSelector: React.FC<DisasterActiveLocationSelectorProps> = ({
  variant = 'header',
}) => {
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
    isLocating,
    locationError,
    requestUserLocation,
    dismissLocationError,
    recenterMap,
    activeLocationLabel,
    activeLocationRisk,
    activeLocationTemp,
  } = useDisaster();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all-india' | 'hotspots' | 'jurisdictions'>('all-india');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = search.trim().toLowerCase();

  // Filter across all locations in India
  const filteredIndiaLocations = useMemo(() => {
    let list = allIndiaLocations;

    // Filter by Region category
    if (selectedRegionFilter !== 'all') {
      const allowedCategories = REGION_CATEGORIES[selectedRegionFilter] || [];
      list = list.filter((loc) => allowedCategories.includes(loc.category));
    }

    // Filter by search query
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
  }, [allIndiaLocations, selectedRegionFilter, trimmedQuery]);

  // Filter affected areas based on search query
  const filteredAreas = affectedAreas.filter((a) => {
    if (!trimmedQuery) return true;
    return (
      a.name.toLowerCase().includes(trimmedQuery) ||
      a.district.toLowerCase().includes(trimmedQuery) ||
      a.zone.toLowerCase().includes(trimmedQuery)
    );
  });

  // Filter regions based on search query
  const filteredRegions = availableRegions.filter((r) => {
    if (!trimmedQuery) return true;
    return (
      r.name.toLowerCase().includes(trimmedQuery) ||
      r.state.toLowerCase().includes(trimmedQuery) ||
      r.assignedGeography.toLowerCase().includes(trimmedQuery)
    );
  });

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

  const handleSelectIndiaLocation = (loc: LocationItem) => {
    selectIndiaLocation(loc);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button on Top Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50/60 hover:from-red-100 hover:to-orange-100/80 text-slate-900 border border-red-200/80 shadow-xs transition-all text-left group"
        title="Active Location Selector: Click to select ANY location across India"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs relative">
          <MapPin className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
        </div>

        <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[210px] md:max-w-[270px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-700 leading-none">
              ACTIVE LOCATION
            </span>
            <span
              className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.2 rounded leading-tight ${getRiskColor(
                activeLocationRisk
              )}`}
            >
              {activeLocationTemp}°C {activeLocationRisk.slice(0, 4)}
            </span>
          </div>
          <span className="truncate text-xs sm:text-sm font-bold text-slate-900 leading-tight group-hover:text-red-700 transition-colors">
            {selectedIndiaLocation
              ? selectedIndiaLocation.shortName
              : selectedArea
              ? selectedArea.name.split('-')[0].trim()
              : selectedRegion.name}
          </span>
          <span className="truncate text-[10px] text-slate-500 leading-none hidden sm:block">
            {selectedIndiaLocation
              ? selectedIndiaLocation.state
              : selectedArea
              ? selectedRegion.name
              : selectedRegion.state}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-red-700 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown / Location Command Modal */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[92vw] sm:w-[520px] max-w-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-red-600 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  CHOOSE ACTIVE LOCATION (ALL INDIA)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Select any location across India — maps, heatwave telemetry, health surges, and escalations synchronize to your selection
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Location Error Notice if Geolocation fails */}
          {locationError && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{locationError}</span>
              </div>
              <button
                onClick={dismissLocationError}
                className="text-amber-700 hover:bg-amber-100 p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick Actions Bar: GPS, Recenter & Search */}
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2">
              {/* Use My Location (GPS) across all India */}
              <button
                onClick={() => {
                  requestUserLocation();
                }}
                disabled={isLocating}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs border border-slate-200/80"
              >
                <Navigation
                  className={`w-3.5 h-3.5 ${
                    isLocating ? 'animate-spin text-red-600' : 'text-blue-600'
                  }`}
                />
                <span>{isLocating ? 'Scanning India GPS...' : 'Use My Location'}</span>
              </button>

              {/* Recenter Map on Active Choice */}
              <button
                onClick={() => {
                  recenterMap();
                  setIsOpen(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs border border-slate-200/80"
                title="Pan and zoom Google Map directly to active location"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Recenter Map</span>
              </button>
            </div>

            {/* Search Input across 190+ locations in India */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search any state, district, city, ward, or hotspot across India..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Three View Tabs: All India Locations | Focus Hotspots | Major Jurisdictions */}
          <div className="mt-3 flex items-center bg-slate-100 p-1 rounded-2xl border border-black/5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('all-india')}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'all-india'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-red-600" />
              <span>All India ({filteredIndiaLocations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'hotspots'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-600" />
              <span>Hotspots ({filteredAreas.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('jurisdictions')}
              className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'jurisdictions'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-slate-600" />
              <span>Command Divisions</span>
            </button>
          </div>

          {/* TAB 1: ALL INDIA LOCATIONS */}
          {activeTab === 'all-india' && (
            <div className="mt-3 space-y-2.5">
              {/* Region category pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                {REGION_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedRegionFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                      selectedRegionFilter === tab.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Locations List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {filteredIndiaLocations.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No Indian locations match "{search}"
                  </div>
                ) : (
                  filteredIndiaLocations.map((loc) => {
                    const isSelected =
                      selectedIndiaLocation?.id === loc.id ||
                      (!selectedIndiaLocation &&
                        selectedArea?.name.toLowerCase().includes(loc.shortName.toLowerCase()));

                    return (
                      <div
                        key={loc.id}
                        onClick={() => handleSelectIndiaLocation(loc)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-red-50 border-red-500 shadow-xs ring-1 ring-red-400'
                            : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {loc.name}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {loc.city}, {loc.state} • Lat: {loc.lat.toFixed(2)}, Lng: {loc.lng.toFixed(2)}
                          </p>
                        </div>

                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shrink-0">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] font-bold text-red-600 hover:underline shrink-0 px-2 py-1 rounded-lg hover:bg-red-50"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MONITORED HOTSPOTS */}
          {activeTab === 'hotspots' && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => {
                  selectArea(null);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
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

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {filteredAreas.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    No hotspots match "{search}"
                  </div>
                ) : (
                  filteredAreas.map((area) => {
                    const isSelected = selectedArea?.id === area.id;
                    return (
                      <div
                        key={area.id}
                        onClick={() => {
                          selectArea(area);
                          setIsOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-red-50 border-red-500 shadow-xs ring-1 ring-red-400'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900 truncate">
                              {area.name}
                            </span>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded ${getRiskColor(
                                area.heatRisk
                              )}`}
                            >
                              {area.heatRisk}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {area.district} • {area.zone}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                            <span>Temp: {area.temperatureC}°C</span>
                            <span>WBGT: {area.wbgtC}°C</span>
                            <span className="text-rose-600 font-medium">
                              Surge: {area.healthImpact.estimatedDailyAdmissions}/d
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shrink-0">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] font-bold text-red-600 hover:underline shrink-0 px-2 py-1 rounded-lg hover:bg-red-50"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMMAND JURISDICTIONS */}
          {activeTab === 'jurisdictions' && (
            <div className="mt-3 max-h-60 overflow-y-auto space-y-2 pr-1">
              {filteredRegions.map((region) => {
                const isSelected = selectedRegion.id === region.id;
                return (
                  <div
                    key={region.id}
                    onClick={() => {
                      selectRegion(region.id);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-50 border-red-500 shadow-xs ring-1 ring-red-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          {region.state}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {region.summary.regionalHeatStatus.tier.split(' ')[0]}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 mt-0.5">
                        {region.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                        {region.assignedGeography}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                        <span>Peak: {region.summary.regionalHeatStatus.currentPeakTempC}°C</span>
                        <span className="text-red-600 font-bold">
                          {region.summary.highRiskAreas.criticalCount} Critical Sites
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shrink-0">
                        <Check className="w-3 h-3" />
                        <span>Active</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="text-[11px] font-bold text-red-600 hover:underline shrink-0 px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Active Summary Pill */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate max-w-[280px]">
              Active: <strong className="text-slate-800">{activeLocationLabel}</strong>
            </span>
            <span className="font-bold text-red-600 shrink-0">
              {activeLocationTemp}°C • {activeLocationRisk}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
