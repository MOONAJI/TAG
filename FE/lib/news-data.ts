import type { NewsArticle } from "@/types"

/**
 * Seed news relevant to the dashboard topics:
 * AI trading agents, Celo chain, FX signals (XAU/JPY/ZAR), and DeFi yield.
 * Bodies are split into paragraphs so the detail page can render them safely.
 */
export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "celo-mainnet-ai-agents-go-live",
    title: "Celo Mainnet Opens Doors to On-Chain AI Trading Agents",
    summary:
      "Developers can now register autonomous trading agents on Celo's L2, with delegation vaults settling rewards per epoch in native USDC.",
    category: "Celo",
    author: "TAG Desk",
    source: "TAG Research",
    publishedAt: "2026-04-20",
    readMinutes: 4,
    tags: ["Celo", "AI Agents", "Mainnet"],
    body: [
      "Celo mainnet has reached a milestone this week with the public rollout of on-chain AI trading agents. The new AgentRegistry contract lets any developer register a bot, post a fee, and start receiving delegated USDC from vault holders.",
      "Because Celo settles in native USDC and CELO with low predictable fees, registries can settle hundreds of rebalance transactions without the gas volatility that plagues other L1 deployments. Early integrators are reporting sub-cent settlement costs on routine harvests.",
      "TAG's delegation vault contract is one of the first to go live against the registry. Delegators keep custody of principal and can withdraw at epoch boundaries, while agents only ever touch trading balances — a model borrowed from traditional managed accounts.",
      "Next up on the roadmap: reputation scoring, whitelisted swap routers, and a dispute window for agents that breach their declared strategy.",
    ],
  },
  {
    slug: "xau-usd-negative-start-cpi-week",
    title: "Gold Forecast: XAU/USD Starts the Week on a Negative Note",
    summary:
      "Real yields climbed overnight as traders positioned ahead of US CPI, pushing spot gold below $4,180 and keeping XAUT agents defensive.",
    category: "FX",
    author: "FX Agent",
    source: "Macro Signals",
    publishedAt: "2026-04-21",
    readMinutes: 3,
    tags: ["XAU", "Gold", "CPI"],
    body: [
      "Gold opened the week under pressure, slipping back through $4,180 after a hotter-than-expected US jobs print lifted real yields across the curve. Short-term momentum models on the FX desk have flipped to a NEGATIVE/HOLD stance on XAUT.",
      "The 20-day average, which acted as support through the end of Q1, has now turned into resistance. A close back above $4,230 would invalidate the bearish set-up, but until then agents are reducing gross exposure.",
      "Tuesday's CPI release is the main event risk. A core print above 3.4% YoY would likely extend the pullback, while a softer surprise could trigger a rotation back into precious metals and rate-sensitive majors.",
    ],
  },
  {
    slug: "usd-jpy-forecast-17-02-dollar-continues",
    title: "USD/JPY Forecast Today 17/02: US Dollar Continues Its Climb",
    summary:
      "Carry-trade flows pushed the Dollar Yen pair to fresh multi-week highs, while synthetic JPYm on Celo tracked spot within a few basis points.",
    category: "FX",
    author: "FX Agent",
    source: "Macro Signals",
    publishedAt: "2026-04-18",
    readMinutes: 3,
    tags: ["JPY", "USD", "Carry"],
    body: [
      "USD/JPY pushed higher through the Asia session as widening rate differentials continue to favour the Dollar. Our FX agent flipped to POSITIVE/HOLD on JPYm late last week and has maintained that stance.",
      "Intervention risk remains the obvious counter-argument. MoF officials reiterated they are watching markets with 'high urgency,' but the pair's steady grind — rather than a disorderly spike — has so far given authorities little reason to act.",
      "For delegators, the takeaway is that short-JPYm, long-USDm spreads have produced a 4.2% rolling 30-day return net of fees. Sizing remains capped at 1% of vault balance per position.",
    ],
  },
  {
    slug: "ubeswap-celo-usdglo-apr-spike",
    title: "Ubeswap CELO/USDGLO Pool APR Spikes Past 149%",
    summary:
      "A surge in stablecoin demand on Celo has pushed effective APR on the CELO/USDGLO market above 149%, attracting yield agents across networks.",
    category: "Yield",
    author: "Yield Agent",
    source: "DeFiLlama",
    publishedAt: "2026-04-19",
    readMinutes: 5,
    tags: ["Ubeswap", "CELO", "USDGLO"],
    body: [
      "Liquidity providers on Ubeswap are seeing the highest realized yields in months. The CELO/USDGLO strategy vault reported an effective 149.06% APR over the last seven days as trading volume on the pair more than doubled.",
      "The move follows a regulatory approval for USDGLO in two additional Latin American markets, which drove a one-off conversion wave through Celo's on-chain FX rails. Fee capture on the concentrated range vault has been the primary contributor to APR.",
      "Yield agents subscribed to this market are auto-compounding fees every epoch and rotating 30% of rewards into stCELO LP, where base APR still sits around 38.3%. That splits exposure between a higher-beta trading pool and a stickier staking position.",
      "Delegators should note that elevated APRs on concentrated liquidity can decay quickly once the liquidity rush arrives. Position sizing and a disciplined un-wind schedule remain the primary risk controls.",
    ],
  },
  {
    slug: "delta-neutral-funding-rates-normalize",
    title: "Delta-Neutral Desks Brace for Funding-Rate Normalization",
    summary:
      "Perp funding on major venues has pulled back from cycle highs, tightening spreads for delta-neutral agents like DeltaHedger.",
    category: "Market",
    author: "TAG Desk",
    source: "Glassnode",
    publishedAt: "2026-04-17",
    readMinutes: 4,
    tags: ["Delta Neutral", "Funding", "Perps"],
    body: [
      "The cash-and-carry trade — long spot, short perp — has been the workhorse of this cycle's delta-neutral strategies. Funding rates on the largest venues have now fallen back to roughly 8% annualized, down from peaks above 25% in February.",
      "That compression matters for agents such as DeltaHedger: their 30-day return dropped to 7.4% as realized funding cooled. Sharpe remains a healthy 2.7 because drawdowns are capped by the paired structure.",
      "Strategies that can rotate between venues and pairs will continue to outperform single-market funding harvesters through the summer.",
    ],
  },
  {
    slug: "tag-launches-agent-leaderboard",
    title: "TAG Launches Public Agent Leaderboard",
    summary:
      "The new leaderboard ranks every on-chain trading agent by 30-day return, Sharpe, AUM, and fee — giving delegators a single comparison surface.",
    category: "AI Agents",
    author: "TAG Desk",
    source: "TAG Research",
    publishedAt: "2026-04-16",
    readMinutes: 2,
    tags: ["Leaderboard", "Delegation", "Transparency"],
    body: [
      "TAG is rolling out its public Agent Leaderboard today. Every agent registered on Celo mainnet is indexed automatically, with stats refreshed each epoch.",
      "Filters let delegators slice by 'Active,' 'Top Sharpe,' or by strategy type, while sort options cover 30-day return, risk-adjusted performance, AUM, and management fee.",
      "Connecting a wallet unlocks one-click delegation. Until then, the leaderboard runs on seed data and clearly flags unconfigured contract addresses at the top of the page.",
    ],
  },
]

export function getNewsBySlug(slug: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((article) => article.slug === slug)
}

export function getRelatedNews(
  slug: string,
  category: string,
  limit = 3,
): NewsArticle[] {
  return NEWS_ARTICLES.filter(
    (article) => article.slug !== slug && article.category === category,
  ).slice(0, limit)
}
