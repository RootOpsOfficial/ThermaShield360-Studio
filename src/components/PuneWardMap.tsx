import React, { useState } from 'react';
import { MunicipalWardData, MunicipalRiskLevel } from '../types/municipal.js';
import { MapPin, Info, Shield, Thermometer } from 'lucide-react';

interface PuneWardMapProps {
  wards: MunicipalWardData[];
  selectedWardId?: string;
  onSelectWard?: (ward: MunicipalWardData) => void;
  interactive?: boolean;
  compact?: boolean;
}

// Projected coordinate bounds for Pune Metropolitan Area
// Lat: 18.47 to 18.59, Lng: 73.78 to 73.96
const MIN_LNG = 73.78;
const MAX_LNG = 73.96;
const MIN_LAT = 18.47;
const MAX_LAT = 18.59;
const SVG_WIDTH = 700;
const SVG_HEIGHT = 500;

function projectCoords(lat: number, lng: number): [number, number] {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * SVG_WIDTH;
  // Invert Y for latitude
  const y = SVG_HEIGHT - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * SVG_HEIGHT;
  return [Math.round(x), Math.round(y)];
}

const getRiskColor = (level: MunicipalRiskLevel, isSelected: boolean) => {
  switch (level) {
    case 'Critical':
      return {
        fill: isSelected ? '#DC2626' : '#EF4444',
        stroke: '#B91C1C',
        bg: 'bg-red-500',
        text: 'text-red-700',
        border: 'border-red-300',
      };
    case 'High':
      return {
        fill: isSelected ? '#EA580C' : '#F97316',
        stroke: '#C2410C',
        bg: 'bg-orange-500',
        text: 'text-orange-700',
        border: 'border-orange-300',
      };
    case 'Developing':
      return {
        fill: isSelected ? '#D97706' : '#FBBF24',
        stroke: '#B45309',
        bg: 'bg-amber-400',
        text: 'text-amber-700',
        border: 'border-amber-300',
      };
    case 'Normal':
      return {
        fill: isSelected ? '#059669' : '#10B981',
        stroke: '#047857',
        bg: 'bg-emerald-500',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
      };
    default:
      return {
        fill: '#94A3B8',
        stroke: '#64748B',
        bg: 'bg-slate-400',
        text: 'text-slate-700',
        border: 'border-slate-300',
      };
  }
};

export const PuneWardMap: React.FC<PuneWardMapProps> = ({
  wards,
  selectedWardId,
  onSelectWard,
  interactive = true,
  compact = false,
}) => {
  const [hoveredWard, setHoveredWard] = useState<MunicipalWardData | null>(null);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner flex flex-col ${compact ? 'h-[320px] sm:h-[380px]' : 'h-[460px] sm:h-[540px]'}`}>
      {/* Top Map Bar with Legend */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs font-semibold flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Pune Municipal GIS Layer</span>
        </div>

        {/* Legend */}
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-3 text-[11px] font-medium text-slate-300 pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]"></span>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FBBF24]"></span>
            <span>Developing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F97316]"></span>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]"></span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full max-h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Subtle grid pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            {/* Pulsing ring for critical wards */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#grid)" />

          {/* River Mula-Mutha representation */}
          <path
            d="M 60 120 Q 220 180 340 230 T 480 270 T 660 290"
            fill="none"
            stroke="#1E293B"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 60 120 Q 220 180 340 230 T 480 270 T 660 290"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3"
            strokeOpacity="0.4"
            strokeDasharray="4 4"
          />

          {/* Render Ward Polygons */}
          {wards.map((ward) => {
            const isSelected = selectedWardId === ward.id;
            const isHovered = hoveredWard?.id === ward.id;
            const colors = getRiskColor(ward.riskLevel, isSelected);

            const points = ward.bounds
              .map(([lat, lng]) => {
                const [x, y] = projectCoords(lat, lng);
                return `${x},${y}`;
              })
              .join(' ');

            const [centerX, centerY] = projectCoords(ward.center[0], ward.center[1]);

            return (
              <g
                key={ward.id}
                className={interactive ? 'cursor-pointer transition-all duration-200' : ''}
                onClick={() => interactive && onSelectWard && onSelectWard(ward)}
                onMouseEnter={() => setHoveredWard(ward)}
                onMouseLeave={() => setHoveredWard(null)}
              >
                {/* Polygon Shape */}
                <polygon
                  points={points}
                  fill={colors.fill}
                  fillOpacity={isSelected ? 0.85 : isHovered ? 0.75 : 0.45}
                  stroke={isSelected ? '#FFFFFF' : colors.stroke}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1.5}
                  strokeLinejoin="round"
                  filter={isSelected || ward.riskLevel === 'Critical' ? 'url(#glow)' : undefined}
                />

                {/* Ward Label & Center Marker */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#FFFFFF' : '#0F172A'}
                  stroke={colors.fill}
                  strokeWidth={2}
                />

                {/* Short Ward Title */}
                <text
                  x={centerX}
                  y={centerY - 10}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={compact ? '10' : '11'}
                  fontWeight="bold"
                  className="pointer-events-none drop-shadow-md select-none"
                >
                  {ward.name.split(':')[0]}
                </text>

                {/* Score Pill */}
                <text
                  x={centerX}
                  y={centerY + 16}
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize={compact ? '8.5' : '9.5'}
                  fontWeight="600"
                  className="pointer-events-none drop-shadow-sm select-none opacity-90"
                >
                  {ward.riskLevel} • {ward.riskScore}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Hover Info Card */}
      {hoveredWard && (
        <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md border border-white/10 p-2.5 rounded-xl shadow-xl text-white text-xs max-w-xs pointer-events-none z-20 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-slate-100">{hoveredWard.name}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                hoveredWard.riskLevel === 'Critical'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : hoveredWard.riskLevel === 'High'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : hoveredWard.riskLevel === 'Developing'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {hoveredWard.riskLevel}
            </span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-0.5">
            <p>Thermal Stress: <span className="font-semibold text-white">{hoveredWard.thermalStress}</span></p>
            <p>Protection Gap: <span className="font-semibold text-rose-400">{hoveredWard.protectionGap.toLocaleString()} citizens</span></p>
          </div>
        </div>
      )}

      {/* Bottom Hint */}
      {interactive && (
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] text-slate-400 pointer-events-none">
          Click any ward polygon to inspect details
        </div>
      )}
    </div>
  );
};
