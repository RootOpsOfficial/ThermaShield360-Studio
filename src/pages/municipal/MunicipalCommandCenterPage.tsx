import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import { PuneWardMap } from '../../components/PuneWardMap.js';
import { MunicipalWardData } from '../../types/municipal.js';
import {
  Flame,
  AlertTriangle,
  ShieldAlert,
  ListChecks,
  ArrowRight,
  Bell,
  Calendar,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const MunicipalCommandCenterPage: React.FC = () => {
  const {
    summary,
    wards,
    selectedWard,
    setSelectedWard,
    setActiveMunicipalPage,
    isRefreshing,
    refreshMunicipalData,
  } = useMunicipal();

  const [activePreviewWard, setActivePreviewWard] = useState<MunicipalWardData | null>(null);

  // Loading state
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] text-slate-500 text-sm gap-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-700 text-base">Connecting to Municipal Command Center Feed...</p>
        <p className="text-xs text-slate-400">Loading Municipal Corporation heat risk telemetry</p>
      </div>
    );
  }

  const priorityWard = summary.priorityWard || (wards.length > 0 ? wards[0] : null);
  const displayedWard = activePreviewWard || priorityWard;

  const handleSelectWardFromMap = (ward: MunicipalWardData) => {
    setActivePreviewWard(ward);
  };

  const handleViewWardInGIS = (ward: MunicipalWardData | null) => {
    if (ward) setSelectedWard(ward);
    setActiveMunicipalPage('ward-risk-map');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* A — HEADER                                                   */}
      {/* ============================================================ */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              DISASTER MANAGEMENT CELL
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              MODELLED / GIS PREVIEW
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline">
              IMD Synoptic Calibrated
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Command Center
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
            City Heat Risk • Protection • Response
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium mt-1">
            <span className="text-slate-600 font-semibold">{summary.cityName || 'Municipal Corporation'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {summary.dateTime || 'Live Session'}
            </span>
          </div>
        </div>

        {/* Quick Top Actions: Refresh + Jump to Full GIS */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => refreshMunicipalData()}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-black/5"
            title="Refresh Municipal Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          <button
            onClick={() => setActiveMunicipalPage('ward-risk-map')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>View Ward Risk Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* B — FOUR KEY SUMMARY CARDS ONLY                              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: CURRENT HEAT RISK */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Current Heat Risk</span>
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-orange-600 tracking-tight">
                {summary.currentHeatRisk || 'Warning'}
              </span>
              <span className="text-xs font-bold text-slate-400">
                ({summary.currentRiskScore || 78}/100)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              Elevated thermal strain across central urban and industrial corridors.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-orange-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Warning Active
            </span>
          </div>
        </div>

        {/* CARD 2: HIGH-RISK WARDS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>High-Risk Wards</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-rose-600 tracking-tight">
                {summary.highRiskWardsCount || 3}
              </span>
              <span className="text-base font-bold text-slate-400">
                / {summary.totalWardsCount || 6} Monitored Wards
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              Kasba Peth, Hadapsar, and Swargate exceed safety thresholds.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-rose-600">Immediate Attention</span>
          </div>
        </div>

        {/* CARD 3: PROTECTION GAP */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Protection Gap</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {(summary.totalProtectionGap || 10770).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-700">Citizens</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              Unserved citizens exceeding available cooling & hydration infrastructure.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Status</span>
            <span className="font-bold text-amber-700">Deficit Active</span>
          </div>
        </div>

        {/* CARD 4: PRIORITY ACTION */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Priority Action</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ListChecks className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <span className="text-lg font-black text-slate-900 line-clamp-1">
              Deploy Water Support
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              Ward 21 (Kasba Peth) — Deploy cooling and water support during peak-risk window.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Affected</span>
            <span className="font-bold text-blue-700">Ward 21 (Kasba Peth)</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* C — 5-DAY HEAT OUTLOOK (OPERATIONAL AWARENESS)              */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5-Day Municipal Heat Outlook
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Synoptic IMD Surface Forecast</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {summary.fiveDayOutlook.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${
                item.riskLevel === 'Critical'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : item.riskLevel === 'High'
                  ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                  : item.riskLevel === 'Developing'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-slate-500">
                {idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : `Day ${idx + 1}`}
              </span>
              <span className="text-xl font-black tracking-tight my-1">{item.tempMax}°C</span>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                  item.riskLevel === 'Critical'
                    ? 'bg-rose-600 text-white'
                    : item.riskLevel === 'High'
                    ? 'bg-orange-600 text-white'
                    : item.riskLevel === 'Developing'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {item.riskLevel}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">
                {idx === 0 ? 'Peak Window' : idx === 1 ? '+0.4°C Trend' : 'Thermal Strain'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* D & E — WARD RISK MAP + PRIORITY WARD CARD                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* D — WARD RISK MAP (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                    GEOGRAPHIC OVERVIEW
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                    DEMO / MODELLED
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                  Ward Risk Map Preview
                </h3>
              </div>

              <button
                onClick={() => setActiveMunicipalPage('ward-risk-map')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shrink-0"
              >
                <span>View Ward Risk Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Map Preview: Shows only the primary heat risk layer */}
            <PuneWardMap
              wards={wards}
              selectedWardId={displayedWard?.id}
              onSelectWard={handleSelectWardFromMap}
              compact={true}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span className="text-[11px]">
              Green = Normal • Yellow = Developing • Orange = High • Red = Critical
            </span>
            <button
              onClick={() => handleViewWardInGIS(displayedWard)}
              className="text-orange-600 font-bold hover:underline text-xs flex items-center gap-1"
            >
              <span>Inspect {displayedWard?.name?.split(':')[0] || 'Ward'} on GIS</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* E — PRIORITY WARD (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          {displayedWard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  PRIORITY WARD
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    displayedWard.riskLevel === 'Critical'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {displayedWard.riskLevel} Risk ({displayedWard.riskScore}/100)
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {displayedWard.name}
                </h3>
                <p className="text-xs font-semibold text-rose-600 mt-1">
                  Protection Gap: High ({displayedWard.protectionGap.toLocaleString()} Citizens Unserved)
                </p>
              </div>

              {/* WHY IT NEEDS ATTENTION */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Why It Needs Attention
                </span>
                <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                  {displayedWard.whyAttention}
                </p>
              </div>

              {/* RECOMMENDED ACTION */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                  Recommended Action
                </span>
                <p className="text-xs text-slate-900 font-semibold mt-1 leading-relaxed">
                  {displayedWard.recommendedAction ||
                    'Deploy additional cooling and water support during the peak-risk period.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              No priority ward identified. Select a ward on the map.
            </div>
          )}

          {/* VIEW WARD BUTTON */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Population: {displayedWard?.population?.toLocaleString() || 'N/A'}
            </span>
            <button
              onClick={() => handleViewWardInGIS(displayedWard)}
              className="px-4 py-2 rounded-2xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>View Ward</span>
              <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* F & G — CURRENT MUNICIPAL ACTION & ACTIVE MUNICIPAL ALERT     */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* F — CURRENT MUNICIPAL ACTION */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                  <ListChecks className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Current Municipal Action
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                RECOMMENDED
              </span>
            </div>

            {/* WHAT, WHERE, WHEN, WHY */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  WHAT:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  Deploy emergency water support & mobile misting tankers
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    WHERE:
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    Ward 21 (Kasba Peth) — Mandai & Transit Hubs
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    WHEN:
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    Peak-risk hours (11:30 AM – 4:30 PM)
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                  WHY:
                </span>
                <p className="font-semibold text-amber-950 mt-0.5">
                  High thermal stress (WBGT 31.8°C) + acute protection shortfall for vulnerable market vendors
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Status: Pending Verification</span>
            <button
              onClick={() => setActiveMunicipalPage('recommended-actions')}
              className="px-4 py-2 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>View Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* G — ACTIVE MUNICIPAL ALERT */}
        <div className="bg-gradient-to-br from-rose-50/60 via-white to-white rounded-3xl p-5 sm:p-6 border border-rose-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-900">
                  Active Municipal Alert
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  WARD 21 (KASBA PETH) — HIGH HUMAN HEAT RISK
                </h4>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                  High thermal stress + vulnerable exposure + protection shortfall in central pedestrian corridor.
                </p>
              </div>

              <div className="p-3.5 bg-white/95 rounded-2xl border border-rose-200 text-xs shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                  Recommended:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  Review cooling and water deployment. Expedite activation of shaded respite zones.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-rose-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Broadcast to Field Squads</span>
            <button
              onClick={() => setActiveMunicipalPage('municipal-alerts')}
              className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
