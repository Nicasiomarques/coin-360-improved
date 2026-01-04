import { useState, useEffect } from 'react';
import { CoinData, NewsAnalysisResult } from '../types';
import { analyzeNewsImpact } from '../services/geminiService';

export const useNewsAnalysis = (coin: CoinData) => {
  const [newsData, setNewsData] = useState<NewsAnalysisResult | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchNews = async () => {
        setNewsData(null);
        setIsLoadingNews(true);
        try {
            const result = await analyzeNewsImpact(coin);
            if (isMounted) setNewsData(result);
        } catch (err) {
            console.error(err);
        } finally {
            if (isMounted) setIsLoadingNews(false);
        }
    };

    fetchNews();

    return () => { isMounted = false; };
  }, [coin]);

  return { newsData, isLoadingNews };
};
