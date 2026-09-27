import React, { useState } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { RealtimeThermalHeatmap } from '../components/RealtimeThermalHeatmap.js';
import { GoogleThermalGisMap } from '../components/GoogleThermalGisMap.js';
import { InteractiveGisMap } from '../components/InteractiveGisMap.js';
import { WardInfo } from '../types.js';
import {
  Map,
  MapPin,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Trees,
  Droplets,
  Snowflake,
  Cross,
  Compass,
  Sparkles,
  Globe2,
  Activity,
} from 'lucide-react';

export const HeatRiskMapPage: React.FC = () => {
  const { location, selectWard, protectionPoints, healthcareFacilities, riskCurrent } = useCitizen();
  const [selectedWard, setSelectedWard] = useState<WardInfo>(location.ward);
  const [mapEngine, setMapEngine] = useState<'heatmap' | 'google' | 'vector'>('heatmap');

  const wardProtection = protectionPoints.filter((p) => p.wardId === selectedWard.id);
  const wardHealthcare = healthcareFacilities.filter((h) => h.wardId === selectedWard.id);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              National & Hyperlocal Heat Risk Intelligence Map
            </h1>
            <span className="apple-badge bg-orange-100 text-orange-800 flex items-center gap-1 font-semibold">
              <Flame className="w-3 h-3 text-orange-600 animate-pulse" /> Pan-India Continuous Surface
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Continuous biometeorological thermal surface across India with progressive Level-of-Detail zoom: National → State → District → City → Ward/Village.
          </p>
        </div>

        {/* Engine Switcher */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 text-xs font-semibold shadow-inner">
            <button
              onClick={() => setMapEngine('heatmap')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                mapEngine === 'heatmap'
                  ? 'bg-orange-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Thermal Heatmap</span>
            </button>
            <button
              onClick={() => setMapEngine('google')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                mapEngine === 'google'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>
            <button
              onClick={() => setMapEngine('vector')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                mapEngine === 'vector'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Analytical Schematic</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Scale Interactive Map Card */}
      <section className="apple-card p-4 sm:p-5">
        {mapEngine === 'heatmap' ? (
          <RealtimeThermalHeatmap
            heightClass="h-[600px]"
            initialMetric="wbgt"
          />
        ) : mapEngine === 'google' ? (
          <GoogleThermalGisMap
            heightClass="h-[560px]"
            showLayerSelector={true}
            centerLat={location.lat}
            centerLng={location.lng}
            zoom={14}
          />
        ) : (
          <InteractiveGisMap
            heightClass="h-[520px]"
            showLayerSelector={true}
            selectedWardId={selectedWard.id}
            onSelectWard={(ward) => setSelectedWard(ward)}
          />
        )}
      </section>

      {/* Ward Intelligence Deep-Dive Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Overview & Risk Stats */}
        <div className="apple-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Selected Ward</span>
              <h3 className="font-extrabold text-slate-900 text-base">{selectedWard.name}</h3>
              <p className="text-xs text-slate-500">{selectedWard.zone}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                selectedWard.vulnerabilityIndex >= 70
                  ? 'bg-red-100 text-red-700'
                  : selectedWard.vulnerabilityIndex >= 50
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {selectedWard.vulnerabilityIndex >= 70
                ? 'High Risk'
                : selectedWard.vulnerabilityIndex >= 50
                ? 'Moderate Risk'
                : 'Low Risk'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-black/5">
              <span className="text-[10px] text-slate-400 block font-bold">Tree Canopy</span>
              <span className="text-base font-extrabold text-emerald-700">{selectedWard.treeCanopyPct}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-black/5">
              <span className="text-[10px] text-slate-400 block font-bold">Built Density</span>
              <span className="text-base font-extrabold text-slate-900">{selectedWard.builtDensityPct}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-black/5">
              <span className="text-[10px] text-slate-400 block font-bold">UHI Heat Offset</span>
              <span className="text-base font-extrabold text-orange-600">+{selectedWard.uhiOffsetDegC}°C</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-black/5">
              <span className="text-[10px] text-slate-400 block font-bold">Vulnerable Population</span>
              <span className="text-base font-extrabold text-slate-900">{selectedWard.vulnerableCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* High-Risk and Low-Risk Micro-Areas */}
        <div className="apple-card p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Microclimate Heat Pockets</h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 text-xs">
              <span className="font-bold text-red-900 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Critical Solar Exposure & Asphalt Hotspots
              </span>
              <ul className="list-disc pl-4 space-y-1 text-red-800 text-[11px]">
                {selectedWard.highRiskAreas.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Natural Shaded Refuges & Tree Corridors
              </span>
              <ul className="list-disc pl-4 space-y-1 text-emerald-800 text-[11px]">
                {selectedWard.lowRiskAreas.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Civic Protection & Health Points in Ward */}
        <div className="apple-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <h3 className="font-bold text-slate-900 text-sm">Protection In This Ward</h3>
            <span className="text-xs text-slate-400 font-semibold">{wardProtection.length} Hubs</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {wardProtection.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No dedicated municipal facilities registered in this ward boundary yet.
              </p>
            ) : (
              wardProtection.map((pt) => (
                <div key={pt.id} className="p-2.5 rounded-xl bg-slate-50 border border-black/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`p-1.5 rounded-lg ${
                        pt.type === 'water'
                          ? 'bg-blue-100 text-blue-700'
                          : pt.type === 'cooling'
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {pt.type === 'water' ? (
                        <Droplets className="w-3.5 h-3.5" />
                      ) : pt.type === 'cooling' ? (
                        <Snowflake className="w-3.5 h-3.5" />
                      ) : (
                        <Trees className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{pt.name}</p>
                      <p className="text-[10px] text-slate-500">{pt.categoryLabel}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      pt.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
