// background.js — Service worker V3: tracking, focus, blocking, notifications, shortcuts
// Manifest V3 service worker — event-driven, no persistent state in memory

importScripts("utils/storage.js", "utils/categories.js", "utils/scoring.js", "utils/insights.js", "utils/achievements.js", "utils/popular-sites.js");

// ─── NSFW/Gambling Keyword patterns for runtime detection ───
// IMPORTANT: These test against the DOMAIN string only — must be precise to avoid false positives
// e.g. "bet" would match "alphabet.com" — so we only match domains that START with or have these as standalone segments
const NSFW_KEYWORDS = /^porn|\.porn|pornhub|xvideo|xnxx|xhamster|xxx|nsfw|hentai|erotic|fetish|camgirl|camboy|camshow|livecam|livejasmin|chaturbate|stripchat|onlyfans|fansly|redtube|youporn|spankbang|rule34|nhentai|literotica/i;
const GAMBLING_KEYWORDS = /^bet365|^betway|^betmgm|^betonline|^betsafe|^betsson|^betfair|casino|gambl|pokerstars|partypoker|draftkings|fanduel|jackpot|sportsbook|roobet|stake\.com|bovada|1xbet|22bet|slotomania/i;
const SCAM_KEYWORDS = /^phish|malware|trojan|warez|torrent.*xxx/i;

// ─── State (in-memory, rebuilt from storage on wake) ───
let currentSession = null;
let recentDomains = [];
let idleState = "active";

// ─── Initialization ───
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[FocusGuard] Installed / Updated");
  await Storage.updateStreak();
  await ensureAlarms();

  // Always run system blocklist init (idempotent — merges, doesn't duplicate)
  await initSystemBlocklist();
  // Apply persistent declarativeNetRequest rules for all blocked domains
  await applyPersistentBlockRules();

  if (details.reason === "install") {
    const { focusguard_onboarded } = await chrome.storage.local.get("focusguard_onboarded");
    if (!focusguard_onboarded) {
      chrome.tabs.create({ url: chrome.runtime.getURL("onboarding/onboarding.html") });
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log("[FocusGuard] Browser started");
  await Storage.updateStreak();
  await ensureAlarms();
  await initSystemBlocklist();
  await applyPersistentBlockRules();
});

// ─── System Blocklist: Permanently block all Adult + Gambling domains ───
async function initSystemBlocklist() {
  const settings = await Storage.getSettings();
  const blockedDomains = settings.blockedDomains || [];

  // Gather ALL adult + gambling domains from CategoryPatterns and DistractionDefaults
  const adultDomains = [...(CategoryPatterns["Adult"] || []), ...(DistractionDefaults["Adult"] || [])];
  const gamblingDomains = [...(CategoryPatterns["Gambling"] || []), ...(DistractionDefaults["Gambling"] || [])];
  const systemDomains = [...new Set([...adultDomains, ...gamblingDomains])];

  let changed = false;
  for (const domain of systemDomains) {
    const existingIdx = blockedDomains.findIndex(b => {
      const d = typeof b === "string" ? b : b.domain;
      return d === domain;
    });

    if (existingIdx === -1) {
      // Add new system-default entry
      blockedDomains.push({
        domain,
        enabled: true,
        locked: true,
        systemDefault: true,
        addedAt: new Date().toISOString(),
      });
      changed = true;
    } else {
      // Ensure existing entry has systemDefault + locked flags
      const entry = blockedDomains[existingIdx];
      if (typeof entry === "string") {
        blockedDomains[existingIdx] = {
          domain: entry,
          enabled: true,
          locked: true,
          systemDefault: true,
          addedAt: new Date().toISOString(),
        };
        changed = true;
      } else if (!entry.systemDefault || !entry.locked || entry.enabled === false) {
        entry.systemDefault = true;
        entry.locked = true;
        entry.enabled = true;
        changed = true;
      }
    }
  }

  if (changed) {
    settings.blockedDomains = blockedDomains;
    // Also force strict safety mode on
    settings.strictSafetyMode = true;
    await Storage.saveSettings(settings);
  }

  console.log(`[FocusGuard] System blocklist initialized: ${systemDomains.length} domains protected`);
}

async function ensureAlarms() {
  // Commit every 10 seconds for maximum screen time precision
  chrome.alarms.create("session_tick", { periodInMinutes: 1/6 });
  chrome.alarms.create("daily_reset", { periodInMinutes: 60 });
  // Schedule checker: every minute, check if a scheduled block should auto-deploy
  chrome.alarms.create("schedule_check", { periodInMinutes: 1 });
}

// ─── Tab Tracking ───
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab);
  } catch (e) {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    handleTabChange(tab);
  }
});

// ─── Strict Navigation Interception (webNavigation) ───
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  
  // Master toggle check
  const { focusguard_enabled } = await chrome.storage.local.get("focusguard_enabled");
  if (focusguard_enabled === false) return;

  try {
    const url = details.url;
    if (!url || url.startsWith("chrome") || url.startsWith("about:") || url.startsWith("edge:")) return;
    
    const domain = extractDomain(url);
    if (!domain) return;

    // ── Always block NSFW/gambling domains via keyword detection ──
    if (isDangerousByKeyword(domain)) {
      redirectToBlocked(details.tabId, domain, "FocusGuard Safety Shield — this site is permanently blocked");
      return;
    }
    
    const focusState = await Storage.getFocusState();
    if (!focusState.active) {
      // Even outside focus, enforce system blocks
      await checkSystemBlocks(domain, details.tabId);
      return;
    }
    
    const allowedSites = focusState.allowedSites || [];
    
    // STRICT WHITELIST: if allowedSites is set, ONLY those domains pass
    if (allowedSites.length > 0) {
      const isAllowed = isDomainAllowed(domain, allowedSites);
      if (!isAllowed) {
        redirectToBlocked(details.tabId, domain, "Not in your Allowed Sites list — only whitelisted sites can be accessed during Focus Mode");
        return;
      }
      // Domain IS allowed — skip all further checks
      return;
    }
    
    // BLACKLIST: check blockedSites
    const blockedSites = focusState.blockedSites || [];
    if (blockedSites.length > 0) {
      const isBlocked = isDomainInList(domain, blockedSites);
      if (isBlocked) {
        redirectToBlocked(details.tabId, domain, "This site is on your Focus Mode block list");
        return;
      }
    }
    
    // Block standard distractions during focus
    const settings = await Storage.getSettings();
    const category = Categories.categorize(domain, settings.categoryOverrides);
    if (Categories.isDistraction(category)) {
      redirectToBlocked(details.tabId, domain, `Focus Mode active — ${category} sites are blocked`);
      return;
    }
    if (Categories.isDangerous(category)) {
      redirectToBlocked(details.tabId, domain, `Focus Mode active — ${category} content is blocked`);
      return;
    }
  } catch (e) {
    console.log("[FocusGuard] webNavigation error:", e);
  }
});

// Fallback: catch committed navigations that slipped through
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (details.transitionType === "auto_subframe") return;
  
  // Master toggle check
  const { focusguard_enabled } = await chrome.storage.local.get("focusguard_enabled");
  if (focusguard_enabled === false) return;

  try {
    const url = details.url;
    if (!url || url.startsWith("chrome") || url.startsWith("about:") || url.startsWith("edge:")) return;
    
    const domain = extractDomain(url);
    if (!domain) return;

    // Always block NSFW/gambling by keyword
    if (isDangerousByKeyword(domain)) {
      redirectToBlocked(details.tabId, domain, "FocusGuard Safety Shield — this site is permanently blocked");
      return;
    }
    
    const focusState = await Storage.getFocusState();
    if (!focusState.active) return;
    
    const allowedSites = focusState.allowedSites || [];
    if (allowedSites.length > 0) {
      const isAllowed = isDomainAllowed(domain, allowedSites);
      if (!isAllowed) {
        redirectToBlocked(details.tabId, domain, "Not in your Allowed Sites list — only whitelisted sites can be accessed during Focus Mode");
      }
      // Whether allowed or not, we're done — don't fall through to distraction checks
      return;
    }
  } catch (e) {}
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await commitSession();
    currentSession = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab) handleTabChange(tab);
    } catch (e) {}
  }
});

