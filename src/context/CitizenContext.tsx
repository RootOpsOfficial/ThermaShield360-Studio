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
  AdaptiveRecommendation,
  LongRangeEarlyWarningReport,
  CitizenMyRiskData,
  CitizenHeatRiskResponse,
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

  // Drawer / modal states
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
}

const defaultWard: WardInfo = {
  id: 'ward-14',
  name: 'Ward 14: Shivajinagar - Ghole Road',
  zone: 'Central Pune Zone',
  center: [18.5314, 73.8446],
  bounds: [
    [18.542, 73.834],
    [18.545, 73.856],
    [18.524, 73.861],
    [18.518, 73.839],
    [18.542, 73.834],
  ],
  population: 142000,
  vulnerableCount: 28400,
  treeCanopyPct: 32,
  builtDensityPct: 68,
  vulnerabilityIndex: 58,
  uhiOffsetDegC: 1.8,
  highRiskAreas: ['FC Road Shopping Spine', 'Shivajinagar Bus & Railway Terminus', 'Modern College Square'],
  lowRiskAreas: ['Sambhaji Park Canopy', 'Agricultural College Green Belt', 'Mutha River Greenway'],
};

const CitizenContext = createContext<CitizenContextType | null>(null);

export const CitizenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<CitizenPage>('home');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [profile, setProfile] = useState<CitizenProfile>({
    name: 'Citizen (Pune Resident)',
    ageGroup: 'Adult (18-64)',
    isOutdoorWorker: false,
    hasHealthCondition: false,
    profileLabel: 'General Citizen',
  });

  const [location, setLocation] = useState<LocationState>({
    lat: 18.5314,
    lng: 73.8446,
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
  const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [longRangeReport, setLongRangeReport] = useState<LongRangeEarlyWarningReport | null>(null);

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
      const query = `?lat=${lat}&lng=${lng}&ageGroup=${encodeURIComponent(profile.ageGroup)}&isOutdoorWorker=${profile.isOutdoorWorker}&hasHealthCondition=${profile.hasHealthCondition}${nameParam}`;

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
          const wardsList: WardInfo[] = locData.allWards || prev.allWards;
          const hasWard = wardsList.some((w: WardInfo) => w.name === resolvedWard.name);
          return {
            ...prev,
            ward: resolvedWard,
            allWards: hasWard ? wardsList : [resolvedWard, ...wardsList],
          };
        });
      }

      if (wcRes.ok) setWeatherCurrent(await wcRes.json());
      if (whRes.ok) setWeatherHourly(await whRes.json());
      if (wfRes.ok) setWeatherForecast(await wfRes.json());
      if (tcRes.ok) setThermalCurrent(await tcRes.json());
      if (rcRes.ok) setRiskCurrent(await rcRes.json());
      if (myRiskRes.ok) setMyRiskData(await myRiskRes.json());
      if (heatRiskRes.ok) setHeatRiskData(await heatRiskRes.json());
      if (hwRes.ok) setHeatwaveStatus(await hwRes.json());
      if (ppRes.ok) setProtectionPoints(await ppRes.json());
      if (psRes.ok) setProtectionSummary(await psRes.json());
      if (hcRes.ok) setHealthcareFacilities(await hcRes.json());
      if (alRes.ok) setAlerts(await alRes.json());
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
  }, [profile.ageGroup, profile.isOutdoorWorker, profile.hasHealthCondition]);

  // Request browser GPS position
  const requestGpsLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        gpsStatus: 'error',
        gpsErrorMsg: 'Geolocation is not supported by your browser. Using Pune Central as default.',
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

    setLocation((prev) => ({
      ...prev,
      lat,
      lng,
      ward: customWard,
      allWards: prev.allWards.some((w) => w.name === name)
        ? prev.allWards
        : [customWard, ...prev.allWards],
      isGps: false,
    }));
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

  // Initial load
  useEffect(() => {
    fetchAllData(location.lat, location.lng, false);
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

        isNotificationOpen,
        setIsNotificationOpen,
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
