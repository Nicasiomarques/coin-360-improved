import { Type } from "@google/genai";
import { CoinData } from "../types";

export const MODEL_ID = 'gemini-3-pro-preview';

// --- SHARED SCHEMAS ---

export const TECHNICAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    marketContext: {
       type: Type.OBJECT,
       properties: {
          phase: { type: Type.STRING, enum: ['Accumulation', 'Expansion', 'Distribution', 'Consolidation'] },
          bias: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Range-bound'] },
          volatility: { type: Type.STRING, enum: ['Low', 'Normal', 'High'] }
       },
       required: ['phase', 'bias', 'volatility']
    },
    technicalStructure: {
       type: Type.OBJECT,
       properties: {
          marketStructure: { type: Type.STRING, description: "Market Structure (MSS, BOS, ChoCH)" },
          keyLevels: { type: Type.STRING, description: "Key Levels text description" },
          liquidityFocus: { type: Type.STRING, description: "Where is the draw on liquidity?" },
          zones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['Order Block', 'FVG', 'Resistance', 'Support'] },
                priceLow: { type: Type.NUMBER, description: "Lower price of the zone" },
                priceHigh: { type: Type.NUMBER, description: "Higher price of the zone" },
                description: { type: Type.STRING, description: "Short label e.g. '1H Bullish OB'" }
              },
              required: ['type', 'priceLow', 'priceHigh', 'description']
            }
          },
          dealingRange: {
             type: Type.OBJECT,
             properties: {
                high: { type: Type.NUMBER, description: "Recent Swing High Price" },
                low: { type: Type.NUMBER, description: "Recent Swing Low Price" }
             },
             required: ['high', 'low']
          }
       },
       required: ['marketStructure', 'keyLevels', 'liquidityFocus', 'zones']
    },
    setup: {
        type: Type.OBJECT,
        properties: {
            direction: { type: Type.STRING, enum: ['Long', 'Short', 'Neutral'] },
            entryZone: { type: Type.STRING, description: "Specific price area" },
            stopLoss: { type: Type.STRING, description: "Specific price" },
            takeProfits: { type: Type.ARRAY, items: { type: Type.STRING } },
            invalidationCriteria: { type: Type.STRING, description: "Technical reason for SL" },
            riskRewardRatio: { type: Type.STRING, description: "e.g., 1:3" },
            confidenceLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
        },
        required: ['direction', 'entryZone', 'stopLoss', 'takeProfits', 'invalidationCriteria', 'riskRewardRatio', 'confidenceLevel']
    },
    confluences: { type: Type.ARRAY, items: { type: Type.STRING } },
    management: {
        type: Type.OBJECT,
        properties: {
            partialTakeProfit: { type: Type.STRING, description: "When to take partials" },
            breakEvenCondition: { type: Type.STRING, description: "When to move SL to Entry" }
        },
        required: ['partialTakeProfit', 'breakEvenCondition']
    },
    summary: { type: Type.STRING, description: "Brief executive summary of the plan" }
  },
  required: ["marketContext", "technicalStructure", "setup", "confluences", "management", "summary"]
};

export const NEWS_SCHEMA_DEF = {
  type: Type.OBJECT,
  properties: {
    globalSentiment: { type: Type.STRING, enum: ['Bullish', 'Bearish', 'Neutral'] },
    newsItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          source: { type: Type.STRING },
          timeAgo: { type: Type.STRING },
          impactLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
          impactDescription: { type: Type.STRING, description: "Short sentence on why this moves price." },
          sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
          url: { type: Type.STRING }
        },
        required: ['title', 'source', 'impactLevel', 'impactDescription', 'sentiment']
      }
    }
  },
  required: ['globalSentiment', 'newsItems']
};

export const COMBINED_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    technicalAnalysis: TECHNICAL_SCHEMA,
    newsAnalysis: NEWS_SCHEMA_DEF
  },
  required: ['technicalAnalysis', 'newsAnalysis']
};

// --- PROMPT ---

export const getCombinedPrompt = (coin: CoinData) => `
You are an elite Crypto Market Analyst specializing in both Smart Money Concepts (SMC) technical analysis AND Fundamental News Analysis. 
You must perform two distinct analyses for **${coin.name} (${coin.symbol})** in a single execution.

**Live Market Data:**
- Price: $${coin.current_price}
- 24h Change: ${coin.price_change_percentage_24h}%
- ATH: $${coin.ath}
- 24h Low/High: $${coin.low_24h} / $${coin.high_24h}

--- PART 1: SMC TECHNICAL ANALYSIS ---
Focus strictly on Institutional Order Flow, Order Blocks (OB), Fair Value Gaps (FVG), and Liquidity Sweeps.
Your goal is to construct a professional SMC TRADE PLAN.
1. Determine Market Phase & Bias.
2. **Chart Marking:** Identify specific Price Zones for **Order Blocks** and **FVGs** (Fair Value Gaps) with exact low/high prices.
3. **Dealing Range:** Identify the current Dealing Range (Swing High to Swing Low) to define Premium vs Discount.
4. Identify Setup: Precise Entry Zone, Hard Stop Loss, Take Profits (Liquidity targets), R:R.
5. List Confluences.

--- PART 2: NEWS & FUNDAMENTAL ANALYSIS ---
1. **Search:** Use Google Search to find specific news for ${coin.symbol} from the last 24h to 7 days.
2. **Fallback:** If NO specific news exists, search for "Crypto Market News Today" or "Bitcoin Price Action" and analyze correlation.
3. **Selection:** Select exactly 3-5 distinct news items.
4. **Analysis:** For each, determine Title, Source, Time, Sentiment, and specifically the IMPACT on ${coin.symbol}'s price.

**OUTPUT:**
Return a single JSON object containing both 'technicalAnalysis' and 'newsAnalysis' matching the schema.
`;
