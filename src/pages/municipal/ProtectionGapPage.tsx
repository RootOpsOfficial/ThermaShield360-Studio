import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import {
  ShieldAlert,
  Droplets,
  Snowflake,
  Trees,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Sliders,
  Building,
  Activity,
  Layers,
} from 'lucide-react';

export const ProtectionGapPage: React.FC = () => {
  const { summary, wards, resources, setActiveMunicipalPage, setSelectedWard } = useMunicipal();
  const [activeTab, setActiveTab] = useState<'comparison' | 'resources' | 'simulator'>('comparison');

  // Simulator state
  const [simWardId, setSimWardId] = useState<string>('ward-21');
  const [extraCooling, setExtraCooling] = useState<number>(2);
  const [extraWater, setExtraWater] = useState<number>(4);
  const [extraShade, setExtraShade] = useState<number>(1);

  const selectedSimWard = wards.find((w) => w.id === simWardId) || wards[0];

  // Calculated simulation impact
  // Each cooling center serves ~600 people, each water point ~250 people, shade canopy ~400 people
  const simulatedAddedCapacity = extraCooling * 600 + extraWater * 250 + extraShade * 400;
  const simulatedNewCapacity = selectedSimWard ? selectedSimWard.capacity + simulatedAddedCapacity : 0;
  const simulatedNewGap = selectedSimWard ? Math.max(0, selectedSimWard.demand - simulatedNewCapacity) : 0;
  const simulatedNewPct = selectedSimWard ? Math.min(100, Math.round((simulatedNewCapacity / selectedSimWard.demand) * 100)) : 0;
  const estimatedBudgetINR = extraCooling * 120000 + extraWater * 35000 + extraShade * 60000;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            PROTECTION & CAPACITY DECISION SYSTEM
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Protection Gap Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Where do we lack cooling shelters, hydration points, and shaded respite?
          </p>
        </div>

        {/* Sub-view Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-black/5 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-2 rounded-xl transition-all ${
              activeTab === 'comparison' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Ward Deficits
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-2 rounded-xl transition-all ${
              activeTab === 'resources' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Civic Resources
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator' ? 'bg-white text-orange-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>What-If Simulator</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards required by Prompt 8 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Highest Deficit Ward */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
            Highest Deficit Ward
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1 truncate">
            {summary?.priorityWard?.name.split(':')[0] || 'Ward 21: Kasba Peth'}
          </h3>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-rose-600">
              {summary?.priorityWard?.protectionGap.toLocaleString() || '4,380'}
            </span>
            <span className="text-xs font-semibold text-slate-500">unserved citizens</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">24% capacity fulfillment</p>
        </div>

        {/* Total Cooling Points Active */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
            Active Cooling Centers
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">24</span>
            <span className="text-xs font-bold text-emerald-600">Civic Sanctuaries</span>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Capacity: 4,200 air-conditioned seats
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Open 10:00 AM – 8:00 PM</p>
        </div>

        {/* Total Water Points Active */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">
            Active Water Points
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">142</span>
            <span className="text-xs font-bold text-cyan-600">Smart Kiosks</span>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            45,000 Liters cold water/day
          </p>
          <p className="text-[11px] text-slate-400 mt-1">PMC Smart Kiosk telemetry live</p>
        </div>

        {/* Overall City Protection Adequacy */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            City Protection Adequacy
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-amber-700">46%</span>
            <span className="text-xs font-bold text-amber-700">Moderate Gap</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '46%' }}></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">14,730 total city deficit</p>
        </div>
      </div>

      {/* TAB 1: WARD DEFICIT COMPARISON LIST */}
      {activeTab === 'comparison' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ward Protection Deficit Ranking
              </h3>
              <p className="text-xs text-slate-500">
                Comparing heat shelter demand against current municipal cooling capacity
              </p>
            </div>
            <button
              onClick={() => setActiveTab('simulator')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-colors w-fit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Extra Resources</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wards.map((ward) => {
              const status =
                ward.protectionGap > 3000
                  ? { label: 'Severe Deficit', color: 'bg-red-100 text-red-700 border-red-200' }
                  : ward.protectionGap > 1000
                  ? { label: 'Deficit Gap', color: 'bg-amber-100 text-amber-800 border-amber-200' }
                  : { label: 'Adequate Coverage', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

              return (
                <div
                  key={ward.id}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {ward.name}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 text-center my-3 bg-white p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Demand</span>
                        <span className="font-bold text-slate-800">{ward.demand.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Capacity</span>
                        <span className="font-bold text-emerald-600">{ward.capacity.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Gap</span>
                        <span className="font-bold text-rose-600">{ward.protectionGap.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                        <span>Fulfillment: {ward.fulfillmentPct}%</span>
                        <span>{ward.vulnerableCount.toLocaleString()} vulnerable residents</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ward.fulfillmentPct < 35
                              ? 'bg-rose-500'
                              : ward.fulfillmentPct < 65
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${ward.fulfillmentPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-1">
                      {ward.recommendedAction}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedWard(ward);
                        setActiveMunicipalPage('ward-risk-map');
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Locate on Map
                    </button>
                    <button
                      onClick={() => {
                        setSimWardId(ward.id);
                        setActiveTab('simulator');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Simulate Additions</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CIVIC RESOURCES DIRECTORY */}
      {activeTab === 'resources' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Citywide Protection Resource Inventory
              </h3>
              <p className="text-xs text-slate-500">
                Active municipal assets deployed across Pune Corporation for heatwave relief
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Live Sensor Telemetry Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((res, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      {res.type}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {res.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{res.name}</h4>
                  <div className="my-2.5">
                    <span className="text-2xl font-black text-slate-800">{res.count}</span>
                    <span className="text-xs text-slate-500 ml-1">Locations</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium bg-white p-2 rounded-xl border border-slate-100">
                    Capacity: <span className="font-bold text-slate-900">{res.capacity}</span>
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between">
                  <span>Audit Source</span>
                  <span className="font-semibold text-slate-600">{res.provenance}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold">Need emergency expansion?</span>
              <p className="text-blue-800 text-[11px]">
                Under Municipal Heat Protocol Level 2, nodal officers may requisition civic schools and transit halls as temporary cooling shelters.
              </p>
            </div>
            <button
              onClick={() => setActiveMunicipalPage('recommended-actions')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 transition-colors"
            >
              Requisition Spaces
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: WHAT-IF SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-1.5 text-orange-600 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Intervention Decision Simulator</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                What-If Protection Gap Simulator
              </h3>
              <p className="text-xs text-slate-500">
                Model the impact of deploying additional cooling shelters, mobile water tankers, or shade canopies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Target Ward:</span>
              <select
                value={simWardId}
                onChange={(e) => setSimWardId(e.target.value)}
                className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
              >
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name.split(':')[0]} ({w.riskLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sliders Area (7 Cols) */}
            <div className="lg:col-span-7 space-y-5 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Adjust Proposed Municipal Interventions
              </h4>

              {/* Slider 1: Extra Cooling Centers */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Snowflake className="w-4 h-4 text-blue-500" />
                    Temporary AC Cooling Centers (+600 cap/center)
                  </span>
                  <span className="text-blue-600 font-extrabold text-sm">+{extraCooling} Centers</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="6"
                  value={extraCooling}
                  onChange={(e) => setExtraCooling(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0</span>
                  <span>3</span>
                  <span>6 Centers</span>
                </div>
              </div>

              {/* Slider 2: Extra Water Tankers & Kiosks */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    Mobile Cold Water Tankers (+250 cap/tanker)
                  </span>
                  <span className="text-cyan-600 font-extrabold text-sm">+{extraWater} Units</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={extraWater}
                  onChange={(e) => setExtraWater(parseInt(e.target.value))}
                  className="w-full accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0</span>
                  <span>5</span>
                  <span>10 Units</span>
                </div>
              </div>

              {/* Slider 3: Tensile Shade Canopies */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Trees className="w-4 h-4 text-emerald-500" />
                    Tensile Shaded Corridors (+400 cap/structure)
                  </span>
                  <span className="text-emerald-600 font-extrabold text-sm">+{extraShade} Structures</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={extraShade}
                  onChange={(e) => setExtraShade(parseInt(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0</span>
                  <span>2</span>
                  <span>5 Structures</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Estimated Municipal Budget:</span>
                <span className="font-extrabold text-slate-900 text-sm">₹{estimatedBudgetINR.toLocaleString()} INR</span>
              </div>
            </div>

            {/* Results Comparison (5 Cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400">
                  PROJECTED IMPACT FOR {selectedSimWard?.name.split(':')[0]}
                </span>
                <h4 className="text-lg font-black tracking-tight text-white mt-1">
                  Simulation Outcome
                </h4>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase">Protection Gap</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs line-through text-slate-400">
                        {selectedSimWard?.protectionGap.toLocaleString()}
                      </span>
                      <span className="text-xl font-black text-emerald-400">
                        → {simulatedNewGap.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-medium">
                      -{simulatedAddedCapacity.toLocaleString()} citizens protected
                    </span>
                  </div>

                  <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase">Adequacy</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-xs line-through text-slate-400">
                        {selectedSimWard?.fulfillmentPct}%
                      </span>
                      <span className="text-xl font-black text-emerald-400">
                        → {simulatedNewPct}%
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-300 font-medium">
                      +{simulatedNewPct - (selectedSimWard?.fulfillmentPct || 0)}% surge
                    </span>
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>New Capacity: {simulatedNewCapacity.toLocaleString()}</span>
                    <span>Demand: {selectedSimWard?.demand.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${simulatedNewPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => {
                    setExtraCooling(2);
                    setExtraWater(4);
                    setExtraShade(1);
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => setActiveMunicipalPage('recommended-actions')}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Queue Action Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
