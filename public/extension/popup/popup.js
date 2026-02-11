// popup.js — Premium extension popup logic V2

document.addEventListener("DOMContentLoaded", init);

let selectedDuration = 25;

async function init() {
  await loadStats();
  await loadInsight();
  setupListeners();
  await checkFocusState();
  updateDurHighlight();
  setupThemeToggle();
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

// ─── Format Time ───
function formatTime(minutes) {
  if (!minutes || minutes === 0) return "0h 0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

// ─── Load Stats ───
async function loadStats() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const streak = await chrome.runtime.sendMessage({ action: "getStreak" });
    const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });

    // Score ring
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

    // Stats
    document.getElementById("stat-focus-time").textContent = formatTime(usage.focusTime || 0);
    document.getElementById("stat-distracted").textContent = formatTime(usage.distractedTime || 0);
    document.getElementById("stat-active").textContent = formatTime(usage.totalActive || 0);

    // Streak
    const streakCount = streak.current || 0;
    document.getElementById("streak-count").textContent = streakCount;
    if (streakCount > 0) {
      document.getElementById("streak-badge").classList.add("active");
    }

    // Ticker
    const domainCount = Object.keys(usage.domains || {}).length;
    const focusStr = formatTime(usage.focusTime || 0);
    const tickerEl = document.getElementById("ticker-content");
    tickerEl.innerHTML = `<span>${domainCount} sites visited</span> <span class="ticker-sep">·</span> <span>${focusStr} focused</span> <span class="ticker-sep">·</span> <span>Score: ${score}</span>`;

    // Domain bars
    renderDomainBars(usage.domains || {});
  } catch (e) {
    console.error("Failed to load stats:", e);
  }
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
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<div class="empty-state">No activity yet today</div>';
    return;
  }

  const maxTime = sorted[0][1].time || 1;

  sorted.forEach(([domain, info]) => {
    const pct = Math.round(((info.time || 0) / maxTime) * 100);
    const color = Categories.getCategoryColor(info.category || "Other");
    const mins = Math.round(info.time || 0);

    const bar = document.createElement("div");
    bar.className = "domain-bar";
    
    // Try favicon first, fallback to letter
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    const letter = domain.charAt(0).toUpperCase();
    
    bar.innerHTML = `
      <div class="domain-favicon" style="background:${color}">
        <img src="${faviconUrl}" onerror="this.style.display='none';this.parentElement.textContent='${letter}'" />
      </div>
      <div class="domain-info">
        <span class="domain-name">${domain}</span>
        <div class="domain-bar-track">
          <div class="domain-bar-fill" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>
      <span class="domain-time">${mins}m</span>
    `;
    container.appendChild(bar);
  });
}

// ─── Duration Highlight ───
function updateDurHighlight() {
  const btns = document.querySelectorAll(".dur-btn");
  const highlight = document.getElementById("dur-highlight");
  let activeIndex = 0;
  btns.forEach((btn, i) => {
    if (btn.classList.contains("active")) activeIndex = i;
  });
  const btnWidth = 100 / btns.length;
  highlight.style.width = `calc(${btnWidth}% - 1.5px)`;
  highlight.style.transform = `translateX(${activeIndex * 100}%)`;
}

// ─── Listeners ───
function setupListeners() {
  document.getElementById("btn-dashboard").addEventListener("click", openDashboard);
  document.getElementById("btn-dashboard-bottom").addEventListener("click", openDashboard);

  document.querySelectorAll(".dur-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".dur-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedDuration = parseInt(btn.dataset.dur);
      updateDurHighlight();
    });
  });

  document.getElementById("btn-start-focus").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "startFocus", duration: selectedDuration, tasks: [] });
    await checkFocusState();
  });

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

  document.getElementById("btn-block-current").addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;
      const url = new URL(tab.url);
      const domain = url.hostname.replace(/^www\./, "");
      if (confirm(`Block ${domain}?`)) {
        await chrome.runtime.sendMessage({ action: "blockDomain", domain });
        window.close();
      }
    } catch (e) {}
  });
}

function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
}

// ─── Focus State ───
async function checkFocusState() {
  const state = await chrome.runtime.sendMessage({ action: "getFocusState" });

  const inactiveEl = document.getElementById("focus-inactive");
  const activeEl = document.getElementById("focus-active");

  if (state.active) {
    inactiveEl.style.display = "none";
    activeEl.style.display = "block";
    activeEl.classList.add("pulsing");

    const mins = Math.floor(state.remaining);
    const secs = Math.round((state.remaining % 1) * 60);
    document.getElementById("focus-timer").textContent =
      `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    const ring = document.getElementById("focus-ring");
    const pct = state.duration > 0 ? state.remaining / state.duration : 0;
    const offset = 264 * (1 - pct);
    ring.style.strokeDashoffset = offset;

    const pauseBtn = document.getElementById("btn-pause-focus");
    if (state.paused) {
      pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><polygon points="3,1 13,7 3,13"/></svg>';
    } else {
      pauseBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="1" width="3.5" height="12" rx="1"/><rect x="8.5" y="1" width="3.5" height="12" rx="1"/></svg>';
    }
  } else {
    inactiveEl.style.display = "block";
    activeEl.style.display = "none";
    activeEl.classList.remove("pulsing");
  }
}
