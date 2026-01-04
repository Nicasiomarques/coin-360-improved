import React from 'react';
import { CoinData } from '../../types';
import { CoinHeader } from './CoinHeader';
import { CoinChart } from './CoinChart';
import { CoinStats } from './CoinStats';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { NewsImpactPanel } from './NewsImpactPanel';
import { useCombinedAnalysis } from '../../hooks/useCombinedAnalysis';

interface CoinDrawerProps {
  coin: CoinData | null;
  onClose: () => void;
}

const CoinDrawer: React.FC<CoinDrawerProps> = ({ coin, onClose }) => {
  // We lift the state up to the drawer so we make one call
  const { data, isAnalyzing, refresh } = useCombinedAnalysis(coin || {} as CoinData);

  if (!coin) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-7xl max-h-[95vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-y-auto flex flex-col">
        <CoinHeader coin={coin} onClose={onClose} />
        <div className="flex-1 p-6 space-y-6">
          
          {/* Top: Chart */}
          <div className="w-full">
            <CoinChart coin={coin} />
          </div>

          {/* Middle: Stats Grid */}
          <div className="w-full">
             <CoinStats coin={coin} />
          </div>

          {/* SMC Analysis (Full Width) */}
          <div className="w-full">
            <AIAnalysisPanel 
                coin={coin} 
                analysisData={data?.technicalAnalysis || null} 
                isLoading={isAnalyzing}
                onRefresh={refresh}
            />
          </div>
          
          {/* News & Impact (Full Width) */}
          <div className="w-full">
            <NewsImpactPanel 
                coin={coin} 
                newsData={data?.newsAnalysis || null} 
                isLoading={isAnalyzing} 
            />
          </div>

        </div>
      </div>
    </div>
  );
};
export default CoinDrawer;