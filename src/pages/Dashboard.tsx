import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
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
  Work: "hsl(199, 89%, 48%)", Education: "hsl(142, 71%, 45%)",
  Entertainment: "hsl(38, 92%, 50%)", Social: "hsl(280, 67%, 55%)",
  News: "hsl(262, 52%, 47%)", Shopping: "hsl(328, 73%, 56%)",
};

const PremiumCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[28px] border border-border/30 bg-card/60 transition-all hover:shadow-lg ${className}`}>
    {children}
  </div>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1">Global Intelligence</p>
          <h1 className="text-3xl font-black tracking-tight">Focus Protocol</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Today&apos;s productivity overview · Demo Data</p>
        </div>

        {/* KPI Cards */}
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Engagement Index", value: `${todayOverview.totalActiveTime}h`, icon: Clock, color: "text-info" },
            { label: "Neural Score", value: todayOverview.productivityScore, icon: TrendingUp, color: "text-productive" },
            { label: "Focus Sessions", value: todayOverview.focusSessions, icon: Target, color: "text-primary" },
            { label: "Mastery Streak", value: `${todayOverview.currentStreak} 🔥`, icon: Flame, color: "text-warning" },
          ].map((card) => (
            <motion.div key={card.label} variants={fadeUp}>
              <PremiumCard className="p-7">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-5">{card.label}</p>
                <div className="flex items-end justify-between">
                  <span className={`text-4xl font-extrabold tracking-tighter font-mono ${card.color}`}>{card.value}</span>
                  <card.icon className={`h-5 w-5 ${card.color} opacity-30`} />
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Focus vs Distraction */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <PremiumCard className="p-7">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-productive font-bold text-xs uppercase tracking-wider">Focus {todayOverview.focusPercentage}%</span>
              <span className="text-destructive font-bold text-xs uppercase tracking-wider">Distracted {todayOverview.distractionPercentage}%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden flex">
              <div className="bg-productive rounded-l-full transition-all" style={{ width: `${todayOverview.focusPercentage}%` }} />
              <div className="bg-destructive rounded-r-full transition-all" style={{ width: `${todayOverview.distractionPercentage}%` }} />
            </div>
          </PremiumCard>
        </motion.div>

        {/* Charts Row */}
        <div className="grid gap-5 lg:grid-cols-2 mb-8">
          <PremiumCard className="p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-1">Network Activity</p>
            <h3 className="text-lg font-extrabold tracking-tight mb-6">Domain Usage</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={domainUsage} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="domain" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, fontSize: 12 }} />
                <Bar dataKey="time" radius={[0, 6, 6, 0]}>
                  {domainUsage.map((entry) => (
                    <Cell key={entry.domain} fill={CATEGORY_COLORS[entry.category] || "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </PremiumCard>

          <PremiumCard className="p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-1">Device Load</p>
            <h3 className="text-lg font-extrabold tracking-tight mb-6">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </PremiumCard>
        </div>

        {/* Timeline */}
        <PremiumCard className="p-7 mb-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-1">Temporal Flow</p>
          <h3 className="text-lg font-extrabold tracking-tight mb-6">Daily Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} interval={2} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, fontSize: 12 }} />
              <Area type="monotone" dataKey="productive" stackId="1" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="distracted" stackId="1" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.15} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </AreaChart>
          </ResponsiveContainer>
        </PremiumCard>

        {/* Weekly */}
        <PremiumCard className="p-7 mb-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-1">Weekly Performance</p>
          <h3 className="text-lg font-extrabold tracking-tight mb-6">Weekly Trends (hours)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, fontSize: 12 }} />
              <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="distracted" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </BarChart>
          </ResponsiveContainer>
        </PremiumCard>

        {/* Insights + Sessions */}
        <div className="grid gap-5 lg:grid-cols-2 mb-8">
          <PremiumCard className="p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-warning mb-1 flex items-center gap-1"><Brain className="h-3 w-3" /> Strategy</p>
            <h3 className="text-lg font-extrabold tracking-tight mb-5">Behavioral Insights</h3>
            <div className="space-y-3">
              {behavioralInsights.map((insight) => (
                <div key={insight.id}
                  className={`rounded-2xl border p-4 text-sm ${
                    insight.type === "warning" ? "border-warning/20 bg-warning/5" :
                    insight.type === "productive" ? "border-productive/20 bg-productive/5" :
                    "border-info/20 bg-info/5"
                  }`}
                >
                  <div className="font-bold">{insight.text}</div>
                  <div className="mt-1 text-xs text-muted-foreground font-medium">{insight.detail}</div>
                </div>
              ))}
            </div>
          </PremiumCard>

          <PremiumCard className="p-7">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary mb-1 flex items-center gap-1"><Target className="h-3 w-3" /> Archive</p>
            <h3 className="text-lg font-extrabold tracking-tight mb-5">Focus Sessions</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider">Time</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider">Dur</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider">Tasks</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {focusSessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs font-mono font-bold">{s.startTime}</TableCell>
                    <TableCell className="text-xs font-bold">{s.duration}m</TableCell>
                    <TableCell className="text-xs font-bold">{s.tasksCompleted}/{s.totalTasks}</TableCell>
                    <TableCell>
                      {s.status === "completed" ? (
                        <Badge className="bg-productive/20 text-productive border-productive/30 text-[10px] font-bold gap-1"><CheckCircle className="h-3 w-3" /> Done</Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px] font-bold gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </PremiumCard>
        </div>

        {/* Distraction Loops */}
        <PremiumCard className="p-7">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-destructive mb-1 flex items-center gap-1"><Repeat className="h-3 w-3" /> Detection</p>
          <h3 className="text-lg font-extrabold tracking-tight mb-5">Distraction Loop Alerts</h3>
          <div className="space-y-3">
            {distractionLoops.map((loop) => (
              <div key={loop.id} className="flex items-start gap-3 rounded-2xl border border-destructive/15 bg-destructive/5 p-4">
                <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${loop.severity === "high" ? "text-destructive" : "text-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>{loop.time}</span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${loop.severity === "high" ? "border-destructive/30 text-destructive" : "border-warning/30 text-warning"}`}>
                      {loop.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-bold">{loop.duration}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {loop.domains.map((d, i) => (
                      <span key={i} className="text-xs rounded-lg bg-secondary px-2 py-0.5 font-mono font-bold">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

export default Dashboard;
