// dashboard.js — FocusGuard V3 Premium Dashboard

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Setup synchronous UI first — wrap each in try/catch to prevent cascading failures
  const safeSetup = (fn, name) => { try { fn(); } catch (e) { console.warn(`[FocusGuard] ${name} error:`, e); } };
  
  safeSetup(setupTabs, "setupTabs");
  safeSetup(setupSidebar, "setupSidebar");
  safeSetup(setupTheme, "setupTheme");
  safeSetup(setupDataManagement, "setupDataManagement");
  safeSetup(setupQuickActions, "setupQuickActions");
  safeSetup(setupBlocklistActions, "setupBlocklistActions");
  safeSetup(setupFocusMode, "setupFocusMode");
  safeSetup(setupReportsTab, "setupReportsTab");
  safeSetup(setupDailyLimitsActions, "setupDailyLimitsActions");
  safeSetup(setupUnlockModal, "setupUnlockModal");
  safeSetup(setupSiteDeepDive, "setupSiteDeepDive");
  safeSetup(setupReportGenerator, "setupReportGenerator");
  safeSetup(setupAIConfig, "setupAIConfig");
  safeSetup(setupScheduleGrid, "setupScheduleGrid");
  safeSetup(setupAutoDeployToggle, "setupAutoDeployToggle");
  safeSetup(setupWindDown, "setupWindDown");
  startAutoRefresh();

  // Load async data — wrap each in try/catch so failures don't cascade
  const safeLoad = async (fn) => { try { await fn(); } catch (e) { console.warn("Init load error:", e); } };
  await safeLoad(loadOverview);
  await safeLoad(loadComparisons);
  await safeLoad(loadComparisonRow);
  await safeLoad(loadComparisonCards);
  await safeLoad(loadTopSites);
  await safeLoad(loadDaily);
  await safeLoad(loadInsights);
  await safeLoad(loadSessions);
  await safeLoad(loadSessionTimeline);
  await safeLoad(loadSessionAnalytics);
  await safeLoad(loadDomains);
  await safeLoad(loadDeepStats);
  await safeLoad(loadBlocklist);
  await safeLoad(loadSettings);
  await safeLoad(loadPresetConfig);
  await safeLoad(loadSidebarStats);
  await safeLoad(() => loadDailyLimitsUI());
  await safeLoad(() => loadReports("today"));
  await safeLoad(load365Heatmap);
  await safeLoad(load7x24Grid);
  await safeLoad(loadAchievements);
  await safeLoad(drawCategoryFlow);
  await safeLoad(drawCategorySankey);
  await safeLoad(loadScheduleData);
  startLiveRefresh();
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
  const navItems = document.querySelectorAll(".nav-item");
  console.log("[FocusGuard] Setting up tabs, found", navItems.length, "nav items");
  
  navItems.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("[FocusGuard] Tab clicked:", btn.dataset.tab);
      
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const tabId = "tab-" + btn.dataset.tab;
      const tabEl = document.getElementById(tabId);
      if (tabEl) {
        tabEl.classList.add("active");
      } else {
        console.warn("[FocusGuard] Tab content not found:", tabId);
      }
      
      // Update navbar title
      const label = btn.querySelector(".nav-label");
      const navTitle = document.getElementById("navbar-title");
      if (navTitle && label) navTitle.textContent = label.textContent;
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
    const isBlocked = (settings.blockedDomains || []).some(b => b && (typeof b === "string" ? b : b.domain) === domain);
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
    const domains = (settings.blockedDomains || []).filter(b => b).map(b => typeof b === "string" ? b : b.domain);
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

  // Add AI-powered insight (non-blocking)
  generateAIInsight(usage).then(aiText => {
    if (aiText) {
      const aiCard = document.createElement("div");
      aiCard.className = "insight-card glass-card info fade-up";
      aiCard.innerHTML = `<span class="insight-icon-wrap">🧠</span><div class="insight-text">AI Analysis</div><div class="insight-detail">${aiText}</div>`;
      container.prepend(aiCard);
    }
  }).catch(() => {});

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
      .filter(b => b && !(typeof b === "object" && b.systemDefault))
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

// ═══════════════════════════════════════════════════════════════
// ─── 365-Day GitHub-Style Activity Heatmap ───
// ═══════════════════════════════════════════════════════════════

