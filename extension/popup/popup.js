// popup.js — FocusGuard V5 Premium popup with 4 tabs (Stats, Focus, Block, Activity)

document.addEventListener("DOMContentLoaded", init);

let currentTabDomain = null;
let focusPopupMode = "allow"; // "allow" or "block"
let focusPopupDuration = 25;
let focusPopupSites = [];
let focusPopupTasks = [];
let ctrlDuration = 25;
let recentDomains = [];

async function init() {
  setupPopupTabs();
  await loadRecentDomains();
  await loadPowerState();
  await loadStats();
  await loadGoalProgress();
  await loadInsight();
  setupListeners();
  setupThemeToggle();
  setupPowerToggle();
  await loadFocusTab();
  await loadControlsTab();
  await loadActivityTab();
  setupLimitWarningListener();
  await checkLimitsOnOpen();
  
  // Auto-refresh stats every 10 seconds for live accuracy
  setInterval(async () => {
    await loadStats();
    await loadGoalProgress();
  }, 10000);
}

// ─── Recent domains for autocomplete ───
async function loadRecentDomains() {
  try {
    recentDomains = await chrome.runtime.sendMessage({ action: "getRecentDomains" });
  } catch (e) {
    recentDomains = [];
  }
}

// ─── Tab Navigation ───
function setupPopupTabs() {
  document.querySelectorAll(".popup-nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".popup-nav-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".popup-tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("popup-tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

// ─── Theme ───
async function setupThemeToggle() {
  const btn = document.getElementById("btn-theme");
  btn.addEventListener("click", async () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    await chrome.runtime.sendMessage({ action: "setTheme", theme: next });
  });
}

// ─── Animated Number Counter ───
function animateNumber(el, target, duration = 600, suffix = "") {
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function formatTime(minutes) {
  if (!minutes || minutes <= 0) return "0m";
  if (minutes < 1) return Math.round(minutes * 60) + "s";
  const totalMins = Math.floor(minutes);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Load Stats ───
async function loadStats() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const streak = await chrome.runtime.sendMessage({ action: "getStreak" });
    const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });

    const score = scoreData.score || 0;
    const scoreEl = document.getElementById("stat-score");
    animateNumber(scoreEl, score);
    
    const ring = document.getElementById("score-ring");
    const circumference = 264;
    const offset = circumference - (score / 100) * circumference;
    ring.style.strokeDashoffset = offset;
    
    const labelEl = document.getElementById("score-label");
    if (scoreData.label) {
      labelEl.textContent = scoreData.label.label;
      scoreEl.style.color = scoreData.label.color;
    }

    document.getElementById("stat-focus-time").textContent = formatTime(usage.focusTime || 0);
    document.getElementById("stat-distracted").textContent = formatTime(usage.distractedTime || 0);
    document.getElementById("stat-active").textContent = formatTime(usage.totalActive || 0);

    const streakCount = streak.current || 0;
    document.getElementById("streak-count").textContent = streakCount;
    if (streakCount > 0) document.getElementById("streak-badge").classList.add("active");

    renderDomainBars(usage.domains || {});
  } catch (e) {
    console.error("Failed to load stats:", e);
  }
}

// ─── Goal Progress ───
async function loadGoalProgress() {
  try {
    const goalData = await chrome.runtime.sendMessage({ action: "getGoalProgress" });
    if (goalData) {
      const pct = Math.min(100, Math.round((goalData.current / goalData.goal) * 100));
      document.getElementById("goal-bar").style.width = pct + "%";
      document.getElementById("goal-progress-text").textContent = `${formatTime(goalData.current * 60)} / ${goalData.goal}h focused`;
      document.getElementById("goal-pct").textContent = pct + "%";
      document.getElementById("goal-streak").textContent = (goalData.streak || 0) + " day streak";
      if (pct >= 100) document.getElementById("goal-bar").classList.add("goal-complete");
    }
  } catch (e) {}
}

