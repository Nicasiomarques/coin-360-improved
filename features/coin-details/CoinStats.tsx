import React from 'react';
import { CoinData } from '../../types';
import { ProgressBar } from '../../components/common/ProgressBar';
import { RangeBar } from '../../components/common/RangeBar';
import { formatCurrency, formatCompact } from '../../utils/formatters';
import { Card } from '../../components/common/Card';

interface CoinStatsProps {
  coin: CoinData;
}

export const CoinStats: React.FC<CoinStatsProps> = ({ coin }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 24h Range */}
        <Card className="p-4 flex flex-col justify-center">
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">24h Price Range</h4>
            <RangeBar low={coin.low_24h} high={coin.high_24h} current={coin.current_price} />
        </Card>
        
        {/* 2. Supply Metrics */}
        <Card className="p-4 flex flex-col justify-center">
            <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Supply Metrics</h4>
            <div>
                <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">Circulating</span>
                    <span className="text-slate-200 font-mono">{formatCompact(coin.circulating_supply)}</span>
                </div>
                {coin.max_supply ? (
                     <ProgressBar value={coin.circulating_supply} max={coin.max_supply} colorClass="bg-indigo-500" />
                ) : (
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                         <div className="bg-indigo-500 w-full opacity-20 h-full"></div>
                    </div>
                )}
            </div>
        </Card>

        {/* 3. Market Cap */}
        <Card className="p-4 flex flex-col justify-center">
             <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1">Market Cap</h4>
             <div className="text-lg font-mono text-white tracking-tight">{formatCurrency(coin.market_cap)}</div>
             <span className="text-[10px] text-slate-500">Rank #{coin.market_cap_rank}</span>
        </Card>

        {/* 4. Volume 24h */}
        <Card className="p-4 flex flex-col justify-center">
             <h4 className="text-slate-500 text-[10px] uppercase font-bold mb-1">Volume (24h)</h4>
             <div className="text-lg font-mono text-white tracking-tight">{formatCurrency(coin.total_volume)}</div>
             <div className="text-[10px] text-slate-500">
                MCap/Vol: {(coin.market_cap / coin.total_volume).toFixed(2)}
             </div>
        </Card>
    </div>
  );
};
