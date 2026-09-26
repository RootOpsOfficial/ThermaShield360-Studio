import React, { useState, useEffect } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  Building,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Shield,
  Layers,
  Bed,
  Ambulance,
  HeartPulse,
  Lock,
  Unlock,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';

export const FacilityProfilePage: React.FC = () => {
  const {
    facilityProfile,
    updateFacilityProfile,
    toggleDemoMode,
    userRole,
    setUserRole,
    setActiveHealthcarePage,
  } = useHealthcare();

  const [formData, setFormData] = useState({
    facilityName: '',
    facilityType: '',
    address: '',
    contactPhone: '',
    contactEmail: '',
    medicalSuperintendent: '',

    totalBeds: '',
    occupiedBeds: '',
    availableBeds: '',
    totalIcuBeds: '',
    availableIcuBeds: '',
    emergencyCapacityBeds: '',

    totalAmbulances: '',
    availableAmbulances: '',
    coolingImmersionTanks: '',
    chilledSalineUnits: '',

    staffReadinessPct: '',
    staffNotes: '',
    heatPreparednessStatus: 'NOT ENTERED',
    emergencyPreparednessStatus: 'NOT ENTERED',
    outreachReadinessStatus: 'NOT ENTERED',
    coolingSupportReadinessStatus: 'NOT ENTERED',
  });

  const [editorName, setEditorName] = useState('Dr. A. Deshmukh (Medical Superintendent)');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (facilityProfile) {
      setFormData({
        facilityName: facilityProfile.facilityName || '',
        facilityType: facilityProfile.facilityType || '',
        address: facilityProfile.address || '',
        contactPhone: facilityProfile.contactPhone || '',
        contactEmail: facilityProfile.contactEmail || '',
        medicalSuperintendent: facilityProfile.medicalSuperintendent || '',

        totalBeds: facilityProfile.totalBeds.value !== null ? String(facilityProfile.totalBeds.value) : '',
        occupiedBeds: facilityProfile.occupiedBeds.value !== null ? String(facilityProfile.occupiedBeds.value) : '',
        availableBeds: facilityProfile.availableBeds.value !== null ? String(facilityProfile.availableBeds.value) : '',
        totalIcuBeds: facilityProfile.totalIcuBeds.value !== null ? String(facilityProfile.totalIcuBeds.value) : '',
        availableIcuBeds: facilityProfile.availableIcuBeds.value !== null ? String(facilityProfile.availableIcuBeds.value) : '',
        emergencyCapacityBeds: facilityProfile.emergencyCapacityBeds.value !== null ? String(facilityProfile.emergencyCapacityBeds.value) : '',

        totalAmbulances: facilityProfile.totalAmbulances.value !== null ? String(facilityProfile.totalAmbulances.value) : '',
        availableAmbulances: facilityProfile.availableAmbulances.value !== null ? String(facilityProfile.availableAmbulances.value) : '',
        coolingImmersionTanks: facilityProfile.coolingImmersionTanks.value !== null ? String(facilityProfile.coolingImmersionTanks.value) : '',
        chilledSalineUnits: facilityProfile.chilledSalineUnits.value !== null ? String(facilityProfile.chilledSalineUnits.value) : '',

        staffReadinessPct: facilityProfile.staffReadinessPct.value !== null ? String(facilityProfile.staffReadinessPct.value) : '',
        staffNotes: facilityProfile.staffNotes || '',
        heatPreparednessStatus: facilityProfile.heatPreparednessStatus.value || 'NOT ENTERED',
        emergencyPreparednessStatus: facilityProfile.emergencyPreparednessStatus.value || 'NOT ENTERED',
        outreachReadinessStatus: facilityProfile.outreachReadinessStatus.value || 'NOT ENTERED',
        coolingSupportReadinessStatus: facilityProfile.coolingSupportReadinessStatus.value || 'NOT ENTERED',
      });
    }
  }, [facilityProfile]);

  const handleAutoCalcAvailableBeds = () => {
    const total = parseInt(formData.totalBeds, 10);
    const occupied = parseInt(formData.occupiedBeds, 10);
    if (!isNaN(total) && !isNaN(occupied)) {
      setFormData((prev) => ({
        ...prev,
        availableBeds: String(Math.max(0, total - occupied)),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'readonly') return;

    setIsSaving(true);
    const parseNum = (val: string): number | null => {
      const num = parseInt(val, 10);
      return isNaN(num) ? null : num;
    };

    await updateFacilityProfile(
      {
        facilityName: formData.facilityName,
        facilityType: formData.facilityType,
        address: formData.address,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        medicalSuperintendent: formData.medicalSuperintendent,

        totalBeds: parseNum(formData.totalBeds),
        occupiedBeds: parseNum(formData.occupiedBeds),
        availableBeds: parseNum(formData.availableBeds),
        totalIcuBeds: parseNum(formData.totalIcuBeds),
        availableIcuBeds: parseNum(formData.availableIcuBeds),
        emergencyCapacityBeds: parseNum(formData.emergencyCapacityBeds),

        totalAmbulances: parseNum(formData.totalAmbulances),
        availableAmbulances: parseNum(formData.availableAmbulances),
        coolingImmersionTanks: parseNum(formData.coolingImmersionTanks),
        chilledSalineUnits: parseNum(formData.chilledSalineUnits),

        staffReadinessPct: parseNum(formData.staffReadinessPct),
        staffNotes: formData.staffNotes,
        heatPreparednessStatus: formData.heatPreparednessStatus as any,
        emergencyPreparednessStatus: formData.emergencyPreparednessStatus as any,
        outreachReadinessStatus: formData.outreachReadinessStatus as any,
        coolingSupportReadinessStatus: formData.coolingSupportReadinessStatus as any,
      } as any,
      editorName
    );

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const isReadOnly = userRole === 'readonly';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              FACILITY-ENTERED OPERATIONAL DATA
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                facilityProfile?.isDemoMode
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : facilityProfile?.isEntered
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {facilityProfile?.isDemoMode
                ? 'DEMO / MODELLED SIMULATION'
                : facilityProfile?.isEntered
                ? 'OPERATIONAL DATA ENTERED'
                : 'CAPACITY NOT YET PROVIDED'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Facility Profile & Operational Capacity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Authorized hospital administrators enter and maintain live emergency bed inventory, ICU reserves, and heatwave staffing.
          </p>
        </div>

        {/* Role & Demo Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Permission Mode Toggle */}
          <button
            type="button"
            onClick={() => setUserRole(isReadOnly ? 'authorized' : 'readonly')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all border ${
              isReadOnly
                ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Toggle editing authorization"
          >
            {isReadOnly ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
            <span>{isReadOnly ? 'Read-Only Mode' : 'Authorized Editor'}</span>
          </button>

          {/* Quick Demo Mode Toggle */}
          <button
            type="button"
            onClick={() => toggleDemoMode(!facilityProfile?.isDemoMode)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200"
            title="Toggle sample simulation values"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{facilityProfile?.isDemoMode ? 'Clear Sample Data' : 'Load Demo Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Role Notice Banner */}
      {isReadOnly && (
        <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Viewing in Read-Only Observer Mode.</span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Hospital operational capacity modifications require Authorized Medical Officer credentials.
              </p>
            </div>
          </div>
          <button
            onClick={() => setUserRole('authorized')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-start sm:self-auto transition-all"
          >
            Switch to Authorized Editor
          </button>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Facility Operational Data Successfully Saved!</span>
            <p className="text-emerald-800 text-[11px] mt-0.5">
              Available capacity, ICU reserves, and hospital gap metrics have been updated across the Command Center.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Facility Identity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                1. Healthcare Institution Identity
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Public & University Hospital</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Facility Name</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.facilityName}
                onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Facility Classification</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.facilityType}
                onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Medical Superintendent / Officer</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.medicalSuperintendent}
                onChange={(e) => setFormData({ ...formData, medicalSuperintendent: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Physical Campus Address</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">24x7 ER Contact Line</label>
              <input
                type="text"
                disabled={isReadOnly}
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bed Capacity & Heat Emergency Triage */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                2. Bed Capacity & Heatstroke Triage Inventory
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">Source: FACILITY ENTERED</span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAutoCalcAvailableBeds}
                  className="text-[11px] text-blue-600 font-bold hover:underline"
                >
                  Auto-Calculate Available
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">Total Inpatient Beds</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 1250"
                value={formData.totalBeds}
                onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-base text-slate-900 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Sanctioned hospital bed strength</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">Currently Occupied Beds</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 1160"
                value={formData.occupiedBeds}
                onChange={(e) => setFormData({ ...formData, occupiedBeds: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-base text-slate-900 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">All departments combined</span>
            </div>

            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/70">
              <label className="font-bold text-emerald-900 block mb-1">
                Available Inpatient Beds (Unoccupied)
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 90"
                value={formData.availableBeds}
                onChange={(e) => setFormData({ ...formData, availableBeds: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-emerald-300 font-bold text-base text-emerald-800 disabled:opacity-60"
              />
              <span className="text-[10px] text-emerald-700 mt-1 block">
                Directly feeds the Demand vs Capacity engine
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">Total ICU Beds</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 60"
                value={formData.totalIcuBeds}
                onChange={(e) => setFormData({ ...formData, totalIcuBeds: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-base text-slate-900 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Intensive coronary & medical ICUs</span>
            </div>

            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/70">
              <label className="font-bold text-amber-900 block mb-1">Available ICU Beds</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 8"
                value={formData.availableIcuBeds}
                onChange={(e) => setFormData({ ...formData, availableIcuBeds: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-amber-300 font-bold text-base text-amber-800 disabled:opacity-60"
              />
              <span className="text-[10px] text-amber-700 mt-1 block">Critical heat encephalopathy reserve</span>
            </div>

            <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/70">
              <label className="font-bold text-rose-900 block mb-1">
                Dedicated Emergency Heat Triage Beds
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 35"
                value={formData.emergencyCapacityBeds}
                onChange={(e) => setFormData({ ...formData, emergencyCapacityBeds: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-rose-300 font-bold text-base text-rose-800 disabled:opacity-60"
              />
              <span className="text-[10px] text-rose-700 mt-1 block">
                Specifically designated for heatstroke triage
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Resources & Pre-Hospital Outreach */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Ambulance className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                3. Ambulances & Clinical Resuscitation Resources
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Source: FACILITY ENTERED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">Total Ambulances</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 20"
                value={formData.totalAmbulances}
                onChange={(e) => setFormData({ ...formData, totalAmbulances: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-base text-slate-900 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Hospital & 108 Fleet</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">Available / Dispatched</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 16"
                value={formData.availableAmbulances}
                onChange={(e) => setFormData({ ...formData, availableAmbulances: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-base text-slate-900 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Active on-road units</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">Cooling Immersion Tanks</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 4"
                value={formData.coolingImmersionTanks}
                onChange={(e) => setFormData({ ...formData, coolingImmersionTanks: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-base text-slate-900 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Evaporative body tubs</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">Cold Saline Packs (Units)</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 250"
                value={formData.chilledSalineUnits}
                onChange={(e) => setFormData({ ...formData, chilledSalineUnits: e.target.value })}
                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-base text-slate-900 disabled:opacity-60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Chilled at 4°C in triage</span>
            </div>
          </div>
        </div>

        {/* Section 4: Staff Readiness & Operational Directives */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                4. Staff Readiness & Heat Preparedness Protocol
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">Source: FACILITY ENTERED</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ER Staff Rostered (%)</label>
              <input
                type="number"
                disabled={isReadOnly}
                placeholder="e.g. 92"
                value={formData.staffReadinessPct}
                onChange={(e) => setFormData({ ...formData, staffReadinessPct: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-900 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Heat Preparedness Status</label>
              <select
                disabled={isReadOnly}
                value={formData.heatPreparednessStatus}
                onChange={(e) => setFormData({ ...formData, heatPreparednessStatus: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-900 disabled:opacity-60"
              >
                <option value="NOT ENTERED">NOT ENTERED</option>
                <option value="READY">READY</option>
                <option value="NEEDS ATTENTION">NEEDS ATTENTION</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Emergency Surge Status</label>
              <select
                disabled={isReadOnly}
                value={formData.emergencyPreparednessStatus}
                onChange={(e) => setFormData({ ...formData, emergencyPreparednessStatus: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-900 disabled:opacity-60"
              >
                <option value="NOT ENTERED">NOT ENTERED</option>
                <option value="READY">READY</option>
                <option value="NEEDS ATTENTION">NEEDS ATTENTION</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Outreach & 108 Readiness</label>
              <select
                disabled={isReadOnly}
                value={formData.outreachReadinessStatus}
                onChange={(e) => setFormData({ ...formData, outreachReadinessStatus: e.target.value })}
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-900 disabled:opacity-60"
              >
                <option value="NOT ENTERED">NOT ENTERED</option>
                <option value="READY">READY</option>
                <option value="NEEDS ATTENTION">NEEDS ATTENTION</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="font-bold text-slate-700 block mb-1">
                Clinical Operational Notes & Triage Shift Instructions
              </label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={formData.staffNotes}
                onChange={(e) => setFormData({ ...formData, staffNotes: e.target.value })}
                placeholder="Enter shift handoff notes or heatstroke protocol specifics..."
                className="w-full p-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-slate-900 disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Signature / Audit Trail & Submit */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Audit Signature (Authorized Medical Officer)
            </span>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <input
                type="text"
                disabled={isReadOnly}
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                className="p-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs w-64 disabled:opacity-60"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Last saved: {facilityProfile?.lastEvaluated} by {facilityProfile?.updatedBy}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveHealthcarePage('command-center')}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Back to Command Center
            </button>

            {!isReadOnly && (
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-[0.99]"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Updates...' : 'Save & Publish Capacity'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
