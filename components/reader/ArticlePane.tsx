"use client";

import { relativeTime, type NewsEvent, type Story } from "@/lib/types";
import { useReader } from "./ReaderProvider";
import { BucketTag, Kicker, RageMeter, flag } from "./ui";

export default function ArticlePane({
  article,
  story,
}: {
  article: NewsEvent;
  story: Story;
}) {
  const { peek } = useReader();

  return (
    <article className="mx-auto w-full max-w-2xl px-5 pb-24 pt-6 md:px-8">
      <header className="border-b border-hairline pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BucketTag bucket={article.bucket} stateControlled={article.stateControlled} />
          <Kicker>{relativeTime(article.date)}</Kicker>
        </div>
        <h1 className="mt-4 font-serif text-3xl leading-[1.08] tracking-tight text-ink md:text-4xl">
          {article.title}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
            {flag(article.country)} {article.source}
          </span>
          <span className="h-3 w-px bg-border" />
          <RageMeter score={article.rageScore} />
        </div>
      </header>

      {article.stateControlled && (
        <div className="mt-5 rounded-xl border border-ink/15 bg-ink/[0.03] px-4 py-3">
          <p className="font-sans text-[12px] leading-relaxed text-muted">
            <span className="font-mono uppercase tracking-[0.12em] text-ink">
              State-controlled outlet.
            </span>{" "}
            This source is operated by or aligned with a national government.
            We include it so the state narrative is visible, not endorsed.
          </p>
        </div>
      )}

      <section className="py-6">
        {article.description ? (
          <p className="font-serif text-lg leading-relaxed text-ink/90">
            {article.description}
          </p>
        ) : (
          <p className="font-sans text-sm text-faint">
            This outlet published only a headline in its feed.
          </p>
        )}
      </section>

      {article.rageWords.length > 0 && (
        <section className="border-t border-hairline py-6">
          <Kicker>Charged language detected</Kicker>
          <div className="mt-3 flex flex-wrap gap-2">
            {article.rageWords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted"
              >
                {word}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hairline pt-6">
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center rounded-full bg-ink px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-canvas transition-opacity hover:opacity-90"
        >
          Read at {article.source}
        </a>
        <button
          type="button"
          onClick={() => peek({ kind: "story", story })}
          className="inline-flex h-10 items-center rounded-full border border-border px-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:border-ink hover:text-ink"
        >
          Compare all sides
        </button>
      </div>
    </article>
  );
}
