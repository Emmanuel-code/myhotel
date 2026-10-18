import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, CalendarIcon, ShieldCheck, CreditCard, Banknote } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { rooms } from "@/data/hotel";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { saveLocalFallback } from "@/lib/demo";

const BOOKING_DRAFT_KEY = "SK_booking_draft";
const steps = ["Dates & Room", "Extras", "Guest Details", "Payment", "Confirmation"];

const extras = [
  { id: "breakfast", name: "Breakfast Anywhere", desc: "Served on your terrace, by the pool, or in the gardens.", price: 75 },
  { id: "spa", name: "Couples' Spa Ritual", desc: "Ninety minutes for two — shea & baobab oil massage.", price: 480 },
  { id: "paga", name: "Paga Crocodile Excursion", desc: "Chauffeured guided tour to the sacred Paga sanctuary and Pikworo slave camp.", price: 350 },
  { id: "chef", name: "Private Chef Dinner", desc: "Five-course Sahel tasting menu in your suite by our head chef.", price: 900 },
  { id: "transfer", name: "Chauffeured Transfer", desc: "Tamale airport pickup in a comfortable 4x4.", price: 380 },
];

const today = new Date(new Date().setHours(0, 0, 0, 0));

export default function Booking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const initialRoom = params.get("room") || rooms[0].id;

  const [step, setStep] = useState(0);
  const [room, setRoom] = useState(initialRoom);
  const [checkIn, setCheckIn] = useState<Date>(params.get("in") ? new Date(params.get("in")!) : addDays(new Date(), 14));
  const [checkOut, setCheckOut] = useState<Date>(params.get("out") ? new Date(params.get("out")!) : addDays(new Date(), 17));
  const [guests, setGuests] = useState(Number(params.get("guests") || 2));
  const [picked, setPicked] = useState<string[]>([]);
  const [info, setInfo] = useState({ firstName: "", lastName: "", email: "", phone: "", requests: "" });
  const [payMethod, setPayMethod] = useState<"paystack" | "in_person" | "stripe">("paystack");
  const [confirmationNumber, setConfNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState("");
  const [promoStatus, setPromoStatus] = useState("");

  // ── Restore booking draft after auth redirect ──────────────────────────────
  useEffect(() => {
    const draft = sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (draft && user) {
      try {
        const saved = JSON.parse(draft);
        setRoom(saved.room || initialRoom);
        setCheckIn(new Date(saved.checkIn));
        setCheckOut(new Date(saved.checkOut));
        setGuests(saved.guests || 2);
        setPicked(saved.picked || []);
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
        setStep(2); // Return to Guest Details step
        toast.success("Welcome back! Your booking details have been restored.");
      } catch {
        sessionStorage.removeItem(BOOKING_DRAFT_KEY);
      }
    }
  }, [user]);

  // ── Prefill from profile / auth user ──────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const metaFirst = (user.user_metadata?.first_name || user.user_metadata?.name?.split(" ")[0] || "").trim();
    const metaLast = (user.user_metadata?.last_name || user.user_metadata?.name?.split(" ").slice(1).join(" ") || "").trim();

    setInfo((i) => ({
      ...i,
      email: i.email || user.email || "",
      firstName: i.firstName || metaFirst || "",
      lastName: i.lastName || metaLast || "",
    }));

    (async () => {
      try {
        const { data } = await supabase.from("profiles").select("first_name,last_name,phone").eq("id", user.id).maybeSingle();
        if (data) {
          setInfo((i) => ({
            ...i,
            firstName: i.firstName || data.first_name || metaFirst || "",
            lastName: i.lastName || data.last_name || metaLast || "",
            phone: i.phone || data.phone || "",
          }));
        }
      } catch {
        // Supabase paused/offline fallback
      }
    })();
  }, [user]);

  const selected = rooms.find((r) => r.id === room)!;
  const nights = Math.max(1, differenceInDays(checkOut, checkIn));
  const roomTotal = selected.price * nights;
  const extrasTotal = picked.reduce((s, id) => s + (extras.find((e) => e.id === id)?.price ?? 0), 0);
  const discount = promoApplied === "BEJ10" ? Math.round(roomTotal * 0.1) : 0;
  const taxes = Math.round((roomTotal + extrasTotal - discount) * 0.1);
  const total = roomTotal + extrasTotal - discount + taxes;

  const applyPromo = () => {
    if (promoInput.toUpperCase() === "BEJ10") {
      setPromoApplied("BEJ10");
      setPromoStatus("Promo code BEJ10 applied — 10% discount added.");
      toast.success("Promo code applied!");
    } else {
      setPromoStatus("Invalid promo code. Please check and try again.");
      toast.error("Invalid promo code.");
    }
  };

  const next = () => {
    if (step === 0 && checkOut <= checkIn) {
      toast.error("Departure must be after arrival.");
      return;
    }
    // Save draft then redirect to auth — state is fully restored on return
    if (step === 1 && !user) {
      try {
        sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify({
          room, checkIn: checkIn.toISOString(), checkOut: checkOut.toISOString(), guests, picked,
        }));
      } catch { /* sessionStorage unavailable */ }
      toast.info("Please sign in to complete your reservation.");
      navigate(`/auth?redirect=${encodeURIComponent("/booking?room=" + room)}`);
      return;
    }
    if (step === 2) {
      const emailVal = (info.email || user?.email || "").trim();
      const firstVal = (info.firstName || user?.user_metadata?.first_name || user?.email?.split("@")[0] || "Guest").trim();
      const lastVal = (info.lastName || user?.user_metadata?.last_name || "Valued").trim();

      if (!emailVal) {
        toast.error("Please provide your email address for the confirmation.");
        return;
      }

      setInfo((prev) => ({
        ...prev,
        email: emailVal,
        firstName: prev.firstName || firstVal,
        lastName: prev.lastName || lastVal,
      }));
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));
  const togglePick = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const submitPayment = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/booking?room=" + room)}`);
      return;
    }
    setSubmitting(true);
    const conf = "BEJ-" + crypto.randomUUID().split("-")[0].toUpperCase();
    const pickedExtras = picked.map((id) => extras.find((e) => e.id === id)).filter(Boolean);

    try {
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        confirmation_number: conf,
        room_id: selected.id,
        room_name: selected.name,
        room_image: selected.image,
        room_category: selected.category,
        room_view: selected.view,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests,
        nights,
        extras: pickedExtras,
        room_total: roomTotal,
        extras_total: extrasTotal,
        taxes,
        total,
        currency: "GHS",
        status: "confirmed",
        special_requests: info.requests,
        guest_first_name: info.firstName,
        guest_last_name: info.lastName,
        guest_email: info.email,
        guest_phone: info.phone,
        payment_method: payMethod,
      }).select("id").maybeSingle();

      if (error) throw error;
    } catch {
      saveLocalFallback("SK_local_bookings", {
        id: `local-b-${Date.now()}`,
        user_id: user.id,
        confirmation_number: conf,
        room_name: selected.name,
        room_category: selected.category,
        room_view: selected.view,
        room_image: selected.image,
        check_in: format(checkIn, "yyyy-MM-dd"),
        check_out: format(checkOut, "yyyy-MM-dd"),
        guests,
        nights,
        total,
        status: "confirmed",
        payment_method: payMethod,
        created_at: new Date().toISOString(),
      });
    }

    setConfNumber(conf);
    toast.success("Reservation confirmed — confirmation receipt generated.");
    setSubmitting(false);
    setStep(steps.length - 1);
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />

      <section className="container-prose pt-40 pb-12">
        <div className="eyebrow mb-3">Reservations</div>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.05]">Reserve your stay</h1>
      </section>

      {/* ── Stepper — clickable for completed steps ───────────────────────── */}
      <section className="container-prose">
        <ol
          className="flex flex-wrap gap-x-10 gap-y-3 border-y border-border py-5"
          aria-label="Booking progress"
        >
          {steps.map((s, i) => {
            const isComplete = i < step;
            const isCurrent = i === step;
            const isNavigable = i < step;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => isNavigable && setStep(i)}
                  disabled={!isNavigable && !isCurrent}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`${s}${isComplete ? " (completed, click to return)" : isCurrent ? " (current)" : " (upcoming)"}`}
                  className={cn("flex items-center gap-3", isNavigable ? "cursor-pointer group" : "cursor-default")}
                >
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center text-[11px] border rounded-full transition-colors",
                    isComplete
                      ? "bg-primary text-primary-foreground border-primary"
                      : isCurrent
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground"
                  )}>
                    {isComplete ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn(
                    "text-[11px] uppercase tracking-[0.28em]",
                    isCurrent ? "text-foreground"
                      : isComplete ? "text-foreground/70 group-hover:text-foreground transition-colors"
                        : "text-muted-foreground"
                  )}>
                    {s}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="container-prose py-16 grid lg:grid-cols-[1.5fr_1fr] gap-16">
        <div>
          {/* STEP 0 — Dates & Room */}
          {step === 0 && (
            <div className="space-y-10 animate-fade-in">
              <div className="grid sm:grid-cols-3 gap-px bg-border">
                <DateField label="Arrival" date={checkIn} onChange={(d) => d && setCheckIn(d)} disabledDays={(d) => d < today} />
                <DateField label="Departure" date={checkOut} onChange={(d) => d && setCheckOut(d)} disabledDays={(d) => d <= checkIn} />
                <div className="bg-card px-6 py-5">
                  <label htmlFor="booking-guests" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2 block">Guests</label>
                  <select id="booking-guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="bg-transparent font-display text-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>{g} {g === 1 ? "Guest" : "Guests"}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <h2 className="font-display text-3xl mb-6">Choose your residence</h2>
                <div className="grid gap-4">
                  {rooms.map((r) => (
                    <label key={r.id} className={cn(
                      "flex gap-6 p-5 border cursor-pointer transition-all",
                      room === r.id ? "border-primary bg-primary/5" : "border-border hover:border-foreground"
                    )}>
                      <input type="radio" checked={room === r.id} onChange={() => setRoom(r.id)} className="sr-only" />
                      <img src={r.image} alt={r.name} loading="lazy" className="w-32 h-32 object-cover" />
                      <div className="flex-1">
                        <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{r.category} · {r.view} View</div>
                        <div className="font-display text-2xl">{r.name}</div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.shortDescription}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-2xl">₵{r.price.toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">/ night</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Extras */}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-3xl mb-2">Compose your stay</h2>
              <p className="text-muted-foreground mb-8">Optional extras, curated by our concierge.</p>
              <div className="space-y-3">
                {extras.map((e) => {
                  const active = picked.includes(e.id);
                  return (
                    <button key={e.id} onClick={() => togglePick(e.id)}
                      aria-pressed={active}
                      className={cn(
                        "w-full text-left flex justify-between gap-6 p-6 border transition-all",
                        active ? "border-primary bg-primary/5" : "border-border hover:border-foreground"
                      )}>
                      <div>
                        <div className="font-display text-xl">{e.name}</div>
                        <p className="text-sm text-muted-foreground mt-1">{e.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-xl">₵{e.price}</div>
                        <div className={cn("text-[10px] uppercase tracking-[0.28em] mt-2 flex items-center gap-1 justify-end", active ? "text-primary" : "text-muted-foreground")}>
                          {active ? <><Check className="w-3 h-3" aria-hidden="true" /> Added</> : "Add"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Guest Details */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-3xl mb-8">Guest details</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <GuestInput label="First name" value={info.firstName} onChange={(v) => setInfo({ ...info, firstName: v })} autoComplete="given-name" />
                <GuestInput label="Last name" value={info.lastName} onChange={(v) => setInfo({ ...info, lastName: v })} autoComplete="family-name" />
                <GuestInput label="Email" type="email" value={info.email} onChange={(v) => setInfo({ ...info, email: v })} autoComplete="email" />
                {/* Phone — type="tel" triggers numeric keyboard on mobile */}
                <div>
                  <label htmlFor="phone" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={info.phone}
                    onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                    placeholder="+233 XX XXX XXXX"
                    className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Include country code, e.g. +233 for Ghana</p>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="booking-requests" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Special requests</label>
                  <textarea
                    id="booking-requests"
                    value={info.requests}
                    onChange={(e) => setInfo({ ...info, requests: e.target.value })}
                    rows={4}
                    placeholder="Anniversary, dietary needs, early check-in…"
                    className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Payment */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="font-display text-3xl mb-2">Secure payment</h2>
              <p className="text-muted-foreground mb-8">Encrypted by industry standard. No charge until check-in.</p>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                <button
                  type="button"
                  onClick={() => setPayMethod("paystack")}
                  aria-pressed={payMethod === "paystack"}
                  className={cn(
                    "p-5 border text-left transition-all relative overflow-hidden",
                    payMethod === "paystack" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-foreground"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-lg">Paystack Online</span>
                    <CreditCard className="w-5 h-5 text-primary opacity-80" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Mobile Money (MTN, Telecel, AT), Cards & Instant Bank Transfer.</p>
                  <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-wider font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">MTN MoMo</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Telecel</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Visa/Mastercard</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod("in_person")}
                  aria-pressed={payMethod === "in_person"}
                  className={cn(
                    "p-5 border text-left transition-all relative overflow-hidden",
                    payMethod === "in_person" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-foreground"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-lg">Pay in Person</span>
                    <Banknote className="w-5 h-5 text-primary opacity-80" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Pay with Cash, MoMo, or POS terminal at the front desk upon arrival.</p>
                  <div className="flex flex-wrap gap-1.5 text-[9px] uppercase tracking-wider font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Cash (₵)</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Front Desk POS</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Pay on Arrival</span>
                  </div>
                </button>
              </div>

              <div className="p-6 border border-border bg-card">
                {payMethod === "paystack" && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs uppercase tracking-widest rounded-full mb-3">
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" /> 256-Bit SSL Encrypted
                    </div>
                    <p className="text-sm text-foreground mb-2">
                      Secure checkout powered by <strong>Paystack</strong>. Accepts Ghana MoMo and international cards.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your booking is registered instantly and confirmed with our front desk.
                    </p>
                  </div>
                )}
                {payMethod === "in_person" && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs uppercase tracking-widest rounded-full mb-3">
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Guaranteed Reservation
                    </div>
                    <p className="text-sm text-foreground mb-2">
                      No online charge required today. Your suite will be reserved and held until your check-in date.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please settle your total bill (₵{total.toLocaleString()}) at the reception upon arrival in Navrongo.
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-6 text-xs text-muted-foreground text-center">
                {payMethod === "in_person"
                  ? "By confirming, you agree to our reservation terms and check-in policies."
                  : "By confirming, you agree to our cancellation policy. Payments processed securely via Paystack."}
              </p>
            </div>
          )}

          {/* STEP 4 — Confirmation */}
          {step === 4 && (
            <div className="animate-fade-in text-center py-16">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-8">
                <Check className="w-9 h-9 text-primary" aria-hidden="true" />
              </div>
              <h2 className="font-display text-4xl md:text-5xl mb-4">Welcome, {info.firstName || "guest"}.</h2>
              <p className="text-muted-foreground text-lg max-w-md mx-auto mb-2">Your reservation is confirmed.</p>
              {/* ── Fixed: removed false "sent to your inbox" promise ── */}
              <p className="text-sm text-muted-foreground mb-10">
                Reference: <strong>{confirmationNumber}</strong>
                {info.email && (
                  <> · A receipt has been added to your{" "}
                    <Link to="/dashboard" className="underline hover:text-foreground transition-colors">dashboard</Link>.
                  </>
                )}
              </p>
              <div className="inline-block border border-border p-10 text-left">
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                  <div className="text-muted-foreground">Residence</div><div className="font-display text-lg">{selected.name}</div>
                  <div className="text-muted-foreground">Arrival</div><div className="font-display text-lg">{format(checkIn, "EEE d MMM yyyy")}</div>
                  <div className="text-muted-foreground">Departure</div><div className="font-display text-lg">{format(checkOut, "EEE d MMM yyyy")}</div>
                  <div className="text-muted-foreground">Guests</div><div className="font-display text-lg">{guests}</div>
                  <div className="text-muted-foreground">Total</div><div className="font-display text-lg text-primary">₵{total.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-10 flex justify-center gap-4">
                <Link to="/dashboard" className="btn-gilded">View my dashboard</Link>
                <Link to="/rooms" className="btn-ghost-line">Browse more</Link>
              </div>
            </div>
          )}

          {/* ── Navigation buttons ────────────────────────────────────────── */}
          {step < 4 && (
            <div className="flex justify-between mt-12 pt-8 border-t border-border">
              <button
                onClick={back}
                disabled={step === 0}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] disabled:opacity-30"
                aria-label={step === 0 ? "Cannot go back from first step" : "Go to previous step"}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Back
              </button>
              {step < 3 ? (
                <button onClick={next} className="btn-gilded">
                  Continue <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={submitPayment}
                  disabled={submitting}
                  className="btn-gilded disabled:opacity-50"
                  aria-live="polite"
                >
                  {submitting ? "Processing…" : "Confirm Reservation"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Booking Summary Sidebar ─────────────────────────────────────── */}
        {step < 4 && (
          <aside className="lg:sticky lg:top-32 self-start" aria-label="Booking summary">
            <div className="bg-card border border-border p-8">
              <div className="eyebrow mb-4">Your Stay</div>
              <img src={selected.image} alt={selected.name} loading="lazy" className="w-full aspect-[4/3] object-cover mb-5" />
              <div className="font-display text-2xl">{selected.name}</div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mt-1">{selected.category} · {selected.view} View</div>

              <div className="mt-6 space-y-3 text-sm border-t border-border pt-6">
                <Row label="Arrival" value={format(checkIn, "EEE d MMM")} />
                <Row label="Departure" value={format(checkOut, "EEE d MMM")} />
                <Row label="Nights" value={String(nights)} />
                <Row label="Guests" value={String(guests)} />
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                <Row label={`Room · ${nights}×₵${selected.price.toLocaleString()}`} value={`₵${roomTotal.toLocaleString()}`} />
                {extrasTotal > 0 && <Row label={`Extras (${picked.length})`} value={`₵${extrasTotal.toLocaleString()}`} />}
                {promoApplied && <Row label={`Promo (${promoApplied})`} value={`-₵${discount.toLocaleString()}`} />}
                <Row label="Taxes & service" value={`₵${taxes.toLocaleString()}`} />
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                {/* Promo field hidden on payment step to reduce distraction */}
                {!promoApplied && step < 3 && (
                  <div className="flex gap-2 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                        placeholder="Promo code"
                        aria-label="Promotional code"
                        aria-describedby="promo-feedback"
                        className="w-full bg-transparent border-b border-border py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary uppercase"
                      />
                      {/* aria-live region announces promo result to screen readers */}
                      <span id="promo-feedback" className="sr-only" aria-live="polite">{promoStatus}</span>
                    </div>
                    <button onClick={applyPromo} className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground hover:text-foreground">Apply</button>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] uppercase tracking-[0.32em]">Total</span>
                  <span className="font-display text-3xl text-primary">₵{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </section>

      <Footer />
    </div>
  );
}

function DateField({ label, date, onChange, disabledDays }: {
  label: string;
  date: Date;
  onChange: (d?: Date) => void;
  disabledDays?: (d: Date) => boolean;
}) {
  return (
    <div className="bg-card px-6 py-5">
      <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">{label}</div>
      <Popover>
        <PopoverTrigger className="flex items-center gap-3 font-display text-lg" aria-label={`${label}: ${format(date, "EEE d MMM yyyy")}`}>
          <CalendarIcon className="w-4 h-4 opacity-60" aria-hidden="true" />
          {format(date, "EEE d MMM")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={onChange}
            disabled={disabledDays}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function GuestInput({ label, value, onChange, type = "text", placeholder, autoComplete }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
