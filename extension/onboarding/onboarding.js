// onboarding.js — FocusGuard V3 Premium onboarding (CSP-safe)

const COMMON_SITES = [
  { name: "YouTube", icon: "📺", domain: "youtube.com" },
  { name: "Instagram", icon: "📷", domain: "instagram.com" },
  { name: "Twitter/X", icon: "🐦", domain: "x.com" },
  { name: "TikTok", icon: "🎵", domain: "tiktok.com" },
  { name: "Reddit", icon: "🤖", domain: "reddit.com" },
  { name: "Netflix", icon: "🎬", domain: "netflix.com" },
  { name: "Facebook", icon: "👤", domain: "facebook.com" },
  { name: "Twitch", icon: "🎮", domain: "twitch.tv" },
  { name: "Pinterest", icon: "📌", domain: "pinterest.com" },
];

let currentStep = 0;
const totalSteps = 6;
let selectedSites = [];
let dailyGoal = 4;
let focusDuration = 25;
let selectedTheme = "dark";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const result = await chrome.storage.local.get("focusguard_onboarded");
    if (result.focusguard_onboarded) {
      document.querySelector('.step[data-step="0"] h1').textContent = "Welcome Back!";
      document.querySelector('.welcome-desc').textContent = "Your settings are already configured. Want to update them?";
    }
  } catch (e) {}

  renderSitesGrid();
  setupGoalSlider();
  updateProgress();
  bindEventListeners();
});

function bindEventListeners() {
  // Step 0
  document.getElementById("btn-get-started").addEventListener("click", nextStep);
  document.getElementById("btn-skip").addEventListener("click", skipOnboarding);

  // Step 1
  document.getElementById("btn-add-custom").addEventListener("click", addCustomSite);
  document.getElementById("btn-step1-next").addEventListener("click", nextStep);

  // Step 2
  document.getElementById("btn-step2-next").addEventListener("click", nextStep);

  // Step 3 - focus duration options
  document.querySelectorAll("#focus-options .focus-option").forEach((el) => {
    el.addEventListener("click", () => selectDuration(el));
  });
  document.getElementById("btn-step3-next").addEventListener("click", nextStep);

  // Step 4 - theme cards
  document.getElementById("theme-dark-card").addEventListener("click", function () {
    selectTheme("dark", this);
  });
  document.getElementById("theme-light-card").addEventListener("click", function () {
    selectTheme("light", this);
  });
  document.getElementById("btn-step4-next").addEventListener("click", nextStep);

  // Step 5
  document.getElementById("btn-complete").addEventListener("click", completeOnboarding);

  // Custom site enter key
  document.getElementById("custom-site").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addCustomSite();
  });
}

function updateProgress() {
  const pct = Math.round((currentStep / (totalSteps - 1)) * 100);
  document.getElementById("progress-bar").style.width = pct + "%";
  document.getElementById("progress-step").textContent = `Step ${currentStep + 1} of ${totalSteps}`;
  document.getElementById("progress-pct").textContent = pct + "%";
}

function renderSitesGrid() {
  const grid = document.getElementById("sites-grid");
  COMMON_SITES.forEach((site) => {
    const card = document.createElement("div");
    card.className = "site-card";
    card.dataset.domain = site.domain;
    card.innerHTML = `
      <span class="site-card-icon">${site.icon}</span>
      <span class="site-card-name">${site.name}</span>
    `;
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      if (card.classList.contains("selected")) {
        selectedSites.push(site.domain);
      } else {
        selectedSites = selectedSites.filter((d) => d !== site.domain);
      }
    });
    grid.appendChild(card);
  });
}

function addCustomSite() {
  const input = document.getElementById("custom-site");
  const domain = input.value.trim().replace(/^www\./, "").toLowerCase();
  if (!domain) return;

  if (!selectedSites.includes(domain)) {
    selectedSites.push(domain);
    const grid = document.getElementById("sites-grid");
    const card = document.createElement("div");
    card.className = "site-card selected";
    card.innerHTML = `
      <span class="site-card-icon">🌐</span>
      <span class="site-card-name">${domain}</span>
    `;
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      if (!card.classList.contains("selected")) {
        selectedSites = selectedSites.filter((d) => d !== domain);
      } else {
        selectedSites.push(domain);
      }
    });
    grid.appendChild(card);
  }
  input.value = "";
}

function setupGoalSlider() {
  const slider = document.getElementById("goal-slider");
  const display = document.getElementById("goal-number");
  const labels = document.querySelectorAll(".goal-label-item");

  slider.addEventListener("input", () => {
    dailyGoal = parseInt(slider.value);
    display.textContent = dailyGoal;

    labels.forEach((l, i) => {
      if ((dailyGoal <= 3 && i === 0) || (dailyGoal <= 5 && dailyGoal > 3 && i === 1) || (dailyGoal > 5 && i === 2)) {
        l.style.color = "var(--accent)";
        l.style.fontWeight = "700";
      } else {
        l.style.color = "";
        l.style.fontWeight = "";
      }
    });
  });
}

function selectDuration(el) {
  document.querySelectorAll(".focus-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
  focusDuration = parseInt(el.dataset.dur);
}

function selectTheme(theme, el) {
  selectedTheme = theme;
  document.querySelectorAll(".theme-preview-card").forEach((c) => c.classList.remove("selected"));
  el.classList.add("selected");
  document.documentElement.setAttribute("data-theme", theme);
  try {
    chrome.runtime.sendMessage({ action: "setTheme", theme });
  } catch (e) {}
}

function nextStep() {
  document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.remove("active");
  document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add("completed");

  currentStep++;

  document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add("active");
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add("active");

  updateProgress();

  if (currentStep === 5) {
    document.getElementById("summary-sites").textContent = selectedSites.length;
    document.getElementById("summary-goal").textContent = dailyGoal + "h";
    document.getElementById("summary-dur").textContent = focusDuration + "m";
    document.getElementById("summary-theme").textContent = selectedTheme === "dark" ? "🌙 Dark" : "☀️ Light";
    setTimeout(spawnConfetti, 400);
  }
}

function skipOnboarding() {
  selectedSites = ["youtube.com", "instagram.com", "x.com", "tiktok.com", "reddit.com"];
  dailyGoal = 4;
  focusDuration = 25;
  selectedTheme = "dark";
  completeOnboarding();
}

function spawnConfetti() {
  const container = document.getElementById("confetti-container");
  const colors = ["#5B8CFF", "#7C6AFF", "#34D399", "#FBBF24", "#F87171"];

  for (let i = 0; i < 20; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    const angle = (Math.PI * 2 * i) / 20;
    const dist = 40 + Math.random() * 60;
    piece.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    container.appendChild(piece);
  }
}

async function completeOnboarding() {
  try {
    for (const domain of selectedSites) {
      await chrome.runtime.sendMessage({ action: "blockDomain", domain });
    }

    await chrome.runtime.sendMessage({
      action: "completeOnboarding",
      settings: {
        dailyGoal,
        focusDuration,
        blockedSites: selectedSites,
      },
    });

    await chrome.storage.local.set({ focusguard_onboarded: true });
  } catch (e) {
    console.error("Onboarding save error:", e);
  }

  window.close();
}
