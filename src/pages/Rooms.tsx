import React, { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import SectionHeading from "@/components/SectionHeading";
import { rooms } from "@/data/hotel";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

const categories = ["All", "Suite", "Villa", "Penthouse", "Deluxe"] as const;
const views = ["All", "Ocean", "Garden", "City"] as const;

export default function Rooms() {
  const [cat, setCat] = useState<typeof categories[number]>("All");
  const [view, setView] = useState<typeof views[number]>("All");
  const [sort, setSort] = useState<"price-asc" | "price-desc" | "size">("price-asc");

  const filtered = useMemo(() => {
    let r = [...rooms];
    if (cat !== "All") r = r.filter((x) => x.category === cat);
    if (view !== "All") r = r.filter((x) => x.view === view);
    if (sort === "price-asc") r.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") r.sort((a, b) => b.price - a.price);
    if (sort === "size") r.sort((a, b) => b.size - a.size);
    return r;
  }, [cat, view, sort]);

  const resetFilters = () => {
    setCat("All");
    setView("All");
    setSort("price-asc");
  };

  const isFiltered = cat !== "All" || view !== "All";

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />

      <section className="container-prose pt-40 pb-12">
        <SectionHeading
          eyebrow="Accommodations"
          title="Suites, Villas & Penthouses"
          copy="Forty-two residences in the historic main villa and the gardens beyond. Each restored room-by-room across seven years."
        />
      </section>

      {/* Filters */}
      <section className="container-prose pb-12">
        <div className="flex flex-wrap items-center gap-8 border-y border-border py-6">
          <Group label="Type">
            {categories.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)} ariaLabel={`Filter by ${c} rooms`}>
                {c}
              </Chip>
            ))}
          </Group>
          <Group label="View">
            {views.map((v) => (
              <Chip key={v} active={view === v} onClick={() => setView(v)} ariaLabel={`Filter by ${v} view`}>
                {v}
              </Chip>
            ))}
          </Group>
          <div className="ml-auto flex items-center gap-3">
            <label htmlFor="room-sort-select" className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
              Sort
            </label>
            <select
              id="room-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-transparent border-b border-border text-sm py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:border-primary"
            >
              <option value="price-asc">Price · low to high</option>
              <option value="price-desc">Price · high to low</option>
              <option value="size">Largest first</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="container-prose pb-32">
        {filtered.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-4">
            <p className="text-muted-foreground text-sm">No residences match your selected filters.</p>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-[0.2em] border border-border hover:border-foreground transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {filtered.map((r, i) => (
              <RoomCard key={r.id} room={r} index={i} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground">{label}</span>
      <div className="flex gap-2" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={cn(
        "px-4 py-2 text-xs uppercase tracking-[0.24em] border transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        active
          ? "bg-foreground text-background border-foreground font-medium"
          : "border-border text-foreground hover:border-foreground"
      )}
    >
      {children}
    </button>
  );
}
