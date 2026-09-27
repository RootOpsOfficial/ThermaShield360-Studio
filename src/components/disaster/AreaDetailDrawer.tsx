import React from 'react';
import { DisasterAffectedArea } from '../../types/disaster.js';
import {
  X,
  Flame,
  ShieldAlert,
  HeartPulse,
  Scale,
  Activity,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface AreaDetailDrawerProps {
  area: DisasterAffectedArea | null;
  onClose: () => void;
  onViewOnMap?: (area: DisasterAffectedArea) => void;
}

export const AreaDetailDrawer: React.FC<AreaDetailDrawerProps> = ({ area, onClose, onViewOnMap }) => {
  if (!area) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Developing':
        return 'bg-amber-400 text-amber-950';
      default:
        return 'bg-emerald-500 text-white';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-red-50/50 to-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getSeverityBadge(
                area.heatRisk
              )}`}
            >
              {area.heatRisk} SEVERITY
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {area.zone}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 leading-tight">
            {area.name}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {area.district} • High Thermal Vulnerability Zone
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scroll Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* 1. Heat Status */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-red-600" />
              <span>1. HEAT STATUS</span>
            </div>
            <span className="text-[10px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
              {area.trend}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">Air Temp</span>
              <span className="text-lg font-black text-slate-900">{area.temperatureC}°C</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">Wet Bulb</span>
              <span className="text-lg font-black text-orange-600">{area.wbgtC}°C</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] text-slate-400 font-semibold block">Heat Index</span>
              <span className="text-lg font-black text-red-600">{area.heatIndexC}°C</span>
            </div>
          </div>
        </div>

        {/* 2. Forecast Confidence */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>2. FORECAST CONFIDENCE</span>
            </div>
            <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
              {area.forecastConfidence} Confidence
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            Meso-scale thermal convergence corroborated across IMD Numerical Weather Prediction & high-resolution satellite land surface temperature scans.
          </p>
        </div>

        {/* 3. Health Impact */}
        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-rose-900 uppercase tracking-wider">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>3. HEALTH IMPACT</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
              MODELLED / ESTIMATED
            </span>
          </div>

          <div className="space-y-2 mt-3 text-xs">
            <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-slate-600 font-medium">Hospitalization Risk Surge</span>
              <span className="font-extrabold text-rose-700">
                {area.healthImpact.hospitalizationRiskEstimate}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-slate-600 font-medium">Mortality-Risk Signal</span>
              <span className="font-extrabold text-red-700">
                {area.healthImpact.mortalityRiskSignal} Alert
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-slate-600 font-medium">Vulnerable Citizens At Risk</span>
              <span className="font-bold text-slate-900">
                {area.healthImpact.vulnerablePopulationCount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-rose-100">
              <span className="text-slate-600 font-medium">Estimated Daily Excess Admissions</span>
              <span className="font-bold text-red-600">
                ~{area.healthImpact.estimatedDailyAdmissions} admissions/day
              </span>
            </div>
          </div>
        </div>

        {/* 4. Protection Shortfall */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider">
              <Scale className="w-4 h-4 text-amber-700" />
              <span>4. PROTECTION SHORTFALL</span>
            </div>
            <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
              {area.protectionShortfall.shortfallPercentage}% Deficit
            </span>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-amber-100">
              <span className="text-slate-600 font-medium">Cooling Shelters Operational</span>
              <span className="font-extrabold text-slate-800">
                {area.protectionShortfall.sheltersOperational} / {area.protectionShortfall.sheltersRequired} required
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-xl border border-amber-100">
              <span className="text-slate-600 font-medium">Hydration Shortfall Gap</span>
              <span className="font-extrabold text-amber-700">
                -{area.protectionShortfall.hydrationDeficitLitres.toLocaleString('en-IN')} L/day
              </span>
            </div>
          </div>
        </div>

        {/* 5. Current Response */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>5. CURRENT RESPONSE</span>
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              {area.currentResponse.status}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-1">
            {area.currentResponse.actionTitle}
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lead: {area.currentResponse.responsibleAuthority}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Last Field Update: {area.currentResponse.lastUpdate}
          </span>
        </div>

        {/* 6. Coordination Required */}
        <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
          <div className="flex items-center gap-1.5 text-xs font-black text-red-950 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4 text-red-700" />
            <span>6. COORDINATION REQUIRED</span>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-red-100">
            {area.coordinationRequired}
          </p>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2.5">
        <button
          onClick={onClose}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          Close
        </button>

        {onViewOnMap && (
          <button
            onClick={() => {
              onViewOnMap(area);
              onClose();
            }}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-orange-400" />
            <span>View on Map</span>
          </button>
        )}

        <button
          onClick={() => {
            alert(`Escalation directive triggered for ${area.name}. EOC Notification dispatched to ${area.currentResponse.responsibleAuthority}.`);
            onClose();
          }}
          className="flex-1 py-2.5 px-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-md shadow-red-700/20 flex items-center justify-center gap-1.5 transition-all"
        >
          <span>Issue Escalation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
