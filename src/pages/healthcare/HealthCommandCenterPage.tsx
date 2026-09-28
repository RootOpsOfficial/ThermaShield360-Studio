import React, { useState } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import { LocationHeatRiskMap } from '../../components/healthcare/LocationHeatRiskMap.js';
import { DataValidationCenter } from '../../components/data/DataValidationCenter.js';
import { SourceDataTable } from '../../components/data/SourceDataTable.js';
import {
  Activity,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Scale,
  ArrowRight,
  Bell,
  Clock,
  MapPin,
  RefreshCw,
  Calendar,
  Building,
  Users,
  Crosshair,
} from 'lucide-react';

export const HealthCommandCenterPage: React.FC = () => {
  const {
    summary,
    isLoading,
    isRefreshing,
    refreshHealthcareData,
    setActiveHealthcarePage,
    setSelectedRiskArea,
    currentLocation,
    setLocation,
    detectUserGpsLocation,
    isLocatingGps,
  } = useHealthcare();

  const [showValidationCenter, setShowValidationCenter] = useState(false);

  if (isLoading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] text-slate-500 text-sm gap-3">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-slate-700 text-base">Connecting to Health Command Center Feed...</p>
        <p className="text-xs text-slate-400">Loading IMD synoptic telemetry & modelled healthcare impact data</p>
      </div>
    );
  }

  const { cards, fiveDayOutlook, highRiskAreas, facilityReadiness, demandCapacity, currentAction, activeAlert, locationDemandDrivers } = summary;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ============================================================ */}
      {/* HEADER                                                       */}
      {/* ============================================================ */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              HEALTH COMMAND CENTER
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Health Command Center
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-0.5">
            {summary.facilityName} • {summary.organization}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-medium mt-1">
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {summary.monitoredArea}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {summary.dateTime}
            </span>
          </div>
        </div>

        {/* Quick Top Actions: Refresh & Primary Navigation */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => refreshHealthcareData()}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all border border-black/5"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => setActiveHealthcarePage('facility-profile')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200"
          >
            <Building className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit Facility Data</span>
          </button>

          <button
            onClick={() => setShowValidationCenter(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Audit Meteorological Provenance & Surge Estimator Inputs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data Sources & Validation</span>
          </button>

          <button
            onClick={() => setActiveHealthcarePage('facility-readiness')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Facility Readiness</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FOUR PRIMARY CARDS ONLY                                      */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: 3-5 DAY HEALTH RISK */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>3–5 Day Health Risk</span>
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-orange-600 tracking-tight">
                {cards.healthRisk.status}
              </span>
              <span className="text-xs font-bold text-slate-400">
                ({cards.healthRisk.score}/100)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              {cards.healthRisk.explanation}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Source</span>
            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {cards.healthRisk.badge}
            </span>
          </div>
        </div>

        {/* CARD 2: HOSPITALIZATION RISK */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Hospitalization Risk</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600 tracking-tight">
                {cards.hospitalizationRisk.signal}
              </span>
              <span className="text-xs font-bold text-rose-700">
                {cards.hospitalizationRisk.trend}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              {cards.hospitalizationRisk.explanation}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Source</span>
            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              {cards.hospitalizationRisk.badge}
            </span>
          </div>
        </div>

        {/* CARD 3: MORTALITY-RISK SIGNAL */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Mortality-Risk Signal</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {cards.mortalityRiskSignal.signal}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              {cards.mortalityRiskSignal.explanation}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Source</span>
            <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              {cards.mortalityRiskSignal.badge}
            </span>
          </div>
        </div>

        {/* CARD 4: EXPECTED PATIENT DEMAND */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Expected Patient Demand</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-700 tracking-tight">
                {cards.expectedPatientDemand.demandLevel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
              {cards.expectedPatientDemand.explanation}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Source</span>
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              {cards.expectedPatientDemand.badge}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5-DAY HEALTH OUTLOOK (SIMPLE VISUALS)                         */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              5-Day Health Impact Outlook
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Modelled Health Risk • IMD Weather Basis</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {fiveDayOutlook.map((d, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between text-center transition-all ${
                d.healthRisk === 'Critical'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : d.healthRisk === 'High'
                  ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                  : d.healthRisk === 'Moderate'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  {d.dayName}
                </span>
                <p className="text-lg font-black tracking-tight my-0.5">{d.tempMax}°C</p>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                    d.healthRisk === 'Critical'
                      ? 'bg-rose-600 text-white'
                      : d.healthRisk === 'High'
                      ? 'bg-orange-600 text-white'
                      : d.healthRisk === 'Moderate'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {d.healthRisk} Risk
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-black/5 text-[10px] space-y-0.5 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hospital:</span>
                  <span className="font-bold text-rose-700">+{d.hospitalizationIncreasePct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mortality:</span>
                  <span className="font-semibold text-slate-700">{d.mortalityRiskSignal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trend:</span>
                  <span className="font-medium text-slate-600">{d.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* LOCATION HEAT RISK MAP & CHECKER (USER CHOICE MAP)           */}
      {/* ============================================================ */}
      <LocationHeatRiskMap />

      {/* ============================================================ */}
      {/* MAIN HOME AREA: HIGH-RISK AREAS & FACILITY READINESS          */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* LEFT: HEALTH DEMAND DRIVERS BASED ON LOCATION (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    HEALTH DEMAND DRIVERS
                  </span>
                  {currentLocation.isUserLocation ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      User Location (GPS)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[190px]">
                      📍 {currentLocation.shortName}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span>Driven by: {currentLocation.shortName}</span>
                </h3>
                <p className="text-[11px] text-slate-500 truncate max-w-sm">
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

                <button
                  onClick={() => setActiveHealthcarePage('risk-areas')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>All Areas</span>
                  <ArrowRight className="w-3 h-3" />
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
              <div className="p-2.5 rounded-2xl bg-blue-50/70 border border-blue-100 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
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

            {/* HIGH-RISK AREAS: WARD DEMOGRAPHIC MAPPING & RISK */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  High-Risk Areas • Demographic Summary ({highRiskAreas.length} Monitored Wards)
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  Census + Occupational + Health Estimates
                </span>
              </div>

              {highRiskAreas.slice(0, 4).map((area) => (
                <div
                  key={area.wardId}
                  onClick={() => {
                    setSelectedRiskArea(area);
                    setActiveHealthcarePage('risk-areas');
                  }}
                  className="p-3 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/60 hover:border-slate-300 transition-all cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          HIGH-RISK AREA
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                          {area.wardName}
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {area.zone} • Population: {area.population ? area.population.toLocaleString() : 'N/A'}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        area.healthRisk === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : area.healthRisk === 'High'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {area.healthRisk} Risk
                    </span>
                  </div>

                  {/* 5-Metric Compact Grid per Section 10 */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center pt-2 border-t border-slate-200/50">
                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Vuln</span>
                      <span className="text-xs font-black text-rose-700 block">
                        {(area.totalVulnerable || area.vulnerablePopulation || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Seniors 65+</span>
                      <span className="text-xs font-bold text-slate-800 block">
                        {(area.seniors65Plus || area.vulnerabilityBreakdown?.elderly65Plus || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Outdoor Wrk</span>
                      <span className="text-xs font-bold text-slate-800 block">
                        {(area.outdoorWorkers || area.vulnerabilityBreakdown?.outdoorWorkers || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white/80 p-1.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Chronic Comorb</span>
                      <span className="text-xs font-bold text-slate-800 block">
                        {(area.chronicComorbidities || area.vulnerabilityBreakdown?.chronicConditions || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-white/80 p-1.5 rounded-xl border border-slate-100 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Health Risk</span>
                        <span
                          className={`text-[10px] font-black uppercase ${
                            area.healthRisk === 'Critical'
                              ? 'text-rose-700'
                              : area.healthRisk === 'High'
                              ? 'text-orange-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {area.healthRisk}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1">
            <span>Modelled from real-time heat + built surface density at {currentLocation.shortName}</span>
            <span className="font-semibold text-slate-600">Synced with Map & GPS</span>
          </div>
        </div>

        {/* RIGHT: FACILITY READINESS (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  HOSPITAL PREPAREDNESS
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Facility Readiness
                </h3>
              </div>

              <span
                className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                  facilityReadiness.overallStatus === 'READY'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : facilityReadiness.overallStatus === 'NEEDS ATTENTION'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {facilityReadiness.overallStatus} ({facilityReadiness.overallScorePct}%)
              </span>
            </div>

            {/* Compact Readiness Summary */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Emergency Capacity</span>
                <span className="font-bold text-slate-900">
                  {facilityReadiness.metrics.emergencyCapacity.current} / {facilityReadiness.metrics.emergencyCapacity.total} {facilityReadiness.metrics.emergencyCapacity.unit}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Staff Readiness</span>
                <span className="font-bold text-emerald-700">
                  {facilityReadiness.metrics.staffReadiness.current}% Rostered
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Heat-care Preparedness</span>
                <span className="font-bold text-emerald-700">
                  {facilityReadiness.metrics.heatCarePreparedness.current}% Stocked
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">Available ICU Capacity</span>
                <span className="font-bold text-amber-700">
                  {facilityReadiness.metrics.availableCapacity.current} {facilityReadiness.metrics.availableCapacity.unit} Free
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Evaluated {facilityReadiness.lastEvaluated}
            </span>
            <button
              onClick={() => setActiveHealthcarePage('facility-readiness')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Manage Protocol Checklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DEMAND VS CAPACITY (CLEAN PROGRESS / BAR VISUAL)             */}
      {/* ============================================================ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                CAPACITY & DEMAND ANALYSIS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                Source: {demandCapacity.capacityProvenance}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Expected Heat-Related Demand vs Available Capacity
            </h3>
          </div>

          <span
            className={`text-xs font-black px-2.5 py-1 rounded-full border self-start sm:self-auto ${
              demandCapacity.capacityGapStatus === 'Adequate'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : demandCapacity.capacityGapStatus === 'CAPACITY NOT YET PROVIDED'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {demandCapacity.capacityGapStatus}
          </span>
        </div>

        {/* 3-Bar Stack: Expected Demand, Available Capacity, Capacity Gap */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">Expected Demand (MODELLED)</span>
              <span className="text-blue-700 font-black">{demandCapacity.expectedDemandPatients} patients / day</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (demandCapacity.expectedDemandPatients / 150) * 100)}%` }}
              ></div>
            </div>
          </div>

          {demandCapacity.isCapacityEntered && demandCapacity.availableCapacityBeds !== null ? (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700">
                  Available Capacity (FACILITY ENTERED
                  {demandCapacity.lastCapacityUpdate ? ` • ${demandCapacity.lastCapacityUpdate}` : ''})
                </span>
                <span className="text-emerald-700 font-black">{demandCapacity.availableCapacityBeds} beds</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (demandCapacity.availableCapacityBeds / 150) * 100)}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Available Facility Capacity</span>
                <span className="text-xs text-amber-800 font-medium">
                  CAPACITY NOT YET PROVIDED — Hospital administrator has not entered operational bed numbers.
                </span>
              </div>
              <button
                onClick={() => setActiveHealthcarePage('facility-profile')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-all"
              >
                Enter Facility Capacity
              </button>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">Capacity Gap</span>
              <span
                className={
                  demandCapacity.capacityGapPatients !== null && demandCapacity.capacityGapPatients > 0
                    ? 'text-rose-600 font-black'
                    : demandCapacity.capacityGapPatients !== null
                    ? 'text-emerald-700 font-black'
                    : 'text-amber-700 font-bold'
                }
              >
                {demandCapacity.capacityGapPatients !== null
                  ? demandCapacity.capacityGapPatients > 0
                    ? `-${demandCapacity.capacityGapPatients} patient deficit`
                    : 'Zero Deficit (Adequate Capacity)'
                  : 'CAPACITY NOT YET PROVIDED'}
              </span>
            </div>
            {demandCapacity.capacityGapPatients !== null ? (
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    demandCapacity.capacityGapPatients > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (demandCapacity.capacityGapPatients / 150) * 100)}%` }}
                ></div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Hospital bed inventory required to compute exact capacity gap. Click "Enter Facility Capacity" above.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Forward projection calibrated for {currentLocation.shortName} ({demandCapacity.expectedDemandPatients} modeled patient demand / day)
          </span>
          <button
            onClick={() => setActiveHealthcarePage('demand-capacity')}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Detailed Surge Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CURRENT HEALTH ACTION & ACTIVE HEALTH ALERT                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* CURRENT HEALTH ACTION */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Current Health Action
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                RECOMMENDED
              </span>
            </div>

            {/* WHAT, WHERE, WHEN, WHY */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  WHAT:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">{currentAction.what}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    WHERE:
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{currentAction.where}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    WHEN:
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{currentAction.when}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                  WHY:
                </span>
                <p className="font-semibold text-amber-950 mt-0.5">{currentAction.why}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Directive: ER Preparedness Protocol</span>
            <button
              onClick={() => setActiveHealthcarePage('facility-readiness')}
              className="px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>View Preparedness</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ACTIVE HEALTH ALERT */}
        <div className="bg-gradient-to-br from-rose-50/60 via-white to-white rounded-3xl p-5 sm:p-6 border border-rose-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-900">
                  Active Health Alert
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-base font-black text-slate-900 tracking-tight">
                  {activeAlert.title}
                </h4>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                  {activeAlert.what}
                </p>
              </div>

              <div className="p-3.5 bg-white/95 rounded-2xl border border-rose-200 text-xs shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                  Recommended:
                </span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {activeAlert.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-rose-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Broadcast to ERs & 108 Squads</span>
            <button
              onClick={() => setActiveHealthcarePage('alerts')}
              className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DATA SOURCE & VALIDATION PROVENANCE TABLE                    */}
      {/* ============================================================ */}
      <div className="pt-2">
        <SourceDataTable
          lat={currentLocation?.lat ?? 18.5204}
          lng={currentLocation?.lng ?? 73.8567}
          title="Healthcare Data Sources & Validation Provenance"
          subtitle="Traceable clinical meteorology & in-situ station inputs powering heatwave morbidity projections"
          onOpenValidationCenter={() => setShowValidationCenter(true)}
        />
      </div>

      {showValidationCenter && (
        <DataValidationCenter isModal onClose={() => setShowValidationCenter(false)} />
      )}
    </div>
  );
};
