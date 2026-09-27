import React from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterRegionSelector } from '../../components/disaster/DisasterRegionSelector.js';
import { ActiveLocationSpotlightBar } from '../../components/disaster/ActiveLocationSpotlightBar.js';
import {
  Scale,
  ShieldAlert,
  Droplets,
  Building,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Radio,
  Check,
} from 'lucide-react';

export const DisasterProtectionShortfallPage: React.FC = () => {
  const { selectedRegion, summary, affectedAreas, selectedArea, selectArea } = useDisaster();

  // Sorted by highest shortfall deficit
  const sortedShortfalls = [...affectedAreas].sort(
    (a, b) => b.protectionShortfall.shortfallPercentage - a.protectionShortfall.shortfallPercentage
  );

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 0. Location Selector Bar (Phase 2) */}
      <DisasterRegionSelector />

      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
              CAPACITY DEFICIT AUDIT
            </span>
            <span className="text-xs font-bold text-slate-400">
              {selectedRegion.name} • Expected Need vs. Available Protection
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Protection Shortfall — {selectedRegion.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Where might available protection be insufficient? Shared ThermaShield shortfall calculation
          </p>
        </div>

        {/* Regional Deficit Overview Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
          <Scale className="w-5 h-5 text-amber-700 shrink-0" />
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-800 block">
              REGIONAL PROTECTION DEFICIT
            </span>
            <span className="text-base font-black text-amber-950">
              {summary.protectionShortfall.overallShortfallPct}% Overall Unmet Need
            </span>
          </div>
        </div>
      </div>

      {/* Active Location Spotlight Bar */}
      <ActiveLocationSpotlightBar />

      {/* Overview Metric Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
            EXPECTED REGIONAL NEED
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900">
            {summary.protectionShortfall.expectedNeedSummary.split('&')[0]}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {summary.protectionShortfall.expectedNeedSummary.split('&')[1] || 'Adequate public hydration'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
            AVAILABLE PROTECTION DEPLOYED
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700">
            {summary.protectionShortfall.availableProtectionSummary.split('&')[0]}
          </span>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {summary.protectionShortfall.availableProtectionSummary.split('&')[1] || 'Current field supply'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
            CRITICAL DEFICIT SECTOR
          </span>
          <span className="text-xl sm:text-2xl font-black text-red-600">
            Labor Corridors
          </span>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {summary.protectionShortfall.mostDeficientSector}
          </p>
        </div>
      </div>

      {/* Main Shortfall Table / List */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs">
        <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
              AREA-WISE PROTECTION SHORTFALL DIRECTORY — {selectedRegion.name}
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Ranked by shortfall gap severity (Expected Need vs. Available Protection)
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {sortedShortfalls.length} Monitored Sectors
          </span>
        </div>

        <div className="space-y-3">
          {sortedShortfalls.map((area) => {
            const isCurrentActive = selectedArea?.id === area.id;
            return (
              <div
                key={area.id}
                onClick={() => selectArea(area)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isCurrentActive
                    ? 'bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400'
                    : 'border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20'
                }`}
              >
                {/* 1. Area */}
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">
                      {area.name}
                    </h3>
                    {isCurrentActive && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 shadow-2xs">
                        <Radio className="w-2.5 h-2.5 animate-pulse" /> Active Choice
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {area.district} • {area.zone}
                  </p>
                </div>

                {/* 2. Expected Protection Need */}
                <div className="min-w-[160px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    EXPECTED PROTECTION NEED
                  </span>
                  <span className="text-xs font-black text-slate-900 mt-0.5 block">
                    {area.protectionShortfall.sheltersRequired} Cooling Shelters
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Need Score: {area.protectionShortfall.expectedNeedScore}/100
                  </span>
                </div>

                {/* 3. Available Protection */}
                <div className="min-w-[160px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    AVAILABLE PROTECTION
                  </span>
                  <span className="text-xs font-black text-emerald-700 mt-0.5 block">
                    {area.protectionShortfall.sheltersOperational} Shelters Operational
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Capacity Score: {area.protectionShortfall.availableProtectionScore}/100
                  </span>
                </div>

                {/* 4. Shortfall */}
                <div className="min-w-[160px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    SHORTFALL
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        area.protectionShortfall.shortfallPercentage >= 50
                          ? 'bg-red-600 text-white'
                          : area.protectionShortfall.shortfallPercentage > 20
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {area.protectionShortfall.shortfallPercentage}% Deficit
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      -{area.protectionShortfall.sheltersRequired - area.protectionShortfall.sheltersOperational} shelters
                    </span>
                  </div>
                  <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                    {area.protectionShortfall.hydrationDeficitLitres > 0
                      ? `-${area.protectionShortfall.hydrationDeficitLitres.toLocaleString('en-IN')} L water/day`
                      : 'Hydration adequate'}
                  </span>
                </div>

                {/* Select button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectArea(area);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 self-end lg:self-center ${
                    isCurrentActive
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCurrentActive ? 'Active Location' : 'Select Location'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
