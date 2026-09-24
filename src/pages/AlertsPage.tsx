import React from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import {
  Bell,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, markAlertRead, markAllAlertsRead, setActivePage, location } = useCitizen();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Disaster Management & Heat Alerts
            </h1>
            <span className="apple-badge bg-red-100 text-red-800">
              IMD / PMC Official
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time critical notices, thermal hazard warnings, and civic shelter surge advisories.
          </p>
        </div>

        <button
          onClick={markAllAlertsRead}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const isExtreme = alert.riskLevel === 'Extreme';

          return (
            <div
              key={alert.id}
              className={`apple-card p-6 sm:p-7 border-l-4 transition-all ${
                alert.isRead
                  ? 'border-l-slate-300 opacity-90'
                  : isExtreme
                  ? 'border-l-red-600 bg-red-50/20 shadow-sm'
                  : 'border-l-orange-500 bg-orange-50/20 shadow-sm'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      alert.riskLevel === 'Extreme'
                        ? 'bg-red-600 text-white'
                        : alert.riskLevel === 'High'
                        ? 'bg-orange-500 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {alert.type}
                  </span>
                  {!alert.isRead && (
                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold text-[10px]">
                      NEW UNREAD
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{alert.issuedAt}</span>
                </div>
              </div>

              <h3 className="mt-3 text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {alert.title}
              </h3>

              {/* WHAT IS HAPPENING */}
              <div className="mt-3 p-3.5 bg-white/90 rounded-xl border border-black/5 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">WHAT IS HAPPENING:</span>
                <p>{alert.whatIsHappening}</p>
              </div>

              {/* WHERE, WHEN, RISK LEVEL */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white/80 rounded-xl border border-black/5 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">WHERE</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{alert.where}</span>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-black/5 flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">WHEN</span>
                    <span className="font-semibold text-slate-800">{alert.when}</span>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-black/5 flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">RISK LEVEL</span>
                    <span className="font-bold text-red-600">{alert.riskLevel} Hazard</span>
                  </div>
                </div>
              </div>

              {/* WHAT TO DO NEXT */}
              <div className="mt-3.5 p-3.5 bg-white/95 rounded-xl border border-black/5 text-xs space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  WHAT TO DO NEXT:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                  {alert.whatToDoNext.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      markAlertRead(alert.id);
                      if (alert.recommendedAction.includes('Cooling')) setActivePage('protection');
                      else if (alert.recommendedAction.includes('Route')) setActivePage('route');
                      else setActivePage('adaptive');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <span>{alert.recommendedAction}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActivePage('map')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    View Affected Map Zone
                  </button>
                </div>

                {!alert.isRead && (
                  <button
                    onClick={() => markAlertRead(alert.id)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
