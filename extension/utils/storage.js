// storage.js — chrome.storage.local helpers

const Storage = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] ?? null);
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  async getMultiple(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  },

  async setMultiple(obj) {
    return new Promise((resolve) => {
      chrome.storage.local.set(obj, resolve);
    });
  },

  async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  },

  // Date key helper
  todayKey() {
    return new Date().toISOString().split("T")[0];
  },

  // Get today's usage data
  async getTodayUsage() {
    const key = this.todayKey();
    const data = await this.get(key);
    return data || this.createEmptyDay();
  },

  // Save today's usage data
  async saveTodayUsage(data) {
    const key = this.todayKey();
    await this.set(key, data);
  },

  // Get usage for a specific date
  async getUsageForDate(dateStr) {
    const data = await this.get(dateStr);
    return data || this.createEmptyDay();
  },

  // Get last N days of usage
  async getLastNDays(n) {
    const days = [];
    const keys = [];
    for (let i = 0; i < n; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      keys.push(d.toISOString().split("T")[0]);
    }
    const results = await this.getMultiple(keys);
    for (const key of keys) {
      days.push({ date: key, data: results[key] || this.createEmptyDay() });
    }
    return days;
  },

  createEmptyDay() {
    return {
      domains: {},        // { "example.com": { time: 0, category: "Other", visits: 0 } }
      totalActive: 0,
      focusTime: 0,
      distractedTime: 0,
      focusSessions: [],  // { start, duration, tasksCompleted, totalTasks, interruptions, status }
      distractionLoops: [],
      hourlyActivity: Array.from({ length: 24 }, () => ({ productive: 0, distracted: 0 })),
      blockBypasses: 0,
      score: 0,
    };
  },

  // Settings helpers
  async getSettings() {
    const settings = await this.get("focusguard_settings");
    return settings || {
      blockedDomains: [],       // ["instagram.com", "tiktok.com"]
      dailyLimits: {},          // { "youtube.com": 30 } (minutes)
      scheduledBlocks: [],      // { domains: [], startTime: "09:00", endTime: "17:00", days: [1,2,3,4,5] }
      focusDefaults: {
        duration: 25,           // minutes
        unlockRequirements: {
          focusMinutes: 10,
          tasksRequired: 2,
          maxInterruptions: 3,
        },
      },
      categoryOverrides: {},    // { "example.com": "Work" }
      widgetEnabled: true,
      widgetPosition: { x: 20, y: 20 },
      theme: "dark",
    };
  },

  async saveSettings(settings) {
    await this.set("focusguard_settings", settings);
  },

  // Focus state
  async getFocusState() {
    const state = await this.get("focusguard_focus");
    return state || {
      active: false,
      startTime: null,
      duration: 0,
      remaining: 0,
      tasks: [],
      interruptions: 0,
      paused: false,
    };
  },

  async saveFocusState(state) {
    await this.set("focusguard_focus", state);
  },

  // Quick Mode Presets
  async getPresets() {
    const presets = await this.get("focusguard_presets");
    return presets || {
      work: {
        name: "Work Mode",
        icon: "💼",
        color: "#2563EB",
        mode: "block",
        blockedSites: ["youtube.com", "reddit.com", "twitter.com", "x.com", "instagram.com", "tiktok.com", "facebook.com"],
        allowedSites: [],
        duration: 45,
        enabled: false,
      },
      study: {
        name: "Study Mode",
        icon: "📚",
        color: "#6366F1",
        mode: "allow",
        blockedSites: [],
        allowedSites: ["docs.google.com", "wikipedia.org", "github.com", "stackoverflow.com", "notion.so"],
        duration: 25,
        enabled: false,
      },
      break: {
        name: "Break Mode",
        icon: "☕",
        color: "#10B981",
        mode: "block",
        blockedSites: [],
        allowedSites: [],
        duration: 10,
        enabled: false,
      },
    };
  },

  async savePresets(presets) {
    await this.set("focusguard_presets", presets);
  },

  async getActivePreset() {
    return await this.get("focusguard_active_preset");
  },

  async setActivePreset(presetKey) {
    await this.set("focusguard_active_preset", presetKey);
  },

  // Streak tracking
  async getStreak() {
    const streak = await this.get("focusguard_streak");
    return streak || { current: 0, lastDate: null, best: 0 };
  },

  async updateStreak() {
    const streak = await this.getStreak();
    const today = this.todayKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    if (streak.lastDate === today) return streak;

    if (streak.lastDate === yesterdayKey) {
      streak.current += 1;
    } else if (streak.lastDate !== today) {
      streak.current = 1;
    }

    streak.lastDate = today;
    streak.best = Math.max(streak.best, streak.current);
    await this.set("focusguard_streak", streak);
    return streak;
  },
};

// Export for use in other scripts
if (typeof globalThis !== "undefined") {
  globalThis.Storage = Storage;
}
