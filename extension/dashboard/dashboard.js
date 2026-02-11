// dashboard.js — Full analytics dashboard with Canvas charts

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupTabs();
  await loadOverview();
  await loadInsights();
  await loadSessions();
  await loadSettings();
}

// ─── Tab Switching ───
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

// ─── Overview ───
async function loadOverview() {
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  const streak = await chrome.runtime.sendMessage({ action: "getStreak" });
  const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });
  const weekData = await chrome.runtime.sendMessage({ action: "getWeekUsage" });

  // Stats
  const h = Math.floor((usage.totalActive || 0) / 60);
  const m = Math.round((usage.totalActive || 0) % 60);
  document.getElementById("d-active").textContent = `${h}h ${m}m`;

  const focusPct = usage.totalActive > 0
    ? Math.round(((usage.focusTime || 0) / usage.totalActive) * 100) : 0;
  document.getElementById("d-focus").textContent = focusPct + "%";

  const scoreEl = document.getElementById("d-score");
  scoreEl.textContent = scoreData.score || 0;
  if (scoreData.label) {
    scoreEl.style.color = scoreData.label.color;
    document.getElementById("d-score-label").textContent = scoreData.label.emoji + " " + scoreData.label.label;
    document.getElementById("d-score-label").style.color = scoreData.label.color;
  }

  document.getElementById("d-streak").textContent = `🔥 ${streak.current || 0}`;

  // Charts
  drawDomainChart(usage.domains || {});
  drawCategoryChart(usage.domains || {});
  drawHourlyChart(usage.hourlyActivity || []);
  drawWeeklyChart(weekData || []);
}

// ─── Canvas Chart Helpers ───
function getCtx(id) {
  const canvas = document.getElementById(id);
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr - 40 * dpr;
  canvas.height = (parseInt(canvas.getAttribute("height")) || 300) * dpr;
  canvas.style.width = (rect.width - 40) + "px";
  canvas.style.height = (parseInt(canvas.getAttribute("height")) || 300) + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx, w: rect.width - 40, h: parseInt(canvas.getAttribute("height")) || 300 };
}

function drawDomainChart(domains) {
  const { ctx, w, h } = getCtx("chart-domains");
  ctx.clearRect(0, 0, w, h);

  const sorted = Object.entries(domains)
    .sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
    .slice(0, 8);

  if (sorted.length === 0) {
    ctx.fillStyle = "#666";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data yet", w / 2, h / 2);
    return;
  }

  const maxTime = sorted[0][1].time || 1;
  const barH = 28;
  const gap = 8;
  const labelW = 130;
  const chartW = w - labelW - 60;
  const startY = 20;

  sorted.forEach(([domain, info], i) => {
    const y = startY + i * (barH + gap);
    const barW = (info.time / maxTime) * chartW;
    const color = Categories.getCategoryColor(info.category || "Other");

    // Label
    ctx.fillStyle = "#aaa";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(domain.length > 18 ? domain.slice(0, 18) + "…" : domain, labelW - 10, y + barH / 2 + 4);

    // Bar
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(labelW, y, barW, barH, 4);
    ctx.fill();

    // Time label
    ctx.fillStyle = "#888";
    ctx.textAlign = "left";
    ctx.font = "11px sans-serif";
    ctx.fillText(Math.round(info.time) + "m", labelW + barW + 8, y + barH / 2 + 4);
  });
}

function drawCategoryChart(domains) {
  const { ctx, w, h } = getCtx("chart-categories");
  ctx.clearRect(0, 0, w, h);

  const catTotals = {};
  Object.entries(domains).forEach(([, info]) => {
    const cat = info.category || "Other";
    catTotals[cat] = (catTotals[cat] || 0) + (info.time || 0);
  });

  const entries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    ctx.fillStyle = "#666";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data yet", w / 2, h / 2);
    return;
  }

  const cx = w / 2 - 50;
  const cy = h / 2;
  const r = Math.min(cx, cy) - 20;
  const innerR = r * 0.55;
  let angle = -Math.PI / 2;

  entries.forEach(([cat, time]) => {
    const slice = (time / total) * Math.PI * 2;
    const color = Categories.getCategoryColor(cat);

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.arc(cx, cy, innerR, angle + slice, angle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    angle += slice;
  });

  // Legend
  const legendX = w - 120;
  entries.forEach(([cat, time], i) => {
    const y = 30 + i * 22;
    ctx.fillStyle = Categories.getCategoryColor(cat);
    ctx.fillRect(legendX, y - 6, 10, 10);
    ctx.fillStyle = "#ccc";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    const pct = Math.round((time / total) * 100);
    ctx.fillText(`${cat} (${pct}%)`, legendX + 16, y + 3);
  });
}

