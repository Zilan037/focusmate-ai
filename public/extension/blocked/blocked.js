// blocked.js — Premium block page logic

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "You will never reach your destination if you stop and throw stones at every dog that barks.", author: "Winston Churchill" },
  { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
];

document.addEventListener("DOMContentLoaded", init);

function init() {
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain") || "Unknown";
  const reason = params.get("reason") || "This site is blocked.";

  document.getElementById("blocked-domain").textContent = domain;
  document.getElementById("blocked-reason").textContent = reason;

  const q = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote-text").textContent = `"${q.text}"`;
  document.querySelector(".quote-author").textContent = `— ${q.author}`;

  checkRequirements();
  setInterval(checkRequirements, 5000);

  setupOverride(domain);

  document.getElementById("btn-go-back").addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  });

  document.getElementById("btn-unlock").addEventListener("click", () => {
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
    document.getElementById("req-int-bar").className = "req-fill " + (reqs.interruptionsMet ? "req-fill-accent" : "req-fill-warning");
    document.getElementById("req-interruptions").className = "req-item" + (reqs.interruptionsMet ? " met" : "");

    // Unlock
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
    await chrome.runtime.sendMessage({ action: "recordBypass" });
    window.location.href = "https://" + domain;
  });
}
