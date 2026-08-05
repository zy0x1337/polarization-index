import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { getEdition, editionMeta, type Edition } from "@/lib/editions";
import { clusterArticles } from "@/lib/clustering";

export const revalidate = 1800; // 30 minute cache

const rageDictionary = [
  "slams", "destroys", "bombshell", "meltdown", "explosive", "shocking",
  "horrific", "panic", "fraud", "smear", "rips", "brutal", "warning", "crisis",
  "collapses", "erupts", "rage", "fury", "slam", "destroy", "chaos", "outrage",
  "blasts", "disaster", "scandal", "threat", "storm", "backlash",
];

function calculateRageScore(title: string) {
  let score = 0;
  const foundWords: string[] = [];
  const lowerTitle = title.toLowerCase();

  rageDictionary.forEach((word) => {
    if (lowerTitle.includes(word)) {
      score += 25;
      foundWords.push(word);
    }
  });

  const exclamationCount = (title.match(/!/g) || []).length;
  score += exclamationCount * 15;

  const capsWords = title.match(/\b[A-Z]{4,}\b/g);
  if (capsWords) score += capsWords.length * 10;

  return { score: Math.min(score, 100), words: Array.from(new Set(foundWords)) };
}

async function fetchEdition(edition: Edition) {
  const parser = new Parser({
    timeout: 8000,
    headers: { "User-Agent": "Polarization-Index/1.0 (Aggregator)" },
  });

  const feedPromises = edition.sources.map(async (feed) => {
    try {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items.slice(0, 15).map((item) => {
        const title = item.title || "Untitled";
        const rageData = calculateRageScore(title);
        return {
          id: item.guid || item.link || Math.random().toString(),
          title,
          date: item.isoDate || new Date().toISOString(),
          description: item.contentSnippet || "",
          link: item.link || "#",
          source: feed.name,
          bucket: feed.bucket,
          stateControlled: !!feed.stateControlled,
          country: feed.country,
          rageScore: rageData.score,
          rageWords: rageData.words,
        };
      });
    } catch {
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  const flatItems = results.flat();

  // Relation-based clustering: the code decides which articles are about the
  // same event (TF-IDF + cosine + entities), not a single shared word. Runs
  // per-edition with that edition's language stop words.
  const stories = clusterArticles(flatItems, { stopWords: edition.stopWords });

  // Only keep stories that actually span at least two perspective buckets.
  return stories
    .filter((story) => new Set(story.articles.map((a) => a.bucket)).size >= 2)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 40);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const edition = getEdition(searchParams.get("edition"));

  try {
    const stories = await fetchEdition(edition);
    return NextResponse.json(
      { edition: editionMeta(edition), stories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { edition: editionMeta(edition), stories: [] },
      { status: 200 }
    );
  }
}
