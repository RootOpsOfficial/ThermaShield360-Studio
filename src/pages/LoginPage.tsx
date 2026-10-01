import React, { useState, useEffect } from 'react';
import { useAuth, UserRole, InstitutionalRequestPayload } from '../context/AuthContext.js';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { useCitizen } from '../context/CitizenContext.js';
import { useMunicipal } from '../context/MunicipalContext.js';
import { useHealthcare } from '../context/HealthcareContext.js';
import { useDisaster } from '../context/DisasterContext.js';
import { useNavigationHistory } from '../context/NavigationHistoryContext.js';
import { supabase } from '../lib/supabase.js';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building,
  HeartPulse,
  Radio,
  User,
  HardHat,
  KeyRound,
  FileCheck2,
  Clock,
  Send,
  X,
  Check,
} from 'lucide-react';

type AuthViewMode = 'signin' | 'signup' | 'otp' | 'institutional' | 'approvals';

export const LoginPage: React.FC = () => {
  const {
    user,
    login,
    loginWithOtp,
    verifyOtp,
    loginWithGoogle,
    register,
    submitInstitutionalRequest,
    demoLogin,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const { setWorkspace } = useWorkspace();
  const { setActivePage } = useCitizen();
  const { setActiveMunicipalPage } = useMunicipal();
  const { setActiveHealthcarePage } = useHealthcare();
  const { setActiveDisasterPage } = useDisaster();
  const { recordNavigation } = useNavigationHistory();

  const [mode, setMode] = useState<AuthViewMode>('signin');

  // Sign In & Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // OTP Verification state
  const [otpToken, setOtpToken] = useState('');
  const [otpSentEmail, setOtpSentEmail] = useState('');

  // Citizen / Worker Registration state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'citizen' | 'worker'>('citizen');

  // Institutional Request state
  const [instName, setInstName] = useState('');
  const [instEmail, setInstEmail] = useState('');
  const [instRole, setInstRole] = useState<'municipal' | 'healthcare' | 'disaster_management'>('municipal');
  const [instOrg, setInstOrg] = useState('');
  const [instDept, setInstDept] = useState('');
  const [instCity, setInstCity] = useState('Pune');
  const [instPhone, setInstPhone] = useState('');
  const [instJustification, setInstJustification] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Pending Requests List (for authorized reviewer modal)
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);

  // Check if current user is already authenticated and needs redirection
  useEffect(() => {
    if (user) {
      if (user.approval_status === 'pending') {
        // user is pending institutional approval
        return;
      }
      if (!user.onboarding_completed) {
        setWorkspace('onboarding');
      } else {
        handleRouteToDashboard(user.role);
      }
    }
  }, [user, setWorkspace]);

  const handleRouteToDashboard = (targetRole: UserRole) => {
    switch (targetRole) {
      case 'citizen':
        setActivePage('home');
        recordNavigation('#citizen/home');
        setWorkspace('citizen');
        break;
      case 'worker':
        setActivePage('thermal');
        recordNavigation('#citizen/thermal');
        setWorkspace('citizen');
        break;
      case 'municipal':
        setActiveMunicipalPage('command-center');
        recordNavigation('#municipality/command-center');
        setWorkspace('municipal');
        break;
      case 'healthcare':
        setActiveHealthcarePage('command-center');
        recordNavigation('#healthcare/command-center');
        setWorkspace('healthcare');
        break;
      case 'disaster_management':
        setActiveDisasterPage('command');
        recordNavigation('#disaster/command');
        setWorkspace('disaster');
        break;
    }
  };

  // Sign In Form Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setInfoMessage(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Please enter your email address.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    const res = await login(trimmedEmail, password);
    if (res.success) {
      // Automatic routing to role dashboard or onboarding is handled by useEffect and RouteCoordinator
    }
  };

  // OTP Login Dispatch Handler
  const handleRequestOtp = async () => {
    setValidationError(null);
    setInfoMessage(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Please enter your email address to receive a secure OTP code.');
      return;
    }

    const res = await loginWithOtp(trimmedEmail);
    if (res.success) {
      setOtpSentEmail(trimmedEmail);
      setInfoMessage(`Verification code dispatched to ${trimmedEmail}. Please check your inbox or spam.`);
      setMode('otp');
    }
  };

  // OTP Verification Handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!otpToken.trim()) {
      setValidationError('Please enter the 6-digit verification code.');
      return;
    }

    const res = await verifyOtp(otpSentEmail || email, otpToken.trim());
    if (res.success) {
      // Automatic routing to role dashboard or onboarding is handled by useEffect and RouteCoordinator
    }
  };

  // Citizen & Worker Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setInfoMessage(null);
    clearError();

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setValidationError('Please provide your full name, email, and password.');
      return;
    }

    if (regPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    const res = await register(regEmail.trim(), regPassword, regFullName.trim(), regRole);
    if (res.success) {
      if (res.requiresEmailConfirmation) {
        setInfoMessage(
          `Confirmation email sent to ${regEmail}. Please click the link in your email to activate your account.`
        );
        setMode('signin');
      } else {
        setWorkspace('onboarding');
      }
    }
  };

  // Institutional Access Request Handler
  const handleInstitutionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setInfoMessage(null);
    clearError();

    if (!instName.trim() || !instEmail.trim() || !instOrg.trim() || !instDept.trim()) {
      setValidationError('Please complete all required fields (Name, Official Email, Organization, Department).');
      return;
    }

    const payload: InstitutionalRequestPayload = {
      full_name: instName.trim(),
      email: instEmail.trim(),
      requested_role: instRole,
      organization: instOrg.trim(),
      department: instDept.trim(),
      city_district: instCity.trim(),
      contact_phone: instPhone.trim() || undefined,
      justification: instJustification.trim() || undefined,
    };

    const res = await submitInstitutionalRequest(payload);
    if (res.success) {
      setSubmittedRequestId(res.data?.id || 'req_' + Date.now().toString(36));
      setInfoMessage('Institutional access request submitted successfully.');
    }
  };

  // Demo Login Handler
  const handleDemoLogin = async (targetRole: UserRole) => {
    setValidationError(null);
    clearError();
    const success = await demoLogin(targetRole);
    if (success) {
      handleRouteToDashboard(targetRole);
    }
  };

  // Fetch pending requests for the reviewer panel
  const fetchPendingRequests = async () => {
    setIsLoadingRequests(true);
    setApprovalsError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setApprovalsError('Authentication required: Sign in with an authorized departmental official account to review applications.');
        setPendingRequests([]);
        return;
      }

      const res = await fetch('/api/institutional/requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data || []);
      } else {
        const errData = await res.json().catch(() => null);
        setApprovalsError(errData?.error || 'Access denied: You do not possess institutional approval authority.');
        setPendingRequests([]);
      }
    } catch {
      setApprovalsError('Network communication error checking authority.');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleReviewRequest = async (requestId: string, decision: 'approved' | 'rejected') => {
    setApprovalsError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) {
        setApprovalsError('Authentication session expired. Please sign in again.');
        return;
      }

      const res = await fetch('/api/institutional/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId,
          decision,
          notes: `Decision recorded on ${new Date().toLocaleDateString()}`,
        }),
      });

      if (res.ok) {
        fetchPendingRequests();
      } else {
        const errData = await res.json().catch(() => null);
        setApprovalsError(errData?.error || 'Failed to submit review decision.');
      }
    } catch (err: any) {
      setApprovalsError(err?.message || 'Error executing review decision.');
    }
  };

  const activeError = validationError || error;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans selection:bg-orange-500/20 selection:text-orange-950 overflow-hidden bg-slate-950">
      {/* Background Cityscape with Warm Golden Sunlight Ambient Glow */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2160&q=85')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-950/60 lg:to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />
        <div className="absolute inset-0 bg-radial-at-tl from-orange-500/15 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Main Dual-Column Container */}
      <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* ============================================================== */}
        {/* LEFT COLUMN: BRANDING & CLIMATE HEAT VALUE PROPOSITION       */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 text-white flex flex-col justify-center space-y-6 pt-4 lg:pt-0">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/25 ring-2 ring-white/10 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight">
                  ThermaShield<span className="text-orange-400">360</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-400/30 backdrop-blur-md">
                  CLIMATE DEFENSE
                </span>
              </div>
              <p className="text-xs font-semibold text-orange-200/80 tracking-wide mt-0.5">
                Hyper-Local Heat Risk Governance & Predictive Biometeorology
              </p>
            </div>
          </div>

          {/* Large Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] text-white drop-shadow-sm">
              Authoritative Heat Intelligence for Every Citizen & Critical Agency
            </h1>
            <p className="text-sm sm:text-base text-slate-200/90 font-normal leading-relaxed max-w-2xl drop-shadow-xs">
              Protecting citizens, outdoor workforces, clinical emergency grids, and municipal administrations against extreme heat anomalies through live biometeorological sensors, automated escalation playbooks, and Supabase cloud persistence.
            </p>
          </div>

          {/* 4 Multi-Role Value Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-2xl">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Citizens & Outdoor Workers</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Personal WBGT & UTCI, 5-day heatwave curve, shaded walking routes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Healthcare Grid</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Hospital emergency surge models, cooling bath & cold saline reserves.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Municipal Corporation</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Ward vulnerability index, shade shortfall mapping, water kiosks.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-red-500/20 flex items-center justify-center text-red-300 shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Disaster Authority EOC</h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Multi-district heat emergency directives & inter-agency operations.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Supabase Auth & Database Connected
            </span>
            <span>•</span>
            <span>Row-Level Security (RLS)</span>
            <span>•</span>
            <button
              onClick={() => {
                fetchPendingRequests();
                setMode('approvals');
              }}
              className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer"
            >
              Institutional Approvals Desk
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: MULTI-PURPOSE AUTH CARD                        */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 w-full max-w-md relative overflow-hidden">
            {/* Subtle Top Accent Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-600" />

            {/* View Mode Tabs */}
            <div className="flex items-center justify-between mb-5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setValidationError(null);
                  clearError();
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'signin' || mode === 'otp'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setValidationError(null);
                  clearError();
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('institutional');
                  setValidationError(null);
                  clearError();
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'institutional'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Request Access
              </button>
            </div>

            {/* Error Banner */}
            {activeError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">{activeError}</div>
              </div>
            )}

            {/* Info Message Banner */}
            {infoMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">{infoMessage}</div>
              </div>
            )}

            {/* PENDING APPROVAL SCREEN IF CURRENT USER IS PENDING */}
            {user && user.approval_status === 'pending' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-5 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Institutional Access Pending Approval</span>
                </div>
                <p>
                  Your registration for <strong>{user.role.toUpperCase()}</strong> workspace has been submitted and is currently under review by your department authorized official.
                </p>
                <p className="text-[11px] text-amber-800">
                  You will receive access to your institutional command dashboard as soon as the request is authorized.
                </p>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 1: SIGN IN MODE (Email/Password + Google + OTP)          */}
            {/* ============================================================== */}
            {mode === 'signin' && (
              <>
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Sign in to access your authorized climate safety workspace.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@domain.gov.in"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        Sign in with OTP code
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Google Sign In Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="bg-white px-2">Or continue with</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={isLoading}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-[0.99] text-slate-700 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
                {typeof window !== 'undefined' && window.self !== window.top && (
                  <p className="mt-2 text-[10px] text-center text-slate-500">
                    Running in preview frame. Google Sign-In will open in a secure popup tab, or{' '}
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 font-bold hover:underline"
                    >
                      open full window
                    </a>.
                  </p>
                )}
              </>
            )}

            {/* ============================================================== */}
            {/* VIEW 2: OTP VERIFICATION MODE                                */}
            {/* ============================================================== */}
            {mode === 'otp' && (
              <div>
                <div className="mb-4">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-2">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Enter Verification Code
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    We sent a secure single-use code to{' '}
                    <strong className="text-slate-800">{otpSentEmail}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-black py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <button
                      type="button"
                      onClick={() => setMode('signin')}
                      className="hover:underline text-slate-600"
                    >
                      ← Back to password sign-in
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="text-orange-600 font-bold hover:underline"
                    >
                      Resend code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 3: CITIZEN / WORKER REGISTRATION                         */}
            {/* ============================================================== */}
            {mode === 'signup' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Create Account
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Direct public registration for citizens and outdoor workforces.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('citizen')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                          regRole === 'citizen'
                            ? 'bg-orange-50 border-orange-500 text-orange-950 ring-1 ring-orange-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-orange-600" />
                        <span>Citizen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('worker')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                          regRole === 'worker'
                            ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <HardHat className="w-3.5 h-3.5 text-amber-600" />
                        <span>Outdoor Worker</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Create Password
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <span>Create Account & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 4: INSTITUTIONAL ACCESS REQUEST                          */}
            {/* ============================================================== */}
            {mode === 'institutional' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Institutional Access Request
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Municipal, Healthcare, and Disaster Management accounts require verification.
                  </p>
                </div>

                {submittedRequestId ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Request Dispatched</span>
                    </div>
                    <p>
                      Your access application has been recorded under reference{' '}
                      <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded text-[11px] font-bold">
                        {submittedRequestId}
                      </code>
                      .
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      The designated authority for your department will review the credentials. You will receive an email once approved.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedRequestId(null);
                        setMode('signin');
                      }}
                      className="mt-2 w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInstitutionalSubmit} className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Requested Authority Role
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInstRole('municipal')}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center ${
                            instRole === 'municipal'
                              ? 'bg-blue-50 border-blue-500 text-blue-950 ring-1 ring-blue-500/30'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Municipal
                        </button>
                        <button
                          type="button"
                          onClick={() => setInstRole('healthcare')}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center ${
                            instRole === 'healthcare'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/30'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Healthcare
                        </button>
                        <button
                          type="button"
                          onClick={() => setInstRole('disaster_management')}
                          className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center ${
                            instRole === 'disaster_management'
                              ? 'bg-red-50 border-red-500 text-red-950 ring-1 ring-red-500/30'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          Disaster
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Full Name</label>
                        <input
                          type="text"
                          value={instName}
                          onChange={(e) => setInstName(e.target.value)}
                          placeholder="Dr. Rajesh Patil"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Official Email</label>
                        <input
                          type="email"
                          value={instEmail}
                          onChange={(e) => setInstEmail(e.target.value)}
                          placeholder="r.patil@pmc.gov.in"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Organization</label>
                        <input
                          type="text"
                          value={instOrg}
                          onChange={(e) => setInstOrg(e.target.value)}
                          placeholder="PMC / SGH / DDMA"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Department</label>
                        <input
                          type="text"
                          value={instDept}
                          onChange={(e) => setInstDept(e.target.value)}
                          placeholder="Disaster Ops / Emergency"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">City / District</label>
                        <input
                          type="text"
                          value={instCity}
                          onChange={(e) => setInstCity(e.target.value)}
                          placeholder="Pune"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Contact Phone</label>
                        <input
                          type="tel"
                          value={instPhone}
                          onChange={(e) => setInstPhone(e.target.value)}
                          placeholder="+91 20 ..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Operational Purpose</label>
                      <input
                        type="text"
                        value={instJustification}
                        onChange={(e) => setInstJustification(e.target.value)}
                        placeholder="e.g. Ward misting coordinator / Emergency ICU Lead"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Request for Verification</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* VIEW 5: INSTITUTIONAL APPROVALS DESK MODAL                    */}
            {/* ============================================================== */}
            {mode === 'approvals' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Institutional Review Desk</h3>
                    <p className="text-[11px] text-slate-500">Approve or reject pending access requests</p>
                  </div>
                  <button
                    onClick={() => setMode('signin')}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {approvalsError && (
                  <div className="mb-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">{approvalsError}</div>
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {isLoadingRequests ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading requests...</div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">No requests pending review.</div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div key={req.id} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-slate-900">{req.full_name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                              req.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {req.email} • {req.organization}
                        </div>
                        <div className="text-[10px] text-slate-500">Role: {req.requested_role}</div>

                        {req.status === 'pending' && (
                          <div className="mt-2 flex items-center gap-1.5 pt-1.5 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleReviewRequest(req.id, 'approved')}
                              className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewRequest(req.id, 'rejected')}
                              className="flex-1 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="mt-3 w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Close Desk
                </button>
              </div>
            )}

            {/* Quick Demo Profiles (All 5 Roles) */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Instant Demo Access (All 5 Roles):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('citizen')}
                  className="px-2 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 text-[11px] font-bold text-left truncate transition-colors border border-orange-200/80 cursor-pointer"
                >
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('worker')}
                  className="px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold text-left truncate transition-colors border border-amber-200/80 cursor-pointer"
                >
                  Outdoor Worker
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('healthcare')}
                  className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold text-left truncate transition-colors border border-emerald-200/80 cursor-pointer"
                >
                  Healthcare
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('municipal')}
                  className="px-2 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-bold text-left truncate transition-colors border border-blue-200/80 cursor-pointer"
                >
                  Municipality
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('disaster_management')}
                  className="col-span-2 sm:col-span-1 px-2 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-900 text-[11px] font-bold text-left truncate transition-colors border border-red-200/80 cursor-pointer"
                >
                  Disaster EOC
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