// ─── Load Insight ───
async function loadInsight() {
  try {
    const insight = await chrome.runtime.sendMessage({ action: "getTodayInsightSummary" });
    if (insight) {
      document.getElementById("insight-icon").textContent = insight.icon || "💡";
      document.getElementById("insight-text").textContent = insight.text || "";
    }
  } catch (e) {}
}

// ─── Domain Bars ───
function renderDomainBars(domains) {
  const container = document.getElementById("domain-bars");
  container.innerHTML = "";

  const sorted = Object.entries(domains)
    .sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
    .slice(0, 4);

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state">No activity yet today</div>';
    return;
  }

  const maxTime = sorted[0][1].time || 1;

  sorted.forEach(([domain, info], i) => {
    const pct = Math.round(((info.time || 0) / maxTime) * 100);
    const color = Categories.getCategoryColor(info.category || "Other");
    const mins = info.time || 0;
    const timeDisplay = mins < 1 ? Math.round(mins * 60) + "s" : Math.round(mins) + "m";

    const bar = document.createElement("div");
    bar.className = "domain-bar fade-up";
    bar.style.animationDelay = `${i * 60}ms`;
    
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    const letter = domain.charAt(0).toUpperCase();
    
    bar.innerHTML = `
      <div class="domain-favicon" style="background:${color}">
        <img src="${faviconUrl}" data-fallback="${letter}" />
      </div>
      <div class="domain-info">
        <span class="domain-name">${domain}</span>
        <div class="domain-bar-track">
          <div class="domain-bar-fill" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>
      <span class="domain-time">${timeDisplay}</span>
    `;
    bar.querySelector("img[data-fallback]").addEventListener("error", function() { this.style.display = "none"; this.parentElement.textContent = this.dataset.fallback; });
    container.appendChild(bar);
  });
}

// ─── Listeners ───
function setupListeners() {
  document.getElementById("btn-dashboard").addEventListener("click", openDashboard);
}

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
}

// ─── Power Toggle (Master On/Off) ───
async function loadPowerState() {
  try {
    const result = await chrome.runtime.sendMessage({ action: "getExtensionEnabled" });
    const enabled = result.enabled !== false;
    updatePowerUI(enabled);
  } catch (e) {
    updatePowerUI(true);
  }
}

function setupPowerToggle() {
  document.getElementById("btn-power").addEventListener("click", async () => {
    try {
      const result = await chrome.runtime.sendMessage({ action: "getExtensionEnabled" });
      const currentlyEnabled = result.enabled !== false;
      const newState = !currentlyEnabled;
      await chrome.runtime.sendMessage({ action: "setExtensionEnabled", enabled: newState });
      updatePowerUI(newState);
    } catch (e) {
      console.error("Power toggle error:", e);
    }
  });
}

