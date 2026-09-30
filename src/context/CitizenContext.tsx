import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CitizenPage,
  WardInfo,
  WeatherCurrent,
  WeatherHourly,
  WeatherDailyForecast,
  ThermalCurrent,
  RiskCurrent,
  HeatwaveStatus,
  ProtectionPoint,
  ProtectionSummary,
  HealthcareFacility,
  CitizenAlert,
  AlertHistoryItem,
  AdaptiveRecommendation,
  LongRangeEarlyWarningReport,
  CitizenMyRiskData,
  CitizenHeatRiskResponse,
  ActivityType,
  PersonalHeatImpact,
  PersonalHeatImpactInput,
} from '../types.js';

interface CitizenProfile {
  name: string;
  ageGroup: 'Child (< 12)' | 'Adult (18-64)' | 'Senior (65+)';
  isOutdoorWorker: boolean;
  hasHealthCondition: boolean;
  profileLabel: string;
}

interface LocationState {
  lat: number;
  lng: number;
  isGps: boolean;
  gpsStatus: 'idle' | 'requesting' | 'granted' | 'denied' | 'error';
  gpsErrorMsg?: string;
  ward: WardInfo;
  allWards: WardInfo[];
}

interface CitizenContextType {
  activePage: CitizenPage;
  setActivePage: (page: CitizenPage) => void;
  location: LocationState;
  setLocationCoords: (lat: number, lng: number) => void;
  requestGpsLocation: () => void;
  selectWard: (wardId: string) => void;
  setCustomLocation: (name: string, lat: number, lng: number) => void;
  profile: CitizenProfile;
  updateProfile: (updates: Partial<CitizenProfile>) => void;
  unit: 'C' | 'F';
  setUnit: (u: 'C' | 'F') => void;
  formatTemp: (celsius: number) => string;

  // Shared intelligence data
  weatherCurrent: WeatherCurrent | null;
  weatherHourly: WeatherHourly[];
  weatherForecast: WeatherDailyForecast[];
  thermalCurrent: ThermalCurrent | null;
  riskCurrent: RiskCurrent | null;
  myRiskData: CitizenMyRiskData | null;
  heatRiskData: CitizenHeatRiskResponse | null;
  heatwaveStatus: HeatwaveStatus | null;
  protectionPoints: ProtectionPoint[];
  protectionSummary: ProtectionSummary | null;
  healthcareFacilities: HealthcareFacility[];
  alerts: CitizenAlert[];
  alertHistory: AlertHistoryItem[];
  adaptiveRecommendations: AdaptiveRecommendation[];
  longRangeReport: LongRangeEarlyWarningReport | null;
  unreadAlertCount: number;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;

  isLoading: boolean;
  isRefreshing: boolean;
  apiError: string | null;
  lastUpdatedTime: string;
  refreshData: () => Promise<void>;

  // Human Heat Impact & Personal Activity Engine
  activityType: ActivityType;
  setActivityType: (type: ActivityType) => void;
  exposureDuration: string;
  setExposureDuration: (duration: string) => void;
  isOutdoorExposure: boolean;
  setIsOutdoorExposure: (isOutdoor: boolean) => void;
  destination: { name: string; lat: number; lng: number } | null;
  setDestination: (dest: { name: string; lat: number; lng: number } | null) => void;
  plannedTravelTime: string;
  setPlannedTravelTime: (time: string) => void;
  personalImpact: PersonalHeatImpact | null;
  evaluateImpact: (overrideParams?: Partial<PersonalHeatImpactInput>) => Promise<PersonalHeatImpact | null>;
  isEvaluatingImpact: boolean;

  // Drawer / modal states
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;

  // Cross-page in-app healthcare navigation
  targetFacilityForDirections: HealthcareFacility | null;
  setTargetFacilityForDirections: (facility: HealthcareFacility | null) => void;
  navigateToHealthcareWithDirections: (facility: HealthcareFacility) => void;
}

