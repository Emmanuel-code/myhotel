import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { DEMO_FRONT_DESK_BOOKINGS, DEMO_ROOM_UNITS, mergeWithLocal, saveLocalFallback } from "@/lib/demo";
import { CalendarClock, DoorOpen, DoorClosed, History, MapPin, Mail, Phone, BedDouble } from "lucide-react";

const STATUS = ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

const statusColor: Record<string, string> = {
  confirmed: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  checked_in: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  checked_out: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
  cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  no_show: "bg-amber-500/15 text-amber-200 border-amber-500/30",
};

export default function FrontDesk() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const load = async () => {
    try {
      const [{ data: b }, { data: u }] = await Promise.all([
        supabase.from("bookings").select("*").order("check_in", { ascending: false }),
        supabase.from("room_units").select("*").order("unit_number"),
      ]);

      const combined = mergeWithLocal("SK_local_bookings", b || []);
      setBookings(combined.length > 0 ? combined : DEMO_FRONT_DESK_BOOKINGS);
      setUnits((u && u.length > 0) ? u : DEMO_ROOM_UNITS);
    } catch {
      // Offline fallback
      const localBookings = mergeWithLocal("SK_local_bookings", []);
      setBookings(localBookings.length > 0 ? localBookings : DEMO_FRONT_DESK_BOOKINGS);
      setUnits(DEMO_ROOM_UNITS);
    }
  };
  useEffect(() => { load(); }, []);

  const togglePaymentStatus = async (b: any, newPayStatus: string) => {
    const updated = bookings.map((item) => item.id === b.id ? { ...item, payment_status: newPayStatus } : item);
    setBookings(updated);

    // If in local storage
    const localBookings = JSON.parse(localStorage.getItem("SK_local_bookings") || "[]");
    const updatedLocal = localBookings.map((item: any) => item.id === b.id ? { ...item, payment_status: newPayStatus } : item);
    localStorage.setItem("SK_local_bookings", JSON.stringify(updatedLocal));

    try {
      await supabase.from("bookings").update({ payment_status: newPayStatus } as any).eq("id", b.id);
    } catch { }

    toast.success(`Payment status for ${b.confirmation_number} marked as ${newPayStatus.toUpperCase()}`);
    logHistory(b.id, "payment_status_changed", { payment_status: newPayStatus, method: b.payment_method });
  };

  useEffect(() => {
    const ch = supabase
      .channel("front-desk-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_units" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const logHistory = async (booking_id: string, action: string, details: any = {}) => {
    await supabase.from("booking_history").insert({
      booking_id, actor_id: user?.id, actor_email: user?.email, action, details,
    });
  };

  const openHistory = async (b: any) => {
    setOpen(b);
    const { data } = await supabase.from("booking_history").select("*").eq("booking_id", b.id).order("created_at", { ascending: false });
    setHistory(data ?? []);
  };

  const updateStatus = async (b: any, status: string) => {
    const patch: any = { status };
    if (status === "checked_in" && !b.checked_in_at) patch.checked_in_at = new Date().toISOString();
    if (status === "checked_out" && !b.checked_out_at) patch.checked_out_at = new Date().toISOString();
    const { error } = await supabase.from("bookings").update(patch).eq("id", b.id);
    if (error) return toast.error(error.message);
    await logHistory(b.id, "status_changed", { from: b.status, to: status });
    // free the room on checkout
    if (status === "checked_out" && b.room_unit_id) {
      await supabase.from("room_units").update({ status: "dirty" }).eq("id", b.room_unit_id);
      await supabase.from("housekeeping_tasks").insert({
        room_unit_id: b.room_unit_id, task_type: "turnover", priority: "high",
        notes: `Post-checkout turnover for ${b.confirmation_number}`,
      });
    }
    if (status === "checked_in" && b.room_unit_id) {
      await supabase.from("room_units").update({ status: "occupied" }).eq("id", b.room_unit_id);
    }
    toast.success(`${b.confirmation_number} · ${status.replace("_", " ")}`);
    load();
  };

  const assignRoom = async (b: any, room_unit_id: string) => {
    const unit = units.find((u) => u.id === room_unit_id);
    const { error } = await supabase.from("bookings").update({ room_unit_id }).eq("id", b.id);
    if (error) return toast.error(error.message);
    await logHistory(b.id, "room_assigned", { unit_number: unit?.unit_number, room_name: unit?.room_name });
    toast.success(`Assigned room ${unit?.unit_number}`);
    load();
  };

  const filtered = useMemo(() => bookings.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return [b.confirmation_number, b.guest_first_name, b.guest_last_name, b.guest_email, b.room_name].join(" ").toLowerCase().includes(s);
  }), [bookings, filter, q]);

  const today = new Date().toISOString().slice(0, 10);
  const arrivalsToday = bookings.filter((b) => b.check_in === today && b.status === "confirmed").length;
  const departuresToday = bookings.filter((b) => b.check_out === today && b.status === "checked_in").length;
  const inHouse = bookings.filter((b) => b.status === "checked_in").length;

  return (
    <AdminLayout eyebrow="Reservations" title="Front Desk">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat icon={<DoorOpen className="w-4 h-4" />} label="Arrivals today" value={arrivalsToday} />
        <Stat icon={<BedDouble className="w-4 h-4" />} label="In-house" value={inHouse} />
        <Stat icon={<DoorClosed className="w-4 h-4" />} label="Departures today" value={departuresToday} />
      </div>

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, confirmation…"
          className="max-w-sm bg-white/[0.03] border-white/10 text-neutral-100" />
        <div className="flex gap-2 flex-wrap">
          {["all", ...STATUS].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] border ${filter === s ? "border-amber-200 text-amber-200" : "border-white/10 text-neutral-400 hover:text-neutral-100"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-neutral-500">{filtered.length} reservations</div>
      </div>

      <div className="rounded-sm border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.25em] text-neutral-400">
            <tr>{["Conf #", "Guest", "Room", "Dates", "Room #", "Total", "Payment", "Status", "Actions"].map((h) => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const unit = units.find((u) => u.id === b.room_unit_id);
              const matchingUnits = units.filter((u) => u.room_name === b.room_name);
              const isPaid = b.payment_status === "paid" || b.payment_method === "paystack";
              return (
                <tr key={b.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-amber-200/80">{b.confirmation_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-100">{b.guest_first_name} {b.guest_last_name}</div>
                    <div className="text-xs text-neutral-400">{b.guest_email} · {b.guest_phone || "No phone"}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{b.room_name}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{b.check_in} → {b.check_out}</td>
                  <td className="px-4 py-3">
                    <select value={b.room_unit_id ?? ""} onChange={(e) => assignRoom(b, e.target.value)}
                      className="bg-black/40 border border-white/10 text-xs px-2 py-1 text-neutral-300 min-w-[90px] rounded">
                      <option value="" disabled>— Assign Room —</option>
                      {matchingUnits.map((u) => <option key={u.id} value={u.id}>#{u.unit_number}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 font-medium text-amber-200">₵{b.total?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-400">
                        {b.payment_method === "in_person" ? "Pay in Person" : "Paystack Online"}
                      </div>
                      <button
                        onClick={() => togglePaymentStatus(b, isPaid ? "unpaid" : "paid")}
                        className={cn(
                          "px-2 py-0.5 text-[9px] uppercase tracking-wider rounded border font-medium w-fit",
                          isPaid
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-emerald-500/20 hover:text-emerald-200"
                        )}
                        title="Click to toggle Paid / Unpaid (e.g. after taking cash or POS at front desk)"
                      >
                        {isPaid ? "✓ Paid" : "⚠ Collect ₵" + (b.total?.toLocaleString() ?? "0")}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-wider border rounded ${statusColor[b.status] ?? ""}`}>{b.status?.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {b.status === "confirmed" && (
                        <button onClick={() => updateStatus(b, "checked_in")} disabled={!b.room_unit_id}
                          title={b.room_unit_id ? "Check in" : "Assign a room unit first"}
                          className="px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-30 disabled:cursor-not-allowed rounded">
                          Check-in
                        </button>
                      )}
                      {b.status === "checked_in" && (
                        <button onClick={() => updateStatus(b, "checked_out")}
                          className="px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] border border-sky-400/40 text-sky-300 hover:bg-sky-400/10 rounded">
                          Check-out
                        </button>
                      )}
                      <select onChange={(e) => updateStatus(b, e.target.value)} value=""
                        className="bg-black/40 border border-white/10 text-[10px] px-1 py-1 text-neutral-400 rounded">
                        <option value="" disabled>•••</option>
                        {STATUS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                      <button onClick={() => openHistory(b)} title="Audit History"
                        className="p-1.5 border border-white/10 text-neutral-400 hover:text-amber-200 hover:border-amber-200/40 rounded">
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-neutral-500">No reservations match.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-2xl bg-[#0d0d10] border-white/10 text-neutral-100">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {open?.confirmation_number} <span className="text-neutral-500 text-sm font-sans tracking-wider uppercase ml-3">Change history</span>
            </DialogTitle>
          </DialogHeader>
          {open && (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm border border-white/5 p-4 mb-4">
                <Field icon={<MapPin className="w-3.5 h-3.5" />} label="Room">{open.room_name}</Field>
                <Field icon={<CalendarClock className="w-3.5 h-3.5" />} label="Stay">{open.check_in} → {open.check_out}</Field>
                <Field icon={<Mail className="w-3.5 h-3.5" />} label="Email">{open.guest_email}</Field>
                <Field icon={<Phone className="w-3.5 h-3.5" />} label="Phone">{open.guest_phone || "—"}</Field>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {history.length === 0 && <div className="text-center py-8 text-neutral-500 text-sm">No changes yet.</div>}
                {history.map((h) => (
                  <div key={h.id} className="border border-white/5 p-3 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="uppercase tracking-[0.2em] text-amber-200/80">{h.action.replace("_", " ")}</span>
                      <span className="text-neutral-500">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-neutral-400">{h.actor_email || "system"}</div>
                    {Object.keys(h.details || {}).length > 0 && (
                      <pre className="text-[11px] text-neutral-500 mt-1 whitespace-pre-wrap">{JSON.stringify(h.details, null, 2)}</pre>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-sm border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-400">{icon}{label}</div>
      <div className="font-display text-4xl mt-2 text-amber-200">{value}</div>
    </div>
  );
}
function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-neutral-500">{icon}{label}</div>
      <div className="text-neutral-200 mt-0.5">{children}</div>
    </div>
  );
}
