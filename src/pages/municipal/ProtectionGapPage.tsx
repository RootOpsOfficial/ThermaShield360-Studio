import React from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import {
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Building,
  CheckCircle2,
} from 'lucide-react';

export const ProtectionGapPage: React.FC = () => {
  const { summary, wards, setActiveMunicipalPage, setSelectedWard } = useMunicipal();

  if (!summary || wards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-500 text-sm gap-3">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-semibold text-slate-600">Calculating Protection Gap Analysis...</p>
      </div>
    );
  }

  // Sort wards by protection gap (highest gap first)
  const sortedWards = [...wards].sort((a, b) => b.protectionGap - a.protectionGap);
  const maxDemand = Math.max(...wards.map((w) => w.demand), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            CORE MUNICIPAL DECISION METRIC
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Protection Gap Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Where heat exposure exceeds available cooling, water, and emergency shade infrastructure
          </p>
        </div>

        <button
          onClick={() => setActiveMunicipalPage('recommended-actions')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <span>Intervention Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CORE THERMASHIELD FORMULA BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1D1D1F] to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-black/10">
        <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-2">
          THERMASHIELD CAPACITY EQUATION
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm md:text-base font-black tracking-tight">
          <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
            HEAT RISK
          </div>
          <span className="text-orange-400 font-black text-lg">+</span>
          <div className="bg-blue-500/20 px-3.5 py-2 rounded-xl border border-blue-400/30 text-blue-200">
            EXPECTED PROTECTION NEED
          </div>
          <span className="text-orange-400 font-black text-lg">−</span>
          <div className="bg-emerald-500/20 px-3.5 py-2 rounded-xl border border-emerald-400/30 text-emerald-200">
            AVAILABLE PROTECTION
          </div>
          <span className="text-orange-400 font-black text-lg">=</span>
          <div className="bg-rose-500/30 px-4 py-2 rounded-xl border border-rose-400/50 text-rose-300 font-extrabold shadow-inner">
            PROTECTION GAP
          </div>
        </div>
        <p className="text-xs text-slate-300 mt-3 font-normal leading-relaxed">
          The protection gap represents the exact citizen deficit where heat stress outstrips the current intake of cooling shelters, drinking water kiosks, and shaded canopies.
        </p>
      </div>

      {/* CITYWIDE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Citywide Demand */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Total Protection Demand
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">
              {summary.totalDemand.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">citizens in need</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Calculated from population density & outdoor exposure windows.
          </p>
        </div>

        {/* Citywide Available Capacity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Available Protection Capacity
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">
              {summary.totalCapacity.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-600">currently served</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Combined capacity of civic shelters, misting zones & water points.
          </p>
        </div>

        {/* Citywide Protection Gap */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
            Total Protection Gap
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-rose-600">
              {summary.totalProtectionGap.toLocaleString()}
            </span>
            <span className="text-xs font-extrabold text-rose-700">Citizen Shortfall</span>
          </div>
          <p className="text-[11px] text-rose-900/70 mt-1">
            Immediate deficit requiring operational field deployments.
          </p>
        </div>
      </div>

      {/* HIGHEST-GAP WARDS: Simple Visual Comparison */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ward Protection Gap Comparison
            </h2>
            <p className="text-xs text-slate-500">
              Visual comparison of Demand, Available Capacity, and Net Gap across all monitored wards
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Ordered by Highest Deficit
          </span>
        </div>

        {/* WARD COMPARISON LIST */}
        <div className="space-y-5 pt-1">
          {sortedWards.map((w, idx) => {
            const demandPct = Math.round((w.demand / maxDemand) * 100);
            const capacityPct = Math.round((w.capacity / maxDemand) * 100);
            const gapPct = Math.round((w.protectionGap / maxDemand) * 100);

            const isHighest = idx === 0;

            return (
              <div
                key={w.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isHighest
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-200/80 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 w-5">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {w.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {w.zone} • Heat Risk: <span className="font-bold text-slate-700">{w.riskLevel}</span> ({w.riskScore}/100)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-rose-700 uppercase">Net Gap</span>
                      <p className="text-sm font-black text-rose-600">
                        {w.protectionGap.toLocaleString()} Citizens
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedWard(w);
                        setActiveMunicipalPage('recommended-actions');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                    >
                      Intervene
                    </button>
                  </div>
                </div>

                {/* SIMPLE VISUAL COMPARISON BARS */}
                <div className="space-y-2 text-xs">
                  {/* DEMAND BAR */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-blue-700 uppercase tracking-wide">
                        Demand
                      </span>
                      <span className="font-bold text-slate-800">
                        {w.demand.toLocaleString()} citizens
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${demandPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* CAPACITY BAR */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-emerald-700 uppercase tracking-wide">
                        Capacity
                      </span>
                      <span className="font-bold text-slate-800">
                        {w.capacity.toLocaleString()} citizens
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${capacityPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* GAP BAR */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-rose-700 uppercase tracking-wide">
                        Gap
                      </span>
                      <span className="font-extrabold text-rose-600">
                        {w.protectionGap.toLocaleString()} unserved
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${gapPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Short action summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-1">
                  <span>
                    <strong className="text-slate-800">Action:</strong> {w.recommendedAction}
                  </span>
                  <span className="text-slate-400 shrink-0">
                    Fulfillment: {w.fulfillmentPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
