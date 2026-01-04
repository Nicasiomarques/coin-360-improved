import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle, CrosshairMode, IPriceLine, MouseEventParams } from 'lightweight-charts';
import { CoinData, CandleData, AIAnalysisResult } from '../../types';
import { getCoinOHLC } from '../../services/coingeckoService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { FullScreenIcon, ExitFullScreenIcon } from '../../components/common/Icons';

interface CoinChartProps {
  coin: CoinData;
  analysisData: AIAnalysisResult | null;
}

const TIMEFRAMES = [
  { label: '24H', days: 1 }, { label: '7D', days: 7 }, { label: '30D', days: 30 }, 
  { label: '3M', days: 90 }, { label: '1Y', days: 365 },
];

// Helper to extract a number from a price string or number
function parsePrice(input: string | number | undefined): number | null {
  if (input === undefined || input === null) return null;
  if (typeof input === 'number') return input;
  
  // Remove currency symbols and commas, look for the first valid number
  const cleanStr = input.replace(/[$,]/g, '');
  const match = cleanStr.match(/(\d+\.?\d*)/);
  if (match) return parseFloat(match[0]);
  return null;
}

interface OverlayZone {
    id: string;
    top: number;
    height: number;
    label: string;
    type: 'FVG' | 'OB' | 'PREMIUM' | 'DISCOUNT' | 'RESISTANCE' | 'SUPPORT';
    colorClass: string;
    borderClass: string;
    textClass: string;
}

