// dashboard.js — FocusGuard V3 Premium Dashboard

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupTabs();
  setupSidebar();
  setupTheme();
  await loadOverview();
  await loadComparisons();
  await loadComparisonRow();
  await loadTopSites();
  await loadDaily();
  await loadInsights();
  await loadSessions();
  await loadDomains();
  await loadDeepStats();
  await loadBlocklist();
  await loadSettings();
  await loadSidebarStats();
  await loadDailyLimitsUI();
  await loadReports("today");
  setupDataManagement();
  setupQuickActions();
  setupBlocklistActions();
  setupFocusMode();
  setupReportsTab();
  setupDailyLimitsActions();
  setupUnlockModal();
  startAutoRefresh();
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
  if (!m || m <= 0) return "0m";
  if (m < 1) return Math.round(m * 60) + "s";
  const totalMins = Math.floor(m);
  const h = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (h === 0) return `${mins}m`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}m`;
}

// ─── Auto Refresh ───
let lastRefreshTime = Date.now();
function startAutoRefresh() {
  setInterval(() => {
    const elapsed = Math.round((Date.now() - lastRefreshTime) / 1000);
    const el = document.getElementById("last-updated");
    if (el) {
      if (elapsed < 60) el.textContent = `Updated ${elapsed}s ago`;
      else el.textContent = `Updated ${Math.floor(elapsed / 60)}m ago`;
    }
  }, 5000);
}

// ─── Theme ───
function setupTheme() {
  const themeBtn = document.getElementById("btn-theme-dash");
  if (themeBtn) {
    themeBtn.addEventListener("click", async () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      await chrome.runtime.sendMessage({ action: "setTheme", theme: next });
      updateThemeButtons(next);
    });
  }

  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.addEventListener("click", async () => {
      const theme = btn.dataset.theme;
      document.documentElement.setAttribute("data-theme", theme);
      await chrome.runtime.sendMessage({ action: "setTheme", theme });
      updateThemeButtons(theme);
    });
  });

  const current = document.documentElement.getAttribute("data-theme") || "dark";
  updateThemeButtons(current);
}

function updateThemeButtons(theme) {
  document.querySelectorAll(".theme-option").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

// ─── Sidebar ───
function setupSidebar() {
  const collapseBtn = document.getElementById("btn-collapse");
  const layout = document.querySelector(".dashboard-layout");
  
  const collapsed = localStorage.getItem("fg_sidebar_collapsed") === "true";
  if (collapsed) layout.classList.add("collapsed");

  collapseBtn.addEventListener("click", () => {
    layout.classList.toggle("collapsed");
    localStorage.setItem("fg_sidebar_collapsed", layout.classList.contains("collapsed"));
  });
}

// ─── Tab Switching ───
function setupTabs() {
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const tabId = "tab-" + btn.dataset.tab;
      document.getElementById(tabId).classList.add("active");
      
      // Update navbar title
      const label = btn.querySelector(".nav-label").textContent;
      const navTitle = document.getElementById("navbar-title");
      if (navTitle) navTitle.textContent = label;
    });
  });

  // Deep link from hash
  const hash = location.hash.replace("#", "");
  if (hash) {
    const tabBtn = document.querySelector(`[data-tab="${hash}"]`);
    if (tabBtn) tabBtn.click();
  }
}

// ─── Sidebar Stats ───
async function loadSidebarStats() {
  const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });
  const streak = await chrome.runtime.sendMessage({ action: "getStreak" });
  const scoreEl = document.getElementById("sidebar-score");
  scoreEl.textContent = scoreData.score || 0;
  if (scoreData.label) scoreEl.style.color = scoreData.label.color;
  document.getElementById("sidebar-streak").textContent = streak.current || 0;
}

// ─── Comparison Stats ───
async function loadComparisons() {
  try {
    const cmp = await chrome.runtime.sendMessage({ action: "getComparisonStats" });
    setComparison("cmp-active", cmp.active);
    setComparison("cmp-focus", cmp.focus);
  } catch (e) {}
}

function setComparison(id, data) {
  const el = document.getElementById(id);
  if (!el || !data || data.pct === 0) return;
  el.className = `comparison-badge ${data.direction}`;
  el.textContent = `${data.direction === "up" ? "↑" : "↓"} ${data.pct}%`;
}

// ─── Comparison Row (Today vs Yesterday vs Avg) ───
async function loadComparisonRow() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const weekData = await chrome.runtime.sendMessage({ action: "getWeekUsage" });
    const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });
    
    const el = (id) => document.getElementById(id);
    if (el("cmp-today-time")) el("cmp-today-time").textContent = formatTime(usage.totalActive || 0);
    if (el("cmp-today-score")) el("cmp-today-score").textContent = scoreData.score || 0;
    
    if (weekData && weekData.length > 0) {
      const yesterday = weekData[0];
      if (el("cmp-yest-time")) el("cmp-yest-time").textContent = formatTime(yesterday.data.totalActive || 0);
      if (el("cmp-yest-score")) el("cmp-yest-score").textContent = yesterday.data.score || 0;
      
      const days = weekData.slice(0, 7);
      const avgActive = days.reduce((s, d) => s + (d.data.totalActive || 0), 0) / days.length;
      const avgScore = Math.round(days.reduce((s, d) => s + (d.data.score || 0), 0) / days.length);
      if (el("cmp-avg-time")) el("cmp-avg-time").textContent = formatTime(avgActive);
      if (el("cmp-avg-score")) el("cmp-avg-score").textContent = avgScore;
    }
  } catch (e) {}
}

// ─── Top Productive / Distracting Sites ───
async function loadTopSites() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const domains = usage.domains || {};
    
    const productive = Object.entries(domains)
      .filter(([, info]) => ["Development", "Productivity", "Research", "Education"].includes(info.category))
      .sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
      .slice(0, 3);
      
    const distracting = Object.entries(domains)
      .filter(([, info]) => ["Social Media", "Entertainment", "Shopping"].includes(info.category))
      .sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
      .slice(0, 3);
    
    renderTopList("top-productive", productive, "var(--success)");
    renderTopList("top-distracting", distracting, "var(--danger)");
  } catch (e) {}
}

function renderTopList(containerId, entries, color) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const isProductive = containerId === "top-productive";
  const sectionLabel = isProductive ? "PRODUCTIVE" : "DISTRACTING";
  const dotColor = isProductive ? "#10B981" : "#F43F5E";
  
  if (entries.length === 0) {
    container.innerHTML = `<div class="section-header">${sectionLabel}</div><div class="empty-state" style="padding:8px;">No data yet</div>`;
    return;
  }
  
  const totalTime = entries.reduce((s, [, info]) => s + (info.time || 0), 0) || 1;
  
  let html = `<div class="section-header">${sectionLabel}</div>`;
  entries.forEach(([domain, info]) => {
    const pct = Math.round(((info.time || 0) / totalTime) * 100);
    const barColor = isProductive ? "#10B981" : "#F43F5E";
    html += `<div class="cog-asset-item">
      <div class="cog-asset-header">
        <div class="cog-asset-left">
          <span class="cog-asset-dot" style="background:${dotColor}"></span>
          <div>
            <span class="cog-asset-name">${domain}</span>
            <span class="cog-asset-sub">${Math.round(info.time || 0)}m</span>
          </div>
        </div>
        <span class="cog-asset-pct">${pct}%</span>
      </div>
      <div class="cog-asset-bar">
        <div class="cog-asset-fill" style="width:${pct}%;background:${barColor}"></div>
      </div>
    </div>`;
  });
  container.innerHTML = html;
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
  
  const streakVal = document.getElementById("streak-card-value");
  if (streakVal) streakVal.innerHTML = `${streak.current || 0} <span class="streak-card-unit">Days</span>`;
  
  try {
    const goalData = await chrome.runtime.sendMessage({ action: "getGoalProgress" });
    if (goalData) {
      const pct = Math.min(100, Math.round((goalData.current / goalData.goal) * 100));
      const goalFill = document.getElementById("sidebar-goal-fill");
      const goalText = document.getElementById("sidebar-goal-text");
      const goalPct = document.getElementById("sidebar-goal-pct");
      if (goalFill) goalFill.style.width = pct + "%";
      if (goalText) goalText.textContent = `${Math.round(goalData.current)} / ${goalData.goal * 7} Hours`;
      if (goalPct) goalPct.textContent = pct + "%";
    }
  } catch (e) {}

  const hourly = usage.hourlyActivity || [];
  let peakHour = 0, peakVal = 0;
  hourly.forEach((hr, i) => {
    if (hr.productive > peakVal) { peakVal = hr.productive; peakHour = i; }
  });
  if (peakVal > 0) {
    document.getElementById("peak-hour-label").textContent = `Peak: ${peakHour}:00 - ${peakHour + 2}:00`;
  }

  drawDomainChart(usage.domains || {});
  drawCategoryDonut(usage.domains || {});
  drawHourlyChart(usage.hourlyActivity || []);
  drawWeeklyChart(weekData || []);
  drawKpiSparklines(weekData || []);
}

// ─── Quick Actions ───
function setupQuickActions() {
  document.getElementById("btn-quick-focus")?.addEventListener("click", () => {
    document.querySelector('[data-tab="focus"]')?.click();
  });

  document.getElementById("btn-quick-export")?.addEventListener("click", exportAllData);

  document.getElementById("btn-streak-sessions")?.addEventListener("click", () => {
    document.querySelector('[data-tab="sessions"]')?.click();
  });
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

// ─── KPI Sparklines (mini trend charts in overview cards) ───
function drawKpiSparklines(weekData) {
  if (!weekData || weekData.length < 2) return;
  const days = weekData.slice(0, 7).reverse();
  
  drawMiniSparkline("spark-active", days.map(d => d.data.totalActive || 0), "#3B82F6");
  drawMiniSparkline("spark-focus", days.map(d => {
    const total = d.data.totalActive || 1;
    return Math.round(((d.data.focusTime || 0) / total) * 100);
  }), "#10B981");
}

function drawMiniSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || data.length < 2) return;
  const dpr = window.devicePixelRatio || 1;
  const w = 96, h = 48;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  
  const maxVal = Math.max(1, ...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const stepX = w / (data.length - 1);
  const pad = 4;
  
  // Area fill
  ctx.beginPath();
  ctx.moveTo(0, h);
  data.forEach((v, i) => {
    const x = i * stepX;
    const y = pad + ((1 - (v - minVal) / range) * (h - pad * 2));
    ctx.lineTo(x, y);
  });
  ctx.lineTo(w, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, color + "30");
  grad.addColorStop(1, color + "05");
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Line
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * stepX;
    const y = pad + ((1 - (v - minVal) / range) * (h - pad * 2));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();
  
  // End dot
  const lastX = (data.length - 1) * stepX;
  const lastY = pad + ((1 - (data[data.length - 1] - minVal) / range) * (h - pad * 2));
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function getChartColors() {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  return {
    text: isLight ? "#475569" : "#94A3B8",
    textMuted: isLight ? "#94A3B8" : "#64748B",
    gridLine: isLight ? "#F1F5F9" : "#334155",
    barBg: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)",
  };
}

function drawDomainChart(domains) {
  const data = getCtx("chart-domains");
  if (!data) return;
  const { ctx, w, h } = data;
  const colors = getChartColors();
  ctx.clearRect(0, 0, w, h);

  const sorted = Object.entries(domains)
    .sort((a, b) => (b[1].time || 0) - (a[1].time || 0))
    .slice(0, 8);

  if (sorted.length === 0) {
    ctx.fillStyle = colors.textMuted;
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

    ctx.fillStyle = colors.text;
    ctx.font = "700 12px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(domain.length > 18 ? domain.slice(0, 18) + "…" : domain, labelW - 12, y + barH / 2 + 4);

    const grad = ctx.createLinearGradient(labelW, 0, labelW + barW, 0);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + "66");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(labelW, y, barW, barH, 6);
    ctx.fill();

    ctx.fillStyle = colors.text;
    ctx.textAlign = "left";
    ctx.font = "600 12px 'Inter', sans-serif";
    ctx.fillText(Math.round(info.time) + "m", labelW + barW + 10, y + barH / 2 + 4);
  });
}

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
    html += `<path d="M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${largeArc},0 ${x4},${y4} Z" fill="${color}" opacity="0.85"><title>${cat}: ${Math.round(time)}m (${Math.round((time/total)*100)}%)</title></path>`;
    angle += slice;
  });
  html += `</svg>`;

  html += `<div style="display:flex;flex-direction:column;gap:6px;margin-left:16px;">`;
  entries.forEach(([cat, time]) => {
    const pct = Math.round((time / total) * 100);
    const color = Categories.getCategoryColor(cat);
    html += `<div style="display:flex;align-items:center;gap:8px;">
      <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></span>
      <span style="font-size:11px;color:var(--text-secondary);">${cat} <span style="color:var(--text-muted);">${pct}%</span></span>
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
  const colors = getChartColors();
  ctx.clearRect(0, 0, w, h);
  if (!hourly || hourly.length === 0) {
    ctx.fillStyle = colors.textMuted;
    ctx.font = "600 13px 'Inter', sans-serif";
    ctx.fillText("Start browsing to see your activity here", w / 2, h / 2);
    return;
  }
  
  // Check if all values are zero
  const hasData = hourly.some(hr => hr.productive > 0 || hr.distracted > 0);
  if (!hasData) {
    ctx.fillStyle = colors.textMuted;
    ctx.font = "600 13px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No activity recorded yet today", w / 2, h / 2);
    return;
  }

  const padding = { top: 20, right: 20, bottom: 36, left: 36 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const barW = chartW / 24 - 3;
  const maxVal = Math.max(1, ...hourly.map((h) => h.productive + h.distracted));

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.strokeStyle = colors.gridLine;
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

    const prodGrad = ctx.createLinearGradient(0, padding.top + chartH - prodH - distH, 0, padding.top + chartH);
    prodGrad.addColorStop(0, "#34D399");
    prodGrad.addColorStop(1, "rgba(52,211,153,0.3)");
    ctx.fillStyle = prodGrad;
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - prodH - distH, barW, prodH, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "rgba(248,113,113,0.6)";
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - distH, barW, distH, [0, 0, 3, 3]);
    ctx.fill();

    if (i % 3 === 0) {
      ctx.fillStyle = colors.textMuted;
      ctx.font = "700 10px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(i + ":00", x + barW / 2, h - 8);
    }
  });
}

