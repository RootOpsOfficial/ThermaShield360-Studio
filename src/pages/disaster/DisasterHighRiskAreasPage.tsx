import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterRegionSelector } from '../../components/disaster/DisasterRegionSelector.js';
import { RealGoogleRegionalMap } from '../../components/disaster/RealGoogleRegionalMap.js';
import { AreaDetailDrawer } from '../../components/disaster/AreaDetailDrawer.js';
import { ActiveLocationSpotlightBar } from '../../components/disaster/ActiveLocationSpotlightBar.js';
import { DisasterAffectedArea } from '../../types/disaster.js';
import {
  MapPin,
  Flame,
  HeartPulse,
  Scale,
  TrendingUp,
  Maximize2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Compass,
  Radio,
  Check,
} from 'lucide-react';

export const DisasterHighRiskAreasPage: React.FC = () => {
  const { selectedRegion, affectedAreas, selectedArea, setSelectedArea, selectArea } = useDisaster();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState<'all' | 'Critical' | 'High' | 'Developing'>('all');

  const filteredAreas =
    riskFilter === 'all'
      ? affectedAreas
      : affectedAreas.filter((a) => a.heatRisk === riskFilter);

  const handleAreaClick = (area: DisasterAffectedArea) => {
    selectArea(area);
    setIsDrawerOpen(true);
  };

  const handleViewOnMap = (area: DisasterAffectedArea) => {
    selectArea(area);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 0. Location Selector Bar (Phase 2) */}
      <DisasterRegionSelector />

      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              PRIORITY INCIDENT SITES
            </span>
            <span className="text-xs font-bold text-slate-400">
              {selectedRegion.name} • Real GIS Spatial Mapping
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            High-Risk Areas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Where should attention be focused? GIS spatial mapping, affected area directory & side panel details
          </p>
        </div>

        {/* Severity Count Pills */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-2xl bg-red-100 text-red-800 font-bold text-xs border border-red-200">
            {affectedAreas.filter((a) => a.heatRisk === 'Critical').length} Critical Sites
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-orange-100 text-orange-800 font-bold text-xs border border-orange-200">
            {affectedAreas.filter((a) => a.heatRisk === 'High').length} High Vulnerability
          </span>
        </div>
      </div>

      {/* Active Location Spotlight Bar */}
      <ActiveLocationSpotlightBar onInspectArea={handleAreaClick} />

      {/* 1. Real Google Regional Map (Phase 9) */}
      <div>
        <RealGoogleRegionalMap onSelectArea={handleAreaClick} />
      </div>

      {/* 2. Affected-Area List */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
              AFFECTED AREAS DIRECTORY — {selectedRegion.name}
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Click any area to open the side panel with complete heat status, health impact, and response coordination
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5">
            {(['all', 'Critical', 'High', 'Developing'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-all ${
                  riskFilter === r
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'all' ? `All (${affectedAreas.length})` : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Card List */}
        <div className="space-y-3">
          {filteredAreas.map((area) => {
            const isCurrentActive = selectedArea?.id === area.id;
            return (
              <div
                key={area.id}
                onClick={() => handleAreaClick(area)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group ${
                  isCurrentActive
                    ? 'bg-red-50/80 border-red-500 shadow-sm ring-1 ring-red-400'
                    : 'border-slate-200/80 hover:border-red-300 hover:bg-red-50/20'
                }`}
              >
                {/* Area Info */}
                <div className="flex items-start gap-3 min-w-[220px]">
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
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-red-700 transition-colors">
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
                </div>

                {/* Heat Risk & Temperature */}
                <div className="min-w-[130px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    HEAT RISK
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        area.heatRisk === 'Critical'
                          ? 'bg-red-600 text-white'
                          : area.heatRisk === 'High'
                          ? 'bg-orange-500 text-white'
                          : 'bg-amber-400 text-amber-950'
                      }`}
                    >
                      {area.heatRisk}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {area.temperatureC}°C
                    </span>
                  </div>
                </div>

                {/* Trend */}
                <div className="min-w-[110px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    TREND
                  </span>
                  <span className="text-xs font-extrabold text-red-600 mt-0.5 block">
                    {area.trend}
                  </span>
                </div>

                {/* Health Impact */}
                <div className="min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    HEALTH IMPACT
                  </span>
                  <span className="text-xs font-extrabold text-rose-700 mt-0.5 block">
                    {area.healthImpact.hospitalizationRiskEstimate}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {area.healthImpact.mortalityRiskSignal} mortality signal
                  </span>
                </div>

                {/* Protection Shortfall */}
                <div className="min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    PROTECTION SHORTFALL
                  </span>
                  <span className="text-xs font-extrabold text-amber-700 mt-0.5 block">
                    {area.protectionShortfall.shortfallPercentage}% Deficit
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {area.protectionShortfall.sheltersOperational} / {area.protectionShortfall.sheltersRequired} shelters
                  </span>
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectArea(area);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isCurrentActive
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Make this area the active location across all features"
                  >
                    {isCurrentActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <span>Select Location</span>
                    )}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAreaClick(area);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Dossier</span>
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Panel Drawer (Phase 9) */}
      {isDrawerOpen && (
        <AreaDetailDrawer
          area={selectedArea}
          onClose={() => setIsDrawerOpen(false)}
          onViewOnMap={handleViewOnMap}
        />
      )}
    </div>
  );
};
