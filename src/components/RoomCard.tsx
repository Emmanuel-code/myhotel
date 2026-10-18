import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Heart } from "lucide-react";
import type { Room } from "@/data/hotel";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function RoomCard({ room, index = 0 }: { room: Room; index?: number }) {
  const { user } = useAuth();
  const [favId, setFavId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setFavId(null); return; }
    supabase.from("favorites").select("id").eq("user_id", user.id).eq("room_id", room.id).maybeSingle()
      .then(({ data }) => setFavId(data?.id ?? null));
  }, [user, room.id]);

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { toast.error("Sign in to save residences."); return; }
    if (favId) {
      await supabase.from("favorites").delete().eq("id", favId);
      setFavId(null);
      toast.success("Removed from favorites.");
    } else {
      const { data, error } = await supabase.from("favorites").insert({ user_id: user.id, room_id: room.id }).select("id").maybeSingle();
      if (error) { toast.error(error.message); return; }
      setFavId(data!.id);
      toast.success("Saved to favorites.");
    }
  };

  return (
    <Link
      to={`/rooms/${room.id}`}
      className="group block animate-rise relative"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="relative overflow-hidden aspect-[4/5] bg-muted">
        <img
          src={room.image}
          alt={room.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[1400ms] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/0 to-foreground/10 opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
        <div className="absolute top-5 left-5 text-[10px] uppercase tracking-[0.32em] text-background/95 glass-dark px-3 py-1.5">
          {room.view} View · {room.size} m²
        </div>
        <button
          onClick={toggleFav}
          aria-label="Favorite"
          className={cn(
            "absolute top-5 right-5 w-10 h-10 flex items-center justify-center glass-dark transition-all hover:scale-110",
            favId && "text-primary"
          )}
        >
          <Heart className={cn("w-4 h-4", favId && "fill-current")} />
        </button>
        <div className="absolute bottom-5 left-5 right-5 text-background">
          <div className="text-[10px] uppercase tracking-[0.32em] opacity-80 mb-1">{room.category}</div>
          <div className="font-display text-3xl">{room.name}</div>
        </div>
      </div>

      <div className="pt-6 flex items-start justify-between gap-6">
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{room.shortDescription}</p>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">From</div>
          <div className="font-display text-2xl">₵{room.price.toLocaleString()}</div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">per night</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-primary group-hover:gap-3 transition-all">
        Discover <ArrowUpRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}
