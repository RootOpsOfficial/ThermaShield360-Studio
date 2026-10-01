import React, { useState, useEffect, useRef } from 'react';
import {
  probeIntelligenceReadiness,
  getColdStartMessage,
  IntelligenceReadinessReport,
} from '../services/intelligenceReadinessService.js';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  CloudSun,
  Flame,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  XCircle,
} from 'lucide-react';

interface IntelligenceBootScreenProps {
  lat?: number;
  lng?: number;
  onReady: () => void;
  onContinueDegraded?: () => void;
}

export const IntelligenceBootScreen: React.FC<IntelligenceBootScreenProps> = ({
  lat = 18.5204,
  lng = 73.8567,
  onReady,
  onContinueDegraded,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [report, setReport] = useState<IntelligenceReadinessReport | null>(null);
  const [isProbing, setIsProbing] = useState(true);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const attemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  // Track elapsed seconds
  useEffect(() => {
    isMountedRef.current = true;
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= 65 && !report) {
            setIsTimedOut(true);
          }
          return next;
        });
      }
    }, 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [report]);

  // Main polling routine
  const runProbe = async () => {
    if (!isMountedRef.current) return;
    setIsProbing(true);
    setIsTimedOut(false);
    setErrorDetails(null);
    attemptsRef.current += 1;

    try {
      const data = await probeIntelligenceReadiness(lat, lng, 12000);
      if (!isMountedRef.current) return;
      setReport(data);

      if (data.status === 'ready') {
        // Auto-transition when validated
        setTimeout(() => {
          if (isMountedRef.current) {
            onReady();
          }
        }, 800);
      } else if (data.status === 'warming') {
        // Keep polling if warming
        setTimeout(() => {
          if (isMountedRef.current && !report) {
            runProbe();
          }
        }, 3000);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.warn('[IntelligenceBoot] Probe notice:', err?.message);
      // If we haven't timed out, retry with backoff
      if (elapsedSeconds < 55) {
        setTimeout(() => {
          if (isMountedRef.current && !report) {
            runProbe();
          }
        }, 4000);
      } else {
        setIsTimedOut(true);
        setErrorDetails(err?.message || 'Connection timed out while waking backend.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsProbing(false);
      }
    }
  };

  useEffect(() => {
    runProbe();
  }, [lat, lng]);

  const stages = [
    {
      id: 'backend',
      label: 'Backend connection',
      icon: Server,
      status: report?.backend ? 'ready' : isProbing ? 'checking' : isTimedOut ? 'failed' : 'pending',
    },
    {
      id: 'database',
      label: 'Database connection',
      icon: Database,
      status: report?.database ? 'ready' : report ? 'failed' : isProbing ? 'checking' : 'pending',
    },
    {
      id: 'weather',
      label: 'Weather synchronization',
      icon: CloudSun,
      status:
        report?.weather === 'verified'
          ? 'ready'
          : report?.weather === 'degraded'
          ? 'degraded'
          : isProbing
          ? 'checking'
          : 'pending',
    },
    {
      id: 'forecast',
      label: 'Forecast synchronization',
      icon: Layers,
      status:
        report?.forecast === 'verified'
          ? 'ready'
          : report?.forecast === 'degraded'
          ? 'degraded'
          : isProbing
          ? 'checking'
          : 'pending',
    },
    {
      id: 'thermal',
      label: 'Thermal stress engine',
      icon: Flame,
      status: report?.thermalEngine === 'ready' ? 'ready' : isProbing ? 'checking' : 'pending',
    },
    {
      id: 'risk',
      label: 'Human heat-risk engine',
      icon: Activity,
      status: report?.riskEngine === 'ready' ? 'ready' : isProbing ? 'checking' : 'pending',
    },
    {
      id: 'hyperlocal',
      label: 'Hyperlocal intelligence',
      icon: ShieldCheck,
      status:
        report?.hyperlocal === 'ready'
          ? 'ready'
          : report?.hyperlocal === 'partial'
          ? 'degraded'
          : isProbing
          ? 'checking'
          : 'pending',
    },
    {
      id: 'dashboard',
      label: 'Dashboard readiness',
      icon: Sparkles,
      status:
        report?.status === 'ready'
          ? 'ready'
          : report?.status === 'degraded'
          ? 'degraded'
          : isProbing
          ? 'checking'
          : 'pending',
    },
  ];

  const stageMessage = isTimedOut
    ? 'ThermaShield Intelligence is temporarily unavailable.'
    : report?.status === 'degraded'
    ? 'Multi-source intelligence partially available.'
    : report?.status === 'ready'
    ? 'Validated intelligence ready.'
    : getColdStartMessage(elapsedSeconds);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 font-sans selection:bg-orange-500/20">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-red-600 text-white shadow-lg shadow-orange-500/25 mb-1">
            <Flame className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            ThermaShield<span className="text-orange-600">360</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500">
            Waking up the Heat Intelligence Engine...
          </p>
        </div>

        {/* Live Narrative Status Banner */}
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            isTimedOut
              ? 'bg-red-50 border-red-200 text-red-800'
              : report?.status === 'degraded'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : report?.status === 'ready'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isTimedOut ? (
              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : report?.status === 'ready' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : report?.status === 'degraded' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-orange-500 animate-spin shrink-0" />
            )}
            <span className="font-semibold">{stageMessage}</span>
          </div>
          {elapsedSeconds > 0 && !isTimedOut && report?.status !== 'ready' && (
            <span className="text-[10px] font-mono text-slate-400 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
              {elapsedSeconds}s
            </span>
          )}
        </div>

        {/* Real Readiness Stages Checklist */}
        <div className="space-y-2 py-1">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isReady = stage.status === 'ready';
            const isDegraded = stage.status === 'degraded';
            const isFailed = stage.status === 'failed';
            const isChecking = stage.status === 'checking';

            return (
              <div
                key={stage.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      isReady
                        ? 'bg-emerald-100 text-emerald-700'
                        : isDegraded
                        ? 'bg-amber-100 text-amber-700'
                        : isFailed
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isReady ? 'text-slate-900' : isDegraded ? 'text-amber-900' : 'text-slate-600'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isReady ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  ) : isDegraded ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3 h-3" />
                      Partial
                    </span>
                  ) : isFailed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      <XCircle className="w-3 h-3" />
                      Failed
                    </span>
                  ) : isChecking ? (
                    <span className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          {report?.status === 'degraded' ? (
            <div className="space-y-2">
              <button
                onClick={() => (onContinueDegraded ? onContinueDegraded() : onReady())}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>Continue with Degraded Intelligence</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
              </button>
              <button
                onClick={runProbe}
                disabled={isProbing}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                <span>Retry Synchronization</span>
              </button>
            </div>
          ) : isTimedOut ? (
            <div className="space-y-2">
              <button
                onClick={runProbe}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Backend Connection</span>
              </button>
              <button
                onClick={onReady}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 underline underline-offset-2 py-1 cursor-pointer"
              >
                Proceed to workspace anyway (Offline Mode)
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Preparing validated intelligence...</span>
              <button
                onClick={onReady}
                className="text-slate-500 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
              >
                Skip wait
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
