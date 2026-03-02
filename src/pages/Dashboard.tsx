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
  Work: "#0EA5E9", Education: "#10B981",
  Entertainment: "#F59E0B", Social: "#7C3AED",
  News: "#6D28D9", Shopping: "#DB2777",
};

const ICON_GRADIENTS: Record<string, string> = {
  info: "from-[#38BDF8] to-[#0EA5E9]",
  productive: "from-[#34D399] to-[#10B981]",
  primary: "from-[#A78BFA] to-[#7C3AED]",
  warning: "from-[#FCD34D] to-[#F59E0B]",
};

const ClayCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard transition-all duration-500 hover:-translate-y-1 hover:shadow-clayCardHover ${className}`}>
    {children}
  </div>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1 font-heading">Global Intelligence</p>
          <h1 className="text-3xl font-black tracking-tight font-heading">Focus Protocol</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Today&apos;s productivity overview · Demo Data</p>
        </div>

        {/* KPI Cards */}
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Engagement Index", value: `${todayOverview.totalActiveTime}h`, icon: Clock, color: "info" },
            { label: "Neural Score", value: todayOverview.productivityScore, icon: TrendingUp, color: "productive" },
            { label: "Focus Sessions", value: todayOverview.focusSessions, icon: Target, color: "primary" },
            { label: "Mastery Streak", value: `${todayOverview.currentStreak} 🔥`, icon: Flame, color: "warning" },
          ].map((card) => (
            <motion.div key={card.label} variants={fadeUp}>
              <ClayCard className="p-7">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground font-heading">{card.label}</p>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-[12px] bg-gradient-to-br ${ICON_GRADIENTS[card.color]} text-white shadow-clayButton`}>
                    <card.icon className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-4xl font-black tracking-tighter font-heading text-foreground">{card.value}</span>
              </ClayCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Focus vs Distraction */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <ClayCard className="p-7">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-productive font-black text-xs uppercase tracking-wider font-heading">Focus {todayOverview.focusPercentage}%</span>
              <span className="text-destructive font-black text-xs uppercase tracking-wider font-heading">Distracted {todayOverview.distractionPercentage}%</span>
            </div>
            <div className="h-4 rounded-full bg-input overflow-hidden flex shadow-clayPressed">
              <div className="bg-productive rounded-l-full transition-all" style={{ width: `${todayOverview.focusPercentage}%` }} />
              <div className="bg-destructive rounded-r-full transition-all" style={{ width: `${todayOverview.distractionPercentage}%` }} />
            </div>
          </ClayCard>
        </motion.div>

        {/* Charts Row */}
        <div className="grid gap-5 lg:grid-cols-2 mb-8">
          <ClayCard className="p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1 font-heading">Network Activity</p>
            <h3 className="text-lg font-black tracking-tight mb-6 font-heading">Domain Usage</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={domainUsage} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="domain" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} width={120} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "none", borderRadius: 20, fontSize: 12, boxShadow: "16px 16px 32px rgba(160,150,180,0.2), -10px -10px 24px rgba(255,255,255,0.9)" }} />
                <Bar dataKey="time" radius={[0, 8, 8, 0]}>
                  {domainUsage.map((entry) => (
                    <Cell key={entry.domain} fill={CATEGORY_COLORS[entry.category] || "#7C3AED"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ClayCard>

          <ClayCard className="p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1 font-heading">Device Load</p>
            <h3 className="text-lg font-black tracking-tight mb-6 font-heading">Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "none", borderRadius: 20, fontSize: 12, boxShadow: "16px 16px 32px rgba(160,150,180,0.2)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </ClayCard>
        </div>

        {/* Timeline */}
        <ClayCard className="p-7 mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1 font-heading">Temporal Flow</p>
          <h3 className="text-lg font-black tracking-tight mb-6 font-heading">Daily Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} interval={2} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "none", borderRadius: 20, fontSize: 12, boxShadow: "16px 16px 32px rgba(160,150,180,0.2)" }} />
              <Area type="monotone" dataKey="productive" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="distracted" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ClayCard>

        {/* Weekly */}
        <ClayCard className="p-7 mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1 font-heading">Weekly Performance</p>
          <h3 className="text-lg font-black tracking-tight mb-6 font-heading">Weekly Trends (hours)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "none", borderRadius: 20, fontSize: 12, boxShadow: "16px 16px 32px rgba(160,150,180,0.2)" }} />
              <Bar dataKey="productive" fill="#10B981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="distracted" fill="#EF4444" radius={[8, 8, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
            </BarChart>
          </ResponsiveContainer>
        </ClayCard>

        {/* Insights + Sessions */}
        <div className="grid gap-5 lg:grid-cols-2 mb-8">
          <ClayCard className="p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-warning mb-1 flex items-center gap-1 font-heading"><Brain className="h-3 w-3" /> Strategy</p>
            <h3 className="text-lg font-black tracking-tight mb-5 font-heading">Behavioral Insights</h3>
            <div className="space-y-3">
              {behavioralInsights.map((insight) => (
                <div key={insight.id}
                  className={`rounded-[20px] p-4 text-sm shadow-clayPressed ${
                    insight.type === "warning" ? "bg-warning/5" :
                    insight.type === "productive" ? "bg-productive/5" :
                    "bg-info/5"
                  }`}
                >
                  <div className="font-bold">{insight.text}</div>
                  <div className="mt-1 text-xs text-muted-foreground font-medium">{insight.detail}</div>
                </div>
              ))}
            </div>
          </ClayCard>

          <ClayCard className="p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-primary mb-1 flex items-center gap-1 font-heading"><Target className="h-3 w-3" /> Archive</p>
            <h3 className="text-lg font-black tracking-tight mb-5 font-heading">Focus Sessions</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider font-heading">Time</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider font-heading">Dur</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider font-heading">Tasks</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider font-heading">Status</TableHead>
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
                        <Badge className="bg-productive/20 text-productive border-productive/30 text-[10px] font-bold gap-1 rounded-full"><CheckCircle className="h-3 w-3" /> Done</Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px] font-bold gap-1 rounded-full"><XCircle className="h-3 w-3" /> Failed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ClayCard>
        </div>

        {/* Distraction Loops */}
        <ClayCard className="p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-destructive mb-1 flex items-center gap-1 font-heading"><Repeat className="h-3 w-3" /> Detection</p>
          <h3 className="text-lg font-black tracking-tight mb-5 font-heading">Distraction Loop Alerts</h3>
          <div className="space-y-3">
            {distractionLoops.map((loop) => (
              <div key={loop.id} className="flex items-start gap-3 rounded-[20px] bg-destructive/5 shadow-clayPressed p-4">
                <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${loop.severity === "high" ? "text-destructive" : "text-warning"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span>{loop.time}</span>
                    <Badge variant="outline" className={`text-[10px] font-bold rounded-full ${loop.severity === "high" ? "border-destructive/30 text-destructive" : "border-warning/30 text-warning"}`}>
                      {loop.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-bold">{loop.duration}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {loop.domains.map((d, i) => (
                      <span key={i} className="text-xs rounded-full bg-card/80 shadow-clayCard px-3 py-1 font-mono font-bold">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ClayCard>
      </div>
    </div>
  );
};

export default Dashboard;
