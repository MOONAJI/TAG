import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, User2 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { NewsCard } from "@/components/news/news-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatArticleDate } from "@/lib/format"
import { fetchNewsArticles, fetchNewsArticle, fetchRelatedNews } from "@/lib/api"

interface NewsArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const articles = await fetchNewsArticles()
  return articles.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: NewsArticlePageProps) {
  const { slug } = await params
  const article = await fetchNewsArticle(slug)
  if (!article) return { title: "Article not found — TAG" }
  return {
    title: `${article.title} — TAG`,
    description: article.summary,
  }
}

export default async function NewsArticlePage({
  params,
}: NewsArticlePageProps) {
  const { slug } = await params
  const article = await fetchNewsArticle(slug)
  if (!article) notFound()

  const related = await fetchRelatedNews(article.slug, article.category)

  return (
    <AppShell>
    <div className="mx-auto max-w-3xl w-full px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8">
      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to News
      </Link>

      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <Badge
            variant="outline"
            className="w-fit border-primary/40 bg-primary/10 text-primary"
          >
            {article.category}
          </Badge>

          <h1 className="text-balance text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-pretty text-lg leading-relaxed text-muted-foreground">
            {article.summary}
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User2 className="size-4" aria-hidden="true" />
              {article.author}
            </span>
            <span>{formatArticleDate(article.publishedAt)}</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden="true" />
              {article.readMinutes} min read
            </span>
            <span className="text-muted-foreground/70">
              Source: {article.source}
            </span>
          </div>
        </header>

        <Separator />

        <div className="flex flex-col gap-5">
          {article.body.map((paragraph, idx) => (
            <p
              key={idx}
              className="text-pretty text-base md:text-[17px] leading-relaxed text-foreground/90"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {article.tags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Tags
            </span>
            {article.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-secondary/70 text-foreground/80"
              >
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </article>

      {related.length > 0 ? (
        <section aria-label="Related articles" className="flex flex-col gap-4 pt-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Related in {article.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {related.map((item) => (
              <NewsCard key={item.slug} article={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
    </AppShell>
  )
}
