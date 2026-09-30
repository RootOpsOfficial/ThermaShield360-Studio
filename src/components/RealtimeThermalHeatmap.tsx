import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useCitizen } from '../context/CitizenContext.js';
import {
  Flame,
  Thermometer,
  Layers,
  Droplets,
  Snowflake,
  LocateFixed,
  RefreshCw,
  Search,
  MapPin,
  Wind,
  Shield,
  ExternalLink,
  Eye,
  Sliders,
  Sparkles,
  ChevronRight,
  Info,
  Check,
} from 'lucide-react';

export interface SpatialGridCell {
  id: string;
  lat: number;
  lng: number;
  temp: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  wbgt: number;
  utci: number;
  heatIndex: number;
  riskScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical';
  intensity: number;
  source: 'OBSERVED_GRID' | 'CALCULATED_SPATIAL' | 'LOCAL_STATION';
  stationName?: string;
  surfaceType?: string;
}

export interface SpatialHeatmapData {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom: number;
  levelOfDetail: 'NATIONAL' | 'STATE' | 'DISTRICT' | 'CITY' | 'HYPERLOCAL';
  metricRange: {
    minTemp: number;
    maxTemp: number;
    minWbgt: number;
    maxWbgt: number;
    minHeatIndex: number;
    maxHeatIndex: number;
  };
  cells: SpatialGridCell[];
  timestamp: string;
  sourceAttribution: string;
  totalPoints: number;
}

export interface ClickedLocationProfile {
  lat: number;
  lng: number;
  placeName: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  solarRadiation: number;
  wbgt: number;
  utci: number;
  heatIndex: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Critical';
  riskScore: number;
  why: string;
  dataSource: string;
  timestamp: string;
  nearbyCoolingCount?: number;
  nearbyWaterCount?: number;
}

interface RealtimeThermalHeatmapProps {
  heightClass?: string;
  initialMetric?: 'wbgt' | 'temp' | 'heatIndex' | 'utci';
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
}