async function load365Heatmap() {
  try {
    const allData = await chrome.runtime.sendMessage({ action: "getAllUsage" });
    const grid = document.getElementById("heatmap-365-grid");
    const monthsEl = document.getElementById("heatmap-365-months");
    const statsEl = document.getElementById("heatmap-365-stats");
    if (!grid) return;

    // Build date map for last 365 days
    const dateMap = {};
    if (Array.isArray(allData)) {
      allData.forEach(d => { dateMap[d.date] = d.data; });
    }

    const today = new Date();
    const cells = [];
    let totalActive = 0;
    let activeDays = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let maxMinutes = 0;

    // Go back 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const dayData = dateMap[key];
      const minutes = dayData ? (dayData.totalActive || 0) : 0;
      if (minutes > maxMinutes) maxMinutes = minutes;
      totalActive += minutes;
      if (minutes > 5) {
        activeDays++;
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
      cells.push({ date: key, minutes, day: d.getDay() });
    }

    // Pad start to align with weekday grid (start on Sunday)
    const firstDayOfWeek = cells[0].day;
    const padCells = firstDayOfWeek;

    grid.innerHTML = "";
    // Add padding cells
    for (let i = 0; i < padCells; i++) {
      const cell = document.createElement("div");
      cell.style.width = "12px";
      cell.style.height = "12px";
      cell.style.visibility = "hidden";
      grid.appendChild(cell);
    }

    // Add real cells
    const maxVal = maxMinutes || 1;
    cells.forEach(c => {
      const cell = document.createElement("div");
      cell.className = "heatmap-365-cell";
      const intensity = Math.min(1, c.minutes / maxVal);
      cell.style.opacity = c.minutes > 0 ? (0.15 + intensity * 0.85) : 0.06;
      cell.title = `${c.date}: ${formatTime(c.minutes)}`;
      grid.appendChild(cell);
    });

    // Month labels
    if (monthsEl) {
      const months = [];
      let lastMonth = -1;
      cells.forEach((c, i) => {
        const m = new Date(c.date).getMonth();
        if (m !== lastMonth) {
          months.push({ name: new Date(c.date).toLocaleDateString("en", { month: "short" }), index: i });
          lastMonth = m;
        }
      });
      monthsEl.innerHTML = months.map(m => `<span>${m.name}</span>`).join("");
    }

    // Stats
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="heatmap-365-stat">
          <span class="heatmap-365-stat-value">${formatTime(totalActive)}</span>
          <span class="heatmap-365-stat-label">Total Tracked</span>
        </div>
        <div class="heatmap-365-stat">
          <span class="heatmap-365-stat-value">${activeDays}</span>
          <span class="heatmap-365-stat-label">Active Days</span>
        </div>
        <div class="heatmap-365-stat">
          <span class="heatmap-365-stat-value">${longestStreak}</span>
          <span class="heatmap-365-stat-label">Longest Streak</span>
        </div>
        <div class="heatmap-365-stat">
          <span class="heatmap-365-stat-value">${activeDays > 0 ? formatTime(totalActive / activeDays) : "0m"}</span>
          <span class="heatmap-365-stat-label">Daily Average</span>
        </div>
      `;
    }
  } catch (e) {
    console.error("365 heatmap error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── 7-Day × 24-Hour Productivity Heatmap ───
// ═══════════════════════════════════════════════════════════════

async function load7x24Grid() {
  try {
    const weekData = await chrome.runtime.sendMessage({ action: "getWeekUsage" });
    const grid = document.getElementById("hourly-7x24-grid");
    const daysEl = document.getElementById("hourly-grid-days");
    const hoursEl = document.getElementById("hourly-grid-hours");
    if (!grid) return;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date().getDay();

    // Build 7×24 matrix (rows = days, cols = hours)
    const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
    let maxVal = 0;

    if (weekData && weekData.length > 0) {
      weekData.slice(0, 7).forEach(day => {
        const d = new Date(day.date);
        const dayOfWeek = d.getDay();
        const hourly = day.data.hourlyActivity || [];
        hourly.forEach((h, i) => {
          const productive = h.productive || 0;
          matrix[dayOfWeek][i] = productive;
          if (productive > maxVal) maxVal = productive;
        });
      });
    }

    // Day labels
    if (daysEl) {
      daysEl.innerHTML = "";
      for (let d = 0; d < 7; d++) {
        const span = document.createElement("span");
        span.textContent = dayNames[d];
        daysEl.appendChild(span);
      }
    }

    // Hour labels
    if (hoursEl) {
      hoursEl.innerHTML = "";
      for (let h = 0; h < 24; h++) {
        if (h % 3 === 0) {
          const span = document.createElement("span");
          span.textContent = `${h}:00`;
          hoursEl.appendChild(span);
        } else {
          const span = document.createElement("span");
          hoursEl.appendChild(span);
        }
      }
    }

    // Cells (row-major: day 0 hour 0, day 0 hour 1, ...)
    grid.innerHTML = "";
    const mv = maxVal || 1;
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const cell = document.createElement("div");
        cell.className = "hourly-grid-cell";
        const val = matrix[d][h];
        const intensity = Math.min(1, val / mv);
        cell.style.opacity = val > 0 ? (0.15 + intensity * 0.85) : 0.06;
        cell.title = `${dayNames[d]} ${h}:00 — ${Math.round(val)}m productive`;
        grid.appendChild(cell);
      }
    }
  } catch (e) {
    console.error("7x24 grid error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── Achievements Showcase ───
// ═══════════════════════════════════════════════════════════════

async function loadAchievements() {
  try {
    const all = await Achievements.getAllWithStatus();
    const grid = document.getElementById("achievements-grid");
    const badge = document.getElementById("achievements-count-badge");
    const subtitle = document.getElementById("achievements-subtitle");
    if (!grid) return;

    const earned = all.filter(a => a.unlocked).length;
    if (badge) badge.textContent = `${earned} / ${all.length}`;
    if (subtitle) subtitle.textContent = earned > 0 
      ? `${earned} unlocked — ${all.length - earned} remaining`
      : "Unlock badges by building great habits";

    // Sort: unlocked first, then by tier
    const tierOrder = { legendary: 0, platinum: 1, gold: 2, silver: 3, bronze: 4 };
    const sorted = [...all].sort((a, b) => {
      if (a.unlocked && !b.unlocked) return -1;
      if (!a.unlocked && b.unlocked) return 1;
      return (tierOrder[a.tier] || 5) - (tierOrder[b.tier] || 5);
    });

    grid.innerHTML = sorted.map(a => {
      const tier = Achievements.tierColors[a.tier] || {};
      const lockClass = a.unlocked ? "unlocked" : "locked";
      const dateStr = a.earnedAt ? new Date(a.earnedAt).toLocaleDateString("en", { month: "short", day: "numeric" }) : "";
      return `<div class="achievement-card ${lockClass}" 
        style="--achievement-bg:${tier.bg || 'transparent'};--achievement-border:${tier.border || 'var(--bg-glass-border)'};">
        <span class="achievement-icon">${a.icon}</span>
        <span class="achievement-name">${a.name}</span>
        <span class="achievement-desc">${a.desc}</span>
        <span class="achievement-tier" style="background:${tier.bg};color:${tier.text};border:1px solid ${tier.border};">${a.tier}</span>
        ${a.unlocked ? `<span class="achievement-date">${dateStr}</span>` : ""}
      </div>`;
    }).join("");

    // Also check for new achievements
    const stats = await Achievements.buildStats();
    const newlyUnlocked = await Achievements.checkAll(stats);
    if (newlyUnlocked.length > 0) {
      // Show toast for first newly unlocked
      showAchievementToast(newlyUnlocked[0]);
      // Refresh display after a brief delay
      setTimeout(() => loadAchievements(), 500);
    }
  } catch (e) {
    console.error("Achievements error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── Site Deep Dive Modal ───
// ═══════════════════════════════════════════════════════════════

function setupSiteDeepDive() {
  // Close modal
  document.getElementById("site-dive-close")?.addEventListener("click", () => {
    document.getElementById("site-dive-modal").style.display = "none";
  });
  document.getElementById("site-dive-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "site-dive-modal") {
      document.getElementById("site-dive-modal").style.display = "none";
    }
  });

  // Make domain rows clickable
  document.addEventListener("click", async (e) => {
    const row = e.target.closest("tr[data-domain]");
    if (!row || !row.dataset.domain) return;
    await openSiteDeepDive(row.dataset.domain);
  });
}

async function openSiteDeepDive(domain) {
  const modal = document.getElementById("site-dive-modal");
  if (!modal) return;

  const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
  const history = await chrome.runtime.sendMessage({ action: "getDomainHistory", domain });
  const settings = await chrome.runtime.sendMessage({ action: "getSettings" });

  const domainData = usage.domains?.[domain] || {};
  const category = domainData.category || Categories.categorize(domain, settings.categoryOverrides);
  const color = Categories.getCategoryColor(category);

  document.getElementById("site-dive-favicon").src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  document.getElementById("site-dive-domain").textContent = domain;
  const catEl = document.getElementById("site-dive-category");
  catEl.textContent = category;
  catEl.style.color = color;

  // Stats
  const totalWeek = history.reduce((s, v) => s + v, 0);
  const avgDaily = history.length > 0 ? totalWeek / history.length : 0;
  const peakDay = Math.max(...history, 0);
  const visits = domainData.visits || 0;

  document.getElementById("site-dive-stats").innerHTML = `
    <div class="site-dive-stat">
      <div class="site-dive-stat-value">${formatTime(domainData.time || 0)}</div>
      <div class="site-dive-stat-label">Today</div>
    </div>
    <div class="site-dive-stat">
      <div class="site-dive-stat-value">${formatTime(totalWeek)}</div>
      <div class="site-dive-stat-label">This Week</div>
    </div>
    <div class="site-dive-stat">
      <div class="site-dive-stat-value">${formatTime(avgDaily)}</div>
      <div class="site-dive-stat-label">Daily Avg</div>
    </div>
    <div class="site-dive-stat">
      <div class="site-dive-stat-value">${visits}</div>
      <div class="site-dive-stat-label">Visits Today</div>
    </div>
  `;

  // Draw 7-day trend chart
  drawSiteDiveChart("site-dive-chart", history.slice().reverse(), color);

  // Draw hourly pattern
  const hourlyData = Array(24).fill(0);
  const hourly = usage.hourlyActivity || [];
  hourly.forEach((h, i) => {
    // Approximate: if this domain is productive, show its contribution
    if (Categories.isProductive(category)) {
      hourlyData[i] = h.productive || 0;
    } else {
      hourlyData[i] = h.distracted || 0;
    }
  });
  drawSiteDiveChart("site-dive-hourly", hourlyData, color, true);

  modal.style.display = "flex";
}

function drawSiteDiveChart(canvasId, data, color, isHourly = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || data.length < 2) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const w = rect.width;
  const h = parseInt(canvas.getAttribute("height")) || 140;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const colors = getChartColors();
  const padding = { top: 10, right: 10, bottom: 24, left: 36 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const maxVal = Math.max(1, ...data);

  if (isHourly) {
    // Bar chart
    const barW = chartW / data.length - 2;
    data.forEach((v, i) => {
      const x = padding.left + (i / data.length) * chartW + 1;
      const barH = (v / maxVal) * chartH;
      const grad = ctx.createLinearGradient(0, padding.top + chartH - barH, 0, padding.top + chartH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "33");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, padding.top + chartH - barH, barW, barH, [3, 3, 0, 0]);
      ctx.fill();

      if (i % 3 === 0) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = "600 9px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(i + ":00", x + barW / 2, h - 4);
      }
    });
  } else {
    // Area + Line chart
    const stepX = chartW / (data.length - 1);

    // Area
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    data.forEach((v, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (v / maxVal) * chartH;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(padding.left + (data.length - 1) * stepX, padding.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    grad.addColorStop(0, color + "30");
    grad.addColorStop(1, color + "05");
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (v / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Dots
    data.forEach((v, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (v / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label
      ctx.fillStyle = colors.textMuted;
      ctx.font = "600 9px 'Inter', sans-serif";
      ctx.textAlign = "center";
      const dayLabel = new Date(Date.now() - (data.length - 1 - i) * 86400000).toLocaleDateString("en", { weekday: "short" });
      ctx.fillText(dayLabel, x, h - 4);
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── Live Auto-Refresh (5 second interval) ───
// ═══════════════════════════════════════════════════════════════

function startLiveRefresh() {
  setInterval(async () => {
    try {
      await loadOverview();
      await loadSidebarStats();
      await loadTopSites();
    } catch (e) {}
  }, 5000);
}

// ═══════════════════════════════════════════════════════════════
// ─── Achievement Unlock Toast ───
// ═══════════════════════════════════════════════════════════════

function showAchievementToast(achievement) {
  const toast = document.getElementById("achievement-toast");
  if (!toast) return;
  document.getElementById("achievement-toast-icon").textContent = achievement.icon;
  document.getElementById("achievement-toast-name").textContent = achievement.name;
  toast.style.display = "block";
  toast.style.animation = "none";
  toast.offsetHeight; // trigger reflow
  toast.style.animation = "";
  setTimeout(() => { toast.style.display = "none"; }, 5000);
}

// ═══════════════════════════════════════════════════════════════
// ─── Comparison Cards (Today vs Yesterday vs Best) ───
// ═══════════════════════════════════════════════════════════════

async function loadComparisonCards() {
  try {
    const weekData = await chrome.runtime.sendMessage({ action: "getWeekUsage" });
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const scoreData = await chrome.runtime.sendMessage({ action: "getScore" });

    const todayScore = scoreData.score || 0;
    const todayGrade = getLetterGrade(todayScore);
    setComparisonCard("today", todayScore, todayGrade, {
      active: formatTime(usage.totalActive || 0),
      focus: formatTime(usage.focusTime || 0),
      sessions: (usage.focusSessions || []).length,
    });

    if (weekData && weekData.length > 0) {
      const yest = weekData[0]?.data || {};
      const yestScore = yest.score || 0;
      const yestGrade = getLetterGrade(yestScore);
      setComparisonCard("yest", yestScore, yestGrade, {
        active: formatTime(yest.totalActive || 0),
        focus: formatTime(yest.focusTime || 0),
        sessions: (yest.focusSessions || []).length,
      });

      // Find best day in last 30
      const allDays = await chrome.runtime.sendMessage({ action: "getMonthUsage", days: 30 });
      const daysArr = Array.isArray(allDays) ? allDays : (allDays?.days || []);
      let bestDay = { score: 0, data: {}, date: "" };
      daysArr.forEach(d => {
        const dd = d.data || d;
        if ((dd.score || 0) > bestDay.score) {
          bestDay = { score: dd.score, data: dd, date: d.date || "" };
        }
      });
      const bestGrade = getLetterGrade(bestDay.score);
      const el = (id) => document.getElementById(id);
      setComparisonCard("best", bestDay.score, bestGrade, {
        active: formatTime(bestDay.data.totalActive || 0),
        focus: formatTime(bestDay.data.focusTime || 0),
      });
      if (el("cmp2-best-date")) {
        el("cmp2-best-date").textContent = bestDay.date
          ? new Date(bestDay.date).toLocaleDateString("en", { month: "short", day: "numeric" })
          : "—";
      }
    }
  } catch (e) { console.error("Comparison cards:", e); }
}

function setComparisonCard(key, score, grade, stats) {
  const el = (id) => document.getElementById(id);
  if (el(`cmp2-${key}-score`)) el(`cmp2-${key}-score`).textContent = score;
  if (el(`cmp2-${key}-grade`)) {
    el(`cmp2-${key}-grade`).textContent = grade.letter;
    el(`cmp2-${key}-grade`).style.background = grade.bg;
    el(`cmp2-${key}-grade`).style.color = grade.color;
  }
  if (stats.active && el(`cmp2-${key}-active`)) el(`cmp2-${key}-active`).textContent = stats.active;
  if (stats.focus && el(`cmp2-${key}-focus`)) el(`cmp2-${key}-focus`).textContent = stats.focus;
  if (stats.sessions !== undefined && el(`cmp2-${key}-sessions`)) el(`cmp2-${key}-sessions`).textContent = stats.sessions;
}

function getLetterGrade(score) {
  if (score >= 93) return { letter: "A+", color: "#059669", bg: "rgba(16,185,129,0.12)" };
  if (score >= 85) return { letter: "A", color: "#10B981", bg: "rgba(16,185,129,0.1)" };
  if (score >= 80) return { letter: "A-", color: "#34D399", bg: "rgba(52,211,153,0.1)" };
  if (score >= 77) return { letter: "B+", color: "#2563EB", bg: "rgba(37,99,235,0.1)" };
  if (score >= 73) return { letter: "B", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" };
  if (score >= 70) return { letter: "B-", color: "#60A5FA", bg: "rgba(96,165,250,0.1)" };
  if (score >= 67) return { letter: "C+", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
  if (score >= 63) return { letter: "C", color: "#F59E0B", bg: "rgba(245,158,11,0.08)" };
  if (score >= 60) return { letter: "C-", color: "#D97706", bg: "rgba(217,119,6,0.1)" };
  if (score >= 57) return { letter: "D+", color: "#F97316", bg: "rgba(249,115,22,0.1)" };
  if (score >= 50) return { letter: "D", color: "#F97316", bg: "rgba(249,115,22,0.08)" };
  return { letter: "F", color: "#EF4444", bg: "rgba(239,68,68,0.1)" };
}

// ═══════════════════════════════════════════════════════════════
// ─── Category Flow Timeline (Stacked Area Chart) ───
// ═══════════════════════════════════════════════════════════════

async function drawCategoryFlow() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const data = getCtx("chart-category-flow");
    if (!data) return;
    const { ctx, w, h } = data;
    const colors = getChartColors();
    ctx.clearRect(0, 0, w, h);

    const hourly = usage.hourlyActivity || [];
    if (!hourly.some(hr => (hr.productive || 0) + (hr.distracted || 0) > 0)) {
      ctx.fillStyle = colors.textMuted;
      ctx.font = "600 13px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Activity data will appear here as you browse", w / 2, h / 2);
      return;
    }

    // Build per-hour category data from domains
    const catColors = {
      "Development": "#10B981", "Education": "#06B6D4", "Research": "#8B5CF6",
      "Productivity": "#3B82F6", "Work": "#2563EB", "News": "#6366F1",
      "Social Media": "#F43F5E", "Entertainment": "#F59E0B", "Shopping": "#EC4899",
      "Other": "#64748B",
    };
    const categories = Object.keys(catColors);

    const padding = { top: 20, right: 20, bottom: 36, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Use hourly data: productive → green stack, distracted → red stack
    const maxVal = Math.max(1, ...hourly.map(hr => (hr.productive || 0) + (hr.distracted || 0)));

    // Draw stacked areas
    const prodData = hourly.map(hr => hr.productive || 0);
    const distData = hourly.map(hr => hr.distracted || 0);

    // Productive area
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    for (let i = 0; i < 24; i++) {
      const x = padding.left + (i / 23) * chartW;
      const y = padding.top + chartH - ((prodData[i] + distData[i]) / maxVal) * chartH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.closePath();
    const prodGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    prodGrad.addColorStop(0, "rgba(16,185,129,0.35)");
    prodGrad.addColorStop(1, "rgba(16,185,129,0.05)");
    ctx.fillStyle = prodGrad;
    ctx.fill();

    // Distracted area (on top)
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    for (let i = 0; i < 24; i++) {
      const x = padding.left + (i / 23) * chartW;
      const y = padding.top + chartH - (distData[i] / maxVal) * chartH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.closePath();
    const distGrad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    distGrad.addColorStop(0, "rgba(244,63,94,0.35)");
    distGrad.addColorStop(1, "rgba(244,63,94,0.05)");
    ctx.fillStyle = distGrad;
    ctx.fill();

    // Lines
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const x = padding.left + (i / 23) * chartW;
      const y = padding.top + chartH - ((prodData[i] + distData[i]) / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const x = padding.left + (i / 23) * chartW;
      const y = padding.top + chartH - (distData[i] / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "#F43F5E";
    ctx.lineWidth = 2;
    ctx.stroke();

    // X labels
    for (let i = 0; i < 24; i += 3) {
      const x = padding.left + (i / 23) * chartW;
      ctx.fillStyle = colors.textMuted;
      ctx.font = "700 10px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(i + ":00", x, h - 8);
    }

    // Legend
    ctx.fillStyle = "#10B981";
    ctx.fillRect(padding.left, 4, 12, 3);
    ctx.fillStyle = colors.text;
    ctx.font = "600 10px 'Inter', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Productive", padding.left + 16, 8);
    ctx.fillStyle = "#F43F5E";
    ctx.fillRect(padding.left + 90, 4, 12, 3);
    ctx.fillStyle = colors.text;
    ctx.fillText("Distracted", padding.left + 106, 8);
  } catch (e) {
    console.error("Category flow error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── Session Analytics ───
// ═══════════════════════════════════════════════════════════════

async function loadSessionAnalytics() {
  try {
    const allDays = await chrome.runtime.sendMessage({ action: "getMonthUsage", days: 30 });
    const daysArr = Array.isArray(allDays) ? allDays : (allDays?.days || []);

    let totalSessions = 0, completedSessions = 0;
    let totalDuration = 0, totalInterruptions = 0, totalTasks = 0;
    let bestStreak = 0, currentStreak = 0;

    daysArr.forEach(day => {
      const d = day.data || day;
      const sessions = d.focusSessions || [];
      sessions.forEach(s => {
        totalSessions++;
        totalDuration += s.duration || 0;
        totalInterruptions += s.interruptions || 0;
        totalTasks += s.tasksCompleted || 0;
        if (s.status === "completed") {
          completedSessions++;
          currentStreak++;
          if (currentStreak > bestStreak) bestStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      });
    });

    const el = (id) => document.getElementById(id);
    const rate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const avgDur = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;
    const avgInt = totalSessions > 0 ? (totalInterruptions / totalSessions).toFixed(1) : "0";
    const totalFocusH = (totalDuration / 60).toFixed(1);

    if (el("sa-completion-rate")) el("sa-completion-rate").textContent = rate + "%";
    if (el("sa-avg-duration")) el("sa-avg-duration").textContent = avgDur + "m";
    if (el("sa-total-focus")) el("sa-total-focus").textContent = totalFocusH + "h";
    if (el("sa-avg-interruptions")) el("sa-avg-interruptions").textContent = avgInt;
    if (el("sa-tasks-completed")) el("sa-tasks-completed").textContent = totalTasks;
    if (el("sa-best-streak")) el("sa-best-streak").textContent = bestStreak;

    // Color the completion rate
    if (el("sa-completion-rate")) {
      el("sa-completion-rate").style.color = rate >= 80 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#F43F5E";
    }
  } catch (e) {
    console.error("Session analytics error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// ─── Report Generator with Letter Grades ───
// ═══════════════════════════════════════════════════════════════

function setupReportGenerator() {
  document.getElementById("btn-generate-report")?.addEventListener("click", generateReport);
}

async function generateReport() {
  try {
    const btn = document.getElementById("btn-generate-report");
    btn.textContent = "Generating...";
    btn.disabled = true;

    // Get active report range
    const activeRange = document.querySelector(".report-range-btn.active");
    const range = activeRange?.dataset.range || "week";
    let nDays = range === "today" ? 1 : range === "week" ? 7 : range === "month" ? 30 : range === "year" ? 365 : 30;

    let data;
    if (nDays === 1) {
      data = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    } else {
      data = await chrome.runtime.sendMessage({ action: "getMonthUsage", days: nDays });
    }

    let totalActive = 0, totalFocus = 0, totalDistracted = 0, totalSessions = 0, completedSessions = 0;
    let allDomains = {};
    const scores = [];

    if (nDays === 1) {
      totalActive = data.totalActive || 0;
      totalFocus = data.focusTime || 0;
      totalDistracted = data.distractedTime || 0;
      totalSessions = (data.focusSessions || []).length;
      completedSessions = (data.focusSessions || []).filter(s => s.status === "completed").length;
      scores.push(data.score || 0);
      allDomains = data.domains || {};
    } else {
      const daysArr = Array.isArray(data) ? data : (data?.days || []);
      daysArr.forEach(day => {
        const d = day.data || day;
        totalActive += d.totalActive || 0;
        totalFocus += d.focusTime || 0;
        totalDistracted += d.distractedTime || 0;
        scores.push(d.score || 0);
        const sessions = d.focusSessions || [];
        totalSessions += sessions.length;
        completedSessions += sessions.filter(s => s.status === "completed").length;
        Object.entries(d.domains || {}).forEach(([domain, info]) => {
          if (!allDomains[domain]) allDomains[domain] = { time: 0, category: info.category || "Other", visits: 0 };
          allDomains[domain].time += info.time || 0;
          allDomains[domain].visits += info.visits || 0;
        });
      });
    }

    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const grade = getLetterGrade(avgScore);
    const focusRatio = totalActive > 0 ? Math.round((totalFocus / totalActive) * 100) : 0;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // Top sites
    const topSites = Object.entries(allDomains).sort((a, b) => b[1].time - a[1].time).slice(0, 5);

    // Generate recommendations
    const recs = [];
    if (focusRatio < 50) recs.push({ icon: "⚠️", text: `Your focus ratio is ${focusRatio}%. Try blocking distracting sites during work hours to improve.` });
    if (focusRatio >= 70) recs.push({ icon: "🏆", text: `Excellent focus ratio of ${focusRatio}%! You're in the top tier of productivity.` });
    if (completionRate < 60 && totalSessions > 0) recs.push({ icon: "🎯", text: `Session completion is at ${completionRate}%. Try shorter 15-min sessions to build momentum.` });
    if (completionRate >= 80 && totalSessions > 2) recs.push({ icon: "💪", text: `${completionRate}% session completion — outstanding discipline! Consider longer deep work sessions.` });
    if (totalSessions === 0) recs.push({ icon: "📌", text: "You haven't used Focus Mode yet. Start a 25-min Pomodoro session to boost productivity." });
    
    const topDistractor = topSites.find(([, info]) => ["Social Media", "Entertainment"].includes(info.category));
    if (topDistractor) {
      recs.push({ icon: "🚫", text: `${topDistractor[0]} consumed ${formatTime(topDistractor[1].time)}. Consider setting a daily limit or blocking it.` });
    }
    if (recs.length === 0) recs.push({ icon: "✨", text: "Great job! Keep maintaining your productive habits." });

    const rangeLabel = range === "today" ? "Today" : range === "week" ? "This Week" : range === "month" ? "This Month" : range === "year" ? "This Year" : "All Time";

    const preview = document.getElementById("report-preview");
    preview.innerHTML = `
      <div class="report-preview-card">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.25em;color:var(--text-muted);">FocusGuard Report — ${rangeLabel}</span>
        </div>
        <div class="report-grade-hero">
          <div class="report-grade-letter" style="color:${grade.color};">${grade.letter}</div>
          <div class="report-grade-label">Overall Grade (Avg Score: ${avgScore})</div>
        </div>
        <div class="report-metrics-row">
          <div class="report-metric-cell">
            <div class="report-metric-value">${formatTime(totalActive)}</div>
            <span class="report-metric-label">Screen Time</span>
          </div>
          <div class="report-metric-cell">
            <div class="report-metric-value" style="color:#10B981;">${focusRatio}%</div>
            <span class="report-metric-label">Focus Ratio</span>
          </div>
          <div class="report-metric-cell">
            <div class="report-metric-value">${totalSessions}</div>
            <span class="report-metric-label">Focus Sessions</span>
          </div>
          <div class="report-metric-cell">
            <div class="report-metric-value" style="color:${completionRate >= 70 ? '#10B981' : '#F59E0B'};">${completionRate}%</div>
            <span class="report-metric-label">Completion Rate</span>
          </div>
        </div>
        <div class="report-recommendations">
          <h4 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:16px;">📋 Recommendations</h4>
          ${recs.map(r => `<div class="report-rec-item"><span class="report-rec-icon">${r.icon}</span><span class="report-rec-text">${r.text}</span></div>`).join("")}
        </div>
        <div class="report-download-row">
          <button class="btn-sync" onclick="downloadReport()" style="border-radius:16px;padding:10px 24px;">
            📥 Download as HTML
          </button>
        </div>
      </div>
    `;

    // Try AI-powered summary (async, non-blocking)
    try {
      const cfg = await getAIConfig();
      if (cfg.apiKey) {
        const productiveSites = topSites.filter(([, i]) => ["Development", "Productivity", "Education", "Research"].includes(i.category)).map(([d]) => d).join(", ") || "None";
        const distractingSites = topSites.filter(([, i]) => ["Social Media", "Entertainment", "Shopping"].includes(i.category)).map(([d]) => d).join(", ") || "None";
        
        const aiSummary = await generateAIReportSummary({
          score: avgScore, grade: grade.letter, activeTime: formatTime(totalActive),
          focusRatio, productiveSites, distractingSites, sessionsCompleted: completedSessions,
        });

        if (aiSummary) {
          const aiDiv = document.createElement("div");
          aiDiv.className = "report-ai-summary";
          aiDiv.innerHTML = `
            <h4 style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:12px;">🧠 AI Summary</h4>
            <p style="font-size:14px;line-height:1.7;color:var(--text-secondary);">${aiSummary}</p>
          `;
          const recsEl = preview.querySelector(".report-recommendations");
          if (recsEl) recsEl.after(aiDiv);
        }
      }
    } catch (aiErr) {
      console.warn("AI summary skipped:", aiErr);
    }

    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v8M3 6l4-4 4 4M2 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Generate Report`;
    btn.disabled = false;
  } catch (e) {
    console.error("Report generation error:", e);
    const btn = document.getElementById("btn-generate-report");
    btn.textContent = "Generate Report";
    btn.disabled = false;
  }
}

function downloadReport() {
  const preview = document.getElementById("report-preview");
  if (!preview) return;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>FocusGuard Report</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0F172A;color:#E2E8F0;max-width:700px;margin:40px auto;padding:40px;border-radius:24px;border:1px solid rgba(255,255,255,0.06);}
h1{text-align:center;font-size:14px;font-weight:900;letter-spacing:0.25em;text-transform:uppercase;color:#94A3B8;margin-bottom:32px;}
.grade{text-align:center;font-size:80px;font-weight:900;font-family:monospace;}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:32px 0;}
.metric{text-align:center;padding:20px;background:rgba(255,255,255,0.04);border-radius:16px;border:1px solid rgba(255,255,255,0.06);}
.metric-value{font-size:24px;font-weight:900;font-family:monospace;}
.metric-label{font-size:10px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.1em;margin-top:4px;display:block;}
.rec{padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;gap:12px;font-size:14px;}
.footer{text-align:center;margin-top:32px;font-size:11px;color:#475569;}
</style></head><body>
<h1>FocusGuard Productivity Report</h1>
${preview.innerHTML}
<div class="footer">Generated by FocusGuard · ${new Date().toLocaleDateString()}</div>
</body></html>`;
  downloadFile(html, `focusguard-report-${new Date().toISOString().split("T")[0]}.html`, "text/html");
}

// ═══ FOCUS SESSION GANTT TIMELINE ═══
async function loadSessionTimeline() {
  const weekData = await chrome.runtime.sendMessage({ action: "getWeekUsage" });
  if (!weekData) return;

  const canvas = document.getElementById("gantt-canvas");
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth;
  const rowH = 40;
  const headerH = 28;
  const labelW = 80;
  const h = headerH + 7 * rowH + 10;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const textColor = isLight ? "#475569" : "#94A3B8";
  const textMuted = isLight ? "#94A3B8" : "#64748B";
  const gridLine = isLight ? "#F1F5F9" : "rgba(255,255,255,0.04)";
  const bgRow = isLight ? "rgba(0,0,0,0.015)" : "rgba(255,255,255,0.015)";

  const chartW = w - labelW;

  // Time axis: 0–24 hours
  const hours = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  // Draw header time labels
  ctx.font = "600 10px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = textMuted;
  ctx.textAlign = "center";
  hours.forEach(hr => {
    const x = labelW + (hr / 24) * chartW;
    const label = hr === 0 ? "12a" : hr === 12 ? "12p" : hr === 24 ? "12a" : hr < 12 ? hr + "a" : (hr - 12) + "p";
    ctx.fillText(label, x, headerH - 6);
  });

  // Collect all days (reversed so most recent is at top)
  const days = weekData.slice(0, 7);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let totalSessions = 0, totalCompleted = 0, totalMinutes = 0;

  days.forEach((day, i) => {
    const y = headerH + i * rowH;

    // Alternating row bg
    if (i % 2 === 0) {
      ctx.fillStyle = bgRow;
      ctx.fillRect(0, y, w, rowH);
    }

    // Grid lines
    ctx.strokeStyle = gridLine;
    ctx.lineWidth = 1;
    hours.forEach(hr => {
      const x = labelW + (hr / 24) * chartW;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowH);
      ctx.stroke();
    });

    // Day label
    const d = new Date(day.date);
    const dayLabel = dayNames[d.getDay()];
    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;

    ctx.font = "700 11px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "right";
    ctx.fillText(dayLabel, labelW - 24, y + rowH / 2 + 1);
    ctx.font = "600 9px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = textMuted;
    ctx.fillText(dateLabel, labelW - 24, y + rowH / 2 + 13);

    // Draw sessions as Gantt bars
    const sessions = day.data.focusSessions || [];
    sessions.forEach(s => {
      totalSessions++;
      totalMinutes += s.duration || 0;
      if (s.status === "completed") totalCompleted++;

      // Parse start time
      let startHour = 0;
      if (s.start) {
        const parts = s.start.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (parts) {
          let hr = parseInt(parts[1]);
          const min = parseInt(parts[2]);
          if (parts[3]) {
            if (parts[3].toUpperCase() === "PM" && hr !== 12) hr += 12;
            if (parts[3].toUpperCase() === "AM" && hr === 12) hr = 0;
          }
          startHour = hr + min / 60;
        }
      }

      const durHours = (s.duration || 25) / 60;
      const x1 = labelW + (startHour / 24) * chartW;
      const barW = Math.max(4, (durHours / 24) * chartW);
      const barY = y + 8;
      const barH = rowH - 16;

      // Color based on status
      let color, colorAlpha;
      if (s.status === "completed") {
        color = "#10B981"; colorAlpha = "rgba(16,185,129,0.2)";
      } else if (s.status === "abandoned" || s.status === "stopped") {
        color = "#F43F5E"; colorAlpha = "rgba(244,63,94,0.2)";
      } else {
        color = "#F59E0B"; colorAlpha = "rgba(245,158,11,0.2)";
      }

      // Bar background glow
      ctx.fillStyle = colorAlpha;
      ctx.beginPath();
      ctx.roundRect(x1 - 2, barY - 2, barW + 4, barH + 4, 8);
      ctx.fill();

      // Main bar
      const grad = ctx.createLinearGradient(x1, 0, x1 + barW, 0);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "99");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x1, barY, barW, barH, 6);
      ctx.fill();

      // Duration label inside bar if wide enough
      if (barW > 30) {
        ctx.font = "700 9px 'Inter', system-ui, sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.fillText(s.duration + "m", x1 + 6, barY + barH / 2 + 3);
      }

      // Tasks badge
      if (barW > 55 && s.tasksCompleted !== undefined) {
        ctx.font = "600 8px 'Inter', system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.textAlign = "right";
        ctx.fillText(`✓${s.tasksCompleted}/${s.totalTasks || 0}`, x1 + barW - 6, barY + barH / 2 + 3);
      }
    });
  });

  // Now-indicator for today
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
  const nowX = labelW + (nowHour / 24) * chartW;
  ctx.strokeStyle = "#3B82F6";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(nowX, headerH);
  ctx.lineTo(nowX, headerH + 7 * rowH);
  ctx.stroke();
  ctx.setLineDash([]);

  // "Now" label
  ctx.font = "700 9px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#3B82F6";
  ctx.textAlign = "center";
  ctx.fillText("NOW", nowX, headerH - 16);
  ctx.beginPath();
  ctx.moveTo(nowX, headerH - 12);
  ctx.lineTo(nowX - 3, headerH - 6);
  ctx.lineTo(nowX + 3, headerH - 6);
  ctx.closePath();
  ctx.fillStyle = "#3B82F6";
  ctx.fill();

  // Stats row
  const statsRow = document.getElementById("gantt-stats-row");
  if (statsRow) {
    const completionRate = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0;
    statsRow.innerHTML = `
      <div class="gantt-stat"><span class="gantt-stat-value">${totalSessions}</span><span class="gantt-stat-label">Total Sessions</span></div>
      <div class="gantt-stat"><span class="gantt-stat-value">${completionRate}%</span><span class="gantt-stat-label">Completion</span></div>
      <div class="gantt-stat"><span class="gantt-stat-value">${formatTime(totalMinutes)}</span><span class="gantt-stat-label">Total Focus</span></div>
      <div class="gantt-stat"><span class="gantt-stat-value">${totalSessions > 0 ? Math.round(totalMinutes / totalSessions) + "m" : "0m"}</span><span class="gantt-stat-label">Avg Duration</span></div>
    `;
  }
}

