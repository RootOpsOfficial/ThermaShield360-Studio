import React from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterRegionSelector } from '../../components/disaster/DisasterRegionSelector.js';
import { ActiveLocationSpotlightBar } from '../../components/disaster/ActiveLocationSpotlightBar.js';
import {
  HeartPulse,
  AlertTriangle,
  TrendingUp,
  Activity,
  Users,
  ShieldCheck,
  FileText,
  Building,
  Info,
  Radio,
  Check,
} from 'lucide-react';

export const DisasterHealthImpactPage: React.FC = () => {
  const { selectedRegion, summary, affectedAreas, selectedArea, selectArea } = useDisaster();

  // High impact areas sorted by hospitalization surge
  const highImpactAreas = [...affectedAreas].sort(
    (a, b) => b.healthImpact.estimatedDailyAdmissions - a.healthImpact.estimatedDailyAdmissions
  );

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 0. Location Selector Bar (Phase 2) */}
      <DisasterRegionSelector />

      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
              EPIDEMIOLOGICAL SURGE FORECAST
            </span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200">
              MODELLED / ESTIMATED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Health Impact — {selectedRegion.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            What human health impact may develop? Morbidity estimates, mortality-risk signals & catchment distributions
          </p>
        </div>

        {/* Disclaimer Notice Pill (Phase 10) */}
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2 max-w-md">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-900 font-medium leading-tight">
            Statistical epidemiological projection based on ambient wet-bulb thermal load. Not individual clinical records or patient identifiers.
          </p>
        </div>
      </div>

      {/* Active Location Spotlight Bar */}
      <ActiveLocationSpotlightBar />

      {/* 1. Core Health Metrics (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hospitalization Risk */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400">
              HOSPITALIZATION RISK
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
              MODELLED
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-rose-700">
            {summary.healthImpact.hospitalizationSurgeEstimate.split(' ')[0]}
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Expected casualty surge above seasonal baseline
          </p>
        </div>

        {/* Mortality-Risk Signal */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400">
              MORTALITY-RISK SIGNAL
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-600 text-white">
              HIGH ALERT
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-red-600">
            {summary.healthImpact.mortalityRiskSignal}
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Signal elevated for outdoor labor & frail elderly
          </p>
        </div>

        {/* Health Risk Level */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400">
              HEALTH RISK POSTURE
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-amber-950">
              SEVERE
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-slate-900">
            {summary.regionalHeatStatus.tier.split(' ')[0]}
          </span>
          <p className="text-xs text-red-600 font-bold mt-1">
            WBGT 32°C hyperthermia threshold crossed
          </p>
        </div>

        {/* Trend */}
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-slate-400">
              ADMISSION TREND
            </span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-100 text-red-700">
              RAPID
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-red-700">
            {summary.healthImpact.trend}
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            ~{summary.healthImpact.estimatedDailyExcessAdmissions} excess emergency admissions/day
          </p>
        </div>
      </div>

      {/* 2. High-Impact Areas Directory */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
              HIGH-IMPACT HOSPITAL CATCHMENTS & WARDS — {selectedRegion.name}
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Areas ranked by estimated heatstroke hospitalization surge and vulnerable populations
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            MODELLED / ESTIMATED PROJECTIONS
          </span>
        </div>

        <div className="space-y-3">
          {highImpactAreas.map((area, index) => {
            const isCurrentActive = selectedArea?.id === area.id;
            return (
              <div
                key={area.id}
                onClick={() => selectArea(area)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCurrentActive
                    ? 'bg-rose-50/80 border-rose-400 shadow-sm ring-1 ring-rose-400'
                    : 'border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                      isCurrentActive
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        {area.name}
                      </h4>
                      {isCurrentActive && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 shadow-2xs">
                          <Radio className="w-2.5 h-2.5 animate-pulse" /> Active Choice
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {area.district} • {area.zone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Hospitalization Surge</span>
                      <span className="font-black text-rose-700">
                        {area.healthImpact.hospitalizationRiskEstimate}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Mortality Signal</span>
                      <span className={`font-black ${
                        area.healthImpact.mortalityRiskSignal === 'Critical' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {area.healthImpact.mortalityRiskSignal}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Excess Admissions</span>
                      <span className="font-black text-slate-900">
                        ~{area.healthImpact.estimatedDailyAdmissions}/d
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Vulnerable Pop.</span>
                      <span className="font-bold text-slate-700">
                        {area.healthImpact.vulnerablePopulationCount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectArea(area);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      isCurrentActive
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCurrentActive ? 'Active Location' : 'Select Location'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
