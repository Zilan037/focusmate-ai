// background.js — Service worker: tracking engine, focus timer, blocking
// Manifest V3 service worker — event-driven, no persistent state in memory

importScripts("utils/storage.js", "utils/categories.js", "utils/scoring.js", "utils/insights.js");

// ─── State (in-memory, rebuilt from storage on wake) ───
let currentSession = null;
let recentDomains = [];
let idleState = "active";

// ─── Initialization ───
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[FocusGuard] Installed / Updated");
  await Storage.updateStreak();
  await ensureAlarms();

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
});

async function ensureAlarms() {
  chrome.alarms.create("session_tick", { periodInMinutes: 1 });
  chrome.alarms.create("daily_reset", { periodInMinutes: 60 });
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
    if (u.protocol === "chrome:" || u.protocol === "chrome-extension:" || u.protocol === "about:") return null;
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function handleTabChange(tab) {
  if (idleState !== "active") return;

  const domain = extractDomain(tab.url || "");
  if (!domain) {
    await commitSession();
    currentSession = null;
    return;
  }

  if (currentSession && currentSession.domain === domain) return;

  await commitSession();

  currentSession = {
    domain,
    startTime: Date.now(),
    tabId: tab.id,
  };

  trackDomainSwitch(domain);
  await checkBlocking(domain, tab.id);
}

async function commitSession() {
  if (!currentSession) return;

  const elapsed = (Date.now() - currentSession.startTime) / 1000 / 60;
  if (elapsed < 0.083) return;

  const usage = await Storage.getTodayUsage();
  const settings = await Storage.getSettings();
  const domain = currentSession.domain;
  const category = Categories.categorize(domain, settings.categoryOverrides);

  if (!usage.domains[domain]) {
    usage.domains[domain] = { time: 0, category, visits: 0 };
  }
  usage.domains[domain].time += elapsed;
  usage.domains[domain].visits += 1;
  usage.domains[domain].category = category;

  usage.totalActive += elapsed;

  if (Categories.isProductive(category)) {
    usage.focusTime += elapsed;
  } else if (Categories.isDistraction(category)) {
    usage.distractedTime += elapsed;
  }

  const hour = new Date().getHours();
  if (usage.hourlyActivity && usage.hourlyActivity[hour]) {
    if (Categories.isProductive(category)) {
      usage.hourlyActivity[hour].productive += elapsed;
    } else {
      usage.hourlyActivity[hour].distracted += elapsed;
    }
  }

  usage.score = Scoring.calculate(usage);
  await Storage.saveTodayUsage(usage);
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
}

// ─── Blocking Engine ───
async function checkBlocking(domain, tabId) {
  const settings = await Storage.getSettings();

  if (settings.blockedDomains.includes(domain)) {
    redirectToBlocked(tabId, domain, "Domain is on your block list");
    return;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  for (const schedule of settings.scheduledBlocks) {
    if (!schedule.days.includes(currentDay)) continue;
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (currentTime >= startMin && currentTime <= endMin) {
      if (schedule.domains.includes(domain)) {
        redirectToBlocked(tabId, domain, "Scheduled block active");
        return;
      }
    }
  }

  const focusState = await Storage.getFocusState();
  if (focusState.active) {
    const category = Categories.categorize(domain, settings.categoryOverrides);
    if (Categories.isDistraction(category)) {
      redirectToBlocked(tabId, domain, "Focus mode is active — stay focused!");
      return;
    }
  }
}

async function checkDailyLimit(domain, totalMinutes, settings) {
  const limit = settings.dailyLimits[domain];
  if (limit && totalMinutes >= limit) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && extractDomain(tab.url) === domain) {
        redirectToBlocked(tab.id, domain, `Daily limit of ${limit} minutes reached`);
      }
    } catch (e) {}
  }
}

function redirectToBlocked(tabId, domain, reason) {
  const blockedUrl = chrome.runtime.getURL(
    `blocked/blocked.html?domain=${encodeURIComponent(domain)}&reason=${encodeURIComponent(reason)}`
  );
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
});

async function startFocusMode(duration, tasks = []) {
  const state = {
    active: true,
    startTime: Date.now(),
    duration,
    remaining: duration,
    tasks: tasks.map((t, i) => ({ id: i, text: t, done: false })),
    interruptions: 0,
    paused: false,
  };
  await Storage.saveFocusState(state);
  chrome.alarms.create("focus_tick", { periodInMinutes: 1 });
  chrome.action.setBadgeText({ text: `${duration}m` });
  chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" });
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
  });

  chrome.alarms.clear("focus_tick");
  chrome.action.setBadgeText({ text: "" });

  if (status === "completed") {
    await Storage.updateStreak();
  }
}

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
      await startFocusMode(msg.duration, msg.tasks || []);
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
      if (!settings.blockedDomains.includes(msg.domain)) {
        settings.blockedDomains.push(msg.domain);
        await Storage.saveSettings(settings);
      }
      return { success: true };
    }

    case "unblockDomain": {
      const s = await Storage.getSettings();
      s.blockedDomains = s.blockedDomains.filter((d) => d !== msg.domain);
      await Storage.saveSettings(s);
      return { success: true };
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
      const sett = await Storage.getSettings();
      const reqs = sett.focusDefaults.unlockRequirements;
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

    case "completeOnboarding": {
      await chrome.storage.local.set({ focusguard_onboarded: true });
      if (msg.settings) {
        const s = await Storage.getSettings();
        s.focusDefaults.duration = msg.settings.focusDuration || 25;
        await Storage.saveSettings(s);
      }
      return { success: true };
    }

    // ─── NEW: Theme ───
    case "getTheme": {
      const { focusguard_theme } = await chrome.storage.local.get("focusguard_theme");
      return { theme: focusguard_theme || "dark" };
    }

    case "setTheme": {
      await chrome.storage.local.set({ focusguard_theme: msg.theme });
      return { success: true };
    }

    // ─── NEW: Data Export/Import ───
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

    // ─── NEW: Comparison Stats ───
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

    // ─── NEW: Today Insight Summary ───
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

    default:
      return { error: "Unknown action" };
  }
}
