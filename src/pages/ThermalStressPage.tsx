import React, { useState } from 'react';
import { ThermalStressBlock } from '../components/ThermalStressBlock.js';
import { ProvenanceTable } from '../components/data/ProvenanceTable.js';
import { DataValidationCenter } from '../components/data/DataValidationCenter.js';
import { useCitizen } from '../context/CitizenContext.js';
import { ShieldCheck, Database, Layers } from 'lucide-react';

export const ThermalStressPage: React.FC = () => {
  const [showValidationCenter, setShowValidationCenter] = useState(false);
  const { location } = useCitizen();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <ThermalStressBlock isStandalone />

      {/* Provenance & Input Verification Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">
                Input Data Sources & Provenance Verification
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every thermal stress index (WBGT, UTCI, Heat Index) is strictly derived from verified, normalized multi-provider feeds.
            </p>
          </div>

          <button
            onClick={() => setShowValidationCenter(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
          >
            <Database className="w-3.5 h-3.5 text-orange-400" />
            <span>Open Data Validation Center</span>
          </button>
        </div>

        <ProvenanceTable lat={location.lat} lng={location.lng} onOpenValidationCenter={() => setShowValidationCenter(true)} />
      </div>

      {showValidationCenter && (
        <DataValidationCenter isModal onClose={() => setShowValidationCenter(false)} lat={location.lat} lng={location.lng} locationName={location.ward?.name} />
      )}
    </div>
  );
};
