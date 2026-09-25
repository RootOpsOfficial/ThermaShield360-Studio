import React, { useState } from 'react';
import { useMunicipal } from '../../context/MunicipalContext.js';
import { MunicipalActionItem } from '../../types/municipal.js';
import {
  ListChecks,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Check,
  FileText,
  DollarSign,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Building,
} from 'lucide-react';

export const RecommendedActionsPage: React.FC = () => {
  const { actions, updateActionStatus, setSelectedWard, setActiveMunicipalPage, wards } = useMunicipal();
  const [activeTab, setActiveTab] = useState<'queue' | 'hap' | 'budget'>('queue');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Budget Optimizer state
  const [budgetAllocation, setBudgetAllocation] = useState<number>(800000); // 8 Lakh INR
  const [isOptimized, setIsOptimized] = useState<boolean>(false);

  // Heat Action Plan checklist state
  const [hapTasks, setHapTasks] = useState([
    { id: 'h1', stage: 'Stage 1: Alert Phase', task: 'Issue Color-Coded Heat Warning (Orange/Red) to all ward officers & public channels', done: true, time: '08:30 AM' },
    { id: 'h2', stage: 'Stage 1: Alert Phase', task: 'Notify Pune Mahanagar Parivahan Mahamandal (PMPML) bus depots to deploy shaded waiting queues', done: true, time: '09:00 AM' },
    { id: 'h3', stage: 'Stage 2: Operational Dispatch', task: 'Position 12 mobile water tankers across Kasba Peth, Hadapsar, and Swargate transit junctions', done: true, time: '10:15 AM' },
    { id: 'h4', stage: 'Stage 2: Operational Dispatch', task: 'Verify municipal air-conditioned sanctuaries (Kasba Peth, Shivajinagar, Baner) are open to public', done: false, time: '11:00 AM' },
    { id: 'h5', stage: 'Stage 3: Worker & Healthcare', task: 'Mandate 12:00 PM – 3:30 PM outdoor work suspension at all registered construction sites', done: false, time: '12:00 PM' },
    { id: 'h6', stage: 'Stage 3: Worker & Healthcare', task: 'Ensure Kamla Nehru & Sassoon General Hospital heat-stroke emergency beds are staffed with ice-packs and IV fluid', done: true, time: '10:00 AM' },
    { id: 'h7', stage: 'Stage 4: Evening Verification', task: 'Collect hourly casualty reports and hydration kiosk flow meters for daily debrief', done: false, time: '05:00 PM' },
  ]);

  const toggleHapTask = (id: string) => {
    setHapTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const filteredActions =
    selectedFilter === 'All'
      ? actions
      : actions.filter((a) => a.status === selectedFilter);

  const pendingCount = actions.filter((a) => a.status !== 'Completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            OPERATIONAL RESPONSE COMMAND
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Recommended Municipal Actions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Prioritized operational interventions for ward officers, disaster squads, and field teams
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-black/5 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'queue' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Action Queue ({pendingCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('hap')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'hap' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Heat Action Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'budget' ? 'bg-white text-orange-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Budget Optimizer</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OPERATIONAL ACTION QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['All', 'In Progress', 'Approved', 'Review', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedFilter === status
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Showing {filteredActions.length} Actions
            </span>
          </div>

          {/* Action List Cards */}
          <div className="space-y-3">
            {filteredActions.map((item) => {
              const priorityColor =
                item.priority === 'CRITICAL'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : item.priority === 'HIGH'
                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300';

              const statusColor =
                item.status === 'Completed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : item.status === 'In Progress'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                  : item.status === 'Approved'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${priorityColor}`}>
                        {item.priority} PRIORITY
                      </span>
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.ward}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.action}
                    </h3>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                      <span className="font-semibold text-slate-700">Rationale: </span>
                      {item.reason}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-center">
                    {item.status !== 'In Progress' && item.status !== 'Completed' && (
                      <button
                        onClick={() => updateActionStatus(item.id, 'In Progress')}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Deploy Now</span>
                      </button>
                    )}

                    {item.status === 'In Progress' && (
                      <button
                        onClick={() => updateActionStatus(item.id, 'Completed')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Completed</span>
                      </button>
                    )}

                    {item.status === 'Completed' && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Finished
                      </span>
                    )}

                    <button
                      onClick={() => {
                        const targetWard = wards.find((w) => w.id === item.wardId);
                        if (targetWard) setSelectedWard(targetWard);
                        setActiveMunicipalPage('ward-risk-map');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors text-center"
                    >
                      Locate Ward
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HEAT ACTION PLAN CHECKLIST */}
      {activeTab === 'hap' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                PMC Heat Action Plan (HAP) Standard Operating Procedures
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory inter-departmental operational protocol triggered for heat stress mitigation
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span>Completion:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {hapTasks.filter((t) => t.done).length} / {hapTasks.length} Mandates Executed
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {hapTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleHapTask(t.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  t.done
                    ? 'bg-slate-50/70 border-slate-200/70 text-slate-500'
                    : 'bg-white border-slate-300 shadow-xs hover:border-slate-400 text-slate-900'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                    t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {t.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t.stage}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">• {t.time}</span>
                  </div>
                  <p className={`text-xs font-semibold leading-relaxed ${t.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {t.task}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 flex items-center justify-between">
            <span className="font-semibold">
              Daily verification signed by: Nodal Officer, Disaster Management Cell PMC.
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Protocol ISO-37120 Compliant</span>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGET & RESOURCE OPTIMIZER */}
      {activeTab === 'budget' && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Municipal Heat Intervention Budget Optimizer
              </h3>
              <p className="text-xs text-slate-500">
                Maximize vulnerable lives protected per municipal rupee spent during heatwave emergencies
              </p>
            </div>
            <button
              onClick={() => setIsOptimized(true)}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Optimize Allocation</span>
            </button>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span>Available Emergency Contingency Fund</span>
              <span className="text-lg font-black text-slate-900">
                ₹{budgetAllocation.toLocaleString('en-IN')} INR
              </span>
            </div>
            <input
              type="range"
              min="200000"
              max="2500000"
              step="50000"
              value={budgetAllocation}
              onChange={(e) => setBudgetAllocation(parseInt(e.target.value))}
              className="w-full accent-orange-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>₹2,00,000 (Local Ward Fund)</span>
              <span>₹12,50,000</span>
              <span>₹25,00,000 (Citywide Disaster Reserve)</span>
            </div>
          </div>

          {/* Allocation Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Cooling Sanctuaries (45%)
              </span>
              <div className="text-xl font-black text-slate-900">
                ₹{Math.round(budgetAllocation * 0.45).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Funds {Math.floor((budgetAllocation * 0.45) / 120000)} temporary community AC centers in Kasba Peth & Hadapsar.
              </p>
              <div className="text-[11px] text-blue-800 font-bold pt-2 border-t border-blue-200">
                Protects ~{Math.floor((budgetAllocation * 0.45) / 120000) * 600} citizens/day
              </div>
            </div>

            <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                Water Tankers & ORS Kiosks (35%)
              </span>
              <div className="text-xl font-black text-slate-900">
                ₹{Math.round(budgetAllocation * 0.35).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Funds {Math.floor((budgetAllocation * 0.35) / 35000)} mobile refrigerated water tankers & ORS packets.
              </p>
              <div className="text-[11px] text-cyan-800 font-bold pt-2 border-t border-cyan-200">
                Provides ~{Math.floor((budgetAllocation * 0.35) / 35000) * 1500} Liters hydration/day
              </div>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Tensile Shading & Medical (20%)
              </span>
              <div className="text-xl font-black text-slate-900">
                ₹{Math.round(budgetAllocation * 0.20).toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Funds {Math.floor((budgetAllocation * 0.20) / 60000)} shaded transit walkway canopies and field triage packs.
              </p>
              <div className="text-[11px] text-emerald-800 font-bold pt-2 border-t border-emerald-200">
                Covers ~{Math.floor((budgetAllocation * 0.20) / 60000) * 450} transit commuters/day
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-medium">
              Overall Efficiency Rating: <span className="font-bold text-emerald-600">94.8% Cost-Benefit Index</span>
            </span>
            <button
              onClick={() => setActiveTab('queue')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors"
            >
              Apply Allocation to Action Queue →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
