"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  BadgeCheck,
  LineChart,
  Loader2,
  Sparkles,
  Sprout,
} from "lucide-react"
import { useAccount } from "wagmi"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatBps, formatUSDC, shortAddr } from "@/lib/format"
import { useOnchainAgent } from "@/hooks/use-registry"
import {
  useApproveUsdc,
  useClaimRewards,
  useComputeFee,
  useDeposit,
  useInvalidateOnConfirm,
  usePendingReward,
  usePlatformFeePercent,
  usePool,
  usePosition,
  useUsdcAllowance,
  useUsdcBalance,
  useWithdraw,
} from "@/hooks/use-vault"
import type { DashboardAgentSlot } from "@/types"

/**
 * Live agent card for the dashboard.
 *
 * Data source:
 *   - AgentRegistry.getAgent(agentId)   → name, strategy, isActive, owner, feePercent
 *   - DelegationVault.getPosition(id,u) → principal (user's deposited USDC)
 *   - DelegationVault.pendingReward     → unclaimed rewards
 *   - DelegationVault.getPool(agentId)  → totalPrincipal (pool AUM)
 *
 * Actions:
 *   - Deposit (+ approve if allowance insufficient)
 *   - Withdraw
 *   - Claim Rewards
 *   - View Dashboard (→ /agent/[id])
 */
