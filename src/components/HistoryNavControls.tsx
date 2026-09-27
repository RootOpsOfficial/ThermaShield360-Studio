import React from 'react';
import { useNavigationHistory } from '../context/NavigationHistoryContext.js';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface HistoryNavControlsProps {
  className?: string;
  variant?: 'light' | 'subtle';
}

export const HistoryNavControls: React.FC<HistoryNavControlsProps> = ({
  className = '',
  variant = 'light',
}) => {
  const { canGoBack, canGoForward, goBack, goForward } = useNavigationHistory();

  return (
    <div
      role="group"
      aria-label="Page history navigation"
      className={`inline-flex items-center gap-1 p-0.5 rounded-xl border border-slate-200/80 bg-slate-50/90 shadow-2xs shrink-0 select-none ${className}`}
    >
      {/* Back Button */}
      <button
        type="button"
        onClick={goBack}
        disabled={!canGoBack}
        aria-label="Go back to previous page"
        title={canGoBack ? 'Go back' : 'No previous history'}
        className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
          canGoBack
            ? 'text-slate-700 hover:text-slate-950 hover:bg-white active:scale-95 shadow-2xs cursor-pointer'
            : 'text-slate-300 cursor-not-allowed opacity-40'
        }`}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>

      {/* Forward Button */}
      <button
        type="button"
        onClick={goForward}
        disabled={!canGoForward}
        aria-label="Go forward to next page"
        title={canGoForward ? 'Go forward' : 'No forward history'}
        className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
          canGoForward
            ? 'text-slate-700 hover:text-slate-950 hover:bg-white active:scale-95 shadow-2xs cursor-pointer'
            : 'text-slate-300 cursor-not-allowed opacity-40'
        }`}
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
