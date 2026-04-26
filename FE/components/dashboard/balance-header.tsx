"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Copy,
  ExternalLink,
  Plus,
  Wallet,
} from "lucide-react"
import { useAccount } from "wagmi"

import { Button } from "@/components/ui/button"
import { formatUSDC, shortAddr } from "@/lib/format"
import { DASHBOARD_AGENT_SLOTS } from "@/lib/mock-data"
import {
  usePendingReward,
  usePosition,
  useUsdcBalance,
} from "@/hooks/use-vault"
import { TopUpDialog } from "./topup-dialog"
import { WithdrawDialog } from "./withdraw-dialog"

/**
 * Live portfolio header. Reads:
 *   - wallet USDC balance (native Celo USDC.balanceOf)
 *   - delegated principal per dashboard slot (DelegationVault.getPosition)
 *   - unclaimed rewards per dashboard slot (DelegationVault.pendingReward)
 *
 * Shown values are the actual on-chain state of the connected wallet.
 */
export function BalanceHeader() {
  const { address, isConnected: connected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Force server and first client render to match. Wallet state only shows
  // after hydration to avoid mismatch with isConnected/address.
  const isConnected = mounted && connected

  // Two dashboard slots → two fixed positions + rewards.
  const [fxSlot, yieldSlot] = DASHBOARD_AGENT_SLOTS
  const { data: fxPosition, refetch: refetchFxPos } = usePosition(fxSlot?.agentId)
  const { data: yieldPosition, refetch: refetchYieldPos } = usePosition(
    yieldSlot?.agentId,
  )
  const { data: fxPending, refetch: refetchFxPending } = usePendingReward(
    fxSlot?.agentId,
  )
  const { data: yieldPending, refetch: refetchYieldPending } = usePendingReward(
    yieldSlot?.agentId,
  )
  const { data: usdcBalance, refetch: refetchUsdc } = useUsdcBalance()

  function refetchAll() {
    refetchFxPos()
    refetchYieldPos()
    refetchFxPending()
    refetchYieldPending()
    refetchUsdc()
  }

  const fxPrincipal = fxPosition?.principal ?? 0n
  const yieldPrincipal = yieldPosition?.principal ?? 0n
  const fxRewards = fxPending ?? 0n
  const yieldRewards = yieldPending ?? 0n
  const walletUsdc = usdcBalance ?? 0n

  const fxTotal = fxPrincipal + fxRewards
  const yieldTotal = yieldPrincipal + yieldRewards
  const delegatedTotal = fxTotal + yieldTotal
  const grandTotal = walletUsdc + delegatedTotal

  async function handleCopy() {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (insecure context); silently ignore.
    }
  }

  const explorerUrl =
    isConnected && address
      ? `https://celoscan.io/address/${address}`
      : undefined

  return (
    <section
      aria-labelledby="total-balance-heading"
      className="rounded-2xl border border-border bg-card p-5 md:p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h2
            id="total-balance-heading"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Total Portfolio Balance
          </h2>
          <p className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight text-balance">
            {isConnected ? `$${formatUSDC(grandTotal)}` : "—"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              Wallet:{" "}
              <span className="text-foreground/90">
                {isConnected ? `$${formatUSDC(walletUsdc)}` : "—"}
              </span>
            </span>
            <span>
              FX:{" "}
              <span className="text-foreground/90">
                {isConnected ? `$${formatUSDC(fxTotal)}` : "—"}
              </span>
            </span>
            <span>
              Yield:{" "}
              <span className="text-foreground/90">
                {isConnected ? `$${formatUSDC(yieldTotal)}` : "—"}
              </span>
            </span>
          </div>
          {isConnected && address ? (
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              {shortAddr(address)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Connect your wallet to see live balances.
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <TopUpDialog
              onSettled={refetchAll}
              trigger={
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!isConnected}
                  aria-label="Top up portfolio"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Top Up
                </Button>
              }
            />
            <WithdrawDialog
              onSettled={refetchAll}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={!isConnected || delegatedTotal === 0n}
                  aria-label="Withdraw to wallet"
                >
                  <ArrowDownToLine className="size-4" aria-hidden="true" />
                  Withdraw
                </Button>
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              disabled={!isConnected}
              onClick={handleCopy}
            >
              <Copy className="size-4" aria-hidden="true" />
              {copied ? "Copied" : "Copy Address"}
            </Button>
            <Button size="sm" variant="ghost" asChild className="gap-1.5">
              <Link href="/swap">
                <ArrowLeftRight className="size-4" aria-hidden="true" />
                Swap
              </Link>
            </Button>
            {explorerUrl ? (
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="gap-1.5"
                aria-label="View wallet on Celoscan"
              >
                <a href={explorerUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="ghost" disabled aria-label="Wallet">
                <Wallet className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