function updatePowerUI(enabled) {
  const btn = document.getElementById("btn-power");
  const existingOverlay = document.getElementById("popup-disabled-overlay");
  
  if (enabled) {
    btn.classList.remove("off");
    btn.title = "Turn FocusGuard Off";
    if (existingOverlay) existingOverlay.remove();
  } else {
    btn.classList.add("off");
    btn.title = "Turn FocusGuard On";
    if (!existingOverlay) {
      const overlay = document.createElement("div");
      overlay.id = "popup-disabled-overlay";
      overlay.className = "popup-disabled-overlay";
      overlay.innerHTML = `
        <div class="popup-disabled-icon">⏸️</div>
        <div class="popup-disabled-text">FocusGuard is Paused</div>
        <div class="popup-disabled-sub">All tracking, blocking, and focus sessions are disabled.</div>
        <button class="popup-disabled-btn" id="btn-reenable">Turn On</button>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector("#btn-reenable").addEventListener("click", async () => {
        await chrome.runtime.sendMessage({ action: "setExtensionEnabled", enabled: true });
        updatePowerUI(true);
      });
    }
  }
}

// ═══ AUTOCOMPLETE ═══
function setupAutocomplete(inputId, dropdownId, onSelect) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  input.addEventListener("input", () => {
    const query = input.value.trim();
    const suggestions = getAutocompleteSuggestions(query, recentDomains);
    
    if (suggestions.length === 0) {
      dropdown.style.display = "none";
      return;
    }

    dropdown.innerHTML = suggestions.map(s => `
      <div class="autocomplete-item${s.recent ? ' recent' : ''}" data-domain="${s.domain}">
        <img class="autocomplete-favicon" src="https://www.google.com/s2/favicons?domain=${s.domain}&sz=16" />
        <span class="autocomplete-domain">${s.domain}</span>
        ${s.recent ? '<span class="autocomplete-badge">Recent</span>' : ''}
      </div>
    `).join("");
    dropdown.querySelectorAll("img.autocomplete-favicon").forEach(img => img.addEventListener("error", function() { this.style.display = "none"; }));
    dropdown.style.display = "block";

    dropdown.querySelectorAll(".autocomplete-item").forEach(item => {
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        const domain = item.dataset.domain;
        input.value = domain;
        dropdown.style.display = "none";
        if (onSelect) onSelect(domain);
      });
    });
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.style.display = "none"; }, 150);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim().length >= 2) {
      input.dispatchEvent(new Event("input"));
    }
  });
}

// ═══ FOCUS TAB ═══
async function loadFocusTab() {
  // Mode selector
  document.querySelectorAll(".focus-mode-option").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".focus-mode-option").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      focusPopupMode = btn.dataset.mode;
      updateFocusSiteLabel();
      focusPopupSites = [];
      renderFocusSitePills();
    });
  });

  // Duration pills
  document.querySelectorAll(".focus-dur-pill-popup").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".focus-dur-pill-popup").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      focusPopupDuration = parseInt(btn.dataset.dur);
    });
  });

  // Add site
  document.getElementById("btn-add-focus-site").addEventListener("click", addFocusSite);
  document.getElementById("focus-site-input").addEventListener("keydown", e => { if (e.key === "Enter") addFocusSite(); });

  // Add task
  document.getElementById("btn-add-focus-task-popup").addEventListener("click", addFocusTask);
  document.getElementById("focus-task-input-popup").addEventListener("keydown", e => { if (e.key === "Enter") addFocusTask(); });

  // Deploy
  document.getElementById("btn-deploy-focus-popup").addEventListener("click", deployFocusFromPopup);

  // Pause/Stop
  document.getElementById("btn-pause-focus").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "pauseFocus" });
    await checkFocusState();
  });

  document.getElementById("btn-stop-focus").addEventListener("click", async () => {
    if (confirm("Stop focus session early?")) {
      await chrome.runtime.sendMessage({ action: "stopFocus" });
      await checkFocusState();
      await loadStats();
    }
  });

  // Autocomplete for focus site input
  setupAutocomplete("focus-site-input", "focus-site-autocomplete", (domain) => {
    addFocusSiteByDomain(domain);
  });

  updateFocusSiteLabel();
  await checkFocusState();
}

function updateFocusSiteLabel() {
  const label = document.getElementById("focus-site-label");
  const desc = document.getElementById("focus-site-desc");
  if (focusPopupMode === "allow") {
    label.textContent = "✅ Allowed Websites";
    desc.textContent = "Only these sites will be accessible. Everything else blocked.";
  } else {
    label.textContent = "🚫 Blocked Websites";
    desc.textContent = "These sites will be blocked. Everything else stays accessible.";
  }
}

function addFocusSiteByDomain(domain) {
  const clean = normalizeDomainInput(domain);
  if (!clean) return;
  if (!focusPopupSites.includes(clean)) {
    focusPopupSites.push(clean);
  }
  document.getElementById("focus-site-input").value = "";
  renderFocusSitePills();
}

function addFocusSite() {
  const input = document.getElementById("focus-site-input");
  const domain = normalizeDomainInput(input.value);
  if (!domain) return;
  if (!focusPopupSites.includes(domain)) {
    focusPopupSites.push(domain);
  }
  input.value = "";
  renderFocusSitePills();
}

function addFocusTask() {
  const input = document.getElementById("focus-task-input-popup");
  const text = input.value.trim();
  if (!text) return;
  focusPopupTasks.push(text);
  input.value = "";
  renderFocusTaskPills();
}

function renderFocusSitePills() {
  const container = document.getElementById("focus-site-pills");
  const colorClass = focusPopupMode === "allow" ? "pill-allow" : "pill-block";
  container.innerHTML = focusPopupSites.map((s, i) =>
    `<span class="focus-pill ${colorClass}"><span>${s}</span><button data-idx="${i}">✕</button></span>`
  ).join("");
  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      focusPopupSites.splice(parseInt(btn.dataset.idx), 1);
      renderFocusSitePills();
    });
  });
}

function renderFocusTaskPills() {
  const container = document.getElementById("focus-task-pills");
  container.innerHTML = focusPopupTasks.map((t, i) =>
    `<span class="focus-pill pill-task"><span>${t}</span><button data-idx="${i}">✕</button></span>`
  ).join("");
  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      focusPopupTasks.splice(parseInt(btn.dataset.idx), 1);
      renderFocusTaskPills();
    });
  });
}

async function deployFocusFromPopup() {
  await chrome.runtime.sendMessage({
    action: "startFocus",
    duration: focusPopupDuration,
    tasks: focusPopupTasks,
    blockedSites: focusPopupMode === "block" ? focusPopupSites : [],
    allowedSites: focusPopupMode === "allow" ? focusPopupSites : [],
  });
  await checkFocusState();
}

// ─── Focus State ───
async function checkFocusState() {
  const state = await chrome.runtime.sendMessage({ action: "getFocusState" });
  const inactiveEl = document.getElementById("focus-tab-inactive");
  const activeEl = document.getElementById("focus-tab-active");

  if (state.active) {
    inactiveEl.style.display = "none";
    activeEl.style.display = "block";

    const mins = Math.floor(state.remaining);
    const secs = Math.round((state.remaining % 1) * 60);
    document.getElementById("focus-timer").textContent =
      `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    const ring = document.getElementById("focus-ring");
    const pct = state.duration > 0 ? state.remaining / state.duration : 0;
    const offset = 264 * (1 - pct);
    ring.style.strokeDashoffset = offset;

    const statusLabel = document.getElementById("focus-status-label");
    if (state.paused) {
      statusLabel.textContent = "Paused";
      statusLabel.style.color = "var(--warning)";
    } else if (state.onBreak) {
      statusLabel.textContent = "On Break";
      statusLabel.style.color = "var(--success)";
    } else {
      statusLabel.textContent = "Focusing";
      statusLabel.style.color = "var(--accent)";
    }

    const pomodoroEl = document.getElementById("pomodoro-count");
    pomodoroEl.textContent = `🍅 ${state.pomodoroCount || 0}`;

    const tasksList = document.getElementById("focus-tasks-list");
    tasksList.innerHTML = "";
    if (state.tasks && state.tasks.length > 0) {
      state.tasks.forEach((task, i) => {
        const item = document.createElement("label");
        item.className = "focus-task-item";
        const checked = task.done ? "checked" : "";
        item.innerHTML = `<input type="checkbox" ${checked} data-index="${i}" /><span>${task.text || task}</span>`;
        item.querySelector("input").addEventListener("change", async () => {
          await chrome.runtime.sendMessage({ action: "toggleTask", taskIndex: i });
        });
        tasksList.appendChild(item);
      });
    }

    const pauseBtn = document.getElementById("btn-pause-focus");
    if (state.paused) {
      pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><polygon points="3,1 13,7 3,13"/></svg>';
    } else {
      pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3.5" height="12" rx="1"/><rect x="8.5" y="1" width="3.5" height="12" rx="1"/></svg>';
    }

    // Auto-switch to focus tab if active
    document.querySelector('[data-tab="focus"]').click();
  } else {
    inactiveEl.style.display = "flex";
    activeEl.style.display = "none";
  }
}

// ═══ CONTROLS TAB ═══
async function loadControlsTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;
    
    const url = new URL(tab.url);
    const domain = url.hostname.replace(/^www\./, "");
    currentTabDomain = domain;
    
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    document.getElementById("ctrl-favicon").src = faviconUrl;
    document.getElementById("ctrl-domain").textContent = domain;
    
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    
    const category = Categories.categorize(domain, settings.categoryOverrides);
    const catEl = document.getElementById("ctrl-category");
    const color = Categories.getCategoryColor(category);
    catEl.textContent = category;
    catEl.style.color = color;
    
    const timeSpent = Math.round(usage.domains?.[domain]?.time || 0);
    document.getElementById("ctrl-time-spent").textContent = timeSpent + "m today";
    
    const isBlocked = (settings.blockedDomains || []).some(b => {
      const d = typeof b === "string" ? b : b.domain;
      const isSystem = typeof b === "object" && b.systemDefault;
      return d === domain && !isSystem;
    });
    const blockBtn = document.getElementById("ctrl-btn-block");
    const blockLabel = document.getElementById("ctrl-block-label");
    if (isBlocked) {
      blockBtn.classList.add("is-blocked");
      blockLabel.textContent = "Unblock";
    }
    
    blockBtn.addEventListener("click", async () => {
      if (blockBtn.classList.contains("is-blocked")) {
        await chrome.runtime.sendMessage({ action: "unblockDomain", domain });
        blockBtn.classList.remove("is-blocked");
        blockLabel.textContent = "Block";
      } else {
        await chrome.runtime.sendMessage({ action: "blockDomain", domain });
        blockBtn.classList.add("is-blocked");
        blockLabel.textContent = "Unblock";
      }
      // Refresh blocked sites in activity tab
      await loadBlockedSitesList();
    });
    
    const existingLimit = settings.dailyLimits?.[domain];
    if (existingLimit) {
      document.getElementById("ctrl-limit-picker").style.display = "none";
      const progressEl = document.getElementById("ctrl-limit-progress");
      progressEl.style.display = "block";
      const pct = Math.min(100, Math.round((timeSpent / existingLimit) * 100));
      const barColor = pct >= 100 ? '#F43F5E' : pct >= 80 ? '#F59E0B' : '#10B981';
      document.getElementById("ctrl-limit-text").textContent = `${timeSpent}/${existingLimit} min`;
      const barFill = document.getElementById("ctrl-limit-bar-fill");
      barFill.style.width = pct + "%";
      barFill.style.background = barColor;
      
      document.getElementById("ctrl-limit-remove").addEventListener("click", async () => {
        delete settings.dailyLimits[domain];
        await chrome.runtime.sendMessage({ action: "saveSettings", settings });
        progressEl.style.display = "none";
        document.getElementById("ctrl-btn-limit").style.display = "flex";
      });
    }
    
    document.getElementById("ctrl-btn-limit").addEventListener("click", () => {
      const picker = document.getElementById("ctrl-limit-picker");
      picker.style.display = picker.style.display === "none" ? "flex" : "none";
    });
    
    document.querySelectorAll(".ctrl-limit-opt").forEach(btn => {
      btn.addEventListener("click", async () => {
        const mins = parseInt(btn.dataset.mins);
        const s = await chrome.runtime.sendMessage({ action: "getSettings" });
        s.dailyLimits[domain] = mins;
        await chrome.runtime.sendMessage({ action: "saveSettings", settings: s });
        document.getElementById("ctrl-limit-picker").style.display = "none";
        document.getElementById("ctrl-limit-progress").style.display = "block";
        document.getElementById("ctrl-limit-text").textContent = `${timeSpent}/${mins} min`;
        const pct = Math.min(100, Math.round((timeSpent / mins) * 100));
        document.getElementById("ctrl-limit-bar-fill").style.width = pct + "%";
        document.getElementById("ctrl-btn-limit").style.display = "none";
      });
    });

    // Quick block categories
    document.querySelectorAll(".ctrl-cat-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const category = btn.dataset.category;
        btn.disabled = true;
        btn.style.opacity = "0.5";
        const result = await chrome.runtime.sendMessage({ action: "quickBlockCategory", category });
        btn.textContent = `✓ ${result.added || 0} added`;
        setTimeout(() => { btn.disabled = false; btn.style.opacity = "1"; }, 2000);
        await loadBlockedSitesList();
      });
    });

    // Load Quick Mode Presets
    await loadPresetCards();
  } catch (e) {
    console.error("Controls tab error:", e);
  }
}

