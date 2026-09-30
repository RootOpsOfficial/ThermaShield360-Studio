import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MunicipalWardData, MunicipalRiskLevel } from '../../types/municipal.js';

interface MunicipalWardRealMapProps {
  wards: MunicipalWardData[];
  selectedWardId?: string;
  onSelectWard?: (ward: MunicipalWardData) => void;
  heightClass?: string;
}

/**
 * Real geographic ward map for Municipal Corporation decision support.
 *
 * Renders actual ward boundaries (from real ward `bounds` coordinates) on a real
 * basemap (OpenStreetMap tiles — same tile source already used across ThermaShield).
 * Coordinates are true latitude/longitude; there is no synthetic SVG projection.
 *
 * When a ward has no polygon boundary available, it is drawn as an honest circular
 * footprint around its reported centroid and the map legend states the limitation.
 */
const RISK_STYLE: Record<MunicipalRiskLevel, { fill: string; stroke: string; label: string }> = {
  Critical: { fill: '#DC2626', stroke: '#991B1B', label: 'Critical' },
  High: { fill: '#F97316', stroke: '#C2410C', label: 'High' },
  Developing: { fill: '#FBBF24', stroke: '#B45309', label: 'Developing' },
  Normal: { fill: '#10B981', stroke: '#047857', label: 'Normal' },
};

function styleFor(level: MunicipalRiskLevel) {
  return RISK_STYLE[level] || RISK_STYLE.Normal;
}

/** Chooses OSM tiles; matches tile source used elsewhere in the project. */
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const CARTO_KEY = (import.meta as any).env?.VITE_CARTO_API_KEY as string | undefined;
const CARTO_URL = CARTO_KEY
  ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
  : null;

