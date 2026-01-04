import { GoogleGenAI } from "@google/genai";
import { CoinData, CombinedAnalysisResult } from "../types";
import { MODEL_ID, getCombinedPrompt, COMBINED_SCHEMA } from "./aiPrompts";

const CACHE_PREFIX = 'gemini_analysis_';
const CACHE_TTL = 15 * 60 * 1000; // 15 Minutes

const FALLBACK_COMBINED: CombinedAnalysisResult = {
  technicalAnalysis: {
    marketContext: { phase: 'Consolidation', bias: 'Range-bound', volatility: 'Low' },
    technicalStructure: { marketStructure: 'N/A', keyLevels: 'N/A', liquidityFocus: 'N/A' },
    setup: {
      direction: 'Neutral',
      entryZone: 'N/A',
      stopLoss: 'N/A',
      takeProfits: [],
      invalidationCriteria: 'Unavailable',
      riskRewardRatio: '0:0',
      confidenceLevel: 'Low'
    },
    confluences: [],
    management: { partialTakeProfit: 'N/A', breakEvenCondition: 'N/A' },
    summary: 'Analysis unavailable. Please ensure API Key is configured and try again.'
  },
  newsAnalysis: {
    globalSentiment: 'Neutral',
    newsItems: []
  }
};

export const analyzeCoinComplete = async (coin: CoinData, forceRefresh: boolean = false): Promise<CombinedAnalysisResult> => {
  const apiKey = process.env.API_KEY || '';
  const cacheKey = `${CACHE_PREFIX}${coin.id}`;
  
  // 1. Check Cache
  if (!forceRefresh) {
      try {
          const cachedRaw = localStorage.getItem(cacheKey);
          if (cachedRaw) {
              const cached = JSON.parse(cachedRaw);
              const now = Date.now();
              // Check if cache is valid (exists and younger than TTL)
              if (now - cached.timestamp < CACHE_TTL) {
                  console.log(`[GeminiService] Returning cached analysis for ${coin.id}`);
                  return cached.data as CombinedAnalysisResult;
              }
          }
      } catch (e) {
          console.warn("[GeminiService] Cache read error", e);
      }
  }

  if (!apiKey) {
    return {
      ...FALLBACK_COMBINED,
      technicalAnalysis: { ...FALLBACK_COMBINED.technicalAnalysis, summary: 'API Key missing in environment variables.' }
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log(`[GeminiService] Fetching fresh analysis for ${coin.id}...`);
    const prompt = getCombinedPrompt(coin);
    
    // We use generateContent with tools enabled for the combined prompt (for news search)
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: COMBINED_SCHEMA
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const result = JSON.parse(jsonText) as CombinedAnalysisResult;

    // 2. Save to Cache
    try {
        localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            data: result
        }));
    } catch (e) {
        console.warn("[GeminiService] Cache write error", e);
    }
    
    return result;

  } catch (error) {
    console.error("Gemini Combined Analysis Error:", error);
    return {
        ...FALLBACK_COMBINED,
        technicalAnalysis: { ...FALLBACK_COMBINED.technicalAnalysis, summary: 'Failed to generate analysis due to an API error.' }
    };
  }
};