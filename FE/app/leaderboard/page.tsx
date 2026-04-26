import { AlertTriangle } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { LeaderboardContent } from "@/components/leaderboard/leaderboard-content"

export default function LeaderboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl w-full px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8">
        {/* Hero header */}
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Agent Leaderboard
            </h1>
            <p className="mt-3 text-base text-muted-foreground text-pretty">
              Discover, compare, and delegate to AI trading agents on Celo.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-primary/60 text-primary hover:bg-primary/10 hover:text-primary self-start md:self-auto"
          >
            Connect a wallet to delegate.
          </Button>
        </section>

        {/* Info banner */}
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
        >
          <AlertTriangle
            className="size-4 mt-0.5 text-warning shrink-0"
            aria-hidden="true"
          />
          <p className="text-foreground/90">
            Showing seed data. Set{" "}
            <code className="font-mono text-xs bg-background/60 px-1.5 py-0.5 rounded border border-border/70">
              NEXT_PUBLIC_API_URL
            </code>{" "}
            to point to the BE for live off-chain stats, and connect your wallet
            to see on-chain AUM from Celo mainnet.
          </p>
        </div>

        {/* Filters + table */}
        <LeaderboardContent />
      </div>
    </AppShell>
  )
}
