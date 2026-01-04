import { useState, useEffect } from 'react';
import { CoinData, AIAnalysisResult, AnalysisStrategy } from '../types';
import { analyzeCoinComplete } from '../services/geminiService';

export const useAIAnalysis = (coin: CoinData) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [strategy] = useState<AnalysisStrategy>(AnalysisStrategy.SMC);

  useEffect(() => {
    let isMounted = true;
    
    const runAnalysis = async () => {
        setAnalysis(null);
        setIsAnalyzing(true);
        try {
            const result = await analyzeCoinComplete(coin);
            if (isMounted) setAnalysis(result.technicalAnalysis);
        } catch (err) {
            console.error(err);
        } finally {
            if (isMounted) setIsAnalyzing(false);
        }
    };

    runAnalysis();

    return () => { isMounted = false; };
  }, [coin, strategy]);

  return { analysis, isAnalyzing, strategy };
};