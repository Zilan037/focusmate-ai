// insights.js — Behavioral insights generator V2

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

    // 6. Category balance insights
    this._categoryBalanceInsights(todayData, insights);

    // 7. Screen time patterns
    this._screenTimeInsights(todayData, weekData, insights);

    return insights.slice(0, 10); // Max 10 insights
  },

  _timeOfDayInsights(data, insights) {
    if (!data.hourlyActivity) return;

    const morning = data.hourlyActivity.slice(6, 12);
    const afternoon = data.hourlyActivity.slice(12, 18);
    const evening = data.hourlyActivity.slice(18, 24);

    const morningProd = morning.reduce((s, h) => s + h.productive, 0);
    const morningDist = morning.reduce((s, h) => s + h.distracted, 0);
    const afternoonProd = afternoon.reduce((s, h) => s + h.productive, 0);
    const eveningProd = evening.reduce((s, h) => s + h.productive, 0);
    const eveningDist = evening.reduce((s, h) => s + h.distracted, 0);

    if (eveningDist > 0 && morningDist > 0) {
      const ratio = Math.round(((eveningDist - morningDist) / Math.max(1, morningDist)) * 100);
      if (ratio > 20) {
        insights.push({
          type: "warning",
          text: `You're ${ratio}% more distracted after 6PM`,
          detail: "Your focus drops significantly in the evening. Consider setting stricter limits after 6PM.",
        });
      }
    }

    // Determine peak period
    const periods = [
      { name: "Morning (6-12)", value: morningProd },
      { name: "Afternoon (12-18)", value: afternoonProd },
      { name: "Evening (18-24)", value: eveningProd },
    ].filter(p => p.value > 0).sort((a, b) => b.value - a.value);

    if (periods.length > 0 && periods[0].value > 5) {
      insights.push({
        type: "productive",
        text: `${periods[0].name} is your peak productivity window`,
        detail: `${Math.round(periods[0].value)} minutes of focused work. Schedule important tasks here.`,
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
    if (peakValue > 3) {
      const label = peakHour >= 12 ? `${peakHour - 12 || 12}PM` : `${peakHour || 12}AM`;
      insights.push({
        type: "info",
        text: `Peak focus hour: ${peakHour}:00 — ${Math.round(peakValue)}min productive`,
        detail: `You were most productive around ${label}. Protect this time slot.`,
      });
    }
  },

  _domainRatioInsights(data, insights) {
    if (!data.domains) return;

    const entries = Object.entries(data.domains);
    if (entries.length === 0) return;

    entries.sort((a, b) => (b[1].time || 0) - (a[1].time || 0));

    // Top domain
    const [topDomain, topInfo] = entries[0];
    if (topInfo.time > 15) {
      const category = topInfo.category || "Other";
      const isProductive = ["Development", "Productivity", "Education", "Research", "Work"].includes(category);
      insights.push({
        type: isProductive ? "productive" : (topInfo.time > 60 ? "warning" : "info"),
        text: `${topDomain} — ${Math.round(topInfo.time)}min (${category})`,
        detail: isProductive
          ? "Great focus! This is your top productive site today."
          : topInfo.time > 60
            ? "Consider setting a daily limit to control usage."
            : "Moderate usage. Monitor if it increases.",
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
          text: `${cat} dominates ${pct}% of your browsing`,
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
        text: `Productivity trending up! Score: ${Math.round(priorAvg)} → ${Math.round(recentAvg)}`,
        detail: "Your habits are improving. Keep the momentum going!",
      });
    } else if (recentAvg < priorAvg - 10) {
      insights.push({
        type: "warning",
        text: `Productivity dipping: ${Math.round(priorAvg)} → ${Math.round(recentAvg)}`,
        detail: "Time to refocus! Try a focus session to get back on track.",
      });
    }

    // Consistency check
    if (scores.length >= 5) {
      const stdDev = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - recentAvg, 2), 0) / scores.length);
      if (stdDev < 10 && recentAvg >= 60) {
        insights.push({
          type: "productive",
          text: "Highly consistent productivity pattern detected",
          detail: `Your score stays stable around ${Math.round(recentAvg)}. You've built strong habits.`,
        });
      }
    }
  },

  _focusInsights(data, insights) {
    const sessions = data.focusSessions || [];
    if (sessions.length === 0) return;

    const completed = sessions.filter((s) => s.status === "completed");
    const rate = Math.round((completed.length / sessions.length) * 100);
    const totalFocusMin = completed.reduce((s, sess) => s + (sess.duration || 0), 0);

    if (rate >= 80 && sessions.length >= 3) {
      insights.push({
        type: "productive",
        text: `${rate}% session completion rate — ${totalFocusMin}min focused`,
        detail: `${completed.length}/${sessions.length} sessions completed. Outstanding discipline!`,
      });
    } else if (rate < 50 && sessions.length >= 2) {
      insights.push({
        type: "warning",
        text: `Only ${rate}% of focus sessions completed`,
        detail: "Try shorter sessions (15min) or fewer tasks per session to build consistency.",
      });
    }
  },

  _loopInsights(data, insights) {
    const loops = data.distractionLoops || [];
    if (loops.length >= 2) {
      const uniqueDomains = new Set(loops.flatMap(l => l.domains || []));
      insights.push({
        type: "warning",
        text: `${loops.length} distraction loops — ${uniqueDomains.size} repeat sites`,
        detail: `Sites: ${[...uniqueDomains].slice(0, 3).join(", ")}. Consider blocking these.`,
      });
    }
  },

  _categoryBalanceInsights(data, insights) {
    if (!data.domains || Object.keys(data.domains).length < 3) return;
    
    const categoryTotals = {};
    Object.entries(data.domains).forEach(([, info]) => {
      const cat = info.category || "Other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (info.time || 0);
    });
    
    const productive = (categoryTotals.Development || 0) + (categoryTotals.Productivity || 0) + 
                       (categoryTotals.Education || 0) + (categoryTotals.Research || 0) + (categoryTotals.Work || 0);
    const distracting = (categoryTotals["Social Media"] || 0) + (categoryTotals.Entertainment || 0) + (categoryTotals.Shopping || 0);
    
    if (productive > 0 && distracting > 0) {
      const ratio = (productive / distracting).toFixed(1);
      if (ratio >= 3) {
        insights.push({
          type: "productive",
          text: `${ratio}:1 productive-to-distraction ratio — excellent balance`,
          detail: `${Math.round(productive)}min productive vs ${Math.round(distracting)}min distracted.`,
        });
      } else if (ratio < 1) {
        insights.push({
          type: "warning",
          text: `More time distracted than productive (ratio: ${ratio}:1)`,
          detail: "Try blocking your top distracting sites during work hours.",
        });
      }
    }
  },

  _screenTimeInsights(todayData, weekData, insights) {
    if (!todayData.totalActive || todayData.totalActive < 30) return;
    
    // Compare today's total to weekly average
    if (weekData.length >= 3) {
      const weekAvg = weekData.slice(1).reduce((s, d) => s + (d.data.totalActive || 0), 0) / Math.max(1, weekData.length - 1);
      const diff = todayData.totalActive - weekAvg;
      const pct = weekAvg > 0 ? Math.round((diff / weekAvg) * 100) : 0;
      
      if (pct > 30) {
        insights.push({
          type: "info",
          text: `Screen time ${pct}% above your daily average`,
          detail: `Today: ${Math.round(todayData.totalActive)}min vs Average: ${Math.round(weekAvg)}min. Consider a break.`,
        });
      }
    }
    
    // Site diversity
    const siteCount = Object.keys(todayData.domains || {}).length;
    if (siteCount > 15) {
      insights.push({
        type: "info",
        text: `Visited ${siteCount} sites today — high context switching`,
        detail: "Frequent site switching can reduce deep focus. Try batching similar tasks.",
      });
    }
  },
};

if (typeof globalThis !== "undefined") {
  globalThis.Insights = Insights;
}