const defaultWard: WardInfo = {
  id: 'loc-default',
  name: 'Detecting Location…',
  zone: 'Please select a location',
  center: [0, 0],
  bounds: [
    [0.015, -0.015],
    [0.015, 0.015],
    [-0.015, 0.015],
    [-0.015, -0.015],
    [0.015, -0.015],
  ],
  population: 0,
  vulnerableCount: 0,
  treeCanopyPct: 0,
  builtDensityPct: 0,
  vulnerabilityIndex: 0,
  uhiOffsetDegC: 0,
  highRiskAreas: [],
  lowRiskAreas: [],
};

const CitizenContext = createContext<CitizenContextType | null>(null);

export const CitizenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<CitizenPage>('home');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [targetFacilityForDirections, setTargetFacilityForDirections] = useState<HealthcareFacility | null>(null);

  const navigateToHealthcareWithDirections = useCallback((facility: HealthcareFacility) => {
    setTargetFacilityForDirections(facility);
    setActivePage('healthcare');
  }, []);

  const [profile, setProfile] = useState<CitizenProfile>({
    name: 'Citizen User',
    ageGroup: 'Adult (18-64)',
    isOutdoorWorker: false,
    hasHealthCondition: false,
    profileLabel: 'General Citizen',
  });

  const [location, setLocation] = useState<LocationState>({
    lat: 0,
    lng: 0,
    isGps: false,
    gpsStatus: 'idle',
    ward: defaultWard,
    allWards: [defaultWard],
  });

  const [weatherCurrent, setWeatherCurrent] = useState<WeatherCurrent | null>(null);
  const [weatherHourly, setWeatherHourly] = useState<WeatherHourly[]>([]);
  const [weatherForecast, setWeatherForecast] = useState<WeatherDailyForecast[]>([]);
  const [thermalCurrent, setThermalCurrent] = useState<ThermalCurrent | null>(null);
  const [riskCurrent, setRiskCurrent] = useState<RiskCurrent | null>(null);
  const [myRiskData, setMyRiskData] = useState<CitizenMyRiskData | null>(null);
  const [heatRiskData, setHeatRiskData] = useState<CitizenHeatRiskResponse | null>(null);
  const [heatwaveStatus, setHeatwaveStatus] = useState<HeatwaveStatus | null>(null);
  const [protectionPoints, setProtectionPoints] = useState<ProtectionPoint[]>([]);
  const [protectionSummary, setProtectionSummary] = useState<ProtectionSummary | null>(null);
  const [healthcareFacilities, setHealthcareFacilities] = useState<HealthcareFacility[]>([]);
  const [alerts, setAlerts] = useState<CitizenAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [longRangeReport, setLongRangeReport] = useState<LongRangeEarlyWarningReport | null>(null);

  // Human Heat Impact & Personal Activity Engine State
  const [activityType, setActivityType] = useState<ActivityType>('Walking / Commuting');
  const [exposureDuration, setExposureDuration] = useState<string>('1-2 hours');
  const [isOutdoorExposure, setIsOutdoorExposure] = useState<boolean>(true);
  const [destination, setDestination] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [plannedTravelTime, setPlannedTravelTime] = useState<string>('10:30 AM');
  const [personalImpact, setPersonalImpact] = useState<PersonalHeatImpact | null>(null);
  const [isEvaluatingImpact, setIsEvaluatingImpact] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');

  const formatTemp = useCallback(
    (celsius: number): string => {
      if (unit === 'F') {
        const f = Math.round(((celsius * 9) / 5 + 32) * 10) / 10;
        return `${f}°F`;
      }
      return `${Math.round(celsius * 10) / 10}°C`;
    },
    [unit]
  );

  const updateProfile = (updates: Partial<CitizenProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      let label = 'General Citizen';
      if (next.ageGroup === 'Senior (65+)') label = 'Senior (65+)';
      else if (next.isOutdoorWorker) label = 'Outdoor Worker';
      else if (next.hasHealthCondition) label = 'Vulnerable Health';
      else if (next.ageGroup === 'Child (< 12)') label = 'Child / Student';
      return { ...next, profileLabel: label };
    });
  };

  // Fetch all shared backend data for the current coordinates & profile
  const fetchAllData = useCallback(async (lat: number, lng: number, isSilent = false, locationName?: string) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setApiError(null);

    try {
      const nameParam = locationName ? `&name=${encodeURIComponent(locationName)}&location=${encodeURIComponent(locationName)}` : '';
      const destParam = destination ? `&destinationLat=${destination.lat}&destinationLng=${destination.lng}&destinationName=${encodeURIComponent(destination.name)}` : '';
      const query = `?lat=${lat}&lng=${lng}&ageGroup=${encodeURIComponent(profile.ageGroup)}&isOutdoorWorker=${profile.isOutdoorWorker}&hasHealthCondition=${profile.hasHealthCondition}&activityType=${encodeURIComponent(activityType)}&outdoorExposure=${isOutdoorExposure}&exposureDuration=${encodeURIComponent(exposureDuration)}${nameParam}${destParam}`;

      const [
        locRes,
        wcRes,
        whRes,
        wfRes,
        tcRes,
        rcRes,
        hwRes,
        ppRes,
        psRes,
        hcRes,
        alRes,
        arRes,
        lrRes,
        myRiskRes,
        heatRiskRes,
      ] = await Promise.all([
        fetch(`/api/location/resolve${query}`),
        fetch(`/api/weather/current${query}`),
        fetch(`/api/weather/hourly${query}`),
        fetch(`/api/weather/forecast${query}`),
        fetch(`/api/thermal/current${query}`),
        fetch(`/api/risk/current${query}`),
        fetch(`/api/heatwave/status${query}`),
        fetch(`/api/protection/nearby${query}`),
        fetch(`/api/protection/summary${query}`),
        fetch(`/api/healthcare/nearby${query}`),
        fetch(`/api/alerts${query}`),
        fetch(`/api/adaptive-response${query}`),
        fetch(`/api/risk/long-range-warning${query}`),
        fetch(`/api/citizen/my-risk${query}`),
        fetch(`/api/citizen/heat-risk${query}`),
      ]);

      if (locRes.ok) {
        const locData = await locRes.json();
        setLocation((prev) => {
          const resolvedWard = locationName
            ? { ...(locData.ward || prev.ward), name: locationName }
            : (locData.ward || prev.ward);
          const rawWards: WardInfo[] = (locData.allWards && locData.allWards.length > 0)
            ? locData.allWards
            : prev.allWards;

          // Strictly deduplicate all wards by id
          const seen = new Set<string>();
          const dedupedWards: WardInfo[] = [];

          // If resolvedWard matches an existing ward by ID, update that ward in place
          for (const w of rawWards) {
            if (!w?.id) continue;
            if (seen.has(w.id)) continue;
            seen.add(w.id);
            if (resolvedWard && w.id === resolvedWard.id) {
              dedupedWards.push({ ...w, ...resolvedWard });
            } else {
              dedupedWards.push(w);
            }
          }

          // If resolvedWard has an ID not yet present in the list, prepend it
          if (resolvedWard?.id && !seen.has(resolvedWard.id)) {
            dedupedWards.unshift(resolvedWard);
          }

          return {
            ...prev,
            ward: resolvedWard,
            allWards: dedupedWards,
          };
        });
      }

      if (wcRes.ok) setWeatherCurrent(await wcRes.json());
      if (whRes.ok) setWeatherHourly(await whRes.json());
      if (wfRes.ok) setWeatherForecast(await wfRes.json());
      if (tcRes.ok) setThermalCurrent(await tcRes.json());
      if (rcRes.ok) setRiskCurrent(await rcRes.json());
      if (myRiskRes.ok) setMyRiskData(await myRiskRes.json());
      if (heatRiskRes.ok) {
        const hrData = await heatRiskRes.json();
        setHeatRiskData(hrData);
        if (hrData.personalImpact) {
          setPersonalImpact(hrData.personalImpact);
        }
      }
      if (hwRes.ok) setHeatwaveStatus(await hwRes.json());
      if (ppRes.ok) setProtectionPoints(await ppRes.json());
      if (psRes.ok) setProtectionSummary(await psRes.json());
      if (hcRes.ok) setHealthcareFacilities(await hcRes.json());
      if (alRes.ok) {
        const alData = await alRes.json();
        if (Array.isArray(alData)) {
          setAlerts(alData);
        } else if (alData && Array.isArray(alData.alerts)) {
          setAlerts(alData.alerts);
          if (Array.isArray(alData.history)) {
            setAlertHistory(alData.history);
          }
        }
      }
      if (arRes.ok) {
        const arData = await arRes.json();
        setAdaptiveRecommendations(arData.recommendations || []);
      }
      if (lrRes.ok) setLongRangeReport(await lrRes.json());

      const now = new Date();
      setLastUpdatedTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    } catch (err: any) {
      console.error('Error fetching backend intelligence:', err);
      setApiError('Unable to refresh live data. Operating in offline/cached safety mode.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [profile.ageGroup, profile.isOutdoorWorker, profile.hasHealthCondition, activityType, isOutdoorExposure, exposureDuration, destination]);

  // Explicitly evaluate personal impact when parameters change
  const evaluateImpact = useCallback(
    async (overrideParams?: Partial<PersonalHeatImpactInput>): Promise<PersonalHeatImpact | null> => {
      setIsEvaluatingImpact(true);
      try {
        const act = overrideParams?.activityType || activityType;
        const dur = overrideParams?.exposureDuration || exposureDuration;
        const out = overrideParams?.outdoorExposure !== undefined ? overrideParams.outdoorExposure : isOutdoorExposure;
        const dest = overrideParams?.destinationContext
          ? overrideParams.destinationContext
          : destination;

        let url = `/api/citizen/heat-impact?lat=${location.lat}&lng=${location.lng}&activityType=${encodeURIComponent(act)}&outdoorExposure=${out}&exposureDuration=${encodeURIComponent(dur)}&ageGroup=${encodeURIComponent(profile.ageGroup)}&hasHealthCondition=${profile.hasHealthCondition}&isOutdoorWorker=${profile.isOutdoorWorker}`;

        if (dest && 'lat' in dest && 'lng' in dest) {
          url += `&destinationLat=${(dest as any).lat}&destinationLng=${(dest as any).lng}&destinationName=${encodeURIComponent(dest.name)}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data: PersonalHeatImpact = await res.json();
          setPersonalImpact(data);
          return data;
        }
        return null;
      } catch (e) {
        console.error('Failed to evaluate personal heat impact:', e);
        return null;
      } finally {
        setIsEvaluatingImpact(false);
      }
    },
    [location.lat, location.lng, activityType, exposureDuration, isOutdoorExposure, destination, profile]
  );

  // Request browser GPS position
  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        gpsStatus: 'error',
        gpsErrorMsg: 'Geolocation is not supported by your browser. Please select a location manually.',
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, gpsStatus: 'requesting' }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          isGps: true,
          gpsStatus: 'granted',
          gpsErrorMsg: undefined,
        }));
        fetchAllData(latitude, longitude, false);
      },
      (err) => {
        console.warn('Geolocation access failed:', err.message);
        setLocation((prev) => ({
          ...prev,
          isGps: false,
          gpsStatus: 'denied',
          gpsErrorMsg: 'Location access denied or unavailable. Showing Pune Central (Shivajinagar).',
        }));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, [fetchAllData]);

  // Select a specific ward from the ward selector
  const selectWard = (wardId: string) => {
    const target = location.allWards.find((w) => w.id === wardId);
    if (target) {
      setLocation((prev) => ({
        ...prev,
        lat: target.center[0],
        lng: target.center[1],
        ward: target,
        isGps: false,
      }));
      fetchAllData(target.center[0], target.center[1], true, target.name);
    }
  };

  // Set any custom location / city selected or typed by the user
  const setCustomLocation = (name: string, lat: number, lng: number) => {
    const customWard: WardInfo = {
      id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: name,
      zone: 'Active Location',
      center: [lat, lng],
      bounds: [
        [lat - 0.05, lng - 0.05],
        [lat + 0.05, lng - 0.05],
        [lat + 0.05, lng + 0.05],
        [lat - 0.05, lng + 0.05],
        [lat - 0.05, lng - 0.05],
      ],
      population: 150000,
      vulnerableCount: 30000,
      treeCanopyPct: 26,
      builtDensityPct: 74,
      vulnerabilityIndex: 58,
      uhiOffsetDegC: 1.8,
      highRiskAreas: ['Commercial Center', 'Transit Terminus', 'Main Arterial Road'],
      lowRiskAreas: ['Public Park & Shaded Avenue', 'Waterfront Greenway'],
    };

    setLocation((prev) => {
      const seen = new Set<string>();
      const deduped: WardInfo[] = [customWard];
      seen.add(customWard.id);
      for (const w of prev.allWards) {
        if (!w?.id) continue;
        if (w.id === customWard.id || w.name.toLowerCase() === name.toLowerCase()) continue;
        if (!seen.has(w.id)) {
          seen.add(w.id);
          deduped.push(w);
        }
      }
      return {
        ...prev,
        lat,
        lng,
        ward: customWard,
        allWards: deduped,
        isGps: false,
      };
    });
    fetchAllData(lat, lng, true, name);
  };

  const setLocationCoords = (lat: number, lng: number) => {
    setLocation((prev) => ({ ...prev, lat, lng, isGps: false }));
    fetchAllData(lat, lng, true, location.ward?.name);
  };

  const refreshData = async () => {
    await fetchAllData(location.lat, location.lng, true, location.ward?.name);
  };

  // Mark alerts as read
  const markAlertRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const unreadAlertCount = alerts.filter((a) => !a.isRead).length;

  // Initial load — try GPS first, then fall back to asking user to select location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocation((prev) => ({ ...prev, gpsStatus: 'requesting' }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation((prev) => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            isGps: true,
            gpsStatus: 'granted',
          }));
          fetchAllData(latitude, longitude, false);
        },
        () => {
          // GPS denied — use first location from allLocations as default
          // But do NOT silently default to Pune
          setLocation((prev) => ({ ...prev, gpsStatus: 'denied' }));
          // Don't fetch with 0,0 — user must select a location
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setLocation((prev) => ({ ...prev, gpsStatus: 'error', gpsErrorMsg: 'Geolocation not supported.' }));
    }
  }, []);

  return (
    <CitizenContext.Provider
      value={{
        activePage,
        setActivePage,
        location,
        setLocationCoords,
        requestGpsLocation,
        selectWard,
        setCustomLocation,
        profile,
        updateProfile,
        unit,
        setUnit,
        formatTemp,

        weatherCurrent,
        weatherHourly,
        weatherForecast,
        thermalCurrent,
        riskCurrent,
        myRiskData,
        heatRiskData,
        heatwaveStatus,
        protectionPoints,
        protectionSummary,
        healthcareFacilities,
        alerts,
        alertHistory,
        adaptiveRecommendations,
        longRangeReport,
        unreadAlertCount,
        markAlertRead,
        markAllAlertsRead,

        isLoading,
        isRefreshing,
        apiError,
        lastUpdatedTime,
        refreshData,

        // Human Heat Impact & Personal Activity Engine
        activityType,
        setActivityType,
        exposureDuration,
        setExposureDuration,
        isOutdoorExposure,
        setIsOutdoorExposure,
        destination,
        setDestination,
        plannedTravelTime,
        setPlannedTravelTime,
        personalImpact,
        evaluateImpact,
        isEvaluatingImpact,

        isNotificationOpen,
        setIsNotificationOpen,

        targetFacilityForDirections,
        setTargetFacilityForDirections,
        navigateToHealthcareWithDirections,
      }}
    >
      {children}
    </CitizenContext.Provider>
  );
};

export const useCitizen = () => {
  const context = useContext(CitizenContext);
  if (!context) {
    throw new Error('useCitizen must be used within a CitizenProvider');
  }
  return context;
};
