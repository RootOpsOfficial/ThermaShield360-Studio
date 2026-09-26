import React, { useState, useEffect, useRef } from 'react';
import { useHealthcare } from '../../context/HealthcareContext.js';
import { HealthcareRiskArea } from '../../types/healthcare.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Flame,
  Users,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
  Building,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export const HighRiskAreasPage: React.FC = () => {
  const { summary, selectedRiskArea, setSelectedRiskArea, setActiveHealthcarePage } = useHealthcare();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const areas = summary?.highRiskAreas || [];
  const activeArea = selectedRiskArea || (areas.length > 0 ? areas[0] : null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: activeArea ? activeArea.center : [18.5204, 73.8567],
      zoom: 12.5,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when areas or activeArea changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    areas.forEach((area) => {
      const isSelected = activeArea?.wardId === area.wardId;
      const color =
        area.healthRisk === 'Critical'
          ? '#EF4444'
          : area.healthRisk === 'High'
          ? '#F97316'
          : '#F59E0B';

      const icon = L.divIcon({
        className: 'health-risk-pin',
        html: `
          <div style="
            width: ${isSelected ? 38 : 30}px;
            height: ${isSelected ? 38 : 30}px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '15px' : '12px'};
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            🏥
          </div>
        `,
        iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
        iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15],
      });

      const marker = L.marker(area.center, { icon });
      marker.bindTooltip(
        `<strong>${area.wardName}</strong><br/>${area.healthRisk} Risk • ${area.expectedDemand}`,
        { direction: 'top', offset: [0, -10] }
      );
      marker.on('click', () => {
        setSelectedRiskArea(area);
        map.setView(area.center, 13.5, { animate: true });
      });

      marker.addTo(layer);
    });

    if (activeArea) {
      map.setView(activeArea.center, map.getZoom(), { animate: true });
    }
  }, [areas, activeArea, setSelectedRiskArea]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
              GEOGRAPHIC DEMAND CLUSTERING
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              6 MONITORED WARDS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            High-Risk Health Demand Areas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Identify municipal wards generating disproportionate emergency patient presentations due to microclimate heat load and demographic density.
          </p>
        </div>

        <button
          onClick={() => setActiveHealthcarePage('vulnerability')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <Users className="w-3.5 h-3.5 text-orange-400" />
          <span>Vulnerable Population Breakdown</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid: Interactive Map + Area List & Area Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Real Geographic Map Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  REAL GEOGRAPHIC BASEMAP
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Heat-Health GIS Map
                </h3>
              </div>

              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                OpenStreetMap GIS
              </span>
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-black/5 shadow-inner"
            ></div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span className="text-[11px]">
              Pins denote ward medical centers • Click pin to focus zone
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Active: {activeArea?.wardName || 'None'}
            </span>
          </div>
        </div>

        {/* Selected Area Detail Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          {activeArea ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  AREA DETAIL
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    activeArea.healthRisk === 'Critical'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}
                >
                  {activeArea.healthRisk} Health Risk
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  {activeArea.wardName}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">{activeArea.zone}</p>
              </div>

              {/* Demand & Admissions Metric */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-2xl">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                    Expected Demand
                  </span>
                  <p className="text-base font-black text-blue-950 mt-0.5">
                    {activeArea.expectedDemand}
                  </p>
                  <span className="text-[10px] text-blue-700">~{activeArea.expectedDailyAdmissions} patients / day</span>
                </div>

                <div className="p-3 bg-orange-50/70 border border-orange-200/70 rounded-2xl">
                  <span className="text-[10px] font-black text-orange-800 uppercase tracking-wider block">
                    Vulnerable Group
                  </span>
                  <p className="text-base font-black text-orange-950 mt-0.5">
                    {activeArea.vulnerablePopulation.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-orange-700">At-risk citizens</span>
                </div>
              </div>

              {/* Exposure Notes */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Vulnerable Exposure Notes
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {activeArea.vulnerableExposureNotes}
                </p>
              </div>

              {/* Recommended Health Action */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl text-xs">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                  Recommended Health Action
                </span>
                <p className="text-emerald-950 font-bold leading-relaxed">
                  {activeArea.recommendedHealthAction}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a high-risk ward from the list or map.
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">108 Ambulances alert ready</span>
            <button
              onClick={() => setActiveHealthcarePage('facility-readiness')}
              className="px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Verify Readiness</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Ward Comparison Table List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-3">
          All Monitored Wards Demand Ranking
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                <th className="py-2.5 px-3">Ward / Area</th>
                <th className="py-2.5 px-3">Heat Risk</th>
                <th className="py-2.5 px-3">Health Risk</th>
                <th className="py-2.5 px-3">Expected Demand</th>
                <th className="py-2.5 px-3">Estimated Admissions</th>
                <th className="py-2.5 px-3">Vulnerable Exposure</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {areas.map((w) => {
                const isSelected = activeArea?.wardId === w.wardId;
                return (
                  <tr
                    key={w.wardId}
                    onClick={() => setSelectedRiskArea(w)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{w.wardName}</span>
                      <span className="text-[10px] text-slate-400">{w.zone}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          w.heatRisk === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {w.heatRisk}
                      </span>
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
                    <td className="py-3 px-3 font-bold text-blue-700">{w.expectedDemand}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">~{w.expectedDailyAdmissions} patients / day</td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{w.vulnerablePopulation.toLocaleString()} citizens</td>
                    <td className="py-3 px-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
