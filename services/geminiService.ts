import { GoogleGenAI, Type } from "@google/genai";
import { CoinData, AIAnalysisResult } from "../types";

export const analyzeCoinSituation = async (coin: CoinData): Promise<AIAnalysisResult> => {
  const apiKey = process.env.API_KEY || '';
  
  if (!apiKey) {
    return {
      sentiment: 'Neutral',
      summary: 'API Key missing. Cannot generate analysis.',
      ictAnalysis: {
        marketStructure: 'N/A',
        orderBlocks: 'N/A',
        fairValueGaps: 'N/A',
        liquiditySweeps: 'N/A',
        premiumDiscount: 'Equilibrium'
      },
      trendStatus: 'Unknown',
      suggestedStrategy: 'Please configure API Key.'
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Using gemini-3-pro-preview for better reasoning on complex trading concepts like ICT
    const modelId = 'gemini-3-pro-preview';

    const prompt = `
      Act as a professional crypto analyst specializing in Inner Circle Trader (ICT) concepts.
      Analyze the current market situation for ${coin.name} (${coin.symbol}).
      
      Current Market Data:
      - Price: $${coin.current_price}
      - 24h Change: ${coin.price_change_percentage_24h}%
      - Market Cap Rank: #${coin.market_cap_rank}
      - 24h High: $${coin.high_24h}
      - 24h Low: $${coin.low_24h}
      
      Perform a deep technical analysis focusing on:
      1. Market Structure Shift (MSS) and Break of Structure (BOS).
      2. Identification of key Order Blocks (OB) and Breaker Blocks.
      3. Fair Value Gaps (FVG) or Imbalances.
      4. Buy-side/Sell-side Liquidity (BSL/SSL) sweeps.
      5. Is price likely in a Premium or Discount array relative to recent ranges?
      
      Based on this, suggest a specific trading strategy (e.g., "Wait for retracement to bullish OB", "Short at bearish FVG").
      
      Return the response in JSON format strictly adhering to the schema.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral'] },
            summary: { type: Type.STRING, description: "A concise general summary of the asset." },
            ictAnalysis: {
              type: Type.OBJECT,
              properties: {
                marketStructure: { type: Type.STRING, description: "Current market structure (e.g., Bullish MSS, Bearish BOS)" },
                orderBlocks: { type: Type.STRING, description: "Location of relevant Order Blocks" },
                fairValueGaps: { type: Type.STRING, description: "Location of relevant FVGs" },
                liquiditySweeps: { type: Type.STRING, description: "Recent liquidity sweeps" },
                premiumDiscount: { type: Type.STRING, enum: ['Premium', 'Discount', 'Equilibrium'] }
              },
              required: ["marketStructure", "orderBlocks", "fairValueGaps", "liquiditySweeps", "premiumDiscount"]
            },
            trendStatus: { type: Type.STRING, description: "Current trend direction and strength." },
            suggestedStrategy: { type: Type.STRING, description: "Actionable ICT strategy (Entry, Invalid, Target ideas)" }
          },
          required: ["sentiment", "summary", "ictAnalysis", "trendStatus", "suggestedStrategy"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    return JSON.parse(jsonText) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'Neutral',
      summary: 'Failed to analyze data at this moment.',
      ictAnalysis: {
        marketStructure: 'Unknown',
        orderBlocks: 'Unknown',
        fairValueGaps: 'Unknown',
        liquiditySweeps: 'Unknown',
        premiumDiscount: 'Equilibrium'
      },
      trendStatus: 'Unknown',
      suggestedStrategy: 'Retry later.'
    };
  }
};