import React, { useEffect, useState } from 'react';
import MarketMap from './components/MarketMap';
import CoinModal from './components/CoinDrawer'; // Conceptually a modal now
import AddCoinSearch from './components/AddCoinSearch';
import { getTopCoins, getCoinDetails } from './services/coingeckoService';
import { CoinData } from './types';

const App: React.FC = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  
  // Track IDs of coins currently in the view
  const [activeCoinIds, setActiveCoinIds] = useState<string[]>([]);

  // Initial Fetch: Top 10
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      const topCoins = await getTopCoins(10);
      setCoins(topCoins);
      setActiveCoinIds(topCoins.map(c => c.id));
      setLoading(false);
    };

    fetchInitial();
  }, []);

  // Handler to add a new coin
  const handleAddCoin = async (coinId: string) => {
    // If already exists, just scroll to it or highlight (in this case, just ignore)
    if (activeCoinIds.includes(coinId)) return;

    // Fetch details for the new coin
    const newCoinData = await getCoinDetails([coinId]);
    if (newCoinData.length > 0) {
      setCoins(prev => [...prev, newCoinData[0]]);
      setActiveCoinIds(prev => [...prev, coinId]);
    }
  };

  const handleRefresh = async () => {
      if (activeCoinIds.length === 0) return;
      setLoading(true);
      const updatedData = await getCoinDetails(activeCoinIds);
      setCoins(updatedData);
      setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200">
      
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CryptoView<span className="text-indigo-400">360</span> AI</h1>
        </div>

        <div className="flex items-center gap-4">
          <AddCoinSearch 
            onAddCoin={handleAddCoin} 
            existingIds={activeCoinIds}
          />
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
            title="Refresh Data"
          >
             <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-4 relative">
        <div className="w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
                 <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Market Overview (Size = Market Cap)</h2>
                 <div className="flex gap-4 text-xs font-medium">
                     <div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Bullish</div>
                     <div className="flex items-center gap-1"><span className="w-3 h-3 bg-rose-500 rounded-sm"></span> Bearish</div>
                 </div>
            </div>
            
            <div className="flex-1 min-h-0">
                <MarketMap data={coins} onSelectCoin={setSelectedCoin} />
            </div>
        </div>

        {/* Modal Overlay - Rendered conditionally */}
        {selectedCoin && (
          <CoinModal 
            coin={selectedCoin} 
            onClose={() => setSelectedCoin(null)} 
          />
        )}
      </main>
    </div>
  );
};

export default App;