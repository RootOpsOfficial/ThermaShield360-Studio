import React, { useState, useEffect } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { EarlyWarningHorizon, LongRangeEarlyWarningReport, UnifiedHeatwaveVerdict, WeatherDailyForecast } from '../types.js';
import {
  Flame,
  CheckCircle2,
  Calendar,
  Globe2,
  MapPin,
  Search,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  X,
  ChevronRight,
  ChevronDown,
  Calculator,
  AlertTriangle,
  Info,
  Clock,
  Thermometer,
  TrendingUp,
} from 'lucide-react';

// Comprehensive Pune wards & localities base with geographic coordinates
const ALL_PUNE_LOCATIONS = [
  // PMC Administrative Wards
  { name: 'Ward 14: Shivajinagar - Ghole Road', zone: 'Central Pune', isWard: true, defaultUhi: '+1.8°C', lat: 18.5314, lng: 73.8446 },
  { name: 'Ward 21: Kasba Peth - Vishrambaug Wada', zone: 'Heritage Core', isWard: true, defaultUhi: '+3.2°C', lat: 18.5196, lng: 73.8553 },
  { name: 'Ward 9: Kothrud - Bavdhan', zone: 'West Hills', isWard: true, defaultUhi: '+0.9°C', lat: 18.5074, lng: 73.8077 },
  { name: 'Ward 7: Aundh - Baner', zone: 'North-West Tech', isWard: true, defaultUhi: '+1.2°C', lat: 18.5580, lng: 73.8070 },
  { name: 'Ward 18: Hadapsar - Mundhwa', zone: 'East Industrial', isWard: true, defaultUhi: '+2.7°C', lat: 18.5089, lng: 73.9260 },
  { name: 'Ward 12: Viman Nagar - Nagar Road', zone: 'North-East Airport', isWard: true, defaultUhi: '+2.1°C', lat: 18.5679, lng: 73.9143 },
  { name: 'Ward 25: Swargate - Parvati', zone: 'South Central', isWard: true, defaultUhi: '+2.4°C', lat: 18.4988, lng: 73.8567 },

  // Key Pune Localities & Micro-Districts
  { name: 'Shivajinagar', zone: 'Central Pune', isWard: false, defaultUhi: '+1.8°C', lat: 18.5314, lng: 73.8446 },
  { name: 'Kasba Peth', zone: 'Heritage Core', isWard: false, defaultUhi: '+3.2°C', lat: 18.5196, lng: 73.8553 },
  { name: 'Kothrud', zone: 'West Hills', isWard: false, defaultUhi: '+0.9°C', lat: 18.5074, lng: 73.8077 },
  { name: 'Aundh', zone: 'North-West Tech', isWard: false, defaultUhi: '+1.2°C', lat: 18.5580, lng: 73.8070 },
  { name: 'Baner', zone: 'North-West Tech', isWard: false, defaultUhi: '+1.1°C', lat: 18.5472, lng: 73.7844 },
  { name: 'Balewadi', zone: 'North-West', isWard: false, defaultUhi: '+1.0°C', lat: 18.5789, lng: 73.7707 },
  { name: 'Hadapsar', zone: 'East Industrial', isWard: false, defaultUhi: '+2.7°C', lat: 18.5089, lng: 73.9260 },
  { name: 'Mundhwa', zone: 'East Industrial', isWard: false, defaultUhi: '+2.5°C', lat: 18.5332, lng: 73.9255 },
  { name: 'Viman Nagar', zone: 'North-East Airport', isWard: false, defaultUhi: '+2.1°C', lat: 18.5679, lng: 73.9143 },
  { name: 'Kalyani Nagar', zone: 'East Riverside', isWard: false, defaultUhi: '+1.5°C', lat: 18.5463, lng: 73.9033 },
  { name: 'Koregaon Park', zone: 'East Riverside', isWard: false, defaultUhi: '+1.4°C', lat: 18.5362, lng: 73.8940 },
  { name: 'Swargate', zone: 'South Central', isWard: false, defaultUhi: '+2.4°C', lat: 18.4988, lng: 73.8567 },
  { name: 'Parvati', zone: 'South Central', isWard: false, defaultUhi: '+2.2°C', lat: 18.4902, lng: 73.8475 },
  { name: 'Bibwewadi', zone: 'South Suburb', isWard: false, defaultUhi: '+2.0°C', lat: 18.4725, lng: 73.8611 },
  { name: 'Kondhwa', zone: 'South Suburb', isWard: false, defaultUhi: '+2.1°C', lat: 18.4719, lng: 73.8890 },
  { name: 'Katraj', zone: 'South Hills', isWard: false, defaultUhi: '+1.3°C', lat: 18.4485, lng: 73.8588 },
  { name: 'Dhankawadi', zone: 'South Hills', isWard: false, defaultUhi: '+1.4°C', lat: 18.4627, lng: 73.8519 },
  { name: 'Deccan Gymkhana', zone: 'Central West', isWard: false, defaultUhi: '+1.9°C', lat: 18.5167, lng: 73.8415 },
  { name: 'FC Road', zone: 'Central West', isWard: false, defaultUhi: '+1.9°C', lat: 18.5255, lng: 73.8423 },
  { name: 'Bavdhan', zone: 'West Hills', isWard: false, defaultUhi: '+0.8°C', lat: 18.5115, lng: 73.7744 },
  { name: 'Pashan', zone: 'West Hills', isWard: false, defaultUhi: '+0.9°C', lat: 18.5388, lng: 73.7925 },
  { name: 'Wakad', zone: 'West Tech Corridor', isWard: false, defaultUhi: '+1.4°C', lat: 18.5987, lng: 73.7686 },
  { name: 'Hinjewadi IT Park', zone: 'West Tech Corridor', isWard: false, defaultUhi: '+1.3°C', lat: 18.5913, lng: 73.7389 },
  { name: 'Camp (Pune Cantonment)', zone: 'Central East', isWard: false, defaultUhi: '+1.7°C', lat: 18.5126, lng: 73.8785 },
  { name: 'Magarpatta City', zone: 'East Industrial', isWard: false, defaultUhi: '+2.3°C', lat: 18.5144, lng: 73.9312 },
  { name: 'Kharadi IT Park', zone: 'North-East', isWard: false, defaultUhi: '+2.0°C', lat: 18.5516, lng: 73.9352 },
  { name: 'Yerawada', zone: 'North-East', isWard: false, defaultUhi: '+2.2°C', lat: 18.5529, lng: 73.8796 },
  { name: 'Khadki', zone: 'North Central', isWard: false, defaultUhi: '+1.6°C', lat: 18.5630, lng: 73.8509 },
  { name: 'Wanowrie', zone: 'South-East', isWard: false, defaultUhi: '+1.8°C', lat: 18.4908, lng: 73.8967 },
  { name: 'Bhosari', zone: 'North Industrial', isWard: false, defaultUhi: '+2.4°C', lat: 18.6277, lng: 73.8447 },
  { name: 'Pimpri-Chinchwad', zone: 'North-West Hub', isWard: false, defaultUhi: '+2.0°C', lat: 18.6279, lng: 73.8009 },
];

