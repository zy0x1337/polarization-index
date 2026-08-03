import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 1800; // 30 Minuten Cache

const feedUrls = [
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", bias: "tech", name: "TechCrunch" },
  { url: "https://www.artificialintelligence-news.com/feed/", bias: "tech", name: "AI News" },
  { url: "https://feeds.arstechnica.com/arstechnica/technology-lab", bias: "tech", name: "Ars Technica" },
];

const hypeDictionary = [
  "agi", "breakthrough", "revolutionary", "existential", "doom", "doomsday", 
  "singularity", "replace humans", "dangerous", "miracle", "god-like", "threat", 
  "destroy", "scary", "mind-blowing", "chaos"
];

function calculateHypeScore(title: string, description: string) {
  let score = 0;
  const foundWords: string[] = [];
  const text = (title + " " + description).toLowerCase();

  hypeDictionary.forEach(word => {
    if (text.includes(word)) {
      score += 20;
      foundWords.push(word);
    }
  });

  const exclamationCount = (title.match(/!/g) || []).length;
  score += exclamationCount * 15;

  const capsWords = title.match(/\b[A-Z]{4,}\b/g);
  if (capsWords) score += capsWords.length * 10;

  return { score: Math.min(score, 100), words: foundWords };
}

export async function GET() {
  const parser = new Parser({
    timeout: 5000,
    headers: { "User-Agent": "AI-Timeline-2.0/1.0 (Archival Engine)" },
  });

  try {
    const feedPromises = feedUrls.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items.slice(0, 20).map((item) => {
          const title = item.title || "Untitled";
          const description = item.contentSnippet || "";
          const hypeData = calculateHypeScore(title, description);
          
          return {
            id: item.guid || item.link || Math.random().toString(),
            title: title,
            date: item.isoDate || new Date().toISOString(),
            description: description || "No description available.",
            link: item.link || "#",
            source: feed.name,
            category: "RSS", // Override für Logik
            hypeScore: hypeData.score,
            hypeWords: hypeData.words,
          };
        });
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const mergedItems = results.flat().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(mergedItems.slice(0, 40), {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RSS feeds" }, { status: 500 });
  }
}
