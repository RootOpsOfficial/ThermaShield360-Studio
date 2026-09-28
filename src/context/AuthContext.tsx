import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export type UserRole = 'citizen' | 'worker' | 'municipal' | 'healthcare' | 'disaster_management';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'disabled';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approval_status: ApprovalStatus;
  onboarding_completed: boolean;
  organization?: string;
  department?: string;
  city?: string;
}

export interface InstitutionalRequestPayload {
  full_name: string;
  email: string;
  requested_role: 'municipal' | 'healthcare' | 'disaster_management';
  organization: string;
  department: string;
  city_district: string;
  contact_phone?: string;
  official_id_reference?: string;
  justification?: string;
}

export interface OnboardingPayload {
  city?: string;
  state?: string;
  country?: string;
  area_type?: string;
  work_environment?: string;
  occupation?: string;
  outdoor_exposure?: string;
  age_group?: string;
  cooling_access?: string;
  organization?: string;
  department?: string;
  operational_area?: string;
  facility_type?: string;
  facility_capacity?: string;
  responsibilities?: string;
  monitoring_preferences?: string[];
  alert_preferences?: string[];
  work_hours?: string;
  water_access?: string;
  rest_area_access?: string;
  physical_demand?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    role: 'citizen' | 'worker'
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  submitInstitutionalRequest: (
    payload: InstitutionalRequestPayload
  ) => Promise<{ success: boolean; error?: string; data?: any }>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Sync profile from backend or direct Supabase profiles table
  const fetchProfileForUser = useCallback(async (userId: string, email: string, meta?: any): Promise<UserProfile> => {
    try {
      const res = await fetch(`/api/auth/profile?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          const profile: UserProfile = {
            id: data.id,
            email: data.email || email,
            name: data.full_name || 'User',
            role: data.role || 'citizen',
            approval_status: data.approval_status || 'approved',
            onboarding_completed: Boolean(data.onboarding_completed),
            organization: data.organization,
            department: data.department,
            city: data.city,
          };
          return profile;
        }
      }
    } catch {
      // fallback
    }

    // Try direct Supabase query
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        return {
          id: data.id,
          email: data.email || email,
          name: data.full_name || 'User',
          role: data.role || 'citizen',
          approval_status: data.approval_status || 'approved',
          onboarding_completed: Boolean(data.onboarding_completed),
        };
      }
    } catch {
      // ignore
    }

    // Create default profile for the user
    const defaultRole: UserRole = meta?.role || (email.includes('pmc') || email.includes('gov') ? 'municipal' : 'citizen');
    const defaultApproval: ApprovalStatus = (defaultRole === 'citizen' || defaultRole === 'worker') ? 'approved' : 'pending';
    const displayName = meta?.full_name || meta?.name || email.split('@')[0];

    const newProfile: UserProfile = {
      id: userId,
      email,
      name: displayName,
      role: defaultRole,
      approval_status: defaultApproval,
      onboarding_completed: false,
    };

    // Post to backend to save
    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newProfile.id,
          email: newProfile.email,
          full_name: newProfile.name,
          role: newProfile.role,
          approval_status: newProfile.approval_status,
          onboarding_completed: newProfile.onboarding_completed,
        }),
      });
    } catch {
      // ignore
    }

    return newProfile;
  }, []);

  const saveLocalUser = useCallback((profile: UserProfile | null) => {
    setUser(profile);
    try {
      if (profile) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen to Supabase auth state change on mount
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setIsLoading(true);
      try {
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          console.warn('[AuthContext] Session init error:', sessionErr.message);
        }

        if (data?.session?.user && mounted) {
          const authUser = data.session.user;
          const profile = await fetchProfileForUser(
            authUser.id,
            authUser.email || '',
            authUser.user_metadata
          );
          if (mounted) {
            saveLocalUser(profile);
          }
        }
      } catch (err: any) {
        console.warn('[AuthContext] init error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        const profile = await fetchProfileForUser(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata
        );
        if (mounted) {
          saveLocalUser(profile);
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          saveLocalUser(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchProfileForUser, saveLocalUser]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const updated = await fetchProfileForUser(user.id, user.email);
      saveLocalUser(updated);
    } catch (err) {
      console.warn('[AuthContext] refreshProfile error:', err);
    }
  }, [user, fetchProfileForUser, saveLocalUser]);

  // Login with Email + Password via Supabase Auth
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setIsLoading(true);

      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        const msg = 'Please enter both your email address and password.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      try {
        const { data, error: sbError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (sbError) {
          // If Supabase credentials fail, check if this is a known demo account or provide clear message
          console.warn('[AuthContext] Supabase sign in error:', sbError.message);
          const msg = sbError.message || 'Invalid email or password.';
          setError(msg);
          setIsLoading(false);
          return { success: false, error: msg };
        }

        if (data?.user) {
          const profile = await fetchProfileForUser(
            data.user.id,
            data.user.email || trimmedEmail,
            data.user.user_metadata
          );
          saveLocalUser(profile);
          setIsLoading(false);
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: 'Authentication failed. Please try again.' };
      } catch (err: any) {
        const msg = err?.message || 'Authentication network error.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    [fetchProfileForUser, saveLocalUser]
  );

  // Magic Link / OTP Email request
  const loginWithOtp = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: sbError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (sbError) {
        setError(sbError.message);
        setIsLoading(false);
        return { success: false, error: sbError.message };
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to dispatch verification code.';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  }, []);

  // Verify OTP code
  const verifyOtp = useCallback(
    async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      setIsLoading(true);

      try {
        const { data, error: sbError } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: token.trim(),
          type: 'email',
        });

        if (sbError) {
          setError(sbError.message);
          setIsLoading(false);
          return { success: false, error: sbError.message };
        }

        if (data?.user) {
          const profile = await fetchProfileForUser(
            data.user.id,
            data.user.email || email,
            data.user.user_metadata
          );
          saveLocalUser(profile);
          setIsLoading(false);
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: 'Verification failed.' };
      } catch (err: any) {
        const msg = err?.message || 'Verification error.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    [fetchProfileForUser, saveLocalUser]
  );

  // Google OAuth via Supabase Auth
  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: sbError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (sbError) {
        setError(sbError.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to launch Google Sign-In.');
      setIsLoading(false);
    }
  }, []);

  // Citizen & Outdoor Worker Registration via Supabase Auth
  const register = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      role: 'citizen' | 'worker' = 'citizen'
    ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
      setError(null);
      setIsLoading(true);

      const trimmedEmail = email.trim();
      const trimmedName = fullName.trim();

      if (!trimmedEmail || !password || !trimmedName) {
        const msg = 'Please fill in all required fields (Name, Email, Password).';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }

      try {
        const { data, error: sbError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
              role,
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (sbError) {
          setError(sbError.message);
          setIsLoading(false);
          return { success: false, error: sbError.message };
        }

        if (data?.user) {
          // If session is immediately available (email confirmation disabled or auto-confirmed)
          if (data.session) {
            const profile = await fetchProfileForUser(
              data.user.id,
              trimmedEmail,
              { full_name: trimmedName, role }
            );
            saveLocalUser(profile);
            setIsLoading(false);
            return { success: true, requiresEmailConfirmation: false };
          }

          // Email confirmation is required by Supabase Auth
          setIsLoading(false);
          return { success: true, requiresEmailConfirmation: true };
        }

        setIsLoading(false);
        return { success: false, error: 'Registration failed. Please try again.' };
      } catch (err: any) {
        const msg = err?.message || 'Registration network error.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    [fetchProfileForUser, saveLocalUser]
  );

  // Submit Institutional Request (Municipal, Healthcare, Disaster Management)
  const submitInstitutionalRequest = useCallback(
    async (payload: InstitutionalRequestPayload): Promise<{ success: boolean; error?: string; data?: any }> => {
      setError(null);
      setIsLoading(true);

      try {
        const res = await fetch('/api/institutional/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          const msg = data?.error || 'Failed to submit institutional request.';
          setError(msg);
          setIsLoading(false);
          return { success: false, error: msg };
        }

        setIsLoading(false);
        return { success: true, data };
      } catch (err: any) {
        const msg = err?.message || 'Network error submitting request.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    []
  );

  // Complete Onboarding and save to user_onboarding table in Supabase
  const completeOnboarding = useCallback(
    async (payload: OnboardingPayload): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'No authenticated user session found.' };
      }

      setError(null);
      setIsLoading(true);

      try {
        const res = await fetch('/api/auth/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            user_id: user.id,
            city: payload.city || user.city || 'Pune',
            organization: payload.organization || user.organization,
            department: payload.department || user.department,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          const msg = data?.error || 'Failed to save onboarding responses.';
          setError(msg);
          setIsLoading(false);
          return { success: false, error: msg };
        }

        // Update local user state
        const updatedUser: UserProfile = {
          ...user,
          onboarding_completed: true,
          city: payload.city || user.city,
          organization: payload.organization || user.organization,
          department: payload.department || user.department,
        };

        saveLocalUser(updatedUser);
        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        const msg = err?.message || 'Error saving onboarding data.';
        setError(msg);
        setIsLoading(false);
        return { success: false, error: msg };
      }
    },
    [user, saveLocalUser]
  );

  // Instant Demo Switcher for fast verification of all 5 roles
  const demoLogin = useCallback(
    async (role: UserRole): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      let displayName = 'Authorized Citizen';
      let email = 'citizen@thermashield.org';
      let org = 'Community Climate Grid';
      let dept = 'Public Safety';
      let approval: ApprovalStatus = 'approved';

      switch (role) {
        case 'citizen':
          displayName = 'Aarav Sharma';
          email = 'citizen.aarav@thermashield.org';
          org = 'Citizen Heat Watch';
          dept = 'Resident Member';
          approval = 'approved';
          break;
        case 'worker':
          displayName = 'Rajesh Pawar';
          email = 'worker.rajesh@thermashield.org';
          org = 'Urban Infrastructure Works';
          dept = 'Civil Construction Field Crew';
          approval = 'approved';
          break;
        case 'municipal':
          displayName = 'Suresh Patil (Addl. Commissioner)';
          email = 'director@pmc.gov.in';
          org = 'Pune Municipal Corporation';
          dept = 'Disaster Management & Climate Resilience Cell';
          approval = 'approved';
          break;
        case 'healthcare':
          displayName = 'Dr. Sunita Kulkarni (CMO)';
          email = 'cmo@sgh-hospital.org';
          org = 'Sassoon General Hospital';
          dept = 'Department of Emergency Medicine';
          approval = 'approved';
          break;
        case 'disaster_management':
          displayName = 'Commander R. V. Deshmukh';
          email = 'commander@ddma-eoc.gov.in';
          org = 'District Disaster Management Authority';
          dept = 'Emergency Operations Command Center (EOC)';
          approval = 'approved';
          break;
      }

      const demoUser: UserProfile = {
        id: 'demo_' + role + '_' + Date.now().toString(36),
        name: displayName,
        email,
        role,
        approval_status: approval,
        onboarding_completed: true, // demo users are pre-onboarded
        organization: org,
        department: dept,
        city: 'Pune',
      };

      // Persist in backend
      try {
        await fetch('/api/auth/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: demoUser.id,
            email: demoUser.email,
            full_name: demoUser.name,
            role: demoUser.role,
            approval_status: demoUser.approval_status,
            onboarding_completed: demoUser.onboarding_completed,
          }),
        });
      } catch {
        // ignore
      }

      saveLocalUser(demoUser);
      setIsLoading(false);
      return true;
    },
    [saveLocalUser]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    saveLocalUser(null);
    setError(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('thermashield_workspace');
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, [saveLocalUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        loginWithOtp,
        verifyOtp,
        loginWithGoogle,
        register,
        submitInstitutionalRequest,
        completeOnboarding,
        demoLogin,
        logout,
        clearError,
        refreshProfile,
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
