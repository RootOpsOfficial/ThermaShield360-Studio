import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  Activity,
  Calendar,
  Thermometer,
  TrendingUp,
  AlertTriangle,
  Info,
  Clock,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const HealthForecastPage: React.FC = () => {
  const { summary, setActiveHealthcarePage } = useHealthcare();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!summary) return null;

  const outlook = summary.fiveDayOutlook || [];
  const selectedDay = outlook[selectedDayIndex] || outlook[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              HEAT & HEALTH FORECAST
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              MODELLED HEALTH-RISK ESTIMATE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            3–5 Day Health Impact Forecast
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Forward clinical risk trajectory combining IMD surface weather, thermal stress (WBGT/UTCI), and demographic vulnerability.
          </p>
        </div>

        <button
          onClick={() => setActiveHealthcarePage('demand-capacity')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <span>Evaluate Capacity Gap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5-Day Horizontal Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {outlook.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-4 rounded-3xl border text-left transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white/80 hover:bg-white border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  {day.dayName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {day.date.split('-').slice(1).join('/')}
                </span>
              </div>

              <div className="flex items-baseline gap-1 my-1">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{day.tempMax}°C</span>
                <span className="text-xs font-bold text-slate-400">/ {day.tempMin}°C</span>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block text-center ${
                    day.healthRisk === 'Critical'
                      ? 'bg-rose-100 text-rose-800'
                      : day.healthRisk === 'High'
                      ? 'bg-orange-100 text-orange-800'
                      : day.healthRisk === 'Moderate'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {day.healthRisk} Risk
                </span>
                <span className="text-[10px] text-rose-700 font-bold text-center">
                  +{day.hospitalizationIncreasePct}% Admissions
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detailed Forecast Panel for Selected Day */}
      {selectedDay && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Main Clinical Breakdown (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Detailed Medical Impact • {selectedDay.dayName} ({selectedDay.date})
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  Clinical Heat-Stress Profile
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  Peak Stress: {selectedDay.peakHours}
                </span>
              </div>
            </div>

            {/* Metric Comparison Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Max Ambient Temp
                </span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">
                  {selectedDay.tempMax}°C
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Surface reading</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200/60">
                <span className="text-[10px] font-black text-orange-800 uppercase tracking-wider block">
                  Wet Bulb (WBGT)
                </span>
                <span className="text-xl font-black text-orange-900 mt-0.5 block">
                  {selectedDay.wbgt}°C
                </span>
                <span className="text-[10px] text-orange-700 font-medium">Physiological evaporative limit</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/60">
                <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider block">
                  UTCI Heat Stress
                </span>
                <span className="text-xl font-black text-rose-900 mt-0.5 block">
                  {selectedDay.utci}°C
                </span>
                <span className="text-[10px] text-rose-700 font-medium">Universal Thermal Index</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">
                  Admission Surge
                </span>
                <span className="text-xl font-black text-blue-900 mt-0.5 block">
                  +{selectedDay.hospitalizationIncreasePct}%
                </span>
                <span className="text-[10px] text-blue-700 font-medium">Modelled vs baseline</span>
              </div>
            </div>

            {/* Clinical Synopsis & Expected Symptoms */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Clinical Synopsis
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {selectedDay.clinicalNotes}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Primary Emergency Presentations
                  </span>
                  <ul className="space-y-1 text-slate-700 font-medium list-disc list-inside">
                    <li>Heat syncope & dehydration dizziness</li>
                    <li>Severe muscle spasms (heat cramps)</li>
                    <li>Hyperthermia with altered sensorium</li>
                    <li>Exacerbation of ischemic heart conditions</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-100 bg-white shadow-2xs">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Recommended Triage Protocols
                  </span>
                  <ul className="space-y-1 text-slate-700 font-medium list-disc list-inside">
                    <li>Pre-chill IV normal saline to 4°C</li>
                    <li>Oral rehydration solution at intake desk</li>
                    <li>Continuous core temperature monitoring</li>
                    <li>Rapid evaporative fan misting setup</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Model Provenance & Decision Support (4 Cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  DECISION CONFIDENCE
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">
                  Health Model Provenance
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calibrated against IMD historical Pune heatwaves (2018–2025).
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Weather Ingest</span>
                  <span className="font-bold text-slate-900">IMD Synoptic / Open-Meteo</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Health Signal</span>
                  <span className="font-bold text-amber-700">Modelled Estimate</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Confidence Score</span>
                  <span className="font-bold text-emerald-700">High (92%)</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Target Population</span>
                  <span className="font-bold text-slate-900">Pune Urban Metropole</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-950 font-medium leading-relaxed">
                <strong>Data Notice:</strong> This forecast presents epidemiological heat-health signals designed for hospital surge preparedness. It is not an individual patient diagnostic tool.
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveHealthcarePage('risk-areas')}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <span>Examine High-Risk Wards</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
