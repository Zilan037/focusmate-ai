// achievements.js — Gamification & milestone tracking engine

const Achievements = {
  // Achievement definitions
  definitions: [
    // ─── Streak Achievements ───
    { id: "streak_3", name: "Consistency Starter", desc: "Maintain a 3-day streak", icon: "🔥", category: "streak", requirement: { type: "streak", value: 3 }, tier: "bronze" },
    { id: "streak_7", name: "Week Warrior", desc: "7-day streak", icon: "⚡", category: "streak", requirement: { type: "streak", value: 7 }, tier: "silver" },
    { id: "streak_14", name: "Fortnight Force", desc: "14-day streak", icon: "💎", category: "streak", requirement: { type: "streak", value: 14 }, tier: "gold" },
    { id: "streak_30", name: "Monthly Master", desc: "30-day streak", icon: "👑", category: "streak", requirement: { type: "streak", value: 30 }, tier: "platinum" },
    { id: "streak_100", name: "Centurion", desc: "100-day streak", icon: "🏛️", category: "streak", requirement: { type: "streak", value: 100 }, tier: "legendary" },

    // ─── Focus Session Achievements ───
    { id: "sessions_1", name: "First Focus", desc: "Complete your first focus session", icon: "🎯", category: "focus", requirement: { type: "total_sessions", value: 1 }, tier: "bronze" },
    { id: "sessions_10", name: "Deep Diver", desc: "Complete 10 focus sessions", icon: "🏊", category: "focus", requirement: { type: "total_sessions", value: 10 }, tier: "silver" },
    { id: "sessions_50", name: "Focus Athlete", desc: "Complete 50 sessions", icon: "🏋️", category: "focus", requirement: { type: "total_sessions", value: 50 }, tier: "gold" },
    { id: "sessions_100", name: "Zen Master", desc: "Complete 100 sessions", icon: "🧘", category: "focus", requirement: { type: "total_sessions", value: 100 }, tier: "platinum" },
    { id: "sessions_500", name: "Transcendent", desc: "Complete 500 sessions", icon: "✨", category: "focus", requirement: { type: "total_sessions", value: 500 }, tier: "legendary" },

    // ─── Productivity Hours ───
    { id: "hours_10", name: "Getting Started", desc: "10 hours of productive time", icon: "📚", category: "time", requirement: { type: "total_productive_hours", value: 10 }, tier: "bronze" },
    { id: "hours_50", name: "Half Century", desc: "50 productive hours", icon: "🏆", category: "time", requirement: { type: "total_productive_hours", value: 50 }, tier: "silver" },
    { id: "hours_100", name: "Century Club", desc: "100 productive hours", icon: "💯", category: "time", requirement: { type: "total_productive_hours", value: 100 }, tier: "gold" },
    { id: "hours_500", name: "Time Lord", desc: "500 productive hours", icon: "⏳", category: "time", requirement: { type: "total_productive_hours", value: 500 }, tier: "platinum" },

    // ─── Score Achievements ───
    { id: "score_80", name: "High Performer", desc: "Score 80+ in a day", icon: "📈", category: "score", requirement: { type: "daily_score", value: 80 }, tier: "silver" },
    { id: "score_90", name: "Elite Status", desc: "Score 90+ in a day", icon: "🌟", category: "score", requirement: { type: "daily_score", value: 90 }, tier: "gold" },
    { id: "score_95", name: "Near Perfect", desc: "Score 95+ in a day", icon: "💫", category: "score", requirement: { type: "daily_score", value: 95 }, tier: "platinum" },

    // ─── Blocking Achievements ───
    { id: "blocks_resisted_10", name: "Willpower", desc: "Resist 10 blocked site attempts", icon: "🛡️", category: "blocking", requirement: { type: "total_resists", value: 10 }, tier: "bronze" },
    { id: "blocks_resisted_50", name: "Iron Will", desc: "Resist 50 blocked attempts", icon: "⚔️", category: "blocking", requirement: { type: "total_resists", value: 50 }, tier: "silver" },
    { id: "blocks_resisted_100", name: "Unbreakable", desc: "Resist 100 blocked attempts", icon: "🏰", category: "blocking", requirement: { type: "total_resists", value: 100 }, tier: "gold" },

    // ─── Special Achievements ───
    { id: "no_distraction_day", name: "Zero Distraction", desc: "A full day with 0 distraction time", icon: "🧊", category: "special", requirement: { type: "zero_distraction_day", value: 1 }, tier: "gold" },
    { id: "all_tasks_done", name: "Task Crusher", desc: "Complete all tasks in a focus session", icon: "✅", category: "special", requirement: { type: "perfect_session", value: 1 }, tier: "silver" },
    { id: "early_bird", name: "Early Bird", desc: "Start focus before 7 AM", icon: "🌅", category: "special", requirement: { type: "early_focus", value: 1 }, tier: "bronze" },
    { id: "night_owl", name: "Night Owl", desc: "Focus session after 10 PM", icon: "🦉", category: "special", requirement: { type: "late_focus", value: 1 }, tier: "bronze" },
    { id: "marathon_60", name: "Marathon Runner", desc: "Complete a 60-min focus session", icon: "🏃", category: "special", requirement: { type: "session_duration", value: 60 }, tier: "gold" },
  ],

  tierColors: {
    bronze: { bg: "rgba(205,127,50,0.12)", border: "rgba(205,127,50,0.25)", text: "#CD7F32" },
    silver: { bg: "rgba(192,192,192,0.12)", border: "rgba(192,192,192,0.25)", text: "#C0C0C0" },
    gold: { bg: "rgba(255,215,0,0.12)", border: "rgba(255,215,0,0.25)", text: "#FFD700" },
    platinum: { bg: "rgba(229,228,226,0.12)", border: "rgba(229,228,226,0.25)", text: "#E5E4E2" },
    legendary: { bg: "rgba(148,103,189,0.15)", border: "rgba(148,103,189,0.3)", text: "#9467BD" },
  },

  /**
   * Check all achievements against current stats and return newly unlocked ones
   */
  async checkAll(stats) {
    const unlocked = await this.getUnlocked();
    const newlyUnlocked = [];

    for (const achievement of this.definitions) {
      if (unlocked[achievement.id]) continue; // Already earned

      const earned = this._checkRequirement(achievement.requirement, stats);
      if (earned) {
        unlocked[achievement.id] = {
          earnedAt: new Date().toISOString(),
          tier: achievement.tier,
        };
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      await this.saveUnlocked(unlocked);
    }

    return newlyUnlocked;
  },

  _checkRequirement(req, stats) {
    switch (req.type) {
      case "streak": return (stats.streak || 0) >= req.value;
      case "total_sessions": return (stats.totalSessions || 0) >= req.value;
      case "total_productive_hours": return (stats.totalProductiveHours || 0) >= req.value;
      case "daily_score": return (stats.todayScore || 0) >= req.value;
      case "total_resists": return (stats.totalResists || 0) >= req.value;
      case "zero_distraction_day": return stats.zeroDayToday === true;
      case "perfect_session": return stats.perfectSession === true;
      case "early_focus": return stats.earlyFocus === true;
      case "late_focus": return stats.lateFocus === true;
      case "session_duration": return (stats.lastSessionDuration || 0) >= req.value;
      default: return false;
    }
  },

  /**
   * Build stats object from storage for checking achievements
   */
  async buildStats() {
    const streak = await Storage.getStreak();
    const usage = await Storage.getTodayUsage();
    const allDays = await Storage.getLastNDays(365);
    
    let totalSessions = 0;
    let totalProductiveMinutes = 0;
    let totalResists = 0;

    allDays.forEach(day => {
      const d = day.data;
      totalSessions += Array.isArray(d.focusSessions) ? d.focusSessions.filter(s => s.status === "completed").length : 0;
      totalProductiveMinutes += (d.focusTime || 0);
      totalResists += (d.blockBypasses || 0);
    });

    const lastSession = (usage.focusSessions || []).slice(-1)[0];
    const now = new Date();
    const hour = now.getHours();

    return {
      streak: streak.current || 0,
      totalSessions,
      totalProductiveHours: Math.round(totalProductiveMinutes / 60),
      todayScore: usage.score || 0,
      totalResists,
      zeroDayToday: (usage.distractedTime || 0) < 1 && (usage.totalActive || 0) > 30,
      perfectSession: lastSession && lastSession.status === "completed" && lastSession.tasksCompleted === lastSession.totalTasks && lastSession.totalTasks > 0,
      earlyFocus: hour < 7 && (usage.focusSessions || []).length > 0,
      lateFocus: hour >= 22 && (usage.focusSessions || []).length > 0,
      lastSessionDuration: lastSession ? (lastSession.duration || 0) : 0,
    };
  },

  async getUnlocked() {
    return await Storage.get("focusguard_achievements") || {};
  },

  async saveUnlocked(unlocked) {
    await Storage.set("focusguard_achievements", unlocked);
  },

  /**
   * Get all achievements with unlock status
   */
  async getAllWithStatus() {
    const unlocked = await this.getUnlocked();
    return this.definitions.map(def => ({
      ...def,
      unlocked: !!unlocked[def.id],
      earnedAt: unlocked[def.id]?.earnedAt || null,
    }));
  },

  /**
   * Get progress toward next milestone for each category
   */
  async getProgress(stats) {
    const unlocked = await this.getUnlocked();
    const categories = {};

    for (const def of this.definitions) {
      if (!categories[def.category]) {
        categories[def.category] = { total: 0, earned: 0, next: null };
      }
      categories[def.category].total++;
      if (unlocked[def.id]) {
        categories[def.category].earned++;
      } else if (!categories[def.category].next) {
        categories[def.category].next = def;
      }
    }

    return categories;
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.Achievements = Achievements;
}
