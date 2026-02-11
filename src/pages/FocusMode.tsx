import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Target, Flame, CheckCircle, Lock } from "lucide-react";
import { motivationalQuotes } from "@/data/mockData";

const FOCUS_DURATION = 25 * 60; // 25 minutes

const initialTasks = [
  { id: 1, text: "Complete math homework", done: false },
  { id: 2, text: "Read chapter 5 notes", done: false },
  { id: 3, text: "Review flashcards", done: false },
];

const FocusMode = () => {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [running, setRunning] = useState(false);
  const [tasks, setTasks] = useState(initialTasks);
  const [interruptions, setInterruptions] = useState(0);
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  const [unlocked, setUnlocked] = useState(false);

  const elapsed = FOCUS_DURATION - timeLeft;
  const focusMinutes = Math.floor(elapsed / 60);
  const tasksCompleted = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;

  const focusReq = 10; // minutes needed
  const focusMet = focusMinutes >= focusReq;
  const tasksMet = tasksCompleted >= 2;
  const interruptionsMet = interruptions < 3;
  const allMet = focusMet && tasksMet && interruptionsMet;

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [running, timeLeft]);

  useEffect(() => {
    if (allMet && !unlocked) setUnlocked(true);
  }, [allMet, unlocked]);

  const toggleTask = useCallback((id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const reset = () => {
    setTimeLeft(FOCUS_DURATION);
    setRunning(false);
    setTasks(initialTasks);
    setInterruptions(0);
    setUnlocked(false);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const progressPct = ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100;

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Focus Mode</h1>
          <p className="text-sm text-muted-foreground">Interactive demo — start a focus session</p>
        </div>

        {/* Timer */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass glow-primary mb-6">
            <CardContent className="p-8 text-center">
              <div className="text-7xl font-mono font-bold tracking-wider text-primary">
                {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
              </div>
              <Progress value={progressPct} className="mt-6 h-2" />
              <div className="mt-6 flex justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    setRunning(!running);
                    if (!running && timeLeft < FOCUS_DURATION) setInterruptions((i) => i + 1);
                  }}
                  className="gap-2 font-semibold min-w-[140px]"
                >
                  {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> {timeLeft < FOCUS_DURATION ? "Resume" : "Start"}</>}
                </Button>
                <Button size="lg" variant="outline" onClick={reset} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Task Checklist */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => (
                <label key={task.id} className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task.id)} />
                  <span className={`text-sm transition-colors ${task.done ? "line-through text-muted-foreground" : ""}`}>{task.text}</span>
                </label>
              ))}
              <div className="pt-2 text-xs text-muted-foreground">{tasksCompleted}/{totalTasks} completed</div>
            </CardContent>
          </Card>

          {/* Unlock Progress */}
          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-warning" /> Unlock Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: `Focus ${focusReq}+ minutes`, met: focusMet, progress: Math.min(100, (focusMinutes / focusReq) * 100) },
                { label: "Complete 2+ tasks", met: tasksMet, progress: Math.min(100, (tasksCompleted / 2) * 100) },
                { label: "< 3 interruptions", met: interruptionsMet, progress: interruptionsMet ? 100 : 0 },
              ].map((req) => (
                <div key={req.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={req.met ? "text-productive" : ""}>{req.label}</span>
                    {req.met ? <CheckCircle className="h-4 w-4 text-productive" /> : <span className="text-xs text-muted-foreground">{Math.round(req.progress)}%</span>}
                  </div>
                  <Progress value={req.progress} className="h-1.5" />
                </div>
              ))}
              <div className="pt-2 text-center text-xs">
                {interruptions > 0 && <span className="text-distracted">Interruptions: {interruptions}</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Motivational + Streak */}
        <Card className="glass mb-6">
          <CardContent className="p-6 text-center">
            <Flame className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-sm italic text-muted-foreground max-w-md mx-auto">"{quote}"</p>
            <div className="mt-4 flex justify-center gap-2">
              <Badge className="bg-warning/20 text-warning border-warning/30">🔥 5 Day Streak</Badge>
              <Badge className="bg-productive/20 text-productive border-productive/30">12 Tasks Today</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Unlock Overlay */}
        <AnimatePresence>
          {unlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            >
              <Card className="glass glow-productive max-w-md w-full mx-4">
                <CardContent className="p-8 text-center">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <CheckCircle className="h-16 w-16 text-productive mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-productive">Sites Unlocked! 🎉</h2>
                  <p className="mt-2 text-sm text-muted-foreground">You've met all focus requirements. Enjoy your break!</p>
                  <Button className="mt-6" onClick={() => setUnlocked(false)}>Continue Focusing</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FocusMode;