// ═══ QUICK MODE PRESETS ═══
async function loadPresetCards() {
  try {
    const presets = await chrome.runtime.sendMessage({ action: "getPresets" });
    const activeResult = await chrome.runtime.sendMessage({ action: "getActivePreset" });
    const activeKey = activeResult.preset;
    const container = document.getElementById("preset-cards");
    if (!container) return;
    container.innerHTML = "";

    const presetOrder = ["work", "study", "break"];
    for (const key of presetOrder) {
      const preset = presets[key];
      if (!preset) continue;
      const isActive = activeKey === key;
      const card = document.createElement("button");
      card.className = "preset-card" + (isActive ? " active" : "");
      card.dataset.preset = key;
      card.style.setProperty("--preset-color", preset.color);
      
      const siteCount = preset.mode === "block" ? preset.blockedSites.length : preset.allowedSites.length;
      const modeLabel = preset.mode === "block" ? `${siteCount} blocked` : `${siteCount} allowed`;
      
      card.innerHTML = `
        <span class="preset-icon">${preset.icon}</span>
        <div class="preset-info">
          <span class="preset-name">${preset.name}</span>
          <span class="preset-meta">${preset.duration}m · ${modeLabel}</span>
        </div>
        <div class="preset-status">${isActive ? "✓ ON" : ""}</div>
      `;
      
      card.addEventListener("click", async () => {
        if (isActive) {
          await chrome.runtime.sendMessage({ action: "deactivatePreset" });
        } else {
          await chrome.runtime.sendMessage({ action: "activatePreset", presetKey: key });
        }
        await loadPresetCards();
        try { await loadFocusTab(); } catch(e) {}
      });
      
      container.appendChild(card);
    }
  } catch (e) {
    console.warn("Preset load error:", e);
  }
}

