export const SWAP_TOKENS = [
  "USDC",
  "CELO",
  "cUSD",
  "cEUR",
  "USDGLO",
  "stCELO",
] as const

export type SwapToken = (typeof SWAP_TOKENS)[number]
