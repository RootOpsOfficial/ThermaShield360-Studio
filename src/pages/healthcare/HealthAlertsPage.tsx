import React from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  Bell,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const HealthAlertsPage: React.FC = () => {
  const { summary, setActiveHealthcarePage } = useHealthcare();

  if (!summary) return null;

  const activeAlert = summary.activeAlert;

  const alertHistory = [
    {
      id: 'ha-hist-1',
      title: 'ELEVATED HEAT-HEALTH EMERGENCY SURGE',
      severity: 'High',
      what: 'Anticipated surge in severe heat exhaustion and dehydration-related trauma cases.',
      where: 'Central & Eastern Pune Wards (Kasba Peth, Hadapsar, Swargate)',
      when: 'Next 72 Hours (11:30 AM – 4:30 PM daily)',
      why: 'Wet Bulb Globe Temperature exceeding 30.5°C coupled with high dense urban radiant heat load.',
      action: 'Prepare heat-related emergency capacity, activate cold saline resuscitation protocols, and alert peripheral triage clinics.',
      status: 'ACTIVE',
      issued: 'Today, 08:30 AM IST',
    },
    {
      id: 'ha-hist-2',
      title: 'HEAT EXHAUSTION SURGE IN INDUSTRIAL WORKERS',
      severity: 'Moderate',
      what: 'Elevated presentation of mild dehydration and muscle cramps from industrial manufacturing zones.',
      where: 'Hadapsar Industrial Estate & Transit Depots',
      when: 'Yesterday (12:00 PM – 5:00 PM)',
      why: 'Radiant heat trapped inside uninsulated sheet metal structures.',
      action: 'Mobile hydration tankers deployed and ORS packets distributed.',
      status: 'RESOLVED',
      issued: 'Yesterday, 11:00 AM IST',
    },
    {
      id: 'ha-hist-3',
      title: 'SEASONAL BASELINE RE-CALIBRATION',
      severity: 'Informational',
      what: 'Seasonal pre-monsoon heat protocol activated across municipal health centers.',
      where: 'All 6 Pune Medical Zones',
      when: '3 Days Ago',
      why: 'IMD regional synoptic advisory forecasting early dry heat onset.',
      action: 'Staff rosters adjusted to ensure double-nurse shifts during peak hours.',
      status: 'RESOLVED',
      issued: '3 Days Ago',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              OPERATIONAL CLINICAL ADVISORIES
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              1 ACTIVE ALERT
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Health Alerts & Directives
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Operational alerts issued to hospital emergency departments, ambulance triage networks, and municipal health outposts.
          </p>
        </div>

        <button
          onClick={() => setActiveHealthcarePage('facility-readiness')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <span>Verify Protocol Compliance</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active Operational Alert Card */}
      {activeAlert && (
        <div className="bg-gradient-to-br from-rose-50/80 via-white to-white rounded-3xl p-6 border-2 border-rose-300 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-rose-200 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
                  CRITICAL OPERATIONAL DIRECTIVE
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {activeAlert.title}
                </h3>
              </div>
            </div>

            <span className="flex items-center gap-1.5 text-xs font-black text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              ACTIVE DIRECTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/90 border border-rose-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  WHAT:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{activeAlert.what}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-rose-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  WHERE:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{activeAlert.where}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-white/90 border border-rose-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  WHEN:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{activeAlert.when}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/90 border border-rose-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  WHY:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{activeAlert.why}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-2xl bg-rose-100/70 border border-rose-200 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 block mb-0.5">
              MANDATORY RECOMMENDED ACTION:
            </span>
            <p className="text-slate-900 font-extrabold text-sm leading-snug">
              {activeAlert.recommendedAction}
            </p>
          </div>
        </div>
      )}

      {/* Alert Log / Historical Register */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
          Advisory History & Incident Log
        </h3>

        <div className="space-y-3">
          {alertHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      item.status === 'ACTIVE'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="font-black text-slate-900">{item.title}</span>
                </div>
                <p className="text-slate-600 font-medium">{item.action}</p>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{item.where}</span>
                  <span>•</span>
                  <span>{item.issued}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                  {item.severity} Severity
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