// ═══ ACTIVITY TAB ═══
async function loadActivityTab() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    
    const sitesCount = Object.keys(usage.domains || {}).length;
    document.getElementById("act-sites-count").textContent = sitesCount;
    
    const sessions = (usage.focusSessions || []).length;
    document.getElementById("act-focus-sessions").textContent = sessions;
    
    // Only count user-blocked (non-system) domains
    const blockedCount = (settings.blockedDomains || []).filter(b => !(typeof b === "object" && b.systemDefault)).length;
    document.getElementById("act-blocked-count").textContent = blockedCount;
    
    const catTotals = {};
    Object.entries(usage.domains || {}).forEach(([, info]) => {
      const cat = info.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + (info.time || 0);
    });
    
    const catContainer = document.getElementById("category-pills");
    const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    
    if (catEntries.length === 0) {
      catContainer.innerHTML = '<div class="empty-state">No data yet</div>';
    } else {
      catContainer.innerHTML = catEntries.map(([cat, time]) => {
        const color = Categories.getCategoryColor(cat);
        return `<div class="cat-pill" style="border-color:${color}33;background:${color}11;">
          <span class="cat-pill-dot" style="background:${color}"></span>
          <span class="cat-pill-name">${cat}</span>
          <span class="cat-pill-time">${Math.round(time)}m</span>
        </div>`;
      }).join("");
    }

    // Load blocked sites list
    await loadBlockedSitesList();
  } catch (e) {
    console.error("Activity tab error:", e);
  }
}

