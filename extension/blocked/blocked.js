// blocked.js — FocusGuard V3 Premium block page

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
];

let quoteIndex = 0;
let pageStartTime = Date.now();

document.addEventListener("DOMContentLoaded", init);

function init() {
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain") || "Unknown";
  const reason = params.get("reason") || "This site is blocked.";

  document.getElementById("blocked-domain").textContent = domain;
  document.getElementById("blocked-reason").textContent = reason;

  // Auto-redirect: if domain is no longer blocked, navigate to it
  checkIfStillBlocked(domain);
  setInterval(() => checkIfStillBlocked(domain), 2000);

  // Random first quote
  quoteIndex = Math.floor(Math.random() * quotes.length);
  showQuote(quoteIndex);

  // Auto-rotate quotes
  setInterval(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    const quoteEl = document.getElementById("quote-text");
    const authorEl = document.getElementById("quote-author");
    quoteEl.style.opacity = "0";
    authorEl.style.opacity = "0";
    setTimeout(() => {
      showQuote(quoteIndex);
      quoteEl.style.opacity = "1";
      authorEl.style.opacity = "1";
    }, 300);
  }, 10000);

  // Time on page counter
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - pageStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    document.getElementById("time-on-page").textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
  }, 1000);

  // Resist counter
  loadResistCount();

  checkRequirements();
  setInterval(checkRequirements, 5000);

  setupOverride(domain);
  setupBreathing();
  setupUnlockReveal();

  document.getElementById("btn-go-back").addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  });

  document.getElementById("btn-unlock").addEventListener("click", () => {
    safeMessage({ action: "unblockDomain", domain }, () => {
      window.location.replace("https://" + domain);
    });
  });

  // Quick unblock button (for user-blocked, non-system sites only)
  setupQuickUnblock(domain, reason);
}

// ─── Safe messaging with fallback ───
function safeMessage(msg, callback) {
  try {
    chrome.runtime.sendMessage(msg, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[FocusGuard] Message failed:", chrome.runtime.lastError.message);
        // Fallback: try direct storage manipulation for unblock
        if (msg.action === "unblockDomain") {
          fallbackUnblock(msg.domain).then(() => {
            if (callback) callback();
          });
          return;
        }
      }
      if (callback) callback(response);
    });
  } catch (e) {
    console.warn("[FocusGuard] sendMessage error:", e);
    if (msg.action === "unblockDomain") {
      fallbackUnblock(msg.domain).then(() => {
        if (callback) callback();
      });
    }
  }
}

// ─── Fallback: unblock domain directly via storage when service worker is down ───
async function fallbackUnblock(domain) {
  try {
    const result = await chrome.storage.local.get("focusguard_settings");
    const settings = result.focusguard_settings;
    if (!settings || !settings.blockedDomains) return;
    
    const entry = settings.blockedDomains.find(b => {
      const d = typeof b === "string" ? b : b.domain;
      return d === domain;
    });
    
    // Don't unblock system defaults
    if (entry && typeof entry === "object" && entry.systemDefault) {
      alert("This site is protected by FocusGuard Safety Shield and cannot be unblocked.");
      return;
    }
    
    settings.blockedDomains = settings.blockedDomains.filter(b => {
      const d = typeof b === "string" ? b : b.domain;
      return d !== domain;
    });
    
    await chrome.storage.local.set({ focusguard_settings: settings });
    
    // Also try to clear declarativeNetRequest rules
    try {
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIds = rules.filter(r => r.id >= 20000 && r.id < 22500).map(r => r.id);
      if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds });
      }
    } catch (e) {}
  } catch (e) {
    console.warn("[FocusGuard] Fallback unblock failed:", e);
  }
}

async function setupQuickUnblock(domain, reason) {
  // Don't show for system/safety blocks
  if (reason.includes("Safety Shield") || reason.includes("Safety Mode")) return;
  
  try {
    const result = await chrome.storage.local.get("focusguard_settings");
    const settings = result.focusguard_settings || {};
    const blockedDomains = settings.blockedDomains || [];
    
    const entry = blockedDomains.find(b => {
      const d = typeof b === "string" ? b : b.domain;
      return d === domain;
    });
    
    // Only show for user-blocked (not system default, not locked)
    if (entry && typeof entry === "object" && (entry.systemDefault || entry.locked)) return;
    
    // Also don't show during focus mode blocks
    if (reason.includes("Focus Mode") || reason.includes("Allowed Sites")) return;
    
    const section = document.getElementById("quick-unblock-section");
    if (section) {
      section.style.display = "block";
      document.getElementById("btn-quick-unblock").addEventListener("click", async () => {
        await fallbackUnblock(domain);
        safeMessage({ action: "unblockDomain", domain }, () => {});
        window.location.replace("https://" + domain);
      });
    }
  } catch (e) {}
}

function showQuote(index) {
  const q = quotes[index];
  document.getElementById("quote-text").textContent = `"${q.text}"`;
  document.getElementById("quote-author").textContent = `— ${q.author}`;
}

// ─── Auto-redirect if domain is no longer blocked ───
async function checkIfStillBlocked(domain) {
  try {
    // First check via storage directly (works even if service worker is down)
    const result = await chrome.storage.local.get("focusguard_settings");
    const settings = result.focusguard_settings || {};
    const blockedDomains = settings.blockedDomains || [];
    
    const isInList = blockedDomains.some(b => {
      const d = typeof b === "string" ? b : b.domain;
      const enabled = typeof b === "object" ? b.enabled !== false : true;
      return enabled && (domain === d || domain.endsWith("." + d));
    });
    
    if (!isInList) {
      // Also check focus state
      const focusResult = await chrome.storage.local.get("focusguard_focus");
      const focusState = focusResult.focusguard_focus || {};
      
      if (!focusState.active) {
        window.location.replace("https://" + domain);
        return;
      }
    }
    
    // Also try messaging as backup
    const response = await chrome.runtime.sendMessage({ action: "checkDomainBlocked", domain });
    if (response && !response.blocked) {
      window.location.replace("https://" + domain);
    }
  } catch (e) {}
}

