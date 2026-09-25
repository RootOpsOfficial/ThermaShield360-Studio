import React, { createContext, useContext, useState, useEffect } from 'react';

export type WorkspaceType = 'citizen' | 'municipal';

interface WorkspaceContextType {
  workspace: WorkspaceType;
  setWorkspace: (ws: WorkspaceType) => void;
  toggleWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspaceState] = useState<WorkspaceType>(() => {
    try {
      const saved = localStorage.getItem('thermashield_workspace');
      return (saved === 'municipal' || saved === 'citizen') ? saved : 'citizen';
    } catch {
      return 'citizen';
    }
  });

  const setWorkspace = (ws: WorkspaceType) => {
    setWorkspaceState(ws);
    try {
      localStorage.setItem('thermashield_workspace', ws);
    } catch {
      // ignore
    }
  };

  const toggleWorkspace = () => {
    setWorkspace(workspace === 'citizen' ? 'municipal' : 'citizen');
  };

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace, toggleWorkspace }}>
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