// ═══ CATEGORY TRANSITION SANKEY DIAGRAM ═══
async function drawCategorySankey() {
  try {
    const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
    const transitions = usage.categoryTransitions || {};
    const canvas = document.getElementById("chart-sankey");
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const wrap = canvas.parentElement;
    const w = wrap.clientWidth;
    const h = 380;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const textColor = isLight ? "#475569" : "#94A3B8";
    const textMuted = isLight ? "#94A3B8" : "#64748B";

    const catColors = {
      "Development": "#10B981", "Education": "#06B6D4", "Research": "#8B5CF6",
      "Productivity": "#3B82F6", "Work": "#2563EB", "News": "#6366F1",
      "Social Media": "#F43F5E", "Entertainment": "#F59E0B", "Shopping": "#EC4899",
      "Other": "#64748B", "Communication": "#14B8A6",
    };

    // Parse transitions
    const entries = Object.entries(transitions).map(([key, count]) => {
      const [from, to] = key.split("→");
      return { from, to, count };
    }).sort((a, b) => b.count - a.count);

    if (entries.length === 0) {
      ctx.fillStyle = textMuted;
      ctx.font = "600 13px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Category transitions will appear as you browse between different types of sites", w / 2, h / 2);
      return;
    }

    // Get unique categories (left = sources, right = destinations)
    const leftCats = [...new Set(entries.map(e => e.from))];
    const rightCats = [...new Set(entries.map(e => e.to))];
    // Deduplicate — categories can appear on both sides
    const allCats = [...new Set([...leftCats, ...rightCats])];

    // Calculate totals for sizing
    const leftTotals = {};
    const rightTotals = {};
    entries.forEach(e => {
      leftTotals[e.from] = (leftTotals[e.from] || 0) + e.count;
      rightTotals[e.to] = (rightTotals[e.to] || 0) + e.count;
    });

    // Sort by total flow
    leftCats.sort((a, b) => (leftTotals[b] || 0) - (leftTotals[a] || 0));
    rightCats.sort((a, b) => (rightTotals[b] || 0) - (rightTotals[a] || 0));

    const totalFlow = entries.reduce((s, e) => s + e.count, 0);
    const maxFlow = Math.max(...Object.values(leftTotals), ...Object.values(rightTotals));

    // Layout
    const pad = { top: 30, bottom: 30, left: 20, right: 20 };
    const nodeW = 18;
    const colLeft = pad.left;
    const colRight = w - pad.right - nodeW;
    const availH = h - pad.top - pad.bottom;
    const nodeGap = 8;

    // Calculate node positions
    const leftTotal = leftCats.reduce((s, c) => s + (leftTotals[c] || 0), 0);
    const rightTotal = rightCats.reduce((s, c) => s + (rightTotals[c] || 0), 0);

    function layoutNodes(cats, totals, totalSum) {
      const totalGap = (cats.length - 1) * nodeGap;
      const usableH = availH - totalGap;
      let y = pad.top;
      const nodes = {};
      cats.forEach(cat => {
        const ratio = (totals[cat] || 0) / totalSum;
        const nodeH = Math.max(16, ratio * usableH);
        nodes[cat] = { y, h: nodeH, total: totals[cat] || 0, usedY: 0 };
        y += nodeH + nodeGap;
      });
      return nodes;
    }

    const leftNodes = layoutNodes(leftCats, leftTotals, leftTotal);
    const rightNodes = layoutNodes(rightCats, rightTotals, rightTotal);

    // Draw flow links (bezier curves)
    // Sort entries to draw smaller flows first (larger on top)
    const sortedEntries = [...entries].sort((a, b) => a.count - b.count);

    sortedEntries.forEach(e => {
      const ln = leftNodes[e.from];
      const rn = rightNodes[e.to];
      if (!ln || !rn) return;

      const linkH = Math.max(2, (e.count / Math.max(ln.total, 1)) * ln.h);
      const linkHR = Math.max(2, (e.count / Math.max(rn.total, 1)) * rn.h);

      const y1 = ln.y + ln.usedY;
      const y2 = rn.y + rn.usedY;
      ln.usedY += linkH;
      rn.usedY += linkHR;

      const x1 = colLeft + nodeW;
      const x2 = colRight;
      const cpx = (x1 + x2) / 2;

      const color = catColors[e.from] || "#64748B";

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
      ctx.lineTo(x2, y2 + linkHR);
      ctx.bezierCurveTo(cpx, y2 + linkHR, cpx, y1 + linkH, x1, y1 + linkH);
      ctx.closePath();

      const grad = ctx.createLinearGradient(x1, 0, x2, 0);
      grad.addColorStop(0, color + "40");
      grad.addColorStop(0.5, color + "25");
      grad.addColorStop(1, (catColors[e.to] || "#64748B") + "40");
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle border
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cpx, y1, cpx, y2, x2, y2);
      ctx.strokeStyle = color + "30";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Draw left nodes
    leftCats.forEach(cat => {
      const n = leftNodes[cat];
      const color = catColors[cat] || "#64748B";

      // Node bar
      const grad = ctx.createLinearGradient(colLeft, n.y, colLeft, n.y + n.h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "AA");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(colLeft, n.y, nodeW, n.h, 4);
      ctx.fill();

      // Glow
      ctx.shadowColor = color + "40";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(colLeft, n.y, nodeW, n.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.font = "700 11px 'Inter', system-ui, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "left";
      const labelY = n.y + n.h / 2 + 4;
      ctx.fillText(cat, colLeft + nodeW + 8, labelY);

      // Count
      ctx.font = "600 9px 'Inter', system-ui, sans-serif";
      ctx.fillStyle = textMuted;
      ctx.fillText(`${n.total}×`, colLeft + nodeW + 8 + ctx.measureText(cat).width + 6, labelY);
    });

    // Draw right nodes
    rightCats.forEach(cat => {
      const n = rightNodes[cat];
      const color = catColors[cat] || "#64748B";

      const grad = ctx.createLinearGradient(colRight, n.y, colRight, n.y + n.h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + "AA");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(colRight, n.y, nodeW, n.h, 4);
      ctx.fill();

      ctx.shadowColor = color + "40";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(colRight, n.y, nodeW, n.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label (right-aligned)
      ctx.font = "700 11px 'Inter', system-ui, sans-serif";
      ctx.fillStyle = textColor;
      ctx.textAlign = "right";
      const labelY = n.y + n.h / 2 + 4;
      const countText = `${n.total}×`;
      ctx.font = "600 9px 'Inter', system-ui, sans-serif";
      const countW = ctx.measureText(countText).width;
      ctx.fillText(countText, colRight - 8, labelY);

      ctx.font = "700 11px 'Inter', system-ui, sans-serif";
      ctx.fillText(cat, colRight - 8 - countW - 6, labelY);
    });

    // Column headers
    ctx.font = "800 10px 'Inter', system-ui, sans-serif";
    ctx.fillStyle = textMuted;
    ctx.textAlign = "left";
    ctx.fillText("FROM", colLeft, pad.top - 10);
    ctx.textAlign = "right";
    ctx.fillText("TO", colRight + nodeW, pad.top - 10);

    // Stats row
    const statsRow = document.getElementById("sankey-stats-row");
    if (statsRow) {
      const topTransition = entries[0];
      const uniquePairs = entries.length;
      statsRow.innerHTML = `
        <div class="gantt-stat"><span class="gantt-stat-value">${totalFlow}</span><span class="gantt-stat-label">Total Switches</span></div>
        <div class="gantt-stat"><span class="gantt-stat-value">${uniquePairs}</span><span class="gantt-stat-label">Unique Flows</span></div>
        <div class="gantt-stat"><span class="gantt-stat-value">${allCats.length}</span><span class="gantt-stat-label">Categories</span></div>
        <div class="gantt-stat"><span class="gantt-stat-value">${topTransition ? topTransition.from.split(" ")[0] + " → " + topTransition.to.split(" ")[0] : "—"}</span><span class="gantt-stat-label">Most Common</span></div>
      `;
    }

    // Legend
    const legendEl = document.getElementById("sankey-legend");
    if (legendEl) {
      legendEl.innerHTML = allCats.slice(0, 6).map(cat =>
        `<span class="gantt-legend-item"><span class="gantt-legend-dot" style="background:${catColors[cat] || '#64748B'}"></span>${cat}</span>`
      ).join("");
    }
  } catch (e) {
    console.error("Sankey error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// QUICK MODE PRESETS (Dashboard Config)
// ═══════════════════════════════════════════════════════════════

async function loadPresetConfig() {
  const container = document.getElementById("preset-config-cards");
  if (!container) return;
  
  try {
    const presets = await chrome.runtime.sendMessage({ action: "getPresets" });
    container.innerHTML = "";
    
    const presetOrder = ["work", "study", "break"];
    for (const key of presetOrder) {
      const preset = presets[key];
      if (!preset) continue;
      
      const card = document.createElement("div");
      card.className = "preset-config-card";
      card.innerHTML = `
        <div class="preset-config-header">
          <span class="preset-config-icon">${preset.icon}</span>
          <div class="preset-config-title-wrap">
            <span class="preset-config-title">${preset.name}</span>
            <span class="preset-config-mode">${preset.mode === "block" ? "Block Mode" : "Allow Mode"} · ${preset.duration}m</span>
          </div>
          <button class="preset-config-toggle-mode btn-ghost btn-sm" data-key="${key}" title="Switch mode">
            ${preset.mode === "block" ? "🚫 Block" : "🔒 Allow"}
          </button>
        </div>
        <div class="preset-config-body">
          <div class="preset-config-sites">
            <label class="preset-config-label">${preset.mode === "block" ? "Blocked Sites" : "Allowed Sites"}</label>
            <div class="preset-config-pills" id="preset-pills-${key}">
              ${(preset.mode === "block" ? preset.blockedSites : preset.allowedSites).map((s, i) =>
                `<span class="focus-site-pill ${preset.mode === "block" ? "danger" : "success"}"><span>${s}</span><button data-key="${key}" data-idx="${i}" class="preset-remove-site">✕</button></span>`
              ).join("")}
            </div>
            <div class="input-row" style="margin-top:8px;">
              <input type="text" class="input preset-site-input" data-key="${key}" placeholder="e.g. youtube.com" style="flex:1;" />
              <button class="btn-ghost btn-sm preset-add-site" data-key="${key}" style="color:${preset.mode === "block" ? "var(--danger)" : "var(--success)"}">+ Add</button>
            </div>
          </div>
          <div class="preset-config-duration" style="margin-top:12px;">
            <label class="preset-config-label">Duration</label>
            <div class="focus-duration-pills" style="gap:8px;">
              ${[15, 25, 45, 60].map(d => `<button class="focus-dur-pill preset-dur-btn ${d === preset.duration ? "active" : ""}" data-key="${key}" data-dur="${d}">${d}m</button>`).join("")}
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    }
    
    // Event listeners
    container.querySelectorAll(".preset-remove-site").forEach(btn => {
      btn.addEventListener("click", async () => {
        const k = btn.dataset.key;
        const idx = parseInt(btn.dataset.idx);
        const p = await chrome.runtime.sendMessage({ action: "getPresets" });
        const list = p[k].mode === "block" ? "blockedSites" : "allowedSites";
        p[k][list].splice(idx, 1);
        await chrome.runtime.sendMessage({ action: "savePresets", presets: p });
        loadPresetConfig();
      });
    });
    
    container.querySelectorAll(".preset-add-site").forEach(btn => {
      btn.addEventListener("click", async () => {
        const k = btn.dataset.key;
        const input = container.querySelector(`.preset-site-input[data-key="${k}"]`);
        const domain = normalizeDomainInput(input.value);
        if (!domain) return;
        const p = await chrome.runtime.sendMessage({ action: "getPresets" });
        const list = p[k].mode === "block" ? "blockedSites" : "allowedSites";
        if (!p[k][list].includes(domain)) {
          p[k][list].push(domain);
          await chrome.runtime.sendMessage({ action: "savePresets", presets: p });
        }
        input.value = "";
        loadPresetConfig();
      });
    });
    
    container.querySelectorAll(".preset-site-input").forEach(input => {
      input.addEventListener("keydown", async (e) => {
        if (e.key !== "Enter") return;
        const k = input.dataset.key;
        const domain = normalizeDomainInput(input.value);
        if (!domain) return;
        const p = await chrome.runtime.sendMessage({ action: "getPresets" });
        const list = p[k].mode === "block" ? "blockedSites" : "allowedSites";
        if (!p[k][list].includes(domain)) {
          p[k][list].push(domain);
          await chrome.runtime.sendMessage({ action: "savePresets", presets: p });
        }
        input.value = "";
        loadPresetConfig();
      });
    });
    
    container.querySelectorAll(".preset-dur-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const k = btn.dataset.key;
        const dur = parseInt(btn.dataset.dur);
        const p = await chrome.runtime.sendMessage({ action: "getPresets" });
        p[k].duration = dur;
        await chrome.runtime.sendMessage({ action: "savePresets", presets: p });
        loadPresetConfig();
      });
    });
    
    container.querySelectorAll(".preset-config-toggle-mode").forEach(btn => {
      btn.addEventListener("click", async () => {
        const k = btn.dataset.key;
        const p = await chrome.runtime.sendMessage({ action: "getPresets" });
        p[k].mode = p[k].mode === "block" ? "allow" : "block";
        await chrome.runtime.sendMessage({ action: "savePresets", presets: p });
        loadPresetConfig();
      });
    });
  } catch (e) {
    console.warn("Preset config error:", e);
  }
}

// ═══════════════════════════════════════════════════════════════
// WEEKLY SCHEDULE GRID
// ═══════════════════════════════════════════════════════════════

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = 24;
let scheduleBlockType = "block-all";
let isDragging = false;
let dragStart = null;
let dragCurrent = null;
let dragDay = null;

function setupScheduleGrid() {
  buildGrid();
  setupSchedulePresetSelector();
  setupScheduleClearAll();
  updateNowIndicator();
  setInterval(updateNowIndicator, 60000);
}

function updateNowIndicator() {
  // Remove old indicators
  document.querySelectorAll(".schedule-now-line").forEach(el => el.remove());

  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sun
  const col = document.querySelector(`.schedule-day-col.is-today-col`);
  if (!col) return;

  const headerH = 32; // header height
  const cellH = 28;   // each hour cell height
  const fractionalHour = now.getHours() + now.getMinutes() / 60;
  const topPx = headerH + fractionalHour * cellH;

  const line = document.createElement("div");
  line.className = "schedule-now-line";
  line.style.top = topPx + "px";
  col.appendChild(line);
}

function buildGrid() {
  const grid = document.getElementById("schedule-grid");
  if (!grid) return;
  grid.innerHTML = "";

  // Time labels
  const timeCol = document.createElement("div");
  timeCol.className = "schedule-time-labels";
  // Empty header cell
  const emptyHeader = document.createElement("div");
  emptyHeader.className = "schedule-time-label";
  emptyHeader.style.height = "32px";
  timeCol.appendChild(emptyHeader);
  
  for (let h = 0; h < HOURS; h++) {
    const label = document.createElement("div");
    label.className = "schedule-time-label";
    const ampm = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h-12}p`;
    label.textContent = ampm;
    timeCol.appendChild(label);
  }
  grid.appendChild(timeCol);

  // Day columns
  const today = new Date().getDay();
  for (let d = 0; d < 7; d++) {
    const col = document.createElement("div");
    col.className = "schedule-day-col";
    if (d === today) col.classList.add("is-today-col");
    
    const header = document.createElement("div");
    header.className = "schedule-day-header" + (d === today ? " is-today" : "");
    header.textContent = DAYS[d];
    col.appendChild(header);

    for (let h = 0; h < HOURS; h++) {
      const cell = document.createElement("div");
      cell.className = "schedule-cell";
      cell.dataset.day = d;
      cell.dataset.hour = h;

      cell.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        dragDay = d;
        dragStart = h;
        dragCurrent = h;
        highlightDrag(d, h, h);
      });

      cell.addEventListener("mouseenter", () => {
        if (isDragging && dragDay === d) {
          dragCurrent = h;
          highlightDrag(d, dragStart, dragCurrent);
        }
      });

      col.appendChild(cell);
    }
    grid.appendChild(col);
  }

  // Global mouse up
  document.addEventListener("mouseup", async () => {
    if (!isDragging) return;
    isDragging = false;
    
    const startH = Math.min(dragStart, dragCurrent);
    const endH = Math.max(dragStart, dragCurrent);
    
    // Create the schedule block
    const startTime = `${startH.toString().padStart(2, "0")}:00`;
    const endTime = `${(endH + 1).toString().padStart(2, "0")}:00`;
    
    const autoDeployToggle = document.getElementById("schedule-auto-deploy");
    const block = {
      startTime,
      endTime,
      days: [dragDay],
      type: scheduleBlockType,
      domains: scheduleBlockType === "block-all" ? ["__all_distractions__"] : [],
      presetKey: scheduleBlockType !== "block-all" ? scheduleBlockType : null,
      autoDeploy: autoDeployToggle?.checked || false,
    };

    await chrome.runtime.sendMessage({ action: "saveScheduledBlock", block });
    clearDragHighlight();
    await loadScheduleData();
  });
}

function highlightDrag(day, start, end) {
  const minH = Math.min(start, end);
  const maxH = Math.max(start, end);
  
  document.querySelectorAll(".schedule-cell").forEach(cell => {
    cell.classList.remove("dragging");
    if (parseInt(cell.dataset.day) === day) {
      const h = parseInt(cell.dataset.hour);
      if (h >= minH && h <= maxH) {
        cell.classList.add("dragging");
      }
    }
  });
}

function clearDragHighlight() {
  document.querySelectorAll(".schedule-cell.dragging").forEach(c => c.classList.remove("dragging"));
}

async function loadScheduleData() {
  try {
    const blocks = await chrome.runtime.sendMessage({ action: "getScheduledBlocks" });
    
    // Clear filled cells
    document.querySelectorAll(".schedule-cell").forEach(cell => {
      cell.className = "schedule-cell";
      const label = cell.querySelector(".schedule-block-label");
      if (label) label.remove();
    });

    // Fill cells based on blocks
    (blocks || []).forEach(block => {
      const [startH] = block.startTime.split(":").map(Number);
      let [endH] = block.endTime.split(":").map(Number);
      if (endH === 0) endH = 24;
      const type = block.type || (block.presetKey || "block-all");
      const typeClass = type === "block-all" ? "block-all" : type;

      (block.days || []).forEach(day => {
        for (let h = startH; h < endH; h++) {
          const cell = document.querySelector(`.schedule-cell[data-day="${day}"][data-hour="${h}"]`);
          if (cell) {
            cell.classList.add("filled", typeClass);
            cell.dataset.blockId = block.id;
            
            // Add label on first cell
            if (h === startH) {
              const label = document.createElement("span");
              label.className = "schedule-block-label";
              const icon = type === "block-all" ? "🚫" : type === "work" ? "💼" : "📚";
              const name = type === "block-all" ? "Block" : type === "work" ? "Work" : "Study";
              label.textContent = `${icon} ${name}`;
              label.style.height = `${(endH - startH) * 28}px`;
              label.style.lineHeight = "14px";
              label.style.paddingTop = "7px";
              cell.appendChild(label);
            }

            // Click to delete
            cell.addEventListener("click", async (e) => {
              if (isDragging) return;
              if (block.id && confirm(`Delete this ${type === "block-all" ? "block" : type + " mode"} schedule (${block.startTime}–${block.endTime})?`)) {
                await chrome.runtime.sendMessage({ action: "deleteScheduledBlock", id: block.id });
                await loadScheduleData();
              }
            });
          }
        }
      });
    });

    // Update the list below
    renderScheduleList(blocks || []);
  } catch (e) {
    console.warn("Schedule load error:", e);
  }
}

function renderScheduleList(blocks) {
  const container = document.getElementById("schedule-list-detailed");
  const emptyEl = document.getElementById("schedule-empty");
  if (!container) return;

  if (!blocks.length) {
    container.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  container.innerHTML = blocks.map(block => {
    const type = block.type || block.presetKey || "block-all";
    const icon = type === "block-all" ? "🚫" : type === "work" ? "💼" : type === "study" ? "📚" : "📅";
    const name = type === "block-all" ? "Block All Distractions" : type === "work" ? "Work Mode" : type === "study" ? "Study Mode" : "Custom Block";
    const dayNames = (block.days || []).map(d => DAYS[d]).join(", ");
    
    return `
      <div class="schedule-detail-item">
        <div class="schedule-detail-icon">${icon}</div>
        <div class="schedule-detail-info">
          <div class="schedule-detail-title">${name}</div>
          <div class="schedule-detail-meta">${dayNames}</div>
        </div>
        <div class="schedule-detail-time">${block.startTime} – ${block.endTime}</div>
        <button class="schedule-detail-delete" data-id="${block.id}" title="Delete">✕</button>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".schedule-detail-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = parseInt(btn.dataset.id) || btn.dataset.id;
      await chrome.runtime.sendMessage({ action: "deleteScheduledBlock", id });
      await loadScheduleData();
    });
  });
}

function setupSchedulePresetSelector() {
  document.querySelectorAll(".schedule-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".schedule-preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      scheduleBlockType = btn.dataset.type;
    });
  });
}

function setupScheduleClearAll() {
  const btn = document.getElementById("btn-clear-schedule");
  if (btn) {
    btn.addEventListener("click", async () => {
      if (!confirm("Clear all scheduled blocks?")) return;
      const blocks = await chrome.runtime.sendMessage({ action: "getScheduledBlocks" });
      for (const block of (blocks || [])) {
        await chrome.runtime.sendMessage({ action: "deleteScheduledBlock", id: block.id });
      }
      await loadScheduleData();
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTO-DEPLOY TOGGLE
// ═══════════════════════════════════════════════════════════════

function setupAutoDeployToggle() {
  const toggle = document.getElementById("schedule-auto-deploy");
  if (!toggle) return;

  // Load current state
  chrome.runtime.sendMessage({ action: "getSettings" }).then(settings => {
    toggle.checked = settings.scheduleAutoDeploy !== false;
  });

  toggle.addEventListener("change", async () => {
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    settings.scheduleAutoDeploy = toggle.checked;
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
    
    // Also update all existing blocks to have autoDeploy flag
    const blocks = settings.scheduledBlocks || [];
    for (const block of blocks) {
      block.autoDeploy = toggle.checked;
    }
    settings.scheduledBlocks = blocks;
    await chrome.runtime.sendMessage({ action: "saveSettings", settings });
  });
}

// ═══════════════════════════════════════════════════════════════
// WIND-DOWN MODE UI
// ═══════════════════════════════════════════════════════════════

function setupWindDown() {
  const enabledToggle = document.getElementById("winddown-enabled");
  const config = document.getElementById("winddown-config");
  const bedtimeInput = document.getElementById("winddown-bedtime");
  const leadtimeSelect = document.getElementById("winddown-leadtime");
  
  if (!enabledToggle) return;

  // Load current settings
  loadWindDownSettings();

  enabledToggle.addEventListener("change", () => {
    config.style.display = enabledToggle.checked ? "block" : "none";
    saveWindDownSettings();
  });

  bedtimeInput?.addEventListener("change", () => {
    saveWindDownSettings();
    updateWindDownPhaseTimes();
  });

  leadtimeSelect?.addEventListener("change", () => {
    saveWindDownSettings();
    updateWindDownPhaseTimes();
  });

  // Day buttons
  document.querySelectorAll(".winddown-day-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      saveWindDownSettings();
    });
  });
}

async function loadWindDownSettings() {
  try {
    const windDown = await chrome.runtime.sendMessage({ action: "getWindDown" });
    
    const enabledToggle = document.getElementById("winddown-enabled");
    const config = document.getElementById("winddown-config");
    const bedtimeInput = document.getElementById("winddown-bedtime");
    const leadtimeSelect = document.getElementById("winddown-leadtime");

    if (enabledToggle) enabledToggle.checked = windDown.enabled || false;
    if (config) config.style.display = windDown.enabled ? "block" : "none";
    if (bedtimeInput) bedtimeInput.value = windDown.bedtime || "23:00";
    if (leadtimeSelect) leadtimeSelect.value = String(windDown.leadTime || 60);

    // Set day buttons
    const activeDays = windDown.days || [0,1,2,3,4,5,6];
    document.querySelectorAll(".winddown-day-btn").forEach(btn => {
      const day = parseInt(btn.dataset.day);
      btn.classList.toggle("active", activeDays.includes(day));
    });

    updateWindDownPhaseTimes();
    updateWindDownStatus();
  } catch (e) {
    console.warn("Wind-down load error:", e);
  }
}

async function saveWindDownSettings() {
  const enabledToggle = document.getElementById("winddown-enabled");
  const bedtimeInput = document.getElementById("winddown-bedtime");
  const leadtimeSelect = document.getElementById("winddown-leadtime");

  const days = [];
  document.querySelectorAll(".winddown-day-btn.active").forEach(btn => {
    days.push(parseInt(btn.dataset.day));
  });

  const windDown = {
    enabled: enabledToggle?.checked || false,
    bedtime: bedtimeInput?.value || "23:00",
    leadTime: parseInt(leadtimeSelect?.value || "60"),
    days,
  };

  await chrome.runtime.sendMessage({ action: "saveWindDown", windDown });
}

function updateWindDownPhaseTimes() {
  const bedtimeInput = document.getElementById("winddown-bedtime");
  const leadtimeSelect = document.getElementById("winddown-leadtime");
  if (!bedtimeInput || !leadtimeSelect) return;

  const [bedH, bedM] = bedtimeInput.value.split(":").map(Number);
  const bedtimeMin = bedH * 60 + (bedM || 0);
  const leadTime = parseInt(leadtimeSelect.value);

  const warningStart = bedtimeMin - leadTime;
  const softStart = bedtimeMin - Math.floor(leadTime * 0.5);
  const hardStart = bedtimeMin - Math.floor(leadTime * 0.17);

  const fmt = (min) => {
    const h = Math.floor(((min % 1440) + 1440) % 1440 / 60);
    const m = ((min % 1440) + 1440) % 1440 % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const p1 = document.getElementById("winddown-phase1-time");
  const p2 = document.getElementById("winddown-phase2-time");
  const p3 = document.getElementById("winddown-phase3-time");
  if (p1) p1.textContent = fmt(warningStart);
  if (p2) p2.textContent = fmt(softStart);
  if (p3) p3.textContent = fmt(hardStart);
}

async function updateWindDownStatus() {
  try {
    const { phase } = await chrome.runtime.sendMessage({ action: "getWindDownPhase" });
    const statusEl = document.getElementById("winddown-status");
    if (!statusEl) return;

    if (phase === "none" || !phase) {
      statusEl.className = "winddown-status inactive";
      statusEl.textContent = "Wind-down is not active right now.";
    } else if (phase === "warning") {
      statusEl.className = "winddown-status active-phase";
      statusEl.textContent = "🌙 Phase 1 Active — Warning phase. Notifications on distraction sites.";
    } else if (phase === "soft") {
      statusEl.className = "winddown-status active-phase";
      statusEl.textContent = "🌙 Phase 2 Active — Entertainment & social media blocked.";
    } else if (phase === "hard" || phase === "bedtime") {
      statusEl.className = "winddown-status active-phase";
      statusEl.textContent = "🌙 Phase 3 Active — All distracting sites blocked. Time for bed!";
    }
  } catch (e) {}
}

// ═══════════════════════════════════════════════════════════════
// ─── AI Integration (User-Configurable) ───
// ═══════════════════════════════════════════════════════════════

const AI_PROVIDERS = {
  openai: { url: "https://api.openai.com/v1/chat/completions", defaultModel: "gpt-4o-mini" },
  anthropic: { url: "https://api.anthropic.com/v1/messages", defaultModel: "claude-3-haiku-20240307" },
  google: { url: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", defaultModel: "gemini-1.5-flash" },
  custom: { url: "", defaultModel: "" },
};

function setupAIConfig() {
  const providerSelect = document.getElementById("ai-provider");
  const modelInput = document.getElementById("ai-model");
  const customUrlRow = document.querySelector(".ai-custom-url");

  // Load saved config
  chrome.storage.local.get("fg_ai_config", (data) => {
    const cfg = data.fg_ai_config || {};
    if (cfg.provider) providerSelect.value = cfg.provider;
    if (cfg.apiKey) document.getElementById("ai-api-key").value = cfg.apiKey;
    if (cfg.model) modelInput.value = cfg.model;
    if (cfg.baseUrl) document.getElementById("ai-base-url").value = cfg.baseUrl;
    updateProviderUI(cfg.provider || "openai");
  });

  providerSelect.addEventListener("change", () => {
    updateProviderUI(providerSelect.value);
  });

  function updateProviderUI(provider) {
    const info = AI_PROVIDERS[provider];
    if (!modelInput.value || Object.values(AI_PROVIDERS).some(p => p.defaultModel === modelInput.value)) {
      modelInput.value = info.defaultModel;
    }
    modelInput.placeholder = info.defaultModel || "model-name";
    customUrlRow.style.display = provider === "custom" ? "" : "none";
  }

  document.getElementById("btn-save-ai").addEventListener("click", () => {
    const cfg = {
      provider: providerSelect.value,
      apiKey: document.getElementById("ai-api-key").value.trim(),
      model: modelInput.value.trim(),
      baseUrl: document.getElementById("ai-base-url").value.trim(),
    };
    chrome.storage.local.set({ fg_ai_config: cfg }, () => {
      const status = document.getElementById("ai-status");
      status.textContent = "✅ Saved!";
      status.style.color = "#10B981";
      setTimeout(() => { status.textContent = ""; }, 3000);
    });
  });

  document.getElementById("btn-test-ai").addEventListener("click", async () => {
    const status = document.getElementById("ai-status");
    status.textContent = "⏳ Testing...";
    status.style.color = "var(--text-muted)";
    try {
      const result = await callAI("Say 'FocusGuard AI connected!' in 5 words or less.");
      if (result) {
        status.textContent = "✅ " + result.slice(0, 50);
        status.style.color = "#10B981";
      } else {
        status.textContent = "❌ No response received";
        status.style.color = "#F43F5E";
      }
    } catch (e) {
      status.textContent = "❌ " + (e.message || "Connection failed");
      status.style.color = "#F43F5E";
    }
  });
}

async function getAIConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get("fg_ai_config", (data) => {
      resolve(data.fg_ai_config || {});
    });
  });
}

async function callAI(prompt, systemPrompt = "You are a concise productivity analyst for FocusGuard.") {
  const cfg = await getAIConfig();
  if (!cfg.apiKey) throw new Error("No API key configured. Go to Settings > AI Integration.");

  const provider = cfg.provider || "openai";
  const model = cfg.model || AI_PROVIDERS[provider]?.defaultModel || "gpt-4o-mini";

  if (provider === "anthropic") {
    const url = AI_PROVIDERS.anthropic.url;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  if (provider === "google") {
    const url = AI_PROVIDERS.google.url.replace("{model}", model) + `?key=${cfg.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt + "\n\n" + prompt }] }],
      }),
    });
    if (!res.ok) throw new Error(`Google AI error: ${res.status}`);
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  // OpenAI-compatible (openai + custom)
  const url = provider === "custom" && cfg.baseUrl
    ? cfg.baseUrl.replace(/\/$/, "") + "/chat/completions"
    : AI_PROVIDERS.openai.url;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── AI-Powered Insights ───
async function generateAIInsight(usageData) {
  try {
    const cfg = await getAIConfig();
    if (!cfg.apiKey) return null;

    const prompt = `Analyze this productivity data and give 2-3 specific, actionable tips (each 1 sentence max):
- Active time: ${formatTime(usageData.totalActive || 0)}
- Focus ratio: ${usageData.totalActive > 0 ? Math.round(((usageData.focusTime || 0) / usageData.totalActive) * 100) : 0}%
- Top domains: ${Object.entries(usageData.domains || {}).sort((a, b) => (b[1].time || 0) - (a[1].time || 0)).slice(0, 5).map(([d, i]) => `${d} (${Math.round(i.time)}m, ${i.category})`).join(", ")}
Keep it brief and motivational.`;

    return await callAI(prompt);
  } catch (e) {
    console.warn("AI insight error:", e);
    return null;
  }
}

// ─── AI-Enhanced Report Summary ───
async function generateAIReportSummary(reportData) {
  try {
    const cfg = await getAIConfig();
    if (!cfg.apiKey) return null;

    const prompt = `Write a 3-sentence executive summary for this productivity report:
- Score: ${reportData.score}/100 (Grade: ${reportData.grade})
- Active time: ${reportData.activeTime}
- Focus ratio: ${reportData.focusRatio}%
- Top productive sites: ${reportData.productiveSites}
- Top distracting sites: ${reportData.distractingSites}
- Focus sessions completed: ${reportData.sessionsCompleted}
Be professional but encouraging.`;

    return await callAI(prompt, "You are a professional productivity coach writing report summaries for FocusGuard.");
  } catch (e) {
    console.warn("AI report summary error:", e);
    return null;
  }
}

