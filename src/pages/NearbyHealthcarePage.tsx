import React, { useState } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import {
  Cross,
  Phone,
  Navigation,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Bed,
  ArrowUpDown,
  Route,
} from 'lucide-react';

export const NearbyHealthcarePage: React.FC = () => {
  const { healthcareFacilities, location, setActivePage } = useCitizen();

  const [filterType, setFilterType] = useState<string>('all');
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);

  const filtered = healthcareFacilities.filter((h) => {
    if (emergencyOnly && !h.emergencyIndicator) return false;
    if (filterType !== 'all' && h.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Nearby Healthcare & Heat-Stroke Units
            </h1>
            <span className="apple-badge bg-red-100 text-red-800">
              Emergency Network
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified emergency departments, ice-bath resuscitation units, and PMC Urban Primary Health Centres.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              emergencyOnly
                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                : 'bg-white text-slate-700 border-black/10 hover:bg-slate-50'
            }`}
          >
            {emergencyOnly ? '✓ 24/7 Emergency Only' : 'Filter 24/7 Emergency'}
          </button>
        </div>
      </div>

      {/* Quick Emergency Protocol Banner */}
      <div className="apple-card p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border-l-4 border-l-red-600 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <HeartPulse className="w-5 h-5 text-red-600" />
          <div>
            <span className="font-bold text-red-950 block">Heat Stroke Emergency Protocol</span>
            <span className="text-slate-600">
              Core body temp &gt; 40°C, confusion, hot/dry skin, or loss of consciousness requires instant immersion & 108 ambulance dispatch.
            </span>
          </div>
        </div>
        <a
          href="tel:108"
          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" /> Call 108 Emergency
        </a>
      </div>

      {/* Directory List */}
      <div className="space-y-3">
        {filtered.map((hosp) => (
          <div
            key={hosp.id}
            className="apple-card p-5 border border-black/5 hover:border-black/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Hospital Details */}
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">{hosp.name}</h3>
                {hosp.emergencyIndicator && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">
                    24x7 Emergency
                  </span>
                )}
                <span className="apple-badge bg-slate-100 text-slate-600 text-[10px]">
                  {hosp.dataSource}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                  {hosp.type}
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{hosp.address}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Bed className="w-4 h-4 text-emerald-600" />
                  {hosp.heatStrokeBedsAvailable} Heat Resuscitation Beds Available
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  Total Heat Capacity: {hosp.totalHeatBeds} Beds
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600">
                  Status: <strong className="text-emerald-700">{hosp.status}</strong>
                </span>
              </div>
            </div>

            {/* Travel Time & Direct Actions */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-black/5 gap-2 shrink-0">
              <div className="text-left md:text-right">
                <div className="text-lg font-black text-slate-900">{hosp.distanceKm} km</div>
                <div className="text-xs text-slate-400 font-medium">
                  ~{hosp.travelTimeMins} mins via {hosp.travelMode}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <a
                  href={`tel:${hosp.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" /> Call Hospital
                </a>
                <a
                  href={hosp.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
