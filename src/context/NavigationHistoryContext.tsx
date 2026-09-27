import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface NavigationHistoryContextType {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  recordNavigation: (targetHash: string) => void;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | undefined>(undefined);

export const NavigationHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [historyIndex, setHistoryIndex] = useState<number>(() => {
    try {
      if (window.history.state && typeof window.history.state.idx === 'number') {
        return window.history.state.idx;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const [maxHistoryIndex, setMaxHistoryIndex] = useState<number>(() => {
    try {
      if (window.history.state && typeof window.history.state.maxIdx === 'number') {
        return window.history.state.maxIdx;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  const isNavigatingRef = useRef(false);

  // Initialize history state on mount
  useEffect(() => {
    try {
      if (!window.history.state || typeof window.history.state.idx !== 'number') {
        window.history.replaceState({ idx: 0, maxIdx: 0 }, '', window.location.href);
      }
    } catch {
      // ignore
    }

    const handlePopState = (event: PopStateEvent) => {
      const stateIdx = event.state && typeof event.state.idx === 'number' ? event.state.idx : 0;
      const stateMax = event.state && typeof event.state.maxIdx === 'number' ? event.state.maxIdx : maxHistoryIndex;

      setHistoryIndex(stateIdx);
      if (stateMax > maxHistoryIndex) {
        setMaxHistoryIndex(stateMax);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [maxHistoryIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      window.history.back();
    }
  }, [historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex < maxHistoryIndex) {
      window.history.forward();
    }
  }, [historyIndex, maxHistoryIndex]);

  const recordNavigation = useCallback((targetHash: string) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    try {
      const currentIdx = window.history.state && typeof window.history.state.idx === 'number'
        ? window.history.state.idx
        : historyIndex;

      const nextIdx = currentIdx + 1;
      const nextMax = nextIdx;

      window.history.pushState({ idx: nextIdx, maxIdx: nextMax }, '', targetHash);
      setHistoryIndex(nextIdx);
      setMaxHistoryIndex(nextMax);
    } catch {
      try {
        window.location.hash = targetHash;
      } catch {
        // ignore
      }
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 50);
    }
  }, [historyIndex]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < maxHistoryIndex;

  return (
    <NavigationHistoryContext.Provider
      value={{
        canGoBack,
        canGoForward,
        goBack,
        goForward,
        recordNavigation,
      }}
    >
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export const useNavigationHistory = () => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error('useNavigationHistory must be used within a NavigationHistoryProvider');
  }
  return context;
};
