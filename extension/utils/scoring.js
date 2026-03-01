// scoring.js — Productivity scoring algorithm V2 (improved accuracy)

const Scoring = {
  /**
   * Calculate productivity score (0-100) for a day's usage data
   * 
   * Weighted formula (refined):
   *   Development time × 2.0
   *   Education time × 2.0
   *   Research time × 1.8
   *   Productivity time × 1.5
   *   Focus sessions × 2.0 (bonus per completed session)
   *   News time × 0.3
   *   Social media × -1.8
   *   Entertainment × -1.0
   *   Shopping × -0.5
   *   Block bypass attempts × -3
   *   Distraction loops × -2
   */
  calculate(dayData) {
    if (!dayData || !dayData.domains) return 0;

    const categoryTime = this.getCategoryTotals(dayData.domains);
    const focusTime = dayData.focusTime || 0;
    const bypasses = dayData.blockBypasses || 0;
    const loops = (dayData.distractionLoops || []).length;
    const completedSessions = (dayData.focusSessions || []).filter(s => s.status === "completed").length;

    // Positive signals (in minutes)
    const positiveScore =
      (categoryTime.Development || 0) * 2.0 +
      (categoryTime.Education || 0) * 2.0 +
      (categoryTime.Research || 0) * 1.8 +
      (categoryTime.Productivity || 0) * 1.5 +
      (categoryTime.Work || 0) * 1.5 + // Legacy compatibility
      focusTime * 1.5 +
      completedSessions * 5 + // Bonus for completed focus sessions
      (categoryTime.News || 0) * 0.3;

    // Negative signals
    const negativeScore =
      (categoryTime["Social Media"] || 0) * 1.8 +
      (categoryTime.Entertainment || 0) * 1.0 +
      (categoryTime.Shopping || 0) * 0.5 +
      bypasses * 3 +
      loops * 2;

    // Total active time for normalization
    const totalActive = dayData.totalActive || 1;

    // Raw score: ratio of productive vs unproductive weighted signals
    const rawScore = ((positiveScore - negativeScore) / (totalActive + 1)) * 20 + 50;

    // Clamp to 0-100
    return Math.round(Math.max(0, Math.min(100, rawScore)));
  },

  getCategoryTotals(domains) {
    const totals = {};
    for (const [, info] of Object.entries(domains)) {
      const cat = info.category || "Other";
      totals[cat] = (totals[cat] || 0) + (info.time || 0);
    }
    return totals;
  },

  /**
   * Get score label and color (finer granularity)
   */
  getScoreLabel(score) {
    if (score >= 90) return { label: "Outstanding", color: "#22c55e", emoji: "🏆" };
    if (score >= 80) return { label: "Excellent", color: "#22c55e", emoji: "🔥" };
    if (score >= 70) return { label: "Very Good", color: "#3b82f6", emoji: "💪" };
    if (score >= 60) return { label: "Good", color: "#0ea5e9", emoji: "👍" };
    if (score >= 50) return { label: "Average", color: "#f59e0b", emoji: "😐" };
    if (score >= 40) return { label: "Below Average", color: "#f97316", emoji: "⚠️" };
    if (score >= 25) return { label: "Needs Work", color: "#ef4444", emoji: "😟" };
    return { label: "Poor", color: "#dc2626", emoji: "🚨" };
  },

  /**
   * Calculate focus percentage (productive categories)
   */
  focusPercentage(dayData) {
    if (!dayData || !dayData.totalActive) return 0;
    const categoryTime = this.getCategoryTotals(dayData.domains);
    const productive = 
      (categoryTime.Development || 0) + 
      (categoryTime.Education || 0) + 
      (categoryTime.Research || 0) + 
      (categoryTime.Productivity || 0) + 
      (categoryTime.Work || 0) +
      (dayData.focusTime || 0);
    return Math.round(Math.min(100, (productive / dayData.totalActive) * 100));
  },

  /**
   * Calculate distraction percentage
   */
  distractionPercentage(dayData) {
    return 100 - this.focusPercentage(dayData);
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.Scoring = Scoring;
}
