import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import { MunicipalAlertItem } from '../../types/municipal.js';
import {
  Bell,
  Radio,
  Clock,
  MapPin,
  Shield,
  Plus,
  X,
  AlertTriangle,
  Flame,
  Send,
} from 'lucide-react';

export const MunicipalAlertsPage: React.FC = () => {
  const { alerts, broadcastAlert, wards } = useMunicipal();
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // New alert form state
  const [newWard, setNewWard] = useState('Ward 21 (Kasba Peth)');
  const [newSeverity, setNewSeverity] = useState<MunicipalAlertItem['severity']>('High');
  const [newWhat, setNewWhat] = useState('');
  const [newWhere, setNewWhere] = useState('Ward 21 (Kasba Peth)');
  const [newWhen, setNewWhen] = useState('12:00 PM – 4:30 PM');
  const [newWhy, setNewWhy] = useState('Extreme wet-bulb temperature exceeding 31.5°C with severe protection deficit.');
  const [newAction, setNewAction] = useState('Deploy mobile water units and open air-conditioned municipal shelters.');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhat.trim()) return;

    setIsBroadcasting(true);
    await broadcastAlert({
      what: newWhat,
      where: newWhere || newWard,
      when: newWhen || 'Immediate',
      why: newWhy,
      action: newAction,
      severity: newSeverity,
      status: 'Active',
    });
    setIsBroadcasting(false);
    setIsBroadcastModalOpen(false);
    setNewWhat('');
  };

  const severityBadgeClass = (severity: MunicipalAlertItem['severity']) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Harmful + Confidence':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Developing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Normal':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
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
            Municipal Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Operational heatwave warnings, trigger criteria, and public dissemination directives
          </p>
        </div>

        <button
          onClick={() => setIsBroadcastModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all shrink-0 self-start sm:self-center"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Issue Municipal Alert</span>
        </button>
      </div>

      {/* Dissemination Channels Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Citizen App Channel</p>
              <p className="text-[10px] text-slate-400">Push notifications & safety banners</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            LIVE SYNC
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Field Squad Dispatches</p>
              <p className="text-[10px] text-slate-400">Mobile water tankers & misting units</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            CONNECTED
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Emergency Services (108)</p>
              <p className="text-[10px] text-slate-400">Hospital triage escalation</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            STANDBY
          </span>
        </div>
      </div>

      {/* ACTIVE ALERTS LIST */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Operational Heatwave Alerts ({alerts.length})
        </h3>

        <div className="space-y-4">
          {alerts.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3"
            >
              {/* Header: Severity & Status */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${severityBadgeClass(
                      item.severity
                    )}`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {item.where}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {item.status}
                </span>
              </div>

              {/* WHAT, WHERE, WHEN, WHY, RECOMMENDED ACTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    WHAT
                  </span>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {item.what}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    WHERE
                  </span>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {item.where}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    WHEN
                  </span>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {item.when}
                  </p>
                </div>

                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    WHY
                  </span>
                  <p className="font-semibold text-amber-950 mt-0.5">
                    {item.why}
                  </p>
                </div>
              </div>

              {/* RECOMMENDED ACTION */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/60 text-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 block">
                  RECOMMENDED ACTION
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast Alert Modal Dialog */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-black/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Broadcast Municipal Alert
                </h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Severity / Risk Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
                >
                  <option value="Critical">Critical</option>
                  <option value="Harmful + Confidence">Harmful + Confidence</option>
                  <option value="High">High</option>
                  <option value="Developing">Developing</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WHAT (Alert Directive)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Severe heatwave alert with WBGT > 32°C"
                  value={newWhat}
                  onChange={(e) => setNewWhat(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WHERE (Ward/Sector)</label>
                  <select
                    value={newWhere}
                    onChange={(e) => setNewWhere(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
                  >
                    {wards.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                    <option value="Jurisdiction-wide Municipal Grid">Jurisdiction-wide Municipal Grid</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">WHEN (Operational Window)</label>
                  <input
                    type="text"
                    value={newWhen}
                    onChange={(e) => setNewWhen(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">WHY (Underlying Trigger)</label>
                <textarea
                  rows={2}
                  value={newWhy}
                  onChange={(e) => setNewWhy(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">RECOMMENDED ACTION</label>
                <textarea
                  rows={2}
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
