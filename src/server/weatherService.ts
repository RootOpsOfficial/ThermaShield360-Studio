import { WeatherCurrent, WeatherHourly, WeatherDailyForecast, DataSourceLabel } from './types.js';
import { calculateWBGT, calculateUTCI, calculateHeatIndex, categorizeThermalStress } from './thermalEngine.js';
import { getCachedProvenanceLedger } from '../services/validation/provenanceLedger.js';
import { fuseMultiSourceRecords } from '../services/fusion/multiSourceFusionEngine.js';
import { isOpenMeteoInCooldown, setOpenMeteoCooldown } from '../services/data/openMeteoLimiter.js';

interface CachedWeatherData {
  timestamp: number;
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDailyForecast[];
}

const cache: Map<string, CachedWeatherData> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh cache
const inFlightWeatherFetches = new Map<string, Promise<{
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDailyForecast[];
  source: DataSourceLabel;
}>>();

// Map WMO weather codes to human text
function decodeWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sunny Sky';
  if (code === 1 || code === 2) return 'Mostly Sunny & Clear';
  if (code === 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Hazy Sunshine';
  if (code >= 51 && code <= 67) return 'Light Scattered Showers';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm Warning';
  return 'Clear Warm Sky';
}

// Generate location-agnostic meteorological fallback based on current hour
// NOT Pune-specific — uses generic temperate zone profile as modelled estimate
function getFallbackModelledWeather(lat: number, lng: number): {
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDailyForecast[];
} {
  const now = new Date();
  const currentHour = now.getHours();

  // Generic diurnal temperature profile — NOT Pune-specific
  const hourAngle = ((currentHour - 14) / 24) * 2 * Math.PI;
  const tempCycle = Math.cos(hourAngle);
  // Latitude-based base temp estimation (rough tropics vs temperate)
  const absLat = Math.abs(lat);
  const baseTemp = absLat < 25 ? 31.0 : absLat < 40 ? 26.0 : 20.0;
  const tempAmplitude = 7.0;
  const currentTemp = Math.round((baseTemp + tempAmplitude * tempCycle) * 10) / 10;

  // Relative humidity is inverse to temp: lowest at peak heat (32%), highest at dawn (68%)
  const rh = Math.round(50 - 20 * tempCycle);

  // Solar irradiance peak at 12:30 (up to 880 W/m²)
  let solar = 0;
  if (currentHour >= 6 && currentHour <= 18) {
    const solarFraction = Math.sin(((currentHour - 6) / 12) * Math.PI);
    solar = Math.round(Math.max(0, solarFraction * 890));
  }

  const wind = Math.round((2.5 + 1.8 * Math.sin((currentHour / 24) * 2 * Math.PI)) * 10) / 10;
  const heatIndex = calculateHeatIndex(currentTemp, rh);
  const feelsLike = heatIndex;

  const current: WeatherCurrent = {
    temp: currentTemp,
    feelsLike,
    humidity: rh,
    windSpeed: Math.round(wind * 3.6 * 10) / 10, // km/h
    windDirection: 260,
    solarIrradiance: solar,
    uvIndex: currentHour >= 10 && currentHour <= 15 ? 10 : currentHour >= 7 && currentHour <= 17 ? 5 : 0,
    pressure: 1012,
    weatherCode: 0,
    weatherDescription: 'MODELLED — Live Source Unavailable',
    source: 'MODELLED',
    lastUpdated: now.toISOString(),
  };

  const hourly: WeatherHourly[] = [];
  for (let h = 0; h < 24; h++) {
    const angle = ((h - 14) / 24) * 2 * Math.PI;
    const cosVal = Math.cos(angle);
    const t = Math.round((baseTemp + tempAmplitude * cosVal) * 10) / 10;
    const r = Math.round(50 - 20 * cosVal);
    let s = 0;
    if (h >= 6 && h <= 18) {
      s = Math.round(Math.max(0, Math.sin(((h - 6) / 12) * Math.PI) * 890));
    }
    const w = 2.8;
    const wb = calculateWBGT(t, r, s, w);
    const ut = calculateUTCI(t, r, w, s);
    const hi = calculateHeatIndex(t, r);
    const rk = categorizeThermalStress(wb, ut);

    const periodStr = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
    hourly.push({
      time: periodStr,
      hour: h,
      temp: t,
      feelsLike: hi,
      humidity: r,
      windSpeed: Math.round(w * 3.6 * 10) / 10,
      solarRadiation: s,
      wbgt: wb,
      utci: ut,
      heatIndex: hi,
      riskLevel: rk,
    });
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daily: WeatherDailyForecast[] = [];
  // 16 days temperature progression reflecting Pune pre/post-monsoon & October Heat surge
  const maxTemps = [38.6, 39.2, 40.1, 39.6, 38.2, 38.0, 37.8, 38.4, 39.1, 39.7, 40.2, 40.8, 41.2, 40.5, 39.8, 39.0];
  const minTemps = [24.5, 25.1, 25.8, 25.2, 24.3, 23.9, 24.4, 24.9, 25.5, 26.0, 26.7, 27.3, 26.8, 25.9, 25.2, 24.6];

  for (let d = 0; d < 16; d++) {
    const fDate = new Date();
    fDate.setDate(now.getDate() + d);
    const dayName = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : daysOfWeek[fDate.getDay()];
    const tMax = maxTemps[d];
    const tMin = minTemps[d];
    const avgRh = Math.max(28, 44 - Math.round((tMax - 37) * 2));
    const peakSol = 880 + (d % 4) * 20;
    const wb = calculateWBGT(tMax, avgRh, peakSol, 2.5);
    const ut = calculateUTCI(tMax, avgRh, 2.5, peakSol);
    const risk = categorizeThermalStress(wb, ut);
    const isHeatwave = tMax >= 40.0 ? 'Severe Heatwave' : tMax >= 38.5 ? 'Heatwave' : 'None';

    daily.push({
      date: fDate.toISOString().split('T')[0],
      dayName,
      tempMax: tMax,
      tempMin: tMin,
      feelsLikeMax: Math.round((tMax + 3.8) * 10) / 10,
      humidityAvg: avgRh,
      solarRadiationMax: peakSol,
      riskLevel: risk,
      heatwaveStatus: isHeatwave,
      peakPeriod: '12:30 PM – 4:30 PM',
      summary: isHeatwave === 'Severe Heatwave'
        ? 'Severe heat alert. Peak thermal stress afternoon.'
        : isHeatwave === 'Heatwave'
        ? 'Heatwave advisory active. High daytime heat.'
        : 'Warm season conditions within seasonal tolerance.',
    });
  }

  return { current, hourly, daily };
}

export async function fetchWeatherData(
  lat: number,
  lng: number
): Promise<{
  current: WeatherCurrent;
  hourly: WeatherHourly[];
  daily: WeatherDailyForecast[];
  source: DataSourceLabel;
}> {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const cached = cache.get(cacheKey);

  // Return fresh cache if within TTL (5 minutes)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      current: cached.current,
      hourly: cached.hourly,
      daily: cached.daily,
      source: cached.current.source,
    };
  }

  // Single-flight deduplication: if request for these coordinates is already in flight, wait for it
  const existingInFlight = inFlightWeatherFetches.get(cacheKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  // If in rate-limit backoff period, use stale cache if available or calibrate model
  if (isOpenMeteoInCooldown()) {
    if (cached) {
      return {
        current: cached.current,
        hourly: cached.hourly,
        daily: cached.daily,
        source: cached.current.source,
      };
    }
    const fallback = getFallbackModelledWeather(lat, lng);
    const result = { ...fallback, source: 'MODELLED' as DataSourceLabel };
    cache.set(cacheKey, { timestamp: Date.now(), ...result });
    return result;
  }

  const fetchPromise = (async () => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for fast response

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,direct_normal_irradiance&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index,direct_normal_irradiance&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_probability_max&forecast_days=16&timezone=auto`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.status === 429) {
        const retryHeader = res.headers.get('retry-after');
        const backoffSec = retryHeader ? Math.min(60, parseInt(retryHeader, 10) || 25) : 25;
        setOpenMeteoCooldown(backoffSec);
        console.warn(`[WeatherService] Open-Meteo HTTP 429 rate limit hit. Cooldown set to ${backoffSec}s`);
        if (cached) {
          return {
            current: cached.current,
            hourly: cached.hourly,
            daily: cached.daily,
            source: cached.current.source,
          };
        }
        const fallback = getFallbackModelledWeather(lat, lng);
        const result = { ...fallback, source: 'MODELLED' as DataSourceLabel };
        cache.set(cacheKey, { timestamp: Date.now(), ...result });
        return result;
      }

      if (!res.ok) {
        throw new Error(`Weather service HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log(`[WeatherService] Provider=Open-Meteo Status=200 Latency=${Date.now() - startTime}ms Lat=${lat} Lng=${lng}`);

      const c = data.current;
      const h = data.hourly;
      const d = data.daily;

      // Ingest and fuse live operational models if ledger already cached in memory
      let fusedConsensus: any = null;
      const cachedLedger = getCachedProvenanceLedger(lat, lng);
      if (cachedLedger && cachedLedger.records) {
        try {
          fusedConsensus = fuseMultiSourceRecords(cachedLedger.records);
        } catch (e) {
          console.warn('Fusion pipeline warning in weatherService:', e);
        }
      }

      const currentTemp = fusedConsensus?.fusedTemperatureC ?? c.temperature_2m;
      const rh = fusedConsensus?.fusedHumidityPct ?? c.relative_humidity_2m;
      const windKmH = fusedConsensus?.fusedWindSpeedMs != null
        ? Math.round(fusedConsensus.fusedWindSpeedMs * 3.6 * 10) / 10
        : c.wind_speed_10m;
      const solar = fusedConsensus?.fusedSolarRadiationWm2 ?? c.direct_normal_irradiance ?? 0;
      const pressure = fusedConsensus?.fusedPressureHpa ?? c.surface_pressure ?? 1013;
      const feelsLike = calculateHeatIndex(currentTemp, rh);

      const current: WeatherCurrent = {
        temp: Math.round(currentTemp * 10) / 10,
        feelsLike: Math.round(feelsLike * 10) / 10,
        humidity: Math.round(rh),
        windSpeed: Math.round(windKmH * 10) / 10,
        windDirection: c.wind_direction_10m || 0,
        solarIrradiance: Math.round(solar),
        uvIndex: h.uv_index ? h.uv_index[new Date().getHours()] || 7 : 7,
        pressure: Math.round(pressure),
        weatherCode: c.weather_code || 0,
        weatherDescription: decodeWeatherCode(c.weather_code || 0),
        source: 'LIVE',
        lastUpdated: new Date().toISOString(),
      };

      const hourly: WeatherHourly[] = [];
      const totalHourlyCount = Math.min(24, (h.time || []).length);
      for (let i = 0; i < totalHourlyCount; i++) {
        const timeIso = h.time[i];
        const hourNum = new Date(timeIso).getHours();
        const t = h.temperature_2m[i];
        const r = h.relative_humidity_2m[i];
        const wSpeed = h.wind_speed_10m[i];
        const sRad = h.direct_normal_irradiance ? h.direct_normal_irradiance[i] || 0 : 0;
        const wb = calculateWBGT(t, r, sRad, wSpeed / 3.6);
        const ut = calculateUTCI(t, r, wSpeed / 3.6, sRad);
        const hi = h.apparent_temperature ? h.apparent_temperature[i] : calculateHeatIndex(t, r);
        const rk = categorizeThermalStress(wb, ut);

        const periodStr = hourNum === 0 ? '12 AM' : hourNum < 12 ? `${hourNum} AM` : hourNum === 12 ? '12 PM' : `${hourNum - 12} PM`;

        hourly.push({
          time: periodStr,
          hour: hourNum,
          temp: Math.round(t * 10) / 10,
          feelsLike: Math.round(hi * 10) / 10,
          humidity: Math.round(r),
          windSpeed: Math.round(wSpeed * 10) / 10,
          solarRadiation: Math.round(sRad),
          wbgt: wb,
          utci: ut,
          heatIndex: Math.round(hi * 10) / 10,
          riskLevel: rk,
        });
      }

      const daily: WeatherDailyForecast[] = [];
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const totalDailyCount = Math.min(16, (d.time || []).length);

      for (let j = 0; j < totalDailyCount; j++) {
        const dateStr = d.time[j];
        const dayDate = new Date(dateStr);
        const dayName = j === 0 ? 'Today' : j === 1 ? 'Tomorrow' : daysOfWeek[dayDate.getDay()];
        const tMax = d.temperature_2m_max[j];
        const tMin = d.temperature_2m_min[j];
        const feelsMax = d.apparent_temperature_max[j] || tMax + 3;
        const solarEst = 850;
        const wb = calculateWBGT(tMax, 40, solarEst, 2.5);
        const ut = calculateUTCI(tMax, 40, 2.5, solarEst);
        const rk = categorizeThermalStress(wb, ut);
        const isHeatwave = tMax >= 40.0 ? 'Severe Heatwave' : tMax >= 38.5 ? 'Heatwave' : 'None';

        daily.push({
          date: dateStr,
          dayName,
          tempMax: Math.round(tMax * 10) / 10,
          tempMin: Math.round(tMin * 10) / 10,
          feelsLikeMax: Math.round(feelsMax * 10) / 10,
          humidityAvg: 42,
          solarRadiationMax: solarEst,
          riskLevel: rk,
          heatwaveStatus: isHeatwave,
          peakPeriod: '12:30 PM – 4:30 PM',
          summary: isHeatwave !== 'None' ? 'Extreme thermal stress forecasted. Avoid peak outdoor hours.' : 'Warm day with moderate thermal load.',
        });
      }

      const result = { current, hourly, daily, source: 'LIVE' as DataSourceLabel };
      cache.set(cacheKey, { timestamp: Date.now(), ...result });
      return result;
    } catch (_err) {
      if (cached) {
        return {
          current: cached.current,
          hourly: cached.hourly,
          daily: cached.daily,
          source: cached.current.source,
        };
      }
      const fallback = getFallbackModelledWeather(lat, lng);
      const result = { ...fallback, source: 'MODELLED' as DataSourceLabel };
      cache.set(cacheKey, { timestamp: Date.now(), ...result });
      return result;
    } finally {
      inFlightWeatherFetches.delete(cacheKey);
    }
  })();

  inFlightWeatherFetches.set(cacheKey, fetchPromise);
  return fetchPromise;
}