export function AgentCard({ agent: slot }: { agent: DashboardAgentSlot }) {
  const Icon = slot.kind === "fx" ? LineChart : Sprout
  const { isConnected: connected } = useAccount()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const isConnected = mounted && connected

  const [mode, setMode] = useState<"deposit" | "withdraw" | null>(null)
  const [amountInput, setAmountInput] = useState("")
  // Stash for the approve→deposit chain: when needsApproval, the UI fires
  // approve first, then this drives the deposit once the approve confirms.
  const [pendingDepositAmount, setPendingDepositAmount] = useState<bigint | null>(null)

  const {
    data: agentInfo,
    isLoading: agentLoading,
  } = useOnchainAgent(slot.agentId)
  const { data: pool } = usePool(slot.agentId)
  const { data: position } = usePosition(slot.agentId)
  const { data: pending } = usePendingReward(slot.agentId)
  const { data: allowance } = useUsdcAllowance()
  const { data: walletUsdc } = useUsdcBalance()

  const {
    approve,
    isPending: isApproving,
    data: approveHash,
  } = useApproveUsdc()
  const {
    deposit,
    isPending: isDepositing,
    data: depositHash,
  } = useDeposit()
  const {
    withdraw,
    isPending: isWithdrawing,
    data: withdrawHash,
  } = useWithdraw()
  const { claim, isPending: isClaiming, data: claimHash } = useClaimRewards()

  const { isConfirming: isApprovingTx } = useInvalidateOnConfirm(
    approveHash,
    () => {
      if (pendingDepositAmount !== null) {
        const amt = pendingDepositAmount
        setPendingDepositAmount(null)
        deposit(slot.agentId, amt)
      }
    },
  )
  const { isConfirming: isDepositingTx } = useInvalidateOnConfirm(
    depositHash,
    () => {
      setAmountInput("")
      setMode(null)
    },
  )
  const { isConfirming: isWithdrawingTx } = useInvalidateOnConfirm(
    withdrawHash,
    () => {
      setAmountInput("")
      setMode(null)
    },
  )
  const { isConfirming: isClaimingTx } = useInvalidateOnConfirm(claimHash)

  const registered = agentInfo && agentInfo.agentId !== 0n
  const name = registered ? agentInfo!.name : slot.fallbackName
  const strategy = registered ? agentInfo!.strategy : slot.description
  const isActive = registered ? agentInfo!.isActive : false
  const owner = registered ? agentInfo!.owner : undefined
  const feePercent = registered ? agentInfo!.feePercent : 0n

  const principal = position?.principal ?? 0n
  const pendingRewards = pending ?? 0n
  const poolTotal = pool?.totalPrincipal ?? 0n

  const amountRaw = amountInput
    ? BigInt(Math.floor(Number(amountInput) * 1_000_000))
    : 0n
  const needsApproval = (allowance ?? 0n) < amountRaw

  // Live platform-fee read — fee is charged in bps on the withdraw amount.
  const { data: platformFeeBps } = usePlatformFeePercent()
  const { data: withdrawFee } = useComputeFee(
    mode === "withdraw" ? amountRaw : undefined,
  )
  const withdrawFeeAmount = withdrawFee ?? 0n
  const withdrawNet =
    amountRaw > withdrawFeeAmount ? amountRaw - withdrawFeeAmount : 0n

  function handleDeposit() {
    if (!amountRaw) return
    if (needsApproval) {
      setPendingDepositAmount(amountRaw)
      approve(amountRaw)
    } else {
      deposit(slot.agentId, amountRaw)
    }
  }

  function handleWithdraw() {
    if (!amountRaw) return
    withdraw(slot.agentId, amountRaw)
  }

  function handleClaim() {
    claim(slot.agentId)
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center"
            aria-hidden="true"
          >
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              {agentLoading ? (
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Loading…
                </span>
              ) : (
                name
              )}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isActive ? "bg-primary" : "bg-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                {registered
                  ? isActive
                    ? "Active"
                    : "Paused"
                  : "Not registered"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{strategy}</span>
            </div>
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-mono uppercase tracking-wider",
            isActive && "border-primary/40 text-primary",
          )}
        >
          #{slot.agentId.toString()}
        </Badge>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Your Principal"
          value={
            isConnected ? `$${formatUSDC(principal)}` : (
              <span className="text-muted-foreground">—</span>
            )
          }
        />
        <Stat
          label="Pending Rewards"
          value={
            isConnected ? (
              <span
                className={cn(
                  pendingRewards > 0n ? "text-primary" : undefined,
                )}
              >
                ${formatUSDC(pendingRewards)}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          }
        />
        <Stat
          label="Owner"
          value={
            owner ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-sm">
                <BadgeCheck className="size-3.5 text-primary" aria-hidden="true" />
                {shortAddr(owner)}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )
          }
          hint={registered ? `Fee ${formatBps(feePercent)}` : undefined}
        />
        <Stat
          label="Pool AUM"
          value={
            <span className="text-sm font-semibold">
              ${formatUSDC(poolTotal)}
            </span>
          }
        />
      </div>

      {mode && isConnected && registered ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-secondary/30 p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              {mode === "deposit" ? "Deposit USDC" : "Withdraw USDC"}
            </label>
            <span className="text-[11px] text-muted-foreground">
              {mode === "deposit"
                ? `Wallet: $${formatUSDC(walletUsdc ?? 0n)}`
                : `Max: $${formatUSDC(principal)}`}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              size="sm"
              disabled={
                !amountInput ||
                isDepositing ||
                isDepositingTx ||
                isWithdrawing ||
                isWithdrawingTx ||
                isApproving ||
                isApprovingTx ||
                (mode === "withdraw" && amountRaw > principal)
              }
              onClick={mode === "deposit" ? handleDeposit : handleWithdraw}
            >
              {mode === "deposit"
                ? isApproving || isApprovingTx
                  ? "Approving…"
                  : isDepositing || isDepositingTx
                    ? "Depositing…"
                    : needsApproval
                      ? "Approve & Deposit"
                      : "Confirm Deposit"
                : isWithdrawing || isWithdrawingTx
                  ? "Withdrawing…"
                  : "Confirm Withdraw"}
            </Button>
          </div>
          {mode === "withdraw" && amountRaw > 0n ? (
            <div className="flex flex-col gap-1 pt-1 text-[11px] text-muted-foreground font-mono">
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
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={slot.kind === "fx" ? "/fx-agent" : "/yield-agent"}>
            View Dashboard
          </Link>
        </Button>

        {pendingRewards > 0n ? (
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            disabled={!isConnected || isClaiming || isClaimingTx}
            onClick={handleClaim}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            {isClaiming || isClaimingTx ? "Claiming…" : "Claim Rewards"}
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            disabled={!isConnected || !registered}
            onClick={() =>
              setMode((m) => (m === "deposit" ? null : "deposit"))
            }
          >
            {mode === "deposit" ? "Cancel" : "Deposit"}
          </Button>
        )}

        {principal > 0n ? (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={!isConnected}
            onClick={() =>
              setMode((m) => (m === "withdraw" ? null : "withdraw"))
            }
          >
            {mode === "withdraw" ? "Cancel" : "Withdraw"}
          </Button>
        ) : null}
      </div>

      {!isConnected ? (
        <p className="text-xs text-muted-foreground">
          Connect your wallet on Celo mainnet to deposit USDC.
        </p>
      ) : null}
      {isConnected && !registered ? (
        <p className="text-xs text-destructive">
          Agent #{slot.agentId.toString()} has not been registered on-chain yet.
        </p>
      ) : null}
    </article>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
