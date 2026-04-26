"use client"

import { useReadContract, useWriteContract, useAccount } from "wagmi"
import { AGENT_REGISTRY_ABI } from "@/lib/abis"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"
import { celoMainnet } from "@/lib/wagmi"

// All reads are pinned to Celo mainnet so they succeed even when the
// connected wallet is currently on a different chain.
const registryConfig = {
  address: CONTRACT_ADDRESSES.AgentRegistry,
  abi: AGENT_REGISTRY_ABI,
  chainId: celoMainnet.id,
} as const

/** Read on-chain AgentInfo for a given agentId. */
export function useOnchainAgent(agentId: bigint | undefined) {
  return useReadContract({
    ...registryConfig,
    functionName: "getAgent",
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled: agentId !== undefined },
  })
}

/** Read total number of registered agents (active + inactive). */
export function useTotalAgents() {
  return useReadContract({
    ...registryConfig,
    functionName: "totalAgents",
  })
}

/** Read on-chain reviews for a given agent. */
export function useAgentReviews(agentId: bigint | undefined) {
  return useReadContract({
    ...registryConfig,
    functionName: "getReviews",
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled: agentId !== undefined },
  })
}

/** Lookup agentId owned by the connected wallet (0n = none). */
export function useMyAgentId() {
  const { address } = useAccount()
  return useReadContract({
    ...registryConfig,
    functionName: "getAgentIdByOwner",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  })
}

/** Check whether a given agentId is active. */
export function useIsAgentActive(agentId: bigint | undefined) {
  return useReadContract({
    ...registryConfig,
    functionName: "isAgentActive",
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled: agentId !== undefined },
  })
}

/** Register a new agent. Returns wagmi write helpers. */
export function useRegisterAgent() {
  return useWriteContract()
}

/** Submit a review for an agent (must be a past delegator). */
export function useSubmitReview() {
  return useWriteContract()
}
