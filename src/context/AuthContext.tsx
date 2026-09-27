import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role?: 'citizen' | 'worker' | 'healthcare' | 'municipal' | 'disaster' | 'admin';
  organization?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'thermashield_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    // Validate inputs
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      setIsLoading(false);
      return false;
    }

    if (!password) {
      setError('Please enter your password.');
      setIsLoading(false);
      return false;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      setIsLoading(false);
      return false;
    }

    // Simulate realistic asynchronous authentication
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);

        // Determine user profile based on email or default demo
        let displayName = 'Authorized User';
        let org = 'Climate Safety Network';
        const lower = trimmedEmail.toLowerCase();

        if (lower.includes('pune') || lower.includes('pmc') || lower.includes('gov')) {
          displayName = 'Civic Administrator';
          org = 'Pune Municipal Corporation';
        } else if (lower.includes('health') || lower.includes('hospital') || lower.includes('med')) {
          displayName = 'Dr. S. Kulkarni (Chief Medical Officer)';
          org = 'Regional Healthcare Grid';
        } else if (lower.includes('disaster') || lower.includes('eoc') || lower.includes('ndma')) {
          displayName = 'Commander R. Sharma';
          org = 'Disaster Management Authority';
        } else if (lower.includes('worker')) {
          displayName = 'Rajesh Pawar (Field Safety Lead)';
          org = 'Urban Infrastructure Works';
        } else {
          displayName = trimmedEmail.split('@')[0].replace(/[._]/g, ' ');
          displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        }

        const newUser: UserProfile = {
          id: 'user_' + Date.now(),
          name: displayName,
          email: trimmedEmail,
          organization: org,
        };

        setUser(newUser);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        } catch {
          // ignore
        }

        resolve(true);
      }, 550);
    });
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        const googleUser: UserProfile = {
          id: 'guser_' + Date.now(),
          name: 'Verified Google User',
          email: 'user@google-verified.org',
          organization: 'ThermaShield Climate Network',
        };

        setUser(googleUser);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(googleUser));
        } catch {
          // ignore
        }

        resolve(true);
      }, 550);
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('thermashield_workspace');
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
