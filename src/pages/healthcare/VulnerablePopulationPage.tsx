import React from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import {
  Users,
  ShieldAlert,
  HeartPulse,
  Sun,
  Activity,
  ArrowRight,
  Info,
} from 'lucide-react';

export const VulnerablePopulationPage: React.FC = () => {
  const { summary, setActiveHealthcarePage } = useHealthcare();

  if (!summary) return null;

  const areas = summary.highRiskAreas || [];
  const totalVulnerable = areas.reduce((acc, a) => acc + a.vulnerablePopulation, 0);
  const totalElderly = areas.reduce((acc, a) => acc + a.vulnerabilityBreakdown.elderly65Plus, 0);
  const totalWorkers = areas.reduce((acc, a) => acc + a.vulnerabilityBreakdown.outdoorWorkers, 0);
  const totalChronic = areas.reduce((acc, a) => acc + a.vulnerabilityBreakdown.chronicConditions, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              POPULATION HEALTH SURVEILLANCE
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              AGGREGATED & ANONYMIZED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vulnerable Population Exposure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Epidemiological breakdown of high-susceptibility demographic and occupational cohorts across monitored healthcare sectors.
          </p>
        </div>

        <button
          onClick={() => setActiveHealthcarePage('demand-capacity')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <span>Calculate Bed Gap</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Aggregate Group Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Total At-Risk</span>
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <span className="text-3xl font-black text-slate-900 tracking-tight my-2 block">
            {totalVulnerable.toLocaleString()}
          </span>
          <p className="text-xs text-slate-500 font-medium">
            Aggregated across 6 urban wards with high heat susceptibility.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Elderly (65+ Years)</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <HeartPulse className="w-4 h-4" />
            </span>
          </div>
          <span className="text-3xl font-black text-rose-600 tracking-tight my-2 block">
            {totalElderly.toLocaleString()}
          </span>
          <p className="text-xs text-slate-500 font-medium">
            Impaired thermoregulation & blunted thirst response cohort.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Outdoor Laborers</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Sun className="w-4 h-4" />
            </span>
          </div>
          <span className="text-3xl font-black text-amber-700 tracking-tight my-2 block">
            {totalWorkers.toLocaleString()}
          </span>
          <p className="text-xs text-slate-500 font-medium">
            Street vendors, construction workers, and transit couriers.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Chronic Conditions</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <span className="text-3xl font-black text-blue-700 tracking-tight my-2 block">
            {totalChronic.toLocaleString()}
          </span>
          <p className="text-xs text-slate-500 font-medium">
            Pre-existing cardiovascular, renal, and diabetic illnesses.
          </p>
        </div>
      </div>

      {/* Ward Breakdown Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              WARD DEMOGRAPHIC MAPPING
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Vulnerable Cohorts by Municipal Zone
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">No patient-level PII exposed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                <th className="py-2.5 px-3">Ward</th>
                <th className="py-2.5 px-3">Total Vulnerable</th>
                <th className="py-2.5 px-3">Seniors (65+)</th>
                <th className="py-2.5 px-3">Outdoor Workers</th>
                <th className="py-2.5 px-3">Chronic Comorbidities</th>
                <th className="py-2.5 px-3">Health Risk</th>
                <th className="py-2.5 px-3">Primary Precaution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {areas.map((w) => (
                <tr key={w.wardId} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">{w.wardName}</span>
                    <span className="text-[10px] text-slate-400">{w.zone}</span>
                  </td>
                  <td className="py-3 px-3 font-black text-slate-900">
                    {w.vulnerablePopulation.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-rose-700">
                    {w.vulnerabilityBreakdown.elderly65Plus.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-amber-700">
                    {w.vulnerabilityBreakdown.outdoorWorkers.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-blue-700">
                    {w.vulnerabilityBreakdown.chronicConditions.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        w.healthRisk === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {w.healthRisk}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {w.recommendedHealthAction.split(';')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
