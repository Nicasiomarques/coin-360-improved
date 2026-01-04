
import { CoinData, SearchResult, CandleData } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache structure
const cache: Record<string, { timestamp: number; data: any }> = {};
const CACHE_DURATION = 60000; // 1 minute
const OHLC_CACHE_DURATION = 300000; // 5 minutes

// Helper to handle Fetch + Cache + 429 Retry Logic
async function fetchWithCache<T>(url: string, cacheKey: string, duration: number, retries = 1): Promise<T> {
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < duration) {
    return cache[cacheKey].data;
  }

  try {
    const response = await fetch(url);

    // Handle Rate Limiting (429)
    if (response.status === 429 && retries > 0) {
      console.warn(`Rate limit hit for ${url}. Retrying in 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithCache(url, cacheKey, duration, retries - 1);
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cache[cacheKey] = { timestamp: now, data };
    return data;
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    // Return cached data if available (even if expired) as a fallback
    if (cache[cacheKey]) {
        console.warn("Returning expired cache data as fallback.");
        return cache[cacheKey].data;
    }
    throw error;
  }
}

export const getTopCoins = async (limit: number = 10): Promise<CoinData[]> => {
  const cacheKey = `top_${limit}`;
  const url = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=true&price_change_percentage=24h`;
  
  try {
    const data = await fetchWithCache<any[]>(url, cacheKey, CACHE_DURATION);
    return data;
  } catch (e) {
    return [];
  }
};

export const getCoinDetails = async (ids: string[]): Promise<CoinData[]> => {
    if (ids.length === 0) return [];

    const joinedIds = ids.join(',');
    const cacheKey = `coins_${joinedIds}`;
    const url = `${BASE_URL}/coins/markets?vs_currency=usd&ids=${joinedIds}&order=market_cap_desc&sparkline=true&price_change_percentage=24h`;

    try {
        const data = await fetchWithCache<any[]>(url, cacheKey, CACHE_DURATION);
        return data;
    } catch (e) {
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
  const url = `${BASE_URL}/coins/${id}/ohlc?vs_currency=usd&days=${days}`;

  try {
    const rawData = await fetchWithCache<number[][]>(url, cacheKey, OHLC_CACHE_DURATION);
    
    // Transform to CandleData
    return rawData.map((d) => ({
        time: d[0] / 1000, // Unix timestamp in seconds
        open: d[1],
        high: d[2],
        low: d[3],
        close: d[4]
    }));
  } catch (error) {
    return [];
  }
};