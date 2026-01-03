import React, { useEffect, useState, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, CrosshairMode, LineWidth } from 'lightweight-charts';
import { CoinData, AIAnalysisResult, CandleData } from '../types';
import { analyzeCoinSituation } from '../services/geminiService';
import { getCoinOHLC } from '../services/coingeckoService';

interface CoinModalProps {
  coin: CoinData | null;
  onClose: () => void;
}

// Custom Timeframes requested by user
// Note: CoinGecko Free API dictates resolution based on 'days'. 
// We map these buttons to the best available 'days' parameter.
const TIMEFRAMES = [
  { label: '5M', days: 1 },   // API Limit: ~30min granularity
  { label: '15M', days: 1 },  // API Limit: ~30min granularity
  { label: '30M', days: 1 },  // API Limit: ~30min granularity
  { label: '1H', days: 1 },   // API Limit: ~30min granularity
  { label: '4H', days: 7 },   // API Limit: 4h granularity
  { label: '1D', days: 30 },  // API Limit: 4h granularity
  { label: '1W', days: 90 },  // API Limit: 4d granularity
  { label: '1M', days: 365 }, // API Limit: 4d granularity
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 8 : 2,
  }).format(value);
};

const formatCompact = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2
  }).format(value);
};

// Simple Moving Average Calculation
function calculateSMA(data: CandleData[], count: number) {
  const avg = (series: CandleData[]) => {
    let sum = 0;
    for (let i = 0; i < series.length; i++) {
      sum += series[i].close;
    }
    return sum / series.length;
  };
  const result = [];
  for (let i = count - 1, len = data.length; i < len; i++) {
    const val = avg(data.slice(i - count + 1, i + 1));
    result.push({ time: data[i].time, value: val });
  }
  return result;
}

