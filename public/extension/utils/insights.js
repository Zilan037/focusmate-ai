// insights.js — Behavioral insights generator

const Insights = {
  /**
   * Generate insight cards from usage data
   * @param {Object} todayData - Today's usage
   * @param {Array} weekData - Last 7 days of usage [{date, data}]
   * @returns {Array} insight objects
   */
  generate(todayData, weekData = []) {
    const insights = [];

    if (!todayData) return insights;

    // 1. Time-of-day analysis
    this._timeOfDayInsights(todayData, insights);

    // 2. Domain ratio insights
    this._domainRatioInsights(todayData, insights);

    // 3. Weekly trend insights
    if (weekData.length >= 3) {
      this._trendInsights(weekData, insights);
    }

    // 4. Focus session insights
    this._focusInsights(todayData, insights);

    // 5. Distraction loop insights
    this._loopInsights(todayData, insights);

    return insights.slice(0, 8); // Max 8 insights
  },

  _timeOfDayInsights(data, insights) {
    if (!data.hourlyActivity) return;

    const morning = data.hourlyActivity.slice(6, 12);
    const afternoon = data.hourlyActivity.slice(12, 18);
    const evening = data.hourlyActivity.slice(18, 24);

    const morningProd = morning.reduce((s, h) => s + h.productive, 0);
    const morningDist = morning.reduce((s, h) => s + h.distracted, 0);
    const eveningProd = evening.reduce((s, h) => s + h.productive, 0);
    const eveningDist = evening.reduce((s, h) => s + h.distracted, 0);

    if (eveningDist > 0 && morningDist > 0) {
      const ratio = Math.round(((eveningDist - morningDist) / morningDist) * 100);
      if (ratio > 20) {
        insights.push({
          type: "warning",
          text: `You're ${ratio}% more distracted after 6PM`,
          detail: "Your focus drops significantly in the evening. Consider setting stricter limits after 6PM.",
        });
      }
    }

    if (morningProd > eveningProd && morningProd > 0) {
      insights.push({
        type: "productive",
        text: "Mornings are your peak productivity time",
        detail: "Schedule your most important work before noon for best results.",
      });
    }

    // Peak hour detection
    let peakHour = 0;
    let peakValue = 0;
    data.hourlyActivity.forEach((h, i) => {
      if (h.productive > peakValue) {
        peakValue = h.productive;
        peakHour = i;
      }
    });
    if (peakValue > 0) {
      insights.push({
        type: "info",
        text: `Peak focus hour: ${peakHour}:00 - ${peakHour + 1}:00`,
        detail: `You were most productive around ${peakHour > 12 ? peakHour - 12 + "PM" : peakHour + "AM"}.`,
      });
    }
  },

  _domainRatioInsights(data, insights) {
    if (!data.domains) return;

    const entries = Object.entries(data.domains);
    if (entries.length === 0) return;

    // Sort by time
    entries.sort((a, b) => (b[1].time || 0) - (a[1].time || 0));

    // Top domain
    const [topDomain, topInfo] = entries[0];
    if (topInfo.time > 30) {
      const category = topInfo.category || "Other";
      insights.push({
        type: category === "Entertainment" || category === "Social Media" ? "warning" : "info",
        text: `${topDomain} is your most-visited site (${Math.round(topInfo.time)} min)`,
        detail: `Categorized as ${category}. ${topInfo.time > 60 ? "Consider setting a daily limit." : ""}`,
      });
    }

    // Category dominance
    const categoryTotals = {};
    entries.forEach(([, info]) => {
      const cat = info.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (info.time || 0);
    });

    const totalTime = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    for (const [cat, time] of Object.entries(categoryTotals)) {
      const pct = Math.round((time / totalTime) * 100);
      if (pct > 50 && (cat === "Entertainment" || cat === "Social Media")) {
        insights.push({
          type: "warning",
          text: `${cat} dominates ${pct}% of your browsing time`,
          detail: `That's ${Math.round(time)} minutes today. Try reducing by 20% tomorrow.`,
        });
      }
    }
  },

  _trendInsights(weekData, insights) {
    const scores = weekData.map((d) => d.data.score || 0);
    const recent3 = scores.slice(0, 3);
    const prior3 = scores.slice(3, 6);

    const recentAvg = recent3.reduce((s, v) => s + v, 0) / recent3.length;
    const priorAvg = prior3.length > 0 ? prior3.reduce((s, v) => s + v, 0) / prior3.length : recentAvg;

    if (recentAvg > priorAvg + 10) {
      insights.push({
        type: "productive",
        text: "Productivity trending up! 📈",
        detail: `Your average score improved from ${Math.round(priorAvg)} to ${Math.round(recentAvg)}.`,
      });
    } else if (recentAvg < priorAvg - 10) {
      insights.push({
        type: "warning",
        text: "Productivity dipping this week 📉",
        detail: `Average score dropped from ${Math.round(priorAvg)} to ${Math.round(recentAvg)}. Time to refocus!`,
      });
    }

    // Weekend vs weekday
    const weekdayData = weekData.filter((d) => {
      const day = new Date(d.date).getDay();
      return day > 0 && day < 6;
    });
    const weekendData = weekData.filter((d) => {
      const day = new Date(d.date).getDay();
      return day === 0 || day === 6;
    });

    if (weekdayData.length > 0 && weekendData.length > 0) {
      const wdAvg = weekdayData.reduce((s, d) => s + (d.data.score || 0), 0) / weekdayData.length;
      const weAvg = weekendData.reduce((s, d) => s + (d.data.score || 0), 0) / weekendData.length;
      if (wdAvg > weAvg + 15) {
        insights.push({
          type: "info",
          text: "Weekday focus is much stronger than weekends",
          detail: `Weekday avg: ${Math.round(wdAvg)} vs Weekend avg: ${Math.round(weAvg)}`,
        });
      }
    }
  },

  _focusInsights(data, insights) {
    const sessions = data.focusSessions || [];
    if (sessions.length === 0) return;

    const completed = sessions.filter((s) => s.status === "completed");
    const rate = Math.round((completed.length / sessions.length) * 100);

    if (rate >= 80 && sessions.length >= 3) {
      insights.push({
        type: "productive",
        text: `${rate}% focus session success rate! 🎯`,
        detail: `${completed.length} of ${sessions.length} sessions completed. Keep it up!`,
      });
    } else if (rate < 50 && sessions.length >= 2) {
      insights.push({
        type: "warning",
        text: `Only ${rate}% of focus sessions completed`,
        detail: "Try shorter sessions or fewer tasks per session.",
      });
    }
  },

  _loopInsights(data, insights) {
    const loops = data.distractionLoops || [];
    if (loops.length >= 2) {
      insights.push({
        type: "warning",
        text: `${loops.length} distraction loops detected today`,
        detail: "You're rapidly switching between distracting sites. Consider blocking the repeat offenders.",
      });
    }
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.Insights = Insights;
}
