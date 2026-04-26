"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDownToLine, CheckCircle2, Loader2 } from "lucide-react"
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
import {
  usePendingReward,
  usePosition,
  useWithdraw,
} from "@/hooks/use-vault"
import type { DashboardAgentSlot } from "@/types"

/**
 * Withdraw flow rooted at the portfolio header. Lists every dashboard slot
 * with the user's principal & pending rewards, lets them pick one, choose an
 * amount (or "Max"), and calls DelegationVault.withdraw — which auto-claims
 * any pending rewards in the same tx.
 */
export function WithdrawDialog({
  trigger,
  onSettled,
}: {
  trigger: React.ReactNode
  onSettled?: () => void
}) {
  const { isConnected } = useAccount()
  const [open, setOpen] = useState(false)

  // Pull positions for both slots up front so the picker can show numbers.
  const slot0 = DASHBOARD_AGENT_SLOTS[0]
  const slot1 = DASHBOARD_AGENT_SLOTS[1]
  const pos0 = usePosition(slot0?.agentId)
  const pos1 = usePosition(slot1?.agentId)
  const pend0 = usePendingReward(slot0?.agentId)
  const pend1 = usePendingReward(slot1?.agentId)

  const slotData = useMemo(
    () =>
      [
        { slot: slot0, principal: pos0.data?.principal ?? 0n, pending: pend0.data ?? 0n },
        { slot: slot1, principal: pos1.data?.principal ?? 0n, pending: pend1.data ?? 0n },
      ].filter(
        (entry): entry is { slot: DashboardAgentSlot; principal: bigint; pending: bigint } =>
          Boolean(entry.slot),
      ),
    [slot0, slot1, pos0.data, pos1.data, pend0.data, pend1.data],
  )

  const totalPrincipal = slotData.reduce((acc, s) => acc + s.principal, 0n)
  const totalPending = slotData.reduce((acc, s) => acc + s.pending, 0n)

  // Default selection: first slot with principal > 0, else first slot.
  const defaultSelected =
    slotData.find((s) => s.principal > 0n)?.slot.id ?? slotData[0]?.slot.id ?? ""
  const [selected, setSelected] = useState<string>(defaultSelected)

  useEffect(() => {
    // When the dialog opens or balances refresh, prefer a slot with funds.
    setSelected(defaultSelected)
  }, [defaultSelected, open])

  const selectedEntry = slotData.find((s) => s.slot.id === selected)
  const selectedPrincipal = selectedEntry?.principal ?? 0n
  const selectedPending = selectedEntry?.pending ?? 0n

  const [amountInput, setAmountInput] = useState("")
  const amountRaw = amountInput
    ? BigInt(Math.floor(Number(amountInput) * 1_000_000))
    : 0n

  const overMax = amountRaw > selectedPrincipal
  const tooSmall = amountRaw === 0n

  const {
    withdraw,
    data: withdrawHash,
    error: withdrawError,
    reset: resetWithdraw,
  } = useWithdraw()
  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash: withdrawHash })

  const stage: "idle" | "submitting" | "confirming" | "done" | "error" =
    withdrawError
      ? "error"
      : confirmed
        ? "done"
        : confirming
          ? "confirming"
          : withdrawHash
            ? "confirming"
            : "idle"

  useEffect(() => {
    if (stage === "done") {
      pos0.refetch()
      pos1.refetch()
      pend0.refetch()
      pend1.refetch()
    }
  }, [stage, pos0, pos1, pend0, pend1])

  function reset() {
    resetWithdraw()
    setAmountInput("")
  }

  function handleSubmit() {
    if (!selectedEntry || overMax || tooSmall) return
    withdraw(selectedEntry.slot.agentId, amountRaw)
  }

  function handleClose(next: boolean) {
    if (!next && stage === "confirming") return // wait for the receipt
    setOpen(next)
    if (!next) {
      onSettled?.()
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="size-5 text-primary" aria-hidden="true" />
            Withdraw to wallet
          </DialogTitle>
          <DialogDescription>
            Withdraw principal from an agent pool. Pending rewards are
            auto-claimed in the same transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Total principal" value={`$${formatUSDC(totalPrincipal)}`} />
            <Stat
              label="Total pending"
              value={`$${formatUSDC(totalPending)}`}
              accent={totalPending > 0n}
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              From
            </label>
            <div className="mt-1 grid grid-cols-1 gap-1.5">
              {slotData.map((entry) => {
                const active = selected === entry.slot.id
                const empty = entry.principal === 0n
                return (
                  <button
                    key={entry.slot.id}
                    type="button"
                    onClick={() => setSelected(entry.slot.id)}
                    disabled={empty || stage === "confirming"}
                    className={
                      "flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition disabled:opacity-50 " +
                      (active
                        ? "border-primary/60 bg-primary/10"
                        : "border-border bg-background hover:border-primary/30")
                    }
                  >
                    <div>
                      <div className="font-medium leading-tight">
                        {entry.slot.fallbackName}{" "}
                        <span className="text-xs text-muted-foreground">
                          #{entry.slot.agentId.toString()}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        Principal{" "}
                        <span className="font-mono text-foreground/80">
                          ${formatUSDC(entry.principal)}
                        </span>
                        {entry.pending > 0n ? (
                          <>
                            {" · "}
                            <span className="text-primary">
                              +${formatUSDC(entry.pending)} rewards
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                Amount (USDC)
              </label>
              <button
                type="button"
                disabled={selectedPrincipal === 0n || stage === "confirming"}
                onClick={() =>
                  setAmountInput(
                    (Number(selectedPrincipal) / 1_000_000).toString(),
                  )
                }
                className="text-[11px] font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                Max ${formatUSDC(selectedPrincipal)}
              </button>
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={stage === "confirming"}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
            />
            {selectedPending > 0n ? (
              <p className="mt-1 text-[11px] text-primary">
                Plus ${formatUSDC(selectedPending)} pending rewards will be
                claimed in this tx.
              </p>
            ) : null}
            {overMax ? (
              <p className="mt-1 text-[11px] text-destructive">
                Exceeds your principal in this pool.
              </p>
            ) : null}
          </div>

          {stage === "error" && withdrawError ? (
            <p className="text-xs text-destructive">
              {withdrawError.message.split("\n")[0]}
            </p>
          ) : null}
          {stage === "done" ? (
            <p className="text-xs text-primary">
              Withdraw confirmed — funds returned to your wallet.
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleClose(false)}
            disabled={stage === "confirming"}
          >
            {stage === "done" ? "Close" : "Cancel"}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={
              !isConnected ||
              !selectedEntry ||
              tooSmall ||
              overMax ||
              stage === "confirming" ||
              stage === "done"
            }
            className="gap-1.5"
          >
            {stage === "confirming" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Confirming…
              </>
            ) : stage === "done" ? (
              <>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Done
              </>
            ) : (
              "Withdraw"
            )}
          </Button>
        </DialogFooter>

        {!isConnected ? (
          <p className="text-xs text-destructive">
            Connect a wallet on Celo mainnet first.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-md border border-border/70 bg-secondary/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1 text-base font-semibold font-mono " +
          (accent ? "text-primary" : "")
        }
      >
        {value}
      </div>
    </div>
  )
}