// ─── Blocked Sites List (user-blocked only) ───
async function loadBlockedSitesList() {
  const container = document.getElementById("blocked-sites-list");
  if (!container) return;

  try {
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    const userBlocked = (settings.blockedDomains || [])
      .filter(b => !(typeof b === "object" && b.systemDefault));

    if (userBlocked.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:8px;">No sites blocked yet</div>';
      return;
    }

    // Show max 10
    const visible = userBlocked.slice(0, 10);
    container.innerHTML = visible.map((entry, i) => {
      const domain = typeof entry === "string" ? entry : entry.domain;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
      return `<div class="blocked-site-item fade-up" style="animation-delay:${i * 30}ms">
        <img class="blocked-site-favicon" src="${faviconUrl}" />
        <span class="blocked-site-domain">${domain}</span>
        <button class="blocked-site-unblock" data-domain="${domain}" title="Unblock">✕</button>
      </div>`;
    }).join("");
    container.querySelectorAll("img.blocked-site-favicon").forEach(img => img.addEventListener("error", function() { this.style.display = "none"; }));

    if (userBlocked.length > 10) {
      container.innerHTML += `<div class="blocked-site-more" style="text-align:center;padding:4px;">
        <button class="btn-view-dashboard" style="font-size:10px;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:700;">View all ${userBlocked.length} in Dashboard →</button>
      </div>`;
      container.querySelector(".btn-view-dashboard")?.addEventListener("click", openDashboard);
    }

    container.querySelectorAll(".blocked-site-unblock").forEach(btn => {
      btn.addEventListener("click", async () => {
        const domain = btn.dataset.domain;
        await chrome.runtime.sendMessage({ action: "unblockDomain", domain });
        await loadBlockedSitesList();
        // Update count
        const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
        const blockedCount = (settings.blockedDomains || []).filter(b => !(typeof b === "object" && b.systemDefault)).length;
        document.getElementById("act-blocked-count").textContent = blockedCount;
      });
    });
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Could not load blocked sites</div>';
  }
}

