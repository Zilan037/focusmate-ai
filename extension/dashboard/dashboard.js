// dashboard.js — Premium analytics dashboard with sidebar navigation

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupTabs();
  await loadOverview();
  await loadDaily();
  await loadInsights();
  await loadSessions();
  await loadDomains();
  await loadWeekly();
  await loadSettings();
  await loadSidebarStats();
}

// ─── Animated Number ───
function animateNumber(el, target, duration = 600, suffix = "") {
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function formatTime(m) {
  if (!m) return "0h 0m";
  const h = Math.floor(m / 60);
  const mins = Math.round(m % 60);
  return `${h}h ${mins}m`;
}

// ─── Tab Switching ───
function setupTabs() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

// ─── Sidebar Stats ───
async function loadSidebarStats() {
  const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });
  const streak = await chrome.runtime.sendMessage({ action: "getStreak" });
  document.getElementById("sidebar-score").textContent = scoreData.score || 0;
  if (scoreData.label) {
    document.getElementById("sidebar-score").style.color = scoreData.label.color;
  }
  document.getElementById("sidebar-streak").textContent = streak.current || 0;
}

// ─── Overview ───
async function loadOverview() {
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  const streak = await chrome.runtime.sendMessage({ action: "getStreak" });
  const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });
  const weekData = await chrome.runtime.sendMessage({ action: "getWeekUsage" });

  document.getElementById("d-active").textContent = formatTime(usage.totalActive || 0);

  const focusPct = usage.totalActive > 0
    ? Math.round(((usage.focusTime || 0) / usage.totalActive) * 100) : 0;
  document.getElementById("d-focus").textContent = focusPct + "%";

  const score = scoreData.score || 0;
  const scoreEl = document.getElementById("d-score");
  animateNumber(scoreEl, score);
  
  // Score ring
  const ring = document.getElementById("d-score-ring");
  const circumference = 151;
  ring.style.strokeDashoffset = circumference - (score / 100) * circumference;

  if (scoreData.label) {
    scoreEl.style.color = scoreData.label.color;
    const labelEl = document.getElementById("d-score-label");
    labelEl.textContent = scoreData.label.emoji + " " + scoreData.label.label;
    labelEl.style.color = scoreData.label.color;
  }

  document.getElementById("d-streak").textContent = `🔥 ${streak.current || 0}`;

  drawDomainChart(usage.domains || {});
  drawCategoryDonut(usage.domains || {});
  drawHourlyChart(usage.hourlyActivity || []);
  drawWeeklyChart(weekData || []);
}

// ─── Canvas Helpers ───
function getCtx(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width - 40;
  const h = parseInt(canvas.getAttribute("height")) || 280;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return { ctx, w, h };
}

function drawDomainChart(domains) {
  const data = getCtx("chart-domains");
  if (!data) return;
  const { ctx, w, h } = data;
  ctx.clearRect(0, 0, w, h);

  const sorted = Object.entries(domains)
    .sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
    .slice(0, 8);

  if (sorted.length === 0) {
    ctx.fillStyle = "#4A5568";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data yet", w / 2, h / 2);
    return;
  }

  const maxTime = sorted[0][1].time || 1;
  const barH = 28;
  const gap = 10;
  const labelW = 130;
  const chartW = w - labelW - 60;
  const startY = 10;

  sorted.forEach(([domain, info], i) => {
    const y = startY + i * (barH + gap);
    const barW = Math.max(4, (info.time / maxTime) * chartW);
    const color = Categories.getCategoryColor(info.category || "Other");

    // Label
    ctx.fillStyle = "#7A8BA7";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(domain.length > 18 ? domain.slice(0, 18) + "…" : domain, labelW - 12, y + barH / 2 + 4);

    // Bar with gradient
    const grad = ctx.createLinearGradient(labelW, 0, labelW + barW, 0);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + "66");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(labelW, y, barW, barH, 6);
    ctx.fill();

    // Time
    ctx.fillStyle = "#7A8BA7";
    ctx.textAlign = "left";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(Math.round(info.time) + "m", labelW + barW + 10, y + barH / 2 + 4);
  });
}

