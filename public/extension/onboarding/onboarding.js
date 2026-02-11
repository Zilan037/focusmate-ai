// onboarding.js — 5-step premium onboarding wizard

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
let selectedSites = [];
let dailyGoal = 4;
let focusDuration = 25;

document.addEventListener("DOMContentLoaded", () => {
  renderSitesGrid();
  setupGoalSlider();
});

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
  slider.addEventListener("input", () => {
    dailyGoal = parseInt(slider.value);
    display.textContent = dailyGoal;
  });
}

function selectDuration(el) {
  document.querySelectorAll(".focus-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
  focusDuration = parseInt(el.dataset.dur);
}

function nextStep() {
  // Mark current dot as completed
  document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.remove("active");
  document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add("completed");

  currentStep++;

  // Update dots
  document.querySelector(`.step-dot[data-step="${currentStep}"]`).classList.add("active");

  // Switch steps
  document.querySelectorAll(".step").forEach((s) => s.classList.remove("active"));
  document.querySelector(`.step[data-step="${currentStep}"]`).classList.add("active");

  // Update summary on last step
  if (currentStep === 4) {
    document.getElementById("summary-sites").textContent = selectedSites.length;
    document.getElementById("summary-goal").textContent = dailyGoal + "h";
    document.getElementById("summary-dur").textContent = focusDuration + "m";
  }
}

async function completeOnboarding() {
  try {
    // Save settings
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
  } catch (e) {
    console.error("Onboarding save error:", e);
  }

  // Close onboarding tab
  window.close();
}
