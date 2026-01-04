import React from 'react';
import { formatCurrency } from '../../utils/formatters';

interface RangeBarProps {
  low: number;
  high: number;
  current: number;
}

export const RangeBar: React.FC<RangeBarProps> = ({ low, high, current }) => {
    const range = high - low;
    const position = range === 0 ? 50 : ((current - low) / range) * 100;
    
    return (
        <div className="relative pt-6 pb-2">
            <div className="flex justify-between text-[10px] text-slate-500 absolute top-0 w-full font-mono">
                <span>L: {formatCurrency(low)}</span>
                <span>H: {formatCurrency(high)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 relative">
                <div 
                    className="absolute top-0 bottom-0 w-2 h-4 -mt-1 bg-white rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.5)] border border-slate-300 transition-all duration-500"
                    style={{ left: `calc(${Math.min(100, Math.max(0, position))}% - 4px)` }}
                />
                <div className="h-full bg-gradient-to-r from-slate-700 via-indigo-900 to-slate-700 rounded-full opacity-50"></div>
            </div>
        </div>
    );
};