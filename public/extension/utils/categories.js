// categories.js — Domain categorization engine

const CategoryPatterns = {
  "Social Media": [
    "facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com",
    "snapchat.com", "linkedin.com", "pinterest.com", "tumblr.com", "reddit.com",
    "discord.com", "mastodon.social", "threads.net", "bsky.app",
  ],
  Education: [
    "udemy.com", "coursera.org", "khanacademy.org", "edx.org", "brilliant.org",
    "duolingo.com", "quizlet.com", "chegg.com", "studocu.com", "skillshare.com",
    "codecademy.com", "freecodecamp.org", "leetcode.com", "hackerrank.com",
    "scholar.google.com", "wikipedia.org", "arxiv.org", "researchgate.net",
    "academia.edu", "mit.edu", "stanford.edu", "coursehero.com",
  ],
  Entertainment: [
    "youtube.com", "netflix.com", "twitch.tv", "hulu.com", "disneyplus.com",
    "hbomax.com", "primevideo.com", "spotify.com", "soundcloud.com",
    "crunchyroll.com", "funimation.com", "9gag.com", "imgur.com",
    "buzzfeed.com", "boredpanda.com", "dailymotion.com", "vimeo.com",
  ],
  Work: [
    "docs.google.com", "drive.google.com", "sheets.google.com", "slides.google.com",
    "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com",
    "notion.so", "trello.com", "asana.com", "jira.atlassian.com",
    "slack.com", "teams.microsoft.com", "zoom.us", "figma.com",
    "vercel.com", "netlify.com", "heroku.com", "aws.amazon.com",
    "console.cloud.google.com", "azure.microsoft.com",
    "mail.google.com", "outlook.com", "calendar.google.com",
    "dropbox.com", "airtable.com", "miro.com", "canva.com",
  ],
  News: [
    "cnn.com", "bbc.com", "nytimes.com", "theguardian.com", "reuters.com",
    "apnews.com", "washingtonpost.com", "wsj.com", "bloomberg.com",
    "techcrunch.com", "theverge.com", "arstechnica.com", "wired.com",
    "hackernews.com", "news.ycombinator.com",
  ],
  Shopping: [
    "amazon.com", "ebay.com", "walmart.com", "target.com", "etsy.com",
    "aliexpress.com", "shopify.com", "bestbuy.com", "newegg.com",
    "wish.com", "shein.com", "zappos.com", "wayfair.com",
  ],
};

const Categories = {
  categorize(domain, overrides = {}) {
    if (!domain) return "Other";

    // Check user overrides first
    if (overrides[domain]) return overrides[domain];

    // Clean domain
    const clean = domain.replace(/^www\./, "").toLowerCase();

    // Check overrides with cleaned domain
    if (overrides[clean]) return overrides[clean];

    // Pattern matching
    for (const [category, patterns] of Object.entries(CategoryPatterns)) {
      for (const pattern of patterns) {
        if (clean === pattern || clean.endsWith("." + pattern)) {
          return category;
        }
      }
    }

    // Keyword-based fallback
    if (/edu|learn|course|study|school|university|college|tutor/i.test(clean)) return "Education";
    if (/news|journal|times|post|tribune|herald/i.test(clean)) return "News";
    if (/shop|store|buy|deal|market|mall/i.test(clean)) return "Shopping";
    if (/game|play|stream|watch|video|movie|music|listen/i.test(clean)) return "Entertainment";
    if (/social|chat|meet|friend|connect|community/i.test(clean)) return "Social Media";
    if (/work|project|task|manage|team|office|doc|code|dev/i.test(clean)) return "Work";

    return "Other";
  },

  isProductive(category) {
    return ["Work", "Education"].includes(category);
  },

  isDistraction(category) {
    return ["Social Media", "Entertainment", "Shopping"].includes(category);
  },

  getCategoryColor(category) {
    const colors = {
      Work: "#3b82f6",
      Education: "#8b5cf6",
      Entertainment: "#f59e0b",
      "Social Media": "#ef4444",
      News: "#6366f1",
      Shopping: "#ec4899",
      Other: "#6b7280",
    };
    return colors[category] || colors.Other;
  },

  getAllCategories() {
    return ["Work", "Education", "Entertainment", "Social Media", "News", "Shopping", "Other"];
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.Categories = Categories;
}
