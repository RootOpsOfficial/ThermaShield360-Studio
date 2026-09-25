import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import { MunicipalAlertItem } from '../../types/municipal.js';
import {
  Bell,
  AlertTriangle,
  Flame,
  Radio,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Shield,
  Plus,
  X,
} from 'lucide-react';

export const MunicipalAlertsPage: React.FC = () => {
  const { alerts, broadcastAlert, wards, setSelectedWard, setActiveMunicipalPage } = useMunicipal();
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // New alert form
  const [newWard, setNewWard] = useState('Ward 21 (Kasba Peth)');
  const [newSeverity, setNewSeverity] = useState<'Critical' | 'High' | 'Developing'>('High');
  const [newWhat, setNewWhat] = useState('');
  const [newAction, setNewAction] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhat.trim()) return;

    setIsBroadcasting(true);
    await broadcastAlert({
      what: newWhat,
      where: newWard,
      when: 'Immediate • Valid for next 6 hours',
      why: 'IMD heat index threshold surpassed with vulnerable population exposure.',
      action: newAction || 'Deploy shade units and issue civic hydrate notifications.',
      severity: newSeverity,
      status: 'Active',
    });
    setIsBroadcasting(false);
    setIsBroadcastModalOpen(false);
    setNewWhat('');
    setNewAction('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            EMERGENCY EARLY WARNING SYSTEM
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Municipal Alerts & Broadcast Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Active heatwave warnings, trigger criteria, and multi-channel public dissemination
          </p>
        </div>

        <button
          onClick={() => setIsBroadcastModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all shrink-0 self-start sm:self-center"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Issue Broadcast Alert</span>
        </button>
      </div>

      {/* Broadcast Channels Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Citizen App Channel</p>
              <p className="text-[10px] text-slate-400">Push notifications & banner</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Active Sync
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Field Squad Dispatch</p>
              <p className="text-[10px] text-slate-400">Ward officers & mobile tankers</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Linked
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Emergency Services (108)</p>
              <p className="text-[10px] text-slate-400">Ambulance triage escalation</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Standby
          </span>
        </div>
      </div>

      {/* Active Alerts List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Currently Dispatched Heatwave Alerts ({alerts.length})
        </h3>

        <div className="space-y-3">
          {alerts.map((item) => {
            const isCritical = item.severity === 'Critical';
            const isHigh = item.severity === 'High';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  isCritical
                    ? 'border-red-200 bg-gradient-to-r from-red-50/40 to-white'
                    : isHigh
                    ? 'border-orange-200 bg-gradient-to-r from-orange-50/40 to-white'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isHigh
                          ? 'bg-orange-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.severity} ALERT
                    </span>
                    <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      {item.where}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {item.when}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {item.what}
                  </h4>

                  <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-black/5 leading-relaxed">
                    <span className="font-bold text-slate-700">Trigger Threshold: </span>
                    {item.why}
                  </p>

                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs">
                    <span className="text-[10px] font-bold text-blue-800 uppercase block">
                      Civic Response Mandate:
                    </span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      {item.action}
                    </span>
                  </div>
                </div>

                {/* Right Quick Controls */}
                <div className="flex md:flex-col gap-2 shrink-0 self-end md:self-center">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 text-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Broadcasted
                  </span>
                  <button
                    onClick={() => {
                      const matched = wards.find((w) => item.where.includes(w.name.split(':')[0]));
                      if (matched) setSelectedWard(matched);
                      setActiveMunicipalPage('ward-risk-map');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    View Ward Map
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Broadcast Modal Dialog */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Issue Municipal Broadcast Alert
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Municipal Ward
                </label>
                <select
                  value={newWard}
                  onChange={(e) => setNewWard(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  {wards.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.riskLevel} Risk)
                    </option>
                  ))}
                  <option value="All Pune Municipal Corporation Wards (Citywide)">
                    All Pune Municipal Corporation Wards (Citywide)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alert Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Developing', 'High', 'Critical'] as const).map((sev) => (
                    <button
                      type="button"
                      key={sev}
                      onClick={() => setNewSeverity(sev)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        newSeverity === sev
                          ? sev === 'Critical'
                            ? 'bg-rose-600 text-white'
                            : sev === 'High'
                            ? 'bg-orange-600 text-white'
                            : 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alert Advisory Statement
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Extreme afternoon heat stress expected with WBGT exceeding 31°C. Outdoor activities must be curtailed."
                  value={newWhat}
                  onChange={(e) => setNewWhat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Immediate Field Directive
                </label>
                <input
                  type="text"
                  placeholder="e.g. Open community AC shelters until 8:30 PM & refill water dispensers."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isBroadcasting ? 'Broadcasting...' : 'Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
