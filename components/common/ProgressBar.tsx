import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, colorClass = "bg-indigo-500" }) => {
    const percentage = Math.min(100, Math.max(0, ((value / max) * 100)));
    return (
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className={`${colorClass} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};