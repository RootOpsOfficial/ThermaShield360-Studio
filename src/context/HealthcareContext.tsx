import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  HealthcareNavPage,
  HealthcareSummary,
  HealthcareRiskArea,
  HealthcareFacilityReadiness,
  HealthcareSettings,
  FacilityProfileData,
  HealthcareLocationDemandDrivers,
} from '../types/healthcare.js';

export interface ActiveLocationState {
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  isUserLocation: boolean;
}

interface HealthcareContextType {
  activeHealthcarePage: HealthcareNavPage;
  setActiveHealthcarePage: (page: HealthcareNavPage) => void;
  summary: HealthcareSummary | null;
  facilityProfile: FacilityProfileData | null;
  selectedRiskArea: HealthcareRiskArea | null;
  setSelectedRiskArea: (area: HealthcareRiskArea | null) => void;
  currentLocation: ActiveLocationState;
  setLocation: (loc: { name: string; shortName?: string; lat: number; lng: number; isUserLocation?: boolean }) => Promise<void>;
  detectUserGpsLocation: () => Promise<void>;
  isLocatingGps: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  apiError: string | null;
  userRole: 'authorized' | 'readonly';
  setUserRole: (role: 'authorized' | 'readonly') => void;
  refreshHealthcareData: () => Promise<void>;
  updateFacilityProfile: (updates: Partial<FacilityProfileData>, updatedBy?: string) => Promise<void>;
  toggleDemoMode: (enable: boolean) => Promise<void>;
  toggleChecklistItem: (id: string, isReady: boolean) => Promise<void>;
  settings: HealthcareSettings | null;
  updateSettings: (updates: Partial<HealthcareSettings>) => Promise<void>;
}

const HealthcareContext = createContext<HealthcareContextType | undefined>(undefined);

