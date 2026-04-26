"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import {
  usePosition,
  usePendingReward,
  useDeposit,
  useWithdraw,
  useClaimRewards,
  useApproveUsdc,
  useUsdcAllowance,
  useComputeFee,
  usePlatformFeePercent,
} from "@/hooks/use-vault"
import { Button } from "@/components/ui/button"
import { formatBps, formatUSDC } from "@/lib/format"

interface PositionPanelProps {
  agentId: bigint
}

export function PositionPanel({ agentId }: PositionPanelProps) {
  const { address, isConnected: connected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [depositInput, setDepositInput] = useState("")
  const [withdrawInput, setWithdrawInput] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const isConnected = mounted && connected

  const { data: position, refetch: refetchPosition } = usePosition(agentId)
  const { data: pending, refetch: refetchPending } = usePendingReward(agentId)
  const { data: allowance } = useUsdcAllowance()

  const { approve, isPending: isApproving } = useApproveUsdc()
  const { deposit, isPending: isDepositing } = useDeposit()
  const { withdraw, isPending: isWithdrawing } = useWithdraw()
  const { claim, isPending: isClaiming } = useClaimRewards()

  if (!isConnected || !address) {
    return (
      <p className="text-sm text-muted-foreground">
        Connect your wallet on Celo mainnet to delegate USDC to this agent.
      </p>
    )
  }

  const principal = position?.principal ?? 0n
  const pendingRewards = pending ?? 0n

  const depositAmountRaw = depositInput
    ? BigInt(Math.floor(Number(depositInput) * 1_000_000))
    : 0n
  const withdrawAmountRaw = withdrawInput
    ? BigInt(Math.floor(Number(withdrawInput) * 1_000_000))
    : 0n

  const needsApproval = (allowance ?? 0n) < depositAmountRaw

  const { data: platformFeeBps } = usePlatformFeePercent()
  const { data: withdrawFee } = useComputeFee(
    withdrawAmountRaw > 0n ? withdrawAmountRaw : undefined,
  )
  const withdrawFeeAmount = withdrawFee ?? 0n
  const withdrawNet =
    withdrawAmountRaw > withdrawFeeAmount
      ? withdrawAmountRaw - withdrawFeeAmount
      : 0n

  async function handleDeposit() {
    if (!depositAmountRaw) return
    if (needsApproval) {
      await approve(depositAmountRaw)
    }
    await deposit(agentId, depositAmountRaw)
    setDepositInput("")
    refetchPosition()
    refetchPending()
  }

  async function handleWithdraw() {
    if (!withdrawAmountRaw) return
    await withdraw(agentId, withdrawAmountRaw)
    setWithdrawInput("")
    refetchPosition()
    refetchPending()
  }

  async function handleClaim() {
    await claim(agentId)
    refetchPosition()
    refetchPending()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Principal
          </p>
          <div className="mt-1 text-lg font-semibold">
            {principal > 0n ? `$${formatUSDC(principal)}` : "—"}
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Pending Rewards
          </p>
          <div className="mt-1 text-lg font-semibold text-primary">
            {pendingRewards > 0n ? `$${formatUSDC(pendingRewards)}` : "—"}
          </div>
        </div>
        {pendingRewards > 0n && (
          <div>
            <Button
              size="sm"
              variant="outline"
              disabled={isClaiming}
              onClick={handleClaim}
            >
              {isClaiming ? "Claiming…" : "Claim Rewards"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 items-center flex-1">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="USDC amount"
            value={depositInput}
            onChange={(e) => setDepositInput(e.target.value)}
            className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            size="sm"
            disabled={!depositInput || isDepositing || isApproving}
            onClick={handleDeposit}
          >
            {isApproving ? "Approving…" : isDepositing ? "Depositing…" : needsApproval && depositInput ? "Approve & Deposit" : "Deposit"}
          </Button>
        </div>
        {principal > 0n && (
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                step="0.01"
                max={Number(principal) / 1_000_000}
                placeholder="USDC amount"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!withdrawInput || isWithdrawing}
                onClick={handleWithdraw}
              >
                {isWithdrawing ? "Withdrawing…" : "Withdraw"}
              </Button>
            </div>
            {withdrawAmountRaw > 0n && (
              <div className="flex flex-col gap-0.5 text-[11px] font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>
                    Platform fee
                    {platformFeeBps !== undefined
                      ? ` (${formatBps(platformFeeBps)})`
                      : ""}
                  </span>
                  <span>−${formatUSDC(withdrawFeeAmount)}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>You receive</span>
                  <span className="font-semibold">
                    ${formatUSDC(withdrawNet)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
