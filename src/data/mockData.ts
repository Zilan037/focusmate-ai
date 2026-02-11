export const todayOverview = {
  totalActiveTime: 6.5,
  focusPercentage: 62,
  distractionPercentage: 38,
  productivityScore: 74,
  currentStreak: 5,
  focusSessions: 4,
  tasksCompleted: 12,
};

export const domainUsage = [
  { domain: "docs.google.com", time: 95, category: "Work", color: "hsl(var(--chart-work))" },
  { domain: "youtube.com", time: 72, category: "Entertainment", color: "hsl(var(--chart-entertainment))" },
  { domain: "stackoverflow.com", time: 58, category: "Education", color: "hsl(var(--chart-education))" },
  { domain: "github.com", time: 85, category: "Work", color: "hsl(var(--chart-work))" },
  { domain: "instagram.com", time: 35, category: "Social", color: "hsl(var(--chart-social))" },
  { domain: "twitter.com", time: 28, category: "Social", color: "hsl(var(--chart-social))" },
  { domain: "reddit.com", time: 22, category: "Entertainment", color: "hsl(var(--chart-entertainment))" },
  { domain: "udemy.com", time: 45, category: "Education", color: "hsl(var(--chart-education))" },
];

export const categoryBreakdown = [
  { name: "Work", value: 180, color: "hsl(var(--chart-work))" },
  { name: "Education", value: 103, color: "hsl(var(--chart-education))" },
  { name: "Entertainment", value: 94, color: "hsl(var(--chart-entertainment))" },
  { name: "Social", value: 63, color: "hsl(var(--chart-social))" },
  { name: "News", value: 18, color: "hsl(var(--chart-news))" },
  { name: "Shopping", value: 12, color: "hsl(var(--chart-shopping))" },
];

export const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  productive: i >= 6 && i <= 22
    ? Math.round(Math.max(0, (i >= 9 && i <= 17 ? 40 + Math.random() * 20 : 10 + Math.random() * 20)))
    : 0,
  distracted: i >= 6 && i <= 22
    ? Math.round(Math.max(0, (i >= 20 ? 25 + Math.random() * 20 : 5 + Math.random() * 15)))
    : 0,
}));

export const weeklyTrends = [
  { day: "Mon", productive: 4.2, distracted: 1.8, score: 72 },
  { day: "Tue", productive: 5.1, distracted: 1.2, score: 81 },
  { day: "Wed", productive: 3.8, distracted: 2.5, score: 60 },
  { day: "Thu", productive: 5.5, distracted: 0.9, score: 86 },
  { day: "Fri", productive: 4.0, distracted: 2.1, score: 65 },
  { day: "Sat", productive: 2.0, distracted: 3.5, score: 38 },
  { day: "Sun", productive: 3.2, distracted: 2.0, score: 61 },
];

export const behavioralInsights = [
  {
    id: 1,
    type: "warning" as const,
    text: "You're 35% more distracted after 10PM",
    detail: "Your focus score drops from 78 to 45 after 10PM on average.",
  },
  {
    id: 2,
    type: "info" as const,
    text: "YouTube consumes 62% of entertainment time",
    detail: "Consider setting a 30-minute daily limit.",
  },
  {
    id: 3,
    type: "productive" as const,
    text: "90% focus sessions succeed before 5PM",
    detail: "Schedule important work in the morning for best results.",
  },
  {
    id: 4,
    type: "warning" as const,
    text: "Tab switching increased 40% this week",
    detail: "You averaged 23 tab switches per hour on Wednesday.",
  },
  {
    id: 5,
    type: "productive" as const,
    text: "5-day focus streak! Personal best 🔥",
    detail: "Keep it going — your productivity score is trending up.",
  },
];

export const focusSessions = [
  { id: 1, startTime: "09:00", duration: 45, tasksCompleted: 3, totalTasks: 3, status: "completed" as const, interruptions: 0 },
  { id: 2, startTime: "11:15", duration: 30, tasksCompleted: 2, totalTasks: 2, status: "completed" as const, interruptions: 1 },
  { id: 3, startTime: "14:00", duration: 25, tasksCompleted: 1, totalTasks: 3, status: "failed" as const, interruptions: 4 },
  { id: 4, startTime: "16:30", duration: 60, tasksCompleted: 4, totalTasks: 4, status: "completed" as const, interruptions: 0 },
  { id: 5, startTime: "19:00", duration: 15, tasksCompleted: 0, totalTasks: 2, status: "failed" as const, interruptions: 6 },
];

export const distractionLoops = [
  {
    id: 1,
    time: "10:42 AM",
    domains: ["youtube.com", "instagram.com", "youtube.com", "twitter.com"],
    duration: "8 min",
    severity: "high" as const,
  },
  {
    id: 2,
    time: "3:15 PM",
    domains: ["reddit.com", "twitter.com", "reddit.com"],
    duration: "5 min",
    severity: "medium" as const,
  },
  {
    id: 3,
    time: "9:30 PM",
    domains: ["youtube.com", "instagram.com", "tiktok.com", "youtube.com", "instagram.com"],
    duration: "12 min",
    severity: "high" as const,
  },
];

export const motivationalQuotes = [
  "The secret of getting ahead is getting started. — Mark Twain",
  "Focus on being productive instead of busy. — Tim Ferriss",
  "It's not that I'm so smart, it's just that I stay with problems longer. — Einstein",
  "Deep work is the ability to focus without distraction on a cognitively demanding task. — Cal Newport",
  "You will never reach your destination if you stop and throw stones at every dog that barks. — Winston Churchill",
];
