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

// Die Watchdog Logik
const rageDictionary = [
  "slams", "destroys", "bombshell", "meltdown", "explosive", "shocking", 
  "horrific", "panic", "fraud", "smear", "rips", "brutal", "warning", 
  "crisis", "collapses", "erupts", "rage", "fury", "slam", "destroy"
];

function calculateRageScore(title: string) {
  let score = 0;
  const foundWords: string[] = [];
  const lowerTitle = title.toLowerCase();

  // 1. Wörter aus dem Rage-Dictionary
  rageDictionary.forEach(word => {
    if (lowerTitle.includes(word)) {
      score += 25;
      foundWords.push(word);
    }
  });

  // 2. Ausrufezeichen
  const exclamationCount = (title.match(/!/g) || []).length;
  score += exclamationCount * 15;

  // 3. GROSSSCHREIBUNG (Wörter mit >3 Buchstaben komplett groß)
  const capsWords = title.match(/\b[A-Z]{4,}\b/g);
  if (capsWords) {
    score += capsWords.length * 10;
  }

  return { score: Math.min(score, 100), words: foundWords };
}

export async function GET() {
  const parser = new Parser({
    timeout: 5000,
    headers: { "User-Agent": "Polarization-Index/1.0 (Archival Engine)" },
  });

  try {
    const feedPromises = feedUrls.map(async (feed) => {
      try {
        const parsed = await
