/**
 * Mock seed data used until the Celo mainnet contracts are wired in.
 * Shapes exactly match `types/index.ts` so swapping to live reads is a one-line change.
 */

import type {
  AgentViewModel,
  DashboardAgentSlot,
  FxSignal,
  PricePoint,
  YieldOpportunity,
} from "@/types"

/** Generate a synthetic 30-day equity curve starting at 100. */
function generatePriceHistory(
  seed: number,
  volatility = 1.2,
  drift = 0.3,
): PricePoint[] {
  const points: PricePoint[] = []
  const now = Math.floor(Date.now() / 1000)
  let value = 100
  for (let i = 29; i >= 0; i--) {
    // deterministic pseudo-random
    const r = Math.sin(seed * (i + 1)) * 10000
    const noise = (r - Math.floor(r) - 0.5) * volatility
    value = Math.max(50, value + drift + noise)
    points.push({
      timestamp: now - i * 86400,
      value: Number(value.toFixed(2)),
    })
  }
  return points
}

export const MOCK_AGENTS: AgentViewModel[] = [
  {
    agentId: 1n,
    owner: "0x1234567890abcdef1234567890abcdef12345678",
    name: "AlphaBot",
    strategy: "Momentum",
    tradingThesis:
      "Ride short-term momentum shifts on USDC/CELO breakouts with tight stops.",
    feePercent: 1000n,
    registeredAt: 1_700_000_000n,
    totalTrades: 847n,
    reputationScore: 92n,
    isActive: true,
    returnPct30d: 18.2,
    sharpeRatio: 2.4,
    maxDrawdown: -4.8,
    winRate: 68,
    totalAumUsdc: 120_450,
    priceHistory: generatePriceHistory(1, 1.4, 0.6),
  },
  {
    agentId: 2n,
    owner: "0xabcdef1234567890abcdef1234567890abcdef12",
    name: "BetaBot",
    strategy: "Mean Reversion",
    tradingThesis:
      "Fade extreme moves back to the 20-day average on majors.",
    feePercent: 500n,
    registeredAt: 1_700_500_000n,
    totalTrades: 612n,
    reputationScore: 81n,
    isActive: true,
    returnPct30d: 12.1,
    sharpeRatio: 1.9,
    maxDrawdown: -6.1,
    winRate: 63,
    totalAumUsdc: 85_200,
    priceHistory: generatePriceHistory(2, 0.9, 0.4),
  },
  {
    agentId: 3n,
    owner: "0x9876543210fedcba9876543210fedcba98765432",
    name: "Carbon Yield",
    strategy: "Liquidity Provider",
    tradingThesis:
      "Auto-compound CELO/USDGLO fees on Ubeswap with MEV protection.",
    feePercent: 800n,
    registeredAt: 1_701_000_000n,
    totalTrades: 1204n,
    reputationScore: 88n,
    isActive: true,
    returnPct30d: 9.6,
    sharpeRatio: 3.1,
    maxDrawdown: -2.4,
    winRate: 74,
    totalAumUsdc: 204_800,
    priceHistory: generatePriceHistory(3, 0.6, 0.3),
  },
  {
    agentId: 4n,
    owner: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    name: "DeltaHedger",
    strategy: "Delta Neutral",
    tradingThesis:
      "Pair perp shorts against spot longs to harvest funding.",
    feePercent: 1500n,
    registeredAt: 1_701_500_000n,
    totalTrades: 421n,
    reputationScore: 77n,
    isActive: true,
    returnPct30d: 7.4,
    sharpeRatio: 2.7,
    maxDrawdown: -3.2,
    winRate: 71,
    totalAumUsdc: 52_100,
    priceHistory: generatePriceHistory(4, 0.5, 0.25),
  },
  {
    agentId: 5n,
    owner: "0xfeedfacefeedfacefeedfacefeedfacefeedface",
    name: "EchoScalp",
    strategy: "Market Making",
    tradingThesis:
      "Provide two-sided liquidity on low-volatility pairs.",
    feePercent: 300n,
    registeredAt: 1_702_000_000n,
    totalTrades: 3102n,
    reputationScore: 69n,
    isActive: false,
    returnPct30d: -1.4,
    sharpeRatio: 0.8,
    maxDrawdown: -8.9,
    winRate: 55,
    totalAumUsdc: 18_300,
    priceHistory: generatePriceHistory(5, 1.8, -0.05),
  },
]

/* ---------------- Dashboard / Overview slot config ---------------- */

/**
 * Maps the two dashboard slots (FX + Yield) to on-chain agent IDs in
 * AgentRegistry. All live data is pulled from the contracts by the
 * client components; the `fallbackName` and `description` are only used
 * while the on-chain read is pending or if the agentId is unregistered.
 *
 * Adjust the `agentId` here when new agents are registered on Celo mainnet.
 */
export const DASHBOARD_AGENT_SLOTS: DashboardAgentSlot[] = [
  {
    id: "fx-agent",
    kind: "fx",
    agentId: 1n,
    fallbackName: "FX Agent",
    description:
      "Systematic momentum and carry trades across synthetic FX pairs.",
  },
  {
    id: "yield-agent",
    kind: "yield",
    agentId: 2n,
    fallbackName: "Yield Agent",
    description:
      "Auto-compounds stablecoin and blue-chip LP positions across Celo DEXs.",
  },
]

export const FX_SIGNALS: FxSignal[] = [
  {
    id: "xaut",
    symbol: "XAUT",
    price: "$4,191.18",
    sentiment: "negative",
    sentimentLabel: "NEGATIVE/HOLD",
    title: "Gold forecast: XAU/USD starts the week on a negative note",
    description:
      "Gold forecast: XAU/USD starts the week on a negative note against rising real yields.",
  },
  {
    id: "jpym",
    symbol: "JPYm",
    price: "$0.0064",
    sentiment: "positive",
    sentimentLabel: "POSITIVE/HOLD",
    title: "USD/JPY Forecast Today 17/02 US Dollar Continues",
    description:
      "USD/JPY Forecast Today 17/02 US Dollar Continues to push higher ahead of CPI.",
  },
  {
    id: "zarm",
    symbol: "ZARm",
    price: "$0.054",
    sentiment: "negative",
    sentimentLabel: "NEGATIVE/HOLD",
    title: "USD/ZAR keeps pressure on the Rand",
    description:
      "Pending macro prints weigh on emerging-market FX heading into the week.",
  },
]

export const YIELD_OPPORTUNITIES: YieldOpportunity[] = [
  {
    id: "ubeswap-celo-usdglo",
    rank: 1,
    title: "Provide liquidity to CELO / USDGLO on Ubeswap",
    protocol: "Ubeswap",
    aprPct: 149.06,
    tvlUsd: 1_000_079,
  },
  {
    id: "steer-usdt-wbtc",
    rank: 2,
    title: "Provide liquidity to Steer USDT–WBTC vault",
    protocol: "Steer",
    aprPct: 118.6,
    tvlUsd: 34_605_420,
  },
  {
    id: "uniswap-celo-usdt",
    rank: 3,
    title: "Provide liquidity to Uniswap v4 CELO–USDT",
    protocol: "Uniswap",
    aprPct: 98.3,
    tvlUsd: 60_039_540,
  },
  {
    id: "steer-celo-stcelo",
    rank: 4,
    title: "Provide liquidity to Steer CELO–stCELO vault",
    protocol: "Steer",
    aprPct: 38.35,
    tvlUsd: 513_414_570,
  },
]