export const MunicipalWardRealMap: React.FC<MunicipalWardRealMapProps> = ({
  wards,
  selectedWardId,
  onSelectWard,
  heightClass = 'h-[560px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const didFitRef = useRef<string | boolean>(false);

  // Only wards with valid real coordinates are mappable
  const mappableWardsAll = useMemo(
    () =>
      wards.filter(
        (w) =>
          Array.isArray(w.center) &&
          w.center.length === 2 &&
          !isNaN(w.center[0]) &&
          !isNaN(w.center[1]) &&
          w.center[0] !== 0 &&
          w.center[1] !== 0
      ),
    [wards]
  );

  // Ward datasets can span multiple municipal corporations (e.g. Pune + Mumbai + Delhi).
  // Resolve the active city cluster so the map frames a real municipality, not all of India.
  const activeCity = useMemo(() => {
    if (selectedWardId) {
      const sel = mappableWardsAll.find((w) => w.id === selectedWardId);
      if (sel?.city) return sel.city;
    }
    const counts = new Map<string, number>();
    mappableWardsAll.forEach((w) => {
      const c = w.city || (w.name?.includes('Pune') ? 'Pune' : '');
      if (!c) return;
      counts.set(c, (counts.get(c) || 0) + 1);
    });
    let best = '';
    let bestCount = 0;
    counts.forEach((n, c) => {
      if (n > bestCount) {
        bestCount = n;
        best = c;
      }
    });
    return best;
  }, [mappableWardsAll, selectedWardId]);

  // Wards actually rendered: the active city cluster when one is resolvable
  const mappableWards = useMemo(() => {
    if (!activeCity) return mappableWardsAll;
    const cluster = mappableWardsAll.filter(
      (w) => (w.city || (w.name?.includes('Pune') ? 'Pune' : '')).toLowerCase() === activeCity.toLowerCase()
    );
    return cluster.length > 0 ? cluster : mappableWardsAll;
  }, [mappableWardsAll, activeCity]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    mappableWardsAll.forEach((w) => {
      const c = w.city || (w.name?.includes('Pune') ? 'Pune' : '');
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [mappableWardsAll]);

  const wardsWithBoundary = useMemo(
    () => mappableWards.filter((w) => Array.isArray(w.bounds) && w.bounds.length >= 3),
    [mappableWards]
  );

  // ---- Initialize map once ----
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const first = mappableWards[0];
    const center: [number, number] = first ? [first.center[0], first.center[1]] : [20.5937, 78.9629];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: first ? 12 : 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(CARTO_URL || TILE_URL, {
      maxZoom: 19,
      subdomains: CARTO_URL ? 'abcd' : 'abc',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Ensure tiles render correctly after container sizing settles
    setTimeout(() => map.invalidateSize(), 120);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Draw / redraw ward layers when data or selection changes ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    mappableWards.forEach((ward) => {
      const isSelected = ward.id === selectedWardId;
      const style = styleFor(ward.riskLevel);

      const popupHtml = `
        <div style="font-family: inherit; min-width: 190px;">
          <div style="font-weight: 800; font-size: 12px; color:#0f172a;">${ward.name}</div>
          <div style="font-size: 10px; color:#64748b; margin-top:2px;">${ward.zone || ''}</div>
          <div style="margin-top:6px; font-size: 11px;">
            <div><b>Risk:</b> ${style.label} (${ward.riskScore})</div>
            <div><b>Temperature:</b> ${ward.temp ?? 'N/A'} °C</div>
            <div><b>WBGT:</b> ${ward.wbgt ?? 'N/A'} °C</div>
            <div><b>Thermal stress:</b> ${ward.thermalStress || 'N/A'}</div>
          </div>
        </div>`;

      const hasBoundary = Array.isArray(ward.bounds) && ward.bounds.length >= 3;

      if (hasBoundary) {
        // Real ward polygon from actual recorded boundary coordinates
        const poly = L.polygon(
          ward.bounds.map((b) => [b[0], b[1]] as [number, number]),
          {
            color: style.stroke,
            weight: isSelected ? 3.5 : 1.6,
            fillColor: style.fill,
            fillOpacity: isSelected ? 0.62 : 0.34,
          }
        );
        poly.bindPopup(popupHtml);
        poly.on('click', () => onSelectWard?.(ward));
        poly.addTo(group);
      } else {
        // No official boundary available — honest centroid footprint, clearly circular
        const circle = L.circle([ward.center[0], ward.center[1]], {
          radius: 1200,
          color: style.stroke,
          weight: isSelected ? 3 : 1.5,
          dashArray: '5,5',
          fillColor: style.fill,
          fillOpacity: isSelected ? 0.36 : 0.2,
        });
        circle.bindPopup(popupHtml);
        circle.on('click', () => onSelectWard?.(ward));
        circle.addTo(group);
      }

      // Centroid marker with live risk value
      const marker = L.circleMarker([ward.center[0], ward.center[1]], {
        radius: isSelected ? 9 : 6,
        color: '#ffffff',
        weight: 2,
        fillColor: style.fill,
        fillOpacity: 1,
      });
      marker.bindTooltip(
        `${ward.name}<br/>${style.label} · ${ward.temp ?? 'N/A'}°C · WBGT ${ward.wbgt ?? 'N/A'}°C`,
        { direction: 'top', offset: L.point(0, -8) }
      );
      marker.on('click', () => onSelectWard?.(ward));
      marker.addTo(group);
    });

    // Re-frame the map whenever the active municipality cluster changes
    const fitKey = activeCity || `n-${mappableWards.length}`;
    if (didFitRef.current !== fitKey && mappableWards.length > 0) {
      const allPoints: [number, number][] = [];
      mappableWards.forEach((w) => {
        allPoints.push([w.center[0], w.center[1]]);
        if (Array.isArray(w.bounds)) w.bounds.forEach((b) => allPoints.push([b[0], b[1]]));
      });
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints).pad(0.12));
        didFitRef.current = true;
      }
    }
  }, [mappableWards, selectedWardId, onSelectWard, activeCity]);

  // ---- Pan to the selected ward when selection changes ----
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedWardId) return;
    const ward = mappableWards.find((w) => w.id === selectedWardId);
    if (ward) {
      map.panTo([ward.center[0], ward.center[1]], { animate: true });
    }
  }, [selectedWardId, mappableWards]);

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100`}
      >
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
        {mappableWards.length === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/85 backdrop-blur-sm">
            <p className="text-xs font-semibold text-slate-500">
              No ward coordinates available for the selected municipality.
            </p>
          </div>
        )}
      </div>

      {/* Legend + honest boundary-coverage statement */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-3">
          {(['Critical', 'High', 'Developing', 'Normal'] as MunicipalRiskLevel[]).map((lvl) => (
            <span key={lvl} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: RISK_STYLE[lvl].fill }}
              />
              {RISK_STYLE[lvl].label}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-slate-400">
          {activeCity ? `${activeCity} · ` : ''}
          {wardsWithBoundary.length}/{mappableWards.length} wards with official boundary polygon
          {wardsWithBoundary.length < mappableWards.length
            ? ' — remaining displayed as centroid footprint'
            : ''}
        </span>
      </div>
    </div>
  );
};

