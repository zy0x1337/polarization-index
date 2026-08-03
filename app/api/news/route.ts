import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const revalidate = 1800; // 30 Minuten Cache

const feedUrls = [
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", bias: "left", name: "NY Times" },
  { url: "https://www.theguardian.com/world/rss", bias: "left", name: "The Guardian" },
  { url: "https://feeds.bbci.co.uk/news/rss.xml", bias: "center", name: "BBC" },
  { url: "https://www.aljazeera.com/xml/rss/all", bias: "center", name: "Al Jazeera" },
  { url: "https://moxie.foxnews.com/google-publisher/latest.xml", bias: "right", name: "Fox News" },
  { url: "https://www.nypost.com/news/feed/", bias: "right", name: "NY Post" },
];

const rageDictionary = ["slams", "destroys", "bombshell", "meltdown", "explosive", "shocking", "horrific", "panic", "fraud", "smear", "rips", "brutal", "warning", "crisis", "collapses", "erupts", "rage", "fury", "slam", "destroy"];

// Erweiterte Stop-Liste
const stopWords = ["the", "and", "for", "with", "that", "this", "from", "have", "will", "not", "but", "was", "are", "they", "you", "all", "can", "her", "has", "his", "out", "into", "over", "says", "news", "report", "amid", "as", "at", "by", "in", "of", "on", "to", "up", "a", "an", "is", "it", "be", "or", "after", "amid", "over", "amidst", "among", "how", "what", "when", "where", "why", "who"];

function getKeywords(title: string) {
  // Nimme nur Wörter > 3 Zeichen, keine Stopwörter
  const words = title.toLowerCase().replace(/[^a-z\s]/g, "").split(" ");
  return words.filter(w => w.length > 3 && !stopWords.includes(w));
}

function calculateRageScore(title: string) {
  let score = 0;
  const foundWords: string[] = [];
  const lowerTitle = title.toLowerCase();

  rageDictionary.forEach(word => {
    if (lowerTitle.includes(word)) {
      score += 25;
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
    timeout: 8000,
    headers: { "User-Agent": "Polarization-Index/1.0 (Archival Engine)" },
  });

  try {
    const feedPromises = feedUrls.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items.slice(0, 15).map((item) => { // Nehme die letzten 15 Artikel pro Feed
          const title = item.title || "Untitled";
          const rageData = calculateRageScore(title);
          return {
            id: item.guid || item.link || Math.random().toString(),
            title: title,
            date: item.isoDate || new Date().toISOString(),
            description: item.contentSnippet || "No description available.",
            link: item.link || "#",
            source: feed.name,
            bias: feed.bias,
            rageScore: rageData.score,
            rageWords: rageData.words,
            keywords: getKeywords(title),
          };
        });
      } catch (err) {
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    const flatItems = results.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // NEUE, LOCKERE CLUSTERING LOGIK
    const stories: any[] = [];

    flatItems.forEach((item) => {
      let matched = false;

      for (let story of stories) {
        // Zeitfenster erhöht auf 48 Stunden
        const timeDiff = Math.abs(new Date(story.date).getTime() - new Date(item.date).getTime());
        if (timeDiff > 48 * 3600 * 1000) continue;

        // NUR NOCH 1 GEMEINSAMES KEYWORD NÖTIG
        const overlap = item.keywords.filter((k: string) => story.keywords.includes(k));
        if (overlap.length >= 1) {
          if (!story.articles.some((a: any) => a.source === item.source)) {
            story.articles.push(item);
            story.keywords = Array.from(new Set([...story.keywords, ...item.keywords])).slice(0, 6);
            story.date = item.date; 
          }
          matched = true;
          break;
        }
      }

      if (!matched) {
        stories.push({
          id: Math.random().toString(36).substring(7),
          keywords: item.keywords,
          date: item.date,
          articles: [item],
        });
      }
    });

    // FILTER: Nur Stories mit mindestens 2 verschiedenen Bias-Richtungen
    const comparableStories = stories
      .filter(story => {
        const biases = new Set(story.articles.map((a: any) => a.bias));
        return biases.size >= 2;
      })
      .slice(0, 40);

    return NextResponse.json(comparableStories, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch RSS feeds" }, { status: 500 });
  }
}
