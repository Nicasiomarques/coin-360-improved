import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, CrosshairMode } from 'lightweight-charts';
import { CoinData, CandleData } from '../../types';
import { getCoinOHLC } from '../../services/coingeckoService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface CoinChartProps {
  coin: CoinData;
}

const TIMEFRAMES = [
  { label: '24H', days: 1 }, { label: '7D', days: 7 }, { label: '30D', days: 30 }, 
  { label: '3M', days: 90 }, { label: '1Y', days: 365 },
];

function calculateSMA(data: CandleData[], count: number) {
  const avg = (series: CandleData[]) => series.reduce((sum, item) => sum + item.close, 0) / series.length;
  const result = [];
  for (let i = count - 1; i < data.length; i++) {
    result.push({ time: data[i].time, value: avg(data.slice(i - count + 1, i + 1)) });
  }
  return result;
}

export const CoinChart: React.FC<CoinChartProps> = ({ coin }) => {
  const [ohlcData, setOhlcData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedLabel, setSelectedLabel] = useState('30D');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getCoinOHLC(coin.id, selectedDays).then(setOhlcData).finally(() => setIsLoading(false));
  }, [coin, selectedDays]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!chartRef.current) {
      const chart = createChart(containerRef.current, {
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8', attributionLogo: false },
        grid: { vertLines: { color: '#1e293b', style: LineStyle.Dotted }, horzLines: { color: '#1e293b', style: LineStyle.Dotted } },
        width: containerRef.current.clientWidth, height: 400,
        timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: '#334155', scaleMargins: { top: 0.15, bottom: 0.15 } },
        crosshair: { mode: CrosshairMode.Magnet },
      });
      chartRef.current = chart;
      candleSeriesRef.current = (chart as any).addCandlestickSeries({ upColor: '#10b981', downColor: '#f43f5e', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#f43f5e' });
      smaSeriesRef.current = (chart as any).addLineSeries({ color: '#f59e0b', lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false });
      const ro = new ResizeObserver(entries => {
         if(entries[0]?.contentRect) chart.applyOptions({ width: entries[0].contentRect.width, height: entries[0].contentRect.height });
      });
      ro.observe(containerRef.current);
      return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
    }
  }, []);

  useEffect(() => {
     if (chartRef.current && candleSeriesRef.current && smaSeriesRef.current && ohlcData.length > 0) {
        const data = ohlcData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i).sort((a, b) => (a.time as number) - (b.time as number));
        candleSeriesRef.current.setData(data as any);
        smaSeriesRef.current.setData(calculateSMA(data, 20) as any);
        chartRef.current.timeScale().fitContent();
     }
  }, [ohlcData]);

  return (
    <div className="xl:col-span-3 min-h-[500px] bg-slate-950/50 rounded-xl border border-slate-800 p-1 relative flex flex-col">
      <div className="flex justify-between items-center p-3 border-b border-slate-800/50 bg-slate-900/30 rounded-t-xl">
          <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Live Market Data</h3>
          </div>
          <div className="flex bg-slate-900 rounded-lg p-1 gap-0.5 border border-slate-800 overflow-x-auto max-w-full">
            {TIMEFRAMES.map((tf) => (
              <button key={tf.label} onClick={() => { setSelectedLabel(tf.label); setSelectedDays(tf.days); }} className={`px-3 py-1 text-[10px] font-bold rounded hover:bg-slate-800 transition-all uppercase whitespace-nowrap ${selectedLabel === tf.label ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>{tf.label}</button>
            ))}
          </div>
      </div>
      <div className="flex-1 relative w-full h-full min-h-[400px] overflow-hidden"><div ref={containerRef} className="absolute inset-0"></div></div>
      {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20"><LoadingSpinner className="h-8 w-8 border-4 border-indigo-500 mb-2" /></div>}
    </div>
  );
};