// ─── SVG Category Donut ───
function drawCategoryDonut(domains) {
  const container = document.getElementById("category-donut");
  if (!container) return;

  const catTotals = {};
  Object.entries(domains).forEach(([, info]) => {
    const cat = info.category || "Other";
    catTotals[cat] = (catTotals[cat] || 0) + (info.time || 0);
  });

  const entries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    container.innerHTML = '<div class="empty-state">No data yet</div>';
    return;
  }

  const r = 70, innerR = 45, cx = 90, cy = 90;
  let html = `<svg width="180" height="180" viewBox="0 0 180 180">`;
  
  let angle = -Math.PI / 2;
  entries.forEach(([cat, time]) => {
    const slice = (time / total) * Math.PI * 2;
    const color = Categories.getCategoryColor(cat);
    
    const x1 = cx + Math.cos(angle) * r;
    const y1 = cy + Math.sin(angle) * r;
    const x2 = cx + Math.cos(angle + slice) * r;
    const y2 = cy + Math.sin(angle + slice) * r;
    const x3 = cx + Math.cos(angle + slice) * innerR;
    const y3 = cy + Math.sin(angle + slice) * innerR;
    const x4 = cx + Math.cos(angle) * innerR;
    const y4 = cy + Math.sin(angle) * innerR;
    const largeArc = slice > Math.PI ? 1 : 0;

    html += `<path d="M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${largeArc},0 ${x4},${y4} Z" fill="${color}" opacity="0.85"/>`;
    angle += slice;
  });
  html += `</svg>`;

  // Legend
  html += `<div style="display:flex;flex-direction:column;gap:6px;margin-left:16px;">`;
  entries.forEach(([cat, time]) => {
    const pct = Math.round((time / total) * 100);
    const color = Categories.getCategoryColor(cat);
    html += `<div style="display:flex;align-items:center;gap:8px;">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
      <span style="font-size:11px;color:#7A8BA7;">${cat} <span style="color:#4A5568;">${pct}%</span></span>
    </div>`;
  });
  html += `</div>`;

  container.innerHTML = html;
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
}

function drawHourlyChart(hourly) {
  const data = getCtx("chart-hourly");
  if (!data) return;
  const { ctx, w, h } = data;
  ctx.clearRect(0, 0, w, h);
  if (!hourly || hourly.length === 0) return;

  const padding = { top: 20, right: 20, bottom: 36, left: 36 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const barW = chartW / 24 - 3;
  const maxVal = Math.max(1, ...hourly.map((h) => h.productive + h.distracted));

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  hourly.forEach((hr, i) => {
    const x = padding.left + (i / 24) * chartW + 1.5;
    const prodH = (hr.productive / maxVal) * chartH;
    const distH = (hr.distracted / maxVal) * chartH;

    // Productive
    const prodGrad = ctx.createLinearGradient(0, padding.top + chartH - prodH - distH, 0, padding.top + chartH);
    prodGrad.addColorStop(0, "#34D399");
    prodGrad.addColorStop(1, "rgba(52,211,153,0.3)");
    ctx.fillStyle = prodGrad;
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - prodH - distH, barW, prodH, [3, 3, 0, 0]);
    ctx.fill();

    // Distracted
    ctx.fillStyle = "rgba(248,113,113,0.6)";
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - distH, barW, distH, [0, 0, 3, 3]);
    ctx.fill();

    // Labels
    if (i % 3 === 0) {
      ctx.fillStyle = "#4A5568";
      ctx.font = "9px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(i + ":00", x + barW / 2, h - 8);
    }
  });
}

function drawWeeklyChart(weekData) {
  const data = getCtx("chart-weekly");
  if (!data) return;
  const { ctx, w, h } = data;
  ctx.clearRect(0, 0, w, h);
  if (!weekData || weekData.length === 0) return;

  const days = weekData.slice(0, 7).reverse();
  const padding = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const groupW = chartW / days.length;
  const barW = groupW * 0.3;
  const maxVal = Math.max(1, ...days.map((d) => d.data.totalActive || 0));

  days.forEach((day, i) => {
    const x = padding.left + i * groupW + groupW * 0.15;
    const prod = day.data.focusTime || 0;
    const dist = day.data.distractedTime || 0;
    const prodH = (prod / maxVal) * chartH;
    const distH = (dist / maxVal) * chartH;

    // Productive
    const prodGrad = ctx.createLinearGradient(0, padding.top + chartH - prodH, 0, padding.top + chartH);
    prodGrad.addColorStop(0, "#5B8CFF");
    prodGrad.addColorStop(1, "rgba(91,140,255,0.2)");
    ctx.fillStyle = prodGrad;
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - prodH, barW, prodH, [4, 4, 0, 0]);
    ctx.fill();

    // Distracted
    ctx.fillStyle = "rgba(248,113,113,0.5)";
    ctx.beginPath();
    ctx.roundRect(x + barW + 4, padding.top + chartH - distH, barW, distH, [4, 4, 0, 0]);
    ctx.fill();

    // Day label
    const dayName = new Date(day.date).toLocaleDateString("en", { weekday: "short" });
    ctx.fillStyle = "#7A8BA7";
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dayName, x + barW, h - 8);

    // Score
    ctx.fillStyle = "#5B8CFF";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText(day.data.score || 0, x + barW, padding.top + chartH - Math.max(prodH, distH) - 8);
  });
}

