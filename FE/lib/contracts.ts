/**
 * Deployed contract addresses on Celo Mainnet (chainId 42220).
 * Source: SC/deployments/celo-mainnet.json
 *
 * USDC is the NATIVE Circle USDC on Celo (NOT a mock). All balances and
 * approvals on the FE point at this address.
 */
export const CELO_CHAIN_ID = 42220

/** Native USDC on Celo mainnet (Circle, 6 decimals). */
export const USDC_ADDRESS =
  "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`

export const CONTRACT_ADDRESSES = {
  AgentRegistry: "0x13cA51F693A1635B5181F98f0B23a065357F9b30" as `0x${string}`,
  DelegationVault: "0x9470E359871996C31632f1496572B0B29B5a2FA0" as `0x${string}`,
  PlatformFee: "0x2907d7E6922C4e4D4C05E95d0Bb451d6C615ca06" as `0x${string}`,
  // USDC is the native Circle USDC on Celo. Alias kept under the old
  // `MockUSDC` key so the existing FE call sites don't all need updating.
  MockUSDC: USDC_ADDRESS,
  USDC: USDC_ADDRESS,
} as const
