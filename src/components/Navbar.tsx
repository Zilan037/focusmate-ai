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
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-gradient bg-gradient-to-r from-primary to-info">FocusGuard</span>
        </Link>
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "secondary" : "ghost"}
                size="sm"
                className="text-sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark(!dark)}
            className="ml-2"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
