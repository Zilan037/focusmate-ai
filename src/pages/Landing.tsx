import { motion } from "framer-motion";
import {
  Shield, BarChart3, Target, Lock, Brain, Zap, ArrowRight, Eye, EyeOff,
  Github, Check, X, ChevronRight, Play, Clock, Flame, TrendingUp,
  Globe, CheckCircle, Timer, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { weeklyTrends, categoryBreakdown, hourlyActivity } from "@/data/mockData";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const CATEGORY_COLORS: Record<string, string> = {
  Work: "hsl(199, 89%, 48%)", Education: "hsl(142, 71%, 45%)",
  Entertainment: "hsl(38, 92%, 50%)", Social: "hsl(280, 67%, 55%)",
  News: "hsl(262, 52%, 47%)", Shopping: "hsl(328, 73%, 56%)",
};

const features = [
  { icon: Eye, title: "Smart Tracking", desc: "Event-driven tracking with 5-min threshold. Only meaningful sessions count.", label: "MONITORING" },
  { icon: Target, title: "Focus Mode", desc: "Strict blocking + task-based unlock. Behavioral intervention, not just timers.", label: "INTERVENTION" },
  { icon: Lock, title: "Domain Blocking", desc: "Temporary, daily limits, or scheduled blocks with cognitive override.", label: "SECURITY" },
  { icon: Brain, title: "Behavioral Insights", desc: "Pattern detection, distraction prediction, and actionable intelligence.", label: "INTELLIGENCE" },
  { icon: BarChart3, title: "Analytics Engine", desc: "Daily/weekly reports, heatmaps, trends, and category breakdowns.", label: "ANALYTICS" },
  { icon: Zap, title: "Productivity Score", desc: "Weighted 0–100 score based on focus, work, education, and distractions.", label: "SCORING" },
];

const steps = [
  { num: "01", title: "Install & Track", desc: "Event-driven monitoring of active tab usage with idle detection" },
  { num: "02", title: "Analyze Patterns", desc: "Categorize domains, detect patterns, identify distraction loops" },
  { num: "03", title: "Smart Intervention", desc: "Focus mode enforcement, task-based unlocking, cognitive friction" },
  { num: "04", title: "Behavioral Reports", desc: "Productivity scores, trend analysis, and actionable insights" },
];

const comparison = [
  { feature: "Smart Activity Tracking", fg: true, others: false },
  { feature: "Distraction Loop Detection", fg: true, others: false },
  { feature: "Task-Based Unlock System", fg: true, others: false },
  { feature: "Behavioral Insights AI", fg: true, others: false },
  { feature: "Productivity Scoring (0-100)", fg: true, others: false },
  { feature: "Basic Site Blocking", fg: true, others: true },
  { feature: "Simple Pomodoro Timer", fg: true, others: true },
  { feature: "Cognitive Override System", fg: true, others: false },
];

const Landing = () => {
  return (
    <div className="min-h-screen pt-16">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--info)/0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial="hidden" animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Neural Monitoring Active
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl leading-[0.9]">
              <span className="text-gradient bg-gradient-to-r from-primary via-info to-productive">FocusGuard</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-4 text-lg font-bold text-muted-foreground sm:text-xl tracking-tight">
              Your Behavioral Productivity Operating System
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="mt-4 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              Not just a blocker. Not just a timer. FocusGuard detects distraction patterns, enforces structured focus sessions with task-based unlocking, and delivers actionable productivity intelligence — all running locally in your browser.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="rounded-2xl px-8 font-extrabold uppercase tracking-wider text-xs shadow-[0_4px_24px_hsl(var(--primary)/0.3)] gap-2">
                Add to Chrome <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="rounded-2xl px-8 font-extrabold uppercase tracking-wider text-xs gap-2">
                  View Dashboard <BarChart3 className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/focus">
                <Button size="lg" variant="ghost" className="rounded-2xl px-8 font-extrabold uppercase tracking-wider text-xs gap-2">
                  <Play className="h-4 w-4" /> Try Focus Mode
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* ─── Live Dashboard Preview ─── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="rounded-[28px] border border-border/30 bg-card/60 backdrop-blur-xl p-1 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)]">
              <div className="flex items-center gap-2 px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/50" />
                  <div className="h-3 w-3 rounded-full bg-warning/50" />
                  <div className="h-3 w-3 rounded-full bg-productive/50" />
                </div>
                <div className="flex-1 text-center text-[10px] text-muted-foreground font-mono font-bold tracking-wider uppercase">
                  focusguard — command center
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
                {[
                  { label: "NEURAL SCORE", value: "87", color: "text-primary", icon: TrendingUp },
                  { label: "ENGAGEMENT", value: "6.5h", color: "text-info", icon: Clock },
                  { label: "MASTERY STREAK", value: "12 🔥", color: "text-warning", icon: Flame },
                  { label: "FOCUS SESSIONS", value: "4", color: "text-productive", icon: Target },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[20px] border border-border/30 bg-card/80 p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-4">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className={`text-3xl font-extrabold tracking-tighter font-mono ${stat.color}`}>{stat.value}</span>
                      <stat.icon className={`h-5 w-5 ${stat.color} opacity-40`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Core Features Grid ─── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">System Capabilities</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight">Core Features</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-3 text-muted-foreground font-medium">A complete behavioral productivity system built for deep work</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}
                className="group rounded-[28px] border border-border/30 bg-card/60 p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_hsl(var(--primary)/0.1)] hover:border-primary/20"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-info/10 text-primary transition-all group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                  <f.icon className="h-6 w-6" />
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-2">{f.label}</p>
                <h3 className="text-lg font-extrabold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Focus Mode Showcase ─── */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">Intervention System</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight">Focus Mode</motion.h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto max-w-4xl grid md:grid-cols-2 gap-6"
          >
            {/* Timer Preview */}
            <div className="rounded-[28px] border border-border/30 bg-card/60 p-8 text-center">
              <div className="mx-auto w-48 h-48 relative flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--border))" strokeWidth="4" opacity="0.2" />
                  <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--primary))" strokeWidth="4"
                    strokeDasharray="565" strokeDashoffset="141" strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
                </svg>
                <div>
                  <div className="text-5xl font-mono font-extrabold tracking-tighter text-primary">18:42</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Remaining</div>
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary">⏸ Pause</div>
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs font-bold text-destructive">⏹ Stop</div>
              </div>
            </div>

            {/* Task & Block Lists */}
            <div className="space-y-4">
              <div className="rounded-[28px] border border-border/30 bg-card/60 p-6">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-4">Active Tasks</p>
                {["Complete math homework", "Read chapter 5 notes", "Review flashcards"].map((task, i) => (
                  <div key={task} className="flex items-center gap-3 py-2">
                    <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${i === 0 ? "border-productive bg-productive/20" : "border-border"}`}>
                      {i === 0 && <Check className="h-3 w-3 text-productive" />}
                    </div>
                    <span className={`text-sm font-semibold ${i === 0 ? "line-through text-muted-foreground" : ""}`}>{task}</span>
                  </div>
                ))}
                <p className="mt-3 text-xs font-bold text-muted-foreground">1/3 completed</p>
              </div>
              <div className="rounded-[28px] border border-border/30 bg-card/60 p-6">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-3">Blocked Sites</p>
                <div className="flex flex-wrap gap-2">
                  {["youtube.com", "instagram.com", "reddit.com", "tiktok.com"].map((site) => (
                    <span key={site} className="rounded-full bg-destructive/10 border border-destructive/20 px-3 py-1 text-xs font-bold text-destructive flex items-center gap-1">
                      <Ban className="h-3 w-3" /> {site}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Analytics Preview ─── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">Data Intelligence</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight">Analytics Engine</motion.h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto max-w-5xl grid md:grid-cols-3 gap-6"
          >
            {/* Weekly Trends */}
            <div className="md:col-span-2 rounded-[28px] border border-border/30 bg-card/60 p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-1">Weekly Performance</p>
              <h3 className="text-lg font-extrabold tracking-tight mb-6">Productivity Trends</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyTrends}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, fontSize: 12 }} />
                  <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="distracted" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Donut */}
            <div className="rounded-[28px] border border-border/30 bg-card/60 p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-1">Device Load</p>
              <h3 className="text-lg font-extrabold tracking-tight mb-4">Categories</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {categoryBreakdown.slice(0, 4).map((c) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[c.name] }} />
                    <span className="text-[10px] font-bold text-muted-foreground">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mx-auto max-w-5xl mt-6 rounded-[28px] border border-border/30 bg-card/60 p-7"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground mb-1">Temporal Analysis</p>
            <h3 className="text-lg font-extrabold tracking-tight mb-6">Daily Activity Flow</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyActivity}>
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={3} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="productive" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="distracted" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </section>

      {/* ─── Blocked Page Preview ─── */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[10px] font-black uppercase tracking-[0.25em] text-destructive mb-2">Enforcement</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight">Blocked Page Experience</motion.h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="mx-auto max-w-lg rounded-[28px] border border-destructive/20 bg-card/80 p-10 text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
              <Shield className="h-10 w-10 text-destructive" />
            </div>
            <h3 className="text-2xl font-black bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent">Site Blocked</h3>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-card border border-border/40 px-4 py-1.5 text-sm font-mono font-bold text-muted-foreground">
              <Globe className="h-3.5 w-3.5" /> youtube.com
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground font-semibold">
              <span>💪</span> You&apos;ve resisted <span className="font-extrabold text-foreground">7</span> sites today
            </div>
            <div className="mt-6 rounded-2xl bg-card/60 border border-border/30 p-4">
              <p className="text-sm italic text-muted-foreground font-medium">&quot;Focus on being productive instead of busy.&quot;</p>
              <p className="mt-1 text-xs font-bold text-muted-foreground">— Tim Ferriss</p>
            </div>
            <div className="mt-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Timer className="inline h-3 w-3 mr-1" /> Reflection Timer · 15s required
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">Architecture</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight">How It Works</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.num} variants={fadeUp} custom={i} className="relative">
                <div className="rounded-[28px] border border-border/30 bg-card/60 p-7 h-full transition-all hover:-translate-y-1 hover:shadow-lg">
                  <span className="text-5xl font-black text-primary/15 tracking-tighter">{s.num}</span>
                  <h3 className="mt-2 text-lg font-extrabold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-medium leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-primary/20 h-6 w-6 z-10" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">Competitive Edge</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight">What Makes It Different</motion.h2>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mx-auto max-w-2xl">
            <div className="rounded-[28px] border border-border/30 bg-card/60 overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-5 border-b border-border/30">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">Feature</div>
                <div className="text-center text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary">FocusGuard</div>
                <div className="text-center text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">Others</div>
              </div>
              {comparison.map((row) => (
                <div key={row.feature} className="grid grid-cols-3 gap-4 p-4 border-b border-border/10 text-sm font-semibold">
                  <div>{row.feature}</div>
                  <div className="text-center"><CheckCircle className="inline h-4 w-4 text-productive" /></div>
                  <div className="text-center">
                    {row.others ? <Check className="inline h-4 w-4 text-muted-foreground" /> : <X className="inline h-4 w-4 text-destructive/40" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Tech & Privacy ─── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-2">Security</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight">Tech & Privacy</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Event-Driven", desc: "No constant polling. Lightweight background service worker." },
              { icon: EyeOff, title: "No Keystroke Logging", desc: "We never record what you type. Only domain-level data." },
              { icon: Shield, title: "Local-First", desc: "All data processed and stored locally. You own everything." },
              { icon: Eye, title: "Transparent", desc: "Open-source. Full privacy statement. Complete data export." },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}
                className="rounded-[28px] border border-border/30 bg-card/60 p-7 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-extrabold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground font-medium">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/30 py-12">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="font-extrabold uppercase tracking-wider text-xs text-foreground">FocusGuard</span>
          </div>
          <p className="font-medium">Built for behavioral productivity · 2026</p>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-bold hover:text-foreground transition-colors">
            <Github className="h-4 w-4" /> GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
