import React from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import {
  X,
  Bell,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const AlertDrawer: React.FC = () => {
  const {
    isNotificationOpen,
    setIsNotificationOpen,
    alerts,
    markAlertRead,
    markAllAlertsRead,
    setActivePage,
  } = useCitizen();

  if (!isNotificationOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotificationOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Climate & Heat Alerts</h3>
              <p className="text-xs text-slate-500">Real-time alerts for your area</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-black/5 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {alerts.filter((a) => !a.isRead).length} Unread Notifications
          </span>
          <button
            onClick={markAllAlertsRead}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Mark all as read
          </button>
        </div>

        {/* Alert Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">No active severe heat alerts</p>
              <p className="text-xs mt-1">Your zone is operating in normal safety limits.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const isUrgent = alert.urgent || alert.riskLevel === 'Extreme';
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    alert.isRead
                      ? 'bg-slate-50/60 border-slate-200/80 opacity-80'
                      : isUrgent
                      ? 'bg-red-50/70 border-red-200 shadow-sm'
                      : 'bg-amber-50/70 border-amber-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
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
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.issuedAt}
                    </span>
                  </div>

                  <h4 className="mt-2 text-xs font-bold text-slate-900 leading-snug">
                    {alert.title}
                  </h4>

                  {/* WHAT IS HAPPENING */}
                  <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                    {alert.whatIsHappening}
                  </p>

                  {/* WHERE & WHEN */}
                  <div className="mt-2.5 pt-2 border-t border-black/5 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">Where:</span>
                      <span className="truncate">{alert.where}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">When:</span>
                      <span>{alert.when}</span>
                    </div>
                  </div>

                  {/* WHAT TO DO NEXT */}
                  <div className="mt-2.5 bg-white/80 p-2.5 rounded-xl border border-black/5 text-[11px]">
                    <p className="font-bold text-slate-800 mb-1">What to do next:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                      {alert.whatToDoNext.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => {
                        markAlertRead(alert.id);
                        setIsNotificationOpen(false);
                        if (alert.recommendedAction.includes('Cooling')) setActivePage('protection');
                        else if (alert.recommendedAction.includes('Route')) setActivePage('route');
                        else setActivePage('adaptive');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>{alert.recommendedAction}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    {!alert.isRead && (
                      <button
                        onClick={() => markAlertRead(alert.id)}
                        className="p-1.5 text-xs text-slate-500 hover:text-slate-800"
                        title="Mark as read"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
