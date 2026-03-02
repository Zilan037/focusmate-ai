import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Play, Pause, Square, RotateCcw, Plus, X, Shield, Check,
  Ban, Globe, Lock, CheckCircle, Flame, Timer,
} from "lucide-react";
import { motivationalQuotes } from "@/data/mockData";

type Phase = "setup" | "active" | "paused" | "completed";
type Task = { id: number; text: string; done: boolean };

const DURATIONS = [15, 25, 45, 60];

const ClayCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[32px] bg-card/60 backdrop-blur-xl shadow-clayCard transition-all duration-500 ${className}`}>
    {children}
  </div>
);

const FocusMode = () => {
  const [phase, setPhase] = useState<Phase>("setup");
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Complete math homework", done: false },
    { id: 2, text: "Read chapter 5 notes", done: false },
    { id: 3, text: "Review flashcards", done: false },
  ]);
  const [taskInput, setTaskInput] = useState("");
  const [blockedSites, setBlockedSites] = useState<string[]>(["youtube.com", "instagram.com", "reddit.com"]);
  const [blockInput, setBlockInput] = useState("");
  const [allowedSites, setAllowedSites] = useState<string[]>(["docs.google.com", "github.com"]);
  const [allowInput, setAllowInput] = useState("");
  const [interruptions, setInterruptions] = useState(0);
  const [showBlockedOverlay, setShowBlockedOverlay] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const nextId = useRef(4);

  const totalSeconds = duration * 60;
  const elapsed = totalSeconds - timeLeft;
  const focusMinutes = Math.floor(elapsed / 60);
  const tasksCompleted = tasks.filter((t) => t.done).length;
  const progressPct = (elapsed / totalSeconds) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const focusReq = 10;
  const focusMet = focusMinutes >= focusReq;
  const tasksMet = tasksCompleted >= 2;
  const interruptionsMet = interruptions < 3;
  const allMet = focusMet && tasksMet && interruptionsMet;

  useEffect(() => {
    if (phase !== "active" || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && phase === "active") setPhase("completed");
  }, [timeLeft, phase]);

  useEffect(() => {
    if (allMet && !unlocked) setUnlocked(true);
  }, [allMet, unlocked]);

  const startFocus = () => { setTimeLeft(duration * 60); setPhase("active"); setInterruptions(0); setUnlocked(false); };
  const pauseFocus = () => { setPhase("paused"); setInterruptions((i) => i + 1); };
  const resumeFocus = () => setPhase("active");
  const stopFocus = () => { setPhase("setup"); setTimeLeft(duration * 60); };
  const resetFocus = () => { setPhase("setup"); setTimeLeft(duration * 60); setInterruptions(0); setUnlocked(false); tasks.forEach((t) => (t.done = false)); setTasks([...tasks]); };

  const toggleTask = useCallback((id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const addTask = () => {
    if (!taskInput.trim()) return;
    setTasks((prev) => [...prev, { id: nextId.current++, text: taskInput.trim(), done: false }]);
    setTaskInput("");
  };

  const removeTask = (id: number) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const addSite = (list: string[], setList: (s: string[]) => void, input: string, setInput: (s: string) => void) => {
    const domain = input.trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/.*$/, "").toLowerCase();
    if (!domain || list.includes(domain)) return;
    setList([...list, domain]);
    setInput("");
  };

  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - progressPct / 100);

  return (
    <div className="min-h-screen pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1 font-heading">Intervention System</p>
          <h1 className="text-3xl font-black tracking-tight font-heading">Focus Mode</h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            {phase === "setup" ? "Configure your focus session" : phase === "active" ? "Session in progress — stay focused" : phase === "paused" ? "Paused — resume when ready" : "Session complete!"}
          </p>
        </div>

        {/* ─── Setup Phase ─── */}
        {phase === "setup" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Duration */}
            <ClayCard className="p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-4 font-heading">Session Duration</p>
              <div className="flex gap-3">
                {DURATIONS.map((d) => (
                  <button key={d} onClick={() => { setDuration(d); setTimeLeft(d * 60); }}
                    className={`flex-1 rounded-[20px] py-4 text-center transition-all font-black text-sm ${
                      duration === d
                        ? "bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton"
                        : "bg-card/80 shadow-clayCard text-muted-foreground hover:-translate-y-1 hover:shadow-clayCardHover"
                    }`}
                  >
                    {d}m
                    <span className="block text-[10px] font-bold opacity-70 mt-0.5">
                      {d <= 15 ? "Sprint" : d <= 25 ? "Pomodoro" : d <= 45 ? "Deep Work" : "Marathon"}
                    </span>
                  </button>
                ))}
              </div>
            </ClayCard>

            {/* Tasks */}
            <ClayCard className="p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-4 font-heading">Tasks to Complete</p>
              <div className="space-y-2 mb-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-[16px] bg-card/80 shadow-clayCard p-3.5">
                    <span className="flex-1 text-sm font-bold">{task.text}</span>
                    <button onClick={() => removeTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={taskInput} onChange={(e) => setTaskInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="Add a task..." className="flex-1 rounded-[16px] bg-input shadow-clayPressed px-5 py-3 text-sm font-medium outline-none focus:bg-card focus:ring-4 focus:ring-primary/20 transition-all" />
                <Button onClick={addTask} size="sm" className="rounded-[16px] gap-1"><Plus className="h-4 w-4" /> Add</Button>
              </div>
            </ClayCard>

            {/* Block & Allow Sites */}
            <div className="grid md:grid-cols-2 gap-6">
              <ClayCard className="p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-destructive mb-4 flex items-center gap-1.5 font-heading"><Ban className="h-3 w-3" /> Block Sites</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {blockedSites.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/20 px-4 py-1.5 text-xs font-bold text-destructive shadow-clayCard">
                      {s} <button onClick={() => setBlockedSites((p) => p.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={blockInput} onChange={(e) => setBlockInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSite(blockedSites, setBlockedSites, blockInput, setBlockInput)}
                    placeholder="e.g. tiktok.com" className="flex-1 rounded-[16px] bg-input shadow-clayPressed px-4 py-2.5 text-sm font-medium outline-none focus:bg-card focus:ring-4 focus:ring-destructive/20 transition-all" />
                  <Button size="sm" variant="outline" onClick={() => addSite(blockedSites, setBlockedSites, blockInput, setBlockInput)} className="rounded-[16px] text-destructive border-destructive/30">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </ClayCard>

              <ClayCard className="p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-productive mb-4 flex items-center gap-1.5 font-heading"><Globe className="h-3 w-3" /> Allow Only</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {allowedSites.map((s) => (
                    <span key={s} className="flex items-center gap-1.5 rounded-full bg-productive/10 border border-productive/20 px-4 py-1.5 text-xs font-bold text-productive shadow-clayCard">
                      {s} <button onClick={() => setAllowedSites((p) => p.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={allowInput} onChange={(e) => setAllowInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSite(allowedSites, setAllowedSites, allowInput, setAllowInput)}
                    placeholder="e.g. notion.so" className="flex-1 rounded-[16px] bg-input shadow-clayPressed px-4 py-2.5 text-sm font-medium outline-none focus:bg-card focus:ring-4 focus:ring-productive/20 transition-all" />
                  <Button size="sm" variant="outline" onClick={() => addSite(allowedSites, setAllowedSites, allowInput, setAllowInput)} className="rounded-[16px] text-productive border-productive/30">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </ClayCard>
            </div>

            {/* Deploy */}
            <Button onClick={startFocus} size="lg"
              className="w-full py-6 text-sm font-black uppercase tracking-[0.2em] gap-2"
            >
              <Play className="h-5 w-5" /> Deploy Focus — {duration} Minutes
            </Button>
          </motion.div>
        )}

        {/* ─── Active / Paused Phase ─── */}
        {(phase === "active" || phase === "paused") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Timer */}
            <ClayCard className="p-8 text-center">
              <div className="mx-auto w-56 h-56 relative flex items-center justify-center mb-6">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--border))" strokeWidth="4" opacity="0.15" />
                  <circle cx="100" cy="100" r="90" fill="none" stroke="url(#timerGrad)" strokeWidth="5"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s linear" }} />
                  <defs>
                    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                </svg>
                <div>
                  <div className="text-6xl font-black font-heading tracking-tighter text-primary">
                    {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    {phase === "paused" ? "Paused" : "Remaining"}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                {phase === "active" ? (
                  <Button onClick={pauseFocus} variant="secondary" className="gap-2 font-bold"><Pause className="h-4 w-4" /> Pause</Button>
                ) : (
                  <Button onClick={resumeFocus} className="gap-2 font-bold"><Play className="h-4 w-4" /> Resume</Button>
                )}
                <Button onClick={stopFocus} variant="outline" className="gap-2 font-bold text-destructive border-destructive/30"><Square className="h-4 w-4" /> Stop</Button>
              </div>
            </ClayCard>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Task Checklist */}
              <ClayCard className="p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-4 font-heading">Active Tasks</p>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`h-6 w-6 rounded-[8px] border-2 flex items-center justify-center transition-all ${task.done ? "bg-productive border-productive shadow-clayButton" : "border-border group-hover:border-primary"}`}
                        onClick={() => toggleTask(task.id)}>
                        {task.done && <Check className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <span className={`text-sm font-bold transition-colors ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.text}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-xs font-bold text-muted-foreground">{tasksCompleted}/{tasks.length} completed</p>
              </ClayCard>

              {/* Unlock Requirements */}
              <ClayCard className="p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-warning mb-4 flex items-center gap-1.5 font-heading"><Lock className="h-3 w-3" /> Unlock Requirements</p>
                <div className="space-y-4">
                  {[
                    { label: `Focus ${focusReq}+ min`, met: focusMet, pct: Math.min(100, (focusMinutes / focusReq) * 100), gradient: "from-[#A78BFA] to-[#7C3AED]" },
                    { label: "Complete 2+ tasks", met: tasksMet, pct: Math.min(100, (tasksCompleted / 2) * 100), gradient: "from-[#34D399] to-[#10B981]" },
                    { label: "< 3 interruptions", met: interruptionsMet, pct: interruptionsMet ? 100 : 0, gradient: "from-[#38BDF8] to-[#0EA5E9]" },
                  ].map((req) => (
                    <div key={req.label}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className={`font-bold ${req.met ? "text-productive" : ""}`}>{req.label}</span>
                        {req.met ? <CheckCircle className="h-4 w-4 text-productive" /> : <span className="text-xs font-bold text-muted-foreground">{Math.round(req.pct)}%</span>}
                      </div>
                      <div className="h-2 rounded-full shadow-clayPressed overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${req.gradient} transition-all duration-500`} style={{ width: `${req.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {interruptions > 0 && <p className="mt-4 text-xs font-bold text-destructive">Interruptions: {interruptions}</p>}
              </ClayCard>
            </div>

            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Elapsed", value: `${focusMinutes}m`, className: "" },
                { label: "Tasks Done", value: `${tasksCompleted}/${tasks.length}`, className: "text-productive" },
                { label: "Interruptions", value: interruptions, className: interruptionsMet ? "text-productive" : "text-destructive" },
              ].map((stat) => (
                <ClayCard key={stat.label} className="p-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-2 font-heading">{stat.label}</p>
                  <p className={`text-2xl font-black font-heading ${stat.className}`}>{stat.value}</p>
                </ClayCard>
              ))}
            </div>

            {/* Try Blocked Site Button */}
            <button onClick={() => setShowBlockedOverlay(true)}
              className="w-full rounded-[20px] bg-destructive/5 shadow-clayCard p-4 text-sm font-bold text-destructive hover:-translate-y-1 hover:shadow-clayCardHover transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Ban className="h-4 w-4" /> Try visiting a blocked site (demo)
            </button>

            {/* Quote */}
            <ClayCard className="p-6 text-center">
              <Flame className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-sm italic text-muted-foreground font-medium max-w-md mx-auto">&quot;{quote}&quot;</p>
            </ClayCard>
          </motion.div>
        )}

        {/* ─── Completed Phase ─── */}
        {phase === "completed" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <ClayCard className="p-12 text-center border-2 border-productive/20">
              <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                <CheckCircle className="h-20 w-20 text-productive mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl font-black text-productive font-heading">Session Complete! 🎉</h2>
              <p className="mt-3 text-muted-foreground font-medium">You focused for {duration} minutes and completed {tasksCompleted} tasks.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={resetFocus} className="gap-2 font-bold"><RotateCcw className="h-4 w-4" /> New Session</Button>
              </div>
            </ClayCard>
          </motion.div>
        )}

        {/* ─── Blocked Site Overlay ─── */}
        <AnimatePresence>
          {showBlockedOverlay && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4"
            >
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}>
                <ClayCard className="max-w-lg w-full p-10 text-center border-2 border-destructive/20">
                  <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 shadow-clayButton animate-clay-breathe">
                    <Shield className="h-12 w-12 text-destructive" />
                  </div>
                  <h2 className="text-3xl font-black bg-gradient-to-r from-destructive to-warning bg-clip-text text-transparent font-heading">Site Blocked</h2>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full shadow-clayCard px-5 py-2.5 text-sm font-mono font-bold text-muted-foreground">
                    <Globe className="h-4 w-4" /> youtube.com
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground font-medium">This site is blocked during your focus session.</p>

                  <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground">
                    💪 You&apos;ve resisted <span className="font-black text-foreground">3</span> sites this session
                  </div>

                  <div className="mt-6 rounded-[20px] shadow-clayPressed p-4">
                    <p className="text-sm italic text-muted-foreground">&quot;Focus on being productive instead of busy.&quot;</p>
                    <p className="mt-1 text-xs font-bold text-muted-foreground">— Tim Ferriss</p>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-warning font-heading">
                    <Timer className="h-3 w-3" /> Reflection Timer Required
                  </div>

                  <Button onClick={() => setShowBlockedOverlay(false)} variant="secondary" className="mt-6 gap-2 font-bold">
                    ← Go Back to Focus
                  </Button>
                </ClayCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Unlock Celebration ─── */}
        <AnimatePresence>
          {unlocked && phase === "active" && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <ClayCard className="max-w-md w-full mx-4 p-10 text-center border-2 border-productive/20">
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                  <CheckCircle className="h-16 w-16 text-productive mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-black text-productive font-heading">Requirements Met! 🎉</h2>
                <p className="mt-2 text-sm text-muted-foreground font-medium">All unlock conditions satisfied. Blocked sites are now accessible.</p>
                <Button className="mt-6 font-bold" onClick={() => setUnlocked(false)}>Continue Focusing</Button>
              </ClayCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FocusMode;
