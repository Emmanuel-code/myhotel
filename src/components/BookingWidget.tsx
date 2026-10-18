import { useState } from "react";
import { CalendarIcon, Users, Minus, Plus } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const today = new Date(new Date().setHours(0, 0, 0, 0));

export default function BookingWidget({ floating = false }: { floating?: boolean }) {
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn) {
      toast.error("Please select your arrival date.");
      return;
    }
    if (!checkOut) {
      toast.error("Please select your departure date.");
      return;
    }
    if (checkOut <= checkIn) {
      toast.error("Departure must be after arrival.");
      return;
    }
    const params = new URLSearchParams();
    params.set("in", checkIn.toISOString());
    params.set("out", checkOut.toISOString());
    params.set("guests", String(guests));
    nav(`/booking?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} noValidate className={cn(
      "grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border/70",
      floating ? "glass-dark text-background shadow-gilded" : "bg-card shadow-lift border border-border"
    )}>
      {/* Arrival */}
      <Field label="Arrival" floating={floating}>
        <Popover>
          <PopoverTrigger className="flex items-center gap-3 w-full text-left" aria-label={checkIn ? `Arrival: ${format(checkIn, "d MMM yyyy")}` : "Select arrival date"}>
            <CalendarIcon className="w-4 h-4 opacity-60" aria-hidden="true" />
            <span className="font-display text-lg">
              {checkIn ? format(checkIn, "d MMM") : <span className="text-muted-foreground text-base">Select date</span>}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={(d) => {
                setCheckIn(d);
                // Reset checkout if it's now invalid
                if (d && checkOut && checkOut <= d) setCheckOut(undefined);
              }}
              disabled={(d) => d < today}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </Field>

      {/* Departure */}
      <Field label="Departure" floating={floating}>
        <Popover>
          <PopoverTrigger className="flex items-center gap-3 w-full text-left" aria-label={checkOut ? `Departure: ${format(checkOut, "d MMM yyyy")}` : "Select departure date"}>
            <CalendarIcon className="w-4 h-4 opacity-60" aria-hidden="true" />
            <span className="font-display text-lg">
              {checkOut ? format(checkOut, "d MMM") : <span className="text-muted-foreground text-base">Select date</span>}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={setCheckOut}
              disabled={(d) => d <= (checkIn ?? today) || d < today}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </Field>

      {/* Guests */}
      <Field label="Guests" floating={floating}>
        <div className="flex items-center gap-4">
          <Users className="w-4 h-4 opacity-60" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setGuests(Math.max(1, guests - 1))}
            aria-label="Remove one guest"
            className="opacity-60 hover:opacity-100 w-7 h-7 flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <span className="font-display text-lg w-6 text-center" aria-live="polite" aria-atomic="true">
            {guests}
          </span>
          <button
            type="button"
            onClick={() => setGuests(Math.min(8, guests + 1))}
            aria-label="Add one guest"
            className="opacity-60 hover:opacity-100 w-7 h-7 flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </Field>

      <button
        type="submit"
        className={cn(
          "px-10 py-6 text-xs uppercase tracking-[0.28em] font-medium transition-colors",
          floating ? "bg-primary text-primary-foreground hover:bg-primary-glow" : "bg-foreground text-background hover:bg-primary hover:text-primary-foreground"
        )}
      >
        Check Availability
      </button>
    </form>
  );
}

function Field({ label, children, floating }: { label: string; children: React.ReactNode; floating?: boolean }) {
  return (
    <div className={cn("px-7 py-5", floating ? "bg-foreground/40" : "bg-card")}>
      <div className={cn("text-[10px] uppercase tracking-[0.32em] mb-2", floating ? "text-background/60" : "text-muted-foreground")}>{label}</div>
      {children}
    </div>
  );
}
