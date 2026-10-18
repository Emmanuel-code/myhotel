import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Quote, MapPin, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BookingWidget from "@/components/BookingWidget";
import RoomCard from "@/components/RoomCard";
import SectionHeading from "@/components/SectionHeading";
import { rooms, experiences, reviews } from "@/data/hotel";
import heroVilla from "@/assets/hero-villa.jpg";
import restaurantImg from "@/assets/restaurant.jpg";
import spaImg from "@/assets/spa.jpg";
import eventsImg from "@/assets/events.jpg";

export default function Index() {
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setReviewIndex((i) => (i + 1) % reviews.length), 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-background text-foreground">
      <Navigation transparent />

      {/* HERO */}
      <section className="relative h-screen min-h-[760px] w-full overflow-hidden">
        <img
          src={heroVilla}
          alt="SK Royal Hotel   Navrongo at golden hour"
          width={1920}
          height={1280}
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />
        {/* Warm Saharan Twilight Scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-[#0F0C09]/95" />

        <div className="relative h-full flex flex-col items-center justify-center text-center text-white container-prose">
          <div>
            <div className="reveal-wrapper mb-6">
              <div className="reveal-text text-[10px] tracking-[0.5em] uppercase text-primary-glow font-medium">
                Navrongo · Upper East Region · Ghana
              </div>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-[108px] leading-[0.96] max-w-5xl">
              <span className="reveal-wrapper">
                <span className="reveal-text" style={{ animationDelay: "150ms" }}>
                  Northern <span className="italic text-primary-glow">elegance</span>,
                </span>
              </span>
              <br />
              <span className="reveal-wrapper">
                <span className="reveal-text" style={{ animationDelay: "300ms" }}>
                  a haven of <span className="italic text-primary-glow">luxury</span>.
                </span>
              </span>
            </h1>

            <div className="reveal-wrapper mt-8">
              <p
                className="reveal-text text-base md:text-lg text-white/85 max-w-xl mx-auto leading-relaxed"
                style={{ animationDelay: "450ms" }}
              >
                Executive suites, authentic Sahel &amp; Continental gastronomy, modern conference spaces, and unmatched northern warmth.
              </p>
            </div>
          </div>

          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center reveal-wrapper"
          >
            <div className="reveal-text flex flex-col items-center" style={{ animationDelay: "600ms" }}>
              <div className="text-[9px] tracking-[0.4em] uppercase text-white/60 mb-3">Scroll to explore</div>
              <div className="w-[1px] h-10 bg-white/20 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-amber-200/90 animate-[scroll-indicator_2.2s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING WIDGET — floating, overlapping hero */}
      <section className="relative -mt-20 z-10 container-prose">
        <div className="animate-rise" style={{ animationDelay: "800ms" }}>
          <BookingWidget />
        </div>
      </section>

      {/* INTRO */}
      <section className="container-prose pt-32 pb-24 grid lg:grid-cols-[1fr_1.4fr] gap-16 items-start">
        <div className="lg:sticky lg:top-32">
          <div className="eyebrow mb-5">Welcome to SK Royal Hotel  </div>
          <h2 className="font-display text-5xl md:text-6xl leading-[1.05]">
            Navrongo&apos;s premier <em className="text-primary not-italic font-light">hospitality</em> and lifestyle retreat.
          </h2>
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            Conveniently situated in the historic and academic hub of Navrongo, SK Royal Hotel   sets a new benchmark for luxury and executive comfort across the Upper East Region.
          </p>
          <p>
            Whether visiting for business, academic research at CKT-UTAS, tourism excursions to Paga and Sirigu, or hosting an unforgettable wedding or high-level summit, SK Royal Hotel   welcomes you with air-conditioned comfort, exquisite dining, and 24/7 uninterrupted power & security.
          </p>
          <div className="pt-6 flex items-center gap-8 flex-wrap">
            <Stat label="Luxury Rooms & Suites" value="30+" />
            <Stat label="Conference Capacity" value="250" />
            <Stat label="Secured Parking" value="100%" />
            <Stat label="Service Standard" value="5-Star" />
          </div>
        </div>
      </section>

      {/* ACCOMMODATIONS */}
      <section className="container-prose py-24">
        <div className="flex items-end justify-between mb-14 flex-wrap gap-6">
          <SectionHeading eyebrow="Accommodations" title={"Executive Suites &\nChalets"} />
          <Link to="/rooms" className="text-xs uppercase tracking-[0.28em] text-primary link-underline mb-2">View all rooms</Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {rooms.slice(0, 3).map((room, i) => <RoomCard key={room.id} room={room} index={i} />)}
        </div>
      </section>

      {/* EXPERIENCES — staggered editorial grid */}
      <section className="bg-secondary py-32 mt-16">
        <div className="container-prose">
          <SectionHeading eyebrow="Tours & Experiences" title="Explore Northern Heritage" copy="Curated local excursions, cultural experiences, and signature moments arranged by our front desk and tour concierge." />

          <div className="grid md:grid-cols-12 gap-6 md:gap-8">
            {experiences.map((e, i) => {
              const span = [
                "md:col-span-7 md:row-span-2 aspect-[4/5] md:aspect-[5/6]",
                "md:col-span-5 aspect-[4/5]",
                "md:col-span-5 aspect-[4/5]",
                "md:col-span-7 aspect-[16/10]",
              ][i];
              return (
                <div key={e.id} className={`group relative overflow-hidden ${span} animate-rise`} style={{ animationDelay: `${i * 100}ms` }}>
                  <img src={e.image} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-background">
                    <div className="eyebrow text-primary-glow mb-3">{e.eyebrow}</div>
                    <h3 className="font-display text-3xl md:text-4xl mb-3">{e.title}</h3>
                    <p className="text-background/85 max-w-md text-sm md:text-base leading-relaxed">{e.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PILLARS: DINING, SPA, EVENTS */}
      <section className="container-prose py-32 space-y-32">
        <Pillar
          eyebrow="Dining & Lounge"
          title="SK Royal Restaurant & Terrace"
          copy="Delicious local Ghanaian favorites, grilled guinea fowl, and rich continental cuisine prepared with fresh local produce."
          cta={{ to: "/restaurant", label: "View Restaurant Menu" }}
          image={restaurantImg}
        />
        <Pillar
          reverse
          eyebrow="Wellness & Relaxation"
          title="Poolside Oasis & Rejuvenation"
          copy="Unwind under the Sahel sun. Enjoy revitalizing wellness treatments, cool poolside drinks, and calm evening ambiance."
          cta={{ to: "/spa", label: "Discover Wellness" }}
          image={spaImg}
        />
        <Pillar
          eyebrow="Conferences & Celebrations"
          title="Modern Events & Banqueting Hall"
          copy="Fully air-conditioned halls equipped with audiovisual technology, backup power, and custom catering for corporate meetings, workshops, and weddings."
          cta={{ to: "/events", label: "Inquire for an Event" }}
          image={eventsImg}
        />
      </section>

      {/* REVIEWS */}
      <section className="bg-foreground text-background py-32">
        <div className="container-prose">
          <SectionHeading eyebrow="Testimonials" title="What our guests say" align="center" invert />

          <div
            className="max-w-3xl mx-auto text-center min-h-[260px] relative"
            aria-live="polite"
            aria-label="Guest reviews carousel"
            role="region"
          >
            {reviews.map((r, i) => (
              <div
                key={r.id}
                aria-hidden={i !== reviewIndex}
                className={`absolute inset-0 transition-opacity duration-1000 ${i === reviewIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <Quote className="w-10 h-10 text-primary mx-auto mb-6" aria-hidden="true" />
                <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-[1.3] italic">
                  &ldquo;{r.quote}&rdquo;
                </p>
                <div className="mt-10 flex flex-col items-center gap-2">
                  <div className="flex gap-1" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: r.rating }).map((_, k) => <Star key={k} className="w-3.5 h-3.5 fill-primary text-primary" aria-hidden="true" />)}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.32em] text-background/70">{r.name} · {r.origin}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 mt-12">
            <button
              onClick={() => setReviewIndex((i) => (i - 1 + reviews.length) % reviews.length)}
              className="w-11 h-11 border border-background/30 flex items-center justify-center hover:bg-background hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setReviewIndex((i) => (i + 1) % reviews.length)}
              className="w-11 h-11 border border-background/30 flex items-center justify-center hover:bg-background hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* LOCATION */}
      <section className="container-prose py-32 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <SectionHeading eyebrow="Location & Connectivity" title="In the heart of Navrongo" copy="Strategically located near major landmarks, academic institutions, and cultural destinations in the Kassena-Nankana district." />
          <div className="grid grid-cols-2 gap-6 mt-10">
            {[
              ["CKT-UTAS Navrongo Campus", "4 min drive"],
              ["Navrongo Mud Cathedral", "6 min drive"],
              ["Paga Crocodile Sanctuary", "18 min drive"],
              ["Bolgatanga Town Center", "25 min drive"],
            ].map(([place, time]) => (
              <div key={place} className="border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /> {time}</div>
                <div className="font-display text-xl mt-1">{place}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative aspect-square bg-secondary overflow-hidden flex items-center justify-center border border-border p-6 text-center">
          <div className="space-y-4">
            <MapPin className="w-12 h-12 text-primary mx-auto animate-bounce" />
            <h3 className="font-display text-3xl">SK Royal Hotel  </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Navrongo, Upper East Region, Ghana.<br />
              Near CKT-UTAS & Main Commercial District.
            </p>
            <div className="pt-2 text-xs font-mono tracking-widest text-primary uppercase">
              Free Secured Parking & Shuttle Available
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative h-[60vh] min-h-[480px] overflow-hidden">
        <img src={heroVilla} alt="SK Royal Hotel   Navrongo" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/65" />
        <div className="relative h-full flex flex-col items-center justify-center text-center text-background container-prose">
          <div className="eyebrow text-primary-glow mb-5">Plan Your Navrongo Stay</div>
          <h2 className="font-display text-5xl md:text-7xl max-w-3xl leading-[1.05]">
            Experience comfort in <em className="text-primary-glow not-italic">Navrongo</em>.
          </h2>
          <Link to="/booking" className="mt-10 btn-gilded">Book your room now</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-4xl text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Pillar({
  eyebrow, title, copy, cta, image, reverse,
}: {
  eyebrow: string; title: string; copy: string;
  cta: { to: string; label: string }; image: string; reverse?: boolean;
}) {
  return (
    <div className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}>
      <div className="relative aspect-[4/5] overflow-hidden group">
        <img src={image} alt={title} loading="lazy" className="w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
      </div>
      <div>
        <div className="eyebrow mb-5">{eyebrow}</div>
        <h3 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-lg mb-8 max-w-md">{copy}</p>
        <Link to={cta.to} className="btn-ghost-line">{cta.label}</Link>
      </div>
    </div>
  );
}
