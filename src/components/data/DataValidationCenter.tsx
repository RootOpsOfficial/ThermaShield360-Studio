import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  RefreshCw,
  Server,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { ProviderHealthReport } from '../../services/data/types.js';
import { checkAllProvidersHealth } from '../../services/data/providerHealthService.js';
import { ProvenanceTable } from './ProvenanceTable.js';
import { generateMultiHorizonLadder, MultiHorizonLadderReport } from '../../services/earlyWarning/multiHorizonLadder.js';
import { fuseMultiSourceRecords, FusedConsensusMeteorology } from '../../services/fusion/multiSourceFusionEngine.js';
import { ingestAndAuditAllSources } from '../../services/validation/provenanceLedger.js';

interface DataValidationCenterProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const DataValidationCenter: React.FC<DataValidationCenterProps> = ({
  onClose,
  isModal = false,
}) => {
  const [providers, setProviders] = useState<ProviderHealthReport[]>([]);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [fusionData, setFusionData] = useState<FusedConsensusMeteorology | null>(null);
  const [ladder, setLadder] = useState<MultiHorizonLadderReport | null>(null);
  const [activeTab, setActiveTab] = useState<'providers' | 'provenance' | 'ladder' | 'fusion'>('providers');

  const fetchHealthAndFusion = async (force = false) => {
    setIsLoadingHealth(true);
    try {
      // 1. Fetch provider health from server
      const healthRes = await fetch(`/api/data/health${force ? '?refresh=true' : ''}`);
      if (healthRes.ok) {
        const health = await healthRes.json();
        setProviders(health);
      } else {
        const health = await checkAllProvidersHealth(18.5204, 73.8567, force);
        setProviders(health);
      }

      // 2. Fetch multi-source fusion consensus from server
      const fusionRes = await fetch(`/api/data/fusion${force ? '?refresh=true' : ''}`);
      if (fusionRes.ok) {
        const fused = await fusionRes.json();
        setFusionData(fused);
      } else {
        const ledger = await ingestAndAuditAllSources(18.5204, 73.8567, force);
        const fused = fuseMultiSourceRecords(ledger.records);
        setFusionData(fused);
      }

      // 3. Fetch multi-horizon early warning ladder from server
      const ladderRes = await fetch(`/api/data/ladder`);
      if (ladderRes.ok) {
        const ladderData = await ladderRes.json();
        setLadder(ladderData);
      } else {
        const ladderData = generateMultiHorizonLadder('Pune, Maharashtra', 18.5204, 73.8567);
        setLadder(ladderData);
      }
    } catch (err) {
      console.warn('DataValidationCenter fetch error:', err);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealthAndFusion();
  }, []);

  const getStatusBadge = (status: ProviderHealthReport['status']) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        );
      case 'AUTHENTICATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            CONNECTED
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            AVAILABLE
          </span>
        );
      case 'AUTH_ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            TOKEN REQUIRED
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            RATE LIMITED
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            TIMEOUT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            NOT AVAILABLE
          </span>
        );
    }
  };

  const getPriorityBadge = (p: ProviderHealthReport['priority']) => {
    if (p === 'CRITICAL') return <span className="text-[10px] font-bold text-red-600">🔴 CRITICAL</span>;
    if (p === 'HIGH') return <span className="text-[10px] font-bold text-orange-600">🟠 HIGH</span>;
    return <span className="text-[10px] font-bold text-amber-600">🟡 MEDIUM</span>;
  };

  const content = (
    <div className="space-y-6">
      {/* Top Banner / Philosophy */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Phase 1 to Phase 6 Data Transparency Infrastructure</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Data Validation & Provenance Center
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              ThermaShield 360 uses traceable, real-world data from major meteorological and climate sources,
              validates and normalizes it, and only then converts it into thermal stress and human-risk intelligence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => fetchHealthAndFusion(true)}
              disabled={isLoadingHealth}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin' : ''}`} />
              <span>Re-Probe All 11 Providers</span>
            </button>
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="w-full sm:w-auto p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Decorative Grid glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-black/5 pb-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'providers', label: '11 External Data Providers', icon: Server },
          { id: 'provenance', label: 'Variable Provenance Ledger', icon: Database },
          { id: 'fusion', label: 'Multi-Source Agreement & Consensus', icon: Layers },
          { id: 'ladder', label: 'Multi-Horizon Ladder (0d to 12m)', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: 11 DATA PROVIDERS GRID */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-white/90 backdrop-blur-xl border border-black/5 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.role}</p>
                    </div>
                    {getStatusBadge(p.status)}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 font-mono">
                    <span className="text-slate-500 text-[10px]">Latency</span>
                    <span className="font-bold text-slate-800">{p.latencyMs} ms</span>
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 font-mono truncate" title={p.endpointUrl}>
                    {p.endpointUrl}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 mb-1.5 font-semibold">Supported Variables:</div>
                  <div className="flex flex-wrap gap-1">
                    {p.supportedVariables.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        {v}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px]">
                    {getPriorityBadge(p.priority)}
                    <span className="text-slate-400 text-[10px]">
                      {new Date(p.lastChecked).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Checklist Card */}
          <div className="bg-white/90 border border-black/5 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">ThermaShield 7-Point Quality Audit Protocol</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                { name: '1. Source Authentication', desc: 'Direct HTTP response verification & provider handshake' },
                { name: '2. Schema Integrity', desc: 'Strict non-NaN type enforcement across all meteorological values' },
                { name: '3. Unit Normalization', desc: 'Standardization to °C, %, m/s, W/m², and hPa metric standards' },
                { name: '4. Physical Bounds Check', desc: 'Temperature (-10°C to 60°C), RH (0-100%), Wind (0-65 m/s)' },
                { name: '5. Coordinate Tolerance', desc: 'Spatial tolerance check within Pune municipal bounding box' },
                { name: '6. Freshness & Monotonicity', desc: 'Timestamp freshness <= 90 min for live observations' },
                { name: '7. Provenance Stamping', desc: 'Cryptographic record ID hashing for end-to-end traceability' },
                { name: '8. Inter-Model Agreement', desc: 'Multi-source spread calculation and divergence alerts' },
              ].map((c) => (
                <div key={c.name} className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{c.name}</span>
                  </div>
                  <p className="text-[11px] text-emerald-900/80 mt-1 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROVENANCE TABLE */}
      {activeTab === 'provenance' && (
        <div className="space-y-4">
          <ProvenanceTable lat={18.5204} lng={73.8567} />
        </div>
      )}

      {/* TAB 3: MULTI-SOURCE FUSION */}
      {activeTab === 'fusion' && fusionData && (
        <div className="space-y-6">
          {/* Divergence Alert if present */}
          {fusionData.agreementMatrix.divergenceAlert?.isDivergent && (
            <div className="p-5 rounded-3xl bg-red-50 border border-red-200 text-red-950 space-y-2">
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>{fusionData.agreementMatrix.divergenceAlert.headline}</span>
              </div>
              <p className="text-xs text-red-900/90 leading-relaxed">
                {fusionData.agreementMatrix.divergenceAlert.details}
              </p>
              <div className="text-[11px] font-semibold text-red-800 bg-white/60 p-2.5 rounded-xl border border-red-200">
                Action: {fusionData.agreementMatrix.divergenceAlert.recommendedAction}
              </div>
            </div>
          )}

          {/* Fused Consensus Card */}
          <div className="bg-white/90 border border-black/5 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Multi-Model Weighted Consensus</h3>
                <p className="text-xs text-slate-500 mt-0.5">{fusionData.provenanceSummary}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Agreement Level:</span>
                {fusionData.agreementMatrix.agreementLevel === 'STRONG_AGREEMENT' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    🟢 STRONG AGREEMENT (±{fusionData.agreementMatrix.spreadTempDegC}°C)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    🟡 MODERATE AGREEMENT (±{fusionData.agreementMatrix.spreadTempDegC}°C)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100">
                <div className="text-[10px] uppercase font-bold text-orange-600">Fused Temp</div>
                <div className="text-xl font-black text-orange-950 mt-1">
                  {fusionData.fusedTemperatureC !== null ? `${fusionData.fusedTemperatureC}°C` : 'NULL'}
                </div>
                <div className="text-[10px] text-orange-700 mt-0.5">Spread: ±{fusionData.agreementMatrix.spreadTempDegC}°C</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="text-[10px] uppercase font-bold text-blue-600">Fused Humidity</div>
                <div className="text-xl font-black text-blue-950 mt-1">
                  {fusionData.fusedHumidityPct !== null ? `${fusionData.fusedHumidityPct}%` : 'NULL'}
                </div>
                <div className="text-[10px] text-blue-700 mt-0.5">Spread: ±{fusionData.agreementMatrix.spreadRhPct}%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-100">
                <div className="text-[10px] uppercase font-bold text-cyan-600">Fused Wind</div>
                <div className="text-xl font-black text-cyan-950 mt-1">
                  {fusionData.fusedWindSpeedMs !== null ? `${fusionData.fusedWindSpeedMs} m/s` : 'NULL'}
                </div>
                <div className="text-[10px] text-cyan-700 mt-0.5">
                  {fusionData.fusedWindSpeedMs !== null ? `${(fusionData.fusedWindSpeedMs * 3.6).toFixed(1)} km/h` : 'N/A'}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                <div className="text-[10px] uppercase font-bold text-amber-600">Solar Radiation</div>
                <div className="text-xl font-black text-amber-950 mt-1">
                  {fusionData.fusedSolarRadiationWm2 !== null ? `${fusionData.fusedSolarRadiationWm2} W/m²` : 'NULL'}
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5">Direct Horizontal</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-[10px] uppercase font-bold text-emerald-600">Dew Point</div>
                <div className="text-xl font-black text-emerald-950 mt-1">
                  {fusionData.fusedDewPointC !== null ? `${fusionData.fusedDewPointC}°C` : 'NULL'}
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Magnus-Tetens</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-600">Pressure</div>
                <div className="text-xl font-black text-slate-950 mt-1">
                  {fusionData.fusedPressureHpa !== null ? `${fusionData.fusedPressureHpa} hPa` : 'NULL'}
                </div>
                <div className="text-[10px] text-slate-700 mt-0.5">Barometric</div>
              </div>
            </div>

            {/* Model Weight Breakdown */}
            <div className="pt-3 border-t border-black/5">
              <h4 className="text-xs font-bold text-slate-900 mb-2">Regional Weighting Matrix (Western Maharashtra)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {fusionData.contributingModels.map((m) => (
                  <div key={m.source} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{m.source}</span>
                      <span className="text-orange-600">{(m.weight * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 text-slate-600 font-mono text-[11px]">
                      Temp: {m.temperatureC.toFixed(1)}°C | RH: {m.humidityPct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-HORIZON LADDER */}
      {activeTab === 'ladder' && ladder && (
        <div className="space-y-6">
          <div className="bg-white/90 border border-black/5 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                The 6-Horizon Early Warning Ladder (0 Days to 12 Months)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                As forecast lead time increases, predictability transitions from deterministic weather to sub-seasonal anomalies and oceanic climate drivers. ThermaShield transparently reduces confidence and adapts display modes rather than claiming false single-day precision months in advance.
              </p>
            </div>

            <div className="space-y-3">
              {ladder.horizons.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800 font-bold text-[10px]">
                          {h.leadTimeLabel}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{h.title}</h4>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{h.scientificNature}</div>
                    </div>

                    <div className="text-right self-start sm:self-auto">
                      <div className="text-xs font-bold text-orange-600">{h.confidencePct}% Confidence</div>
                      <div className="text-[10px] text-slate-400">{h.confidenceDescriptor}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-black/5 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                    <div>
                      <span className="font-semibold text-slate-800">Primary Inputs: </span>
                      {h.primarySources.join(', ')}
                    </div>

                    {h.displayMode === 'deterministic_hourly' && (
                      <div className="font-mono text-emerald-700 font-bold">
                        Hourly Deterministic NWP Output
                      </div>
                    )}
                    {h.displayMode === 'ensemble_spread' && (
                      <div className="font-mono text-blue-700 font-bold">
                        Spread: ±{(h.data as any).forecastSpreadDegC}°C | Exceedance Prob: {(h.data as any).exceedanceProbabilityPct}% (Tmax ≥ 40°C)
                      </div>
                    )}
                    {h.displayMode === 'subseasonal_anomaly' && (
                      <div className="font-mono text-amber-700 font-bold">
                        Weekly Anomaly: +{(h.data as any).weeklyAnomalyTendencyDegC}°C above normal
                      </div>
                    )}
                    {h.displayMode === 'seasonal_tercile' && (
                      <div className="font-mono text-orange-700 font-bold">
                        Above Normal: {(h.data as any).aboveNormalProbabilityPct}% | Near: {(h.data as any).nearNormalProbabilityPct}%
                      </div>
                    )}
                    {h.displayMode === 'climate_indicators' && (
                      <div className="font-mono text-purple-700 font-bold">
                        ThermaShield-Derived Teleconnection Signal
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
          {content}
        </div>
      </div>
    );
  }

  return <div className="max-w-6xl mx-auto p-4 sm:p-6">{content}</div>;
};
