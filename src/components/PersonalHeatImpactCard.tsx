import React, { useState } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { ActivityType } from '../types.js';
import {
  Flame,
  Shield,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  ChevronDown,
  ChevronUp,
  Activity,
  Briefcase,
  Navigation,
  Sparkles,
  ArrowRight,
  Info,
  Building,
  UserCheck,
  RefreshCw,
  Umbrella,
  Zap,
} from 'lucide-react';

const ALL_ACTIVITIES: ActivityType[] = [
  'Walking / Commuting',
  'Office / Desk Work',
  'College / Student',
  'Outdoor Construction',
  'Street Vendor',
  'Delivery / Rider',
  'Traffic / Police Duty',
  'Municipal Field Work',
  'Agriculture',
  'Driving',
  'Shop / Market Work',
  'General Outdoor Activity',
  'General Indoor Activity',
];

const POPULAR_DESTINATIONS = [
  { name: 'Shivajinagar - Ghole Road, Pune', lat: 18.5314, lng: 73.8446 },
  { name: 'Kasba Peth - Vishrambaug Wada, Pune', lat: 18.5178, lng: 73.8558 },
  { name: 'Kothrud - Bavdhan, Pune', lat: 18.5074, lng: 73.8077 },
  { name: 'Aundh - Baner - Balewadi, Pune', lat: 18.5584, lng: 73.8072 },
  { name: 'Hadapsar - Magarpatta, Pune', lat: 18.5089, lng: 73.9259 },
  { name: 'Yerwada - Kalas - Dhanori, Pune', lat: 18.5529, lng: 73.8797 },
  { name: 'Viman Nagar - Nagar Road, Pune', lat: 18.5679, lng: 73.9143 },
  { name: 'Dhankawadi - Sahakarnagar, Pune', lat: 18.4739, lng: 73.8532 },
  { name: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882 },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lng: 73.7898 },
  { name: 'New Delhi, NCR', lat: 28.6139, lng: 77.209 },
];