export const CoinChart: React.FC<CoinChartProps> = ({ coin, analysisData }) => {
  const [ohlcData, setOhlcData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [selectedLabel, setSelectedLabel] = useState('30D');
  const [overlays, setOverlays] = useState<OverlayZone[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Toggles for "Essential Analysis"
  const [showAI, setShowAI] = useState(true);

  // Legend State
  const [legendData, setLegendData] = useState<{ open: number; high: number; low: number; close: number; percent?: number } | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null); // For fullscreen
  const containerRef = useRef<HTMLDivElement>(null); // For chart rendering
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const rafRef = useRef<number>();

  // Full Screen Handler
  const toggleFullScreen = () => {
    if (!wrapperRef.current) return;
    
    if (!document.fullscreenElement) {
        wrapperRef.current.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => console.error(err));
    } else {
        document.exitFullscreen().then(() => setIsFullScreen(false));
    }
  };

  // Listen for escape key or other fullscreen exits
  useEffect(() => {
    const handleFsChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getCoinOHLC(coin.id, selectedDays).then(data => {
        setOhlcData(data);
        if (data.length > 0) {
            const last = data[data.length - 1];
            setLegendData({ open: last.open, high: last.high, low: last.low, close: last.close });
        }
    }).finally(() => setIsLoading(false));
  }, [coin, selectedDays]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!chartRef.current) {
      const chart = createChart(containerRef.current, {
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8', attributionLogo: false },
        grid: { vertLines: { color: '#1e293b', style: LineStyle.Dotted }, horzLines: { color: '#1e293b', style: LineStyle.Dotted } },
        width: containerRef.current.clientWidth, height: 400,
        timeScale: { borderColor: '#334155', timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderColor: '#334155', scaleMargins: { top: 0.1, bottom: 0.1 } }, // Increased margins for overlays
        crosshair: { mode: CrosshairMode.Magnet },
      });
      chartRef.current = chart;
      candleSeriesRef.current = (chart as any).addCandlestickSeries({ upColor: '#10b981', downColor: '#f43f5e', borderVisible: false, wickUpColor: '#10b981', wickDownColor: '#f43f5e' });
      
      // Subscribe to crosshair for Legend
      chart.subscribeCrosshairMove((param: MouseEventParams) => {
          if (param.time && candleSeriesRef.current) {
             const price = param.seriesData.get(candleSeriesRef.current) as any;
             if (price) {
                 setLegendData({ open: price.open, high: price.high, low: price.low, close: price.close });
             }
          }
      });

      const ro = new ResizeObserver(entries => {
         if(entries[0]?.contentRect) chart.applyOptions({ width: entries[0].contentRect.width, height: entries[0].contentRect.height });
      });
      ro.observe(containerRef.current);
      return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
    }
  }, []);

  // Update Data
  useEffect(() => {
     if (chartRef.current && candleSeriesRef.current && ohlcData.length > 0) {
        const data = ohlcData.filter((v, i, a) => a.findIndex(t => t.time === v.time) === i).sort((a, b) => (a.time as number) - (b.time as number));
        candleSeriesRef.current.setData(data as any);
        chartRef.current.timeScale().fitContent();
     }
  }, [ohlcData]);

  // Sync Overlay Positions Loop (Conditional on showAI)
  useLayoutEffect(() => {
    if (!showAI) {
        setOverlays([]);
        return;
    }

    const syncOverlays = () => {
        if (!chartRef.current || !candleSeriesRef.current || !analysisData) return;

        const series = candleSeriesRef.current;
        const newOverlays: OverlayZone[] = [];
        const structure = analysisData.technicalStructure;

        // 1. Zones (OB / FVG)
        if (structure.zones) {
            structure.zones.forEach((zone, idx) => {
                const y1 = series.priceToCoordinate(zone.priceHigh);
                const y2 = series.priceToCoordinate(zone.priceLow);

                if (y1 !== null && y2 !== null) {
                    const top = Math.min(y1, y2);
                    const height = Math.abs(y2 - y1);
                    
                    let colorClass = "bg-slate-500/10";
                    let borderClass = "border-slate-500/30";
                    let textClass = "text-slate-500";
                    let typeLabel = "ZONE";

                    if (zone.type === 'FVG') {
                        colorClass = "bg-amber-500/10";
                        borderClass = "border-amber-500/40";
                        textClass = "text-amber-500";
                        typeLabel = "FVG";
                    } else if (zone.type === 'Order Block') {
                        colorClass = "bg-indigo-500/10";
                        borderClass = "border-indigo-500/40";
                        textClass = "text-indigo-400";
                        typeLabel = "OB";
                    } else if (zone.type === 'Resistance') {
                        colorClass = "bg-rose-500/10";
                        borderClass = "border-rose-500/40";
                        textClass = "text-rose-400";
                        typeLabel = "RES";
                    } else if (zone.type === 'Support') {
                        colorClass = "bg-emerald-500/10";
                        borderClass = "border-emerald-500/40";
                        textClass = "text-emerald-400";
                        typeLabel = "SUP";
                    }

                    newOverlays.push({
                        id: `zone-${idx}`,
                        top,
                        height,
                        label: `${typeLabel}: ${zone.description || ''}`,
                        type: zone.type as any,
                        colorClass,
                        borderClass,
                        textClass
                    });
                }
            });
        }

        // 2. Premium / Discount (Dealing Range)
        if (structure.dealingRange && structure.dealingRange.high && structure.dealingRange.low) {
             const h = structure.dealingRange.high;
             const l = structure.dealingRange.low;
             const eq = (h + l) / 2;

             const yH = series.priceToCoordinate(h);
             const yEq = series.priceToCoordinate(eq);
             const yL = series.priceToCoordinate(l);

             if (yH !== null && yEq !== null && yL !== null) {
                 // Premium Zone (High to Eq)
                 newOverlays.push({
                     id: 'premium',
                     top: Math.min(yH, yEq),
                     height: Math.abs(yEq - yH),
                     label: 'PREMIUM',
                     type: 'PREMIUM',
                     colorClass: 'bg-rose-500/5',
                     borderClass: 'border-t border-rose-500/20', // Only top border usually
                     textClass: 'text-rose-500/50'
                 });

                 // Discount Zone (Eq to Low)
                 newOverlays.push({
                     id: 'discount',
                     top: Math.min(yEq, yL),
                     height: Math.abs(yL - yEq),
                     label: 'DISCOUNT',
                     type: 'DISCOUNT',
                     colorClass: 'bg-emerald-500/5',
                     borderClass: 'border-b border-emerald-500/20',
                     textClass: 'text-emerald-500/50'
                 });
             }
        }
        
        setOverlays(newOverlays);
        rafRef.current = requestAnimationFrame(syncOverlays);
    };

    syncOverlays();

    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analysisData, ohlcData, showAI]); // Dependencies for restarting the loop if data changes

  // Handle Price Lines (Only for Setup: Entry, SL, TP) - Also Conditional on showAI
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Always Clear lines first
    priceLinesRef.current.forEach(line => candleSeriesRef.current?.removePriceLine(line));
    priceLinesRef.current = [];

    if (!analysisData || !showAI) return;

    const addLine = (price: number | null, label: string, color: string, style = LineStyle.Solid, width = 2) => {
       if (price && candleSeriesRef.current) {
          const line = candleSeriesRef.current.createPriceLine({
            price, color, lineWidth: width as any, lineStyle: style, axisLabelVisible: true, title: label,
          });
          priceLinesRef.current.push(line);
       }
    };

    const setup = analysisData.setup;
    if (setup) {
        addLine(parsePrice(setup.entryZone), `ENTRY`, '#3b82f6', LineStyle.Solid, 2); 
        addLine(parsePrice(setup.stopLoss), 'SL', '#ef4444', LineStyle.Solid, 2);
        setup.takeProfits.slice(0, 3).forEach((tp, i) => {
            addLine(parsePrice(tp), `TP${i + 1}`, '#10b981', LineStyle.Dashed, 1); 
        });
    }
  }, [analysisData, ohlcData, showAI]);

  return (
    <div ref={wrapperRef} className={`xl:col-span-3 bg-slate-950/50 rounded-xl border border-slate-800 p-1 relative flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 bg-slate-950' : 'min-h-[500px]'}`}>
      
      {/* Header: Controls */}
      <div className="flex flex-wrap justify-between items-center p-3 border-b border-slate-800/50 bg-slate-900/30 rounded-t-xl z-20 relative gap-2">
          
          {/* Left: Toggles & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Live Data</h3>
              </div>
              
              {/* OHLC Legend - "Essential Doses" */}
              {legendData && (
                  <div className="flex gap-3 text-[10px] font-mono text-slate-400 bg-black/20 px-2 py-1 rounded border border-slate-800/50">
                      <span>O: <span className="text-slate-200">{legendData.open.toFixed(2)}</span></span>
                      <span>H: <span className="text-slate-200">{legendData.high.toFixed(2)}</span></span>
                      <span>L: <span className="text-slate-200">{legendData.low.toFixed(2)}</span></span>
                      <span>C: <span className="text-slate-200">{legendData.close.toFixed(2)}</span></span>
                  </div>
              )}
          </div>

          {/* Right: Timeframes & Toggles */}
          <div className="flex items-center gap-2">
             <div className="flex bg-slate-900 rounded-lg p-1 gap-1 border border-slate-800">
                <button onClick={() => setShowAI(!showAI)} className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase transition-colors ${showAI ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:bg-slate-800'}`}>AI Layers</button>
             </div>

             <div className="flex bg-slate-900 rounded-lg p-1 gap-0.5 border border-slate-800 overflow-x-auto max-w-full">
                {TIMEFRAMES.map((tf) => (
                <button key={tf.label} onClick={() => { setSelectedLabel(tf.label); setSelectedDays(tf.days); }} className={`px-3 py-1 text-[10px] font-bold rounded hover:bg-slate-800 transition-all uppercase whitespace-nowrap ${selectedLabel === tf.label ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}>{tf.label}</button>
                ))}
            </div>

            <button onClick={toggleFullScreen} className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 ml-1">
                {isFullScreen ? <ExitFullScreenIcon /> : <FullScreenIcon />}
            </button>
          </div>
      </div>
      
      {/* Chart Container */}
      <div className="flex-1 relative w-full h-full min-h-[400px] overflow-hidden group">
          <div ref={containerRef} className="absolute inset-0 z-0"></div>
          
          {/* Overlays Layer */}
          {showAI && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                {overlays.map((overlay) => (
                    <div 
                        key={overlay.id}
                        className={`absolute w-full flex items-center justify-end px-2 ${overlay.colorClass} ${overlay.borderClass} border-y transition-opacity duration-300`}
                        style={{ top: overlay.top, height: overlay.height }}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-wider opacity-90 ${overlay.textClass} bg-slate-950/40 px-1 rounded mr-12`}>
                            {overlay.label}
                        </span>
                    </div>
                ))}
            </div>
          )}
      </div>
      
      {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-30"><LoadingSpinner className="h-8 w-8 border-4 border-indigo-500 mb-2" /></div>}
    </div>
  );
};