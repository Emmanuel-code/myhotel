import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO, differenceInDays } from "date-fns";
import { Heart, Download, X, LogOut, FileText, Sparkles, Calendar as CalIcon, User as UserIcon } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { rooms } from "@/data/hotel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DEMO_BOOKINGS, DEMO_INVOICES, DEMO_PROFILE, mergeWithLocal } from "@/lib/demo";

type Tab = "bookings" | "invoices" | "loyalty" | "favorites" | "profile";

const TIER_THRESHOLDS: Record<string, number> = {
  Silver: 0,
  Gold: 500,
  Platinum: 2000,
  Diamond: 5000,
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("bookings");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [p, b, i, f] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("bookings").select("*").eq("user_id", user.id).order("check_in", { ascending: false }),
        supabase.from("invoices").select("*").eq("user_id", user.id).order("issued_at", { ascending: false }),
        supabase.from("favorites").select("*").eq("user_id", user.id),
      ]);
      setProfile(p.data || DEMO_PROFILE || {
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
        loyalty_points: 0,
        loyalty_tier: "Silver",
      });
      const combined = mergeWithLocal("SK_local_bookings", b.data || []);
      setBookings(combined.length > 0 ? combined : DEMO_BOOKINGS);
      setInvoices((i.data && i.data.length > 0) ? i.data : DEMO_INVOICES);
      setFavorites(f.data || []);
    } catch {
      setProfile(DEMO_PROFILE || {
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
        loyalty_points: 0,
        loyalty_tier: "Silver",
      });
      const localBookings = mergeWithLocal("SK_local_bookings", []);
      setBookings(localBookings.length > 0 ? localBookings : DEMO_BOOKINGS);
      setInvoices(DEMO_INVOICES);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [user]);

  const upcoming = bookings.filter((b) => b.status !== "cancelled" && parseISO(b.check_in) >= new Date());
  const past = bookings.filter((b) => b.status === "cancelled" || parseISO(b.check_out) < new Date());

  const confirmCancel = async () => {
    if (!cancelId) return;
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", cancelId);
    if (error) { toast.error(error.message); return; }
    toast.success("Reservation cancelled.");
    setCancelId(null);
    refresh();
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    refresh();
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "bookings", label: "Reservations", icon: CalIcon },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "loyalty", label: "Loyalty", icon: Sparkles },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "profile", label: "Profile", icon: UserIcon },
  ];

  const greeting = profile?.first_name ? `, ${profile.first_name}` : "";

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />

      <section className="container-prose pt-40 pb-10 flex items-end justify-between flex-wrap gap-6">
        <div>
          <div className="eyebrow mb-3">Concierge desk</div>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.05]">Welcome back{greeting}.</h1>
          <p className="text-muted-foreground mt-3">
            Your private dashboard — reservations, receipts, loyalty journey.
          </p>
        </div>
        <button onClick={async () => { await signOut(); navigate("/"); }} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </section>

      {/* Stat strip */}
      <section className="container-prose">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          <Stat label="Upcoming stays" value={String(upcoming.length)} />
          <Stat label="Loyalty tier" value={profile?.loyalty_tier ?? "Silver"} accent />
          <Stat label="Points balance" value={(profile?.loyalty_points ?? 0).toLocaleString()} />
          <Stat label="Lifetime nights" value={String(bookings.reduce((s, b) => s + (b.nights || 0), 0))} />
        </div>
      </section>

      <section className="container-prose pt-12">
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-4 text-[11px] uppercase tracking-[0.28em] border-b-2 -mb-px transition-colors whitespace-nowrap",
                  tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="container-prose py-12 min-h-[40vh]">
        {tab === "bookings" && (
          <div className="space-y-10">
            <Subhead title="Upcoming" />
            {dataLoading ? (
              <div className="grid gap-4">
                {[1, 2].map((n) => (
                  <div key={n} className="flex gap-5 p-5 border border-border bg-card animate-pulse">
                    <div className="w-[140px] h-32 bg-muted rounded-sm shrink-0" />
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-3 bg-muted rounded w-1/3" />
                      <div className="h-5 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <Empty msg="No upcoming reservations." cta="Browse residences" to="/rooms" />
            ) : (
              <div className="grid gap-4">
                {upcoming.map((b) => (
                  <BookingRow key={b.id} b={b} onCancel={() => setCancelId(b.id)} />
                ))}
              </div>
            )}
            <Subhead title="Past & cancelled" />
            {dataLoading ? (
              <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
            ) : past.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your travel history will appear here.</p>
            ) : (
              <div className="grid gap-4 opacity-80">
                {past.map((b) => <BookingRow key={b.id} b={b} past />)}
              </div>
            )}
          </div>
        )}

        {tab === "invoices" && (
          <div className="space-y-3">
            {invoices.length === 0 ? <Empty msg="No invoices yet." cta="Make a reservation" to="/rooms" /> : (
              invoices.map((inv) => (
                <Link to={`/invoice/${inv.id}`} key={inv.id} className="flex items-center justify-between gap-6 p-6 border border-border hover:border-foreground transition-colors">
                  <div>
                    <div className="font-display text-xl">{inv.invoice_number}</div>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-1">
                      Issued {format(parseISO(inv.issued_at), "d MMM yyyy")} · {inv.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl text-primary">₵{inv.amount.toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-1 flex items-center gap-1 justify-end"><Download className="w-3 h-3" /> View</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "loyalty" && (
          <LoyaltyPanel profile={profile} bookings={bookings} />
        )}

        {tab === "favorites" && (
          <div>
            {favorites.length === 0 ? <Empty msg="You haven't saved any residences yet." cta="Discover suites" to="/rooms" /> : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((f) => {
                  const r = rooms.find((x) => x.id === f.room_id);
                  if (!r) return null;
                  return (
                    <div key={f.id} className="border border-border group">
                      <Link to={`/rooms/${r.id}`} className="block aspect-[4/3] overflow-hidden bg-muted">
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </Link>
                      <div className="p-5">
                        <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{r.category}</div>
                        <div className="font-display text-xl mt-1">{r.name}</div>
                        <div className="flex justify-between items-center mt-4">
                          <span className="font-display text-lg text-primary">₵{r.price.toLocaleString()}<span className="text-xs text-muted-foreground"> /nt</span></span>
                          <button onClick={() => removeFavorite(f.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove favorite">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <ProfilePanel profile={profile} onSaved={refresh} userEmail={user?.email} />
        )}
      </section>

      <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent className="bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Cancel Reservation</DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 space-y-3" asChild>
              <div>
                <p>Are you sure you want to cancel this reservation?</p>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-200 text-xs leading-relaxed" role="note">
                  <strong>⚠️ Cancellation Policy:</strong> Free cancellation up to 48 hours before
                  check-in. Cancellations within 48 hours forfeit the first night's rate.
                  Our concierge team will confirm your credit or refund within 24 hours.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3">
            <DialogClose asChild>
              <button className="px-4 py-2 text-xs uppercase tracking-[0.2em] border border-border hover:bg-white/[0.02] transition-colors">Keep Reservation</button>
            </DialogClose>
            <button
              onClick={confirmCancel}
              className="px-4 py-2 text-xs uppercase tracking-[0.2em] bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
            >
              Confirm Cancellation
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card px-6 py-7">
      <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">{label}</div>
      <div className={cn("font-display text-3xl", accent && "text-primary")}>{value}</div>
    </div>
  );
}

function Subhead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="hairline" />
      <h2 className="font-display text-2xl">{title}</h2>
    </div>
  );
}

function Empty({ msg, cta, to }: { msg: string; cta: string; to: string }) {
  return (
    <div className="text-center py-16 border border-dashed border-border">
      <p className="text-muted-foreground mb-6">{msg}</p>
      <Link to={to} className="btn-gilded">{cta}</Link>
    </div>
  );
}

function BookingRow({ b, onCancel, past }: { b: any; onCancel?: () => void; past?: boolean }) {
  const nights = b.nights ?? differenceInDays(parseISO(b.check_out), parseISO(b.check_in));
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr_auto] gap-5 p-5 border border-border bg-card">
      <img src={b.room_image} alt={b.room_name} loading="lazy" className="w-full sm:w-[140px] h-40 sm:h-32 object-cover rounded-sm" />
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          {b.confirmation_number} · <span className="text-primary font-medium">{b.status}</span>
        </div>
        <div className="font-display text-xl sm:text-2xl mt-1">{b.room_name}</div>
        <div className="text-xs sm:text-sm text-muted-foreground mt-2">
          {format(parseISO(b.check_in), "EEE d MMM")} → {format(parseISO(b.check_out), "EEE d MMM yyyy")} · {nights} nights · {b.guests} guests
        </div>
        {b.special_requests && <p className="text-xs text-muted-foreground mt-2 italic">"{b.special_requests}"</p>}
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border gap-3">
        <div className="font-display text-xl sm:text-2xl text-primary">₵{b.total?.toLocaleString()}</div>
        {!past && b.status !== "cancelled" && (
          <div className="flex items-center gap-3">
            <Link to={`/invoice/${b.id}?type=booking`} className="text-[11px] uppercase tracking-[0.28em] underline text-foreground hover:text-primary">Invoice</Link>
            <button onClick={onCancel} className="text-[11px] uppercase tracking-[0.28em] text-destructive hover:opacity-70">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoyaltyPanel({ profile, bookings }: { profile: any; bookings: any[] }) {
  const tier = profile?.loyalty_tier ?? "Silver";
  const points = profile?.loyalty_points ?? 0;
  const order = ["Silver", "Gold", "Platinum", "Diamond"];
  const nextTier = order[order.indexOf(tier) + 1];
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const pct = nextThreshold ? Math.min(100, (points / nextThreshold) * 100) : 100;
  const lifetime = bookings.reduce((s, b) => s + (b.total || 0), 0);

  return (
    <div className="grid md:grid-cols-[1.2fr_1fr] gap-10">
      <div>
        <div className="eyebrow mb-3">Bej Society</div>
        <div className="font-display text-5xl md:text-6xl mb-2">{tier}</div>
        <div className="text-muted-foreground mb-10">{points.toLocaleString()} points · ₵{lifetime.toLocaleString()} lifetime spend</div>

        {nextTier && nextThreshold && (
          <div>
            <div className="flex justify-between text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-3">
              <span>Toward {nextTier}</span><span>{points.toLocaleString()} / {nextThreshold.toLocaleString()}</span>
            </div>
            <div className="h-px bg-border relative">
              <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${pct}%`, height: '2px', top: '-0.5px' }} />
            </div>
            <p className="text-sm text-muted-foreground mt-4">{(nextThreshold - points).toLocaleString()} points until {nextTier} status.</p>
          </div>
        )}
      </div>

      <div className="border border-border p-8">
        <div className="font-display text-2xl mb-6">Tier privileges</div>
        <ul className="space-y-4 text-sm">
          <Perk active={true} text="Welcome amaro on arrival" />
          <Perk active={["Gold", "Platinum", "Diamond"].includes(tier)} text="Complimentary breakfast" />
          <Perk active={["Gold", "Platinum", "Diamond"].includes(tier)} text="Late checkout to 4pm" />
          <Perk active={["Platinum", "Diamond"].includes(tier)} text="Suite upgrade subject to availability" />
          <Perk active={["Platinum", "Diamond"].includes(tier)} text="₵100 spa credit per stay" />
          <Perk active={tier === "Diamond"} text="Dedicated butler service" />
          <Perk active={tier === "Diamond"} text="Private yacht transfers" />
        </ul>
      </div>
    </div>
  );
}

function Perk({ active, text }: { active: boolean; text: string }) {
  return (
    <li className={cn("flex items-center gap-3", !active && "opacity-40")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-primary" : "bg-muted-foreground")} />
      {text}
    </li>
  );
}

function ProfilePanel({ profile, onSaved, userEmail }: { profile: any; onSaved: () => void; userEmail?: string }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => { setForm(profile || {}); }, [profile]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      dietary_preferences: form.dietary_preferences,
      pillow_preference: form.pillow_preference,
    }).eq("id", profile.id);
    if (error) toast.error(error.message);
    else { toast.success("Preferences saved."); onSaved(); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <Pfield label="First name" value={form.first_name || ""} onChange={(v) => setForm({ ...form, first_name: v })} />
        <Pfield label="Last name" value={form.last_name || ""} onChange={(v) => setForm({ ...form, last_name: v })} />
        <Pfield label="Email" value={userEmail || ""} disabled />
        <Pfield label="Phone" value={form.phone || ""} onChange={(v) => setForm({ ...form, phone: v })} />
        <Pfield label="Dietary preferences" value={form.dietary_preferences || ""} onChange={(v) => setForm({ ...form, dietary_preferences: v })} placeholder="e.g. vegetarian, gluten-free" />
        <Pfield label="Pillow preference" value={form.pillow_preference || ""} onChange={(v) => setForm({ ...form, pillow_preference: v })} placeholder="Down / hypoallergenic / firm…" />
      </div>
      <button onClick={save} className="btn-gilded">Save preferences</button>
    </div>
  );
}

function Pfield({ label, value, onChange, disabled, placeholder }: { label: string; value: string; onChange?: (v: string) => void; disabled?: boolean; placeholder?: string }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{label}</label>
      <input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary disabled:opacity-60"
      />
    </div>
  );
}
