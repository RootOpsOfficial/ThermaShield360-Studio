import React, { useState } from 'react';
import { useAuth, UserRole } from '../context/AuthContext.js';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { useCitizen } from '../context/CitizenContext.js';
import { useMunicipal } from '../context/MunicipalContext.js';
import { useHealthcare } from '../context/HealthcareContext.js';
import { useDisaster } from '../context/DisasterContext.js';
import { useNavigationHistory } from '../context/NavigationHistoryContext.js';
import {
  ShieldAlert,
  User,
  HardHat,
  Building,
  HeartPulse,
  Radio,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Briefcase,
  Sun,
  Droplets,
  AlertTriangle,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding, isLoading, error, clearError } = useAuth();
  const { setWorkspace } = useWorkspace();
  const { setActivePage } = useCitizen();
  const { setActiveMunicipalPage } = useMunicipal();
  const { setActiveHealthcarePage } = useHealthcare();
  const { setActiveDisasterPage } = useDisaster();
  const { recordNavigation } = useNavigationHistory();

  const role: UserRole = user?.role || 'citizen';

  // Citizen & Shared fields
  const [city, setCity] = useState(user?.city || 'Pune');
  const [state, setState] = useState('Maharashtra');
  const [country, setCountry] = useState('India');
  const [areaType, setAreaType] = useState('Urban');
  const [workEnvironment, setWorkEnvironment] = useState('Mixed Indoor & Outdoor');
  const [outdoorExposure, setOutdoorExposure] = useState('3 – 6 hours');
  const [ageGroup, setAgeGroup] = useState('18 – 35');
  const [coolingAccess, setCoolingAccess] = useState('Ceiling Fans & Desert Coolers');

  // Outdoor Worker fields
  const [occupation, setOccupation] = useState('Construction');
  const [workHours, setWorkHours] = useState('08:00 AM – 05:00 PM (9 hrs)');
  const [peakSunExposure, setPeakSunExposure] = useState('Midday (11:00 AM – 03:00 PM)');
  const [waterAccess, setWaterAccess] = useState('Carry own container only');
  const [restAreaAccess, setRestAreaAccess] = useState('Dedicated covered rest shed');
  const [physicalDemand, setPhysicalDemand] = useState('Heavy manual labor');

  // Municipal fields
  const [department, setDepartment] = useState('Disaster Management & Climate Cell');
  const [operationalArea, setOperationalArea] = useState('Citywide Municipal Jurisdiction');
  const [responsibilities, setResponsibilities] = useState('Heat Action Plan Execution & Civic Cooling Infrastructure');
  const [alertChannels, setAlertChannels] = useState<string[]>([
    'Citizen App Advisory',
    'SMS Emergency Flash',
    'Field Crew Radios',
  ]);

  // Healthcare fields
  const [facilityType, setFacilityType] = useState('Tertiary Teaching Hospital');
  const [facilityCapacity, setFacilityCapacity] = useState('Rapid Ice-Water Immersion Baths & Dedicated Heat Triage Beds');
  const [clinicalCatchment, setClinicalCatchment] = useState('Metropolitan Regional Grid');
  const [clinicalPriorities, setClinicalPriorities] = useState<string[]>([
    'Exertional heatstroke in laborers',
    'Pediatric & geriatric dehydration',
    'IV cold saline stockpiles',
  ]);

  // Disaster Management fields
  const [authorityLevel, setAuthorityLevel] = useState('District Disaster Management Authority (DDMA EOC)');
  const [eocLocation, setEocLocation] = useState('Central Emergency Operations Command Center');
  const [interagencyPurview, setInteragencyPurview] = useState('Multi-District Coordination & Resource Mobilization');
  const [earlyWarningLead, setEarlyWarningLead] = useState('48-hour stage-2 alert');

  const [validationError, setValidationError] = useState<string | null>(null);

  const navigateToDashboard = (targetRole: UserRole) => {
    switch (targetRole) {
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
      case 'municipal':
        setActiveMunicipalPage('command-center');
        recordNavigation('#municipality/command-center');
        setWorkspace('municipal');
        break;
      case 'healthcare':
        setActiveHealthcarePage('command-center');
        recordNavigation('#healthcare/command-center');
        setWorkspace('healthcare');
        break;
      case 'disaster_management':
        setActiveDisasterPage('command');
        recordNavigation('#disaster/command');
        setWorkspace('disaster');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!city.trim()) {
      setValidationError('Please specify your operational or residential city.');
      return;
    }

    const payload: any = {
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      area_type: areaType,
    };

    if (role === 'citizen') {
      payload.work_environment = workEnvironment;
      payload.outdoor_exposure = outdoorExposure;
      payload.age_group = ageGroup;
      payload.cooling_access = coolingAccess;
    } else if (role === 'worker') {
      payload.occupation = occupation;
      payload.work_hours = workHours;
      payload.outdoor_exposure = peakSunExposure;
      payload.water_access = waterAccess;
      payload.rest_area_access = restAreaAccess;
      payload.physical_demand = physicalDemand;
    } else if (role === 'municipal') {
      payload.department = department;
      payload.operational_area = operationalArea;
      payload.responsibilities = responsibilities;
      payload.alert_preferences = alertChannels;
    } else if (role === 'healthcare') {
      payload.facility_type = facilityType;
      payload.facility_capacity = facilityCapacity;
      payload.operational_area = clinicalCatchment;
      payload.monitoring_preferences = clinicalPriorities;
    } else if (role === 'disaster_management') {
      payload.department = authorityLevel;
      payload.operational_area = eocLocation;
      payload.responsibilities = interagencyPurview;
      payload.work_hours = earlyWarningLead;
    }

    const res = await completeOnboarding(payload);
    if (res.success) {
      navigateToDashboard(role);
    }
  };

  const getRoleHeader = () => {
    switch (role) {
      case 'citizen':
        return {
          title: 'Tell us a little about yourself',
          subtitle: 'Personalize your hyper-local WBGT alerts, safe walking routes, and physiological heat stress baseline.',
          badge: 'CITIZEN ONBOARDING',
          icon: User,
          color: 'text-orange-600 bg-orange-50 border-orange-200',
        };
      case 'worker':
        return {
          title: 'Tell us about your work environment',
          subtitle: 'Configure your occupational thermal limits, shift hydration alarms, and field rest pause schedules.',
          badge: 'OUTDOOR WORKER ONBOARDING',
          icon: HardHat,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
        };
      case 'municipal':
        return {
          title: 'Tell us about your administrative purview',
          subtitle: 'Set up ward vulnerability thresholds, misting deployment zones, and municipal alert broadcast networks.',
          badge: 'MUNICIPAL CORPORATION SETUP',
          icon: Building,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      case 'healthcare':
        return {
          title: 'Tell us about your clinical facility',
          subtitle: 'Calibrate hospital heatstroke triage capacity, cold immersion baths, and emergency surge forecast triggers.',
          badge: 'HEALTHCARE GRID PROFILE',
          icon: HeartPulse,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        };
      case 'disaster_management':
        return {
          title: 'Tell us about your command operations',
          subtitle: 'Connect your regional EOC parameters, inter-agency escalation triggers, and GIS telemetry feeds.',
          badge: 'DISASTER AUTHORITY COMMAND SETUP',
          icon: Radio,
          color: 'text-red-600 bg-red-50 border-red-200',
        };
    }
  };

  const roleMeta = getRoleHeader();
  const Icon = roleMeta.icon;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950">
      {/* Top Header */}
      <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-slate-900 text-base">
                ThermaShield<span className="text-orange-600">360</span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium">Climate Safety Setup</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleMeta.color}`}>
              {roleMeta.badge}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl relative overflow-hidden">
          {/* Subtle Top Accent Ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-600" />

          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs ${roleMeta.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {roleMeta.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {roleMeta.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {(validationError || error) && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{validationError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. LOCATION SECTION (Required for all roles, without exact street address) */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Location & Regional Scope
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">City / District</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Pune"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">Area Topology</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Urban', 'Suburban', 'Rural'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAreaType(opt)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        areaType === opt
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. DYNAMIC ROLE-SPECIFIC QUESTIONS */}
            {/* === CITIZEN ONBOARDING QUESTIONS === */}
            {role === 'citizen' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Usual Work Environment
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Indoor / Air-conditioned',
                      'Indoor / Non-AC (Fan only)',
                      'Mixed Indoor & Outdoor',
                      'Mostly Outdoor (High solar exposure)',
                    ].map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() => setWorkEnvironment(env)}
                        className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${
                          workEnvironment === env
                            ? 'bg-orange-50 border-orange-500 text-orange-950 ring-2 ring-orange-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Daily Outdoor Exposure
                    </label>
                    <select
                      value={outdoorExposure}
                      onChange={(e) => setOutdoorExposure(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="< 1 hour">&lt; 1 hour (Minimal exposure)</option>
                      <option value="1 – 3 hours">1 – 3 hours (Commutes & errands)</option>
                      <option value="3 – 6 hours">3 – 6 hours (Moderate exposure)</option>
                      <option value="> 6 hours">&gt; 6 hours (High daytime exposure)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Age Bracket
                    </label>
                    <select
                      value={ageGroup}
                      onChange={(e) => setAgeGroup(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value="Under 18">Under 18 (Pediatric physiological vigilance)</option>
                      <option value="18 – 35">18 – 35 (Active adult baseline)</option>
                      <option value="36 – 50">36 – 50 (Standard adult cohort)</option>
                      <option value="51 – 65">51 – 65 (Elevated heat strain sensitivity)</option>
                      <option value="65+">65+ (Vulnerable cardiovascular cohort)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Cooling Access at Home / Workplace
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Full Air Conditioning',
                      'Ceiling Fans & Desert Coolers',
                      'Limited Cooling (Shared fans)',
                      'No Active Cooling Available',
                    ].map((cooling) => (
                      <button
                        key={cooling}
                        type="button"
                        onClick={() => setCoolingAccess(cooling)}
                        className={`p-3 rounded-xl text-xs font-bold text-left border transition-all ${
                          coolingAccess === cooling
                            ? 'bg-orange-50 border-orange-500 text-orange-950 ring-2 ring-orange-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cooling}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* === OUTDOOR WORKER ONBOARDING QUESTIONS === */}
            {role === 'worker' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary Field Occupation
                  </label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Construction">Construction & Civil Infrastructure Works</option>
                    <option value="Delivery / Logistics">Delivery & On-Demand Logistics</option>
                    <option value="Street Vending">Street Vending & Informal Commerce</option>
                    <option value="Sanitation & Waste">Sanitation & Municipal Waste Management</option>
                    <option value="Agriculture / Landscaping">Agriculture, Nurseries & Horticulture</option>
                    <option value="Transportation">Public Transit & Auto-rickshaw / Cab Driving</option>
                    <option value="Utility / Maintenance">Electrical, Telecom & Utility Maintenance</option>
                    <option value="Security / Patrol">Traffic Control & Outdoor Security Patrol</option>
                    <option value="Other">Other Outdoor Manual Occupation</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Daily Work Shift Hours
                    </label>
                    <input
                      type="text"
                      value={workHours}
                      onChange={(e) => setWorkHours(e.target.value)}
                      placeholder="e.g. 08:00 AM – 05:00 PM"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Peak Sun Exposure Window
                    </label>
                    <select
                      value={peakSunExposure}
                      onChange={(e) => setPeakSunExposure(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="Midday (11:00 AM – 03:00 PM)">Midday (11:00 AM – 03:00 PM - Extreme Solar)</option>
                      <option value="Morning (08:00 AM – 11:00 AM)">Morning (08:00 AM – 11:00 AM)</option>
                      <option value="Afternoon (03:00 PM – 06:00 PM)">Afternoon (03:00 PM – 06:00 PM)</option>
                      <option value="Full Shift (All-day Direct Exposure)">Full Shift (Continuous Sun Exposure)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Drinking Water Access
                    </label>
                    <select
                      value={waterAccess}
                      onChange={(e) => setWaterAccess(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="Carry own container only">Carry own container (Limited refilling)</option>
                      <option value="Readily available cold water on site">Readily available cold water / RO on site</option>
                      <option value="Intermittent / Public water kiosks">Intermittent / Must search public kiosks</option>
                      <option value="Scarcity / Inadequate potable water">Scarcity / Inadequate potable water</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Physical Workload Intensity
                    </label>
                    <select
                      value={physicalDemand}
                      onChange={(e) => setPhysicalDemand(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="Heavy manual labor">Heavy manual labor (High metabolic heat)</option>
                      <option value="Moderate (Frequent walking & lifting)">Moderate (Frequent walking & lifting)</option>
                      <option value="Extreme exertional (Demanding physical strain)">Extreme exertional (High risk)</option>
                      <option value="Light (Standing / Driving)">Light (Standing / Driving)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* === MUNICIPAL CORPORATION ONBOARDING QUESTIONS === */}
            {role === 'municipal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Department / Office
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Disaster Management Cell"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Operational Jurisdiction
                    </label>
                    <select
                      value={operationalArea}
                      onChange={(e) => setOperationalArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="Citywide Municipal Jurisdiction">Citywide Municipal Jurisdiction (All 15 Wards)</option>
                      <option value="Heritage Core Zone (Kasba Peth - Vishrambaugwada)">Heritage Core Zone (High Density)</option>
                      <option value="East Industrial Belt (Hadapsar - Mundhwa)">East Industrial Belt (Hadapsar - Mundhwa)</option>
                      <option value="Suburban Western Corridor (Kothrud - Baner)">Suburban Western Corridor (Kothrud - Baner)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary Operational Directive
                  </label>
                  <input
                    type="text"
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    placeholder="e.g. Heat Action Plan (HAP) Execution & Civic Misting Tankers"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* === HEALTHCARE ONBOARDING QUESTIONS === */}
            {role === 'healthcare' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Facility Classification
                    </label>
                    <select
                      value={facilityType}
                      onChange={(e) => setFacilityType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="Tertiary Teaching Hospital">Tertiary Teaching Hospital (Level 1 Trauma)</option>
                      <option value="District Civil Hospital">District Civil Hospital</option>
                      <option value="Urban Primary Health Centre (UPHC)">Urban Primary Health Centre (UPHC)</option>
                      <option value="Community Health Centre (CHC)">Community Health Centre (CHC)</option>
                      <option value="Private Multispecialty Facility">Private Multispecialty Facility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Clinical Catchment Area
                    </label>
                    <input
                      type="text"
                      value={clinicalCatchment}
                      onChange={(e) => setClinicalCatchment(e.target.value)}
                      placeholder="e.g. Central Pune & East Industrial Corridor"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Heatstroke Triage & Resuscitation Equipment
                  </label>
                  <input
                    type="text"
                    value={facilityCapacity}
                    onChange={(e) => setFacilityCapacity(e.target.value)}
                    placeholder="e.g. Ice-water immersion baths, 12 heat ICU beds, chilled IV saline"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>
            )}

            {/* === DISASTER MANAGEMENT ONBOARDING QUESTIONS === */}
            {role === 'disaster_management' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      Authority Level & Command Center
                    </label>
                    <select
                      value={authorityLevel}
                      onChange={(e) => setAuthorityLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    >
                      <option value="District Disaster Management Authority (DDMA EOC)">District Disaster Management Authority (DDMA EOC)</option>
                      <option value="Municipal EOC Incident Cell">Municipal EOC Incident Cell</option>
                      <option value="State Disaster Management Authority (SDMA)">State Disaster Management Authority (SDMA)</option>
                      <option value="National Emergency Coordination Center">National Emergency Coordination Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                      EOC Headquarters Location
                    </label>
                    <input
                      type="text"
                      value={eocLocation}
                      onChange={(e) => setEocLocation(e.target.value)}
                      placeholder="e.g. Central Command Control Center, Pune"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                    Early Warning Escalation Horizon
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['24-hour tactical', '48-hour stage-2', '72-hour clinical', '5-day predictive'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setEarlyWarningLead(opt)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                          earlyWarningLead === opt
                            ? 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Submit Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-black active:scale-[0.99] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile & Launching Workspace...</span>
                  </div>
                ) : (
                  <>
                    <span>Complete Setup & Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
