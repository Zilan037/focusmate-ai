// popup.js — Extension popup logic

document.addEventListener("DOMContentLoaded", init);

let selectedDuration = 25;

async function init() {
  await loadStats();
  setupListeners();
  await checkFocusState();
}

async function loadStats() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const streak = await chrome.runtime.sendMessage({ action: "getStreak" });
    const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });

    // Active time
    const hours = Math.floor((usage.totalActive || 0) / 60);
    const mins = Math.round((usage.totalActive || 0) % 60);
    document.getElementById("stat-active").textContent = `${hours}h ${mins}m`;

    // Focus %
    const focusPct = usage.totalActive > 0
      ? Math.round(((usage.focusTime || 0) / usage.totalActive) * 100)
      : 0;
    document.getElementById("stat-focus").textContent = focusPct + "%";

    // Score
    const scoreEl = document.getElementById("stat-score");
    scoreEl.textContent = scoreData.score || 0;
    if (scoreData.label) {
      scoreEl.style.color = scoreData.label.color;
    }

    // Streak
    document.getElementById("stat-streak").textContent = `🔥 ${streak.current || 0}`;

    // Domain bars
    renderDomainBars(usage.domains || {});
  } catch (e) {
    console.error("Failed to load stats:", e);
  }
}

function renderDomainBars(domains) {
  const container = document.getElementById("domain-bars");
  container.innerHTML = "";

  const sorted = Object.entries(domains)
    .sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
    .slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#666;font-size:11px;padding:8px;">No activity yet today</div>';
    return;
  }

  const maxTime = sorted[0][1].time || 1;

  sorted.forEach(([domain, info]) => {
    const pct = Math.round(((info.time || 0) / maxTime) * 100);
    const color = Categories.getCategoryColor(info.category || "Other");
    const mins = Math.round(info.time || 0);

    const bar = document.createElement("div");
    bar.className = "domain-bar";
    bar.innerHTML = `
      <span class="domain-name">${domain}</span>
      <div class="domain-bar-track">
        <div class="domain-bar-fill" style="width:${pct}%;background:${color};"></div>
      </div>
      <span class="domain-time">${mins}m</span>
    `;
    container.appendChild(bar);
  });
}

function setupListeners() {
  // Dashboard button
  document.getElementById("btn-dashboard").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard/dashboard.html") });
  });

  // Duration selector
  document.querySelectorAll(".dur-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".dur-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedDuration = parseInt(btn.dataset.dur);
    });
  });

  // Start focus
  document.getElementById("btn-start-focus").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "startFocus", duration: selectedDuration, tasks: [] });
    await checkFocusState();
  });

  // Pause focus
  document.getElementById("btn-pause-focus").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "pauseFocus" });
    await checkFocusState();
  });

  // Stop focus
  document.getElementById("btn-stop-focus").addEventListener("click", async () => {
    if (confirm("Stop focus session early? This will be marked as failed.")) {
      await chrome.runtime.sendMessage({ action: "stopFocus" });
      await checkFocusState();
      await loadStats();
    }
  });

  // Block current site
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

async function checkFocusState() {
  const state = await chrome.runtime.sendMessage({ action: "getFocusState" });

  const inactiveEl = document.getElementById("focus-inactive");
  const activeEl = document.getElementById("focus-active");

  if (state.active) {
    inactiveEl.style.display = "none";
    activeEl.style.display = "block";

    const mins = Math.floor(state.remaining);
    const secs = Math.round((state.remaining % 1) * 60);
    document.getElementById("focus-timer").textContent =
      `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    const pauseBtn = document.getElementById("btn-pause-focus");
    pauseBtn.textContent = state.paused ? "▶ Resume" : "⏸ Pause";
  } else {
    inactiveEl.style.display = "block";
    activeEl.style.display = "none";
  }
}