// ─── Idle Detection ───
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener(async (state) => {
  idleState = state;
  if (state === "idle" || state === "locked") {
    await commitSession();
    currentSession = null;
  } else if (state === "active") {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) handleTabChange(tab);
    } catch (e) {}
  }
});

// ─── Core Tracking Logic ───
function extractDomain(url) {
  try {
    const u = new URL(url);
    if (u.protocol === "chrome:" || u.protocol === "chrome-extension:" || u.protocol === "about:" || u.protocol === "edge:") return null;
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ─── Domain Matching Helpers ───
function normalizeDomain(d) {
  return d.replace(/^www\./, "").toLowerCase();
}

function isDomainInList(domain, list) {
  const d = normalizeDomain(domain);
  return list.some(s => {
    const ns = normalizeDomain(s);
    return d === ns || d.endsWith("." + ns);
  });
}

function isDomainAllowed(domain, allowedSites) {
  const d = normalizeDomain(domain);
  return allowedSites.some(s => {
    const ns = normalizeDomain(s);
    return d === ns || d.endsWith("." + ns);
  });
}

// ─── Dangerous Domain Detection (keyword-based, catches unlisted sites) ───
function isDangerousByKeyword(domain) {
  const d = normalizeDomain(domain);
  return NSFW_KEYWORDS.test(d) || GAMBLING_KEYWORDS.test(d) || SCAM_KEYWORDS.test(d);
}

// ─── System Block Check (outside focus mode) ───
async function checkSystemBlocks(domain, tabId) {
  const settings = await Storage.getSettings();
  
  // Strict Safety Mode — block dangerous categories
  if (settings.strictSafetyMode !== false) {
    const category = Categories.categorize(domain, settings.categoryOverrides);
    if (Categories.isDangerous(category)) {
      redirectToBlocked(tabId, domain, `FocusGuard Safety Shield — ${category} content is permanently blocked`);
      return;
    }
  }
  
  // Check individual blocked domains
  const blockedDomains = settings.blockedDomains || [];
  for (const blocked of blockedDomains) {
    const blockedDomain = typeof blocked === "object" ? blocked.domain : blocked;
    const isEnabled = typeof blocked === "object" ? blocked.enabled !== false : true;
    if (isEnabled && (domain === blockedDomain || domain.endsWith("." + blockedDomain))) {
      const isSystem = typeof blocked === "object" && blocked.systemDefault;
      const reason = isSystem 
        ? "FocusGuard Safety Shield — this site is permanently blocked"
        : "This site is on your block list";
      redirectToBlocked(tabId, domain, reason);
      return;
    }
  }
}

async function handleTabChange(tab) {
  if (idleState !== "active") return;

  // Master toggle check
  const { focusguard_enabled } = await chrome.storage.local.get("focusguard_enabled");
  if (focusguard_enabled === false) return;

  const domain = extractDomain(tab.url || "");
  if (!domain) {
    await commitSession();
    currentSession = null;
    return;
  }

  if (currentSession && currentSession.domain === domain) return;

  // Track category transition before committing old session
  const prevDomain = currentSession ? currentSession.domain : null;
  await commitSession();

  // Record category transition for Sankey
  if (prevDomain && prevDomain !== domain) {
    await recordCategoryTransition(prevDomain, domain);
  }

  currentSession = {
    domain,
    startTime: Date.now(),
    tabId: tab.id,
  };

  trackDomainSwitch(domain);
  await checkBlocking(domain, tab.id);
}

async function recordCategoryTransition(fromDomain, toDomain) {
  try {
    const settings = await Storage.getSettings();
    const fromCat = Categories.categorize(fromDomain, settings.categoryOverrides);
    const toCat = Categories.categorize(toDomain, settings.categoryOverrides);
    if (fromCat === toCat) return; // skip same-category transitions

    const usage = await Storage.getTodayUsage();
    if (!usage.categoryTransitions) usage.categoryTransitions = {};
    const key = `${fromCat}→${toCat}`;
    usage.categoryTransitions[key] = (usage.categoryTransitions[key] || 0) + 1;
    await Storage.saveTodayUsage(usage);
  } catch (e) {}
}

async function commitSession() {
  if (!currentSession) return;

  const now = Date.now();
  const elapsed = (now - currentSession.startTime) / 1000 / 60; // minutes
  if (elapsed < 0.03) return; // skip if less than ~2 seconds

  const usage = await Storage.getTodayUsage();
  const settings = await Storage.getSettings();
  const domain = currentSession.domain;
  const category = Categories.categorize(domain, settings.categoryOverrides);

  if (!usage.domains[domain]) {
    usage.domains[domain] = { time: 0, category, visits: 0, firstSeen: now, lastSeen: now };
  }
  usage.domains[domain].time += elapsed;
  usage.domains[domain].lastSeen = now;
  // Only count visits on first commit for this session, not on periodic ticks
  if (!currentSession.committed) {
    usage.domains[domain].visits += 1;
    currentSession.committed = true;
  }
  usage.domains[domain].category = category;

  usage.totalActive += elapsed;

  if (Categories.isProductive(category)) {
    usage.focusTime += elapsed;
  } else if (Categories.isDistraction(category)) {
    usage.distractedTime += elapsed;
  }
  // Track neutral time separately for better analytics
  if (!usage.neutralTime) usage.neutralTime = 0;
  if (Categories.isNeutral(category)) {
    usage.neutralTime += elapsed;
  }

  const hour = new Date().getHours();
  if (usage.hourlyActivity && usage.hourlyActivity[hour]) {
    if (Categories.isProductive(category)) {
      usage.hourlyActivity[hour].productive += elapsed;
    } else if (Categories.isDistraction(category)) {
      usage.hourlyActivity[hour].distracted += elapsed;
    }
    // Track total per hour for better heatmap accuracy
    if (!usage.hourlyActivity[hour].total) usage.hourlyActivity[hour].total = 0;
    usage.hourlyActivity[hour].total += elapsed;
  }

  usage.score = Scoring.calculate(usage);
  await Storage.saveTodayUsage(usage);
  
  // Reset the session start time so next tick only counts NEW elapsed time
  if (currentSession) currentSession.startTime = now;
  
  await checkDailyLimit(domain, usage.domains[domain].time, settings);
}

// ─── Distraction Loop Detection ───
function trackDomainSwitch(domain) {
  const now = Date.now();
  recentDomains.push({ domain, time: now });
  const tenMinAgo = now - 10 * 60 * 1000;
  recentDomains = recentDomains.filter((d) => d.time > tenMinAgo);

  if (recentDomains.length >= 4) {
    const domainCounts = {};
    recentDomains.forEach((d) => {
      domainCounts[d.domain] = (domainCounts[d.domain] || 0) + 1;
    });
    const uniqueDomains = Object.keys(domainCounts).length;
    const hasRepeats = Object.values(domainCounts).some((c) => c >= 2);
    if (uniqueDomains >= 4 && hasRepeats) {
      recordDistractionLoop(recentDomains.map((d) => d.domain));
      recentDomains = [];
    }
  }
}

async function recordDistractionLoop(domains) {
  const usage = await Storage.getTodayUsage();
  const now = new Date();
  usage.distractionLoops.push({
    time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    domains: [...new Set(domains)],
    duration: "~10 min",
    severity: domains.length >= 5 ? "high" : "medium",
  });
  await Storage.saveTodayUsage(usage);
  chrome.action.setBadgeText({ text: "!" });
  chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 30000);

  await sendNotification("distraction", "Distraction Loop Detected", "You're rapidly switching between distracting sites. Stay focused!");
}

// ─── Smart Notifications ───
async function sendNotification(type, title, message) {
  const settings = await Storage.getSettings();
  const notifSettings = settings.notifications || {};
  
  if (type === "focus_complete" && notifSettings.focusComplete === false) return;
  if (type === "daily_limit" && notifSettings.dailyLimit === false) return;
  if (type === "distraction" && notifSettings.distractionLoop === false) return;

  try {
    chrome.notifications.create(`fg_${type}_${Date.now()}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
      priority: 1,
    });
  } catch(e) {
    console.log("[FocusGuard] Notification error:", e);
  }
}

// ─── Blocking Engine ───
async function checkBlocking(domain, tabId) {
  const settings = await Storage.getSettings();
  const focusState = await Storage.getFocusState();

  // ── 0. Always block dangerous domains by keyword (even if not in list) ──
  if (isDangerousByKeyword(domain)) {
    redirectToBlocked(tabId, domain, "FocusGuard Safety Shield — this site is permanently blocked");
    return;
  }

  // ── 1. Focus Mode Active — strictest rules ──
  if (focusState.active) {
    const allowedSites = focusState.allowedSites || [];
    const blockedSites = focusState.blockedSites || [];

    // WHITELIST MODE: If any allowed sites are set, ONLY those are permitted
    if (allowedSites.length > 0) {
      const isAllowed = isDomainAllowed(domain, allowedSites);
      if (!isAllowed) {
        redirectToBlocked(tabId, domain, "Not in your Allowed Sites list — only whitelisted sites can be accessed during Focus Mode");
        return;
      }
      // Allowed — don't block
      return;
    }

    // BLACKLIST MODE: Block explicitly listed sites + distraction categories
    if (blockedSites.length > 0) {
      const isBlocked = isDomainInList(domain, blockedSites);
      if (isBlocked) {
        redirectToBlocked(tabId, domain, "This site is on your Focus Mode block list");
        return;
      }
    }

    // Block standard distractions during focus
    const category = Categories.categorize(domain, settings.categoryOverrides);
    if (Categories.isDistraction(category)) {
      redirectToBlocked(tabId, domain, `Focus Mode active — ${category} sites are blocked`);
      return;
    }

    // Block dangerous categories during focus
    if (Categories.isDangerous(category)) {
      redirectToBlocked(tabId, domain, `Focus Mode active — ${category} content is blocked`);
      return;
    }
  }

  // ── 2. Always block dangerous categories if strict mode is on ──
  if (settings.strictSafetyMode !== false) {
    const category = Categories.categorize(domain, settings.categoryOverrides);
    if (Categories.isDangerous(category)) {
      redirectToBlocked(tabId, domain, `FocusGuard Safety Shield — ${category} content is permanently blocked`);
      return;
    }
  }

  // ── 3. Check individual blocked domains ──
  const blockedDomains = settings.blockedDomains || [];
  for (const blocked of blockedDomains) {
    const blockedDomain = typeof blocked === "object" ? blocked.domain : blocked;
    const isEnabled = typeof blocked === "object" ? blocked.enabled !== false : true;
    if (isEnabled && (domain === blockedDomain || domain.endsWith("." + blockedDomain))) {
      redirectToBlocked(tabId, domain, "This site is on your block list");
      return;
    }
  }

  // ── 4. Scheduled blocks ──
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (const schedule of (settings.scheduledBlocks || [])) {
    if (!schedule.days.includes(currentDay)) continue;
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + (endM || 0);
    if (currentTime >= startMin && currentTime < endMin) {
      // "block-all" type blocks all distraction categories
      if (schedule.type === "block-all" || (schedule.domains && schedule.domains.includes("__all_distractions__"))) {
        const cat = Categories.categorize(domain, settings.categoryOverrides);
        if (Categories.isDistraction(cat)) {
          redirectToBlocked(tabId, domain, "Scheduled block: All distractions blocked");
          return;
        }
      }
      // Preset-based schedule (work/study mode block lists)
      else if (schedule.presetKey) {
        const presets = await Storage.getPresets();
        const preset = presets[schedule.presetKey];
        if (preset) {
          if (preset.mode === "allow" && !preset.allowedSites.some(s => domain.includes(s) || s.includes(domain))) {
            redirectToBlocked(tabId, domain, `Scheduled ${preset.name}: Not in allowed list`);
            return;
          } else if (preset.mode === "block" && preset.blockedSites.some(s => domain.includes(s) || s.includes(domain))) {
            redirectToBlocked(tabId, domain, `Scheduled ${preset.name}: Site is blocked`);
            return;
          }
        }
      }
      // Legacy: specific domain blocks
      else if (schedule.domains && schedule.domains.includes(domain)) {
        redirectToBlocked(tabId, domain, "Scheduled block active");
        return;
      }
    }
  }

  // ── 5. Wind-Down Mode blocking ──
  const windDownPhase = await Storage.get("focusguard_winddown_phase");
  if (windDownPhase && windDownPhase !== "none") {
    const category = Categories.categorize(domain, settings.categoryOverrides);
    if (windDownPhase === "bedtime" || windDownPhase === "hard") {
      // Hard block: all distractions + entertainment + social
      if (Categories.isDistraction(category)) {
        redirectToBlocked(tabId, domain, "🌙 Wind-Down Mode — it's almost bedtime. Distracting sites are blocked.");
        return;
      }
    } else if (windDownPhase === "soft") {
      // Soft block: entertainment + social only
      if (["Entertainment", "Social"].includes(category)) {
        redirectToBlocked(tabId, domain, "🌙 Wind-Down Mode — entertainment and social sites are soft-blocked as bedtime approaches.");
        return;
      }
    }
    // "warning" phase: no blocking, just notifications (handled in checkWindDown)
  }
}

async function checkDailyLimit(domain, totalMinutes, settings) {
  const limit = settings.dailyLimits[domain];
  if (!limit) return;

  // Track which thresholds we've already notified to avoid spam
  const notifiedKey = `limit_notified_${Storage.todayKey()}`;
  const notified = (await Storage.get(notifiedKey)) || {};
  const domainNotified = notified[domain] || {};
  const pct = Math.round((totalMinutes / limit) * 100);

  // 80% warning
  if (pct >= 80 && pct < 100 && !domainNotified.at80) {
    await sendNotification("daily_limit", "⚠️ 80% Limit Reached", `You've used ${Math.round(totalMinutes)}/${limit} min on ${domain}`);
    domainNotified.at80 = true;
    notified[domain] = domainNotified;
    await Storage.set(notifiedKey, notified);
    // Broadcast to popup for warning animation
    broadcastLimitWarning(domain, pct, limit, totalMinutes);
  }

  // 100% — block + notify
  if (pct >= 100 && !domainNotified.at100) {
    await sendNotification("daily_limit", "🚫 Daily Limit Reached", `${domain} is now blocked — ${limit} min limit exceeded`);
    domainNotified.at100 = true;
    notified[domain] = domainNotified;
    await Storage.set(notifiedKey, notified);
    broadcastLimitWarning(domain, 100, limit, totalMinutes);
  }

  if (totalMinutes >= limit) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && extractDomain(tab.url) === domain) {
        redirectToBlocked(tab.id, domain, `Daily limit of ${limit} minutes reached`);
      }
    } catch (e) {}
  }
}

