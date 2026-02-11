// blocked.js — Block page logic with task-based unlock and override

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill" },
];

document.addEventListener("DOMContentLoaded", init);

function init() {
  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain") || "Unknown";
  const reason = params.get("reason") || "This site is blocked.";

  document.getElementById("blocked-domain").textContent = domain;
  document.getElementById("blocked-reason").textContent = reason;

  // Random quote
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote-text").textContent = `"${q.text}"`;
  document.querySelector(".quote-author").textContent = `— ${q.author}`;

  // Check unlock requirements
  checkRequirements();
  setInterval(checkRequirements, 5000);

  // Override logic
  setupOverride(domain);

  // Go back
  document.getElementById("btn-go-back").addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  });

  // Unlock button
  document.getElementById("btn-unlock").addEventListener("click", () => {
    // Remove from blocked list and navigate
    chrome.runtime.sendMessage({ action: "unblockDomain", domain }, () => {
      window.location.href = "https://" + domain;
    });
  });
}

async function checkRequirements() {
  try {
    const reqs = await chrome.runtime.sendMessage({ action: "checkUnlockRequirements" });

    // Focus
    const focusPct = Math.min(100, (reqs.focusMinutes / reqs.focusRequired) * 100);
    document.getElementById("req-focus-status").textContent = `${reqs.focusMinutes}/${reqs.focusRequired} min`;
    document.getElementById("req-focus-bar").style.width = focusPct + "%";
    document.getElementById("req-focus").className = "req-item" + (reqs.focusMet ? " met" : "");

    // Tasks
    const taskPct = Math.min(100, (reqs.tasksCompleted / reqs.tasksRequired) * 100);
    document.getElementById("req-tasks-status").textContent = `${reqs.tasksCompleted}/${reqs.tasksRequired}`;
    document.getElementById("req-tasks-bar").style.width = taskPct + "%";
    document.getElementById("req-tasks").className = "req-item" + (reqs.tasksMet ? " met" : "");

    // Interruptions
    const intPct = reqs.interruptionsMet ? 100 : 0;
    document.getElementById("req-int-status").textContent = `${reqs.interruptions} (max ${reqs.maxInterruptions})`;
    document.getElementById("req-int-bar").style.width = intPct + "%";
    document.getElementById("req-int-bar").className = "progress-fill " + (reqs.interruptionsMet ? "blue" : "orange");
    document.getElementById("req-interruptions").className = "req-item" + (reqs.interruptionsMet ? " met" : "");

    // Show unlock button
    document.getElementById("unlock-success").style.display = reqs.allMet ? "block" : "none";
  } catch (e) {
    // Extension context may not be ready
  }
}

function setupOverride(domain) {
  const reasonInput = document.getElementById("override-reason");
  const overrideBtn = document.getElementById("btn-override");
  const reflectionTimer = document.getElementById("reflection-timer");
  const reflectionCount = document.getElementById("reflection-count");
  const reflectionBar = document.getElementById("reflection-bar");

  let reflectionStarted = false;
  let reflectionComplete = false;

  reasonInput.addEventListener("input", () => {
    const hasReason = reasonInput.value.trim().length >= 10;
    if (hasReason && !reflectionStarted) {
      // Start 15-second reflection timer
      reflectionStarted = true;
      reflectionTimer.style.display = "block";
      let count = 15;

      const interval = setInterval(() => {
        count--;
        reflectionCount.textContent = count;
        reflectionBar.style.width = ((15 - count) / 15 * 100) + "%";

        if (count <= 0) {
          clearInterval(interval);
          reflectionComplete = true;
          overrideBtn.disabled = false;
          reflectionTimer.querySelector("p").textContent = "Reflection complete. Override available.";
          reflectionTimer.querySelector("p").style.color = "#22c55e";
        }
      }, 1000);
    }
  });

  overrideBtn.addEventListener("click", async () => {
    if (!reflectionComplete) return;

    // Record bypass
    await chrome.runtime.sendMessage({ action: "recordBypass" });

    // Navigate to the domain
    window.location.href = "https://" + domain;
  });
}
