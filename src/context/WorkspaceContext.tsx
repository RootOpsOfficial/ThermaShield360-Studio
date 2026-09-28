import React, { createContext, useContext, useState, useCallback } from 'react';

export type WorkspaceType = 'login' | 'portal' | 'onboarding' | 'citizen' | 'municipal' | 'healthcare' | 'disaster';

interface WorkspaceContextType {
  workspace: WorkspaceType;
  setWorkspace: (ws: WorkspaceType) => void;
  openPortal: () => void;
  openLogin: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

function getInitialWorkspace(): WorkspaceType {
  // 1. Check URL hash or path first
  try {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash.includes('login') || path.includes('login')) {
      return 'login';
    }
    if (hash.includes('onboarding') || path.includes('onboarding')) {
      return 'onboarding';
    }
    if (hash.includes('disaster') || path.includes('disaster')) {
      return 'disaster';
    }
    if (
      hash.includes('municipality') ||
      hash.includes('municipal') ||
      path.includes('municipality') ||
      path.includes('municipal')
    ) {
      return 'municipal';
    }
    if (hash.includes('healthcare') || path.includes('healthcare')) {
      return 'healthcare';
    }
    if (hash.includes('citizen') || path.includes('citizen')) {
      return 'citizen';
    }
    if (hash.includes('select') || hash.includes('portal')) {
      return 'portal';
    }
  } catch {
    // ignore
  }

  // 2. Check session: if not authenticated, default to login
  try {
    const session = localStorage.getItem('thermashield_session');
    if (!session) {
      return 'login';
    }
  } catch {
    // ignore
  }

  // 3. Check localStorage for saved workspace
  try {
    const saved = localStorage.getItem('thermashield_workspace') as WorkspaceType;
    if (saved === 'municipal' || saved === 'citizen' || saved === 'healthcare' || saved === 'disaster') {
      return saved;
    }
    if (saved === 'portal') {
      return 'portal';
    }
  } catch {
    // ignore
  }

  // Default to login on fresh open
  return 'login';
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspaceState] = useState<WorkspaceType>(getInitialWorkspace);

  const setWorkspace = useCallback((ws: WorkspaceType) => {
    setWorkspaceState((prev) => {
      if (prev === ws) return prev;
      try {
        if (ws === 'portal' || ws === 'login' || ws === 'onboarding') {
          localStorage.removeItem('thermashield_workspace');
        } else {
          localStorage.setItem('thermashield_workspace', ws);
        }
      } catch {
        // ignore
      }
      return ws;
    });
  }, []);

  const openPortal = useCallback(() => {
    setWorkspace('portal');
  }, [setWorkspace]);

  const openLogin = useCallback(() => {
    setWorkspace('login');
  }, [setWorkspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, openPortal, openLogin }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
