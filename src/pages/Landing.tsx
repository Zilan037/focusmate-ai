import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Shield, BarChart3, Target, Lock, Brain, Zap, ArrowRight,
  EyeOff, Github, Check, X, ChevronRight, Clock, Flame, TrendingUp,
  Globe, CheckCircle, Timer, Sparkles, Eye, Activity, Layers,
  ChevronDown, Plus, Minus, Monitor, Download, Users, Star,
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

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const CATEGORY_COLORS: Record<string, string> = {
  Work: "#0EA5E9", Education: "#10B981",
  Entertainment: "#F59E0B", Social: "#7C3AED",
  News: "#6D28D9", Shopping: "#DB2777",
};

/* ─── Scroll-Triggered Section with Parallax ─── */
const Section = ({
  children, className = "", id, ariaLabel, parallaxOffset = 0,
}: { children: React.ReactNode; className?: string; id?: string; ariaLabel?: string; parallaxOffset?: number }) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [parallaxOffset, -parallaxOffset]);

  return (
    <motion.section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      style={parallaxOffset ? { y } : undefined}
      className={`py-10 sm:py-14 md:py-20 ${className}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-8">{children}</div>
    </motion.section>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <motion.div variants={fadeUp} className="mb-5">
    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-5 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary shadow-clayCard font-heading">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </span>
  </motion.div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] text-foreground font-heading">
    {children}
  </motion.h2>
);

const SectionDesc = ({ children }: { children: React.ReactNode }) => (
  <motion.p variants={fadeUp} className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center">
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

/* ─── Feature Card (Clay) ─── */
const FeatureCard = ({ icon: Icon, title, desc, index, gradient }: {
  icon: React.ElementType; title: string; desc: string; index: number; gradient: string;
}) => (
  <motion.div variants={fadeUp} custom={index}>
    <TiltCard className="group h-full rounded-[32px] bg-card/60 backdrop-blur-xl p-8 shadow-clayCard transition-all duration-500 hover:-translate-y-2 hover:shadow-clayCardHover">
      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br ${gradient} text-white shadow-clayButton transition-all duration-300 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">{title}</h3>
      <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">{desc}</p>
    </TiltCard>
  </motion.div>
);

/* ─── Stat Card (Clay) ─── */
const StatCard = ({ label, value, icon: Icon, gradient }: {
  label: string; value: string; icon: React.ElementType; gradient: string;
}) => (
  <div className="rounded-[24px] bg-card/60 backdrop-blur-xl p-5 shadow-clayCard transition-all duration-500 hover:-translate-y-1 hover:shadow-clayCardHover">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-heading">{label}</p>
      <div className={`flex h-8 w-8 items-center justify-center rounded-[12px] bg-gradient-to-br ${gradient} text-white`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
    </div>
    <span className="text-3xl font-black tracking-tight font-heading text-foreground">{value}</span>
  </div>
);

/* ─── Comparison Row ─── */
const CompareRow = ({ feature, fg, others }: { feature: string; fg: boolean; others: boolean }) => (
  <motion.div variants={fadeUp} className="grid grid-cols-[1fr_60px_60px] sm:grid-cols-3 gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/40 last:border-0 items-center">
    <div className="text-[13px] sm:text-[15px] font-bold text-foreground">{feature}</div>
    <div className="text-center">{fg ? <CheckCircle className="inline h-4 w-4 sm:h-4.5 sm:w-4.5 text-productive" /> : <X className="inline h-4 w-4 text-destructive/40" />}</div>
    <div className="text-center">{others ? <Check className="inline h-4 w-4 text-muted-foreground/60" /> : <X className="inline h-4 w-4 text-destructive/30" />}</div>
  </motion.div>
);

/* ─── FAQ Item (Clay) ─── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} className="border-b border-border/20 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-6 text-left group"
      >
        <span className="text-[15px] sm:text-base font-bold text-foreground/90 group-hover:text-primary transition-colors">{q}</span>
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
            <p className="pb-5 text-[15px] text-muted-foreground leading-relaxed">{a}</p>
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

/* ─── Live Ticking Timer (Living UI) ─── */
const LiveTimer = () => {
  const [seconds, setSeconds] = useState(1122); // 18:42
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 1500), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const pct = ((1500 - seconds) / 1500) * 100;
  const circ = 2 * Math.PI * 88;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="88" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
        <circle
          cx="100" cy="100" r="88" fill="none"
          stroke="url(#liveTimerGrad)" strokeWidth="3.5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s linear" }}
        />
        <defs>
          <linearGradient id="liveTimerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="text-4xl font-black font-heading tracking-tighter text-primary tabular-nums">
          {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
        </div>
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-center font-bold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-productive opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-productive" />
          </span>
          live session
        </div>
      </div>
    </div>
  );
};

/* ─── Live Score Widget (Living UI) ─── */
const LiveScore = () => {
  const [score, setScore] = useState(82);
  useEffect(() => {
    const id = setInterval(() => {
      setScore(s => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.max(60, Math.min(99, s + delta));
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);
  const circ = 2 * Math.PI * 24;
  const offset = circ * (1 - score / 100);

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[60px] h-[60px]">
        <svg viewBox="0 0 60 60" className="w-full h-full">
          <circle cx="30" cy="30" r="24" stroke="hsl(var(--border))" strokeWidth="4" fill="none" opacity="0.2" />
          <circle cx="30" cy="30" r="24" stroke="url(#scoreGrad)" strokeWidth="4" fill="none"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.5s ease" }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" /><stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-black font-heading text-foreground tabular-nums">{score}</span>
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground font-heading">Neural Score</p>
        <p className="text-[10px] text-productive font-bold mt-0.5">
          {score >= 85 ? "Excellent" : score >= 70 ? "Good" : "Building"}
        </p>
      </div>
    </div>
  );
};

/* ─── Infinite Marquee ─── */
const Marquee = ({ children, speed = 30 }: { children: React.ReactNode; speed?: number }) => (
  <div className="overflow-hidden relative">
    <motion.div
      className="flex gap-16 whitespace-nowrap"
      animate={{ x: [0, "-50%"] }}
      transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
    >
      {children}
      {children}
    </motion.div>
  </div>
);

/* ─── Live Download Counter ─── */
const LiveDownloads = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const baseCount = useCounter(10847, 2500, isInView);
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    if (!isInView) return;
    const id = setInterval(() => setExtra(e => e + 1), 8000 + Math.random() * 4000);
    return () => clearInterval(id);
  }, [isInView]);
  return (
    <div ref={ref} className="flex flex-col items-center">
      <span className="text-2xl sm:text-3xl font-black font-heading text-foreground tabular-nums">{(baseCount + extra).toLocaleString()}+</span>
      <span className="text-xs text-muted-foreground font-bold mt-0.5 flex items-center gap-1">
        <Download className="h-3 w-3" /> Active Users
      </span>
    </div>
  );
};

/* ═════════════════════════════════════════════
   LANDING PAGE — CLAY DESIGN SYSTEM
   High-Fidelity Claymorphism + Living UI
   ═════════════════════════════════════════════ */

const Landing = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroCounterRef = useRef<HTMLDivElement>(null);
  const heroCounterInView = useInView(heroCounterRef, { once: true });


  // Mouse glow for hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const handleHeroMouse = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  const hoursSaved = useCounter(2100000, 2500, heroCounterInView);

  return (
    <div className="min-h-screen relative">

      {/* ═══ FLOATING BACKGROUND BLOBS ═══ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] h-[60vh] w-[60vh] rounded-full bg-[#8B5CF6]/10 blur-3xl animate-clay-float" />
        <div className="absolute -right-[10%] top-[20%] h-[50vh] w-[50vh] rounded-full bg-[#EC4899]/10 blur-3xl animate-clay-float-delayed animation-delay-2000" />
        <div className="absolute bottom-[10%] left-[20%] h-[45vh] w-[45vh] rounded-full bg-[#0EA5E9]/10 blur-3xl animate-clay-float animation-delay-4000" />
        <div className="absolute top-[60%] right-[30%] h-[35vh] w-[35vh] rounded-full bg-[#10B981]/8 blur-3xl animate-clay-float-delayed" />
      </div>

      {/* ═══════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════ */}
      <section
        ref={heroRef}
        aria-label="Introduction"
        className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-40 md:pb-28"
        onMouseMove={handleHeroMouse}
      >
        {/* Cursor glow */}
        <motion.div
          className="pointer-events-none absolute w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{
            x: mouseX, y: mouseY,
            background: "radial-gradient(circle, #7C3AED, transparent 70%)",
            translateX: "-50%", translateY: "-50%",
          }}
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="mx-auto max-w-4xl px-4 sm:px-6 text-center relative"
        >
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 border border-primary/15 px-5 py-2 text-xs font-bold text-primary shadow-clayCard font-heading">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Behavioral Productivity System
            </span>
          </motion.div>

          {/* Hero Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-10 text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] font-heading"
          >
            Your focus,{" "}
            <Typewriter text="protected." className="clay-text-gradient" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-7 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto"
          >
            FocusGuard detects distraction patterns, enforces structured focus sessions,
            and delivers actionable productivity intelligence — all locally in your browser.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-4"
          >
            <a href="https://github.com/20-Husna/FocusGuard-Extension" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base">
                Add to Chrome <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 text-base">
                View Demo
              </Button>
            </Link>
          </motion.div>

          {/* Animated counters */}
          <motion.div
            ref={heroCounterRef}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-12 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 rounded-[28px] bg-card/60 backdrop-blur-xl shadow-clayCard px-5 sm:px-8 py-4 sm:py-5"
          >
            <LiveDownloads />
            <span className="hidden sm:block w-px h-10 bg-border/60" />
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl md:text-3xl font-black font-heading text-foreground tabular-nums">{(hoursSaved / 1000000).toFixed(1)}M+</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold mt-0.5">Hours Saved</span>
            </div>
            <span className="hidden sm:block w-px h-10 bg-border/60" />
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl md:text-3xl font-black font-heading text-foreground">4.9</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold mt-0.5 flex items-center gap-1">
                <Star className="h-3 w-3 text-warning fill-warning" /> Rating
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Product Preview Card — Living UI Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-12 sm:mt-16 max-w-5xl px-4 sm:px-6"
        >
          <TiltCard className="rounded-[32px] bg-card/60 backdrop-blur-xl p-1.5 shadow-clayCard">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border/30 rounded-t-[28px]">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-[#FF6B6B]" />
                <div className="h-3 w-3 rounded-full bg-[#FFD93D]" />
                <div className="h-3 w-3 rounded-full bg-[#6BCB77]" />
              </div>
              <div className="flex-1 text-center text-[10px] sm:text-[11px] text-muted-foreground font-mono tracking-wide font-bold truncate">
                focusguard — command center
              </div>
              <div className="hidden sm:block">
                <LiveScore />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4">
              <StatCard label="Score" value="87" icon={TrendingUp} gradient="from-[#A78BFA] to-[#7C3AED]" />
              <StatCard label="Active" value="6.5h" icon={Clock} gradient="from-[#38BDF8] to-[#0EA5E9]" />
              <StatCard label="Streak" value="12" icon={Flame} gradient="from-[#FCD34D] to-[#F59E0B]" />
              <StatCard label="Sessions" value="4" icon={Target} gradient="from-[#34D399] to-[#10B981]" />
            </div>
          </TiltCard>
        </motion.div>
      </section>

      {/* ─── Trusted By Marquee (Clay) ─── */}
      <div className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-center text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 sm:mb-8 font-heading">
            Trusted by teams at
          </p>
          <Marquee speed={40}>
            {["Stanford", "Google", "Notion", "Figma", "Stripe", "Vercel", "Linear", "Arc", "Raycast", "Obsidian"].map((name) => (
              <span key={name} className="text-lg md:text-xl font-black text-foreground/25 tracking-tight font-heading select-none">{name}</span>
            ))}
          </Marquee>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          SECTION 2 — PROBLEM
          ═══════════════════════════════════════ */}
      <Section id="problem" ariaLabel="The problem we solve" parallaxOffset={15}>
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div variants={slideInLeft}>
            <SectionLabel>The Problem</SectionLabel>
            <SectionTitle>We lose 2.5 hours daily to digital distractions.</SectionTitle>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Context switching costs 23 minutes per interruption. Tab hopping creates anxiety loops.
              Traditional blockers don't understand <em>why</em> you're distracted — they just block.
            </motion.p>
            <motion.div variants={staggerContainer} className="mt-8 space-y-4">
              {[
                { icon: Activity, text: "Average person checks phone 96 times/day", gradient: "from-[#FCA5A5] to-[#EF4444]" },
                { icon: Timer, text: "23 min to refocus after each interruption", gradient: "from-[#FCD34D] to-[#F59E0B]" },
                { icon: TrendingUp, text: "28% productivity loss from multitasking", gradient: "from-[#38BDF8] to-[#0EA5E9]" },
              ].map((stat) => (
                <motion.div key={stat.text} variants={fadeUp} className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${stat.gradient} text-white shadow-clayButton`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[15px] text-muted-foreground leading-relaxed pt-2">{stat.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          <motion.div variants={slideInRight} className="relative">
            <div className="rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-8 text-center">
              <AnimatedCounter target={2.5} suffix="h" className="text-7xl font-black font-heading text-destructive/30 mb-2" />
              <p className="text-base font-bold text-muted-foreground font-heading">Lost every single day</p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {["Social Media", "Video", "News"].map((cat, i) => (
                  <div key={cat} className="rounded-[20px] bg-card/80 shadow-clayPressed p-4">
                    <div className="text-xl font-black font-heading text-destructive/70">{[48, 35, 17][i]}m</div>
                    <div className="text-xs text-muted-foreground mt-1 font-bold">{cat}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 3 — FEATURES (Bento)
          ═══════════════════════════════════════ */}
      <Section id="features" ariaLabel="Core features" parallaxOffset={10}>
        <SectionLabel>Capabilities</SectionLabel>
        <SectionTitle>Everything you need to reclaim your focus.</SectionTitle>
        <SectionDesc>
          A complete behavioral productivity system — not just a blocker.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Eye, title: "Smart Tracking", desc: "Event-driven monitoring with idle detection. Only meaningful activity counts toward your metrics.", gradient: "from-blue-400 to-blue-600" },
            { icon: Target, title: "Focus Mode", desc: "Strict site blocking with task-based unlock. Behavioral intervention, not just a countdown timer.", gradient: "from-purple-400 to-purple-600" },
            { icon: Lock, title: "Domain Control", desc: "Temporary blocks, daily limits, or scheduled restrictions with cognitive override protection.", gradient: "from-pink-400 to-pink-600" },
            { icon: Brain, title: "Behavioral Insights", desc: "Pattern detection identifies distraction loops and predicts when you're most likely to lose focus.", gradient: "from-emerald-400 to-emerald-600" },
            { icon: BarChart3, title: "Analytics Engine", desc: "Heatmaps, trends, category flows, and Sankey diagrams visualize your digital behavior.", gradient: "from-cyan-400 to-cyan-600" },
            { icon: Zap, title: "Productivity Score", desc: "Weighted 0 to 100 score based on focus time, work patterns, and distraction avoidance.", gradient: "from-amber-400 to-amber-600" },
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
            Three powerful views. One seamless productivity system, right inside your browser.
          </SectionDesc>
        </div>

        <motion.div variants={staggerContainer} className="mt-10 sm:mt-12 flex flex-col items-center lg:flex-row lg:items-end justify-center gap-8 lg:gap-10">
          {/* Card 1 — Stats */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-[320px] sm:max-w-[280px]">
            <div className="relative w-full">
              <div className="rounded-[20px] sm:rounded-[24px] bg-card/60 backdrop-blur-xl overflow-hidden shadow-clayCard transition-all duration-500 hover:-translate-y-2 hover:shadow-clayCardHover">
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/30">
                  <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" /><div className="h-2.5 w-2.5 rounded-full bg-[#FFD93D]" /><div className="h-2.5 w-2.5 rounded-full bg-[#6BCB77]" /></div>
                  <span className="flex-1 text-center text-[9px] font-mono text-muted-foreground font-bold">Stats</span>
                </div>
                <img src={extDashboard} alt="FocusGuard Stats Dashboard showing productivity score" className="w-full h-auto block" loading="lazy" />
              </div>
            </div>
            <div className="text-center px-2">
              <h3 className="text-sm sm:text-[15px] font-bold text-foreground font-heading">Productivity Dashboard</h3>
              <p className="text-xs sm:text-[13px] text-muted-foreground mt-1 sm:mt-1.5 leading-relaxed">Real-time score, focus vs. distraction, daily goals and streaks.</p>
            </div>
          </motion.div>

          {/* Card 2 — Focus Mode (hero, elevated) */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-[340px] sm:max-w-[300px] lg:-mb-4">
            <div className="relative w-full">
              <div className="rounded-[24px] sm:rounded-[28px] bg-card/70 backdrop-blur-xl overflow-hidden shadow-clayCard ring-2 ring-primary/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-clayCardHover">
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border/30 bg-primary/5">
                  <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" /><div className="h-2.5 w-2.5 rounded-full bg-[#FFD93D]" /><div className="h-2.5 w-2.5 rounded-full bg-[#6BCB77]" /></div>
                  <span className="flex-1 text-center text-[9px] font-mono text-primary font-bold">Focus Mode</span>
                  <span className="h-2 w-2 rounded-full bg-productive animate-pulse" />
                </div>
                <img src={extFocus} alt="FocusGuard Focus Mode with task management and timed sessions" className="w-full h-auto block" loading="lazy" />
              </div>
              <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-12 sm:h-16 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            </div>
            <div className="text-center px-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] font-black text-primary mb-2 shadow-clayCard font-heading">
                <Target className="h-3 w-3" /> Most Popular
              </div>
              <h3 className="text-sm sm:text-[15px] font-bold text-foreground font-heading">Deep Focus Sessions</h3>
              <p className="text-xs sm:text-[13px] text-muted-foreground mt-1 sm:mt-1.5 leading-relaxed">Allow-only or block mode, task tracking and timed sessions.</p>
            </div>
          </motion.div>

          {/* Card 3 — Activity */}
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-[320px] sm:max-w-[280px]">
            <div className="relative w-full">
              <div className="rounded-[20px] sm:rounded-[24px] bg-card/60 backdrop-blur-xl overflow-hidden shadow-clayCard transition-all duration-500 hover:-translate-y-2 hover:shadow-clayCardHover">
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border/30">
                  <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#FF6B6B]" /><div className="h-2.5 w-2.5 rounded-full bg-[#FFD93D]" /><div className="h-2.5 w-2.5 rounded-full bg-[#6BCB77]" /></div>
                  <span className="flex-1 text-center text-[9px] font-mono text-muted-foreground font-bold">Activity</span>
                </div>
                <img src={extStats} alt="FocusGuard Activity view with category tracking" className="w-full h-auto block" loading="lazy" />
              </div>
            </div>
            <div className="text-center px-2">
              <h3 className="text-sm sm:text-[15px] font-bold text-foreground font-heading">Activity Tracking</h3>
              <p className="text-xs sm:text-[13px] text-muted-foreground mt-1 sm:mt-1.5 leading-relaxed">Smart category detection, session counting and site insights.</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-12 text-center">
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-2 font-bold">
            <EyeOff className="h-3 w-3" />
            100% local · No data leaves your browser · Open source
          </p>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 4 — FOCUS MODE (Living UI Timer)
          ═══════════════════════════════════════ */}
      <Section id="focus" ariaLabel="Focus Mode demonstration" parallaxOffset={12}>
        <SectionLabel>Focus Mode</SectionLabel>
        <SectionTitle>Deep work, enforced.</SectionTitle>
        <SectionDesc>
          Choose what to allow or block. Add tasks. Start. FocusGuard handles the rest.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid md:grid-cols-5 gap-5">
          <motion.div variants={scaleIn} className="md:col-span-3 rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-8 flex flex-col items-center">
            <LiveTimer />

            <div className="mt-6 flex gap-3">
              <div className="rounded-[16px] bg-card/80 shadow-clayCard px-6 py-3 text-xs font-bold text-muted-foreground cursor-pointer hover:-translate-y-1 transition-all duration-300 hover:shadow-clayCardHover">
                Pause
              </div>
              <div className="rounded-[16px] bg-destructive/10 shadow-clayCard px-6 py-3 text-xs font-bold text-destructive cursor-pointer hover:-translate-y-1 transition-all duration-300 hover:shadow-clayCardHover">
                End Session
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground font-bold">
              <span>🍅 3 pomodoros</span>
              <span className="w-px h-3 bg-border" />
              <span>0 interruptions</span>
            </div>
          </motion.div>

          <motion.div variants={staggerContainer} className="md:col-span-2 space-y-5">
            <motion.div variants={fadeUp} className="rounded-[24px] bg-card/60 backdrop-blur-xl shadow-clayCard p-6">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 font-heading">Active Tasks</p>
              {["Complete project proposal", "Review pull requests", "Update documentation"].map((task, i) => (
                <div key={task} className="flex items-center gap-3 py-2.5">
                  <div className={`h-5 w-5 rounded-[8px] border-2 flex items-center justify-center transition-colors ${
                    i === 0 ? "border-productive bg-productive/15" : "border-border"
                  }`}>
                    {i === 0 && <Check className="h-3 w-3 text-productive" />}
                  </div>
                  <span className={`text-[15px] font-medium ${i === 0 ? "line-through text-muted-foreground" : "text-foreground"}`}>{task}</span>
                </div>
              ))}
              <p className="mt-2 text-xs text-muted-foreground font-bold">1 of 3 completed</p>
            </motion.div>

            <motion.div variants={fadeUp} className="rounded-[24px] bg-card/60 backdrop-blur-xl shadow-clayCard p-6">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 font-heading">Blocked During Session</p>
              <div className="flex flex-wrap gap-2">
                {["youtube.com", "instagram.com", "reddit.com", "tiktok.com"].map((site) => (
                  <span key={site} className="rounded-full bg-destructive/10 border border-destructive/20 px-4 py-2 text-xs font-bold text-destructive shadow-clayCard">
                    {site}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 5 — ANALYTICS
          ═══════════════════════════════════════ */}
      <Section id="analytics" ariaLabel="Analytics and data visualization" parallaxOffset={10}>
        <SectionLabel>Intelligence</SectionLabel>
        <SectionTitle>Understand your digital behavior.</SectionTitle>
        <SectionDesc>
          Weekly trends, category breakdowns, and hourly activity patterns — all beautifully visualized.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid md:grid-cols-3 gap-5">
          <motion.div variants={scaleIn} className="md:col-span-2 rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-7">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 font-heading">Weekly Performance</p>
            <h3 className="text-lg font-bold tracking-tight mb-5 font-heading">Productivity Trends</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyTrends} barCategoryGap="20%">
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "none", borderRadius: 20, fontSize: 12, boxShadow: "16px 16px 32px rgba(160,150,180,0.2), -10px -10px 24px rgba(255,255,255,0.9)" }}
                />
                <Bar dataKey="productive" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="distracted" fill="#EF4444" radius={[8, 8, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={scaleIn} className="rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-7">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 font-heading">Breakdown</p>
            <h3 className="text-lg font-bold tracking-tight mb-4 font-heading">Categories</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {categoryBreakdown.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[c.name] }} />
                  <span className="text-xs text-muted-foreground font-bold truncate">{c.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-5 rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-7">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1 font-heading">24-Hour View</p>
          <h3 className="text-lg font-bold tracking-tight mb-5 font-heading">Daily Activity Flow</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyActivity}>
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} interval={3} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={24} />
              <Area type="monotone" dataKey="productive" stroke="#10B981" fill="#10B981" fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="distracted" stroke="#EF4444" fill="#EF4444" fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 6 — HOW IT WORKS
          ═══════════════════════════════════════ */}
      <Section id="how" ariaLabel="How FocusGuard works" parallaxOffset={8}>
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
              { num: "01", title: "Install & Track", desc: "Event-driven monitoring detects active tab usage with intelligent idle detection.", icon: Eye, gradient: "from-blue-400 to-blue-600" },
              { num: "02", title: "Analyze Patterns", desc: "Categorize domains, detect distraction loops, identify peak productivity windows.", icon: Brain, gradient: "from-purple-400 to-purple-600" },
              { num: "03", title: "Intervene", desc: "Focus mode enforcement, task-based unlocking, and cognitive friction barriers.", icon: Shield, gradient: "from-pink-400 to-pink-600" },
              { num: "04", title: "Improve", desc: "Productivity scores, trend analysis, and personalized behavioral recommendations.", icon: TrendingUp, gradient: "from-emerald-400 to-emerald-600" },
            ].map((s) => (
              <motion.div key={s.num} variants={fadeUp}>
                <TiltCard className="rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-8 h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-clayCardHover">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br ${s.gradient} text-white shadow-clayButton`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-black text-primary/15 font-heading">{s.num}</span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground font-heading">{s.title}</h3>
                  <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">{s.desc}</p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 7 — COMPARISON
          ═══════════════════════════════════════ */}
      <Section id="compare" ariaLabel="Comparison and privacy" parallaxOffset={10}>
        <SectionLabel>Why FocusGuard</SectionLabel>
        <SectionTitle>Built different.</SectionTitle>
        <SectionDesc>
          Not another simple blocker. FocusGuard understands behavior.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid md:grid-cols-2 gap-8">
          <motion.div variants={slideInLeft}>
            <div className="rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard overflow-hidden">
              <div className="grid grid-cols-[1fr_60px_60px] sm:grid-cols-3 gap-2 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-border/30">
                <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground font-heading">Feature</div>
                <div className="text-center text-[10px] sm:text-xs font-black text-primary font-heading">FocusGuard</div>
                <div className="text-center text-[10px] sm:text-xs font-bold text-muted-foreground font-heading">Others</div>
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

          <motion.div variants={staggerContainer} className="space-y-5">
            {[
              { icon: Zap, title: "Event-Driven", desc: "No constant polling. Lightweight Manifest V3 service worker that sleeps when inactive.", gradient: "from-amber-400 to-amber-600" },
              { icon: EyeOff, title: "Zero Data Collection", desc: "No keystroke logging. No screenshots. Only domain-level time data, stored locally.", gradient: "from-purple-400 to-purple-600" },
              { icon: Shield, title: "Local-First Architecture", desc: "All data processed and stored in your browser. Nothing leaves your device. Ever.", gradient: "from-blue-400 to-blue-600" },
              { icon: Layers, title: "Open & Transparent", desc: "Full source code available. Complete data export. You own everything.", gradient: "from-emerald-400 to-emerald-600" },
            ].map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
                <TiltCard className="rounded-[24px] bg-card/60 backdrop-blur-xl shadow-clayCard p-6 flex gap-4 items-start transition-all duration-500 hover:-translate-y-1 hover:shadow-clayCardHover">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br ${item.gradient} text-white shadow-clayButton`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold tracking-tight text-foreground font-heading">{item.title}</h4>
                    <p className="mt-1.5 text-[15px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 8 — TESTIMONIALS (Enhanced)
          ═══════════════════════════════════════ */}
      <Section id="testimonials" ariaLabel="What users say" parallaxOffset={8}>
        <SectionLabel>Testimonials</SectionLabel>
        <SectionTitle>Loved by focused people.</SectionTitle>
        <SectionDesc>
          Hear from people who took back control of their digital habits.
        </SectionDesc>

        <motion.div variants={staggerContainer} className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Sarah Chen", role: "Software Engineer", quote: "FocusGuard helped me realize I was losing 3 hours daily to tab-hopping. My deep work sessions went from 45 min to 2.5 hours.", stars: 5, initials: "SC", gradient: "from-[#38BDF8] to-[#0EA5E9]" },
            { name: "Marcus Rivera", role: "Product Designer", quote: "The behavioral insights are incredible. It predicted my distraction patterns before I even noticed them. Game changer.", stars: 5, initials: "MR", gradient: "from-[#A78BFA] to-[#7C3AED]" },
            { name: "Aisha Patel", role: "PhD Researcher", quote: "I've tried every blocker out there. FocusGuard is the first one that actually understands why I get distracted, not just what I visit.", stars: 5, initials: "AP", gradient: "from-[#F472B6] to-[#DB2777]" },
            { name: "Jake Thompson", role: "Freelance Writer", quote: "The focus mode with task-based unlock is brilliant. I can't cheat my way out of it, and my writing output has doubled.", stars: 4, initials: "JT", gradient: "from-[#FCD34D] to-[#F59E0B]" },
            { name: "Emily Nakamura", role: "Startup Founder", quote: "100% local processing sold me. No data leaves my machine, and the Sankey diagrams make my workflow visible for the first time.", stars: 5, initials: "EN", gradient: "from-[#34D399] to-[#10B981]" },
            { name: "Daniel Okonkwo", role: "Medical Student", quote: "During exam season, FocusGuard is non-negotiable. The productivity score keeps me accountable without being annoying.", stars: 5, initials: "DO", gradient: "from-[#60A5FA] to-[#3B82F6]" },
          ].map((t) => {
            const ref = useRef<HTMLDivElement>(null);
            const isInView = useInView(ref, { once: true });
            return (
              <motion.div key={t.name} variants={fadeUp} ref={ref}>
                <TiltCard className="rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-8 flex flex-col gap-4 h-full transition-all duration-500 hover:-translate-y-2 hover:shadow-clayCardHover">
                  <AnimatedStars count={t.stars} inView={isInView} />
                  <p className="text-[15px] text-muted-foreground leading-relaxed flex-1">
                    <span className="text-3xl font-black text-primary/20 leading-none font-heading">"</span>
                    {t.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border/20">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-black shadow-clayButton`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground font-heading">{t.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{t.role}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Social proof bar */}
        <motion.div variants={fadeUp} className="mt-10 flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-card/60 shadow-clayCard px-5 py-2.5">
            <div className="flex -space-x-2">
              {["from-[#A78BFA] to-[#7C3AED]", "from-[#38BDF8] to-[#0EA5E9]", "from-[#F472B6] to-[#DB2777]", "from-[#34D399] to-[#10B981]"].map((g, i) => (
                <div key={i} className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} border-2 border-card flex items-center justify-center text-white text-[8px] font-black`}>
                  {["SC", "MR", "AP", "EN"][i]}
                </div>
              ))}
            </div>
            <span className="text-xs font-bold text-muted-foreground">+10,800 users</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 text-warning fill-warning" />)}
            </div>
            4.9/5 from 2,400+ reviews
          </div>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 9 — FAQ
          ═══════════════════════════════════════ */}
      <Section id="faq" ariaLabel="Frequently asked questions">
        <div className="max-w-3xl mx-auto">
          <SectionLabel>FAQ</SectionLabel>
          <SectionTitle>Common questions.</SectionTitle>
          <SectionDesc>Everything you need to know about FocusGuard.</SectionDesc>
        </div>

        <motion.div variants={staggerContainer} className="mt-14 max-w-3xl mx-auto w-full rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard p-8">
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

      {/* ═══════════════════════════════════════
          SECTION 10 — AUTHOR
          ═══════════════════════════════════════ */}
      <Section id="author" ariaLabel="About the creator">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <SectionLabel>The Creator</SectionLabel>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] font-heading">
            Meet <span className="clay-text-gradient">Husna Ayoub</span>
          </h2>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="rounded-[28px] sm:rounded-[40px] bg-card/60 backdrop-blur-xl shadow-clayCard p-6 sm:p-10 md:p-14 relative overflow-hidden max-w-3xl mx-auto"
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#7C3AED]/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#0EA5E9]/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Avatar */}
            <motion.div
              variants={scaleIn}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-[#A78BFA] via-[#0EA5E9] to-[#7C3AED] p-[3px] mb-7 shadow-clayButton animate-clay-breathe"
            >
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <span className="text-3xl font-black clay-text-gradient font-heading">HA</span>
              </div>
            </motion.div>

            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-1.5 font-heading">
              Husna Ayoub
            </h3>
            <p className="text-sm text-muted-foreground mb-8 flex items-center gap-1.5 font-medium">
              <span>🇦🇫</span> Kabul, Afghanistan · Co-Founder — HH Nexus
            </p>

            {/* Story */}
            <div className="max-w-2xl mx-auto space-y-5 mb-10">
              <div className="relative">
                <span className="absolute -top-5 -left-3 text-6xl font-black clay-text-gradient opacity-20 select-none leading-none font-heading">&ldquo;</span>
                <p className="text-muted-foreground leading-relaxed text-base pl-6">
                  I built FocusGuard because I saw how digital distractions were stealing hours from people
                  who genuinely wanted to be productive. Students cramming for exams, developers in deep work,
                  researchers chasing breakthroughs.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed text-base">
                Most blockers treat the symptom. I wanted to build something that understands the <span className="text-foreground font-bold">behavior</span>,
                why you get distracted, when it happens, and how to intervene without breaking your flow.
                That&apos;s <span className="text-foreground font-bold">FocusGuard</span>.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base italic border-l-2 border-primary/30 pl-5">
                &ldquo;Every feature in FocusGuard exists because I needed it myself. No fluff, no tracking,
                no cloud dependency, just honest tools for honest work.&rdquo;
              </p>
              <p className="text-foreground font-bold text-lg">
                Made with ❤️ for curious minds.
              </p>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4">
              {[
                { name: "LinkedIn", url: "https://www.linkedin.com/in/husna-a-7971b7272/", gradient: "from-[#60A5FA] to-[#3B82F6]", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg> },
                { name: "GitHub", url: "https://github.com/20-Husna/FocusGuard-Extension", gradient: "from-[#A78BFA] to-[#7C3AED]", icon: <Github className="w-5 h-5" /> },
                { name: "Email", url: "mailto:ayoubhusna9462@gmail.com", gradient: "from-[#F472B6] to-[#DB2777]", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg> },
              ].map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeUp}
                  whileHover={{ scale: 1.15, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-[16px] bg-gradient-to-br ${social.gradient} shadow-clayButton flex items-center justify-center text-white transition-all duration-300`}
                  title={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ═══════════════════════════════════════
          SECTION 11 — CTA
          ═══════════════════════════════════════ */}
      <Section id="download" ariaLabel="Download and get started">
        <motion.div variants={scaleIn} className="text-center">
          <div className="rounded-[32px] sm:rounded-[48px] bg-card/60 backdrop-blur-xl shadow-claySurface p-8 sm:p-14 md:p-20">
            <SectionLabel>Get Started</SectionLabel>
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] font-heading">
              Start protecting your focus today.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Free forever. No account required. Install the Chrome extension and take control of your digital life.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-4">
              <a href="https://github.com/20-Husna/FocusGuard-Extension" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base">
                  Add to Chrome — It's Free <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <a href="https://github.com/20-Husna/FocusGuard-Extension" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 text-base">
                  <Github className="h-4 w-4" /> View Source
                </Button>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      {/* ─── Footer ─── */}
      <footer className="relative border-t border-border/30" role="contentinfo">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          {/* Top row: brand + nav */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton">
                <Shield className="h-3.5 w-3.5" />
              </div>
              <span className="text-[15px] font-black text-foreground font-heading tracking-tight">FocusGuard</span>
            </div>
            <nav className="flex items-center gap-4 sm:gap-5 flex-wrap justify-center">
              {["Features", "Focus", "Analytics", "How It Works", "Testimonials", "Creator"].map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    const id = label === "Creator" ? "author" : label === "How It Works" ? "how" : label.toLowerCase().replace(/\s/g, "");
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="h-px bg-border/20 mb-5" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[13px] text-muted-foreground font-medium">
              © {new Date().getFullYear()} FocusGuard · Built with ❤️ by{" "}
              <span className="text-foreground font-bold">Husna Ayoub</span> · HH Nexus
            </p>
            <div className="flex items-center gap-5 text-[13px] font-bold text-muted-foreground">
              <a href="https://github.com/20-Husna/FocusGuard-Extension" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" /> GitHub
              </a>
              <a href="https://www.linkedin.com/in/husna-a-7971b7272/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="mailto:ayoubhusna9462@gmail.com" className="hover:text-foreground transition-colors">Email</a>
            </div>
          </div>
        </div>
      </footer>

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
