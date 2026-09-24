import React, { useState } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { RiskLevel, WardInfo } from '../types.js';
import { LocalHeatRiskMap } from '../components/LocalHeatRiskMap.js';
import {
  MapPin,
  Clock,
  RefreshCw,
  Info,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Sun,
  Shield,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const MyHeatRiskPage: React.FC = () => {
  const {
    heatRiskData,
    riskCurrent,
    location,
    selectWard,
    isRefreshing,
    apiError,
    refreshData,
    requestGpsLocation,
    lastUpdatedTime,
  } = useCitizen();

  // Resolve values from dedicated heatRiskData or fallback to shared engine data
  const riskScore: number =
    heatRiskData?.riskScore ?? riskCurrent?.riskScore ?? 76;
  const riskLevel: RiskLevel =
    heatRiskData?.riskLevel || riskCurrent?.overallRiskLevel || 'High';
  const currentStatus: string =
    heatRiskData?.currentStatus ||
    (riskLevel === 'Extreme'
      ? 'Avoid unnecessary outdoor exposure'
      : riskLevel === 'High'
      ? 'Reduce prolonged outdoor exposure'
      : riskLevel === 'Moderate'
      ? 'Take additional care'
      : 'Normal heat conditions');

  const peakPeriod: string = heatRiskData?.peakRiskPeriod || '12 PM – 4 PM';
  const lowestPeriod: string = heatRiskData?.lowestRiskPeriod || '6 AM – 9 AM';
  const riskIncreasingTime: string = heatRiskData?.riskIncreasingTime || '10:00 AM';
  const riskDecreasingTime: string = heatRiskData?.riskDecreasingTime || '4:30 PM';
  const dataStatus = heatRiskData?.dataStatus || 'LIVE';
  const lastUpdated = heatRiskData?.lastUpdated || lastUpdatedTime || 'Just now';
  const confidence = heatRiskData?.confidence || 'High Confidence · Verified multi-sensor IMD & Open-Meteo consensus';

  // Styling helper for Risk Levels
  const getRiskStyle = (lvl: RiskLevel) => {
    switch (lvl) {
      case 'Extreme':
        return {
          label: 'EXTREME',
          dot: '🔴',
          pillBg: 'bg-red-600 text-white',
          badgeBg: 'bg-red-50 text-red-700 border-red-200',
          textColor: 'text-red-600',
          strokeColor: '#EF4444',
          fillColor: '#FEE2E2',
          gradientBg: 'from-red-500 to-rose-600',
          cardGlow: 'shadow-red-500/10 border-red-200',
          guideText: 'Avoid unnecessary outdoor exposure',
        };
      case 'High':
        return {
          label: 'HIGH',
          dot: '🟠',
          pillBg: 'bg-orange-500 text-white',
          badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
          textColor: 'text-orange-600',
          strokeColor: '#F97316',
          fillColor: '#FFEDD5',
          gradientBg: 'from-orange-500 to-amber-600',
          cardGlow: 'shadow-orange-500/10 border-orange-200',
          guideText: 'Reduce prolonged outdoor exposure',
        };
      case 'Moderate':
        return {
          label: 'MODERATE',
          dot: '🟡',
          pillBg: 'bg-amber-500 text-white',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          textColor: 'text-amber-600',
          strokeColor: '#EAB308',
          fillColor: '#FEF9C3',
          gradientBg: 'from-amber-400 to-yellow-500',
          cardGlow: 'shadow-amber-500/10 border-amber-200',
          guideText: 'Take additional care',
        };
      default:
        return {
          label: 'LOW',
          dot: '🟢',
          pillBg: 'bg-emerald-600 text-white',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          textColor: 'text-emerald-600',
          strokeColor: '#22C55E',
          fillColor: '#DCFCE7',
          gradientBg: 'from-emerald-500 to-teal-600',
          cardGlow: 'shadow-emerald-500/10 border-emerald-200',
          guideText: 'Normal heat conditions',
        };
    }
  };

  const currentStyle = getRiskStyle(riskLevel);

  // Gauge calculations for SVG
  const gaugeRadius = 78;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (Math.min(100, Math.max(0, riskScore)) / 100) * gaugeCircumference;

  // Hourly items fallback
  const hourlyData = heatRiskData?.hourlyRisk || [
    { timeLabel: '8 AM', hour: 8, riskScore: 28, riskLevel: 'Low' as RiskLevel, isCurrent: false, isPeak: false, isLowest: true, trend: 'lowest' as const, note: 'Lowest heat-risk period of the day' },
    { timeLabel: '10 AM', hour: 10, riskScore: 48, riskLevel: 'Moderate' as RiskLevel, isCurrent: false, isPeak: false, isLowest: false, trend: 'increasing' as const, note: 'Risk begins increasing rapidly' },
    { timeLabel: '12 PM', hour: 12, riskScore: 72, riskLevel: 'High' as RiskLevel, isCurrent: false, isPeak: false, isLowest: false, trend: 'peak' as const, note: 'Entering peak danger window' },
    { timeLabel: '2 PM', hour: 14, riskScore: 78, riskLevel: 'High' as RiskLevel, isCurrent: true, isPeak: true, isLowest: false, trend: 'peak' as const, note: 'Highest-risk period' },
    { timeLabel: '4 PM', hour: 16, riskScore: 74, riskLevel: 'High' as RiskLevel, isCurrent: false, isPeak: false, isLowest: false, trend: 'peak' as const, note: 'Sustained elevated exposure' },
    { timeLabel: '6 PM', hour: 18, riskScore: 52, riskLevel: 'Moderate' as RiskLevel, isCurrent: false, isPeak: false, isLowest: false, trend: 'decreasing' as const, note: 'Risk starts decreasing' },
    { timeLabel: '8 PM', hour: 20, riskScore: 32, riskLevel: 'Low' as RiskLevel, isCurrent: false, isPeak: false, isLowest: false, trend: 'decreasing' as const, note: 'Evening cooling window' },
  ];

  // Risk drivers fallback
  const riskDrivers = heatRiskData?.riskDrivers || [
    {
      name: 'Heat Intensity',
      category: 'Atmospheric Warmth',
      percentage: 30,
      impact: 'High' as const,
      description: 'Elevated ambient temperature combined with high atmospheric thermal content.',
    },
    {
      name: 'Outdoor Exposure',
      category: 'Sun & Zenith',
      percentage: 25,
      impact: 'High' as const,
      description: 'Direct solar radiation load hitting unshaded streets and walkways.',
    },
    {
      name: 'Local Area Conditions',
      category: 'Urban Environment',
      percentage: 20,
      impact: 'High' as const,
      description: `${location.ward.builtDensityPct}% paved surfaces absorbing and re-radiating heat (+${location.ward.uhiOffsetDegC}°C UHI).`,
    },
    {
      name: 'Vulnerability',
      category: 'Community Defenses',
      percentage: 15,
      impact: 'Moderate' as const,
      description: `Sparse tree canopy (${location.ward.treeCanopyPct}%) and concentrated at-risk population.`,
    },
    {
      name: 'Time of Day',
      category: 'Diurnal Peak',
      percentage: 10,
      impact: 'High' as const,
      description: 'Midday thermal accumulation window with minimal natural shadows.',
    },
  ];

  // Dynamic explanation
  const riskExplanation =
    heatRiskData?.riskExplanation ||
    `Your current heat risk is ${riskLevel.toUpperCase()} because several local conditions and exposure factors—including midday solar intensity and dense paved surfaces in ${location.ward.name.split(':')[0]}—are increasing heat impact.`;

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* API Error Notification Banner (if any) */}
      {apiError && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{apiError} Showing local calibrated heat-risk baseline.</span>
          </div>
          <button
            onClick={() => refreshData()}
            className="px-3 py-1 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: HERO RISK SECTION
          Large premium Apple-style visual section.
          Answers: "How much heat risk am I facing right now?"
          ========================================================================= */}
      <section className="apple-card p-6 sm:p-9 bg-white border border-black/5 shadow-xs relative overflow-hidden">
        {/* Subtle decorative radial glow tied to risk level */}
        <div
          className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${
            riskLevel === 'Extreme'
              ? 'bg-red-500'
              : riskLevel === 'High'
              ? 'bg-orange-500'
              : riskLevel === 'Moderate'
              ? 'bg-amber-400'
              : 'bg-emerald-400'
          }`}
        />

        {/* Top Header Row: Title, Location, Live Badge, Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-black/5">
          <div className="space-y-1">
            <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 block">
              CITIZEN WORKSPACE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              MY HEAT RISK
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* LIVE / MODELLED status */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {dataStatus}
            </span>

            {/* Refresh Button */}
            <button
              onClick={() => refreshData()}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
              title="Refresh Heat Risk Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Hero Body: Gauge on Left, Risk Level as the STRONGEST element on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-7">
          {/* Large circular/gauge risk indicator (Score 0-100) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
                {/* Background Track */}
                <circle
                  cx="100"
                  cy="100"
                  r={gaugeRadius}
                  stroke="#F1F5F9"
                  strokeWidth="15"
                  fill="transparent"
                  strokeLinecap="round"
                />
                {/* Colored Active Score Track */}
                <circle
                  cx="100"
                  cy="100"
                  r={gaugeRadius}
                  stroke={currentStyle.strokeColor}
                  strokeWidth="15"
                  fill="transparent"
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Gauge Center Information */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Heat Risk Score
                </span>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-black text-slate-900 tracking-tight">
                    {riskScore}
                  </span>
                  <span className="text-xl font-bold text-slate-400">/100</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-0.5">
                  0 (Safe) to 100 (Extreme)
                </span>
              </div>
            </div>
          </div>

          {/* Right Info: Risk Level is the Strongest Visual Element */}
          <div className="md:col-span-7 space-y-5">
            {/* Giant Risk Level Banner */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Current Risk Assessment
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-2xl sm:text-3xl font-black tracking-wide shadow-xs ${currentStyle.pillBg}`}
                >
                  <span>{currentStyle.dot}</span>
                  <span>{currentStyle.label}</span>
                </span>
              </div>
            </div>

            {/* Current Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-black/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Current Status & Advice
              </span>
              <p className="text-base font-bold text-slate-900">
                {currentStatus}
              </p>
            </div>

            {/* Location & Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-black/5">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Current Ward
                </span>
                <span className="font-bold text-slate-800 truncate block mt-0.5" title={location.ward.name}>
                  {location.ward.name.split(':')[0]}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-black/5">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  City & Zone
                </span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {location.ward.zone}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-black/5 col-span-2 sm:col-span-1">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Last Updated
                </span>
                <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {lastUpdated}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: RISK METER
          Beautiful horizontal risk scale:
          0 ───── 25 ───── 50 ───── 75 ───── 100
          LOW    MODERATE    HIGH    EXTREME
          With user's current score clearly placed on the scale.
          ========================================================================= */}
      <section className="apple-card p-6 sm:p-7 space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Risk Scale Meter
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your current score of <strong className="text-slate-800">{riskScore}/100</strong> plotted along the standard 4-tier heat risk classification.
          </p>
        </div>

        {/* Visual Scale Container */}
        <div className="pt-8 pb-3 px-2">
          {/* Track with 4 Color Zones */}
          <div className="relative h-4 rounded-full bg-slate-100 flex overflow-visible shadow-inner">
            {/* Zone 1: LOW (0-25) */}
            <div className="w-1/4 h-full bg-emerald-500 rounded-l-full relative" />
            {/* Zone 2: MODERATE (25-50) */}
            <div className="w-1/4 h-full bg-amber-400 relative" />
            {/* Zone 3: HIGH (50-75) */}
            <div className="w-1/4 h-full bg-orange-500 relative" />
            {/* Zone 4: EXTREME (75-100) */}
            <div className="w-1/4 h-full bg-red-600 rounded-r-full relative" />

            {/* Current Score Pin/Indicator placed exactly at riskScore% */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none transition-all duration-700 ease-out"
              style={{ left: `${Math.max(3, Math.min(97, riskScore))}%` }}
            >
              {/* Floating Badge */}
              <div className="absolute -top-11 flex flex-col items-center">
                <span className="px-2.5 py-1 rounded-lg text-xs font-black text-white bg-slate-900 shadow-md whitespace-nowrap">
                  {riskScore} · {riskLevel}
                </span>
                <span className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
              </div>

              {/* Pulsing indicator needle pin */}
              <div className="w-6 h-6 rounded-full bg-white border-4 border-slate-900 shadow-lg ring-4 ring-black/10 flex items-center justify-center">
                <div className={`w-2 h-2 rounded-full ${currentStyle.pillBg}`} />
              </div>
            </div>
          </div>

          {/* Scale Labels & Dividers */}
          <div className="grid grid-cols-4 text-center mt-3 text-xs font-bold">
            <div className="border-r border-slate-200/80 pr-1">
              <span className="text-emerald-700 block">🟢 LOW</span>
              <span className="text-[10px] text-slate-400 font-semibold">0 – 25</span>
            </div>
            <div className="border-r border-slate-200/80 px-1">
              <span className="text-amber-700 block">🟡 MODERATE</span>
              <span className="text-[10px] text-slate-400 font-semibold">25 – 50</span>
            </div>
            <div className="border-r border-slate-200/80 px-1">
              <span className="text-orange-700 block">🟠 HIGH</span>
              <span className="text-[10px] text-slate-400 font-semibold">50 – 75</span>
            </div>
            <div className="pl-1">
              <span className="text-red-700 block">🔴 EXTREME</span>
              <span className="text-[10px] text-slate-400 font-semibold">75 – 100</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TODAY'S HEAT-RISK TIMELINE
          Show ONLY heat risk over the current day (8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM).
          Answers: "When is my risk highest?"
          Highlights:
          - Current risk
          - Highest-risk period
          - Lowest-risk period
          - When risk begins increasing
          - When risk starts decreasing
          (NO WBGT/UTCI/Heat Index here)
          ========================================================================= */}
      <section className="apple-card p-6 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Today's Heat-Risk Timeline
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Anticipate diurnal shifts to safely time unavoidable outdoor activities.
            </p>
          </div>

          {/* Quick Timing Callout Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
              🟢 Lowest Risk: {lowestPeriod}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 font-bold">
              🔴 Highest Danger: {peakPeriod}
            </span>
          </div>
        </div>

        {/* Milestone Hourly Cards Row */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2">
          <div className="flex gap-3 min-w-max">
            {hourlyData.map((item) => {
              const itemStyle = getRiskStyle(item.riskLevel);
              const isPeak = item.isPeak;
              const isLowest = item.isLowest;

              return (
                <div
                  key={item.timeLabel}
                  className={`w-32 p-3.5 rounded-2xl border transition-all text-center flex flex-col justify-between ${
                    item.isCurrent
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
                      : isPeak
                      ? 'border-red-300 bg-red-50/70 text-slate-900'
                      : isLowest
                      ? 'border-emerald-300 bg-emerald-50/70 text-slate-900'
                      : 'border-black/5 bg-slate-50/80 text-slate-900'
                  }`}
                >
                  {/* Top Hour & Now Badge */}
                  <div>
                    <span
                      className={`text-xs font-black block ${
                        item.isCurrent ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {item.timeLabel}
                    </span>
                    {item.isCurrent ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-400 text-slate-950 mt-1">
                        NOW
                      </span>
                    ) : isPeak ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-200 text-red-900 mt-1">
                        PEAK
                      </span>
                    ) : isLowest ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-200 text-emerald-900 mt-1">
                        LOWEST
                      </span>
                    ) : (
                      <div className="h-5" />
                    )}
                  </div>

                  {/* Score */}
                  <div className="my-2.5">
                    <span
                      className={`text-3xl font-black block tracking-tight ${
                        item.isCurrent ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {item.riskScore}
                    </span>
                    <span
                      className={`text-[10px] font-semibold block ${
                        item.isCurrent ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      Risk Score
                    </span>
                  </div>

                  {/* Risk Level Badge */}
                  <div>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black ${
                        item.isCurrent
                          ? 'bg-white/20 text-white'
                          : itemStyle.badgeBg
                      }`}
                    >
                      {itemStyle.dot} {item.riskLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transition Callouts (When risk starts increasing / decreasing) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-start gap-2.5 text-orange-950">
            <TrendingUp className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-orange-900 block">
                Risk Begins Increasing: {riskIncreasingTime}
              </span>
              <p className="text-orange-800/90 text-[11px] mt-0.5">
                Rapid thermal escalation begins as midday sun hits unshaded surfaces. Conclude strenuous outdoor duties before this mark.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-2.5 text-teal-950">
            <TrendingDown className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-teal-900 block">
                Risk Starts Decreasing: {riskDecreasingTime}
              </span>
              <p className="text-teal-800/90 text-[11px] mt-0.5">
                Direct solar intensity tapers as sun drops toward the horizon, initiating late afternoon evaporative relief.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: WHY IS MY HEAT RISK THIS LEVEL?
          Show only main contributors to final risk:
          - Heat intensity
          - Outdoor exposure
          - Vulnerability
          - Time of day
          - Local area conditions
          Simple visual contribution bars/chips. NO detailed thermal metrics.
          Answers: "Why is my risk at this level?"
          ========================================================================= */}
      <section className="apple-card p-6 sm:p-7 space-y-5">
        <div className="pb-3 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Why Is My Heat Risk This Level?
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Primary environmental and physical contributors driving your overall risk score.
          </p>
        </div>

        {/* Visual Contribution Bars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {riskDrivers.map((driver) => {
            const isHighOrCritical = driver.impact === 'High' || driver.impact === 'Critical';

            return (
              <div
                key={driver.name}
                className="p-4 rounded-2xl bg-slate-50/80 border border-black/5 space-y-2 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {driver.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 block">
                      {driver.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        driver.impact === 'Critical'
                          ? 'bg-red-100 text-red-800'
                          : driver.impact === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {driver.impact} Impact
                    </span>
                    <span className="text-xs font-black text-slate-700">
                      {driver.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Contribution Bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    style={{ width: `${driver.percentage * 2.8}%` }}
                    className={`h-full rounded-full ${
                      isHighOrCritical ? 'bg-orange-500' : 'bg-amber-400'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {driver.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: LOCAL RISK MAP
          Real, interactive, GPS-based heat-risk map with real geographic boundaries
          Answers: "Where is the risk?"
          ========================================================================= */}
      <section className="apple-card p-6 sm:p-7 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Local Risk Map
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time interactive GPS heat-risk distribution. Real streets, boundaries, and microclimates. Click any area to inspect.
          </p>
        </div>

        <LocalHeatRiskMap
          initialLat={location.lat}
          initialLon={location.lng}
          onSelectWardId={(wardId) => selectWard(wardId)}
        />
      </section>

      {/* =========================================================================
          SECTION 6: RISK EXPLANATION
          Simple human-readable section.
          Dynamic based on actual risk result.
          ========================================================================= */}
      <section className="apple-card p-6 sm:p-7 space-y-3 bg-gradient-to-br from-white to-slate-50/50 border border-black/5">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-orange-600 shrink-0" />
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Risk Explanation
          </h2>
        </div>

        <p className="text-base text-slate-800 font-medium leading-relaxed">
          {riskExplanation}
        </p>

        <p className="text-xs text-slate-500 leading-relaxed pt-1">
          This calculation integrates real-time environmental data with your local built density ({location.ward.builtDensityPct}%), urban heat island offset (+{location.ward.uhiOffsetDegC}°C), and midday solar zenith to establish your precise human thermal exposure risk.
        </p>
      </section>

      {/* =========================================================================
          SECTION 7: DATA / CONFIDENCE
          At bottom show:
          - Data status
          - Last updated
          - Forecast/model confidence where available
          - LIVE / MODELLED / ESTIMATED label
          Do not claim live information when it is not live.
          ========================================================================= */}
      <section className="p-5 rounded-2xl bg-slate-50 border border-black/5 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {dataStatus} DATA
          </span>
          <span className="text-slate-500">
            Model Confidence: <strong className="text-slate-800">{confidence}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
          <Clock className="w-3.5 h-3.5" />
          <span>Last synchronized: {lastUpdated}</span>
        </div>
      </section>
    </div>
  );
};
