import { Link, useLocation } from "react-router-dom";
import { Shield, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const [dark, setDark] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: "/", label: "Overview" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/focus", label: "Focus" },
  ];

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
          <Link to="/" className="flex items-center gap-2 group" aria-label="FocusGuard home">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-300 group-hover:scale-105">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:inline">
              FocusGuard
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
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
            ))}
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
              {navItems.map((item) => (
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
