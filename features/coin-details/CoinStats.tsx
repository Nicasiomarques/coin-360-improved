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
    <div className="space-y-4">
        <Card className="p-5">
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">24h Range</h4>
            <RangeBar low={coin.low_24h} high={coin.high_24h} current={coin.current_price} />
        </Card>
        <Card className="p-5 space-y-4">
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2">Supply Metrics</h4>
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Circulating</span>
                    <span className="text-slate-200 font-mono">{formatCompact(coin.circulating_supply)}</span>
                </div>
                {coin.max_supply && <ProgressBar value={coin.circulating_supply} max={coin.max_supply} colorClass="bg-indigo-500" />}
            </div>
        </Card>
        <Card className="p-5 grid grid-cols-1 gap-4">
             <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Market Cap</span>
                <div className="text-lg font-mono text-white tracking-tight">{formatCurrency(coin.market_cap)}</div>
             </div>
             <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Volume (24h)</span>
                <div className="text-lg font-mono text-white tracking-tight">{formatCurrency(coin.total_volume)}</div>
             </div>
        </Card>
    </div>
  );
};