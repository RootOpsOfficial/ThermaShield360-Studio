import React, { useState } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { CitizenPage } from '../types.js';
import {
  Home,
  Flame,
  ThermometerSun,
  Map,
  CalendarRange,
  Cross,
  Route,
  Bell,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { DataValidationCenter } from './data/DataValidationCenter.js';

interface SidebarItem {
  id: CitizenPage;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const CitizenSidebar: React.FC = () => {
  const { activePage, setActivePage, location, longRangeReport } = useCitizen();
  const [showValidationCenter, setShowValidationCenter] = useState(false);

  // Real confidence from the live early-warning report — no hardcoded badge value.
  const heatwaveConfidencePct = longRangeReport?.unifiedVerdict?.unifiedConfidencePct;

  // Real, per-location source availability derived from the live evidence ledger.
  const dataBasis = longRangeReport?.dataBasis;
  const liveSources = Array.from(
    new Set([
      ...(dataBasis?.consensusSources ?? []),
      ...(dataBasis?.ensembleAvailable ? ['NOAA GEFS'] : []),
      ...(dataBasis?.climatologyAvailable ? [dataBasis?.climatologySource ?? 'NASA POWER'] : []),
    ])
  );
  const unavailableSources = dataBasis?.unavailableSources ?? [];

  const items: SidebarItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'risk', label: 'My Heat Risk', icon: Flame },
    {
      id: 'future',
      label: 'Early Warning & Heatwave Forecast',
      icon: CalendarRange,
      badge: heatwaveConfidencePct !== undefined ? `${heatwaveConfidencePct}%` : undefined,
    },
    { id: 'thermal', label: 'Thermal Stress', icon: ThermometerSun },
    { id: 'map', label: 'Heat Risk Map', icon: Map },
    { id: 'healthcare', label: 'Nearby Healthcare', icon: Cross },
    { id: 'route', label: 'Safe Route', icon: Route },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white/70 backdrop-blur-xl border-r border-black/5 p-4 min-h-[calc(100vh-61px)]">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-2">
          Citizen Workspace
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1D1D1F] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Data Verification Status Card */}
        <button
          onClick={() => setShowValidationCenter(true)}
          className="mt-3 p-3 rounded-2xl bg-white border border-black/5 hover:border-black/10 text-left text-xs transition-all shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px]">
                {liveSources.length > 0 ? `${liveSources.length} Sources Verified` : 'Verifying sources…'}
              </span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-[10px] text-slate-500 leading-snug">
            {liveSources.length > 0 ? `${liveSources.join(', ')} active for this location.` : 'Awaiting verified provider responses.'}
          </p>
          {unavailableSources.length > 0 && (
            <p className="text-[10px] text-amber-700 leading-snug mt-1">
              Unavailable: {unavailableSources.map((s) => s.split(' — ')[0]).join(', ')}.
            </p>
          )}
        </button>

        {/* Bottom Safety Tip Mini Card */}
        <div className="mt-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 text-xs">
          <div className="flex items-center gap-1.5 text-orange-800 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Civic Protection Active</span>
          </div>
          <p className="text-[11px] text-orange-900/80 leading-relaxed">
            Free drinking water kiosks & misted shelters are open throughout the municipal protection network.
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar for quick access */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/5 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {[
          { id: 'home' as CitizenPage, label: 'Home', icon: Home },
          { id: 'risk' as CitizenPage, label: 'Risk', icon: Flame },
          { id: 'future' as CitizenPage, label: 'Warning', icon: CalendarRange },
          { id: 'map' as CitizenPage, label: 'Map', icon: Map },
          { id: 'alerts' as CitizenPage, label: 'Alerts', icon: Bell },
          { id: 'settings' as CitizenPage, label: 'Settings', icon: Settings },
        ].map((m) => {
          const Icon = m.icon;
          const isActive = activePage === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActivePage(m.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? 'text-orange-600 font-bold' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="mt-0.5">{m.label}</span>
            </button>
          );
        })}
      </div>

      {showValidationCenter && (
        <DataValidationCenter isModal onClose={() => setShowValidationCenter(false)} lat={location.lat} lng={location.lng} locationName={location.ward?.name} />
      )}
    </>
  );
};