function drawWeeklyChart(weekData) {
  const data = getCtx("chart-weekly");
  if (!data) return;
  const { ctx, w, h } = data;
  const colors = getChartColors();
  ctx.clearRect(0, 0, w, h);
  if (!weekData || weekData.length === 0) {
    ctx.fillStyle = colors.textMuted;
    ctx.font = "600 13px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Not enough data yet — check back after a few days", w / 2, h / 2);
    return;
  }

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

    const prodGrad = ctx.createLinearGradient(0, padding.top + chartH - prodH, 0, padding.top + chartH);
    prodGrad.addColorStop(0, "#5B8CFF");
    prodGrad.addColorStop(1, "rgba(91,140,255,0.2)");
    ctx.fillStyle = prodGrad;
    ctx.beginPath();
    ctx.roundRect(x, padding.top + chartH - prodH, barW, prodH, [4, 4, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "rgba(248,113,113,0.5)";
    ctx.beginPath();
    ctx.roundRect(x + barW + 4, padding.top + chartH - distH, barW, distH, [4, 4, 0, 0]);
    ctx.fill();

    const dayName = new Date(day.date).toLocaleDateString("en", { weekday: "short" });
    ctx.fillStyle = colors.text;
    ctx.font = "700 11px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dayName, x + barW, h - 8);

    ctx.fillStyle = "#2563EB";
    ctx.font = "700 10px 'Inter', sans-serif";
    ctx.fillText(day.data.score || 0, x + barW, padding.top + chartH - Math.max(prodH, distH) - 8);
  });
}

