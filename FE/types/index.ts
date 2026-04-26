/**
 * Shared types for TAG.
 * Shapes mirror the on-chain structs from AgentRegistry.sol and DelegationVault.sol.
 * We use `bigint` for on-chain values and `number` for off-chain seed/display values.
 */

/** Matches AgentInfo struct from AgentRegistry.sol */
export interface Agent {
  agentId: bigint
  owner: `0x${string}`
  name: string
  strategy: string
  tradingThesis: string
  feePercent: bigint // basis points, divide by 100 for %
  registeredAt: bigint // unix timestamp
  totalTrades: bigint
  reputationScore: bigint
  isActive: boolean
}

/** Off-chain performance stats seeded by backend */
export interface AgentStats {
  agentId: bigint
  returnPct30d: number // e.g. 12.4 = +12.4%
  sharpeRatio: number
  maxDrawdown: number
  winRate: number // 0-100
  totalAumUsdc: number // human-readable USDC
  priceHistory: PricePoint[]
}

export interface PricePoint {
  timestamp: number
  value: number // index starting at 100
}

/** Merged view used by leaderboard and profile pages */
export interface AgentViewModel extends Agent, AgentStats {}

/** Delegator position from DelegationVault — mirrors DelegatorPosition struct */
export interface Position {
  agentId: bigint
  principal: bigint
  rewardDebt: bigint
  pendingRewards: bigint
  depositedAt: bigint
}

/** Pool summary for an agent */
export interface AgentPool {
  totalPrincipal: bigint
  totalDistributed: bigint
  operatorRewards: bigint
}

/** Dashboard-specific types (the Overview page) */
export type AgentKind = "fx" | "yield"

/**
 * Dashboard slot config — maps a UI slot (FX / Yield) to an on-chain agentId.
 * All live data (name, status, principal, pending rewards) is read from the
 * AgentRegistry + DelegationVault via wagmi hooks in the client components.
 */
export interface DashboardAgentSlot {
  id: string
  kind: AgentKind
  agentId: bigint
  fallbackName: string
  description: string
}

export interface FxSignal {
  id: string
  symbol: string // e.g. "XAUT"
  price: string // formatted price string
  sentiment: "positive" | "negative" | "neutral"
  sentimentLabel: string // e.g. "NEGATIVE/HOLD"
  title: string
  description: string
  icon?: string
}

export interface YieldOpportunity {
  id: string
  rank: number
  title: string
  protocol: string
  aprPct: number
  tvlUsd: number
  icon?: string
}

/** News article used by /news list and /news/[slug] detail pages */
export type NewsCategory =
  | "AI Agents"
  | "Celo"
  | "FX"
  | "Yield"
  | "Protocol"
  | "Market"

export interface NewsArticle {
  slug: string
  title: string
  summary: string
  category: NewsCategory
  author: string
  source: string
  publishedAt: string // ISO date
  readMinutes: number
  tags: string[]
  /** Array of paragraphs; simple plain-text body to keep things safe and typed */
  body: string[]
}
