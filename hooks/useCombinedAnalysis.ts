import { useState, useEffect, useCallback } from 'react';
import { CoinData, CombinedAnalysisResult } from '../types';
import { analyzeCoinComplete } from '../services/geminiService';

export const useCombinedAnalysis = (coin: CoinData) => {
  const [data, setData] = useState<CombinedAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchAnalysis = useCallback(async (force = false) => {
      setIsAnalyzing(true);
      if (force) setData(null); // Clear data only on forced refresh to show loading state visually
      
      try {
          const result = await analyzeCoinComplete(coin, force);
          setData(result);
      } catch (err) {
          console.error(err);
      } finally {
          setIsAnalyzing(false);
      }
  }, [coin]);

  useEffect(() => {
    fetchAnalysis(false); // Initial load (uses cache if available)
  }, [fetchAnalysis]);

  return { 
      data, 
      isAnalyzing,
      refresh: () => fetchAnalysis(true) 
  };
};