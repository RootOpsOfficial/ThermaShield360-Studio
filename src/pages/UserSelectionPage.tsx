import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { useCitizen } from '../context/CitizenContext.js';
import { useMunicipal } from '../context/MunicipalContext.js';
import { useHealthcare } from '../context/HealthcareContext.js';
import { useDisaster } from '../context/DisasterContext.js';
import { useAuth } from '../context/AuthContext.js';
import { useNavigationHistory } from '../context/NavigationHistoryContext.js';
import { HistoryNavControls } from '../components/HistoryNavControls.js';
import {
  User,
  HardHat,
  HeartPulse,
  Building,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LogOut,
  MapPin,
  Check,
} from 'lucide-react';

export type UserRoleType =
  | 'citizen'
  | 'worker'
  | 'healthcare'
  | 'municipal'
  | 'disaster';

interface RoleOption {
  id: UserRoleType;
  title: string;
  badge: string;
  description: string;
  subDetails: string;
  icon: React.ElementType;
  accentColor: string;
  borderActive: string;
  bgLight: string;
  ringColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'citizen',
    title: 'CITIZEN',
    badge: 'PUBLIC ACCESS',
    description: 'Personal heat risk, alerts and protection',
    subDetails: 'Hyper-local WBGT, 5-day heatwave forecast & shaded routing',
    icon: User,
    accentColor: 'text-orange-600',
    borderActive: 'border-orange-500 bg-orange-50/40',
    bgLight: 'bg-orange-50 border-orange-200 text-orange-600',
    ringColor: 'ring-orange-500/30',
  },
  {
    id: 'worker',
    title: 'OUTDOOR WORKER',
    badge: 'OCCUPATIONAL SAFETY',
    description: 'Shift WBGT, cool-down pauses and field hydration',
    subDetails: 'Exertional threshold warnings, mandatory rest alarms & electrolyte stations',
    icon: HardHat,
    accentColor: 'text-amber-600',
    borderActive: 'border-amber-500 bg-amber-50/40',
    bgLight: 'bg-amber-50 border-amber-200 text-amber-600',
    ringColor: 'ring-amber-500/30',
  },
  {
    id: 'healthcare',
    title: 'HEALTHCARE',
    badge: 'CLINICAL GRID',
    description: 'Heat-health risk and facility preparedness',
    subDetails: 'Hospital patient surge modeling, emergency beds & hydration supplies',
    icon: HeartPulse,
    accentColor: 'text-emerald-600',
    borderActive: 'border-emerald-500 bg-emerald-50/40',
    bgLight: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    ringColor: 'ring-emerald-500/30',
  },
  {
    id: 'municipal',
    title: 'MUNICIPAL CORPORATION',
    badge: 'CIVIC GOVERNANCE',
    description: 'Ward risk, protection gaps and interventions',
    subDetails: 'Ward-level vulnerability index, cooling centers & civic water kiosks',
    icon: Building,
    accentColor: 'text-blue-600',
    borderActive: 'border-blue-500 bg-blue-50/40',
    bgLight: 'bg-blue-50 border-blue-200 text-blue-600',
    ringColor: 'ring-blue-500/30',
  },
  {
    id: 'disaster',
    title: 'DISASTER MANAGEMENT AUTHORITY',
    badge: 'COMMAND EOC',
    description: 'Regional heat threat and emergency coordination',
    subDetails: 'Multi-district heat emergency directives, GIS telemetry & inter-agency EOC',
    icon: ShieldAlert,
    accentColor: 'text-red-600',
    borderActive: 'border-red-500 bg-red-50/40',
    bgLight: 'bg-red-50 border-red-200 text-red-600',
    ringColor: 'ring-red-500/30',
  },
];