// ─── Deep Stats ───
async function loadDeepStats() {
  try {
    const detailedStats = await chrome.runtime.sendMessage({ action: "getDetailedStats" });
    if (!detailedStats || !detailedStats.days) return;
    
    const days = detailedStats.days;
    const totalHours = Math.round(days.reduce((s, d) => s + (d.totalActive || 0), 0) / 60);
    const totalSessions = days.reduce((s, d) => s + (d.focusSessions || 0), 0);
    const scores = days.map(d => d.score || 0);
    const bestScore = Math.max(...scores, 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    document.getElementById("ds-total-hours").textContent = totalHours + "h";
    document.getElementById("ds-total-sessions").textContent = totalSessions;
    document.getElementById("ds-best-score").textContent = bestScore;
    document.getElementById("ds-avg-score").textContent = avgScore;
    
    draw30DayChart(days);
    renderPeakWindows(detailedStats.peakWindows || []);
  } catch (e) {
    console.error("Deep stats error:", e);
  }
}

function draw30DayChart(days) {
  const data = getCtx("chart-30day");
  if (!data) return;
  const { ctx, w, h } = data;
  const colors = getChartColors();
  ctx.clearRect(0, 0, w, h);
  if (days.length === 0) return;

  const padding = { top: 20, right: 20, bottom: 36, left: 40 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxScore = 100;
  const stepX = chartW / (days.length - 1 || 1);

  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
    
    ctx.fillStyle = colors.textMuted;
    ctx.font = "700 10px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(100 - i * 25, padding.left - 8, y + 3);
  }

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH);
  days.forEach((day, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - ((day.score || 0) / maxScore) * chartH;
    if (i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + (days.length - 1) * stepX, padding.top + chartH);
  ctx.closePath();
  const areaGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  areaGrad.addColorStop(0, "rgba(91,140,255,0.15)");
  areaGrad.addColorStop(1, "rgba(91,140,255,0)");
  ctx.fillStyle = areaGrad;
  ctx.fill();

  ctx.beginPath();
  days.forEach((day, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - ((day.score || 0) / maxScore) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#5B8CFF";
  ctx.lineWidth = 2;
  ctx.stroke();

  days.forEach((day, i) => {
    if (i % 5 === 0 || i === days.length - 1) {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - ((day.score || 0) / maxScore) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#5B8CFF";
      ctx.fill();
    }
  });
}

function renderPeakWindows(windows) {
  const container = document.getElementById("peak-windows");
  if (!windows || windows.length === 0) {
    container.innerHTML = '<div class="empty-state">Not enough data to determine peak windows</div>';
    return;
  }
  container.innerHTML = windows.slice(0, 4).map(w => `
    <div class="peak-window-card glass-card">
      <span class="peak-window-time">${w.start}:00 - ${w.end}:00</span>
      <span class="peak-window-score">${w.avgScore || 0}</span>
      <div class="peak-window-bar">
        <div class="peak-window-fill" style="width:${w.avgScore || 0}%;"></div>
      </div>
    </div>
  `).join("");
}

// ─── Daily ───
async function loadDaily() {
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  
  document.getElementById("daily-active").textContent = formatTime(usage.totalActive || 0);
  document.getElementById("daily-focus").textContent = formatTime(usage.focusTime || 0);
  document.getElementById("daily-distracted").textContent = formatTime(usage.distractedTime || 0);
  document.getElementById("daily-sessions").textContent = (usage.focusSessions || []).length;

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

// ─── Domains ───
let domainShowCount = 20;

async function loadDomains() {
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
  
  renderDomainsTable(usage.domains || {}, settings);

  document.getElementById("domain-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll("#domains-body tr").forEach(row => {
      row.style.display = row.dataset.domain.includes(q) ? "" : "none";
    });
  });

  document.getElementById("btn-export-csv")?.addEventListener("click", () => {
    const domains = usage.domains || {};
    let csv = "Domain,Category,Time (min),Sessions\n";
    Object.entries(domains).forEach(([domain, info]) => {
      csv += `${domain},${info.category || "Other"},${Math.round(info.time || 0)},${info.visits || 0}\n`;
    });
    downloadFile(csv, "focusguard-domains.csv", "text/csv");
  });
}

function renderDomainsTable(domains, settings) {
  const tbody = document.getElementById("domains-body");
  tbody.innerHTML = "";

  const totalTime = Object.values(domains).reduce((s, info) => s + (info.time || 0), 0);
  const sorted = Object.entries(domains).sort((a, b) => (b[1].time || 0) - (a[1].time || 0));
  
  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No domain data yet</td></tr>';
    return;
  }

  const visible = sorted.slice(0, domainShowCount);
  const dailyLimits = settings.dailyLimits || {};
  
  visible.forEach(([domain, info], i) => {
    const isBlocked = (settings.blockedDomains || []).some(b => (typeof b === "string" ? b : b.domain) === domain);
    const color = Categories.getCategoryColor(info.category || "Other");
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    const pctOfTotal = totalTime > 0 ? Math.round((info.time / totalTime) * 100) : 0;
    const limit = dailyLimits[domain];
    const usedMin = Math.round(info.time || 0);
    
    const tr = document.createElement("tr");
    tr.dataset.domain = domain;
    tr.style.animationDelay = `${i * 30}ms`;
    
    let limitCell = '';
    if (limit) {
      const pct = Math.min(100, Math.round((usedMin / limit) * 100));
      const barColor = pct >= 100 ? '#F43F5E' : pct >= 80 ? '#F59E0B' : '#10B981';
      limitCell = `<td class="inline-limit-wrap">
        <span class="inline-limit-value">${limit}m</span>
        <span class="inline-limit-usage"><span class="inline-limit-usage-fill" style="width:${pct}%;background:${barColor};"></span></span>
      </td>`;
    } else {
      limitCell = `<td><button class="inline-limit-btn" data-domain="${domain}">Set</button></td>`;
    }
    
    tr.innerHTML = `
      <td style="font-weight:600;">
        <img class="domain-row-favicon" src="${faviconUrl}" />
        ${domain}
      </td>
      <td><span class="category-pill" style="background:${color}22;color:${color};border:1px solid ${color}33;">${info.category || "Other"}</span></td>
      <td class="number-mono">${usedMin}m</td>
      <td class="number-mono">${pctOfTotal}%</td>
      <td>${info.visits || 0}</td>
      <td><canvas class="sparkline" width="50" height="20" data-domain="${domain}"></canvas></td>
      ${limitCell}
      <td><div class="toggle ${isBlocked ? 'active' : ''}" data-domain="${domain}"></div></td>
    `;
    tr.querySelector(".domain-row-favicon")?.addEventListener("error", function() { this.style.display = "none"; });
    
    // Block toggle
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
    
    // Inline limit setter
    const limitBtn = tr.querySelector(".inline-limit-btn");
    if (limitBtn) {
      limitBtn.addEventListener("click", async function() {
        const d = this.dataset.domain;
        const mins = prompt(`Set daily limit for ${d} (in minutes):`, "60");
        if (mins && !isNaN(parseInt(mins))) {
          const s = await chrome.runtime.sendMessage({ action: "getSettings" });
          s.dailyLimits[d] = parseInt(mins);
          await chrome.runtime.sendMessage({ action: "saveSettings", settings: s });
          const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
          renderDomainsTable(usage.domains || {}, s);
          await loadDailyLimitsUI();
        }
      });
    }
    
    tbody.appendChild(tr);
  });

  const showMoreEl = document.getElementById("domains-show-more");
  if (sorted.length > domainShowCount) {
    showMoreEl.style.display = "flex";
    document.getElementById("btn-show-more-domains").onclick = () => {
      domainShowCount += 20;
      renderDomainsTable(domains, settings);
    };
  } else {
    showMoreEl.style.display = "none";
  }

  loadSparklines();
}

async function loadSparklines() {
  const canvases = document.querySelectorAll(".sparkline");
  for (const canvas of canvases) {
    try {
      const domain = canvas.dataset.domain;
      const history = await chrome.runtime.sendMessage({ action: "getDomainHistory", domain });
      if (history && history.length > 0) {
        drawSparkline(canvas, history);
      }
    } catch (e) {}
  }
}

function drawSparkline(canvas, data) {
  const ctx = canvas.getContext("2d");
  const w = 50, h = 20;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  
  const maxVal = Math.max(1, ...data);
  const stepX = w / (data.length - 1 || 1);
  
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = i * stepX;
    const y = h - (v / maxVal) * (h - 4) - 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#5B8CFF";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ─── Blocklist Management ───
async function loadBlocklist() {
  const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
  renderBlocklistItems(settings);
  await loadScheduledBlocks();
  
  document.getElementById("btn-add-block").addEventListener("click", async () => {
    const input = document.getElementById("input-block-domain");
    const domain = normalizeDomainInput(input.value);
    if (!domain) return;
    await chrome.runtime.sendMessage({ action: "blockDomain", domain });
    input.value = "";
    const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
    renderBlocklistItems(updated);
  });
}

function renderBlocklistItems(settings) {
  const container = document.getElementById("blocklist-items");
  container.innerHTML = "";
  const blocked = settings.blockedDomains || [];
  
  // Separate user domains from system-default domains
  const userDomains = blocked.filter(b => !(typeof b === "object" && b.systemDefault));
  const systemCount = blocked.length - userDomains.length;
  
  document.getElementById("blocklist-count").textContent = `${userDomains.length} user-blocked · ${systemCount} system-protected`;
  
  if (userDomains.length === 0) {
    container.innerHTML = '<div class="empty-state">No custom blocked domains yet. System-protected sites are handled by Safety Shield.</div>';
    return;
  }

  // Only show user-added domains (not system defaults — those are hidden behind Safety Shield)
  userDomains.forEach((entry, i) => {
    const domain = typeof entry === "string" ? entry : entry.domain;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    const dateAdded = (typeof entry === "object" && entry.addedAt) ? new Date(entry.addedAt).toLocaleDateString() : "—";
    const enabled = typeof entry === "object" ? entry.enabled !== false : true;
    const locked = typeof entry === "object" ? entry.locked === true : false;
    
    const item = document.createElement("div");
    item.className = `blocklist-item glass-card fade-up${locked ? ' is-locked' : ''}`;
    item.style.animationDelay = `${i * 40}ms`;
    item.innerHTML = `
      <img class="blocklist-favicon" src="${faviconUrl}" />
      <div class="blocklist-info">
        <span class="blocklist-domain">${domain}</span>
        <span class="blocklist-date">Added ${dateAdded}${locked ? ' · <span class="blocklist-locked-badge">🔒 Locked</span>' : ''}</span>
      </div>
      <button class="blocklist-lock ${locked ? 'locked' : ''}" data-domain="${domain}" title="${locked ? 'Unlock (requires confirmation)' : 'Lock permanently'}">${locked ? '🔒' : '🔓'}</button>
      <div class="toggle ${enabled ? 'active' : ''}" data-domain="${domain}" data-action="toggle"></div>
      <button class="blocklist-delete" data-domain="${domain}" title="Remove">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M8.5 6.5v4M5.5 6.5v4M3.5 4l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
      </button>
    `;
    item.querySelector(".blocklist-favicon")?.addEventListener("error", function() { this.style.display = "none"; });
    
    // Lock/Unlock
    item.querySelector(".blocklist-lock").addEventListener("click", async function() {
      const d = this.dataset.domain;
      if (this.classList.contains("locked")) {
        showUnlockModal(d);
      } else {
        await chrome.runtime.sendMessage({ action: "updateBlockedDomain", domain: d, locked: true });
        const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
        renderBlocklistItems(updated);
      }
    });
    
    item.querySelector("[data-action='toggle']").addEventListener("click", async function() {
      if (locked) return;
      const d = this.dataset.domain;
      this.classList.toggle("active");
      await chrome.runtime.sendMessage({ 
        action: "updateBlockedDomain", 
        domain: d, 
        enabled: this.classList.contains("active") 
      });
    });
    
    item.querySelector(".blocklist-delete").addEventListener("click", async function() {
      if (locked) return;
      const d = this.dataset.domain;
      await chrome.runtime.sendMessage({ action: "unblockDomain", domain: d });
      item.style.transform = "translateX(100%)";
      item.style.opacity = "0";
      setTimeout(async () => {
        const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
        renderBlocklistItems(updated);
      }, 300);
    });
    
    container.appendChild(item);
  });
}

// ─── Unlock Modal ───
let unlockDomain = null;

function setupUnlockModal() {
  document.getElementById("unlock-modal-cancel")?.addEventListener("click", () => {
    document.getElementById("unlock-modal").style.display = "none";
    unlockDomain = null;
  });

  document.getElementById("unlock-modal-input")?.addEventListener("input", (e) => {
    const expected = `UNLOCK ${unlockDomain}`;
    const confirmBtn = document.getElementById("unlock-modal-confirm");
    if (e.target.value === expected) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
    } else {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = "0.5";
    }
  });

  document.getElementById("unlock-modal-confirm")?.addEventListener("click", async () => {
    if (!unlockDomain) return;
    await chrome.runtime.sendMessage({ action: "updateBlockedDomain", domain: unlockDomain, locked: false, forceUnlock: true });
    document.getElementById("unlock-modal").style.display = "none";
    document.getElementById("unlock-modal-input").value = "";
    unlockDomain = null;
    const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
    renderBlocklistItems(updated);
  });
}

function showUnlockModal(domain) {
  // Check if this is a system-default domain — refuse unlock
  chrome.runtime.sendMessage({ action: "getSettings" }).then(settings => {
    const entry = (settings.blockedDomains || []).find(b => (typeof b === "object" ? b.domain : b) === domain);
    if (entry && typeof entry === "object" && entry.systemDefault) {
      alert("This domain is protected by FocusGuard Safety Shield and cannot be unlocked.");
      return;
    }
    unlockDomain = domain;
    document.getElementById("unlock-modal-phrase").textContent = `UNLOCK ${domain}`;
    document.getElementById("unlock-modal-input").value = "";
    document.getElementById("unlock-modal-confirm").disabled = true;
    document.getElementById("unlock-modal-confirm").style.opacity = "0.5";
    document.getElementById("unlock-modal").style.display = "flex";
  });
}

function setupBlocklistActions() {
  document.getElementById("blocklist-search")?.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".blocklist-item").forEach(item => {
      const domain = item.querySelector(".blocklist-domain")?.textContent || "";
      item.style.display = domain.toLowerCase().includes(q) ? "" : "none";
    });
  });

  document.getElementById("btn-enable-all")?.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "toggleAllBlockedDomains", enabled: true });
    const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
    renderBlocklistItems(updated);
  });

  document.getElementById("btn-disable-all")?.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "toggleAllBlockedDomains", enabled: false });
    const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
    renderBlocklistItems(updated);
  });

  document.getElementById("btn-import-blocklist")?.addEventListener("click", () => {
    const domains = prompt("Paste comma-separated domains to import:");
    if (domains) {
      const list = domains.split(",").map(d => d.trim().replace(/^www\./, "").toLowerCase()).filter(Boolean);
      chrome.runtime.sendMessage({ action: "bulkBlockDomains", domains: list }).then(async () => {
        const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
        renderBlocklistItems(updated);
      });
    }
  });

  document.getElementById("btn-export-blocklist")?.addEventListener("click", async () => {
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    const domains = (settings.blockedDomains || []).map(b => typeof b === "string" ? b : b.domain);
    const text = domains.join(", ");
    navigator.clipboard.writeText(text).then(() => alert("Blocklist copied to clipboard!"));
  });

  // Quick Block Categories
  document.querySelectorAll(".quick-cat-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const category = btn.dataset.category;
      btn.disabled = true;
      btn.style.opacity = "0.5";
      const result = await chrome.runtime.sendMessage({ action: "quickBlockCategory", category });
      btn.textContent = `✓ ${result.added || 0} added`;
      btn.style.background = "rgba(16,185,129,0.15)";
      btn.style.color = "var(--success)";
      btn.style.borderColor = "rgba(16,185,129,0.3)";
      setTimeout(async () => {
        const updated = await chrome.runtime.sendMessage({ action: "getSettings" });
        renderBlocklistItems(updated);
      }, 500);
    });
  });

  // Strict Safety Mode toggle
  const safetyToggle = document.getElementById("toggle-strict-safety");
  if (safetyToggle) {
    chrome.runtime.sendMessage({ action: "getSettings" }).then(settings => {
      const isOn = settings.strictSafetyMode !== false;
      safetyToggle.classList.toggle("active", isOn);
    });
    safetyToggle.addEventListener("click", async () => {
      safetyToggle.classList.toggle("active");
      await chrome.runtime.sendMessage({ action: "toggleStrictSafetyMode", enabled: safetyToggle.classList.contains("active") });
    });
  }

  document.getElementById("btn-add-schedule")?.addEventListener("click", async () => {
    const domain = document.getElementById("sched-domain").value.trim();
    const start = document.getElementById("sched-start").value;
    const end = document.getElementById("sched-end").value;
    const days = Array.from(document.querySelectorAll("#schedule-days input:checked")).map(cb => parseInt(cb.value));
    
    if (!domain || !start || !end) return;
    
    await chrome.runtime.sendMessage({
      action: "saveScheduledBlock",
      schedule: { domain, start, end, days, enabled: true }
    });
    
    document.getElementById("sched-domain").value = "";
    await loadScheduledBlocks();
  });
}

