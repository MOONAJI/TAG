// ============================================================
// FILE: lib/services/chainlinkMock.ts
// Taruh di: tag/BE/lib/services/chainlinkMock.ts
//
// Mock Chainlink price feed. Nanti kalau mau pakai real Chainlink,
// bisa pakai viem yang udah ada di project:
//   import { createPublicClient, http } from "viem";
//   import { celo } from "viem/chains";
//   const client = createPublicClient({ chain: celo, transport: http() });
// ============================================================

import type { PriceFeed, AllPrices } from "@/types/agent";

const BASE_PRICES: Record<string, number> = {
  "ETH/USD": 3412.5,
  "BTC/USD": 67840.0,
  "LINK/USD": 18.74,
  "SOL/USD": 172.3,
  "MATIC/USD": 0.892,
};

function fluctuate(base: number): number {
  const delta = (Math.random() - 0.5) * 0.01; // ±0.5%
  return parseFloat((base * (1 + delta)).toFixed(2));
}

export function getPrices(): AllPrices {
  const now = new Date().toISOString();

  const prices: Record<string, PriceFeed> = {};
  for (const [pair, base] of Object.entries(BASE_PRICES)) {
    prices[pair] = {
      pair,
      price: fluctuate(base),
      decimals: 8,
      roundId: Math.floor(Math.random() * 1_000_000) + 18_000_000,
      updated_at: now,
      source: "mock-chainlink",
    };
  }

  return { prices, fetched_at: now };
}

export function getPrice(pair: string): PriceFeed | null {
  const key = pair.toUpperCase();
  if (!BASE_PRICES[key]) return null;

  return {
    pair: key,
    price: fluctuate(BASE_PRICES[key]),
    decimals: 8,
    roundId: Math.floor(Math.random() * 1_000_000) + 18_000_000,
    updated_at: new Date().toISOString(),
    source: "mock-chainlink",
  };
}

// ── Upgrade ke Chainlink real (pakai viem) ─────────────────
// import { createPublicClient, http, parseAbi } from "viem";
//
// const CHAINLINK_ABI = parseAbi([
//   "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
//   "function decimals() view returns (uint8)",
// ]);
//
// export async function getLivePriceFromChainlink(feedAddress: `0x${string}`, client) {
//   const [roundData, decimals] = await Promise.all([
//     client.readContract({ address: feedAddress, abi: CHAINLINK_ABI, functionName: "latestRoundData" }),
//     client.readContract({ address: feedAddress, abi: CHAINLINK_ABI, functionName: "decimals" }),
//   ]);
//   return Number(roundData[1]) / 10 ** Number(decimals);
// }