function broadcastLimitWarning(domain, pct, limit, used) {
  chrome.runtime.sendMessage({
    type: "LIMIT_WARNING",
    domain,
    pct,
    limit,
    used: Math.round(used),
  }).catch(() => {}); // popup may not be open
}

function redirectToBlocked(tabId, domain, reason) {
  const blockedUrl = chrome.runtime.getURL(
    `blocked/blocked.html?domain=${encodeURIComponent(domain)}&reason=${encodeURIComponent(reason)}`
  );
  // Use history.replaceState equivalent: replace the tab URL so the original URL is not in history
  chrome.tabs.update(tabId, { url: blockedUrl });
}

// ─── Focus Mode ───
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "focus_tick") {
    const state = await Storage.getFocusState();
    if (!state.active || state.paused) return;
    state.remaining -= 1;
    if (state.remaining <= 0) {
      await completeFocusSession(state, "completed");
    } else {
      await Storage.saveFocusState(state);
      chrome.action.setBadgeText({ text: `${state.remaining}m` });
      chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" });
    }
  }
  if (alarm.name === "session_tick") {
    await commitSession();
  }
  if (alarm.name === "break_tick") {
    const breakState = await Storage.get("focusguard_break");
    if (breakState && breakState.active) {
      breakState.remaining -= 1;
      if (breakState.remaining <= 0) {
        await Storage.set("focusguard_break", { active: false, remaining: 0, type: null });
        chrome.action.setBadgeText({ text: "" });
        await sendNotification("focus_complete", "Break Complete", "Time to start your next focus session!");
      } else {
        await Storage.set("focusguard_break", breakState);
        chrome.action.setBadgeText({ text: `☕${breakState.remaining}` });
        chrome.action.setBadgeBackgroundColor({ color: "#34D399" });
      }
    }
  }
  if (alarm.name === "schedule_check") {
    await checkScheduleAutoDeploy();
    await checkWindDown();
  }
});

