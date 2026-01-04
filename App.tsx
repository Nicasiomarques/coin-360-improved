import React, { useState } from 'react';
import MarketMap from './features/market-map/MarketMap';
import CoinDrawer from './features/coin-details/CoinDrawer';
import AddCoinSearch from './features/search/AddCoinSearch';
import { CoinData } from './types';
import { LogoIcon, RefreshIcon } from './components/common/Icons';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { useMarketData } from './hooks/useMarketData';

const App: React.FC = () => {
  const { coins, loading, isAddingCoin, activeCoinIds, addCoin, refreshMarket } = useMarketData();
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200">
      <header className="flex-none h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg"><LogoIcon className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl font-bold tracking-tight text-white">CryptoView<span className="text-indigo-400">360</span> AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             {isAddingCoin && <div className="flex items-center gap-2 mr-2 bg-indigo-900/30 px-3 py-1.5 rounded-full border border-indigo-500/30"><LoadingSpinner className="h-3 w-3 border-2 border-indigo-400" /><span className="text-xs text-indigo-300 font-medium">Adding Asset...</span></div>}
             <AddCoinSearch onAddCoin={addCoin} existingIds={activeCoinIds} />
          </div>
          <button onClick={refreshMarket} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700" title="Refresh Data">
             {loading ? <LoadingSpinner className="w-5 h-5 border-2 border-slate-400" /> : <RefreshIcon />}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden p-4 relative">
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
                 <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Market Overview (Size = Market Cap)</h2>
                 <div className="flex gap-4 text-xs font-medium"><div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Bullish</div><div className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded-sm"></span> Bearish</div></div>
            </div>
            <div className="flex-1 min-h-0"><MarketMap data={coins} onSelectCoin={setSelectedCoin} /></div>
        </div>
        {selectedCoin && <CoinDrawer coin={selectedCoin} onClose={() => setSelectedCoin(null)} />}
      </main>
    </div>
  );
};
export default App;