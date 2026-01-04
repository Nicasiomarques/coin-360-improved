import { CoinData } from '../../types';

export const generateNodeHtml = (d: any, width: number, height: number) => {
    const coin = d.data as CoinData;
    
    // Determine visibility based on available space
    const isTiny = width < 50 || height < 35;
    const isSmall = width < 90 || height < 60;
    
    // Dynamic Font Scaling - Aggressively larger sizes
    let symbolSize = "text-base";
    let priceSize = "text-[11px]";
    let percentSize = "text-[10px]";
    let gap = "gap-0.5";

    if (width > 300 && height > 200) {
        symbolSize = "text-8xl"; // Huge
        priceSize = "text-4xl";
        percentSize = "text-2xl";
        gap = "gap-4";
    } else if (width > 200 && height > 150) {
        symbolSize = "text-6xl"; // Very Large
        priceSize = "text-2xl";
        percentSize = "text-xl";
        gap = "gap-3";
    } else if (width > 120 && height > 80) {
        symbolSize = "text-4xl"; // Large
        priceSize = "text-lg";
        percentSize = "text-sm";
        gap = "gap-1.5";
    } else if (!isSmall) {
        symbolSize = "text-2xl"; // Medium
        priceSize = "text-xs";
        percentSize = "text-[11px]";
        gap = "gap-1";
    }

    // Chart logic (Background)
    let chartSvg = '';
    const prices = coin.sparkline_in_7d?.price;
    
    // Only show chart if box is reasonably sized
    if (prices && prices.length > 5 && width > 100 && height > 80) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const range = max - min;
        
        const pathPoints = prices.map((p: number, i: number) => {
            const x = (i / (prices.length - 1)) * width;
            const norm = (p - min) / (range || 1);
            // Chart takes up bottom 40% of the card
            const y = height - (norm * (height * 0.4)); 
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' L ');

        const areaPath = `M 0,${height} L ${pathPoints} L ${width},${height} Z`;
        const linePath = `M ${pathPoints}`;

        chartSvg = `
           <div class="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
               <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                   <path d="${areaPath}" fill="rgba(0,0,0,0.3)" />
                   <path d="${linePath}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" vector-effect="non-scaling-stroke" />
               </svg>
           </div>
        `;
    }

    // Determine decimal places for price based on value
    const priceFormatted = coin.current_price < 1 
        ? coin.current_price.toFixed(4) 
        : coin.current_price < 10 
            ? coin.current_price.toFixed(2) 
            : Math.round(coin.current_price).toLocaleString();

    return `
      <div class="w-full h-full relative select-none pointer-events-none overflow-hidden flex flex-col items-center justify-center text-center p-1 font-sans">
         ${chartSvg}
         
         <div class="relative z-10 flex flex-col items-center justify-center ${gap} drop-shadow-md text-white">
             <!-- Symbol -->
             <span class="font-extrabold ${symbolSize} tracking-tighter leading-none shadow-black/50 drop-shadow-sm">
                ${coin.symbol.toUpperCase()}
             </span>

             <!-- Details (Hide on tiny blocks) -->
             ${!isTiny ? `
                <div class="flex flex-col items-center leading-none">
                    ${!isSmall ? `
                    <span class="font-bold ${priceSize} opacity-95 mb-0.5 tracking-tight shadow-black/50 drop-shadow-sm">
                        $${priceFormatted}
                    </span>
                    ` : ''}
                    
                    <span class="font-bold ${percentSize} bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-md border border-white/20 shadow-lg">
                        ${coin.price_change_percentage_24h > 0 ? '▲' : '▼'} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                    </span>
                </div>
             ` : ''}
         </div>
      </div>
    `;
};