// ─── Schedule Auto-Deploy: auto-start focus sessions at scheduled times ───
async function checkScheduleAutoDeploy() {
  try {
    const { focusguard_enabled } = await chrome.storage.local.get("focusguard_enabled");
    if (focusguard_enabled === false) return;

    const settings = await Storage.getSettings();
    const blocks = settings.scheduledBlocks || [];
    if (!blocks.length) return;

    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;

    // Track which schedules we've already auto-deployed today
    const deployedKey = `schedule_deployed_${Storage.todayKey()}`;
    const deployed = (await Storage.get(deployedKey)) || {};

    for (const block of blocks) {
      if (!block.days || !block.days.includes(currentDay)) continue;
      if (!block.autoDeploy) continue; // Only auto-deploy blocks flagged for it

      const [startH, startM] = block.startTime.split(":").map(Number);
      const [endH, endM] = block.endTime.split(":").map(Number);
      const startMin = startH * 60 + (startM || 0);
      const endMin = endH * 60 + (endM || 0);
      const duration = endMin - startMin;

      // Send 5-minute warning notification
      if (currentTime === startMin - 5 && !deployed[`warn_${block.id}`]) {
        const typeName = block.type === "block-all" ? "Block All Distractions" :
          block.presetKey === "work" ? "Work Mode" : block.presetKey === "study" ? "Study Mode" : "Scheduled Block";
        await sendNotification("schedule_warning", "⏰ Scheduled Block in 5 Minutes",
          `${typeName} starts at ${block.startTime}. Get ready!`);
        deployed[`warn_${block.id}`] = true;
        await Storage.set(deployedKey, deployed);
      }

      // Auto-deploy at start time (within a 2-minute window)
      if (currentTime >= startMin && currentTime < startMin + 2 && !deployed[`deploy_${block.id}`]) {
        deployed[`deploy_${block.id}`] = true;
        await Storage.set(deployedKey, deployed);

        // Don't auto-deploy if a focus session is already active
        const focusState = await Storage.getFocusState();
        if (focusState.active) continue;

        if (block.presetKey && block.presetKey !== "block-all") {
          const presets = await Storage.getPresets();
          const preset = presets[block.presetKey];
          if (preset) {
            await startFocusMode(
              duration > 0 ? duration : preset.duration,
              [],
              preset.mode === "block" ? preset.blockedSites : [],
              preset.mode === "allow" ? preset.allowedSites : []
            );
            preset.enabled = true;
            presets[block.presetKey] = preset;
            await Storage.savePresets(presets);
            await Storage.setActivePreset(block.presetKey);

            chrome.action.setBadgeText({ text: block.presetKey === "work" ? "💼" : "📚" });
            chrome.action.setBadgeBackgroundColor({ color: preset.color });

            await sendNotification("schedule_deploy", `${preset.name} Auto-Started`,
              `Your scheduled ${preset.name} session (${duration}min) has begun. Stay focused!`);
          }
        } else {
          await startFocusMode(duration > 0 ? duration : 60, [], [], []);
          await sendNotification("schedule_deploy", "🚫 Scheduled Block Active",
            `All distractions are now blocked for ${duration > 0 ? duration : 60} minutes.`);
        }
      }
    }
  } catch (e) {
    console.warn("[FocusGuard] Schedule auto-deploy error:", e);
  }
}

// ─── Wind-Down Mode: Progressive restrictions as bedtime approaches ───
async function checkWindDown() {
  try {
    const { focusguard_enabled } = await chrome.storage.local.get("focusguard_enabled");
    if (focusguard_enabled === false) return;

    const settings = await Storage.getSettings();
    const windDown = settings.windDown;
    if (!windDown || !windDown.enabled) return;

    const now = new Date();
    const currentDay = now.getDay();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const activeDays = windDown.days || [0, 1, 2, 3, 4, 5, 6];
    if (!activeDays.includes(currentDay)) return;

    const [bedH, bedM] = windDown.bedtime.split(":").map(Number);
    const bedtimeMin = bedH * 60 + (bedM || 0);

    const totalLeadMin = windDown.leadTime || 60;
    const warningStart = bedtimeMin - totalLeadMin;
    const softBlockStart = bedtimeMin - Math.floor(totalLeadMin * 0.5);
    const hardBlockStart = bedtimeMin - Math.floor(totalLeadMin * 0.17);

    const windDownNotifKey = `winddown_notif_${Storage.todayKey()}`;
    const notified = (await Storage.get(windDownNotifKey)) || {};

    let phase = "none";
    if (currentMin >= bedtimeMin) {
      phase = "bedtime";
    } else if (currentMin >= hardBlockStart) {
      phase = "hard";
    } else if (currentMin >= softBlockStart) {
      phase = "soft";
    } else if (currentMin >= warningStart) {
      phase = "warning";
    }

    await Storage.set("focusguard_winddown_phase", phase);

    if (phase === "warning" && !notified.warning) {
      await sendNotification("winddown", "🌙 Wind-Down Starting",
        `Bedtime is in ${bedtimeMin - currentMin} minutes. Entertainment sites will show warnings.`);
      notified.warning = true;
      await Storage.set(windDownNotifKey, notified);
    }
    if (phase === "soft" && !notified.soft) {
      await sendNotification("winddown", "🌙 Wind-Down: Soft Block",
        `${bedtimeMin - currentMin} minutes to bedtime. Social and entertainment sites are now soft-blocked.`);
      notified.soft = true;
      await Storage.set(windDownNotifKey, notified);
    }
    if (phase === "hard" && !notified.hard) {
      await sendNotification("winddown", "🌙 Wind-Down: Hard Block",
        `Only ${bedtimeMin - currentMin} minutes to bedtime. All distracting sites are now blocked.`);
      notified.hard = true;
      await Storage.set(windDownNotifKey, notified);
    }
  } catch (e) {
    console.warn("[FocusGuard] Wind-down check error:", e);
  }
}

async function startFocusMode(duration, tasks = [], blockedSites = [], allowedSites = []) {
  const state = {
    active: true,
    startTime: Date.now(),
    duration,
    remaining: duration,
    tasks: tasks.map((t, i) => ({ id: i, text: t, done: false })),
    interruptions: 0,
    paused: false,
    blockedSites: blockedSites || [],
    allowedSites: allowedSites || [],
  };
  await Storage.saveFocusState(state);
  chrome.alarms.create("focus_tick", { periodInMinutes: 1 });
  chrome.action.setBadgeText({ text: `${duration}m` });
  chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" });

  // Apply declarativeNetRequest rules for hardened blocking
  await applyFocusBlockingRules(allowedSites || [], blockedSites || []);
}

