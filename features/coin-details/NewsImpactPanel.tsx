import React, { useState } from 'react';
import { CoinData, NewsAnalysisResult } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

interface NewsImpactPanelProps {
  coin: CoinData;
  newsData: NewsAnalysisResult | null;
  isLoading: boolean;
}

const ImpactBadge: React.FC<{ level: string }> = ({ level }) => {
    const colors = 
      level === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]' :
      level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
      'bg-slate-500/10 text-slate-400 border-slate-500/20';
    
    return (
      <span className={`px-2 py-1 rounded text-[10px] font-extrabold border uppercase tracking-wider ${colors}`}>
        {level} Impact
      </span>
    );
};

export const NewsImpactPanel: React.FC<NewsImpactPanelProps> = ({ coin, newsData, isLoading }) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const filteredNews = newsData?.newsItems.filter(item => {
    if (activeFilter === 'All') return true;
    return item.impactLevel === activeFilter;
  }) || [];

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative flex flex-col h-full shadow-xl">
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-b border-slate-800 flex flex-col backdrop-blur-sm">
          <div className="px-5 py-4 flex items-center justify-between flex-none">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
                {isLoading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            </span>
            <span className="tracking-tight">Recent News & Impact</span>
            </h3>
            {newsData && (
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wide shadow-sm ${newsData.globalSentiment === 'Bullish' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : newsData.globalSentiment === 'Bearish' ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' : 'border-slate-500/30 text-slate-400 bg-slate-800/50'}`}>
                    {newsData.globalSentiment} Sentiment
                </span>
            )}
          </div>
          
          {/* Filters */}
          <div className="px-5 pb-3 flex gap-2">
             {(['All', 'High', 'Medium', 'Low'] as const).map(filter => (
                 <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                        activeFilter === filter 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm' 
                        : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                 >
                    {filter === 'All' ? 'All News' : filter}
                 </button>
             ))}
          </div>
      </div>

      <div className="p-5 flex-1 relative min-h-[300px] overflow-y-auto max-h-[600px] custom-scrollbar bg-slate-950">
         {isLoading && !newsData && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm">
                <LoadingSpinner className="h-6 w-6 border-2 border-blue-500 mb-3" />
                <span className="text-blue-400 font-mono text-xs animate-pulse tracking-widest uppercase">Scanning Global Media...</span>
            </div>
         )}
         
         <div className="space-y-4">
            {newsData?.newsItems.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-10 opacity-70">
                    <p className="mb-2 font-medium">No significant news found for {coin.symbol}.</p>
                    <span className="text-xs">Market chatter is currently low.</span>
                </div>
            )}
            
            {newsData && newsData.newsItems.length > 0 && filteredNews.length === 0 && !isLoading && (
                 <div className="flex flex-col items-center justify-center h-32 text-slate-500 opacity-70">
                    <p className="font-medium text-xs">No news with {activeFilter} Impact found.</p>
                </div>
            )}

            {filteredNews.map((item, idx) => (
                <div key={idx} className="group bg-gradient-to-b from-slate-900 to-slate-900/50 border border-slate-800/80 rounded-xl p-5 hover:border-slate-600 hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300">
                    {/* Header: Badges & Time */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-wrap gap-2">
                            <ImpactBadge level={item.impactLevel} />
                            <span className={`text-[10px] font-bold border px-2 py-1 rounded uppercase tracking-wider ${
                                item.sentiment === 'Positive' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                                item.sentiment === 'Negative' ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' :
                                'text-slate-400 border-slate-500/20 bg-slate-500/5'
                            }`}>
                                {item.sentiment}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap ml-2 bg-slate-950 px-2 py-1 rounded border border-slate-800">{item.timeAgo}</span>
                    </div>
                    
                    {/* Title */}
                    {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mb-2 group/link">
                             <h4 className="text-base font-bold text-slate-100 leading-snug group-hover/link:text-blue-400 group-hover/link:underline decoration-blue-500/30 underline-offset-4 transition-all">
                                {item.title}
                            </h4>
                        </a>
                    ) : (
                         <h4 className="text-base font-bold text-slate-100 mb-2 leading-snug group-hover:text-blue-200 transition-colors">
                            {item.title}
                        </h4>
                    )}
                    
                    {/* Source Link */}
                    <div className="flex items-center gap-2 mb-5">
                         <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide bg-indigo-500/10 px-1.5 py-0.5 rounded">{item.source}</span>
                         {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-1">
                            Read Source <span aria-hidden="true">&rarr;</span>
                         </a>}
                    </div>
                    
                    {/* Impact Box */}
                    <div className="relative mt-2">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-full"></div>
                        <div className="bg-slate-950/80 rounded-r-lg border-y border-r border-slate-800/60 p-3 pl-4">
                            <h5 className="text-[10px] uppercase font-bold text-blue-400 mb-1.5 flex items-center gap-1.5 opacity-90">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Market Implication
                            </h5>
                            <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                {item.impactDescription}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
};