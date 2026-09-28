import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  DisasterNavPage,
  DisasterRegionalSummary,
  DisasterAffectedArea,
  DisasterAlert,
  DisasterResponseTask,
  DataStatusLabel,
  ResponseStatusType,
  RegionalJurisdiction,
  AlertWorkflowAction,
  RegionalResponseStage,
  MultiAgencyCoordinationStatus,
} from '../types/disaster.js';
import {
  REGIONAL_JURISDICTIONS,
  INITIAL_DISASTER_SUMMARY,
  INITIAL_AFFECTED_AREAS,
  INITIAL_DISASTER_ALERTS,
  INITIAL_RESPONSE_TASKS,
  INITIAL_COORDINATION_STATUS,
} from '../data/disasterData.js';
import { ALL_LOCATIONS, LocationItem } from '../data/allLocations.js';
import {
  createJurisdictionForLocation,
  findClosestIndiaLocation,
  ALL_INDIA_REGIONAL_JURISDICTIONS,
} from '../data/allIndiaDisasterService.js';

interface DisasterContextType {
  activeDisasterPage: DisasterNavPage;
  setActiveDisasterPage: (page: DisasterNavPage) => void;
  // All India Locations
  allIndiaLocations: LocationItem[];
  selectedIndiaLocation: LocationItem | null;
  selectIndiaLocation: (locationItem: LocationItem) => void;
  // Regional Jurisdiction
  availableRegions: RegionalJurisdiction[];
  selectedRegion: RegionalJurisdiction;
  selectRegion: (regionId: string) => void;
  // Region-bound Data
  summary: DisasterRegionalSummary;
  affectedAreas: DisasterAffectedArea[];
  selectedArea: DisasterAffectedArea | null;
  setSelectedArea: (area: DisasterAffectedArea | null) => void;
  selectArea: (area: DisasterAffectedArea | null) => void;
  selectLocationById: (regionId: string, areaId?: string) => void;
  activeLocationLabel: string;
  activeLocationRisk: string;
  activeLocationTemp: number;
  alerts: DisasterAlert[];
  responseTasks: DisasterResponseTask[];
  coordinationStatus: MultiAgencyCoordinationStatus;
  currentResponseStage: RegionalResponseStage;
  setCurrentResponseStage: (stage: RegionalResponseStage) => void;
  // Location & Geolocation
  userLocation: { lat: number; lng: number } | null;
  isLocating: boolean;
  locationError: string | null;
  requestUserLocation: () => Promise<void>;
  dismissLocationError: () => void;
  // Search & Filtering
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedDistrictFilter: string;
  setSelectedDistrictFilter: (district: string) => void;
  // Telemetry & State
  dataStatus: DataStatusLabel;
  setDataStatus: (status: DataStatusLabel) => void;
  isLoading: boolean;
  error: string | null;
  refreshDisasterData: () => Promise<void>;
  // Actions
  handleAlertAction: (alertId: string, action: AlertWorkflowAction) => void;
  acknowledgeAlert: (alertId: string) => void;
  updateTaskStatus: (taskId: string, status: ResponseStatusType) => void;
  mapCenterTarget: { lat: number; lng: number; zoom: number } | null;
  recenterMap: () => void;
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined);