const ProgressBar: React.FC<{ value: number; max: number; colorClass?: string }> = ({ value, max, colorClass = "bg-indigo-500" }) => {
    const percentage = Math.min(100, Math.max(0, ((value / max) * 100)));
    return (
        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className={`${colorClass} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const RangeBar: React.FC<{ low: number; high: number; current: number }> = ({ low, high, current }) => {
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
}

const CoinModal: React.FC<CoinModalProps> = ({ coin, onClose }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ohlcData, setOhlcData] = useState<CandleData[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [selectedTimeframeLabel, setSelectedTimeframeLabel] = useState('1D');
  const [selectedDays, setSelectedDays] = useState(30); // Default to 1D equivalent days
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Load AI Analysis (Only once per coin)
  useEffect(() => {
    if (coin) {
      setAnalysis(null);
      setIsAnalyzing(true);
      analyzeCoinSituation(coin)
        .then(result => setAnalysis(result))
        .catch(err => console.error(err))
        .finally(() => setIsAnalyzing(false));
    }
  }, [coin]);

  // Load OHLC Data
  useEffect(() => {
    if (coin) {
      setOhlcData([]);
      setIsLoadingChart(true);

      getCoinOHLC(coin.id, selectedDays)
        .then(data => setOhlcData(data))
        .catch(err => console.error("Chart data error", err))
        .finally(() => setIsLoadingChart(false));
    }
  }, [coin, selectedDays]);

  // Initialize and Update Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Initialize Chart if not exists
    if (!chartRef.current) {
      const chartOptions = {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#94a3b8',
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: '#1e293b', style: LineStyle.Dotted },
          horzLines: { color: '#1e293b', style: LineStyle.Dotted },
        },
        // Auto-width via ResizeObserver, initial 100%
        width: chartContainerRef.current.clientWidth,
        height: 400,
        timeScale: {
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#334155',
          scaleMargins: {
             top: 0.15,
             bottom: 0.15,
          },
        },
        crosshair: {
            mode: CrosshairMode.Magnet, // Magnet mode for professional feel
            vertLine: {
                width: 1 as LineWidth,
                color: '#64748b',
                style: LineStyle.Dashed,
            },
            horzLine: {
                width: 1 as LineWidth,
                color: '#64748b',
                style: LineStyle.Dashed,
            },
        },
      };

      const chart = createChart(chartContainerRef.current, chartOptions);
      chartRef.current = chart;

      // Add Candlestick Series
      candlestickSeriesRef.current = (chart as any).addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#f43f5e',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#f43f5e',
      });

      // Add SMA Series (Simple Moving Average 20)
      smaSeriesRef.current = (chart as any).addLineSeries({
          color: '#f59e0b', // Amber
          lineWidth: 2 as LineWidth,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
          priceLineVisible: false,
      });

      // Resize Observer for robust responsiveness
      const handleResize = (entries: ResizeObserverEntry[]) => {
          if (entries.length === 0 || !entries[0].contentRect) return;
          const { width, height } = entries[0].contentRect;
          chartRef.current?.applyOptions({ width, height });
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(chartContainerRef.current);

      return () => {
          resizeObserver.disconnect();
          chart.remove();
          chartRef.current = null;
      };
    }
  }, []); // Run once on mount to setup chart instance

  // 2. Update Data on Series
  useEffect(() => {
     if (chartRef.current && candlestickSeriesRef.current && smaSeriesRef.current) {
        if (ohlcData.length > 0) {
            // Sort and filter unique
            const uniqueData = ohlcData
                .filter((v, i, a) => a.findIndex(t => (t.time === v.time)) === i)
                .sort((a, b) => (a.time as number) - (b.time as number));
            
            candlestickSeriesRef.current.setData(uniqueData as any);

            // Calculate and set SMA
            const smaData = calculateSMA(uniqueData, 20);
            smaSeriesRef.current.setData(smaData as any);

            chartRef.current.timeScale().fitContent();
        } else {
            candlestickSeriesRef.current.setData([]);
            smaSeriesRef.current.setData([]);
        }
     }
  }, [ohlcData]);

  if (!coin) return null;

  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-7xl max-h-[95vh] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Header - Professional Ticker Style */}
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* Top Section: Chart + Detailed Stats Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Chart Area (Span 3) */}
            <div className="xl:col-span-3 min-h-[500px] bg-slate-950/50 rounded-xl border border-slate-800 p-1 relative flex flex-col">
               {/* Toolbar */}
              <div className="flex justify-between items-center p-3 border-b border-slate-800/50 bg-slate-900/30 rounded-t-xl">
                  <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Live Market Data</h3>
                      <div className="flex items-center gap-2 ml-4">
                          <span className="w-3 h-0.5 bg-yellow-500"></span>
                          <span className="text-[10px] text-slate-500 font-mono">SMA 20</span>
                      </div>
                  </div>
                  
                  {/* Timeframe Selector */}
                  <div className="flex bg-slate-900 rounded-lg p-1 gap-0.5 border border-slate-800 overflow-x-auto max-w-full">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf.label}
                        onClick={() => {
                            setSelectedTimeframeLabel(tf.label);
                            setSelectedDays(tf.days);
                        }}
                        className={`px-3 py-1 text-[10px] font-bold rounded hover:bg-slate-800 transition-all uppercase whitespace-nowrap ${
                          selectedTimeframeLabel === tf.label
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
              </div>
              
              {/* Chart Container - Relative & Absolute to handle ResizeObserver correctly */}
              <div className="flex-1 relative w-full h-full min-h-[400px] overflow-hidden">
                   <div ref={chartContainerRef} className="absolute inset-0"></div>
              </div>

              {/* Chart Overlay States */}
              {isLoadingChart && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
                     <div className="flex flex-col items-center">
                         <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent mb-2"></div>
                         <span className="text-xs text-indigo-400 font-mono">Loading Data...</span>
                     </div>
                 </div>
              )}
              {!isLoadingChart && ohlcData.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <span className="text-slate-500 font-mono">No chart data available</span>
                  </div>
              )}
            </div>

            {/* Right Side: Market Pulse (Span 1) */}
            <div className="space-y-4">
                {/* 24h Range Card */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">24h Range</h4>
                    <RangeBar low={coin.low_24h} high={coin.high_24h} current={coin.current_price} />
                </div>

                {/* Supply Stats */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm space-y-4">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2">Supply Metrics</h4>
                    
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">Circulating</span>
                            <span className="text-slate-200 font-mono">{formatCompact(coin.circulating_supply)}</span>
                        </div>
                        {coin.max_supply && (
                             <ProgressBar value={coin.circulating_supply} max={coin.max_supply} colorClass="bg-indigo-500" />
                        )}
                    </div>
                    
                    <div className="pt-2">
                        <div className="flex justify-between text-xs mb-1">
                             <span className="text-slate-500">Total Supply</span>
                             <span className="text-slate-300 font-mono">{formatCompact(coin.total_supply)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                             <span className="text-slate-500">Max Supply</span>
                             <span className="text-slate-300 font-mono">{coin.max_supply ? formatCompact(coin.max_supply) : '∞'}</span>
                        </div>
                    </div>
                </div>

                {/* Valuation */}
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm grid grid-cols-1 gap-4">
                     <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Market Cap</span>
                        <div className="text-lg font-mono text-white tracking-tight">{formatCurrency(coin.market_cap)}</div>
                     </div>
                     <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Volume (24h)</span>
                        <div className="text-lg font-mono text-white tracking-tight">{formatCurrency(coin.total_volume)}</div>
                     </div>
                </div>
            </div>
          </div>

          {/* Historical Performance Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">All-Time High</span>
                  <div className="text-white font-mono font-bold">{formatCurrency(coin.ath)}</div>
                  <div className="text-rose-400 text-xs mt-1 font-mono">{coin.ath_change_percentage?.toFixed(2)}%</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">All-Time Low</span>
                  <div className="text-white font-mono font-bold">{formatCurrency(coin.atl)}</div>
                  <div className="text-emerald-400 text-xs mt-1 font-mono">+{coin.atl_change_percentage?.toFixed(2)}%</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Vol / M.Cap Ratio</span>
                  <div className="text-white font-mono font-bold">
                    {(coin.total_volume / coin.market_cap).toFixed(4)}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Liquidity Indicator</div>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                   <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Global Rank</span>
                   <div className="text-white font-mono font-bold">#{coin.market_cap_rank}</div>
                   <div className="text-slate-500 text-xs mt-1">by Capitalization</div>
              </div>
          </div>

          {/* AI Strategy Section - Premium Look */}
          <div className="space-y-0 bg-slate-950 rounded-xl border border-indigo-900/30 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                 <span className="flex h-3 w-3 relative">
                     {isAnalyzing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                 </span>
                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Gemini AI Analyst</span>
              </h3>
              {analysis && (
                  <div className="flex gap-2">
                     <span className={`px-3 py-1 rounded text-xs font-bold border uppercase tracking-wide ${
                         analysis.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                         analysis.sentiment === 'Bearish' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                         'bg-slate-800 text-slate-300 border-slate-700'
                     }`}>
                         {analysis.sentiment}
                     </span>
                  </div>
              )}
            </div>

            <div className="p-6 relative min-h-[200px]">
              {isAnalyzing && (
                 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                         <div className="animate-spin h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                         <span className="text-indigo-400 font-mono animate-pulse text-sm">Processing ICT Market Structure...</span>
                    </div>
                 </div>
              )}

              {analysis ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Technicals */}
                  <div className="space-y-6 lg:col-span-1 border-r border-slate-800/50 pr-6">
                    <div>
                      <h4 className="text-slate-500 font-mono text-[10px] uppercase mb-2">Market Structure</h4>
                      <p className="text-white font-medium text-sm leading-relaxed">{analysis.ictAnalysis.marketStructure}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                             <h4 className="text-indigo-400 text-[10px] uppercase font-bold mb-1">Order Blocks</h4>
                             <p className="text-xs text-slate-300">{analysis.ictAnalysis.orderBlocks}</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                             <h4 className="text-purple-400 text-[10px] uppercase font-bold mb-1">FVG / Gap</h4>
                             <p className="text-xs text-slate-300">{analysis.ictAnalysis.fairValueGaps}</p>
                        </div>
                    </div>
                    
                    <div>
                       <h4 className="text-slate-500 font-mono text-[10px] uppercase mb-1">Liquidity Status</h4>
                       <p className="text-xs text-slate-400">{analysis.ictAnalysis.liquiditySweeps}</p>
                    </div>
                  </div>

                  {/* Middle: Strategy */}
                  <div className="lg:col-span-1 border-r border-slate-800/50 pr-6 flex flex-col justify-center">
                         <h4 className="text-emerald-500 font-mono text-[10px] uppercase mb-3">Recommended Strategy</h4>
                         <div className="bg-emerald-950/20 p-4 rounded-lg border-l-2 border-emerald-500">
                             <p className="text-emerald-100 text-sm leading-relaxed font-medium">"{analysis.suggestedStrategy}"</p>
                         </div>
                         <div className="mt-4">
                             <h4 className="text-slate-500 font-mono text-[10px] uppercase mb-1">Zone</h4>
                             <p className="text-white font-bold">{analysis.ictAnalysis.premiumDiscount}</p>
                         </div>
                  </div>
                  
                  {/* Right: Summary */}
                  <div className="lg:col-span-1 flex flex-col">
                        <h4 className="text-slate-500 font-mono text-[10px] uppercase mb-2">Executive Summary</h4>
                        <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
                        
                        <div className="mt-auto pt-4">
                            <h4 className="text-slate-500 font-mono text-[10px] uppercase mb-1">Trend Strength</h4>
                            <p className="text-white text-xs">{analysis.trendStatus}</p>
                        </div>
                  </div>
                </div>
              ) : (
                !isAnalyzing && <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm">Analysis unavailable. Check API Key.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CoinModal;