import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DataStatusLabel } from '../../types/disaster.js';
import {
  Settings,
  ShieldAlert,
  Radio,
  Sliders,
  BellRing,
  Database,
  CheckCircle2,
  Save,
  Building,
} from 'lucide-react';

export const DisasterSettingsPage: React.FC = () => {
  const { summary, selectedRegion, dataStatus, setDataStatus } = useDisaster();

  const [eocName, setEocName] = useState(`Regional Emergency Operations Center (EOC) — ${selectedRegion.name}`);
  const [leadOfficer, setLeadOfficer] = useState('Dr. Sanjay Kulkarni, IAS (Special Relief Commissioner)');
  const [redThresholdTemp, setRedThresholdTemp] = useState('43.0');
  const [wbgtEmergencyThreshold, setWbgtEmergencyThreshold] = useState('32.0');
  const [autoBroadcast, setAutoBroadcast] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              AUTHORITY CONFIGURATION
            </span>
            <span className="text-xs font-bold text-slate-400">
              EOC Telemetry & Protocols
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Settings & Protocols
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Emergency operations center parameters, escalation trigger thresholds, data feeds, and inter-agency endpoints
          </p>
        </div>

        {isSaved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Parameters Saved Successfully</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. DATA STATUS MODE SELECTOR (Section 13) */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
                DATA STATUS TELEMETRY MODE
              </span>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Switch between meteorological modes to verify system state transparency
              </p>
            </div>
            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
              Active: {dataStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {(['LIVE', 'MODELLED', 'ESTIMATED', 'CURATED', 'UNAVAILABLE'] as DataStatusLabel[]).map(
              (st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setDataStatus(st)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    dataStatus === st
                      ? 'bg-red-50 border-red-300 text-red-950 font-black shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <span className="text-xs block">{st}</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    {st === 'LIVE'
                      ? 'Real-time telemetry'
                      : st === 'MODELLED'
                      ? 'IMD Meso-scale'
                      : st === 'ESTIMATED'
                      ? 'Health regression'
                      : st === 'CURATED'
                      ? 'Manual EOC entry'
                      : 'Sensor offline'}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 2. EOC Profile & Jurisdiction */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 block pb-2 border-b border-slate-100">
            EMERGENCY OPERATIONS CENTER (EOC) PROFILE
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                EOC Command Designation
              </label>
              <input
                type="text"
                value={eocName}
                onChange={(e) => setEocName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Lead Incident Commander / Officer
              </label>
              <input
                type="text"
                value={leadOfficer}
                onChange={(e) => setLeadOfficer(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Escalation Triggers */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs space-y-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800 block pb-2 border-b border-slate-100">
            ESCALATION TRIGGER THRESHOLDS
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Red Alert Air Temperature Trigger (°C)
              </label>
              <input
                type="text"
                value={redThresholdTemp}
                onChange={(e) => setRedThresholdTemp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard: 43.0°C or +4.5°C departure from normal
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Wet Bulb Globe Temp (WBGT) Emergency Cutoff (°C)
              </label>
              <input
                type="text"
                value={wbgtEmergencyThreshold}
                onChange={(e) => setWbgtEmergencyThreshold(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard: 32.0°C indicates extreme physiological hyperthermia risk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="autoBroadcast"
              checked={autoBroadcast}
              onChange={(e) => setAutoBroadcast(e.target.checked)}
              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
            />
            <label htmlFor="autoBroadcast" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Automatically issue inter-agency sirens & digital notifications when Red Alert is confirmed
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4 text-orange-400" />
            <span>Save EOC Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
