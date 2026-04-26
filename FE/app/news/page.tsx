import { AppShell } from "@/components/app-shell"
import { NewsCard } from "@/components/news/news-card"
import { fetchNewsArticles } from "@/lib/api"

export const metadata = {
  title: "News — TAG",
  description:
    "The latest on Celo, on-chain AI trading agents, FX markets, and DeFi yield.",
}

export default async function NewsPage() {
  const articles = await fetchNewsArticles()
  const sorted = [...articles].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  )
  const [featured, ...rest] = sorted

  return (
    <AppShell>
    <div className="mx-auto max-w-7xl w-full px-4 md:px-8 py-10 md:py-14 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-balance text-4xl md:text-5xl font-bold tracking-tight">
          News & Signals
        </h1>
        <p className="max-w-2xl text-pretty text-base md:text-lg leading-relaxed text-muted-foreground">
          Research and market commentary powering the agents on your dashboard —
          Celo protocol updates, FX macro, and DeFi yield opportunities.
        </p>
      </header>

      {featured ? (
        <section aria-label="Featured article">
          <NewsCard article={featured} featured />
        </section>
      ) : null}

      <section
        aria-label="Latest articles"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {rest.map((article) => (
          <NewsCard key={article.slug} article={article} />
        ))}
      </section>
    </div>
    </AppShell>
  )
}
