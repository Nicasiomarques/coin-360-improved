import React from 'react';
import { CoinData } from '../../types';
import { AIAnalysisView } from './AIAnalysisView';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAIAnalysis } from '../../hooks/useAIAnalysis';

interface AIAnalysisPanelProps {
  coin: CoinData;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ coin }) => {
  const { analysis, isAnalyzing, strategy } = useAIAnalysis(coin);

  return (
    <div className="space-y-0 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
           <span className="flex h-3 w-3 relative">
               {isAnalyzing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
               <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
           </span>
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Gemini Trade Architect</span>
        </h3>
        <div className="flex items-center gap-2"><span className="px-2 py-1 bg-indigo-900/30 border border-indigo-500/30 rounded text-xs text-indigo-300 font-bold tracking-wide">SMC ACTIVATED</span></div>
      </div>

      <div className="p-6 relative min-h-[300px]">
        {isAnalyzing && (
           <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                   <LoadingSpinner className="h-5 w-5 border-2 border-indigo-500" />
                   <span className="text-indigo-400 font-mono animate-pulse text-sm">Synthesizing Smart Money Strategy...</span>
              </div>
           </div>
        )}
        {analysis ? <AIAnalysisView analysis={analysis} strategy={strategy} /> : 
          !isAnalyzing && <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">Analysis unavailable. Check API Key.</div>
        }
      </div>
    </div>
  );
};