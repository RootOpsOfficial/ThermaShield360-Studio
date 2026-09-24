import React, { useState, useEffect } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { InteractiveGisMap } from '../components/InteractiveGisMap.js';
import { SafeRouteOption } from '../types.js';
import {
  Route,
  Navigation,
  MapPin,
  Clock,
  Compass,
  Trees,
  Droplets,
  Snowflake,
  Cross,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';

export const SafeRoutePage: React.FC = () => {
  const { location } = useCitizen();

  const [destinationName, setDestinationName] = useState('Mahatma Phule Mandai');
  const [selectedRouteTab, setSelectedRouteTab] = useState<'fastest' | 'safe'>('safe');
  const [routes, setRoutes] = useState<SafeRouteOption[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number }>({
    lat: 18.5134,
    lng: 73.8561,
  });

  const fetchRoutes = async (destLat: number, destLng: number, destLabel: string) => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: {
            lat: location.lat,
            lng: location.lng,
            label: location.ward.name.split(':')[0],
          },
          destination: {
            lat: destLat,
            lng: destLng,
            label: destLabel,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes(data.routes || []);
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    fetchRoutes(destinationCoords.lat, destinationCoords.lng, destinationName);
  }, [location.lat, location.lng]);

  const fastestRoute = routes.find((r) => r.name === 'FASTEST ROUTE');
  const safeRoute = routes.find((r) => r.name === 'THERMAL-SAFE ROUTE');
  const activeRoute = selectedRouteTab === 'safe' ? safeRoute || routes[1] : fastestRoute || routes[0];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Thermal-Safe Routing Engine
            </h1>
            <span className="apple-badge bg-emerald-100 text-emerald-800">
              Microclimate Guided
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Replaces blistering concrete highways with tree-canopied corridors, misting fans, and water kiosks.
          </p>
        </div>

        <button
          onClick={() => fetchRoutes(destinationCoords.lat, destinationCoords.lng, destinationName)}
          disabled={isCalculating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
          <span>Recalculate Thermal Risk</span>
        </button>
      </div>

      {/* Origin & Destination Bar */}
      <section className="apple-card p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Origin */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-black/5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              A
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Origin</span>
              <span className="text-xs font-bold text-slate-800 truncate block">
                {location.ward.name} (GPS)
              </span>
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-black/5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
              B
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Destination</span>
              <select
                value={destinationName}
                onChange={(e) => {
                  const val = e.target.value;
                  setDestinationName(val);
                  let coords = { lat: 18.5134, lng: 73.8561 };
                  if (val.includes('Mandai')) coords = { lat: 18.5134, lng: 73.8561 };
                  else if (val.includes('FC Road')) coords = { lat: 18.5186, lng: 73.8415 };
                  else if (val.includes('Station')) coords = { lat: 18.5284, lng: 73.8743 };
                  else if (val.includes('Sarasbaug')) coords = { lat: 18.5005, lng: 73.8542 };
                  else if (val.includes('University')) coords = { lat: 18.5529, lng: 73.8248 };
                  setDestinationCoords(coords);
                  fetchRoutes(coords.lat, coords.lng, val);
                }}
                className="w-full text-xs font-bold text-slate-800 bg-transparent border-0 focus:ring-0 p-0"
              >
                <option value="Mahatma Phule Mandai">Mahatma Phule Mandai (Heritage Core)</option>
                <option value="FC Road Goodluck Chowk">FC Road (Goodluck Chowk)</option>
                <option value="Pune Railway Junction">Pune Railway Junction Station</option>
                <option value="Sarasbaug Lake Gardens">Sarasbaug Lake Gardens (South Pune)</option>
                <option value="Savitribai Phule University">Savitribai Phule Pune University</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Route Options Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fastest Route Option */}
        <div
          onClick={() => setSelectedRouteTab('fastest')}
          className={`apple-card p-5 cursor-pointer transition-all border-2 ${
            selectedRouteTab === 'fastest'
              ? 'border-red-500 shadow-md bg-white'
              : 'border-transparent bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <span className="font-extrabold text-xs uppercase tracking-wide text-red-600">
              FASTEST ROUTE
            </span>
            <span className="apple-badge bg-red-100 text-red-700 text-[10px]">
              High Heat Exposure
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-slate-900">
                {fastestRoute?.timeMins || 14} Mins
              </span>
              <span className="text-xs text-slate-500 ml-2 font-medium">
                {fastestRoute?.distanceKm || 3.2} km
              </span>
            </div>
            <span className="text-xs font-bold text-slate-500">Unshaded Roads</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Direct arterial vehicular thoroughfare with little to no canopy cover and intense surface heat backscatter.
          </p>

          <div className="mt-3.5 pt-3 border-t border-black/5 flex items-center justify-between text-xs text-slate-500">
            <span>Canopy: <strong>14%</strong></span>
            <span>Water Kiosks: <strong>1</strong></span>
            <span>Cooling Shelters: <strong>0</strong></span>
          </div>
        </div>

        {/* Thermal-Safe Route Option */}
        <div
          onClick={() => setSelectedRouteTab('safe')}
          className={`apple-card p-5 cursor-pointer transition-all border-2 relative overflow-hidden ${
            selectedRouteTab === 'safe'
              ? 'border-emerald-500 shadow-md bg-white'
              : 'border-transparent bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/5">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs uppercase tracking-wide text-emerald-700">
                RECOMMENDED: THERMAL-SAFE ROUTE
              </span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="apple-badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              -2.8°C Cooler
            </span>
          </div>

          <div className="my-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-emerald-700">
                {safeRoute?.timeMins || 18} Mins
              </span>
              <span className="text-xs text-slate-500 ml-2 font-medium">
                {safeRoute?.distanceKm || 3.6} km (+400m)
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700">Canopy Greenways</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Follows Mutha riverfront greenway, Sambhaji park gardens, with 3 chilled water refill kiosks and 2 AC shelters.
          </p>

          <div className="mt-3.5 pt-3 border-t border-black/5 flex items-center justify-between text-xs text-emerald-800 font-medium">
            <span>Canopy: <strong>68%</strong></span>
            <span>Water Kiosks: <strong>3</strong></span>
            <span>Cooling Shelters: <strong>2</strong></span>
          </div>
        </div>
      </div>

      {/* Map with Route Overlays */}
      <section className="apple-card p-4 sm:p-5">
        <InteractiveGisMap
          heightClass="h-[460px]"
          showProtectionPoints={true}
          showHealthcarePoints={true}
          routeCoordinates={{
            fastest: fastestRoute?.pathCoordinates,
            safe: safeRoute?.pathCoordinates,
          }}
        />
      </section>

      {/* Turn-by-Turn Directions along Active Route */}
      {activeRoute && (
        <section className="apple-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <h3 className="font-bold text-slate-900 text-sm">
              Turn-by-Turn Thermal Guidance ({activeRoute.name})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {activeRoute.waypoints.length} Route Segments
            </span>
          </div>

          <div className="space-y-3">
            {activeRoute.waypoints.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50/80 border border-black/5 flex items-start gap-3 text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>

                <div className="flex-1 space-y-1">
                  <p className="font-bold text-slate-800 leading-snug">{step.instruction}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>Segment: <strong>{step.distanceMeters}m</strong></span>
                    <span>• Shade Coverage: <strong>{step.shadeCoveragePct}%</strong></span>
                    {step.nearbyProtection && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        • Nearby: {step.nearbyProtection.name}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    step.thermalExposure === 'Extreme'
                      ? 'bg-red-100 text-red-700'
                      : step.thermalExposure === 'Moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {step.thermalExposure} Heat
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
