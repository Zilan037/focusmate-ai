// content.js — Premium floating productivity widget V3 with focus timer & tasks

(function () {
  if (
    location.protocol === "chrome:" ||
    location.protocol === "chrome-extension:" ||
    location.protocol === "about:"
  ) {
    return;
  }

  const WIDGET_ID = "focusguard-widget";
  if (document.getElementById(WIDGET_ID)) return;

  let currentTheme = "dark";
  try {
    chrome.storage.local.get("focusguard_theme", (result) => {
      currentTheme = result.focusguard_theme || "dark";
      applyWidgetTheme();
    });
  } catch (e) {}

  const widget = document.createElement("div");
  widget.id = WIDGET_ID;
  widget.innerHTML = `
    <div id="fg-bubble" class="fg-bubble">
      <svg class="fg-bubble-ring" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(37,99,235,0.15)" stroke-width="2"/>
        <circle id="fg-bubble-progress" cx="24" cy="24" r="21" fill="none" stroke="#2563EB" stroke-width="2.5" 
          stroke-dasharray="132" stroke-dashoffset="132" stroke-linecap="round" 
          style="transform:rotate(-90deg);transform-origin:center;transition:stroke-dashoffset 1s ease-out;"/>
      </svg>
      <svg class="fg-bubble-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="rgba(37,99,235,0.2)" stroke="#2563EB" stroke-width="1.5"/>
        <path d="M9 12l2 2 4-4" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span id="fg-bubble-timer" class="fg-bubble-timer"></span>
    </div>
    <div id="fg-expanded" class="fg-expanded">
      <div id="fg-widget-header" class="fg-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="rgba(37,99,235,0.2)" stroke="#2563EB" stroke-width="1.5"/>
        </svg>
        <span class="fg-title">FocusGuard</span>
        <button id="fg-minimize" class="fg-close">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="fg-body">
        <!-- Focus Timer Section (shown during focus) -->
        <div id="fg-focus-timer-section" class="fg-focus-timer-section" style="display:none;">
          <div class="fg-timer-display" id="fg-timer-display">25:00</div>
          <div class="fg-timer-label">Focus Session Active</div>
        </div>
        <!-- Task Checklist (shown during focus) -->
        <div id="fg-tasks-section" class="fg-tasks-section" style="display:none;">
          <div class="fg-section-label">TASKS</div>
          <div id="fg-task-list" class="fg-task-list"></div>
          <div class="fg-task-count" id="fg-task-count">0/0 done</div>
        </div>
        <!-- Allowed Sites Indicator -->
        <div id="fg-allowed-section" class="fg-allowed-section" style="display:none;">
          <div class="fg-section-label">ALLOWED ONLY</div>
          <div id="fg-allowed-list" class="fg-allowed-list"></div>
        </div>
        <!-- Standard Stats -->
        <div class="fg-stat-row">
          <span class="fg-dot" style="background:#2563EB"></span>
          <span class="fg-label">This site</span>
          <span class="fg-value" id="fg-domain-time">0m</span>
        </div>
        <div class="fg-stat-row">
          <span class="fg-dot" style="background:#10B981"></span>
          <span class="fg-label">Total today</span>
          <span class="fg-value" id="fg-total-time">0m</span>
        </div>
        <div id="fg-focus-section" class="fg-stat-row fg-focus-row" style="display:none;">
          <span class="fg-dot" style="background:#F59E0B"></span>
          <span class="fg-label">Focus</span>
          <span class="fg-value fg-focus-value" id="fg-focus-time">0m</span>
        </div>
        <button id="fg-quick-focus" class="fg-focus-btn">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 14,8 3,15"/></svg>
          Focus 25m
        </button>
        <!-- Blocked Sites (shown during focus) -->
        <div id="fg-blocked-section" class="fg-blocked-section" style="display:none;">
          <div class="fg-section-label">BLOCKED</div>
          <div id="fg-blocked-list" class="fg-blocked-list"></div>
        </div>
        <button id="fg-block-btn" class="fg-block-btn">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.5"/><line x1="3.5" y1="3.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="1.5"/></svg>
          Block Site
        </button>
      </div>
    </div>
  `;

  function getWidgetColors() {
    const isLight = currentTheme === "light";
    return {
      bg: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(15, 23, 42, 0.88)",
      border: isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)",
      borderHover: isLight ? "rgba(37, 99, 235, 0.3)" : "rgba(37, 99, 235, 0.3)",
      text: isLight ? "#475569" : "#94A3B8",
      textStrong: isLight ? "#0F172A" : "#F8FAFC",
      textMuted: isLight ? "#94A3B8" : "#64748B",
      closeBg: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)",
      shadow: isLight ? "0 4px 24px rgba(0, 0, 0, 0.08)" : "0 4px 24px rgba(0, 0, 0, 0.4)",
      shadowHover: isLight ? "0 4px 30px rgba(37, 99, 235, 0.15)" : "0 4px 30px rgba(37, 99, 235, 0.25)",
      accentGlow: "0 0 20px rgba(37, 99, 235, 0.4)",
    };
  }

  function applyWidgetTheme() {
    const c = getWidgetColors();
    const styleEl = document.getElementById("fg-style");
    if (!styleEl) return;
    styleEl.textContent = generateStyles(c);
  }

  function generateStyles(c) {
    return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap');

    #${WIDGET_ID} {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      user-select: none;
    }

    .fg-bubble {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${c.bg};
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid ${c.border};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: ${c.shadow};
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }
    .fg-bubble:hover {
      transform: scale(1.08);
      border-color: ${c.borderHover};
      box-shadow: ${c.shadowHover};
    }
    .fg-bubble.fg-pulse {
      animation: fgPulse 2s ease-in-out infinite;
      box-shadow: ${c.accentGlow};
      border-color: rgba(37, 99, 235, 0.4);
    }
    .fg-bubble-ring {
      position: absolute;
      inset: -2px;
      width: calc(100% + 4px);
      height: calc(100% + 4px);
    }
    .fg-bubble-icon { position: relative; }
    .fg-bubble-timer {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 8px;
      font-weight: 800;
      color: #2563EB;
      background: ${c.bg};
      border: 1px solid rgba(37,99,235,0.2);
      border-radius: 6px;
      padding: 1px 4px;
      font-family: 'JetBrains Mono', monospace;
      white-space: nowrap;
      display: none;
    }
    .fg-bubble.fg-pulse .fg-bubble-timer { display: block; }

    .fg-expanded {
      display: none;
      width: 250px;
      background: ${c.bg};
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid ${c.border};
      border-radius: 20px;
      box-shadow: ${c.shadow};
      overflow: hidden;
      animation: fgScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    #${WIDGET_ID}.fg-open .fg-bubble { display: none; }
    #${WIDGET_ID}.fg-open .fg-expanded { display: block; }

    .fg-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 14px;
      border-bottom: 1px solid ${c.border};
      cursor: move;
    }
    .fg-title {
      flex: 1;
      font-size: 11px;
      font-weight: 800;
      color: ${c.text};
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .fg-close {
      display: flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border: none;
      background: ${c.closeBg}; border-radius: 8px;
      color: ${c.textMuted}; cursor: pointer; transition: all 0.2s;
    }
    .fg-close:hover { background: rgba(244,63,94,0.15); color: #F43F5E; }

    .fg-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; }

    .fg-focus-timer-section {
      text-align: center;
      padding: 8px 0;
      border-bottom: 1px solid ${c.border};
      margin-bottom: 4px;
    }
    .fg-timer-display {
      font-size: 28px;
      font-weight: 900;
      font-family: 'JetBrains Mono', monospace;
      color: #2563EB;
      letter-spacing: -0.05em;
      text-shadow: 0 0 20px rgba(37,99,235,0.3);
    }
    .fg-timer-label {
      font-size: 9px;
      font-weight: 700;
      color: ${c.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 2px;
    }

    .fg-tasks-section {
      padding: 6px 0;
      border-bottom: 1px solid ${c.border};
      margin-bottom: 4px;
    }
    .fg-section-label {
      font-size: 9px;
      font-weight: 800;
      color: ${c.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 6px;
    }
    .fg-task-list { display: flex; flex-direction: column; gap: 4px; }
    .fg-task-item {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 600; color: ${c.text};
      cursor: pointer; padding: 2px 0;
    }
    .fg-task-item.done { text-decoration: line-through; opacity: 0.5; }
    .fg-task-check {
      width: 14px; height: 14px; border-radius: 4px;
      border: 1.5px solid ${c.textMuted};
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: all 0.2s;
    }
    .fg-task-item.done .fg-task-check {
      background: #10B981; border-color: #10B981;
    }
    .fg-task-count {
      font-size: 10px; font-weight: 700; color: ${c.textMuted}; margin-top: 4px;
    }

    .fg-allowed-section {
      padding: 6px 0;
      border-bottom: 1px solid ${c.border};
      margin-bottom: 4px;
    }
    .fg-allowed-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .fg-allowed-pill {
      font-size: 9px; font-weight: 700; color: #10B981;
      background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
      border-radius: 8px; padding: 2px 6px;
    }

    .fg-blocked-section {
      padding: 6px 0;
      border-bottom: 1px solid ${c.border};
      margin-bottom: 4px;
    }
    .fg-blocked-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .fg-blocked-pill {
      font-size: 9px; font-weight: 700; color: #F43F5E;
      background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.2);
      border-radius: 8px; padding: 2px 6px;
    }

    .fg-stat-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; }
    .fg-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .fg-label { flex: 1; font-size: 11px; color: ${c.textMuted}; font-weight: 600; }
    .fg-value { font-size: 12px; font-weight: 800; color: ${c.textStrong}; font-variant-numeric: tabular-nums; font-family: 'JetBrains Mono', monospace; }
    .fg-focus-value { color: #2563EB; text-shadow: 0 0 12px rgba(37, 99, 235, 0.4); }

    .fg-focus-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; padding: 8px;
      background: linear-gradient(135deg, rgba(37,99,235,0.1), rgba(99,102,241,0.1));
      border: 1px solid rgba(37,99,235,0.15); border-radius: 12px;
      color: #2563EB; cursor: pointer;
      font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
      transition: all 0.2s;
    }
    .fg-focus-btn:hover { background: linear-gradient(135deg, rgba(37,99,235,0.18), rgba(99,102,241,0.18)); border-color: rgba(37,99,235,0.3); }

    .fg-block-btn {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      width: 100%; margin-top: 2px; padding: 8px;
      background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.12);
      border-radius: 12px; color: #F43F5E; cursor: pointer;
      font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
      transition: all 0.2s;
    }
    .fg-block-btn:hover { background: rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.25); }

    @keyframes fgScaleIn {
      from { opacity: 0; transform: scale(0.9) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes fgPulse {
      0%, 100% { box-shadow: ${c.shadow}; }
      50% { box-shadow: ${c.accentGlow}; }
    }
  `;
  }

  const style = document.createElement("style");
  style.id = "fg-style";
  style.textContent = generateStyles(getWidgetColors());

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(widget);

  // ─── Toggle ───
  const bubble = document.getElementById("fg-bubble");
  const minimizeBtn = document.getElementById("fg-minimize");

  bubble.addEventListener("click", () => widget.classList.add("fg-open"));
  minimizeBtn.addEventListener("click", (e) => { e.stopPropagation(); widget.classList.remove("fg-open"); });

  // ─── Dragging ───
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  const header = document.getElementById("fg-widget-header");

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".fg-close")) return;
    isDragging = true;
    const rect = widget.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    widget.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    widget.style.left = (e.clientX - dragOffset.x) + "px";
    widget.style.top = (e.clientY - dragOffset.y) + "px";
    widget.style.right = "auto";
    widget.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) { isDragging = false; widget.style.transition = ""; }
  });

  // ─── Data ───
  function formatMinutes(m) {
    if (!m || m <= 0) return "0m";
    if (m < 1) return Math.round(m * 60) + "s";
    const totalMins = Math.floor(m);
    const h = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (h === 0) return `${mins}m`;
    if (mins === 0) return `${h}h`;
    return `${h}h ${mins}m`;
  }

  function formatTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  async function updateWidget() {
    try {
      const domain = location.hostname.replace(/^www\./, "");
      const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
      const focusState = await chrome.runtime.sendMessage({ action: "getFocusState" });

      document.getElementById("fg-domain-time").textContent = formatMinutes(usage?.domains?.[domain]?.time || 0);
      document.getElementById("fg-total-time").textContent = formatMinutes(usage?.totalActive || 0);

      const focusPct = usage?.totalActive > 0 ? (usage.focusTime / usage.totalActive) : 0;
      const progressRing = document.getElementById("fg-bubble-progress");
      if (progressRing) {
        progressRing.style.strokeDashoffset = 132 * (1 - focusPct);
      }

      const focusSection = document.getElementById("fg-focus-section");
      const quickFocusBtn = document.getElementById("fg-quick-focus");
      const timerSection = document.getElementById("fg-focus-timer-section");
      const tasksSection = document.getElementById("fg-tasks-section");
      const allowedSection = document.getElementById("fg-allowed-section");
      const bubbleTimer = document.getElementById("fg-bubble-timer");

      if (focusState?.active) {
        focusSection.style.display = "flex";
        document.getElementById("fg-focus-time").textContent = (focusState.remaining || 0) + "m left";
        bubble.classList.add("fg-pulse");
        if (quickFocusBtn) quickFocusBtn.style.display = "none";

        // Show timer in expanded view
        if (timerSection) {
          timerSection.style.display = "block";
          const remainingSec = (focusState.remaining || 0) * 60;
          document.getElementById("fg-timer-display").textContent = formatTimer(remainingSec);
        }

        // Show timer on bubble
        if (bubbleTimer) {
          bubbleTimer.textContent = (focusState.remaining || 0) + "m";
        }

        // Show tasks
        if (tasksSection && focusState.tasks && focusState.tasks.length > 0) {
          tasksSection.style.display = "block";
          const taskList = document.getElementById("fg-task-list");
          taskList.innerHTML = "";
          let doneCount = 0;
          focusState.tasks.forEach((task, i) => {
            if (task.done) doneCount++;
            const item = document.createElement("div");
            item.className = "fg-task-item" + (task.done ? " done" : "");
            item.innerHTML = `<div class="fg-task-check">${task.done ? "✓" : ""}</div><span>${task.text}</span>`;
            item.addEventListener("click", async () => {
              await chrome.runtime.sendMessage({ action: "toggleFocusTask", index: i });
              updateWidget();
            });
            taskList.appendChild(item);
          });
          document.getElementById("fg-task-count").textContent = `${doneCount}/${focusState.tasks.length} done`;
        } else if (tasksSection) {
          tasksSection.style.display = "none";
        }

        // Show blocked sites
        const blockedSection = document.getElementById("fg-blocked-section");
        try {
          const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
          // Filter out system-default domains (NSFW/gambling) — never show those names
          const userBlockedDomains = (settings.blockedDomains || [])
            .filter(b => !(typeof b === "object" && b.systemDefault))
            .map(b => typeof b === "string" ? b : b.domain);
          if (blockedSection && userBlockedDomains.length > 0) {
            blockedSection.style.display = "block";
            const bList = document.getElementById("fg-blocked-list");
            bList.innerHTML = "";
            userBlockedDomains.slice(0, 6).forEach(site => {
              const pill = document.createElement("span");
              pill.className = "fg-blocked-pill";
              pill.textContent = site;
              bList.appendChild(pill);
            });
            if (userBlockedDomains.length > 6) {
              const more = document.createElement("span");
              more.className = "fg-blocked-pill";
              more.textContent = `+${userBlockedDomains.length - 6}`;
              bList.appendChild(more);
            }
          } else if (blockedSection) {
            blockedSection.style.display = "none";
          }
        } catch (e) {
          if (blockedSection) blockedSection.style.display = "none";
        }

        // Show allowed sites
        if (allowedSection && focusState.allowedSites && focusState.allowedSites.length > 0) {
          allowedSection.style.display = "block";
          const list = document.getElementById("fg-allowed-list");
          list.innerHTML = "";
          focusState.allowedSites.forEach((site) => {
            const pill = document.createElement("span");
            pill.className = "fg-allowed-pill";
            pill.textContent = site;
            list.appendChild(pill);
          });
        } else if (allowedSection) {
          allowedSection.style.display = "none";
        }
      } else {
        focusSection.style.display = "none";
        bubble.classList.remove("fg-pulse");
        if (quickFocusBtn) quickFocusBtn.style.display = "flex";
        if (timerSection) timerSection.style.display = "none";
        if (tasksSection) tasksSection.style.display = "none";
        if (allowedSection) allowedSection.style.display = "none";
        if (bubbleTimer) bubbleTimer.style.display = "none";
      }
    } catch (e) {}
  }

  updateWidget();
  setInterval(updateWidget, 15000);

  // ─── Quick Focus ───
  document.getElementById("fg-quick-focus").addEventListener("click", async (e) => {
    e.stopPropagation();
    await chrome.runtime.sendMessage({ action: "startFocus", duration: 25, tasks: [] });
    updateWidget();
  });

  // ─── Block ───
  document.getElementById("fg-block-btn").addEventListener("click", async (e) => {
    e.stopPropagation();
    const domain = location.hostname.replace(/^www\./, "");
    if (confirm(`Block ${domain}?`)) {
      await chrome.runtime.sendMessage({ action: "blockDomain", domain });
      location.href = "about:blank";
    }
  });
})();
