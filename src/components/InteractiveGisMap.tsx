import React, { useState } from 'react';
import { WardInfo, ProtectionPoint, RiskLevel } from '../types.js';
import { useCitizen } from '../context/CitizenContext.js';
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
} from 'lucide-react';

export type MapLayerType =
  | 'Overall Heat Risk'
  | 'Thermal Stress'
  | 'Heatwave Risk'
  | 'Vulnerability'
  | 'Protection';

interface InteractiveGisMapProps {
  heightClass?: string;
  showLayerSelector?: boolean;
  selectedWardId?: string;
  onSelectWard?: (ward: WardInfo) => void;
  showProtectionPoints?: boolean;
  showHealthcarePoints?: boolean;
  routeCoordinates?: {
    fastest?: [number, number][];
    safe?: [number, number][];
  };
}

export const InteractiveGisMap: React.FC<InteractiveGisMapProps> = ({
  heightClass = 'h-[440px]',
  showLayerSelector = true,
  selectedWardId,
  onSelectWard,
  showProtectionPoints = true,
  showHealthcarePoints = true,
  routeCoordinates,
}) => {
  const { location, selectWard, protectionPoints, healthcareFacilities, riskCurrent, thermalCurrent, navigateToHealthcareWithDirections } = useCitizen();

  const [activeLayer, setActiveLayer] = useState<MapLayerType>('Overall Heat Risk');
  const [hoveredWard, setHoveredWard] = useState<WardInfo | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ProtectionPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Map geographic bounding box of Pune to SVG canvas coordinates (800 x 600)
  // Lat: ~18.47 to 18.59, Lng: ~73.78 to 73.96
  const minLat = 18.47;
  const maxLat = 18.59;
  const minLng = 73.78;
  const maxLng = 73.96;

  const geoToSvg = (lat: number, lng: number): [number, number] => {
    const clampedLng = Math.max(minLng + 0.008, Math.min(maxLng - 0.008, lng));
    const clampedLat = Math.max(minLat + 0.008, Math.min(maxLat - 0.008, lat));
    const x = ((clampedLng - minLng) / (maxLng - minLng)) * 800;
    // Invert Y because SVG coordinates grow downwards
    const y = ((maxLat - clampedLat) / (maxLat - minLat)) * 600;
    return [x, y];
  };

  const getWardColor = (ward: WardInfo): { fill: string; stroke: string; label: string } => {
    if (activeLayer === 'Overall Heat Risk') {
      if (ward.vulnerabilityIndex >= 75) return { fill: '#FEE2E2', stroke: '#EF4444', label: 'Extreme' };
      if (ward.vulnerabilityIndex >= 55) return { fill: '#FFEDD5', stroke: '#F97316', label: 'High' };
      if (ward.vulnerabilityIndex >= 40) return { fill: '#FEF9C3', stroke: '#EAB308', label: 'Moderate' };
      return { fill: '#DCFCE7', stroke: '#22C55E', label: 'Low' };
    }

    if (activeLayer === 'Thermal Stress') {
      const uhi = ward.uhiOffsetDegC;
      if (uhi >= 2.5) return { fill: '#FEE2E2', stroke: '#EF4444', label: 'Extreme Thermal Stress' };
      if (uhi >= 1.6) return { fill: '#FFEDD5', stroke: '#F97316', label: 'High Thermal Stress' };
      if (uhi >= 1.0) return { fill: '#FEF9C3', stroke: '#EAB308', label: 'Moderate Thermal Stress' };
      return { fill: '#DCFCE7', stroke: '#22C55E', label: 'Low Thermal Stress' };
    }

    if (activeLayer === 'Heatwave Risk') {
      if (ward.id === 'ward-21' || ward.id === 'ward-18') return { fill: '#FEE2E2', stroke: '#DC2626', label: 'Severe Heatwave Alert' };
      if (ward.id === 'ward-14' || ward.id === 'ward-25') return { fill: '#FFEDD5', stroke: '#EA580C', label: 'Heatwave Warning' };
      return { fill: '#FEF9C3', stroke: '#CA8A04', label: 'Heat Advisory' };
    }

    if (activeLayer === 'Vulnerability') {
      if (ward.vulnerabilityIndex >= 75) return { fill: '#FCE7F3', stroke: '#DB2777', label: 'High Urban Vulnerability' };
      if (ward.vulnerabilityIndex >= 50) return { fill: '#EDE9FE', stroke: '#8B5CF6', label: 'Moderate Vulnerability' };
      return { fill: '#E0F2FE', stroke: '#0284C7', label: 'Low Vulnerability' };
    }

    // Protection layer
    const count = protectionPoints.filter((p) => p.wardId === ward.id).length;
    if (count >= 3) return { fill: '#DCFCE7', stroke: '#16A34A', label: 'High Protection Coverage' };
    if (count >= 1) return { fill: '#FEF9C3', stroke: '#D97706', label: 'Limited Protection' };
    return { fill: '#FEE2E2', stroke: '#DC2626', label: 'Protection Deficit' };
  };

  const currentGpsSvg = geoToSvg(location.lat, location.lng);
  const activeWard = location.allWards.find((w) => w.id === (selectedWardId || location.ward.id)) || location.ward;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#F0F2F5] border border-black/5 shadow-inner ${heightClass} flex flex-col`}>
      {/* Top Map Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Selector */}
        {showLayerSelector && (
          <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-xl border border-black/5 shadow-sm text-xs font-medium">
            <span className="flex items-center gap-1 px-2 text-slate-500 font-semibold">
              <Layers className="w-3.5 h-3.5" /> Layer:
            </span>
            {(['Overall Heat Risk', 'Thermal Stress', 'Heatwave Risk', 'Vulnerability', 'Protection'] as MapLayerType[]).map(
              (layer) => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    activeLayer === layer
                      ? 'bg-[#1D1D1F] text-white shadow-sm font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {layer}
                </button>
              )
            )}
          </div>
        )}

        {/* Current Map Context Badge */}
        <div className="pointer-events-auto ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-black/5 shadow-sm text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>GIS Network</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-normal">
              {activeWard.name.includes(':') ? activeWard.name.split(':')[1].trim() : activeWard.name}
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-white/90 backdrop-blur-md rounded-xl border border-black/5 shadow-sm overflow-hidden text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
              className="p-1.5 text-slate-600 hover:bg-slate-100 border-r border-slate-100"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.9, z - 0.2))}
              className="p-1.5 text-slate-600 hover:bg-slate-100"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full object-cover transition-transform duration-300 select-none"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            {/* Background grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
            </pattern>
            {/* River pattern */}
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Base Background */}
          <rect width="800" height="600" fill="#F8FAFC" />
          <rect width="800" height="600" fill="url(#grid)" />

          {/* Mutha & Mula Rivers (Iconic Pune landmark) */}
          <path
            d="M 120 480 Q 250 420 380 340 T 480 250 T 640 220 T 780 200"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 380 340 Q 420 180 500 120 T 620 90"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <text x="360" y="325" fill="#3B82F6" fontSize="11" fontWeight="600" opacity="0.7">
            Mutha River Greenway (-3.5°C)
          </text>

          {/* Wards polygons */}
          {location.allWards.map((ward) => {
            const isSelected = ward.id === activeWard.id;
            const isHovered = hoveredWard?.id === ward.id;
            const { fill, stroke } = getWardColor(ward);

            // Construct SVG polygon points
            const pointsString = ward.bounds
              .map(([lat, lng]) => {
                const [x, y] = geoToSvg(lat, lng);
                return `${x},${y}`;
              })
              .join(' ');

            const [centerX, centerY] = geoToSvg(ward.center[0], ward.center[1]);

            return (
              <g
                key={ward.id}
                className="cursor-pointer transition-opacity"
                onClick={() => {
                  selectWard(ward.id);
                  if (onSelectWard) onSelectWard(ward);
                }}
                onMouseEnter={() => setHoveredWard(ward)}
                onMouseLeave={() => setHoveredWard(null)}
              >
                <polygon
                  points={pointsString}
                  fill={fill}
                  fillOpacity={isSelected ? 0.85 : isHovered ? 0.75 : 0.55}
                  stroke={isSelected ? '#000000' : stroke}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                  strokeDasharray={isSelected ? undefined : undefined}
                  className="transition-all duration-200"
                />

                {/* Ward Center Label */}
                <circle cx={centerX} cy={centerY} r={isSelected ? 5 : 3.5} fill={stroke} />
                <text
                  x={centerX}
                  y={centerY - 8}
                  textAnchor="middle"
                  fill="#1E293B"
                  fontSize={isSelected ? '12' : '10'}
                  fontWeight={isSelected ? '700' : '600'}
                  className="pointer-events-none drop-shadow-sm select-none"
                >
                  {ward.name.split(':')[0]}
                </text>
                <text
                  x={centerX}
                  y={centerY + 16}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="9"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  UHI +{ward.uhiOffsetDegC}°C
                </text>
              </g>
            );
          })}

          {/* Route Overlays if provided */}
          {routeCoordinates?.fastest && (
            <g>
              <polyline
                points={routeCoordinates.fastest.map(([lat, lng]) => geoToSvg(lat, lng).join(',')).join(' ')}
                fill="none"
                stroke="#EF4444"
                strokeWidth="4"
                strokeDasharray="6,4"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>
          )}

          {routeCoordinates?.safe && (
            <g>
              <polyline
                points={routeCoordinates.safe.map(([lat, lng]) => geoToSvg(lat, lng).join(',')).join(' ')}
                fill="none"
                stroke="#10B981"
                strokeWidth="5"
                strokeLinecap="round"
                opacity="0.95"
              />
            </g>
          )}

          {/* Protection Points markers */}
          {showProtectionPoints &&
            protectionPoints.map((pt) => {
              const [px, py] = geoToSvg(pt.lat, pt.lng);
              const isSelected = selectedPoint?.id === pt.id;

              return (
                <g
                  key={pt.id}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPoint(pt);
                  }}
                >
                  {/* Point halo */}
                  <circle
                    cx={px}
                    cy={py}
                    r={isSelected ? 14 : 9}
                    fill={
                      pt.type === 'water'
                        ? '#3B82F6'
                        : pt.type === 'cooling'
                        ? '#06B6D4'
                        : pt.type === 'shade'
                        ? '#10B981'
                        : '#EC4899'
                    }
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                  <circle
                    cx={px}
                    cy={py}
                    r={isSelected ? 8 : 6}
                    fill={
                      pt.type === 'water'
                        ? '#2563EB'
                        : pt.type === 'cooling'
                        ? '#0891B2'
                        : pt.type === 'shade'
                        ? '#059669'
                        : '#DB2777'
                    }
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                </g>
              );
            })}

          {/* Healthcare points markers */}
          {showHealthcarePoints &&
            healthcareFacilities.map((hosp) => {
              const [hx, hy] = geoToSvg(hosp.lat, hosp.lng);
              return (
                <g key={hosp.id} className="cursor-pointer">
                  <circle cx={hx} cy={hy} r="10" fill="#EF4444" fillOpacity="0.2" />
                  <rect
                    x={hx - 6}
                    y={hy - 6}
                    width="12"
                    height="12"
                    rx="3"
                    fill="#EF4444"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <path
                    d={`M ${hx - 3} ${hy} L ${hx + 3} ${hy} M ${hx} ${hy - 3} L ${hx} ${hy + 3}`}
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

          {/* Current GPS Location Marker */}
          <g className="pointer-events-none">
            <circle
              cx={currentGpsSvg[0]}
              cy={currentGpsSvg[1]}
              r="22"
              fill="#0071E3"
              fillOpacity="0.2"
              className="animate-ping"
            />
            <circle cx={currentGpsSvg[0]} cy={currentGpsSvg[1]} r="10" fill="#0071E3" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx={currentGpsSvg[0]} cy={currentGpsSvg[1]} r="4" fill="#FFFFFF" />
            <text
              x={currentGpsSvg[0]}
              y={currentGpsSvg[1] + 24}
              textAnchor="middle"
              fill="#0071E3"
              fontSize="11"
              fontWeight="700"
              className="drop-shadow"
            >
              Your Location
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Protection Point Popup Drawer */}
      {selectedPoint && (
        <div className="absolute bottom-14 left-3 right-3 sm:right-auto sm:w-84 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-black/10 shadow-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`p-1.5 rounded-lg ${
                  selectedPoint.type === 'water'
                    ? 'bg-blue-50 text-blue-600'
                    : selectedPoint.type === 'cooling'
                    ? 'bg-cyan-50 text-cyan-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {selectedPoint.type === 'water' ? (
                  <Droplets className="w-4 h-4" />
                ) : selectedPoint.type === 'cooling' ? (
                  <Snowflake className="w-4 h-4" />
                ) : (
                  <Trees className="w-4 h-4" />
                )}
              </span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">{selectedPoint.name}</h4>
                <p className="text-[11px] text-slate-500">{selectedPoint.categoryLabel}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 space-y-1">
            <p className="line-clamp-1">{selectedPoint.address}</p>
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-slate-700">
                Available Capacity: {selectedPoint.availableCapacity} / {selectedPoint.capacity}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  selectedPoint.status === 'Available'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {selectedPoint.status}
              </span>
            </div>
            <div className="pt-1.5 flex gap-1.5">
              <button
                onClick={() => {
                  navigateToHealthcareWithDirections({
                    id: selectedPoint.id,
                    name: selectedPoint.name,
                    type: selectedPoint.type === 'healthcare' ? 'Hospital' : 'Emergency Care',
                    lat: selectedPoint.lat,
                    lng: selectedPoint.lng,
                    distanceKm: selectedPoint.distanceKm ?? 1.2,
                    travelTimeMins: selectedPoint.walkingTimeMins ?? 8,
                    travelMode: 'Walking',
                    address: selectedPoint.address,
                    wardId: selectedPoint.wardId,
                    phone: selectedPoint.contact || '',
                    isOpen24x7: selectedPoint.operatingHours?.includes('24') ?? false,
                    status: selectedPoint.status || 'Available',
                    emergencyIndicator: selectedPoint.type === 'healthcare' || !!selectedPoint.isEmergencyReady,
                    emergencyAvailability: selectedPoint.type === 'healthcare' ? 'Emergency Treatment Available' : 'Available',
                    heatStrokeBedsAvailable: 4,
                    totalHeatBeds: 8,
                    directionsUrl: '',
                    dataSource: 'LIVE/EXTERNAL DATA',
                    source: 'LIVE/EXTERNAL DATA',
                    lastUpdated: 'Current',
                  });
                }}
                className="flex-1 py-1 text-center bg-[#0071E3] text-white rounded-lg font-medium text-xs hover:bg-[#005bb5] transition-colors cursor-pointer"
              >
                Get Directions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Map Legend & Interactive Bar */}
      <div className="bg-white/95 backdrop-blur-md px-4 py-2 border-t border-black/5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Color Legend */}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-600">Risk Legend:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-md bg-[#22C55E]"></span>
            <span className="text-slate-600 font-medium">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-md bg-[#EAB308]"></span>
            <span className="text-slate-600 font-medium">Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-md bg-[#F97316]"></span>
            <span className="text-slate-600 font-medium">High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-md bg-[#EF4444]"></span>
            <span className="text-slate-600 font-medium">Extreme</span>
          </div>
        </div>

        {/* Selected Ward Details Quick Tag */}
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-bold text-slate-800">{activeWard.name}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Tree Canopy: {activeWard.treeCanopyPct}%</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Built Density: {activeWard.builtDensityPct}%</span>
        </div>
      </div>
    </div>
  );
};
