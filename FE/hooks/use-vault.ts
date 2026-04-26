"use client"

import { useEffect } from "react"
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi"
import { useQueryClient } from "@tanstack/react-query"
import { DELEGATION_VAULT_ABI, ERC20_ABI, PLATFORM_FEE_ABI } from "@/lib/abis"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"
import { celoMainnet } from "@/lib/wagmi"

// Pin all reads to Celo mainnet. Without this, wagmi uses the wallet's
// current chain — if the user is on a different chain, every read returns
// empty and the UI reports "Not registered" even when the contracts are healthy.
const vaultConfig = {
  address: CONTRACT_ADDRESSES.DelegationVault,
  abi: DELEGATION_VAULT_ABI,
  chainId: celoMainnet.id,
} as const

const usdcConfig = {
  address: CONTRACT_ADDRESSES.USDC,
  abi: ERC20_ABI,
  chainId: celoMainnet.id,
} as const

const platformFeeConfig = {
  address: CONTRACT_ADDRESSES.PlatformFee,
  abi: PLATFORM_FEE_ABI,
  chainId: celoMainnet.id,
} as const

/**
 * Read the current platform fee percentage (basis points, e.g. 10 = 0.10%).
 * Applied to deposit and withdraw flows as a protocol-level transaction fee.
 */
export function usePlatformFeePercent() {
  return useReadContract({
    ...platformFeeConfig,
    functionName: "feePercent",
  })
}

/**
 * Read the computed fee (in USDC base units) the platform would charge for a
 * trade of `tradeSize`. Returns 0 when `tradeSize` is undefined or 0.
 */
export function useComputeFee(tradeSize: bigint | undefined) {
  return useReadContract({
    ...platformFeeConfig,
    functionName: "computeFee",
    args: tradeSize !== undefined && tradeSize > 0n ? [tradeSize] : undefined,
    query: { enabled: tradeSize !== undefined && tradeSize > 0n },
  })
}

/** Read the delegator position for the connected wallet in an agent pool. */
export function usePosition(agentId: bigint | undefined) {
  const { address } = useAccount()
  return useReadContract({
    ...vaultConfig,
    functionName: "getPosition",
    args: agentId !== undefined && address ? [agentId, address] : undefined,
    query: { enabled: agentId !== undefined && Boolean(address) },
  })
}

/** Read aggregate pool state for an agent. */
export function usePool(agentId: bigint | undefined) {
  return useReadContract({
    ...vaultConfig,
    functionName: "getPool",
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled: agentId !== undefined },
  })
}

/** Read pending (unclaimed) reward for the connected wallet in a pool. */
export function usePendingReward(agentId: bigint | undefined) {
  const { address } = useAccount()
  return useReadContract({
    ...vaultConfig,
    functionName: "pendingReward",
    args: agentId !== undefined && address ? [agentId, address] : undefined,
    query: { enabled: agentId !== undefined && Boolean(address) },
  })
}

/** Read native USDC balance of the connected wallet. */
export function useUsdcBalance() {
  const { address } = useAccount()
  return useReadContract({
    ...usdcConfig,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  })
}

/** Read native USDC allowance the connected wallet has granted to DelegationVault. */
export function useUsdcAllowance() {
  const { address } = useAccount()
  return useReadContract({
    ...usdcConfig,
    functionName: "allowance",
    args: address
      ? [address, CONTRACT_ADDRESSES.DelegationVault]
      : undefined,
    query: { enabled: Boolean(address) },
  })
}

/**
 * Approve DelegationVault to spend USDC.
 * Call `writeContract({ ...approveArgs, args: [vaultAddress, amount] })`.
 */
export function useApproveUsdc() {
  const { writeContract, ...rest } = useWriteContract()
  const approve = (amount: bigint) =>
    writeContract({
      ...usdcConfig,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.DelegationVault, amount],
    })
  return { approve, ...rest }
}

/** Deposit USDC into an agent pool (requires prior USDC approval). */
export function useDeposit() {
  const { writeContract, ...rest } = useWriteContract()
  const deposit = (agentId: bigint, amount: bigint) =>
    writeContract({
      ...vaultConfig,
      functionName: "deposit",
      args: [agentId, amount],
    })
  return { deposit, ...rest }
}

/** Withdraw principal USDC from an agent pool (auto-claims pending rewards). */
export function useWithdraw() {
  const { writeContract, ...rest } = useWriteContract()
  const withdraw = (agentId: bigint, amount: bigint) =>
    writeContract({
      ...vaultConfig,
      functionName: "withdraw",
      args: [agentId, amount],
    })
  return { withdraw, ...rest }
}

/** Claim accumulated delegator rewards from an agent pool. */
export function useClaimRewards() {
  const { writeContract, ...rest } = useWriteContract()
  const claim = (agentId: bigint) =>
    writeContract({
      ...vaultConfig,
      functionName: "claimRewards",
      args: [agentId],
    })
  return { claim, ...rest }
}

/** Claim operator rewards (agent owner only). */
export function useClaimOperatorRewards() {
  const { writeContract, ...rest } = useWriteContract()
  const claimOperator = (agentId: bigint) =>
    writeContract({
      ...vaultConfig,
      functionName: "claimOperatorRewards",
      args: [agentId],
    })
  return { claimOperator, ...rest }
}

/**
 * Awaits the receipt for `hash` and, on success, invalidates every
 * react-query cache entry tagged by wagmi as a contract read so that
 * positions / balances / pool AUM in any mounted component refresh.
 *
 * Without this, separate copies of useReadContract in the BalanceHeader
 * and AgentCard never see each other's writes; refetch() on one hook
 * does not propagate.
 */
export function useInvalidateOnConfirm(
  hash: `0x${string}` | undefined,
  onConfirmed?: () => void,
) {
  const queryClient = useQueryClient()
  const { isSuccess, isLoading } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      // Wagmi tags read queries with these prefixes — invalidating both is
      // a single broad sweep that covers every contract read on the page.
      queryClient.invalidateQueries({ queryKey: ["readContract"] })
      queryClient.invalidateQueries({ queryKey: ["readContracts"] })
      onConfirmed?.()
    }
  }, [isSuccess, queryClient, onConfirmed])

  return { isConfirming: isLoading, isConfirmed: isSuccess }
}
