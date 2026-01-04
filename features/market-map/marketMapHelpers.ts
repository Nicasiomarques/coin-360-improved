import { CoinData } from '../../types';
import { formatCompact } from '../../utils/formatters';

export const generateNodeHtml = (d: any, width: number, height: number) => {
    const coin = d.data as CoinData;
    const showDetails = width > 100 && height > 80;
    const fontSizeClass = width > 200 ? "text-2xl" : width > 120 ? "text-xl" : "text-sm";
    const priceSizeClass = width > 200 ? "text-xl" : "text-sm";

    let chartSvg = '';
    const prices = coin.sparkline_in_7d?.price;
    
    if (prices && prices.length > 5 && width > 60) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min;
        
        const pathPoints = prices.map((p: number, i: number) => {
            const x = (i / (prices.length - 1)) * width;
            const norm = (p - min) / (range || 1);
            const y = height - (norm * (height * 0.5)); 
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' L ');

        const areaPath = `M 0,${height} L ${pathPoints} L ${width},${height} Z`;
        const linePath = `M ${pathPoints}`;

        chartSvg = `
           <div class="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden rounded-xl">
               <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                   <path d="${areaPath}" fill="rgba(0,0,0,0.2)" />
                   <path d="${linePath}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
               </svg>
           </div>
        `;
    }

    return `
      <div class="w-full h-full relative select-none pointer-events-none rounded-xl overflow-hidden">
         ${chartSvg}
         <div class="absolute inset-0 z-10 p-2 sm:p-3 flex flex-col justify-between text-white">
             <div class="flex justify-between items-start">
                <div class="flex flex-col drop-shadow-md">
                   <span class="font-bold ${fontSizeClass} leading-none tracking-tighter">${coin.symbol.toUpperCase()}</span>
                   ${showDetails ? `<span class="text-[10px] text-white/90 truncate max-w-[80px] font-medium">${coin.name}</span>` : ''}
                </div>
                ${showDetails ? `<span class="bg-black/20 text-[10px] px-1.5 py-0.5 rounded font-mono backdrop-blur-sm shadow-sm">#${coin.market_cap_rank}</span>` : ''}
             </div>
             <div class="flex flex-col items-start my-1 drop-shadow-md">
                <span class="font-mono font-bold ${priceSizeClass}">$${coin.current_price.toLocaleString()}</span>
             </div>
             ${showDetails ? `
             <div class="flex items-end justify-between w-full mt-auto border-t border-white/20 pt-1">
                <div class="flex flex-col drop-shadow-sm">
                   <span class="text-[9px] uppercase opacity-80 font-semibold">M.Cap</span>
                   <span class="text-[10px] font-mono font-medium">$${formatCompact(coin.market_cap)}</span>
                </div>
                <div class="flex flex-col items-end">
                   <div class="bg-black/40 backdrop-blur-md px-1.5 rounded flex items-center shadow-lg border border-white/10">
                       <span class="font-bold text-xs">
                           ${coin.price_change_percentage_24h > 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%
                       </span>
                   </div>
                </div>
             </div>
             ` : `
                <div class="mt-auto self-end bg-black/40 px-1 rounded text-[10px] font-bold backdrop-blur-sm border border-white/10">
                   ${coin.price_change_percentage_24h.toFixed(1)}%
                </div>
             `}
         </div>
      </div>
    `;
};