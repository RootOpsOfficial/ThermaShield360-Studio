import React, { useState } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { InteractiveGisMap } from '../components/InteractiveGisMap.js';
import {
  Shield,
  Droplets,
  Snowflake,
  Trees,
  Cross,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  Filter,
  Users,
  Compass,
} from 'lucide-react';

export const ProtectionPage: React.FC = () => {
  const { protectionPoints, protectionSummary, location } = useCitizen();

  const [activeTab, setActiveTab] = useState<'all' | 'water' | 'cooling' | 'shade' | 'healthcare'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const filteredPoints = protectionPoints.filter((p) => {
    if (activeTab === 'all') return true;
    return p.type === activeTab;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Civic Heat Protection Network
            </h1>
            <span className="apple-badge bg-blue-100 text-blue-800">
              PMC Disaster Relief
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Free drinking water points, air-conditioned cooling centres, shaded arbours, and healthcare units.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-black/5 text-xs font-bold">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Directory View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            GIS Map View
          </button>
        </div>
      </div>

      {/* Aggregate Protection Demand & Capacity Summary Card */}
      {protectionSummary && (
        <section className="apple-card p-5 sm:p-6 bg-gradient-to-r from-blue-50/70 via-white to-emerald-50/70 border border-blue-100/60">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Ward Protection Demand & Capacity ({location.ward.name.split(':')[0]})
              </h3>
            </div>
            <span
              className={`apple-badge font-bold text-xs ${
                protectionSummary.overallStatus === 'Available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Network Status: {protectionSummary.overallStatus}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3.5 bg-white rounded-xl border border-black/5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                People Requiring Protection
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {protectionSummary.expectedPeopleRequiringProtection.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Outdoor workers & seniors</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-black/5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Available Shelter Capacity
              </span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {protectionSummary.availableCapacity.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">Free public access</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-black/5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Protection Demand
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {protectionSummary.protectionDemand.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">Peak hour projected</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-black/5 shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Protection Gap
              </span>
              <span
                className={`text-2xl font-black mt-1 block ${
                  protectionSummary.protectionGap > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {protectionSummary.protectionGap.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">
                {protectionSummary.capacityFulfillmentPct}% Capacity Fulfilled
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all' as const, label: 'All Facilities', icon: Shield, count: protectionPoints.length },
          {
            id: 'water' as const,
            label: 'Water Points',
            icon: Droplets,
            count: protectionPoints.filter((p) => p.type === 'water').length,
          },
          {
            id: 'cooling' as const,
            label: 'Cooling Centres',
            icon: Snowflake,
            count: protectionPoints.filter((p) => p.type === 'cooling').length,
          },
          {
            id: 'shade' as const,
            label: 'Shade / Rest Areas',
            icon: Trees,
            count: protectionPoints.filter((p) => p.type === 'shade').length,
          },
          {
            id: 'healthcare' as const,
            label: 'Emergency Healthcare',
            icon: Cross,
            count: protectionPoints.filter((p) => p.type === 'healthcare').length,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-black/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* View Content: Map or List */}
      {viewMode === 'map' ? (
        <section className="apple-card p-4">
          <InteractiveGisMap heightClass="h-[520px]" showProtectionPoints={true} />
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPoints.map((pt) => {
            const isWater = pt.type === 'water';
            const isCooling = pt.type === 'cooling';
            const isShade = pt.type === 'shade';

            return (
              <div
                key={pt.id}
                className="apple-card p-5 border border-black/5 hover:border-black/10 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2.5 rounded-xl ${
                        isWater
                          ? 'bg-blue-100 text-blue-700'
                          : isCooling
                          ? 'bg-cyan-100 text-cyan-700'
                          : isShade
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isWater ? (
                        <Droplets className="w-5 h-5" />
                      ) : isCooling ? (
                        <Snowflake className="w-5 h-5" />
                      ) : isShade ? (
                        <Trees className="w-5 h-5" />
                      ) : (
                        <Cross className="w-5 h-5" />
                      )}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{pt.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{pt.categoryLabel}</p>
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      pt.status === 'Available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pt.status === 'Limited'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {pt.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1">{pt.address}</p>

                {/* Capacity stats & Hours */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-black/5 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Capacity</span>
                    <span className="font-bold text-slate-800">{pt.capacity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Available</span>
                    <span className="font-bold text-emerald-600">{pt.availableCapacity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Hours</span>
                    <span className="font-semibold text-slate-700 truncate block">{pt.operatingHours}</span>
                  </div>
                </div>

                {/* Amenities pills */}
                <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-slate-600">
                  {pt.amenities.map((am, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100">
                      ✓ {am}
                    </span>
                  ))}
                </div>

                {/* Action button */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5">
                  <span className="text-xs text-slate-500 font-medium">
                    {pt.distanceKm} km away ({pt.walkingTimeMins} mins walk)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {pt.contact && (
                      <a
                        href={`tel:${pt.contact}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                    <a
                      href={`https://maps.google.com/?q=${pt.lat},${pt.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-lg bg-[#0071E3] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" /> Directions
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
