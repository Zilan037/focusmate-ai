import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sectionLinks = [
  { id: "features", label: "Features" },
  { id: "focus", label: "Focus" },
  { id: "analytics", label: "Analytics" },
  { id: "how", label: "How It Works" },
  { id: "compare", label: "Compare" },
  { id: "testimonials", label: "Testimonials" },
  { id: "faq", label: "FAQ" },
  { id: "author", label: "Creator" },
];

const pageLinks = [
  { path: "/", label: "Overview" },
  { path: "/dashboard", label: "Dashboard" },
  { path: "/focus", label: "Focus" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(false);
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
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl"
      >
        <div
          className={`mx-auto flex h-16 sm:h-[72px] items-center justify-between rounded-[32px] sm:rounded-[40px] px-4 sm:px-8 transition-all duration-500 ${
            scrolled
              ? "bg-card/70 shadow-clayCard backdrop-blur-2xl backdrop-saturate-150"
              : "bg-card/40 shadow-clayCard backdrop-blur-xl"
          }`}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="FocusGuard home"
            onClick={(e) => {
              if (isLanding) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] text-white shadow-clayButton transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-heading text-base font-black tracking-tight text-foreground hidden sm:inline">
              FocusGuard
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {isLanding ? (
              sectionLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`relative px-3.5 py-2 text-[13px] font-bold rounded-[14px] transition-all duration-200 ${
                    activeSection === item.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary/10 rounded-[14px] -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))
            ) : (
              pageLinks.map((item) => (
                <Link key={item.path} to={item.path}>
                  <button
                    className={`relative px-3.5 py-2 text-[13px] font-bold rounded-[14px] transition-all duration-200 ${
                      location.pathname === item.path
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {location.pathname === item.path && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 bg-primary/10 rounded-[14px] -z-10"
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
              className="h-10 w-10 rounded-[14px]"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="h-10 w-10 rounded-[14px] md:hidden"
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
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed left-1/2 -translate-x-1/2 top-24 z-40 w-[calc(100%-2rem)] max-w-5xl rounded-[28px] bg-card/80 shadow-clayCard backdrop-blur-2xl md:hidden"
          >
            <div className="flex flex-col p-5 gap-1">
              {isLanding
                ? sectionLinks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-5 py-3.5 text-sm font-bold rounded-[16px] transition-all duration-200 ${
                        activeSection === item.id
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))
                : pageLinks.map((item) => (
                    <Link key={item.path} to={item.path}>
                      <button
                        className={`w-full text-left px-5 py-3.5 text-sm font-bold rounded-[16px] transition-all duration-200 ${
                          location.pathname === item.path
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
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
