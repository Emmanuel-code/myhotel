import { useState } from "react";
import { Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
const eventsImg = "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80"; // garden wedding table setting
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHotelBrand } from "@/hooks/useHotelBrand";

export default function Events() {
  const { brand } = useHotelBrand();
  const [form, setForm] = useState({ name: "", email: "", phone: "", type: "Wedding", date: "", guests: "", message: "" });
  const [done, setDone] = useState(false);

  const { user } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("event_inquiries").insert({
        user_id: user?.id,
        guest_name: form.name,
        guest_email: form.email,
        guest_phone: form.phone,
        event_type: form.type,
        preferred_date: form.date || null,
        estimated_guests: form.guests ? parseInt(form.guests) : null,
        message: form.message
      });
      if (error) throw error;
    } catch {
      // Offline fallback: save locally
      const inquiries = JSON.parse(localStorage.getItem("SK_event_inquiries") || "[]");
      localStorage.setItem("SK_event_inquiries", JSON.stringify([{ ...form, id: Date.now(), created_at: new Date().toISOString() }, ...inquiries]));
    }
    setDone(true);
    toast.success("Inquiry received — our events director will be in touch within 24 hours.");
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation transparent />

      <section className="relative h-[85vh] min-h-[640px] overflow-hidden">
        <img src={eventsImg} alt="Savannah luxury ceremony" className="absolute inset-0 w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-foreground/55" />
        <div className="relative h-full flex flex-col items-center justify-center text-center container-prose text-background">
          <div className="eyebrow text-primary-glow mb-4">Weddings & Private Events</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl max-w-4xl leading-[1]">
            A ceremony framed by <em className="text-primary-glow not-italic">palm</em> and savannah.
          </h1>
        </div>
      </section>

      <section className="container-prose py-24 grid md:grid-cols-3 gap-12">
        {[
          ["Intimate", "Up to 30 guests · Garden gazebo or terrace overlooking the landscaped gardens."],
          ["Private", "30 – 80 guests · Exclusive use of the banquet pavilion and landscaped grounds."],
          ["Grand", "80 – 250 guests · Full estate buyout, ballroom, gardens, and VIP suites."],
        ].map(([t, d]) => (
          <div key={t} className="border-t border-border pt-6">
            <div className="eyebrow mb-3">{t}</div>
            <p className="font-display text-2xl leading-snug">{d}</p>
          </div>
        ))}
      </section>

      <section className="bg-secondary py-24">
        <div className="container-prose grid lg:grid-cols-[1fr_1.2fr] gap-16 items-start">
          <div>
            <div className="eyebrow mb-5">Begin a conversation</div>
            <h2 className="font-display text-4xl md:text-5xl leading-[1.05] mb-6">Tell us about your day.</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Our events team personally orchestrates every wedding, academic summit, and private reception at {brand.name} in {brand.town}. Share a few details below and we will be in touch within 24 hours.
            </p>
            <div className="mt-10 space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Events Director</span><span>Ama Owusu</span></div>
              <div className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Phone</span><span>+233 (0) 50 123 4567</span></div>
              <div className="flex justify-between border-b border-border pb-3"><span className="text-muted-foreground">Email</span><span>events@yourhotel.com</span></div>
            </div>
          </div>

          {done ? (
            <div className="bg-card border border-border p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-3xl mb-3">Thank you, {form.name || "we have your note"}.</h3>
              <p className="text-muted-foreground">Ama will reach out within 24 hours to begin the conversation.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-card border border-border p-10 grid sm:grid-cols-2 gap-6">
              <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div>
                <label htmlFor="event-type" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Event type</label>
                <select id="event-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="mt-2 w-full bg-transparent border-b border-border py-3 font-display text-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary">
                  {["Wedding", "Anniversary", "Corporate", "Private Dinner", "Other"].map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <Field label="Preferred date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
              <Field label="Estimated guests" type="number" value={form.guests} onChange={(v) => setForm({ ...form, guests: v })} />
              <div className="sm:col-span-2">
                <label htmlFor="event-message" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">Tell us more</label>
                <textarea id="event-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary" />
              </div>
              <button type="submit" className="btn-gilded sm:col-span-2 mt-4">Send inquiry</button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  const id = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={id} className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="mt-2 w-full bg-transparent border-b border-border py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary" />
    </div>
  );
}