export const EarlyWarningHeatwavePage: React.FC = () => {
  const { longRangeReport, location, selectWard, weatherForecast, weatherHourly, formatTemp } = useCitizen();

  // Selected custom location or fallback to current ward name
  const [selectedLocationName, setSelectedLocationName] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customReport, setCustomReport] = useState<any>(null);
  const [customDailyForecast, setCustomDailyForecast] = useState<WeatherDailyForecast[]>([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // Modals state
  const [isMainResourcesModalOpen, setIsMainResourcesModalOpen] = useState(false);
  const [activeSectorResources, setActiveSectorResources] = useState<EarlyWarningHorizon | null>(null);
  const [activeSectorAction, setActiveSectorAction] = useState<EarlyWarningHorizon | null>(null);

  const closeAllOverlays = () => {
    setIsMainResourcesModalOpen(false);
    setActiveSectorResources(null);
    setActiveSectorAction(null);
  };

  // Escape always closes whichever overlay is open — a guaranteed way back.
  useEffect(() => {
    if (!isMainResourcesModalOpen && activeSectorResources === null && activeSectorAction === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMainResourcesModalOpen(false);
        setActiveSectorResources(null);
        setActiveSectorAction(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMainResourcesModalOpen, activeSectorResources, activeSectorAction]);

  // Active location label
  const activeLocation = selectedLocationName || location.ward.name;

  // Fetch or update data when location changes
  useEffect(() => {
    if (!selectedLocationName) {
      setCustomReport(null);
      setCustomDailyForecast([]);
      return;
    }

    let isMounted = true;
    setIsFetchingLocation(true);

    const matchedLoc = ALL_PUNE_LOCATIONS.find((l) => l.name === selectedLocationName);
    const lat = matchedLoc?.lat ?? location.lat;
    const lng = matchedLoc?.lng ?? location.lng;

    Promise.all([
      fetch(
        `/api/risk/long-range-warning?lat=${lat}&lng=${lng}&location=${encodeURIComponent(selectedLocationName)}`
      ).then((res) => res.json()),
      fetch(`/api/weather/forecast?lat=${lat}&lng=${lng}&location=${encodeURIComponent(selectedLocationName)}`).then((res) => res.json()),
    ])
      .then(([reportData, forecastData]) => {
        if (isMounted) {
          setCustomReport(reportData);
          if (Array.isArray(forecastData) && forecastData.length > 0) {
            setCustomDailyForecast(forecastData);
          }
          setIsFetchingLocation(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load warning for location:', err);
        if (isMounted) setIsFetchingLocation(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedLocationName]);

  const report: LongRangeEarlyWarningReport | any = customReport || longRangeReport || {
    location: activeLocation,
    unifiedVerdict: null,
    horizons: [] as EarlyWarningHorizon[],
    dataBasis: null,
    climatology: null,
  };

  const unifiedVerdict: UnifiedHeatwaveVerdict | null = report.unifiedVerdict || null;
  const dataBasis = report.dataBasis ?? null;
  const climatologySummary = report.climatology ?? null;

  const isHeatwaveComing = unifiedVerdict?.isHeatwaveComing ?? false;
  const horizons: EarlyWarningHorizon[] = report.horizons || [];

  // Real evidence basis for the headline verdict — drives honest labelling in the UI.
  const overallEvidenceBasis = unifiedVerdict?.evidenceBasis ?? 'UNAVAILABLE';
  const basisLabel: Record<string, string> = {
    OPERATIONAL_FORECAST: 'Operational Forecast',
    ENSEMBLE: 'Ensemble Forecast',
    CLIMATOLOGICAL: '20-Year Climatology',
    UNAVAILABLE: 'No Verified Data',
  };
  const basisChipLabel = basisLabel[overallEvidenceBasis] ?? 'No Verified Data';

  // Sequence order: 1 Day to 30 Days (1), 1 to 3 Months (2), 3 to 5 Months (3), 5 to 8 Months (4), 8 to 12/13 Months (5)
  const HORIZON_SEQUENCE: Record<string, number> = {
    'horizon-1-30d': 1,
    'horizon-1-3m': 2,
    'horizon-1-2m': 2,
    'horizon-3-5m': 3,
    'horizon-2-5m': 3,
    'horizon-5-8m': 4,
    'horizon-8-12m': 5,
    'horizon-8-13m': 5,
  };

  const getHorizonSortOrder = (h: EarlyWarningHorizon): number => {
    if (HORIZON_SEQUENCE[h.id]) return HORIZON_SEQUENCE[h.id];
    const label = h.timeRangeLabel.toLowerCase();
    if (label.includes('30 day')) return 1;
    if (label.includes('1 to 3') || label.includes('1 to 2')) return 2;
    if (label.includes('3 to 5') || label.includes('2 to 5')) return 3;
    if (label.includes('5 to 8')) return 4;
    if (label.includes('8 to 12') || label.includes('8 to 13')) return 5;
    return 99;
  };

  // All 5 strategic horizons ordered chronologically
  const orderedHorizons = [...(horizons as EarlyWarningHorizon[])].sort((a, b) => {
    return getHorizonSortOrder(a) - getHorizonSortOrder(b);
  });

  const handleSelectLocation = (locName: string) => {
    setSelectedLocationName(locName);
    setSearchInput(locName);
    setIsDropdownOpen(false);

    // If matches a known ward, also update context ward
    const matchedWard = location.allWards.find((w) =>
      w.name.toLowerCase().includes(locName.toLowerCase()) || locName.toLowerCase().includes(w.name.toLowerCase())
    );
    if (matchedWard) {
      selectWard(matchedWard.id);
    }
  };

  const handleResetLocation = () => {
    setSelectedLocationName('');
    setSearchInput('');
    setCustomReport(null);
    setCustomDailyForecast([]);
  };

  const rawDailyList = customDailyForecast.length > 0
    ? customDailyForecast
    : (weatherForecast && weatherForecast.length > 0)
    ? weatherForecast
    : [];

  const full16DayList = rawDailyList.length >= 1
    ? rawDailyList
    : []; // No fallback hardcoded data — show as unavailable

  const days1to5 = full16DayList.slice(0, 5);
  const days6to15 = full16DayList.slice(5, 15);

  // Ward micro-climate offset — the same offset the server applies to the
  // operational heatwave classification, so the panel and the API always agree.
  const uhiOffsetC = location.ward?.uhiOffsetDegC ?? 0;
  const HEATWAVE_THRESHOLD_C = 38.5;
  const SEVERE_HEATWAVE_THRESHOLD_C = 40.0;

  const adjustedMaxOf = (day: WeatherDailyForecast): number => Math.round((day.tempMax + uhiOffsetC) * 10) / 10;
  const isHeatwaveDay = (day: WeatherDailyForecast): boolean => adjustedMaxOf(day) >= HEATWAVE_THRESHOLD_C;
  const isSevereDay = (day: WeatherDailyForecast): boolean => adjustedMaxOf(day) >= SEVERE_HEATWAVE_THRESHOLD_C;
  const peakAdjustedOf = (days: WeatherDailyForecast[]): number | null =>
    days.length > 0 ? Math.round(Math.max(...days.map(adjustedMaxOf)) * 10) / 10 : null;

  const d1to5Max = peakAdjustedOf(days1to5);
  const d1to5HeatwaveCount = days1to5.filter(isHeatwaveDay).length;

  const d6to15Max = peakAdjustedOf(days6to15);
  const d6to15HeatwaveCount = days6to15.filter(isHeatwaveDay).length;

  const fmtHour = (h: number): string => (h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`);

  // Real peak thermal window derived from the live hourly temperature record.
  const peakThermalWindow = (() => {
    if (!weatherHourly || weatherHourly.length === 0) return 'Unavailable';
    const hottestHours = Array.from(
      new Set([...weatherHourly].sort((a, b) => b.temp - a.temp).slice(0, 5).map((h) => h.hour))
    ).sort((a, b) => a - b);
    if (hottestHours.length === 0) return 'Unavailable';
    return `${fmtHour(hottestHours[0])} – ${fmtHour(hottestHours[hottestHours.length - 1])}`;
  })();

  // Real onset/surge window inside the 6–15 day forecast block.
  const onsetSurgeLabel = (() => {
    if (days6to15.length === 0) return 'Unavailable';
    const firstIdx = days6to15.findIndex(isHeatwaveDay);
    if (firstIdx === -1) return 'No threshold breach in days 6–15';
    let lastIdx = firstIdx;
    for (let i = firstIdx; i < days6to15.length; i++) if (isHeatwaveDay(days6to15[i])) lastIdx = i;
    return `Days ${firstIdx + 6} – ${lastIdx + 6}`;
  })();

  // Real thermal trajectory across the extended block.
  const extendedTrajectory = (() => {
    if (days6to15.length < 2) return 'Trajectory unavailable';
    const mid = Math.floor(days6to15.length / 2);
    const avg = (arr: WeatherDailyForecast[]) => arr.reduce((sum, d) => sum + adjustedMaxOf(d), 0) / arr.length;
    const delta = Math.round((avg(days6to15.slice(mid)) - avg(days6to15.slice(0, mid))) * 10) / 10;
    if (delta >= 0.5) return `Escalating Heat Risk (+${delta}°C)`;
    if (delta <= -0.5) return `Easing Heat Risk (${delta}°C)`;
    return 'Stable Thermal Trend';
  })();

  // Real inter-model agreement and the real source names.
  const modelAgreementPct: number | null = dataBasis?.operationalAgreementPct ?? null;
  const modelAgreementSources: string =
    Array.isArray(dataBasis?.consensusSources) && dataBasis.consensusSources.length > 0
      ? dataBasis.consensusSources.join('  ·  ')
      : 'No verified operational source returned data';

  const extendedAgreementPct: number | null =
    dataBasis?.ensembleAvailable && typeof dataBasis?.ensembleSpreadDegC === 'number'
      ? Math.max(25, Math.min(98, Math.round(100 - dataBasis.ensembleSpreadDegC * 12)))
      : null;
  const extendedAgreementSources: string = dataBasis?.ensembleAvailable
    ? `NOAA GEFS ${typeof dataBasis?.ensembleSpreadDegC === 'number' ? `(σ ${dataBasis.ensembleSpreadDegC}°C)` : ''}`.trim()
    : 'Ensemble unavailable for this location';

  const operationalAdvisoryActive = d1to5HeatwaveCount > 0;
  const unavailableSourcesLabel: string[] = dataBasis?.unavailableSources ?? [];

  const formatDateShort = (dateStr?: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${months[m] || parts[1]} ${d}`;
    }
    return dateStr;
  };

  const renderHorizonCard = (horizon: EarlyWarningHorizon) => {
    const isComing = horizon.isHeatwaveComing;

    return (
      <div
        key={horizon.id}
        className={`p-4 sm:p-5 rounded-2xl bg-white border-2 transition-all ${
          isComing ? 'border-red-300/80 hover:border-red-400' : 'border-emerald-300/80 hover:border-emerald-400'
        }`}
      >
        {/* Sector Header: Label, Verdict, and One Number */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white ${
                isComing ? 'bg-orange-600' : 'bg-emerald-600'
              }`}
            >
              {horizon.timeRangeLabel}
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              {horizon.timeRangeTitle.split('(')[0].trim()}
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Verdict Pill */}
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                isComing ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isComing ? <Flame className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{horizon.verdict}</span>
            </span>

            {/* Single Combined Number */}
            <div className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-right">
              <span className="text-xs font-black text-slate-900">
                {horizon.unifiedConfidencePct}%
              </span>
              <span className="text-[9px] text-slate-400 block -mt-0.5">Confidence</span>
            </div>
          </div>
        </div>

        {/* Evidence basis for this horizon — real data, never fabricated */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              horizon.evidenceBasis === 'OPERATIONAL_FORECAST' || horizon.evidenceBasis === 'ENSEMBLE'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : horizon.evidenceBasis === 'CLIMATOLOGICAL'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            Evidence: {basisLabel[horizon.evidenceBasis] ?? 'No Verified Data'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            Window: {horizon.targetWindow}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            Live forecast days: {horizon.liveForecastDays}
          </span>
        </div>

        {/* Clean Metrics Grid: Arrival, Duration, Severity (No bulky description text) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-extrabold text-orange-600 uppercase block">
              WHEN WILL IT COME?
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5">{horizon.expectedOnsetDates}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
              EXPECTED DURATION
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5">{horizon.expectedDuration}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
              SEVERITY LEVEL
            </span>
            <p className="font-extrabold text-slate-900 mt-0.5">{horizon.severityLevel} Threat</p>
          </div>
        </div>

        {/* THE TWO BUTTONS PER SECTOR: Resources Button & Important Action/Protection Button */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {/* Button 1: Resources & Confidence for this sector */}
          <button
            onClick={() => setActiveSectorResources(horizon)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>View Resources & Confidence</span>
          </button>

          {/* Button 2: Important Action & Protection for this sector */}
          <button
            onClick={() => setActiveSectorAction(horizon)}
            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors ml-auto"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
            <span>Important Action & Protection</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header with Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Early Warning & Heatwave Forecast
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Single definitive consensus forecast predicting heatwave arrival across strategic horizons.
        </p>
      </div>

      {/* 2. COMPACT CHOOSE LOCATION BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700">Choose Location:</span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-sm sm:max-w-md justify-end">
          <div className="relative flex-1">
            <select
              value={selectedLocationName || location.ward.name}
              onChange={(e) => handleSelectLocation(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer appearance-none transition-all"
            >
              <optgroup label="PMC Administrative Wards">
                {ALL_PUNE_LOCATIONS.filter((l) => l.isWard).map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.zone})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Pune Localities & Neighborhoods">
                {ALL_PUNE_LOCATIONS.filter((l) => !l.isWard).map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.zone})
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedLocationName && (
            <button
              onClick={handleResetLocation}
              title="Reset to default GPS location"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. HERO DEFINITIVE VERDICT CARD (ONE OUTPUT + ONE COMBINED NUMBER) */}
      <section
        className={`apple-card p-6 sm:p-7 border-2 transition-all relative overflow-hidden ${
          isHeatwaveComing
            ? 'border-red-500 bg-gradient-to-br from-red-50/50 via-white to-orange-50/40 shadow-sm'
            : 'border-emerald-500 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/40 shadow-sm'
        }`}
      >
        <div className="relative z-10 space-y-5">
          {/* Top Label */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/10">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Unified Consensus Verdict for {activeLocation}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                isHeatwaveComing ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isHeatwaveComing ? `Threat Basis: ${basisChipLabel}` : `No Threat · ${basisChipLabel}`}
            </span>
          </div>

          {/* Evidence basis + real data provenance */}
          {(unifiedVerdict?.confidenceBasis || unifiedVerdict?.disclaimer) && (
            <div className="p-3 rounded-xl bg-white/70 border border-black/5 text-[11px] text-slate-700 space-y-1">
              {unifiedVerdict?.confidenceBasis && (
                <p>
                  <strong className="text-slate-900">Why this number: </strong>
                  {unifiedVerdict.confidenceBasis}
                </p>
              )}
              {unifiedVerdict?.disclaimer && (
                <p className="text-slate-500">
                  <strong className="text-slate-700">Scope: </strong>
                  {unifiedVerdict.disclaimer}
                </p>
              )}
            </div>
          )}

          {/* Main Verdict & The One Combined Number */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: The Verdict Text & Status */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center gap-3">
                {isHeatwaveComing ? (
                  <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <Flame className="w-6 h-6 text-amber-200" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-100" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Definitive Consensus Output
                  </span>
                  <h2
                    className={`text-2xl sm:text-3xl font-black tracking-tight ${
                      isHeatwaveComing ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {unifiedVerdict?.verdict ?? 'Loading Early Warning Data…'}
                  </h2>
                </div>
              </div>

              {/* Clean Arrival & Duration Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 block">
                    WHEN WILL IT COME?
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {unifiedVerdict?.nextArrivalWindow ?? 'UNAVAILABLE'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    EXPECTED DURATION
                  </span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {unifiedVerdict?.expectedDuration ?? 'UNAVAILABLE'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: THE ONE COMBINED NUMBER & RESOURCES BUTTON */}
            <div className="lg:col-span-5 p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
              {/* Header: Title & Location on left, small Resources button on right */}
              <div className="flex items-start justify-between gap-2">
                <div className="text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    COMBINED ENSEMBLE CONFIDENCE
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span className="truncate max-w-[190px] sm:max-w-[240px]">
                      {activeLocation}
                    </span>
                  </div>
                </div>

                {/* Small Resources button on right side */}
                <button
                  onClick={() => setIsMainResourcesModalOpen(true)}
                  className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  title="View Climatological Resources & Confidence"
                >
                  <Layers className="w-3.5 h-3.5 text-orange-400" />
                  <span>Resources</span>
                </button>
              </div>

              {/* Giant Number & Agreement Tag */}
              <div className="my-2.5 text-center">
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none">
                    {unifiedVerdict?.unifiedConfidencePct ?? '—'}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-orange-600">%</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  <span
                    className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold ${
                      (unifiedVerdict?.unifiedConfidencePct ?? 0) >= 90
                        ? 'bg-emerald-100 text-emerald-800'
                        : (unifiedVerdict?.unifiedConfidencePct ?? 0) >= 75
                        ? 'bg-blue-100 text-blue-800'
                        : (unifiedVerdict?.unifiedConfidencePct ?? 0) >= 55
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {unifiedVerdict ? `${unifiedVerdict.confidenceGrade} Confidence` : 'Awaiting verified data'}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {basisChipLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTIONS FOR STRATEGIC HEATWAVE HORIZONS IN CHRONOLOGICAL SEQUENCE */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
            Heatwave Outlook Across Strategic Time Horizons
          </h2>
          <span className="text-xs text-slate-400 hidden sm:block">
            {orderedHorizons.length} Forecast Horizons
          </span>
        </div>

        <div className="space-y-3.5">
          {orderedHorizons.map((horizon: EarlyWarningHorizon) => renderHorizonCard(horizon))}
        </div>
      </div>

      {/* 4b. 1 TO 5 DAY OPERATIONAL HEATWAVE FORECAST */}
      <section className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-orange-600">
              1 to 5 Days
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>1 to 5 Day Operational Heatwave Forecast</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Live operational forecast for {activeLocation} — IMD-aligned thresholds with ward UHI offset (+{uhiOffsetC}°C)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                operationalAdvisoryActive
                  ? 'bg-orange-100 text-orange-800 border-orange-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${operationalAdvisoryActive ? 'text-orange-600' : 'text-emerald-600'}`} />
              <span>{operationalAdvisoryActive ? 'Operational Advisory Active' : 'No Operational Advisory'}</span>
            </span>
          </div>
        </div>

        {/* 1-5 Day Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block">
              Peak Window Temp
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
              {d1to5Max !== null ? formatTemp(d1to5Max) : '—'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {d1to5Max !== null
                ? `Highest UHI-adjusted maximum · ${days1to5.length} of 5 days loaded`
                : 'Live forecast unavailable'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Heatwave Days
            </span>
            <span className="text-xl sm:text-2xl font-black text-red-600 mt-0.5 block">
              {d1to5HeatwaveCount} / {days1to5.length || 0} Days
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Meeting IMD criteria (≥{HEATWAVE_THRESHOLD_C}°C UHI-adjusted)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Peak Thermal Window
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
              {peakThermalWindow}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Hottest hours from the live hourly record</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
              Model Agreement
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
              {modelAgreementPct !== null ? `${modelAgreementPct}%` : '—'}
            </span>
            <span
              className="text-[10px] text-slate-500 font-medium block truncate"
              title={modelAgreementSources}
            >
              {modelAgreementSources}
            </span>
          </div>
        </div>

        {/* 5 Daily Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {days1to5.map((day, idx) => {
            const isToday = idx === 0;
            const isHeatwave = isHeatwaveDay(day);
            const isSevere = isSevereDay(day);

            return (
              <div
                key={day.date || idx}
                className={`p-4 rounded-2xl bg-white border-2 transition-all flex flex-col justify-between ${
                  isSevere
                    ? 'border-red-300 shadow-xs hover:border-red-400'
                    : isHeatwave
                    ? 'border-orange-300 shadow-xs hover:border-orange-400'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Day {idx + 1}
                      </span>
                      <span className="text-xs font-black text-slate-900 block">
                        {isToday ? 'Today' : day.dayName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDateShort(day.date)}
                    </span>
                  </div>

                  <div className="mt-2.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSevere
                          ? 'bg-red-100 text-red-700'
                          : isHeatwave
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isSevere ? (
                        <>
                          <Flame className="w-3 h-3 text-red-600" />
                          Severe Heatwave
                        </>
                      ) : isHeatwave ? (
                        <>
                          <Flame className="w-3 h-3 text-orange-600" />
                          Heatwave Warning
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Normal Conditions
                        </>
                      )}
                    </span>
                  </div>

                  {/* Temp Block */}
                  <div className="my-2.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {formatTemp(adjustedMaxOf(day))}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">Max (UHI-adj.)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span>Min: <strong className="text-slate-700">{formatTemp(day.tempMin)}</strong></span>
                      <span>•</span>
                      <span>Feels: <strong className="text-orange-700">{formatTemp(day.feelsLikeMax)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-medium">Risk Level:</span>
                    <span
                      className={`font-black ${
                        day.riskLevel === 'Extreme'
                          ? 'text-red-700'
                          : day.riskLevel === 'High'
                          ? 'text-orange-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {day.riskLevel}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                    {day.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4c. 6 TO 15 DAYS EXTENDED HEATWAVE OUTLOOK */}
      <section className="space-y-4 pt-4 border-t border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white bg-slate-900">
              6 to 15 Days
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>6 to 15 Days Extended Heatwave Outlook</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Extended-range projection from the live {full16DayList.length}-day forecast, tracking threshold arrival beyond day 5
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                extendedTrajectory.startsWith('Escalating')
                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trajectory: {extendedTrajectory}</span>
            </span>
          </div>
        </div>

        {/* 6-15 Days Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider block">
              Onset / Surge Window
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 mt-0.5 block">
              {onsetSurgeLabel}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {onsetSurgeLabel.startsWith('Days')
                ? 'Heatwave threshold arrival window'
                : 'No threshold arrival in this window'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Projected Peak Max
            </span>
            <span className="text-xl sm:text-2xl font-black text-red-600 mt-0.5 block">
              {d6to15Max !== null ? formatTemp(d6to15Max) : '—'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Highest UHI-adjusted maximum · {days6to15.length} of 10 days loaded
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Heatwave Days
            </span>
            <span className="text-xl sm:text-2xl font-black text-orange-600 mt-0.5 block">
              {d6to15HeatwaveCount} / {days6to15.length || 0} Days
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Above threshold in live forecast</span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
              Sub-Seasonal Agreement
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 block">
              {extendedAgreementPct !== null ? `${extendedAgreementPct}%` : '—'}
            </span>
            <span
              className="text-[10px] text-slate-500 font-medium block truncate"
              title={extendedAgreementSources}
            >
              {extendedAgreementSources}
            </span>
          </div>
        </div>

        {/* 10 Daily Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {days6to15.map((day, idx) => {
            const dayNumber = idx + 6;
            const isHeatwave = isHeatwaveDay(day);
            const isSevere = isSevereDay(day);

            return (
              <div
                key={day.date || dayNumber}
                className={`p-3.5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                  isSevere
                    ? 'border-red-300 shadow-xs hover:border-red-400 bg-red-50/10'
                    : isHeatwave
                    ? 'border-orange-300 shadow-xs hover:border-orange-400 bg-orange-50/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-black text-slate-700">
                      Day {dayNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formatDateShort(day.date)}
                    </span>
                  </div>

                  <div className="mt-1.5">
                    <span className="text-xs font-extrabold text-slate-800 block truncate">
                      {day.dayName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                        isSevere
                          ? 'bg-red-100 text-red-700'
                          : isHeatwave
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isSevere ? (
                        <>
                          <Flame className="w-2.5 h-2.5 text-red-600" />
                          Severe Heatwave
                        </>
                      ) : isHeatwave ? (
                        <>
                          <Flame className="w-2.5 h-2.5 text-orange-600" />
                          Heatwave Warning
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Normal
                        </>
                      )}
                    </span>
                  </div>

                  {/* Temp */}
                  <div className="my-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900 tracking-tight">
                        {formatTemp(adjustedMaxOf(day))}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Max (UHI-adj.)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span>Min: {formatTemp(day.tempMin)}</span>
                      <span className="text-orange-700 font-semibold">Feels {formatTemp(day.feelsLikeMax)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 mt-1">
                  <p className="text-[9px] text-slate-500 line-clamp-2 leading-tight">
                    {day.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. MODAL: MAIN RESOURCES & CONFIDENCE BREAKDOWN */}
      {isMainResourcesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMainResourcesModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full my-auto max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Always-visible header — the close control can never scroll out of reach */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-5 h-5 text-orange-600 shrink-0" />
                <h3 className="font-black text-slate-900 text-base truncate">
                  Climatological Resources & Confidence
                </h3>
              </div>
              <button
                onClick={() => setIsMainResourcesModalOpen(false)}
                aria-label="Close"
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-xs font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-4 sm:p-5 overflow-y-auto grow space-y-4">

            <p className="text-xs text-slate-600">
              The <strong>{unifiedVerdict?.unifiedConfidencePct ?? '—'}%</strong> combined number is derived from{' '}
              <strong>{basisChipLabel}</strong> evidence only. Every value below comes from a provider response for this
              location — nothing is simulated.
            </p>

            {unifiedVerdict?.primaryGuidance && (
              <p className="text-[11px] text-slate-600 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                {unifiedVerdict.primaryGuidance}
              </p>
            )}

            {/* Resources List — only real providers that returned data appear here */}
            <div className="space-y-2.5 text-xs">
              {(unifiedVerdict?.contributingModels ?? []).length === 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600">
                  No verified provider returned data for this location, so no confidence can be computed.
                </div>
              )}
              {(unifiedVerdict?.contributingModels ?? []).map((model) => (
                <div
                  key={model.name}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-extrabold text-slate-900 block truncate">{model.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {model.weightPct > 0 ? `${model.weightPct}% consensus weight` : 'Reference (no weight)'}
                      {model.dataType ? ` · ${model.dataType}` : ''}
                      {model.availability ? ` · ${model.availability}` : ''}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 text-sm">{model.confidence}%</span>
                    {model.weightPct > 0 && (
                      <span className="text-[10px] text-orange-600 font-bold block">
                        +{model.contributionScore}% pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100 text-[11px] text-orange-950 space-y-1.5">
              <span className="font-bold block">How the number was produced:</span>
              {unifiedVerdict?.confidenceBasis && <p className="leading-relaxed">{unifiedVerdict.confidenceBasis}</p>}
              {unifiedVerdict?.methodology && (
                <p className="font-mono text-[10px] leading-relaxed">{unifiedVerdict.methodology}</p>
              )}
              {(unifiedVerdict?.contributingModels ?? []).some((m) => m.weightPct > 0) && (
                <p className="font-mono text-[10px]">
                  {(unifiedVerdict?.contributingModels ?? [])
                    .filter((m) => m.weightPct > 0)
                    .map((m) => `(${m.name} ${m.confidence}% × ${(m.weightPct / 100).toFixed(2)})`)
                    .join(' + ')}{' '}
                  = <strong>{unifiedVerdict?.unifiedConfidencePct ?? 0}% Combined Score</strong>
                </p>
              )}
            </div>

            {/* Real 20-year climatology for this grid cell */}
            {climatologySummary && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-1.5">
                <span className="font-bold text-slate-900 block">
                  Real Climatological Baseline ({climatologySummary.available ? 'available' : 'unavailable'})
                </span>
                <p className="text-slate-500">
                  {climatologySummary.source} · {climatologySummary.referencePeriod}
                </p>
                {climatologySummary.available && (
                  <>
                    <p>
                      Warmest month: <strong>{climatologySummary.annualPeakMonth}</strong>{' '}
                      {climatologySummary.annualPeakNormalMaxC !== null
                        ? `(${climatologySummary.annualPeakNormalMaxC}°C 20-year normal daily max)`
                        : ''}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1">
                      {(climatologySummary.monthlyNormals ?? []).map((m: any) => (
                        <div key={m.monthKey} className="p-1.5 rounded-lg bg-white border border-slate-100 text-center">
                          <span className="block text-[10px] font-bold text-slate-500">{m.monthLabel.slice(0, 3)}</span>
                          <span className="block text-[11px] font-black text-slate-800">
                            {m.normalMaxTempC !== null ? `${m.normalMaxTempC}°C` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Providers that are genuinely unavailable — reported honestly, never substituted */}
            {unavailableSourcesLabel.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-[11px] text-amber-900 space-y-1">
                <span className="font-bold block">Unavailable sources (not used, never simulated):</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {unavailableSourcesLabel.map((src) => (
                    <li key={src} className="font-mono text-[10px]">
                      {src}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsMainResourcesModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: SPECIFIC SECTOR RESOURCES & CONFIDENCE */}
      {activeSectorResources && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSectorResources(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full my-auto max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Always-visible header — the close control can never scroll out of reach */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-orange-600 tracking-wider">
                  {activeSectorResources.timeRangeLabel} Sector
                </span>
                <h3 className="font-black text-slate-900 text-base truncate">
                  Resources & Individual Model Confidences
                </h3>
              </div>
              <button
                onClick={() => setActiveSectorResources(null)}
                aria-label="Close"
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-xs font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-4 sm:p-5 overflow-y-auto grow space-y-4">
            <div className="space-y-2 text-xs">
              {(activeSectorResources.models ?? []).length === 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                  No verified evidence rows are available for this horizon.
                </div>
              )}
              {(activeSectorResources.models ?? []).map((model, idx) => (
                <div key={`${model.modelName}-${idx}`} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-900 block truncate">{model.modelName}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{model.fullName}</span>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        model.availability === 'LIVE' || model.availability === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : model.availability === 'DEGRADED' || model.availability === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {model.availability ?? 'UNKNOWN'}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Confidence</span>
                      <span className="font-black text-sm text-slate-900">
                        {model.confidencePct !== null && model.confidencePct !== undefined
                          ? `${model.confidencePct}%`
                          : 'reference'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <span className="text-[10px] text-slate-500 block">Value / anomaly</span>
                      <span className="font-black text-sm text-slate-900">
                        {model.observedValueC !== null && model.observedValueC !== undefined
                          ? `${model.observedValueC}°C`
                          : model.anomalyDegC !== null && model.anomalyDegC !== undefined
                          ? `${model.anomalyDegC > 0 ? '+' : ''}${model.anomalyDegC}°C`
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed">{model.prediction}</p>
                  {model.notes && <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">{model.notes}</p>}
                  <span className="mt-1 inline-block text-[9px] font-bold uppercase text-slate-400">
                    {model.dataType}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-100 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Combined score for this horizon:</span>
                <span className="font-black text-slate-900 text-sm">
                  {activeSectorResources.unifiedConfidencePct}%
                </span>
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed">{activeSectorResources.confidenceBasis}</p>
              {activeSectorResources.disclaimer && (
                <p className="text-[10px] text-slate-500 leading-relaxed">{activeSectorResources.disclaimer}</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveSectorResources(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: IMPORTANT ACTION & PROTECTION FOR THIS PERIOD OF MONTHS */}
      {activeSectorAction && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveSectorAction(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full my-auto max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* Always-visible header — the close control can never scroll out of reach */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-orange-600 tracking-wider block truncate">
                  {activeSectorAction.timeRangeLabel} ({activeSectorAction.targetWindow})
                </span>
                <h3 className="font-black text-slate-900 text-base truncate">
                  Heatwave Condition & Important Actions
                </h3>
              </div>
              <button
                onClick={() => setActiveSectorAction(null)}
                aria-label="Close"
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 text-xs font-bold transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-4 sm:p-5 overflow-y-auto grow space-y-4">

            {/* Heatwave Condition Box */}
            <div className="p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200/80 text-xs space-y-2">
              <span className="font-bold text-orange-950 uppercase text-[10px] tracking-wider block">
                Heatwave Condition for this Period:
              </span>
              {activeSectorAction.statusHeadline && (
                <p className="text-[11px] text-orange-900 leading-relaxed">{activeSectorAction.statusHeadline}</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">Status:</span>
                  <span className="font-extrabold">{activeSectorAction.verdict}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">When will it come:</span>
                  <span className="font-extrabold">{activeSectorAction.expectedOnsetDates}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Expected Duration:</span>
                  <span className="font-extrabold">{activeSectorAction.expectedDuration}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Unified Confidence:</span>
                  <span className="font-extrabold text-orange-700">{activeSectorAction.unifiedConfidencePct}%</span>
                </div>
              </div>
            </div>

            {/* Important Actions / Protection Points */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {activeSectorAction.citizenGuidance.title}
              </span>
              <ul className="space-y-2 text-slate-700">
                {activeSectorAction.citizenGuidance.actionItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveSectorAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
