"use client"

import { useState } from "react"
import { ArrowDownUp, Settings2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SWAP_TOKENS } from "@/lib/config"
import { useSwapQuote } from "@/hooks/use-swap-quote"

export default function SwapPage() {
  const [from, setFrom] = useState("USDC")
  const [to, setTo] = useState("CELO")
  const [fromAmount, setFromAmount] = useState("100")

  const { data: quote } = useSwapQuote(from, to, fromAmount)
  const rate = quote?.rate ?? 0
  const slippage = quote?.slippagePct ?? 0

  return (
    <AppShell>
      <div className="mx-auto max-w-xl w-full px-4 md:px-8 py-6 md:py-12 flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Platform
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Swap</h1>
          </div>
          <Button variant="outline" size="icon" aria-label="Swap settings">
            <Settings2 className="size-4" />
          </Button>
        </header>

        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
          <TokenRow
            label="You pay"
            token={from}
            onTokenChange={setFrom}
            amount={fromAmount}
            onAmountChange={setFromAmount}
          />

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label="Flip tokens"
              onClick={() => {
                setFrom(to)
                setTo(from)
              }}
            >
              <ArrowDownUp className="size-4" />
            </Button>
          </div>

          <TokenRow
            label="You receive"
            token={to}
            onTokenChange={setTo}
            amount={rate > 0 ? ((Number(fromAmount) || 0) * rate).toFixed(4) : "—"}
            readOnly
          />

          <div className="rounded-lg bg-secondary/40 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {rate > 0 ? `1 ${from} ≈ ${rate.toFixed(2)} ${to}` : "Fetching rate…"}
            </span>
            <span>Slippage {slippage}%</span>
          </div>

          <Button size="lg" className="w-full">
            Review Swap
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Swaps route through the best Celo mainnet DEX available.
        </p>
      </div>
    </AppShell>
  )
}

function TokenRow({
  label,
  token,
  onTokenChange,
  amount,
  onAmountChange,
  readOnly,
}: {
  label: string
  token: string
  onTokenChange: (v: string) => void
  amount: string
  onAmountChange?: (v: string) => void
  readOnly?: boolean
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => onAmountChange?.(e.target.value)}
          readOnly={readOnly}
          className="h-12 text-2xl border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
          aria-label={`${label} amount`}
        />
        <Select value={token} onValueChange={onTokenChange}>
          <SelectTrigger className="w-32 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SWAP_TOKENS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
