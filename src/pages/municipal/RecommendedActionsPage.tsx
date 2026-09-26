import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import { MunicipalActionItem } from '../../types/municipal.js';
import {
  ListChecks,
  Sparkles,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Minus,
  Check,
  RotateCcw,
} from 'lucide-react';

export const RecommendedActionsPage: React.FC = () => {
  const { actions, updateActionStatus, wards } = useMunicipal();
  const [activeTab, setActiveTab] = useState<'actions' | 'whatif' | 'budget' | 'hap' | 'verify'>('actions');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // WHAT-IF Simulator State
  const [selectedSimWardId, setSelectedSimWardId] = useState<string>(wards[0]?.id || 'ward-21');
  const [addCooling, setAddCooling] = useState<number>(2);
  const [addWater, setAddWater] = useState<number>(4);
  const [addShade, setAddShade] = useState<number>(1);

  const activeSimWard = wards.find((w) => w.id === selectedSimWardId) || wards[0];
  const simAddedCapacity = addCooling * 600 + addWater * 250 + addShade * 400;
  const currentCapacity = activeSimWard ? activeSimWard.capacity : 1420;
  const scenarioCapacity = currentCapacity + simAddedCapacity;
  const currentGap = activeSimWard ? activeSimWard.protectionGap : 4380;
  const scenarioGap = Math.max(0, currentGap - simAddedCapacity);
  const expectedImprovement = currentGap > 0 ? Math.round(((currentGap - scenarioGap) / currentGap) * 100) : 100;

  // BUDGET Tool State
  const [availableBudget, setAvailableBudget] = useState<number>(600000); // 6 Lakh INR
  const budgetInterventions = [
    { name: '4x Mobile Water Tankers (10,000L cold)', cost: 140000, gain: '1,000 citizens/day' },
    { name: '2x Temporary Air-Conditioned Tents', cost: 240000, gain: '1,200 citizens/day' },
    { name: 'Tensile Shade Over Mandai Bus Stand', cost: 120000, gain: '800 citizens/day' },
    { name: 'ORS & Cold Hydration Distribution Squads', cost: 80000, gain: '1,500 citizens/day' },
  ];
  const totalEstimatedCost = budgetInterventions.reduce((acc, i) => acc + i.cost, 0);

  // HEAT ACTION PLAN Tasks (1. Prepare, 2. Deploy, 3. Monitor, 4. Verify)
  const [hapTasks, setHapTasks] = useState([
    { id: '1-1', phase: '1. Prepare', task: 'Issue color-coded warning (Orange/Red) to ward officers & public channels.', done: true },
    { id: '1-2', phase: '1. Prepare', task: 'Pre-position emergency heat-stroke supplies at Kamla Nehru & Sassoon hospitals.', done: true },
    { id: '2-1', phase: '2. Deploy', task: 'Dispatch 12 mobile water tankers to Kasba Peth, Hadapsar, and Swargate transit hubs.', done: true },
    { id: '2-2', phase: '2. Deploy', task: 'Open air-conditioned civic shelters to citizens between 11:00 AM and 6:00 PM.', done: false },
    { id: '3-1', phase: '3. Monitor', task: 'Enforce mandatory 12:00 PM – 3:30 PM outdoor labor pauses on construction sites.', done: false },
    { id: '3-2', phase: '3. Monitor', task: 'Track hourly casualty alerts and hydration kiosk flow rates via smart telemetry.', done: true },
    { id: '4-1', phase: '4. Verify', task: 'Verify temperature relief in high-risk wards and record post-intervention data.', done: false },
    { id: '4-2', phase: '4. Verify', task: 'Conduct evening debrief with Disaster Management Commissioner.', done: false },
  ]);

  const toggleHap = (id: string) => {
    setHapTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // Filter actions
  const filteredActions = statusFilter === 'All'
    ? actions
    : actions.filter((a) => a.status === statusFilter);

  const statuses = ['Suggested', 'Review', 'Approved', 'In Progress', 'Completed'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            OPERATIONAL RESPONSE COMMAND
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Recommended Actions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Prioritized operational interventions and decision tools for municipal field teams
          </p>
        </div>

        {/* Clean View Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-black/5 text-xs font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'actions' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Actions ({actions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('whatif')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'whatif' ? 'bg-white text-orange-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>What-If</span>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'budget' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Budget</span>
          </button>
          <button
            onClick={() => setActiveTab('hap')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'hap' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Action Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'verify' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verification</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RECOMMENDED ACTIONS QUEUE */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', ...statuses].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Showing {filteredActions.length} Actions
            </span>
          </div>

          {/* Action Cards (Answering WHAT, WHERE, WHEN, WHY) */}
          <div className="space-y-3">
            {filteredActions.map((item) => {
              const isCritical = item.priority === 'CRITICAL';
              const isHigh = item.priority === 'HIGH';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5 transition-all hover:border-slate-300"
                >
                  <div className="flex-1 space-y-3">
                    {/* Header badge & Ward */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : isHigh
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.ward}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {item.time}
                      </span>
                    </div>

                    {/* WHAT, WHERE, WHEN, WHY */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          WHAT
                        </span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {item.action}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          WHERE
                        </span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {item.ward} Primary Transit & Market Nodes
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          WHEN
                        </span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {item.time} (Peak Solar & Thermal Window)
                        </p>
                      </div>

                      <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                          WHY
                        </span>
                        <p className="font-semibold text-amber-950 mt-0.5">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown / Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) => updateActionStatus(item.id, e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                    >
                      {statuses.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full mt-1 ${
                        item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'Approved'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COMPACT WHAT-IF DECISION TOOL */}
      {activeTab === 'whatif' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  "What happens if we intervene here?"
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
                  MODELLED / ESTIMATED
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Simulate impact of additional cooling centres, water points, or shade coverage on ward protection gap
              </p>
            </div>

            {/* Ward Selector */}
            <select
              value={selectedSimWardId}
              onChange={(e) => setSelectedSimWardId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 cursor-pointer"
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Intervention Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">+ Cooling Centre</span>
                <span className="text-[11px] text-slate-400">+600 citizens/unit</span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => setAddCooling(Math.max(0, addCooling - 1))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-black text-slate-900 w-8 text-center">{addCooling}</span>
                <button
                  onClick={() => setAddCooling(addCooling + 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">+ Water Point</span>
                <span className="text-[11px] text-slate-400">+250 citizens/unit</span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => setAddWater(Math.max(0, addWater - 1))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-black text-slate-900 w-8 text-center">{addWater}</span>
                <button
                  onClick={() => setAddWater(addWater + 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 block">+ Shade Coverage</span>
                <span className="text-[11px] text-slate-400">+400 citizens/unit</span>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => setAddShade(Math.max(0, addShade - 1))}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-black text-slate-900 w-8 text-center">{addShade}</span>
                <button
                  onClick={() => setAddShade(addShade + 1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* CURRENT vs SCENARIO Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                CURRENT
              </span>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Protection Capacity:</span>
                  <span className="font-bold text-slate-800">{currentCapacity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Protection Gap:</span>
                  <span className="font-bold text-rose-600">{currentGap.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                SCENARIO
              </span>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Protection Capacity:</span>
                  <span className="font-bold text-emerald-700">
                    {scenarioCapacity.toLocaleString()} (+{simAddedCapacity.toLocaleString()})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Protection Gap:</span>
                  <span className="font-bold text-slate-900">{scenarioGap.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex justify-between font-extrabold text-emerald-800">
                  <span>Expected Improvement:</span>
                  <span>+{expectedImprovement}% Deficit Reduction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGET DECISION TOOL */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Municipal Budget Optimization
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                  MODELLED OPTIMIZATION
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Allocate contingency heat relief funds to maximize citizen protection gain
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Available Budget</span>
              <p className="text-base font-black text-slate-900">₹{availableBudget.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {budgetInterventions.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                  <p className="text-slate-500 mt-0.5">Estimated Cost: ₹{item.cost.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Protection Gain</span>
                    <p className="font-extrabold text-emerald-700">+{item.gain}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    High ROI
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Total Package Cost: ₹{totalEstimatedCost.toLocaleString('en-IN')}</span>
            <span className="text-emerald-700">Est. Total Coverage: +4,500 citizens protected</span>
          </div>
        </div>
      )}

      {/* TAB 4: HEAT ACTION PLAN (1. Prepare, 2. Deploy, 3. Monitor, 4. Verify) */}
      {activeTab === 'hap' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Municipal Heat Action Plan Protocols
            </h2>
            <p className="text-xs text-slate-500">
              Four standardized operational stages conforming to NDMA & IMD guidelines
            </p>
          </div>

          <div className="space-y-3">
            {['1. Prepare', '2. Deploy', '3. Monitor', '4. Verify'].map((phase) => {
              const phaseTasks = hapTasks.filter((t) => t.phase === phase);
              return (
                <div key={phase} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-orange-600 block">
                    {phase}
                  </span>
                  <div className="space-y-1.5">
                    {phaseTasks.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-start gap-2.5 text-xs text-slate-800 cursor-pointer p-2 rounded-xl hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleHap(task.id)}
                          className="w-4 h-4 mt-0.5 accent-orange-600 rounded"
                        />
                        <span className={task.done ? 'line-through text-slate-400 font-medium' : 'font-semibold'}>
                          {task.task}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: VERIFICATION (BEFORE -> ACTION -> AFTER) */}
      {activeTab === 'verify' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              Intervention Verification Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Audited comparison of protection capacity and gap before and after municipal deployment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* BEFORE */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                BEFORE
              </span>
              <p className="font-bold text-slate-800 text-sm">Pre-Intervention Baseline</p>
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span>Protection Capacity:</span>
                  <span className="font-bold">6,800</span>
                </div>
                <div className="flex justify-between">
                  <span>Protection Gap:</span>
                  <span className="font-bold text-rose-600">8,920</span>
                </div>
              </div>
            </div>

            {/* ACTION */}
            <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-2">
              <span className="text-[10px] font-black uppercase text-blue-700 block">
                ACTION
              </span>
              <p className="font-bold text-blue-950 text-sm">Dispatched Countermeasures</p>
              <ul className="pt-2 border-t border-blue-200 space-y-1 text-slate-700">
                <li>• 12x Mobile Water Tankers</li>
                <li>• 4x Air-Conditioned Shelters</li>
                <li>• 6x High-Flow Misting Stations</li>
              </ul>
            </div>

            {/* AFTER */}
            <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/50 space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-700 block">
                AFTER
              </span>
              <p className="font-bold text-emerald-950 text-sm">Post-Intervention State</p>
              <div className="pt-2 border-t border-emerald-200 space-y-1">
                <div className="flex justify-between">
                  <span>Protection Capacity:</span>
                  <span className="font-bold text-emerald-700">11,200 (+4,400)</span>
                </div>
                <div className="flex justify-between">
                  <span>Protection Gap:</span>
                  <span className="font-bold text-emerald-700">4,520 (−49%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
