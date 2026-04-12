import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "#" },
];

export function Navbar() {
  const { pathname } = useLocation();
  const isApp = pathname.startsWith("/app");

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
            {links.map((l) => (
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

        {/* CTA */}
        <div className="flex items-center gap-2">
          {isApp ? (
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                Home
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/app">
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                  Log in
                </Button>
              </Link>
              <Link to="/app">
                <Button
                  size="sm"
                  className={cn(
                    "bg-primary text-white hover:bg-primary/90 font-semibold"
                  )}
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
