import React, { useState } from 'react';
import { DisasterAffectedArea, DisasterRiskSeverity } from '../../types/disaster.js';
import { useDisaster } from '../../context/DisasterContext.js';
import {
  MapPin,
  Flame,
  AlertTriangle,
  Layers,
  Crosshair,
  Info,
  Maximize2,
  TrendingUp,
} from 'lucide-react';

interface RegionalHeatMapProps {
  onSelectArea?: (area: DisasterAffectedArea) => void;
  heightClass?: string;
  showControls?: boolean;
}

export const RegionalHeatMap: React.FC<RegionalHeatMapProps> = ({
  onSelectArea,
  heightClass = 'h-[440px] sm:h-[480px]',
  showControls = true,
}) => {
  const { affectedAreas, selectedArea, setSelectedArea } = useDisaster();
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical-high' | 'health-impact' | 'shortfall'>('all');
  const [hoveredArea, setHoveredArea] = useState<DisasterAffectedArea | null>(null);

  // Filter areas based on user choice
  const displayedAreas = affectedAreas.filter((area) => {
    if (activeFilter === 'critical-high') {
      return area.heatRisk === 'Critical' || area.heatRisk === 'High';
    }
    if (activeFilter === 'health-impact') {
      return area.healthImpact.mortalityRiskSignal === 'Critical' || area.healthImpact.mortalityRiskSignal === 'Elevated';
    }
    if (activeFilter === 'shortfall') {
      return area.protectionShortfall.shortfallPercentage >= 40;
    }
    return true;
  });

  const getRiskColor = (severity: DisasterRiskSeverity) => {
    switch (severity) {
      case 'Critical':
        return {
          fill: '#FEE2E2',
          stroke: '#DC2626',
          badgeBg: 'bg-red-500',
          badgeText: 'text-white',
          pulse: true,
          label: 'Critical',
        };
      case 'High':
        return {
          fill: '#FFEDD5',
          stroke: '#EA580C',
          badgeBg: 'bg-orange-500',
          badgeText: 'text-white',
          pulse: false,
          label: 'High',
        };
      case 'Developing':
        return {
          fill: '#FEF9C3',
          stroke: '#CA8A04',
          badgeBg: 'bg-amber-400',
          badgeText: 'text-amber-950',
          pulse: false,
          label: 'Developing',
        };
      case 'Normal':
      default:
        return {
          fill: '#DCFCE7',
          stroke: '#16A34A',
          badgeBg: 'bg-emerald-500',
          badgeText: 'text-white',
          pulse: false,
          label: 'Normal',
        };
    }
  };

  const handleAreaClick = (area: DisasterAffectedArea) => {
    setSelectedArea(area);
    if (onSelectArea) {
      onSelectArea(area);
    }
  };

  // Pre-calculated geometric visual coordinates representing the metropolitan region layout
  const areaCanvasPositions: Record<string, { x: number; y: number; path: string }> = {
    'area-kasba-bhavani': {
      x: 390,
      y: 220,
      path: 'M350,190 L430,195 L440,250 L370,260 Z',
    },
    'area-swargate-transit': {
      x: 380,
      y: 310,
      path: 'M340,270 L430,265 L420,350 L330,340 Z',
    },
    'area-hadapsar-industrial': {
      x: 580,
      y: 280,
      path: 'M500,220 L660,230 L650,330 L510,340 Z',
    },
    'area-shivajinagar-junction': {
      x: 320,
      y: 160,
      path: 'M260,120 L370,130 L360,200 L250,190 Z',
    },
    'area-pune-station-sasoon': {
      x: 460,
      y: 165,
      path: 'M420,130 L510,140 L500,200 L420,190 Z',
    },
    'area-kothrud-karve': {
      x: 210,
      y: 270,
      path: 'M140,220 L270,230 L260,330 L130,310 Z',
    },
    'area-viman-nagar-airport': {
      x: 570,
      y: 140,
      path: 'M510,90 L650,100 L640,190 L510,180 Z',
    },
    'area-pashan-university': {
      x: 180,
      y: 150,
      path: 'M110,100 L240,110 L230,200 L110,180 Z',
    },
  };

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-xs overflow-hidden flex flex-col relative">
      {/* Top Map Action Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                REGIONAL HEAT SEVERITY MAP
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                Tier-3 Surge
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Metropolitan Jurisdiction • Click any zone for deep incident assessment
            </p>
          </div>
        </div>

        {/* Layer Filters */}
        {showControls && (
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-black/5 text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Zones ({affectedAreas.length})
            </button>
            <button
              onClick={() => setActiveFilter('critical-high')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'critical-high'
                  ? 'bg-white text-red-700 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Critical & High
            </button>
            <button
              onClick={() => setActiveFilter('health-impact')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'health-impact'
                  ? 'bg-white text-rose-700 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Health Surge
            </button>
            <button
              onClick={() => setActiveFilter('shortfall')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeFilter === 'shortfall'
                  ? 'bg-white text-amber-700 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Shortfall Gap
            </button>
          </div>
        )}
      </div>

      {/* SVG Canvas Map Area */}
      <div className={`relative w-full ${heightClass} bg-slate-50/60 overflow-hidden`}>
        <svg
          viewBox="0 0 760 420"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid background pattern */}
            <pattern id="disasterGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
            </pattern>
            {/* Radar glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#disasterGrid)" />

          {/* Metropolitan Border Polygon */}
          <path
            d="M80,80 L280,50 L460,60 L700,90 L710,340 L580,380 L350,390 L100,360 Z"
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Regional River Corridor (Mutha-Mula) for geographic realism */}
          <path
            d="M100,190 Q280,210 380,180 T680,195"
            fill="none"
            stroke="#93C5FD"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.6"
          />
          <text x="640" y="215" fill="#60A5FA" fontSize="10" fontWeight="bold">
            Mula-Mutha River
          </text>

          {/* Render Affected Area Polygons */}
          {displayedAreas.map((area) => {
            const visual = areaCanvasPositions[area.id] || { x: 380, y: 210, path: '' };
            const riskConfig = getRiskColor(area.heatRisk);
            const isSelected = selectedArea?.id === area.id;
            const isHovered = hoveredArea?.id === area.id;

            return (
              <g
                key={area.id}
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleAreaClick(area)}
                onMouseEnter={() => setHoveredArea(area)}
                onMouseLeave={() => setHoveredArea(null)}
              >
                {/* Zone Polygon */}
                {visual.path && (
                  <path
                    d={visual.path}
                    fill={riskConfig.fill}
                    stroke={isSelected ? '#000000' : riskConfig.stroke}
                    strokeWidth={isSelected ? '3' : isHovered ? '2.5' : '1.5'}
                    opacity={isSelected ? 0.95 : 0.8}
                    className="transition-all duration-200"
                  />
                )}

                {/* Pulsing indicator for Critical areas */}
                {riskConfig.pulse && (
                  <circle
                    cx={visual.x}
                    cy={visual.y}
                    r={isSelected ? '24' : '18'}
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Node Center Marker */}
                <circle
                  cx={visual.x}
                  cy={visual.y}
                  r={isSelected ? '9' : '7'}
                  fill={riskConfig.stroke}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  filter={isSelected ? 'url(#glow)' : undefined}
                />

                {/* Node Label Card */}
                <g transform={`translate(${visual.x}, ${visual.y - 14})`}>
                  <rect
                    x="-60"
                    y="-20"
                    width="120"
                    height="20"
                    rx="6"
                    fill="#1E293B"
                    opacity={isSelected ? 0.95 : 0.88}
                  />
                  <text
                    x="0"
                    y="-7"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="bold"
                  >
                    {area.name.split('-')[0].trim()} • {area.temperatureC}°C
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected / Hovered Detail Flyout (Bottom Left of Map) */}
        {(hoveredArea || selectedArea) && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-black/10 shadow-lg animate-in fade-in zoom-in-95 duration-150 z-20">
            {(() => {
              const active = hoveredArea || selectedArea!;
              const risk = getRiskColor(active.heatRisk);
              return (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {active.name}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${risk.badgeBg} ${risk.badgeText}`}
                    >
                      {risk.label} ({active.temperatureC}°C)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium block">Health Surge:</span>
                      <span className="font-extrabold text-red-600">
                        {active.healthImpact.hospitalizationRiskEstimate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Protection Shortfall:</span>
                      <span className="font-extrabold text-amber-600">
                        {active.protectionShortfall.shortfallPercentage}% Deficit
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium truncate max-w-[200px]">
                      {active.currentResponse.actionTitle}
                    </span>
                    <button
                      onClick={() => handleAreaClick(active)}
                      className="text-red-700 font-bold hover:underline shrink-0 flex items-center gap-0.5"
                    >
                      <span>Inspect Details</span>
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Map Legend (Bottom Right of Map) */}
        <div className="hidden sm:flex absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-black/5 shadow-xs flex-col gap-1 text-[10px] font-bold text-slate-700">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-0.5">
            SEVERITY SCALE
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span>Critical (&ge; 43°C / Extreme UHI)</span>
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Normal (&lt; 38°C)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
