import React from 'react';
import { CoinData, AIAnalysisResult, AnalysisStrategy } from '../../types';
import { AIAnalysisView } from './AIAnalysisView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RefreshIcon } from '../../components/common/Icons';

interface AIAnalysisPanelProps {
  coin: CoinData;
  analysisData: AIAnalysisResult | null;
  isLoading: boolean;
  onRefresh?: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ coin, analysisData, isLoading, onRefresh }) => {
  const strategy = AnalysisStrategy.SMC;

  return (
    <div className="space-y-0 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
           <span className="flex h-3 w-3 relative">
               {isLoading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
               <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
           </span>
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Gemini Trade Architect</span>
        </h3>
        <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-indigo-900/30 border border-indigo-500/30 rounded text-xs text-indigo-300 font-bold tracking-wide">SMC ACTIVATED</span>
            {onRefresh && (
                <button 
                    onClick={onRefresh} 
                    disabled={isLoading}
                    className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Regenerate Analysis (Force Refresh)"
                >
                    <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            )}
        </div>
      </div>

      <div className="p-6 relative min-h-[300px]">
        {isLoading && (
           <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                   <LoadingSpinner className="h-5 w-5 border-2 border-indigo-500" />
                   <span className="text-indigo-400 font-mono animate-pulse text-sm">Synthesizing Smart Money Strategy...</span>
              </div>
           </div>
        )}
        {analysisData ? <AIAnalysisView analysis={analysisData} strategy={strategy} /> : 
          !isLoading && <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">Analysis unavailable. Check API Key.</div>
        }
      </div>
    </div>
  );
};