// ─── Daily ───
async function loadDaily() {
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  
  document.getElementById("daily-active").textContent = formatTime(usage.totalActive || 0);
  document.getElementById("daily-focus").textContent = formatTime(usage.focusTime || 0);
  document.getElementById("daily-distracted").textContent = formatTime(usage.distractedTime || 0);
  document.getElementById("daily-sessions").textContent = (usage.focusSessions || []).length;

  // Heatmap
  const grid = document.getElementById("heatmap-grid");
  grid.innerHTML = "";
  const hourly = usage.hourlyActivity || [];
  const maxHourly = Math.max(1, ...hourly.map(h => h.productive + h.distracted));

  for (let i = 0; i < 24; i++) {
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    cell.dataset.hour = i + ":00";
    const val = hourly[i] ? (hourly[i].productive + hourly[i].distracted) : 0;
    const intensity = val / maxHourly;
    cell.style.background = `rgba(91, 140, 255, ${0.03 + intensity * 0.6})`;
    cell.title = `${i}:00 — ${Math.round(val)}min active`;
    grid.appendChild(cell);
  }
}

// ─── Weekly ───
async function loadWeekly() {
  const weekData = await chrome.runtime.sendMessage({ action: "getWeekUsage" });
  const days = (weekData || []).slice(0, 7).reverse();

  const container = document.getElementById("weekly-patterns");
  if (days.length === 0) {
    container.innerHTML = '<div class="empty-state">Not enough data yet</div>';
    return;
  }

  const scores = days.map(d => d.data.score || 0);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const bestDay = days.reduce((best, d) => (d.data.score || 0) > (best.data.score || 0) ? d : best, days[0]);
  const worstDay = days.reduce((worst, d) => (d.data.score || 0) < (worst.data.score || 0) ? d : worst, days[0]);
  const avgSession = days.reduce((sum, d) => sum + (d.data.focusSessions || []).length, 0) / days.length;

  container.innerHTML = `
    <div class="pattern-card"><span class="pattern-label">Avg Score</span><span class="pattern-value">${avgScore}</span></div>
    <div class="pattern-card"><span class="pattern-label">Best Day</span><span class="pattern-value">${new Date(bestDay.date).toLocaleDateString("en", { weekday: "short" })}</span></div>
    <div class="pattern-card"><span class="pattern-label">Worst Day</span><span class="pattern-value">${new Date(worstDay.date).toLocaleDateString("en", { weekday: "short" })}</span></div>
    <div class="pattern-card"><span class="pattern-label">Avg Sessions/Day</span><span class="pattern-value">${avgSession.toFixed(1)}</span></div>
  `;

  // Weekly detail chart
  const data = getCtx("chart-weekly-detail");
  if (!data) return;
  const { ctx, w, h } = data;
  ctx.clearRect(0, 0, w, h);
  drawWeeklyChart(weekData);
}

// ─── Domains ───
async function loadDomains() {
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
  
  renderDomainsTable(usage.domains || {}, settings);

  // Search
  document.getElementById("domain-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#domains-body tr").forEach(row => {
      row.style.display = row.dataset.domain.includes(q) ? "" : "none";
    });
  });
}

