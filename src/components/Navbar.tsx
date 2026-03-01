import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sectionLinks = [
  { id: "problem", label: "Problem" },
  { id: "features", label: "Features" },
  { id: "focus", label: "Focus" },
  { id: "analytics", label: "Analytics" },
  { id: "how", label: "How It Works" },
  { id: "compare", label: "Compare" },
  { id: "download", label: "Download" },
];

const pageLinks = [
  { path: "/", label: "Overview" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/focus", label: "Focus" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const isLanding = location.pathname === "/";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track active section on landing page
  useEffect(() => {
    if (!isLanding) return;
    const ids = sectionLinks.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isLanding]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const scrollToSection = useCallback(
    (id: string) => {
      if (!isLanding) {
        navigate("/");
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }
      setMobileOpen(false);
    },
    [isLanding, navigate]
  );

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
          scrolled
            ? "bg-background/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="FocusGuard home"
            onClick={(e) => {
              if (isLanding) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-300 group-hover:scale-105">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline">
              FocusGuard
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {isLanding ? (
              // Section-based smooth scroll links on landing
              sectionLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    activeSection === item.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-secondary rounded-lg -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))
            ) : (
              // Page-based links on other pages
              pageLinks.map((item) => (
                <Link key={item.path} to={item.path}>
                  <button
                    className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      location.pathname === item.path
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {location.pathname === item.path && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-secondary rounded-lg -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                </Link>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDark(!dark)}
              className="h-8 w-8 rounded-lg"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-8 w-8 rounded-lg sm:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-12 z-40 bg-background/95 backdrop-blur-2xl border-b border-border/40 sm:hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              {isLanding
                ? sectionLinks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                        activeSection === item.id
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))
                : pageLinks.map((item) => (
                    <Link key={item.path} to={item.path}>
                      <button
                        className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                          location.pathname === item.path
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {item.label}
                      </button>
                    </Link>
                  ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
