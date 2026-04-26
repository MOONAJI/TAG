// ============================================================
// FILE: types/agent.ts
// Taruh di: tag/BE/types/agent.ts
// ============================================================

export type Strategy =
  | "Momentum"
  | "Arbitrage"
  | "Mean Reversion"
  | "Trend Following"
  | "Delta Neutral";

export interface Agent {
  id: string;
  name: string;
  strategy: Strategy;
  description: string;
  return_30d: number;       // % (bisa negatif)
  sharpe_ratio: number;     // rasio return vs risk
  total_aum: number;        // USD
  win_rate: number;         // %
  total_trades: number;
  status: "active" | "paused" | "inactive";
  wallet_address: string;
  created_at: string;       // ISO date string
}

// Versi yang udah diformat + ada rank — dipakai di leaderboard
export interface AgentLeaderboardEntry
  extends Omit<Agent, "description" | "total_trades" | "wallet_address" | "created_at"> {
  rank: number;
  return_30d_formatted: string;   // contoh: "+18.42%"
  total_aum_formatted: string;    // contoh: "$1.25M"
}

// Response wrapper dari API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  updated_at?: string;
  error?: string;
}

// Chainlink price feed
export interface PriceFeed {
  pair: string;
  price: number;
  decimals: number;
  roundId: number;
  updated_at: string;
  source: "mock-chainlink" | "chainlink-mainnet";
}

export interface AllPrices {
  prices: Record<string, PriceFeed>;
  fetched_at: string;
}