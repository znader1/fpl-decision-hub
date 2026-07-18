import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LogOut, Menu } from "lucide-react";

const landingLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
];

const appLinks = [
  { label: "Squad", to: "/app" },
  { label: "Mini-league", to: "/app/league" },
  { label: "Fixtures", to: "/app/fixtures" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isApp = pathname.startsWith("/app");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[hsl(248_20%_8%/0.85)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-white tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-black text-white">
            FPL
          </span>
          <span className="hidden sm:inline">FPLedge</span>
        </Link>

        {/* Nav links — only on landing */}
        {!isApp && (
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            {landingLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            // Logged-in state
            <>
              {!isApp && (
                <Link to="/app">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                    Open squad
                  </Button>
                </Link>
              )}
              {isApp && (
                <div className="hidden md:flex items-center gap-2">
                  {appLinks
                    .filter((l) => l.to !== pathname)
                    .map((l) => (
                      <Link key={l.to} to={l.to}>
                        <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                          {l.label}
                        </Button>
                      </Link>
                    ))}
                </div>
              )}
              {isApp && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-white/70 hover:text-white"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {appLinks
                      .filter((l) => l.to !== pathname)
                      .map((l) => (
                        <DropdownMenuItem key={l.to} asChild>
                          <Link to={l.to}>{l.label}</Link>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-white/50 hover:text-white gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            // Logged-out state
            <>
              <Link to="/auth?tab=login">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  Log in
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="sm"
                  className={cn("bg-primary text-white hover:bg-primary/90 font-semibold")}
                >
                  Start free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
