import { Shield, ArrowRight, Github, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="pt-28 pb-20 md:pt-40 md:pb-32 px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-[2.5rem] sm:text-5xl md:text-[3.5rem] font-bold tracking-tight leading-[1.12]">
            Stop losing hours to tabs you didn't mean to open.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            FocusGuard is a Chrome extension that tracks where your time actually goes, 
            blocks distractions when you need to work, and shows you patterns you didn't 
            know you had. Everything stays on your machine.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" className="rounded-lg px-6 font-medium text-sm gap-2">
              Install for Chrome <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="rounded-lg px-6 font-medium text-sm">
                See the dashboard
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Free, open-source, no account needed. Works offline.
          </p>
        </div>
      </section>

      {/* ── What it does ── */}
      <section className="py-20 md:py-28 px-6 border-t border-border/40">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Three things, done well.
          </h2>
          <div className="mt-12 space-y-12">
            <div>
              <h3 className="text-lg font-semibold">Time tracking that's actually useful</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                It watches which tabs are active and for how long. It knows when you're idle. 
                At the end of the day, you get a breakdown — by site, by category, by hour — 
                of where your time went. No guessing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Focus sessions that mean something</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                Pick a duration. Pick the sites to block. Add a task list if you want. 
                During a session, blocked sites show a full-page reminder instead of the 
                content. No workarounds, no "skip for 5 minutes" buttons.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Patterns you can act on</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                The dashboard shows your worst distraction loops, your most productive 
                hours, and how your habits shift week over week. It scores your days 
                from 0 to 100 based on how you actually spent your time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Screenshot / product preview ── */}
      <section className="py-20 md:py-28 px-6 bg-secondary/40 border-t border-border/40">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10">
            What the dashboard looks like
          </h2>
          <div className="rounded-xl border border-border bg-card p-6 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Productivity", value: "87/100" },
                { label: "Deep work", value: "4.2h" },
                { label: "Top distraction", value: "YouTube" },
                { label: "Streak", value: "12 days" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl font-semibold font-mono tracking-tight">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="h-px bg-border mb-6" />
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium mb-3">Today by category</p>
                <div className="space-y-2">
                  {[
                    { cat: "Development", pct: 42, color: "bg-info" },
                    { cat: "Communication", pct: 23, color: "bg-primary" },
                    { cat: "Social media", pct: 18, color: "bg-destructive" },
                    { cat: "Research", pct: 12, color: "bg-productive" },
                    { cat: "Other", pct: 5, color: "bg-muted-foreground" },
                  ].map((item) => (
                    <div key={item.cat} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">{item.cat}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-3">Blocked today</p>
                <div className="space-y-1.5">
                  {[
                    { site: "youtube.com", times: 8 },
                    { site: "reddit.com", times: 5 },
                    { site: "twitter.com", times: 3 },
                    { site: "instagram.com", times: 2 },
                  ].map((b) => (
                    <div key={b.site} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-secondary/60">
                      <span className="text-sm">{b.site}</span>
                      <span className="text-xs text-muted-foreground font-mono">{b.times}×</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="py-20 md:py-28 px-6 border-t border-border/40">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Your data stays on your computer.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            FocusGuard doesn't have a server. There's no account to create, no analytics 
            we collect, no telemetry running in the background. Your browsing data is stored 
            in Chrome's local storage and never leaves your machine. You can export or 
            delete everything at any time.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {[
              "No remote servers or cloud sync",
              "No keystroke logging or screenshots",
              "Full data export in JSON",
              "Source code is public on GitHub",
            ].map((point) => (
              <p key={point} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-productive shrink-0" />
                {point}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 px-6 bg-secondary/40 border-t border-border/40">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-10">
            Common questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: "How is this different from other blockers?",
                a: "Most blockers just block. FocusGuard also tracks your time, detects distraction patterns, and gives you a productivity score. It understands context — it's a behavioral tool, not just a wall.",
              },
              {
                q: "Does it slow down my browser?",
                a: "No. It uses Chrome's Manifest V3 service worker architecture. It only wakes up when you switch tabs or start a focus session. CPU usage is essentially zero.",
              },
              {
                q: "Can I bypass the block during focus mode?",
                a: "By design, no. That's the point. You set the rules before you start, and they hold until the session ends. If you really need to, you can end the session early — but it'll be recorded.",
              },
              {
                q: "Is it really free?",
                a: "Yes. It's a side project. There's no premium tier, no \"pro\" upsell, no ads. The code is open-source.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="text-base font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 px-6 border-t border-border/40">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Try it. It takes 10 seconds.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Install the extension, browse normally, check the dashboard at the end of the day. 
            That's it.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-lg px-6 font-medium text-sm gap-2">
              Add to Chrome <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="rounded-lg px-6 font-medium text-sm gap-2">
                <Github className="h-4 w-4" /> Source code
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/30 py-8 px-6" role="contentinfo">
        <div className="mx-auto max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-foreground" />
            <span className="text-sm font-semibold">FocusGuard</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Made by Husna Ayoub · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