function drawHourlyChart(hourly) {
  const { ctx, w, h } = getCtx("chart-hourly");
  ctx.clearRect(0, 0, w, h);

  if (!hourly || hourly.length === 0) return;

  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const barW = chartW / 24 - 2;

  const maxVal = Math.max(1, ...hourly.map((h) => h.productive + h.distracted));

  hourly.forEach((hr, i) => {
    const x = padding.left + (i / 24) * chartW + 1;
    const prodH = (hr.productive / maxVal) * chartH;
    const distH = (hr.distracted / maxVal) * chartH;

    // Productive
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(x, padding.top + chartH - prodH - distH, barW, prodH);

    // Distracted
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x, padding.top + chartH - distH, barW, distH);

    // Hour label
    if (i % 3 === 0) {
      ctx.fillStyle = "#666";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(i + ":00", x + barW / 2, h - 10);
    }
  });

  // Legend
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(w - 180, 10, 10, 10);
  ctx.fillStyle = "#ccc";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Productive", w - 166, 19);

  ctx.fillStyle = "#ef4444";
  ctx.fillRect(w - 100, 10, 10, 10);
  ctx.fillStyle = "#ccc";
  ctx.fillText("Distracted", w - 86, 19);
}

function drawWeeklyChart(weekData) {
  const { ctx, w, h } = getCtx("chart-weekly");
  ctx.clearRect(0, 0, w, h);

  if (!weekData || weekData.length === 0) return;

  const days = weekData.slice(0, 7).reverse();
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const groupW = chartW / days.length;
  const barW = groupW * 0.3;

  const maxVal = Math.max(1, ...days.map((d) => (d.data.totalActive || 0)));

  days.forEach((day, i) => {
    const x = padding.left + i * groupW + groupW * 0.15;
    const prod = day.data.focusTime || 0;
    const dist = day.data.distractedTime || 0;
    const prodH = (prod / maxVal) * chartH;
    const distH = (dist / maxVal) * chartH;

    // Productive bar
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - prodH, barW, prodH, 3);
    ctx.fill();

    // Distracted bar
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.roundRect(x + barW + 3, padding.top + chartH - distH, barW, distH, 3);
    ctx.fill();

    // Day label
    const dayName = new Date(day.date).toLocaleDateString("en", { weekday: "short" });
    ctx.fillStyle = "#888";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dayName, x + barW, h - 12);

    // Score
    ctx.fillStyle = "#7c8aff";
    ctx.font = "10px sans-serif";
    ctx.fillText(day.data.score || 0, x + barW, padding.top + chartH - Math.max(prodH, distH) - 6);
  });
}

// ─── Insights ───
async function loadInsights() {
  const insights = await chrome.runtime.sendMessage({ action: "getInsights" });
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });

  const container = document.getElementById("insights-list");
  container.innerHTML = "";

  if (!insights || insights.length === 0) {
    container.innerHTML = '<div class="insight-card info"><div class="insight-text">Not enough data yet</div><div class="insight-detail">Keep browsing and insights will appear as patterns emerge.</div></div>';
  } else {
    insights.forEach((ins) => {
      const card = document.createElement("div");
      card.className = `insight-card ${ins.type}`;
      card.innerHTML = `<div class="insight-text">${ins.text}</div><div class="insight-detail">${ins.detail}</div>`;
      container.appendChild(card);
    });
  }

  // Loops
  const loopsContainer = document.getElementById("loops-list");
  loopsContainer.innerHTML = "";
  const loops = usage.distractionLoops || [];
  if (loops.length === 0) {
    loopsContainer.innerHTML = '<div style="color:#666;font-size:13px;">No distraction loops detected today 👍</div>';
  } else {
    loops.forEach((loop) => {
      const card = document.createElement("div");
      card.className = "loop-card";
      card.innerHTML = `
        <div class="loop-severity ${loop.severity}"></div>
        <span class="loop-time">${loop.time}</span>
        <span class="loop-domains">${loop.domains.join(" → ")}</span>
        <span class="loop-dur">${loop.duration}</span>
      `;
      loopsContainer.appendChild(card);
    });
  }
}