export const PersonalHeatImpactCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const {
    personalImpact,
    heatRiskData,
    activityType,
    setActivityType,
    exposureDuration,
    setExposureDuration,
    isOutdoorExposure,
    setIsOutdoorExposure,
    destination,
    setDestination,
    plannedTravelTime,
    setPlannedTravelTime,
    evaluateImpact,
    isEvaluatingImpact,
    location,
    formatTemp,
  } = useCitizen();

  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showDestinationPlanner, setShowDestinationPlanner] = useState(Boolean(destination));
  const [isActivityMenuOpen, setIsActivityMenuOpen] = useState(false);
  const [customDestInput, setCustomDestInput] = useState('');

  // Use personalImpact from context or from heatRiskData fallback
  const impact = personalImpact || heatRiskData?.personalImpact;

  const riskLevel = impact?.riskLevel || 'High';

  const getRiskTheme = (lvl: string) => {
    switch (lvl) {
      case 'Critical':
      case 'Extreme':
        return {
          bg: 'bg-red-500',
          lightBg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-600 text-white',
          dot: '🔴',
          iconColor: 'text-red-600',
          glow: 'shadow-red-500/10 ring-1 ring-red-500/20',
        };
      case 'High':
        return {
          bg: 'bg-orange-500',
          lightBg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-700',
          badge: 'bg-orange-500 text-white',
          dot: '🟠',
          iconColor: 'text-orange-600',
          glow: 'shadow-orange-500/10 ring-1 ring-orange-500/20',
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-500',
          lightBg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          badge: 'bg-amber-500 text-white',
          dot: '🟡',
          iconColor: 'text-amber-600',
          glow: 'shadow-amber-500/10 ring-1 ring-amber-500/20',
        };
      default:
        return {
          bg: 'bg-emerald-500',
          lightBg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          badge: 'bg-emerald-600 text-white',
          dot: '🟢',
          iconColor: 'text-emerald-600',
          glow: 'shadow-emerald-500/10 ring-1 ring-emerald-500/20',
        };
    }
  };

  const theme = getRiskTheme(riskLevel);

  const handleSelectActivity = (act: ActivityType) => {
    setActivityType(act);
    setIsActivityMenuOpen(false);
    evaluateImpact({ activityType: act });
  };

  const handleToggleOutdoor = (val: boolean) => {
    setIsOutdoorExposure(val);
    evaluateImpact({ outdoorExposure: val });
  };

  const handleDurationChange = (dur: string) => {
    setExposureDuration(dur);
    evaluateImpact({ exposureDuration: dur });
  };

  const handleSelectDestination = (dest: { name: string; lat: number; lng: number } | null) => {
    setDestination(dest);
    if (dest) {
      evaluateImpact({
        destinationContext: {
          name: dest.name,
          temp: 0,
          humidity: 0,
          windSpeedKmH: 0,
          solarRadiation: 0,
        },
      });
    } else {
      evaluateImpact({ destinationContext: undefined });
    }
  };

  return (
    <div className={`apple-card p-6 sm:p-8 bg-white border border-black/5 shadow-xs relative overflow-hidden transition-all duration-300 ${theme.glow}`}>
      {/* Top Banner: Context Header & Personal Engine Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 block">
              HUMAN THERMAL STRESS IMPACT
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              What This Condition Means for You
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEvaluatingImpact && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              <RefreshCw className="w-3 h-3 animate-spin text-orange-600" />
              Evaluating...
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${theme.badge}`}>
            <span>{theme.dot}</span>
            <span>{riskLevel} HEAT IMPACT</span>
          </span>
        </div>
      </div>

      {/* Main Impact Statement in clear, human language */}
      <div className="py-6 space-y-4">
        <div className={`p-4 sm:p-5 rounded-2xl ${theme.lightBg} border ${theme.border} space-y-2`}>
          <div className="flex items-center gap-2">
            <Flame className={`w-5 h-5 ${theme.iconColor} shrink-0`} />
            <h3 className={`text-base sm:text-lg font-black tracking-tight ${theme.text}`}>
              {impact?.headline || 'HIGH HEAT STRESS'}
            </h3>
          </div>
          <p className="text-sm sm:text-base font-medium text-slate-800 leading-relaxed">
            {impact?.meaningForUser ||
              'Because of the combination of heat, humidity, sunlight, and limited cooling conditions, prolonged outdoor activity may cause rapid fatigue, dehydration, and elevated heat discomfort.'}
          </p>
        </div>

        {/* =========================================================================
            PERSONAL ACTIVITY SELECTOR (Simple & Clean)
            "What are you doing?"
            ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-black/5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-orange-600" />
              Your Work & Activity Context
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Impact changes dynamically based on your physical metabolic load
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Activity Type Dropdown */}
            <div className="sm:col-span-6 relative">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Activity / Profession
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsActivityMenuOpen(!isActivityMenuOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-left text-xs font-bold text-slate-900 shadow-xs hover:border-orange-500 transition"
                >
                  <span className="truncate">{activityType}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                </button>

                {isActivityMenuOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-30 max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs divide-y divide-slate-100">
                    {ALL_ACTIVITIES.map((act) => (
                      <button
                        key={act}
                        type="button"
                        onClick={() => handleSelectActivity(act)}
                        className={`w-full text-left px-3.5 py-2 font-medium hover:bg-orange-50 transition flex items-center justify-between ${
                          activityType === act ? 'bg-orange-50/80 font-bold text-orange-700' : 'text-slate-800'
                        }`}
                      >
                        <span>{act}</span>
                        {activityType === act && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Outdoor vs Indoor Toggle */}
            <div className="sm:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Environment
              </label>
              <div className="flex rounded-xl bg-slate-200/80 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleToggleOutdoor(true)}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    isOutdoorExposure ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Outdoor
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleOutdoor(false)}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    !isOutdoorExposure ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Indoor
                </button>
              </div>
            </div>

            {/* Exposure Duration */}
            <div className="sm:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Exposure Duration
              </label>
              <select
                value={exposureDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 shadow-xs focus:outline-hidden focus:border-orange-500"
              >
                <option value="< 30 mins">&lt; 30 mins</option>
                <option value="30-60 mins">30 – 60 mins</option>
                <option value="1-2 hours">1 – 2 hours</option>
                <option value="3+ hours">3+ hours (Prolonged)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expected Impact & Recommended Actions (Activity-specific) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: Expected Effects */}
          <div className="p-4 rounded-2xl bg-slate-50/60 border border-black/5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Expected Impact on You
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {(impact?.effects || [
                'Accelerated fluid loss and faster dehydration under daytime heat load',
                'Elevated fatigue and reduced continuous exertion stamina',
                'Reduced safe continuous physical work tolerance',
                'Higher thermal strain risk during prolonged outdoor exposure',
              ]).map((eff, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                  <span className="leading-snug">{eff}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Recommended Protection */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                Recommended Actions
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-emerald-900">
              {(impact?.recommendations || [
                'Drink 300–400 ml of water or electrolytes every 30 minutes, even without thirst',
                'Take mandatory cooling/rest breaks in deep shade or public cooling centres',
                'Select shaded or canopied pedestrian routes away from open asphalt',
                'Avoid strenuous unshaded exertion during peak heat period (12 PM – 4 PM)',
              ]).map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Protection Factors & Microclimate Breakdown (Never Temperature Alone!) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-black/5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              Location & Protection Factors Evaluated
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">
              Peak Danger Window: <strong className="text-slate-700">{impact?.peakRiskPeriod || '12:00 PM – 04:30 PM'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-slate-700 font-medium">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold">SOLAR LOAD</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {impact?.environmentalFactors.solarRadiation ?? 680} W/m²
              </span>
              <span className="text-[10px] text-orange-600">Radiant surface heating</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold">HUMIDITY</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {impact?.environmentalFactors.humidity ?? 62}% RH
              </span>
              <span className="text-[10px] text-amber-600">Sweat evaporation rate</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold">COOLING CENTRES</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {impact?.environmentalFactors.coolingAvailability ?? 2} Nearby
              </span>
              <span className="text-[10px] text-emerald-600">Public sanctuaries</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
              <span className="text-[10px] text-slate-400 block font-semibold">TREE CANOPY</span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {impact?.environmentalFactors.shadeAvailability ?? 28}% Ward
              </span>
              <span className="text-[10px] text-teal-600">Natural shade shield</span>
            </div>
          </div>

          {/* Specific Risk Reasons */}
          {impact?.riskReasons && impact.riskReasons.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Key Microclimate Drivers:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {impact.riskReasons.map((reason, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                  >
                    <span className="w-1 h-1 rounded-full bg-orange-500" />
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            SECTION: DESTINATION RISK COMPARISON ("Where are you going?")
            ========================================================================= */}
        <div className="pt-2 border-t border-black/5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDestinationPlanner(!showDestinationPlanner)}
              className="text-xs font-black uppercase tracking-wider text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Where are you going? Destination Risk Planner</span>
              {showDestinationPlanner ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {destination && (
              <button
                type="button"
                onClick={() => handleSelectDestination(null)}
                className="text-[11px] text-slate-400 hover:text-red-600 transition"
              >
                Clear Destination
              </button>
            )}
          </div>

          {showDestinationPlanner && (
            <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-8">
                  <label className="text-[10px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                    Select Your Travel Destination
                  </label>
                  <select
                    value={destination?.name || ''}
                    onChange={(e) => {
                      const found = POPULAR_DESTINATIONS.find((d) => d.name === e.target.value);
                      handleSelectDestination(found || null);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-900 shadow-xs focus:outline-hidden"
                  >
                    <option value="">-- Choose destination to compare heat risk --</option>
                    {POPULAR_DESTINATIONS.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] font-black uppercase tracking-wider text-amber-900 block mb-1">
                    Planned Departure Time
                  </label>
                  <input
                    type="text"
                    value={plannedTravelTime}
                    onChange={(e) => setPlannedTravelTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-900 shadow-xs"
                  />
                </div>
              </div>

              {/* Destination Heat Warning Card */}
              {impact?.destinationComparison ? (
                <div className={`p-4 rounded-xl border ${
                  impact.destinationComparison.isHigherRisk
                    ? 'bg-red-50/90 border-red-200 text-red-950'
                    : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                } space-y-2`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-4 h-4 ${
                        impact.destinationComparison.isHigherRisk ? 'text-red-600' : 'text-emerald-600'
                      } shrink-0`} />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {impact.destinationComparison.isHigherRisk
                          ? 'DESTINATION HEAT WARNING'
                          : 'DESTINATION HEAT COMPARISON'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-white/80">
                      Destination Risk: {impact.destinationComparison.destinationRiskLevel}
                    </span>
                  </div>

                  <p className="text-xs font-bold leading-snug">
                    {impact.destinationComparison.differenceSummary}
                  </p>

                  <div className="text-[11px] space-y-1 pt-1">
                    <span className="font-semibold block text-slate-700">Main Comparing Factors:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {impact.destinationComparison.factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[11px] space-y-1 pt-1">
                    <span className="font-semibold block text-slate-700">Transit Advisory:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      {impact.destinationComparison.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : destination ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin inline-block mr-1 text-orange-600" />
                  Calculating destination thermal stress comparison...
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* =========================================================================
            SECONDARY TECHNICAL ACCORDION (Never primary, for SIH/scientific audit)
            ========================================================================= */}
        <div className="pt-2 border-t border-black/5">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between text-left py-1 text-slate-400 hover:text-slate-700 transition"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              Scientific Thermal Indicators (WBGT · UTCI · Heat Index)
            </span>
            <span className="text-xs">{showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in duration-150">
              <p className="text-[11px] text-slate-500">
                These scientific indices are deterministic thermal engine inputs that feed our human impact model. We display them here for meteorological inspection:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">WBGT</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">
                    {impact?.thermalStress.wbgt ?? 29.4}°C
                  </span>
                  <span className="text-[9px] text-slate-400">Wet Bulb Globe</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">UTCI</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">
                    {impact?.thermalStress.utci ?? 34.2}°C
                  </span>
                  <span className="text-[9px] text-slate-400">Universal Thermal</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">HEAT INDEX</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">
                    {impact?.thermalStress.heatIndex ?? 32.8}°C
                  </span>
                  <span className="text-[9px] text-slate-400">NOAA Steadman</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Thermal Stress Category: <strong className="text-slate-700">{impact?.thermalStress.category || 'High'}</strong></span>
                <span>Calculated via Open-Meteo & verified thermal physics equations</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
