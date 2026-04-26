import { notFound } from "next/navigation"

import { AppShell } from "@/components/app-shell"
import { AgentCard } from "@/components/dashboard/agent-card"
import { YieldOpportunities } from "@/components/dashboard/yield-opportunities"
import { LiveEquityChart } from "@/components/live-equity-chart"
import { fetchDashboardAgents, fetchAgents } from "@/lib/api"

export default async function YieldAgentPage() {
  const [dashboardAgents, agents] = await Promise.all([
    fetchDashboardAgents(),
    fetchAgents(),
  ])
  const slot = dashboardAgents.find((a) => a.kind === "yield")
  if (!slot) notFound()
  const curve =
    agents.find((a) => a.agentId === slot.agentId)?.priceHistory ??
    agents[2]?.priceHistory ??
    agents[0]?.priceHistory ??
    []

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl w-full px-4 md:px-8 py-6 md:py-8 flex flex-col gap-5 md:gap-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Platform / Yield Agent
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Yield Agent
          </h1>
          <p className="text-sm text-muted-foreground">
            Auto-compounds stablecoin and blue-chip LP positions across Celo
            DEXs.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          <div className="lg:col-span-1">
            <AgentCard agent={slot} />
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              30-day Equity Curve
            </h2>
            <div className="mt-4">
              <LiveEquityChart agentId={slot.agentId} seed={curve} positive />
            </div>
          </div>
        </section>

        <YieldOpportunities />
      </div>
    </AppShell>
  )
}
