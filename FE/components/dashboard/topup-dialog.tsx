"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Wallet } from "lucide-react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatUSDC } from "@/lib/format"
import { DASHBOARD_AGENT_SLOTS } from "@/lib/mock-data"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"
import {
  useApproveUsdc,
  useDeposit,
  useUsdcAllowance,
  useUsdcBalance,
} from "@/hooks/use-vault"

type Stage = "idle" | "approving" | "depositing" | "done" | "error"

const QUICK_AMOUNTS = [10, 50, 100, 500]

/**
 * Top-up flow for delegating real USDC on Celo to a dashboard agent slot.
 *
 *   - target = "wallet"  → no-op; user already holds the USDC. We just close.
 *   - target = agentId   → approve (if allowance < amount) → deposit
 *
 * USDC on Celo is the NATIVE Circle token (0xceba…118C) — there is no faucet.
 * Users must already hold USDC in their wallet (bridge / fiat onramp / swap).
 */
export function TopUpDialog({
  trigger,
  onSettled,
}: {
  trigger: React.ReactNode
  onSettled?: () => void
}) {
  const { address, isConnected } = useAccount()
  const [open, setOpen] = useState(false)
  const [amountInput, setAmountInput] = useState("100")
  const [target, setTarget] = useState<"wallet" | string>(
    DASHBOARD_AGENT_SLOTS[0]?.id ?? "wallet",
  )
  const [stage, setStage] = useState<Stage>("idle")
  const [err, setErr] = useState<string | null>(null)

  const { data: walletUsdc, refetch: refetchBalance } = useUsdcBalance()
  const { data: allowance, refetch: refetchAllowance } = useUsdcAllowance()

  const {
    approve,
    data: approveHash,
    error: approveError,
    reset: resetApprove,
  } = useApproveUsdc()
  const {
    deposit,
    data: depositHash,
    error: depositError,
    reset: resetDeposit,
  } = useDeposit()

  const { isSuccess: approveMined } = useWaitForTransactionReceipt({
    hash: approveHash,
  })
  const { isSuccess: depositMined } = useWaitForTransactionReceipt({
    hash: depositHash,
  })

  const amountRaw = amountInput
    ? BigInt(Math.floor(Number(amountInput) * 1_000_000))
    : 0n

  const selectedSlot = DASHBOARD_AGENT_SLOTS.find((s) => s.id === target)
  const goingToAgent = target !== "wallet" && Boolean(selectedSlot)
  const insufficientBalance =
    goingToAgent && amountRaw > 0n && (walletUsdc ?? 0n) < amountRaw

  // ── Drive the multi-stage flow off receipt mining ───────────────────────
  useEffect(() => {
    if (stage === "approving" && approveMined && selectedSlot) {
      refetchAllowance()
      setStage("depositing")
      deposit(selectedSlot.agentId, amountRaw)
    }
  }, [approveMined, stage, selectedSlot, amountRaw, deposit, refetchAllowance])

  useEffect(() => {
    if (stage === "depositing" && depositMined) {
      refetchBalance()
      setStage("done")
    }
  }, [depositMined, stage, refetchBalance])

  useEffect(() => {
    const e = approveError ?? depositError
    if (e) {
      setErr(e.message.split("\n")[0])
      setStage("error")
    }
  }, [approveError, depositError])

  function reset() {
    resetApprove()
    resetDeposit()
    setErr(null)
    setStage("idle")
  }

  function handleStart() {
    if (!address || !amountRaw || !selectedSlot) return
    if (insufficientBalance) return
    reset()

    const needsApproval = (allowance ?? 0n) < amountRaw
    if (needsApproval) {
      setStage("approving")
      approve(amountRaw)
    } else {
      setStage("depositing")
      deposit(selectedSlot.agentId, amountRaw)
    }
  }

  function handleClose(next: boolean) {
    if (!next && (stage === "approving" || stage === "depositing")) {
      // Don't allow closing mid-flight; user can still cancel via wallet UI.
      return
    }
    setOpen(next)
    if (!next) {
      onSettled?.()
      reset()
    }
  }

  const busy = stage === "approving" || stage === "depositing"

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" aria-hidden="true" />
            Top up portfolio
          </DialogTitle>
          <DialogDescription>
            Deposit native Celo USDC into an agent vault. You must already hold
            USDC in your wallet — bridge, swap, or onramp first.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Amount (USDC)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={busy}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((q) => (
                <Button
                  key={q}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setAmountInput(String(q))}
                  className="h-7 px-2 text-[11px] font-mono"
                >
                  +{q.toLocaleString()}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Wallet balance:{" "}
              <span className="font-mono text-foreground/80">
                ${formatUSDC(walletUsdc ?? 0n)}
              </span>
            </p>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Send to
            </label>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {DASHBOARD_AGENT_SLOTS.map((s) => (
                <TargetButton
                  key={s.id}
                  active={target === s.id}
                  onClick={() => setTarget(s.id)}
                  disabled={busy}
                  label={s.fallbackName}
                  hint={`Deposit into #${s.agentId.toString()}`}
                />
              ))}
            </div>
          </div>

          {stage !== "idle" ? (
            <div className="rounded-md border border-border/70 bg-secondary/30 p-3 text-sm">
              <StepRow
                label="Approve vault"
                state={
                  stage === "approving"
                    ? "active"
                    : approveHash
                      ? "done"
                      : (allowance ?? 0n) >= amountRaw
                        ? "skipped"
                        : "pending"
                }
              />
              <StepRow
                label={`Deposit into ${selectedSlot?.fallbackName ?? "agent"}`}
                state={
                  stage === "depositing"
                    ? "active"
                    : depositHash
                      ? "done"
                      : "pending"
                }
              />
              {stage === "done" ? (
                <p className="mt-2 text-xs text-primary">
                  Top-up complete. Balances will refresh shortly.
                </p>
              ) : null}
              {stage === "error" && err ? (
                <p className="mt-2 text-xs text-destructive">{err}</p>
              ) : null}
            </div>
          ) : null}

          {insufficientBalance ? (
            <p className="text-xs text-destructive">
              Insufficient USDC. Wallet holds ${formatUSDC(walletUsdc ?? 0n)}{" "}
              but {amountInput} USDC is required.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={busy}
          >
            {stage === "done" ? "Close" : "Cancel"}
          </Button>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={
              !isConnected ||
              !amountRaw ||
              !goingToAgent ||
              insufficientBalance ||
              busy ||
              stage === "done"
            }
            className="gap-1.5"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {stage === "approving" ? "Approving…" : "Depositing…"}
              </>
            ) : stage === "done" ? (
              <>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Done
              </>
            ) : (
              "Deposit USDC"
            )}
          </Button>
        </DialogFooter>

        {!isConnected ? (
          <p className="text-xs text-destructive">
            Connect a wallet on Celo mainnet first.
          </p>
        ) : null}
        {/* Vault address shown for transparency — same allowance target for any agent. */}
        <p className="text-[10px] text-muted-foreground font-mono break-all">
          Vault: {CONTRACT_ADDRESSES.DelegationVault}
        </p>
        <p className="text-[10px] text-muted-foreground font-mono break-all">
          USDC: {CONTRACT_ADDRESSES.USDC}
        </p>
      </DialogContent>
    </Dialog>
  )
}

function TargetButton({
  active,
  onClick,
  disabled,
  label,
  hint,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-md border px-2 py-2 text-left text-xs transition disabled:opacity-60 " +
        (active
          ? "border-primary/60 bg-primary/10 text-foreground"
          : "border-border bg-background hover:border-primary/30")
      }
    >
      <div className="font-medium leading-tight">{label}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div>
    </button>
  )
}

function StepRow({
  label,
  state,
}: {
  label: string
  state: "pending" | "active" | "done" | "skipped"
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {state === "active" ? (
        <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden="true" />
      ) : state === "done" ? (
        <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
      ) : (
        <span
          className={
            "size-1.5 rounded-full " +
            (state === "skipped" ? "bg-muted-foreground/40" : "bg-muted-foreground/60")
          }
          aria-hidden="true"
        />
      )}
      <span
        className={
          "text-xs " +
          (state === "skipped"
            ? "text-muted-foreground/70 line-through"
            : "text-foreground/90")
        }
      >
        {label}
        {state === "skipped" ? " (already approved)" : ""}
      </span>
    </div>
  )
}
