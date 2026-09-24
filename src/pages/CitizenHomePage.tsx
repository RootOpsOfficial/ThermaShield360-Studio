import React, { useState, useEffect } from 'react';
import { useCitizen } from '../context/CitizenContext.js';
import { InteractiveGisMap } from '../components/InteractiveGisMap.js';
import { ThermalStressBlock } from '../components/ThermalStressBlock.js';
import {
  Flame,
  ThermometerSun,
  ArrowRight,
  Cross,
  Clock,
  MapPin,
  TrendingUp,
  CalendarRange,
  AlertCircle,
  ExternalLink,
  Phone,
  Compass,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sun,
  Wind,
  Activity,
  Gauge,
  Sparkles,
  Sunrise,
  Sunset,
  Moon,
  Star,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Users,
  Search,
} from 'lucide-react';

export const CitizenHomePage: React.FC = () => {
  const {
    weatherCurrent,
    weatherForecast,
    thermalCurrent,
    riskCurrent,
    heatwaveStatus,
    healthcareFacilities,
    location,
    selectWard,
    setCustomLocation,
    formatTemp,
    setActivePage,
  } = useCitizen();

  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [expandedHeatwavePeriod, setExpandedHeatwavePeriod] = useState<string | null>('1-30-days');

  const todayDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const currentRisk = riskCurrent?.overallRiskLevel || 'High';
  const currentTemp = weatherCurrent?.temp ?? 38.6;
  const isHeatwave = heatwaveStatus?.status.includes('Heatwave');
  const peakTemp = weatherForecast?.[0]?.tempMax ?? currentTemp + 2.8;
  const peakTime = riskCurrent?.peakPeriod || '12:30 PM – 04:30 PM';
  const compositeVulnerability = riskCurrent?.riskScore ?? 78;

  // Curated major locations/cities across India & Pune
  const ALL_POPULAR_LOCATIONS = [
    { name: 'Ward 14: Shivajinagar - Ghole Road, Pune', lat: 18.5314, lng: 73.8446 },
    { name: 'Ward 21: Kasba Peth - Vishrambaug Wada, Pune', lat: 18.5178, lng: 73.8558 },
    { name: 'Ward 8: Kothrud - Bavdhan, Pune', lat: 18.5074, lng: 73.8077 },
    { name: 'Ward 3: Aundh - Baner - Balewadi, Pune', lat: 18.5584, lng: 73.8072 },
    { name: 'Ward 18: Hadapsar - Magarpatta, Pune', lat: 18.5089, lng: 73.9259 },
    { name: 'Ward 2: Yerwada - Kalas - Dhanori, Pune', lat: 18.5529, lng: 73.8797 },
    { name: 'Ward 5: Viman Nagar - Nagar Road, Pune', lat: 18.5679, lng: 73.9143 },
    { name: 'Ward 25: Dhankawadi - Sahakarnagar, Pune', lat: 18.4739, lng: 73.8532 },
    { name: 'Ward 11: Bibwewadi, Pune', lat: 18.4691, lng: 73.8643 },
    { name: 'Ward 28: Sinhagad Road - Vadgaon, Pune', lat: 18.4721, lng: 73.8184 },
    { name: 'Mumbai, Maharashtra', lat: 19.076, lng: 72.8777 },
    { name: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882 },
    { name: 'Nashik, Maharashtra', lat: 19.9975, lng: 73.7898 },
    { name: 'New Delhi, Delhi NCR', lat: 28.6139, lng: 77.209 },
    { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad, Telangana', lat: 17.385, lng: 78.4867 },
    { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
    { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
    { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873 },
  ];

  const filteredLocations = ALL_POPULAR_LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  // Dynamic greeting based on time of day (Morning, Afternoon, Evening, Night)
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return {
        text: 'Good Morning',
        icon: <Sun className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 shrink-0 animate-pulse" />,
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        text: 'Good Afternoon',
        icon: <Sun className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500 shrink-0" />,
      };
    }
    if (hour >= 17 && hour < 21) {
      return {
        text: 'Good Evening',
        icon: <Sunset className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 shrink-0" />,
      };
    }
    return {
      text: 'Good Night',
      icon: <Moon className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400 shrink-0" />,
    };
  };

  const greeting = getGreetingData();

  // Evaluate precise health impact level and advice sentence based on currentTemp, peakTime, and compositeVulnerability
  const getHealthImpactData = () => {
    // Determine overall condition: High, Moderate, or Low
    let healthRiskLevel: 'High' | 'Moderate' | 'Low' = 'Moderate';
    if (currentTemp >= 38.0 || compositeVulnerability >= 70 || currentRisk === 'Extreme' || currentRisk === 'High') {
      healthRiskLevel = 'High';
    } else if (currentTemp <= 32.0 && compositeVulnerability <= 45 && currentRisk === 'Low') {
      healthRiskLevel = 'Low';
    } else {
      healthRiskLevel = 'Moderate';
    }

    let sentence = '';
    if (healthRiskLevel === 'High') {
      sentence = `At ${currentTemp.toFixed(1)}°C with an elevated vulnerability index of ${compositeVulnerability}/100, thermal stress on your cardiovascular system is HIGH — avoid direct sun exposure between ${peakTime}, stay strictly hydrated, and take frequent breaks in shaded or air-cooled locations.`;
    } else if (healthRiskLevel === 'Moderate') {
      sentence = `With an ambient temperature of ${currentTemp.toFixed(1)}°C and moderate vulnerability score of ${compositeVulnerability}/100, the health impact is MODERATE — exercise caution during the peak heat window of ${peakTime}, carry drinking water, and limit strenuous physical exertion outdoors.`;
    } else {
      sentence = `Current temperature is a comfortable ${currentTemp.toFixed(1)}°C with a mild vulnerability score of ${compositeVulnerability}/100, indicating a LOW health risk — routine outdoor transit and physical activities are safe with standard hydration.`;
    }

    return { healthRiskLevel, sentence };
  };

  const { healthRiskLevel, sentence: healthSentence } = getHealthImpactData();

  // Care advisory tailored for current temperature and condition
  const getCareAdvisory = () => {
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 19 || currentHour < 6;

    if (isNight) {
      if (currentTemp >= 30.0) {
        return `Night-time urban heat retention is active (${currentTemp.toFixed(1)}°C). Ensure cross-ventilation in sleeping quarters, drink 250ml water before bed, and use damp towels or fans to protect restorative sleep and cardiac rhythm.`;
      }
      return `Night cooling is in effect (${currentTemp.toFixed(1)}°C). Maintain gentle hydration, keep bedroom windows well-ventilated, and prepare for tomorrow's daytime heat cycle.`;
    }

    if (healthRiskLevel === 'High') {
      return `High Heat Precaution: Ambient temp is ${currentTemp.toFixed(1)}°C. Drink at least 250ml water or electrolytes every 30 minutes, strictly avoid direct solar exposure during ${peakTime}, wear loose light-colored cotton garments, and seek shaded shelter immediately if experiencing dizziness or nausea.`;
    }

    if (healthRiskLevel === 'Moderate') {
      return `Moderate Heat Precaution: Ambient temp is ${currentTemp.toFixed(1)}°C. Carry drinking water, schedule strenuous outdoor tasks outside the ${peakTime} peak window, wear protective headwear, and take periodic rest in the shade.`;
    }

    return `Comfortable Conditions: Ambient temperature of ${currentTemp.toFixed(1)}°C allows safe outdoor activities. Maintain standard hydration, wear light comfortable clothes, and monitor daytime sun intensity.`;
  };

  const careAdvisory = getCareAdvisory();

  // Dynamic background styling:
  // - When heat is low: green + blue
  // - Otherwise (moderate/high): orange + white (same for day and night)
  const getBlock1BackgroundStyle = () => {
    if (healthRiskLevel === 'Low') {
      return {
        containerClass:
          'bg-gradient-to-br from-emerald-100/95 via-teal-50/80 to-sky-100/90 border-2 border-teal-400/80 text-slate-900 shadow-md',
        badgeClass: 'bg-emerald-600 text-white shadow-xs',
        headingClass: 'text-slate-950',
        subTextClass: 'text-emerald-900',
        glowColor: 'from-emerald-400/30 via-teal-300/20 to-sky-400/25',
        cardClass: 'bg-white/95 border border-teal-200/90 text-slate-900 shadow-xs',
        cardLabelClass: 'text-teal-700 font-bold',
        cardValueClass: 'text-slate-950',
        cardSubTextClass: 'text-slate-600',
        cardDivider: 'border-teal-100',
        iconBg: 'bg-teal-600 text-white',
        careBoxClass: 'bg-white/95 border border-teal-200/90 text-slate-900 shadow-xs',
        careIconClass: 'text-teal-600',
        careTitleClass: 'text-teal-900',
        careTextClass: 'text-slate-700',
        headerBorder: 'border-teal-300/40',
        buttonClass: 'bg-slate-950 hover:bg-black text-white shadow-sm',
      };
    }

    // orange + white
    return {
      containerClass:
        'bg-gradient-to-br from-orange-100/95 via-white to-amber-50/90 border-2 border-orange-300/90 text-slate-900 shadow-md',
      badgeClass: 'bg-orange-500 text-white shadow-xs',
      headingClass: 'text-slate-950',
      subTextClass: 'text-orange-900',
      glowColor: 'from-orange-400/25 via-amber-300/20 to-orange-200/15',
      cardClass: 'bg-white/95 border border-orange-200/90 text-slate-900 shadow-xs',
      cardLabelClass: 'text-orange-700 font-bold',
      cardValueClass: 'text-slate-950',
      cardSubTextClass: 'text-slate-600',
      cardDivider: 'border-orange-100',
      iconBg: 'bg-orange-500 text-white',
      careBoxClass: 'bg-white/95 border border-orange-200/90 text-slate-900 shadow-xs',
      careIconClass: 'text-orange-600',
      careTitleClass: 'text-orange-950',
      careTextClass: 'text-slate-700',
      headerBorder: 'border-orange-200/60',
      buttonClass: 'bg-slate-950 hover:bg-black text-white shadow-sm',
    };
  };

  const block1Style = getBlock1BackgroundStyle();

  const [currentTime, setCurrentTime] = useState<string>(() =>
    new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date())
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(
        new Intl.DateTimeFormat('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(new Date())
      );
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 4 Nearest healthcare facilities
  const nearestHealthcare = healthcareFacilities.slice(0, 4);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* HEADER: GREETING WITH SUN ICON, CITIZEN SUBTITLE, NON-BOLD LOCATION,       */}
      {/* AND RIGHT SIDE: TODAY WITH DATE BELOW                                     */}
      {/* ========================================================================= */}
      <section className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-black/5">
        <div>
          {/* 1. Icon of the sun then greeting based on morning/afternoon/evening/night */}
          <div className="flex items-center gap-2.5">
            {greeting.icon}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              {greeting.text}
            </h1>
          </div>

          {/* 2. Below of this: which user user this like CITIZEN */}
          <div className="mt-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              CITIZEN
            </span>
          </div>

          {/* 3. Below it in small text without bold: location with dropdown arrow. User can choose any location */}
          <div className="relative mt-1.5 inline-block">
            <button
              type="button"
              onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-600 text-xs font-normal transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-slate-600">{location.ward.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isLocationDropdownOpen ? 'rotate-180 text-orange-600' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu to choose any location/city */}
            {isLocationDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsLocationDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1.5 z-40 w-80 max-h-80 overflow-hidden flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                  {/* Search box for any location */}
                  <div className="p-2.5 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        placeholder="Search any city or Pune ward..."
                        className="w-full bg-transparent text-slate-800 placeholder-slate-400 outline-none text-xs"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-60">
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Locations & Wards
                    </div>

                    {filteredLocations.map((loc) => {
                      const isSelected =
                        location.ward.name.toLowerCase() === loc.name.toLowerCase() ||
                        location.ward.name.toLowerCase().includes(loc.name.toLowerCase().split(',')[0]) ||
                        loc.name.toLowerCase().includes(location.ward.name.toLowerCase().split(',')[0]);

                      return (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            const isWardItem = loc.name.toLowerCase().startsWith('ward ');
                            const matchedWard = isWardItem
                              ? location.allWards.find(
                                  (w) =>
                                    loc.name.toLowerCase().includes(w.name.toLowerCase().split(':')[0]) ||
                                    w.name.toLowerCase().includes(loc.name.toLowerCase().split(',')[0])
                                )
                              : null;

                            if (matchedWard) {
                              selectWard(matchedWard.id);
                            } else {
                              setCustomLocation(loc.name, loc.lat, loc.lng);
                            }
                            setIsLocationDropdownOpen(false);
                            setLocationSearchQuery('');
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                            isSelected
                              ? 'bg-orange-50 text-orange-900 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-orange-600' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{loc.name}</span>
                          </div>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}

                    {filteredLocations.length === 0 && (
                      <div className="p-3 text-center text-xs space-y-2">
                        <p className="text-slate-400">No preset matches for "{locationSearchQuery}"</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (locationSearchQuery.trim()) {
                              setCustomLocation(locationSearchQuery.trim(), location.lat, location.lng);
                              setIsLocationDropdownOpen(false);
                              setLocationSearchQuery('');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors"
                        >
                          Set "{locationSearchQuery.trim()}"
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side: Today, below it today's date */}
        <div className="text-right flex flex-col items-end justify-center">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-400 block">
            Today
          </span>
          <span className="text-sm sm:text-base lg:text-lg font-black text-slate-900 block mt-0.5">
            {todayDate}
          </span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOCK 1: HEAT RISK & EXPOSURE ASSESSMENT                                  */}
      {/* Green + blue when heat is low, orange + white when heat is moderate/high. */}
      {/* Three compact cards for Current Temp, Peak Risk Time/Temp, Vulnerability  */}
      {/* followed by the dedicated Precautionary Care Line below.                  */}
      {/* ========================================================================= */}
      <section
        className={`apple-card p-5 sm:p-6 rounded-3xl transition-colors duration-300 relative overflow-hidden ${block1Style.containerClass}`}
      >
        {/* Ambient glow decoration */}
        <div
          className={`absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br ${block1Style.glowColor} rounded-full blur-3xl pointer-events-none z-0`}
        />

        <div className="relative z-10 space-y-4 sm:space-y-5">
          {/* Header Row with Big Heading (clean, without thermal threat status or location) */}
          <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${block1Style.headerBorder}`}>
            <div className="flex items-center gap-3">
              <span
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${block1Style.iconBg}`}
              >
                <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </span>
              <div>
                <h2 className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight ${block1Style.headingClass}`}>
                  Heat Risk & Exposure Assessment
                </h2>
              </div>
            </div>

            {/* Shows whether it is High, Low, Moderate for health */}
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${block1Style.badgeClass}`}
              >
                {healthRiskLevel} Health Risk
              </span>
            </div>
          </div>

          {/* Compact 3-Block Grid: Temperature, Peak Risk Time & Temp, Composite Vulnerability */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. REAL CURRENT TEMPERATURE (COMPACT) */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl ${block1Style.cardClass} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${block1Style.cardLabelClass}`}>
                    Current Temperature
                  </span>
                  <Sun className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${block1Style.cardValueClass}`}>
                    {formatTemp(currentTemp)}
                  </span>
                </div>
              </div>

              <div className={`mt-2 pt-1.5 border-t ${block1Style.cardDivider} flex items-center justify-between text-xs`}>
                <span className={`${block1Style.cardSubTextClass} text-[11px] font-medium`}>Perceived Heat Index:</span>
                <span className="font-extrabold text-orange-600 text-xs">
                  {thermalCurrent ? `${thermalCurrent.heatIndex}°C` : `${(currentTemp + 3.5).toFixed(1)}°C`}
                </span>
              </div>
            </div>

            {/* 2. PEAK RISK TIME AND ITS TEMP (COMPACT) */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl ${block1Style.cardClass} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${block1Style.cardLabelClass}`}>
                    Peak Risk Time & Temp
                  </span>
                  <Clock className="w-3.5 h-3.5 text-red-500" />
                </div>
                <div className="mt-1 space-y-0.5">
                  <div className={`text-sm sm:text-base font-black leading-tight ${block1Style.cardValueClass}`}>
                    {peakTime}
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${block1Style.cardSubTextClass}`}>
                    <span className="text-[11px]">Expected Peak:</span>
                    <span className="font-black text-red-600 text-xs">
                      {formatTemp(peakTemp)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`mt-2 pt-1.5 border-t ${block1Style.cardDivider} text-[11px] ${block1Style.cardSubTextClass} font-medium`}>
                Diurnal solar zenith & heat load window
              </div>
            </div>

            {/* 3. COMPOSITE VULNERABILITY OUT OF 100 (COMPACT) */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl ${block1Style.cardClass} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${block1Style.cardLabelClass}`}>
                    Composite Vulnerability
                  </span>
                  <Gauge className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${block1Style.cardValueClass}`}>
                    {compositeVulnerability}
                  </span>
                  <span className="text-sm font-extrabold opacity-60">/ 100</span>
                </div>
              </div>

              <div className={`mt-2 pt-1.5 border-t ${block1Style.cardDivider} flex items-center justify-between text-xs`}>
                <span className={`${block1Style.cardSubTextClass} text-[11px] font-medium`}>Health Exposure Impact:</span>
                <span
                  className={`font-black uppercase text-xs ${
                    healthRiskLevel === 'High'
                      ? 'text-red-500'
                      : healthRiskLevel === 'Moderate'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {healthRiskLevel} Impact
                </span>
              </div>
            </div>
          </div>

          {/* DEDICATED PRECAUTIONARY CARE & SELF-PROTECTION LINE BELOW OF THIS ALL */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${block1Style.careBoxClass}`}>
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${block1Style.iconBg} shadow-xs`}>
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <div className={`text-xs font-black uppercase tracking-wider ${block1Style.careTitleClass}`}>
                  Care Advisory For This Condition
                </div>
                <p className={`text-xs sm:text-sm font-medium leading-relaxed ${block1Style.careTextClass}`}>
                  {careAdvisory}
                </p>
              </div>
            </div>
          </div>

          {/* Proper Sentence to the User based on these factors + Navigation */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
            <div className={`p-4 rounded-2xl border max-w-3xl ${block1Style.careBoxClass}`}>
              <div className="flex items-start gap-2.5">
                <Info
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    healthRiskLevel === 'High'
                      ? 'text-red-500'
                      : healthRiskLevel === 'Moderate'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                />
                <p className={`text-xs sm:text-sm font-medium leading-relaxed ${block1Style.careTextClass}`}>
                  {healthSentence}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActivePage('risk')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${block1Style.buttonClass}`}
            >
              <span>Explore My Heat Risk Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOCK 2: THERMAL STRESS (ONE LARGE CONNECTED APPLE-STYLE VISUAL BLOCK)    */}
      {/* ========================================================================= */}
      <ThermalStressBlock />

      {/* ========================================================================= */}
      {/* 3. HEATWAVE IS COMING: SEQUENTIAL PERIODS (TOP TO BOTTOM) WITH MORE INFO  */}
      {/* ========================================================================= */}
      <section className="apple-card p-5 sm:p-6 space-y-4">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs shrink-0">
              <Flame className="w-5 h-5 text-red-600" />
            </span>
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight uppercase">
                Heatwave Is Coming
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Sequential Forecast & Early Warning for {location.ward.name.includes(':') ? location.ward.name.split(':')[1].trim() : location.ward.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('future')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View Full Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Periods of Wave Arranged Sequentially Top to Bottom */}
        <div className="space-y-3">
          {[
            {
              id: '1-30-days',
              horizon: '1 to 30 Days',
              status: 'HEATWAVE COMING',
              isComing: true,
              window: 'Oct 05 – Oct 13, 2026',
              score: '96% Ensemble Agreement',
              whyHappening:
                'Post-monsoon continental dry air intrusion combined with an upper-tropospheric anticyclone ridge trapping intense solar radiation across the Maharashtra plateau with low wind ventilation.',
              expectedTemp:
                'Severe daytime maximums of 40.5°C – 42.2°C (3.5°C to 4.5°C above seasonal normal). Nocturnal minimums will remain elevated above 25.5°C, providing no overnight cooling relief.',
              howToProtect:
                'Avoid outdoor exposure between 11:30 AM and 4:30 PM; drink ORS or salted lemon water every 30 minutes; draw reflective curtains on sun-facing windows; check local municipal hydration points.',
              whoAffected:
                'Street vendors, outdoor construction laborers, traffic police, school students during afternoon commutes, senior citizens (65+), and patients with cardiovascular or renal conditions.',
              otherThings:
                'Pune Municipal Corporation (PMC) will activate public water kiosks and transit misting corridors. Early warning lead-time: 14 days. Models: ECMWF, NOAA GFS, IMD.',
            },
            {
              id: '1-2-months',
              horizon: '1 to 2 Month',
              status: 'HEATWAVE COMING',
              isComing: true,
              window: 'Oct 18 – Oct 26, 2026',
              score: '90% Ensemble Agreement',
              whyHappening:
                'Extended secondary heat stagnation cell with calm winds (<4 km/h), suppressing sea-breeze moisture penetration and intensifying ground heat re-radiation.',
              expectedTemp:
                'Daytime maximums reaching 39.5°C – 41.0°C. Wet Bulb Globe Temperature (WBGT) projected around 31.0°C, causing significant physical fatigue during light exertion.',
              howToProtect:
                'Pre-hydrate before traveling; carry umbrellas or wide-brim headgear; shift heavy physical work to early morning hours before 10:00 AM; ensure children and elderly drink fluids regularly.',
              whoAffected:
                'Delivery couriers, construction workers, citizens living in top-floor uninsulated tin/concrete roofs, and pregnant women.',
              otherThings:
                'Primary health centers stocked with oral rehydration salts and intravenous fluids. Monitored through NOAA CFSv2 long-range climate ensembles.',
            },
            {
              id: '2-5-months',
              horizon: '2 to 5 Month',
              status: 'NO HEATWAVE',
              isComing: false,
              window: 'Nov 2026 – Feb 2027 (Winter Temperate)',
              score: '95% Ensemble Confidence',
              whyHappening:
                'Prevailing northeasterly continental winds bringing cool, dry air from sub-Himalayan latitudes, allowing efficient overnight radiative surface cooling and balanced solar irradiance.',
              expectedTemp:
                'Comfortable seasonal highs of 28.0°C – 31.0°C; refreshing night temperatures dipping to 12.0°C – 16.5°C. Zero heatwave probability.',
              howToProtect:
                'Safe for all regular outdoor athletic activities, physical labor, and community commuting without thermal restrictions. Standard winter skin hydration advised.',
              whoAffected:
                'No citizen demographics at thermal heat risk. Standard seasonal precautions for morning cold air for respiratory and asthma patients.',
              otherThings:
                'Municipal heat mitigation protocols in baseline monitoring mode. Civic tree plantation and urban cool surface coatings scheduled during this window.',
            },
            {
              id: '5-8-months',
              horizon: '5 to 8 Month',
              status: 'HEATWAVE COMING',
              isComing: true,
              window: 'Apr 12 – Apr 22, 2027',
              score: '88% Ensemble Agreement',
              whyHappening:
                'Pre-monsoon continental heating over northwestern arid corridors channeling blistering westerly winds into the Deccan plateau with intense clear-sky solar radiation.',
              expectedTemp:
                'Dangerous daytime peaks of 41.5°C – 43.5°C. Universal Thermal Climate Index (UTCI) projected above 41.0°C (Very Strong Heat Stress).',
              howToProtect:
                'Reschedule outdoor work to early mornings (before 10:00 AM) or after 5:30 PM; maintain continuous indoor ventilation; utilize wet blinds or evaporative coolers; visit civic cooling centers.',
              whoAffected:
                'Unorganized outdoor laborers, gig delivery workers, young children, senior citizens living independently, and pets/livestock.',
              otherThings:
                'Triggers PMC Heat Action Plan (HAP) Level-2 Orange Alert. Civic cooling shelters operational at Swargate, Shivajinagar, and Pune Station terminals.',
            },
            {
              id: '8-12-months',
              horizon: '8 to 12 Month',
              status: 'HEATWAVE COMING',
              isComing: true,
              window: 'May 16 – May 29, 2027',
              score: '85% Ensemble Agreement',
              whyHappening:
                'Solar zenith passage combined with severe soil moisture deficit, calm surface boundary winds, and high urban built thermal inertia in core city wards.',
              expectedTemp:
                'Critical extreme temperatures of 42.5°C – 44.5°C. Apparent Heat Index exceeding 46.0°C with dangerous cumulative thermal load and night thermal stress.',
              howToProtect:
                'Strictly avoid unshaded outdoor activities between 11:00 AM and 5:00 PM; never leave children or pets inside parked vehicles; seek immediate medical attention if experiencing confusion or dizziness.',
              whoAffected:
                'All citizens upon extended exposure; life-threatening risk for chronic cardiac, hypertension, and renal patients.',
              otherThings:
                'Level-3 Red Alert operational guidelines: government and municipal hospitals operate dedicated air-conditioned heat stroke wards with emergency ice bath facilities.',
            },
          ].map((period) => {
            const isExpanded = expandedHeatwavePeriod === period.id;
            return (
              <div
                key={period.id}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50/90 transition-all overflow-hidden"
              >
                {/* Period Summary Header Row */}
                <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        period.isComing ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {period.horizon}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight ${
                            period.isComing
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {period.status}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold block mt-0.5">
                        {period.window}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <span className="text-xs font-bold text-slate-600 bg-white/90 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                      {period.score}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedHeatwavePeriod(isExpanded ? null : period.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{isExpanded ? 'Less' : 'More'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded "More" Detail Panel */}
                {isExpanded && (
                  <div className="px-3.5 sm:px-5 pb-4 pt-2 border-t border-slate-200/70 bg-white/90 space-y-3.5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {/* Why it is happening */}
                      <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/70 space-y-1">
                        <div className="flex items-center gap-1.5 text-orange-950 font-bold text-xs">
                          <Wind className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>Why It Is Happening</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {period.whyHappening}
                        </p>
                      </div>

                      {/* What temp will be */}
                      <div className="p-3 rounded-xl bg-red-50/60 border border-red-200/70 space-y-1">
                        <div className="flex items-center gap-1.5 text-red-950 font-bold text-xs">
                          <ThermometerSun className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>What Temperature Will Be</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {period.expectedTemp}
                        </p>
                      </div>

                      {/* How to protect ourself */}
                      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 space-y-1">
                        <div className="flex items-center gap-1.5 text-blue-950 font-bold text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>How To Protect Ourselves</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {period.howToProtect}
                        </p>
                      </div>

                      {/* Who are affected */}
                      <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                          <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Who Are Affected</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {period.whoAffected}
                        </p>
                      </div>
                    </div>

                    {/* Other things also */}
                    <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                        <Info className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span>Key Advisory & Municipal Readiness</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {period.otherThings}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Section Footer */}
        <div className="mt-4 pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Climatological Models: <strong>ECMWF • NOAA • IMD • GFS</strong></span>
          <button
            onClick={() => setActivePage('future')}
            className="font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Explore Early Warning Heatwave Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. GIS MAP OF PUNE                                                        */}
      {/* ========================================================================= */}
      <section className="apple-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Interactive Heat Risk Map</h3>
              <p className="text-xs text-slate-500">
                Spatial satellite & sensor risk overlays for {location.ward.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('map')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Open Fullscreen GIS Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl overflow-hidden border border-black/5">
          <InteractiveGisMap heightClass="h-[380px]" showLayerSelector={true} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. NEARBY HEALTHCARE PREVIEW                                              */}
      {/* ========================================================================= */}
      <section className="apple-card p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Cross className="w-4 h-4 text-red-600" />
              <h3 className="font-bold text-slate-800 text-sm">Emergency Healthcare Facilities</h3>
            </div>
            <button
              onClick={() => setActivePage('healthcare')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              View Directory
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {nearestHealthcare.map((hosp) => (
              <div
                key={hosp.id}
                className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs border border-black/5"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{hosp.name}</span>
                    {hosp.emergencyIndicator && (
                      <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 text-[9px] font-extrabold">
                        EMERGENCY 24/7
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{hosp.address}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    {hosp.heatStrokeBedsAvailable} Heat-Stroke Beds Available
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                  <span className="font-extrabold text-slate-800">{hosp.distanceKm} km</span>
                  <span className="text-[10px] text-slate-400">{hosp.travelTimeMins} mins</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <a
                      href={`tel:${hosp.phone}`}
                      className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      title="Call Emergency Hospital"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={hosp.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                      title="Get Navigation Directions"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
          <span className="text-slate-500">Direct hospital ambulance dispatch & heat bed allocation</span>
          <button
            onClick={() => setActivePage('healthcare')}
            className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>Nearby Hospitals & UPHCs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SAFE ROUTE PREVIEW                                                     */}
      {/* ========================================================================= */}
      <section className="apple-card p-5 sm:p-6 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-blue-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Need to travel across {location.ward.name.includes(':') ? location.ward.name.split(':')[1].trim() : location.ward.name} right now?
              </h3>
              <p className="text-xs text-slate-600">
                Generate a shade-optimized, tree-covered navigation route with public cooling shelters along the way.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('route')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <span>Calculate Cool Safe Route</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
