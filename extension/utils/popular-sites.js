// popular-sites.js — Popular websites database for autocomplete suggestions

const POPULAR_SITES = [
  // Work & Productivity
  "google.com", "gmail.com", "docs.google.com", "drive.google.com", "sheets.google.com",
  "slides.google.com", "calendar.google.com", "meet.google.com",
  "outlook.com", "office.com", "teams.microsoft.com", "onedrive.com",
  "notion.so", "slack.com", "trello.com", "asana.com", "monday.com",
  "clickup.com", "linear.app", "basecamp.com", "airtable.com",
  "figma.com", "canva.com", "miro.com", "excalidraw.com",
  "zoom.us", "loom.com", "krisp.ai",
  "dropbox.com", "box.com", "evernote.com",
  "grammarly.com", "hemingwayapp.com",

  // Development
  "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com",
  "codepen.io", "codesandbox.io", "replit.com", "jsfiddle.net",
  "vercel.com", "netlify.com", "heroku.com", "railway.app",
  "aws.amazon.com", "console.cloud.google.com", "azure.microsoft.com",
  "npmjs.com", "pypi.org", "crates.io",
  "developer.mozilla.org", "w3schools.com",
  "digitalocean.com", "cloudflare.com",

  // Education
  "udemy.com", "coursera.org", "khanacademy.org", "edx.org",
  "brilliant.org", "duolingo.com", "quizlet.com", "skillshare.com",
  "codecademy.com", "freecodecamp.org", "leetcode.com", "hackerrank.com",
  "kaggle.com", "datacamp.com", "pluralsight.com",
  "wikipedia.org", "arxiv.org", "scholar.google.com",
  "medium.com", "dev.to", "hashnode.com",

  // Social Media
  "facebook.com", "instagram.com", "twitter.com", "x.com",
  "tiktok.com", "snapchat.com", "linkedin.com", "pinterest.com",
  "reddit.com", "discord.com", "tumblr.com", "threads.net",
  "bsky.app", "mastodon.social",
  "whatsapp.com", "telegram.org", "signal.org",

  // Entertainment
  "youtube.com", "netflix.com", "twitch.tv", "spotify.com",
  "hulu.com", "disneyplus.com", "hbomax.com", "primevideo.com",
  "soundcloud.com", "apple.com", "music.apple.com",
  "crunchyroll.com", "vimeo.com", "dailymotion.com",
  "9gag.com", "imgur.com", "buzzfeed.com",

  // News
  "cnn.com", "bbc.com", "nytimes.com", "theguardian.com",
  "reuters.com", "washingtonpost.com", "bloomberg.com",
  "techcrunch.com", "theverge.com", "arstechnica.com", "wired.com",
  "news.ycombinator.com", "npr.org",

  // Shopping
  "amazon.com", "ebay.com", "walmart.com", "target.com",
  "etsy.com", "aliexpress.com", "bestbuy.com",
  "shein.com", "zappos.com", "wayfair.com",

  // Utilities & Search
  "bing.com", "duckduckgo.com", "yahoo.com",
  "translate.google.com", "maps.google.com", "weather.com",

  // Finance
  "paypal.com", "stripe.com", "wise.com",
  "robinhood.com", "coinbase.com",

  // AI
  "chat.openai.com", "claude.ai", "bard.google.com", "perplexity.ai",
  "huggingface.co", "midjourney.com",
];

/**
 * Normalize a domain input: strip protocol, www., paths, query, hash, port
 * "https://www.youtube.com/watch?v=xyz" → "youtube.com"
 * "docs.google.com/document/d/..." → "docs.google.com"
 * "x.com" → "x.com"
 */
function normalizeDomainInput(input) {
  if (!input) return "";
  let d = input.trim().toLowerCase();
  // Remove protocol
  d = d.replace(/^(https?:\/\/)/, "");
  // Remove www. prefix
  d = d.replace(/^www\./, "");
  // Remove port
  d = d.replace(/:\d+/, "");
  // Remove path, query, hash
  d = d.replace(/[\/\?\#].*$/, "");
  // Remove trailing dots
  d = d.replace(/\.+$/, "");
  return d;
}

/**
 * Get autocomplete suggestions for a query string
 * Returns recently used domains first, then popular matches
 */
function getAutocompleteSuggestions(query, recentDomains = []) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();

  // Score and filter
  const results = [];
  const seen = new Set();

  // Recent domains first
  for (const domain of recentDomains) {
    if (domain.includes(q) && !seen.has(domain)) {
      results.push({ domain, recent: true });
      seen.add(domain);
    }
  }

  // Popular sites
  for (const domain of POPULAR_SITES) {
    if (domain.includes(q) && !seen.has(domain)) {
      results.push({ domain, recent: false });
      seen.add(domain);
    }
  }

  return results.slice(0, 8);
}

if (typeof globalThis !== "undefined") {
  globalThis.POPULAR_SITES = POPULAR_SITES;
  globalThis.normalizeDomainInput = normalizeDomainInput;
  globalThis.getAutocompleteSuggestions = getAutocompleteSuggestions;
}
