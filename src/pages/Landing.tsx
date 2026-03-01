import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Shield, BarChart3, Target, Lock, Brain, Zap, ArrowRight,
  EyeOff, Github, Check, X, ChevronRight, Clock, Flame, TrendingUp,
  Globe, CheckCircle, Timer, Sparkles, Eye, Activity, Layers,
  ChevronDown, Plus, Minus, Monitor,
} from "lucide-react";
import extStats from "@/assets/ext-stats.png";
import extFocus from "@/assets/ext-focus.png";
import extDashboard from "@/assets/ext-dashboard.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import { weeklyTrends, categoryBreakdown, hourlyActivity } from "@/data/mockData";

/* ─── Animation Variants ─── */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const CATEGORY_COLORS: Record<string, string> = {
  Work: "hsl(199, 89%, 48%)", Education: "hsl(142, 71%, 45%)",
  Entertainment: "hsl(38, 92%, 50%)", Social: "hsl(280, 67%, 55%)",
  News: "hsl(262, 52%, 47%)", Shopping: "hsl(328, 73%, 56%)",
};

/* ─── Scroll-Triggered Section ─── */
const Section = ({
  children, className = "", id, ariaLabel,
}: { children: React.ReactNode; className?: string; id?: string; ariaLabel?: string }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={`py-24 md:py-36 ${className}`}
    >
      <div className="mx-auto max-w-5xl px-6">{children}</div>
    </motion.section>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <motion.p variants={fadeUp} className="text-sm font-bold uppercase tracking-[0.15em] text-primary mb-4">
    {children}
  </motion.p>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-foreground">
    {children}
  </motion.h2>
);

const SectionDesc = ({ children }: { children: React.ReactNode }) => (
  <motion.p variants={fadeUp} className="mt-5 text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-2xl">
    {children}
  </motion.p>
);

/* ─── Animated Counter Hook ─── */
const useCounter = (target: number, duration = 2000, inView = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, inView]);
  return count;
};

/* ─── 3D Tilt Card ─── */
const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 300, damping: 30 });

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);

  const handleLeave = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Feature Card ─── */
const FeatureCard = ({ icon: Icon, title, desc, index }: {
  icon: React.ElementType; title: string; desc: string; index: number;
}) => (
  <motion.div variants={fadeUp} custom={index}>
    <TiltCard className="group h-full rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:shadow-xl hover:shadow-primary/8">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2.5 text-[15px] text-foreground/60 leading-relaxed">{desc}</p>
    </TiltCard>
  </motion.div>
);

