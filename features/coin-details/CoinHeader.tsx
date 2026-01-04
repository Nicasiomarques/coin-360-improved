import React from 'react';
import { CoinData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { CloseIcon } from '../../components/common/Icons';

interface CoinHeaderProps {
  coin: CoinData;
  onClose: () => void;
}

export const CoinHeader: React.FC<CoinHeaderProps> = ({ coin, onClose }) => {
  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <div className="flex-none p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-5">
        <div className="relative">
            <img src={coin.image} alt={coin.name} className="w-16 h-16 rounded-full bg-slate-800 p-1 ring-1 ring-slate-700" />
            <span className="absolute -bottom-1 -right-1 bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">#{coin.market_cap_rank}</span>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
             <h2 className="text-3xl font-bold text-white tracking-tight">{coin.name}</h2>
             <span className="text-slate-500 font-bold text-lg">{coin.symbol.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span className={`text-2xl font-mono font-bold tracking-tight ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(coin.current_price)}
            </span>
            <span className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-md border ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}% (24h)
            </span>
          </div>
        </div>
      </div>
      <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700">
        <CloseIcon />
      </button>
    </div>
  );
};