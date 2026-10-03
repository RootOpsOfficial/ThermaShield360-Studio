import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Clock, XCircle, Loader2 } from 'lucide-react';
import { getApiUrl } from '../../lib/api.js';

export const SimpleSourceTable: React.FC<{ lat?: number; lng?: number }> = ({ lat, lng }) => {
  const [sources, setSources] = useState<{ source: string; status: string; validation: string; vars: string[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    const fetchSources = async () => {
      setLoading(true);
      try {
        const res = await fetch(getApiUrl('/api/data/provenance?lat=' + lat + '&lng=' + lng));
        if (res.ok) {
          const data = await res.json();
          const map = new Map<string, { status: string; validation: string; vars: Set<string> }>();
          
          (data.entries || []).forEach((e: any) => {
             const key = e.source || e.provider;
             if (!key) return;
             if (!map.has(key)) {
                map.set(key, { status: e.availability, validation: e.validationStatus, vars: new Set() });
             }
             if (e.variable) map.get(key)!.vars.add(e.variable);
          });
          
          const parsed = Array.from(map.entries()).map(([k, v]) => ({
             source: k,
             status: v.status,
             validation: v.validation,
             vars: Array.from(v.vars)
          }));
          setSources(parsed);
        }
      } catch (err) {
        console.error('Failed to fetch simple provenance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Scanning live meteorological feeds...</span>
      </div>
    );
  }

  if (!sources.length) return null;

  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200/60 bg-white/50 shadow-xs">
      <table className="w-full text-left text-xs whitespace-nowrap">
        <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
          <tr>
            <th className="px-4 py-2.5">Data Source</th>
            <th className="px-4 py-2.5">Network Status</th>
            <th className="px-4 py-2.5">Integrity</th>
            <th className="px-4 py-2.5">Parameters</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {sources.map((s, idx) => (
             <tr key={idx} className="hover:bg-white/80 transition-colors">
               <td className="px-4 py-2 font-bold text-slate-800">{s.source}</td>
               <td className="px-4 py-2">
                 {s.status === 'LIVE' ? (
                   <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50">
                     <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Live
                   </span>
                 ) : s.status === 'RATE_LIMITED' ? (
                   <span className="inline-flex items-center gap-1 text-orange-700 font-semibold bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100/50">
                     <AlertTriangle className="w-3 h-3 text-orange-500" /> Limited
                   </span>
                 ) : s.status === 'CACHE' ? (
                   <span className="inline-flex items-center gap-1 text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/50">
                     <Clock className="w-3 h-3 text-blue-500" /> Cached
                   </span>
                 ) : (
                   <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/50">
                     <XCircle className="w-3 h-3 text-slate-400" /> Unavailable
                   </span>
                 )}
               </td>
               <td className="px-4 py-2">
                 {s.validation === 'VERIFIED' ? (
                   <span className="text-emerald-600 font-bold">Verified</span>
                 ) : s.validation === 'NOT_AVAILABLE' ? (
                   <span className="text-slate-400">—</span>
                 ) : (
                   <span className="text-amber-600 font-bold">{s.validation}</span>
                 )}
               </td>
               <td className="px-4 py-2 text-[10px] text-slate-500 truncate max-w-[200px]" title={s.vars.join(', ')}>
                 {s.vars.slice(0, 3).join(', ')}
                 {s.vars.length > 3 ? ' +' + (s.vars.length - 3) : ''}
               </td>
             </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
