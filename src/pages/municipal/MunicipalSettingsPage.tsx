import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import {
  Settings,
  Building,
  User,
  Sliders,
  Radio,
  CheckCircle2,
  RefreshCw,
  Bell,
  Thermometer,
  Shield,
  Save,
} from 'lucide-react';

export const MunicipalSettingsPage: React.FC = () => {
  const { summary, refreshMunicipalData, isRefreshing } = useMunicipal();

  const [officerName, setOfficerName] = useState('Dr. S. Kulkarni');
  const [designation, setDesignation] = useState('Chief Disaster Management Officer');
  const [shift, setShift] = useState('Day Shift (08:00 AM – 06:00 PM)');
  const [wbgtThreshold, setWbgtThreshold] = useState(29.5);
  const [tempThreshold, setTempThreshold] = useState(38.0);
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [imdTelemetry, setImdTelemetry] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            SYSTEM CALIBRATION
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Municipal Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Disaster Management Cell profile, automated triggers, and telemetry feeds
          </p>
        </div>

        <button
          onClick={() => refreshMunicipalData()}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          <span>Sync Data Feeds</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Corporation & Officer Profile */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Municipal Corporation Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Corporation Name</label>
              <input
                type="text"
                disabled
                value={summary?.cityName || 'Municipal Corporation'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Operational Cell</label>
              <input
                type="text"
                disabled
                value={summary?.department || 'Disaster Management & Heat Action Cell'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">On-Duty Officer</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Shift Timing</label>
              <input
                type="text"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Heatwave Alert Thresholds */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Thermometer className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Heat Trigger Thresholds (IMD & NDMA Guidelines)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>WBGT Thermal Strain Trigger</span>
                <span className="text-orange-600 font-black">{wbgtThreshold}°C</span>
              </div>
              <input
                type="range"
                min="27.0"
                max="33.0"
                step="0.1"
                value={wbgtThreshold}
                onChange={(e) => setWbgtThreshold(parseFloat(e.target.value))}
                className="w-full accent-orange-600"
              />
              <p className="text-[11px] text-slate-500">
                Automatically elevates ward risk to 'High' when Wet Bulb Globe Temperature exceeds this point.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>Peak Ambient Heatwave Cutoff</span>
                <span className="text-rose-600 font-black">{tempThreshold}°C</span>
              </div>
              <input
                type="range"
                min="35.0"
                max="43.0"
                step="0.5"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(parseFloat(e.target.value))}
                className="w-full accent-rose-600"
              />
              <p className="text-[11px] text-slate-500">
                Triggers mandatory construction work suspension and civic cooling center extension.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Telemetry & Automated Dispatches */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Radio className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Data Feeds & Integrations
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  IMD Pune Doppler & Automatic Weather Station (AWS) Feed
                </span>
                <span className="text-[11px] text-slate-500">
                  Continuous 15-minute sync with Shivajinagar and Lohegaon meteorological sensors.
                </span>
              </div>
              <input
                type="checkbox"
                checked={imdTelemetry}
                onChange={(e) => setImdTelemetry(e.target.checked)}
                className="w-4 h-4 accent-orange-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Automated Citizen App Push Dispatches
                </span>
                <span className="text-[11px] text-slate-500">
                  Auto-notify residents in critical wards when daytime WBGT passes danger cutoff.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoDispatch}
                onChange={(e) => setAutoDispatch(e.target.checked)}
                className="w-4 h-4 accent-orange-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          {savedMsg ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Modifications apply across all municipal dispatch sessions
            </span>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