/* ─── Stat Card ─── */
const StatCard = ({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) => (
  <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">{label}</p>
      <Icon className={`h-4 w-4 ${color} opacity-70`} />
    </div>
    <span className={`text-3xl font-bold tracking-tight font-mono ${color}`}>{value}</span>
  </div>
);

/* ─── Comparison Row ─── */
const CompareRow = ({ feature, fg, others }: { feature: string; fg: boolean; others: boolean }) => (
  <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4 px-5 py-4 border-b border-border/40 last:border-0 items-center">
    <div className="text-[15px] font-semibold text-foreground">{feature}</div>
    <div className="text-center">{fg ? <CheckCircle className="inline h-4.5 w-4.5 text-productive" /> : <X className="inline h-4.5 w-4.5 text-destructive/40" />}</div>
    <div className="text-center">{others ? <Check className="inline h-4 w-4 text-muted-foreground/60" /> : <X className="inline h-4 w-4 text-destructive/30" />}</div>
  </motion.div>
);

/* ─── FAQ Item ─── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} className="border-b border-border/20 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-6 text-left group"
      >
        <span className="text-[15px] sm:text-base font-semibold text-foreground/90 group-hover:text-primary transition-colors">{q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[15px] text-foreground/60 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Animated Stars ─── */
const AnimatedStars = ({ count, inView }: { count: number; inView: boolean }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.svg
        key={i}
        initial={{ opacity: 0, scale: 0 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: i * 0.1, duration: 0.3, type: "spring", stiffness: 400 }}
        className={`h-4 w-4 ${i < count ? "text-warning" : "text-border"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </motion.svg>
    ))}
  </div>
);

/* ─── Typewriter Effect ─── */
const Typewriter = ({ text, className = "" }: { text: string; className?: string }) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) { setDone(true); clearInterval(timer); }
    }, 80);
    return () => clearInterval(timer);
  }, [text]);
  return (
    <span className={className}>
      {displayed}
      {!done && <span className="animate-pulse">|</span>}
    </span>
  );
};

/* ═════════════════════════════════════════════
   LANDING PAGE — UI 2.0
   Premium SaaS aesthetic with micro-interactions
   ═════════════════════════════════════════════ */

const Landing = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroCounterRef = useRef<HTMLDivElement>(null);
  const heroCounterInView = useInView(heroCounterRef, { once: true });

  // Floating CTA visibility
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const nearBottom = scrollY + winHeight > docHeight - 300;
      setShowFloatingCTA(scrollY > 600 && !nearBottom);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mouse glow for hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const handleHeroMouse = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const usersCount = useCounter(10847, 2500, heroCounterInView);
  const hoursSaved = useCounter(2100000, 2500, heroCounterInView);

  return (
    <div className="min-h-screen relative">
      {/* ═══════════════════════════════════════
          SECTION 1 — HERO
          Animated gradient mesh + typewriter + counters
          ═══════════════════════════════════════ */}
      <section
        ref={heroRef}
        aria-label="Introduction"
        className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28"
        onMouseMove={handleHeroMouse}
      >
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-1/2 -left-1/4 w-[80%] h-[80%] rounded-full opacity-[0.07]"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }}
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -bottom-1/3 -right-1/4 w-[70%] h-[70%] rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, hsl(var(--info)), transparent 70%)" }}
            animate={{ x: [0, -40, 0], y: [0, -60, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute top-1/4 right-1/3 w-[40%] h-[40%] rounded-full opacity-[0.04]"
            style={{ background: "radial-gradient(circle, hsl(var(--productive)), transparent 70%)" }}
            animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Cursor glow */}
        <motion.div
          className="pointer-events-none absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{
            x: mouseX, y: mouseY,
            background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)",
            translateX: "-50%", translateY: "-50%",
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="mx-auto max-w-3xl px-6 text-center relative"
        >
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 border border-primary/15 px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Behavioral Productivity System
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.05]"
          >
            Your focus,{" "}
            <Typewriter text="protected." className="text-gradient bg-gradient-to-r from-primary to-info" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-6 text-lg sm:text-xl text-foreground/60 leading-relaxed max-w-xl mx-auto"
          >
            FocusGuard detects distraction patterns, enforces structured focus sessions,
            and delivers actionable productivity intelligence — all locally in your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            <Button size="lg" className="rounded-full px-8 font-semibold text-sm gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]">
              Add to Chrome <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="rounded-full px-8 font-semibold text-sm gap-2 hover:scale-[1.02] transition-transform">
                View Demo
              </Button>
            </Link>
          </motion.div>

          {/* Animated counters */}
          <motion.div
            ref={heroCounterRef}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-10 flex items-center justify-center gap-8 text-sm text-foreground/50"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono text-foreground">{usersCount.toLocaleString()}+</span>
              <span className="text-xs mt-0.5">Active Users</span>
            </div>
            <span className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono text-foreground">{(hoursSaved / 1000000).toFixed(1)}M+</span>
              <span className="text-xs mt-0.5">Hours Saved</span>
            </div>
            <span className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono text-foreground">4.9</span>
              <span className="text-xs mt-0.5 flex items-center gap-1">
                <svg className="h-3 w-3 text-warning" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Rating
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Product Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-16 max-w-4xl px-6"
        >
          <TiltCard className="rounded-2xl border border-border bg-card p-1 shadow-2xl shadow-primary/8">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
                <div className="h-2.5 w-2.5 rounded-full bg-productive/50" />
              </div>
              <div className="flex-1 text-center text-[11px] text-foreground/35 font-mono tracking-wide">
                focusguard — command center
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
              <StatCard label="Score" value="87" icon={TrendingUp} color="text-primary" />
              <StatCard label="Active" value="6.5h" icon={Clock} color="text-info" />
              <StatCard label="Streak" value="12" icon={Flame} color="text-warning" />
              <StatCard label="Sessions" value="4" icon={Target} color="text-productive" />
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ─── Trusted By Bar ─── */}
      <div className="py-12 border-y border-border/30">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-foreground/30 mb-8">
            Trusted by teams at
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-30 grayscale">
            {["Stanford", "Google", "Notion", "Figma", "Stripe", "Vercel"].map((name) => (
              <span key={name} className="text-lg md:text-xl font-bold text-foreground tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 2 — PROBLEM
          ═══════════════════════════════════════ */}
      <Section id="problem" ariaLabel="The problem we solve">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <SectionLabel>The Problem</SectionLabel>
            <SectionTitle>We lose 2.5 hours daily to digital distractions.</SectionTitle>
            <SectionDesc>
              Context switching costs 23 minutes per interruption. Tab hopping creates anxiety loops.
              Traditional blockers don't understand <em>why</em> you're distracted — they just block.
            </SectionDesc>
            <motion.div variants={staggerContainer} className="mt-8 space-y-4">
              {[
                { icon: Activity, text: "Average person checks phone 96 times/day", color: "text-destructive" },
                { icon: Timer, text: "23 min to refocus after each interruption", color: "text-warning" },
                { icon: TrendingUp, text: "28% productivity loss from multitasking", color: "text-info" },
              ].map((stat) => (
                <motion.div key={stat.text} variants={fadeUp} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card border border-border ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[15px] text-foreground/70 leading-relaxed">{stat.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <motion.div variants={scaleIn} className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-destructive/8 to-warning/8 border border-border p-8 text-center">
              <AnimatedCounter target={2.5} suffix="h" className="text-7xl font-extrabold font-mono text-destructive/30 mb-2" />
              <p className="text-base font-semibold text-foreground/50">Lost every single day</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {["Social Media", "Video", "News"].map((cat, i) => (
                  <div key={cat} className="rounded-xl bg-card border border-border p-3">
                    <div className="text-xl font-bold font-mono text-destructive/70">{[48, 35, 17][i]}m</div>
                    <div className="text-xs text-foreground/45 mt-0.5 font-medium">{cat}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 3 — FEATURES
          ═══════════════════════════════════════ */}
      <Section id="features" ariaLabel="Core features" className="bg-secondary/30">
        <SectionLabel>Capabilities</SectionLabel>
        <SectionTitle>Everything you need to reclaim your focus.</SectionTitle>
        <SectionDesc>
          A complete behavioral productivity system — not just a blocker.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Eye, title: "Smart Tracking", desc: "Event-driven monitoring with idle detection. Only meaningful activity counts toward your metrics." },
            { icon: Target, title: "Focus Mode", desc: "Strict site blocking with task-based unlock. Behavioral intervention, not just a countdown timer." },
            { icon: Lock, title: "Domain Control", desc: "Temporary blocks, daily limits, or scheduled restrictions with cognitive override protection." },
            { icon: Brain, title: "Behavioral Insights", desc: "Pattern detection identifies distraction loops and predicts when you're most likely to lose focus." },
            { icon: BarChart3, title: "Analytics Engine", desc: "Heatmaps, trends, category flows, and Sankey diagrams visualize your digital behavior." },
            { icon: Zap, title: "Productivity Score", desc: "Weighted 0–100 score based on focus time, work patterns, and distraction avoidance." },
          ].map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 3.5 — PRODUCT SHOWCASE
          ═══════════════════════════════════════ */}
      <Section id="product" ariaLabel="Product showcase" className="!py-16 md:!py-20">
        <div className="text-center">
          <SectionLabel>See It In Action</SectionLabel>
          <SectionTitle>A glance at the real experience.</SectionTitle>
          <SectionDesc>
            <span className="mx-auto block">Three powerful views. One seamless productivity system — right inside your browser.</span>
          </SectionDesc>
        </div>

        <motion.div variants={staggerContainer} className="mt-12 flex flex-col lg:flex-row items-end justify-center gap-6 lg:gap-10">
          {/* Card 1 — Stats */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-6 w-full max-w-[280px]">
            <div className="relative w-full">
              <div className="rounded-2xl bg-gradient-to-b from-primary/[0.06] to-transparent p-[1px]">
                <div className="rounded-2xl bg-card overflow-hidden shadow-xl shadow-primary/[0.06]">
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-secondary/40">
                    <div className="flex gap-1"><div className="h-2 w-2 rounded-full bg-destructive/40" /><div className="h-2 w-2 rounded-full bg-warning/40" /><div className="h-2 w-2 rounded-full bg-productive/40" /></div>
                    <span className="flex-1 text-center text-[9px] font-mono text-foreground/30">Stats</span>
                  </div>
                  <img src={extDashboard} alt="FocusGuard Stats Dashboard showing productivity score" className="w-full h-auto block" loading="lazy" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[15px] font-bold text-foreground">Productivity Dashboard</h3>
              <p className="text-[13px] text-foreground/50 mt-1.5 leading-relaxed">Real-time score, focus vs. distraction, daily goals & streaks.</p>
            </div>
          </motion.div>

          {/* Card 2 — Focus Mode (hero, elevated) */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-6 w-full max-w-[300px] lg:-mb-4">
            <div className="relative w-full">
              <div className="absolute -inset-[1px] rounded-[18px] bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-[1px]" />
              <div className="relative rounded-[18px] bg-card overflow-hidden shadow-2xl shadow-primary/10 ring-1 ring-primary/15">
                <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-border/40 bg-gradient-to-r from-primary/[0.06] to-transparent">
                  <div className="flex gap-1"><div className="h-2 w-2 rounded-full bg-destructive/40" /><div className="h-2 w-2 rounded-full bg-warning/40" /><div className="h-2 w-2 rounded-full bg-productive/40" /></div>
                  <span className="flex-1 text-center text-[9px] font-mono text-primary/60 font-semibold">Focus Mode</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-productive animate-pulse" />
                </div>
                <img src={extFocus} alt="FocusGuard Focus Mode with task management and timed sessions" className="w-full h-auto block" loading="lazy" />
              </div>
              {/* Subtle glow behind hero card */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/8 rounded-full blur-2xl pointer-events-none" />
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 border border-primary/15 px-3 py-1 text-[10px] font-bold text-primary mb-2">
                <Target className="h-3 w-3" /> Most Popular
              </div>
              <h3 className="text-[15px] font-bold text-foreground">Deep Focus Sessions</h3>
              <p className="text-[13px] text-foreground/50 mt-1.5 leading-relaxed">Allow-only or block mode, task tracking & timed sessions.</p>
            </div>
          </motion.div>

          {/* Card 3 — Activity */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-6 w-full max-w-[280px]">
            <div className="relative w-full">
              <div className="rounded-2xl bg-gradient-to-b from-info/[0.06] to-transparent p-[1px]">
                <div className="rounded-2xl bg-card overflow-hidden shadow-xl shadow-info/[0.06]">
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-secondary/40">
                    <div className="flex gap-1"><div className="h-2 w-2 rounded-full bg-destructive/40" /><div className="h-2 w-2 rounded-full bg-warning/40" /><div className="h-2 w-2 rounded-full bg-productive/40" /></div>
                    <span className="flex-1 text-center text-[9px] font-mono text-foreground/30">Activity</span>
                  </div>
                  <img src={extStats} alt="FocusGuard Activity view with category tracking" className="w-full h-auto block" loading="lazy" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[15px] font-bold text-foreground">Activity Tracking</h3>
              <p className="text-[13px] text-foreground/50 mt-1.5 leading-relaxed">Smart category detection, session counting & site insights.</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-12 text-center">
          <p className="text-[11px] text-foreground/35 flex items-center justify-center gap-2">
            <EyeOff className="h-3 w-3" />
            100% local · No data leaves your browser · Open source
          </p>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      {/* ═══════════════════════════════════════
          SECTION 4 — FOCUS MODE
          ═══════════════════════════════════════ */}
      <Section id="focus" ariaLabel="Focus Mode demonstration">
        <SectionLabel>Focus Mode</SectionLabel>
        <SectionTitle>Deep work, enforced.</SectionTitle>
        <SectionDesc>
          Choose what to allow or block. Add tasks. Start. FocusGuard handles the rest.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid md:grid-cols-5 gap-5">
          <motion.div variants={scaleIn} className="md:col-span-3 rounded-2xl border border-border bg-card p-8 flex flex-col items-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                <motion.circle
                  cx="100" cy="100" r="88" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="3.5"
                  strokeDasharray="553" strokeDashoffset="138"
                  strokeLinecap="round"
                  style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
                  initial={{ strokeDashoffset: 553 }}
                  whileInView={{ strokeDashoffset: 138 }}
                  transition={{ delay: 0.3, duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  viewport={{ once: true }}
                />
              </svg>
              <div className="text-center">
                <div className="text-4xl font-extrabold font-mono tracking-tighter text-primary">18:42</div>
                <div className="text-xs text-foreground/40 mt-1 flex items-center gap-1 justify-center">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-productive opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-productive" />
                  </span>
                  remaining
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2.5">
              <div className="rounded-xl bg-secondary border border-border px-5 py-2.5 text-xs font-semibold text-foreground/60 cursor-pointer hover:bg-secondary/80 transition-colors">
                Pause
              </div>
              <div className="rounded-xl bg-destructive/8 border border-destructive/15 px-5 py-2.5 text-xs font-semibold text-destructive cursor-pointer hover:bg-destructive/12 transition-colors">
                End Session
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 text-xs text-foreground/40">
              <span className="font-mono">🍅 3 pomodoros</span>
              <span className="w-px h-3 bg-border" />
              <span>0 interruptions</span>
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="md:col-span-2 space-y-4">
            <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">Active Tasks</p>
              {["Complete project proposal", "Review pull requests", "Update documentation"].map((task, i) => (
                <div key={task} className="flex items-center gap-2.5 py-2">
                  <div className={`h-4.5 w-4.5 rounded-md border-[1.5px] flex items-center justify-center transition-colors ${
                    i === 0 ? "border-productive bg-productive/15" : "border-border"
                  }`}>
                    {i === 0 && <Check className="h-2.5 w-2.5 text-productive" />}
                  </div>
                  <span className={`text-[15px] ${i === 0 ? "line-through text-foreground/40" : "text-foreground"}`}>{task}</span>
                </div>
              ))}
              <p className="mt-2 text-xs text-foreground/40">1 of 3 completed</p>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-3">Blocked During Session</p>
              <div className="flex flex-wrap gap-1.5">
                {["youtube.com", "instagram.com", "reddit.com", "tiktok.com"].map((site) => (
                  <span key={site} className="rounded-full bg-destructive/8 border border-destructive/15 px-3 py-1.5 text-xs font-semibold text-destructive">
                    {site}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 5 — ANALYTICS
          ═══════════════════════════════════════ */}
      <Section id="analytics" ariaLabel="Analytics and data visualization" className="bg-secondary/30">
        <SectionLabel>Intelligence</SectionLabel>
        <SectionTitle>Understand your digital behavior.</SectionTitle>
        <SectionDesc>
          Weekly trends, category breakdowns, and hourly activity patterns — all beautifully visualized.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid md:grid-cols-3 gap-5">
          <motion.div variants={scaleIn} className="md:col-span-2 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Weekly Performance</p>
            <h3 className="text-lg font-bold tracking-tight mb-5">Productivity Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrends} barCategoryGap="20%">
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                />
                <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="distracted" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={scaleIn} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">Breakdown</p>
            <h3 className="text-lg font-bold tracking-tight mb-4">Categories</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {categoryBreakdown.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[c.name] }} />
                  <span className="text-xs text-foreground/55 truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-5 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50 mb-1">24-Hour View</p>
          <h3 className="text-lg font-bold tracking-tight mb-5">Daily Activity Flow</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyActivity}>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={3} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
              <Area type="monotone" dataKey="productive" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="distracted" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 6 — HOW IT WORKS
          Connected steps with animated path
          ═══════════════════════════════════════ */}
      <Section id="how" ariaLabel="How FocusGuard works">
        <SectionLabel>Architecture</SectionLabel>
        <SectionTitle>How it works.</SectionTitle>
        <SectionDesc>Four stages from passive tracking to active behavioral change.</SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 z-0">
            <motion.div
              className="h-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              viewport={{ once: true }}
              style={{ transformOrigin: "left" }}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {[
              { num: "01", title: "Install & Track", desc: "Event-driven monitoring detects active tab usage with intelligent idle detection.", icon: Eye },
              { num: "02", title: "Analyze Patterns", desc: "Categorize domains, detect distraction loops, identify peak productivity windows.", icon: Brain },
              { num: "03", title: "Intervene", desc: "Focus mode enforcement, task-based unlocking, and cognitive friction barriers.", icon: Shield },
              { num: "04", title: "Improve", desc: "Productivity scores, trend analysis, and personalized behavioral recommendations.", icon: TrendingUp },
            ].map((s, i) => (
              <motion.div key={s.num} variants={fadeUp}>
                <TiltCard className="rounded-2xl border border-border bg-card p-7 h-full transition-all duration-300 hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-extrabold text-primary/15 font-mono">{s.num}</span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">{s.title}</h3>
                  <p className="mt-2.5 text-[15px] text-foreground/60 leading-relaxed">{s.desc}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 7 — COMPARISON
          ═══════════════════════════════════════ */}
      <Section id="compare" ariaLabel="Comparison and privacy" className="bg-secondary/30">
        <SectionLabel>Why FocusGuard</SectionLabel>
        <SectionTitle>Built different.</SectionTitle>
        <SectionDesc>
          Not another simple blocker. FocusGuard understands behavior.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid md:grid-cols-2 gap-8">
          <motion.div variants={scaleIn}>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-3 gap-4 px-5 py-4 bg-secondary/60 border-b border-border">
                <div className="text-xs font-bold uppercase tracking-wider text-foreground/50">Feature</div>
                <div className="text-center text-xs font-bold text-primary">FocusGuard</div>
                <div className="text-center text-xs font-semibold text-foreground/40">Others</div>
              </div>
              {[
                { feature: "Smart Activity Tracking", fg: true, others: false },
                { feature: "Distraction Loop Detection", fg: true, others: false },
                { feature: "Task-Based Unlock", fg: true, others: false },
                { feature: "Behavioral Insights", fg: true, others: false },
                { feature: "Productivity Scoring", fg: true, others: false },
                { feature: "Basic Site Blocking", fg: true, others: true },
                { feature: "Pomodoro Timer", fg: true, others: true },
                { feature: "Cognitive Override", fg: true, others: false },
              ].map((row) => (
                <CompareRow key={row.feature} {...row} />
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-4">
            {[
              { icon: Zap, title: "Event-Driven", desc: "No constant polling. Lightweight Manifest V3 service worker that sleeps when inactive." },
              { icon: EyeOff, title: "Zero Data Collection", desc: "No keystroke logging. No screenshots. Only domain-level time data, stored locally." },
              { icon: Shield, title: "Local-First Architecture", desc: "All data processed and stored in your browser. Nothing leaves your device. Ever." },
              { icon: Layers, title: "Open & Transparent", desc: "Full source code available. Complete data export. You own everything." },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
                <TiltCard className="rounded-2xl border border-border bg-card p-6 flex gap-4 items-start transition-all duration-300 hover:shadow-lg">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold tracking-tight text-foreground">{item.title}</h4>
                    <p className="mt-1.5 text-[15px] text-foreground/60 leading-relaxed">{item.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 8 — TESTIMONIALS
          ═══════════════════════════════════════ */}
      <Section id="testimonials" ariaLabel="What users say">
        <SectionLabel>Testimonials</SectionLabel>
        <SectionTitle>Loved by focused people.</SectionTitle>
        <SectionDesc>
          Hear from people who took back control of their digital habits.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Sarah Chen", role: "Software Engineer", quote: "FocusGuard helped me realize I was losing 3 hours daily to tab-hopping. My deep work sessions went from 45 min to 2.5 hours.", stars: 5 },
            { name: "Marcus Rivera", role: "Product Designer", quote: "The behavioral insights are incredible. It predicted my distraction patterns before I even noticed them. Game changer.", stars: 5 },
            { name: "Aisha Patel", role: "PhD Researcher", quote: "I've tried every blocker out there. FocusGuard is the first one that actually understands why I get distracted, not just what I visit.", stars: 5 },
            { name: "Jake Thompson", role: "Freelance Writer", quote: "The focus mode with task-based unlock is brilliant. I can't cheat my way out of it, and my writing output has doubled.", stars: 4 },
            { name: "Emily Nakamura", role: "Startup Founder", quote: "100% local processing sold me. No data leaves my machine, and the Sankey diagrams make my workflow visible for the first time.", stars: 5 },
            { name: "Daniel Okonkwo", role: "Medical Student", quote: "During exam season, FocusGuard is non-negotiable. The productivity score keeps me accountable without being annoying.", stars: 5 },
          ].map((t) => {
            const ref = useRef<HTMLDivElement>(null);
            const isInView = useInView(ref, { once: true });
            return (
              <motion.div key={t.name} variants={fadeUp} ref={ref}>
                <TiltCard className="rounded-2xl border border-border bg-card p-7 flex flex-col gap-4 h-full transition-all duration-300 hover:shadow-xl">
                  <AnimatedStars count={t.stars} inView={isInView} />
                  <p className="text-[15px] text-foreground/60 leading-relaxed flex-1">
                    <span className="text-3xl font-serif text-primary/20 leading-none">"</span>
                    {t.quote}"
                  </p>
                  <div>
                    <p className="text-base font-bold text-foreground">{t.name}</p>
                    <p className="text-sm text-foreground/50">{t.role}</p>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 9 — FAQ
          ═══════════════════════════════════════ */}
      <Section id="faq" ariaLabel="Frequently asked questions">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>FAQ</SectionLabel>
          <SectionTitle>Common questions.</SectionTitle>
          <SectionDesc>Everything you need to know about FocusGuard.</SectionDesc>
        </div>

        <motion.div variants={staggerContainer} className="mt-14 max-w-3xl mx-auto w-full">
          {[
            { q: "Is FocusGuard really free?", a: "Yes, completely free and open-source. No premium tiers, no hidden fees, no subscriptions. All features are available to everyone." },
            { q: "Does it collect my browsing data?", a: "Absolutely not. All data is processed and stored locally in your browser using Chrome's storage API. Nothing is ever sent to any server." },
            { q: "Which browsers are supported?", a: "Currently Chrome and all Chromium-based browsers (Edge, Brave, Arc, Opera). Firefox support is on our roadmap." },
            { q: "Can I export my productivity data?", a: "Yes, you can export all your data as JSON at any time from the dashboard. You own your data completely." },
            { q: "How is this different from other blockers?", a: "Most blockers are binary — they block or don't. FocusGuard understands your behavior patterns, detects distraction loops, and intervenes intelligently with task-based unlocking and cognitive friction." },
            { q: "Will it slow down my browser?", a: "No. FocusGuard uses an event-driven Manifest V3 service worker that only activates on tab changes. CPU usage is near zero during normal browsing." },
          ].map((faq) => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 10 — AUTHOR
          ═══════════════════════════════════════ */}
      <Section id="author" ariaLabel="About the creator">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <SectionLabel>The Creator</SectionLabel>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
            Meet <span className="text-gradient">Husna Ayoub</span>
          </h2>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="rounded-3xl bg-card border border-border p-10 sm:p-14 relative overflow-hidden max-w-3xl mx-auto"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-info/5 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Avatar */}
            <motion.div
              variants={scaleIn}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-info to-primary p-[3px] mb-7 shadow-2xl shadow-primary/20"
            >
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <span className="text-3xl font-extrabold text-gradient">HA</span>
              </div>
            </motion.div>

            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
              Husna Ayoub
            </h3>
            <p className="text-sm text-muted-foreground mb-8 flex items-center gap-1.5">
              <span>🇦🇫</span> Kabul, Afghanistan · Co-Founder — HH Nexus
            </p>

            {/* Story */}
            <div className="max-w-2xl mx-auto space-y-5 mb-10">
              <div className="relative">
                <span className="absolute -top-5 -left-3 text-6xl font-extrabold text-gradient opacity-20 select-none leading-none">&ldquo;</span>
                <p className="text-muted-foreground leading-relaxed text-base pl-6">
                  I built FocusGuard because I saw how digital distractions were stealing hours from people
                  who genuinely wanted to be productive. Students cramming for exams, developers in deep work,
                  researchers chasing breakthroughs.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed text-base">
                Most blockers treat the symptom. I wanted to build something that understands the <span className="text-foreground font-semibold">behavior</span>,
                why you get distracted, when it happens, and how to intervene without breaking your flow.
                That&apos;s <span className="text-foreground font-semibold">FocusGuard</span>.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base italic border-l-2 border-primary/30 pl-5">
                &ldquo;Every feature in FocusGuard exists because I needed it myself. No fluff, no tracking,
                no cloud dependency, just honest tools for honest work.&rdquo;
              </p>
              <p className="text-foreground font-semibold text-lg">
                Made with ❤️ for curious minds.
              </p>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {[
                { name: "LinkedIn", url: "https://www.linkedin.com/in/husna-a-7971b7272/", gradient: "from-[hsl(210,80%,55%)] to-[hsl(210,90%,40%)]", shadow: "shadow-[0_8px_30px_hsl(210,80%,55%,0.35)]", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                { name: "GitHub", url: "https://github.com/20-Husna", gradient: "from-[hsl(270,60%,55%)] to-[hsl(280,70%,40%)]", shadow: "shadow-[0_8px_30px_hsl(270,60%,55%,0.35)]", icon: <Github className="w-5 h-5" /> },
                { name: "Email", url: "mailto:ayoubhusna9462@gmail.com", gradient: "from-[hsl(340,70%,55%)] to-[hsl(350,80%,45%)]", shadow: "shadow-[0_8px_30px_hsl(340,70%,55%,0.35)]", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg> },
              ].map((social, i) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeUp}
                  whileHover={{ scale: 1.15, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${social.gradient} ${social.shadow} flex items-center justify-center text-primary-foreground transition-all duration-300`}
                  title={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </Section>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* ═══════════════════════════════════════
          SECTION 11 — CTA
          ═══════════════════════════════════════ */}
      <Section id="download" ariaLabel="Download and get started">
        <motion.div variants={scaleIn} className="text-center">
          <div className="rounded-3xl bg-gradient-to-b from-primary/8 to-transparent border border-primary/15 p-14 md:p-20">
            <SectionLabel>Get Started</SectionLabel>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Start protecting your focus today.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-foreground/60 max-w-lg mx-auto leading-relaxed">
              Free forever. No account required. Install the Chrome extension and take control of your digital life.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" className="rounded-full px-8 font-semibold text-sm gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] transition-all">
                Add to Chrome — It's Free <ArrowRight className="h-4 w-4" />
              </Button>
              <a href="https://github.com/20-Husna" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="rounded-full px-8 font-semibold text-sm gap-2 hover:scale-[1.02] transition-transform">
                  <Github className="h-4 w-4" /> View Source
                </Button>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="relative py-16" role="contentinfo">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="mx-auto max-w-5xl px-6 flex flex-col items-center gap-8">
          {/* Logo + brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground leading-tight">FocusGuard</span>
              <span className="text-[9px] text-muted-foreground/60 leading-tight tracking-[0.15em] uppercase">
                Your focus, protected.
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-6">
            {["Features", "Focus", "Analytics", "How It Works", "Testimonials", "Creator"].map((label) => (
              <button
                key={label}
                onClick={() => {
                  const id = label === "Creator" ? "author" : label.toLowerCase().replace(/\s/g, "");
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-xs text-muted-foreground/60 hover:text-foreground transition-colors duration-200"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-muted-foreground/50">
            <p>
              © {new Date().getFullYear()} FocusGuard. Built with ❤️ by{" "}
              <span className="text-muted-foreground/70 font-medium">Husna Ayoub</span>
              {" "}· Co-Founder — HH Nexus
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground/50">
            <a href="https://github.com/20-Husna" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a href="https://www.linkedin.com/in/husna-a-7971b7272/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              LinkedIn
            </a>
            <a href="mailto:ayoubhusna9462@gmail.com" className="hover:text-foreground transition-colors">
              Email
            </a>
          </div>
        </div>
      </footer>

      {/* ─── Floating CTA Pill ─── */}
      <AnimatePresence>
        {showFloatingCTA && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              size="lg"
              className="rounded-full pl-5 pr-4 py-3 h-auto font-semibold text-sm gap-3 shadow-[0_8px_32px_-4px_hsl(var(--primary)/0.45)] hover:shadow-[0_12px_40px_-4px_hsl(var(--primary)/0.55)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 border border-primary-foreground/10 bg-gradient-to-r from-primary to-[hsl(222,80%,60%)]"
            >
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-foreground/15 backdrop-blur-sm">
                <Shield className="h-3.5 w-3.5" />
              </span>
              Add to Chrome — Free
              <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Animated Counter Component ─── */
const AnimatedCounter = ({ target, suffix = "", className = "" }: { target: number; suffix?: string; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const count = useCounter(target * 10, 2000, isInView);
  return <div ref={ref} className={className}>{(count / 10).toFixed(1)}{suffix}</div>;
};

export default Landing;
