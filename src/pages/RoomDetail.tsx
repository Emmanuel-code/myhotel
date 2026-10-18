import { Link, useParams, useNavigate } from "react-router-dom";
import { Check, ArrowLeft, Bed, Maximize, Users, Eye } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { rooms } from "@/data/hotel";

export default function RoomDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const room = rooms.find((r) => r.id === id);

  if (!room) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Residence not found.</p>
          <Link to="/rooms" className="btn-ghost-line">Browse all residences</Link>
        </div>
      </div>
    );
  }

  const similar = rooms.filter((r) => r.id !== room.id).slice(0, 3);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />

      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <img src={room.image} alt={room.name} className="absolute inset-0 w-full h-full object-cover animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-foreground/30" />
        <div className="relative h-full flex flex-col justify-end container-prose pb-20 text-background">
          <button onClick={() => window.history.length > 2 ? nav(-1) : nav("/rooms")} className="self-start flex items-center gap-2 text-xs uppercase tracking-[0.28em] mb-8 opacity-80 hover:opacity-100">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="eyebrow text-primary-glow mb-4">{room.category} · {room.view} View</div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl max-w-3xl leading-[1]">{room.name}</h1>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border">
        <div className="container-prose grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          <Stat icon={<Maximize className="w-4 h-4" />} label="Size" value={`${room.size} m²`} />
          <Stat icon={<Users className="w-4 h-4" />} label="Guests" value={`Up to ${room.capacity}`} />
          <Stat icon={<Bed className="w-4 h-4" />} label="Bed" value={room.beds} />
          <Stat icon={<Eye className="w-4 h-4" />} label="View" value={`${room.view}-facing`} />
        </div>
      </section>

      {/* Body */}
      <section className="container-prose py-24 grid lg:grid-cols-[1.4fr_1fr] gap-20">
        <div>
          <div className="eyebrow mb-5">The residence</div>
          <p className="font-display text-3xl md:text-4xl leading-[1.2] mb-10">{room.description}</p>

          <div className="mt-16">
            <div className="eyebrow mb-6">Amenities & Services</div>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {room.amenities.map((a) => (
                <li key={a} className="flex items-center gap-3 py-3 border-b border-border text-sm">
                  <Check className="w-4 h-4 text-primary shrink-0" /> {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Reserve card */}
        <aside className="lg:sticky lg:top-32 self-start">
          <div className="bg-card border border-border p-10 shadow-soft">
            <div className="eyebrow mb-4">Reserve · From</div>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="font-display text-6xl">₵{room.price.toLocaleString()}</span>
              <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">/ night</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Rate includes breakfast for two, daily turndown, complimentary spa access and our welcome amaro at arrival.
            </p>
            <Link to={`/booking?room=${room.id}`} className="btn-gilded w-full">Reserve this residence</Link>
            <div className="mt-6 text-[10px] uppercase tracking-[0.32em] text-muted-foreground text-center">
              Best rate guaranteed · Free cancellation 14 days prior
            </div>
          </div>
        </aside>
      </section>

      {/* Similar */}
      <section className="bg-secondary py-24">
        <div className="container-prose">
          <div className="eyebrow mb-4">Continue exploring</div>
          <h2 className="font-display text-4xl md:text-5xl mb-14">Other residences</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {similar.map((r, i) => <RoomCard key={r.id} room={r} index={i} />)}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="px-6 py-8 flex flex-col items-center text-center">
      <div className="text-primary mb-2">{icon}</div>
      <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-1">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}
