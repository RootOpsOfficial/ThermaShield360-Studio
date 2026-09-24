import React, { useState, useRef, useEffect } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
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
  HeartPulse,
  Sun,
  HardHat,
  GraduationCap,
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const {
    location,
    selectWard,
    requestGpsLocation,
    lastUpdatedTime,
    refreshData,
    isRefreshing,
    unreadAlertCount,
    setIsNotificationOpen,
    profile,
    updateProfile,
    unit,
    setUnit,
  } = useCitizen();

  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const locRef = useRef<HTMLDivElement>(null);
  const profRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (locRef.current && !locRef.current.contains(event.target as Node)) {
        setIsLocationDropdownOpen(false);
      }
      if (profRef.current && !profRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-xl border-b border-black/5 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                ThermaShield<span className="text-orange-600 font-extrabold">360</span>
              </span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                CITIZEN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">
              Climate & Heat Risk Protection
            </p>
          </div>
        </div>

        {/* Center / Location Selector */}
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

        {/* Right Actions: Updated Time, Refresh, Notifications, Profile, Unit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Last Updated & Refresh */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-xl border border-black/5">
            <span>Updated {lastUpdatedTime}</span>
            <button
              onClick={() => refreshData()}
              disabled={isRefreshing}
              className={`p-1 text-slate-500 hover:text-slate-800 rounded-lg transition-transform ${
                isRefreshing ? 'animate-spin text-orange-500' : ''
              }`}
              title="Refresh Live Climate Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Unit Toggle °C / °F */}
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

          {/* Notification Bell */}
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

          {/* Citizen Profile Toggle */}
          <div className="relative" ref={profRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold border border-black/5 transition-all"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                {profile.profileLabel === 'Senior (65+)' ? (
                  <HeartPulse className="w-3.5 h-3.5 text-rose-300" />
                ) : profile.profileLabel === 'Outdoor Worker' ? (
                  <HardHat className="w-3.5 h-3.5 text-amber-300" />
                ) : profile.profileLabel === 'Child / Student' ? (
                  <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="hidden sm:inline font-medium text-slate-700 text-xs">
                {profile.profileLabel}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-black/10 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="pb-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">Vulnerability Profile</p>
                  <p className="text-[11px] text-slate-500">Calibrates thermal advice & risk scores</p>
                </div>
                <div className="mt-2 space-y-1">
                  {[
                    {
                      label: 'General Citizen',
                      ageGroup: 'Adult (18-64)' as const,
                      isOutdoor: false,
                      health: false,
                      icon: User,
                    },
                    {
                      label: 'Senior Citizen (65+)',
                      ageGroup: 'Senior (65+)' as const,
                      isOutdoor: false,
                      health: true,
                      icon: HeartPulse,
                    },
                    {
                      label: 'Outdoor Worker',
                      ageGroup: 'Adult (18-64)' as const,
                      isOutdoor: true,
                      health: false,
                      icon: HardHat,
                    },
                    {
                      label: 'School Student',
                      ageGroup: 'Child (< 12)' as const,
                      isOutdoor: false,
                      health: false,
                      icon: GraduationCap,
                    },
                  ].map((p) => {
                    const isSelected = profile.profileLabel.startsWith(p.label.split(' ')[0]);
                    const IconComponent = p.icon;
                    return (
                      <button
                        key={p.label}
                        onClick={() => {
                          updateProfile({
                            ageGroup: p.ageGroup,
                            isOutdoorWorker: p.isOutdoor,
                            hasHealthCondition: p.health,
                          });
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                          isSelected ? 'bg-orange-50 text-orange-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4 text-slate-500" />
                          <span>{p.label}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
