import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { RealGoogleRegionalMap } from '../../components/disaster/RealGoogleRegionalMap.js';
import { AreaDetailDrawer } from '../../components/disaster/AreaDetailDrawer.js';
import { DisasterAffectedArea, RegionalResponseStage } from '../../types/disaster.js';
import {
  Flame,
  MapPin,
  HeartPulse,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Compass,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  RefreshCw,
  Building,
} from 'lucide-react';
import { DataValidationCenter } from '../../components/data/DataValidationCenter.js';
import { SourceDataTable } from '../../components/data/SourceDataTable.js';

const RESPONSE_STAGES: RegionalResponseStage[] = [
  'MONITOR',
  'PREPARE',
  'ESCALATE',
  'COORDINATE',
  'RESPOND',
  'VERIFY',
];

export const EmergencyCommandPage: React.FC = () => {
  const {
    selectedRegion,
    summary,
    affectedAreas,
    selectedArea,
    setSelectedArea,
    dataStatus,
    refreshDisasterData,
    isLoading,
    setActiveDisasterPage,
    currentResponseStage,
  } = useDisaster();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showValidationCenter, setShowValidationCenter] = useState(false);

  const handleSelectArea = (area: DisasterAffectedArea) => {
    setSelectedArea(area);
    setIsDrawerOpen(true);
  };

  const handleViewOnMap = (area: DisasterAffectedArea) => {
    setSelectedArea(area);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION (Phase 7) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              <Radio className="w-3 h-3 text-red-600 animate-pulse" />
              EMERGENCY REGIONAL COMMAND EOC
            </span>
            {/* Data Status Provenance Pill (Phase 17) */}
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                dataStatus === 'LIVE'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : dataStatus === 'MODELLED'
                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                  : dataStatus === 'ESTIMATED'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              DATA PROVENANCE: {dataStatus}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            EMERGENCY COMMAND
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-red-700 mt-0.5">
            Regional Heat Situation • Impact • Coordination
          </p>

          {/* Region, Assigned Geography, Current Date/Time, Last Updated */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-800 font-bold">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              {selectedRegion.name} ({selectedRegion.state})
            </span>
            <span className="text-slate-400">•</span>
            <span>{selectedRegion.assignedGeography}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-700 font-semibold">{summary.currentDateTime}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {summary.lastUpdated}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <button
            onClick={() => refreshDisasterData()}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Refresh radar & telemetry feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-red-600' : ''}`} />
            <span className="hidden sm:inline">Sync Feeds</span>
          </button>
          <button
            onClick={() => setShowValidationCenter(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
            title="Audit Multi-Agency Provenance & Model Agreement Matrix"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Sources & Validation</span>
          </button>
          <button
            onClick={() => setActiveDisasterPage('alerts-escalation')}
            className="px-4 py-2.5 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-700/20 flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Escalation Console</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REGIONAL RESPONSE FLOW BAR (Phase 16) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-black/5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            REGIONAL EMERGENCY DECISION FLOW
          </span>
          <span className="text-[11px] font-bold text-red-700">
            Current Active Posture: {currentResponseStage}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {RESPONSE_STAGES.map((stage, idx) => {
            const isActive = currentResponseStage === stage;
            const isPast =
              RESPONSE_STAGES.indexOf(currentResponseStage) > idx;

            return (
              <div
                key={stage}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isActive
                    ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-400/50'
                    : isPast
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="text-[9px] font-black opacity-80">0{idx + 1}</span>
                  {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                </div>
                <span className="text-xs font-black tracking-tight">{stage}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FOUR PRIMARY SUMMARY CARDS ONLY (Phase 7) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Regional Heat Status */}
        <div
          onClick={() => setActiveDisasterPage('heat-situation')}
          className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              1. REGIONAL HEAT STATUS
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
              {summary.regionalHeatStatus.severity}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {summary.regionalHeatStatus.currentPeakTempC}°C
            </span>
            <span className="text-xs font-bold text-red-600">
              Index {summary.regionalHeatStatus.highestIndexC}°C
            </span>
          </div>

          <p className="text-xs font-bold text-slate-800 mt-2 truncate">
            {summary.regionalHeatStatus.tier}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span>Trend: {summary.regionalHeatStatus.trend}</span>
            <span className="text-red-700 font-bold group-hover:underline flex items-center gap-0.5">
              <span>Inspect</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Card 2: High-Risk Areas */}
        <div
          onClick={() => setActiveDisasterPage('high-risk-areas')}
          className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              2. HIGH-RISK AREAS
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-600 text-white">
              {summary.highRiskAreas.criticalCount} Critical
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-red-600 tracking-tight">
              {summary.highRiskAreas.criticalCount + summary.highRiskAreas.highCount}
            </span>
            <span className="text-xs font-medium text-slate-500">
              of {summary.highRiskAreas.totalMonitored} Monitored
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-800 mt-2 truncate">
            Primary: {summary.highRiskAreas.primaryHotspot.split('&')[0]}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span>{summary.highRiskAreas.developingCount} Developing Risk</span>
            <span className="text-red-700 font-bold group-hover:underline flex items-center gap-0.5">
              <span>View Wards</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Card 3: Health Impact */}
        <div
          onClick={() => setActiveDisasterPage('health-impact')}
          className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              3. HEALTH IMPACT
            </span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-100 text-rose-800">
              MODELLED
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
              {summary.healthImpact.hospitalizationSurgeEstimate.split(' ')[0]}
            </span>
            <span className="text-xs font-bold text-red-600">
              {summary.healthImpact.mortalityRiskSignal} Signal
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-800 mt-2 truncate">
            ~{summary.healthImpact.estimatedDailyExcessAdmissions} excess admissions/day
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span>Trend: {summary.healthImpact.trend}</span>
            <span className="text-rose-700 font-bold group-hover:underline flex items-center gap-0.5">
              <span>Epidemic View</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>

        {/* Card 4: Protection Shortfall */}
        <div
          onClick={() => setActiveDisasterPage('protection-shortfall')}
          className="bg-white rounded-3xl p-5 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              4. PROTECTION SHORTFALL
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
              Gap Deficit
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-700 tracking-tight">
              {summary.protectionShortfall.overallShortfallPct}%
            </span>
            <span className="text-xs font-medium text-slate-500">
              Unmet Protection Need
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-800 mt-2 truncate">
            Deficit: {summary.protectionShortfall.mostDeficientSector.split('&')[0]}
          </p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
            <span>Hydration & Shelter Gap</span>
            <span className="text-amber-800 font-bold group-hover:underline flex items-center gap-0.5">
              <span>Analyse</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN REGIONAL MAP (REAL GOOGLE MAP - Phase 3 & Phase 7) */}
      {/* ========================================================================= */}
      <div>
        <RealGoogleRegionalMap onSelectArea={handleSelectArea} />
      </div>

      {/* ========================================================================= */}
      {/* 5. HIGH-RISK AREAS & FORECAST CONFIDENCE (Phase 7) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP HIGH-RISK AREAS: (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  TOP HIGH-RISK AREAS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800">
                  Prioritized by Thermal Vulnerability
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Click View Area to open incident coordination and health impact details
              </p>
            </div>

            <button
              onClick={() => setActiveDisasterPage('high-risk-areas')}
              className="text-xs font-bold text-red-700 hover:underline flex items-center gap-1"
            >
              <span>View All ({affectedAreas.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {affectedAreas.slice(0, 5).map((area) => {
              const isCurrentActive = selectedArea?.id === area.id;
              return (
                <div
                  key={area.id}
                  onClick={() => handleSelectArea(area)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                    isCurrentActive
                      ? 'bg-red-50/80 border-red-500 shadow-sm ring-1 ring-red-400'
                      : 'border-slate-200/80 hover:border-red-300 hover:bg-red-50/20'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 sm:mt-0 ${
                        area.heatRisk === 'Critical'
                          ? 'bg-red-600 animate-pulse'
                          : area.heatRisk === 'High'
                          ? 'bg-orange-500'
                          : 'bg-amber-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-red-800 transition-colors">
                          {area.name}
                        </h4>
                        {isCurrentActive && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-red-600 text-white">
                            Active Choice
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {area.district} • {area.zone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900 block">
                        {area.temperatureC}°C
                      </span>
                      <span className="text-[10px] text-red-600 font-semibold block">
                        {area.healthImpact.hospitalizationRiskEstimate}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-xl shadow-2xs ${
                        area.heatRisk === 'Critical'
                          ? 'bg-red-600 text-white'
                          : area.heatRisk === 'High'
                          ? 'bg-orange-500 text-white'
                          : 'bg-amber-400 text-amber-950'
                      }`}
                    >
                      {area.heatRisk}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectArea(area);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        isCurrentActive
                          ? 'bg-red-600 text-white shadow-2xs'
                          : 'bg-slate-100 group-hover:bg-red-600 group-hover:text-white text-slate-700'
                      }`}
                    >
                      {isCurrentActive ? 'Focused' : 'View Area'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FORECAST CONFIDENCE (1 col - Phase 7) */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                FORECAST CONFIDENCE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
                IMD & ECMWF
              </span>
            </div>

            {/* Simple states: High, Moderate, Low */}
            <div className="flex items-center gap-2 mb-4">
              {(['High', 'Moderate', 'Low'] as const).map((lvl) => {
                const isActive = summary.forecastConfidence.level === lvl;
                return (
                  <div
                    key={lvl}
                    className={`flex-1 text-center py-2.5 px-1 rounded-xl border text-xs font-black transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {lvl}
                  </div>
                );
              })}
            </div>

            {/* Short explanation strictly following Phase 7 */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-950">
              <p className="font-bold leading-relaxed">
                "Warning signal is stable as the event approaches."
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Consensus: {summary.forecastConfidence.modelConsensus} • {summary.forecastConfidence.reliabilityWindow}
              </p>
            </div>
          </div>

          {/* Quick SITREP Export Link */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block mb-1">
              REGIONAL EOC SITREP
            </span>
            <h4 className="text-sm font-black">{selectedRegion.name} Daily SITREP</h4>
            <p className="text-xs text-slate-300 mt-1">
              Dispatched to State Relief Commissioner & Municipal Emergency Cells.
            </p>
            <button
              onClick={() => alert(`SITREP Situation Report PDF generated for ${selectedRegion.name} with current verified telemetry.`)}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Official SITREP PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. HEALTH IMPACT & PROTECTION SHORTFALL PANELS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HEALTH IMPACT PANEL */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  HEALTH IMPACT
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                MODELLED / ESTIMATED
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block">Hospitalization Risk</span>
                <span className="text-lg font-black text-rose-700">
                  {summary.healthImpact.hospitalizationSurgeEstimate.split(' ')[0]}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">above baseline</span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block">Mortality Signal</span>
                <span className="text-lg font-black text-red-600">
                  {summary.healthImpact.mortalityRiskSignal}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Alert Level</span>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 text-center">
                <span className="text-[10px] text-slate-500 font-semibold block">Epidemic Trend</span>
                <span className="text-lg font-black text-slate-900">
                  {summary.healthImpact.trend.split(' ')[0]}
                </span>
                <span className="text-[9px] text-red-600 font-semibold block mt-0.5">Rapid Surge</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                High-Impact Catchments:
              </span>
              {summary.healthImpact.highImpactZones.map((z, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                  <span className="font-semibold">{z}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 font-medium">
              {summary.healthImpact.disclaimer}
            </span>
            <button
              onClick={() => setActiveDisasterPage('health-impact')}
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>Full Health Page</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* PROTECTION SHORTFALL PANEL */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  PROTECTION SHORTFALL
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                {summary.protectionShortfall.overallShortfallPct}% DEFICIT
              </span>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-[10px] font-black uppercase text-amber-800 block">
                  Expected Protection Need
                </span>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {summary.protectionShortfall.expectedNeedSummary}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-500 block">
                  Available Protection Currently Deployed
                </span>
                <p className="font-extrabold text-slate-900 mt-0.5">
                  {summary.protectionShortfall.availableProtectionSummary}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-red-50/50 border border-red-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-red-800 block">
                    Calculated Shortfall Deficit
                  </span>
                  <p className="font-extrabold text-red-700 mt-0.5">
                    {summary.protectionShortfall.mostDeficientSector}
                  </p>
                </div>
                <span className="text-xl font-black text-red-700">
                  -{summary.protectionShortfall.overallShortfallPct}%
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-400 font-medium">
              Calculated via shared ThermaShield Protection Deficit Engine
            </span>
            <button
              onClick={() => setActiveDisasterPage('protection-shortfall')}
              className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-0.5 shrink-0"
            >
              <span>Full Shortfall Page</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. CURRENT ESCALATION & RESPONSE STATUS (Phase 7) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CURRENT ESCALATION (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-red-50/80 via-white to-red-50/40 rounded-3xl p-5 sm:p-7 border border-red-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-red-200/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-700" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-red-950 block">
                  CURRENT ESCALATION
                </span>
                <span className="text-[11px] font-bold text-red-700">
                  {summary.currentEscalation.level}
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-red-600 text-white shadow-2xs">
              ACTION REQUIRED
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="bg-white/90 p-3.5 rounded-2xl border border-red-100 shadow-2xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 block mb-0.5">
                WHAT IS HAPPENING
              </span>
              <p className="text-slate-800 font-semibold leading-relaxed">
                {summary.currentEscalation.what}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/90 p-3 rounded-2xl border border-red-100 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                  WHERE
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  {summary.currentEscalation.where}
                </p>
              </div>

              <div className="bg-white/90 p-3 rounded-2xl border border-red-100 shadow-2xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
                  WHY
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  {summary.currentEscalation.why}
                </p>
              </div>
            </div>

            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-200 block mb-1">
                REQUIRED INTER-AGENCY COORDINATION
              </span>
              <p className="text-xs font-semibold leading-relaxed">
                {summary.currentEscalation.requiredCoordination}
              </p>
            </div>
          </div>
        </div>

        {/* RESPONSE STATUS COMPACT (1 col - Phase 7) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  RESPONSE STATUS
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </div>

            <p className="text-xs font-black text-slate-900 mb-3">
              {summary.responseStatusCompact.overallPosture}
            </p>

            <div className="space-y-2 text-xs mb-4">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Active Operations</span>
                <span className="font-extrabold text-slate-900">
                  {summary.responseStatusCompact.activeOperationsCount} Missions
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Deployed Squads</span>
                <span className="font-extrabold text-blue-700">
                  {summary.responseStatusCompact.deployedTeamsCount} Teams On-Site
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Hydration Kiosks Live</span>
                <span className="font-extrabold text-emerald-700">
                  {summary.responseStatusCompact.hydrationKiosksActive} Operational
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-950 font-medium">
              <span className="font-bold block mb-0.5">Briefing Record:</span>
              {summary.responseStatusCompact.lastBriefingTime} • Inter-agency commanders on standby.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveDisasterPage('response-tracking')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span>Track All Response Missions</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DATA SOURCE & VALIDATION PROVENANCE TABLE                    */}
      {/* ============================================================ */}
      <div className="pt-2">
        <SourceDataTable
          lat={selectedRegion?.center?.lat ?? 18.5204}
          lng={selectedRegion?.center?.lng ?? 73.8567}
          title="Disaster Management Early Warning Provenance"
          subtitle="Traceable multi-model NWP & satellite feeds backing regional heat crisis response missions"
          onOpenValidationCenter={() => setShowValidationCenter(true)}
        />
      </div>

      {/* Side Panel Drawer for Selected Area Details */}
      {isDrawerOpen && (
        <AreaDetailDrawer
          area={selectedArea}
          onClose={() => setIsDrawerOpen(false)}
          onViewOnMap={handleViewOnMap}
        />
      )}

      {showValidationCenter && (
        <DataValidationCenter isModal onClose={() => setShowValidationCenter(false)} />
      )}
    </div>
  );
};
