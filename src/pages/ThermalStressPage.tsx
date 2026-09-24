import React from 'react';
import { ThermalStressBlock } from '../components/ThermalStressBlock.js';

export const ThermalStressPage: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <ThermalStressBlock isStandalone />
    </div>
  );
};
