import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import { PuneWardMap } from '../../components/PuneWardMap.js';
import { WardDetailModal } from '../../components/WardDetailModal.js';
import {
  Flame,
  Thermometer,
  Users,
  ArrowRight,
  Maximize2,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const WardRiskMapPage: React.FC = () => {
  const { wards, selectedWard, setSelectedWard, setActiveMunicipalPage } = useMunicipal();
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const activeWard = selectedWard || (wards.length > 0 ? wards[0] : null);

  const filteredWards = filterRisk === 'All'
    ? wards
    : wards.filter((w) => w.riskLevel === filterRisk);

  if (wards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-500 text-sm gap-3">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-semibold text-slate-600">Loading Ward GIS Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
            WHERE IS THE PROBLEM?
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Ward Risk Map
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Spatial thermal stress and protection deficit analysis across Maharashtra & National Municipal Corporations
          </p>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Critical', 'High', 'Developing', 'Normal'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterRisk(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterRisk === lvl
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Clean Full-Page Map (8 Cols) + Decision Side Panel (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Full Vector GIS Map */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Municipal Ward Boundaries & Heat Intensity GIS
              </h2>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              Showing {filteredWards.length} of {wards.length} Wards
            </span>
          </div>

          <PuneWardMap
            wards={filteredWards}
            selectedWardId={activeWard?.id}
            onSelectWard={(ward) => setSelectedWard(ward)}
            compact={false}
          />

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Click any ward polygon to inspect immediate decision indicators.</span>
            <span className="text-[11px] font-semibold text-emerald-600">IMD AWS Connected</span>
          </div>
        </div>

        {/* CLEAN DECISION SIDE PANEL: Only the 6 Essential Indicators */}
        <div className="lg:col-span-4 space-y-4">
          {activeWard ? (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  SELECTED WARD
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                    activeWard.riskLevel === 'Critical'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : activeWard.riskLevel === 'High'
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : activeWard.riskLevel === 'Developing'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {activeWard.riskLevel} Risk
                </span>
              </div>

              {/* 1. WARD NAME */}
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                  {activeWard.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {activeWard.zone} • Population: {activeWard.population.toLocaleString()}
                </p>
              </div>

              {/* 2. HEAT RISK */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Heat Risk Level</span>
                    <p className="text-sm font-black text-slate-800">{activeWard.riskLevel} ({activeWard.riskScore}/100)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Temp</span>
                  <p className="text-sm font-bold text-slate-800">{activeWard.temp}°C</p>
                </div>
              </div>

              {/* 3. THERMAL STRESS */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="w-4 h-4 text-orange-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Thermal Stress</span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  {activeWard.thermalStress}
                </p>
              </div>

              {/* 4. VULNERABLE EXPOSURE */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Vulnerable Exposure</span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  {activeWard.vulnerableExposure}
                </p>
              </div>

              {/* 5. PROTECTION GAP */}
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-700" />
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Protection Gap</span>
                  </div>
                  <span className="text-xs font-extrabold text-rose-700">
                    {activeWard.protectionGap.toLocaleString()} Citizens
                  </span>
                </div>
                <div className="w-full bg-rose-200/60 rounded-full h-2 mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${activeWard.fulfillmentPct}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                  <span>Covered: {activeWard.capacity.toLocaleString()}</span>
                  <span>Demand: {activeWard.demand.toLocaleString()}</span>
                </div>
              </div>

              {/* 6. RECOMMENDED ACTION */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                  Recommended Action
                </span>
                <p className="text-xs font-semibold text-slate-900 mt-1 leading-snug">
                  {activeWard.recommendedAction}
                </p>
              </div>

              {/* Action Buttons: Progressive Disclosure + Dispatch */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setIsDetailOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>View Additional Details</span>
                </button>
                <button
                  onClick={() => setActiveMunicipalPage('recommended-actions')}
                  className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Dispatch Interventions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 text-center text-slate-400 text-xs">
              Select a ward on the map to inspect indicators.
            </div>
          )}
        </div>
      </div>

      {/* Progressive Disclosure Modal for Additional Ward Details */}
      <WardDetailModal
        ward={activeWard}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onActionClick={() => {
          setIsDetailOpen(false);
          setActiveMunicipalPage('recommended-actions');
        }}
      />
    </div>
  );
};
