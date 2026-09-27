import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import { LocationHeatRiskMap } from '../../components/healthcare/LocationHeatRiskMap.js';
import {
  Users,
  ArrowRight,
  Crosshair,
  RefreshCw,
  Info,
  Flame,
  Activity,
  HeartPulse,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const QUICK_LOCATION_CHOICES = [
  { name: 'Gangapur Road, Canada Corner, Nashik', shortName: 'Nashik', lat: 20.0082, lng: 73.7691 },
  { name: 'Shivajinagar, Central Pune, Maharashtra', shortName: 'Pune', lat: 18.5314, lng: 73.8446 },
  { name: 'Dharavi - Dadar Core, Greater Mumbai', shortName: 'Mumbai', lat: 19.043, lng: 72.855 },
  { name: 'Chandni Chowk - Connaught Place, Delhi NCR', shortName: 'Delhi NCR', lat: 28.631, lng: 77.219 },
  { name: 'Sitabuldi - Cotton Market, Nagpur, Maharashtra', shortName: 'Nagpur', lat: 21.146, lng: 79.083 },
  { name: 'Kempegowda Majestic - Whitefield, Bengaluru', shortName: 'Bengaluru', lat: 12.978, lng: 77.572 },
  { name: 'Kalupur - Old Walled City, Ahmedabad, Gujarat', shortName: 'Ahmedabad', lat: 23.028, lng: 72.599 },
];

/**
 * Clean accessible Info Tooltip component
 */
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-slate-600 focus:outline-none align-middle cursor-help p-0.5"
        aria-label="Information"
      >
        <Info className="w-3 h-3" />
      </button>
      {isOpen && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-64 p-2.5 bg-slate-900 text-white text-[11px] leading-relaxed rounded-xl shadow-xl pointer-events-none text-left font-normal animate-in fade-in zoom-in-95 duration-150">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></span>
        </span>
      )}
    </span>
  );
};

