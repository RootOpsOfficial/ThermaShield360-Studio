import React from 'react';
import { useWorkspace } from '../context/WorkspaceContext.js';
import {
  ShieldAlert,
  User,
  Building,
  HeartPulse,
  ArrowRight,
  Flame,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  Thermometer,
  Shield,
  Activity,
} from 'lucide-react';

export const WorkspacePortalPage: React.FC = () => {
  const { setWorkspace } = useWorkspace();

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Banner */}
      <header className="w-full bg-white/80 backdrop-blur-xl border-b border-black/5 px-4 sm:px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg">
                  ThermaShield<span className="text-orange-600">360</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                  PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">
                Climate Safety, Heat Governance & Emergency Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-black/5">
            <MapPin className="w-3.5 h-3.5 text-orange-600" />
            <span>Pune Metropolitan Area</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1"></span>
            <span className="text-[10px] text-emerald-700 font-bold hidden sm:inline">LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-orange-100 text-orange-800 border border-orange-200/80 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Multi-Role Climate Safety Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Select Your Workspace
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium mt-2 leading-relaxed">
            Choose your operational environment to access tailored heat risk intelligence, municipal decision tools, or emergency medical facilities.
          </p>
        </div>

        {/* 3 Prominent Cards: Citizen, Municipality, Healthcare */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. CITIZEN WORKSPACE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-300 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-xs group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                  PUBLIC ACCESS
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Citizen
              </h2>
              <p className="text-xs font-semibold text-orange-600 mt-0.5">
                Personal Heat Safety & Commute Protection
              </p>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                For individuals, outdoor workers, vulnerable seniors, and families to track localized heat risk and stay protected.
              </p>

              {/* Feature Checklist */}
              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Hyper-local Wet Bulb (WBGT) & UTCI indices</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Diurnal timeline & 5-day heatwave forecast</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Thermal-safe shaded routing for pedestrians</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>Nearest chilled water kiosks & cooling centres</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={() => setWorkspace('citizen')}
                className="w-full py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Enter Citizen Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 2. MUNICIPALITY WORKSPACE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-800 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-700 via-slate-900 to-black"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 shadow-xs group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6 text-slate-900" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  CITY OFFICIALS
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Municipality
              </h2>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Disaster Operations & Heat Governance
              </p>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                For municipal commissioners, disaster management cells, and ward teams to coordinate heatwave interventions.
              </p>

              {/* Feature Checklist */}
              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                  <span>Municipal Command Center & 4 core summary cards</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                  <span>GIS Ward Risk Map & side panel decision metrics</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                  <span>Protection Gap Analysis: Demand vs. Capacity</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                  <span>What-If simulator, budget optimizer & alert dispatch</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={() => setWorkspace('municipal')}
                className="w-full py-3 px-4 rounded-2xl bg-[#1D1D1F] hover:bg-black active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 transition-all"
              >
                <span>Enter Municipal Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* 3. HEALTHCARE WORKSPACE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs group-hover:scale-110 transition-transform">
                  <HeartPulse className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  EMERGENCY & MEDICAL
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Healthcare
              </h2>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                Heatstroke Facilities & Emergency Response
              </p>
              <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                For emergency trauma departments, 108 ambulance triage, and citizens requiring immediate medical care.
              </p>

              {/* Feature Checklist */}
              <div className="mt-5 space-y-2 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Heatstroke-ready hospital & trauma locator</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Real-time emergency & ICU heat bed inventory</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Turn-by-turn emergency routing & transit steps</span>
                </div>
                <div className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Direct 24x7 emergency helplines & clinical triage</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <button
                onClick={() => setWorkspace('healthcare')}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all"
              >
                <span>Enter Healthcare Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Informative Footer note */}
        <div className="mt-10 text-center">
          <p className="text-xs text-slate-400 font-medium">
            You can return to this workspace selection screen at any time using the workspace indicator in the navigation bar.
          </p>
        </div>
      </main>
    </div>
  );
};