async function stopFocusMode() {
  const state = await Storage.getFocusState();
  if (state.active) {
    await completeFocusSession(state, "failed");
  }
}

async function completeFocusSession(state, status) {
  const usage = await Storage.getTodayUsage();
  const elapsed = state.duration - state.remaining;
  const tasksCompleted = state.tasks.filter((t) => t.done).length;

  usage.focusSessions.push({
    start: new Date(state.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    duration: elapsed,
    tasksCompleted,
    totalTasks: state.tasks.length,
    interruptions: state.interruptions,
    status,
  });

  usage.score = Scoring.calculate(usage);
  await Storage.saveTodayUsage(usage);

  await Storage.saveFocusState({
    active: false, startTime: null, duration: 0, remaining: 0,
    tasks: [], interruptions: 0, paused: false,
    blockedSites: [], allowedSites: [],
  });

  chrome.alarms.clear("focus_tick");
  chrome.action.setBadgeText({ text: "" });

  // Clear declarativeNetRequest rules
  await clearFocusBlockingRules();

  if (status === "completed") {
    await Storage.updateStreak();
    await sendNotification("focus_complete", "Focus Session Complete! 🎯", `You completed ${elapsed} minutes of focused work.`);
    
    const pomodoroCount = await Storage.get("focusguard_pomodoro_count") || 0;
    const newCount = pomodoroCount + 1;
    await Storage.set("focusguard_pomodoro_count", newCount);
    
    const breakDuration = (newCount % 4 === 0) ? 15 : 5;
    const breakState = { active: true, remaining: breakDuration, type: newCount % 4 === 0 ? "long" : "short" };
    await Storage.set("focusguard_break", breakState);
    chrome.alarms.create("break_tick", { periodInMinutes: 1 });
    chrome.action.setBadgeText({ text: `☕${breakDuration}` });
    chrome.action.setBadgeBackgroundColor({ color: "#34D399" });
  }
}

// ─── DeclarativeNetRequest: Network-Level Blocking for Focus Mode ───
const FOCUS_RULE_BASE_ID = 10000;

async function applyFocusBlockingRules(allowedSites, blockedSites) {
  try {
    // First clear any existing focus rules
    await clearFocusBlockingRules();

    const rules = [];
    let ruleId = FOCUS_RULE_BASE_ID;

    if (allowedSites && allowedSites.length > 0) {
      // WHITELIST MODE: Block navigation only (main_frame), let sub-resources load freely
      // This ensures allowed sites can load CDN resources from any domain (e.g. YouTube + googlevideo.com)
      
      // Rule 1: Block ALL http navigation
      rules.push({
        id: ruleId++,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "|http",
          resourceTypes: ["main_frame"],
        },
      });

      // Rule 2: Block ALL https navigation
      rules.push({
        id: ruleId++,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: "|https",
          resourceTypes: ["main_frame"],
        },
      });

      // Exception rules for each allowed domain + subdomains + www variant
      for (const site of allowedSites) {
        const clean = normalizeDomainInput(site);
        if (!clean) continue;
        const domains = [clean];
        if (!clean.startsWith("www.")) {
          domains.push("www." + clean);
        }
        // Allow ALL resource types so the site works fully (CDN, scripts, images, etc.)
        const allTypes = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "xmlhttprequest", "ping", "media", "websocket", "other"];
        rules.push({
          id: ruleId++,
          priority: 10, // Highest — overrides persistent blocks too
          action: { type: "allow" },
          condition: {
            requestDomains: domains,
            resourceTypes: allTypes,
          },
        });
      }

      // Always allow extension pages
      rules.push({
        id: ruleId++,
        priority: 10,
        action: { type: "allow" },
        condition: {
          urlFilter: "chrome-extension://*",
          resourceTypes: ["main_frame"],
        },
      });

    } else if (blockedSites && blockedSites.length > 0) {
      // BLACKLIST MODE: Block ALL resource types for specific domains (total lockout)
      const allResourceTypes = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "xmlhttprequest", "ping", "media", "websocket", "other"];
      for (const site of blockedSites) {
        const clean = normalizeDomainInput(site);
        if (!clean) continue;
        const domains = [clean];
        if (!clean.startsWith("www.")) {
          domains.push("www." + clean);
        }
        rules.push({
          id: ruleId++,
          priority: 1,
          action: { type: "block" },
          condition: {
            requestDomains: domains,
            resourceTypes: allResourceTypes,
          },
        });
      }
    }

    if (rules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
        addRules: rules,
      });
      console.log(`[FocusGuard] Applied ${rules.length} declarativeNetRequest rules`);
    }
  } catch (e) {
    console.log("[FocusGuard] declarativeNetRequest error:", e);
  }
}

async function clearFocusBlockingRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const focusRuleIds = existingRules
      .filter(r => r.id >= FOCUS_RULE_BASE_ID && r.id < FOCUS_RULE_BASE_ID + 1000)
      .map(r => r.id);
    
    if (focusRuleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: focusRuleIds,
      });
      console.log(`[FocusGuard] Cleared ${focusRuleIds.length} focus blocking rules`);
    }
  } catch (e) {
    console.log("[FocusGuard] Error clearing rules:", e);
  }
}

// ─── Persistent Block Rules: Always block user-blocked & system-blocked domains (all resource types) ───
const PERSISTENT_RULE_BASE_ID = 20000;
const PERSISTENT_RULE_MAX = 2500;

async function applyPersistentBlockRules() {
  try {
    // Clear existing persistent rules
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const persistentIds = existing
      .filter(r => r.id >= PERSISTENT_RULE_BASE_ID && r.id < PERSISTENT_RULE_BASE_ID + PERSISTENT_RULE_MAX)
      .map(r => r.id);
    if (persistentIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: persistentIds });
    }

    const settings = await Storage.getSettings();
    const blockedDomains = settings.blockedDomains || [];
    const allResourceTypes = ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "xmlhttprequest", "ping", "media", "websocket", "other"];
    const rules = [];
    let ruleId = PERSISTENT_RULE_BASE_ID;

    for (const blocked of blockedDomains) {
      const domain = typeof blocked === "object" ? blocked.domain : blocked;
      const enabled = typeof blocked === "object" ? blocked.enabled !== false : true;
      if (!enabled) continue;

      const domains = [domain];
      if (!domain.startsWith("www.")) domains.push("www." + domain);

      rules.push({
        id: ruleId++,
        priority: 5, // Below focus-allow (10) but above focus-block (1)
        action: { type: "block" },
        condition: {
          requestDomains: domains,
          resourceTypes: allResourceTypes,
        },
      });

      if (ruleId >= PERSISTENT_RULE_BASE_ID + PERSISTENT_RULE_MAX - 1) break;
    }

    if (rules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
        addRules: rules,
      });
    }
    console.log(`[FocusGuard] Applied ${rules.length} persistent block rules`);
  } catch (e) {
    console.log("[FocusGuard] Persistent block rules error:", e);
  }
}

// ─── Keyboard Shortcuts ───
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-focus") {
    const state = await Storage.getFocusState();
    if (state.active) {
      await stopFocusMode();
    } else {
      const settings = await Storage.getSettings();
      await startFocusMode(settings.focusDefaults.duration);
    }
  } else if (command === "block-current") {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const domain = extractDomain(tab.url);
        if (domain) {
          const settings = await Storage.getSettings();
          const blockedDomains = settings.blockedDomains || [];
          const isDomainStr = blockedDomains.some(b => (typeof b === "string" ? b : b.domain) === domain);
          if (!isDomainStr) {
            blockedDomains.push({ domain, enabled: true, addedAt: new Date().toISOString() });
            settings.blockedDomains = blockedDomains;
            await Storage.saveSettings(settings);
          }
        }
      }
    } catch(e) {}
  }
});

// ─── Message Handler ───
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg).then(sendResponse);
  return true;
});

