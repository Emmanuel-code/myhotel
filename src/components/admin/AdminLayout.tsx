import { ReactNode, useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarCheck, BedDouble, UtensilsCrossed, Sparkles,
  Users, FileText, Megaphone, Bot, Bell, LogOut, ChevronLeft, CalendarDays,
  Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRoles, AppRole } from "@/hooks/useRoles";
import { useHotelBrand } from "@/hooks/useHotelBrand";

type Item = { to: string; label: string; icon: any; roles?: AppRole[] };

const items: Item[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/front-desk", label: "Front Desk", icon: CalendarCheck, roles: ["owner", "gm", "front_desk"] },
  { to: "/admin/housekeeping", label: "Housekeeping", icon: BedDouble, roles: ["owner", "gm", "housekeeping", "front_desk"] },
  { to: "/admin/restaurant", label: "Restaurant", icon: UtensilsCrossed, roles: ["owner", "gm", "restaurant", "front_desk"] },
  { to: "/admin/spa", label: "Spa", icon: Sparkles, roles: ["owner", "gm", "spa", "front_desk"] },
  { to: "/admin/marketing", label: "Marketing", icon: Megaphone, roles: ["owner", "gm", "marketing"] },
  { to: "/admin/cms", label: "Content (CMS)", icon: FileText, roles: ["owner", "gm", "marketing"] },
  { to: "/admin/staff", label: "Staff & Roles", icon: Users, roles: ["owner", "gm"] },
  { to: "/admin/scheduling", label: "Scheduling", icon: CalendarDays, roles: ["owner", "gm"] },
  { to: "/admin/concierge", label: "AI Concierge", icon: Bot },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
];

export default function AdminLayout({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow?: string }) {
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const { hasAny } = useRoles();
  const { brand } = useHotelBrand();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0d0d10] text-neutral-100 overflow-x-hidden">
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/60 sticky top-0 z-40 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-lg tracking-wide text-amber-200">{brand.name}</span>
          <span className="text-[9px] uppercase tracking-widest text-neutral-400">· Admin</span>
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle Admin Menu"
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-neutral-200 hover:text-white"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar (Desktop Fixed / Mobile Slide-in Drawer) */}
      <aside
        className={cn(
          "w-64 shrink-0 border-r border-white/5 bg-black/90 md:bg-black/40 flex flex-col z-50 transition-transform duration-300 ease-in-out",
          "fixed inset-y-0 left-0 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-6 py-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="block">
            <div className="font-display text-xl tracking-wide text-amber-200">{brand.name}</div>
            <div className="text-[10px] tracking-[0.35em] uppercase text-neutral-500 mt-1">{brand.town} · Operations</div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto space-y-1">
          {items.map((it) => {
            if (it.roles && !hasAny(...it.roles)) return null;
            const active = pathname === it.to || (it.to !== "/admin" && pathname.startsWith(it.to));
            return (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.to === "/admin"}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 text-[12px] uppercase tracking-[0.18em] transition-colors",
                  active
                    ? "text-amber-200 bg-amber-200/10 border-r-2 border-amber-200 font-medium"
                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.03]"
                )}
              >
                <it.icon className="w-4 h-4 shrink-0" /> {it.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2 bg-black/60">
          <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 px-2 truncate">{user?.email}</div>
          <Link
            to="/"
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-neutral-100 px-2 py-1.5 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to site
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-neutral-400 hover:text-rose-300 px-2 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area with safe responsive overflow handling */}
      <main className="flex-1 min-w-0 w-full overflow-x-auto">
        <header className="px-5 sm:px-10 py-6 sm:py-8 border-b border-white/5">
          {eyebrow && <div className="text-[10px] uppercase tracking-[0.4em] text-amber-200/80 mb-2">{eyebrow}</div>}
          <h1 className="font-display text-2xl sm:text-4xl leading-tight">{title}</h1>
        </header>
        <div className="p-4 sm:p-8 lg:p-10 w-full max-w-full overflow-x-auto">{children}</div>
      </main>
    </div>
  );
}
