import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { CoinData } from '../../types';
import { generateNodeHtml } from './marketMapHelpers';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Card } from '../../components/common/Card';
import { ZoomInIcon, ZoomOutIcon, ResetZoomIcon } from '../../components/common/Icons';

interface MarketMapProps {
  data: CoinData[];
  onSelectCoin: (coin: CoinData) => void;
}

const MarketMap: React.FC<MarketMapProps> = ({ data, onSelectCoin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Update dimensions on resize
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

  // Initialize and Render D3 Map
  useEffect(() => {
    if (!containerRef.current || dimensions.width === 0) return;
    const validData = data.filter(d => d && typeof d.market_cap === 'number' && d.market_cap > 0);
    
    // Clear previous SVG
    d3.select(containerRef.current).selectAll("*").remove();
    
    if (validData.length === 0) return;

    const { width, height } = dimensions;

    // Treemap Layout Calculation
    const root = d3.hierarchy({ children: validData } as any)
      .sum((d: any) => d.market_cap)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    
    d3.treemap().size([width, height]).padding(3).round(true)(root);

    // Setup SVG and Zoom
    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("font-family", "inherit")
      .style("cursor", "grab");

    const g = svg.append("g"); // Group for zooming

    // Define Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8]) // Zoom levels: 1x to 8x
      .translateExtent([[0, 0], [width, height]]) // Optional: bound the panning
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        if (event.transform.k > 1) {
            svg.style("cursor", "grabbing");
        } else {
            svg.style("cursor", "grab");
        }
      });

    svg.call(zoom).on("dblclick.zoom", null); // Disable double click to zoom (optional)
    
    // Store refs for button controls
    svgRef.current = svg;
    zoomRef.current = zoom;

    // Render Nodes
    const leaf = g.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`);
      
    // Leaf Rectangles
    leaf.append("rect")
      .attr("width", (d: any) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d: any) => Math.max(0, d.y1 - d.y0))
      .attr("rx", 12)
      .attr("fill", (d: any) => {
        const c = d.data.price_change_percentage_24h;
        if (c >= 15) return "#059669"; if (c >= 5) return "#10b981"; if (c >= 0) return "#34d399";
        if (c > -5) return "#fb7185"; if (c > -15) return "#f43f5e"; return "#be123c";
      })
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1)
      .style("transition", "filter 0.2s")
      // D3-Zoom handles drag, so we use onClick carefully.
      // We check if d3.event.defaultPrevented to see if a drag occurred instead of a click.
      .on("click", (e, d: any) => {
         if (e.defaultPrevented) return; // Don't trigger if it was a drag/pan
         onSelectCoin(d.data);
      })
      .on("mouseover", function() { d3.select(this).style("filter", "brightness(1.1)"); })
      .on("mouseout", function() { d3.select(this).style("filter", "brightness(1)"); });

    // HTML Content inside SVG
    leaf.append("foreignObject")
      .attr("width", (d: any) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d: any) => Math.max(0, d.y1 - d.y0))
      .style("overflow", "hidden")
      .style("pointer-events", "none") // Let clicks pass through to rect
      .html((d: any) => generateNodeHtml(d, d.x1 - d.x0, d.y1 - d.y0));

  }, [data, dimensions, onSelectCoin]);

  // Zoom Control Handlers
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
        svgRef.current.transition().duration(500).call(zoomRef.current.scaleBy, 1.5);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
        svgRef.current.transition().duration(500).call(zoomRef.current.scaleBy, 0.75);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
        svgRef.current.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  return (
    <Card className="w-full h-full p-1 overflow-hidden shadow-2xl relative group">
      <div ref={containerRef} className="w-full h-full relative" />
      
      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={handleZoomIn} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-lg border border-slate-700 transition-colors" title="Zoom In">
            <ZoomInIcon />
        </button>
        <button onClick={handleZoomOut} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-lg border border-slate-700 transition-colors" title="Zoom Out">
            <ZoomOutIcon />
        </button>
        <button onClick={handleResetZoom} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-lg border border-slate-700 transition-colors" title="Reset View">
            <ResetZoomIcon />
        </button>
      </div>

      {data.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 pointer-events-none">
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