export const UserSelectionPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRoleType | null>(null);
  const [roleNotice, setRoleNotice] = useState<string | null>(null);

  const { setWorkspace } = useWorkspace();
  const { setActivePage } = useCitizen();
  const { setActiveMunicipalPage } = useMunicipal();
  const { setActiveHealthcarePage } = useHealthcare();
  const { setActiveDisasterPage } = useDisaster();
  const { user, logout } = useAuth();
  const { recordNavigation } = useNavigationHistory();

  const handleContinue = () => {
    if (!selectedRole) return;
    setRoleNotice(null);

    // If user has not completed role onboarding, redirect to /onboarding
    if (user && !user.onboarding_completed) {
      recordNavigation('#onboarding');
      setWorkspace('onboarding');
      return;
    }

    // Role Security Verification against authoritative profile
    if (user) {
      if (selectedRole === 'municipal' && user.role !== 'municipal') {
        setRoleNotice(
          `Access Restricted: Your current authenticated role is "${user.role.toUpperCase()}". Municipal command dashboard requires authorized civic authority credentials.`
        );
        return;
      }
      if (selectedRole === 'healthcare' && user.role !== 'healthcare') {
        setRoleNotice(
          `Access Restricted: Your current authenticated role is "${user.role.toUpperCase()}". Healthcare command center requires verified clinical facility credentials.`
        );
        return;
      }
      if (selectedRole === 'disaster' && user.role !== 'disaster_management') {
        setRoleNotice(
          `Access Restricted: Your current authenticated role is "${user.role.toUpperCase()}". Disaster Authority EOC is restricted to emergency incident command personnel.`
        );
        return;
      }

      if (user.approval_status !== 'approved') {
        setRoleNotice(
          `Access Pending: Your institutional access request is currently "${user.approval_status}". You will be granted access once authorized.`
        );
        return;
      }
    }

    switch (selectedRole) {
      case 'citizen':
        setActivePage('home');
        recordNavigation('#citizen/home');
        setWorkspace('citizen');
        break;
      case 'worker':
        setActivePage('thermal');
        recordNavigation('#citizen/thermal');
        setWorkspace('citizen');
        break;
      case 'healthcare':
        setActiveHealthcarePage('command-center');
        recordNavigation('#healthcare/command-center');
        setWorkspace('healthcare');
        break;
      case 'municipal':
        setActiveMunicipalPage('command-center');
        recordNavigation('#municipality/command-center');
        setWorkspace('municipal');
        break;
      case 'disaster':
        setActiveDisasterPage('command');
        recordNavigation('#disaster/command');
        setWorkspace('disaster');
        break;
    }
  };

  const handleLogout = () => {
    logout();
    recordNavigation('#login');
    setWorkspace('login');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Header with In-App Back/Forward Controls */}
      <header className="w-full bg-white/80 backdrop-blur-xl border-b border-black/5 px-4 sm:px-8 py-3.5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Left: History Nav Controls + Brand */}
          <div className="flex items-center gap-3">
            <HistoryNavControls />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-slate-900 text-base sm:text-lg">
                    ThermaShield<span className="text-orange-600">360</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                    WORKSPACE SELECTOR
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium leading-none hidden sm:block">
                  Climate Safety, Heat Governance & Emergency Operations
                </p>
              </div>
            </div>
          </div>

          {/* Right: Authenticated User & Logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden sm:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-black/5 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800">{user.name}</span>
                <span className="text-slate-400">({user.organization || 'Session Active'})</span>
              </div>
            ) : null}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-black/5 transition-colors"
              title="Sign out to Login"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Selection Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-between">
        <div>
          {/* Header Title Section */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide uppercase bg-orange-100 text-orange-800 border border-orange-200/80 mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Multi-Role Climate Safety Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Choose how you want to use ThermaShield 360
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2 leading-relaxed">
              Select your role to access tailored operational heat intelligence, clinical preparedness, or personal protection.
            </p>
          </div>

          {roleNotice && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-start gap-2.5 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">{roleNotice}</div>
            </div>
          )}

          {/* 5 Clean Selectable Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
            {ROLE_OPTIONS.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedRole(role.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  className={`rounded-3xl p-6 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group select-none ${
                    isSelected
                      ? `${role.borderActive} shadow-lg ring-2 ${role.ringColor} scale-[1.01]`
                      : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon & Status / Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-105 ${
                          isSelected ? role.bgLight : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs animate-in zoom-in-90 duration-150">
                          <Check className="w-3 h-3 stroke-[3]" />
                          SELECTED
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {role.badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {role.title}
                    </h2>

                    {/* Single Required Short Description */}
                    <p className={`text-xs font-semibold mt-1 ${role.accentColor}`}>
                      {role.description}
                    </p>

                    {/* Supporting Detail */}
                    <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                      {role.subDetails}
                    </p>
                  </div>

                  {/* Radio Indicator */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-400">
                      {isSelected ? 'Ready to launch workspace' : 'Click to select this role'}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Footer with Continue Button */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            {selectedRole ? (
              <span className="text-slate-800 font-bold">
                Selected:{' '}
                <span className="text-orange-600 uppercase">
                  {ROLE_OPTIONS.find((r) => r.id === selectedRole)?.title}
                </span>{' '}
                — Click Continue to enter your dashboard.
              </span>
            ) : (
              <span>Please select an operational role above to continue.</span>
            )}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-md ${
              selectedRole
                ? 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20 active:scale-[0.99] cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>CONTINUE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
};
