import React from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import {
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Shield,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const AdaptiveResponsePage: React.FC = () => {
  const { adaptiveRecommendations, profile, location, setActivePage } = useCitizen();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Adaptive Response Protocols
            </h1>
            <span className="apple-badge bg-orange-100 text-orange-800">
              Citizen Action Guidelines
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standard 4-part action plans answering WHAT, WHERE, WHEN, and WHY for climate safety.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700">
          Vulnerability Focus: <strong className="text-slate-900">{profile.profileLabel}</strong>
        </div>
      </div>

      {/* Recommendations List with clear 4-Part Structure */}
      <div className="space-y-4">
        {adaptiveRecommendations.map((rec) => (
          <div
            key={rec.id}
            className={`apple-card p-5 sm:p-6 border-l-4 transition-all ${
              rec.priority === 'Immediate'
                ? 'border-l-red-500 bg-red-50/15'
                : rec.priority === 'Important'
                ? 'border-l-orange-500 bg-orange-50/15'
                : 'border-l-blue-500 bg-blue-50/15'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                    rec.priority === 'Immediate'
                      ? 'bg-red-600 text-white'
                      : rec.priority === 'Important'
                      ? 'bg-orange-500 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {rec.priority} Action
                </span>
                <span className="apple-badge bg-slate-100 text-slate-700 text-[10px]">
                  {rec.category}
                </span>
              </div>
            </div>

            {/* WHAT, WHERE, WHEN, WHY 4-column card */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {/* WHAT */}
              <div className="p-3 bg-white/90 rounded-xl border border-black/5 space-y-1">
                <span className="font-extrabold text-orange-600 uppercase text-[10px] tracking-wider block">
                  WHAT: What should I do?
                </span>
                <p className="text-slate-900 font-bold leading-relaxed">{rec.what}</p>
              </div>

              {/* WHERE */}
              <div className="p-3 bg-white/90 rounded-xl border border-black/5 space-y-1">
                <span className="font-extrabold text-blue-600 uppercase text-[10px] tracking-wider block">
                  WHERE: Where should I do it?
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">{rec.where}</p>
              </div>

              {/* WHEN */}
              <div className="p-3 bg-white/90 rounded-xl border border-black/5 space-y-1">
                <span className="font-extrabold text-amber-600 uppercase text-[10px] tracking-wider block">
                  WHEN: When should I do it?
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">{rec.when}</p>
              </div>

              {/* WHY */}
              <div className="p-3 bg-white/90 rounded-xl border border-black/5 space-y-1">
                <span className="font-extrabold text-purple-600 uppercase text-[10px] tracking-wider block">
                  WHY: Why is this recommended?
                </span>
                <p className="text-slate-700 leading-relaxed text-[11px]">{rec.why}</p>
              </div>
            </div>

            {/* Action button if present */}
            {rec.actionButtonText && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    if (rec.actionRoute) setActivePage(rec.actionRoute as any);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <span>{rec.actionButtonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
