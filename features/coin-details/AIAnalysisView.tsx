import React from 'react';
import { AIAnalysisResult, AnalysisStrategy } from '../../types';
import { Card } from '../../components/common/Card';
import { ConfluencesIcon, ManagementIcon } from '../../components/common/Icons';

interface AIAnalysisViewProps {
  analysis: AIAnalysisResult;
  strategy: AnalysisStrategy;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({ analysis, strategy }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: Setup */}
      <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-lg border-l-4 shadow-lg bg-slate-900 ${analysis.setup.direction === 'Long' ? 'border-emerald-500 shadow-emerald-900/10' : analysis.setup.direction === 'Short' ? 'border-rose-500 shadow-rose-900/10' : 'border-slate-500'}`}>
              <div className="flex justify-between items-start mb-4">
                  <div><h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Setup</h4><span className={`text-xs font-bold ${analysis.setup.direction === 'Long' ? 'text-emerald-400' : analysis.setup.direction === 'Short' ? 'text-rose-400' : 'text-slate-400'}`}>{analysis.setup.direction.toUpperCase()}</span></div>
                  {analysis.setup.confidenceLevel === 'High' && <span className="bg-indigo-500 text-white text-[10px] px-2 py-1 rounded font-bold shadow-sm">HIGH PROBABILITY</span>}
              </div>
              <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center p-2 rounded bg-blue-950/30 border border-blue-900/30"><span className="flex items-center gap-2 text-blue-400 font-bold"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> ENTRY</span><span className="text-white font-bold">{analysis.setup.entryZone}</span></div>
                  <div className="flex justify-between items-center p-2 rounded bg-rose-950/30 border border-rose-900/30"><span className="flex items-center gap-2 text-rose-400 font-bold"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> SL</span><span className="text-white font-bold">{analysis.setup.stopLoss}</span></div>
                  <div className="flex flex-col p-2 rounded bg-emerald-950/30 border border-emerald-900/30">
                      <div className="flex justify-between mb-1"><span className="flex items-center gap-2 text-emerald-400 font-bold"><span className="w-2 h-2 bg-emerald-500 rounded-full"></span> TP</span></div>
                      <div className="flex flex-wrap gap-2 justify-end">{analysis.setup.takeProfits.map((tp, i) => <span key={i} className="bg-emerald-900/50 text-emerald-200 px-2 py-0.5 rounded text-xs border border-emerald-800">TP{i+1}: {tp}</span>)}</div>
                  </div>
              </div>
              <div className="mt-4 flex justify-between items-center text-xs border-t border-slate-800 pt-3"><span className="text-slate-500 uppercase font-bold">R:R</span><span className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded">{analysis.setup.riskRewardRatio}</span></div>
          </div>
          <Card className="bg-slate-900/50 p-4">
               <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-3 flex items-center gap-2">
                   <ManagementIcon /> Trade Management
               </h4>
               <ul className="text-xs text-slate-300 space-y-2">
                   <li className="flex gap-2"><span className="text-indigo-400 font-bold">BE:</span><span>{analysis.management.breakEvenCondition}</span></li>
                   <li className="flex gap-2"><span className="text-indigo-400 font-bold">Partial:</span><span>{analysis.management.partialTakeProfit}</span></li>
                   <li className="flex gap-2"><span className="text-rose-400 font-bold">Invalid:</span><span>{analysis.setup.invalidationCriteria}</span></li>
               </ul>
          </Card>
      </div>
      {/* MIDDLE: Checklist */}
      <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="p-4 h-full">
               <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-3 flex items-center gap-2">
                   <ConfluencesIcon /> Confluences
               </h4>
               <ul className="space-y-3">{analysis.confluences.map((conf, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-300"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></span>{conf}</li>)}</ul>
               <div className="mt-6 pt-4 border-t border-slate-800"><h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Structure</h4><p className="text-xs text-white bg-slate-950 p-2 rounded border border-slate-800">{analysis.technicalStructure.marketStructure}</p></div>
               <div className="mt-2"><h4 className="text-[10px] text-slate-500 uppercase font-bold mb-2">Key Levels</h4><p className="text-xs text-slate-400">{analysis.technicalStructure.keyLevels}. {analysis.technicalStructure.liquidityFocus}</p></div>
          </Card>
      </div>
      {/* RIGHT: Summary */}
      <div className="lg:col-span-3 flex flex-col gap-4">
          <Card className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 h-full flex flex-col">
               <h4 className="text-[10px] text-slate-500 uppercase font-bold mb-3">Analyst Summary</h4>
               <p className="text-sm text-slate-300 italic mb-4 flex-1">"{analysis.summary}"</p>
               <div className="mt-auto space-y-2">
                   <div className="flex justify-between items-center text-xs"><span className="text-slate-500">Volatility</span><span className="text-white">{analysis.marketContext.volatility}</span></div>
                   <div className="flex justify-between items-center text-xs"><span className="text-slate-500">Timeframe</span><span className="text-white">HTF (4H/Daily)</span></div>
                   <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800"><span className="text-slate-500">Strategy</span><span className="text-indigo-400 font-bold">{strategy}</span></div>
               </div>
          </Card>
      </div>
    </div>
  );
};