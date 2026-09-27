import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { LocalRiskMapResponse, LocalRiskMapAreaFeature, RiskLevel } from '../types.js';
import {
  MapPin,
  Crosshair,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';

interface LocalHeatRiskMapProps {
  initialLat?: number;
  initialLon?: number;
  onSelectWardId?: (wardId: string) => void;
}

export const LocalHeatRiskMap: React.FC<LocalHeatRiskMapProps> = ({
  initialLat = 18.5204,
  initialLon = 73.8567,
  onSelectWardId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Coordinates state (starts with provided or Pune defaults)
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: initialLat,
    lon: initialLon,
  });

  const [mapData, setMapData] = useState<LocalRiskMapResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<LocalRiskMapAreaFeature['properties'] | null>(null);

  // GPS tracking state
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'granted' | 'denied' | 'unavailable' | 'idle'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Color mapping according to specifications:
  // 🟢 Green = Low, 🟡 Yellow = Moderate, 🟠 Orange = High, 🔴 Red = Extreme
  const getRiskColors = (level: RiskLevel | string) => {
    switch (level) {
      case 'Extreme':
        return {
          stroke: '#DC2626',
          fill: '#EF4444',
          fillOpacity: 0.52,
          dot: '🔴',
          badgeBg: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'High':
        return {
          stroke: '#EA580C',
          fill: '#F97316',
          fillOpacity: 0.48,
          dot: '🟠',
          badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
        };
      case 'Moderate':
        return {
          stroke: '#CA8A04',
          fill: '#EAB308',
          fillOpacity: 0.44,
          dot: '🟡',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          stroke: '#16A34A',
          fill: '#22C55E',
          fillOpacity: 0.42,
          dot: '🟢',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
    }
  };

  // 1. Fetch real GeoJSON local risk map data from backend
  const fetchMapData = useCallback(async (lat: number, lon: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/citizen/local-risk-map?lat=${lat}&lon=${lon}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data: LocalRiskMapResponse = await res.json();
      setMapData(data);

      // Auto-select current area feature if available
      const currentArea = data.features.find((f) => f.properties.is_current_area) || data.features[0];
      if (currentArea) {
        setSelectedArea(currentArea.properties);
      }
    } catch (err: any) {
      console.error('Failed to load local risk map data:', err);
      setError('Unable to load authoritative local heat-risk boundaries. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Request Browser GPS
  const requestBrowserGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      setGpsErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('requesting');
    setGpsErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: Math.round(pos.coords.latitude * 10000) / 10000,
          lon: Math.round(pos.coords.longitude * 10000) / 10000,
        };
        setCoords(newCoords);
        setGpsStatus('granted');
        fetchMapData(newCoords.lat, newCoords.lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lon], 13.5, {
            duration: 1.2,
          });
        }
      },
      (err) => {
        console.warn('GPS position error:', err);
        setGpsStatus('denied');
        if (err.code === err.PERMISSION_DENIED) {
          setGpsErrorMsg('Location permission was denied. You can select an area manually.');
        } else {
          setGpsErrorMsg('Could not detect GPS position. Using calibrated local baseline.');
        }
        // Fallback to current coords
        fetchMapData(coords.lat, coords.lon);
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 30000,
      }
    );
  }, [coords.lat, coords.lon, fetchMapData]);

  // Initial load
  useEffect(() => {
    requestBrowserGps();
  }, []);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lon],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Voyager tiles with CARTO Basemaps API key
      const cartoKey =
        (import.meta as any).env?.VITE_CARTO_API_KEY ||
        'cb1_401u_1_82b76b95e0b97bfabce32af7';
      const keyQuery = cartoKey ? `?key=${cartoKey}` : '';

      L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyQuery}`, {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Attribution banner in small text
      L.control
        .attribution({
          position: 'bottomright',
          prefix: '© OpenStreetMap, © CARTO',
        })
        .addTo(map);

      mapInstanceRef.current = map;

      // Invalidate size after rendering to avoid gray tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 4. Update Leaflet Overlays (GeoJSON Polygons & User GPS Marker)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A. Render or Update "You Are Here" Marker
    const pulsingGpsIcon = L.divIcon({
      className: 'gps-pulse-marker',
      html: `
        <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style="overflow:visible;">
            <circle cx="20" cy="20" r="16" fill="#0071E3" fill-opacity="0.3">
              <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.45;0.05;0.45" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="20" r="7" fill="#0071E3" stroke="#FFFFFF" stroke-width="3" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3));" />
          </svg>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([coords.lat, coords.lon], {
        icon: pulsingGpsIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([coords.lat, coords.lon]);
    }

    // B. Render GeoJSON Risk Polygons
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.remove();
      geoJsonLayerRef.current = null;
    }

    if (mapData && mapData.features && mapData.features.length > 0) {
      geoJsonLayerRef.current = L.geoJSON(mapData as any, {
        style: (feature) => {
          const props = feature?.properties;
          const colors = getRiskColors(props?.risk_level || 'Low');
          const isSelected = selectedArea?.area_id === props?.area_id;

          return {
            color: isSelected ? '#0F172A' : colors.stroke,
            weight: isSelected ? 3.5 : props?.is_current_area ? 2.5 : 1.8,
            fillColor: colors.fill,
            fillOpacity: isSelected ? 0.65 : colors.fillOpacity,
            dashArray: props?.is_current_area && !isSelected ? '4, 4' : undefined,
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          const colors = getRiskColors(props.risk_level);

          // Click handler to select and inspect area
          layer.on({
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setSelectedArea(props);
              if (onSelectWardId) {
                onSelectWardId(props.area_id);
              }
              // Highlight the layer
              if (geoJsonLayerRef.current) {
                geoJsonLayerRef.current.resetStyle();
              }
              if ('setStyle' in layer) {
                (layer as any).setStyle({
                  weight: 3.5,
                  color: '#0F172A',
                  fillOpacity: 0.65,
                });
              }
            },
            mouseover: () => {
              if ('setStyle' in layer && selectedArea?.area_id !== props.area_id) {
                (layer as any).setStyle({
                  weight: 2.8,
                  fillOpacity: colors.fillOpacity + 0.1,
                });
              }
            },
            mouseout: () => {
              if ('setStyle' in layer && selectedArea?.area_id !== props.area_id) {
                (layer as any).setStyle({
                  weight: props.is_current_area ? 2.5 : 1.8,
                  color: colors.stroke,
                  fillOpacity: colors.fillOpacity,
                });
              }
            },
          });

          // Permanent area label tooltip and popup
          layer.bindTooltip(
            `<div class="text-[11px] font-extrabold text-slate-900 leading-tight">
              ${props.area_name.split(':')[0]}
              <div class="text-[9px] font-semibold text-slate-600">${props.risk_level} · Score: ${props.risk_score}</div>
             </div>`,
            {
              permanent: false,
              direction: 'center',
              className: 'apple-map-tooltip',
            }
          );

          layer.bindPopup(
            `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
              <div style="font-weight: 800; color: #0f172a; font-size: 13px; margin-bottom: 2px;">${props.area_name}</div>
              <div style="font-weight: 700; color: ${colors.stroke}; margin-bottom: 4px;">${colors.dot} ${props.risk_level} Risk · Score: ${props.risk_score}/100</div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; font-size: 11px; color: #334155; margin-bottom: 4px;">
                <strong>Status:</strong> ${props.current_status}
              </div>
              <div style="font-size: 10px; color: #64748b;">Updated: ${props.last_updated} · <strong>${props.data_status}</strong></div>
            </div>`
          );
        },
      }).addTo(map);
    }
  }, [mapData, selectedArea, coords, onSelectWardId]);

  // Recenter map on user location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lon], 13.5, {
        duration: 0.8,
      });
    }
  };

  // Manual location presets when GPS is denied
  const manualLocations = [
    { label: 'Shivajinagar', lat: 18.5314, lon: 73.8446 },
    { label: 'Kasba Peth', lat: 18.5178, lon: 73.8582 },
    { label: 'Kothrud', lat: 18.5074, lon: 73.8077 },
    { label: 'Hadapsar', lat: 18.5089, lon: 73.926 },
    { label: 'Aundh', lat: 18.5626, lon: 73.8087 },
  ];

  const handleSelectPreset = (presetLat: number, presetLon: number) => {
    setCoords({ lat: presetLat, lon: presetLon });
    fetchMapData(presetLat, presetLon);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([presetLat, presetLon], 13.5, { duration: 1 });
    }
  };

  return (
    <div className="space-y-4">
      {/* GPS Denied / Prompt State Banner */}
      {gpsStatus === 'denied' && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {gpsErrorMsg || 'Browser location permission was denied. Select a ward below or enable GPS.'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-amber-800">Quick Switch:</span>
            {manualLocations.map((loc) => (
              <button
                key={loc.label}
                onClick={() => handleSelectPreset(loc.lat, loc.lon)}
                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 font-semibold text-[11px] text-slate-800 hover:bg-amber-100 transition whitespace-nowrap"
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Apple-Style Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-black/10 bg-slate-100 shadow-sm">
        {/* ONLY ONE BLOCK ON THE MAP: Top Right Controls */}
        <div className="absolute top-3.5 right-3.5 z-40 pointer-events-auto flex flex-col gap-1.5">
          <button
            onClick={handleRecenter}
            className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-black/10 shadow-md text-slate-700 hover:text-blue-600 hover:bg-white transition"
            title="Recenter on My Location"
          >
            <Navigation className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-black/10 shadow-md text-slate-700 hover:bg-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-black/10 shadow-md text-slate-700 hover:bg-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => fetchMapData(coords.lat, coords.lon)}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-black/10 shadow-md text-slate-700 hover:bg-white transition disabled:opacity-50"
            title="Refresh Heat-Risk Map"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
          </button>
        </div>

        {/* Real Leaflet Map Container (500px on desktop, 420px on mobile) */}
        <div ref={mapContainerRef} className="w-full h-[420px] sm:h-[500px] z-10" />

        {/* Loading overlay when fetching data */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-white/50 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="p-3.5 rounded-2xl bg-white/95 border border-black/10 shadow-lg flex items-center gap-2.5 text-xs font-bold text-slate-800">
              <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
              <span>Analyzing local thermal satellite grid...</span>
            </div>
          </div>
        )}
      </div>

      {/* Error state alert if API request failed */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchMapData(coords.lat, coords.lon)}
            className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
