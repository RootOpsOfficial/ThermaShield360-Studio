import React, { useState } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import {
  Settings as SettingsIcon,
  Navigation,
  User,
  HeartPulse,
  HardHat,
  GraduationCap,
  Bell,
  Thermometer,
  ShieldCheck,
  Check,
  Globe,
  Database,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    location,
    selectWard,
    requestGpsLocation,
    profile,
    updateProfile,
    unit,
    setUnit,
  } = useCitizen();

  const [heatwaveNotifs, setHeatwaveNotifs] = useState(true);
  const [hydrationReminders, setHydrationReminders] = useState(true);
  const [morningSummary, setMorningSummary] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200 max-w-4xl">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Citizen Workspace Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personalize biometeorological modeling, location preferences, and alert sensitivities.
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold animate-in fade-in">
            <Check className="w-3.5 h-3.5" /> Preferences Saved
          </span>
        )}
      </div>

      {/* Geolocation & Default Ward */}
      <section className="apple-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-black/5">
          <Navigation className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Location & Geolocation</h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-black/5">
            <div>
              <p className="font-bold text-slate-800">Browser GPS Detection</p>
              <p className="text-slate-500">
                {location.isGps
                  ? 'Currently active with live device coordinates.'
                  : 'Using ward fallback location.'}
              </p>
            </div>
            <button
              onClick={() => requestGpsLocation()}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Re-acquire GPS
            </button>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">
              Default Ward Assignment
            </label>
            <select
              value={location.ward.id}
              onChange={(e) => selectWard(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-semibold text-slate-800 shadow-xs"
            >
              {location.allWards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Vulnerability Calibration */}
      <section className="apple-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-black/5">
          <User className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Personal Health Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Age Demographic</label>
            <select
              value={profile.ageGroup}
              onChange={(e) => updateProfile({ ageGroup: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-semibold text-slate-800 shadow-xs"
            >
              <option value="Adult (18-64)">Adult (18-64 years)</option>
              <option value="Senior (65+)">Senior Citizen (65+ years)</option>
              <option value="Child (< 12)">Child (&lt; 12 years)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Primary Activity Mode</label>
            <select
              value={profile.isOutdoorWorker ? 'outdoor' : 'indoor'}
              onChange={(e) => updateProfile({ isOutdoorWorker: e.target.value === 'outdoor' })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-black/10 text-xs font-semibold text-slate-800 shadow-xs"
            >
              <option value="indoor">Indoor / Office Work</option>
              <option value="outdoor">Outdoor Worker / Field Labor</option>
            </select>
          </div>

          <div className="sm:col-span-2 pt-1">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-black/5 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.hasHealthCondition}
                onChange={(e) => updateProfile({ hasHealthCondition: e.target.checked })}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <div>
                <span className="font-bold text-slate-800 block">Pre-existing Health Conditions</span>
                <span className="text-[11px] text-slate-500">
                  Cardiovascular disease, hypertension, respiratory illness, diabetes, or renal sensitivity.
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Temperature Display Unit */}
      <section className="apple-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-black/5">
          <Thermometer className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Units & Measurement</h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUnit('C')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              unit === 'C'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Celsius (°C)
          </button>
          <button
            onClick={() => setUnit('F')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              unit === 'F'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fahrenheit (°F)
          </button>
        </div>
      </section>

      {/* Alert Notifications Sensitivity */}
      <section className="apple-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-black/5">
          <Bell className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Alert & Notification Toggles</h3>
        </div>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-black/5 cursor-pointer">
            <div>
              <p className="font-bold text-slate-800">Urgent Heatwave Warnings</p>
              <p className="text-slate-500">Push notifications when IMD declares Orange or Red alert.</p>
            </div>
            <input
              type="checkbox"
              checked={heatwaveNotifs}
              onChange={(e) => setHeatwaveNotifs(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-black/5 cursor-pointer">
            <div>
              <p className="font-bold text-slate-800">Peak Thermal Stress & Hydration Reminders</p>
              <p className="text-slate-500">Alerts before 12:30 PM peak solar radiation window.</p>
            </div>
            <input
              type="checkbox"
              checked={hydrationReminders}
              onChange={(e) => setHydrationReminders(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-black/5 cursor-pointer">
            <div>
              <p className="font-bold text-slate-800">Daily Morning Briefing (07:00 AM)</p>
              <p className="text-slate-500">Daily outlook of expected peak temperatures and safe transit advice.</p>
            </div>
            <input
              type="checkbox"
              checked={morningSummary}
              onChange={(e) => setMorningSummary(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
            />
          </label>
        </div>
      </section>

      {/* Backend & Data Source Information */}
      <section className="apple-card p-5 sm:p-6 space-y-3 text-xs bg-slate-50/70 border border-black/5">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Database className="w-4 h-4 text-slate-600" />
          <span>Connected Systems & Data Grounding</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          ThermaShield 360 Citizen Workspace is powered by live Indian Meteorological Department (IMD) observation nodes in Pune, Open-Meteo High Resolution Solar Radiation, and PostGIS Ward Boundary spatial layers.
        </p>
        <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
          <span>• IMD Station: Shivajinagar (43063)</span>
          <span>• Engine: Wet Bulb Stull (2011) + NOAA Heat Index</span>
          <span>• GIS: Pune Municipal Corporation (PMC) Wards</span>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold shadow-md transition-all"
        >
          Save All Preferences
        </button>
      </div>
    </div>
  );
};
