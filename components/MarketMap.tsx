import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { CoinData } from '../types';

interface MarketMapProps {
  data: CoinData[];
  onSelectCoin: (coin: CoinData) => void;
}

const MarketMap: React.FC<MarketMapProps> = ({ data, onSelectCoin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle Resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw D3 Treemap
  useEffect(() => {
    if (!containerRef.current || data.length === 0 || dimensions.width === 0) return;

    // Clear previous SVG
    d3.select(containerRef.current).selectAll("*").remove();

    const { width, height } = dimensions;
    
    // Prepare Data hierarchy
    const root = d3.hierarchy({ children: data } as any)
      .sum((d: any) => d.market_cap) // Size by Market Cap
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create Treemap layout
    d3.treemap()
      .size([width, height])
      .padding(4)
      .round(true)
      (root);

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "inherit");

    // Nodes (Groups)
    const leaf = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`)
      .style("cursor", "pointer")
      .on("click", (event, d: any) => {
        onSelectCoin(d.data);
      });

    // Rectangles
    leaf.append("rect")
      .attr("width", (d: any) => d.x1 - d.x0)
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("rx", 6) // Rounded corners
      .attr("fill", (d: any) => {
        const change = d.data.price_change_percentage_24h;
        // Color scale logic
        if (change > 5) return "#10b981"; // Strong Green
        if (change > 0) return "#34d399"; // Soft Green
        if (change > -5) return "#f43f5e"; // Soft Red
        return "#e11d48"; // Strong Red
      })
      .attr("opacity", 0.9)
      .on("mouseover", function() {
        d3.select(this).attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 2);
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.9).attr("stroke", "none");
      });

    // Text: Symbol
    leaf.append("text")
      .attr("x", 8)
      .attr("y", 24)
      .text((d: any) => {
          // Only show if box is big enough
          if ((d.x1 - d.x0) < 40 || (d.y1 - d.y0) < 40) return "";
          return d.data.symbol.toUpperCase();
      })
      .attr("font-size", (d: any) => {
         const w = d.x1 - d.x0;
         return Math.min(24, Math.max(12, w / 5)) + "px";
      })
      .attr("fill", "white")
      .attr("font-weight", "bold");

    // Text: Percentage
    leaf.append("text")
      .attr("x", 8)
      .attr("y", (d: any) => 24 + Math.min(16, (d.x1 - d.x0) / 6) + 4) // Offset below symbol
      .text((d: any) => {
         if ((d.x1 - d.x0) < 50 || (d.y1 - d.y0) < 50) return "";
         return `${d.data.price_change_percentage_24h.toFixed(2)}%`;
      })
      .attr("font-size", (d: any) => Math.min(16, Math.max(10, (d.x1 - d.x0) / 8)) + "px")
      .attr("fill", "white")
      .attr("opacity", 0.9);
      
     // Text: Price
    leaf.append("text")
      .attr("x", 8)
      .attr("y", (d: any) => 24 + (Math.min(16, (d.x1 - d.x0) / 6) * 2) + 8) 
      .text((d: any) => {
         if ((d.x1 - d.x0) < 80 || (d.y1 - d.y0) < 80) return "";
         return `$${d.data.current_price.toLocaleString()}`;
      })
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("opacity", 0.8);

  }, [data, dimensions, onSelectCoin]);

  return (
    <div className="w-full h-full p-1 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      <div ref={containerRef} className="w-full h-full relative" />
      {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              Loading Market Data...
          </div>
      )}
    </div>
  );
};

export default MarketMap;