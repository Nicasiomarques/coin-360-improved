import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CoinData } from '../../types';
import { generateNodeHtml } from './marketMapHelpers';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Card } from '../../components/common/Card';

interface MarketMapProps {
  data: CoinData[];
  onSelectCoin: (coin: CoinData) => void;
}

const MarketMap: React.FC<MarketMapProps> = ({ data, onSelectCoin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0) return;
    const validData = data.filter(d => d && typeof d.market_cap === 'number' && d.market_cap > 0);
    d3.select(containerRef.current).selectAll("*").remove();
    if (validData.length === 0) return;

    const { width, height } = dimensions;
    const root = d3.hierarchy({ children: validData } as any).sum((d: any) => d.market_cap).sort((a, b) => (b.value || 0) - (a.value || 0));
    d3.treemap().size([width, height]).padding(3).round(true)(root);

    const svg = d3.select(containerRef.current).append("svg").attr("width", width).attr("height", height).style("font-family", "inherit");
    const leaf = svg.selectAll("g").data(root.leaves()).enter().append("g").attr("transform", (d: any) => `translate(${d.x0},${d.y0})`)
      .style("cursor", "pointer").on("click", (e, d: any) => onSelectCoin(d.data));

    leaf.append("rect")
      .attr("width", (d: any) => Math.max(0, d.x1 - d.x0)).attr("height", (d: any) => Math.max(0, d.y1 - d.y0)).attr("rx", 12)
      .attr("fill", (d: any) => {
        const c = d.data.price_change_percentage_24h;
        if (c >= 15) return "#059669"; if (c >= 5) return "#10b981"; if (c >= 0) return "#34d399";
        if (c > -5) return "#fb7185"; if (c > -15) return "#f43f5e"; return "#be123c";
      })
      .attr("stroke", "#1e293b").attr("stroke-width", 1)
      .style("transition", "filter 0.2s")
      .on("mouseover", function() { d3.select(this).style("filter", "brightness(1.1)"); })
      .on("mouseout", function() { d3.select(this).style("filter", "brightness(1)"); });

    leaf.append("foreignObject")
      .attr("width", (d: any) => Math.max(0, d.x1 - d.x0)).attr("height", (d: any) => Math.max(0, d.y1 - d.y0))
      .style("overflow", "hidden")
      .html((d: any) => generateNodeHtml(d, d.x1 - d.x0, d.y1 - d.y0));

  }, [data, dimensions, onSelectCoin]);

  return (
    <Card className="w-full h-full p-1 overflow-hidden shadow-2xl">
      <div ref={containerRef} className="w-full h-full relative" />
      {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <div className="flex flex-col items-center">
                  <LoadingSpinner className="h-8 w-8 border-4 border-indigo-500 mb-4" />
                  <span className="font-mono text-sm">Loading Market Data...</span>
              </div>
          </div>
      )}
    </Card>
  );
};
export default MarketMap;