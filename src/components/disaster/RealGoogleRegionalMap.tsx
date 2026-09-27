import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterAffectedArea, DisasterRiskSeverity } from '../../types/disaster.js';
import {
  MapPin,
  Flame,
  AlertTriangle,
  Layers,
  RotateCcw,
  Navigation,
  Search,
  Maximize2,
  Info,
  CheckCircle2,
  Plus,
  Minus,
  Radio,
} from 'lucide-react';

interface RealGoogleRegionalMapProps {
  onSelectArea?: (area: DisasterAffectedArea) => void;
  heightClass?: string;
  showControls?: boolean;
}

// Controller component to smoothly pan/zoom when selectedRegion or userLocation changes
const MapPanController: React.FC<{
  target: { lat: number; lng: number; zoom: number } | null;
}> = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    map.panTo({ lat: target.lat, lng: target.lng });
    map.setZoom(target.zoom);
  }, [map, target]);

  return null;
};

export const RealGoogleRegionalMap: React.FC<RealGoogleRegionalMapProps> = ({
  onSelectArea,
  heightClass = 'h-[460px] sm:h-[520px]',
  showControls = true,
}) => {
  const {
    selectedRegion,
    affectedAreas,
    selectedArea,
    setSelectedArea,
    userLocation,
    isLocating,
    requestUserLocation,
    recenterMap,
    mapCenterTarget,
  } = useDisaster();

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_GOOGLE_MAPS_API_KEY : '');

  const [activeFilter, setActiveFilter] = useState<'all' | 'critical-high' | 'health-impact' | 'shortfall'>('all');
  const [hoveredArea, setHoveredArea] = useState<DisasterAffectedArea | null>(null);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [mapZoom, setMapZoom] = useState<number>(selectedRegion.zoom);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter areas based on user filter choice
  const displayedAreas = affectedAreas.filter((area) => {
    if (activeFilter === 'critical-high') {
      return area.heatRisk === 'Critical' || area.heatRisk === 'High';
    }
    if (activeFilter === 'health-impact') {
      return (
        area.healthImpact.mortalityRiskSignal === 'Critical' ||
        area.healthImpact.mortalityRiskSignal === 'Elevated'
      );
    }
    if (activeFilter === 'shortfall') {
      return area.protectionShortfall.shortfallPercentage >= 40;
    }
    return true;
  });

  const getRiskColors = (severity: DisasterRiskSeverity) => {
    switch (severity) {
      case 'Critical':
        return {
          background: '#DC2626',
          glyphColor: '#FFFFFF',
          borderColor: '#991B1B',
          label: 'Critical',
          badgeClass: 'bg-red-600 text-white',
        };
      case 'Harmful + Confidence':
        return {
          background: '#E11D48',
          glyphColor: '#FFFFFF',
          borderColor: '#9F1239',
          label: 'Harmful + Conf',
          badgeClass: 'bg-rose-600 text-white',
        };
      case 'High':
        return {
          background: '#EA580C',
          glyphColor: '#FFFFFF',
          borderColor: '#9A3412',
          label: 'High',
          badgeClass: 'bg-orange-500 text-white',
        };
      case 'Developing':
        return {
          background: '#CA8A04',
          glyphColor: '#000000',
          borderColor: '#854D0E',
          label: 'Developing',
          badgeClass: 'bg-amber-400 text-amber-950',
        };
      case 'Normal':
      default:
        return {
          background: '#16A34A',
          glyphColor: '#FFFFFF',
          borderColor: '#166534',
          label: 'Normal',
          badgeClass: 'bg-emerald-600 text-white',
        };
    }
  };

  const handleMarkerClick = (area: DisasterAffectedArea) => {
    setSelectedArea(area);
    if (onSelectArea) {
      onSelectArea(area);
    }
  };

  // If no API key configured, provide a clear, non-blank error state
  if (!apiKey || apiKey.trim() === '') {
    return (
      <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-xs text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
        <h3 className="text-base font-black text-slate-900">
          GOOGLE MAPS PLATFORM CONFIGURATION REQUIRED
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          The real Google Maps Platform JavaScript API key is not currently initialized in your environment.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-xs overflow-hidden flex flex-col relative">
      {/* 1. TOP / MAP TOOLBAR (Phase 4) */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-red-50/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                REAL INTERACTIVE GOOGLE MAP
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-800 border border-red-200">
                Google Maps Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {selectedRegion.name} • {displayedAreas.length} Monitored Zones
            </p>
          </div>
        </div>

        {/* Map Toolbar Controls: Search, Filter, Use My Location, Recenter, Map Type */}
        {showControls && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {/* Layer View Filters */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-black/5">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2 py-1 rounded-lg text-[11px] transition-all ${
                  activeFilter === 'all'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Zones ({affectedAreas.length})
              </button>
              <button
                onClick={() => setActiveFilter('critical-high')}
                className={`px-2 py-1 rounded-lg text-[11px] transition-all ${
                  activeFilter === 'critical-high'
                    ? 'bg-white text-red-700 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Critical & High
              </button>
              <button
                onClick={() => setActiveFilter('health-impact')}
                className={`px-2 py-1 rounded-lg text-[11px] transition-all ${
                  activeFilter === 'health-impact'
                    ? 'bg-white text-rose-700 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Health Surge
              </button>
              <button
                onClick={() => setActiveFilter('shortfall')}
                className={`px-2 py-1 rounded-lg text-[11px] transition-all ${
                  activeFilter === 'shortfall'
                    ? 'bg-white text-amber-700 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Shortfall Deficit
              </button>
            </div>

            {/* Use My Location button */}
            <button
              onClick={() => requestUserLocation()}
              disabled={isLocating}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
              title="Position map on your device location"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-red-600' : 'text-blue-600'}`} />
              <span className="hidden sm:inline">My Location</span>
            </button>

            {/* Recenter button */}
            <button
              onClick={recenterMap}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
              title="Recenter on region center"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Recenter</span>
            </button>

            {/* Map Type Toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-black/5 text-[11px]">
              <button
                onClick={() => setMapTypeId('roadmap')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  mapTypeId === 'roadmap' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500'
                }`}
              >
                Map
              </button>
              <button
                onClick={() => setMapTypeId('terrain')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  mapTypeId === 'terrain' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500'
                }`}
              >
                Terrain
              </button>
              <button
                onClick={() => setMapTypeId('satellite')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  mapTypeId === 'satellite' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. REAL GOOGLE MAPS JAVASCRIPT API CONTAINER */}
      <div className={`relative w-full ${heightClass} bg-slate-100`}>
        <APIProvider apiKey={apiKey} libraries={['marker']}>
          <Map
            mapId="thermashield-disaster-map-id"
            defaultCenter={{
              lat: selectedRegion.center.lat,
              lng: selectedRegion.center.lng,
            }}
            defaultZoom={selectedRegion.zoom}
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            streetViewControl={false}
            fullscreenControl={true}
            mapTypeControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="w-full h-full"
          >
            <MapPanController target={mapCenterTarget} />

            {/* Render User Location Marker if available */}
            {userLocation && (
              <AdvancedMarker position={{ lat: userLocation.lat, lng: userLocation.lng }}>
                <Pin background="#2563EB" glyphColor="#FFFFFF" borderColor="#1D4ED8" />
              </AdvancedMarker>
            )}

            {/* Render Affected Areas as interactive AdvancedMarkers */}
            {displayedAreas.map((area) => {
              const risk = getRiskColors(area.heatRisk);
              const isSelected = selectedArea?.id === area.id;

              return (
                <AdvancedMarker
                  key={area.id}
                  position={{ lat: area.geoCenter.lat, lng: area.geoCenter.lng }}
                  onClick={() => handleMarkerClick(area)}
                  title={`${area.name} (${area.temperatureC}°C)`}
                >
                  <div
                    className={`cursor-pointer transition-transform duration-150 ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-10'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {/* Active Location Indicator if selected */}
                      {isSelected && (
                        <div className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap mb-1 flex items-center gap-1 border border-white animate-pulse">
                          <Radio className="w-2.5 h-2.5" />
                          <span>ACTIVE LOCATION</span>
                        </div>
                      )}

                      {/* Name & Temp Badge */}
                      <div className={`text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap mb-1 flex items-center gap-1 border ${
                        isSelected ? 'bg-red-950 border-red-400 ring-2 ring-red-500' : 'bg-slate-900/90 border-white/20'
                      }`}>
                        <span>{area.name.split('-')[0].trim()}</span>
                        <span className="text-orange-300 font-bold">{area.temperatureC}°C</span>
                      </div>

                      {/* Customized Google Pin */}
                      <Pin
                        background={risk.background}
                        glyphColor={risk.glyphColor}
                        borderColor={isSelected ? '#000000' : risk.borderColor}
                      />
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        </APIProvider>

        {/* 3. REAL GEOGRAPHY / GIS PROVENANCE PILL (Phase 5) */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/10 shadow-xs flex items-center gap-2 z-10 text-[10px] font-bold">
          <span
            className={`w-2 h-2 rounded-full ${
              selectedRegion.gisBoundaryConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-slate-700">
            {selectedRegion.gisBoundaryConnected
              ? `GIS BOUNDARY: ${selectedRegion.gisProvenance}`
              : selectedRegion.gisProvenance}
          </span>
        </div>

        {/* 4. SELECTED AREA DETAIL FLYOUT (Bottom Left of Map) */}
        {selectedArea && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-black/10 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-20">
            {(() => {
              const risk = getRiskColors(selectedArea.heatRisk);
              return (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {selectedArea.name}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${risk.badgeClass}`}
                    >
                      {selectedArea.heatRisk} ({selectedArea.temperatureC}°C)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium block">Health Surge:</span>
                      <span className="font-extrabold text-rose-600">
                        {selectedArea.healthImpact.hospitalizationRiskEstimate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Protection Shortfall:</span>
                      <span className="font-extrabold text-amber-600">
                        {selectedArea.protectionShortfall.shortfallPercentage}% Deficit
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium truncate max-w-[210px]">
                      {selectedArea.currentResponse.actionTitle}
                    </span>
                    <button
                      onClick={() => handleMarkerClick(selectedArea)}
                      className="text-red-700 font-bold hover:underline shrink-0 flex items-center gap-0.5"
                    >
                      <span>Side Panel</span>
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 5. LEGEND (Phase 7 - Bottom Right) */}
        <div className="hidden sm:flex absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-black/5 shadow-xs flex-col gap-1 text-[10px] font-bold text-slate-700 z-10">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-0.5">
            SEVERITY SCALE (IMD / CIMS)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Critical (&ge; 43°C / Extreme Wet Bulb)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span>Harmful + Confidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>High (41°C – 42.9°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Developing (38°C – 40.9°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Normal (&lt; 38°C)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