export const RealtimeThermalHeatmap: React.FC<RealtimeThermalHeatmapProps> = ({
  heightClass = 'h-[620px]',
  initialMetric = 'wbgt',
  initialLat,
  initialLng,
  initialZoom = 5,
}) => {
  const {
    location,
    protectionPoints,
    requestGpsLocation,
    formatTemp,
  } = useCitizen();

  const [heatmapData, setHeatmapData] = useState<SpatialHeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMetric, setActiveMetric] = useState<'wbgt' | 'temp' | 'heatIndex' | 'utci'>('wbgt');
  const [opacity, setOpacity] = useState<number>(0.72);
  const [heatRadius, setHeatRadius] = useState<number>(65);
  const [basemapType, setBasemapType] = useState<'street' | 'satellite' | 'dark'>('street');
  const [showProtectiveHubs, setShowProtectiveHubs] = useState<boolean>(true);
  const [showGridLabels, setShowGridLabels] = useState<boolean>(false);
  const [showWindArrows, setShowWindArrows] = useState<boolean>(false);

  // Search & Inspection state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [clickedProfile, setClickedProfile] = useState<ClickedLocationProfile | null>(null);
  const [isInspectingLocation, setIsInspectingLocation] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const canvasLayerRef = useRef<HTMLCanvasElement | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const protectionLayerRef = useRef<L.LayerGroup | null>(null);
  const windLayerRef = useRef<L.LayerGroup | null>(null);
  const clickedPinLayerRef = useRef<L.LayerGroup | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Default coordinate center (Pan-India center Lat 22.0, Lng 78.5, or user location if requested)
  const defaultLat = initialLat !== undefined ? initialLat : (location.isGps && location.lat ? location.lat : 21.5);
  const defaultLng = initialLng !== undefined ? initialLng : (location.isGps && location.lng ? location.lng : 78.5);

  // CARTO Basemaps API key
  const cartoApiKey =
    (import.meta as any).env?.VITE_CARTO_API_KEY ||
    'cb1_401u_1_82b76b95e0b97bfabce32af7';

  const getTileUrl = (type: 'street' | 'satellite' | 'dark') => {
    if (type === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    const keyParam = cartoApiKey ? `?key=${cartoApiKey}` : '';
    if (type === 'dark') {
      return `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`;
    }
    return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${keyParam}`;
  };

  // 1. Fetch Spatial Heatmap for current viewport bounds
  const fetchViewportHeatmap = useCallback(async (map: L.Map) => {
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/weather/spatial-heatmap?north=${north.toFixed(4)}&south=${south.toFixed(4)}&east=${east.toFixed(4)}&west=${west.toFixed(4)}&zoom=${zoom}`
      );
      if (res.ok) {
        const data: SpatialHeatmapData = await res.json();
        setHeatmapData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch spatial heatmap:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Continuous Gaussian Color Ramp (Low Green -> Yellow -> Orange -> Crimson Red -> Deep Violet)
  const getColorForRatio = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    if (clamped < 0.22) {
      // 0.0 - 0.22: Emerald Green (#10B981) to Lime (#84CC16)
      const t = clamped / 0.22;
      return {
        r: Math.round(16 + t * (132 - 16)),
        g: Math.round(185 + t * (204 - 185)),
        b: Math.round(129 + t * (22 - 129)),
      };
    } else if (clamped < 0.45) {
      // 0.22 - 0.45: Lime (#84CC16) to Radiant Yellow (#EAB308)
      const t = (clamped - 0.22) / 0.23;
      return {
        r: Math.round(132 + t * (234 - 132)),
        g: Math.round(204 + t * (179 - 204)),
        b: Math.round(22 + t * (8 - 22)),
      };
    } else if (clamped < 0.72) {
      // 0.45 - 0.72: Amber/Yellow (#EAB308) to Vivid Thermal Orange (#F97316)
      const t = (clamped - 0.45) / 0.27;
      return {
        r: Math.round(234 + t * (249 - 234)),
        g: Math.round(179 + t * (115 - 179)),
        b: Math.round(8 + t * (22 - 8)),
      };
    } else if (clamped < 0.90) {
      // 0.72 - 0.90: Thermal Orange (#F97316) to Severe Crimson Red (#EF4444)
      const t = (clamped - 0.72) / 0.18;
      return {
        r: Math.round(249 + t * (239 - 249)),
        g: Math.round(115 - t * 47),
        b: Math.round(22 + t * (68 - 22)),
      };
    } else {
      // 0.90 - 1.0: Crimson Red (#EF4444) to Extreme Violet (#8B5CF6)
      const t = (clamped - 0.90) / 0.10;
      return {
        r: Math.round(239 - t * 100),
        g: Math.round(68 + t * 24),
        b: Math.round(68 + t * (246 - 68)),
      };
    }
  };

  // 3. Render Continuous Heat Surface onto Canvas
  const drawHeatmap = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasLayerRef.current;
    if (!map || !canvas || !heatmapData || heatmapData.cells.length === 0) return;

    const size = map.getSize();
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = size.x * pixelRatio;
    canvas.height = size.y * pixelRatio;
    canvas.style.width = `${size.x}px`;
    canvas.style.height = `${size.y}px`;

    const topLeft = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(canvas, topLeft);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(pixelRatio, pixelRatio);
    ctx.clearRect(0, 0, size.x, size.y);

    // Dynamic metric range calculation for optimal contrast
    let minVal = 24.0;
    let maxVal = 36.5;
    if (activeMetric === 'temp') {
      minVal = Math.min(...heatmapData.cells.map((c) => c.temp)) - 0.5;
      maxVal = Math.max(...heatmapData.cells.map((c) => c.temp)) + 0.5;
    } else if (activeMetric === 'wbgt') {
      minVal = 23.5;
      maxVal = 35.5;
    } else if (activeMetric === 'utci') {
      minVal = 26.0;
      maxVal = 44.0;
    } else {
      minVal = Math.min(...heatmapData.cells.map((c) => c.heatIndex)) - 1;
      maxVal = Math.max(...heatmapData.cells.map((c) => c.heatIndex)) + 1;
    }

    const range = Math.max(1, maxVal - minVal);

    // Offscreen alpha mask for smooth spatial interpolation
    const offscreen = document.createElement('canvas');
    offscreen.width = size.x;
    offscreen.height = size.y;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    const zoom = map.getZoom();
    // Scale Gaussian radius dynamically: large blended discs at national zoom, sharp fine discs when zoomed in
    const dynamicRadius = Math.max(45, Math.min(180, heatRadius * (zoom <= 6 ? 1.6 : zoom <= 10 ? 1.2 : 0.95)));

    heatmapData.cells.forEach((cell) => {
      const containerPoint = map.latLngToContainerPoint(L.latLng(cell.lat, cell.lng));

      let val = cell.wbgt;
      if (activeMetric === 'temp') val = cell.temp;
      else if (activeMetric === 'utci') val = cell.utci;
      else if (activeMetric === 'heatIndex') val = cell.heatIndex;

      const norm = Math.max(0, Math.min(1, (val - minVal) / range));
      const grad = offCtx.createRadialGradient(
        containerPoint.x,
        containerPoint.y,
        0,
        containerPoint.x,
        containerPoint.y,
        dynamicRadius
      );

      const alphaPeak = Math.min(1.0, 0.45 + norm * 0.52);
      grad.addColorStop(0, `rgba(0,0,0,${alphaPeak})`);
      grad.addColorStop(0.3, `rgba(0,0,0,${alphaPeak * 0.72})`);
      grad.addColorStop(0.65, `rgba(0,0,0,${alphaPeak * 0.3})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(containerPoint.x, containerPoint.y, dynamicRadius, 0, Math.PI * 2);
      offCtx.fill();
    });

    // Colorize the alpha mask with continuous 256-step thermal color lookup table
    const imgData = offCtx.getImageData(0, 0, size.x, size.y);
    const pixels = imgData.data;

    const palette = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) {
      const ratio = i / 255;
      const { r, g, b } = getColorForRatio(ratio);
      palette[i * 4] = r;
      palette[i * 4 + 1] = g;
      palette[i * 4 + 2] = b;
      palette[i * 4 + 3] = Math.round(i * opacity);
    }

    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a > 0) {
        pixels[i] = palette[a * 4];
        pixels[i + 1] = palette[a * 4 + 1];
        pixels[i + 2] = palette[a * 4 + 2];
        pixels[i + 3] = palette[a * 4 + 3];
      }
    }

    ctx.putImageData(imgData, 0, 0);
    ctx.restore();
  }, [heatmapData, activeMetric, opacity, heatRadius]);

  // 4. Click Handler for Any Location in India
  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    setIsInspectingLocation(true);

    const pinLayer = clickedPinLayerRef.current;
    if (pinLayer) {
      pinLayer.clearLayers();
      const clickIcon = L.divIcon({
        className: 'clicked-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: #EF4444; opacity: 0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #DC2626; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px;">
              📍
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      L.marker([lat, lng], { icon: clickIcon }).addTo(pinLayer);
    }

    try {
      // 1. Fetch reverse geocode name for clicked coordinates
      const geoRes = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
      let placeName = `${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        placeName = geoData.formattedAddress || geoData.displayName || placeName;
      }

      // 2. Fetch live weather & thermal calculation
      const weatherRes = await fetch(`/api/weather/current?lat=${lat}&lng=${lng}`);
      const thermalRes = await fetch(`/api/thermal/current?lat=${lat}&lng=${lng}`);

      if (weatherRes.ok && thermalRes.ok) {
        const wData = await weatherRes.json();
        const tData = await thermalRes.json();

        // 3. Nearby cooling centers
        let coolingCount = 0;
        let waterCount = 0;
        try {
          const placesRes = await fetch(`/api/places/nearby?lat=${lat}&lng=${lng}&radius=4000`);
          if (placesRes.ok) {
            const places = await placesRes.json();
            if (Array.isArray(places)) {
              coolingCount = places.filter((p: any) => p.category === 'COOLING_CENTER').length;
              waterCount = places.filter((p: any) => p.category === 'WATER_POINT').length;
            }
          }
        } catch {
          // non-critical
        }

        const wbgtVal = tData.wbgt || 28;
        const whyReason =
          tData.overallLevel === 'Extreme'
            ? 'High solar zenith angle + low wind velocity restricts natural sweat cooling; heat stroke risk elevated.'
            : tData.overallLevel === 'High'
            ? 'High ambient warmth and moderate humidity generate substantial biological thermal stress.'
            : 'Conditions within manageable seasonal tolerance. Maintain hydration.';

        setClickedProfile({
          lat,
          lng,
          placeName,
          temp: wData.temp,
          humidity: wData.humidity,
          windSpeed: wData.windSpeed,
          solarRadiation: wData.solarIrradiance || 650,
          wbgt: wbgtVal,
          utci: tData.utci || Math.round(wData.temp + 3),
          heatIndex: tData.heatIndex || wData.temp,
          riskLevel: tData.overallLevel || 'Moderate',
          riskScore: Math.min(100, Math.round(wbgtVal * 2.8)),
          why: whyReason,
          dataSource: wData.source === 'LIVE' ? 'Open-Meteo & IMD Synoptic Feed' : 'Calibrated Biometeorological Model',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
          nearbyCoolingCount: coolingCount,
          nearbyWaterCount: waterCount,
        });
      }
    } catch (err) {
      console.warn('Failed to inspect clicked location:', err);
    } finally {
      setIsInspectingLocation(false);
    }
  }, []);

  // 5. Initialize Leaflet Map with Pan-India Extent
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Pan-India view bounds
    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: initialZoom,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(getTileUrl(basemapType), {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Canvas Overlay for Gaussian Thermal Heatmap
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '350';
    map.getPanes().overlayPane.appendChild(canvas);
    canvasLayerRef.current = canvas;

    markersLayerRef.current = L.layerGroup().addTo(map);
    protectionLayerRef.current = L.layerGroup().addTo(map);
    windLayerRef.current = L.layerGroup().addTo(map);
    clickedPinLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Map Click Listener
    map.on('click', handleMapClick);

    // Initial Viewport Fetch
    fetchViewportHeatmap(map);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.off('click', handleMapClick);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 6. Viewport Move / Zoom Listeners (Debounced Spatial Queries)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const onMove = () => {
      // Redraw canvas immediately for smooth panning
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(drawHeatmap);

      // Debounce re-fetching spatial grid data when panning ends
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchViewportHeatmap(map);
      }, 500);
    };

    map.on('move', onMove);
    map.on('zoomend', onMove);
    map.on('resize', onMove);

    return () => {
      map.off('move', onMove);
      map.off('zoomend', onMove);
      map.off('resize', onMove);
      clearTimeout(debounceTimerRef.current);
    };
  }, [drawHeatmap, fetchViewportHeatmap]);

  // Redraw canvas whenever heatmapData, metric or opacity changes
  useEffect(() => {
    drawHeatmap();
  }, [drawHeatmap]);

  // Update Basemap Layer
  useEffect(() => {
    if (tileLayerRef.current && mapInstanceRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(basemapType));
    }
  }, [basemapType]);

  // 7. Render Station/Grid Inspection Labels
  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map || !heatmapData) return;

    layer.clearLayers();

    if (showGridLabels) {
      heatmapData.cells.forEach((cell) => {
        let val = cell.wbgt;
        if (activeMetric === 'temp') val = cell.temp;
        else if (activeMetric === 'utci') val = cell.utci;
        else if (activeMetric === 'heatIndex') val = cell.heatIndex;

        const isHigh = cell.riskLevel === 'Extreme' || cell.riskLevel === 'High';
        const badgeColor = isHigh ? '#DC2626' : cell.riskLevel === 'Moderate' ? '#D97706' : '#059669';

        const icon = L.divIcon({
          className: 'grid-cell-label',
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 3px;
              background: ${badgeColor};
              color: white;
              padding: 2px 6px;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 800;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              border: 1px solid white;
              cursor: pointer;
              transform: translate(-50%, -50%);
              white-space: nowrap;
            ">
              <span>${val.toFixed(1)}°</span>
              ${cell.stationName ? `<span style="opacity:0.85; font-size:9px;">${cell.stationName.split(' ')[0]}</span>` : ''}
            </div>
          `,
          iconSize: [50, 20],
          iconAnchor: [25, 10],
        });

        const marker = L.marker([cell.lat, cell.lng], { icon });
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleMapClick({ latlng: L.latLng(cell.lat, cell.lng) } as any);
        });
        marker.addTo(layer);
      });
    }
  }, [heatmapData, showGridLabels, activeMetric, handleMapClick]);

  // 8. Render Wind Vector Indicators
  useEffect(() => {
    const windLayer = windLayerRef.current;
    if (!windLayer || !heatmapData) return;

    windLayer.clearLayers();

    if (showWindArrows) {
      heatmapData.cells.forEach((cell) => {
        const windKmh = cell.windSpeed;
        const icon = L.divIcon({
          className: 'wind-arrow-icon',
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); pointer-events:none;">
              <div style="width: 22px; height: 22px; border-radius: 50%; background: rgba(30, 41, 59, 0.75); display: flex; align-items: center; justify-content: center; color: #38BDF8; font-size: 11px;">
                ➔
              </div>
              <span style="font-size: 9px; font-weight: 700; color: #1E293B; background: rgba(255,255,255,0.85); padding: 0 3px; border-radius: 4px; margin-top: 1px;">
                ${windKmh}k/h
              </span>
            </div>
          `,
          iconSize: [24, 30],
          iconAnchor: [12, 15],
        });
        L.marker([cell.lat, cell.lng], { icon }).addTo(windLayer);
      });
    }
  }, [heatmapData, showWindArrows]);

  // 9. Render Cooling Shelters & Water Points (City scale)
  useEffect(() => {
    const layer = protectionLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (showProtectiveHubs && protectionPoints.length > 0) {
      protectionPoints.forEach((p) => {
        const isCooling = p.type === 'cooling';
        const isWater = p.type === 'water';
        const bg = isCooling ? '#2563EB' : isWater ? '#06B6D4' : '#059669';

        const icon = L.divIcon({
          className: 'prot-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${bg};
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              font-size: 11px;
            ">
              ${isCooling ? '❄️' : isWater ? '💧' : '🌳'}
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const m = L.marker([p.lat, p.lng], { icon });
        m.bindTooltip(`<strong>${p.name}</strong><br/>${p.categoryLabel}`, { direction: 'top', offset: [0, -8] });
        m.addTo(layer);
      });
    }
  }, [showProtectiveHubs, protectionPoints]);

  // 10. Live Search Handler for Cities/States across India
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
        if (results.length > 0) {
          const first = results[0];
          selectSearchResult(first);
        }
      }
    } catch (err) {
      console.warn('Geocoding search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    const lat = item.lat;
    const lng = item.lng;
    setSearchResults([]);
    setSearchQuery(item.name || item.formattedAddress);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 12, { animate: true });
      handleMapClick({ latlng: L.latLng(lat, lng) } as any);
    }
  };

  return (
    <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden shadow-sm border border-slate-200/90 bg-slate-900 flex flex-col font-sans select-none`}>
      {/* Top Floating Bar: Search & Metric Selection */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search Bar & Pan-India Quick Select */}
        <div className="pointer-events-auto flex items-center gap-2">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-black/10"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search India (e.g. Mumbai, Delhi, Nagpur)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden w-44 sm:w-56 font-medium"
            />
            {isSearching ? (
              <RefreshCw className="w-3 h-3 text-orange-600 animate-spin" />
            ) : null}
          </form>

          {/* Quick Preset Buttons */}
          <div className="hidden lg:flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-black/10 text-[11px] font-bold text-slate-700">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([21.5, 78.5], 5, { animate: true });
                }
              }}
              className="px-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              🇮🇳 Pan-India
            </button>
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([location.lat, location.lng], 13, { animate: true });
                }
              }}
              className="px-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Current Location
            </button>
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([19.0760, 72.8777], 12, { animate: true });
                }
              }}
              className="px-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Mumbai
            </button>
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([28.6139, 77.2090], 12, { animate: true });
                }
              }}
              className="px-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Delhi
            </button>
          </div>
        </div>

        {/* Right Side: Metric Selector & Basemap */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Metric Selector */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-black/10 flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setActiveMetric('wbgt')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                activeMetric === 'wbgt' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              WBGT Stress
            </button>
            <button
              onClick={() => setActiveMetric('temp')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                activeMetric === 'temp' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Temperature
            </button>
            <button
              onClick={() => setActiveMetric('utci')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                activeMetric === 'utci' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              UTCI
            </button>
            <button
              onClick={() => setActiveMetric('heatIndex')}
              className={`px-2.5 py-1 rounded-xl transition-all ${
                activeMetric === 'heatIndex' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Heat Index
            </button>
          </div>

          {/* Basemap Switcher */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-black/10 flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setBasemapType('street')}
              className={`px-2 py-1 rounded-xl transition-all ${
                basemapType === 'street' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Street
            </button>
            <button
              onClick={() => setBasemapType('satellite')}
              className={`px-2 py-1 rounded-xl transition-all ${
                basemapType === 'satellite' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBasemapType('dark')}
              className={`px-2 py-1 rounded-xl transition-all ${
                basemapType === 'dark' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="w-full flex-1 min-h-[420px] bg-slate-900 z-0"></div>

      {/* Bottom Floating Legend Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-xl border border-black/10 text-xs">
        {/* Left: Continuous Color Legend Scale */}
        <div className="w-full sm:w-auto flex-1 max-w-md">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                {activeMetric === 'wbgt'
                  ? 'Wet Bulb Globe Temperature (WBGT)'
                  : activeMetric === 'temp'
                  ? 'Ambient Air Temperature (°C)'
                  : activeMetric === 'utci'
                  ? 'Universal Thermal Climate Index (UTCI)'
                  : 'NOAA Heat Index'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Continuous Gradient</span>
          </div>

          {/* Continuous Gradient Bar */}
          <div className="relative w-full h-3 rounded-full overflow-hidden shadow-inner border border-black/10">
            <div
              className="w-full h-full"
              style={{
                background:
                  'linear-gradient(to right, #10B981 0%, #84CC16 22%, #EAB308 45%, #F97316 72%, #EF4444 90%, #8B5CF6 100%)',
              }}
            ></div>
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between items-center text-[10px] font-black text-slate-600 mt-1">
            <span className="text-emerald-700">Low Risk</span>
            <span className="text-amber-600">Moderate</span>
            <span className="text-orange-600">High Stress</span>
            <span className="text-rose-600">Extreme Heat</span>
            <span className="text-purple-700">Critical</span>
          </div>
        </div>

        {/* Center: Live Scale Telemetry */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
          <div className="text-left text-[11px]">
            <span className="text-slate-400 block font-medium">Resolution Level:</span>
            <span className="font-extrabold text-slate-900">
              {heatmapData?.levelOfDetail || 'PAN-INDIA'} GRID
            </span>
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          {/* Layer Toggles & Slider Controls */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
              <span>Opacity:</span>
              <input
                type="range"
                min="0.3"
                max="0.95"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-16 accent-orange-600 h-1.5 rounded-lg cursor-pointer"
              />
            </label>

            <button
              onClick={() => setShowGridLabels(!showGridLabels)}
              className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all ${
                showGridLabels ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-slate-100 text-slate-500'
              }`}
              title="Toggle Weather Grid Measurement Values"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Values</span>
            </button>

            <button
              onClick={() => setShowWindArrows(!showWindArrows)}
              className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all ${
                showWindArrows ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-slate-100 text-slate-500'
              }`}
              title="Show Wind Speed Vectors"
            >
              <Wind className="w-3.5 h-3.5 text-cyan-600" />
              <span className="hidden md:inline">Wind</span>
            </button>

            <button
              onClick={() => setShowProtectiveHubs(!showProtectiveHubs)}
              className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all ${
                showProtectiveHubs ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-500'
              }`}
              title="Show Cooling Centers and Water Points"
            >
              <Snowflake className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Cooling</span>
            </button>

            <button
              onClick={() => {
                requestGpsLocation();
                if (mapInstanceRef.current && location.lat && location.lng) {
                  mapInstanceRef.current.setView([location.lat, location.lng], 13, { animate: true });
                }
              }}
              className="p-1.5 rounded-xl bg-slate-900 text-white hover:bg-black transition-all shadow-xs"
              title="Center on My Real Location"
            >
              <LocateFixed className="w-4 h-4 text-orange-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Location Click Inspection Modal / Profile Slide-Over */}
      {clickedProfile && (
        <div className="absolute top-16 right-3 z-[410] w-84 max-w-[calc(100vw-24px)] bg-white/95 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border border-black/10 animate-in fade-in slide-in-from-right-4 duration-150 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                clickedProfile.riskLevel === 'Extreme' || clickedProfile.riskLevel === 'Critical'
                  ? 'bg-rose-100 text-rose-800'
                  : clickedProfile.riskLevel === 'High'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {clickedProfile.riskLevel} Thermal Risk
            </span>
            <button
              onClick={() => setClickedProfile(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          <div className="my-2.5">
            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2">{clickedProfile.placeName}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Coordinates: {clickedProfile.lat.toFixed(4)}°N, {clickedProfile.lng.toFixed(4)}°E
            </p>
          </div>

          {/* Thermal Metrics Grid */}
          <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-100 my-2 text-center">
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Temp</span>
              <span className="text-xs font-black text-slate-900">{clickedProfile.temp}°C</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">WBGT</span>
              <span className="text-xs font-black text-orange-600">{clickedProfile.wbgt}°C</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">UTCI</span>
              <span className="text-xs font-black text-purple-600">{clickedProfile.utci}°C</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 block font-medium">Humidity</span>
              <span className="text-xs font-black text-slate-700">{clickedProfile.humidity}%</span>
            </div>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/70 my-2">
            <span className="font-bold text-[10px] text-amber-900 block mb-0.5">Biometeorological Assessment:</span>
            <p className="text-[11px] text-amber-800 leading-snug">{clickedProfile.why}</p>
          </div>

          {/* Protection in vicinity */}
          <div className="flex items-center justify-between text-[11px] py-1 text-slate-600 border-t border-slate-100">
            <span>Nearby Protection:</span>
            <span className="font-bold text-slate-900">
              {clickedProfile.nearbyCoolingCount || 0} Cooling Hubs • {clickedProfile.nearbyWaterCount || 0} Water Kiosks
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Source: {clickedProfile.dataSource}</span>
            <span>{clickedProfile.timestamp}</span>
          </div>
        </div>
      )}
    </div>
  );
};
