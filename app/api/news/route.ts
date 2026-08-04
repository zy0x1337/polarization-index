import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { getEdition, editionMeta, type Edition } from "@/lib/editions";

export const revalidate = 1800; // 30 minute cache

const rageDictionary = [
  "slams", "destroys", "bombshell", "meltdown", "explosive", "shocking",
  "horrific", "panic", "fraud", "smear", "rips", "brutal", "warning", "crisis",
  "collapses", "erupts", "rage", "fury", "slam", "destroy", "chaos", "outrage",
  "blasts", "disaster", "scandal", "threat", "storm", "backlash",
];

function getKeywords(title: string, stopWords: string[]) {
  const words = title.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
  return words.filter((w) => w.length > 3 && !stopWords.includes(w));
}

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
          keywords: getKeywords(title, edition.stopWords),
        };
      });
    } catch {
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  const flatItems = results
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Loose clustering: same event if a keyword overlaps within a 48h window.
  const stories: any[] = [];
  flatItems.forEach((item) => {
    let matched = false;
    for (const story of stories) {
      const timeDiff = Math.abs(
        new Date(story.date).getTime() - new Date(item.date).getTime()
      );
      if (timeDiff > 48 * 3600 * 1000) continue;

      const overlap = item.keywords.filter((k: string) => story.keywords.includes(k));
      if (overlap.length >= 1) {
        if (!story.articles.some((a: any) => a.source === item.source)) {
          story.articles.push(item);
          story.keywords = Array.from(
            new Set([...story.keywords, ...item.keywords])
          ).slice(0, 6);
          story.date = item.date;
        }
        matched = true;
        break;
      }
    }
    if (!matched) {
      stories.push({
        id: Math.random().toString(36).substring(2, 9),
        keywords: item.keywords,
        date: item.date,
        articles: [item],
      });
    }
  });

  // Only keep stories that actually span at least two perspective buckets.
  return stories
    .filter((story) => {
      const buckets = new Set(story.articles.map((a: any) => a.bucket));
      return buckets.size >= 2;
    })
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
