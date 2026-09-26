import React from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  TrendingUp,
  Clock,
  Flame,
  Activity,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const RiskTrendPage: React.FC = () => {
  const { summary, setActiveHealthcarePage } = useHealthcare();

  if (!summary) return null;

  // Diurnal risk progression throughout daytime hours
  const diurnalHours = [
    { time: '08:00 AM', temp: 28.5, wbgt: 24.2, label: 'Low Baseline', color: 'bg-emerald-500', alert: 'Safe morning outpatient routine' },
    { time: '10:00 AM', temp: 32.1, wbgt: 26.8, label: 'Rising Strain', color: 'bg-amber-400', alert: 'Outdoor workers begin thermal loading' },
    { time: '12:00 PM', temp: 36.8, wbgt: 29.5, label: 'High Exposure', color: 'bg-orange-500', alert: 'Acute dehydration presentations start' },
    { time: '02:00 PM', temp: 39.2, wbgt: 31.4, label: 'Peak Trauma Window', color: 'bg-rose-600', alert: 'Peak heat stroke & syncope danger' },
    { time: '04:00 PM', temp: 38.0, wbgt: 30.6, label: 'Severe Sustained', color: 'bg-rose-500', alert: 'Elevated core body temperatures' },
    { time: '06:00 PM', temp: 34.5, wbgt: 27.8, label: 'Gradual Easing', color: 'bg-amber-500', alert: 'Nighttime heat retention in dense wards' },
    { time: '08:00 PM', temp: 31.2, wbgt: 25.5, label: 'Elevated Night', color: 'bg-slate-400', alert: 'Lack of nocturnal cooling recovery' },
  ];

  const clinicalStages = [
    {
      stage: 'Stage 1: Heat Rash & Cramps',
      wbgt: '26.0°C – 28.5°C',
      symptoms: 'Prickly heat, heavy perspiration, painful muscle spasms in calves/abdomen.',
      intervention: 'Rest in shade, oral fluids with sodium/electrolytes.',
      urgency: 'Outpatient Triage',
      color: 'border-amber-300 bg-amber-50/60 text-amber-900',
    },
    {
      stage: 'Stage 2: Heat Exhaustion',
      wbgt: '28.5°C – 30.5°C',
      symptoms: 'Profuse sweating, weakness, cold pale clammy skin, tachycardia, dizziness.',
      intervention: 'Active fan misting, elevate legs, cold oral rehydration, core temp check.',
      urgency: 'Immediate ER Bed',
      color: 'border-orange-300 bg-orange-50/60 text-orange-950',
    },
    {
      stage: 'Stage 3: Clinical Heatstroke',
      wbgt: '> 30.5°C Sustained',
      symptoms: 'Core body temp > 40°C (104°F), altered mental status, confusion, hot dry or wet skin, seizure/coma.',
      intervention: 'Medical emergency! Rapid ice-water immersion or cold saline IV infusion.',
      urgency: 'Resuscitation Bay',
      color: 'border-rose-400 bg-rose-50/70 text-rose-950',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              CLINICAL TRAJECTORY
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              DIURNAL & MULTI-DAY
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Heat-Health Risk Trend & Escalation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Diurnal vulnerability timeline and clinical heat illness progression for emergency triage planning.
          </p>
        </div>

        <button
          onClick={() => setActiveHealthcarePage('facility-readiness')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <span>Check Staff Readiness</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Diurnal Timeline: Heat-Health Wave */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
              OPERATIONAL WINDOW
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Today's Diurnal Heat Exposure Curve
            </h3>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
            Peak Danger: 11:30 AM – 4:30 PM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {diurnalHours.map((h, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                h.time.includes('02:00 PM') || h.time.includes('04:00 PM')
                  ? 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-400/30'
                  : 'bg-slate-50/80 border-slate-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1 text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {h.time}
                  </span>
                </div>
                <div className="my-1">
                  <span className="text-lg font-black text-slate-900">{h.temp}°C</span>
                  <span className="text-[10px] text-slate-400 block font-medium">WBGT {h.wbgt}°C</span>
                </div>
                <div className="flex items-center gap-1.5 my-1.5">
                  <span className={`w-2 h-2 rounded-full ${h.color}`}></span>
                  <span className="text-[10px] font-extrabold text-slate-700">{h.label}</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-snug mt-2 pt-2 border-t border-black/5">
                {h.alert}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Escalation Stages: Heat Illness Pathway */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="pb-3 border-b border-slate-100 mb-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            TRIAGE STANDARDS
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            Clinical Heat-Illness Escalation Hierarchy
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pathological progression from mild dehydration to life-threatening heatstroke requiring cold-water immersion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clinicalStages.map((stage, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-3xl border flex flex-col justify-between shadow-xs ${stage.color}`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-black/5 mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {stage.urgency}
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/70 border border-black/5">
                    {stage.wbgt}
                  </span>
                </div>

                <h4 className="text-base font-extrabold text-slate-900 mb-2">
                  {stage.stage}
                </h4>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                      Signs & Symptoms:
                    </span>
                    <p className="font-medium mt-0.5">{stage.symptoms}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-70 block">
                      Emergency Intervention:
                    </span>
                    <p className="font-bold mt-0.5">{stage.intervention}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[11px] font-bold">
                <span>Action Guideline</span>
                <span className="flex items-center gap-1">
                  Active in Protocol <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