function renderDomainsTable(domains, settings) {
  const tbody = document.getElementById("domains-body");
  tbody.innerHTML = "";

  const sorted = Object.entries(domains).sort((a, b) => (b[1].time || 0) - (a[1].time || 0));
  
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No domain data yet</td></tr>';
    return;
  }

  sorted.forEach(([domain, info]) => {
    const isBlocked = (settings.blockedDomains || []).includes(domain);
    const color = Categories.getCategoryColor(info.category || "Other");
    const tr = document.createElement("tr");
    tr.dataset.domain = domain;
    tr.innerHTML = `
      <td style="font-weight:600;">${domain}</td>
      <td><span class="category-pill" style="background:${color}22;color:${color};border:1px solid ${color}33;">${info.category || "Other"}</span></td>
      <td>${Math.round(info.time || 0)}m</td>
      <td>${info.visits || 0}</td>
      <td><div class="toggle ${isBlocked ? 'active' : ''}" data-domain="${domain}"></div></td>
    `;
    
    tr.querySelector(".toggle").addEventListener("click", async function() {
      const d = this.dataset.domain;
      if (this.classList.contains("active")) {
        await chrome.runtime.sendMessage({ action: "unblockDomain", domain: d });
        this.classList.remove("active");
      } else {
        await chrome.runtime.sendMessage({ action: "blockDomain", domain: d });
        this.classList.add("active");
      }
    });
    
    tbody.appendChild(tr);
  });
}

// ─── Insights ───
async function loadInsights() {
  const insights = await chrome.runtime.sendMessage({ action: "getInsights" });
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });

  const container = document.getElementById("insights-list");
  container.innerHTML = "";

  if (!insights || insights.length === 0) {
    container.innerHTML = '<div class="insight-card glass-card info"><div class="insight-text">Not enough data yet</div><div class="insight-detail">Keep browsing and insights will appear as patterns emerge.</div></div>';
  } else {
    insights.forEach((ins) => {
      const card = document.createElement("div");
      card.className = `insight-card glass-card ${ins.type}`;
      card.innerHTML = `<div class="insight-text">${ins.text}</div><div class="insight-detail">${ins.detail}</div>`;
      container.appendChild(card);
    });
  }

  // Loops
  const loopsContainer = document.getElementById("loops-list");
  loopsContainer.innerHTML = "";
  const loops = usage.distractionLoops || [];
  if (loops.length === 0) {
    loopsContainer.innerHTML = '<div class="empty-state">No distraction loops detected today 👍</div>';
  } else {
    loops.forEach((loop) => {
      const card = document.createElement("div");
      card.className = "loop-card glass-card";
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
  const container = document.getElementById("sessions-grid");
  container.innerHTML = "";

  const sessions = usage.focusSessions || [];
  if (sessions.length === 0) {
    container.innerHTML = '<div class="empty-state">No focus sessions today. Start one from the popup!</div>';
    return;
  }

  sessions.forEach((s) => {
    const card = document.createElement("div");
    card.className = "session-card glass-card";
    const pct = s.duration > 0 ? Math.min(100, (s.duration / 60) * 100) : 0;
    const barColor = s.status === "completed" ? "var(--gradient-success)" : "var(--gradient-danger)";
    card.innerHTML = `
      <span class="session-time">${s.start}</span>
      <div class="session-bar-wrap">
        <div class="session-bar-fill" style="width:${pct}%;background:${barColor};"></div>
      </div>
      <div class="session-meta">
        <span>${s.duration}m</span>
        <span>✓ ${s.tasksCompleted}/${s.totalTasks}</span>
        <span>⚡ ${s.interruptions}</span>
        <span class="session-status status-${s.status}">${s.status === "completed" ? "✓ Done" : "✗ Failed"}</span>
      </div>
    `;
    container.appendChild(card);
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

  document.getElementById("btn-add-block").addEventListener("click", async () => {
    const input = document.getElementById("input-block-domain");
    const domain = input.value.trim().replace(/^www\./, "").toLowerCase();
    if (!domain) return;
    await chrome.runtime.sendMessage({ action: "blockDomain", domain });
    input.value = "";
    const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
    renderBlockedDomains(updated);
  });

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

  document.getElementById("btn-save-settings").addEventListener("click", async () => {
    settings.focusDefaults.duration = parseInt(document.getElementById("input-focus-duration").value) || 25;
    settings.focusDefaults.unlockRequirements.focusMinutes = parseInt(document.getElementById("input-unlock-focus").value) || 10;
    settings.focusDefaults.unlockRequirements.tasksRequired = parseInt(document.getElementById("input-unlock-tasks").value) || 2;
    settings.focusDefaults.unlockRequirements.maxInterruptions = parseInt(document.getElementById("input-unlock-interruptions").value) || 3;
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
    
    const btn = document.getElementById("btn-save-settings");
    btn.textContent = "✓ Saved!";
    btn.style.background = "var(--gradient-success)";
    setTimeout(() => {
      btn.textContent = "Save Settings";
      btn.style.background = "";
    }, 2000);
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
