import React, { useState, useEffect } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  Settings,
  Building,
  Save,
  Check,
  Shield,
  Bell,
  Thermometer,
  Cloud,
  CheckCircle2,
} from 'lucide-react';

export const HealthcareSettingsPage: React.FC = () => {
  const { settings, updateSettings } = useHealthcare();

  const [formData, setFormData] = useState({
    facilityName: '',
    primaryOrganization: '',
    primaryDistrict: '',
    temperatureThresholdCelsius: 38.0,
    wbgtWarningThreshold: 30.0,
    alertDispatchPhone: '',
    autoNotifyERStaff: true,
    preferredWeatherSource: 'IMD Synoptic & Open-Meteo',
    dataFreshnessMinutes: 10,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSettings(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              HEALTHCARE CONFIGURATION
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              FACILITY PREFERENCES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Healthcare Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Configure hospital facility parameters, heatwave clinical thresholds, and emergency alert dispatch integration.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Preferences saved successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Facility Identity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Healthcare Facility Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Hospital / Institution Name
              </label>
              <input
                type="text"
                value={formData.facilityName}
                onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
                placeholder="Hospital Name"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Healthcare Network / Grid
              </label>
              <input
                type="text"
                value={formData.primaryOrganization}
                onChange={(e) => setFormData({ ...formData, primaryOrganization: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
                placeholder="Health Organization"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Monitored Medical District
              </label>
              <input
                type="text"
                value={formData.primaryDistrict}
                onChange={(e) => setFormData({ ...formData, primaryDistrict: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
                placeholder="Monitored District"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Emergency Dispatch Line (24x7)
              </label>
              <input
                type="text"
                value={formData.alertDispatchPhone}
                onChange={(e) => setFormData({ ...formData, alertDispatchPhone: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
                placeholder="+91..."
              />
            </div>
          </div>
        </div>

        {/* Clinical Thresholds */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Thermometer className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Clinical Heat-Stress Trigger Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Ambient Temperature Warning Threshold (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.temperatureThresholdCelsius}
                onChange={(e) =>
                  setFormData({ ...formData, temperatureThresholdCelsius: parseFloat(e.target.value) || 38 })
                }
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Triggers yellow heat alert in emergency intake log when exceeded.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Wet Bulb Globe Temperature (WBGT) Trigger (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.wbgtWarningThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, wbgtWarningThreshold: parseFloat(e.target.value) || 30 })
                }
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard threshold for severe clinical heatstroke probability.
              </span>
            </div>
          </div>
        </div>

        {/* Data Source & Automation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cloud className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Data Ingest & Automated Notification
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Primary Meteorological Data Provider
              </label>
              <select
                value={formData.preferredWeatherSource}
                onChange={(e) => setFormData({ ...formData, preferredWeatherSource: e.target.value })}
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900"
              >
                <option value="IMD Synoptic & Open-Meteo">IMD Synoptic & Open-Meteo (Recommended)</option>
                <option value="Google Weather API">Google Weather API</option>
                <option value="ECMWF Open Data">ECMWF Open Data</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-slate-800 block">Automated ER Staff Notification</span>
                <span className="text-[10px] text-slate-400">
                  Notify on-call doctors when WBGT crosses 30.5°C
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoNotifyERStaff}
                onChange={(e) => setFormData({ ...formData, autoNotifyERStaff: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-[0.99]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Preferences...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
