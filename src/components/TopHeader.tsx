import React, { useState, useRef, useEffect } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { useMunicipal } from '../context/MunicipalContext.js';
import { useHealthcare } from '../context/HealthcareContext.js';
import { useWorkspace } from '../context/WorkspaceContext.js';
import {
  ShieldAlert,
  MapPin,
  RefreshCw,
  Bell,
  User,
  ChevronDown,
  Navigation,
  Check,
  AlertTriangle,
  Building,
  HeartPulse,
  ArrowLeftRight,
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { workspace, setWorkspace } = useWorkspace();
  const {
    location,
    selectWard,
    requestGpsLocation,
    lastUpdatedTime,
    refreshData,
    isRefreshing,
    unreadAlertCount,
    setIsNotificationOpen,
    unit,
    setUnit,
  } = useCitizen();

  const {
    summary: municipalSummary,
    refreshMunicipalData,
    isRefreshing: isMunicipalRefreshing,
    alerts: municipalAlerts,
    setActiveMunicipalPage,
  } = useMunicipal();

  const {
    summary: healthcareSummary,
    refreshHealthcareData,
    isRefreshing: isHealthcareRefreshing,
    setActiveHealthcarePage,
  } = useHealthcare();

  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const locRef = useRef<HTMLDivElement>(null);

  // Close location dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locRef.current && !locRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMunicipal = workspace === 'municipal';
  const isHealthcare = workspace === 'healthcare';
  const isCitizen = workspace === 'citizen';
  const activeMunicipalAlertsCount = municipalAlerts.filter((a) => a.status === 'Active').length;

  const handleRefresh = () => {
    if (isMunicipal) refreshMunicipalData();
    else if (isHealthcare) refreshHealthcareData();
    else refreshData();
  };

  const isAnyRefreshing = isMunicipal ? isMunicipalRefreshing : isHealthcare ? isHealthcareRefreshing : isRefreshing;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-xl border-b border-black/5 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setWorkspace('portal')}
            className="flex items-center gap-2.5 text-left group"
            title="Return to Workspace Selector"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                  ThermaShield<span className="text-orange-600 font-extrabold">360</span>
                </span>
                {isMunicipal && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                    MUNICIPAL
                  </span>
                )}
                {isHealthcare && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    HEALTHCARE
                  </span>
                )}
                {isCitizen && (
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    CITIZEN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">
                {isMunicipal
                  ? 'Pune Municipal Corporation • Disaster Management Cell'
                  : isHealthcare
                  ? 'Emergency Medical Grid • Hospital Heat Preparedness'
                  : 'Climate & Heat Risk Protection'}
              </p>
            </div>
          </button>
        </div>

        {/* Center / Location Selector (Citizen Ward, Municipal Jurisdiction, or Healthcare Grid) */}
        {isCitizen ? (
          <div className="relative" ref={locRef}>
            <button
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold border border-black/5 transition-all shadow-xs"
            >
              <MapPin className={`w-3.5 h-3.5 ${location.isGps ? 'text-blue-600' : 'text-orange-500'}`} />
              <div className="text-left flex flex-col">
                <span className="text-[10px] text-slate-400 font-normal leading-tight">
                  {location.isGps ? 'GPS Location' : 'Current Ward'}
                </span>
                <span className="truncate max-w-[130px] sm:max-w-[190px] leading-tight font-medium">
                  {location.ward.name.split(':')[0]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Location Dropdown Modal */}
            {isLocationDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-black/10 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">Select Pune Ward</span>
                  <button
                    onClick={() => {
                      requestGpsLocation();
                      setIsLocationDropdownOpen(false);
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
                  >
                    <Navigation className="w-3 h-3" /> Use GPS
                  </button>
                </div>

                {location.gpsErrorMsg && (
                  <div className="my-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span>{location.gpsErrorMsg}</span>
                  </div>
                )}

                <div className="mt-2 max-h-56 overflow-y-auto space-y-1">
                  {location.allWards.map((w) => {
                    const isCurrent = w.id === location.ward.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => {
                          selectWard(w.id);
                          setIsLocationDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isCurrent ? 'bg-orange-50 text-orange-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p>{w.name}</p>
                          <p className="text-[10px] text-slate-400">{w.zone}</p>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-orange-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : isMunicipal ? (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-800 text-xs font-semibold border border-black/5 shadow-xs">
            <Building className="w-3.5 h-3.5 text-orange-600" />
            <div className="text-left flex flex-col">
              <span className="text-[10px] text-slate-400 font-normal leading-tight">
                Jurisdiction
              </span>
              <span className="truncate leading-tight font-medium">
                Pune (6 Monitored Wards)
              </span>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs font-semibold border border-emerald-200 shadow-xs">
            <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
            <div className="text-left flex flex-col">
              <span className="text-[10px] text-emerald-700 font-normal leading-tight">
                Healthcare Network
              </span>
              <span className="truncate leading-tight font-medium">
                Sassoon Hospital & Pune Medical Grid
              </span>
            </div>
          </div>
        )}

        {/* Right Actions: Updated Time, Refresh, Unit (Citizen), Notifications, Clear Workspace Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Last Updated & Refresh */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-xl border border-black/5">
            <span>
              Updated{' '}
              {isMunicipal
                ? municipalSummary?.dateTime?.split('•')[0]?.trim() || 'Live'
                : isHealthcare
                ? healthcareSummary?.dateTime?.split('•')[1]?.trim() || 'Live'
                : lastUpdatedTime}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isAnyRefreshing}
              className={`p-1 text-slate-500 hover:text-slate-800 rounded-lg transition-transform ${
                isAnyRefreshing ? 'animate-spin text-emerald-600' : ''
              }`}
              title="Refresh Live Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Unit Toggle °C / °F (Citizen Mode Only) */}
          {isCitizen && (
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-black/5 text-xs font-bold text-slate-600">
              <button
                onClick={() => setUnit('C')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  unit === 'C' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setUnit('F')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  unit === 'F' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                °F
              </button>
            </div>
          )}

          {/* Notification Bell */}
          {isCitizen ? (
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-black/5"
              title="Heat Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-xs">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          ) : isMunicipal ? (
            <button
              onClick={() => setActiveMunicipalPage('municipal-alerts')}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-black/5"
              title="Active Municipal Alerts"
            >
              <Bell className="w-4 h-4 text-orange-600" />
              {activeMunicipalAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-xs">
                  {activeMunicipalAlertsCount}
                </span>
              )}
            </button>
          ) : isHealthcare ? (
            <button
              onClick={() => setActiveHealthcarePage('alerts')}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-black/5"
              title="Active Health Directives"
            >
              <Bell className="w-4 h-4 text-emerald-700" />
              {healthcareSummary?.activeAlert && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-xs">
                  1
                </span>
              )}
            </button>
          ) : null}

          {/* SEPARATED WORKSPACE SWITCHER: Distinct role indicator + Switch button, NO dropdown list! */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Active Workspace Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                isMunicipal
                  ? 'bg-orange-50 border-orange-200 text-orange-950'
                  : isHealthcare
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-100 border-slate-200 text-slate-800'
              }`}
            >
              {isMunicipal ? (
                <Building className="w-3.5 h-3.5 text-orange-600" />
              ) : isHealthcare ? (
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-700" />
              )}
              <span>{isMunicipal ? 'Municipality' : isHealthcare ? 'Healthcare' : 'Citizen'}</span>
            </div>

            {/* Clear Switch Workspace Button (Navigates to 1st Page Workspace Selection) */}
            <button
              onClick={() => setWorkspace('portal')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all active:scale-[0.99]"
              title="Switch to another workspace"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-orange-400" />
              <span>Switch Workspace</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
