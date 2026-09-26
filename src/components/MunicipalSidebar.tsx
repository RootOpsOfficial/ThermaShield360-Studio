import React from 'react';
import { useMunicipal } from '../context/MunicipalContext.js';
import { MunicipalNavPage } from '../types/municipal.js';
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  ListChecks,
  Bell,
  Settings,
  Flame,
} from 'lucide-react';

interface SidebarItem {
  id: MunicipalNavPage;
  label: string;
  category: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const MunicipalSidebar: React.FC = () => {
  const { activeMunicipalPage, setActiveMunicipalPage, summary, actions, alerts } = useMunicipal();

  const highRiskCount = summary?.highRiskWardsCount ?? 3;
  const pendingActionsCount = actions.filter((a) => a.status === 'Approved' || a.status === 'Review' || a.status === 'In Progress').length;
  const activeAlertsCount = alerts.filter((a) => a.status === 'Active').length;

  const items: SidebarItem[] = [
    {
      id: 'command-center',
      label: 'Command Center',
      category: 'HOME',
      icon: LayoutDashboard,
    },
    {
      id: 'ward-risk-map',
      label: 'Ward Risk Map',
      category: 'RISK',
      icon: Map,
      badge: `${highRiskCount} High`,
      badgeColor: 'bg-rose-500/10 text-rose-600 border border-rose-200',
    },
    {
      id: 'protection-gap',
      label: 'Protection Gap',
      category: 'PROTECTION',
      icon: ShieldAlert,
      badge: 'Deficit',
      badgeColor: 'bg-amber-500/10 text-amber-700 border border-amber-200',
    },
    {
      id: 'recommended-actions',
      label: 'Recommended Actions',
      category: 'ACTION',
      icon: ListChecks,
      badge: pendingActionsCount > 0 ? pendingActionsCount : undefined,
      badgeColor: 'bg-blue-500/10 text-blue-600 border border-blue-200',
    },
    {
      id: 'municipal-alerts',
      label: 'Municipal Alerts',
      category: 'ALERTS',
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'settings',
      label: 'Settings',
      category: 'SETTINGS',
      icon: Settings,
    },
  ];

  // Exactly the 6 categories requested in Phase 5
  const categories = ['HOME', 'RISK', 'PROTECTION', 'ACTION', 'ALERTS', 'SETTINGS'];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white/70 backdrop-blur-xl border-r border-black/5 p-4 min-h-[calc(100vh-61px)]">
        <div className="flex items-center justify-between px-3 pb-3 mb-1 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">
              MUNICIPAL CORPORATION
            </div>
            <p className="text-[12px] font-bold text-slate-800">Disaster Management Cell</p>
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
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
                  {cat}
                </div>
                {catItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMunicipalPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveMunicipalPage(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-slate-100 text-slate-600'
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

        {/* Municipal Decision Support Quick Status Pill */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] bg-slate-50 rounded-xl p-2.5 border border-black/5">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-600" />
            <span>Heat Action Plan • Stage 2</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            Operational focus: 3 high-risk wards requiring priority cooling & hydration deployment.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/5 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeMunicipalPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMunicipalPage(item.id)}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
                isActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </div>
              <span className="truncate max-w-[58px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
