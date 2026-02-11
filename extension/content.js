// content.js — Floating productivity widget injected on every page

(function () {
  // Don't inject on chrome:// or extension pages
  if (
    location.protocol === "chrome:" ||
    location.protocol === "chrome-extension:" ||
    location.protocol === "about:"
  ) {
    return;
  }

  const WIDGET_ID = "focusguard-widget";

  // Prevent double injection
  if (document.getElementById(WIDGET_ID)) return;

  // ─── Create Widget ───
  const widget = document.createElement("div");
  widget.id = WIDGET_ID;
  widget.innerHTML = `
    <div id="fg-widget-header">
      <span id="fg-logo">🛡️</span>
      <span id="fg-title">FocusGuard</span>
      <button id="fg-minimize" title="Minimize">−</button>
    </div>
    <div id="fg-widget-body">
      <div class="fg-stat">
        <span class="fg-stat-label">This site</span>
        <span class="fg-stat-value" id="fg-domain-time">0m</span>
      </div>
      <div class="fg-stat">
        <span class="fg-stat-label">Total today</span>
        <span class="fg-stat-value" id="fg-total-time">0m</span>
      </div>
      <div id="fg-focus-section" style="display:none;">
        <div class="fg-stat fg-focus-stat">
          <span class="fg-stat-label">⏱ Focus</span>
          <span class="fg-stat-value" id="fg-focus-time">0m</span>
        </div>
      </div>
      <button id="fg-block-btn" title="Block this site">🚫 Block Site</button>
    </div>
  `;

  // ─── Styles ───
  const style = document.createElement("style");
  style.textContent = `
    #${WIDGET_ID} {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 200px;
      background: #1a1a2e;
      border: 1px solid #2a2a4a;
      border-radius: 12px;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      z-index: 2147483647;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      overflow: hidden;
      transition: all 0.3s ease;
      cursor: move;
      user-select: none;
    }
    #${WIDGET_ID}.fg-minimized {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      cursor: pointer;
    }
    #${WIDGET_ID}.fg-minimized #fg-widget-body,
    #${WIDGET_ID}.fg-minimized #fg-title,
    #${WIDGET_ID}.fg-minimized #fg-minimize {
      display: none;
    }
    #${WIDGET_ID}.fg-minimized #fg-widget-header {
      padding: 10px;
      justify-content: center;
      border: none;
    }
    #fg-widget-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #16162a;
      border-bottom: 1px solid #2a2a4a;
    }
    #fg-logo { font-size: 16px; }
    #fg-title { flex: 1; font-weight: 600; font-size: 12px; color: #a0a0c0; }
    #fg-minimize {
      background: none;
      border: none;
      color: #a0a0c0;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
      line-height: 1;
    }
    #fg-minimize:hover { color: #fff; }
    #fg-widget-body { padding: 10px 12px; }
    .fg-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }
    .fg-stat-label { color: #888; font-size: 11px; }
    .fg-stat-value { font-weight: 700; color: #7c8aff; font-size: 13px; }
    .fg-focus-stat .fg-stat-value { color: #3b82f6; }
    #fg-block-btn {
      display: block;
      width: 100%;
      margin-top: 8px;
      padding: 6px;
      background: rgba(239,68,68,0.15);
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 6px;
      color: #ef4444;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      transition: background 0.2s;
    }
    #fg-block-btn:hover { background: rgba(239,68,68,0.25); }
  `;

  document.documentElement.appendChild(style);
  document.documentElement.appendChild(widget);

  // ─── Minimize/Expand ───
  let minimized = false;
  document.getElementById("fg-minimize").addEventListener("click", (e) => {
    e.stopPropagation();
    minimized = true;
    widget.classList.add("fg-minimized");
  });
  widget.addEventListener("click", () => {
    if (minimized) {
      minimized = false;
      widget.classList.remove("fg-minimized");
    }
  });

  // ─── Dragging ───
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  widget.addEventListener("mousedown", (e) => {
    if (e.target.id === "fg-block-btn" || e.target.id === "fg-minimize") return;
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
    isDragging = false;
    widget.style.transition = "all 0.3s ease";
  });

  // ─── Data Updates ───
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

      // Domain time
      const domainTime = usage?.domains?.[domain]?.time || 0;
      document.getElementById("fg-domain-time").textContent = formatMinutes(domainTime);

      // Total time
      document.getElementById("fg-total-time").textContent = formatMinutes(usage?.totalActive || 0);

      // Focus mode
      const focusSection = document.getElementById("fg-focus-section");
      if (focusState?.active) {
        focusSection.style.display = "block";
        document.getElementById("fg-focus-time").textContent = focusState.remaining + "m left";
      } else {
        focusSection.style.display = "none";
      }
    } catch (e) {
      // Extension context may be invalidated
    }
  }

  // Update every 30 seconds
  updateWidget();
  setInterval(updateWidget, 30000);

  // ─── Block Button ───
  document.getElementById("fg-block-btn").addEventListener("click", async (e) => {
    e.stopPropagation();
    const domain = location.hostname.replace(/^www\./, "");
    if (confirm(`Block ${domain}? You'll be redirected away from this site.`)) {
      await chrome.runtime.sendMessage({ action: "blockDomain", domain });
      location.href = "about:blank";
    }
  });
})();
