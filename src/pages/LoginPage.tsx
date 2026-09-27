import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useWorkspace } from '../context/WorkspaceContext.js';
import { useNavigationHistory } from '../context/NavigationHistoryContext.js';
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
  Flame,
  Building,
  HeartPulse,
  Radio,
  Users,
  Compass,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const { setWorkspace } = useWorkspace();
  const { recordNavigation } = useNavigationHistory();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    const success = await login(trimmedEmail, password);
    if (success) {
      recordNavigation('#select');
      setWorkspace('portal');
    }
  };

  const handleGoogleLogin = async () => {
    setValidationError(null);
    clearError();
    const success = await loginWithGoogle();
    if (success) {
      recordNavigation('#select');
      setWorkspace('portal');
    }
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setValidationError(null);
    clearError();
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
        {/* Layered Lighting & Contrast Scrims */}
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
              Predictive Heat Intelligence for Every Life & Critical Operation
            </h1>
            <p className="text-sm sm:text-base text-slate-200/90 font-normal leading-relaxed max-w-2xl drop-shadow-xs">
              Protecting citizens, outdoor workforces, clinical grids, and municipal administrations against extreme heat anomalies through authoritative biometeorological sensors, automated escalation playbooks, and emergency response coordination.
            </p>
          </div>

          {/* Small Feature / Value Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-w-2xl">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">
                  Real-Time WBGT & UTCI Sensors
                </h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Precision physiological thermal stress & radiant heat indexing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">
                  Hospital Surge Preparedness
                </h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Early clinical forecasting for heatstroke & excess admissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">
                  Ward-Level Civic Intervention
                </h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Shade deficit mapping, water kiosks, and cooling arbours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-sm">
              <div className="w-7 h-7 rounded-xl bg-red-500/20 flex items-center justify-center text-red-300 shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">
                  Regional Command Escalation
                </h4>
                <p className="text-[11px] text-slate-300 font-medium leading-snug">
                  Integrated disaster authorities & emergency incident coordination.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="pt-2 flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Authoritative Meteorological Telemetry
            </span>
            <span>•</span>
            <span>Multi-Agency Architecture</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: CLEAN WHITE LOGIN CARD                         */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl border border-slate-200/80 w-full max-w-md relative overflow-hidden">
            {/* Subtle Top Accent Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-red-600" />

            {/* Card Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  ThermaShield<span className="text-orange-600 font-black">360</span>
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Sign in to access your authorized climate safety workspace.
              </p>
            </div>

            {/* Error / Validation Alert Banner */}
            {activeError && (
              <div
                role="alert"
                className="mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{activeError}</span>
                </div>
              </div>
            )}

            {/* Forgot Password Notice */}
            {forgotNotice && (
              <div className="mb-5 p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  For this prototype demo, you can enter any password (e.g. <code>demo1234</code>) or select a quick profile below.
                </span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (activeError) setValidationError(null);
                    }}
                    placeholder="name@organization.gov.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotNotice(true)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (activeError) setValidationError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>Remember my workspace</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating Credentials...</span>
                  </div>
                ) : (
                  <>
                    <span>Sign In to ThermaShield 360</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="bg-white px-3">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-[0.99] text-slate-700 border border-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-2xs"
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

            {/* Quick Demo Fill Profiles */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Quick Demo Access:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoFill('citizen@thermashield.org')}
                  className="px-2 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 text-[11px] font-bold text-left truncate transition-colors border border-orange-200/80"
                >
                  Citizen / Worker
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('cmo@sgh-hospital.org')}
                  className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold text-left truncate transition-colors border border-emerald-200/80"
                >
                  Healthcare Grid
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('director@pmc.gov.in')}
                  className="px-2 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold text-left truncate transition-colors border border-blue-200/80"
                >
                  Municipality
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('commander@ddma-eoc.gov.in')}
                  className="px-2 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold text-left truncate transition-colors border border-red-200/80"
                >
                  Disaster Authority
                </button>
              </div>
            </div>

            {/* Bottom Create Account Link */}
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Don't have an operational account?{' '}
                <button
                  type="button"
                  onClick={() => handleDemoFill('citizen@thermashield.org')}
                  className="text-orange-600 hover:text-orange-700 font-bold hover:underline"
                >
                  Create account / Request access
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
