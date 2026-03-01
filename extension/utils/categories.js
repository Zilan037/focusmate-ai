// categories.js — Domain categorization engine V4 (improved accuracy)

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
    "w3schools.com", "geeksforgeeks.org", "tutorialspoint.com",
    "developer.mozilla.org", "learn.microsoft.com", "cloud.google.com/training",
  ],
  Development: [
    "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com",
    "stackexchange.com", "dev.to", "medium.com", "hashnode.dev",
    "vercel.com", "netlify.com", "heroku.com", "railway.app",
    "supabase.com", "firebase.google.com", "aws.amazon.com",
    "console.cloud.google.com", "azure.microsoft.com",
    "npmjs.com", "pypi.org", "crates.io", "pkg.go.dev",
    "codepen.io", "codesandbox.io", "replit.com", "glitch.com",
    "docker.com", "hub.docker.com", "kubernetes.io",
    "digitalocean.com", "linode.com", "vultr.com",
    "postman.com", "swagger.io", "insomnia.rest",
  ],
  Productivity: [
    "docs.google.com", "drive.google.com", "sheets.google.com", "slides.google.com",
    "notion.so", "trello.com", "asana.com", "jira.atlassian.com",
    "slack.com", "teams.microsoft.com", "zoom.us", "figma.com",
    "mail.google.com", "outlook.com", "calendar.google.com",
    "dropbox.com", "airtable.com", "miro.com", "canva.com",
    "linear.app", "clickup.com", "monday.com", "basecamp.com",
    "confluence.atlassian.com", "loom.com", "krisp.ai",
    "grammarly.com", "hemingwayapp.com", "excalidraw.com",
    "office.com", "onedrive.live.com", "evernote.com",
    "todoist.com", "ticktick.com", "any.do", "things.app",
    "1password.com", "lastpass.com", "bitwarden.com",
  ],
  Research: [
    "scholar.google.com", "pubmed.ncbi.nlm.nih.gov", "jstor.org",
    "sciencedirect.com", "springer.com", "nature.com", "ieee.org",
    "acm.org", "wolframalpha.com", "mathway.com",
    "translate.google.com", "deepl.com",
    "perplexity.ai", "you.com", "phind.com",
  ],
  Entertainment: [
    "youtube.com", "netflix.com", "twitch.tv", "hulu.com", "disneyplus.com",
    "hbomax.com", "primevideo.com", "spotify.com", "soundcloud.com",
    "crunchyroll.com", "funimation.com", "9gag.com", "imgur.com",
    "buzzfeed.com", "boredpanda.com", "dailymotion.com", "vimeo.com",
    "tubi.tv", "peacocktv.com", "deezer.com", "pandora.com",
    "apple.com/tv", "music.apple.com",
  ],
  Shopping: [
    "amazon.com", "ebay.com", "walmart.com", "target.com", "etsy.com",
    "aliexpress.com", "shopify.com", "bestbuy.com", "newegg.com",
    "wish.com", "shein.com", "zappos.com", "wayfair.com",
    "costco.com", "ikea.com", "homedepot.com", "lowes.com",
  ],
  News: [
    "cnn.com", "bbc.com", "nytimes.com", "theguardian.com", "reuters.com",
    "apnews.com", "washingtonpost.com", "wsj.com", "bloomberg.com",
    "techcrunch.com", "theverge.com", "arstechnica.com", "wired.com",
    "hackernews.com", "news.ycombinator.com",
    "npr.org", "aljazeera.com", "ft.com", "economist.com",
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
    "weather.com", "maps.google.com",
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

    // Keyword-based fallback (precise — avoid false positives on legitimate domains)
    if (/^porn|\.porn|pornhub|xvideo|xnxx|xhamster|xxx|nsfw|hentai|erotic|fetish|camgirl|camboy|camshow|livecam|chaturbate|stripchat|onlyfans|fansly|redtube|youporn|spankbang|rule34|nhentai|literotica/i.test(clean)) return "Adult";
    if (/^bet365|^betway|^betmgm|^betonline|casino|gambl|pokerstars|draftkings|fanduel|jackpot|sportsbook|roobet|bovada|1xbet|22bet|slotomania/i.test(clean)) return "Gambling";
    if (/\.edu$|learn|course|study|school|university|college|tutor|academy/i.test(clean)) return "Education";
    if (/github|gitlab|bitbucket|codepen|codesandbox|replit|npm|pypi|docker|deploy|api\.|dev\./i.test(clean)) return "Development";
    if (/docs\.|notion|trello|asana|slack|zoom|figma|miro|canva|calendar|office|drive\./i.test(clean)) return "Productivity";
    if (/scholar|research|arxiv|pubmed|jstor|ieee|acm\./i.test(clean)) return "Research";
    if (/^news\.|^journal|nytimes|washingtonpost|theguardian|reuters|apnews|bloomberg/i.test(clean)) return "News";
    if (/^shop\.|^store\.|^buy\.|^deal\.|etsy|shopify|ebay|amazon|walmart/i.test(clean)) return "Shopping";
    if (/netflix|twitch\.tv|hulu|disneyplus|spotify|soundcloud|crunchyroll|9gag|imgur|dailymotion|vimeo/i.test(clean)) return "Entertainment";
    if (/^social\.|^chat\.|^meet\.|^forum\./i.test(clean)) return "Social Media";

    return "Other";
  },

  isProductive(category) {
    return ["Development", "Productivity", "Education", "Research"].includes(category);
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
      Development: "#3b82f6",
      Productivity: "#0ea5e9",
      Education: "#8b5cf6",
      Research: "#a855f7",
      Entertainment: "#f59e0b",
      "Social Media": "#ef4444",
      News: "#6366f1",
      Shopping: "#ec4899",
      Adult: "#dc2626",
      Gambling: "#b91c1c",
      Neutral: "#94a3b8",
      Other: "#6b7280",
      // Legacy compatibility
      Work: "#3b82f6",
    };
    return colors[category] || colors.Other;
  },

  getCategoryIcon(category) {
    const icons = {
      Development: "💻",
      Productivity: "💼",
      Education: "📚",
      Research: "🔬",
      Entertainment: "🎬",
      "Social Media": "💬",
      News: "📰",
      Shopping: "🛒",
      Adult: "🔞",
      Gambling: "🎰",
      Neutral: "🔘",
      Other: "🌐",
      Work: "💼",
    };
    return icons[category] || icons.Other;
  },

  getAllCategories() {
    return ["Development", "Productivity", "Education", "Research", "Entertainment", "Social Media", "News", "Shopping", "Adult", "Gambling", "Neutral", "Other"];
  },

  getDistractionDefaults() {
    return DistractionDefaults;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.Categories = Categories;
  globalThis.DistractionDefaults = DistractionDefaults;
  globalThis.CategoryPatterns = CategoryPatterns;
}
