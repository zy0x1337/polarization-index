import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 1800; // 30 Minuten Cache

const feedUrls = [
  // Left-leaning
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", bias: "left", name: "NY Times" },
  { url: "https://www.theguardian.com/world/rss", bias: "left", name: "The Guardian" },
  // Center
  { url: "https://feeds.bbci.co.uk/news/rss.xml", bias: "center", name: "BBC" },
  { url: "https://www.aljazeera.com/xml/rss/all", bias: "center", name: "Al Jazeera" },
  // Right-leaning
  { url: "https://moxie.foxnews.com/google-publisher/latest.xml", bias: "right", name: "Fox News" },
  { url: "https://www.nypost.com/news/feed/", bias: "right", name: "NY Post" },
];

export async function GET() {
  const parser = new Parser({
    timeout: 5000,
    headers: { "User-Agent": "Polarization-Index/1.0 (Archival Engine)" },
  });

  try {
    const feedPromises = feedUrls.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items.map((item) => ({
          id: item.guid || item.link || Math.random().toString(),
          title: item.title || "Untitled",
          date: item.isoDate || new Date().toISOString(),
          description: item.contentSnippet || "No description available.",
          link: item.link || "#",
          source: feed.name,
          bias: feed.bias,
        }));
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const mergedItems = results.flat().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(mergedItems.slice(0, 120), {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RSS feeds" }, { status: 500 });
  }
}
