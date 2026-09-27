import React from 'react';
import { useDisaster } from '../context/DisasterContext.js';
import { DisasterNavPage } from '../types/disaster.js';
import {
  ShieldAlert,
  Flame,
  MapPin,
  HeartPulse,
  Scale,
  BellRing,
  Activity,
  Settings,
  Radio,
} from 'lucide-react';

interface SidebarItem {
  id: DisasterNavPage;
  label: string;
  category: 'HOME' | 'REGIONAL RISK' | 'IMPACT' | 'COORDINATION' | 'SETTINGS';
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

export const DisasterSidebar: React.FC = () => {
  const { activeDisasterPage, setActiveDisasterPage, summary, alerts, responseTasks } = useDisaster();

  const criticalCount = summary?.highRiskAreas?.criticalCount ?? 3;
  const activeAlertsCount = alerts?.length ?? 4;
  const activeTasksCount = responseTasks?.filter((t) => t.status === 'Active Response').length ?? 3;
  const shortfallPct = summary?.protectionShortfall?.overallShortfallPct ?? 53;

  const items: SidebarItem[] = [
    {
      id: 'command',
      label: 'Emergency Command',
      category: 'HOME',
      icon: ShieldAlert,
    },
    {
      id: 'heat-situation',
      label: 'Heat Situation',
      category: 'REGIONAL RISK',
      icon: Flame,
      badge: 'Tier 3',
      badgeColor: 'bg-red-500/10 text-red-700 border border-red-200',
    },
    {
      id: 'high-risk-areas',
      label: 'High-Risk Areas',
      category: 'REGIONAL RISK',
      icon: MapPin,
      badge: `${criticalCount} Critical`,
      badgeColor: 'bg-red-500/10 text-red-700 border border-red-200',
    },
    {
      id: 'health-impact',
      label: 'Health Impact',
      category: 'IMPACT',
      icon: HeartPulse,
      badge: '+42% Surge',
      badgeColor: 'bg-rose-500/10 text-rose-700 border border-rose-200',
    },
    {
      id: 'protection-shortfall',
      label: 'Protection Shortfall',
      category: 'IMPACT',
      icon: Scale,
      badge: `${shortfallPct}% Gap`,
      badgeColor: 'bg-amber-500/10 text-amber-700 border border-amber-200',
    },
    {
      id: 'alerts-escalation',
      label: 'Alerts & Escalation',
      category: 'COORDINATION',
      icon: BellRing,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-red-600 text-white',
    },
    {
      id: 'response-tracking',
      label: 'Response Tracking',
      category: 'COORDINATION',
      icon: Activity,
      badge: `${activeTasksCount} Active`,
      badgeColor: 'bg-blue-500/10 text-blue-700 border border-blue-200',
    },
    {
      id: 'settings',
      label: 'Settings',
      category: 'SETTINGS',
      icon: Settings,
    },
  ];

  const categories: Array<'HOME' | 'REGIONAL RISK' | 'IMPACT' | 'COORDINATION' | 'SETTINGS'> = [
    'HOME',
    'REGIONAL RISK',
    'IMPACT',
    'COORDINATION',
    'SETTINGS',
  ];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white/70 backdrop-blur-xl border-r border-black/5 p-4 min-h-[calc(100vh-61px)]">
        {/* Workspace Brand Badge */}
        <div className="flex items-center justify-between px-3 pb-3 mb-2 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-600 animate-pulse" />
              <span>DISASTER AUTHORITY</span>
            </div>
            <p className="text-[12px] font-bold text-slate-800">Emergency Command EOC</p>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>

        {/* Navigation Categories */}
        <nav className="flex-1 space-y-4 overflow-y-auto pt-1">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <div className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {cat}
                </div>
                {catItems.map((item) => {
                  const isActive = activeDisasterPage === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveDisasterPage(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-red-50 text-red-950 font-bold shadow-2xs border border-red-200/80'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-red-700'
                              : 'text-slate-400 group-hover:text-slate-700'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 shadow-2xs ${
                            item.badgeColor || 'bg-slate-200 text-slate-700'
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

        {/* Command Center Status Pill */}
        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-800">
                POSTURE
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600 text-white shadow-2xs">
                RED ALERT
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-800 mt-1">Inter-Agency Mobilization</p>
            <p className="text-[9px] text-slate-500 font-medium">IMD Radar • Health • Civil Defense</p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/5 px-2 py-1.5 flex items-center justify-around overflow-x-auto shadow-lg">
        {items.slice(0, 5).map((item) => {
          const isActive = activeDisasterPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveDisasterPage(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl min-w-[60px] text-[10px] font-semibold transition-all ${
                isActive ? 'text-red-700 font-black' : 'text-slate-500'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-red-700' : 'text-slate-400'}`} />
              <span className="truncate max-w-[64px] text-[9px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
