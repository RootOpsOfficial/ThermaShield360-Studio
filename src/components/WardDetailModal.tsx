import React from 'react';
import { MunicipalWardData } from '../types/municipal.js';
import {
  X,
  Building,
  Users,
  Thermometer,
  ShieldAlert,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  Trees,
  Cross,
} from 'lucide-react';

interface WardDetailModalProps {
  ward: MunicipalWardData | null;
  isOpen: boolean;
  onClose: () => void;
  onActionClick?: (ward: MunicipalWardData) => void;
}

export const WardDetailModal: React.FC<WardDetailModalProps> = ({
  ward,
  isOpen,
  onClose,
  onActionClick,
}) => {
  if (!isOpen || !ward) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full border border-orange-200">
                {ward.zone}
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  ward.riskLevel === 'Critical'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : ward.riskLevel === 'High'
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : ward.riskLevel === 'Developing'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {ward.riskLevel} Risk (Score {ward.riskScore}/100)
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{ward.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Top Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Population</span>
              <p className="text-lg font-black text-slate-800 mt-0.5">{ward.population.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">Total residents</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Vulnerable</span>
              <p className="text-lg font-black text-rose-600 mt-0.5">{ward.vulnerableCount.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">Seniors & laborers</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Thermal Load</span>
              <p className="text-lg font-black text-orange-600 mt-0.5">{ward.wbgt}°C</p>
              <span className="text-[10px] text-slate-500">WBGT Heat Index</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Protection Gap</span>
              <p className="text-lg font-black text-slate-900 mt-0.5">{ward.protectionGap.toLocaleString()}</p>
              <span className="text-[10px] text-slate-500">{ward.fulfillmentPct}% capacity</span>
            </div>
          </div>

          {/* Section: Why This Ward Needs Attention */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Root Cause & Exposure Vulnerability</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {ward.whyAttention}
            </p>
            <div className="mt-2 text-[11px] text-amber-900 font-medium">
              Exposed group: <span className="font-bold">{ward.vulnerableExposure}</span>
            </div>
          </div>

          {/* Section: Protection Demand vs Capacity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Protection Capacity vs Demand</span>
              <span className="text-slate-500 font-medium">
                {ward.capacity.toLocaleString()} served / {ward.demand.toLocaleString()} expected
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ward.fulfillmentPct)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Covered: {ward.capacity.toLocaleString()}
              </span>
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" /> Shortfall: {ward.protectionGap.toLocaleString()} citizens
              </span>
            </div>
          </div>

          {/* Recommended Municipal Action */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
              Mandated Heat Action Intervention
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              {ward.recommendedAction}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              if (onActionClick) onActionClick(ward);
            }}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            Deploy Intervention for {ward.name.split(':')[0]}
          </button>
        </div>
      </div>
    </div>
  );
};
