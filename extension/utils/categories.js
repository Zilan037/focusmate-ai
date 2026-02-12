// categories.js — Domain categorization engine V3

const CategoryPatterns = {
  "Social Media": [
    "facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com",
    "snapchat.com", "linkedin.com", "pinterest.com", "tumblr.com", "reddit.com",
    "discord.com", "mastodon.social", "threads.net", "bsky.app",
    "whatsapp.com", "telegram.org", "signal.org", "wechat.com",
  ],
  Education: [
    "udemy.com", "coursera.org", "khanacademy.org", "edx.org", "brilliant.org",
    "duolingo.com", "quizlet.com", "chegg.com", "studocu.com", "skillshare.com",
    "codecademy.com", "freecodecamp.org", "leetcode.com", "hackerrank.com",
    "scholar.google.com", "wikipedia.org", "arxiv.org", "researchgate.net",
    "academia.edu", "mit.edu", "stanford.edu", "coursehero.com",
    "pluralsight.com", "lynda.com", "treehouse.com", "datacamp.com",
    "exercism.io", "codewars.com", "kaggle.com", "topcoder.com",
  ],
  Entertainment: [
    "youtube.com", "netflix.com", "twitch.tv", "hulu.com", "disneyplus.com",
    "hbomax.com", "primevideo.com", "spotify.com", "soundcloud.com",
    "crunchyroll.com", "funimation.com", "9gag.com", "imgur.com",
    "buzzfeed.com", "boredpanda.com", "dailymotion.com", "vimeo.com",
    "tubi.tv", "peacocktv.com", "deezer.com", "pandora.com",
    "apple.com/tv", "music.apple.com",
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
    "linear.app", "clickup.com", "monday.com", "basecamp.com",
    "confluence.atlassian.com", "loom.com", "krisp.ai",
    "grammarly.com", "hemingwayapp.com", "excalidraw.com",
  ],
  News: [
    "cnn.com", "bbc.com", "nytimes.com", "theguardian.com", "reuters.com",
    "apnews.com", "washingtonpost.com", "wsj.com", "bloomberg.com",
    "techcrunch.com", "theverge.com", "arstechnica.com", "wired.com",
    "hackernews.com", "news.ycombinator.com",
    "npr.org", "aljazeera.com", "ft.com", "economist.com",
  ],
  Shopping: [
    "amazon.com", "ebay.com", "walmart.com", "target.com", "etsy.com",
    "aliexpress.com", "shopify.com", "bestbuy.com", "newegg.com",
    "wish.com", "shein.com", "zappos.com", "wayfair.com",
    "costco.com", "ikea.com", "homedepot.com", "lowes.com",
  ],
  Adult: [
    "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
    "youporn.com", "tube8.com", "spankbang.com", "eporner.com", "beeg.com",
    "brazzers.com", "chaturbate.com", "livejasmin.com", "stripchat.com",
    "bongacams.com", "cam4.com", "myfreecams.com", "onlyfans.com",
    "fansly.com", "manyvids.com", "clips4sale.com",
    "porntrex.com", "hqporner.com", "daftsex.com", "4tube.com",
    "tnaflix.com", "drtuber.com", "txxx.com", "hclips.com",
    "pornone.com", "fuq.com", "youjizz.com", "motherless.com",
    "rule34.xxx", "e-hentai.org", "nhentai.net", "hanime.tv",
    "8muses.com", "literotica.com", "nifty.org",
  ],
  Gambling: [
    "bet365.com", "draftkings.com", "fanduel.com", "betmgm.com",
    "caesars.com", "pointsbet.com", "bovada.lv", "betonline.ag",
    "pokerstars.com", "888poker.com", "partypoker.com", "wsop.com",
    "betway.com", "williamhill.com", "ladbrokes.com", "paddypower.com",
    "bwin.com", "unibet.com", "betfair.com", "pinnacle.com",
    "1xbet.com", "22bet.com", "stake.com", "roobet.com",
    "casumo.com", "leovegas.com", "betsson.com", "mrgreen.com",
    "jackpotcity.com", "spinpalace.com", "royalvegas.com",
    "slotomania.com", "doubledown.com", "bitstarz.com",
    "fortunejack.com", "cloudbet.com", "sportsbet.io",
    "mybookie.ag", "sportsbetting.ag", "betrivers.com",
  ],
  Neutral: [
    "google.com", "bing.com", "duckduckgo.com", "yahoo.com",
    "weather.com", "maps.google.com", "translate.google.com",
    "stackoverflow.com",
  ],
};

