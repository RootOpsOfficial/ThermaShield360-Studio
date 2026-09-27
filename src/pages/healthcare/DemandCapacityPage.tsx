import React from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  Scale,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Building,
  Clock,
  Info,
  Crosshair,
  RefreshCw,
} from 'lucide-react';

export const DemandCapacityPage: React.FC = () => {
  const {
    summary,
    setActiveHealthcarePage,
    currentLocation,
    detectUserGpsLocation,
    isLocatingGps,
  } = useHealthcare();

  if (!summary) return null;

  const demandCapacity = summary.demandCapacity;
  const isEntered = demandCapacity.isCapacityEntered && demandCapacity.availableCapacityBeds !== null;
  const projections = demandCapacity.projected3DayDemand || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              CAPACITY BALANCING & SURGE
            </span>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              📍 Driven by: {currentLocation.shortName}
            </span>
            {currentLocation.isUserLocation && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                User GPS
              </span>
            )}
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                isEntered
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isEntered ? 'FACILITY ENTERED DATA' : 'CAPACITY NOT YET PROVIDED'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Expected Heat Demand vs Available Capacity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Real-time balance of anticipated emergency presentations for {currentLocation.shortName} against operational heatstroke beds and clinical capacity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={detectUserGpsLocation}
            disabled={isLocatingGps}
            title="Drive health demand from current GPS location"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 cursor-pointer disabled:opacity-50"
          >
            {isLocatingGps ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{isLocatingGps ? 'Locating...' : 'My GPS'}</span>
          </button>

          <button
            onClick={() => setActiveHealthcarePage('facility-profile')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200"
          >
            <Building className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit Facility Data</span>
          </button>

          <button
            onClick={() => setActiveHealthcarePage('facility-readiness')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Facility Readiness</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Unentered Capacity Warning Banner */}
      {!isEntered && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sm text-amber-950">CAPACITY NOT YET PROVIDED</span>
              <p className="text-amber-800 text-xs mt-0.5">
                Hospital operational beds have not been entered by authorized personnel. Expected demand is modelled from synoptic heat risk; available capacity requires facility entry.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveHealthcarePage('facility-profile')}
            className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-all shadow-xs"
          >
            Enter Facility Capacity Now
          </button>
        </div>
      )}

      {/* 3 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CARD 1: EXPECTED PATIENT DEMAND */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
              <span>Expected Patient Demand</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="my-2">
              <span className="text-3xl font-black text-blue-700 tracking-tight">
                {demandCapacity.expectedDemandPatients}
              </span>
              <span className="text-xs font-bold text-slate-400"> patients / day</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Surge Status: <span className="font-bold text-blue-800">{demandCapacity.expectedDemandLevel}</span>
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Source</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              MODELLED
            </span>
          </div>
        </div>

        {/* CARD 2: AVAILABLE EMERGENCY BEDS */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
              <span>Available Emergency Beds</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="my-2">
              {isEntered ? (
                <>
                  <span className="text-3xl font-black text-emerald-700 tracking-tight">
                    {demandCapacity.availableCapacityBeds}
                  </span>
                  <span className="text-xs font-bold text-slate-400"> beds</span>
                </>
              ) : (
                <span className="text-xl font-bold text-amber-700 tracking-tight block">
                  CAPACITY NOT YET PROVIDED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isEntered
                ? `Updated ${demandCapacity.lastCapacityUpdate || 'Today'} by ${demandCapacity.updatedBy || 'Staff'}`
                : 'Awaiting entry from hospital clinical roster'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Source</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md border ${
                isEntered
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
            >
              {demandCapacity.capacityProvenance}
            </span>
          </div>
        </div>

        {/* CARD 3: CAPACITY GAP */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
              <span>Capacity Gap</span>
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <Scale className="w-4 h-4" />
              </span>
            </div>
            <div className="my-2">
              {demandCapacity.capacityGapPatients !== null ? (
                <>
                  <span
                    className={`text-3xl font-black tracking-tight ${
                      demandCapacity.capacityGapPatients > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {demandCapacity.capacityGapPatients > 0
                      ? `-${demandCapacity.capacityGapPatients}`
                      : 'Balanced'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {demandCapacity.capacityGapPatients > 0 ? ' patient deficit' : ''}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-amber-700 tracking-tight block">
                  CAPACITY NOT YET PROVIDED
                </span>
              )}
            </div>
            <p
              className={`text-xs font-bold ${
                demandCapacity.capacityGapPatients !== null && demandCapacity.capacityGapPatients > 0
                  ? 'text-rose-700'
                  : isEntered
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {demandCapacity.capacityGapStatus}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Calculation</span>
            <span className="font-semibold text-slate-600">Demand vs Capacity</span>
          </div>
        </div>
      </div>

      {/* 5-Day Forward Gap Simulation */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              FORWARD TRAJECTORY
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              5-Day Demand vs Capacity Projection
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Modelled Demand vs Facility Capacity</span>
        </div>

        <div className="space-y-4">
          {projections.map((p, idx) => {
            const demandPct = Math.min(100, Math.round((p.demand / 150) * 100));
            const hasCapacity = p.capacity !== null;
            const capacityPct = hasCapacity ? Math.min(100, Math.round(((p.capacity as number) / 150) * 100)) : 0;
            const hasDeficit = p.gap !== null && p.gap > 0;

            return (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <span className="text-xs font-bold text-slate-800">{p.day}</span>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-blue-700 font-bold">Demand: {p.demand} patients</span>
                    <span className="text-emerald-700 font-bold">
                      Capacity: {hasCapacity ? `${p.capacity} beds` : 'Not yet provided'}
                    </span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                        !hasCapacity
                          ? 'bg-amber-100 text-amber-800'
                          : hasDeficit
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {!hasCapacity
                        ? 'CAPACITY NOT YET PROVIDED'
                        : hasDeficit
                        ? `Deficit: -${p.gap}`
                        : 'Balanced'}
                    </span>
                  </div>
                </div>

                {/* Overlaid Bars */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span className="w-16">Demand:</span>
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${demandPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span className="w-16">Capacity:</span>
                    <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${hasCapacity ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        style={{ width: `${capacityPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
