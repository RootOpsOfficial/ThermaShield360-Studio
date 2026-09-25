import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MunicipalNavPage,
  MunicipalSummary,
  MunicipalWardData,
  MunicipalActionItem,
  ProtectionResourceItem,
  MunicipalAlertItem,
} from '../types/municipal.js';

interface MunicipalContextType {
  activeMunicipalPage: MunicipalNavPage;
  setActiveMunicipalPage: (page: MunicipalNavPage) => void;
  summary: MunicipalSummary | null;
  wards: MunicipalWardData[];
  selectedWard: MunicipalWardData | null;
  setSelectedWard: (ward: MunicipalWardData | null) => void;
  actions: MunicipalActionItem[];
  updateActionStatus: (id: string, status: MunicipalActionItem['status']) => Promise<void>;
  resources: ProtectionResourceItem[];
  alerts: MunicipalAlertItem[];
  broadcastAlert: (alert: Omit<MunicipalAlertItem, 'id'>) => Promise<void>;
  isDetailModalOpen: boolean;
  setIsDetailModalOpen: (open: boolean) => void;
  isRefreshing: boolean;
  refreshMunicipalData: () => Promise<void>;
}

const MunicipalContext = createContext<MunicipalContextType | undefined>(undefined);

export const MunicipalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMunicipalPage, setActiveMunicipalPage] = useState<MunicipalNavPage>('command-center');
  const [summary, setSummary] = useState<MunicipalSummary | null>(null);
  const [wards, setWards] = useState<MunicipalWardData[]>([]);
  const [selectedWard, setSelectedWard] = useState<MunicipalWardData | null>(null);
  const [actions, setActions] = useState<MunicipalActionItem[]>([]);
  const [resources, setResources] = useState<ProtectionResourceItem[]>([]);
  const [alerts, setAlerts] = useState<MunicipalAlertItem[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMunicipalData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [sumRes, wardsRes, actRes, resRes, alertRes] = await Promise.all([
        fetch('/api/municipal/summary').then((r) => r.json()),
        fetch('/api/municipal/wards').then((r) => r.json()),
        fetch('/api/municipal/actions').then((r) => r.json()),
        fetch('/api/municipal/resources').then((r) => r.json()),
        fetch('/api/municipal/alerts').then((r) => r.json()),
      ]);

      if (sumRes && !sumRes.error) {
        setSummary(sumRes);
      }
      if (Array.isArray(wardsRes)) {
        setWards(wardsRes);
        // Default selected ward to highest risk if not selected
        if (!selectedWard && wardsRes.length > 0) {
          setSelectedWard(wardsRes[0]);
        }
      }
      if (Array.isArray(actRes)) {
        setActions(actRes);
      }
      if (Array.isArray(resRes)) {
        setResources(resRes);
      }
      if (Array.isArray(alertRes)) {
        setAlerts(alertRes);
      }
    } catch (err) {
      console.error('Failed to load municipal data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedWard]);

  useEffect(() => {
    fetchMunicipalData();
  }, [fetchMunicipalData]);

  const updateActionStatus = async (id: string, status: MunicipalActionItem['status']) => {
    try {
      const res = await fetch(`/api/municipal/actions/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setActions((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
    } catch (err) {
      console.error('Failed to update action status:', err);
      // Optimistic update fallback
      setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    }
  };

  const broadcastAlert = async (alert: Omit<MunicipalAlertItem, 'id'>) => {
    try {
      const res = await fetch('/api/municipal/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
      if (res.ok) {
        const created = await res.json();
        setAlerts((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
      const fallback: MunicipalAlertItem = {
        ...alert,
        id: `al-${Date.now()}`,
      };
      setAlerts((prev) => [fallback, ...prev]);
    }
  };

  return (
    <MunicipalContext.Provider
      value={{
        activeMunicipalPage,
        setActiveMunicipalPage,
        summary,
        wards,
        selectedWard,
        setSelectedWard,
        actions,
        updateActionStatus,
        resources,
        alerts,
        broadcastAlert,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isRefreshing,
        refreshMunicipalData: fetchMunicipalData,
      }}
    >
      {children}
    </MunicipalContext.Provider>
  );
};

export const useMunicipal = () => {
  const context = useContext(MunicipalContext);
  if (!context) {
    throw new Error('useMunicipal must be used within a MunicipalProvider');
  }
  return context;
};
