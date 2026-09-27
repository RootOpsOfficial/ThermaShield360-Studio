import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterRegionSelector } from '../../components/disaster/DisasterRegionSelector.js';
import { ActiveLocationSpotlightBar } from '../../components/disaster/ActiveLocationSpotlightBar.js';
import { DisasterResponseTask, ResponseStatusType } from '../../types/disaster.js';
import {
  Activity,
  CheckCircle2,
  Clock,
  Building,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Plus,
  Radio,
  Check,
} from 'lucide-react';

const STATUS_OPTIONS: ResponseStatusType[] = [
  'Monitoring',
  'Preparing',
  'Coordinating',
  'Active Response',
  'Completed',
  'Verified',
];

export const ResponseTrackingPage: React.FC = () => {
  const { responseTasks, updateTaskStatus, selectedArea, selectArea } = useDisaster();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks =
    filterStatus === 'all'
      ? responseTasks
      : responseTasks.filter((t) => t.status === filterStatus);

  const getStatusBadge = (status: ResponseStatusType) => {
    switch (status) {
      case 'Active Response':
        return 'bg-red-600 text-white animate-pulse';
      case 'Coordinating':
        return 'bg-blue-600 text-white';
      case 'Preparing':
        return 'bg-amber-500 text-white';
      case 'Completed':
        return 'bg-emerald-600 text-white';
      case 'Verified':
        return 'bg-slate-900 text-white';
      case 'Monitoring':
      default:
        return 'bg-slate-200 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 0. Location Selector Bar */}
      <DisasterRegionSelector />

      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              OPERATIONAL MISSION TRACKER
            </span>
            <span className="text-xs font-bold text-slate-400">
              Inter-Agency Field Verification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Response Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Live task status, assigned emergency authorities, progress audits, and field verification logs
          </p>
        </div>

        {/* Status Count Summary */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-2xl bg-red-50 text-red-700 font-extrabold text-xs border border-red-200">
            {responseTasks.filter((t) => t.status === 'Active Response').length} Active Response
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-blue-50 text-blue-700 font-extrabold text-xs border border-blue-200">
            {responseTasks.filter((t) => t.status === 'Coordinating').length} Coordinating
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
            {responseTasks.filter((t) => t.status === 'Verified' || t.status === 'Completed').length} Done/Verified
          </span>
        </div>
      </div>

      {/* Active Location Spotlight Bar */}
      <ActiveLocationSpotlightBar />

      {/* Filter Tabs by Status */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
            filterStatus === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Tasks ({responseTasks.length})
        </button>

        {STATUS_OPTIONS.map((st) => {
          const count = responseTasks.filter((t) => t.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                filterStatus === st
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {/* Response Tasks Table / Directory */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs">
        <div className="pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">
              INTER-AGENCY ACTION LOG
            </span>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Change status directly to sync with central emergency command logs
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {filteredTasks.length} Operations Listed
          </span>
        </div>

        <div className="space-y-3.5">
          {filteredTasks.map((task) => {
            const isMatchActiveLocation =
              selectedArea &&
              task.area.toLowerCase().includes(selectedArea.name.split('-')[0].trim().toLowerCase());

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isMatchActiveLocation
                    ? 'border-red-400 bg-red-50/30 ring-1 ring-red-400/50 shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/40'
                }`}
              >
                {/* 1. Area */}
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      AREA
                    </span>
                    {isMatchActiveLocation && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 shadow-2xs">
                        <Radio className="w-2.5 h-2.5 animate-pulse" /> Active Location Priority
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">
                    {task.area}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Team: {task.assignedTeam}
                  </span>
                </div>

              {/* 2. Response */}
              <div className="flex-1 min-w-[240px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  RESPONSE
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 leading-snug">
                  {task.response}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      task.priority === 'Immediate'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'Priority'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {task.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Target: {task.targetCompletion}
                  </span>
                </div>
              </div>

              {/* 3. Responsible Authority */}
              <div className="min-w-[200px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  RESPONSIBLE AUTHORITY
                </span>
                <span className="text-xs font-bold text-slate-700 mt-0.5 block">
                  {task.responsibleAuthority}
                </span>
              </div>

              {/* 4. Status Selector */}
              <div className="min-w-[150px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  STATUS
                </span>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as ResponseStatusType)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 shadow-2xs w-full"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Last Update */}
              <div className="min-w-[130px] text-right self-end lg:self-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  LAST UPDATE
                </span>
                <span className="text-xs font-semibold text-slate-600 mt-0.5 block flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {task.lastUpdate}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
