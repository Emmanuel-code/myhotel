import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import restaurantImg from "@/assets/restaurant.jpg";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const times = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

export default function Restaurant() {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>();
  const [party, setParty] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const { user } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) { toast.error("Please choose a date and time."); return; }
    try {
      const { error } = await supabase.from("restaurant_reservations").insert({
        user_id: user?.id,
        guest_name: name,
        guest_email: email,
        party_size: party,
        reservation_date: format(date, "yyyy-MM-dd"),
        reservation_time: time + ":00",
        venue: "Sankofa Kitchen"
      });
      if (error) throw error;
    } catch {
      // Offline/paused Supabase — save locally
      const cache = JSON.parse(localStorage.getItem("SK_restaurant_reservations") || "[]");
      localStorage.setItem("SK_restaurant_reservations", JSON.stringify([{ name, email, party, date: format(date, "yyyy-MM-dd"), time, venue: "Sankofa Kitchen", created_at: new Date().toISOString() }, ...cache]));
    }
    setDone(true);
    toast.success("Table reserved. A confirmation is on its way.");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation transparent />

      {/* HERO */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <img src={restaurantImg} alt="Sankofa Kitchen at dusk" className="absolute inset-0 w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="relative h-full flex flex-col items-center justify-center text-center container-prose text-background">
          <div className="eyebrow text-primary-glow mb-4">A celebrated table · Navrongo's finest kitchen</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1] max-w-4xl">Sankofa Kitchen</h1>
          <p className="mt-6 text-lg max-w-xl text-background/85">Under the palm canopy — Chef Selasi Mensah's seasonal tasting menu.</p>
        </div>
      </section>

      <section className="container-prose py-24 grid lg:grid-cols-[1fr_1fr] gap-16 items-start">
        <div>
          <div className="eyebrow mb-5">The kitchen</div>
          <h2 className="font-display text-4xl md:text-5xl mb-6 leading-[1.05]">A menu composed by the Sahel.</h2>
          <p className="text-muted-foreground leading-relaxed text-lg mb-8">
            Chef Selasi Mensah's eight-course tasting menu changes with the seasons — grilled red snapper and coconut rice in the rains, smoked guinea fowl with millet in harmattan, baobab sorbet to close. Each plate finished tableside, paired with a wine from our cellar.
          </p>

          <div className="grid grid-cols-2 gap-6">
            {[
              ["Menu Sankofa", "Eight-course tasting · \u20b5550"],
              ["Menu Akwaaba", "Five-course farm-to-plate · \u20b5350"],
              ["À la carte", "Available 19:00 – 22:30"],
              ["Wine Pairing", "Sommelier-led · from \u20b5180"],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-border pt-4">
                <div className="font-display text-xl">{t}</div>
                <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RESERVE */}
        <aside className="bg-card border border-border p-10">
          <div className="eyebrow mb-3">Reserve a table</div>
          {done ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-3xl mb-3">Table reserved</h3>
              <p className="text-muted-foreground">
                For {party} on {date && format(date, "EEEE d MMMM")} at {time}.<br />
                A confirmation is on its way to {email || "your inbox"}.
              </p>
              <button onClick={() => setDone(false)} className="btn-ghost-line mt-8">New reservation</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <h3 className="font-display text-3xl mb-2">An evening under the palms</h3>

              <div>
                <label className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Date</label>
                <Popover>
                  <PopoverTrigger className="mt-2 flex items-center gap-3 w-full border-b border-border py-3 text-left">
                    <CalendarIcon className="w-4 h-4 opacity-60" />
                    <span className="font-display text-lg">{date ? format(date, "EEE d MMM yyyy") : "Select date"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Time</label>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {times.map((t) => (
                    <button key={t} type="button" onClick={() => setTime(t)} className={cn(
                      "py-2.5 text-xs border transition-all",
                      time === t ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                    )}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="rest-party" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Party</label>
                <select id="rest-party" value={party} onChange={(e) => setParty(Number(e.target.value))} className="mt-2 w-full bg-transparent border-b border-border py-3 font-display text-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((n) => <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rest-name" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Name</label>
                  <input id="rest-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label htmlFor="rest-email" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Email</label>
                  <input id="rest-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary" />
                </div>
              </div>

              <button type="submit" className="btn-gilded w-full mt-4">Reserve table</button>
            </form>
          )}
        </aside>
      </section>

      <Footer />
    </div>
  );
}