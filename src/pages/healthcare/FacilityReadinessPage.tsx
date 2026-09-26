import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  RefreshCw,
  HeartPulse,
  Save,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';

export const FacilityReadinessPage: React.FC = () => {
  const { summary, toggleChecklistItem, setActiveHealthcarePage } = useHealthcare();
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!summary) return null;

  const readiness = summary.facilityReadiness;
  const metrics = readiness.metrics;
  const isEntered = readiness.isEntered;

  const handleToggleCheck = async (id: string, currentVal: boolean) => {
    await toggleChecklistItem(id, !currentVal);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              OPERATIONAL PREPAREDNESS
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                isEntered
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {isEntered ? 'FACILITY ENTERED' : 'CAPACITY NOT YET PROVIDED'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Hospital Facility Readiness
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {readiness.facilityName} • {readiness.organization}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setActiveHealthcarePage('facility-profile')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200"
          >
            <Building className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit Facility Data</span>
          </button>

          <div
            className={`px-4 py-2 rounded-2xl border text-xs font-extrabold flex items-center gap-2 ${
              readiness.overallStatus === 'READY'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : readiness.overallStatus === 'NEEDS ATTENTION'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : readiness.overallStatus === 'NOT ENTERED'
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {readiness.overallStatus} ({readiness.overallScorePct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Unentered Banner */}
      {!isEntered && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold text-sm text-amber-950">Awaiting Facility Operational Entry</span>
              <p className="text-amber-800 text-xs mt-0.5">
                Hospital emergency inventory, ICU beds, ambulances, and staffing metrics have not been submitted for this shift.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveHealthcarePage('facility-profile')}
            className="px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-all shadow-xs"
          >
            Complete Facility Profile
          </button>
        </div>
      )}

      {/* 5 Core Readiness Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Emergency Beds */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Emergency Beds
            </span>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {metrics.emergencyCapacity.label}
            </h4>
            <div className="my-2">
              {metrics.emergencyCapacity.current !== null ? (
                <>
                  <span className="text-2xl font-black text-slate-900">{metrics.emergencyCapacity.current}</span>
                  <span className="text-xs font-bold text-slate-400">
                    {' '}
                    / {metrics.emergencyCapacity.total} {metrics.emergencyCapacity.unit}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-700">NOT ENTERED</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {metrics.emergencyCapacity.note}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">{metrics.emergencyCapacity.provenance}</span>
            <span
              className={`font-bold ${
                metrics.emergencyCapacity.status === 'READY'
                  ? 'text-emerald-700'
                  : metrics.emergencyCapacity.status === 'NOT ENTERED'
                  ? 'text-slate-500'
                  : 'text-amber-700'
              }`}
            >
              {metrics.emergencyCapacity.status}
            </span>
          </div>
        </div>

        {/* Metric 2: Staff Rostering */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Staff Rostering
            </span>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {metrics.staffReadiness.label}
            </h4>
            <div className="my-2">
              {metrics.staffReadiness.current !== null ? (
                <>
                  <span className="text-2xl font-black text-emerald-700">{metrics.staffReadiness.current}%</span>
                  <span className="text-xs font-bold text-slate-400"> Rostered</span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-700">NOT ENTERED</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {metrics.staffReadiness.note}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">{metrics.staffReadiness.provenance}</span>
            <span
              className={`font-bold ${
                metrics.staffReadiness.status === 'READY'
                  ? 'text-emerald-700'
                  : metrics.staffReadiness.status === 'NOT ENTERED'
                  ? 'text-slate-500'
                  : 'text-amber-700'
              }`}
            >
              {metrics.staffReadiness.status}
            </span>
          </div>
        </div>

        {/* Metric 3: Cold Saline / Ice Bays */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Cold Saline / Bays
            </span>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {metrics.heatCarePreparedness.label}
            </h4>
            <div className="my-2">
              {metrics.heatCarePreparedness.current !== null ? (
                <>
                  <span className="text-2xl font-black text-emerald-700">{metrics.heatCarePreparedness.current}</span>
                  <span className="text-xs font-bold text-slate-400"> {metrics.heatCarePreparedness.unit}</span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-700">NOT ENTERED</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {metrics.heatCarePreparedness.note}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">{metrics.heatCarePreparedness.provenance}</span>
            <span
              className={`font-bold ${
                metrics.heatCarePreparedness.status === 'READY'
                  ? 'text-emerald-700'
                  : metrics.heatCarePreparedness.status === 'NOT ENTERED'
                  ? 'text-slate-500'
                  : 'text-amber-700'
              }`}
            >
              {metrics.heatCarePreparedness.status}
            </span>
          </div>
        </div>

        {/* Metric 4: ICU Reserves */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              ICU Reserves
            </span>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {metrics.availableCapacity.label}
            </h4>
            <div className="my-2">
              {metrics.availableCapacity.current !== null ? (
                <>
                  <span className="text-2xl font-black text-amber-700">{metrics.availableCapacity.current}</span>
                  <span className="text-xs font-bold text-slate-400">
                    {' '}
                    / {metrics.availableCapacity.total} {metrics.availableCapacity.unit}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-700">NOT ENTERED</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {metrics.availableCapacity.note}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">{metrics.availableCapacity.provenance}</span>
            <span
              className={`font-bold ${
                metrics.availableCapacity.status === 'READY'
                  ? 'text-emerald-700'
                  : metrics.availableCapacity.status === 'NOT ENTERED'
                  ? 'text-slate-500'
                  : 'text-amber-700'
              }`}
            >
              {metrics.availableCapacity.status}
            </span>
          </div>
        </div>

        {/* Metric 5: 108 Ambulances */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              108 Ambulances
            </span>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {metrics.outreachReadiness.label}
            </h4>
            <div className="my-2">
              {metrics.outreachReadiness.current !== null ? (
                <>
                  <span className="text-2xl font-black text-emerald-700">{metrics.outreachReadiness.current}</span>
                  <span className="text-xs font-bold text-slate-400">
                    {' '}
                    / {metrics.outreachReadiness.total} {metrics.outreachReadiness.unit}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-amber-700">NOT ENTERED</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              {metrics.outreachReadiness.note}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">{metrics.outreachReadiness.provenance}</span>
            <span
              className={`font-bold ${
                metrics.outreachReadiness.status === 'READY'
                  ? 'text-emerald-700'
                  : metrics.outreachReadiness.status === 'NOT ENTERED'
                  ? 'text-slate-500'
                  : 'text-amber-700'
              }`}
            >
              {metrics.outreachReadiness.status}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Protocol Verification Checklist */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              OPERATIONAL PROTOCOL VERIFICATION
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Heatwave Resuscitation & Facility Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized clinical supervisors can toggle items in real-time. Changes automatically recalibrate preparedness scores.
            </p>
          </div>

          <button
            onClick={() => setActiveHealthcarePage('facility-profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold self-start sm:self-auto transition-all"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Update All Facility Resources</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {readiness.checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleCheck(item.id, item.isReady)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                item.isReady
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  item.isReady
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-300'
                }`}
              >
                {item.isReady && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                  {item.category}
                </span>
                <p className="text-xs font-semibold leading-relaxed">{item.item}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
