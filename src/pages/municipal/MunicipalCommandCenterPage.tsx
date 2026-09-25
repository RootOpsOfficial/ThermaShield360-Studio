import React from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import { PuneWardMap } from '../../components/PuneWardMap.js';
import {
  Flame,
  AlertTriangle,
  ShieldAlert,
  ListChecks,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Bell,
  Sparkles,
  MapPin,
  Calendar,
  Building,
} from 'lucide-react';

export const MunicipalCommandCenterPage: React.FC = () => {
  const { summary, wards, setSelectedWard, setActiveMunicipalPage } = useMunicipal();

  if (!summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Municipal Command Center data...</span>
        </div>
      </div>
    );
  }

  const priorityWard = summary.priorityWard;

  const handleSelectWard = (ward: typeof priorityWard) => {
    setSelectedWard(ward);
    setActiveMunicipalPage('ward-risk-map');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Section */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
              MUNICIPAL CORPORATION WORKSPACE
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {summary.dataStatus}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-2">
            <span>{summary.cityName}</span>
            <span>•</span>
            <span>{summary.department}</span>
            <span>•</span>
            <span className="text-slate-400">{summary.dateTime}</span>
          </p>
        </div>

        {/* Quick Shift / Action Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveMunicipalPage('ward-risk-map')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
          >
            <span>Full Ward GIS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Important Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CURRENT HEAT RISK */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="uppercase tracking-wider">Current Heat Risk</span>
            <span className="p-1.5 rounded-xl bg-orange-50 text-orange-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-orange-600 tracking-tight">
                {summary.currentHeatRisk}
              </span>
              <span className="text-xs font-bold text-slate-400">Score {summary.currentRiskScore}/100</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Elevated thermal strain across 3 central urban corridors.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">City Thermal Status</span>
            <span className="font-bold text-orange-600">Warning Active</span>
          </div>
        </div>

        {/* Card 2: HIGH-RISK WARDS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="uppercase tracking-wider">High-Risk Wards</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 tracking-tight">
                {summary.highRiskWardsCount} <span className="text-lg font-bold text-slate-400">/ {summary.totalWardsCount}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Kasba Peth, Hadapsar, and Swargate exceed danger thresholds.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Needs Attention</span>
            <span className="font-bold text-rose-600">Immediate Action</span>
          </div>
        </div>

        {/* Card 3: PROTECTION GAP */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="uppercase tracking-wider">Protection Gap</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {summary.totalProtectionGap.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-rose-600">Shortfall</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Citizens currently unserved by existing cooling shelters & kiosks.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Citywide Adequacy</span>
            <span className="font-bold text-amber-700">46% Fulfilled</span>
          </div>
        </div>

        {/* Card 4: PRIORITY ACTION */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="uppercase tracking-wider">Priority Action</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
              <ListChecks className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
              {summary.priorityAction}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              High solar load expected between 11:30 AM – 4:30 PM.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Dispatch Status</span>
            <span className="font-bold text-blue-600">Pending Review</span>
          </div>
        </div>
      </div>

      {/* 5-Day Outlook Strip */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              5-Day Municipal Heat-Risk Outlook
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">IMD Synoptic Calibrated</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {summary.fiveDayOutlook.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                item.riskLevel === 'Critical'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-950'
                  : item.riskLevel === 'High'
                  ? 'bg-orange-50/60 border-orange-200 text-orange-950'
                  : item.riskLevel === 'Developing'
                  ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-slate-500">{item.day}</span>
              <span className="text-lg font-black tracking-tight my-0.5">{item.tempMax}°C</span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 ${
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
            </div>
          ))}
        </div>
      </div>

      {/* Main Home Content: 3 Important Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AREA 1 — WARD RISK MAP PREVIEW (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
                  AREA 1 • GEOGRAPHIC OVERVIEW
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Ward Heat Risk Map Preview
                </h3>
              </div>
              <button
                onClick={() => setActiveMunicipalPage('ward-risk-map')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all"
              >
                <span>View Full Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Map Preview */}
            <PuneWardMap
              wards={wards}
              selectedWardId={priorityWard?.id}
              onSelectWard={handleSelectWard}
              compact={true}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>6 Municipal Wards monitored under active Heat Action Plan</span>
            <button
              onClick={() => setActiveMunicipalPage('ward-risk-map')}
              className="text-orange-600 font-bold hover:underline"
            >
              View Ward Risk Map →
            </button>
          </div>
        </div>

        {/* AREA 2 & AREA 3 (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* AREA 2 — PRIORITY WARD */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                AREA 2 • PRIORITY WARD
              </span>
              <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-full">
                {priorityWard.riskLevel} Risk
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {priorityWard.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-3">
              {priorityWard.zone} • Population: {priorityWard.population.toLocaleString()}
            </p>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-3 text-xs">
              <div>
                <p className="text-slate-400 text-[10px]">Thermal Stress</p>
                <p className="font-bold text-slate-800">{priorityWard.thermalStress.split(' ')[1]} ({priorityWard.temp}°C)</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">Protection Gap</p>
                <p className="font-bold text-rose-600">{priorityWard.protectionGap.toLocaleString()} Citizens</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Why This Ward Needs Attention
                </h4>
                <p className="text-xs text-slate-700 font-medium mt-0.5 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50">
                  {priorityWard.whyAttention}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Recommended Action
                </h4>
                <p className="text-xs text-slate-900 font-semibold mt-0.5 leading-relaxed bg-blue-50/50 p-2.5 rounded-xl border border-blue-200/50">
                  {priorityWard.recommendedAction}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedWard(priorityWard);
                  setActiveMunicipalPage('ward-risk-map');
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Inspect on GIS Map
              </button>
              <button
                onClick={() => setActiveMunicipalPage('recommended-actions')}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>View Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AREA 3 — CURRENT MUNICIPAL ALERT */}
          <div className="bg-gradient-to-br from-rose-500/10 via-red-500/5 to-white rounded-3xl p-5 sm:p-6 border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                AREA 3 • CURRENT MUNICIPAL ALERT
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                ACTIVE BROADCAST
              </span>
            </div>

            <h4 className="text-base font-extrabold text-slate-900 mt-2">
              {summary.currentAlert.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {summary.currentAlert.subtitle}
            </p>

            <div className="mt-3 p-3 bg-white/80 rounded-xl border border-rose-200/60 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                Recommended Municipal Action:
              </p>
              <p className="font-semibold text-slate-800 mt-0.5">
                {summary.currentAlert.recommendation}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setActiveMunicipalPage('municipal-alerts')}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
              >
                <span>Open Alert Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveMunicipalPage('recommended-actions')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs"
              >
                Deploy Teams
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