// ═══ LIMIT WARNING TOAST ═══
function setupLimitWarningListener() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "LIMIT_WARNING") {
      showLimitWarningToast(msg.domain, msg.pct, msg.limit, msg.used);
    }
  });

  document.getElementById("limit-toast-close").addEventListener("click", () => {
    const toast = document.getElementById("limit-warning-toast");
    toast.style.display = "none";
  });
}

function showLimitWarningToast(domain, pct, limit, used) {
  const toast = document.getElementById("limit-warning-toast");
  const icon = document.getElementById("limit-toast-icon");
  const title = document.getElementById("limit-toast-title");
  const desc = document.getElementById("limit-toast-desc");
  const barFill = document.getElementById("limit-toast-bar-fill");
  const isDanger = pct >= 100;

  toast.className = "limit-warning-toast " + (isDanger ? "danger" : "warning");
  icon.textContent = isDanger ? "🚫" : "⚠️";
  title.textContent = isDanger ? `${domain} — Limit Reached!` : `${domain} — ${pct}% Used`;
  desc.textContent = isDanger
    ? `Daily limit of ${limit} min exceeded. Site is now blocked.`
    : `${used}/${limit} min used. Consider wrapping up.`;

  barFill.className = "limit-toast-bar-fill " + (isDanger ? "danger" : "warning");
  barFill.style.width = "0%";
  toast.style.display = "flex";

  // Animate bar fill
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      barFill.style.width = Math.min(pct, 100) + "%";
    });
  });

  // Pulse the Block tab button
  const blockTab = document.querySelector('[data-tab="controls"]');
  if (blockTab) {
    blockTab.classList.add("limit-warning-pulse");
    setTimeout(() => blockTab.classList.remove("limit-warning-pulse"), 5000);
  }

  // Auto-dismiss after 8s for warnings, keep for danger
  if (!isDanger) {
    setTimeout(() => { toast.style.display = "none"; }, 8000);
  }
}

// Check limits when popup opens
async function checkLimitsOnOpen() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    const limits = settings.dailyLimits || {};

    for (const [domain, limit] of Object.entries(limits)) {
      const time = usage.domains?.[domain]?.time || 0;
      const pct = Math.round((time / limit) * 100);
      if (pct >= 80) {
        showLimitWarningToast(domain, pct, limit, Math.round(time));
        break; // Show only the most critical one
      }
    }
  } catch (e) {}
}
