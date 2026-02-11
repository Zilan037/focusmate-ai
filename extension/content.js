// content.js — Premium floating productivity widget V2

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

  // Get theme
  let currentTheme = "dark";
  try {
    chrome.storage.local.get("focusguard_theme", (result) => {
      currentTheme = result.focusguard_theme || "dark";
      applyWidgetTheme();
    });
  } catch(e) {}

  const widget = document.createElement("div");
  widget.id = WIDGET_ID;
  widget.innerHTML = `
    <div id="fg-bubble" class="fg-bubble">
      <svg class="fg-bubble-ring" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(91,140,255,0.15)" stroke-width="2"/>
        <circle id="fg-bubble-progress" cx="24" cy="24" r="21" fill="none" stroke="#5B8CFF" stroke-width="2" 
          stroke-dasharray="132" stroke-dashoffset="132" stroke-linecap="round" 
          style="transform:rotate(-90deg);transform-origin:center;transition:stroke-dashoffset 1s ease-out;"/>
      </svg>
      <svg class="fg-bubble-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="rgba(91,140,255,0.2)" stroke="#5B8CFF" stroke-width="1.5"/>
        <path d="M9 12l2 2 4-4" stroke="#5B8CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div id="fg-expanded" class="fg-expanded">
      <div id="fg-widget-header" class="fg-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="rgba(91,140,255,0.2)" stroke="#5B8CFF" stroke-width="1.5"/>
        </svg>
        <span class="fg-title">FocusGuard</span>
        <button id="fg-minimize" class="fg-close">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="fg-body">
        <div class="fg-stat-row">
          <span class="fg-dot" style="background:#5B8CFF"></span>
          <span class="fg-label">This site</span>
          <span class="fg-value" id="fg-domain-time">0m</span>
        </div>
        <div class="fg-stat-row">
          <span class="fg-dot" style="background:#34D399"></span>
          <span class="fg-label">Total today</span>
          <span class="fg-value" id="fg-total-time">0m</span>
        </div>
        <div id="fg-focus-section" class="fg-stat-row fg-focus-row" style="display:none;">
          <span class="fg-dot" style="background:#FBBF24"></span>
          <span class="fg-label">Focus</span>
          <span class="fg-value fg-focus-value" id="fg-focus-time">0m</span>
        </div>
        <button id="fg-quick-focus" class="fg-focus-btn">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 14,8 3,15"/></svg>
          Focus 25m
        </button>
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
      bg: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(12, 12, 30, 0.85)",
      border: isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)",
      borderHover: isLight ? "rgba(91, 140, 255, 0.3)" : "rgba(91, 140, 255, 0.3)",
      text: isLight ? "rgba(26, 26, 46, 0.7)" : "rgba(232, 236, 244, 0.7)",
      textStrong: isLight ? "#1A1A2E" : "#E8ECF4",
      textMuted: isLight ? "rgba(26, 26, 46, 0.5)" : "rgba(232, 236, 244, 0.5)",
      closeBg: isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)",
      shadow: isLight ? "0 4px 24px rgba(0, 0, 0, 0.1)" : "0 4px 24px rgba(0, 0, 0, 0.4)",
      shadowHover: isLight ? "0 4px 24px rgba(91, 140, 255, 0.15)" : "0 4px 24px rgba(91, 140, 255, 0.2)",
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    #${WIDGET_ID} {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
    }
    .fg-bubble-ring {
      position: absolute;
      inset: -2px;
      width: calc(100% + 4px);
      height: calc(100% + 4px);
    }
    .fg-bubble-icon {
      position: relative;
    }

    .fg-expanded {
      display: none;
      width: 230px;
      background: ${c.bg};
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid ${c.border};
      border-radius: 16px;
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
      padding: 10px 12px;
      border-bottom: 1px solid ${c.border};
      cursor: move;
    }
    .fg-title {
      flex: 1;
      font-size: 11px;
      font-weight: 700;
      color: ${c.text};
      letter-spacing: 0.3px;
    }
    .fg-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: none;
      background: ${c.closeBg};
      border-radius: 6px;
      color: ${c.textMuted};
      cursor: pointer;
      transition: all 0.2s;
    }
    .fg-close:hover {
      background: rgba(248, 113, 113, 0.15);
      color: #F87171;
    }

    .fg-body {
      padding: 10px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .fg-stat-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    .fg-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .fg-label {
      flex: 1;
      font-size: 11px;
      color: ${c.textMuted};
    }
    .fg-value {
      font-size: 12px;
      font-weight: 700;
      color: ${c.textStrong};
      font-variant-numeric: tabular-nums;
    }
    .fg-focus-value {
      color: #5B8CFF;
      text-shadow: 0 0 12px rgba(91, 140, 255, 0.4);
    }

    .fg-focus-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 7px;
      background: linear-gradient(135deg, rgba(91,140,255,0.1), rgba(124,106,255,0.1));
      border: 1px solid rgba(91,140,255,0.15);
      border-radius: 10px;
      color: #5B8CFF;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .fg-focus-btn:hover {
      background: linear-gradient(135deg, rgba(91,140,255,0.18), rgba(124,106,255,0.18));
      border-color: rgba(91,140,255,0.3);
    }

    .fg-block-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 2px;
      padding: 7px;
      background: rgba(248, 113, 113, 0.08);
      border: 1px solid rgba(248, 113, 113, 0.12);
      border-radius: 10px;
      color: #F87171;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.2s;
    }
    .fg-block-btn:hover {
      background: rgba(248, 113, 113, 0.15);
      border-color: rgba(248, 113, 113, 0.25);
    }

    @keyframes fgScaleIn {
      from { opacity: 0; transform: scale(0.9) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes fgPulse {
      0%, 100% { box-shadow: ${c.shadow}; }
      50% { box-shadow: ${c.shadowHover}; }
    }
  `;
  }

  const style = document.createElement("style");
  style.id = "fg-style";
  const c = getWidgetColors();
  style.textContent = generateStyles(c);

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(widget);

  // ─── Toggle ───
  const bubble = document.getElementById("fg-bubble");
  const minimizeBtn = document.getElementById("fg-minimize");

  bubble.addEventListener("click", () => {
    widget.classList.add("fg-open");
  });

  minimizeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    widget.classList.remove("fg-open");
  });

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
    if (isDragging) {
      isDragging = false;
      widget.style.transition = "";
    }
  });

  // ─── Data ───
  function formatMinutes(m) {
    if (m < 1) return "<1m";
    if (m < 60) return Math.round(m) + "m";
    const h = Math.floor(m / 60);
    const mins = Math.round(m % 60);
    return `${h}h ${mins}m`;
  }

  async function updateWidget() {
    try {
      const domain = location.hostname.replace(/^www\./, "");
      const usage = await chrome.runtime.sendMessage({ action: "getTodayUsage" });
      const focusState = await chrome.runtime.sendMessage({ action: "getFocusState" });

      document.getElementById("fg-domain-time").textContent = formatMinutes(usage?.domains?.[domain]?.time || 0);
      document.getElementById("fg-total-time").textContent = formatMinutes(usage?.totalActive || 0);

      // Update bubble progress ring (focus percentage)
      const focusPct = usage?.totalActive > 0 ? (usage.focusTime / usage.totalActive) : 0;
      const progressRing = document.getElementById("fg-bubble-progress");
      if (progressRing) {
        const circumference = 132;
        progressRing.style.strokeDashoffset = circumference * (1 - focusPct);
      }

      const focusSection = document.getElementById("fg-focus-section");
      const quickFocusBtn = document.getElementById("fg-quick-focus");
      if (focusState?.active) {
        focusSection.style.display = "flex";
        document.getElementById("fg-focus-time").textContent = focusState.remaining + "m left";
        bubble.classList.add("fg-pulse");
        if (quickFocusBtn) quickFocusBtn.style.display = "none";
      } else {
        focusSection.style.display = "none";
        bubble.classList.remove("fg-pulse");
        if (quickFocusBtn) quickFocusBtn.style.display = "flex";
      }
    } catch (e) {}
  }

  updateWidget();
  setInterval(updateWidget, 30000);

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
