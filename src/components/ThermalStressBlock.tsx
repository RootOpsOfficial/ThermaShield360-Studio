import React, { useMemo } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { ArrowRight, ThermometerSun, MapPin } from 'lucide-react';
import { RiskLevel } from '../types.js';

interface ThermalStressBlockProps {
  isStandalone?: boolean;
}

export const ThermalStressBlock: React.FC<ThermalStressBlockProps> = () => {
  const {
    thermalCurrent,
    weatherCurrent,
    weatherHourly,
    formatTemp,
    setActivePage,
    location,
  } = useCitizen();

  // Core values with reliable defaults if telemetry is loading
  const overallLevel: RiskLevel = thermalCurrent?.overallLevel || 'High';
  const wbgt = thermalCurrent?.wbgt ?? 31.4;
  const utci = thermalCurrent?.utci ?? 39.8;
  const heatIndex = thermalCurrent?.heatIndex ?? 42.1;

  const temp = weatherCurrent?.temp ?? thermalCurrent?.ambientTemp ?? 38.6;
  const humidity = weatherCurrent?.humidity ?? thermalCurrent?.humidity ?? 38;
  const windSpeed = weatherCurrent?.windSpeed ?? thermalCurrent?.windSpeed ?? 9.2;
  const solarRad = weatherCurrent?.solarIrradiance ?? thermalCurrent?.solarRadiation ?? 840;

  // Level configuration for central status box
  const levelConfig = useMemo(() => {
    switch (overallLevel) {
      case 'Extreme':
        return {
          label: 'EXTREME',
          boxBorder: 'border-red-500',
          boxBg: 'bg-red-50/80',
          textClass: 'text-red-600',
          glow: 'from-red-500/10 to-transparent',
        };
      case 'High':
        return {
          label: 'HIGH',
          boxBorder: 'border-orange-500',
          boxBg: 'bg-orange-50/80',
          textClass: 'text-orange-600',
          glow: 'from-orange-500/10 to-transparent',
        };
      case 'Moderate':
        return {
          label: 'MODERATE',
          boxBorder: 'border-amber-400',
          boxBg: 'bg-amber-50/80',
          textClass: 'text-amber-600',
          glow: 'from-amber-500/10 to-transparent',
        };
      default:
        return {
          label: 'LOW',
          boxBorder: 'border-emerald-500',
          boxBg: 'bg-emerald-50/80',
          textClass: 'text-emerald-600',
          glow: 'from-emerald-500/10 to-transparent',
        };
    }
  }, [overallLevel]);

  // Indicator labels and colors
  const getIndicatorData = (val: number, type: 'wbgt' | 'utci' | 'hi') => {
    if (type === 'wbgt') {
      if (val >= 32.0) return { label: 'VERY HIGH', circleBg: 'bg-red-500', circleBorder: 'border-red-400', textColor: 'text-red-600' };
      if (val >= 29.0) return { label: 'HIGH', circleBg: 'bg-orange-500', circleBorder: 'border-orange-400', textColor: 'text-orange-600' };
      if (val >= 26.0) return { label: 'MODERATE', circleBg: 'bg-amber-400', circleBorder: 'border-amber-300', textColor: 'text-amber-600' };
      return { label: 'LOW', circleBg: 'bg-emerald-500', circleBorder: 'border-emerald-400', textColor: 'text-emerald-600' };
    }
    if (type === 'utci') {
      if (val >= 38.0) return { label: 'VERY HIGH', circleBg: 'bg-red-500', circleBorder: 'border-red-400', textColor: 'text-red-600' };
      if (val >= 32.0) return { label: 'HIGH', circleBg: 'bg-orange-500', circleBorder: 'border-orange-400', textColor: 'text-orange-600' };
      if (val >= 28.0) return { label: 'MODERATE', circleBg: 'bg-amber-400', circleBorder: 'border-amber-300', textColor: 'text-amber-600' };
      return { label: 'LOW', circleBg: 'bg-emerald-500', circleBorder: 'border-emerald-400', textColor: 'text-emerald-600' };
    }
    // Heat Index
    if (val >= 41.0) return { label: 'VERY HIGH', circleBg: 'bg-red-500', circleBorder: 'border-red-400', textColor: 'text-red-600' };
    if (val >= 38.0) return { label: 'HIGH', circleBg: 'bg-orange-500', circleBorder: 'border-orange-400', textColor: 'text-orange-600' };
    if (val >= 32.0) return { label: 'MODERATE', circleBg: 'bg-amber-400', circleBorder: 'border-amber-300', textColor: 'text-amber-600' };
    return { label: 'LOW', circleBg: 'bg-emerald-500', circleBorder: 'border-emerald-400', textColor: 'text-emerald-600' };
  };

  const wbgtData = getIndicatorData(wbgt, 'wbgt');
  const utciData = getIndicatorData(utci, 'utci');
  const hiData = getIndicatorData(heatIndex, 'hi');

  // Solar descriptor
  const solarText = solarRad >= 750 ? 'HIGH' : solarRad >= 450 ? 'MODERATE' : 'LOW';

  // Hourly timeline points with exact color chain requested:
  // green (6AM) -> light green (8AM) -> light orange (10AM) -> orange (12PM) -> red (2PM) -> light red (4PM) -> orange (6PM) -> light orange (8PM) -> green (10PM)
  const timelinePoints = useMemo(() => {
    return [
      { label: '6AM', hour: 6, nodeColor: 'bg-emerald-500', colorName: 'green' },
      { label: '8AM', hour: 8, nodeColor: 'bg-lime-500', colorName: 'light green' },
      { label: '10AM', hour: 10, nodeColor: 'bg-amber-400', colorName: 'light orange' },
      { label: '12PM', hour: 12, nodeColor: 'bg-orange-500', colorName: 'orange' },
      { label: '2PM', hour: 14, nodeColor: 'bg-red-600', colorName: 'red' },
      { label: '4PM', hour: 16, nodeColor: 'bg-rose-400', colorName: 'light red' },
      { label: '6PM', hour: 18, nodeColor: 'bg-orange-500', colorName: 'orange' },
      { label: '8PM', hour: 20, nodeColor: 'bg-amber-300', colorName: 'light orange' },
      { label: '10PM', hour: 22, nodeColor: 'bg-emerald-500', colorName: 'green' },
    ];
  }, []);

  const peakPeriodText = thermalCurrent?.peakPeriod || '1 PM – 5 PM';

  return (
    <section
      aria-label="Thermal Stress Block"
      className="apple-card relative overflow-hidden rounded-3xl sm:rounded-[2rem] border border-slate-200/90 bg-white/95 shadow-md p-6 sm:p-8 backdrop-blur-xl space-y-6 text-slate-900 transition-all duration-300"
    >
      {/* Top subtle ambient glow */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-40 bg-gradient-to-b ${levelConfig.glow} rounded-full blur-3xl pointer-events-none`}
      />

      <div className="relative z-10 space-y-6 sm:space-y-7">
        {/* ========================================================================= */}
        {/* HEADER: ICON + "THERMAL STRESS" + LOCATION BELOW                         */}
        {/* ========================================================================= */}
        <div className="text-center pt-1 space-y-1">
          <div className="inline-flex items-center justify-center gap-2.5">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs shrink-0">
              <ThermometerSun className="w-5 h-5" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-wider uppercase">
              THERMAL STRESS
            </h2>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{location?.ward?.name || 'Selected Location'}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTRAL STATUS: ROUNDED BOX WITH STATUS LEVEL & TEMPERATURE               */}
        {/* ========================================================================= */}
        <div className="flex justify-center">
          <div
            className={`px-8 sm:px-12 py-4 sm:py-5 rounded-2xl border-2 ${levelConfig.boxBorder} ${levelConfig.boxBg} text-center shadow-xs min-w-[200px] sm:min-w-[240px]`}
          >
            <span
              className={`text-sm sm:text-base font-black tracking-widest uppercase block ${levelConfig.textClass}`}
            >
              {levelConfig.label}
            </span>
            <span className="text-3xl sm:text-4xl font-black text-slate-950 block mt-1 tracking-tight">
              {formatTemp(temp)}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* THREE MAIN THERMAL INDICATORS: WBGT, UTCI, HEAT INDEX                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 py-2 border-y border-slate-100 text-center">
          {/* WBGT */}
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 block">
              WBGT
            </span>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 ${wbgtData.circleBorder} ${wbgtData.circleBg} shrink-0`} />
              <span className="text-base sm:text-xl font-black text-slate-900">
                {wbgt.toFixed(1)}°C
              </span>
            </div>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider block ${wbgtData.textColor}`}>
              {wbgtData.label}
            </span>
          </div>

          {/* UTCI */}
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 block">
              UTCI
            </span>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 ${utciData.circleBorder} ${utciData.circleBg} shrink-0`} />
              <span className="text-base sm:text-xl font-black text-slate-900">
                {utci.toFixed(1)}°C
              </span>
            </div>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider block ${utciData.textColor}`}>
              {utciData.label}
            </span>
          </div>

          {/* HEAT INDEX */}
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 block">
              HEAT INDEX
            </span>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <span className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 ${hiData.circleBorder} ${hiData.circleBg} shrink-0`} />
              <span className="text-base sm:text-xl font-black text-slate-900">
                {heatIndex.toFixed(1)}°C
              </span>
            </div>
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider block ${hiData.textColor}`}>
              {hiData.label}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ENVIRONMENTAL DRIVERS: TEMPERATURE, HUMIDITY, WIND, SOLAR                */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center bg-slate-50/90 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-0.5">
              <span>🌡</span>
              <span>Temperature</span>
            </div>
            <span className="text-base sm:text-lg font-black text-slate-950">
              {formatTemp(temp)}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-0.5">
              <span>💧</span>
              <span>Humidity</span>
            </div>
            <span className="text-base sm:text-lg font-black text-slate-950">
              {Math.round(humidity)}%
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-0.5">
              <span>💨</span>
              <span>Wind</span>
            </div>
            <span className="text-base sm:text-lg font-black text-slate-950">
              {windSpeed.toFixed(1)}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-0.5">
              <span>☀</span>
              <span>Solar</span>
            </div>
            <span className="text-base sm:text-lg font-black text-orange-600">
              {solarText}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HOURLY STRESS: CONNECTED DOT TIMELINE                                     */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-1">
          <div className="text-center">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 block">
              HOURLY STRESS
            </span>
          </div>

          {/* Timeline Nodes & Connecting Chain Bar */}
          <div className="relative max-w-2xl mx-auto px-2 sm:px-4 py-2">
            {/* Connecting Chain Line with Dynamic Color Gradient: Green -> Light Green -> Light Orange -> Orange -> Red -> Light Red -> Orange -> Light Orange -> Green */}
            <div
              className="absolute top-1/2 left-6 right-6 -translate-y-2.5 h-1.5 sm:h-2 rounded-full z-0 shadow-xs"
              style={{
                background:
                  'linear-gradient(to right, #10B981 0%, #84CC16 12.5%, #FBBF24 25%, #F97316 37.5%, #EF4444 50%, #FB7185 62.5%, #F97316 75%, #FCD34D 87.5%, #10B981 100%)',
              }}
            />

            {/* Nodes and Labels */}
            <div className="relative z-10 flex items-center justify-between">
              {timelinePoints.map((pt, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  {/* Colored Circle Node */}
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${pt.nodeColor} ring-3 sm:ring-4 ring-white shadow-xs flex items-center justify-center`}
                  />
                  {/* Time text below */}
                  <span className="text-[9px] sm:text-xs font-extrabold text-slate-600 mt-2">
                    {pt.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PEAK STRESS CALLOUT                                                       */}
        {/* ========================================================================= */}
        <div className="text-center">
          <div className="inline-block px-5 py-2 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-900 font-black text-xs sm:text-sm tracking-wide shadow-2xs">
            PEAK STRESS: {peakPeriodText}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HUMAN MEANING: WHAT THIS MEANS FOR YOU                                    */}
        {/* ========================================================================= */}
        <div className="space-y-1 text-left pt-1">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide">
            What this means for you
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            {overallLevel === 'Extreme'
              ? 'Extreme heat strain is expected. Core body temperature rises rapidly without active cooling and shade.'
              : overallLevel === 'High'
              ? 'Very high heat strain is expected during peak afternoon.'
              : overallLevel === 'Moderate'
              ? 'Moderate heat strain is expected during peak afternoon hours.'
              : 'Low thermal load. Standard outdoor activities are comfortable.'}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* ACTION: WHAT TO DO NOW                                                    */}
        {/* ========================================================================= */}
        <div className="space-y-1 text-left">
          <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
            WHAT TO DO NOW
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
            Avoid prolonged outdoor exposure • Hydrate • Use cooling
          </p>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM: [View Adaptive Response] BUTTON & LIVE / MODELLED STATUS          */}
        {/* ========================================================================= */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="w-full sm:w-auto flex justify-center sm:justify-start">
            <button
              onClick={() => setActivePage('adaptive')}
              className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>View Adaptive Response</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 self-center sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE / MODELLED</span>
          </div>
        </div>
      </div>
    </section>
  );
};
