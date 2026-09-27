import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterRegionSelector } from '../../components/disaster/DisasterRegionSelector.js';
import { ActiveLocationSpotlightBar } from '../../components/disaster/ActiveLocationSpotlightBar.js';
import {
  Flame,
  TrendingUp,
  MapPin,
  Clock,
  Sun,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Radio,
  Check,
} from 'lucide-react';

export const HeatSituationPage: React.FC = () => {
  const {
    selectedRegion,
    selectedArea,
    selectArea,
    summary,
    affectedAreas,
    setSelectedArea,
    setActiveDisasterPage,
    dataStatus,
  } = useDisaster();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  const districts = ['all', ...Array.from(new Set(affectedAreas.map((a) => a.district)))];

  const filteredAreas =
    selectedDistrict === 'all'
      ? affectedAreas
      : affectedAreas.filter((a) => a.district === selectedDistrict);

  // Near-term hourly diurnal outlook for the region
  const nearTermOutlook = [
    { time: '10:00 AM', temp: (summary.regionalHeatStatus.currentPeakTempC - 4.2).toFixed(1), wbgt: 28.5, status: 'Developing' },
    { time: '11:00 AM', temp: (summary.regionalHeatStatus.currentPeakTempC - 2.4).toFixed(1), wbgt: 30.2, status: 'High' },
    { time: '12:00 PM', temp: (summary.regionalHeatStatus.currentPeakTempC - 0.8).toFixed(1), wbgt: 31.8, status: 'Critical' },
    { time: '01:00 PM', temp: summary.regionalHeatStatus.currentPeakTempC.toFixed(1), wbgt: 32.7, status: 'Critical' },
    { time: '02:00 PM', temp: (summary.regionalHeatStatus.currentPeakTempC + 0.2).toFixed(1), wbgt: 32.9, status: 'Critical' },
    { time: '03:00 PM', temp: (summary.regionalHeatStatus.currentPeakTempC - 0.5).toFixed(1), wbgt: 32.1, status: 'Critical' },
    { time: '04:00 PM', temp: (summary.regionalHeatStatus.currentPeakTempC - 1.7).toFixed(1), wbgt: 30.8, status: 'High' },
    { time: '05:00 PM', temp: (summary.regionalHeatStatus.currentPeakTempC - 3.6).toFixed(1), wbgt: 29.2, status: 'Developing' },
    { time: '06:00 PM', temp: (summary.regionalHeatStatus.currentPeakTempC - 5.4).toFixed(1), wbgt: 27.6, status: 'Normal' },
  ];

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 0. Location Selector Bar */}
      <DisasterRegionSelector />

      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              REGIONAL RISK POSTURE
            </span>
            <span className="text-xs font-bold text-slate-400">
              {summary.regionalHeatStatus.tier}
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              SOURCE: {selectedRegion.weatherSource}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Heat Situation — {selectedRegion.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Regional heat status, affected districts, thermal severity gradients, and near-term outlook
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 p-3 rounded-2xl">
          <Flame className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="text-[10px] font-extrabold uppercase text-red-800 block">
              PEAK HEAT WAVE WINDOW
            </span>
            <span className="text-xs font-black text-slate-900">
              {summary.regionalHeatStatus.diurnalWindow.split('(')[0]}
            </span>
          </div>
        </div>
      </div>

      {/* Active Location Spotlight Bar */}
      <ActiveLocationSpotlightBar />

      {/* 1. Regional Heat Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
            CURRENT PEAK TEMPERATURE
          </span>
          <span className="text-3xl sm:text-4xl font-black text-red-600">
            {summary.regionalHeatStatus.currentPeakTempC}°C
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Thermal departure above seasonal baseline
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
            HIGHEST HEAT INDEX
          </span>
          <span className="text-3xl sm:text-4xl font-black text-orange-600">
            {summary.regionalHeatStatus.highestIndexC}°C
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Physiological thermal stress feeling
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
            REGIONAL SEVERITY
          </span>
          <span className="text-3xl sm:text-4xl font-black text-slate-900">
            {summary.regionalHeatStatus.severity}
          </span>
          <p className="text-xs text-red-600 font-bold mt-1">
            Official Warning: {summary.regionalHeatStatus.tier.split(' ')[0]}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
            METEOROLOGICAL TREND
          </span>
          <span className="text-3xl sm:text-4xl font-black text-red-700">
            {summary.regionalHeatStatus.trend}
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Confidence: {summary.forecastConfidence.level} (IMD Convergence)
          </p>
        </div>
      </div>

      {/* 2. Near-Term Outlook (Hourly Progression Timeline - Phase 8) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              NEAR-TERM DIURNAL OUTLOOK TIMELINE (TODAY)
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {selectedRegion.weatherSource}
          </span>
        </div>

        {/* Hourly cards horizontal scroll */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 overflow-x-auto pb-1">
          {nearTermOutlook.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl text-center border transition-all ${
                item.status === 'Critical'
                  ? 'bg-red-50 border-red-200 text-red-950 font-bold'
                  : item.status === 'High'
                  ? 'bg-orange-50 border-orange-200 text-orange-950'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="text-[10px] text-slate-400 font-medium block">
                {item.time}
              </span>
              <span className="text-sm font-black block mt-1">
                {item.temp}°C
              </span>
              <span className="text-[10px] opacity-75 block">
                WBGT {item.wbgt}°
              </span>
              <span
                className={`inline-block mt-1 text-[8px] font-black px-1.5 py-0.5 rounded ${
                  item.status === 'Critical'
                    ? 'bg-red-600 text-white'
                    : item.status === 'High'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Affected Districts / Cities Breakdown */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
              AFFECTED DISTRICTS & SUB-ZONES
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Heat severity, Wet Bulb Globe Temperature (WBGT), and directional trends
            </p>
          </div>

          {/* District filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all ${
                  selectedDistrict === d
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'all' ? 'All Districts' : d}
              </button>
            ))}
          </div>
        </div>

        {/* Clean list of affected areas */}
        <div className="space-y-3">
          {filteredAreas.map((area) => {
            const isCurrentActive = selectedArea?.id === area.id;
            return (
              <div
                key={area.id}
                onClick={() => selectArea(area)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCurrentActive
                    ? 'bg-red-50/80 border-red-500 shadow-sm ring-1 ring-red-400'
                    : 'border-slate-200/80 hover:border-red-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 ${
                      area.heatRisk === 'Critical'
                        ? 'bg-red-600 animate-pulse'
                        : area.heatRisk === 'High'
                        ? 'bg-orange-500'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 leading-tight">
                        {area.name}
                      </h3>
                      {isCurrentActive && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 shadow-2xs">
                          <Radio className="w-2.5 h-2.5 animate-pulse" /> Active Choice
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {area.district} • {area.zone}
                    </p>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block">Air Temp</span>
                    <span className="font-black text-slate-900">{area.temperatureC}°C</span>
                  </div>

                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block">Wet Bulb</span>
                    <span className="font-black text-orange-600">{area.wbgtC}°C</span>
                  </div>

                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold block">Trend</span>
                    <span className="font-black text-red-600">{area.trend}</span>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl shadow-2xs ${
                      area.heatRisk === 'Critical'
                        ? 'bg-red-600 text-white'
                        : area.heatRisk === 'High'
                        ? 'bg-orange-500 text-white'
                        : 'bg-amber-400 text-amber-950'
                    }`}
                  >
                    {area.heatRisk}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectArea(area);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrentActive
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isCurrentActive ? 'Active' : 'Select'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectArea(area);
                      setActiveDisasterPage('high-risk-areas');
                    }}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-500 transition-colors"
                    title="Inspect Zone"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
