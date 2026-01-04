import { useState, useEffect } from 'react';
import { searchCoins } from '../services/coingeckoService';
import { SearchResult } from '../types';

export const useCoinSearch = (existingIds: string[]) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
            const searchResults = await searchCoins(query);
            // Filter out coins that are already in the main list
            setResults(searchResults.filter(c => !existingIds.includes(c.id)).slice(0, 8));
        } catch (error) {
            console.error("Search hook error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, existingIds]);

  return {
    query,
    setQuery,
    results,
    loading,
    clearQuery: () => setQuery('')
  };
};