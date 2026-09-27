import React, { useState } from 'react';
import { useDisaster } from '../../context/DisasterContext.js';
import { DisasterRegionSelector } from '../../components/disaster/DisasterRegionSelector.js';
import { ActiveLocationSpotlightBar } from '../../components/disaster/ActiveLocationSpotlightBar.js';
import { DisasterAlert, AlertRiskState, AlertWorkflowAction } from '../../types/disaster.js';
import {
  BellRing,
  ShieldAlert,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Send,
  Building,
  HeartPulse,
  Eye,
  Check,
  TrendingUp,
  XCircle,
  Users,
} from 'lucide-react';

export const AlertsEscalationPage: React.FC = () => {
  const {
    selectedRegion,
    selectedArea,
    alerts,
    handleAlertAction,
    coordinationStatus,
  } = useDisaster();

  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [selectedAlertForReview, setSelectedAlertForReview] = useState<DisasterAlert | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredAlerts =
    filterRisk === 'all'
      ? alerts
      : alerts.filter((a) => a.riskState === filterRisk);

  const getRiskBadge = (state: AlertRiskState) => {
    switch (state) {
      case 'Critical':
        return 'bg-red-600 text-white';
      case 'Harmful + Confidence':
        return 'bg-rose-600 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Developing':
        return 'bg-amber-400 text-amber-950';
      case 'Normal':
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  const triggerAction = (alertItem: DisasterAlert, action: AlertWorkflowAction) => {
    handleAlertAction(alertItem.id, action);
    setActionNotice(
      `Workflow Action [${action}] applied to Alert #${alertItem.id}. Internal operational status updated (Simulation Mode).`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* 0. Location Selector Bar (Phase 2) */}
      <DisasterRegionSelector />

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Title Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-black/5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
              OPERATIONAL ESCALATION CONSOLE
            </span>
            <span className="text-xs font-bold text-slate-400">
              {selectedRegion.name} • Shared Alert Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Alerts & Escalation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Authority directives, multi-agency coordination status, and active incident escalation workflows
          </p>
        </div>

        {/* Broadcast Trigger Button */}
        <button
          onClick={() => {
            setActionNotice(
              `Inter-Agency Emergency Heat Broadcast transmitted for ${selectedRegion.name} to District Magistrate, Municipal Commissioner, Police, and 108 Emergency Services.`
            );
            setTimeout(() => setActionNotice(null), 4000);
          }}
          className="px-5 py-3 rounded-2xl bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-700/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Dispatch Regional Escalation</span>
        </button>
      </div>

      {/* Active Location Spotlight Bar */}
      <ActiveLocationSpotlightBar />

      {/* ========================================================================= */}
      {/* PHASE 15 — COMMON OPERATING PICTURE (COORDINATION VIEW) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-black/5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              COMMON OPERATING PICTURE — INTER-AGENCY STATUS
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            Phase 15 Shared Coordination View
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. MUNICIPAL */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-black uppercase tracking-wider text-orange-950">
                  MUNICIPAL
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-orange-600 text-white">
                {coordinationStatus.municipalStatus.state}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              Lead: {coordinationStatus.municipalStatus.leadOfficer}
            </p>
            <div className="mt-2 pt-2 border-t border-orange-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>{coordinationStatus.municipalStatus.activeTeams} Intervention Teams</span>
              <span className="text-slate-400">{coordinationStatus.municipalStatus.lastUpdate}</span>
            </div>
          </div>

          {/* 2. HEALTHCARE */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  HEALTHCARE
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-700 text-white">
                {coordinationStatus.healthcareStatus.state}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              Emergency Trauma Grid & 108 Fleet
            </p>
            <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>{coordinationStatus.healthcareStatus.availableHeatBeds} Dedicated Ice-Beds</span>
              <span className="text-slate-400">{coordinationStatus.healthcareStatus.lastUpdate}</span>
            </div>
          </div>

          {/* 3. DISASTER MANAGEMENT */}
          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span className="text-xs font-black uppercase tracking-wider text-red-950">
                  DISASTER MANAGEMENT
                </span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white">
                {coordinationStatus.disasterManagementStatus.state}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              Lead: {coordinationStatus.disasterManagementStatus.eocLeader}
            </p>
            <div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between text-[11px] text-slate-600">
              <span>{coordinationStatus.disasterManagementStatus.activeDirectives} Active Directives</span>
              <span className="text-slate-400">{coordinationStatus.disasterManagementStatus.lastUpdate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs by Risk State */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(['all', 'Critical', 'Harmful + Confidence', 'High', 'Developing', 'Normal'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterRisk(st)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
              filterRisk === st
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {st === 'all' ? `All Alerts (${alerts.length})` : st}
          </button>
        ))}
      </div>

      {/* Alerts Directory */}
      <div className="space-y-4">
        {filteredAlerts.map((alertItem) => {
          const impactsActiveLocation =
            selectedArea &&
            alertItem.where.toLowerCase().includes(selectedArea.name.split('-')[0].trim().toLowerCase());

          return (
            <div
              key={alertItem.id}
              className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-xs transition-all ${
                impactsActiveLocation
                  ? 'border-red-500 ring-2 ring-red-400/50 bg-gradient-to-b from-red-50/20 to-white'
                  : alertItem.riskState === 'Critical'
                  ? 'border-red-200 hover:border-red-400'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Alert Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getRiskBadge(
                      alertItem.riskState
                    )}`}
                  >
                    {alertItem.riskState}
                  </span>
                  {impactsActiveLocation && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white flex items-center gap-1 shadow-xs">
                      <Radio className="w-2.5 h-2.5 animate-pulse" /> Active Location Priority: {selectedArea.name.split('-')[0].trim()}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-slate-400">
                    Lead: {alertItem.leadAuthority}
                  </span>
                </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {alertItem.issuedAt}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {alertItem.forecastConfidence} Confidence
                </span>
              </div>
            </div>

            {/* Alert Structure (WHAT, WHERE, WHEN, WHY, REQUIRED COORDINATION - Phase 12) */}
            <div className="space-y-3 text-xs">
              {/* WHAT */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 block mb-0.5">
                  WHAT
                </span>
                <h3 className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                  {alertItem.what}
                </h3>
              </div>

              {/* WHERE & WHEN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                    WHERE
                  </span>
                  <p className="font-bold text-slate-800 leading-relaxed">
                    {alertItem.where}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                    WHEN
                  </span>
                  <p className="font-bold text-slate-800 leading-relaxed">
                    {alertItem.when}
                  </p>
                </div>
              </div>

              {/* WHY */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                  WHY
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {alertItem.why}
                </p>
              </div>

              {/* REQUIRED COORDINATION */}
              <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-800 block mb-1">
                  REQUIRED COORDINATION
                </span>
                <p className="text-slate-900 font-semibold leading-relaxed">
                  {alertItem.requiredCoordination}
                </p>
              </div>
            </div>

            {/* PHASE 13 — AUTHORITY ACTION INTERFACE (REVIEW, ACKNOWLEDGE, ESCALATE, COORDINATE, CLOSE) */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                {alertItem.acknowledged ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Acknowledged by Operational Command</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending Authority Acknowledgment</span>
                  </span>
                )}
              </div>

              {/* 5 Authority Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => triggerAction(alertItem, 'REVIEW')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                  title="Review complete meteorological diagnostics"
                >
                  <Eye className="w-3 h-3" />
                  <span>REVIEW</span>
                </button>

                {!alertItem.acknowledged && (
                  <button
                    onClick={() => triggerAction(alertItem, 'ACKNOWLEDGE')}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1"
                    title="Acknowledge official receipt"
                  >
                    <Check className="w-3 h-3" />
                    <span>ACKNOWLEDGE</span>
                  </button>
                )}

                <button
                  onClick={() => triggerAction(alertItem, 'ESCALATE')}
                  className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                  title="Escalate alert to critical red directive"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>ESCALATE</span>
                </button>

                <button
                  onClick={() => triggerAction(alertItem, 'COORDINATE')}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1"
                  title="Dispatch coordination instructions"
                >
                  <Users className="w-3 h-3" />
                  <span>COORDINATE</span>
                </button>

                <button
                  onClick={() => triggerAction(alertItem, 'CLOSE')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                  title="Close alert once conditions return to normal"
                >
                  <XCircle className="w-3 h-3" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
