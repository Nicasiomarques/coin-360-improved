export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_percentage_24h: number;
  ath: number;
  ath_change_percentage: number;
  atl: number;
  atl_change_percentage: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
}

export interface ICTAnalysis {
  marketStructure: string;
  orderBlocks: string;
  fairValueGaps: string;
  liquiditySweeps: string;
  premiumDiscount: 'Premium' | 'Discount' | 'Equilibrium';
}

export interface AIAnalysisResult {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  summary: string;
  ictAnalysis: ICTAnalysis;
  trendStatus: string;
  suggestedStrategy: string;
}

export interface CandleData {
  time: string | number; // Support YYYY-MM-DD or Unix Timestamp (seconds)
  open: number;
  high: number;
  low: number;
  close: number;
}

export enum ViewMode {
  TREEMAP = 'TREEMAP',
  LIST = 'LIST'
}