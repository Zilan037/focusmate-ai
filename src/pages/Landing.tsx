import { motion } from "framer-motion";
import { Shield, BarChart3, Target, Lock, Brain, Zap, ArrowRight, Eye, EyeOff, Github, ChevronRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: Eye, title: "Smart Tracking", desc: "Event-driven tracking with 5-min threshold. Only meaningful sessions count.", color: "text-info" },
  { icon: Target, title: "Focus Mode", desc: "Strict blocking + task-based unlock. Behavioral intervention, not just timers.", color: "text-primary" },
  { icon: Lock, title: "Domain Blocking", desc: "Temporary, daily limits, or scheduled blocks with cognitive override.", color: "text-distracted" },
  { icon: Brain, title: "Behavioral Insights", desc: "Pattern detection, distraction prediction, and actionable intelligence.", color: "text-warning" },
  { icon: BarChart3, title: "Analytics Engine", desc: "Daily/weekly reports, heatmaps, trends, and category breakdowns.", color: "text-productive" },
  { icon: Zap, title: "Productivity Scoring", desc: "Weighted 0–100 score based on focus, work, education, and distractions.", color: "text-primary" },
];

const steps = [
  { num: "01", title: "Track", desc: "Event-driven monitoring of active tab usage with idle detection" },
  { num: "02", title: "Analyze", desc: "Categorize domains, detect patterns, identify distraction loops" },
  { num: "03", title: "Intervene", desc: "Smart blocking, focus mode enforcement, and task-based unlocking" },
  { num: "04", title: "Report", desc: "Behavioral insights, productivity scores, and trend analysis" },
];

const comparison = [
  { feature: "Smart Activity Tracking", focusguard: true, others: false },
  { feature: "Distraction Loop Detection", focusguard: true, others: false },
  { feature: "Task-Based Unlock", focusguard: true, others: false },
  { feature: "Behavioral Insights", focusguard: true, others: false },
  { feature: "Productivity Scoring", focusguard: true, others: false },
  { feature: "Basic Site Blocking", focusguard: true, others: true },
  { feature: "Simple Timer", focusguard: true, others: true },
  { feature: "Cognitive Override System", focusguard: true, others: false },
];

const Landing = () => {
  return (
    <div className="min-h-screen pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" /> Chrome Extension
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl font-black tracking-tight sm:text-6xl md:text-7xl">
              <span className="text-gradient bg-gradient-to-r from-primary via-info to-productive">FocusGuard</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-2 text-lg font-medium text-muted-foreground sm:text-xl">
              Your Behavioral Productivity Operating System
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Not just a blocker. Not just a timer. FocusGuard detects distraction patterns, enforces structured focus sessions, and delivers actionable productivity intelligence.
            </motion.p>
            <motion.div variants={fadeUp} custom={4} className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="glow-primary gap-2 font-semibold">
                Add to Chrome <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="gap-2 font-semibold">
                  View Dashboard <BarChart3 className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Mock browser window */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="glass rounded-xl overflow-hidden glow-primary">
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-distracted/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-productive/60" />
                </div>
                <div className="flex-1 text-center text-xs text-muted-foreground font-mono">focusguard.app/dashboard</div>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-productive/10 border border-productive/20 p-4 text-center">
                  <div className="text-2xl font-bold text-productive">74</div>
                  <div className="text-xs text-muted-foreground mt-1">Productivity Score</div>
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-center">
                  <div className="text-2xl font-bold text-primary">6.5h</div>
                  <div className="text-xs text-muted-foreground mt-1">Active Time</div>
                </div>
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-4 text-center">
                  <div className="text-2xl font-bold text-warning">5🔥</div>
                  <div className="text-xs text-muted-foreground mt-1">Focus Streak</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold">Core Features</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-2 text-muted-foreground">A complete behavioral productivity system</motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i}>
                <Card className="glass h-full hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <f.icon className={`h-8 w-8 ${f.color} mb-3`} />
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold">How It Works</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-2 text-muted-foreground">Event-driven architecture, from tracking to insights</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.num} variants={fadeUp} custom={i} className="relative">
                <div className="glass rounded-xl p-6 h-full">
                  <span className="text-4xl font-black text-primary/20">{s.num}</span>
                  <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-primary/30 h-6 w-6 z-10" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold">What Makes It Different</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-2 text-muted-foreground">FocusGuard vs typical productivity tools</motion.p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mx-auto max-w-2xl">
            <div className="glass rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 gap-4 p-4 border-b border-border/50 font-semibold text-sm">
                <div>Feature</div>
                <div className="text-center text-primary">FocusGuard</div>
                <div className="text-center text-muted-foreground">Others</div>
              </div>
              {comparison.map((row) => (
                <div key={row.feature} className="grid grid-cols-3 gap-4 p-4 border-b border-border/20 text-sm">
                  <div>{row.feature}</div>
                  <div className="text-center">
                    <Check className="inline h-4 w-4 text-productive" />
                  </div>
                  <div className="text-center">
                    {row.others ? <Check className="inline h-4 w-4 text-muted-foreground" /> : <X className="inline h-4 w-4 text-distracted/50" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tech & Privacy */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold">Tech & Privacy</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-2 text-muted-foreground">Built with security and transparency in mind</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap, title: "Event-Driven", desc: "No constant polling. Lightweight background service worker." },
              { icon: EyeOff, title: "No Keystroke Logging", desc: "We never record what you type. Only domain-level data." },
              { icon: Shield, title: "Local-First", desc: "Data processed locally. Cloud sync is optional and encrypted." },
              { icon: Eye, title: "Transparent", desc: "Open-source. Full privacy statement. You own your data." },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <Card className="glass h-full">
                  <CardContent className="p-6 text-center">
                    <item.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Shield className="h-4 w-4 text-primary" />
            FocusGuard
          </div>
          <p>Built for behavioral productivity. School project 2026.</p>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Github className="h-4 w-4" /> GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
