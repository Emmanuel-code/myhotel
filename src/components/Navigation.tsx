import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useHotelBrand } from "@/hooks/useHotelBrand";

const nav = [
  { to: "/rooms", label: "Suites & Villas" },
  { to: "/restaurant", label: "Dining" },
  { to: "/spa", label: "Spa" },
  { to: "/events", label: "Weddings & Events" },
];

export default function Navigation({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { brand } = useHotelBrand();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const inverted = transparent && !scrolled;

  return (
    <>
      {/* Skip to main content — visible only on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:text-xs focus:uppercase focus:tracking-widest"
      >
        Skip to main content
      </a>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-background/90 backdrop-blur-xl border-b border-border/60 py-3 shadow-sm"
            : "py-6 bg-gradient-to-b from-black/60 via-black/20 to-transparent",
          inverted && "text-background"
        )}
      >
        <div className="container-prose flex items-center justify-between">
          <Link to="/" className="group" aria-label={`${brand.name} Homepage`}>
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl tracking-wide">{brand.name}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                {brand.town} · Ghana
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10" aria-label="Primary navigation">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "text-xs uppercase tracking-[0.28em] link-underline transition-colors",
                    isActive && "text-primary"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {user && (
              <Link
                to="/dashboard"
                aria-label="View notifications on guest dashboard"
                className={cn(
                  "hidden md:inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors relative",
                  inverted ? "text-background/85 hover:text-background hover:bg-white/10" : "text-foreground/80 hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
              </Link>
            )}

            <Link
              to={user ? "/dashboard" : "/auth"}
              aria-label={user ? "My Stay & Account Dashboard" : "Sign in to your account"}
              className={cn(
                "hidden md:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] transition-colors",
                inverted ? "text-background/85 hover:text-background" : "text-foreground/80 hover:text-foreground"
              )}
            >
              <User className="w-3.5 h-3.5" /> {user ? "My Stay" : "Sign in"}
            </Link>
            <Link
              to="/booking"
              className={cn(
                "hidden md:inline-flex items-center px-6 py-2.5 text-[11px] uppercase tracking-[0.28em] font-medium transition-all duration-500",
                inverted
                  ? "border border-background/70 text-background hover:bg-background hover:text-foreground"
                  : "bg-primary text-primary-foreground hover:bg-foreground hover:text-background"
              )}
            >
              Reserve
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2 text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden bg-background border-t border-border animate-fade-in" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
            <div className="container-prose py-8 flex flex-col gap-6">
              {nav.map((n) => (
                <Link key={n.to} to={n.to} className="text-foreground text-sm uppercase tracking-[0.28em]">
                  {n.label}
                </Link>
              ))}
              <Link to={user ? "/dashboard" : "/auth"} className="text-foreground text-sm uppercase tracking-[0.28em]">
                {user ? "My Stay" : "Sign in"}
              </Link>
              <Link to="/booking" className="btn-gilded mt-4 w-fit">Reserve</Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
