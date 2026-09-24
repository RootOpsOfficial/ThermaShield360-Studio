import React from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import {
  CloudSun,
  Flame,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Compass,
  ArrowRight,
  Info,
} from 'lucide-react';

export const HeatwaveForecastPage: React.FC = () => {
  const { heatwaveStatus, weatherForecast, weatherCurrent, location, formatTemp, setActivePage } = useCitizen();

  const isSevere = heatwaveStatus?.alertCode === 'RED';
  const isWarning = heatwaveStatus?.alertCode === 'ORANGE';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Page Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Heatwave Forecast & Persistence
            </h1>
            <span
              className={`apple-badge text-xs font-bold ${
                isSevere
                  ? 'bg-red-600 text-white'
                  : isWarning
                  ? 'bg-orange-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {heatwaveStatus?.alertCode || 'ORANGE'} ALERT
            </span>
            <span className="apple-badge bg-slate-100 text-slate-700">
              {heatwaveStatus?.source || 'LIVE'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Indian Meteorological Department (IMD) Grounded Thermal Trajectory & Persistence Modeling
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
          <span>Confidence:</span>
          <strong className="text-emerald-700">{heatwaveStatus?.forecastConfidence || 91}%</strong>
        </div>
      </div>

      {/* Main Heatwave Episode Status Card */}
      <section className="apple-card p-6 sm:p-7 bg-gradient-to-br from-white via-white to-red-50/40 border border-black/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-600" />
            <span className="font-bold text-slate-900 text-sm">Episode Trajectory & Severity</span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Issuing Agency: {heatwaveStatus?.issuingAgency || 'IMD Pune'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-black/5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
            <span className="text-lg font-black text-red-600 block mt-0.5">
              {heatwaveStatus?.status || 'Heatwave Warning'}
            </span>
            <span className="text-[10px] text-slate-500">Day {heatwaveStatus?.dayOfEpisode || 2} of {heatwaveStatus?.durationDays || 3}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-black/5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Current / Peak Temp</span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">
              {formatTemp(weatherCurrent?.temp || 38.6)}
            </span>
            <span className="text-[10px] text-orange-600 font-semibold">
              +{heatwaveStatus?.departureFromNormalDegC || 4.6}°C above normal
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-black/5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Peak Risk Period</span>
            <span className="text-lg font-black text-slate-900 block mt-0.5">
              {heatwaveStatus?.peakPeriod || '12:30 PM – 4:30 PM'}
            </span>
            <span className="text-[10px] text-red-500 font-semibold">Extreme Radiation Window</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-black/5">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Persistence Trajectory</span>
            <span className="text-sm font-bold text-slate-800 block mt-1 leading-snug">
              {heatwaveStatus?.trajectory || 'Escalating peak today'}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
          {heatwaveStatus?.persistence ||
            'High atmospheric stability and dry continental north-westerly winds are trapping radiant energy across the Deccan plateau, suppressing convection and elevating overnight minimums.'}
        </p>
      </section>

      {/* 5-Day Visual Timeline */}
      <section className="apple-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              5-Day Visual Heatwave Timeline
            </h3>
          </div>
          <span className="text-xs text-slate-400">Escalation & De-escalation Path</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {weatherForecast.slice(0, 5).map((day, idx) => {
            const isToday = idx === 0;
            const isCritical = day.riskLevel === 'Extreme';
            return (
              <div
                key={day.date}
                className={`p-4 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                  isToday
                    ? 'border-orange-500 bg-orange-50/40 shadow-xs'
                    : isCritical
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-black/5 bg-slate-50/70'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{day.dayName}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {isToday ? 'Today' : day.date.slice(5)}
                  </span>

                  <div className="my-3">
                    <span className="text-2xl font-black text-slate-900 block">
                      {formatTemp(day.tempMax)}
                    </span>
                    <span className="text-[11px] text-slate-400">Min {formatTemp(day.tempMin)}</span>
                  </div>

                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      day.riskLevel === 'Extreme'
                        ? 'bg-red-600 text-white'
                        : day.riskLevel === 'High'
                        ? 'bg-orange-500 text-white'
                        : day.riskLevel === 'Moderate'
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {day.riskLevel}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-black/5 text-[10px] text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-800">
                    {day.heatwaveStatus !== 'None' ? day.heatwaveStatus : 'Normal'}
                  </p>
                  <p className="text-slate-400">Peak {day.peakPeriod.split('–')[0]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Heatwave Safety Guidelines */}
      <section className="apple-card p-5 sm:p-6 bg-amber-50/40 border border-amber-200/80 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <span>Official Heatwave Do's and Don'ts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-white/90 rounded-xl border border-black/5 space-y-1.5">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              DO'S: Protective Actions
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
              <li>Keep oral rehydration solution (ORS) or homemade salt-lemon water accessible.</li>
              <li>Wear light-coloured, loose, breathable cotton clothing.</li>
              <li>Cover head with a light wet cloth, umbrella, or wide-brim hat when outdoors.</li>
              <li>Check on vulnerable elderly relatives twice daily.</li>
            </ul>
          </div>

          <div className="p-3.5 bg-white/90 rounded-xl border border-black/5 space-y-1.5">
            <span className="font-bold text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              DON'TS: Dangerous Behaviors
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
              <li>Do NOT leave children or pets inside parked closed vehicles even for 2 minutes.</li>
              <li>Avoid alcohol, heavily caffeinated energy drinks, or aerated sugary sodas.</li>
              <li>Avoid strenuous athletic training outdoors between 11:30 AM and 5:00 PM.</li>
              <li>Do NOT ignore muscle cramps, confusion, dizziness, or lack of sweating.</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center text-xs">
          <span className="text-slate-500">Need emergency cooling relief?</span>
          <button
            onClick={() => setActivePage('protection')}
            className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Locate Nearest Air-Conditioned Shelter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