// ─── Sessions ───
async function loadSessions() {
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  const tbody = document.getElementById("sessions-body");
  tbody.innerHTML = "";

  const sessions = usage.focusSessions || [];
  if (sessions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#666;">No focus sessions today</td></tr>';
    return;
  }

  sessions.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.start}</td>
      <td>${s.duration}m</td>
      <td>${s.tasksCompleted}/${s.totalTasks}</td>
      <td>${s.interruptions}</td>
      <td class="status-${s.status}">${s.status === "completed" ? "✅ Completed" : "❌ Failed"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Settings ───
async function loadSettings() {
  const settings = await chrome.runtime.sendMessage({ action: "getSettings" });

  renderBlockedDomains(settings);
  renderLimits(settings);

  document.getElementById("input-focus-duration").value = settings.focusDefaults.duration;
  document.getElementById("input-unlock-focus").value = settings.focusDefaults.unlockRequirements.focusMinutes;
  document.getElementById("input-unlock-tasks").value = settings.focusDefaults.unlockRequirements.tasksRequired;
  document.getElementById("input-unlock-interruptions").value = settings.focusDefaults.unlockRequirements.maxInterruptions;

  // Add block domain
  document.getElementById("btn-add-block").addEventListener("click", async () => {
    const input = document.getElementById("input-block-domain");
    const domain = input.value.trim().replace(/^www\./, "").toLowerCase();
    if (!domain) return;
    await chrome.runtime.sendMessage({ action: "blockDomain", domain });
    input.value = "";
    const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
    renderBlockedDomains(updated);
  });

  // Add limit
  document.getElementById("btn-add-limit").addEventListener("click", async () => {
    const domainInput = document.getElementById("input-limit-domain");
    const minInput = document.getElementById("input-limit-minutes");
    const domain = domainInput.value.trim().replace(/^www\./, "").toLowerCase();
    const minutes = parseInt(minInput.value);
    if (!domain || !minutes) return;
    settings.dailyLimits[domain] = minutes;
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
    domainInput.value = "";
    minInput.value = "";
    renderLimits(settings);
  });

  // Save focus defaults
  document.getElementById("btn-save-settings").addEventListener("click", async () => {
    settings.focusDefaults.duration = parseInt(document.getElementById("input-focus-duration").value) || 25;
    settings.focusDefaults.unlockRequirements.focusMinutes = parseInt(document.getElementById("input-unlock-focus").value) || 10;
    settings.focusDefaults.unlockRequirements.tasksRequired = parseInt(document.getElementById("input-unlock-tasks").value) || 2;
    settings.focusDefaults.unlockRequirements.maxInterruptions = parseInt(document.getElementById("input-unlock-interruptions").value) || 3;
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
    alert("Settings saved!");
  });
}

function renderBlockedDomains(settings) {
  const container = document.getElementById("blocked-list");
  container.innerHTML = "";
  (settings.blockedDomains || []).forEach((d) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerHTML = `${d} <button data-domain="${d}">×</button>`;
    tag.querySelector("button").addEventListener("click", async () => {
      await chrome.runtime.sendMessage({ action: "unblockDomain", domain: d });
      const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
      renderBlockedDomains(updated);
    });
    container.appendChild(tag);
  });
}

function renderLimits(settings) {
  const container = document.getElementById("limits-list");
  container.innerHTML = "";
  Object.entries(settings.dailyLimits || {}).forEach(([domain, mins]) => {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.innerHTML = `${domain}: ${mins}m <button data-domain="${domain}">×</button>`;
    tag.querySelector("button").addEventListener("click", async () => {
      delete settings.dailyLimits[domain];
      await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      renderLimits(settings);
    });
    container.appendChild(tag);
  });
}