export const HighRiskAreasPage: React.FC = () => {
  const {
    summary,
    selectedRiskArea,
    setSelectedRiskArea,
    setActiveHealthcarePage,
    currentLocation,
    setLocation,
    detectUserGpsLocation,
    isLocatingGps,
  } = useHealthcare();

  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const locationDemandDrivers = summary?.locationDemandDrivers;
  const areas = summary?.highRiskAreas || [];
  const activeArea = selectedRiskArea || (areas.length > 0 ? areas[0] : null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              GEOGRAPHIC DEMAND CLUSTERING • WARD DEMOGRAPHIC MAPPING
            </span>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              📍 Driven by: {currentLocation.shortName}
            </span>
            {currentLocation.isUserLocation && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                User GPS
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {areas.length} MONITORED ZONES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            High-Risk Areas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Ward-level demographic mapping, heat vulnerability & modeled health risk profiles for {currentLocation.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={detectUserGpsLocation}
            disabled={isLocatingGps}
            title="Drive health demand from current GPS location"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 cursor-pointer disabled:opacity-50"
          >
            {isLocatingGps ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{isLocatingGps ? 'Locating...' : 'My GPS Location'}</span>
          </button>

          <button
            onClick={() => setActiveHealthcarePage('vulnerability')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all"
          >
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span>Vulnerability Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* LOCATION HEAT RISK MAP & CHECKER (FROM COMMAND CENTER)        */}
      {/* ============================================================ */}
      <LocationHeatRiskMap />

      {/* ============================================================ */}
      {/* HEALTH DEMAND RISK & TELEMETRY DRIVERS (FROM COMMAND CENTER) */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                HEALTH DEMAND DRIVERS & RISK
              </span>
              {currentLocation.isUserLocation ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  User Location (GPS)
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                  📍 {currentLocation.shortName}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Health Demand Risk Profile • {currentLocation.shortName}
            </h3>
            <p className="text-[11px] text-slate-500 truncate max-w-lg">
              {currentLocation.name}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={detectUserGpsLocation}
              disabled={isLocatingGps}
              title="Detect and drive demand from your current GPS location"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all border border-emerald-200 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {isLocatingGps ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span className="text-[11px]">{isLocatingGps ? 'Locating...' : 'My GPS'}</span>
            </button>
          </div>
        </div>

        {/* TELEMETRY DRIVERS STRIP */}
        {locationDemandDrivers && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <div className="p-2.5 rounded-2xl bg-orange-50/70 border border-orange-200/80">
              <span className="text-[10px] font-bold text-orange-900 block uppercase">Expected Demand</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                {locationDemandDrivers.expectedDailyPatientDemand} <span className="text-[10px] font-bold text-slate-500">pts/day</span>
              </span>
              <span className="text-[10px] font-extrabold text-orange-700">{locationDemandDrivers.surgeStatus}</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-600 block uppercase">Thermal WBGT</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                {locationDemandDrivers.wbgt.toFixed(1)}°C
              </span>
              <span
                className={`text-[10px] font-extrabold ${
                  locationDemandDrivers.thermalStressLevel === 'Critical' || locationDemandDrivers.thermalStressLevel === 'High'
                    ? 'text-rose-600'
                    : 'text-amber-700'
                }`}
              >
                {locationDemandDrivers.thermalStressLevel} Stress
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-600 block uppercase">Microclimate UHI</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                +{locationDemandDrivers.uhiOffsetDegC}°C
              </span>
              <span className="text-[10px] font-medium text-slate-500">Local surface trap</span>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-600 block uppercase">Vulnerable Total</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">
                {(locationDemandDrivers.vulnerablePopulationTotal / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] font-medium text-slate-500">{locationDemandDrivers.builtDensityPct}% built density</span>
            </div>
          </div>
        )}

        {/* CLINICAL CASELOAD ESTIMATES FOR THIS LOCATION */}
        {locationDemandDrivers?.clinicalCaseloadModel && (
          <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span className="font-bold text-blue-950">Local Clinical Caseload:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-semibold text-slate-700">
                OPD Dehydration: <strong className="text-blue-800">{locationDemandDrivers.clinicalCaseloadModel.heatExhaustionOPD}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700">
                ER Heatstroke: <strong className="text-rose-700">{locationDemandDrivers.clinicalCaseloadModel.heatStrokeEmergencyAdmissions}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700">
                Cardiac Strain: <strong className="text-amber-800">{locationDemandDrivers.clinicalCaseloadModel.cardiacStrainCases}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* WARD-LEVEL VULNERABILITY + HEALTH RISK DISPLAY SECTION       */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Section Top Controls & Location Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                WARD-LEVEL VULNERABILITY & HEALTH RISK
              </span>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                📍 {currentLocation.shortName}
              </span>
              {currentLocation.isUserLocation && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  User GPS Active
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              High-Risk Wards Demographic & Health Risk Mapping
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Horizontal health-vulnerability summary for every high-risk ward. Total vulnerable is computed via non-overlapping bounded union.
            </p>
          </div>

          {/* Quick Location Switcher Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
              Location:
            </span>
            {QUICK_LOCATION_CHOICES.map((loc) => {
              const isSelected = currentLocation.shortName?.toLowerCase() === loc.shortName.toLowerCase();
              return (
                <button
                  key={loc.shortName}
                  type="button"
                  onClick={() =>
                    setLocation({
                      name: loc.name,
                      shortName: loc.shortName,
                      lat: loc.lat,
                      lng: loc.lng,
                      isUserLocation: false,
                    })
                  }
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                  }`}
                >
                  📍 {loc.shortName}
                </button>
              );
            })}
            <button
              type="button"
              onClick={detectUserGpsLocation}
              disabled={isLocatingGps}
              title="Drive demand ranking from current device GPS location"
              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border flex items-center gap-1 ${
                currentLocation.isUserLocation
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              {isLocatingGps ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Crosshair className="w-3 h-3 text-emerald-600" />
              )}
              <span>My GPS</span>
            </button>
          </div>
        </div>

        {/* WARD DETAIL PANEL (SECTION 12) */}
        {activeArea && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50/80 via-white to-orange-50/40 border-2 border-orange-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    FOCUSED WARD DETAIL
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {activeArea.zone} • Population: {activeArea.population ? activeArea.population.toLocaleString() : 'N/A'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {activeArea.wardName}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full ${
                    activeArea.healthRisk === 'Critical'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : activeArea.healthRisk === 'High'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-amber-500 text-white shadow-xs'
                  }`}
                >
                  {activeArea.healthRisk} Health Risk
                </span>

                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer shadow-2xs"
                >
                  <span>{showTechnicalDetails ? 'Simple View' : 'View Details'}</span>
                  {showTechnicalDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 5 Primary Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="p-3 bg-white rounded-xl border border-rose-100 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Vulnerable
                  <InfoTooltip text="Estimated number of people belonging to one or more configured heat-vulnerable groups. Overlap between groups is accounted for where possible." />
                </span>
                <span className="text-lg font-black text-rose-700 my-1 block">
                  {(activeArea.totalVulnerable || activeArea.vulnerablePopulation || 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  {activeArea.sources?.totalVulnerable || 'THERMASHIELD ESTIMATED'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Seniors (65+)
                </span>
                <span className="text-lg font-black text-slate-900 my-1 block">
                  {(activeArea.seniors65Plus || activeArea.vulnerabilityBreakdown?.elderly65Plus || 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {activeArea.sources?.seniors65Plus || 'OFFICIAL CENSUS 2011'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Outdoor Workers
                  <InfoTooltip text="Estimated from available occupational/workforce data when direct ward-level outdoor-worker records are unavailable." />
                </span>
                <span className="text-lg font-black text-slate-900 my-1 block">
                  {(activeArea.outdoorWorkers || activeArea.vulnerabilityBreakdown?.outdoorWorkers || 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                  {activeArea.sources?.outdoorWorkers || 'ESTIMATED OUTDOOR-EXPOSED WORKERS'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Chronic Comorb
                  <InfoTooltip text="Source-dependent health estimate. Ward-level values are used when authorized data is available; otherwise an appropriately labelled geographic estimate is shown." />
                </span>
                <span className="text-lg font-black text-slate-900 my-1 block">
                  {(activeArea.chronicComorbidities || activeArea.vulnerabilityBreakdown?.chronicConditions || 0).toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {activeArea.sources?.chronicComorbidities || 'DISTRICT HEALTH ESTIMATE'}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Health Risk
                </span>
                <div className="my-1">
                  <span
                    className={`text-sm font-black uppercase px-2 py-0.5 rounded-full inline-block ${
                      activeArea.healthRisk === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : activeArea.healthRisk === 'High'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeArea.healthRisk}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {activeArea.sources?.healthRisk || 'THERMASHIELD MODELLED'}
                </span>
              </div>
            </div>

            {/* Technical Information Expandable Panel (Section 12) */}
            {showTechnicalDetails && (
              <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Ward Population
                    </span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {activeArea.population ? activeArea.population.toLocaleString() : 'N/A'} citizens
                    </span>
                    <span className="text-[10px] text-slate-500">Official Census record</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Thermal Stress
                    </span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {activeArea.thermalStress || 'Elevated Stress'}
                    </span>
                    <span className="text-[10px] text-slate-500">WBGT + Microclimate UHI</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Expected Health Demand
                    </span>
                    <span className="text-sm font-black text-blue-700 mt-0.5 block">
                      ~{activeArea.expectedDailyAdmissions} admissions / day
                    </span>
                    <span className="text-[10px] text-slate-500">{activeArea.expectedDemand}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Risk Trend
                    </span>
                    <span className="text-sm font-black text-orange-700 mt-0.5 block">
                      {activeArea.riskTrend || 'Stable'}
                    </span>
                    <span className="text-[10px] text-slate-500">5-Day forecast trajectory</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Vulnerable Exposure Notes
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {activeArea.vulnerableExposureNotes}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl">
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                      Recommended Health Action
                    </span>
                    <p className="text-emerald-950 font-bold leading-relaxed">
                      {activeArea.recommendedHealthAction}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200/50 text-xs text-slate-500 gap-2">
                  <span>108 Ambulances alert ready • Dedicated heat stroke emergency protocol active</span>
                  <button
                    onClick={() => setActiveHealthcarePage('facility-readiness')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verify Facility Readiness</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ALL HIGH-RISK WARDS SUMMARY CARDS LIST (SECTION 1 FORMAT) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              All Monitored High-Risk Wards ({areas.length} Monitored Areas)
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Click any ward card to focus details
            </span>
          </div>

          {areas.length > 0 ? (
            areas.map((ward, idx) => {
              const isSelected = activeArea?.wardId === ward.wardId;
              const totalVuln = ward.totalVulnerable || ward.vulnerablePopulation || 0;
              const seniors = ward.seniors65Plus || ward.vulnerabilityBreakdown?.elderly65Plus || 0;
              const outdoor = ward.outdoorWorkers || ward.vulnerabilityBreakdown?.outdoorWorkers || 0;
              const chronic = ward.chronicComorbidities || ward.vulnerabilityBreakdown?.chronicConditions || 0;

              return (
                <div
                  key={ward.wardId}
                  onClick={() => setSelectedRiskArea(ward)}
                  className={`rounded-2xl border transition-all cursor-pointer p-4 ${
                    isSelected
                      ? 'bg-orange-50/20 border-orange-400 ring-2 ring-orange-400/40 shadow-xs'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header Line */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        HIGH-RISK AREA #{idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight">
                        {ward.wardName}
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">
                        • {ward.zone}
                      </span>
                      {ward.population && (
                        <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                          Pop: {ward.population.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          ward.healthRisk === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : ward.healthRisk === 'High'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ward.healthRisk} Risk
                      </span>

                      <span className="text-[11px] font-bold text-slate-400">
                        {isSelected ? '✓ Active Focused' : 'Click to Focus'}
                      </span>
                    </div>
                  </div>

                  {/* 5-Column Horizontal Summary Grid Matching Section 1 */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                    {/* 1. TOTAL VULNERABLE */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        TOTAL VULNERABLE
                        <InfoTooltip text="Estimated number of people belonging to one or more configured heat-vulnerable groups. Overlap between groups is accounted for where possible." />
                      </span>
                      <span className="text-base sm:text-lg font-black text-rose-700 my-0.5 block">
                        {totalVuln.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 truncate">
                        {ward.sources?.totalVulnerable || 'THERMASHIELD ESTIMATED'}
                      </span>
                    </div>

                    {/* 2. SENIORS (65+) */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        SENIORS (65+)
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 my-0.5 block">
                        {seniors.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                        {ward.sources?.seniors65Plus || 'OFFICIAL CENSUS 2011'}
                      </span>
                    </div>

                    {/* 3. OUTDOOR WORKERS */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        OUTDOOR WORKERS
                        <InfoTooltip text="Estimated from available occupational/workforce data when direct ward-level outdoor-worker records are unavailable." />
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 my-0.5 block">
                        {outdoor.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 truncate">
                        {ward.sources?.outdoorWorkers || 'ESTIMATED OUTDOOR-EXPOSED WORKERS'}
                      </span>
                    </div>

                    {/* 4. CHRONIC COMORBIDITIES */}
                    <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        CHRONIC COMORBIDITIES
                        <InfoTooltip text="Source-dependent health estimate. Ward-level values are used when authorized data is available; otherwise an appropriately labelled geographic estimate is shown." />
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 my-0.5 block">
                        {chronic.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 truncate">
                        {ward.sources?.chronicComorbidities || 'DISTRICT HEALTH ESTIMATE'}
                      </span>
                    </div>

                    {/* 5. HEALTH RISK */}
                    <div className="col-span-2 sm:col-span-1 p-2.5 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        HEALTH RISK
                      </span>
                      <div className="my-0.5">
                        <span
                          className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full inline-block ${
                            ward.healthRisk === 'Critical'
                              ? 'bg-rose-600 text-white'
                              : ward.healthRisk === 'High'
                              ? 'bg-orange-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {ward.healthRisk}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                        {ward.sources?.healthRisk || 'THERMASHIELD MODELLED'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
              No monitored wards found for {currentLocation.name}. Choose a location above or use My GPS.
            </div>
          )}
        </div>

        {/* Footer Provenance Note */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            Total Vulnerable is calculated using the bounded union formula: <em>V = Pop × [1 - (1-S)×(1-O)×(1-C)]</em> to avoid multi-group duplicate counting.
          </span>
          <span className="font-semibold text-slate-600">
            Source: Official Census 2011 • NFHS-5 Health Survey • IMD Real-Time Weather
          </span>
        </div>
      </div>
    </div>
  );
};