// Default distraction domain lists for quick-add
const DistractionDefaults = {
  "Social Media": [
    "facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com",
    "snapchat.com", "reddit.com", "discord.com", "threads.net", "pinterest.com",
    "tumblr.com", "bsky.app",
  ],
  Entertainment: [
    "youtube.com", "netflix.com", "twitch.tv", "hulu.com", "disneyplus.com",
    "spotify.com", "9gag.com", "imgur.com", "buzzfeed.com", "dailymotion.com",
    "tubi.tv", "soundcloud.com",
  ],
  Shopping: [
    "amazon.com", "ebay.com", "walmart.com", "etsy.com", "aliexpress.com",
    "shein.com", "wish.com", "wayfair.com",
  ],
  Adult: [
    "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
    "onlyfans.com", "chaturbate.com", "stripchat.com", "livejasmin.com",
    "fansly.com", "spankbang.com", "youporn.com",
  ],
  Gambling: [
    "bet365.com", "draftkings.com", "fanduel.com", "betmgm.com",
    "pokerstars.com", "stake.com", "roobet.com", "bovada.lv",
    "1xbet.com", "22bet.com", "betway.com", "casumo.com",
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
    if (/porn|xxx|nsfw|hentai|adult|sex|nude|naked|erotic|fetish|cam(girl|boy|show)|livecam|18\+/i.test(clean)) return "Adult";
    if (/bet|casino|gambl|poker|slots?|jackpot|wager|bookie|sportsbook|lottery|lotto|roulette|blackjack/i.test(clean)) return "Gambling";
    if (/edu|learn|course|study|school|university|college|tutor|academy/i.test(clean)) return "Education";
    if (/news|journal|times|post|tribune|herald|gazette/i.test(clean)) return "News";
    if (/shop|store|buy|deal|market|mall|cart|checkout/i.test(clean)) return "Shopping";
    if (/game|play|stream|watch|video|movie|music|listen|anime/i.test(clean)) return "Entertainment";
    if (/social|chat|meet|friend|connect|community|forum/i.test(clean)) return "Social Media";
    if (/work|project|task|manage|team|office|doc|code|dev|api|deploy/i.test(clean)) return "Work";
    if (/scam|phish|spam|malware|trojan|virus|hack/i.test(clean)) return "Adult"; // Treat scam sites as blocked too

    return "Other";
  },

  isProductive(category) {
    return ["Work", "Education"].includes(category);
  },

  isDistraction(category) {
    return ["Social Media", "Entertainment", "Shopping"].includes(category);
  },

  isDangerous(category) {
    return ["Adult", "Gambling"].includes(category);
  },

  isNeutral(category) {
    return ["Neutral", "News", "Other"].includes(category);
  },

  getCategoryColor(category) {
    const colors = {
      Work: "#3b82f6",
      Education: "#8b5cf6",
      Entertainment: "#f59e0b",
      "Social Media": "#ef4444",
      News: "#6366f1",
      Shopping: "#ec4899",
      Adult: "#dc2626",
      Gambling: "#b91c1c",
      Neutral: "#94a3b8",
      Other: "#6b7280",
    };
    return colors[category] || colors.Other;
  },

  getCategoryIcon(category) {
    const icons = {
      Work: "💼",
      Education: "📚",
      Entertainment: "🎬",
      "Social Media": "💬",
      News: "📰",
      Shopping: "🛒",
      Adult: "🔞",
      Gambling: "🎰",
      Neutral: "🔘",
      Other: "🌐",
    };
    return icons[category] || icons.Other;
  },

  getAllCategories() {
    return ["Work", "Education", "Entertainment", "Social Media", "News", "Shopping", "Adult", "Gambling", "Neutral", "Other"];
  },

  getDistractionDefaults() {
    return DistractionDefaults;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.Categories = Categories;
  globalThis.DistractionDefaults = DistractionDefaults;
}
