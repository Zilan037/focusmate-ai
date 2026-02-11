// scoring.js — Productivity scoring algorithm

export const Scoring = {
  /**
   * Calculate productivity score (0-100) for a day's usage data
   * 
   * Weighted formula:
   *   Education time × 2
   *   Focus time × 2
   *   Work time × 1.5
   *   Social media × -1.8
   *   Entertainment × -1.0
   *   Block bypass attempts × -3
   *   Shopping × -0.5
   *   News × 0.3
   */
  calculate(dayData) {
    if (!dayData || !dayData.domains) return 0;

    const categoryTime = this.getCategoryTotals(dayData.domains);
    const focusTime = dayData.focusTime || 0;
    const bypasses = dayData.blockBypasses || 0;

    // Positive signals (in minutes)
    const positiveScore =
      (categoryTime.Education || 0) * 2 +
      focusTime * 2 +
      (categoryTime.Work || 0) * 1.5 +
      (categoryTime.News || 0) * 0.3;

    // Negative signals
    const negativeScore =
      (categoryTime["Social Media"] || 0) * 1.8 +
      (categoryTime.Entertainment || 0) * 1.0 +
      (categoryTime.Shopping || 0) * 0.5 +
      bypasses * 3;

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
   * Get score label and color
   */
  getScoreLabel(score) {
    if (score >= 85) return { label: "Excellent", color: "#22c55e", emoji: "🔥" };
    if (score >= 70) return { label: "Good", color: "#3b82f6", emoji: "👍" };
    if (score >= 50) return { label: "Average", color: "#f59e0b", emoji: "😐" };
    if (score >= 30) return { label: "Below Average", color: "#f97316", emoji: "⚠️" };
    return { label: "Poor", color: "#ef4444", emoji: "😟" };
  },

  /**
   * Calculate focus percentage
   */
  focusPercentage(dayData) {
    if (!dayData || !dayData.totalActive) return 0;
    const categoryTime = this.getCategoryTotals(dayData.domains);
    const productive = (categoryTime.Work || 0) + (categoryTime.Education || 0) + (dayData.focusTime || 0);
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
