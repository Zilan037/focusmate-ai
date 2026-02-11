import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Clock, Target, Flame, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Brain, BarChart3, Activity, Repeat,
} from "lucide-react";
import {
  todayOverview, domainUsage, categoryBreakdown, hourlyActivity,
  weeklyTrends, behavioralInsights, focusSessions, distractionLoops,
} from "@/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const CATEGORY_COLORS: Record<string, string> = {
  Work: "hsl(199, 89%, 48%)",
  Education: "hsl(142, 71%, 45%)",
  Entertainment: "hsl(38, 92%, 50%)",
  Social: "hsl(280, 67%, 55%)",
  News: "hsl(262, 52%, 47%)",
  Shopping: "hsl(328, 73%, 56%)",
};

const Dashboard = () => {
  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Today's productivity overview · Demo Data</p>
        </div>

        {/* Overview Cards */}
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            { label: "Active Time", value: `${todayOverview.totalActiveTime}h`, icon: Clock, accent: "text-info" },
            { label: "Productivity Score", value: todayOverview.productivityScore, icon: TrendingUp, accent: "text-productive" },
            { label: "Focus Sessions", value: todayOverview.focusSessions, icon: Target, accent: "text-primary" },
            { label: "Focus Streak", value: `${todayOverview.currentStreak} days 🔥`, icon: Flame, accent: "text-warning" },
          ].map((card) => (
            <motion.div key={card.label} variants={fadeUp}>
              <Card className="glass">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`rounded-lg bg-secondary p-2.5 ${card.accent}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-xl font-bold">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Focus vs Distraction bar */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
          <Card className="glass">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-productive font-medium">Focus {todayOverview.focusPercentage}%</span>
                <span className="text-distracted font-medium">Distracted {todayOverview.distractionPercentage}%</span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
                <div className="bg-productive transition-all" style={{ width: `${todayOverview.focusPercentage}%` }} />
                <div className="bg-distracted transition-all" style={{ width: `${todayOverview.distractionPercentage}%` }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Row */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          {/* Domain Usage */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Domain Usage (minutes)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={domainUsage} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="domain" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="time" radius={[0, 4, 4, 0]}>
                    {domainUsage.map((entry) => (
                      <Cell key={entry.domain} fill={CATEGORY_COLORS[entry.category] || "hsl(var(--primary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Daily Timeline */}
        <Card className="glass mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="productive" stackId="1" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.3} />
                <Area type="monotone" dataKey="distracted" stackId="1" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Trends */}
        <Card className="glass mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weekly Trends (hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="distracted" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Insights + Focus Sessions Row */}
        <div className="grid gap-4 lg:grid-cols-2 mb-6">
          {/* Behavioral Insights */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-warning" /> Behavioral Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {behavioralInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`rounded-lg border p-3 text-sm ${
                    insight.type === "warning"
                      ? "border-warning/30 bg-warning/5"
                      : insight.type === "productive"
                      ? "border-productive/30 bg-productive/5"
                      : "border-info/30 bg-info/5"
                  }`}
                >
                  <div className="font-medium">{insight.text}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{insight.detail}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Focus Sessions Log */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Focus Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Duration</TableHead>
                    <TableHead className="text-xs">Tasks</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {focusSessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-mono">{s.startTime}</TableCell>
                      <TableCell className="text-xs">{s.duration}m</TableCell>
                      <TableCell className="text-xs">{s.tasksCompleted}/{s.totalTasks}</TableCell>
                      <TableCell>
                        {s.status === "completed" ? (
                          <Badge className="bg-productive/20 text-productive border-productive/30 text-xs gap-1">
                            <CheckCircle className="h-3 w-3" /> Done
                          </Badge>
                        ) : (
                          <Badge className="bg-distracted/20 text-distracted border-distracted/30 text-xs gap-1">
                            <XCircle className="h-3 w-3" /> Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Distraction Loops */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Repeat className="h-4 w-4 text-distracted" /> Distraction Loop Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {distractionLoops.map((loop) => (
              <div key={loop.id} className="flex items-start gap-3 rounded-lg border border-distracted/20 bg-distracted/5 p-3">
                <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${loop.severity === "high" ? "text-distracted" : "text-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{loop.time}</span>
                    <Badge variant="outline" className={`text-xs ${loop.severity === "high" ? "border-distracted/40 text-distracted" : "border-warning/40 text-warning"}`}>
                      {loop.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{loop.duration}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {loop.domains.map((d, i) => (
                      <span key={i} className="text-xs rounded bg-secondary px-1.5 py-0.5 font-mono">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
