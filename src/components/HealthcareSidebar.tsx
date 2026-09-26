import React from 'react';
import { useHealthcare } from '../context/HealthcareContext.js';
import { HealthcareNavPage } from '../types/healthcare.js';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  MapPin,
  Users,
  ShieldCheck,
  Scale,
  Bell,
  Settings,
  HeartPulse,
  Building,
} from 'lucide-react';

interface SidebarItem {
  id: HealthcareNavPage;
  label: string;
  category: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const HealthcareSidebar: React.FC = () => {
  const { activeHealthcarePage, setActiveHealthcarePage, summary } = useHealthcare();

  const readinessStatus = summary?.facilityReadiness.overallStatus || 'NEEDS ATTENTION';
  const capacityGap = summary?.demandCapacity.capacityGapPatients || 0;

  const items: SidebarItem[] = [
    // HOME
    {
      id: 'command-center',
      label: 'Health Command Center',
      category: 'HOME',
      icon: LayoutDashboard,
    },
    // HEAT & HEALTH
    {
      id: 'forecast',
      label: 'Health Forecast',
      category: 'HEAT & HEALTH',
      icon: Activity,
      badge: '5-Day',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border border-emerald-200',
    },
    {
      id: 'risk-trend',
      label: 'Risk Trend',
      category: 'HEAT & HEALTH',
      icon: TrendingUp,
    },
    // RISK AREAS
    {
      id: 'risk-areas',
      label: 'High-Risk Areas',
      category: 'RISK AREAS',
      icon: MapPin,
      badge: `${summary?.highRiskAreas.length || 6} Wards`,
      badgeColor: 'bg-orange-500/10 text-orange-700 border border-orange-200',
    },
    {
      id: 'vulnerability',
      label: 'Vulnerable Population',
      category: 'RISK AREAS',
      icon: Users,
    },
    // PREPAREDNESS
    {
      id: 'facility-profile',
      label: 'Facility Profile (Data Entry)',
      category: 'PREPAREDNESS',
      icon: Building,
      badge: summary?.facilityProfile?.isEntered ? 'Entered' : 'Pending',
      badgeColor: summary?.facilityProfile?.isEntered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'facility-readiness',
      label: 'Facility Readiness',
      category: 'PREPAREDNESS',
      icon: ShieldCheck,
      badge: readinessStatus === 'READY' ? 'Ready' : 'Attention',
      badgeColor: readinessStatus === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'demand-capacity',
      label: 'Demand & Capacity',
      category: 'PREPAREDNESS',
      icon: Scale,
      badge: capacityGap > 0 ? `-${capacityGap} Beds` : 'Balanced',
      badgeColor: capacityGap > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700',
    },
    // ALERTS
    {
      id: 'alerts',
      label: 'Health Alerts',
      category: 'ALERTS',
      icon: Bell,
      badge: summary?.activeAlert ? 1 : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    // SETTINGS
    {
      id: 'settings',
      label: 'Settings',
      category: 'SETTINGS',
      icon: Settings,
    },
  ];

  const categories = ['HOME', 'HEAT & HEALTH', 'RISK AREAS', 'PREPAREDNESS', 'ALERTS', 'SETTINGS'];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white/70 backdrop-blur-xl border-r border-black/5 p-4 min-h-[calc(100vh-61px)]">
        <div className="flex items-center justify-between px-3 pb-3 mb-1 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              HEALTHCARE SECTOR
            </div>
            <p className="text-[12px] font-bold text-slate-800 truncate max-w-[170px]">
              Heatstroke Medical Grid
            </p>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pt-2">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {cat}
                </div>
                {catItems.map((item) => {
                  const isActive = activeHealthcarePage === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveHealthcarePage(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom Facility Status Badge */}
        <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
              Preparedness:
            </span>
            <span
              className={`font-bold ${
                readinessStatus === 'READY'
                  ? 'text-emerald-700'
                  : readinessStatus === 'NEEDS ATTENTION'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {readinessStatus}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Floating Quick Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/5 px-2 py-1.5 flex items-center justify-around">
        {[
          { id: 'command-center', label: 'Command', icon: LayoutDashboard },
          { id: 'forecast', label: 'Forecast', icon: Activity },
          { id: 'risk-areas', label: 'Areas', icon: MapPin },
          { id: 'facility-readiness', label: 'Readiness', icon: ShieldCheck },
          { id: 'alerts', label: 'Alerts', icon: Bell },
        ].map((btn) => {
          const isActive = activeHealthcarePage === btn.id;
          const Icon = btn.icon;
          return (
            <button
              key={btn.id}
              onClick={() => setActiveHealthcarePage(btn.id as HealthcareNavPage)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