async function handleMessage(msg) {
  switch (msg.action) {
    case "getTodayUsage":
      return await Storage.getTodayUsage();

    case "getWeekUsage":
      return await Storage.getLastNDays(7);

    case "getSettings":
      return await Storage.getSettings();

    case "saveSettings":
      await Storage.saveSettings(msg.settings);
      return { success: true };

    case "getFocusState":
      return await Storage.getFocusState();

    case "startFocus":
      await startFocusMode(msg.duration, msg.tasks || [], msg.blockedSites || [], msg.allowedSites || []);
      return { success: true };

    case "stopFocus":
      await stopFocusMode();
      return { success: true };

    case "pauseFocus": {
      const state = await Storage.getFocusState();
      state.paused = !state.paused;
      if (!state.paused) state.interruptions += 1;
      await Storage.saveFocusState(state);
      return state;
    }

    case "toggleTask": {
      const fs = await Storage.getFocusState();
      if (fs.tasks[msg.taskIndex]) {
        fs.tasks[msg.taskIndex].done = !fs.tasks[msg.taskIndex].done;
      }
      await Storage.saveFocusState(fs);
      return fs;
    }

    case "getStreak":
      return await Storage.getStreak();

    case "getScore": {
      const usage = await Storage.getTodayUsage();
      return { score: usage.score, label: Scoring.getScoreLabel(usage.score) };
    }

    case "getInsights": {
      const today = await Storage.getTodayUsage();
      const week = await Storage.getLastNDays(7);
      return Insights.generate(today, week);
    }

    case "blockDomain": {
      const settings = await Storage.getSettings();
      const blockedList = settings.blockedDomains || [];
      const exists = blockedList.some(b => (typeof b === "string" ? b : b.domain) === msg.domain);
      if (!exists) {
        blockedList.push({ domain: msg.domain, enabled: true, addedAt: new Date().toISOString() });
        settings.blockedDomains = blockedList;
        await Storage.saveSettings(settings);
        await applyPersistentBlockRules();
      }
      return { success: true };
    }

    case "unblockDomain": {
      const s = await Storage.getSettings();
      const entry = (s.blockedDomains || []).find(d => (typeof d === "string" ? d : d.domain) === msg.domain);
      // System-default domains CANNOT be unblocked
      if (entry && typeof entry === "object" && entry.systemDefault) {
        return { success: false, error: "System-protected domain cannot be unblocked" };
      }
      if (entry && typeof entry === "object" && entry.locked && !msg.forceUnlock) {
        return { success: false, error: "Domain is locked" };
      }
      s.blockedDomains = (s.blockedDomains || []).filter((d) => {
        const dom = typeof d === "string" ? d : d.domain;
        return dom !== msg.domain;
      });
      await Storage.saveSettings(s);
      await applyPersistentBlockRules();
      return { success: true };
    }

    case "updateBlockedDomain": {
      const st = await Storage.getSettings();
      const list = st.blockedDomains || [];
      const idx = list.findIndex(b => (typeof b === "string" ? b : b.domain) === msg.domain);
      if (idx !== -1) {
        const entry = list[idx];
        // System-default domains cannot be modified
        if (typeof entry === "object" && entry.systemDefault) {
          return { success: false, error: "System-protected domain cannot be modified" };
        }
        if (typeof list[idx] === "string") {
          list[idx] = { domain: list[idx], enabled: msg.enabled !== undefined ? msg.enabled : true, addedAt: new Date().toISOString(), locked: false };
        } else {
          if (msg.enabled !== undefined) list[idx].enabled = msg.enabled;
          if (msg.locked !== undefined) list[idx].locked = msg.locked;
        }
        st.blockedDomains = list;
        await Storage.saveSettings(st);
        await applyPersistentBlockRules();
      }
      return { success: true };
    }

    case "bulkBlockDomains": {
      const sett = await Storage.getSettings();
      const bl = sett.blockedDomains || [];
      (msg.domains || []).forEach(d => {
        const exists = bl.some(b => (typeof b === "string" ? b : b.domain) === d);
        if (!exists) bl.push({ domain: d, enabled: true, addedAt: new Date().toISOString() });
      });
      sett.blockedDomains = bl;
      await Storage.saveSettings(sett);
      await applyPersistentBlockRules();
      return { success: true };
    }

    case "bulkUnblockDomains": {
      const se = await Storage.getSettings();
      const domainsToRemove = msg.domains || [];
      se.blockedDomains = (se.blockedDomains || []).filter(b => {
        const dom = typeof b === "string" ? b : b.domain;
        // Don't allow removing system defaults
        if (typeof b === "object" && b.systemDefault) return true;
        return !domainsToRemove.includes(dom);
      });
      await Storage.saveSettings(se);
      await applyPersistentBlockRules();
      return { success: true };
    }

    case "toggleAllBlockedDomains": {
      const toggleSettings = await Storage.getSettings();
      const enabled = msg.enabled;
      toggleSettings.blockedDomains = (toggleSettings.blockedDomains || []).map(b => {
        if (typeof b === "string") {
          return { domain: b, enabled, addedAt: new Date().toISOString() };
        }
        // System defaults always stay enabled
        if (b.systemDefault) return b;
        return { ...b, enabled };
      });
      await Storage.saveSettings(toggleSettings);
      await applyPersistentBlockRules();
      return { success: true };
    }

    case "toggleStrictSafetyMode": {
      // Safety mode cannot be disabled — it's always on
      return { success: true };
    }

    case "quickBlockCategory": {
      const qSettings = await Storage.getSettings();
      const qBl = qSettings.blockedDomains || [];
      const defaults = Categories.getDistractionDefaults();
      const categoryDomains = defaults[msg.category] || [];
      categoryDomains.forEach(d => {
        const exists = qBl.some(b => (typeof b === "string" ? b : b.domain) === d);
        if (!exists) qBl.push({ domain: d, enabled: true, addedAt: new Date().toISOString() });
      });
      qSettings.blockedDomains = qBl;
      await Storage.saveSettings(qSettings);
      return { success: true, added: categoryDomains.length };
    }

    case "recordBypass": {
      const u = await Storage.getTodayUsage();
      u.blockBypasses = (u.blockBypasses || 0) + 1;
      u.score = Scoring.calculate(u);
      await Storage.saveTodayUsage(u);
      return { success: true };
    }

    case "checkUnlockRequirements": {
      const focus = await Storage.getFocusState();
      const settR = await Storage.getSettings();
      const reqs = settR.focusDefaults.unlockRequirements;
      const elapsed = focus.active ? Math.floor((Date.now() - focus.startTime) / 60000) : 0;
      const tasksDone = focus.tasks ? focus.tasks.filter((t) => t.done).length : 0;
      return {
        focusMinutes: elapsed,
        focusRequired: reqs.focusMinutes,
        focusMet: elapsed >= reqs.focusMinutes,
        tasksCompleted: tasksDone,
        tasksRequired: reqs.tasksRequired,
        tasksMet: tasksDone >= reqs.tasksRequired,
        interruptions: focus.interruptions || 0,
        maxInterruptions: reqs.maxInterruptions,
        interruptionsMet: (focus.interruptions || 0) < reqs.maxInterruptions,
        allMet: elapsed >= reqs.focusMinutes && tasksDone >= reqs.tasksRequired && (focus.interruptions || 0) < reqs.maxInterruptions,
      };
    }

    case "checkDomainBlocked": {
      // Check if a domain is currently blocked (used by blocked page for auto-redirect)
      const checkDomain = normalizeDomain(msg.domain || "");
      if (!checkDomain) return { blocked: false };

      // 1. Dangerous by keyword — always blocked
      if (isDangerousByKeyword(checkDomain)) return { blocked: true };

      // 2. Focus mode active?
      const focusCheck = await Storage.getFocusState();
      if (focusCheck.active) {
        const allowed = focusCheck.allowedSites || [];
        if (allowed.length > 0) {
          return { blocked: !isDomainAllowed(checkDomain, allowed) };
        }
        const blocked = focusCheck.blockedSites || [];
        if (blocked.length > 0 && isDomainInList(checkDomain, blocked)) {
          return { blocked: true };
        }
        const setCheck = await Storage.getSettings();
        const cat = Categories.categorize(checkDomain, setCheck.categoryOverrides);
        if (Categories.isDistraction(cat) || Categories.isDangerous(cat)) return { blocked: true };
      }

      // 3. System blocks / user blocks outside focus
      const sysSettings = await Storage.getSettings();
      if (sysSettings.strictSafetyMode !== false) {
        const cat2 = Categories.categorize(checkDomain, sysSettings.categoryOverrides);
        if (Categories.isDangerous(cat2)) return { blocked: true };
      }
      const bl2 = sysSettings.blockedDomains || [];
      for (const b of bl2) {
        const bd = typeof b === "object" ? b.domain : b;
        const en = typeof b === "object" ? b.enabled !== false : true;
        if (en && (checkDomain === bd || checkDomain.endsWith("." + bd))) return { blocked: true };
      }

      return { blocked: false };
    }

    case "completeOnboarding": {
      await chrome.storage.local.set({ focusguard_onboarded: true });
      if (msg.settings) {
        const s = await Storage.getSettings();
        s.focusDefaults.duration = msg.settings.focusDuration || 25;
        if (msg.settings.dailyGoal) {
          s.dailyGoal = msg.settings.dailyGoal;
        }
        await Storage.saveSettings(s);
      }
      return { success: true };
    }

    // ─── Theme ───
    case "getTheme": {
      const { focusguard_theme } = await chrome.storage.local.get("focusguard_theme");
      return { theme: focusguard_theme || "dark" };
    }

    case "setTheme": {
      await chrome.storage.local.set({ focusguard_theme: msg.theme });
      return { success: true };
    }

    // ─── Data Export/Import ───
    case "exportData": {
      const allData = await chrome.storage.local.get(null);
      return { data: allData };
    }

    case "importData": {
      if (msg.data && typeof msg.data === "object") {
        await chrome.storage.local.set(msg.data);
        return { success: true };
      }
      return { error: "Invalid data" };
    }

    // ─── Comparison Stats ───
    case "getComparisonStats": {
      const todayUsage = await Storage.getTodayUsage();
      const weekUsage = await Storage.getLastNDays(2);
      let yesterday = { totalActive: 0, focusTime: 0, distractedTime: 0, score: 0 };
      if (weekUsage && weekUsage.length >= 2) {
        yesterday = weekUsage[1].data || yesterday;
      }
      const calc = (today, yest) => {
        if (!yest || yest === 0) return { pct: 0, direction: "up" };
        const diff = ((today - yest) / yest) * 100;
        return { pct: Math.abs(Math.round(diff)), direction: diff >= 0 ? "up" : "down" };
      };
      return {
        active: calc(todayUsage.totalActive, yesterday.totalActive),
        focus: calc(todayUsage.focusTime, yesterday.focusTime),
        distracted: calc(todayUsage.distractedTime, yesterday.distractedTime),
        score: calc(todayUsage.score, yesterday.score),
      };
    }

    // ─── Today Insight Summary ───
    case "getTodayInsightSummary": {
      const tu = await Storage.getTodayUsage();
      const weekU = await Storage.getLastNDays(2);
      let yest = null;
      if (weekU && weekU.length >= 2) yest = weekU[1].data;

      if (tu.totalActive < 1) {
        return { text: "Start browsing to get your first insight!", icon: "💡" };
      }

      const focusPct = tu.totalActive > 0 ? Math.round((tu.focusTime / tu.totalActive) * 100) : 0;

      if (yest && yest.totalActive > 0) {
        const yFocusPct = Math.round((yest.focusTime / yest.totalActive) * 100);
        const diff = focusPct - yFocusPct;
        if (diff > 0) {
          return { text: `You're ${diff}% more focused than yesterday!`, icon: "🚀" };
        } else if (diff < -10) {
          return { text: `Focus is ${Math.abs(diff)}% lower than yesterday. Time to rally!`, icon: "⚡" };
        }
      }

      if (focusPct >= 70) {
        return { text: `${focusPct}% focus rate — you're in the zone!`, icon: "🔥" };
      } else if (focusPct < 30) {
        return { text: "Lots of distractions today. Try a focus session!", icon: "🎯" };
      }

      const topDomain = Object.entries(tu.domains).sort((a,b) => b[1].time - a[1].time)[0];
      if (topDomain) {
        return { text: `Most time on ${topDomain[0]} (${Math.round(topDomain[1].time)}m)`, icon: "📊" };
      }

      return { text: `${focusPct}% productive today. Keep going!`, icon: "💪" };
    }

    // ─── Detailed Stats (30-day) ───
    case "getDetailedStats": {
      const data30 = await Storage.getLastNDays(30);
      const days = data30.map(d => ({
        date: d.date,
        totalActive: d.data.totalActive || 0,
        focusTime: d.data.focusTime || 0,
        distractedTime: d.data.distractedTime || 0,
        score: d.data.score || 0,
        focusSessions: Array.isArray(d.data.focusSessions) ? d.data.focusSessions.length : (d.data.focusSessions || 0),
      }));

      // Calculate peak productivity windows from hourly data
      const hourlyTotals = Array.from({ length: 24 }, () => ({ productive: 0, count: 0 }));
      data30.forEach(d => {
        const hourly = d.data.hourlyActivity || [];
        hourly.forEach((h, i) => {
          if (h && h.productive > 0) {
            hourlyTotals[i].productive += h.productive;
            hourlyTotals[i].count += 1;
          }
        });
      });

      const peakWindows = [];
      for (let i = 0; i < 22; i++) {
        const t1 = hourlyTotals[i];
        const t2 = hourlyTotals[i + 1];
        const t3 = hourlyTotals[i + 2];
        const totalProd = t1.productive + t2.productive + t3.productive;
        const totalCount = Math.max(1, t1.count + t2.count + t3.count);
        const avgScore = Math.round((totalProd / totalCount) * 10);
        if (totalProd > 0) {
          peakWindows.push({ start: i, end: i + 2, avgScore: Math.min(100, avgScore) });
        }
      }
      peakWindows.sort((a, b) => b.avgScore - a.avgScore);

      return { days, peakWindows: peakWindows.slice(0, 4) };
    }

    // ─── Domain History (7-day sparkline) ───
    case "getDomainHistory": {
      const week7 = await Storage.getLastNDays(7);
      const domain = msg.domain;
      return week7.map(d => d.data.domains?.[domain]?.time || 0).reverse();
    }

    // ─── All Usage (all-time) ───
    case "getAllUsage": {
      return new Promise((resolve) => {
        chrome.storage.local.get(null, (allData) => {
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          const days = [];
          for (const key of Object.keys(allData)) {
            if (datePattern.test(key) && allData[key] && typeof allData[key] === "object") {
              days.push({ date: key, data: allData[key] });
            }
          }
          days.sort((a, b) => a.date.localeCompare(b.date));
          resolve(days);
        });
      });
    }

    // ─── Goal Management ───
    case "setDailyGoal": {
      const sg = await Storage.getSettings();
      sg.dailyGoal = msg.hours || 4;
      await Storage.saveSettings(sg);
      return { success: true };
    }

    case "getDailyGoal": {
      const gg = await Storage.getSettings();
      return { goal: gg.dailyGoal || 4 };
    }

    case "getGoalProgress": {
      const gSettings = await Storage.getSettings();
      const gUsage = await Storage.getTodayUsage();
      const goalHours = gSettings.dailyGoal || 4;
      const focusHours = (gUsage.focusTime || 0) / 60;
      return {
        goal: goalHours,
        current: Math.round(focusHours * 10) / 10,
        percentage: Math.min(100, Math.round((focusHours / goalHours) * 100)),
      };
    }

    // ─── Scheduled Blocks ───
    case "getScheduledBlocks": {
      const sbs = await Storage.getSettings();
      return sbs.scheduledBlocks || [];
    }

    case "saveScheduledBlock": {
      const sb = await Storage.getSettings();
      sb.scheduledBlocks = sb.scheduledBlocks || [];
      if (msg.block.id !== undefined) {
        const idx2 = sb.scheduledBlocks.findIndex(b => b.id === msg.block.id);
        if (idx2 !== -1) sb.scheduledBlocks[idx2] = msg.block;
        else sb.scheduledBlocks.push({ ...msg.block, id: Date.now() });
      } else {
        sb.scheduledBlocks.push({ ...msg.block, id: Date.now() });
      }
      await Storage.saveSettings(sb);
      return { success: true };
    }

    case "deleteScheduledBlock": {
      const dsb = await Storage.getSettings();
      dsb.scheduledBlocks = (dsb.scheduledBlocks || []).filter(b => b.id !== msg.id);
      await Storage.saveSettings(dsb);
      return { success: true };
    }

    // ─── Category Override ───
    case "setCategoryOverride": {
      const co = await Storage.getSettings();
      co.categoryOverrides = co.categoryOverrides || {};
      co.categoryOverrides[msg.domain] = msg.category;
      await Storage.saveSettings(co);
      return { success: true };
    }

    // ─── Break State ───
    case "getBreakState": {
      const bs = await Storage.get("focusguard_break");
      return bs || { active: false, remaining: 0, type: null };
    }

    case "skipBreak": {
      await Storage.set("focusguard_break", { active: false, remaining: 0, type: null });
      chrome.alarms.clear("break_tick");
      chrome.action.setBadgeText({ text: "" });
      return { success: true };
    }

    // ─── Pomodoro Count ───
    case "getPomodoroCount": {
      const pc = await Storage.get("focusguard_pomodoro_count");
      return { count: pc || 0 };
    }

    // ─── Resist Counter ───
    case "getResistCount": {
      const rc = await Storage.get("focusguard_resist_count_" + Storage.todayKey());
      return { count: rc || 0 };
    }

    case "incrementResist": {
      const key = "focusguard_resist_count_" + Storage.todayKey();
      const current = await Storage.get(key) || 0;
      await Storage.set(key, current + 1);
      return { count: current + 1 };
    }

    case "getMonthUsage": {
      const n = msg.days || 30;
      return await Storage.getLastNDays(n);
    }

    // ─── Recent Domains for autocomplete ───
    case "getRecentDomains": {
      const recentUsage = await Storage.getTodayUsage();
      const recentSettings = await Storage.getSettings();
      const domainList = Object.keys(recentUsage.domains || {});
      const userBlocked = (recentSettings.blockedDomains || [])
        .filter(b => !(typeof b === "object" && b.systemDefault))
        .map(b => typeof b === "string" ? b : b.domain);
      const sorted = [...new Set([...domainList, ...userBlocked])];
      await chrome.storage.local.set({ focusguard_recent_domains: sorted.slice(0, 50) });
      return sorted.slice(0, 50);
    }

    // ─── Master On/Off Toggle ───
    case "getExtensionEnabled": {
      const { focusguard_enabled } = await chrome.storage.local.get("focusguard_enabled");
      return { enabled: focusguard_enabled !== false };
    }

    case "setExtensionEnabled": {
      const newEnabled = msg.enabled !== false;
      await chrome.storage.local.set({ focusguard_enabled: newEnabled });
      
      if (!newEnabled) {
        // Disable everything: stop focus, clear all blocking rules
        const focusS = await Storage.getFocusState();
        if (focusS.active) {
          await completeFocusSession(focusS, "failed");
        }
        // Clear ALL dynamic blocking rules
        const allRules = await chrome.declarativeNetRequest.getDynamicRules();
        const allIds = allRules.map(r => r.id);
        if (allIds.length > 0) {
          await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: allIds });
        }
        // Stop tracking
        await commitSession();
        currentSession = null;
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: "#F43F5E" });
      } else {
        // Re-enable: restore persistent block rules
        await applyPersistentBlockRules();
        chrome.action.setBadgeText({ text: "" });
    }
      return { success: true };
    }

    // ─── Quick Mode Presets ───
    case "getPresets": {
      return await Storage.getPresets();
    }

    case "savePresets": {
      await Storage.savePresets(msg.presets);
      return { success: true };
    }

    case "getActivePreset": {
      return { preset: await Storage.getActivePreset() };
    }

    case "activatePreset": {
      const presets = await Storage.getPresets();
      const preset = presets[msg.presetKey];
      if (!preset) return { error: "Preset not found" };

      // Deactivate any existing preset first
      const currentActive = await Storage.getActivePreset();
      if (currentActive) {
        const curPresets = await Storage.getPresets();
        if (curPresets[currentActive]) {
          curPresets[currentActive].enabled = false;
          await Storage.savePresets(curPresets);
        }
      }

      // Start a focus session with the preset config
      const focusState = await Storage.getFocusState();
      if (focusState.active) {
        await completeFocusSession(focusState, "cancelled");
      }

      // Mark preset as active
      preset.enabled = true;
      presets[msg.presetKey] = preset;
      await Storage.savePresets(presets);
      await Storage.setActivePreset(msg.presetKey);

      // If break mode, just clear blocks and don't start focus
      if (msg.presetKey === "break") {
        // Clear focus blocking rules but keep persistent blocks
        const allRules = await chrome.declarativeNetRequest.getDynamicRules();
        const focusRuleIds = allRules.filter(r => r.id >= 1000 && r.id < 50000).map(r => r.id);
        if (focusRuleIds.length > 0) {
          await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: focusRuleIds });
        }
        chrome.action.setBadgeText({ text: "☕" });
        chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
        return { success: true, mode: "break" };
      }

      // Deploy as focus session
      await chrome.runtime.sendMessage({
        action: "startFocus",
        duration: preset.duration,
        tasks: [],
        blockedSites: preset.mode === "block" ? preset.blockedSites : [],
        allowedSites: preset.mode === "allow" ? preset.allowedSites : [],
      });

      const badgeText = msg.presetKey === "work" ? "💼" : "📚";
      chrome.action.setBadgeText({ text: badgeText });
      chrome.action.setBadgeBackgroundColor({ color: preset.color });

      return { success: true, mode: preset.mode };
    }

    case "deactivatePreset": {
      const dPresets = await Storage.getPresets();
      const activeKey = await Storage.getActivePreset();
      if (activeKey && dPresets[activeKey]) {
        dPresets[activeKey].enabled = false;
        await Storage.savePresets(dPresets);
      }
      await Storage.setActivePreset(null);

      // Stop any active focus session
      const dFocus = await Storage.getFocusState();
      if (dFocus.active) {
        await completeFocusSession(dFocus, "cancelled");
      }

      // Clear focus blocking rules
      const allRules2 = await chrome.declarativeNetRequest.getDynamicRules();
      const focusIds = allRules2.filter(r => r.id >= 1000 && r.id < 50000).map(r => r.id);
      if (focusIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: focusIds });
      }

      chrome.action.setBadgeText({ text: "" });
      return { success: true };
    }

    // ─── Wind-Down Settings ───
    case "getWindDown": {
      const wSettings = await Storage.getSettings();
      return wSettings.windDown || {
        enabled: false,
        bedtime: "23:00",
        leadTime: 60,
        days: [0, 1, 2, 3, 4, 5, 6],
      };
    }

    case "saveWindDown": {
      const ws = await Storage.getSettings();
      ws.windDown = msg.windDown;
      await Storage.saveSettings(ws);
      return { success: true };
    }

    case "getWindDownPhase": {
      const phase = await Storage.get("focusguard_winddown_phase");
      return { phase: phase || "none" };
    }

    default:
      return { error: "Unknown action" };
  }
}