async function loadResistCount() {
  try {
    const params = new URLSearchParams(window.location.search);
    const domain = params.get("domain") || "unknown";
    const result = await chrome.storage.local.get("focusguard_resist_count");
    const data = result.focusguard_resist_count || {};
    const today = new Date().toISOString().split("T")[0];
    
    // Migrate from number to object format
    if (typeof data[today] === "number") {
      data[today] = { count: data[today], domains: [] };
    }
    if (!data[today]) data[today] = { count: 0, domains: [] };
    
    // Only increment for unique domain visits
    if (!data[today].domains.includes(domain)) {
      data[today].count += 1;
      data[today].domains.push(domain);
      await chrome.storage.local.set({ focusguard_resist_count: data });
    }
    
    document.getElementById("resist-count").textContent = data[today].count;
  } catch (e) {}
}

// ─── Unlock Reveal ───
function setupUnlockReveal() {
  const btn = document.getElementById("btn-reveal-unlock");
  const card = document.getElementById("unlock-card");
  btn.addEventListener("click", () => {
    if (card.style.display === "none") {
      card.style.display = "block";
      card.classList.add("scale-in");
      btn.style.display = "none";
    }
  });
}

// ─── Breathing Exercise ───
function setupBreathing() {
  const btn = document.getElementById("btn-breathe");
  const overlay = document.getElementById("breathing-overlay");
  const closeBtn = document.getElementById("btn-close-breathe");
  const label = document.getElementById("breathing-label");

  const phases = ["Breathe in...", "Hold...", "Breathe out...", "Hold..."];
  let phaseIndex = 0;
  let breathInterval = null;

  btn.addEventListener("click", () => {
    overlay.style.display = "flex";
    phaseIndex = 0;
    label.textContent = phases[0];
    breathInterval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      label.textContent = phases[phaseIndex];
    }, 4000);
  });

  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    if (breathInterval) clearInterval(breathInterval);
  });
}

async function checkRequirements() {
  try {
    const reqs = await chrome.runtime.sendMessage({ action: "checkUnlockRequirements" });
    if (!reqs || reqs.error) return;

    const focusPct = Math.min(100, (reqs.focusMinutes / reqs.focusRequired) * 100);
    document.getElementById("req-focus-status").textContent = `${reqs.focusMinutes}/${reqs.focusRequired} min`;
    document.getElementById("req-focus-bar").style.width = focusPct + "%";
    document.getElementById("req-focus").className = "req-item" + (reqs.focusMet ? " met" : "");

    const taskPct = Math.min(100, (reqs.tasksCompleted / reqs.tasksRequired) * 100);
    document.getElementById("req-tasks-status").textContent = `${reqs.tasksCompleted}/${reqs.tasksRequired}`;
    document.getElementById("req-tasks-bar").style.width = taskPct + "%";
    document.getElementById("req-tasks").className = "req-item" + (reqs.tasksMet ? " met" : "");

    const intPct = reqs.interruptionsMet ? 100 : 0;
    document.getElementById("req-int-status").textContent = `${reqs.interruptions} (max ${reqs.maxInterruptions})`;
    document.getElementById("req-int-bar").style.width = intPct + "%";
    document.getElementById("req-int-bar").className = "req-fill " + (reqs.interruptionsMet ? "req-fill-accent" : "req-fill-warning");
    document.getElementById("req-interruptions").className = "req-item" + (reqs.interruptionsMet ? " met" : "");

    const successEl = document.getElementById("unlock-success");
    if (reqs.allMet && successEl.style.display === "none") {
      successEl.style.display = "block";
      successEl.classList.add("scale-in");
    } else if (!reqs.allMet) {
      successEl.style.display = "none";
    }
  } catch (e) {}
}

function setupOverride(domain) {
  const reasonInput = document.getElementById("override-reason");
  const overrideBtn = document.getElementById("btn-override");
  const reflectionTimer = document.getElementById("reflection-timer");
  const reflectionCount = document.getElementById("reflection-count");
  const reflectionRing = document.getElementById("reflection-ring");

  let reflectionStarted = false;
  let reflectionComplete = false;

  reasonInput.addEventListener("input", () => {
    const hasReason = reasonInput.value.trim().length >= 10;
    if (hasReason && !reflectionStarted) {
      reflectionStarted = true;
      reflectionTimer.style.display = "block";
      let count = 15;
      const circumference = 107;

      const interval = setInterval(() => {
        count--;
        reflectionCount.textContent = count;
        const progress = (15 - count) / 15;
        reflectionRing.style.strokeDashoffset = circumference * (1 - progress);

        if (count <= 0) {
          clearInterval(interval);
          reflectionComplete = true;
          overrideBtn.disabled = false;
          reflectionTimer.querySelector("p").textContent = "Reflection complete.";
          reflectionTimer.querySelector("p").style.color = "var(--success)";
        }
      }, 1000);
    }
  });

  overrideBtn.addEventListener("click", async () => {
    if (!reflectionComplete) return;
    safeMessage({ action: "recordBypass" }, () => {});
    window.location.replace("https://" + domain);
  });
}