export const HealthcareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeHealthcarePage, setActiveHealthcarePageState] = useState<HealthcareNavPage>('command-center');
  const [summary, setSummary] = useState<HealthcareSummary | null>(null);
  const [facilityProfile, setFacilityProfile] = useState<FacilityProfileData | null>(null);
  const [selectedRiskArea, setSelectedRiskArea] = useState<HealthcareRiskArea | null>(null);
  const [settings, setSettings] = useState<HealthcareSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'authorized' | 'readonly'>('authorized');
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const [currentLocation, setCurrentLocation] = useState<ActiveLocationState>({
    name: 'Gangapur Road, Canada Corner, Nashik',
    shortName: 'Gangapur Road, Nashik',
    lat: 20.0082,
    lng: 73.7691,
    isUserLocation: false,
  });

  const setActiveHealthcarePage = useCallback((page: HealthcareNavPage) => {
    setActiveHealthcarePageState(page);
  }, []);

  const fetchHealthcareData = useCallback(async (
    isSilent = false,
    targetLat?: number,
    targetLng?: number,
    locationQuery?: string,
    isUserLocation = false
  ) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setApiError(null);

    try {
      const lat = targetLat !== undefined ? targetLat : currentLocation.lat;
      const lng = targetLng !== undefined ? targetLng : currentLocation.lng;
      const q = locationQuery !== undefined ? locationQuery : currentLocation.name;

      const summaryUrl = `/api/healthcare/workspace/summary?lat=${lat}&lng=${lng}&q=${encodeURIComponent(q)}&isUserLocation=${isUserLocation ? 'true' : 'false'}`;

      const [sumRes, profRes, settRes] = await Promise.all([
        fetch(summaryUrl),
        fetch('/api/healthcare/workspace/profile'),
        fetch('/api/healthcare/workspace/settings'),
      ]);

      if (sumRes.ok) {
        const sumData: HealthcareSummary = await sumRes.json();
        setSummary(sumData);
        setSelectedRiskArea(sumData.highRiskAreas && sumData.highRiskAreas.length > 0 ? sumData.highRiskAreas[0] : null);
        if (sumData.activeLocation) {
          setCurrentLocation({
            name: sumData.activeLocation.name,
            shortName: sumData.activeLocation.shortName,
            lat: sumData.activeLocation.lat,
            lng: sumData.activeLocation.lng,
            isUserLocation: Boolean(sumData.activeLocation.isUserLocation),
          });
        }
      } else {
        throw new Error(`Server returned HTTP ${sumRes.status}`);
      }

      if (profRes.ok) {
        const profData = await profRes.json();
        setFacilityProfile(profData);
      }

      if (settRes.ok) {
        const settData = await settRes.json();
        setSettings(settData);
      }
    } catch (err: any) {
      console.error('Failed to load healthcare workspace data:', err);
      setApiError('Data source connectivity degraded. Operating with IMD-calibrated local medical telemetry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentLocation.lat, currentLocation.lng, currentLocation.name]);

  useEffect(() => {
    fetchHealthcareData(false, 20.0082, 73.7691, 'Gangapur Road, Canada Corner, Nashik', false);
  }, []);

  const setLocation = useCallback(async (loc: {
    name: string;
    shortName?: string;
    lat: number;
    lng: number;
    isUserLocation?: boolean;
  }) => {
    const isUser = Boolean(loc.isUserLocation);
    const short = loc.shortName || loc.name.split(',')[0].trim();
    setCurrentLocation({
      name: loc.name,
      shortName: short,
      lat: loc.lat,
      lng: loc.lng,
      isUserLocation: isUser,
    });
    await fetchHealthcareData(true, loc.lat, loc.lng, loc.name, isUser);
  }, [fetchHealthcareData]);

  const detectUserGpsLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setApiError('GPS location is not supported by your browser.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          // Check heat & location info via server
          const res = await fetch(`/api/healthcare/location-heat-check?lat=${lat}&lng=${lng}&isUserLocation=true`);
          if (res.ok) {
            const data = await res.json();
            await setLocation({
              name: data.location.name,
              shortName: data.location.shortName,
              lat,
              lng,
              isUserLocation: true,
            });
          } else {
            await setLocation({
              name: `My GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
              shortName: 'My GPS Location',
              lat,
              lng,
              isUserLocation: true,
            });
          }
        } catch (e) {
          await setLocation({
            name: `My GPS Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
            shortName: 'My GPS Location',
            lat,
            lng,
            isUserLocation: true,
          });
        } finally {
          setIsLocatingGps(false);
        }
      },
      (err) => {
        setIsLocatingGps(false);
        setApiError('Unable to retrieve your GPS location. Please check browser permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [setLocation]);

  const updateFacilityProfile = async (updates: Partial<FacilityProfileData>, updatedBy = 'Dr. A. Deshmukh (Medical Superintendent)') => {
    try {
      const res = await fetch('/api/healthcare/workspace/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, updatedBy }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFacilityProfile(updated);
        // Refresh summary to recalculate demand vs capacity
        await fetchHealthcareData(true);
      }
    } catch (err) {
      console.error('Failed to update facility profile:', err);
    }
  };

  const toggleDemoMode = async (enable: boolean) => {
    try {
      const res = await fetch('/api/healthcare/workspace/demo-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableDemo: enable }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFacilityProfile(updated);
        await fetchHealthcareData(true);
      }
    } catch (err) {
      console.error('Failed to toggle demo mode:', err);
    }
  };

  const toggleChecklistItem = async (id: string, isReady: boolean) => {
    try {
      const res = await fetch('/api/healthcare/workspace/readiness/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isReady }),
      });
      if (res.ok) {
        await fetchHealthcareData(true);
      }
    } catch (err) {
      console.error('Failed to update checklist item:', err);
    }
  };

  const updateSettings = async (updates: Partial<HealthcareSettings>) => {
    try {
      setSettings((prev) => (prev ? { ...prev, ...updates } : null));
      const res = await fetch('/api/healthcare/workspace/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  return (
    <HealthcareContext.Provider
      value={{
        activeHealthcarePage,
        setActiveHealthcarePage,
        summary,
        facilityProfile,
        selectedRiskArea,
        setSelectedRiskArea,
        currentLocation,
        setLocation,
        detectUserGpsLocation,
        isLocatingGps,
        isLoading,
        isRefreshing,
        apiError,
        userRole,
        setUserRole,
        refreshHealthcareData: () => fetchHealthcareData(true),
        updateFacilityProfile,
        toggleDemoMode,
        toggleChecklistItem,
        settings,
        updateSettings,
      }}
    >
      {children}
    </HealthcareContext.Provider>
  );
};

export const useHealthcare = () => {
  const context = useContext(HealthcareContext);
  if (!context) {
    throw new Error('useHealthcare must be used within a HealthcareProvider');
  }
  return context;
};