export const DisasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeDisasterPage, setActiveDisasterPage] = useState<DisasterNavPage>('command');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('pune-division');
  const [selectedRegion, setSelectedRegion] = useState<RegionalJurisdiction>(REGIONAL_JURISDICTIONS[0]);
  const [selectedIndiaLocation, setSelectedIndiaLocation] = useState<LocationItem | null>(null);

  // Active region data state
  const [summary, setSummary] = useState<DisasterRegionalSummary>(selectedRegion.summary);
  const [affectedAreas, setAffectedAreas] = useState<DisasterAffectedArea[]>(selectedRegion.areas);
  const [selectedArea, setSelectedArea] = useState<DisasterAffectedArea | null>(selectedRegion.areas[0] || null);
  const [alerts, setAlerts] = useState<DisasterAlert[]>(selectedRegion.alerts);
  const [responseTasks, setResponseTasks] = useState<DisasterResponseTask[]>(selectedRegion.responseTasks);
  const [coordinationStatus, setCoordinationStatus] = useState<MultiAgencyCoordinationStatus>(selectedRegion.coordinationStatus);
  const [currentResponseStage, setCurrentResponseStage] = useState<RegionalResponseStage>(selectedRegion.currentResponseStage);

  // Map and Geolocation state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapCenterTarget, setMapCenterTarget] = useState<{ lat: number; lng: number; zoom: number } | null>({
    lat: selectedRegion.center.lat,
    lng: selectedRegion.center.lng,
    zoom: selectedRegion.zoom,
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('all');

  // Telemetry
  const [dataStatus, setDataStatus] = useState<DataStatusLabel>('MODELLED');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Switch to ANY location in India
  const selectIndiaLocation = useCallback((loc: LocationItem) => {
    setSelectedIndiaLocation(loc);

    // Check if matches an existing jurisdiction across India
    const existingRegion = ALL_INDIA_REGIONAL_JURISDICTIONS.find(
      (r) =>
        r.id.toLowerCase() === `reg-${loc.id.toLowerCase()}` ||
        r.id.toLowerCase() === loc.city.toLowerCase() ||
        r.name.toLowerCase().includes(loc.city.toLowerCase()) ||
        r.division.toLowerCase().includes(loc.city.toLowerCase())
    );

    if (existingRegion) {
      setSelectedRegionId(existingRegion.id);
      setSelectedRegion(existingRegion);
      setSummary(existingRegion.summary);
      setAffectedAreas(existingRegion.areas);
      setAlerts(existingRegion.alerts);
      setResponseTasks(existingRegion.responseTasks);
      setCoordinationStatus(existingRegion.coordinationStatus);
      setCurrentResponseStage(existingRegion.currentResponseStage);

      // Look for matching area inside region or default to primary
      const matchingArea =
        existingRegion.areas.find(
          (a) =>
            a.name.toLowerCase().includes(loc.shortName.toLowerCase()) ||
            a.name.toLowerCase().includes(loc.name.toLowerCase()) ||
            a.name.toLowerCase().includes(loc.city.toLowerCase())
        ) || existingRegion.areas[0];

      setSelectedArea(matchingArea);
      setMapCenterTarget({
        lat: loc.lat,
        lng: loc.lng,
        zoom: 13,
      });
      return;
    }

    // Generate comprehensive jurisdiction & disaster intelligence for any Indian location
    const customJurisdiction = createJurisdictionForLocation(loc);
    setSelectedRegionId(customJurisdiction.id);
    setSelectedRegion(customJurisdiction);
    setSummary(customJurisdiction.summary);
    setAffectedAreas(customJurisdiction.areas);
    setSelectedArea(customJurisdiction.areas[0]);
    setAlerts(customJurisdiction.alerts);
    setResponseTasks(customJurisdiction.responseTasks);
    setCoordinationStatus(customJurisdiction.coordinationStatus);
    setCurrentResponseStage(customJurisdiction.currentResponseStage);
    setMapCenterTarget({
      lat: loc.lat,
      lng: loc.lng,
      zoom: 13,
    });
  }, []);

  // Switch region helper
  const selectRegion = useCallback((regionId: string) => {
    const reg = ALL_INDIA_REGIONAL_JURISDICTIONS.find((r) => r.id === regionId);
    if (reg) {
      setSelectedIndiaLocation(null);
      setSelectedRegionId(reg.id);
      setSelectedRegion(reg);
      setSummary(reg.summary);
      setAffectedAreas(reg.areas);
      setSelectedArea(reg.areas[0] || null);
      setAlerts(reg.alerts);
      setResponseTasks(reg.responseTasks);
      setCoordinationStatus(reg.coordinationStatus);
      setCurrentResponseStage(reg.currentResponseStage);
      setMapCenterTarget({
        lat: reg.center.lat,
        lng: reg.center.lng,
        zoom: reg.zoom,
      });
      setSelectedDistrictFilter('all');
    }
  }, []);

  // Select specific area as active focus location and center map
  const selectArea = useCallback(
    (area: DisasterAffectedArea | null) => {
      setSelectedArea(area);
      if (area) {
        setMapCenterTarget({
          lat: area.geoCenter.lat,
          lng: area.geoCenter.lng,
          zoom: 14,
        });
      } else {
        setMapCenterTarget({
          lat: selectedRegion.center.lat,
          lng: selectedRegion.center.lng,
          zoom: selectedRegion.zoom,
        });
      }
    },
    [selectedRegion]
  );

  // Switch region and optionally select specific area
  const selectLocationById = useCallback((regionId: string, areaId?: string) => {
    const reg = ALL_INDIA_REGIONAL_JURISDICTIONS.find((r) => r.id === regionId);
    if (!reg) return;
    setSelectedRegionId(reg.id);
    setSelectedRegion(reg);
    setSummary(reg.summary);
    setAffectedAreas(reg.areas);
    setAlerts(reg.alerts);
    setResponseTasks(reg.responseTasks);
    setCoordinationStatus(reg.coordinationStatus);
    setCurrentResponseStage(reg.currentResponseStage);
    setSelectedDistrictFilter('all');

    if (areaId) {
      const area = reg.areas.find((a) => a.id === areaId);
      if (area) {
        setSelectedArea(area);
        setMapCenterTarget({
          lat: area.geoCenter.lat,
          lng: area.geoCenter.lng,
          zoom: 14,
        });
        return;
      }
    }

    const defaultArea = reg.areas[0] || null;
    setSelectedArea(defaultArea);
    setMapCenterTarget({
      lat: reg.center.lat,
      lng: reg.center.lng,
      zoom: reg.zoom,
    });
  }, []);

  const recenterMap = useCallback(() => {
    if (selectedArea) {
      setMapCenterTarget({
        lat: selectedArea.geoCenter.lat,
        lng: selectedArea.geoCenter.lng,
        zoom: 14,
      });
    } else {
      setMapCenterTarget({
        lat: selectedRegion.center.lat,
        lng: selectedRegion.center.lng,
        zoom: selectedRegion.zoom,
      });
    }
  }, [selectedArea, selectedRegion]);

  // Request browser location (convenience for map positioning, not authorization)
  const requestUserLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('LOCATION ACCESS NOT AVAILABLE: Geolocation is not supported by your browser environment.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);

        // Find closest location across all of India to orient operational command
        const closestIndiaLoc = findClosestIndiaLocation(coords.lat, coords.lng);
        if (closestIndiaLoc) {
          selectIndiaLocation(closestIndiaLoc);
        }

        // Center the map on user location
        setMapCenterTarget({
          lat: coords.lat,
          lng: coords.lng,
          zoom: 13,
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          'LOCATION ACCESS NOT AVAILABLE: Device location permission was denied. Manual region selection remains active.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [selectIndiaLocation]);

  const dismissLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  const refreshDisasterData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/disaster/summary?lat=${selectedRegion.center.lat}&lng=${selectedRegion.center.lng}`);
      const nowStr =
        new Date().toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
        ' • ' +
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      if (res.ok) {
        const liveDisaster = await res.json();
        setDataStatus('LIVE');
        setSummary((prev) => ({
          ...prev,
          currentDateTime: nowStr,
          dataStatus: 'LIVE',
          regionalHeatStatus: {
            ...prev.regionalHeatStatus,
            severity: liveDisaster.activeThreatLevel || prev.regionalHeatStatus.severity,
            currentPeakTempC: liveDisaster.fusedTemperatureC || prev.regionalHeatStatus.currentPeakTempC,
          },
          lastUpdated: `Live Fused Consensus (${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})`,
        }));
      } else {
        setSummary((prev) => ({
          ...prev,
          currentDateTime: nowStr,
          lastUpdated: `Just now via ${selectedRegion.weatherSource}`,
        }));
      }
    } catch {
      setDataStatus('MODELLED');
      setSummary((prev) => ({
        ...prev,
        lastUpdated: `Cached regional telemetry`,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [selectedRegion.center.lat, selectedRegion.center.lng, selectedRegion.weatherSource]);

  useEffect(() => {
    refreshDisasterData();
  }, [refreshDisasterData]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  }, []);

  const handleAlertAction = useCallback((alertId: string, action: AlertWorkflowAction) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;
        if (action === 'ACKNOWLEDGE') return { ...a, acknowledged: true };
        if (action === 'ESCALATE') return { ...a, riskState: 'Critical' };
        if (action === 'CLOSE') return { ...a, riskState: 'Normal', acknowledged: true };
        return a;
      })
    );
  }, []);

  const updateTaskStatus = useCallback((taskId: string, status: ResponseStatusType) => {
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setResponseTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status, lastUpdate: `Updated at ${nowTime}` }
          : t
      )
    );
  }, []);

  const activeLocationLabel = selectedIndiaLocation
    ? `${selectedIndiaLocation.shortName} (${selectedIndiaLocation.state})`
    : selectedArea
    ? `${selectedArea.name.split('-')[0].trim()} • ${selectedRegion.name.split(' ')[0]}`
    : selectedRegion.name;

  const activeLocationRisk = selectedArea
    ? selectedArea.heatRisk
    : summary.regionalHeatStatus.severity;

  const activeLocationTemp = selectedArea
    ? selectedArea.temperatureC
    : summary.regionalHeatStatus.currentPeakTempC;

  return (
    <DisasterContext.Provider
      value={{
        activeDisasterPage,
        setActiveDisasterPage,
        allIndiaLocations: ALL_LOCATIONS,
        selectedIndiaLocation,
        selectIndiaLocation,
        availableRegions: ALL_INDIA_REGIONAL_JURISDICTIONS,
        selectedRegion,
        selectRegion,
        selectArea,
        selectLocationById,
        activeLocationLabel,
        activeLocationRisk,
        activeLocationTemp,
        summary,
        affectedAreas,
        selectedArea,
        setSelectedArea,
        alerts,
        responseTasks,
        coordinationStatus,
        currentResponseStage,
        setCurrentResponseStage,
        userLocation,
        isLocating,
        locationError,
        requestUserLocation,
        dismissLocationError,
        searchQuery,
        setSearchQuery,
        selectedDistrictFilter,
        setSelectedDistrictFilter,
        dataStatus,
        setDataStatus,
        isLoading,
        error,
        refreshDisasterData,
        handleAlertAction,
        acknowledgeAlert,
        updateTaskStatus,
        mapCenterTarget,
        recenterMap,
      }}
    >
      {children}
    </DisasterContext.Provider>
  );
};

export const useDisaster = () => {
  const context = useContext(DisasterContext);
  if (!context) {
    throw new Error('useDisaster must be used within a DisasterProvider');
  }
  return context;
};
