// ============================================================
// FILE: lib/data/agents.ts
// Taruh di: tag/BE/lib/data/agents.ts
// ============================================================

import type { Agent } from "@/types/agent";

export const agents: Agent[] = [
  {
    id: "agent-001",
    name: "AlphaWave",
    strategy: "Momentum",
    description:
      "Follows strong price trends using RSI & MACD crossover signals.",
    return_30d: 18.42,
    sharpe_ratio: 2.31,
    total_aum: 1_250_000,
    win_rate: 67.4,
    total_trades: 143,
    status: "active",
    wallet_address: "0x1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ",
    created_at: "2024-12-01T00:00:00Z",
  },
  {
    id: "agent-002",
    name: "NeutronArb",
    strategy: "Arbitrage",
    description:
      "Exploits price differences across DEX platforms (Uniswap, Curve, Balancer).",
    return_30d: 9.87,
    sharpe_ratio: 3.54,
    total_aum: 3_800_000,
    win_rate: 89.2,
    total_trades: 512,
    status: "active",
    wallet_address: "0x2bC3dE4fG5hI6jK7lM8nO9pQ0rS1tU2vW3xY4zA",
    created_at: "2024-11-15T00:00:00Z",
  },
  {
    id: "agent-003",
    name: "VaultSentinel",
    strategy: "Mean Reversion",
    description:
      "Bets on prices returning to historical averages using Bollinger Bands.",
    return_30d: 12.05,
    sharpe_ratio: 1.87,
    total_aum: 980_000,
    win_rate: 58.9,
    total_trades: 98,
    status: "active",
    wallet_address: "0x3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB",
    created_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "agent-004",
    name: "OracleGrid",
    strategy: "Trend Following",
    description:
      "Uses on-chain data & Chainlink oracles to follow macro crypto trends.",
    return_30d: -3.21,
    sharpe_ratio: 0.74,
    total_aum: 560_000,
    win_rate: 44.1,
    total_trades: 77,
    status: "active",
    wallet_address: "0x4dE5fG6hI7jK8lM9nO0pQ1rS2tU3vW4xY5zA6bC",
    created_at: "2025-02-20T00:00:00Z",
  },
  {
    id: "agent-005",
    name: "ZenithDelta",
    strategy: "Delta Neutral",
    description:
      "Maintains market-neutral positions using options hedging & liquidity provision.",
    return_30d: 6.33,
    sharpe_ratio: 2.89,
    total_aum: 5_400_000,
    win_rate: 72.0,
    total_trades: 234,
    status: "active",
    wallet_address: "0x5eF6gH7iJ8kL9mN0oP1qR2sT3uV4wX5yZ6aB7cD",
    created_at: "2024-10-05T00:00:00Z",
  },
];