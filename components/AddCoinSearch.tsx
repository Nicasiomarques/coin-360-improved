import React, { useState, useEffect, useRef } from 'react';
import { searchCoins } from '../services/coingeckoService';
import { SearchResult } from '../types';

interface AddCoinSearchProps {
  onAddCoin: (coinId: string) => void;
  existingIds: string[];
}

const AddCoinSearch: React.FC<AddCoinSearchProps> = ({ onAddCoin, existingIds }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        const searchResults = await searchCoins(query);
        // Filter out coins already displayed to avoid duplicates
        setResults(searchResults.filter(c => !existingIds.includes(c.id)).slice(0, 8));
        setLoading(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, existingIds]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input
          type="text"
          className="block w-full p-2.5 pl-10 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
          placeholder="Add coin (e.g., Solana)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        {loading && (
             <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                 <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
             </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <ul className="py-1 text-sm text-slate-200">
            {results.map((coin) => (
              <li key={coin.id}>
                <button
                  type="button"
                  className="flex items-center w-full px-4 py-2 hover:bg-slate-700 text-left"
                  onClick={() => {
                    onAddCoin(coin.id);
                    setQuery('');
                    setIsOpen(false);
                  }}
                >
                  <img src={coin.thumb} alt={coin.symbol} className="w-5 h-5 mr-3 rounded-full" />
                  <div className="flex flex-col">
                    <span className="font-medium">{coin.name}</span>
                    <span className="text-xs text-slate-400">{coin.symbol.toUpperCase()} #{coin.market_cap_rank || '?'}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddCoinSearch;