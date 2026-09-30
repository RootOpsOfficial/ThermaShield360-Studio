import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  Columns,
  Table as TableIcon,
  RotateCcw,
} from 'lucide-react';
import {
  ProvenanceAuditEntry,
  ProvenanceLedgerState,
  ingestAndAuditAllSources,
} from '../../services/validation/provenanceLedger.js';
import { ValidationAuditResult } from '../../services/validation/validationEngine.js';

export interface SourceDataTableProps {
  lat?: number;
  lng?: number;
  compact?: boolean;
  filterVariable?: string;
  filterSource?: string;
  onOpenValidationCenter?: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const SourceDataTable: React.FC<SourceDataTableProps> = ({
  lat,
  lng,
  compact = false,
  filterVariable,
  filterSource,
  onOpenValidationCenter,
  title = 'Data Source & Validation Provenance',
  subtitle = 'Canonical 25-field traceability layer for real-world meteorological, reanalysis, and observational inputs',
  className = '',
}) => {
  const [ledger, setLedger] = useState<ProvenanceLedgerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

  // Filters
  const [activeVariableFilter, setActiveVariableFilter] = useState<string>(filterVariable || 'ALL');
  const [activeSourceFilter, setActiveSourceFilter] = useState<string>(filterSource || 'ALL');
  const [activeAvailabilityFilter, setActiveAvailabilityFilter] = useState<string>('ALL');
  const [activeDataTypeFilter, setActiveDataTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // View Mode: 'summary' (compact summary columns) vs 'full25' (all 25 columns side-by-side)
  const [viewMode, setViewMode] = useState<'summary' | 'full25'>('summary');

  const loadData = async (force = false) => {
    if (lat === undefined || lng === undefined) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/data/provenance?lat=${lat}&lng=${lng}${force ? '&refresh=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      } else {
        const localData = await ingestAndAuditAllSources(lat, lng, force);
        setLedger(localData);
      }
    } catch {
      const localData = await ingestAndAuditAllSources(lat, lng, force);
      setLedger(localData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      loadData();
    }
  }, [lat, lng]);

  // Extract raw entries and apply DEMO quarantine
  const rawEntries = useMemo(() => ledger?.entries || [], [ledger]);

  const unquarantinedEntries = useMemo(() => {
    // In live data mode, DEMO or SIMULATED_REPLAY records must NEVER enter operational tables
    return rawEntries.filter((e) => {
      const isDemo = e.dataType === 'DEMO' || e.dataType === 'SIMULATED_REPLAY';
      return !isDemo;
    });
  }, [rawEntries]);

  // Filter options dynamically extracted from entries
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    unquarantinedEntries.forEach((e) => set.add(e.source));
    return Array.from(set);
  }, [unquarantinedEntries]);

  const availableVariables = useMemo(() => {
    const set = new Set<string>();
    unquarantinedEntries.forEach((e) => set.add(e.variable));
    return Array.from(set);
  }, [unquarantinedEntries]);

  const availableAvailabilities = useMemo(() => {
    const set = new Set<string>();
    unquarantinedEntries.forEach((e) => set.add(e.availability));
    return Array.from(set);
  }, [unquarantinedEntries]);

  const availableDataTypes = useMemo(() => {
    const set = new Set<string>();
    unquarantinedEntries.forEach((e) => set.add(e.dataType));
    return Array.from(set);
  }, [unquarantinedEntries]);

  // Filtered dataset
  const filteredEntries = useMemo(() => {
    return unquarantinedEntries.filter((entry) => {
      // Variable filter
      if (activeVariableFilter !== 'ALL' && entry.variable.toLowerCase() !== activeVariableFilter.toLowerCase()) {
        return false;
      }
      // Source filter
      if (activeSourceFilter !== 'ALL' && entry.source.toLowerCase() !== activeSourceFilter.toLowerCase()) {
        return false;
      }
      // Availability filter
      if (activeAvailabilityFilter !== 'ALL' && entry.availability !== activeAvailabilityFilter) {
        return false;
      }
      // Data type filter
      if (activeDataTypeFilter !== 'ALL' && entry.dataType !== activeDataTypeFilter) {
        return false;
      }
      // Free text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          entry.source.toLowerCase().includes(q) ||
          entry.provider.toLowerCase().includes(q) ||
          entry.model.toLowerCase().includes(q) ||
          entry.dataset.toLowerCase().includes(q) ||
          entry.variable.toLowerCase().includes(q) ||
          entry.recordId.toLowerCase().includes(q) ||
          (entry.errorCode && entry.errorCode.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [
    unquarantinedEntries,
    activeVariableFilter,
    activeSourceFilter,
    activeAvailabilityFilter,
    activeDataTypeFilter,
    searchQuery,
  ]);

  const resetFilters = () => {
    setActiveVariableFilter('ALL');
    setActiveSourceFilter('ALL');
    setActiveAvailabilityFilter('ALL');
    setActiveDataTypeFilter('ALL');
    setSearchQuery('');
  };

  const hasActiveFilters =
    activeVariableFilter !== 'ALL' ||
    activeSourceFilter !== 'ALL' ||
    activeAvailabilityFilter !== 'ALL' ||
    activeDataTypeFilter !== 'ALL' ||
    searchQuery.trim().length > 0;

  // Strict NULL Pill Formatter
  const renderNullBadge = () => (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200">
      NULL
    </span>
  );

  const renderNullOrValue = (val: string | number | null | undefined, unit?: string) => {
    if (val === null || val === undefined || val === 'NULL' || val === '') {
      return renderNullBadge();
    }
    return (
      <span className="font-mono font-bold text-slate-900 text-xs">
        {val}
        {unit ? ` ${unit}` : ''}
      </span>
    );
  };

  // Availability Badge with icon indicator
  const getAvailabilityBadge = (status: ProvenanceAuditEntry['availability']) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            DEGRADED
          </span>
        );
      case 'AUTH_ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            AUTH_ERROR
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            RATE_LIMITED
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            TIMEOUT
          </span>
        );
      case 'INVALID_RESPONSE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            INVALID_RESPONSE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            NOT_AVAILABLE
          </span>
        );
    }
  };

  // Validation Status Badge with icon
  const getValidationBadge = (status: ProvenanceAuditEntry['validationStatus']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            VERIFIED
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            PARTIAL
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3 h-3 text-orange-600" />
            STALE
          </span>
        );
      case 'AUTH_ERROR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            AUTH_ERROR
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            RATE_LIMITED
          </span>
        );
      case 'TIMEOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3 h-3 text-orange-600" />
            TIMEOUT
          </span>
        );
      case 'FAILED':
      case 'INVALID_RESPONSE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            NOT AVAILABLE
          </span>
        );
    }
  };

  const selectedAudit: ValidationAuditResult | undefined =
    selectedRowKey && ledger?.auditResults
      ? ledger.auditResults[selectedRowKey.split('__')[0]]
      : undefined;

  const selectedEntry = selectedRowKey
    ? filteredEntries.find((e) => `${e.recordId}__${e.variable}` === selectedRowKey)
    : undefined;

  return (
    <div
      className={`bg-white/85 backdrop-blur-xl border border-black/5 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 ${className}`}
    >
      {/* ============================================================ */}
      {/* 1. HEADER SECTION                                            */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-black/5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  25-FIELD TRACEABILITY
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* View Toggle + Refresh + Full Center */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 border border-black/5">
            <button
              onClick={() => setViewMode('summary')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'summary'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>
            <button
              onClick={() => setViewMode('full25')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'full25'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Full 25 Columns</span>
            </button>
          </div>

          {/* Refresh Data Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
            title="Re-audit all live meteorological data feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Re-Audit</span>
          </button>

          {onOpenValidationCenter && (
            <button
              onClick={onOpenValidationCenter}
              className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 px-2 py-1.5"
            >
              <span>Full Validation Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. FILTER CONTROLS BAR                                       */}
      {/* ============================================================ */}
      <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-black/5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Quick Variable Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Variable:
            </span>
            {['ALL', 'Temperature', 'Relative Humidity', 'Solar Radiation', 'Wind Speed', 'Surface Pressure'].map((v) => (
              <button
                key={v}
                onClick={() => setActiveVariableFilter(v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                  activeVariableFilter === v
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {v === 'Relative Humidity' ? 'Humidity' : v === 'Solar Radiation' ? 'Solar' : v}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search source, model, ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Dropdowns Row: Source, Status, Data Type */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/5 text-xs">
          {/* Source Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-semibold">Source:</span>
            <select
              value={activeSourceFilter}
              onChange={(e) => setActiveSourceFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Sources ({availableSources.length})</option>
              {availableSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Status Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-semibold">Availability:</span>
            <select
              value={activeAvailabilityFilter}
              onChange={(e) => setActiveAvailabilityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All States</option>
              {availableAvailabilities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Data Type Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-semibold">Data Type:</span>
            <select
              value={activeDataTypeFilter}
              onChange={(e) => setActiveDataTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              {availableDataTypes.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filter Clear */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-400 font-medium">
            Showing <strong className="text-slate-800">{filteredEntries.length}</strong> of{' '}
            {unquarantinedEntries.length} records
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. TABLE RENDER: SUMMARY VIEW VS FULL 25 COLUMNS             */}
      {/* ============================================================ */}
      {viewMode === 'summary' ? (
        /* ------------------ A: SUMMARY VIEW (DEFAULT) ------------------ */
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Variable</th>
                <th className="py-2.5 px-3">Source & Provider</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Data Type</th>
                <th className="py-2.5 px-3">Lead / Time</th>
                <th className="py-2.5 px-3">Availability</th>
                <th className="py-2.5 px-3">Validation</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const rowKey = `${entry.recordId}__${entry.variable}`;
                  const isSelected = selectedRowKey === rowKey;
                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        onClick={() => setSelectedRowKey(isSelected ? null : rowKey)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {entry.variable}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{entry.source}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={entry.provider}>
                            {entry.provider}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium text-[11px] truncate max-w-[130px]" title={entry.model}>
                          {entry.model}
                        </td>
                        <td className="py-2.5 px-3">
                          {entry.value === 'NULL' ? (
                            renderNullBadge()
                          ) : (
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {entry.value}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {entry.dataType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          <div>{entry.forecastLead || '+0h'}</div>
                          <div className="text-[9px] text-slate-400">{entry.retrievedAt}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {getAvailabilityBadge(entry.availability)}
                        </td>
                        <td className="py-2.5 px-3">
                          {getValidationBadge(entry.validationStatus)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {isSelected ? (
                            <ChevronUp className="w-4 h-4 ml-auto text-orange-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-auto" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Inspector for Selected Row */}
                      {isSelected && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={9} className="p-4 sm:p-5">
                            {renderExpandedRowDetails(entry, selectedAudit)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ------------------ B: FULL 25 COLUMNS GRID VIEW ------------------ */
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-inner max-w-full">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[2800px]">
            <thead>
              <tr className="border-b border-black/10 bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">1. Source</th>
                <th className="py-3 px-3">2. Provider</th>
                <th className="py-3 px-3">3. Dataset</th>
                <th className="py-3 px-3">4. Model</th>
                <th className="py-3 px-3">5. Variable</th>
                <th className="py-3 px-3">6. Value</th>
                <th className="py-3 px-3">7. Unit</th>
                <th className="py-3 px-3">8. Data Type</th>
                <th className="py-3 px-3">9. Run</th>
                <th className="py-3 px-3">10. Issued At</th>
                <th className="py-3 px-3">11. Valid Time</th>
                <th className="py-3 px-3">12. Forecast Lead</th>
                <th className="py-3 px-3">13. Latitude</th>
                <th className="py-3 px-3">14. Longitude</th>
                <th className="py-3 px-3">15. Source Lat</th>
                <th className="py-3 px-3">16. Source Lng</th>
                <th className="py-3 px-3">17. Spatial Method</th>
                <th className="py-3 px-3">18. Spatial Dist</th>
                <th className="py-3 px-3">19. Resolution</th>
                <th className="py-3 px-3">20. Retrieved At</th>
                <th className="py-3 px-3">21. Availability</th>
                <th className="py-3 px-3">22. Validation</th>
                <th className="py-3 px-3">23. Quality</th>
                <th className="py-3 px-3">24. Error Code</th>
                <th className="py-3 px-3">25. Record ID</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={26} className="py-8 text-center text-slate-400 text-xs">
                    No records match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const rowKey = `${entry.recordId}__${entry.variable}`;
                  const isSelected = selectedRowKey === rowKey;
                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        onClick={() => setSelectedRowKey(isSelected ? null : rowKey)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-orange-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* 1. Source */}
                        <td className="py-2.5 px-3 font-bold text-slate-900">{entry.source}</td>
                        {/* 2. Provider */}
                        <td className="py-2.5 px-3 text-slate-700">{entry.provider}</td>
                        {/* 3. Dataset */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{entry.dataset}</td>
                        {/* 4. Model */}
                        <td className="py-2.5 px-3 text-slate-800">{entry.model}</td>
                        {/* 5. Variable */}
                        <td className="py-2.5 px-3 font-bold text-slate-900">{entry.variable}</td>
                        {/* 6. Value */}
                        <td className="py-2.5 px-3">
                          {entry.value === 'NULL' ? renderNullBadge() : (
                            <span className="font-mono font-bold text-slate-900">{entry.value}</span>
                          )}
                        </td>
                        {/* 7. Unit */}
                        <td className="py-2.5 px-3 font-mono text-slate-600">{entry.unit || '—'}</td>
                        {/* 8. Data Type */}
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {entry.dataType}
                          </span>
                        </td>
                        {/* 9. Run */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {entry.run ? entry.run : renderNullBadge()}
                        </td>
                        {/* 10. Issued At */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {entry.issuedAt ? entry.issuedAt : renderNullBadge()}
                        </td>
                        {/* 11. Valid Time */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {entry.validTime ? entry.validTime : renderNullBadge()}
                        </td>
                        {/* 12. Forecast Lead */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">
                          {entry.forecastLead ? entry.forecastLead : renderNullBadge()}
                        </td>
                        {/* 13. Latitude */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">{entry.latitude.toFixed(4)}°N</td>
                        {/* 14. Longitude */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">{entry.longitude.toFixed(4)}°E</td>
                        {/* 15. Source Latitude */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {entry.sourceLatitude != null ? `${entry.sourceLatitude.toFixed(4)}°N` : renderNullBadge()}
                        </td>
                        {/* 16. Source Longitude */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {entry.sourceLongitude != null ? `${entry.sourceLongitude.toFixed(4)}°E` : renderNullBadge()}
                        </td>
                        {/* 17. Spatial Method */}
                        <td className="py-2.5 px-3 text-[11px] text-slate-700">
                          {entry.spatialMethod ? entry.spatialMethod : renderNullBadge()}
                        </td>
                        {/* 18. Spatial Distance */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {entry.spatialDistanceKm != null ? `${entry.spatialDistanceKm.toFixed(1)} km` : renderNullBadge()}
                        </td>
                        {/* 19. Resolution */}
                        <td className="py-2.5 px-3 text-[11px] text-slate-700">
                          {entry.resolution || entry.spatialResolution || renderNullBadge()}
                        </td>
                        {/* 20. Retrieved At */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{entry.retrievedAt}</td>
                        {/* 21. Availability */}
                        <td className="py-2.5 px-3">{getAvailabilityBadge(entry.availability)}</td>
                        {/* 22. Validation Status */}
                        <td className="py-2.5 px-3">{getValidationBadge(entry.validationStatus)}</td>
                        {/* 23. Quality Status */}
                        <td className="py-2.5 px-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {entry.qualityStatus}
                          </span>
                        </td>
                        {/* 24. Error Code */}
                        <td className="py-2.5 px-3 font-mono text-[10px]">
                          {entry.errorCode ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                              {entry.errorCode}
                            </span>
                          ) : (
                            renderNullBadge()
                          )}
                        </td>
                        {/* 25. Record ID */}
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 max-w-[160px] truncate" title={entry.recordId}>
                          {entry.recordId}
                        </td>
                        {/* Action / Expand */}
                        <td className="py-2.5 px-3 text-right">
                          {isSelected ? (
                            <ChevronUp className="w-4 h-4 ml-auto text-orange-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-auto text-slate-400" />
                          )}
                        </td>
                      </tr>

                      {isSelected && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={26} className="p-4 sm:p-5">
                            {renderExpandedRowDetails(entry, selectedAudit)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. FOOTER COMPLIANCE CALLOUT                                 */}
      {/* ============================================================ */}
      <div className="text-[11px] text-slate-500 bg-slate-50/80 p-3.5 rounded-2xl border border-black/5 flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div>
            <strong className="text-slate-800">ThermaShield 360 Strict Traceability & Truth Standards: </strong>
            <span className="text-slate-600">
              When an upstream provider is offline or unauthenticated, its values are recorded as strictly{' '}
              <strong className="text-slate-700 font-mono">NULL</strong> with status{' '}
              <strong className="text-slate-700">NOT_AVAILABLE</strong>. ThermaShield NEVER synthesizes fake replacement numbers, never proxies an alternate provider under a false identity, and strictly quarantines DEMO data from live operational tables.
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-3">
            <span>ISO 19115 Meteorological Metadata Compliant</span>
            <span>•</span>
            <span>Multi-Horizon Verification Ladder Active</span>
            <span>•</span>
            <span>Spatial Mesh: {lat !== undefined && lng !== undefined ? `(${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)` : 'Selected Location'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Helper: Renders the complete 25-field inspector + 7-point audit checks
  function renderExpandedRowDetails(
    entry: ProvenanceAuditEntry,
    audit?: ValidationAuditResult
  ) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-black/5 shadow-xs space-y-4 text-xs">
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/5">
          <div>
            <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <span>Detailed Traceability Inspector</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 text-[10px] font-bold">
                {entry.source} • {entry.variable}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
              Record ID: {entry.recordId}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Availability:</span>
            {getAvailabilityBadge(entry.availability)}
            <span className="text-[11px] text-slate-500 font-medium ml-2">Validation:</span>
            {getValidationBadge(entry.validationStatus)}
          </div>
        </div>

        {/* 7-Point Quality Audit Checks */}
        {audit && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>7-Point Quality Verification Check</span>
              <span className="text-[11px] font-bold text-emerald-700">
                {audit.passedCount}/{audit.totalChecks} Checks Passed
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {audit.checks.map((chk) => (
                <div
                  key={chk.id}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border ${
                    chk.passed
                      ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
                      : 'bg-red-50/50 border-red-100 text-red-950'
                  }`}
                >
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-[11px]">{chk.name}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{chk.message}</div>
                  </div>
                </div>
              ))}
            </div>
            {audit.warnings.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                <span className="font-bold">Audit Notice: </span>
                {audit.warnings.join('; ')}
              </div>
            )}
          </div>
        )}

        {/* All 25 Traceability Fields Grid */}
        <div className="pt-3 border-t border-black/5">
          <div className="text-xs font-bold text-slate-900 mb-2.5 flex items-center justify-between">
            <span>Canonical 25-Field Traceability Contract</span>
            <span className="text-[10px] text-slate-400 font-mono">ISO 19115 Traceable Audit Ledger</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-[11px]">
            {/* 1. Source */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">1. Source Name</div>
              <div className="font-bold text-slate-900">{entry.source}</div>
            </div>

            {/* 2. Provider */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">2. Provider Authority</div>
              <div className="font-medium text-slate-800 truncate" title={entry.provider}>{entry.provider}</div>
            </div>

            {/* 3. Dataset */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">3. Dataset / Stream</div>
              <div className="font-mono text-slate-800">{entry.dataset}</div>
            </div>

            {/* 4. Model */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">4. Numerical Model</div>
              <div className="font-medium text-slate-800 truncate" title={entry.model}>{entry.model}</div>
            </div>

            {/* 5. Variable */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">5. Variable</div>
              <div className="font-bold text-slate-900">{entry.variable}</div>
            </div>

            {/* 6. Value */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">6. Raw Value</div>
              <div>{entry.value === 'NULL' ? renderNullBadge() : <span className="font-mono font-bold text-slate-900 text-sm">{entry.value}</span>}</div>
            </div>

            {/* 7. Unit */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">7. Physical Unit</div>
              <div className="font-mono text-slate-800">{entry.unit || '—'}</div>
            </div>

            {/* 8. Data Type */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">8. Data Classification</div>
              <div className="font-semibold text-slate-800">{entry.dataType}</div>
            </div>

            {/* 9. Run */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">9. Model Run / Cycle</div>
              <div className="font-mono text-slate-700 truncate">{entry.run || renderNullBadge()}</div>
            </div>

            {/* 10. Issued At */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">10. Model Issue Timestamp</div>
              <div className="font-mono text-slate-700 truncate">{entry.issuedAt || renderNullBadge()}</div>
            </div>

            {/* 11. Valid Time */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">11. Valid Time</div>
              <div className="font-mono text-slate-700 truncate">{entry.validTime || renderNullBadge()}</div>
            </div>

            {/* 12. Forecast Lead */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">12. Forecast Lead Step</div>
              <div className="font-semibold text-slate-800">{entry.forecastLead || '+0h'}</div>
            </div>

            {/* 13. Target Latitude */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">13. Target Latitude</div>
              <div className="font-mono text-slate-800">{entry.latitude.toFixed(4)}°N</div>
            </div>

            {/* 14. Target Longitude */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">14. Target Longitude</div>
              <div className="font-mono text-slate-800">{entry.longitude.toFixed(4)}°E</div>
            </div>

            {/* 15. Source Latitude */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">15. Source Grid Latitude</div>
              <div className="font-mono text-slate-800">
                {entry.sourceLatitude != null ? `${entry.sourceLatitude.toFixed(4)}°N` : renderNullBadge()}
              </div>
            </div>

            {/* 16. Source Longitude */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">16. Source Grid Longitude</div>
              <div className="font-mono text-slate-800">
                {entry.sourceLongitude != null ? `${entry.sourceLongitude.toFixed(4)}°E` : renderNullBadge()}
              </div>
            </div>

            {/* 17. Spatial Method */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">17. Spatial Interpolation</div>
              <div className="font-semibold text-slate-800">{entry.spatialMethod || 'NEAREST'}</div>
            </div>

            {/* 18. Spatial Distance */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">18. Spatial Distance (km)</div>
              <div className="font-mono text-slate-800">
                {entry.spatialDistanceKm != null ? `${entry.spatialDistanceKm.toFixed(1)} km` : renderNullBadge()}
              </div>
            </div>

            {/* 19. Spatial Resolution */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">19. Spatial Resolution</div>
              <div className="font-medium text-slate-800">{entry.resolution || entry.spatialResolution || '0.25 deg'}</div>
            </div>

            {/* 20. Ingestion Timestamp */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">20. Retrieved Timestamp</div>
              <div className="font-mono text-slate-800">{entry.retrievedAt}</div>
            </div>

            {/* 21. Provider Availability */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">21. Availability State</div>
              <div className="mt-0.5">{getAvailabilityBadge(entry.availability)}</div>
            </div>

            {/* 22. Validation Flag */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">22. Validation Status</div>
              <div className="mt-0.5">{getValidationBadge(entry.validationStatus)}</div>
            </div>

            {/* 23. Quality Status */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">23. Quality Status</div>
              <div className="font-bold text-slate-800">{entry.qualityStatus}</div>
            </div>

            {/* 24. Error Code */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">24. Upstream Error Code</div>
              <div className="font-mono text-slate-700">
                {entry.errorCode ? (
                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                    {entry.errorCode}
                  </span>
                ) : (
                  renderNullBadge()
                )}
              </div>
            </div>

            {/* 25. Record ID */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 sm:col-span-2 lg:col-span-5">
              <div className="text-[10px] text-slate-400 font-medium">25. Cryptographic Canonical Record ID</div>
              <div className="font-mono text-slate-700 truncate text-[10px]" title={entry.recordId}>
                {entry.recordId}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// Aliases for seamless backward compatibility
export const DataProvenanceTable = SourceDataTable;
export const ProviderDataTable = SourceDataTable;
export default SourceDataTable;