async function loadScheduledBlocks() {
  try {
    const result = await chrome.runtime.sendMessage({ action: "getScheduledBlocks" });
    const container = document.getElementById("schedule-list");
    const schedules = result.schedules || [];
    
    if (schedules.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:8px;">No scheduled blocks yet</div>';
      return;
    }
    
    container.innerHTML = schedules.map((s, i) => `
      <div class="schedule-item">
        <span class="schedule-domain">${s.domain}</span>
        <span class="schedule-time">${s.start} - ${s.end}</span>
        <span class="schedule-days-display">${s.days.map(d => ['Su','Mo','Tu','We','Th','Fr','Sa'][d]).join(', ')}</span>
        <button class="blocklist-delete" data-index="${i}">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    `).join("");
    container.querySelectorAll(".blocklist-delete[data-index]").forEach(btn => {
      btn.addEventListener("click", () => deleteSchedule(parseInt(btn.dataset.index)));
    });
  } catch (e) {}
}

// ─── Daily Limits UI (Access Policy) ───
async function loadDailyLimitsUI() {
  const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  renderDailyLimits(settings, usage);
}

function renderDailyLimits(settings, usage) {
  const container = document.getElementById("daily-limits-list");
  if (!container) return;
  const limits = settings.dailyLimits || {};
  const domains = usage.domains || {};

  if (Object.keys(limits).length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:12px;">No daily limits set yet. Add one above!</div>';
    return;
  }

  container.innerHTML = "";
  Object.entries(limits).forEach(([domain, limitMins]) => {
    const usedMins = Math.round(domains[domain]?.time || 0);
    const pct = Math.min(100, Math.round((usedMins / limitMins) * 100));
    const remaining = Math.max(0, limitMins - usedMins);
    const barColor = pct >= 100 ? '#F43F5E' : pct >= 80 ? '#F59E0B' : '#10B981';
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

    const item = document.createElement("div");
    item.className = "daily-limit-item";
    item.innerHTML = `
      <img class="daily-limit-favicon" src="${faviconUrl}" />
      <div class="daily-limit-info">
        <span class="daily-limit-domain">${domain}</span>
        <span class="daily-limit-meta">${usedMins}/${limitMins} min used</span>
      </div>
      <div class="daily-limit-bar-wrap">
        <div class="daily-limit-bar-fill" style="width:${pct}%;background:${barColor};"></div>
      </div>
      <span class="daily-limit-remaining" style="color:${barColor};">${remaining > 0 ? remaining + 'm left' : 'Reached!'}</span>
      <button class="blocklist-delete" data-domain="${domain}" title="Remove limit">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;
    item.querySelector(".daily-limit-favicon")?.addEventListener("error", function() { this.style.display = "none"; });

    item.querySelector(".blocklist-delete").addEventListener("click", async () => {
      delete settings.dailyLimits[domain];
      await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      renderDailyLimits(settings, usage);
    });

    container.appendChild(item);
  });
}

function setupDailyLimitsActions() {
  const selectEl = document.getElementById("select-daily-limit-mins");
  const customInput = document.getElementById("input-daily-limit-custom");
  
  if (selectEl) {
    selectEl.addEventListener("change", () => {
      customInput.style.display = selectEl.value === "custom" ? "block" : "none";
    });
  }

  document.getElementById("btn-add-daily-limit")?.addEventListener("click", async () => {
    const domainInput = document.getElementById("input-daily-limit-domain");
    const domain = domainInput.value.trim().replace(/^www\./, "").toLowerCase();
    if (!domain) return;

    let mins;
    if (selectEl.value === "custom") {
      mins = parseInt(customInput.value);
    } else {
      mins = parseInt(selectEl.value);
    }
    if (!mins || mins < 1) return;

    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    settings.dailyLimits[domain] = mins;
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
    domainInput.value = "";
    customInput.value = "";
    await loadDailyLimitsUI();
  });
}

// ─── Reports Tab ───
function setupReportsTab() {
  document.querySelectorAll(".report-range-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".report-range-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      loadReports(btn.dataset.range);
    });
  });
}

async function loadReports(range) {
  let nDays = 1;
  if (range === "week") nDays = 7;
  else if (range === "month") nDays = 30;
  else if (range === "year") nDays = 365;
  else if (range === "all") nDays = -1; // special: all time

  try {
    let data;
    if (nDays === -1) {
      data = await chrome.runtime.sendMessage({ action: "getAllUsage" });
      nDays = Math.max(1, (Array.isArray(data) ? data.length : 1));
    } else if (nDays === 1) {
      data = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    } else {
      data = await chrome.runtime.sendMessage({ action: "getMonthUsage", days: nDays });
    }
    
    let allDomains = {};
    let totalActive = 0;
    let totalBlocked = 0;
    let totalFocus = 0;
    let totalDistracted = 0;
    let dayTrend = [];

    if (nDays === 1) {
      allDomains = data.domains || {};
      totalActive = data.totalActive || 0;
      totalBlocked = data.blockBypasses || 0;
      totalFocus = data.focusTime || 0;
      totalDistracted = data.distractedTime || 0;
    } else {
      const daysData = Array.isArray(data) ? data : (data.days || []);
      daysData.slice(0, nDays).forEach(day => {
        const d = day.data || day;
        totalActive += d.totalActive || 0;
        totalBlocked += d.blockBypasses || 0;
        totalFocus += d.focusTime || 0;
        totalDistracted += d.distractedTime || 0;
        dayTrend.push({ 
          date: day.date || '', 
          focus: d.focusTime || 0, 
          distracted: d.distractedTime || 0,
          active: d.totalActive || 0
        });
        Object.entries(d.domains || {}).forEach(([domain, info]) => {
          if (!allDomains[domain]) allDomains[domain] = { time: 0, category: info.category || "Other", visits: 0 };
          allDomains[domain].time += info.time || 0;
          allDomains[domain].visits += info.visits || 0;
        });
      });
    }

    const sitesVisited = Object.keys(allDomains).length;
    
    // Category totals
    const catTotals = {};
    Object.entries(allDomains).forEach(([, info]) => {
      const cat = info.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + (info.time || 0);
    });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    // Update summary cards
    document.getElementById("report-sites-visited").textContent = sitesVisited;
    document.getElementById("report-total-time").textContent = formatTime(totalActive);
    document.getElementById("report-top-category").textContent = topCat ? topCat[0] : "—";
    document.getElementById("report-blocked").textContent = totalBlocked;

    // Focus ratio
    const focusRatio = totalActive > 0 ? Math.round((totalFocus / totalActive) * 100) : 0;
    const focusRatioEl = document.getElementById("report-focus-ratio");
    if (focusRatioEl) {
      focusRatioEl.textContent = focusRatio + "%";
      focusRatioEl.style.color = focusRatio >= 60 ? "var(--success)" : focusRatio >= 30 ? "var(--warning)" : "var(--danger)";
    }

    // Avg daily usage
    const actualDays = Math.max(1, nDays);
    const avgDailyEl = document.getElementById("report-avg-daily");
    if (avgDailyEl) avgDailyEl.textContent = formatTime(totalActive / actualDays);

    // Draw productivity trend chart
    if (dayTrend.length > 1) {
      drawReportTrendChart(dayTrend);
    } else {
      const trendCanvas = document.getElementById("report-trend-chart");
      if (trendCanvas) {
        const tCtx = trendCanvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const rect = trendCanvas.parentElement.getBoundingClientRect();
        const tw = rect.width - 40;
        trendCanvas.width = tw * dpr;
        trendCanvas.height = 220 * dpr;
        trendCanvas.style.width = tw + "px";
        trendCanvas.style.height = "220px";
        tCtx.scale(dpr, dpr);
        tCtx.fillStyle = getChartColors().textMuted;
        tCtx.font = "600 13px 'Inter', sans-serif";
        tCtx.textAlign = "center";
        tCtx.fillText("Select a multi-day range to see trends", tw / 2, 110);
      }
    }

    // Category breakdown
    const catContainer = document.getElementById("report-category-breakdown");
    const catEntries = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const maxCatTime = catEntries.length > 0 ? catEntries[0][1] : 1;

    if (catEntries.length === 0) {
      catContainer.innerHTML = '<div class="empty-state">No data for this period</div>';
    } else {
      catContainer.innerHTML = catEntries.map(([cat, time]) => {
        const pct = Math.round((time / maxCatTime) * 100);
        const color = Categories.getCategoryColor(cat);
        const siteCount = Object.values(allDomains).filter(d => d.category === cat).length;
        return `<div class="report-cat-row">
          <span class="report-cat-label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:8px;"></span>${cat}</span>
          <div class="report-cat-bar-wrap"><div class="report-cat-bar-fill" style="width:${pct}%;background:${color};"></div></div>
          <span class="report-cat-stats">${formatTime(time)} · ${siteCount} sites</span>
        </div>`;
      }).join("");
    }

    // Top 10 sites
    const topSites = Object.entries(allDomains).sort((a, b) => (b[1].time || 0) - (a[1].time || 0)).slice(0, 10);
    const topSitesBody = document.getElementById("report-top-sites");
    
    if (topSites.length === 0) {
      topSitesBody.innerHTML = '<tr><td colspan="5" class="empty-state">No data for this period</td></tr>';
    } else {
      topSitesBody.innerHTML = topSites.map(([domain, info]) => {
        const color = Categories.getCategoryColor(info.category || "Other");
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
        const dailyAvg = formatTime((info.time || 0) / actualDays);
        return `<tr>
          <td style="font-weight:600;"><img class="domain-row-favicon" src="${faviconUrl}" />${domain}</td>
          <td><span class="category-pill" style="background:${color}22;color:${color};border:1px solid ${color}33;">${info.category || "Other"}</span></td>
          <td class="number-mono">${formatTime(info.time || 0)}</td>
          <td>${info.visits || 0}</td>
          <td class="number-mono">${dailyAvg}</td>
        </tr>`;
      }).join("");
    }
    topSitesBody.querySelectorAll(".domain-row-favicon").forEach(img => img.addEventListener("error", function() { this.style.display = "none"; }));
  } catch (e) {
    console.error("Reports error:", e);
  }
}

// ─── Report Trend Chart ───
function drawReportTrendChart(dayTrend) {
  const canvas = document.getElementById("report-trend-chart");
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width - 40;
  const h = 220;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const colors = getChartColors();
  const padding = { top: 20, right: 20, bottom: 36, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const maxVal = Math.max(1, ...dayTrend.map(d => Math.max(d.focus, d.distracted)));
  const stepX = chartW / (dayTrend.length - 1 || 1);

  // Grid
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // Focus area fill
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH);
  dayTrend.forEach((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - (d.focus / maxVal) * chartH;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + (dayTrend.length - 1) * stepX, padding.top + chartH);
  ctx.closePath();
  const focusGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  focusGrad.addColorStop(0, "rgba(16,185,129,0.2)");
  focusGrad.addColorStop(1, "rgba(16,185,129,0)");
  ctx.fillStyle = focusGrad;
  ctx.fill();

  // Focus line
  ctx.beginPath();
  dayTrend.forEach((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - (d.focus / maxVal) * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Distraction line
  ctx.beginPath();
  dayTrend.forEach((d, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - (d.distracted / maxVal) * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = "#F43F5E";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Labels
  const labelInterval = Math.max(1, Math.floor(dayTrend.length / 7));
  dayTrend.forEach((d, i) => {
    if (i % labelInterval === 0 || i === dayTrend.length - 1) {
      const x = padding.left + i * stepX;
      ctx.fillStyle = colors.textMuted;
      ctx.font = "600 10px 'Inter', sans-serif";
      ctx.textAlign = "center";
      const label = d.date ? new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }) : "";
      ctx.fillText(label, x, h - 8);
    }
  });

  // Legend
  ctx.fillStyle = "#10B981";
  ctx.fillRect(padding.left, 4, 12, 3);
  ctx.fillStyle = colors.text;
  ctx.font = "600 10px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Focus", padding.left + 16, 8);

  ctx.fillStyle = "#F43F5E";
  ctx.fillRect(padding.left + 70, 4, 12, 3);
  ctx.fillStyle = colors.text;
  ctx.fillText("Distracted", padding.left + 86, 8);
}

// ─── Insights ───
async function loadInsights() {
  const insights = await chrome.runtime.sendMessage({ action: "getInsights" });
  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });

  const container = document.getElementById("insights-list");
  container.innerHTML = "";

  const insightIcons = { warning: "⚠️", productive: "🎯", info: "💡" };

  if (!insights || insights.length === 0) {
    container.innerHTML = '<div class="insight-card glass-card info"><div class="insight-text">Not enough data yet</div><div class="insight-detail">Keep browsing and insights will appear as patterns emerge.</div></div>';
  } else {
    insights.forEach((ins, i) => {
      const card = document.createElement("div");
      card.className = `insight-card glass-card ${ins.type} fade-up`;
      card.style.animationDelay = `${i * 80}ms`;
      const icon = insightIcons[ins.type] || "💡";
      card.innerHTML = `<span class="insight-icon-wrap">${icon}</span><div class="insight-text">${ins.text}</div><div class="insight-detail">${ins.detail}</div>`;
      container.appendChild(card);
    });
  }

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
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-title">No focus sessions today</div>
        <div>Start one from the popup to build your streak!</div>
      </div>
    `;
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

  renderLimits(settings);

  document.getElementById("input-focus-duration").value = settings.focusDefaults?.duration || 25;
  document.getElementById("input-unlock-focus").value = settings.focusDefaults?.unlockRequirements?.focusMinutes || 10;
  document.getElementById("input-unlock-tasks").value = settings.focusDefaults?.unlockRequirements?.tasksRequired || 2;
  document.getElementById("input-unlock-interruptions").value = settings.focusDefaults?.unlockRequirements?.maxInterruptions || 3;

  try {
    const goalData = await chrome.runtime.sendMessage({ action: "getDailyGoal" });
    document.getElementById("input-daily-goal").value = goalData?.goal || 4;
  } catch (e) {}

  const notifKeys = ["notifyFocusComplete", "notifyLimitWarning", "notifyDistractionLoop"];
  notifKeys.forEach(key => {
    const toggle = document.querySelector(`[data-key="${key}"]`);
    if (toggle) {
      const val = settings[key] !== false;
      toggle.classList.toggle("active", val);
      toggle.addEventListener("click", async function() {
        this.classList.toggle("active");
        settings[key] = this.classList.contains("active");
        await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      });
    }
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
    await loadDailyLimitsUI();
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

  document.getElementById("btn-save-goal")?.addEventListener("click", async () => {
    const goal = parseInt(document.getElementById("input-daily-goal").value) || 4;
    await chrome.runtime.sendMessage({ action: "setDailyGoal", goal });
    const btn = document.getElementById("btn-save-goal");
    btn.textContent = "✓";
    setTimeout(() => { btn.textContent = "Save"; }, 1500);
  });
}

function renderLimits(settings) {
  const container = document.getElementById("limits-list");
  container.innerHTML = "";
  Object.entries(settings.dailyLimits || {}).forEach(([domain, mins]) => {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    const card = document.createElement("div");
    card.className = "limit-card";
    card.innerHTML = `
      <img class="limit-favicon" src="${faviconUrl}" />
      <span class="limit-domain">${domain}</span>
      <span class="limit-value">${mins}m</span>
      <button class="blocklist-delete" data-domain="${domain}">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;
    card.querySelector(".limit-favicon")?.addEventListener("error", function() { this.style.display = "none"; });
    card.querySelector(".blocklist-delete").addEventListener("click", async () => {
      delete settings.dailyLimits[domain];
      await chrome.runtime.sendMessage({ action: "saveSettings", settings });
      renderLimits(settings);
      await loadDailyLimitsUI();
    });
    container.appendChild(card);
  });
}

// ─── Data Management ───
function setupDataManagement() {
  document.getElementById("btn-export-data")?.addEventListener("click", exportAllData);

  document.getElementById("input-import-data")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await chrome.runtime.sendMessage({ action: "importData", data });
      alert("Data imported successfully! Refreshing...");
      location.reload();
    } catch (err) {
      alert("Failed to import data: " + err.message);
    }
  });

  document.getElementById("btn-clear-data")?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear ALL data? This cannot be undone.")) {
      await chrome.storage.local.clear();
      alert("All data cleared. Refreshing...");
      location.reload();
    }
  });
}

// ─── Focus Mode ───
let focusTasks = [];
let focusBlockedSites = [];
let focusAllowedSites = [];
let focusDuration = 25;
let focusTimerInterval = null;
let focusAccessMode = "block"; // "block" or "allow"

function setupFocusMode() {
  // Duration pills
  document.querySelectorAll(".focus-dur-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".focus-dur-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      focusDuration = parseInt(btn.dataset.dur);
    });
  });

  // Tasks
  document.getElementById("btn-add-focus-task")?.addEventListener("click", addFocusTask);
  document.getElementById("focus-task-input")?.addEventListener("keydown", e => { if (e.key === "Enter") addFocusTask(); });

  // Mode Selector
  document.querySelectorAll(".focus-mode-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".focus-mode-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      focusAccessMode = card.dataset.mode;
      
      const blockPanel = document.getElementById("focus-block-panel");
      const allowPanel = document.getElementById("focus-allow-panel");
      
      if (focusAccessMode === "block") {
        blockPanel.style.display = "block";
        allowPanel.style.display = "none";
      } else {
        blockPanel.style.display = "none";
        allowPanel.style.display = "block";
      }
    });
  });

  // Block/Allow sites
  document.getElementById("btn-add-focus-block")?.addEventListener("click", () => addFocusSite("block"));
  document.getElementById("focus-block-input")?.addEventListener("keydown", e => { if (e.key === "Enter") addFocusSite("block"); });
  document.getElementById("btn-add-focus-allow")?.addEventListener("click", () => addFocusSite("allow"));
  document.getElementById("focus-allow-input")?.addEventListener("keydown", e => { if (e.key === "Enter") addFocusSite("allow"); });

  // Deploy
  document.getElementById("btn-deploy-focus")?.addEventListener("click", deployFocus);

  // Pause/Stop
  document.getElementById("btn-pause-focus")?.addEventListener("click", pauseFocus);
  document.getElementById("btn-stop-focus")?.addEventListener("click", stopFocus);

  // Load pre-blocked sites
  loadFocusBlockedSites();

  // Check if already active
  checkFocusPhase();
}

async function loadFocusBlockedSites() {
  try {
    // Don't auto-populate with system-default domains — start clean
    // Only load user-blocked domains (non-system) for convenience
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    focusBlockedSites = (settings.blockedDomains || [])
      .filter(b => !(typeof b === "object" && b.systemDefault))
      .map(b => typeof b === "string" ? b : b.domain);
    renderFocusSitePills();
  } catch (e) {}
}

function addFocusTask() {
  const input = document.getElementById("focus-task-input");
  const text = input.value.trim();
  if (!text) return;
  focusTasks.push(text);
  input.value = "";
  renderFocusTasks();
}

function renderFocusTasks() {
  const container = document.getElementById("focus-task-list");
  container.innerHTML = "";
  focusTasks.forEach((task, i) => {
    const item = document.createElement("div");
    item.className = "focus-task-setup-item";
    item.innerHTML = `<span>${task}</span><button class="focus-task-remove" data-idx="${i}">✕</button>`;
    item.querySelector("button").addEventListener("click", () => {
      focusTasks.splice(i, 1);
      renderFocusTasks();
    });
    container.appendChild(item);
  });
}

function addFocusSite(type) {
  const inputId = type === "block" ? "focus-block-input" : "focus-allow-input";
  const input = document.getElementById(inputId);
  const domain = normalizeDomainInput(input.value);
  if (!domain) return;
  if (type === "block" && !focusBlockedSites.includes(domain)) {
    focusBlockedSites.push(domain);
  } else if (type === "allow" && !focusAllowedSites.includes(domain)) {
    focusAllowedSites.push(domain);
  }
  input.value = "";
  renderFocusSitePills();
}

function renderFocusSitePills() {
  const blockContainer = document.getElementById("focus-block-list");
  const allowContainer = document.getElementById("focus-allow-list");
  if (blockContainer) {
    blockContainer.innerHTML = focusBlockedSites.map((s, i) =>
      `<span class="focus-site-pill danger"><span>${s}</span><button data-idx="${i}" data-type="block">✕</button></span>`
    ).join("");
    blockContainer.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        focusBlockedSites.splice(parseInt(btn.dataset.idx), 1);
        renderFocusSitePills();
      });
    });
  }
  if (allowContainer) {
    allowContainer.innerHTML = focusAllowedSites.map((s, i) =>
      `<span class="focus-site-pill success"><span>${s}</span><button data-idx="${i}" data-type="allow">✕</button></span>`
    ).join("");
    allowContainer.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        focusAllowedSites.splice(parseInt(btn.dataset.idx), 1);
        renderFocusSitePills();
      });
    });
  }
}

async function deployFocus() {
  await chrome.runtime.sendMessage({
    action: "startFocus",
    duration: focusDuration,
    tasks: focusTasks,
    blockedSites: focusAccessMode === "block" ? focusBlockedSites : [],
    allowedSites: focusAccessMode === "allow" ? focusAllowedSites : [],
  });
  checkFocusPhase();
}

async function checkFocusPhase() {
  const state = await chrome.runtime.sendMessage({ action: "getFocusState" });
  const setupEl = document.getElementById("focus-setup");
  const activeEl = document.getElementById("focus-active");

  if (state.active) {
    setupEl.style.display = "none";
    activeEl.style.display = "block";
    startFocusTimer(state);
  } else {
    setupEl.style.display = "block";
    activeEl.style.display = "none";
    if (focusTimerInterval) clearInterval(focusTimerInterval);
  }
}

function startFocusTimer(state) {
  if (focusTimerInterval) clearInterval(focusTimerInterval);

  function updateTimer() {
    chrome.runtime.sendMessage({ action: "getFocusState" }).then(s => {
      if (!s.active) {
        clearInterval(focusTimerInterval);
        checkFocusPhase();
        return;
      }
      const remaining = s.remaining || 0;
      const duration = s.duration || 25;
      const elapsed = duration - remaining;
      const mins = Math.floor(remaining);
      const secs = Math.round((remaining % 1) * 60);
      document.getElementById("focus-timer-value").textContent =
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      const circumference = 565;
      const pct = duration > 0 ? remaining / duration : 0;
      document.getElementById("focus-ring-progress").style.strokeDashoffset = circumference * (1 - pct);

      document.getElementById("focus-elapsed").textContent = elapsed + "m";
      document.getElementById("focus-interruptions").textContent = s.interruptions || 0;

      const label = document.getElementById("focus-timer-label");
      if (s.paused) { label.textContent = "Paused"; label.style.color = "var(--warning)"; }
      else { label.textContent = "Remaining"; label.style.color = ""; }

      const pauseBtn = document.getElementById("btn-pause-focus");
      pauseBtn.textContent = s.paused ? "▶ Resume" : "⏸ Pause";

      const taskContainer = document.getElementById("focus-active-tasks");
      taskContainer.innerHTML = "";
      let doneCount = 0;
      (s.tasks || []).forEach((task, i) => {
        if (task.done) doneCount++;
        const item = document.createElement("label");
        item.className = "focus-active-task-item" + (task.done ? " done" : "");
        item.innerHTML = `<div class="focus-active-check ${task.done ? "checked" : ""}"><span>${task.done ? "✓" : ""}</span></div><span>${task.text}</span>`;
        item.addEventListener("click", async () => {
          await chrome.runtime.sendMessage({ action: "toggleTask", taskIndex: i });
        });
        taskContainer.appendChild(item);
      });
      document.getElementById("focus-active-task-count").textContent = `${doneCount}/${(s.tasks || []).length} completed`;
      document.getElementById("focus-tasks-done").textContent = `${doneCount}/${(s.tasks || []).length}`;
    });
  }

  updateTimer();
  focusTimerInterval = setInterval(updateTimer, 1000);
}

async function pauseFocus() {
  await chrome.runtime.sendMessage({ action: "pauseFocus" });
}

async function stopFocus() {
  if (confirm("Stop focus session early?")) {
    await chrome.runtime.sendMessage({ action: "stopFocus" });
    checkFocusPhase();
  }
}

async function exportAllData() {
  const result = await chrome.runtime.sendMessage({ action: "exportData" });
  if (result.data) {
    const json = JSON.stringify(result.data, null, 2);
    downloadFile(json, "focusguard-backup.json", "application/json");
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
