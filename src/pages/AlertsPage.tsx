import React from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import {
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Droplets,
  Sun,
  Home,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    riskCurrent,
    location,
    isLoading,
    apiError,
    refreshData,
    isRefreshing,
  } = useCitizen();

  // Find the most severe active alert
  const primaryAlert = React.useMemo(() => {
    if (!alerts || alerts.length === 0) return null;

    // Priority rank: Critical > Harmful > High > Awareness
    const sorted = [...alerts].sort((a, b) => {
      const rank = (sev: string) => {
        const s = sev.toLowerCase();
        if (s.includes('critical')) return 4;
        if (s.includes('harmful') || s.includes('heat alert')) return 3;
        if (s.includes('high') || s.includes('prepare')) return 2;
        if (s.includes('awareness') || s.includes('developing')) return 1;
        return 0;
      };
      return rank(b.severity) - rank(a.severity);
    });

    const top = sorted[0];
    const s = (top.severity || '').toLowerCase();
    // Only return if it's an actual active alert
    if (s.includes('normal') || s === '') return null;
    return top;
  }, [alerts]);

  // Determine severity tier: 'extreme' (red) | 'high' (orange) | 'awareness' (yellow) | 'none' (green)
  const severityTier = React.useMemo<'extreme' | 'high' | 'awareness' | 'none'>(() => {
    if (primaryAlert) {
      const s = primaryAlert.severity.toLowerCase();
      if (s.includes('critical') || s.includes('harmful') || primaryAlert.riskLevel === 'Extreme') {
        return 'extreme';
      }
      if (s.includes('high') || s.includes('prepare') || primaryAlert.riskLevel === 'High') {
        return 'high';
      }
      if (s.includes('awareness') || s.includes('developing') || primaryAlert.riskLevel === 'Moderate') {
        return 'awareness';
      }
    }

    // Fallback to riskCurrent if available
    const rc = riskCurrent?.overallRiskLevel;
    if (rc === 'Extreme') return 'extreme';
    if (rc === 'High') return 'high';
    if (rc === 'Moderate') return 'awareness';

    return 'none';
  }, [primaryAlert, riskCurrent]);

  const wardDisplayName = location.ward.name.includes(':')
    ? location.ward.name.split(':')[1].trim()
    : location.ward.name;

  // Clean time period string
  const timePeriod = primaryAlert?.peakPeriod
    ? primaryAlert.peakPeriod
    : primaryAlert?.when
    ? primaryAlert.when.replace(/Expected:\s*/i, '')
    : '12:30 PM – 4:30 PM';

  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-slate-200 rounded-full" />
        <div className="h-48 bg-white rounded-3xl border border-black/5 shadow-sm p-6 space-y-4">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
          <div className="h-5 w-48 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-44 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-28 bg-white rounded-2xl border border-black/5" />
            <div className="h-28 bg-white rounded-2xl border border-black/5" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (apiError && !primaryAlert) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-6 bg-white rounded-3xl border border-rose-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Unable to load alert status</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            We could not fetch live thermal alert data for your area. Please check your connection.
          </p>
          <button
            onClick={() => refreshData()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-black transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // Visual configuration based on severity tier
  const config = {
    extreme: {
      emoji: '🔴',
      title: 'EXTREME HEAT ALERT',
      riskLevel: 'Extreme',
      explanation: 'High heat risk is affecting your area.',
      badgeBg: 'bg-red-500',
      badgeText: 'text-white',
      cardBg: 'bg-gradient-to-br from-red-50/90 via-rose-50/50 to-white',
      borderColor: 'border-red-300',
      titleColor: 'text-red-900',
      subColor: 'text-red-950',
      accentColor: 'text-red-600',
      pillBg: 'bg-red-100 text-red-800 border-red-200',
      actions: [
        {
          priority: 'PRIORITY 1',
          title: 'Avoid unnecessary outdoor activity',
          desc: 'Stay indoors during peak heat hours (12:30 PM – 4:30 PM).',
          icon: AlertTriangle,
          bgClass: 'bg-red-50/60 border-red-200 text-red-950',
          badgeClass: 'bg-red-600 text-white',
        },
        {
          priority: 'PRIORITY 2',
          title: 'Drink water regularly',
          desc: 'Drink water, ORS, or lemon water frequently even if not thirsty.',
          icon: Droplets,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-blue-600 text-white',
        },
        {
          priority: 'PRIORITY 3',
          title: 'Stay in shade/cooling areas',
          desc: 'Keep rooms shaded, use fans, or visit nearby misted cooling spots.',
          icon: Home,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-800 text-white',
        },
        {
          priority: 'PRIORITY 4',
          title: 'Move outdoor activity to a safer time',
          desc: 'Reschedule essential tasks to early morning or after 6 PM.',
          icon: Clock,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-700 text-white',
        },
      ],
    },
    high: {
      emoji: '🟠',
      title: 'HIGH HEAT ALERT',
      riskLevel: 'High',
      explanation: 'Unusually high daytime heat is affecting your area.',
      badgeBg: 'bg-orange-500',
      badgeText: 'text-white',
      cardBg: 'bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white',
      borderColor: 'border-orange-300',
      titleColor: 'text-orange-950',
      subColor: 'text-orange-950',
      accentColor: 'text-orange-600',
      pillBg: 'bg-orange-100 text-orange-900 border-orange-200',
      actions: [
        {
          priority: 'PRIORITY 1',
          title: 'Limit direct sun exposure',
          desc: 'Keep outdoor trips brief and seek shade whenever walking outside.',
          icon: Sun,
          bgClass: 'bg-orange-50/60 border-orange-200 text-orange-950',
          badgeClass: 'bg-orange-600 text-white',
        },
        {
          priority: 'PRIORITY 2',
          title: 'Drink water regularly',
          desc: 'Carry a refillable water bottle and hydrate consistently.',
          icon: Droplets,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-blue-600 text-white',
        },
        {
          priority: 'PRIORITY 3',
          title: 'Stay in shade/cooling areas',
          desc: 'Rest in well-ventilated or shaded areas during afternoon hours.',
          icon: Home,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-800 text-white',
        },
        {
          priority: 'PRIORITY 4',
          title: 'Move outdoor activity to a safer time',
          desc: 'Complete heavy outdoor chores before 11 AM or in the evening.',
          icon: Clock,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-700 text-white',
        },
      ],
    },
    awareness: {
      emoji: '🟡',
      title: 'HEAT AWARENESS ALERT',
      riskLevel: 'Moderate',
      explanation: 'Moderate heat conditions expected across your sector.',
      badgeBg: 'bg-amber-400',
      badgeText: 'text-slate-950',
      cardBg: 'bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-white',
      borderColor: 'border-amber-300',
      titleColor: 'text-amber-950',
      subColor: 'text-amber-950',
      accentColor: 'text-amber-600',
      pillBg: 'bg-amber-100 text-amber-900 border-amber-200',
      actions: [
        {
          priority: 'PRIORITY 1',
          title: 'Drink water regularly',
          desc: 'Drink water steadily throughout the day before stepping out.',
          icon: Droplets,
          bgClass: 'bg-amber-50/60 border-amber-200 text-amber-950',
          badgeClass: 'bg-amber-500 text-slate-950',
        },
        {
          priority: 'PRIORITY 2',
          title: 'Wear light sun protection',
          desc: 'Use an umbrella, cap, or sunglasses if walking in direct sunlight.',
          icon: Sun,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-700 text-white',
        },
        {
          priority: 'PRIORITY 3',
          title: 'Check on family and pets',
          desc: 'Ensure children, seniors, and domestic animals have ample shade and water.',
          icon: Sparkles,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-800 text-white',
        },
      ],
    },
    none: {
      emoji: '🟢',
      title: 'NO ACTIVE HEAT ALERT',
      riskLevel: 'Normal',
      explanation: 'Current conditions do not require an immediate warning.',
      badgeBg: 'bg-emerald-600',
      badgeText: 'text-white',
      cardBg: 'bg-gradient-to-br from-emerald-50/80 via-teal-50/30 to-white',
      borderColor: 'border-emerald-200',
      titleColor: 'text-emerald-950',
      subColor: 'text-emerald-900',
      accentColor: 'text-emerald-600',
      pillBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      actions: [
        {
          priority: 'RECOMMENDED',
          title: 'Drink water regularly',
          desc: 'Maintain daily hydration throughout normal outdoor routines.',
          icon: Droplets,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-emerald-600 text-white',
        },
        {
          priority: 'RECOMMENDED',
          title: 'Keep sun protection ready',
          desc: 'Carry shade or a light cap for bright sunny hours.',
          icon: Sun,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-700 text-white',
        },
        {
          priority: 'RECOMMENDED',
          title: 'Stay tuned for updates',
          desc: 'We will notify you immediately if high heat conditions develop.',
          icon: ShieldCheck,
          bgClass: 'bg-white border-slate-200 text-slate-900',
          badgeClass: 'bg-slate-800 text-white',
        },
      ],
    },
  }[severityTier];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* 1. WHAT IS HAPPENING? -> CURRENT ALERT */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              CURRENT ALERT
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">What is happening?</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${config.pillBg}`}
          >
            Risk Level: {config.riskLevel}
          </span>
        </div>

        {/* Large Hero Alert Card */}
        <div
          className={`rounded-3xl border ${config.borderColor} ${config.cardBg} p-6 sm:p-8 shadow-sm transition-all`}
        >
          {/* Alert Title with Emoji */}
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl leading-none select-none">{config.emoji}</span>
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${config.titleColor}`}>
              {config.title}
            </h1>
          </div>

          {/* Very Short Explanation */}
          <p className={`mt-3 text-base sm:text-lg font-medium ${config.subColor} leading-snug`}>
            {config.explanation}
          </p>

          {/* Location & Time Period */}
          <div className="mt-6 pt-5 border-t border-black/5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <span>
                {wardDisplayName}, Pune
              </span>
            </div>
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                {severityTier === 'none' ? 'Today • Normal conditions' : timePeriod}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHAT SHOULD I DO NOW? -> WHAT TO DO NOW */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            WHAT TO DO NOW
          </span>
          <span className="text-xs text-slate-300">•</span>
          <span className="text-xs font-semibold text-slate-500">What should I do now?</span>
        </div>

        {/* Large, Easy-to-read Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.actions.map((act, index) => {
            const Icon = act.icon;
            return (
              <div
                key={index}
                className={`p-5 sm:p-6 rounded-3xl border shadow-xs transition-all flex flex-col justify-between ${act.bgClass}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full ${act.badgeClass}`}
                    >
                      {act.priority}
                    </span>
                    <div className="p-2 rounded-xl bg-black/5">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold tracking-tight text-slate-900 leading-snug">
                    {act.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                    {act.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
