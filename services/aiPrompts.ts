import { Type } from "@google/genai";
import { CoinData } from "../types";

export const MODEL_ID = 'gemini-3-pro-preview';

export const getSMCPrompt = (coin: CoinData) => `
Act as a world-class Smart Money Concepts (SMC) & ICT Specialist. 
Focus strictly on Institutional Order Flow, Order Blocks (OB), Fair Value Gaps (FVG), Liquidity Sweeps (BSL/SSL), and Premium/Discount zones.
Your 'keyLevels' should mention OBs, Breakers, or Mitigation Blocks.

Analyze ${coin.name} (${coin.symbol}).

Live Data:
- Price: $${coin.current_price}
- 24h Change: ${coin.price_change_percentage_24h}%
- ATH: $${coin.ath}
- 24h Low/High: $${coin.low_24h} / $${coin.high_24h}

Your goal is to construct a professional SMC TRADE PLAN. 
Do not just describe the chart, tell me exactly how to trade it based on institutional footprints.

1. Determine Context: Market Phase (Accumulation, Expansion, etc.) and Bias.
2. Identify the Setup: 
   - Precise Entry Zone (e.g. "Bullish OB at $X" or "FVG Fill").
   - Hard Stop Loss (Invalidation point, e.g. "Below Swing Low").
   - Take Profits (Liquidity targets / BSL / SSL).
   - Risk/Reward calculation (Estimate).
3. List Confluences: Why take this trade? (e.g., "MSS + OTE + FVG").
4. Define Management: When to move to Break Even? When to take partials?

Return JSON only matching the specific schema.
`;

export const RESPONSE_SCHEMA = {
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
          keyLevels: { type: Type.STRING, description: "Key Levels (OB, FVG, Breaker)" },
          liquidityFocus: { type: Type.STRING, description: "Where is the draw on liquidity?" }
       },
       required: ['marketStructure', 'keyLevels', 'liquidityFocus']
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
