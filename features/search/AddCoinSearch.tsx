import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon } from '../../components/common/Icons';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCoinSearch } from '../../hooks/useCoinSearch';
import { useClickOutside } from '../../hooks/useClickOutside';

interface AddCoinSearchProps {
  onAddCoin: (coinId: string) => void;
  existingIds: string[];
}

const AddCoinSearch: React.FC<AddCoinSearchProps> = ({ onAddCoin, existingIds }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Custom Hooks
  const { query, setQuery, results, loading, clearQuery } = useCoinSearch(existingIds);
  
  useClickOutside(wrapperRef, () => setIsOpen(false));

  // Open dropdown when we have results or query is long enough
  useEffect(() => {
     if (query.length >= 2 && !loading) setIsOpen(true);
  }, [query, loading]);

  const handleSelect = (coinId: string) => {
      onAddCoin(coinId);
      clearQuery();
      setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <SearchIcon className="w-4 h-4 text-slate-400" />
        </div>
        <input 
            type="text" 
            className="block w-full p-2.5 pl-10 text-sm text-white bg-slate-800 border border-slate-700 rounded-lg focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400" 
            placeholder="Add coin..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onFocus={() => query.length >= 2 && setIsOpen(true)} 
        />
        {loading && <div className="absolute inset-y-0 right-0 flex items-center pr-3"><LoadingSpinner className="h-4 w-4 border-2 border-blue-500" /></div>}
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <ul className="py-1 text-sm text-slate-200">
            {results.map((coin) => (
              <li key={coin.id}>
                <button type="button" className="flex items-center w-full px-4 py-2 hover:bg-slate-700 text-left" onClick={() => handleSelect(coin.id)}>
                  <img src={coin.thumb} alt={coin.symbol} className="w-5 h-5 mr-3 rounded-full" />
                  <div className="flex flex-col"><span className="font-medium">{coin.name}</span><span className="text-xs text-slate-400">{coin.symbol.toUpperCase()} #{coin.market_cap_rank || '?'}</span></div>
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