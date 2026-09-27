import React from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterAffectedArea } from '../../types/disaster.js';
import {
  MapPin,
  Flame,
  HeartPulse,
  Scale,
  ShieldAlert,
  ArrowRight,
  Radio,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  Navigation,
} from 'lucide-react';

interface ActiveLocationSpotlightBarProps {
  onInspectArea?: (area: DisasterAffectedArea) => void;
  className?: string;
}

export const ActiveLocationSpotlightBar: React.FC<ActiveLocationSpotlightBarProps> = ({
  onInspectArea,
  className = '',
}) => {
  const {
    selectedRegion,
    selectedArea,
    selectArea,
    recenterMap,
    summary,
    currentResponseStage,
  } = useDisaster();

  if (!selectedArea) {
    // Whole region overview state
    return (
      <div
        className={`bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                ACTIVE LOCATION: REGIONAL JURISDICTION
              </span>
              <span className="text-xs font-bold text-red-600">
                Peak {summary.regionalHeatStatus.currentPeakTempC}°C
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
              {selectedRegion.name} ({selectedRegion.state})
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Regional command active across {summary.highRiskAreas.totalMonitored} monitored zones •{' '}
              <span className="font-bold text-red-700">
                {summary.highRiskAreas.criticalCount} Critical Sites
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-center">
          <button
            onClick={() => {
              if (selectedRegion.areas[0]) selectArea(selectedRegion.areas[0]);
            }}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 text-orange-300" />
            <span>Focus on Primary Hotspot</span>
          </button>
          <button
            onClick={recenterMap}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
            title="Recenter Map"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Recenter Map</span>
          </button>
        </div>
      </div>
    );
  }

  // Specific Hotspot/Area Focus State
  const riskClass =
    selectedArea.heatRisk === 'Critical'
      ? 'bg-red-600 text-white'
      : selectedArea.heatRisk === 'High'
      ? 'bg-orange-500 text-white'
      : 'bg-amber-500 text-white';

  return (
    <div
      className={`bg-gradient-to-r from-red-50/70 via-white to-orange-50/40 rounded-3xl p-4 sm:p-6 border border-red-200 shadow-sm relative overflow-hidden ${className}`}
    >
      {/* Decorative top border accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

      {/* Top Tag & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-red-100">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-xs">
            <Radio className="w-3 h-3 text-white animate-pulse" />
            ACTIVE LOCATION CHOICE: {selectedArea.name}
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {selectedArea.district} • {selectedArea.zone}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={recenterMap}
            className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-slate-700 text-[11px] font-bold border border-slate-200 shadow-2xs flex items-center gap-1 transition-all"
            title="Pan and zoom Google Map directly to this area"
          >
            <Navigation className="w-3 h-3 text-blue-600" />
            <span>Focus Map</span>
          </button>
          {onInspectArea && (
            <button
              onClick={() => onInspectArea(selectedArea)}
              className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-[11px] font-bold border border-red-300 flex items-center gap-1 transition-all"
            >
              <span>Area Dossier</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => selectArea(null)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition-all"
            title="Switch back to full regional jurisdiction overview"
          >
            Regional Scope
          </button>
        </div>
      </div>

      {/* Main Grid: Telemetry, Health Surge, Protection Deficit, Response Command */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Local Heat Load */}
        <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-red-100/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              LOCAL HEAT LOAD
            </span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${riskClass}`}>
              {selectedArea.heatRisk}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {selectedArea.temperatureC}°C
            </span>
            <span className="text-xs font-bold text-red-600">
              WBGT {selectedArea.wbgtC}°C
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 font-medium">
            Heat Index: <strong className="text-slate-800">{selectedArea.heatIndexC}°C</strong> •{' '}
            <span className="text-red-700 font-semibold">{selectedArea.trend}</span>
          </div>
        </div>

        {/* Metric 2: Local Epidemiological Health Impact */}
        <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-rose-100/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              HEALTHCARE SURGE
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
              {selectedArea.healthImpact.mortalityRiskSignal} Risk
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
              {selectedArea.healthImpact.hospitalizationRiskEstimate.split(' ')[0]}
            </span>
            <span className="text-xs font-semibold text-slate-500">Admissions Surge</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 font-medium">
            Est. Admissions: <strong className="text-slate-800">{selectedArea.healthImpact.estimatedDailyAdmissions}/day</strong> • Vulnerable:{' '}
            {selectedArea.healthImpact.vulnerablePopulationCount.toLocaleString()}
          </div>
        </div>

        {/* Metric 3: Local Protection Shortfall */}
        <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-amber-100/90 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              PROTECTION SHORTFALL
            </span>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              {selectedArea.protectionShortfall.status}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {selectedArea.protectionShortfall.shortfallPercentage}%
            </span>
            <span className="text-xs font-semibold text-slate-500">Net Protection Deficit</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 font-medium">
            Shelters: <strong>{selectedArea.protectionShortfall.sheltersOperational}</strong> of{' '}
            {selectedArea.protectionShortfall.sheltersRequired} required • Deficit:{' '}
            {(selectedArea.protectionShortfall.hydrationDeficitLitres / 1000).toFixed(0)}kL Water
          </div>
        </div>

        {/* Metric 4: Live Interventions & Coordination Required */}
        <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-red-100/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                ACTIVE DEPLOYMENT
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {selectedArea.currentResponse.status}
              </span>
            </div>
            <p className="text-xs font-black text-slate-900 leading-tight">
              {selectedArea.currentResponse.actionTitle}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              {selectedArea.currentResponse.responsibleAuthority}
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-red-700 font-semibold line-clamp-1">
            Req: {selectedArea.coordinationRequired}
          </div>
        </div>
      </div>
    </div>
  );
};
