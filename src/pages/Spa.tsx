import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import spaImg from "@/assets/spa.jpg";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const treatments = [
  { id: "shea", name: "Shea & Baobab Ritual", duration: "90 min", price: 240, desc: "A warming full-body massage with unrefined Northern shea butter and baobab seed oil." },
  { id: "stone", name: "Volcanic Stone Therapy", duration: "75 min", price: 210, desc: "Heated basalt stones eased along the meridian lines — for travel fatigue and deep stillness." },
  { id: "facial", name: "Hibiscus & Gold Facial", duration: "60 min", price: 180, desc: "A signature lift with 24k gold leaf and Ghanaian hibiscus — radiance in a single sitting." },
  { id: "couples", name: "Couples' Cliffside Suite", duration: "120 min", price: 540, desc: "Side-by-side ritual in the cliffside suite — soaking tub, candlelight, glass of champagne." },
];

export default function Spa() {
  const [picked, setPicked] = useState<string>("shea");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { user } = useAuth();
  const t = treatments.find((x) => x.id === picked)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) { toast.error("Choose a date and time."); return; }
    try {
      const { error } = await supabase.from("spa_appointments").insert({
        user_id: user?.id,
        guest_name: name,
        guest_email: email,
        treatment: t.name,
        appointment_date: format(date, "yyyy-MM-dd"),
        appointment_time: time + ":00",
        duration_minutes: parseInt(t.duration),
        price: t.price
      });
      if (error) throw error;
    } catch {
      // Offline/paused Supabase — save locally
      const cache = JSON.parse(localStorage.getItem("SK_spa_bookings") || "[]");
      localStorage.setItem("SK_spa_bookings", JSON.stringify([{ name, email, treatment: t.name, date: format(date, "yyyy-MM-dd"), time, created_at: new Date().toISOString() }, ...cache]));
    }
    setDone(true);
    toast.success("Ritual booked. We await you at the spa.");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation transparent />

      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <img src={spaImg} alt="Asaase Spa" className="absolute inset-0 w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-foreground/55" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-background container-prose">
          <div className="eyebrow text-primary-glow mb-4">Asaase Spa</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl max-w-3xl leading-[1]">A ritual, by candlelight.</h1>
          <p className="mt-6 text-lg max-w-xl text-background/85">Carved into the cliffside. Composed around the Ghanaian seasons.</p>
        </div>
      </section>

      <section className="container-prose py-24 grid lg:grid-cols-[1.2fr_1fr] gap-16">
        <div>
          <div className="eyebrow mb-5">Rituals</div>
          <h2 className="font-display text-4xl md:text-5xl mb-10">Choose your ritual</h2>

          <div className="space-y-3">
            {treatments.map((tr) => (
              <button key={tr.id} onClick={() => setPicked(tr.id)} className={cn(
                "w-full text-left p-6 border transition-all",
                picked === tr.id ? "border-primary bg-primary/5" : "border-border hover:border-foreground"
              )}>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <div className="font-display text-2xl">{tr.name}</div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{tr.desc}</p>
                    <div className="flex items-center gap-2 mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      <Clock className="w-3 h-3" /> {tr.duration}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-2xl">${tr.price}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-32 self-start bg-card border border-border p-10">
          <div className="eyebrow mb-3">Book your ritual</div>
          {done ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-3xl mb-3">Booked</h3>
              <p className="text-muted-foreground">{t.name} · {date && format(date, "EEE d MMM")} at {time}.</p>
              <button onClick={() => setDone(false)} className="btn-ghost-line mt-8">Book another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              <h3 className="font-display text-3xl">{t.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {t.duration}</span>
                <span>${t.price}</span>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Date</label>
                <Popover>
                  <PopoverTrigger className="mt-2 flex items-center gap-3 w-full border-b border-border py-3 text-left">
                    <CalendarIcon className="w-4 h-4 opacity-60" />
                    <span className="font-display text-lg">{date ? format(date, "EEE d MMM") : "Select date"}</span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Time</label>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {["10:00", "11:30", "14:00", "15:30", "17:00", "18:30"].map((tm) => (
                    <button key={tm} type="button" onClick={() => setTime(tm)} className={cn(
                      "py-2.5 text-xs border transition-all",
                      time === tm ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                    )}>{tm}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="spa-name" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Name</label>
                  <input id="spa-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label htmlFor="spa-email" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Email</label>
                  <input id="spa-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary" />
                </div>
              </div>

              <button type="submit" className="btn-gilded w-full mt-4">Book ritual</button>
            </form>
          )}
        </aside>
      </section>

      <Footer />
    </div>
  );
}
