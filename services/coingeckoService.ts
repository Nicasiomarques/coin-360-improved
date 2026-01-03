import { CoinData, SearchResult, CandleData } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache to avoid hitting rate limits too hard
const cache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_DURATION = 60000; // 1 minute
const OHLC_CACHE_DURATION = 300000; // 5 minutes for OHLC

export const getTopCoins = async (limit: number = 10): Promise<CoinData[]> => {
  const cacheKey = `top_${limit}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    return cache[cacheKey].data;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`
    );
    
    if (!response.ok) throw new Error('Failed to fetch top coins');
    
    const data = await response.json();
    cache[cacheKey] = { timestamp: now, data };
    return data;
  } catch (error) {
    console.error("CoinGecko API Error:", error);
    return [];
  }
};

export const getCoinDetails = async (ids: string[]): Promise<CoinData[]> => {
    // Note: CoinGecko free tier doesn't support comma separated IDs well with sparkline in all endpoints,
    // but markets endpoint supports it.
    if (ids.length === 0) return [];

    const joinedIds = ids.join(',');
    const cacheKey = `coins_${joinedIds}`;
    const now = Date.now();

    if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
        return cache[cacheKey].data;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/coins/markets?vs_currency=usd&ids=${joinedIds}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`
        );

        if (!response.ok) throw new Error('Failed to fetch coin details');

        const data = await response.json();
        cache[cacheKey] = { timestamp: now, data };
        return data;
    } catch (error) {
        console.error("CoinGecko API Error:", error);
        return [];
    }
}

export const searchCoins = async (query: string): Promise<SearchResult[]> => {
  if (query.length < 2) return [];

  try {
    const response = await fetch(`${BASE_URL}/search?query=${query}`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
};

export const getCoinOHLC = async (id: string, days: number = 7): Promise<CandleData[]> => {
  const cacheKey = `ohlc_${id}_${days}`;
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < OHLC_CACHE_DURATION) {
    return cache[cacheKey].data;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/coins/${id}/ohlc?vs_currency=usd&days=${days}`
    );

    if (!response.ok) throw new Error('Failed to fetch OHLC');

    const rawData = await response.json();
    
    // CoinGecko returns [time(ms), open, high, low, close]
    // Lightweight charts prefers time in seconds (unix) for flexibility with intraday data
    const formattedData: CandleData[] = rawData.map((d: number[]) => {
       return {
          time: d[0] / 1000, // Unix timestamp in seconds
          open: d[1],
          high: d[2],
          low: d[3],
          close: d[4]
       };
    });

    cache[cacheKey] = { timestamp: now, data: formattedData };
    return formattedData;
  } catch (error) {
    console.error("CoinGecko OHLC Error:", error);
    return [];
  }
};