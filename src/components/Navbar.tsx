import { Link, useLocation } from "react-router-dom";
import { Shield, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/focus", label: "Focus Mode" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-extrabold uppercase tracking-wider text-gradient bg-gradient-to-r from-primary to-info">
            FocusGuard
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Status indicator */}
          <div className="mr-3 hidden items-center gap-2 rounded-full border border-border/40 bg-card/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-productive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-productive" />
            </span>
            Neural Monitoring
          </div>

          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                size="sm"
                className={`text-xs font-bold uppercase tracking-wide ${
                  location.pathname === item.path
                    ? "bg-secondary border border-border/40 shadow-sm"
                    : ""
                }`}
              >
                {item.label}
              </Button>
            </Link>
          ))}

          <div className="ml-2 flex items-center gap-2 rounded-full border border-border/40 bg-card/60 px-2.5 py-1">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-extrabold text-warning">5</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark(!dark)}
            className="ml-1 rounded-xl"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
