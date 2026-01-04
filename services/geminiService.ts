
import { GoogleGenAI } from "@google/genai";
import { CoinData, AIAnalysisResult, AnalysisStrategy, NewsAnalysisResult } from "../types";
import { MODEL_ID, getSMCPrompt, RESPONSE_SCHEMA, getNewsPrompt, NEWS_SCHEMA } from "./aiPrompts";

const FALLBACK_ANALYSIS: AIAnalysisResult = {
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
};

const FALLBACK_NEWS: NewsAnalysisResult = {
  globalSentiment: 'Neutral',
  newsItems: []
};

// Existing SMC Analysis
export const analyzeCoinSituation = async (coin: CoinData, strategy: AnalysisStrategy): Promise<AIAnalysisResult> => {
  const apiKey = process.env.API_KEY || '';
  
  if (!apiKey) {
    return {
      ...FALLBACK_ANALYSIS,
      setup: { ...FALLBACK_ANALYSIS.setup, invalidationCriteria: 'API Key Missing' },
      summary: 'API Key missing in environment variables.'
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = getSMCPrompt(coin);
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini SMC Analysis Error:", error);
    return {
      ...FALLBACK_ANALYSIS,
      setup: { ...FALLBACK_ANALYSIS.setup, invalidationCriteria: 'Generation Failed' },
      summary: 'Failed to generate analysis due to an API error.'
    };
  }
};

// New News Analysis
export const analyzeNewsImpact = async (coin: CoinData): Promise<NewsAnalysisResult> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) return FALLBACK_NEWS;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = getNewsPrompt(coin);
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Live Search
        responseMimeType: "application/json",
        responseSchema: NEWS_SCHEMA
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI News");

    return JSON.parse(jsonText) as NewsAnalysisResult;
  } catch (error) {
    console.error("Gemini News Error:", error);
    return FALLBACK_NEWS;
  }
};
